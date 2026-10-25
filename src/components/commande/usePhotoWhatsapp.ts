"use client";

import { useEffect, useState } from "react";
import { photoWhatsapp } from "@/lib/images/partage";

/** Prépare la photo WhatsApp d'une chaussure dès l'affichage : le partage part ainsi au premier toucher. */
export function usePhotoWhatsapp(source: string | null | undefined, nomFichier: string): File | null {
  const [photo, setPhoto] = useState<{ source: string; fichier: File } | null>(null);
  useEffect(() => {
    if (!source) return;
    let actif = true;
    photoWhatsapp(source, nomFichier)
      .then((fichier) => actif && setPhoto({ source, fichier }))
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [source, nomFichier]);
  return photo && photo.source === source ? photo.fichier : null;
}
