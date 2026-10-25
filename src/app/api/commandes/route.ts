import { passerCommande } from "@/lib/serveur/commande";

/** Commande du site : enregistrée, puis envoyée au vendeur avec la photo de la chaussure (lib/serveur/commande.ts). */
export async function POST(requete: Request) {
  const { statut, reponse } = await passerCommande(await requete.json().catch(() => null));
  return Response.json(reponse, { status: statut });
}
