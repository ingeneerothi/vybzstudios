// Images de chaussure pour WhatsApp, faites dans le navigateur.
import { TAILLE_PARTAGE } from "../partage";
import { vitrine } from "./vitrine";

/** Image d'aperçu des liens (1200×630), enregistrée par l'admin pour une chaussure ajoutée. */
export function imageDePartage(source: Blob | string): Promise<Blob> {
  return vitrine(source, { largeur: TAILLE_PARTAGE.width, hauteur: TAILLE_PARTAGE.height, margeX: 80, margeY: 65 });
}

const photos = new Map<string, Promise<File>>();

/**
 * Photo envoyée sur WhatsApp avec une commande (1200×900, JPEG) : une vraie photo, pas un lien.
 * Préparée une seule fois par chaussure.
 */
export function photoWhatsapp(source: string, nomFichier: string): Promise<File> {
  let photo = photos.get(source);
  if (!photo) {
    photo = vitrine(source, { largeur: 1200, hauteur: 900, margeX: 70, margeY: 90 }).then(
      (jpeg) => new File([jpeg], nomFichier, { type: "image/jpeg" }),
    );
    photo.catch(() => photos.delete(source));
    photos.set(source, photo);
  }
  return photo;
}
