import type { Chaussure } from "./types";

type AvecPrix = Pick<Chaussure, "prix" | "prixPromo" | "finPromo">;

export function promoActive(c: AvecPrix, maintenant: number = Date.now()): boolean {
  if (c.prixPromo == null || c.prixPromo >= c.prix) return false;
  return c.finPromo == null || new Date(c.finPromo).getTime() > maintenant;
}

export function prixActuel(c: AvecPrix, maintenant?: number): number {
  return promoActive(c, maintenant) ? (c.prixPromo as number) : c.prix;
}

/** Remise arrondie à l'unité, pour le badge « -X% ». */
export function pourcentageRemise(c: AvecPrix): number {
  if (c.prixPromo == null) return 0;
  return Math.round(((c.prix - c.prixPromo) / c.prix) * 100);
}

/** Prix promo à partir d'un pourcentage saisi dans l'admin (arrondi aux 100 FCFA). */
export function prixDepuisPourcentage(prix: number, pourcentage: number): number {
  return Math.round((prix * (1 - pourcentage / 100)) / 100) * 100;
}

export function pointuresDisponibles(c: Pick<Chaussure, "enStock" | "pointures">): number[] {
  if (!c.enStock) return [];
  return c.pointures.filter((p) => p.enStock).map((p) => p.pointure);
}

export function estEnRupture(c: Pick<Chaussure, "enStock" | "pointures">): boolean {
  return pointuresDisponibles(c).length === 0;
}
