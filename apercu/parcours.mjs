// Visite guidée de l'aperçu, au rythme d'une personne : sert à filmer la vidéo et à prendre les
// écrans affichés quand le fichier est ouvert sans JavaScript (aperçu WhatsApp, fichiers du téléphone…).
//
// `ecran(nom, legende)` est appelé aux moments clés ; `pause(ms)` laisse le temps de regarder.

/** Un rond discret là où l'on touche l'écran, pour suivre la vidéo. */
async function toucher(page, cible) {
  await cible.scrollIntoViewIfNeeded();
  const boite = await cible.boundingBox();
  if (boite) {
    await page.evaluate(
      ({ x, y }) => {
        const rond = document.createElement("div");
        rond.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;background:rgb(13 14 11 / .18);border:2px solid rgb(255 255 255 / .7);z-index:2147483647;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out`;
        document.body.append(rond);
        requestAnimationFrame(() => {
          rond.style.transform = "scale(1.6)";
          rond.style.opacity = "0";
        });
        setTimeout(() => rond.remove(), 600);
      },
      { x: boite.x + boite.width / 2, y: boite.y + boite.height / 2 },
    );
    await page.waitForTimeout(160);
  }
  await cible.click();
}

/** Carton plein écran aux couleurs de la marque, entre deux parties de la visite. */
async function carton(page, titre, sousTitre, duree) {
  await page.evaluate(
    ({ titre, sousTitre }) => {
      const div = document.createElement("div");
      div.id = "carton-visite";
      div.style.cssText =
        "position:fixed;inset:0;z-index:2147483646;display:grid;place-content:center;gap:10px;text-align:center;background:#2b3f14;color:#f6f5f0;opacity:0;transition:opacity .4s ease";
      div.innerHTML = `<div style="font-size:30px;font-weight:700;letter-spacing:-.02em">${titre}</div><div style="font-size:16px;opacity:.75">${sousTitre}</div>`;
      document.body.append(div);
      requestAnimationFrame(() => (div.style.opacity = "1"));
    },
    { titre, sousTitre },
  );
  await page.waitForTimeout(duree);
  await page.evaluate(() => {
    const div = document.getElementById("carton-visite");
    if (!div) return;
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 450);
  });
  await page.waitForTimeout(450);
}

async function defiler(page, y, duree = 1200) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), y);
  await page.waitForTimeout(duree);
}

export async function parcourir(page, { ecran, pause }) {
  // Site client
  await pause(3600); // logo, puis la chaussure se pose
  await ecran("accueil", "Accueil : le logo apparaît, puis la chaussure vedette se pose");
  await defiler(page, 900, 1800);
  await pause(900);
  await ecran("nouveautes", "Accueil : les nouveautés");
  await defiler(page, 0, 1200);
  await toucher(page, page.getByRole("link", { name: /Voir la collection/ }).first());
  await pause(1500);
  await ecran("collection", "Collection : filtres par marque, prix et pointure");
  await defiler(page, 500, 1400);
  await toucher(page, page.getByRole("link", { name: /Air Max 95 x Corteiz Kaki/ }).first());
  await pause(1800);
  await ecran("fiche", "Fiche produit : on glisse pour voir tous les angles");

  const photo = page.locator("img[alt*='vue 1']").first();
  const boite = await photo.boundingBox();
  if (boite) {
    for (let i = 0; i < 2; i++) {
      await page.mouse.move(boite.x + boite.width * 0.82, boite.y + boite.height / 2);
      await page.mouse.down();
      await page.mouse.move(boite.x + boite.width * 0.18, boite.y + boite.height / 2, { steps: 14 });
      await page.mouse.up();
      await pause(1300);
    }
  }
  await toucher(page, page.getByRole("radio", { name: "Pointure 43" }));
  await pause(1100);
  await ecran("pointure", "Pointures : seules celles en stock se choisissent");
  await toucher(page, page.getByRole("button", { name: "Commander" }).filter({ visible: true }).first());
  await pause(1500);

  const ecrire = async (nom, texte) => {
    const champ = page.getByRole("textbox", { name: nom });
    await toucher(page, champ);
    await champ.pressSequentially(texte, { delay: 55 });
  };
  await ecrire("Nom complet", "Konan Ange");
  await ecrire("Numéro de téléphone", "0708091011");
  await page.getByRole("combobox", { name: "Commune" }).scrollIntoViewIfNeeded();
  await page.getByRole("combobox", { name: "Commune" }).selectOption("Cocody");
  await pause(500);
  await ecrire("Quartier", "Angré");
  await ecrire("Adresse précise", "Cité des arts, villa 4");
  await page.getByTestId("total").scrollIntoViewIfNeeded();
  await pause(1500);
  await ecran("commande", "Commande en une page : le total se calcule tout seul");
  await toucher(page, page.getByRole("button", { name: /^Commander ·/ }));
  await pause(3200);
  await ecran("validation", "Le client arrive sur WhatsApp avec sa commande, photo de la chaussure comprise");
  await pause(1500);
  await toucher(page, page.getByRole("link", { name: "Retour à la boutique" }));
  await pause(1200);
  await toucher(page, page.getByRole("link", { name: "Sur demande" }).first());
  await pause(1600);
  await ecran("demande", "« Sur demande » : le client envoie la photo d'un modèle introuvable");

  // Espace vendeur
  await carton(page, "L'espace vendeur", "Sur le téléphone du vendeur, comme une application", 1900);
  await page.evaluate(() => (location.hash = "/admin/connexion"));
  await pause(1300);
  await ecran("connexion", "Espace vendeur : connexion réservée au vendeur");
  await ecrire("Email", "angebattey.616@gmail.com");
  const motDePasse = page.getByLabel("Mot de passe", { exact: true });
  await toucher(page, motDePasse);
  await motDePasse.pressSequentially("vertical", { delay: 55 });
  await toucher(page, page.getByRole("button", { name: /Se connecter/ }));
  await pause(1600);
  await ecran("chaussures", "Chaussures : ajouter, modifier, mettre en rupture d'un geste");
  await toucher(page, page.getByRole("switch", { name: "Zoom Vomero 5 Triple Noir en stock" }));
  await pause(1300);
  await toucher(page, page.getByRole("link", { name: "Commandes" }));
  await pause(1800);
  await ecran("commandes", "Commandes : la commande du client est arrivée");
  await toucher(page, page.getByRole("radio", { name: /Envoyée au livreur/ }).first());
  await pause(1300);
  await toucher(page, page.getByRole("link", { name: "Numéros" }));
  await pause(1700);
  await ecran("numeros", "Numéros WhatsApp : un seul reçoit les commandes, on change d'un toucher");
  await toucher(page, page.getByRole("button", { name: "Ajouter un numéro" }));
  await pause(900);
  await page
    .getByRole("textbox", { name: /Phrase au début des commandes/ })
    .evaluate((champ) => champ.scrollIntoView({ block: "center", behavior: "smooth" }));
  await pause(1800);
  await ecran("numero-autre", "Autre numéro (livreur, frère…) : ses commandes commencent par « Bonjour c'est Ange »");
  await toucher(page, page.getByRole("button", { name: "Annuler" }));
  await pause(900);
  await toucher(page, page.getByRole("link", { name: "Réglages" }));
  await pause(1500);
  await ecran("reglages", "Réglages : zones et frais de livraison, slogan, chaussure vedette");
  await defiler(page, 600, 1500);
  await pause(800);
  await carton(page, "Vertical Store", "Aperçu du site et de l'espace vendeur", 2200);
}
