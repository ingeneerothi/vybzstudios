import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatDuration, formatFCFA, quote, QuoteError} from '../public/js/pricing.mjs';

const catalog = JSON.parse(readFileSync(new URL('../public/data/catalog.json', import.meta.url), 'utf8'));

test('acompte de 30 % arrondi au 5 F supérieur', () => {
  const q = quote(catalog, {services: [{id: 'tresses'}], mode: 'salon'});
  assert.equal(q.total, 15000);
  assert.equal(q.deposit, 4500);
  assert.equal(q.balance, 10500);

  const t = quote(catalog, {services: [{id: 'tissage', option: 'Fermé'}], mode: 'salon'});
  assert.equal(t.total, 7900);
  assert.equal(t.deposit, 2370);
  assert.equal(t.deposit + t.balance, t.total);
});

test('réduction étudiante −33 % sur les tresses uniquement', () => {
  const q = quote(catalog, {services: [{id: 'tresses'}, {id: 'coupe'}], student: true, mode: 'salon'});
  assert.equal(q.discount, 5000);
  assert.equal(q.total, 15000 - 5000 + 12000);
  assert.equal(q.lines.filter((l) => l.kind === 'discount').length, 1);
  const none = quote(catalog, {services: [{id: 'coupe'}], student: true, mode: 'salon'});
  assert.equal(none.discount, 0);
  assert.equal(none.studentEligible, false);
});

test('domicile : quartier obligatoire, frais en attente tant qu’ils ne sont pas fixés', () => {
  assert.throws(() => quote(catalog, {services: [{id: 'nattes'}], mode: 'domicile', zone: 'nulle-part'}), QuoteError);
  const q = quote(catalog, {services: [{id: 'nattes'}], mode: 'domicile', zone: catalog.homeService.zones[0].id});
  assert.equal(q.travelPending, catalog.homeService.zones[0].fee === null);
  assert.equal(q.zoneName, catalog.homeService.zones[0].name);
});

test('options et doublons refusés', () => {
  assert.throws(() => quote(catalog, {services: [{id: 'tissage'}]}), /Ouvert ou Fermé/);
  assert.throws(() => quote(catalog, {services: [{id: 'coupe'}, {id: 'coupe'}]}), /double/);
  assert.throws(() => quote(catalog, {services: [{id: 'inconnu'}]}), /inconnue/);
  assert.throws(() => quote(catalog, {services: []}), QuoteError);
});

test('durées cumulées et formats', () => {
  const q = quote(catalog, {services: [{id: 'tissage', option: 'Ouvert'}, {id: 'maintenance'}]});
  assert.equal(q.durationMin, 165);
  assert.equal(formatDuration(165), '2 h 45');
  assert.equal(formatDuration(45), '45 min');
  assert.equal(formatDuration(300), '5 h');
  assert.equal(formatFCFA(55000).replace(/\s/g, ' '), '55 000 F');
  assert.equal(formatFCFA(-5000, {suffix: ''}).replace(/\s/g, ' '), '−5 000');
});
