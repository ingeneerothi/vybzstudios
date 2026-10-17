// Aperçu autonome : tout le site (styles, polices, photos, vidéo, scripts) dans UN fichier HTML,
// à ouvrir sans serveur (téléphone, WhatsApp, e-mail). Le tunnel y tourne en démo locale.
// Usage : node tools/build-preview.mjs [sortie.html]   (ffmpeg facultatif : allège la vidéo)
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const out = process.argv[2] ?? join(ROOT, 'preview', 'cut-and-care-apercu.html');

const MIME = {'.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.jpg': 'image/jpeg'};
const dataUri = (file) => `data:${MIME[file.slice(file.lastIndexOf('.'))]};base64,${readFileSync(file).toString('base64')}`;
const read = (rel) => readFileSync(join(PUB, rel), 'utf8');
// un script en ligne ne doit jamais contenir « </script »
const inlineJs = (code) => code.replace(/<\/script/gi, '<\\/script');

// Chaque fichier n'est intégré qu'UNE fois : les photos 640 px servent aussi pour les clés 1280 px,
// et la page reçoit ses images au démarrage (attributs data-asset-*), sans copie en double.
const assets = {};
for (const f of readdirSync(join(PUB, 'img'))) if (/-640\.webp$/.test(f) || f === 'favicon.svg') assets[`img/${f}`] = dataUri(join(PUB, 'img', f));
assets['video/pub-offre-semaine.webp'] = dataUri(join(PUB, 'video/pub-offre-semaine.webp'));

// Vidéo : copie allégée si ffmpeg est disponible
let video = join(PUB, 'video/pub-offre-semaine.mp4');
try {
  const light = join(mkdtempSync(join(tmpdir(), 'cc-preview-')), 'pub.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', light]);
  video = light;
} catch {
  console.warn('ffmpeg indisponible : vidéo intégrée en qualité d’origine');
}
assets['video/pub-offre-semaine.mp4'] = dataUri(video);

const fontsCss = read('css/fonts.css').replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (_, f) => `url('${dataUri(join(PUB, 'fonts', f))}')`);
const catalog = JSON.parse(read('data/catalog.json'));

const bundle = await build({entryPoints: [join(PUB, 'js/app.mjs')], bundle: true, format: 'esm', target: 'es2022', minify: true, write: false});
const appJs = bundle.outputFiles[0].text;

const boot = `window.__CATALOG__=${JSON.stringify(catalog)};
window.__ASSETS__=${JSON.stringify(assets)};
for (const k of Object.keys(window.__ASSETS__)) if (k.endsWith('-640.webp')) window.__ASSETS__[k.replace('-640.', '-1280.')] = window.__ASSETS__[k];
for (const el of document.querySelectorAll('[data-asset-src]')) el.src = window.__ASSETS__[el.dataset.assetSrc];
for (const el of document.querySelectorAll('[data-asset-poster]')) el.poster = window.__ASSETS__[el.dataset.assetPoster];`;

let html = read('index.html')
  .replace(/^\s*<link rel="preload"[^>]*>\n/gm, '')
  .replace(/^.*%PUBLIC_URL%.*\n/gm, '')
  .replace('href="img/favicon.svg"', () => `href="${assets['img/favicon.svg']}"`)
  .replace(/ srcset="[^"]*"/g, '')
  .replace(/ src="((?:img|video)\/[^"]+)"/g, ' data-asset-src="$1"')
  .replace(/ poster="([^"]+)"/g, ' data-asset-poster="$1"')
  .replace('<link rel="stylesheet" href="css/fonts.css">', () => `<style>${fontsCss}</style>`)
  .replace('<link rel="stylesheet" href="vendor/lenis.css">', () => `<style>${read('vendor/lenis.css')}</style>`)
  .replace('<link rel="stylesheet" href="css/style.css">', () => `<style>${read('css/style.css')}</style>`)
  .replace(/<script src="(vendor\/[^"]+)"><\/script>/g, (_, src) => `<script>${inlineJs(read(src))}</script>`)
  .replace('<script type="module" src="js/app.mjs"></script>', () => `<script>${inlineJs(boot)}</script>\n  <script type="module">${inlineJs(appJs)}</script>`);

// contrôle : aucun chemin relatif ne doit rester dans le HTML statique (hors gabarits du script)
const left = html.replace(/<script[\s\S]*?<\/script>/g, '').match(/\s(?:src|href|poster)="(?!data:|https?:|#|mailto:)[^"]+"/g);
if (left) console.warn('Chemins non intégrés :', left);

mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, html);
console.log(`Aperçu : ${out} (${(Buffer.byteLength(html) / 1048576).toFixed(1)} Mo)`);
