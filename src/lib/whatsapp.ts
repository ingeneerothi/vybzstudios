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

export function messageCommande(c: DonneesMessageCommande): string {
  const prix =
    c.quantite > 1
      ? `${formatPrixTexte(c.prixUnitaire)} × ${c.quantite} = ${formatPrixTexte(c.prixUnitaire * c.quantite)}`
      : formatPrixTexte(c.prixUnitaire);
  return [
    `🛒 NOUVELLE COMMANDE VERTICAL STORE — ${c.code}`,
    `👟 Chaussure : ${c.chaussure}`,
    `📏 Pointure : ${c.pointure}`,
    `🔢 Quantité : ${c.quantite}`,
    `💰 Prix : ${prix}`,
    `🚚 Livraison : ${c.zone} (${formatPrixTexte(c.fraisLivraison)})`,
    `✅ TOTAL : ${formatPrixTexte(c.total)}`,
    `👤 Nom : ${c.nom}`,
    `📞 Numéro : ${formaterTelephone(c.telephone)}`,
    `📍 Lieu : ${c.lieu}`,
    `🏠 Adresse : ${c.adresse}`,
    `🧭 Repère : ${c.repere || "—"}`,
    `💳 Paiement : ${c.modePaiement}`,
  ].join("\n");
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
