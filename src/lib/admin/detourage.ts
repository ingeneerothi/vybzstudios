// Préparation des photos dans le navigateur, gratuite et instantanée :
//  - découpe d'un montage (plusieurs vues sur fond blanc) en vues séparées ;
//  - retrait du fond blanc (remplissage depuis les bords + bords adoucis) ;
//  - pose de chaque vue sur un carré transparent, sur la même « ligne de sol » que le site.
// Limites : fonds blancs unis uniquement ; ombres grises et chaussures blanches peuvent laisser des traces.
// Pour un détourage parfait, utiliser le script Python (scripts/images/decouper_chaussures.py).
import { enBlob } from "../images/compresser";

const TAILLE = 1200;
const LARGEUR_MAX = 0.86;
const HAUTEUR_MAX = 0.7;
const LIGNE_SOL = 0.83;
const SEUIL_FOND = 28;

export interface VuePreparee {
  blob: Blob;
  apercu: string;
}

function contexte(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d", { willReadFrequently: true })!;
}

function nouveauCanvas(l: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(l));
  c.height = Math.max(1, Math.round(h));
  return c;
}

async function charger(fichier: Blob): Promise<HTMLCanvasElement> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Format de photo non pris en charge. Utilisez une photo JPG, PNG ou WebP.");
  }
  const echelle = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = nouveauCanvas(bitmap.width * echelle, bitmap.height * echelle);
  contexte(canvas).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

const ecart = (d: Uint8ClampedArray, i: number) => 255 - Math.min(d[i], d[i + 1], d[i + 2]);

function dejaDetouree(canvas: HTMLCanvasElement): boolean {
  const { width: l, height: h } = canvas;
  const d = contexte(canvas).getImageData(0, 0, l, h).data;
  let transparents = 0;
  let total = 0;
  for (let x = 0; x < l; x += 4) {
    for (const y of [0, h - 1]) {
      total += 1;
      if (d[(y * l + x) * 4 + 3] < 20) transparents += 1;
    }
  }
  return transparents / total > 0.6;
}

/** Repère les vues d'un montage grâce au blanc qui les sépare, dans l'ordre de lecture. */
export function decouperMontage(source: HTMLCanvasElement): HTMLCanvasElement[] {
  const echelle = Math.min(1, 480 / source.width);
  const petit = nouveauCanvas(source.width * echelle, source.height * echelle);
  contexte(petit).drawImage(source, 0, 0, petit.width, petit.height);
  const { width: l, height: h } = petit;
  const d = contexte(petit).getImageData(0, 0, l, h).data;

  // Niveau du fond mesuré sur les bords.
  const bords: number[] = [];
  for (let x = 0; x < l; x++) bords.push(ecart(d, x * 4), ecart(d, ((h - 1) * l + x) * 4));
  for (let y = 0; y < h; y++) bords.push(ecart(d, y * l * 4), ecart(d, (y * l + l - 1) * 4));
  bords.sort((a, b) => a - b);
  const seuil = bords[Math.floor(bords.length * 0.99)] + 4;

  const masque = new Uint8Array(l * h);
  for (let p = 0; p < l * h; p++) masque[p] = ecart(d, p * 4) > seuil ? 1 : 0;

  // On « soude » les morceaux proches (dilatation carrée, en deux passes).
  const r = Math.max(2, Math.round(l * 0.008));
  const tmp = new Uint8Array(l * h);
  const soude = new Uint8Array(l * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      let v = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(l - 1, x + r) && !v; k++) v = masque[y * l + k];
      tmp[y * l + x] = v;
    }
  }
  for (let x = 0; x < l; x++) {
    for (let y = 0; y < h; y++) {
      let v = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r) && !v; k++) v = tmp[k * l + x];
      soude[y * l + x] = v;
    }
  }

  // Composantes connexes.
  const etiquettes = new Int32Array(l * h);
  const pile = new Int32Array(l * h);
  const boites: { x0: number; y0: number; x1: number; y1: number; surface: number }[] = [];
  for (let depart = 0; depart < l * h; depart++) {
    if (!soude[depart] || etiquettes[depart]) continue;
    const numero = boites.length + 1;
    const b = { x0: l, y0: h, x1: 0, y1: 0, surface: 0 };
    let haut = 0;
    pile[haut++] = depart;
    etiquettes[depart] = numero;
    while (haut > 0) {
      const p = pile[--haut];
      const x = p % l;
      const y = (p - x) / l;
      if (masque[p]) {
        b.surface += 1;
        b.x0 = Math.min(b.x0, x);
        b.y0 = Math.min(b.y0, y);
        b.x1 = Math.max(b.x1, x);
        b.y1 = Math.max(b.y1, y);
      }
      for (const q of [p - 1, p + 1, p - l, p + l]) {
        if (q < 0 || q >= l * h || etiquettes[q] || !soude[q]) continue;
        if ((q === p - 1 || q === p + 1) && Math.floor(q / l) !== y) continue;
        etiquettes[q] = numero;
        pile[haut++] = q;
      }
    }
    boites.push(b);
  }

  const vues = boites.filter((b) => b.surface >= 0.004 * l * h && b.x1 > b.x0);
  vues.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  const rangees: (typeof vues)[] = [];
  for (const v of vues) {
    const rangee = rangees.find((rg) => {
      const ry0 = Math.min(...rg.map((x) => x.y0));
      const ry1 = Math.max(...rg.map((x) => x.y1));
      return Math.min(v.y1, ry1) - Math.max(v.y0, ry0) > 0.4 * Math.min(v.y1 - v.y0, ry1 - ry0);
    });
    if (rangee) rangee.push(v);
    else rangees.push([v]);
  }
  const ordonnees = rangees.flatMap((rg) => rg.sort((a, b) => a.x0 - b.x0));

  return ordonnees.map((b) => {
    const x0 = b.x0 / echelle;
    const y0 = b.y0 / echelle;
    const x1 = (b.x1 + 1) / echelle;
    const y1 = (b.y1 + 1) / echelle;
    const marge = 0.06 * Math.max(x1 - x0, y1 - y0);
    const cx0 = Math.max(0, x0 - marge);
    const cy0 = Math.max(0, y0 - marge);
    const cx1 = Math.min(source.width, x1 + marge);
    const cy1 = Math.min(source.height, y1 + marge);
    const vue = nouveauCanvas(cx1 - cx0, cy1 - cy0);
    const ctx = contexte(vue);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, vue.width, vue.height);
    ctx.drawImage(source, cx0, cy0, cx1 - cx0, cy1 - cy0, 0, 0, vue.width, vue.height);
    return vue;
  });
}

/** Retire le fond blanc relié aux bords de la photo, puis adoucit et nettoie le contour. */
export function retirerFondBlanc(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const { width: l, height: h } = canvas;
  const ctx = contexte(canvas);
  const image = ctx.getImageData(0, 0, l, h);
  const d = image.data;
  const fond = new Uint8Array(l * h);
  const pile = new Int32Array(l * h);
  let haut = 0;
  const pousser = (p: number) => {
    if (!fond[p] && ecart(d, p * 4) <= SEUIL_FOND) {
      fond[p] = 1;
      pile[haut++] = p;
    }
  };
  for (let x = 0; x < l; x++) {
    pousser(x);
    pousser((h - 1) * l + x);
  }
  for (let y = 0; y < h; y++) {
    pousser(y * l);
    pousser(y * l + l - 1);
  }
  while (haut > 0) {
    const p = pile[--haut];
    const x = p % l;
    if (x > 0) pousser(p - 1);
    if (x < l - 1) pousser(p + 1);
    if (p >= l) pousser(p - l);
    if (p < l * (h - 1)) pousser(p + l);
  }

  for (let p = 0; p < l * h; p++) {
    const i = p * 4;
    if (fond[p]) {
      d[i + 3] = 0;
      continue;
    }
    const x = p % l;
    const bord =
      (x > 0 && fond[p - 1]) ||
      (x < l - 1 && fond[p + 1]) ||
      (p >= l && fond[p - l]) ||
      (p < l * (h - 1) && fond[p + l]);
    if (!bord) continue;
    // Pixel de contour : transparence partielle et couleur « démélangée » du blanc.
    const a = Math.min(1, Math.max(0.15, ecart(d, i) / (SEUIL_FOND * 2.5)));
    for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, (d[i + c] - (1 - a) * 255) / a));
    d[i + 3] = Math.round(a * 255);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Recadre au plus juste et pose la vue sur un carré transparent, sur la ligne de sol. */
export function poserSurCarre(vue: HTMLCanvasElement): HTMLCanvasElement {
  const { width: l, height: h } = vue;
  const d = contexte(vue).getImageData(0, 0, l, h).data;
  let x0 = l;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      if (d[(y * l + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error("La photo semble vide après le détourage.");
  const lv = x1 - x0 + 1;
  const hv = y1 - y0 + 1;
  const echelle = Math.min((TAILLE * LARGEUR_MAX) / lv, (TAILLE * HAUTEUR_MAX) / hv, 2);
  const carre = nouveauCanvas(TAILLE, TAILLE);
  const ctx = contexte(carre);
  ctx.imageSmoothingQuality = "high";
  const ld = lv * echelle;
  const hd = hv * echelle;
  ctx.drawImage(vue, x0, y0, lv, hv, (TAILLE - ld) / 2, Math.max(0, TAILLE * LIGNE_SOL - hd), ld, hd);
  return carre;
}

async function exporter(carre: HTMLCanvasElement): Promise<VuePreparee> {
  let blob = await enBlob(carre, "image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await enBlob(carre, "image/png");
  if (!blob) throw new Error("La photo n'a pas pu être préparée.");
  return { blob, apercu: URL.createObjectURL(blob) };
}

/**
 * Prépare les photos choisies par le vendeur.
 * `montage` : chaque fichier contient plusieurs vues à découper. `detourer` : retirer le fond blanc.
 */
export async function preparerPhotos(
  fichiers: File[],
  options: { montage: boolean; detourer: boolean },
  progression?: (fait: number, total: number) => void,
): Promise<VuePreparee[]> {
  const resultats: VuePreparee[] = [];
  for (const [n, fichier] of fichiers.entries()) {
    const image = await charger(fichier);
    const vues = options.montage ? decouperMontage(image) : [image];
    for (const vue of vues) {
      const detouree = options.detourer && !dejaDetouree(vue) ? retirerFondBlanc(vue) : vue;
      resultats.push(await exporter(poserSurCarre(detouree)));
      // Laisse respirer l'écran entre deux vues (téléphones modestes).
      await new Promise((r) => setTimeout(r, 0));
    }
    progression?.(n + 1, fichiers.length);
  }
  return resultats;
}
