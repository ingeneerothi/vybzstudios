import { formatPrixTexte } from "./format";
import { formaterTelephone } from "./telephone";
import type { DetailsZone, ResultatCommande } from "./types";

export function lienWhatsapp(numero: string, message?: string): string {
  const base = `https://wa.me/${numero}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Partage d'un message sans destinataire : WhatsApp demande à qui l'envoyer (ex. le livreur). */
export function lienPartage(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export interface Livraison {
  details: DetailsZone;
  commune?: string;
  quartier?: string;
  ville?: string;
}

/** « Cocody, Riviera 2 » / « Grand-Bassam, Mockeyville » / « Bouaké (expédition) ». */
export function decrireLieu(zone: string, l: Livraison): string {
  if (l.details === "commune_quartier") return [l.commune, l.quartier].filter(Boolean).join(", ");
  if (l.details === "ville") return `${l.ville} (expédition)`;
  return [zone, l.quartier].filter(Boolean).join(", ");
}

export interface DonneesMessageCommande extends ResultatCommande {
  nom: string;
  telephone: string;
  lieu: string;
  adresse: string;
  repere: string;
}

const TITRE_COMMANDE = "🛒 NOUVELLE COMMANDE VERTICAL STORE —";
const LIGNES_COMMANDE = [
  "👟 Chaussure",
  "📏 Pointure",
  "🔢 Quantité",
  "💰 Prix",
  "🚚 Livraison",
  "✅ TOTAL",
  "👤 Nom",
  "📞 Numéro",
  "📍 Lieu",
  "🏠 Adresse",
  "🧭 Repère",
  "💳 Paiement",
];

/** Les valeurs de la commande : le code, puis une valeur par ligne du message (de « Chaussure » à « Paiement »). */
export function valeursCommande(c: DonneesMessageCommande): string[] {
  const prix =
    c.quantite > 1
      ? `${formatPrixTexte(c.prixUnitaire)} × ${c.quantite} = ${formatPrixTexte(c.prixUnitaire * c.quantite)}`
      : formatPrixTexte(c.prixUnitaire);
  return [
    c.code,
    c.chaussure,
    String(c.pointure),
    String(c.quantite),
    prix,
    `${c.zone} (${formatPrixTexte(c.fraisLivraison)})`,
    formatPrixTexte(c.total),
    c.nom,
    formaterTelephone(c.telephone),
    c.lieu,
    c.adresse,
    c.repere || "—",
    c.modePaiement,
  ];
}

function lignesCommande([code, ...valeurs]: string[]): string[] {
  return [`${TITRE_COMMANDE} ${code}`, ...LIGNES_COMMANDE.map((etiquette, i) => `${etiquette} : ${valeurs[i]}`)];
}

export function messageCommande(c: DonneesMessageCommande): string {
  return [...(c.intro ? [c.intro, ""] : []), ...lignesCommande(valeursCommande(c))].join("\n");
}

/** Dernière ligne du message que le site envoie lui-même au vendeur (un modèle WhatsApp ne finit pas par une valeur). */
export const FIN_MESSAGE_VENDEUR = "Commande passée sur le site Vertical Store.";

/** Texte du modèle « nouvelle_commande » à créer chez Meta (MISE-EN-LIGNE.md) : {{1}} à {{13}} pour les valeurs. */
export function modeleMessageVendeur(): string {
  const reperes = LIGNES_COMMANDE.map((_, i) => `{{${i + 2}}}`);
  return [...lignesCommande(["{{1}}", ...reperes]), "", FIN_MESSAGE_VENDEUR].join("\n");
}

/** Ce que le vendeur lit sous la photo, dans le message envoyé par le site : le modèle rempli. */
export function messageVendeur(c: DonneesMessageCommande): string {
  return [...lignesCommande(valeursCommande(c)), "", FIN_MESSAGE_VENDEUR].join("\n");
}

export interface DonneesMessageDemande {
  code: string;
  photoUrl: string | null;
  pointure: string;
  nom: string;
  telephone: string;
  lieu: string;
  commentaire: string;
}

export function messageDemande(d: DonneesMessageDemande): string {
  return [
    `📸 DEMANDE D'ARTICLE NON DISPONIBLE SUR LE SITE — ${d.code}`,
    "Je veux cet article.",
    `🖼️ Photo : ${d.photoUrl ?? "(pas de photo)"}`,
    `📏 Pointure : ${d.pointure || "—"}`,
    `👤 Nom : ${d.nom}`,
    `📞 Numéro : ${formaterTelephone(d.telephone)}`,
    `📍 Lieu : ${d.lieu}`,
    `💬 Commentaire : ${d.commentaire || "—"}`,
  ].join("\n");
}
