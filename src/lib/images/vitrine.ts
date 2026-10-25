// Chaussure détourée posée sur le fond du site, avec une ombre douce, en JPEG : la photo envoyée sur WhatsApp
// et l'image d'aperçu des liens. Même rendu que scripts/generer-partage.mjs.
const FOND = "#f6f5f0";

/** Plus petit rectangle qui contient les pixels visibles (la photo détourée a des marges transparentes). */
function cadreVisible(image: ImageBitmap): { x: number; y: number; l: number; h: number } {
  const echelle = Math.min(1, 300 / Math.max(image.width, image.height));
  const l = Math.max(1, Math.round(image.width * echelle));
  const h = Math.max(1, Math.round(image.height * echelle));
  const canvas = document.createElement("canvas");
  canvas.width = l;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, l, h);
  const pixels = ctx.getImageData(0, 0, l, h).data;
  let x0 = l;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      if (pixels[(y * l + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, l: image.width, h: image.height };
  return { x: x0 / echelle, y: y0 / echelle, l: (x1 - x0 + 1) / echelle, h: (y1 - y0 + 1) / echelle };
}

export interface FormatVitrine {
  largeur: number;
  hauteur: number;
  /** Marges autour de la chaussure, à gauche/droite et en haut/bas. */
  margeX: number;
  margeY: number;
}

export async function vitrine(source: Blob | string, f: FormatVitrine): Promise<Blob> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const image = await createImageBitmap(blob);
  const cadre = cadreVisible(image);
  const echelle = Math.min((f.largeur - 2 * f.margeX) / cadre.l, (f.hauteur - 2 * f.margeY) / cadre.h);
  const l = cadre.l * echelle;
  const h = cadre.h * echelle;

  const canvas = document.createElement("canvas");
  canvas.width = f.largeur;
  canvas.height = f.hauteur;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = FOND;
  ctx.fillRect(0, 0, f.largeur, f.hauteur);
  ctx.shadowColor = "rgb(0 0 0 / 0.2)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(image, cadre.x, cadre.y, cadre.l, cadre.h, (f.largeur - l) / 2, (f.hauteur - h) / 2 - 8, l, h);
  image.close();
  return new Promise((ok, ko) =>
    canvas.toBlob((jpeg) => (jpeg ? ok(jpeg) : ko(new Error("Image impossible à créer"))), "image/jpeg", 0.88),
  );
}
