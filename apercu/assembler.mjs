#!/usr/bin/env node
// Construit apercu/sortie/vertical-store-apercu.html : le site client et l'espace vendeur dans un seul
// fichier, qui s'ouvre dans n'importe quel navigateur, sans internet (mode démo, rien n'est envoyé).
//
// Utilisation : npm run apercu            (relance aussi « next build » pour avoir les styles à jour)
//               npm run apercu -- --vite  (garde le build Next existant : plus rapide)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { build } from "vite";

const ici = fileURLToPath(new URL(".", import.meta.url));
const racine = fileURLToPath(new URL("..", import.meta.url));
const cache = join(ici, "cache");
const sortie = join(ici, "sortie", "vertical-store-apercu.html");
const TAILLE_VUE = 720; // px : net sur téléphone, léger pour le fichier

const types = { ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
function dataUri(fichier) {
  const type = types[fichier.slice(fichier.lastIndexOf("."))] ?? "application/octet-stream";
  return `data:${type};base64,${readFileSync(fichier).toString("base64")}`;
}

// 1. Les styles du vrai site, compilés par Next (Tailwind, police, fonds).
if (!process.argv.includes("--vite")) {
  console.log("1/4 next build (styles du site)…");
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
console.log("2/4 photos…");
rmSync(join(cache, "images"), { recursive: true, force: true });
const dossierChaussures = join(racine, "public/chaussures");
for (const slug of readdirSync(dossierChaussures)) {
  if (!statSync(join(dossierChaussures, slug)).isDirectory()) continue;
  mkdirSync(join(cache, "images/chaussures", slug), { recursive: true });
  for (const vue of readdirSync(join(dossierChaussures, slug)).filter((f) => f.endsWith(".webp"))) {
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
console.log("3/4 vite build…");
await build({ configFile: join(ici, "vite.config.ts") });

// 4. Un seul fichier : styles, script et photos à l'intérieur.
console.log("4/4 assemblage…");
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
writeFileSync(sortie, html);
console.log(`✅ ${sortie} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} Mo)`);
