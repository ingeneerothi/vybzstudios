"use client";

import { cn } from "@/lib/cn";
import { formatPrix } from "@/lib/format";
import type { Chaussure } from "@/lib/types";
import { usePromo } from "./usePromo";

type Props = {
  chaussure: Pick<Chaussure, "prix" | "prixPromo" | "finPromo" | "promoEnCours">;
  taille?: "carte" | "fiche";
};

export function Prix({ chaussure: c, taille = "carte" }: Props) {
  const promo = usePromo(c);
  const fiche = taille === "fiche";

  if (!promo || c.prixPromo == null) {
    return (
      <p className={cn("tabular-nums", fiche ? "text-[22px] font-semibold" : "text-[15px]")}>{formatPrix(c.prix)}</p>
    );
  }
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", fiche ? "text-[22px]" : "text-[15px]")}>
      <span className="font-semibold text-promo">{formatPrix(c.prixPromo)}</span>
      <s className={cn("text-gris", fiche ? "text-[16px]" : "text-[13px]")}>
        <span className="sr-only">au lieu de </span>
        {formatPrix(c.prix)}
      </s>
    </p>
  );
}
