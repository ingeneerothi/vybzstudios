// Joue la visite guidée (parcours.mjs) dans Chromium, en taille téléphone :
// - filme l'écran image par image, puis l'encode en MP4 (H.264, lisible partout, WhatsApp compris) ;
// - prend les écrans clés, montrés dans le fichier HTML quand JavaScript est bloqué.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { parcourir } from "./parcours.mjs";

const LARGEUR = 390;
const HAUTEUR = 844;
const ECHELLE = 2;

export async function filmer(fichierHtml, { video, images }) {
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({
    viewport: { width: LARGEUR, height: HAUTEUR },
    deviceScaleFactor: ECHELLE,
    isMobile: true,
    hasTouch: true,
    locale: "fr-FR",
  });
  // Moment où l'application s'affiche : la vidéo commence là (pas d'écran blanc au début).
  await contexte.addInitScript(() => {
    new MutationObserver((_, observateur) => {
      if (document.getElementById("racine")?.childElementCount) {
        window.__debutVisite = Date.now();
        observateur.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));

  const images_ = [];
  const cdp = video ? await contexte.newCDPSession(page) : null;
  if (cdp) {
    rmSync(images, { recursive: true, force: true });
    mkdirSync(images, { recursive: true });
    cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
      const nom = `f${String(images_.length).padStart(6, "0")}.jpg`;
      writeFileSync(join(images, nom), Buffer.from(data, "base64"));
      images_.push({ nom, t: metadata.timestamp });
      await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 88,
      maxWidth: LARGEUR * ECHELLE,
      maxHeight: HAUTEUR * ECHELLE,
      everyNthFrame: 1,
    });
  }

  // Premier chargement : le navigateur lit le fichier (3 Mo). Le second affiche l'ouverture sans à-coup.
  await page.goto(pathToFileURL(fichierHtml).href);
  await page.waitForTimeout(1500);
  await page.reload();
  const captures = [];
  await parcourir(page, {
    pause: (ms) => page.waitForTimeout(ms),
    ecran: async (nom, legende) => captures.push({ nom, legende, png: await page.screenshot() }),
  });

  if (cdp) {
    await page.waitForTimeout(300);
    await cdp.send("Page.stopScreencast");
    const debut = (await page.evaluate(() => window.__debutVisite)) / 1000 - 0.05;
    const gardees = images_.filter((i) => i.t >= debut);
    // Chaque image dure jusqu'à la suivante (le navigateur n'envoie une image que si l'écran change).
    const lignes = ["ffconcat version 1.0"];
    gardees.forEach((img, i) => {
      const suivante = gardees[i + 1]?.t ?? img.t + 0.5;
      lignes.push(`file '${img.nom}'`, `duration ${Math.max(0.001, suivante - img.t).toFixed(4)}`);
    });
    lignes.push(`file '${gardees.at(-1).nom}'`);
    writeFileSync(join(images, "liste.ffconcat"), lignes.join("\n"));
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        join(images, "liste.ffconcat"),
        "-vf",
        `fps=30,scale=${LARGEUR * ECHELLE}:${HAUTEUR * ECHELLE}:flags=lanczos,format=yuv420p`,
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "21",
        "-movflags",
        "+faststart",
        video,
      ],
      { stdio: "inherit" },
    );
    rmSync(images, { recursive: true, force: true });
  }

  await navigateur.close();
  if (erreurs.length) throw new Error(`Erreurs pendant la visite : ${erreurs.join(" | ")}`);
  return captures;
}
