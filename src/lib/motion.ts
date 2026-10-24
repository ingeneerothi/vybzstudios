// Langage de mouvement du site : une courbe d'entrée, une courbe de transition,
// des durées multiples de 0,2 s. Toute animation du site pioche ici.
export const EASE_SORTIE = [0.22, 1, 0.36, 1] as const;
export const EASE_TRANSITION = [0.65, 0, 0.35, 1] as const;

export const DUREE = {
  micro: 0.2,
  base: 0.4,
  entree: 0.6,
  hero: 0.8,
} as const;

export const DECALAGE = 0.08;

/** Ressort sans rebond pour les gestes (glisser, incliner). */
export const RESSORT = { type: "spring", stiffness: 260, damping: 34, mass: 1 } as const;

export const APPARITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUREE.entree, ease: EASE_SORTIE },
} as const;
