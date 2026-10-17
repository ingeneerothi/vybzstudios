// Orange Money Web Payment (Orange Developer, offre « Orange Money Web Payment / M Payment »).
// Jeton OAuth2 (client credentials) -> /webpayment -> redirection vers payment_url,
// notification sur notif_url (contrôlée par notif_token) + relecture du statut au retour.
// Bac à sable : ORANGE_ENV=dev (devise OUV). Production Côte d'Ivoire : ORANGE_ENV=live, pays « ci », devise XOF.
// À valider avec vos accès Orange Developer (noms de champs et chemins selon votre contrat).

const BASE = 'https://api.orange.com';
let cached = {token: null, exp: 0};

export const isEnabled = (env) => Boolean(env.ORANGE_AUTH_HEADER && env.ORANGE_MERCHANT_KEY);

export class PaymentError extends Error {}

const live = (env) => env.ORANGE_ENV === 'live';
const country = (env) => (live(env) ? env.ORANGE_COUNTRY || 'ci' : 'dev');
const currency = (env) => (live(env) ? 'XOF' : 'OUV');

async function token(env) {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  const res = await fetch(`${BASE}/oauth/v3/token`, {
    method: 'POST',
    headers: {Authorization: env.ORANGE_AUTH_HEADER, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new PaymentError(`Orange OAuth ${res.status}`);
  cached = {token: data.access_token, exp: Date.now() + (Number(data.expires_in ?? 3600) - 60) * 1000};
  return cached.token;
}

async function call(env, path, body) {
  const res = await fetch(`${BASE}/orange-money-webpay/${country(env)}/v1${path}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${await token(env)}`, 'Content-Type': 'application/json', Accept: 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PaymentError(`Orange Money ${res.status} : ${data.message ?? data.description ?? 'erreur'}`);
  return data;
}

export async function createPayment(env, {amount, orderId, returnUrl, cancelUrl, notifUrl}) {
  const data = await call(env, '/webpayment', {
    merchant_key: env.ORANGE_MERCHANT_KEY,
    currency: currency(env),
    order_id: orderId,
    amount,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notif_url: notifUrl,
    lang: 'fr',
    reference: 'Cut & Care Styling',
  });
  if (!data.payment_url) throw new PaymentError('Orange Money : payment_url absent');
  return {payToken: data.pay_token, notifToken: data.notif_token, redirectUrl: data.payment_url};
}

const mapStatus = (s) => (s === 'SUCCESS' ? 'paid' : s === 'FAILED' || s === 'EXPIRED' ? 'failed' : 'pending');

export async function getStatus(env, {orderId, amount, payToken}) {
  const data = await call(env, '/transactionstatus', {order_id: orderId, amount, pay_token: payToken});
  return {status: mapStatus(data.status), txnId: data.txnid ?? null};
}

/** Corps de notification : { status, notif_token, txnid } */
export function parseNotification(body) {
  if (!body?.notif_token) return null;
  return {status: mapStatus(body.status), notifToken: String(body.notif_token), txnId: body.txnid ?? null};
}
