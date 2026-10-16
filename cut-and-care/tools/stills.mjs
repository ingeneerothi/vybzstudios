// Rend plusieurs images fixes avec un seul bundle (contrôle visuel rapide).
// Usage : node tools/stills.mjs 30 120 300 ...
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: HEADLESS});
const composition = await selectComposition({serveUrl, id: 'OffreSemaine', puppeteerInstance: browser});
for (const frame of frames) {
  const output = `out/stills/f${String(frame).padStart(4, '0')}.png`;
  await renderStill({composition, serveUrl, output, frame, puppeteerInstance: browser});
  console.log('ok', output);
}
await browser.close({silent: true});
