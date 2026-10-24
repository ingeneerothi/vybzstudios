#!/usr/bin/env node
// Construit apercu/sortie/vertical-store-apercu.html : le site client et l'espace vendeur dans un seul
// fichier, qui s'ouvre dans n'importe quel navigateur, sans internet (mode démo, rien n'est envoyé).
//
// Produit aussi vertical-store-visite.mp4 : la visite guidée filmée en taille téléphone.
//
// Utilisation : npm run apercu                  (relance aussi « next build » pour avoir les styles à jour)
//               npm run apercu -- --vite        (garde le build Next existant : plus rapide)
//               npm run apercu -- --sans-video  (n'encode pas la vidéo)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { build } from "vite";
import { filmer } from "./filmer.mjs";

const ici = fileURLToPath(new URL(".", import.meta.url));
const racine = fileURLToPath(new URL("..", import.meta.url));
const cache = join(ici, "cache");
const sortie = join(ici, "sortie", "vertical-store-apercu.html");
const sortieVideo = join(ici, "sortie", "vertical-store-visite.mp4");
const TAILLE_VUE = 720; // px : net sur téléphone, léger pour le fichier

const types = { ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
function dataUri(fichier) {
  const type = types[fichier.slice(fichier.lastIndexOf("."))] ?? "application/octet-stream";
  return `data:${type};base64,${readFileSync(fichier).toString("base64")}`;
}

// 1. Les styles du vrai site, compilés par Next (Tailwind, police, fonds).
if (!process.argv.includes("--vite")) {
  console.log("1/6 next build (styles du site)…");
  execFileSync("npx", ["next", "build"], {
    cwd: racine,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  });
}
const accueil = readFileSync(join(racine, ".next/server/app/index.html"), "utf8");
const classePolice = accueil.match(/<html[^>]*class="([^"]*)"/)?.[1] ?? "antialiased";
const feuilles = [...new Set([...accueil.matchAll(/href="\/_next\/(static\/[^"]+\.css)"/g)].map((m) => m[1]))];
if (feuilles.length === 0) throw new Error("Styles introuvables dans .next : lancez d'abord « npx next build ».");
const css = feuilles
  .map((f) => {
    const dossier = join(racine, ".next", f, "..");
    return readFileSync(join(racine, ".next", f), "utf8").replace(/url\((["']?)([^"')]+)\1\)/g, (tout, _g, chemin) => {
      if (chemin.startsWith("data:")) return tout;
      const fichier = chemin.startsWith("/") ? join(racine, "public", chemin) : join(dossier, chemin);
      return `url("${dataUri(fichier)}")`;
    });
  })
  .join("\n");

// 2. Photos réduites, intégrées ensuite au fichier par Vite (voir images.ts).
console.log("2/6 photos…");
const dossierChaussures = join(racine, "public/chaussures");
const aJour = (source, copie) => {
  try {
    return statSync(copie).mtimeMs >= statSync(source).mtimeMs;
  } catch {
    return false;
  }
};
for (const slug of readdirSync(dossierChaussures)) {
  if (!statSync(join(dossierChaussures, slug)).isDirectory()) continue;
  mkdirSync(join(cache, "images/chaussures", slug), { recursive: true });
  for (const vue of readdirSync(join(dossierChaussures, slug)).filter((f) => f.endsWith(".webp"))) {
    if (aJour(join(dossierChaussures, slug, vue), join(cache, "images/chaussures", slug, vue))) continue;
    await sharp(join(dossierChaussures, slug, vue))
      .resize(TAILLE_VUE, TAILLE_VUE, { fit: "inside" })
      .webp({ quality: 74, effort: 6 })
      .toFile(join(cache, "images/chaussures", slug, vue));
  }
}
mkdirSync(join(cache, "images/marque"), { recursive: true });
for (const f of readdirSync(join(racine, "public/marque")).filter((f) => f.endsWith(".webp"))) {
  writeFileSync(join(cache, "images/marque", f), readFileSync(join(racine, "public/marque", f)));
}

// 3. Les composants du site, assemblés en un seul script.
console.log("3/6 vite build…");
await build({ configFile: join(ici, "vite.config.mts") });

// 4. Un seul fichier : styles, script et photos à l'intérieur.
console.log("4/6 assemblage…");
const dist = join(cache, "dist");
let html = readFileSync(join(dist, "index.html"), "utf8");
const script = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/);
if (!script) throw new Error("Script de l'aperçu introuvable dans le build Vite.");
const js = readFileSync(join(dist, script[1]), "utf8").replace(/<\/script/gi, "<\\/script");
html = html
  .replace(script[0], () => "")
  .replace("</body>", () => `<script type="module">${js}</script>\n</body>`)
  .replace("%CLASSE_POLICE%", classePolice)
  .replace("<!--STYLES-->", () => `<style>${css}</style>`)
  .replace("<!--ICONE-->", () => `<link rel="icon" href="${dataUri(join(racine, "public/icones/icone-192.png"))}" />`);

mkdirSync(join(ici, "sortie"), { recursive: true });
const MESSAGE_SANS_JS =
  "Pour voir l'aperçu de Vertical Store, ouvrez ce fichier avec un navigateur : Chrome, Safari ou Firefox.";
writeFileSync(
  sortie,
  html.replace("<!--SANS-JS-->", () => `<noscript><p>${MESSAGE_SANS_JS}</p></noscript>`),
);

// 5. Visite guidée : vidéo, et écrans clés pour les lecteurs qui bloquent JavaScript.
console.log(process.argv.includes("--sans-video") ? "5/6 écrans…" : "5/6 vidéo et écrans…");
const captures = await filmer(sortie, {
  video: process.argv.includes("--sans-video") ? null : sortieVideo,
  images: join(cache, "images-video"),
});

// 6. Sans JavaScript (aperçu de WhatsApp, fichiers de l'iPhone…), le fichier montre ces écrans à la suite.
console.log("6/6 version sans JavaScript…");
const figures = [];
for (const { legende, png } of captures) {
  const webp = await sharp(png).resize({ width: 720 }).webp({ quality: 72 }).toBuffer();
  figures.push(
    `<figure style="margin:0 0 32px"><img src="data:image/webp;base64,${webp.toString("base64")}" alt="${legende}" ` +
      `style="display:block;width:100%;height:auto;border-radius:24px;box-shadow:0 12px 32px rgb(0 0 0 / .14)">` +
      `<figcaption style="margin-top:12px;font-size:16px;line-height:1.45;color:#3a3b35">${legende}</figcaption></figure>`,
  );
}
const sansJs =
  `<noscript><div style="max-width:440px;margin:0 auto;padding:32px 18px 48px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0d0e0b">` +
  `<p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#3e5a1f">Aperçu</p>` +
  `<h1 style="margin:8px 0 10px;font-size:30px;line-height:1.1;letter-spacing:-.02em">Vertical Store</h1>` +
  `<p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#63635a">Voici les écrans du site et de l'espace vendeur. ` +
  `Pour l'essayer en vrai (glisser les photos, choisir sa pointure, commander…), ouvrez ce fichier sur un ordinateur ` +
  `ou dans Chrome.</p>${figures.join("")}</div></noscript>`;
const final = html.replace("<!--SANS-JS-->", () => sansJs);
writeFileSync(sortie, final);
console.log(`✅ ${sortie} (${(Buffer.byteLength(final) / 1024 / 1024).toFixed(1)} Mo)`);
if (!process.argv.includes("--sans-video")) {
  console.log(`✅ ${sortieVideo} (${(statSync(sortieVideo).size / 1024 / 1024).toFixed(1)} Mo)`);
}
