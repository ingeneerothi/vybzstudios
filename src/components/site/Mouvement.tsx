"use client";

import { MotionConfig } from "motion/react";
import { DUREE, EASE_SORTIE } from "@/lib/motion";

/** Mêmes durées et courbes partout ; « réduire les animations » respecté (fondus seulement). */
export function Mouvement({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUREE.base, ease: EASE_SORTIE }}>
      {children}
    </MotionConfig>
  );
}
