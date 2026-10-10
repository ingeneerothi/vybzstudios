// Renders a few stills of the ad for review.
// Usage: node scripts/stills.mjs <outDir> <scale> <frame> [<frame> ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [outDir, scale, ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({
  serveUrl,
  id: "VybzAd",
  browserExecutable,
});
for (const f of frames) {
  const output = path.join(outDir, `frame-${String(f).padStart(4, "0")}.png`);
  await renderStill({
    serveUrl,
    composition,
    frame: Number(f),
    output,
    scale: Number(scale),
    browserExecutable,
  });
  console.log(output);
}
