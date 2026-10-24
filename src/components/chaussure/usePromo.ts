"use client";

import { useEffect, useState } from "react";
import { promoActive } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";

/** La promo est-elle en cours ? Revérifié avec l'heure du téléphone, et à la seconde où elle se termine. */
export function usePromo(c: Pick<Chaussure, "prix" | "prixPromo" | "finPromo" | "promoEnCours">): boolean {
  const [active, setActive] = useState(c.promoEnCours);

  useEffect(() => {
    const verifier = () => setActive(promoActive(c));
    verifier();
    if (!c.finPromo) return;
    const restant = new Date(c.finPromo).getTime() - Date.now();
    if (restant <= 0 || restant > 2 ** 31 - 1) return;
    const minuteur = window.setTimeout(verifier, restant + 50);
    return () => window.clearTimeout(minuteur);
  }, [c]);

  return active;
}
