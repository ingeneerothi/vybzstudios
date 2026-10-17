// Accès à l'API de réservation. Sans serveur (site ouvert en statique / aperçu),
// bascule en « démo locale » : créneaux et réservations simulés dans le navigateur.
import {quote} from './pricing.mjs';
import {daySlots} from './slots.mjs';

let server = false;
const LS_KEY = 'cc-demo-bookings';

const local = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
    } catch {
      return [];
    }
  },
  write(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list.slice(-30)));
    } catch {
      /* stockage indisponible : la démo continue sans mémoire */
    }
  },
};

async function call(path, init) {
  const res = await fetch(path, {headers: {'Content-Type': 'application/json'}, cache: 'no-store', ...init});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? 'Erreur réseau.'), {fields: data.fields, status: res.status});
  return data;
}

export async function health() {
  if (!window.__CATALOG__) {
    try {
      const h = await call('api/health');
      server = true;
      return h;
    } catch {
      /* pas de serveur : démo locale */
    }
  }
  server = false;
  return {ok: true, local: true, payments: {wave: 'demo', orange: 'demo'}};
}

export async function availability(catalog, date, durationMin) {
  if (server) return (await call(`api/availability?date=${date}&duration=${durationMin}`)).slots;
  const occupied = local
    .read()
    .filter((b) => b.status === 'paid')
    .map((b) => ({date: b.date, start: b.time, durationMin: b.quote.durationMin}));
  return daySlots(catalog, date, durationMin, occupied, new Date());
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export async function createBooking(catalog, payload) {
  if (server) return call('api/bookings', {method: 'POST', body: JSON.stringify(payload)});
  const q = quote(catalog, payload);
  const n = Date.now();
  const ref = `CC-${Array.from({length: 5}, (_, i) => ALPHABET[(n >> (i * 5)) % ALPHABET.length]).join('')}`;
  const b = {
    id: `demo-${n}`,
    ref,
    status: 'pending_payment',
    date: payload.date,
    time: payload.time,
    mode: payload.mode,
    method: payload.method,
    services: q.lines.filter((l) => l.kind === 'service').map((l) => l.label),
    quote: {total: q.total, deposit: q.deposit, balance: q.balance, travelPending: q.travelPending, durationMin: q.durationMin},
    firstName: payload.client.name.split(/\s+/)[0],
    demo: true,
    local: true,
  };
  local.write([...local.read(), b]);
  return {...b, redirectUrl: null, manual: catalog.payments.manual[payload.method] ? {method: payload.method, number: catalog.payments.manual[payload.method]} : null};
}

export async function getBooking(id, {refresh = false} = {}) {
  if (server && !id.startsWith('demo-')) return call(`api/bookings/${id}${refresh ? '/refresh' : ''}`, {method: refresh ? 'POST' : 'GET'});
  const b = local.read().find((x) => x.id === id);
  if (!b) throw new Error('Réservation introuvable.');
  return b;
}

/** Démo locale uniquement : marque l'acompte comme payé / échoué. */
export function settleLocal(id, status) {
  const list = local.read();
  const b = list.find((x) => x.id === id);
  if (b) b.status = status;
  local.write(list);
  return b;
}

export const isServer = () => server;
