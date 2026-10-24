"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { useAdmin } from "@/components/admin/Fournisseur";
import { Interrupteur } from "@/components/admin/Interrupteur";
import { IconePlus } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { formatPrix } from "@/lib/format";
import { promoActive } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";

export default function ListeChaussures() {
  const uid = useId();
  const { api, executer } = useAdmin();
  const [chaussures, setChaussures] = useState<Chaussure[] | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (api) executer(() => api.chaussures()).then((liste) => setChaussures(liste ?? []));
  }, [api, executer]);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (chaussures ?? []).filter((c) => !q || `${c.marque} ${c.nom}`.toLowerCase().includes(q));
  }, [chaussures, recherche]);

  async function changerStock(c: Chaussure, enStock: boolean) {
    if (!api) return;
    setChaussures((liste) => liste?.map((x) => (x.id === c.id ? { ...x, enStock } : x)) ?? null);
    const ok = await executer(
      () => api.changerStock(c.id, enStock).then(() => true),
      enStock ? "Remise en stock ✅" : "Mise en rupture ✅",
    );
    if (!ok) setChaussures((liste) => liste?.map((x) => (x.id === c.id ? { ...x, enStock: !enStock } : x)) ?? null);
  }

  return (
    <>
      <EnTeteAdmin titre="Chaussures" />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <label htmlFor={`${uid}-recherche`} className="sr-only">
          Rechercher une chaussure
        </label>
        <input
          id={`${uid}-recherche`}
          type="search"
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="champ min-h-14 text-[17px]"
        />

        {chaussures == null ? (
          <ul className="mt-4 space-y-3" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-22 rounded-[22px] bg-carte" />
            ))}
          </ul>
        ) : (
          <>
            <p className="mt-4 text-[15px] text-gris">
              {chaussures.length} chaussure{chaussures.length > 1 ? "s" : ""} · touchez une chaussure pour la modifier
            </p>
            <ul className="mt-3 space-y-3 pb-24">
              {visibles.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-[22px] bg-white p-3 ring-1 ring-trait/70">
                  <Link
                    href={`/admin/chaussures/modifier?id=${c.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-carte">
                      {c.images[0] && <Image src={c.images[0]} alt="" fill sizes="64px" className="object-contain" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[17px] leading-snug font-semibold break-words">{c.nom}</span>
                      <span className="block text-[15px] text-gris">
                        {c.marque} ·{" "}
                        {promoActive(c) && c.prixPromo != null ? (
                          <span className="text-promo">{formatPrix(c.prixPromo)} (promo)</span>
                        ) : (
                          formatPrix(c.prix)
                        )}
                      </span>
                      <span className={cn("text-[14px] font-medium", c.enStock ? "text-vert" : "text-promo")}>
                        {c.enStock ? "En stock" : "Rupture"}
                      </span>
                    </span>
                  </Link>
                  <Interrupteur actif={c.enStock} onChange={(v) => changerStock(c, v)} libelle={`${c.nom} en stock`} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3">
        <Link
          href="/admin/chaussures/nouvelle"
          className="bouton-plein mx-auto flex min-h-14 max-w-xl text-[17px] shadow-lg"
        >
          <IconePlus className="size-6" />
          Ajouter une chaussure
        </Link>
      </div>
    </>
  );
}
