/** Redimensionne une photo du téléphone (côté max 1280 px) et la compresse avant envoi. */
export async function compresserPhoto(fichier: Blob, cote = 1280, qualite = 0.8): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Format de photo non pris en charge. Choisissez une photo JPG ou PNG.");
  }
  const echelle = Math.min(1, cote / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * echelle);
  canvas.height = Math.round(bitmap.height * echelle);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await enBlob(canvas, "image/webp", qualite);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await enBlob(canvas, "image/jpeg", qualite);
  if (!jpeg) throw new Error("La photo n'a pas pu être préparée.");
  return jpeg;
}

export function enBlob(canvas: HTMLCanvasElement, type: string, qualite?: number): Promise<Blob | null> {
  return new Promise((resoudre) => canvas.toBlob(resoudre, type, qualite));
}
