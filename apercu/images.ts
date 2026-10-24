/// <reference types="vite/client" />
// Photos des chaussures et de la marque, réduites puis intégrées au fichier (voir assembler.mjs).
const fichiers = import.meta.glob<string>("./cache/images/**/*.webp", {
  eager: true,
  query: "?inline",
  import: "default",
});

const parChemin = new Map(Object.entries(fichiers).map(([cle, url]) => [cle.replace("./cache/images", ""), url]));

/** « /chaussures/x/01.webp » -> photo intégrée ; les photos ajoutées dans l'admin (data:, blob:) passent telles quelles. */
export function image(src: string): string {
  return parChemin.get(src) ?? src;
}
