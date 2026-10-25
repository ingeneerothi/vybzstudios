import "server-only";
// Une commande passe par le serveur du site : il l'enregistre (Supabase vérifie tout et recalcule le prix), puis
// l'envoie lui-même au vendeur, avec une vraie photo de la chaussure, par l'API WhatsApp Business.
import { createClient } from "@supabase/supabase-js";
import { messageErreur } from "../commande";
import { getCatalogue } from "../donnees/catalogue";
import { MODE_DEMO, SUPABASE_CLE, SUPABASE_URL } from "../env";
import { imagePartage } from "../partage";
import { URL_SITE } from "../site";
import { normaliserTelephone } from "../telephone";
import type { Catalogue, ResultatCommande, SaisieCommande } from "../types";
import { type DonneesMessageCommande, decrireLieu } from "../whatsapp";
import { configWhatsappApi, envoyerAuVendeur } from "./whatsappApi";

const TEXTES = ["slug", "zoneId", "nom", "telephone", "commune", "quartier", "ville", "adresse", "repere"] as const;

/** Le formulaire tel que le navigateur l'envoie ; null s'il manque quelque chose. */
export function lireSaisie(corps: unknown): SaisieCommande | null {
  if (typeof corps !== "object" || corps === null) return null;
  const c = corps as Partial<Record<keyof SaisieCommande, unknown>>;
  if (!TEXTES.every((cle) => typeof c[cle] === "string")) return null;
  if (!Number.isInteger(c.pointure) || !Number.isInteger(c.quantite)) return null;
  return c as SaisieCommande;
}

/** Le message du vendeur : la commande complète, et l'adresse publique de la photo (JPEG, lue par WhatsApp). */
export function donneesVendeur(
  r: ResultatCommande,
  s: SaisieCommande,
  catalogue: Catalogue,
): { donnees: DonneesMessageCommande; photo: string } {
  const zone = catalogue.zones.find((z) => z.id === s.zoneId);
  const chaussure = catalogue.chaussures.find((c) => c.slug === s.slug);
  return {
    donnees: {
      ...r,
      nom: s.nom.trim(),
      telephone: normaliserTelephone(s.telephone) ?? s.telephone,
      lieu: decrireLieu(r.zone, { details: zone?.details ?? "quartier", ...s }),
      adresse: s.adresse.trim(),
      repere: s.repere.trim(),
    },
    // L'image de partage de la chaussure (JPEG 1200×630) ; à défaut, le logo de la boutique.
    photo: new URL(imagePartage(chaussure?.images[0]) ?? "/icones/icone-512.png", URL_SITE).href,
  };
}

/** Envoie la commande et sa photo au numéro qui reçoit ; false si l'API n'est pas réglée ou si l'envoi échoue. */
async function prevenirVendeur(r: ResultatCommande, s: SaisieCommande): Promise<boolean> {
  const config = configWhatsappApi();
  if (!config) return false;
  try {
    const { donnees, photo } = donneesVendeur(r, s, await getCatalogue());
    await envoyerAuVendeur(donnees, photo, r.whatsapp, config);
    return true;
  } catch (erreur) {
    console.error(`Commande ${r.code} : envoi WhatsApp au vendeur impossible.`, erreur);
    return false;
  }
}

export async function passerCommande(
  corps: unknown,
): Promise<{ statut: number; reponse: ResultatCommande | { erreur: string } }> {
  if (MODE_DEMO) return { statut: 503, reponse: { erreur: "La boutique n'est pas encore branchée à sa base." } };
  const s = lireSaisie(corps);
  if (!s) return { statut: 400, reponse: { erreur: "Commande incomplète. Réessayez." } };
  const supabase = createClient(SUPABASE_URL, SUPABASE_CLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("creer_commande", {
    p_slug: s.slug,
    p_pointure: s.pointure,
    p_quantite: s.quantite,
    p_zone_id: s.zoneId,
    p_nom: s.nom,
    p_telephone: s.telephone,
    p_commune: s.commune || null,
    p_quartier: s.quartier || null,
    p_ville: s.ville || null,
    p_adresse: s.adresse,
    p_repere: s.repere || null,
  });
  if (error) return { statut: 400, reponse: { erreur: messageErreur(error) } };
  const r = data as ResultatCommande;
  return { statut: 200, reponse: { ...r, vendeurPrevenu: await prevenirVendeur(r, s) } };
}
