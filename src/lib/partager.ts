// Menu « Partager » du téléphone : c'est la seule façon, depuis un site, d'envoyer une vraie photo sur WhatsApp
// (un lien wa.me ne transporte que du texte). La photo part comme une photo, le texte en légende.

/** Le téléphone sait-il partager ce fichier ? (non sur la plupart des ordinateurs) */
export function peutPartager(fichier: File | null): fichier is File {
  return (
    fichier !== null &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [fichier] })
  );
}

/** true si le menu s'est ouvert et que la personne a partagé, false si elle a fermé le menu. */
export async function partagerPhoto(fichier: File, texte: string): Promise<boolean> {
  try {
    await navigator.share({ files: [fichier], text: texte });
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return false;
    throw e;
  }
}
