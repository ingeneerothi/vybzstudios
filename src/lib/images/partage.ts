// Image d'aperçu WhatsApp (1200×630, JPEG) faite dans le navigateur pour une chaussure ajoutée depuis l'admin :
// même rendu que scripts/generer-partage.mjs (chaussure détourée sur le fond du site, ombre douce).
import { TAILLE_PARTAGE } from "../partage";

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

export async function imageDePartage(source: Blob | string): Promise<Blob> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const image = await createImageBitmap(blob);
  const cadre = cadreVisible(image);
  const { width: L, height: H } = TAILLE_PARTAGE;
  const echelle = Math.min(1040 / cadre.l, 500 / cadre.h);
  const l = cadre.l * echelle;
  const h = cadre.h * echelle;
  const x = (L - l) / 2;
  const y = (H - h) / 2 - 8;

  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = FOND;
  ctx.fillRect(0, 0, L, H);
  ctx.shadowColor = "rgb(0 0 0 / 0.2)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(image, cadre.x, cadre.y, cadre.l, cadre.h, x, y, l, h);
  image.close();
  return new Promise((ok, ko) =>
    canvas.toBlob((jpeg) => (jpeg ? ok(jpeg) : ko(new Error("Image d'aperçu impossible"))), "image/jpeg", 0.86),
  );
}
