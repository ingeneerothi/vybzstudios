import "server-only";
// Le site envoie lui-même chaque commande au vendeur par l'API WhatsApp Business (WhatsApp Cloud API, de Meta) :
// une vraie photo de la chaussure, avec la commande en légende. Un lien wa.me, lui, ne transporte que du texte.
// Réglages : WHATSAPP_JETON et WHATSAPP_NUMERO_ID (voir MISE-EN-LIGNE.md). Sans eux, rien n'est envoyé.
import { type DonneesMessageCommande, valeursCommande } from "../whatsapp";

const API = "https://graph.facebook.com/v23.0";

export interface ConfigWhatsappApi {
  jeton: string;
  numeroId: string;
  /** Nom du modèle de message approuvé chez Meta (texte : `modeleMessageVendeur()`). */
  modele: string;
  langue: string;
}

export function configWhatsappApi(env: Record<string, string | undefined> = process.env): ConfigWhatsappApi | null {
  const jeton = env.WHATSAPP_JETON?.trim();
  const numeroId = env.WHATSAPP_NUMERO_ID?.trim();
  if (!jeton || !numeroId) return null;
  return {
    jeton,
    numeroId,
    modele: env.WHATSAPP_MODELE?.trim() || "nouvelle_commande",
    langue: env.WHATSAPP_LANGUE?.trim() || "fr",
  };
}

/** Le message pour l'API : le modèle, la photo en en-tête, puis les 13 valeurs de la commande dans le texte. */
export function messageApi(c: DonneesMessageCommande, photo: string, destinataire: string, config: ConfigWhatsappApi) {
  return {
    messaging_product: "whatsapp",
    to: destinataire,
    type: "template",
    template: {
      name: config.modele,
      language: { code: config.langue },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: photo } }] },
        {
          type: "body",
          // Une valeur de modèle n'accepte ni retour à la ligne, ni tabulation, ni plus de 4 espaces, ni texte vide.
          parameters: valeursCommande(c).map((valeur) => ({
            type: "text",
            text:
              valeur
                .replace(/[\r\n\t]+/g, " ")
                .replace(/ {4,}/g, " ")
                .trim() || "—",
          })),
        },
      ],
    },
  };
}

/** Envoie la commande et sa photo (adresse publique d'un JPEG) au numéro qui reçoit les commandes. */
export async function envoyerAuVendeur(
  c: DonneesMessageCommande,
  photo: string,
  destinataire: string,
  config: ConfigWhatsappApi,
  envoyer: typeof fetch = fetch,
): Promise<void> {
  const reponse = await envoyer(`${API}/${config.numeroId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify(messageApi(c, photo, destinataire, config)),
    signal: AbortSignal.timeout(8000),
  });
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => "");
    throw new Error(`API WhatsApp : ${reponse.status} ${detail.slice(0, 300)}`);
  }
}
