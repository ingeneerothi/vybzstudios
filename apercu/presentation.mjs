// Présentation PDF de l'aperçu : couverture, un écran par page (format téléphone), récapitulatif.
// Un PDF s'ouvre partout, y compris dans WhatsApp : c'est la version la plus sûre à envoyer à un client.
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const VENDEUR = new Set(["connexion", "chaussures", "commandes", "numeros", "numero-autre", "reglages"]);

const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** « Accueil : le logo apparaît… » -> titre « Accueil », texte « Le logo apparaît… ». */
function decouper(legende) {
  const i = legende.indexOf(" : ");
  if (i < 0) return { titre: legende, texte: "" };
  const texte = legende.slice(i + 3);
  return { titre: legende.slice(0, i), texte: texte.charAt(0).toUpperCase() + texte.slice(1) };
}

export async function creerPresentation(captures, cheminPdf, { police, logoSvg }) {
  const site = captures.filter((c) => !VENDEUR.has(c.nom));
  const vendeur = captures.filter((c) => VENDEUR.has(c.nom));
  const mois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());

  const pageEcran = async (c, partie, rang, total) => {
    const jpeg = await sharp(c.png).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    const { titre, texte } = decouper(c.legende);
    return `<section class="page">
      <p class="sur-titre">${partie} · ${rang}/${total}</p>
      <h2>${echapper(titre)}</h2>
      ${texte ? `<p class="texte">${echapper(texte)}</p>` : ""}
      <div class="ecran"><img src="data:image/jpeg;base64,${jpeg.toString("base64")}" alt=""></div>
    </section>`;
  };

  const pages = [];
  for (const [i, c] of site.entries()) pages.push(await pageEcran(c, "Site client", i + 1, site.length));
  for (const [i, c] of vendeur.entries()) pages.push(await pageEcran(c, "Espace vendeur", i + 1, vendeur.length));

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    @font-face { font-family: Archivo; src: url("${police}") format("woff2"); font-weight: 100 900; }
    @page { size: 540px 960px; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: Archivo, system-ui, sans-serif; color: #0d0e0b; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { width: 540px; height: 960px; overflow: hidden; break-after: page; background: #f6f5f0;
      display: flex; flex-direction: column; align-items: center; padding: 44px 40px 0; text-align: center; }
    .page:last-child { break-after: auto; }
    .sur-titre { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #3e5a1f; }
    h2 { margin: 10px 0 0; font-size: 28px; line-height: 1.12; letter-spacing: -.02em; }
    .texte { margin: 8px 0 0; font-size: 16px; line-height: 1.45; color: #63635a; max-width: 400px; }
    .ecran { margin-top: auto; margin-bottom: -40px; width: 372px; aspect-ratio: 390 / 844; border-radius: 34px 34px 0 0;
      overflow: hidden; border: 7px solid #0d0e0b; border-bottom: 0; box-shadow: 0 24px 60px rgb(0 0 0 / .18); background: #0d0e0b; }
    .ecran img { display: block; width: 100%; height: auto; }
    .couverture, .fin { background: #2b3f14; color: #f6f5f0; justify-content: center; padding: 64px 56px; }
    .couverture .logo { width: 92px; color: #f6f5f0; }
    .couverture .logo svg { width: 100%; height: auto; display: block; }
    .marque { margin: 26px 0 0; font-size: 15px; font-weight: 700; letter-spacing: .32em; text-transform: uppercase; }
    .couverture h1 { margin: 44px 0 0; font-size: 40px; line-height: 1.08; letter-spacing: -.025em; }
    .couverture .texte, .fin .texte { color: rgb(246 245 240 / .78); }
    .couverture .date { margin-top: 56px; font-size: 14px; color: rgb(246 245 240 / .6); }
    .fin h2 { font-size: 32px; }
    .fin ul { list-style: none; margin: 34px 0 0; padding: 0; text-align: left; display: grid; gap: 16px; max-width: 400px; }
    .fin li { position: relative; padding-left: 30px; font-size: 17px; line-height: 1.4; }
    .fin li::before { content: ""; position: absolute; left: 0; top: 6px; width: 14px; height: 14px; border-radius: 50%; background: #c8dd92; }
  </style></head><body>
    <section class="page couverture">
      <div class="logo">${logoSvg}</div>
      <p class="marque">Vertical Store</p>
      <h1>Aperçu du site<br>et de l'espace vendeur</h1>
      <p class="texte">Le site où vos clients choisissent et commandent, et l'application où vous gérez la boutique.</p>
      <p class="date">${mois.charAt(0).toUpperCase() + mois.slice(1)}</p>
    </section>
    ${pages.join("\n")}
    <section class="page fin">
      <h2>En résumé</h2>
      <ul>
        <li>Le client choisit sa paire et sa pointure, puis commande en une minute.</li>
        <li>La commande arrive sur votre WhatsApp, prête à transférer au livreur.</li>
        <li>Frais de livraison ajoutés tout seuls : Abidjan, Grand-Bassam, Songon, intérieur du pays.</li>
        <li>Depuis votre téléphone : ajouter une chaussure, faire une promo, mettre en rupture.</li>
        <li>Un client ne trouve pas son modèle ? Il envoie une photo, vous recevez la demande.</li>
      </ul>
    </section>
  </body></html>`;

  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: cheminPdf, preferCSSPageSize: true, printBackground: true });
  await navigateur.close();
  return { pages: pages.length + 2 };
}

/** Logo de la marque (SVG en currentColor) pour la couverture. */
export function lireLogo(chemin) {
  return readFileSync(chemin, "utf8").replace(/<\?xml[^>]*>/, "");
}
