import { type Page, expect, test } from "@playwright/test";

const NUMERO_ACTIF = "2250506523816";

/** Intercepte l'ouverture de WhatsApp et renvoie le numéro et le message pré-rempli. */
async function capturerWhatsapp(page: Page): Promise<() => Promise<{ numero: string; message: string }>> {
  await page.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "WhatsApp" }),
  );
  const requete = page.waitForRequest((r) => r.url().startsWith("https://wa.me/"), { timeout: 15_000 });
  return async () => {
    const url = new URL((await requete).url());
    return { numero: url.pathname.slice(1), message: url.searchParams.get("text") ?? "" };
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("catalogue → produit → pointure → commande → message WhatsApp", async ({ page }) => {
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Collection", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Air Force 1 Triple Noir/ }).click();

  await expect(page.getByRole("heading", { name: "Air Force 1 Triple Noir", level: 1 })).toBeVisible();
  await expect(page.getByText("13 000 FCFA").first()).toBeVisible();

  // Sans pointure, le bouton rappelle de la choisir.
  await page.getByRole("button", { name: "Commander" }).filter({ visible: true }).first().click();
  await expect(page.getByText("Choisissez votre pointure pour commander.")).toBeVisible();

  await page.getByRole("radio", { name: "Pointure 42" }).click();
  await page.getByRole("button", { name: "Commander" }).filter({ visible: true }).first().click();

  await expect(page).toHaveURL(/\/commander\/nike-air-force-1-noir\?pointure=42/);
  await expect(page.getByRole("heading", { name: "Commande" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Pointure" })).toHaveValue("42");

  // Formulaire vide : les erreurs s'affichent en français.
  await page.getByRole("button", { name: /^Commander/ }).click();
  await expect(page.getByText("Indiquez votre nom complet.")).toBeVisible();
  await expect(page.getByText(/Numéro invalide/)).toBeVisible();

  await page.getByRole("textbox", { name: "Nom complet" }).fill("Awa Koné");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("0708091011");
  await expect(page.getByRole("textbox", { name: "Numéro de téléphone" })).toHaveValue("07 08 09 10 11");
  await page.getByRole("combobox", { name: "Commune" }).selectOption("Cocody");
  await page.getByRole("textbox", { name: "Quartier" }).fill("Riviera 2");
  await page.getByRole("textbox", { name: "Adresse précise" }).fill("Rue des jardins, villa 12");
  await page.getByRole("textbox", { name: /Point de repère/ }).fill("Près de la pharmacie");
  await expect(page.getByTestId("total")).toHaveText("15 000 FCFA");

  const whatsapp = await capturerWhatsapp(page);
  await page.getByRole("button", { name: /^Commander · 15 000 FCFA/ }).click();
  await expect(page.getByRole("heading", { name: "Commande enregistrée" })).toBeVisible();
  await expect(page.getByText("CMD-0001")).toBeVisible();

  const { numero, message } = await whatsapp();
  expect(numero).toBe(NUMERO_ACTIF);
  expect(message.split("\n")).toEqual([
    "🛒 NOUVELLE COMMANDE VERTICAL STORE — CMD-0001",
    "👟 Chaussure : Air Force 1 Triple Noir",
    `🖼️ Photo : ${new URL(page.url()).origin}/chaussure/nike-air-force-1-noir`,
    "📏 Pointure : 42",
    "🔢 Quantité : 1",
    "💰 Prix : 13 000 FCFA",
    "🚚 Livraison : Abidjan (2 000 FCFA)",
    "✅ TOTAL : 15 000 FCFA",
    "👤 Nom : Awa Koné",
    "📞 Numéro : 07 08 09 10 11",
    "📍 Lieu : Cocody, Riviera 2",
    "🏠 Adresse : Rue des jardins, villa 12",
    "🧭 Repère : Près de la pharmacie",
    "💳 Paiement : À la livraison",
  ]);
});

test("expédition, deux paires : frais et total corrects", async ({ page }) => {
  await page.goto("/commander/asics-gel-nyc-marine?pointure=44");
  await expect(page.getByRole("combobox", { name: "Pointure" })).toHaveValue("44");
  await page.getByRole("button", { name: "Une paire de plus" }).click();
  await page.getByRole("textbox", { name: "Nom complet" }).fill("Yao Kouassi");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("+225 05 44 33 22 11");
  await page
    .getByRole("combobox", { name: "Zone de livraison" })
    .selectOption({ label: "Expédition à l'intérieur du pays — 3 000 FCFA" });
  await page.getByRole("textbox", { name: "Ville" }).fill("Bouaké");
  await page.getByRole("textbox", { name: "Adresse précise" }).fill("Quartier Commerce, gare UTB");
  await expect(page.getByTestId("total")).toHaveText("47 000 FCFA");

  const whatsapp = await capturerWhatsapp(page);
  await page.getByRole("button", { name: /^Commander/ }).click();
  const { message } = await whatsapp();
  expect(message).toContain("👟 Chaussure : Gel-NYC Marine");
  expect(message).toContain("💰 Prix : 22 000 FCFA × 2 = 44 000 FCFA");
  expect(message).toContain("🚚 Livraison : Expédition à l'intérieur du pays (3 000 FCFA)");
  expect(message).toContain("✅ TOTAL : 47 000 FCFA");
  expect(message).toContain("📍 Lieu : Bouaké (expédition)");
  expect(message).toContain("📞 Numéro : 05 44 33 22 11");
  expect(message).toContain("🧭 Repère : —");
});

test("demande d'article avec photo", async ({ page }) => {
  await page.goto("/demande");
  await expect(page.getByRole("heading", { name: "Vous ne trouvez pas votre chaussure ?" })).toBeVisible();
  // Petite image PNG valide (2×2 px) en guise de photo.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.locator("input[type=file]").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("img", { name: "Photo choisie" })).toBeVisible();
  await page.getByRole("combobox", { name: "Pointure" }).selectOption("43");
  await page.getByRole("textbox", { name: "Nom complet" }).fill("Yao Kouassi");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("0102030405");
  await page.getByRole("textbox", { name: "Lieu de livraison" }).fill("Yopougon, Selmer");
  await page.getByRole("textbox", { name: /Commentaire/ }).fill("La même en blanc");

  const whatsapp = await capturerWhatsapp(page);
  await page.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(page.getByRole("heading", { name: "Demande envoyée" })).toBeVisible();
  const { numero, message } = await whatsapp();
  expect(numero).toBe(NUMERO_ACTIF);
  const lignes = message.split("\n");
  expect(lignes[0]).toBe("📸 DEMANDE D'ARTICLE NON DISPONIBLE SUR LE SITE — DEM-0001");
  expect(lignes[1]).toBe("Je veux cet article.");
  expect(lignes).toContain("📏 Pointure : 43");
  expect(lignes).toContain("👤 Nom : Yao Kouassi");
  expect(lignes).toContain("📍 Lieu : Yopougon, Selmer");
  expect(lignes).toContain("💬 Commentaire : La même en blanc");
});

test("admin (démo) : connexion, rupture, numéro actif utilisé par la commande suivante", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/connexion/);
  await page.getByRole("textbox", { name: "Email" }).fill("angebattey.616@gmail.com");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Chaussures", level: 1 })).toBeVisible();
  await page.getByRole("switch", { name: "P-6000 Argent en stock" }).click();
  await expect(page.getByText("Mise en rupture ✅")).toBeVisible();

  await page.getByRole("link", { name: "Numéros" }).click();
  await page.getByRole("button", { name: "Ajouter un numéro" }).click();
  await page.getByRole("textbox", { name: /^Nom \(/ }).fill("Livreur");
  await page.getByRole("textbox", { name: "Numéro WhatsApp" }).fill("07 00 00 00 01");
  // Numéro autre que le principal : la phrase « Bonjour c'est Ange » est proposée d'office.
  await expect(page.getByRole("textbox", { name: /Phrase au début des commandes/ })).toHaveValue("Bonjour c'est Ange");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Numéro ajouté ✅")).toBeVisible();
  await page.getByRole("button", { name: "Activer" }).click();
  await expect(page.getByText(/Numéro activé ✅/)).toBeVisible();
  await expect(page.getByText("En ce moment : Livreur")).toBeVisible();
  await expect(page.getByText("Commandes précédées de « Bonjour c'est Ange »")).toBeVisible();

  // Le numéro actif ne peut pas être supprimé.
  await expect(
    page.getByRole("listitem").filter({ hasText: "Actif" }).getByRole("button", { name: "Supprimer" }),
  ).toBeDisabled();

  await page.goto("/commander/nike-air-force-1-noir?pointure=41");
  await page.getByRole("textbox", { name: "Nom complet" }).fill("Awa Koné");
  await page.getByRole("textbox", { name: "Numéro de téléphone" }).fill("0708091011");
  await page.getByRole("combobox", { name: "Commune" }).selectOption("Marcory");
  await page.getByRole("textbox", { name: "Quartier" }).fill("Zone 4");
  await page.getByRole("textbox", { name: "Adresse précise" }).fill("Rue du Canal");
  const whatsapp = await capturerWhatsapp(page);
  await page.getByRole("button", { name: /^Commander/ }).click();
  const { numero, message } = await whatsapp();
  expect(numero).toBe("2250700000001");
  expect(message.split("\n").slice(0, 3)).toEqual([
    "Bonjour c'est Ange",
    "",
    "🛒 NOUVELLE COMMANDE VERTICAL STORE — CMD-0001",
  ]);

  await page.goto("/admin/commandes");
  await expect(page.getByText("CMD-0001")).toBeVisible();
  await page.getByRole("radio", { name: "Envoyée au livreur" }).click();
  await expect(page.getByText("CMD-0001 : Envoyée au livreur ✅")).toBeVisible();
});
