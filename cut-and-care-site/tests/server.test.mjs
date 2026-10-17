import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {normalizePhoneCI, validateBooking} from '../server/validate.mjs';
import {verifyWebhook} from '../server/payments/wave.mjs';
import {displayPhoneCI} from '../public/js/phone.mjs';

const catalog = JSON.parse(readFileSync(new URL('../public/data/catalog.json', import.meta.url), 'utf8'));

test('numéros ivoiriens normalisés en +225', () => {
  assert.equal(normalizePhoneCI('07 17 22 17 54'), '+2250717221754');
  assert.equal(normalizePhoneCI('+225 07 17 22 17 54'), '+2250717221754');
  assert.equal(normalizePhoneCI('00225-0717221754'), '+2250717221754');
  assert.equal(normalizePhoneCI('0717'), null);
  assert.equal(normalizePhoneCI('9917221754'), null);
  assert.equal(displayPhoneCI('+2250717221754'), '07 17 22 17 54');
});

const valid = {
  services: [{id: 'tresses'}],
  mode: 'salon',
  date: '2026-10-20',
  time: '09:00',
  client: {name: 'Awa Koné', phone: '0717221754'},
  method: 'wave',
  consent: true,
};

test('validation : formulaire complet accepté', () => {
  const r = validateBooking(valid, catalog);
  assert.equal(r.ok, true);
  assert.equal(r.value.client.phone, '+2250717221754');
});

test('validation : consentement, moyen de paiement et adresse à domicile exigés', () => {
  assert.ok(validateBooking({...valid, consent: 'yes'}, catalog).errors.consent);
  assert.ok(validateBooking({...valid, method: 'paypal'}, catalog).errors.method);
  assert.ok(validateBooking({...valid, mode: 'domicile', address: ''}, catalog).errors.address);
  assert.equal(validateBooking({...valid, mode: 'domicile', zone: 'angre', address: 'Angré 8e tranche'}, catalog).ok, true);
  assert.equal(validateBooking(null, catalog).ok, false);
});

test('validation : textes tronqués, au plus 4 prestations', () => {
  const r = validateBooking({...valid, services: Array(9).fill({id: 'coupe'}), notes: 'x'.repeat(5000)}, catalog);
  assert.equal(r.value.services.length, 4);
  assert.equal(r.value.notes.length, 500);
});

test('webhook Wave : signature HMAC et fenêtre de 5 minutes', () => {
  const env = {WAVE_WEBHOOK_SECRET: 'wave_sn_WHS_test'};
  const body = JSON.stringify({type: 'checkout.session.completed', data: {id: 'cos-1'}});
  const t = String(Math.floor(Date.now() / 1000));
  const sig = createHmac('sha256', env.WAVE_WEBHOOK_SECRET).update(t + body).digest('hex');
  assert.equal(verifyWebhook(env, body, `t=${t},v1=${sig}`), true);
  assert.equal(verifyWebhook(env, `${body} `, `t=${t},v1=${sig}`), false);
  assert.equal(verifyWebhook(env, body, `t=${t},v1=${'0'.repeat(64)}`), false);
  const old = String(Math.floor(Date.now() / 1000) - 3600);
  const oldSig = createHmac('sha256', env.WAVE_WEBHOOK_SECRET).update(old + body).digest('hex');
  assert.equal(verifyWebhook(env, body, `t=${old},v1=${oldSig}`), false);
  assert.equal(verifyWebhook({}, body, `t=${t},v1=${sig}`), false);
});
