"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import type { Pointure } from "@/lib/types";

type Props = {
  pointures: Pointure[];
  choisie: number | null;
  onChoisir: (p: number) => void;
  toutEnRupture?: boolean;
  idGroupe?: string;
};

/** Pastilles de pointure : seules les pointures en stock se choisissent ; la sélection glisse d'une pastille à l'autre. */
export function ChoixPointure({ pointures, choisie, onChoisir, toutEnRupture, idGroupe = "pointure" }: Props) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${idGroupe}-titre`}
      className="grid grid-cols-5 gap-2 sm:grid-cols-9 lg:grid-cols-5 xl:grid-cols-9"
    >
      {pointures.map(({ pointure, enStock }) => {
        const dispo = enStock && !toutEnRupture;
        const active = choisie === pointure;
        return (
          <button
            key={pointure}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={dispo ? `Pointure ${pointure}` : `Pointure ${pointure}, indisponible`}
            disabled={!dispo}
            onClick={() => onChoisir(pointure)}
            className={cn(
              "relative grid h-12 place-items-center rounded-2xl text-[15px] font-medium tabular-nums transition-colors duration-200",
              dispo
                ? "bg-white ring-1 ring-trait hover:ring-encre/40"
                : "cursor-not-allowed bg-transparent text-gris/50 line-through ring-1 ring-trait/60",
              active && "text-white ring-encre",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idGroupe}-active`}
                className="absolute inset-0 rounded-2xl bg-encre"
                transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
              />
            )}
            <span className="relative">{pointure}</span>
          </button>
        );
      })}
    </div>
  );
}
