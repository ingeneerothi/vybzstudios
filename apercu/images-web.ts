// Version web de l'aperçu (voir assembler.mjs) : les photos sont publiées à côté de la page et se chargent
// au fur et à mesure, comme sur le vrai site, au lieu d'être intégrées au fichier.
const DOSSIERS = ["/chaussures/", "/marque/"];

/** « /chaussures/x/01.webp » -> « chaussures/x/01.webp », à côté de la page ; data: et blob: passent tels quels. */
export function image(src: string): string {
  return DOSSIERS.some((dossier) => src.startsWith(dossier)) ? src.slice(1) : src;
}
