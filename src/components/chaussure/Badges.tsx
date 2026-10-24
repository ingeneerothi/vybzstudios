"use client";

import { cn } from "@/lib/cn";
import { estEnRupture, pourcentageRemise } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";
import { usePromo } from "./usePromo";

const STYLE = "rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold tracking-[0.06em] uppercase";

export function Badges({ chaussure: c, className }: { chaussure: Chaussure; className?: string }) {
  const promo = usePromo(c);
  const rupture = estEnRupture(c);
  const badges: React.ReactNode[] = [];

  if (rupture) {
    badges.push(
      <span key="rupture" className={cn(STYLE, "bg-white text-encre-doux ring-1 ring-trait")}>
        Rupture de stock
      </span>,
    );
  } else {
    if (promo) {
      badges.push(
        <span key="promo" className={cn(STYLE, "bg-promo text-white")}>
          -{pourcentageRemise(c)}%
        </span>,
      );
    }
    if (c.nouveau) {
      badges.push(
        <span key="nouveau" className={cn(STYLE, "bg-encre text-white")}>
          Nouveau
        </span>,
      );
    }
  }
  if (badges.length === 0) return null;
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{badges}</div>;
}
