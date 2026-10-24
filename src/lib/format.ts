const ESPACE_INSECABLE = " ";

function grouper(montant: number, separateur: string): string {
  return String(Math.round(montant)).replace(/\B(?=(\d{3})+(?!\d))/g, separateur);
}

/** 25000 -> « 25 000 FCFA » (espaces insécables : le prix ne se coupe jamais en deux lignes). */
export function formatPrix(montant: number): string {
  return `${grouper(montant, ESPACE_INSECABLE)}${ESPACE_INSECABLE}FCFA`;
}

/** Même chose avec des espaces normaux, pour les messages WhatsApp. */
export function formatPrixTexte(montant: number): string {
  return `${grouper(montant, " ")} FCFA`;
}

/** Mode de paiement dans une phrase : « À la livraison » -> « à la livraison », « Wave » reste « Wave ». */
export function libellePaiement(mode: string): string {
  const texte = mode.trim();
  return /^(À|A|Au|En|Par|Sur)\s/.test(texte) ? texte.charAt(0).toLowerCase() + texte.slice(1) : texte;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
