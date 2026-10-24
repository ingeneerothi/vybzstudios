import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MODE_DEMO } from "../env";
import { promoActive } from "../prix";
import type { Catalogue, Chaussure } from "../types";
import { catalogueDemo } from "./demo";
import { marquerNouveautes } from "./nouveautes";
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
  const chaussures = marquerNouveautes(catalogue.chaussures, maintenant).map((c) => ({
    ...c,
    promoEnCours: promoActive(c, maintenant),
  }));
  return { ...catalogue, chaussures };
}

export async function getChaussure(slug: string): Promise<Chaussure | null> {
  const { chaussures } = await getCatalogue();
  return chaussures.find((c) => c.slug === slug) ?? null;
}

export function chaussureVedette(catalogue: Catalogue): Chaussure | undefined {
  const { chaussures, reglages } = catalogue;
  return (
    chaussures.find((c) => c.id === reglages.chaussureVedetteId || c.slug === reglages.chaussureVedetteId) ??
    chaussures.find((c) => c.enStock && c.images.length > 0)
  );
}
