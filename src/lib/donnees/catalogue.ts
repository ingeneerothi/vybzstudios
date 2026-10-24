import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MODE_DEMO } from "../env";
import type { Catalogue, Chaussure } from "../types";
import { catalogueDemo } from "./demo";
import { preparerCatalogue } from "./preparer";
import { chargerCatalogueSupabase } from "./supabase";

export const TAG_CATALOGUE = "catalogue";

/**
 * Tout ce que le site public affiche, en une lecture mise en cache.
 * Rafraîchi chaque minute, et immédiatement après une modification dans l'admin.
 */
export async function getCatalogue(): Promise<Catalogue> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAG_CATALOGUE);
  const maintenant = Date.now();
  const catalogue = MODE_DEMO ? catalogueDemo(maintenant) : await chargerCatalogueSupabase();
  return preparerCatalogue(catalogue, maintenant);
}

export async function getChaussure(slug: string): Promise<Chaussure | null> {
  const { chaussures } = await getCatalogue();
  return chaussures.find((c) => c.slug === slug) ?? null;
}
