// Serveur Cut & Care Styling : site statique + API de réservation + paiements Wave / Orange Money.
// Zéro dépendance (Node >= 20). Démarrage : `npm start` (lit .env si présent).
import {createReadStream, readFileSync, statSync} from 'node:fs';
import http from 'node:http';
import {randomInt, randomUUID} from 'node:crypto';
import {dirname, extname, join, normalize, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnv} from './env.mjs';
import {Store} from './store.mjs';
import {validateBooking} from './validate.mjs';
import {renderAdmin, renderDemoPay} from './pages.mjs';
import * as wave from './payments/wave.mjs';
import * as orange from './payments/orange.mjs';
import {QuoteError, quote} from '../public/js/pricing.mjs';
import {daySlots, isSlotAvailable, parseDate} from '../public/js/slots.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
loadEnv(join(ROOT, '.env'));
const env = process.env;
const PORT = Number(env.PORT || 3000);
const PUBLIC_URL = (env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const catalog = JSON.parse(readFileSync(join(PUBLIC, 'data/catalog.json'), 'utf8'));
const store = new Store(env.BOOKINGS_FILE || join(ROOT, 'server/data/bookings.json'));

const providers = {wave: wave.isEnabled(env), orange: orange.isEnabled(env)};
const manual = Boolean(catalog.payments.manual.wave || catalog.payments.manual.orange);
const DEMO = env.DEMO_PAYMENTS === 'true' || (env.DEMO_PAYMENTS !== 'false' && !providers.wave && !providers.orange && !manual);

// ——— utilitaires HTTP ———
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function send(res, status, body, headers = {}) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : body);
}

function readBody(req, limit = 16_384) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        // on cesse de lire sans couper la connexion, pour pouvoir répondre 413
        req.removeAllListeners('data');
        req.resume();
        reject(Object.assign(new Error('Requête trop volumineuse'), {status: 413}));
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const json = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Derrière un hébergeur (Render, Railway, Nginx…), TRUST_PROXY = nombre de proxies devant Node :
// on lit alors l'adresse ajoutée par le dernier proxy de confiance, pas celle déclarée par le client.
function clientIp(req) {
  const hops = Number(env.TRUST_PROXY || 0);
  const chain = String(req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return hops > 0 && chain.length ? chain[Math.max(0, chain.length - hops)] : req.socket.remoteAddress;
}

const hits = new Map();
function rateLimited(ip, max = 12, windowMs = 600_000) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}

// ——— réservations ———
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRef() {
  for (;;) {
    const ref = `CC-${Array.from({length: 5}, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;
    if (!store.find((b) => b.ref === ref)) return ref;
  }
}

/** Libère les créneaux des paiements abandonnés, puis renvoie les réservations qui bloquent. */
function occupied() {
  const limit = Date.now() - catalog.booking.pendingHoldMin * 60_000;
  let changed = false;
  for (const b of store.all()) {
    if (b.status === 'pending_payment' && Date.parse(b.createdAt) < limit) {
      b.status = 'expired';
      changed = true;
    }
  }
  if (changed) store.flush();
  return store
    .all()
    .filter((b) => b.status === 'pending_payment' || b.status === 'paid')
    .map((b) => ({date: b.date, start: b.time, durationMin: b.quote.durationMin}));
}

const publicView = (b) => ({
  id: b.id,
  ref: b.ref,
  status: b.status,
  date: b.date,
  time: b.time,
  mode: b.mode,
  method: b.method,
  services: b.quote.lines.filter((l) => l.kind === 'service').map((l) => l.label),
  quote: {total: b.quote.total, deposit: b.quote.deposit, balance: b.quote.balance, travelPending: b.quote.travelPending, durationMin: b.quote.durationMin},
  firstName: b.client.name.split(/\s+/)[0],
  demo: b.payment?.mode === 'demo',
});

async function settle(b, result) {
  if (b.status !== 'pending_payment') return b;
  if (result.status === 'paid') {
    if (result.amount !== undefined && Number(result.amount) !== b.quote.deposit) {
      console.warn(`[paiement] montant inattendu pour ${b.ref} : ${result.amount} au lieu de ${b.quote.deposit}`);
      return store.update(b.id, {status: 'payment_failed', paymentError: 'montant incorrect'});
    }
    console.log(`[paiement] acompte reçu ${b.ref} (${b.method}) ${b.quote.deposit} F`);
    return store.update(b.id, {status: 'paid', paidAt: new Date().toISOString(), payment: {...b.payment, txnId: result.txnId ?? null}});
  }
  if (result.status === 'failed') return store.update(b.id, {status: 'payment_failed'});
  return b;
}

const returnUrl = (id) => `${PUBLIC_URL}/?reservation=${encodeURIComponent(id)}#reserver`;

async function createBooking(req, res) {
  const body = json(await readBody(req));
  const {ok, errors, value} = validateBooking(body, catalog);
  if (!ok) return send(res, 422, {error: 'Formulaire incomplet.', fields: errors});
  // seules les demandes complètes comptent : une faute de frappe ne bloque personne
  if (rateLimited(clientIp(req))) return send(res, 429, {error: 'Trop de tentatives. Réessayez dans quelques minutes.'});

  let q;
  try {
    q = quote(catalog, value);
  } catch (e) {
    if (e instanceof QuoteError) return send(res, 422, {error: e.message});
    throw e;
  }
  const now = new Date();
  if (!isSlotAvailable(catalog, value.date, value.time, q.durationMin, [], now)) {
    return send(res, 422, {error: 'Cet horaire ne fait pas partie des créneaux proposés. Choisissez-en un dans le calendrier.'});
  }
  if (!isSlotAvailable(catalog, value.date, value.time, q.durationMin, occupied(), now)) {
    return send(res, 409, {error: 'Ce créneau vient d’être réservé. Choisissez un autre horaire.'});
  }

  const id = randomUUID();
  const ref = newRef();
  const booking = await store.create({id, ref, createdAt: new Date().toISOString(), status: 'pending_payment', ...value, quote: q, payment: {provider: value.method}});
  let redirectUrl = null;
  const payment = {provider: value.method};
  try {
    if (value.method === 'wave' && providers.wave) {
      const s = await wave.createCheckout(env, {amount: q.deposit, reference: id, successUrl: returnUrl(id), errorUrl: returnUrl(id)});
      Object.assign(payment, {mode: 'live', sessionId: s.sessionId});
      redirectUrl = s.redirectUrl;
    } else if (value.method === 'orange' && providers.orange) {
      const p = await orange.createPayment(env, {amount: q.deposit, orderId: ref, returnUrl: returnUrl(id), cancelUrl: returnUrl(id), notifUrl: `${PUBLIC_URL}/api/webhooks/orange`});
      Object.assign(payment, {mode: 'live', orderId: ref, payToken: p.payToken, notifToken: p.notifToken});
      redirectUrl = p.redirectUrl;
    } else if (catalog.payments.manual[value.method]) {
      Object.assign(payment, {mode: 'manual', number: catalog.payments.manual[value.method]});
    } else if (DEMO) {
      Object.assign(payment, {mode: 'demo'});
      redirectUrl = `/demo-pay?b=${encodeURIComponent(id)}`;
    } else {
      await store.update(id, {status: 'payment_failed', paymentError: 'moyen indisponible'});
      return send(res, 503, {error: 'Ce moyen de paiement n’est pas encore activé. Contactez le salon sur WhatsApp.'});
    }
  } catch (e) {
    console.error('[paiement]', e.message);
    await store.update(id, {status: 'payment_failed', paymentError: e.message});
    return send(res, 502, {error: 'Le service de paiement ne répond pas. Réessayez ou contactez le salon sur WhatsApp.'});
  }
  await store.update(id, {payment});
  return send(res, 201, {...publicView(booking), redirectUrl, manual: payment.mode === 'manual' ? {method: value.method, number: payment.number} : null});
}

async function refreshBooking(b) {
  if (b.status !== 'pending_payment' || b.payment?.mode !== 'live') return b;
  try {
    if (b.method === 'wave' && b.payment.sessionId) return settle(b, await wave.getCheckout(env, b.payment.sessionId));
    if (b.method === 'orange' && b.payment.payToken) {
      return settle(b, await orange.getStatus(env, {orderId: b.payment.orderId, amount: b.quote.deposit, payToken: b.payment.payToken}));
    }
  } catch (e) {
    console.error('[paiement] vérification', b.ref, e.message);
  }
  return b;
}

// ——— fichiers statiques ———
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return send(res, 400, '<h1>Adresse invalide</h1>');
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + sep)) return send(res, 403, 'Interdit');
  let st;
  try {
    st = statSync(file);
  } catch {
    return send(res, 404, '<h1>Page introuvable</h1>');
  }
  if (!st.isFile()) return send(res, 404, '<h1>Page introuvable</h1>');
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  if (extname(file) === '.html') {
    // les aperçus de lien (WhatsApp, Facebook) exigent des adresses absolues : on injecte PUBLIC_URL
    const html = readFileSync(file, 'utf8').replaceAll('%PUBLIC_URL%', PUBLIC_URL);
    return send(res, 200, req.method === 'HEAD' ? '' : html, {'Cache-Control': 'no-cache'});
  }
  const longCache = /^\/(vendor|fonts|img|video)\//.test(pathname);
  const headers = {...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': longCache ? 'public, max-age=604800' : 'no-cache', 'Accept-Ranges': 'bytes'};
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
    if (start > end || start >= st.size) return send(res, 416, '', {'Content-Range': `bytes */${st.size}`});
    res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1});
    return createReadStream(file, {start, end}).pipe(res);
  }
  res.writeHead(200, {...headers, 'Content-Length': st.size});
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

// ——— routes ———
async function route(req, res) {
  const url = new URL(req.url, PUBLIC_URL);
  const p = url.pathname;
  const m = p.match(/^\/api\/bookings\/([0-9a-f-]{36})(\/refresh)?$/);

  if (p === '/api/health' && req.method === 'GET') {
    return send(res, 200, {
      ok: true,
      payments: {
        wave: providers.wave ? 'live' : catalog.payments.manual.wave ? 'manual' : DEMO ? 'demo' : 'off',
        orange: providers.orange ? (env.ORANGE_ENV === 'live' ? 'live' : 'sandbox') : catalog.payments.manual.orange ? 'manual' : DEMO ? 'demo' : 'off',
      },
    });
  }
  if (p === '/api/availability' && req.method === 'GET') {
    const date = url.searchParams.get('date');
    const duration = Number(url.searchParams.get('duration'));
    if (!parseDate(date) || !(duration > 0 && duration <= 720)) return send(res, 400, {error: 'Paramètres invalides.'});
    return send(res, 200, {date, slots: daySlots(catalog, date, duration, occupied(), new Date())});
  }
  if (p === '/api/bookings' && req.method === 'POST') return createBooking(req, res);
  if (m && req.method === 'GET' && !m[2]) {
    const b = store.get(m[1]);
    return b ? send(res, 200, publicView(b)) : send(res, 404, {error: 'Réservation introuvable.'});
  }
  if (m && req.method === 'POST' && m[2]) {
    const b = store.get(m[1]);
    return b ? send(res, 200, publicView(await refreshBooking(b))) : send(res, 404, {error: 'Réservation introuvable.'});
  }
  if (p === '/api/webhooks/wave' && req.method === 'POST') {
    const raw = await readBody(req, 65_536);
    if (!wave.verifyWebhook(env, raw, req.headers['wave-signature'])) return send(res, 401, {error: 'signature'});
    const s = wave.parseWebhook(json(raw));
    const b = s && store.get(s.reference);
    if (b) await settle(b, s);
    return send(res, 200, {ok: true});
  }
  if (p === '/api/webhooks/orange' && req.method === 'POST') {
    const n = orange.parseNotification(json(await readBody(req, 65_536)));
    const b = n && store.find((x) => x.payment?.notifToken === n.notifToken);
    if (b) {
      // la notification déclenche une relecture du statut auprès d'Orange (on ne la croit pas sur parole)
      await refreshBooking(b);
    }
    return send(res, 200, {ok: true});
  }
  if (p === '/demo-pay') {
    if (!DEMO) return send(res, 404, '<h1>Page introuvable</h1>');
    if (req.method === 'GET') {
      const b = store.get(url.searchParams.get('b'));
      return b && b.payment?.mode === 'demo' ? send(res, 200, renderDemoPay(b)) : send(res, 404, '<h1>Réservation introuvable</h1>');
    }
    if (req.method === 'POST') {
      const form = new URLSearchParams(await readBody(req));
      const b = store.get(form.get('id'));
      if (!b || b.payment?.mode !== 'demo') return send(res, 404, '<h1>Réservation introuvable</h1>');
      await settle(b, {status: form.get('outcome') === 'paid' ? 'paid' : 'failed', amount: b.quote.deposit, txnId: 'DEMO'});
      return send(res, 303, '', {Location: `/?reservation=${encodeURIComponent(b.id)}#reserver`});
    }
  }
  if (p === '/admin' || p.startsWith('/admin/')) {
    const token = url.searchParams.get('token');
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return send(res, 401, '<h1>Accès réservé au salon</h1>');
    const am = p.match(/^\/admin\/bookings\/([0-9a-f-]{36})$/);
    if (am && req.method === 'POST') {
      const status = new URLSearchParams(await readBody(req)).get('status');
      if (['paid', 'cancelled'].includes(status)) await store.update(am[1], {status, ...(status === 'paid' ? {paidAt: new Date().toISOString()} : {})});
      return send(res, 303, '', {Location: `/admin?token=${encodeURIComponent(token)}`});
    }
    occupied();
    return send(res, 200, renderAdmin(store.all(), token, {demo: DEMO}));
  }
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, p);
  return send(res, 405, {error: 'Méthode non autorisée.'});
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    console.error(e);
    if (!res.headersSent) send(res, e.status ?? 500, {error: e.status === 413 ? e.message : 'Erreur interne.'});
  });
});

server.listen(PORT, () => {
  const mode = (k) => (providers[k] ? 'actif' : catalog.payments.manual[k] ? 'manuel' : DEMO ? 'démo' : 'désactivé');
  console.log(`Cut & Care Styling — ${PUBLIC_URL} (port ${PORT}) · Wave : ${mode('wave')} · Orange Money : ${mode('orange')}`);
});

export {server};
