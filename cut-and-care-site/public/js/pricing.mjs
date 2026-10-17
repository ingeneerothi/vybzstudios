// Calcul des prix — module partagé par le site (affichage) et le serveur (montant facturé).
// Le serveur recalcule toujours le devis : le montant envoyé par le navigateur n'est jamais cru.

export const roundTo = (value, step) => Math.round(value / step) * step;
export const ceilTo = (value, step) => Math.ceil(value / step) * step;

/** 15000 -> "15 000 F" (espaces insécables) */
export function formatFCFA(amount, {suffix = ' F'} = {}) {
  const sign = amount < 0 ? '−' : '';
  const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits}${suffix.replace(' ', ' ')}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export function findService(catalog, id) {
  return catalog.services.find((s) => s.id === id) ?? null;
}

/**
 * Devis d'une réservation.
 * @param {object} catalog  public/data/catalog.json
 * @param {{services: {id: string, option?: string}[], student?: boolean, mode?: 'salon'|'domicile', zone?: string|null}} sel
 */
export function quote(catalog, {services = [], student = false, mode = 'salon', zone = null}) {
  if (!services.length) throw new QuoteError('Choisissez au moins une prestation.');
  const ids = new Set();
  const lines = [];
  let subtotal = 0;
  let discount = 0;
  let durationMin = 0;
  const sd = catalog.studentDiscount;

  for (const sel of services) {
    const s = findService(catalog, sel.id);
    if (!s) throw new QuoteError(`Prestation inconnue : ${sel.id}`);
    if (ids.has(s.id)) throw new QuoteError(`Prestation en double : ${s.name}`);
    ids.add(s.id);
    let option = null;
    if (s.options?.length) {
      option = sel.option ?? null;
      if (!option || !s.options.includes(option)) throw new QuoteError(`Précisez l’option pour ${s.name} : ${s.options.join(' ou ')}.`);
    }
    const label = option ? `${s.name} ${option.toLowerCase()}` : s.name;
    lines.push({kind: 'service', id: s.id, option, label, amount: s.price, durationMin: s.durationMin});
    subtotal += s.price;
    durationMin += s.durationMin;
    if (student && sd.eligible.includes(s.id)) {
      const d = roundTo(s.price * sd.rate, sd.roundTo);
      discount += d;
      lines.push({kind: 'discount', id: `${s.id}-etudiant`, label: `Réduction étudiant ${sd.label}`, amount: -d});
    }
  }

  let travel = 0;
  let travelPending = false;
  let zoneName = null;
  if (mode === 'domicile') {
    if (!catalog.homeService?.enabled) throw new QuoteError('Le service à domicile n’est pas disponible.');
    const z = catalog.homeService.zones.find((x) => x.id === zone);
    if (!z) throw new QuoteError('Choisissez votre quartier.');
    zoneName = z.name;
    if (typeof z.fee === 'number') {
      travel = z.fee;
      lines.push({kind: 'travel', id: 'deplacement', label: `Déplacement · ${z.name}`, amount: z.fee});
    } else {
      travelPending = true;
    }
  } else if (mode !== 'salon') {
    throw new QuoteError('Lieu inconnu.');
  }

  const total = subtotal - discount + travel;
  const deposit = ceilTo(total * catalog.booking.depositRate, catalog.booking.depositRoundTo);
  return {
    currency: catalog.currency,
    lines,
    subtotal,
    discount,
    travel,
    travelPending,
    zoneName,
    total,
    deposit,
    balance: total - deposit,
    depositRate: catalog.booking.depositRate,
    durationMin,
    studentEligible: [...ids].some((id) => sd.eligible.includes(id)),
  };
}

export class QuoteError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuoteError';
  }
}
