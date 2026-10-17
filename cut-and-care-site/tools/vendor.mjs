// Copie les bibliothèques (GSAP, Lenis) et les polices dans public/ : le site
// fonctionne sans CDN (hébergement simple, aucune dépendance réseau tierce).
import {copyFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const pub = join(root, 'public');
mkdirSync(join(pub, 'vendor'), {recursive: true});
mkdirSync(join(pub, 'fonts'), {recursive: true});

for (const f of ['gsap.min.js', 'ScrollTrigger.min.js', 'SplitText.min.js', 'Flip.min.js', 'CustomEase.min.js']) {
  copyFileSync(join(nm, 'gsap/dist', f), join(pub, 'vendor', f));
}
copyFileSync(join(nm, 'lenis/dist/lenis.min.js'), join(pub, 'vendor/lenis.min.js'));
copyFileSync(join(nm, 'lenis/dist/lenis.css'), join(pub, 'vendor/lenis.css'));

// [famille CSS, paquet, fichier, poids, style]
const FONTS = [
  ['Great Vibes', 'great-vibes', 'great-vibes-latin-400-normal.woff2', 400, 'normal'],
  ['Cinzel', 'cinzel', 'cinzel-latin-600-normal.woff2', 600, 'normal'],
  ['Cinzel', 'cinzel', 'cinzel-latin-700-normal.woff2', 700, 'normal'],
  ['Playfair Display', 'playfair-display', 'playfair-display-latin-400-italic.woff2', 400, 'italic'],
  ['Playfair Display', 'playfair-display', 'playfair-display-latin-700-normal.woff2', 700, 'normal'],
  ['Cormorant Garamond', 'cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff2', 500, 'italic'],
  ['Cormorant Garamond', 'cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff2', 600, 'normal'],
  ['Montserrat', 'montserrat', 'montserrat-latin-500-normal.woff2', 500, 'normal'],
  ['Montserrat', 'montserrat', 'montserrat-latin-600-normal.woff2', 600, 'normal'],
  ['Montserrat', 'montserrat', 'montserrat-latin-700-normal.woff2', 700, 'normal'],
];
let css = '/* Généré par tools/vendor.mjs — polices @fontsource (OFL), sous-ensemble latin. */\n';
for (const [family, pkg, file, weight, style] of FONTS) {
  copyFileSync(join(nm, '@fontsource', pkg, 'files', file), join(pub, 'fonts', file));
  css += `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url('../fonts/${file}') format('woff2');}\n`;
}
writeFileSync(join(pub, 'css/fonts.css'), css);
console.log('vendor OK');
