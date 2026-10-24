"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { IconeBas } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { pointuresDisponibles, prixActuel } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";
import { CarteChaussure } from "./CarteChaussure";

const TRANCHES = [
  { valeur: "moins-20", court: "Moins de 20 000", long: "Moins de 20 000 FCFA", garde: (p: number) => p < 20000 },
  {
    valeur: "20-25",
    court: "20 000 – 25 000",
    long: "De 20 000 à 25 000 FCFA",
    garde: (p: number) => p >= 20000 && p <= 25000,
  },
  { valeur: "plus-25", court: "Plus de 25 000", long: "Plus de 25 000 FCFA", garde: (p: number) => p > 25000 },
];
const POINTURES = [39, 40, 41, 42, 43, 44, 45, 46, 47];

export function GrilleCollection({ chaussures }: { chaussures: Chaussure[] }) {
  const [marque, setMarque] = useState("");
  const [tranche, setTranche] = useState("");
  const [pointure, setPointure] = useState("");

  const marques = useMemo(
    () => [...new Set(chaussures.map((c) => c.marque).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [chaussures],
  );

  const resultats = useMemo(() => {
    const filtrePrix = TRANCHES.find((t) => t.valeur === tranche);
    return chaussures.filter(
      (c) =>
        (!marque || c.marque === marque) &&
        (!filtrePrix || filtrePrix.garde(prixActuel(c))) &&
        (!pointure || pointuresDisponibles(c).includes(Number(pointure))),
    );
  }, [chaussures, marque, tranche, pointure]);

  const filtre = Boolean(marque || tranche || pointure);
  const effacer = () => {
    setMarque("");
    setTranche("");
    setPointure("");
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Filtre libelle="Marque" valeur={marque} affichage={marque} onChange={setMarque}>
          <option value="">Toutes les marques</option>
          {marques.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Filtre>
        <Filtre
          libelle="Prix"
          valeur={tranche}
          affichage={TRANCHES.find((t) => t.valeur === tranche)?.court}
          onChange={setTranche}
        >
          <option value="">Tous les prix</option>
          {TRANCHES.map((t) => (
            <option key={t.valeur} value={t.valeur}>
              {t.long}
            </option>
          ))}
        </Filtre>
        <Filtre
          libelle="Pointure"
          valeur={pointure}
          affichage={pointure && `Pointure ${pointure}`}
          onChange={setPointure}
        >
          <option value="">Toutes les pointures</option>
          {POINTURES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Filtre>
        <AnimatePresence>
          {filtre && (
            <motion.button
              type="button"
              onClick={effacer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUREE.micro }}
              className="min-h-11 px-2 text-[14px] font-medium text-gris underline underline-offset-4 hover:text-encre"
            >
              Effacer
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-5 text-[14px] text-gris" aria-live="polite">
        {resultats.length} paire{resultats.length > 1 ? "s" : ""}
      </p>

      <motion.div
        key={`${marque}|${tranche}|${pointure}`}
        initial={filtre ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
        className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4"
      >
        {resultats.map((c, i) => (
          <CarteChaussure key={c.id} chaussure={c} prioritaire={i < 4} titre="h2" />
        ))}
      </motion.div>

      {resultats.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[17px] font-medium">Aucune paire ne correspond.</p>
          <button type="button" onClick={effacer} className="bouton-contour mt-5">
            Effacer les filtres
          </button>
        </div>
      )}
    </>
  );
}

function Filtre({
  libelle,
  valeur,
  affichage,
  onChange,
  children,
}: {
  libelle: string;
  valeur: string;
  affichage?: string | false;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const actif = Boolean(valeur);
  return (
    <label
      className={cn(
        "relative flex min-h-11 min-w-0 flex-1 basis-[calc(33%-0.5rem)] items-center justify-between gap-1.5 rounded-full px-4 text-[14px] font-medium sm:flex-none sm:basis-auto",
        "transition-colors duration-200 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-vert",
        actif ? "bg-encre text-white" : "bg-white text-encre ring-1 ring-trait hover:ring-encre/30",
      )}
    >
      <span className="truncate">{actif ? affichage : libelle}</span>
      <IconeBas className="size-4 shrink-0 opacity-70" />
      <select
        aria-label={libelle}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {children}
      </select>
    </label>
  );
}
