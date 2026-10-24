const PREFIXES_CI = /^(01|05|07|21|25|27)\d{8}$/;

function chiffres(saisie: string): string {
  return saisie.replace(/\D/g, "");
}

/**
 * Numéro ivoirien -> 10 chiffres (ex. « 0708091011 »), sinon null.
 * Accepte « 07 08 09 10 11 », « +225 07 08 09 10 11 », « 00225... ». Même règle que la base.
 */
export function normaliserTelephone(saisie: string): string | null {
  let d = chiffres(saisie);
  if (d.length === 15 && d.startsWith("00225")) d = d.slice(5);
  else if (d.length === 13 && d.startsWith("225")) d = d.slice(3);
  return PREFIXES_CI.test(d) ? d : null;
}

/** « 0708091011 » -> « 07 08 09 10 11 ». */
export function formaterTelephone(local: string): string {
  return local.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** Mise en forme pendant la saisie : chiffres groupés par deux, 10 chiffres au plus. */
export function formaterSaisieTelephone(saisie: string): string {
  const garderIndicatif = /^\s*(\+|00)?225/.test(saisie) && chiffres(saisie).length > 10;
  let d = chiffres(saisie);
  if (garderIndicatif) d = d.replace(/^(00)?225/, "");
  d = d.slice(0, 10);
  const groupes = formaterTelephone(d);
  return garderIndicatif ? `+225 ${groupes}` : groupes;
}

/**
 * Numéro de réception WhatsApp (admin) -> format international sans « + ».
 * Un numéro ivoirien à 10 chiffres reçoit l'indicatif 225 ; un numéro saisi avec + ou 00 est gardé tel quel.
 */
export function normaliserNumeroWhatsapp(saisie: string): string | null {
  const brut = saisie.trim();
  const avecIndicatif = brut.startsWith("+") || brut.startsWith("00");
  let d = chiffres(brut);
  if (brut.startsWith("00")) d = d.slice(2);
  if (!avecIndicatif || d.startsWith("225")) {
    const local = normaliserTelephone(d);
    return local ? `225${local}` : null;
  }
  return /^\d{8,15}$/.test(d) ? d : null;
}

/** « 2250506523816 » -> « +225 05 06 52 38 16 ». */
export function afficherNumeroWhatsapp(international: string): string {
  if (international.startsWith("225") && international.length === 13) {
    return `+225 ${formaterTelephone(international.slice(3))}`;
  }
  return `+${international}`;
}

/** Numéro local ivoirien -> lien WhatsApp vers le client (pour l'admin). */
export function numeroInternationalClient(local: string): string {
  return `225${local}`;
}
