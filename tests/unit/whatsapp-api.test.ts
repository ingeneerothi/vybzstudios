import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { donneesVendeur, lireSaisie, passerCommande } from "@/lib/serveur/commande";
import { configWhatsappApi, envoyerAuVendeur, messageApi } from "@/lib/serveur/whatsappApi";
import type { Catalogue, ResultatCommande, SaisieCommande } from "@/lib/types";
import { FIN_MESSAGE_VENDEUR, messageCommande, messageVendeur, modeleMessageVendeur } from "@/lib/whatsapp";

const resultat: ResultatCommande = {
  code: "CMD-0042",
  chaussure: "Air Max 95 x Corteiz Kaki",
  pointure: 42,
  quantite: 1,
  prixUnitaire: 22000,
  zone: "Abidjan",
  fraisLivraison: 2000,
  total: 24000,
  modePaiement: "À la livraison",
  whatsapp: "2250506523816",
  intro: "Bonjour c'est Ange",
};
const saisie: SaisieCommande = {
  slug: "nike-air-max-95-corteiz-kaki",
  pointure: 42,
  quantite: 1,
  zoneId: "z-abidjan",
  nom: "Awa Koné",
  telephone: "07 08 09 10 11",
  commune: "Cocody",
  quartier: "Riviera 2",
  ville: "",
  adresse: "Rue des jardins, villa 12",
  repere: "",
};
const commande = {
  ...resultat,
  nom: "Awa Koné",
  telephone: "0708091011",
  lieu: "Cocody, Riviera 2",
  adresse: "Rue des jardins, villa 12",
  repere: "",
};
const config = { jeton: "jeton-test", numeroId: "1234567890", modele: "nouvelle_commande", langue: "fr" };

function catalogue(photo: string): Catalogue {
  return {
    chaussures: [{ slug: saisie.slug, images: [photo] }],
    zones: [{ id: "z-abidjan", nom: "Abidjan", frais: 2000, details: "commune_quartier" }],
  } as unknown as Catalogue;
}

describe("commande envoyée au vendeur par le site (API WhatsApp)", () => {
  it("modèle à créer chez Meta : 13 valeurs, ni au début ni à la fin du texte", () => {
    const modele = modeleMessageVendeur();
    for (let i = 1; i <= 13; i++) expect(modele.split(`{{${i}}}`)).toHaveLength(2);
    expect(modele).not.toContain("{{14}}");
    expect(modele.startsWith("🛒 NOUVELLE COMMANDE VERTICAL STORE — {{1}}")).toBe(true);
    expect(modele.endsWith(FIN_MESSAGE_VENDEUR)).toBe(true);
    expect(modele.length).toBeLessThan(1024);
  });

  it("le vendeur lit la commande du client, sans phrase d'en-tête ni lien", () => {
    const texte = messageVendeur(commande);
    expect(texte).toBe(`${messageCommande({ ...commande, intro: null })}\n\n${FIN_MESSAGE_VENDEUR}`);
    expect(texte).not.toMatch(/https?:|Bonjour c'est Ange/);
  });

  it("message pour l'API : la photo en en-tête, les valeurs du modèle dans l'ordre", () => {
    const m = messageApi(commande, "https://boutique.ci/chaussures/x/partage.jpg", "2250506523816", config);
    expect(m.to).toBe("2250506523816");
    expect(m.template.name).toBe("nouvelle_commande");
    expect(m.template.language.code).toBe("fr");
    expect(m.template.components[0]).toEqual({
      type: "header",
      parameters: [{ type: "image", image: { link: "https://boutique.ci/chaussures/x/partage.jpg" } }],
    });
    const valeurs = (m.template.components[1].parameters as { text: string }[]).map((p) => p.text);
    expect(valeurs).toHaveLength(13);
    expect(valeurs[0]).toBe("CMD-0042");
    expect(valeurs[8]).toBe("07 08 09 10 11");
    expect(valeurs[11]).toBe("—"); // repère vide
    // Remplir le modèle avec ces valeurs donne exactement le message du vendeur.
    const rempli = valeurs.reduce((texte, v, i) => texte.replace(`{{${i + 1}}}`, v), modeleMessageVendeur());
    expect(rempli).toBe(messageVendeur(commande));
  });

  it("aucune valeur sur plusieurs lignes (refusé par WhatsApp)", () => {
    const m = messageApi({ ...commande, adresse: "Rue 12\nvilla 4\tportail" }, "https://x/p.jpg", "225", config);
    const valeurs = (m.template.components[1].parameters as { text: string }[]).map((p) => p.text);
    expect(valeurs[10]).toBe("Rue 12 villa 4 portail");
  });

  it("réglages : rien sans jeton ni numéro, modèle et langue par défaut", () => {
    expect(configWhatsappApi({})).toBeNull();
    expect(configWhatsappApi({ WHATSAPP_JETON: "abc" })).toBeNull();
    expect(configWhatsappApi({ WHATSAPP_JETON: " abc ", WHATSAPP_NUMERO_ID: "123" })).toEqual({
      jeton: "abc",
      numeroId: "123",
      modele: "nouvelle_commande",
      langue: "fr",
    });
  });

  it("envoie à l'API de Meta, avec le jeton ; une erreur de l'API remonte", async () => {
    const envoyer = vi.fn(async () => new Response("{}", { status: 200 }));
    await envoyerAuVendeur(commande, "https://x/p.jpg", "2250506523816", config, envoyer);
    const [adresse, options] = envoyer.mock.calls[0] as unknown as [string, RequestInit];
    expect(adresse).toBe("https://graph.facebook.com/v23.0/1234567890/messages");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer jeton-test");
    expect(JSON.parse(options.body as string).type).toBe("template");

    const refus = vi.fn(
      async () => new Response('{"error":{"message":"Template name does not exist"}}', { status: 404 }),
    );
    await expect(envoyerAuVendeur(commande, "https://x/p.jpg", "225", config, refus)).rejects.toThrow(
      /404.*Template name does not exist/,
    );
  });

  it("photo : image de partage de la chaussure en adresse complète, sinon le logo", () => {
    expect(donneesVendeur(resultat, saisie, catalogue("/chaussures/nike-air-max-95-corteiz-kaki/01.webp")).photo).toBe(
      "http://localhost:3000/chaussures/nike-air-max-95-corteiz-kaki/partage.jpg",
    );
    expect(
      donneesVendeur(resultat, saisie, catalogue("https://abc.supabase.co/storage/v1/object/public/produits/7/a.webp"))
        .photo,
    ).toBe("https://abc.supabase.co/storage/v1/object/public/produits/7/partage.jpg");
    expect(donneesVendeur(resultat, saisie, catalogue("data:image/webp;base64,AAAA")).photo).toBe(
      "http://localhost:3000/icones/icone-512.png",
    );
  });

  it("le message du vendeur reprend le lieu et le numéro du client", () => {
    const { donnees } = donneesVendeur(resultat, saisie, catalogue("/chaussures/x/01.webp"));
    expect(donnees.lieu).toBe("Cocody, Riviera 2");
    expect(donnees.telephone).toBe("0708091011");
    expect(messageVendeur(donnees)).toContain("📞 Numéro : 07 08 09 10 11");
  });

  it("formulaire reçu : refusé s'il manque un champ", () => {
    expect(lireSaisie(saisie)).toEqual(saisie);
    expect(lireSaisie({ ...saisie, pointure: "42" })).toBeNull();
    expect(lireSaisie({ ...saisie, nom: undefined })).toBeNull();
    expect(lireSaisie(null)).toBeNull();
  });

  it("sans base branchée (démo), le serveur ne prend pas de commande", async () => {
    expect((await passerCommande(saisie)).statut).toBe(503);
  });

  it("le guide de mise en ligne donne exactement le texte du modèle", () => {
    expect(readFileSync("MISE-EN-LIGNE.md", "utf8")).toContain(modeleMessageVendeur());
  });
});
