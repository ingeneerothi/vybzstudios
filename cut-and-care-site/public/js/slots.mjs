// Jours et créneaux réservables — module partagé site / serveur.
// Abidjan est en UTC+0 toute l'année (pas d'heure d'été) : tous les calculs se font en UTC.

const DAY_MS = 86_400_000;
export const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export function parseDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return toDateStr(date) === str ? date : null;
}

const fmtLong = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'});
export const formatDateLong = (str) => fmtLong.format(parseDate(str));

/** Les `horizonDays` prochains jours, avec leur statut réservable. */
export function calendarDays(catalog, now = new Date()) {
  const {bookableWeekdays, horizonDays} = catalog.booking;
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({length: horizonDays}, (_, i) => {
    const d = new Date(start + i * DAY_MS);
    const weekday = d.getUTCDay();
    return {date: toDateStr(d), weekday, day: d.getUTCDate(), month: d.getUTCMonth(), bookable: bookableWeekdays.includes(weekday)};
  });
}

/**
 * Créneaux d'une journée pour une durée donnée.
 * @param occupied réservations qui bloquent : [{date, start: 'HH:MM', durationMin}]
 * Capacité = nombre de clientes prises en charge en même temps.
 */
export function daySlots(catalog, date, durationMin, occupied = [], now = new Date()) {
  const b = catalog.booking;
  const d = parseDate(date);
  if (!d) return [];
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (d.getTime() < today || d.getTime() >= today + b.horizonDays * DAY_MS) return [];
  const hours = b.hours[String(d.getUTCDay())];
  if (!b.bookableWeekdays.includes(d.getUTCDay()) || !hours) return [];
  const open = toMin(hours[0]);
  const close = toMin(hours[1]);
  const earliest = now.getTime() + b.leadTimeHours * 3_600_000;
  const busy = occupied
    .filter((o) => o.date === date)
    .map((o) => ({s: toMin(o.start), e: toMin(o.start) + o.durationMin}));

  const slots = [];
  for (let t = open; t + durationMin <= close; t += b.slotStepMin) {
    let available = d.getTime() + t * 60_000 >= earliest;
    for (let u = t; available && u < t + durationMin; u += b.slotStepMin) {
      if (busy.filter((o) => o.s <= u && u < o.e).length >= b.capacity) available = false;
    }
    slots.push({time: toHHMM(t), end: toHHMM(t + durationMin), available});
  }
  return slots;
}

export function isSlotAvailable(catalog, date, time, durationMin, occupied, now) {
  return daySlots(catalog, date, durationMin, occupied, now).some((s) => s.time === time && s.available);
}
