import { promoActive } from "../prix";
import type { Catalogue, Chaussure } from "../types";
import { marquerNouveautes } from "./nouveautes";

/** Ce qui dépend de l'heure : badges « Nouveau » et promos en cours. */
export function preparerCatalogue(catalogue: Catalogue, maintenant: number): Catalogue {
  const chaussures = marquerNouveautes(catalogue.chaussures, maintenant).map((c) => ({
    ...c,
    promoEnCours: promoActive(c, maintenant),
  }));
  return { ...catalogue, chaussures };
}

export function chaussureVedette(catalogue: Catalogue): Chaussure | undefined {
  const { chaussures, reglages } = catalogue;
  return (
    chaussures.find((c) => c.id === reglages.chaussureVedetteId || c.slug === reglages.chaussureVedetteId) ??
    chaussures.find((c) => c.enStock && c.images.length > 0)
  );
}
