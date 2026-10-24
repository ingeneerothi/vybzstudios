import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const lire = (fichier: string) => readFileSync(new URL(`../../${fichier}`, import.meta.url), "utf8");
const catalogue = JSON.parse(lire("data/catalogue.json"));

type Qui = "anon" | "admin" | "intrus";
const CLAIMS: Record<Qui, object> = {
  anon: { role: "anon" },
  admin: { role: "authenticated", email: "AngeBattey.616@gmail.com" },
  intrus: { role: "authenticated", email: "intrus@example.com" },
};

let db: PGlite;

async function en<T>(qui: Qui, action: () => Promise<T>): Promise<T> {
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(CLAIMS[qui])]);
  await db.exec(`set role ${qui === "anon" ? "anon" : "authenticated"}`);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims', '', false)");
  }
}

async function valeur<T>(sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<Record<string, T>>(sql, params);
  return Object.values(rows[0])[0];
}

async function zone(nom: string): Promise<string> {
  return valeur<string>("select id from public.zones_livraison where nom = $1", [nom]);
}

type SaisieTest = {
  slug: string;
  pointure: number;
  quantite: number;
  nom: string;
  telephone: string;
  commune: string | null;
  quartier: string | null;
  ville: string | null;
  adresse: string;
  repere: string;
};

const commandeValide: SaisieTest = {
  slug: "nike-air-force-1-noir",
  pointure: 42,
  quantite: 1,
  nom: "Awa Koné",
  telephone: "07 08 09 10 11",
  commune: "Cocody",
  quartier: "Riviera 2",
  ville: null,
  adresse: "Rue des jardins, villa 12",
  repere: "Près de la pharmacie",
};

async function commander(c: Partial<SaisieTest> & { zoneId: string }) {
  const x = { ...commandeValide, ...c };
  const { rows } = await db.query<{ r: Record<string, unknown> }>(
    "select public.creer_commande($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) as r",
    [x.slug, x.pointure, x.quantite, x.zoneId, x.nom, x.telephone, x.commune, x.quartier, x.ville, x.adresse, x.repere],
  );
  return rows[0].r;
}

// Supabase donne aujourd'hui tous les droits par défaut sur les nouvelles tables (la sécurité ligne par ligne
// filtre ensuite). Le schéma doit aussi marcher sans ces droits par défaut, au cas où ils changent.
const DROITS_PAR_DEFAUT = `
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

/** Lignes visibles d'une table ; un refus d'accès compte comme « rien de visible ». */
async function lignesVisibles(table: string): Promise<number> {
  try {
    return await valeur<number>(`select count(*)::int from ${table}`);
  } catch (e) {
    expect(String(e)).toMatch(/permission denied/);
    return 0;
  }
}

/** Une écriture interdite échoue, ou ne touche aucune ligne : les deux sont acceptables. */
async function ecritureSansEffet(sql: string): Promise<void> {
  await db.query(sql).catch((e) => expect(String(e)).toMatch(/row-level security|permission denied/));
}

const REFUS = /row-level security|permission denied/;

it("installation.sql reprend schema.sql et seed.sql à jour (sinon : npm run seed)", () => {
  const installation = lire("supabase/installation.sql");
  expect(installation).toContain(lire("supabase/schema.sql").trimEnd());
  expect(installation).toContain(lire("supabase/seed.sql"));
});

describe.each([
  ["droits par défaut de Supabase", true],
  ["sans droits par défaut", false],
])("schéma Supabase (%s)", (_nom, droitsParDefaut) => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(lire("tests/sql/supabase-stubs.sql"));
    if (droitsParDefaut) await db.exec(DROITS_PAR_DEFAUT);
    // Le fichier unique collé dans Supabase, lancé deux fois : rien ne doit casser ni se dupliquer.
    await db.exec(lire("supabase/installation.sql"));
    await db.exec(lire("supabase/installation.sql"));
  });

  it("importe le catalogue une seule fois, même relancé", async () => {
    expect(await valeur("select count(*)::int from public.chaussures")).toBe(catalogue.chaussures.length);
    const images = catalogue.chaussures.reduce((n: number, c: { images: string[] }) => n + c.images.length, 0);
    expect(await valeur("select count(*)::int from public.chaussure_images")).toBe(images);
    expect(await valeur("select count(*)::int from public.chaussure_pointures")).toBe(catalogue.chaussures.length * 9);
    expect(await valeur("select count(*)::int from public.zones_livraison")).toBe(4);
    expect(await valeur("select numero from public.numeros_whatsapp where actif")).toBe("2250506523816");
    expect(
      await valeur("select c.slug from public.reglages r join public.chaussures c on c.id = r.chaussure_vedette_id"),
    ).toBe(catalogue.reglages.chaussureVedette);
  });

  it("le public lit le catalogue mais ni les commandes ni les numéros", async () => {
    await en("anon", async () => {
      expect(await valeur("select count(*)::int from public.chaussures")).toBe(catalogue.chaussures.length);
      expect(await valeur("select count(*)::int from public.zones_livraison")).toBe(4);
      expect(await lignesVisibles("public.commandes")).toBe(0);
      expect(await lignesVisibles("public.numeros_whatsapp")).toBe(0);
      expect(await valeur("select public.numero_actif()")).toBe("2250506523816");
    });
  });

  it("le public ne peut rien modifier directement", async () => {
    await en("anon", async () => {
      await ecritureSansEffet("update public.chaussures set prix = 1");
      await expect(
        db.query("insert into public.chaussures (slug, nom, prix) values ('pirate', 'Pirate', 1)"),
      ).rejects.toThrow(REFUS);
      await expect(
        db.query(
          "insert into public.commandes (code, chaussure_nom, pointure, quantite, prix_unitaire, zone, frais_livraison, total, client_nom, client_telephone, adresse, mode_paiement, numero_whatsapp) values ('X', 'x', 42, 1, 1, 'x', 0, 1, 'x', 'x', 'x', 'x', 'x')",
        ),
      ).rejects.toThrow(REFUS);
      await expect(db.query("select public.activer_numero(gen_random_uuid())")).rejects.toThrow();
    });
    expect(await valeur("select min(prix)::int from public.chaussures")).toBeGreaterThan(1);
  });

  it("crée une commande avec un prix recalculé côté base", async () => {
    const abidjan = await zone("Abidjan");
    const r = await en("anon", () => commander({ zoneId: abidjan, quantite: 2 }));
    expect(r).toMatchObject({
      code: "CMD-0001",
      prixUnitaire: 13000,
      fraisLivraison: 2000,
      total: 28000,
      whatsapp: "2250506523816",
      modePaiement: "À la livraison",
    });
    expect(await valeur("select client_telephone from public.commandes where code = 'CMD-0001'")).toBe("0708091011");
  });

  it("applique la promo uniquement avant sa date de fin", async () => {
    const bassam = await zone("Grand-Bassam");
    await db.query(
      "update public.chaussures set prix_promo = 10000, fin_promo = now() + interval '1 day' where slug = 'nike-air-force-1-noir'",
    );
    const enPromo = await en("anon", () =>
      commander({ zoneId: bassam, commune: null, quartier: "Mockeyville", telephone: "0102030405" }),
    );
    expect(enPromo).toMatchObject({ prixUnitaire: 10000, total: 13000 });

    await db.query(
      "update public.chaussures set fin_promo = now() - interval '1 minute' where slug = 'nike-air-force-1-noir'",
    );
    const finie = await en("anon", () =>
      commander({ zoneId: bassam, commune: null, quartier: "Mockeyville", telephone: "0102030405" }),
    );
    expect(finie).toMatchObject({ prixUnitaire: 13000, total: 16000 });
  });

  it("refuse les commandes incomplètes ou impossibles", async () => {
    const abidjan = await zone("Abidjan");
    const expedition = await zone("Expédition à l'intérieur du pays");
    await en("anon", async () => {
      await expect(commander({ zoneId: abidjan, telephone: "12345" })).rejects.toThrow(/téléphone invalide/);
      await expect(commander({ zoneId: abidjan, quartier: "" })).rejects.toThrow(/commune et le quartier/);
      await expect(commander({ zoneId: expedition, ville: "" })).rejects.toThrow(/la ville/);
      await expect(commander({ zoneId: abidjan, pointure: 48 })).rejects.toThrow(/pointure 48/);
      await expect(commander({ zoneId: abidjan, quantite: 11 })).rejects.toThrow(/Quantité/);
    });
    await db.query(
      "update public.chaussure_pointures set en_stock = false where pointure = 44 and chaussure_id = (select id from public.chaussures where slug = 'nike-air-force-1-noir')",
    );
    await en("anon", () => expect(commander({ zoneId: abidjan, pointure: 44 })).rejects.toThrow(/pointure 44/));
    await db.query("update public.chaussures set en_stock = false where slug = 'nike-shox-tl-noir'");
    await en("anon", () =>
      expect(commander({ zoneId: abidjan, slug: "nike-shox-tl-noir" })).rejects.toThrow(/rupture/),
    );
    const ok = await en("anon", () =>
      commander({
        zoneId: expedition,
        commune: null,
        quartier: null,
        ville: "Bouaké",
        telephone: "+225 05 44 33 22 11",
      }),
    );
    expect(ok).toMatchObject({ fraisLivraison: 3000 });
  });

  it("limite les commandes répétées d'un même numéro", async () => {
    const abidjan = await zone("Abidjan");
    await en("anon", async () => {
      for (let i = 0; i < 5; i++) await commander({ zoneId: abidjan, telephone: "0799999999" });
      await expect(commander({ zoneId: abidjan, telephone: "0799999999" })).rejects.toThrow(/Trop de commandes/);
    });
  });

  it("l'admin lit et met à jour les commandes ; un autre compte ne voit rien", async () => {
    await en("admin", async () => {
      expect(await valeur<number>("select count(*)::int from public.commandes")).toBeGreaterThan(0);
      await db.query("update public.commandes set statut = 'envoyee' where code = 'CMD-0001'");
      await db.query("update public.chaussures set prix = 14000 where slug = 'nike-air-force-1-noir'");
      expect(await valeur("select public.est_admin()")).toBe(true);
    });
    expect(await valeur("select statut from public.commandes where code = 'CMD-0001'")).toBe("envoyee");
    expect(await valeur("select prix from public.chaussures where slug = 'nike-air-force-1-noir'")).toBe(14000);

    await en("intrus", async () => {
      expect(await valeur("select public.est_admin()")).toBe(false);
      expect(await valeur("select count(*)::int from public.commandes")).toBe(0);
      expect(await valeur("select count(*)::int from public.numeros_whatsapp")).toBe(0);
      await db.query("update public.chaussures set prix = 1");
      await expect(db.query("select public.activer_numero(gen_random_uuid())")).rejects.toThrow(/Accès refusé/);
    });
    expect(await valeur("select min(prix)::int from public.chaussures")).toBeGreaterThan(1);
  });

  it("garde toujours exactement un numéro WhatsApp actif", async () => {
    await en("admin", async () => {
      await db.query("insert into public.numeros_whatsapp (libelle, numero) values ('Livreur', '2250700000000')");
      const livreur = await valeur<string>("select id from public.numeros_whatsapp where libelle = 'Livreur'");
      const boutique = await valeur<string>("select id from public.numeros_whatsapp where libelle = 'Boutique'");

      await db.query("select public.activer_numero($1)", [livreur]);
      expect(await valeur("select libelle from public.numeros_whatsapp where actif")).toBe("Livreur");
      expect(await valeur("select count(*)::int from public.numeros_whatsapp where actif")).toBe(1);

      await expect(db.query("delete from public.numeros_whatsapp where id = $1", [livreur])).rejects.toThrow(
        /toujours un numéro WhatsApp actif/,
      );
      await expect(db.query("update public.numeros_whatsapp set actif = false")).rejects.toThrow(
        /toujours un numéro WhatsApp actif/,
      );
      await expect(db.query("update public.numeros_whatsapp set actif = true")).rejects.toThrow();

      await db.query("delete from public.numeros_whatsapp where id = $1", [boutique]);
      await expect(db.query("delete from public.numeros_whatsapp")).rejects.toThrow(
        /toujours un numéro WhatsApp actif/,
      );
      expect(await valeur("select count(*)::int from public.numeros_whatsapp")).toBe(1);
    });
    const abidjan = await zone("Abidjan");
    const r = await en("anon", () => commander({ zoneId: abidjan, telephone: "0505050505" }));
    expect(r.whatsapp).toBe("2250700000000");
  });

  it("crée une demande d'article", async () => {
    const r = await en("anon", async () => {
      const { rows } = await db.query<{ r: Record<string, unknown> }>(
        "select public.creer_demande($1, $2, $3, $4, $5, $6) as r",
        [
          "3f2a9c1e-1111-4222-8333-944455556666.webp",
          "43",
          "Yao Kouassi",
          "0102030405",
          "Yopougon, Selmer",
          "Version blanche",
        ],
      );
      return rows[0].r;
    });
    expect(r).toMatchObject({ code: "DEM-0001", whatsapp: "2250700000000" });
    await en("anon", async () => {
      await expect(
        db.query("select public.creer_demande(null, '42', 'Yao', '0102030405', 'Cocody', null)"),
      ).rejects.toThrow(/photo ou décrivez/);
      await expect(
        db.query("select public.creer_demande('../pirate.webp', '42', 'Yao', '0102030405', 'Cocody', null)"),
      ).rejects.toThrow(/Photo invalide/);
    });
  });

  it("protège le stockage des photos", async () => {
    await en("anon", async () => {
      await db.query(
        "insert into storage.objects (bucket_id, name) values ('demandes', '3f2a9c1e-aaaa-4222-8333-944455556666.webp')",
      );
      await expect(
        db.query("insert into storage.objects (bucket_id, name) values ('produits', 'pirate.webp')"),
      ).rejects.toThrow(/row-level security/);
      await expect(
        db.query("insert into storage.objects (bucket_id, name) values ('demandes', '../../pirate.html')"),
      ).rejects.toThrow(/row-level security/);
    });
    await en("admin", () => db.query("insert into storage.objects (bucket_id, name) values ('produits', 'x/1.webp')"));
  });
});
