// Rend des images fixes de contrôle (un seul bundle) : node scripts/stills.mjs 0 120 540 ...
// Sortie : out/stills/f-<frame>.jpg
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const frames = process.argv.slice(2).map(Number);
const showSafeZones = process.env.SAFE === '1';
const outDir = path.join(root, 'out', 'stills');
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'assets')});
const inputProps = {showSafeZones, musicVolume: 0.9};
const browserExecutable = process.env.REMOTION_CHROME ?? null;
const composition = await selectComposition({serveUrl, id: 'OscanIntro', inputProps, browserExecutable});

for (const frame of frames) {
	const output = path.join(outDir, `f-${String(frame).padStart(4, '0')}.jpg`);
	await renderStill({composition, serveUrl, frame, output, inputProps, imageFormat: 'jpeg', jpegQuality: 90, browserExecutable});
	console.log(output);
}
