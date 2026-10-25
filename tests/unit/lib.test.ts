import { describe, expect, it } from "vitest";
import { genererDescription } from "@/lib/admin/description";
import { creerSlug } from "@/lib/admin/slug";
import { marquerNouveautes } from "@/lib/donnees/nouveautes";
import { imagePartage } from "@/lib/partage";
import { formatPrix, formatPrixTexte, libellePaiement } from "@/lib/format";
import {
  estEnRupture,
  pointuresDisponibles,
  pourcentageRemise,
  prixActuel,
  prixDepuisPourcentage,
  promoActive,
} from "@/lib/prix";
import {
  afficherNumeroWhatsapp,
  formaterSaisieTelephone,
  formaterTelephone,
  normaliserNumeroWhatsapp,
  normaliserTelephone,
} from "@/lib/telephone";
import type { Chaussure } from "@/lib/types";
import { decrireLieu, lienWhatsapp, messageCommande, messageDemande } from "@/lib/whatsapp";

const NBSP = " ";

function chaussure(c: Partial<Chaussure> = {}): Chaussure {
  return {
    id: "1",
    slug: "test",
    nom: "Test",
    marque: "Nike",
    couleur: "Noir",
    description: "",
    prix: 22000,
    prixPromo: null,
    finPromo: null,
    promoEnCours: false,
    enStock: true,
    images: [],
    pointures: [39, 40, 41].map((pointure) => ({ pointure, enStock: true })),
    creeLe: "2026-10-01T00:00:00.000Z",
    nouveau: false,
    ...c,
  };
}

describe("prix", () => {
  it("affiche les FCFA avec un espace pour les milliers", () => {
    expect(formatPrix(25000)).toBe(`25${NBSP}000${NBSP}FCFA`);
    expect(formatPrix(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
    expect(formatPrixTexte(2000)).toBe("2 000 FCFA");
    expect(formatPrixTexte(800)).toBe("800 FCFA");
  });

  it("écrit le mode de paiement dans une phrase sans abîmer les noms propres", () => {
    expect(libellePaiement("À la livraison")).toBe("à la livraison");
    expect(libellePaiement("À la livraison ou Wave")).toBe("à la livraison ou Wave");
    expect(libellePaiement("Wave")).toBe("Wave");
    expect(libellePaiement("Orange Money")).toBe("Orange Money");
  });

  it("applique la promo seulement si elle est valide et pas terminée", () => {
    const maintenant = Date.parse("2026-10-24T12:00:00Z");
    expect(prixActuel(chaussure({ prixPromo: 18000 }), maintenant)).toBe(18000);
    expect(prixActuel(chaussure({ prixPromo: 18000, finPromo: "2026-10-25T00:00:00Z" }), maintenant)).toBe(18000);
    expect(prixActuel(chaussure({ prixPromo: 18000, finPromo: "2026-10-24T11:59:00Z" }), maintenant)).toBe(22000);
    expect(promoActive(chaussure({ prixPromo: 25000 }), maintenant)).toBe(false);
    expect(pourcentageRemise(chaussure({ prixPromo: 17600 }))).toBe(20);
    expect(prixDepuisPourcentage(22000, 20)).toBe(17600);
    expect(prixDepuisPourcentage(21000, 15)).toBe(17900);
  });

  it("calcule les pointures disponibles et la rupture", () => {
    const c = chaussure({
      pointures: [
        { pointure: 39, enStock: false },
        { pointure: 40, enStock: true },
      ],
    });
    expect(pointuresDisponibles(c)).toEqual([40]);
    expect(estEnRupture(c)).toBe(false);
    expect(estEnRupture({ ...c, enStock: false })).toBe(true);
    expect(estEnRupture(chaussure({ pointures: [{ pointure: 39, enStock: false }] }))).toBe(true);
  });
});

describe("téléphone ivoirien", () => {
  it("accepte les formats courants", () => {
    expect(normaliserTelephone("07 08 09 10 11")).toBe("0708091011");
    expect(normaliserTelephone("+225 05 06 52 38 16")).toBe("0506523816");
    expect(normaliserTelephone("002250102030405")).toBe("0102030405");
    expect(normaliserTelephone("27 22 44 55 66")).toBe("2722445566");
  });

  it("refuse les numéros invalides", () => {
    expect(normaliserTelephone("0708")).toBeNull();
    expect(normaliserTelephone("0908091011")).toBeNull();
    expect(normaliserTelephone("+33 6 12 34 56 78")).toBeNull();
  });

  it("met en forme pendant la saisie", () => {
    expect(formaterSaisieTelephone("0708091011")).toBe("07 08 09 10 11");
    expect(formaterSaisieTelephone("07080910119999")).toBe("07 08 09 10 11");
    expect(formaterSaisieTelephone("+2250708091011")).toBe("+225 07 08 09 10 11");
    expect(formaterTelephone("0506523816")).toBe("05 06 52 38 16");
  });

  it("normalise les numéros de réception WhatsApp", () => {
    expect(normaliserNumeroWhatsapp("05 06 52 38 16")).toBe("2250506523816");
    expect(normaliserNumeroWhatsapp("+225 05 06 52 38 16")).toBe("2250506523816");
    expect(normaliserNumeroWhatsapp("2250506523816")).toBe("2250506523816");
    expect(normaliserNumeroWhatsapp("+33 6 12 34 56 78")).toBe("33612345678");
    expect(normaliserNumeroWhatsapp("06 12 34 56 78")).toBeNull();
    expect(afficherNumeroWhatsapp("2250506523816")).toBe("+225 05 06 52 38 16");
  });
});

describe("messages WhatsApp", () => {
  const commande = {
    code: "CMD-0042",
    chaussure: "Air Max 95 x Corteiz Kaki",
    pointure: 42,
    quantite: 1,
    prixUnitaire: 20000,
    zone: "Abidjan",
    fraisLivraison: 2000,
    total: 22000,
    modePaiement: "À la livraison",
    whatsapp: "2250506523816",
    nom: "Awa Koné",
    telephone: "0708091011",
    lieu: "Cocody, Riviera 2",
    adresse: "Rue des jardins, villa 12",
    repere: "Près de la pharmacie",
  };

  it("suit exactement le format demandé", () => {
    expect(messageCommande(commande)).toBe(
      [
        "🛒 NOUVELLE COMMANDE VERTICAL STORE — CMD-0042",
        "👟 Chaussure : Air Max 95 x Corteiz Kaki",
        "📏 Pointure : 42",
        "🔢 Quantité : 1",
        "💰 Prix : 20 000 FCFA",
        "🚚 Livraison : Abidjan (2 000 FCFA)",
        "✅ TOTAL : 22 000 FCFA",
        "👤 Nom : Awa Koné",
        "📞 Numéro : 07 08 09 10 11",
        "📍 Lieu : Cocody, Riviera 2",
        "🏠 Adresse : Rue des jardins, villa 12",
        "🧭 Repère : Près de la pharmacie",
        "💳 Paiement : À la livraison",
      ].join("\n"),
    );
  });

  it("commence par la phrase du numéro qui reçoit, sans lien", () => {
    const lignes = messageCommande({ ...commande, intro: "Bonjour c'est Ange" }).split("\n");
    expect(lignes.slice(0, 4)).toEqual([
      "Bonjour c'est Ange",
      "",
      "🛒 NOUVELLE COMMANDE VERTICAL STORE — CMD-0042",
      "👟 Chaussure : Air Max 95 x Corteiz Kaki",
    ]);
    expect(lignes.join("\n")).not.toMatch(/https?:/);
    // Numéro principal : pas de phrase.
    expect(messageCommande({ ...commande, intro: null }).startsWith("🛒")).toBe(true);
  });

  it("place l'image d'aperçu des liens à côté de la photo principale", () => {
    expect(imagePartage("/chaussures/nike-air-force-1-noir/01.webp")).toBe(
      "/chaussures/nike-air-force-1-noir/partage.jpg",
    );
    expect(imagePartage("https://abc.supabase.co/storage/v1/object/public/produits/42/9f.webp")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/produits/42/partage.jpg",
    );
    expect(imagePartage("data:image/webp;base64,AAAA")).toBeNull();
    expect(imagePartage(undefined)).toBeNull();
  });

  it("détaille le prix quand il y a plusieurs paires", () => {
    const m = messageCommande({ ...commande, quantite: 2, total: 42000, repere: "" });
    expect(m).toContain("💰 Prix : 20 000 FCFA × 2 = 40 000 FCFA");
    expect(m).toContain("🧭 Repère : —");
  });

  it("décrit le lieu selon la zone", () => {
    expect(decrireLieu("Abidjan", { details: "commune_quartier", commune: "Yopougon", quartier: "Selmer" })).toBe(
      "Yopougon, Selmer",
    );
    expect(decrireLieu("Grand-Bassam", { details: "quartier", quartier: "Mockeyville" })).toBe(
      "Grand-Bassam, Mockeyville",
    );
    expect(decrireLieu("Expédition", { details: "ville", ville: "Bouaké" })).toBe("Bouaké (expédition)");
  });

  it("construit le lien wa.me vers le numéro actif", () => {
    const lien = lienWhatsapp("2250506523816", "Bonjour\nTOTAL : 22 000 FCFA");
    expect(lien).toBe("https://wa.me/2250506523816?text=Bonjour%0ATOTAL%20%3A%2022%20000%20FCFA");
  });

  it("formate la demande d'article", () => {
    const m = messageDemande({
      code: "DEM-0007",
      photoUrl: "https://exemple.supabase.co/storage/v1/object/public/demandes/abc.webp",
      pointure: "43",
      nom: "Yao",
      telephone: "0102030405",
      lieu: "Yopougon",
      commentaire: "",
    });
    expect(m.split("\n")).toEqual([
      "📸 DEMANDE D'ARTICLE NON DISPONIBLE SUR LE SITE — DEM-0007",
      "Je veux cet article.",
      "🖼️ Photo : https://exemple.supabase.co/storage/v1/object/public/demandes/abc.webp",
      "📏 Pointure : 43",
      "👤 Nom : Yao",
      "📞 Numéro : 01 02 03 04 05",
      "📍 Lieu : Yopougon",
      "💬 Commentaire : —",
    ]);
  });
});

describe("admin", () => {
  it("crée des adresses de page propres et uniques", () => {
    expect(creerSlug("Nike", "Air Max 95 x Corteiz « Kaki »")).toBe("nike-air-max-95-x-corteiz-kaki");
    expect(creerSlug("ASICS", "Gel-Kayano 14 Été", ["asics-gel-kayano-14-ete"])).toBe("asics-gel-kayano-14-ete-2");
  });

  it("génère une description simple et sans fausse promesse", () => {
    const d = genererDescription({ nom: "Gel-Kayano 14", marque: "ASICS", couleur: "Blanc / vert" });
    expect(d).toMatch(/^La Gel-Kayano 14 de ASICS en blanc \/ vert\./);
    expect(d.split(".").filter((p) => p.trim()).length).toBeLessThanOrEqual(3);
    expect(genererDescription({ nom: "Gel-Kayano 14", marque: "ASICS", couleur: "" }, 1)).not.toBe(d);
  });

  it("marque les 6 dernières nouveautés de moins de 30 jours", () => {
    const maintenant = Date.parse("2026-10-24T00:00:00Z");
    const liste = Array.from({ length: 8 }, (_, i) =>
      chaussure({ id: String(i), creeLe: new Date(maintenant - i * 86400000).toISOString() }),
    );
    liste.push(chaussure({ id: "vieille", creeLe: "2026-01-01T00:00:00Z" }));
    const resultat = marquerNouveautes(liste, maintenant);
    expect(resultat.filter((c) => c.nouveau).map((c) => c.id)).toEqual(["0", "1", "2", "3", "4", "5"]);
    const anciennes = marquerNouveautes([chaussure({ id: "a", creeLe: "2026-01-01T00:00:00Z" })], maintenant);
    expect(anciennes[0].nouveau).toBe(false);
  });
});
