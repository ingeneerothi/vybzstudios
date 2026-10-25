// Sans serveur, une photo du site (« /chaussures/… ») se lit dans celles intégrées au fichier :
// le code du site peut la charger comme d'habitude (ex. pour fabriquer la photo envoyée sur WhatsApp).
import { image } from "./images";

const fetchNavigateur = window.fetch.bind(window);

window.fetch = (entree, init) => {
  if (typeof entree === "string" && entree.startsWith("/")) {
    const integree = image(entree);
    if (integree !== entree) return fetchNavigateur(integree, init);
  }
  return fetchNavigateur(entree, init);
};

export {};
