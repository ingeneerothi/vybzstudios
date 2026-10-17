// Vectorise le trait noir de la tête rasta (assets/lineart/rasta-mask.png, produit par
// extract_assets.py) pour l'effet « draw-on » de la scène 4. Le tracé suit le dessin
// d'origine : rien n'est redessiné à la main.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import potrace from 'potrace';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const input = path.join(root, 'assets', 'lineart', 'rasta-mask.png');
const output = path.join(root, 'assets', 'lineart', 'rasta.json');

potrace.trace(input, {turdSize: 10, optTolerance: 0.3, alphaMax: 1, threshold: 128, blackOnWhite: true}, (err, svg) => {
	if (err) {
		throw err;
	}
	const width = Number(/width="([\d.]+)"/.exec(svg)[1]);
	const height = Number(/height="([\d.]+)"/.exec(svg)[1]);
	const d = /<path[^>]*\sd="([^"]+)"/.exec(svg)[1];
	// un sous-chemin par contour, ordonnés de haut en bas pour un tracé naturel
	const paths = d
		.split(/(?=M)/)
		.map((s) => s.trim())
		.filter(Boolean)
		.map((p) => ({p, y: Number(/M\s*[-\d.]+[\s,]+([-\d.]+)/.exec(p)?.[1] ?? 0)}))
		.sort((a, b) => a.y - b.y)
		.map(({p}) => p);
	fs.writeFileSync(output, JSON.stringify({width, height, paths}));
	console.log(`lineart: ${paths.length} contours, ${width}x${height} -> ${path.relative(root, output)}`);
});
