// Photo montrée par WhatsApp sous un lien : une image JPEG 1200×630 « partage.jpg », rangée à côté de la
// photo principale de chaque chaussure (scripts/generer-partage.mjs pour le catalogue, l'admin pour les autres).
export const NOM_PARTAGE = "partage.jpg";
export const TAILLE_PARTAGE = { width: 1200, height: 630 };

/** « /chaussures/x/01.webp » -> « /chaussures/x/partage.jpg » ; null pour une photo sans adresse (mode démo). */
export function imagePartage(photo: string | null | undefined): string | null {
  if (!photo || !(photo.startsWith("/") || /^https?:\/\//.test(photo))) return null;
  return photo.replace(/[^/]+$/, NOM_PARTAGE);
}

/** Adresse publique d'un chemin du site, vue du navigateur. */
export function adresseSite(chemin: string, origine: string): string {
  return /^https?:\/\//.test(chemin) ? chemin : `${origine}${chemin}`;
}
