#!/usr/bin/env node
// Génère supabase/seed.sql (et supabase/installation.sql = schema + seed) à partir de data/catalogue.json.
// Utilisation : npm run seed   (puis coller supabase/installation.sql dans le SQL Editor de Supabase)
import { readFileSync, writeFileSync } from "node:fs";

const racine = new URL("../", import.meta.url);
const catalogue = JSON.parse(readFileSync(new URL("data/catalogue.json", racine), "utf8"));
const POINTURES_PAR_DEFAUT = [39, 40, 41, 42, 43, 44, 45, 46, 47];

const texte = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const entier = (v) => (v == null ? "null" : String(Math.round(Number(v))));

const lignes = [
  "-- =====================================================================",
  "-- Vertical Store — données de départ (généré par scripts/generer-seed.mjs)",
  "-- À lancer APRÈS schema.sql. Peut être relancé : rien n'est dupliqué.",
  "-- =====================================================================",
  "",
  "-- Zones de livraison (seulement si aucune zone n'existe encore)",
  "insert into public.zones_livraison (nom, frais, details, position)",
  "select * from (values",
  catalogue.zones.map((z, i) => `  (${texte(z.nom)}, ${entier(z.frais)}, ${texte(z.details)}, ${i})`).join(",\n"),
  ") as v(nom, frais, details, position)",
  "where not exists (select 1 from public.zones_livraison);",
  "",
  "-- Numéro WhatsApp de départ (seulement si aucun numéro n'existe encore)",
  "insert into public.numeros_whatsapp (libelle, numero, actif)",
  "select * from (values",
  catalogue.numerosWhatsapp
    .map((n) => `  (${texte(n.nom)}, ${texte(n.numero)}, ${n.actif ? "true" : "false"})`)
    .join(",\n"),
  ") as v(libelle, numero, actif)",
  "where not exists (select 1 from public.numeros_whatsapp);",
  "",
];

catalogue.chaussures.forEach((c, i) => {
  if (!c.images?.length) throw new Error(`${c.slug} : aucune image (lancer d'abord le script Python)`);
  const pointures = c.pointures ?? POINTURES_PAR_DEFAUT;
  lignes.push(
    `-- ${c.marque} ${c.nom}`,
    "insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)",
    `values (${texte(c.slug)}, ${texte(c.nom)}, ${texte(c.marque)}, ${texte(c.couleur)}, ${texte(c.description)}, ` +
      `${entier(c.prix)}, ${entier(c.prixPromo)}, ${texte(c.finPromo)}, now() - interval '${i} minutes')`,
    "on conflict (slug) do nothing;",
    "insert into public.chaussure_images (chaussure_id, url, position)",
    "select c.id, v.url, v.position from public.chaussures c, (values",
    c.images.map((url, p) => `  (${texte(url)}, ${p})`).join(",\n"),
    ") as v(url, position)",
    `where c.slug = ${texte(c.slug)}`,
    "  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);",
    "insert into public.chaussure_pointures (chaussure_id, pointure)",
    `select c.id, p from public.chaussures c, unnest(array[${pointures.join(", ")}]) as p`,
    `where c.slug = ${texte(c.slug)}`,
    "on conflict do nothing;",
    "",
  );
});

const r = catalogue.reglages;
lignes.push(
  "-- Réglages de la boutique",
  "update public.reglages set",
  `  slogan = ${texte(r.slogan)},`,
  `  mode_paiement = ${texte(r.modePaiement)},`,
  `  chaussure_vedette_id = (select id from public.chaussures where slug = ${texte(r.chaussureVedette)})`,
  "where id = 1;",
  "",
);

writeFileSync(new URL("supabase/seed.sql", racine), lignes.join("\n"));
console.log(`supabase/seed.sql : ${catalogue.chaussures.length} chaussures, ${catalogue.zones.length} zones`);

// Les deux à la suite, pour une installation en un seul copier-coller.
const installation = [
  "-- =====================================================================",
  "-- Vertical Store — INSTALLATION COMPLÈTE, en un seul copier-coller",
  "-- Supabase > SQL Editor > New query : coller tout ce fichier, puis « Run ».",
  "-- Contient schema.sql puis seed.sql (généré par scripts/generer-seed.mjs : ne pas modifier à la main).",
  "-- Peut être relancé sans risque : rien n'est supprimé ni dupliqué.",
  "-- =====================================================================",
  "",
  readFileSync(new URL("supabase/schema.sql", racine), "utf8").trimEnd(),
  "",
  "",
  lignes.join("\n"),
];
writeFileSync(new URL("supabase/installation.sql", racine), installation.join("\n"));
console.log("supabase/installation.sql : schema.sql + seed.sql");

// Tableau récapitulatif lisible (CATALOGUE.md)
const prix = (n) => (n == null ? "—" : `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`);
const pointures = (p) => {
  const liste = p ?? POINTURES_PAR_DEFAUT;
  const suite = liste.every((v, i) => i === 0 || v === liste[i - 1] + 1);
  return suite ? `${liste[0]} à ${liste[liste.length - 1]}` : liste.join(", ");
};
const tableau = [
  "# Catalogue de départ",
  "",
  "Généré par `npm run seed` à partir de `data/catalogue.json`.",
  "",
  "| # | Nom | Marque | Prix | Prix promo | Pointures | Angles | Description |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...catalogue.chaussures.map(
    (c, i) =>
      `| ${i + 1} | ${c.nom} | ${c.marque} | ${prix(c.prix)} | ${prix(c.prixPromo)} | ${pointures(c.pointures)} | ${c.images.length} | ${c.description} |`,
  ),
  "",
];
writeFileSync(new URL("CATALOGUE.md", racine), tableau.join("\n"));
