// Version web de l'aperçu : la page publiée s'affiche dans un cadre qui refuse le menu « Partager » du
// téléphone. Les boutons passent donc par un lien WhatsApp (le texte de la commande, sans la photo).
import type * as Partager from "@/lib/partager";

export const peutPartager: typeof Partager.peutPartager = (fichier): fichier is File => {
  void fichier;
  return false;
};

export const partagerPhoto: typeof Partager.partagerPhoto = async () => false;
