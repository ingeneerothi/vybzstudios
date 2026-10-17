// Numéros ivoiriens à 10 chiffres (depuis 2021) -> +225XXXXXXXXXX. Partagé site / serveur.
export function normalizePhoneCI(input) {
  let d = String(input ?? '').replace(/[^\d]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('225') && d.length === 13) d = d.slice(3);
  return /^(0\d|2\d)\d{8}$/.test(d) ? `+225${d}` : null;
}

/** +2250717221754 -> 07 17 22 17 54 */
export const displayPhoneCI = (e164) => e164.replace(/^\+225/, '').replace(/(\d{2})(?=\d)/g, '$1 ');
