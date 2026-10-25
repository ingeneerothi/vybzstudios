// Version mobile : chaque écran du site et de l'espace vendeur, en entier, tel qu'il s'affiche sur un téléphone
// (392 px de large), réunis dans un PDF où une page = un écran. Un PDF s'ouvre sur tous les téléphones :
// on le fait défiler comme on ferait défiler le site.
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const LARGEUR = 392;
const HAUTEUR = 844;
const ECHELLE = 2;
// Chrome arrondit la taille des pages du PDF au point près : un multiple de 8 px (6 pt) tombe juste,
// sinon un mince liseré blanc apparaît au bord de la page.
const GRILLE = 8;
const surGrille = (px) => Math.ceil(px / GRILLE) * GRILLE;

/**
 * Écran entier, tel que sur le vrai site : sans les ajouts de l'aperçu, toutes les photos chargées, et les barres
 * fixes (en-tête, barre « Commander », menu du bas) à leur place dans la page.
 */
async function pleinePage(page) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    // Écran au repos : pas de champ en cours de saisie.
    document.activeElement?.blur();
    for (const element of document.querySelectorAll("[data-apercu]")) element.style.display = "none";
    for (const p of document.querySelectorAll("p")) {
      if (p.textContent?.startsWith("Mode démo")) p.style.display = "none";
    }
    // Les photos se chargent d'habitude au défilement : on les charge toutes, la page est prise en entier.
    // Décodage immédiat : sinon une photo hors de l'écran peut manquer sur la capture (elle est décodée trop tard).
    const images = [...document.images];
    for (const image of images) {
      image.loading = "eager";
      image.decoding = "sync";
    }
    await Promise.all(
      images.map(async (image) => {
        if (!image.complete) {
          await new Promise((fin) => {
            image.addEventListener("load", fin, { once: true });
            image.addEventListener("error", fin, { once: true });
          });
        }
        await image.decode().catch(() => {});
      }),
    );
    document.body.style.position = "relative";
    for (const element of document.querySelectorAll("body *")) {
      if (getComputedStyle(element).position !== "fixed") continue;
      // Le bouton WhatsApp flottant reste sur le premier écran, comme sur un téléphone.
      if (element.getBoundingClientRect().width < window.innerWidth * 0.9) continue;
      element.setAttribute("data-fixe", "");
      element.style.position = "absolute";
    }
  });
  await page.waitForTimeout(400);
  const png = await page.screenshot({ fullPage: true });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll("[data-fixe]")) {
      element.style.position = "";
      element.removeAttribute("data-fixe");
    }
    for (const element of document.querySelectorAll("[data-apercu]")) element.style.display = "";
  });
  return png;
}

async function captures(fichierHtml) {
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({
    viewport: { width: LARGEUR, height: HAUTEUR },
    deviceScaleFactor: ECHELLE,
    isMobile: true,
    hasTouch: true,
    // Animations au repos : chaque élément est à sa place finale, comme une fois la page affichée.
    reducedMotion: "reduce",
    locale: "fr-FR",
  });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  const ecrans = [];
  const prendre = async (titre) => ecrans.push({ titre, png: await pleinePage(page) });
  const aller = async (chemin) => {
    await page.evaluate((c) => (location.hash = c), chemin);
    await page.waitForTimeout(1000);
  };

  await page.goto(`${pathToFileURL(fichierHtml).href}#/`);
  await page.waitForTimeout(1800);
  await prendre("Accueil");
  await aller("/collection");
  await prendre("Collection");
  await aller("/chaussure/nike-air-max-95-corteiz-kaki");
  await page.getByRole("radio", { name: "Pointure 43" }).click();
  await page.waitForTimeout(400);
  await prendre("Fiche produit");

  await page.getByRole("button", { name: "Commander" }).filter({ visible: true }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole("textbox", { name: "Nom complet" }).fill("Konan Ange");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("0708091011");
  await page.getByRole("combobox", { name: "Commune" }).selectOption("Cocody");
  await page.getByRole("textbox", { name: "Quartier" }).fill("Angré");
  await page.getByRole("textbox", { name: "Adresse précise" }).fill("Cité des arts, villa 4");
  await page.getByRole("textbox", { name: /Point de repère/ }).fill("Près de la pharmacie");
  await prendre("Commande");

  await page.getByRole("button", { name: /^Commander ·/ }).click();
  await page.waitForTimeout(2200);
  // L'écran de validation est une couche par-dessus la page : on le déplie pour le prendre en entier.
  await page.evaluate(() => {
    const couche = document.querySelector("[role=status]");
    Object.assign(couche.style, { position: "absolute", inset: "0 0 auto 0", height: "auto", overflow: "visible" });
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  ecrans.push({ titre: "Commande envoyée", png: await page.locator("[role=status]").screenshot() });
  await page.getByRole("link", { name: "Retour à la boutique" }).click();
  await page.waitForTimeout(800);
  await aller("/demande");
  await prendre("Sur demande");

  // Espace vendeur
  await aller("/admin/connexion");
  await prendre("Espace vendeur : connexion");
  await page.getByRole("textbox", { name: "Email" }).fill("angebattey.616@gmail.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("vertical");
  await page.getByRole("button", { name: /Se connecter/ }).click();
  await page.waitForTimeout(1500);
  await prendre("Chaussures");
  await page.getByRole("link", { name: /Gel-Kayano 14 Vert/ }).click();
  await page.waitForTimeout(1500);
  await prendre("Modifier une chaussure");
  await aller("/admin/commandes");
  await prendre("Commandes");
  await aller("/admin/numeros");
  await page.getByRole("button", { name: "Ajouter un numéro" }).click();
  await page.waitForTimeout(800);
  await prendre("Numéros WhatsApp");
  await aller("/admin/reglages");
  await prendre("Réglages");

  await navigateur.close();
  if (erreurs.length) throw new Error(`Erreurs pendant les captures : ${erreurs.join(" | ")}`);
  return ecrans;
}

export async function creerVersionMobile(fichierHtml, cheminPdf, { police, logoSvg }) {
  const ecrans = await captures(fichierHtml);
  const styles = [];
  const pages = [];
  for (const [i, { titre, png }] of ecrans.entries()) {
    const { height } = await sharp(png).metadata();
    const hauteur = surGrille(height / ECHELLE);
    // Les quelques pixels ajoutés en bas recopient la dernière ligne de l'écran : ils ne se voient pas.
    const jpeg = await sharp(png)
      .extend({ bottom: hauteur * ECHELLE - height, extendWith: "copy" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    styles.push(`@page e${i} { size: ${LARGEUR}px ${hauteur}px; margin: 0; } .e${i} { page: e${i}; }`);
    pages.push(
      `<section class="e${i}"><img alt="${titre}" style="display:block;width:${LARGEUR}px;height:${hauteur}px" ` +
        `src="data:image/jpeg;base64,${jpeg.toString("base64")}"></section>`,
    );
  }
  const mois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    @font-face { font-family: Archivo; src: url("${police}") format("woff2"); font-weight: 100 900; }
    @page couverture { size: ${LARGEUR}px ${surGrille(HAUTEUR)}px; margin: 0; }
    ${styles.join("\n")}
    html, body { margin: 0; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    section { break-after: page; overflow: hidden; }
    section:last-child { break-after: auto; }
    .couverture { page: couverture; width: ${LARGEUR}px; height: ${surGrille(HAUTEUR)}px; box-sizing: border-box; padding: 56px 40px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
      background: #2b3f14; color: #f6f5f0; font-family: Archivo, system-ui, sans-serif; }
    .logo { width: 76px; color: #f6f5f0; } .logo svg { display: block; width: 100%; height: auto; }
    .marque { margin: 22px 0 0; font-size: 13px; font-weight: 700; letter-spacing: .32em; text-transform: uppercase; }
    h1 { margin: 40px 0 0; font-size: 36px; line-height: 1.08; letter-spacing: -.025em; }
    .texte { margin: 14px 0 0; font-size: 16px; line-height: 1.45; color: rgb(246 245 240 / .78); }
    .date { margin-top: 48px; font-size: 13px; color: rgb(246 245 240 / .6); }
  </style></head><body>
    <section class="couverture">
      <div class="logo">${logoSvg}</div>
      <p class="marque">Vertical Store</p>
      <h1>Version mobile</h1>
      <p class="texte">Le site et l'espace vendeur, tels qu'ils s'affichent sur un téléphone. Faites défiler.</p>
      <p class="date">${mois.charAt(0).toUpperCase() + mois.slice(1)}</p>
    </section>
    ${pages.join("\n")}
  </body></html>`;

  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: cheminPdf, preferCSSPageSize: true, printBackground: true });
  await navigateur.close();
  return ecrans.length + 1;
}
