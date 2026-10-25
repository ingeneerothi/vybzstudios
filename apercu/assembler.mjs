#!/usr/bin/env node
// Construit apercu/sortie/vertical-store-apercu.html : le site client et l'espace vendeur dans un seul
// fichier, qui s'ouvre dans n'importe quel navigateur, sans internet (mode démo, rien n'est envoyé).
//
// Produit aussi vertical-store-visite.mp4 (la visite guidée filmée en taille téléphone) et
// vertical-store-presentation.pdf (les écrans clés, un par page) et vertical-store-mobile.pdf (chaque écran en
// entier, au format téléphone) : ils s'ouvrent sur tous les téléphones.
//
// Et apercu/sortie/web/ : la même chose en page web à publier (index.html sans en-tête, que l'hébergeur ajoute,
// et les photos à côté, chargées au fur et à mesure comme sur le vrai site).
//
// Utilisation : npm run apercu                  (relance aussi « next build » pour avoir les styles à jour)
//               npm run apercu -- --vite        (garde le build Next existant : plus rapide)
//               npm run apercu -- --sans-video  (n'encode pas la vidéo)
//               npm run apercu -- --web         (seulement la page web)
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { build } from "vite";
import { filmer } from "./filmer.mjs";
import { creerVersionMobile } from "./mobile.mjs";
import { creerPresentation, lireLogo } from "./presentation.mjs";

const ici = fileURLToPath(new URL(".", import.meta.url));
const racine = fileURLToPath(new URL("..", import.meta.url));
const cache = join(ici, "cache");
const sortie = join(ici, "sortie", "vertical-store-apercu.html");
const sortieVideo = join(ici, "sortie", "vertical-store-visite.mp4");
const sortiePdf = join(ici, "sortie", "vertical-store-presentation.pdf");
const sortieMobile = join(ici, "sortie", "vertical-store-mobile.pdf");
const dossierWeb = join(ici, "sortie", "web");
const TAILLE_VUE = 720; // px : net sur téléphone, léger pour le fichier

const types = {
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
function dataUri(fichier) {
  const type = types[fichier.slice(fichier.lastIndexOf("."))] ?? "application/octet-stream";
  return `data:${type};base64,${readFileSync(fichier).toString("base64")}`;
}
const taille = (f) => `${(statSync(f).size / 1024 / 1024).toFixed(1)} Mo`;

/** Le script construit par Vite, à placer dans la page (« </script » échappé). */
function scriptConstruit(dist) {
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const balise = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/);
  if (!balise) throw new Error("Script de l'aperçu introuvable dans le build Vite.");
  return {
    html,
    balise: balise[0],
    js: readFileSync(join(dist, balise[1]), "utf8").replace(/<\/script/gi, "<\\/script"),
  };
}

// 1. Les styles du vrai site, compilés par Next (Tailwind, police, fonds).
if (!process.argv.includes("--vite")) {
  console.log("1/9 next build (styles du site)…");
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
/** Les styles du site ; `reference(fichier)` dit comment pointer vers une image ou une police qu'ils utilisent. */
function stylesDuSite(reference) {
  return feuilles
    .map((f) => {
      const dossier = join(racine, ".next", f, "..");
      return (
        readFileSync(join(racine, ".next", f), "utf8")
          // image-set(AVIF, WebP) : l'aperçu garde le WebP, lu par tous les navigateurs et lecteurs de téléphone.
          .replace(/(?:-webkit-)?image-set\(((?:[^()]|\([^()]*\))*)\)/g, (tout, candidats) => {
            const webp = candidats.match(/["(]([^"'()\s]+\.webp)/);
            return webp ? `url("${webp[1]}")` : tout;
          })
          .replace(/url\((["']?)([^"')]+)\1\)/g, (tout, _g, chemin) => {
            if (chemin.startsWith("data:")) return tout;
            return reference(chemin.startsWith("/") ? join(racine, "public", chemin) : join(dossier, chemin));
          })
      );
    })
    .join("\n");
}
// Fichier unique : une image utilisée plusieurs fois dans les styles n'est intégrée qu'une fois (variable CSS).
const variables = new Map();
const css = stylesDuSite((fichier) => {
  if (fichier.endsWith(".woff2")) return `url("${dataUri(fichier)}")`; // @font-face n'accepte pas var()
  if (!variables.has(fichier)) variables.set(fichier, `--apercu-${variables.size}`);
  return `var(${variables.get(fichier)})`;
});
const imagesCss = `:root{${[...variables].map(([fichier, nom]) => `${nom}:url("${dataUri(fichier)}")`).join(";")}}`;

// 2. Photos réduites, intégrées ensuite au fichier par Vite (voir images.ts).
console.log("2/9 photos…");
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
  // Photo de fond : assez grande pour un téléphone, sans alourdir le fichier.
  await sharp(join(racine, "public/marque", f))
    .resize({ width: 828, withoutEnlargement: true })
    .webp({ quality: 62, effort: 6 })
    .toFile(join(cache, "images/marque", f));
}
// Photos retirées du site : retirées aussi de l'aperçu.
for (const dossier of ["chaussures", "marque"]) {
  for (const fichier of readdirSync(join(cache, "images", dossier), { recursive: true })) {
    const copie = join(cache, "images", dossier, fichier);
    if (statSync(copie).isFile() && !existsSync(join(racine, "public", dossier, fichier))) rmSync(copie);
  }
}

// 3. Version web : la page à publier, et ses photos à côté.
console.log("3/9 version web…");
process.env.APERCU_WEB = "1";
await build({ configFile: join(ici, "vite.config.mts") });
delete process.env.APERCU_WEB;
rmSync(dossierWeb, { recursive: true, force: true });
cpSync(join(cache, "images"), dossierWeb, { recursive: true });
// Les images des styles sont publiées à côté de la page ; la police reste intégrée.
const cssWeb = stylesDuSite((fichier) => {
  if (fichier.endsWith(".woff2")) return `url("${dataUri(fichier)}")`;
  const publie = relative(join(racine, "public"), fichier);
  if (publie.startsWith("..")) throw new Error(`Image des styles hors de public/ : ${fichier}`);
  if (!existsSync(join(dossierWeb, publie))) cpSync(fichier, join(dossierWeb, publie));
  return `url("${publie}")`;
});
const pageWeb = join(dossierWeb, "index.html");
// L'hébergeur ajoute lui-même doctype, <head> et <body> : la page n'en contient pas, d'où la langue, la police
// et la hauteur réglées par script. `font: inherit` annule la police par défaut que l'hébergeur donne à <body>.
writeFileSync(
  pageWeb,
  [
    "<title>Vertical Store</title>",
    `<style>body{font:inherit}\n${cssWeb}</style>`,
    `<script>document.documentElement.lang="fr";document.documentElement.className+=${JSON.stringify(` ${classePolice}`)};document.body.className="min-h-dvh";</script>`,
    '<div id="racine"></div>',
    `<script type="module">${scriptConstruit(join(cache, "dist-web")).js}</script>`,
  ].join("\n"),
);
const photosWeb = readdirSync(dossierWeb, { recursive: true }).filter((f) => f.endsWith(".webp")).length;
if (process.argv.includes("--web")) {
  console.log(`✅ ${pageWeb} (${taille(pageWeb)}) et ${photosWeb} photos`);
  process.exit(0);
}

// 4. Les composants du site, assemblés en un seul script.
console.log("4/9 vite build…");
await build({ configFile: join(ici, "vite.config.mts") });

// 5. Un seul fichier : styles, script et photos à l'intérieur.
console.log("5/9 assemblage…");
const { html: modele, balise, js } = scriptConstruit(join(cache, "dist"));
const html = modele
  .replace(balise, () => "")
  .replace("</body>", () => `<script type="module">${js}</script>\n</body>`)
  .replace("%CLASSE_POLICE%", classePolice)
  .replace("<!--STYLES-->", () => `<style>${imagesCss}\n${css}</style>`)
  .replace("<!--ICONE-->", () => `<link rel="icon" href="${dataUri(join(racine, "public/icones/icone-192.png"))}" />`);

mkdirSync(join(ici, "sortie"), { recursive: true });
const STYLE_ECRANS =
  "max-width:440px;margin:0 auto;padding:32px 18px 48px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0d0e0b";
// Version provisoire (le temps de filmer) : le site démarre, ce bloc reste caché.
writeFileSync(
  sortie,
  html.replace("<!--ECRANS-->", () => `<div id="ecrans-fixes" style="${STYLE_ECRANS}"><p>Vertical Store</p></div>`),
);

// 6. Visite guidée : vidéo, et écrans clés.
console.log(process.argv.includes("--sans-video") ? "6/9 écrans…" : "6/9 vidéo et écrans…");
const captures = await filmer(sortie, {
  video: process.argv.includes("--sans-video") ? null : sortieVideo,
  images: join(cache, "images-video"),
});

// 7. Écrans fixes dans le fichier : visibles tant que le site n'a pas démarré. Si un téléphone bloque
//    le JavaScript (aperçu WhatsApp, fichiers de l'iPhone…), on voit au moins tous les écrans à la suite.
console.log("7/9 écrans fixes…");
const figures = [];
for (const { legende, png } of captures) {
  const webp = await sharp(png).resize({ width: 720 }).webp({ quality: 72 }).toBuffer();
  figures.push(
    `<figure style="margin:0 0 32px"><img src="data:image/webp;base64,${webp.toString("base64")}" alt="${legende}" ` +
      `style="display:block;width:100%;height:auto;border-radius:24px;box-shadow:0 12px 32px rgb(0 0 0 / .14)">` +
      `<figcaption style="margin-top:12px;font-size:16px;line-height:1.45;color:#3a3b35">${legende}</figcaption></figure>`,
  );
}
const ecrans =
  `<div id="ecrans-fixes" style="${STYLE_ECRANS}">` +
  `<p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#3e5a1f">Aperçu</p>` +
  `<h1 style="margin:8px 0 10px;font-size:30px;line-height:1.1;letter-spacing:-.02em">Vertical Store</h1>` +
  `<p style="margin:0 0 28px;font-size:16px;line-height:1.5;color:#63635a">Voici les écrans du site et de l'espace vendeur. ` +
  `Pour l'essayer en vrai (glisser les photos, choisir sa pointure, commander…), ouvrez ce fichier sur un ordinateur ` +
  `ou dans Chrome.</p>${figures.join("")}</div>`;
const final = html.replace("<!--ECRANS-->", () => ecrans);
writeFileSync(sortie, final);

// 8. Présentation PDF : s'ouvre sur tous les téléphones et dans WhatsApp.
console.log("8/9 présentation PDF…");
await creerPresentation(captures, sortiePdf, {
  police: dataUri(join(racine, "src/app/fonts/archivo-variable.woff2")),
  logoSvg: lireLogo(join(racine, "public/marque/logo.svg")),
});

// 9. Version mobile : chaque écran en entier, au format téléphone, une page par écran.
console.log("9/9 version mobile (PDF)…");
await creerVersionMobile(sortie, sortieMobile, {
  police: dataUri(join(racine, "src/app/fonts/archivo-variable.woff2")),
  logoSvg: lireLogo(join(racine, "public/marque/logo.svg")),
});

console.log(`✅ ${sortie} (${taille(sortie)})`);
console.log(`✅ ${sortiePdf} (${taille(sortiePdf)})`);
console.log(`✅ ${sortieMobile} (${taille(sortieMobile)})`);
if (!process.argv.includes("--sans-video")) console.log(`✅ ${sortieVideo} (${taille(sortieVideo)})`);
console.log(`✅ ${pageWeb} (${taille(pageWeb)}) et ${photosWeb} photos`);
