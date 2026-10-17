// Wave Business — Checkout API (https://docs.wave.com/business).
// Session de paiement côté serveur (clé secrète), redirection vers wave_launch_url,
// confirmation par webhook signé ET par relecture de la session (défense en profondeur).
// À valider avec vos accès : Wave n'a pas d'environnement de test, faites un essai réel à petit montant.
import {createHmac, timingSafeEqual} from 'node:crypto';

const API = 'https://api.wave.com/v1';

export const isEnabled = (env) => Boolean(env.WAVE_API_KEY);

export class PaymentError extends Error {}

async function call(env, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {Authorization: `Bearer ${env.WAVE_API_KEY}`, 'Content-Type': 'application/json', ...init.headers},
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PaymentError(`Wave ${res.status} : ${data.message ?? data.code ?? 'erreur'}`);
  return data;
}

/** Crée la session ; montant en F CFA (entier, envoyé en chaîne comme dans la doc Wave). */
export async function createCheckout(env, {amount, reference, successUrl, errorUrl}) {
  const data = await call(env, '/checkout/sessions', {
    method: 'POST',
    headers: {'Idempotency-Key': reference},
    body: JSON.stringify({amount: String(amount), currency: 'XOF', client_reference: reference, success_url: successUrl, error_url: errorUrl}),
  });
  return {sessionId: data.id, redirectUrl: data.wave_launch_url};
}

const normalize = (s) => ({
  status: s.payment_status === 'succeeded' ? 'paid' : s.checkout_status === 'expired' || s.payment_status === 'cancelled' ? 'failed' : 'pending',
  amount: Number(s.amount),
  currency: s.currency,
  reference: s.client_reference,
  sessionId: s.id,
  txnId: s.transaction_id ?? null,
});

export async function getCheckout(env, sessionId) {
  return normalize(await call(env, `/checkout/sessions/${encodeURIComponent(sessionId)}`));
}

/**
 * En-tête « Wave-Signature: t=<horodatage>,v1=<hmac>[,v1=...] », HMAC-SHA256 du
 * horodatage concaténé au corps brut, avec le secret du webhook. Fenêtre de 5 min.
 */
export function verifyWebhook(env, rawBody, header) {
  if (!env.WAVE_WEBHOOK_SECRET || !header) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', env.WAVE_WEBHOOK_SECRET).update(t + rawBody).digest('hex'));
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

/** Événement webhook -> session normalisée (checkout.session.completed / payment_failed). */
export function parseWebhook(event) {
  if (!event?.data || !String(event.type ?? '').startsWith('checkout.session.')) return null;
  return normalize(event.data);
}
