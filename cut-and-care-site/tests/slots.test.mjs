import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calendarDays, daySlots, isSlotAvailable, parseDate} from '../public/js/slots.mjs';

const catalog = JSON.parse(readFileSync(new URL('../public/data/catalog.json', import.meta.url), 'utf8'));
// samedi 17 octobre 2026, 10 h à Abidjan (UTC+0)
const NOW = new Date(Date.UTC(2026, 9, 17, 10, 0));
const TUESDAY = '2026-10-20';

test('parseDate refuse les dates impossibles', () => {
  assert.ok(parseDate('2026-10-20'));
  assert.equal(parseDate('2026-02-30'), null);
  assert.equal(parseDate('20-10-2026'), null);
  assert.equal(parseDate(undefined), null);
});

test('seuls mardi → vendredi sont réservables', () => {
  const days = calendarDays(catalog, NOW);
  assert.equal(days.length, catalog.booking.horizonDays);
  for (const d of days) assert.equal(d.bookable, [2, 3, 4, 5].includes(d.weekday));
  assert.deepEqual(daySlots(catalog, '2026-10-24', 60, [], NOW), []);
  assert.deepEqual(daySlots(catalog, '2026-10-19', 60, [], NOW), []);
});

test('la prestation doit finir avant la fermeture', () => {
  const slots = daySlots(catalog, TUESDAY, 300, [], NOW);
  assert.equal(slots[0].time, '09:00');
  assert.equal(slots.at(-1).end, catalog.booking.hours['2'][1]);
});

test('capacité : 2 clientes en même temps, pas 3', () => {
  const occupied = [
    {date: TUESDAY, start: '09:00', durationMin: 300},
    {date: TUESDAY, start: '10:00', durationMin: 150},
  ];
  assert.equal(isSlotAvailable(catalog, TUESDAY, '09:00', 60, occupied, NOW), true);
  assert.equal(isSlotAvailable(catalog, TUESDAY, '09:30', 60, occupied, NOW), false);
  assert.equal(isSlotAvailable(catalog, TUESDAY, '12:30', 60, occupied, NOW), true);
  assert.equal(isSlotAvailable(catalog, '2026-10-21', '09:30', 60, occupied, NOW), true);
});

test('délai de prévenance, passé et horizon', () => {
  const tuesdayMorning = new Date(Date.UTC(2026, 9, 20, 9, 0));
  const slots = daySlots(catalog, TUESDAY, 60, [], tuesdayMorning);
  const first = slots.find((s) => s.available);
  assert.equal(first.time, '13:00');
  assert.deepEqual(daySlots(catalog, '2026-10-13', 60, [], NOW), []);
  assert.deepEqual(daySlots(catalog, '2027-06-01', 60, [], NOW), []);
  assert.equal(isSlotAvailable(catalog, TUESDAY, '09:15', 60, [], NOW), false);
});
