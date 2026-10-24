#!/usr/bin/env node
// Captures d'écran de toutes les pages (site + admin) en 375, 390, 412, 768 et 1440 px.
// Utilisation : npm run build && npx next start -p 3200   puis   npm run captures
// Résultat : captures/<largeur>/<page>.png + captures/rapport.json (débordements, erreurs console)
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const SORTIE = process.env.SORTIE ?? "captures";
const LARGEURS = [
  { l: 375, h: 812, mobile: true },
  { l: 390, h: 844, mobile: true },
  { l: 412, h: 915, mobile: true },
  { l: 768, h: 1024, mobile: true },
  { l: 1440, h: 900, mobile: false },
];
const PAGES_SITE = [
  ["accueil", "/"],
  ["collection", "/collection"],
  ["fiche", "/chaussure/asics-gel-kayano-14-vert"],
  ["commande", "/commander/asics-gel-kayano-14-vert?pointure=42"],
  ["demande", "/demande"],
];
const PAGES_ADMIN = [
  ["admin-chaussures", "/admin/chaussures"],
  ["admin-modifier", "/admin/chaussures/modifier?id=nike-air-max-95-corteiz-kaki"],
  ["admin-nouvelle", "/admin/chaussures/nouvelle"],
  ["admin-commandes", "/admin/commandes"],
  ["admin-numeros", "/admin/numeros"],
  ["admin-reglages", "/admin/reglages"],
];

async function defiler(page) {
  await page.evaluate(async () => {
    const pas = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += pas) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

async function preparerDemo(page) {
  // Une commande et une demande, pour que l'écran Commandes ne soit pas vide.
  await page.goto(`${BASE}/admin/connexion`);
  await page.evaluate(() => {
    const cle = "vertical-store-demo-v1";
    localStorage.setItem("vertical-store-demo-session", "angebattey.616@gmail.com");
    localStorage.removeItem(cle);
  });
  await page.goto(`${BASE}/commander/nike-air-force-1-noir?pointure=42`);
  await page.getByRole("textbox", { name: "Nom complet" }).fill("Awa Koné");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("0708091011");
  await page.getByRole("combobox", { name: "Commune" }).selectOption("Cocody");
  await page.getByRole("textbox", { name: "Quartier" }).fill("Riviera 2");
  await page.getByRole("textbox", { name: "Adresse précise" }).fill("Rue des jardins, villa 12");
  await page.route("https://wa.me/**", (r) => r.fulfill({ status: 200, body: "ok" }));
  await page.getByRole("button", { name: /^Commander/ }).click();
  await page.waitForRequest((r) => r.url().startsWith("https://wa.me/"));
}

const rapport = [];
const navigateur = await chromium.launch();
for (const { l, h, mobile } of LARGEURS) {
  mkdirSync(`${SORTIE}/${l}`, { recursive: true });
  const contexte = await navigateur.newContext({
    viewport: { width: l, height: h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));

  await preparerDemo(page);
  for (const [nom, chemin] of [...PAGES_SITE, ...PAGES_ADMIN]) {
    erreurs.length = 0;
    await page.goto(`${BASE}${chemin}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(nom === "accueil" ? 2600 : 1200);
    await defiler(page);
    const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${SORTIE}/${l}/${nom}-ecran.png` });
    // Pleine page : les apparitions sont liées au défilement, on les fige (réglage « réduire les animations »).
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SORTIE}/${l}/${nom}.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    rapport.push({ largeur: l, page: nom, debordementHorizontal: debordement, erreurs: [...erreurs] });
    console.log(`${String(l).padStart(4)} ${nom.padEnd(18)} débordement=${debordement}px erreurs=${erreurs.length}`);
  }
  await contexte.close();
}
await navigateur.close();
writeFileSync(`${SORTIE}/rapport.json`, JSON.stringify(rapport, null, 2));
const problemes = rapport.filter((r) => r.debordementHorizontal > 0 || r.erreurs.length > 0);
console.log(
  problemes.length ? `⚠️ ${problemes.length} page(s) à vérifier` : "✅ Aucun débordement, aucune erreur console",
);
