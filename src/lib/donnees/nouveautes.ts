import type { Chaussure } from "../types";

const NOMBRE_NOUVEAUTES = 6;
const JOURS_NOUVEAUTE = 30;

/** Badge « Nouveau » : les 6 dernières chaussures ajoutées, si elles ont moins de 30 jours. */
export function marquerNouveautes(chaussures: Chaussure[], maintenant: number): Chaussure[] {
  const limite = maintenant - JOURS_NOUVEAUTE * 24 * 3600 * 1000;
  const recentes = new Set(
    [...chaussures]
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe))
      .slice(0, NOMBRE_NOUVEAUTES)
      .filter((c) => new Date(c.creeLe).getTime() >= limite)
      .map((c) => c.id),
  );
  return chaussures.map((c) => ({ ...c, nouveau: recentes.has(c.id) }));
}
