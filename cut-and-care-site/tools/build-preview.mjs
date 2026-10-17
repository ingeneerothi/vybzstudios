// Aperçu autonome : tout le site (styles, polices, photos, vidéo, scripts) dans UN fichier HTML,
// à ouvrir sans serveur (téléphone, WhatsApp, e-mail). Le tunnel y tourne en démo locale.
// Les photos et les prix sont écrits dans le HTML : sur iPhone, l'aperçu de fichiers (sans JavaScript)
// affiche la page complète, animée en CSS ; dans un navigateur, les animations GSAP prennent le relais.
// Usage : node tools/build-preview.mjs [sortie.html]   (ffmpeg facultatif : allège la vidéo)
import {execFileSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {fillPage} from '../public/js/render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const out = process.argv[2] ?? join(ROOT, 'preview', 'cut-and-care-apercu.html');

const MIME = {'.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.jpg': 'image/jpeg'};
const dataUri = (file) => `data:${MIME[file.slice(file.lastIndexOf('.'))]};base64,${readFileSync(file).toString('base64')}`;
const read = (rel) => readFileSync(join(PUB, rel), 'utf8');
// un script en ligne ne doit jamais contenir « </script »
const inlineJs = (code) => code.replace(/<\/script/gi, '<\\/script');

// Photos : la version 640 px sert pour toutes les tailles (fichier plus léger)
const cache = new Map();
const image = (path) => {
  const small = path.replace(/-1280\.webp$/, '-640.webp');
  if (!cache.has(small)) cache.set(small, dataUri(join(PUB, small)));
  return cache.get(small);
};

// Vidéo : copie allégée si ffmpeg est disponible
let video = join(PUB, 'video/pub-offre-semaine.mp4');
try {
  const light = join(mkdtempSync(join(tmpdir(), 'cc-preview-')), 'pub.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', light]);
  video = light;
} catch {
  console.warn('ffmpeg indisponible : vidéo intégrée en qualité d’origine');
}

const fontsCss = read('css/fonts.css').replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (_, f) => `url('${dataUri(join(PUB, 'fonts', f))}')`);
const catalog = JSON.parse(read('data/catalog.json'));

const bundle = await build({entryPoints: [join(PUB, 'js/app.mjs')], bundle: true, format: 'esm', target: 'es2022', minify: true, write: false});
const appJs = bundle.outputFiles[0].text;

// Le tunnel affiche les photos des prestations : on les reprend des cartes déjà dans la page (pas de copie).
const boot = `window.__CATALOG__=${JSON.stringify(catalog)};
window.__ASSETS__={};
for (const s of window.__CATALOG__.services) {
  const img = document.querySelector('.svc[data-svc="' + s.id + '"] img');
  if (img) window.__ASSETS__['img/' + s.img + '-640.webp'] = window.__ASSETS__['img/' + s.img + '-1280.webp'] = img.src;
}`;

let html = fillPage(read('index.html'), catalog, {asset: image, srcset: false})
  .replace(/^\s*<link rel="preload"[^>]*>\n/gm, '')
  .replace(/^.*%PUBLIC_URL%.*\n/gm, '')
  .replace('href="img/favicon.svg"', () => `href="${dataUri(join(PUB, 'img/favicon.svg'))}"`)
  .replace(/ srcset="[^"]*"/g, '')
  .replace(/ sizes="[^"]*"/g, '')
  .replace(/ src="(img\/[^"]+\.webp)"/g, (_, p) => ` src="${image(p)}"`)
  .replace(' src="video/pub-offre-semaine.mp4"', () => ` src="${dataUri(video)}"`)
  .replace(' poster="video/pub-offre-semaine.webp"', () => ` poster="${dataUri(join(PUB, 'video/pub-offre-semaine.webp'))}"`)
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
