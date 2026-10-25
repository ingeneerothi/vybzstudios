#!/usr/bin/env node
// Image d'aperçu « partage.jpg » (1200×630) de chaque chaussure du catalogue : c'est la photo que WhatsApp
// affiche en haut d'une commande (le message contient le lien de la chaussure). À relancer après avoir
// ajouté ou changé des photos dans public/chaussures/. Les chaussures ajoutées depuis l'admin ont la leur.
// Utilisation : npm run partage
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const racine = fileURLToPath(new URL("../", import.meta.url));
const catalogue = JSON.parse(readFileSync(`${racine}data/catalogue.json`, "utf8"));
const LARGEUR = 1200;
const HAUTEUR = 630;
const FOND = { r: 246, g: 245, b: 240 }; // « papier », le fond du site

for (const c of catalogue.chaussures) {
  const photo = `${racine}public${c.images[0]}`;
  const sortie = `${racine}public${c.images[0].replace(/[^/]+$/, "partage.jpg")}`;

  // La chaussure seule (bords transparents retirés), aussi grande que possible dans le bandeau.
  const chaussure = await sharp(photo)
    .trim()
    .resize(1040, 500, { fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width: l, height: h } = chaussure.info;
  const x = Math.round((LARGEUR - l) / 2);
  const y = Math.round((HAUTEUR - h) / 2 - 8);

  // Ombre douce sous la chaussure : sa silhouette, noircie, floutée et très transparente.
  const ombre = await sharp(chaussure.data)
    .ensureAlpha()
    .linear([0, 0, 0, 0.2], [0, 0, 0, 0])
    .blur(16)
    .png()
    .toBuffer();

  await sharp({ create: { width: LARGEUR, height: HAUTEUR, channels: 3, background: FOND } })
    .composite([
      { input: ombre, left: x, top: Math.min(y + 18, HAUTEUR - h) },
      { input: chaussure.data, left: x, top: y },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(sortie);
  console.log(`${c.slug.padEnd(42)} ${sortie.replace(racine, "")}`);
}
