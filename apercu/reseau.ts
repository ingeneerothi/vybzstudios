// Sans serveur, une photo du site (« /chaussures/… ») se lit dans celles de l'aperçu (voir images.ts) :
// le code du site peut la charger comme d'habitude (ex. pour fabriquer la photo envoyée sur WhatsApp).
import { image } from "./images";

const fetchNavigateur = window.fetch.bind(window);

/** Photo intégrée au fichier (data:), lue sans passer par le réseau : certaines pages publiées le refusent. */
function lireIntegree(dataUri: string): Response {
  const virgule = dataUri.indexOf(",");
  const type = dataUri.slice(5, virgule).split(";")[0];
  const octets = Uint8Array.from(atob(dataUri.slice(virgule + 1)), (c) => c.charCodeAt(0));
  return new Response(new Blob([octets], { type }), { headers: { "Content-Type": type } });
}

window.fetch = async (entree, init) => {
  if (typeof entree === "string" && entree.startsWith("/")) {
    const photo = image(entree);
    if (photo.startsWith("data:")) return lireIntegree(photo);
    if (photo !== entree) return fetchNavigateur(photo, init);
  }
  return fetchNavigateur(entree, init);
};

export {};
