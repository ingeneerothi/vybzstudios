"use client";

import { motion, useAnimationControls } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { IconeFleche, IconeRetour } from "@/components/site/Icones";
import { libellePaiement } from "@/lib/format";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { pointuresDisponibles } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";
import { Badges } from "./Badges";
import { ChoixPointure } from "./ChoixPointure";
import { CompteARebours } from "./CompteARebours";
import { GalerieAngles } from "./GalerieAngles";
import { Prix } from "./Prix";
import { usePromo } from "./usePromo";

export function FicheChaussure({ chaussure: c, modePaiement }: { chaussure: Chaussure; modePaiement: string }) {
  const router = useRouter();
  const promo = usePromo(c);
  const dispo = pointuresDisponibles(c);
  const enRupture = dispo.length === 0;
  const [pointure, setPointure] = useState<number | null>(null);
  const [rappel, setRappel] = useState(false);
  const zonePointures = useRef<HTMLDivElement>(null);
  const secousse = useAnimationControls();
  const bouton = useAnimationControls();
  const groupe = useId();

  // Signale la barre collée en bas au reste de la page (le pied de page lui laisse de la place).
  // L'effet est nettoyé quand Next met la page en veille : aucun effet sur les autres pages.
  useEffect(() => {
    document.body.dataset.barreCommande = "";
    return () => {
      delete document.body.dataset.barreCommande;
    };
  }, []);

  useEffect(() => {
    if (pointure != null)
      bouton.start({ scale: [1, 1.04, 1], transition: { duration: DUREE.base, ease: EASE_SORTIE } });
  }, [pointure, bouton]);

  function commander() {
    if (enRupture) return;
    if (pointure == null) {
      setRappel(true);
      zonePointures.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      secousse.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: DUREE.base } });
      return;
    }
    router.push(`/commander/${c.slug}?pointure=${pointure}`);
  }

  const libelleBouton = enRupture ? "Rupture de stock" : "Commander";

  return (
    <div className="pb-28 lg:pb-24">
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 lg:px-6 lg:pt-28">
        <div className="pt-[calc(3.5rem+env(safe-area-inset-top))] lg:sticky lg:top-24 lg:self-start lg:pt-0">
          <GalerieAngles images={c.images} nom={`${c.marque} ${c.nom}`} slug={c.slug} enRupture={enRupture} />
        </div>

        <div className="px-4 pt-6 sm:px-6 lg:px-0 lg:pt-2">
          <Link
            href="/collection"
            className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-gris hover:text-encre"
          >
            <IconeRetour className="size-4" />
            Collection
          </Link>

          <div className="animate-[monter-doux_0.6s_var(--ease-sortie)_0.1s_both]">
            <Badges chaussure={c} className="mt-3" />
            <p className="etiquette mt-4 text-gris">{c.marque}</p>
            <h1 className="mt-2 text-[clamp(1.9rem,6vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
              {c.nom}
            </h1>
            <div className="mt-4">
              <Prix chaussure={c} taille="fiche" />
            </div>
            {promo && c.finPromo && (
              <div className="mt-2">
                <CompteARebours fin={c.finPromo} />
              </div>
            )}
            {c.description && (
              <p className="mt-5 max-w-prose text-[16px] leading-relaxed text-encre-doux">{c.description}</p>
            )}
            {c.couleur && <p className="mt-3 text-[14px] text-gris">Couleur : {c.couleur}</p>}
          </div>

          <motion.div
            ref={zonePointures}
            animate={secousse}
            className="mt-8 scroll-mt-24 animate-[monter-doux_0.6s_var(--ease-sortie)_0.2s_both]"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`${groupe}-titre`} className="text-[16px] font-semibold">
                Pointure
              </h2>
              {!enRupture && dispo.length <= 3 && (
                <p className="text-[14px] font-medium text-promo">
                  {dispo.length === 1
                    ? "Plus qu'une pointure disponible"
                    : `Plus que ${dispo.length} pointures disponibles`}
                </p>
              )}
            </div>
            <div className="mt-3">
              <ChoixPointure
                idGroupe={groupe}
                pointures={c.pointures}
                choisie={pointure}
                toutEnRupture={!c.enStock}
                onChoisir={(p) => {
                  setPointure(p);
                  setRappel(false);
                }}
              />
            </div>
            <p className="mt-3 min-h-5 text-[14px] text-promo" role="alert">
              {rappel && pointure == null ? "Choisissez votre pointure pour commander." : ""}
            </p>
          </motion.div>

          <div className="mt-6 hidden lg:block">
            <motion.button
              type="button"
              animate={bouton}
              onClick={commander}
              disabled={enRupture}
              className="bouton-plein group w-full"
            >
              {libelleBouton}
              {!enRupture && (
                <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
              )}
            </motion.button>
            <p className="mt-3 text-center text-[13px] text-gris">
              Confirmation sur WhatsApp, paiement {libellePaiement(modePaiement)}.
            </p>
          </div>
        </div>
      </div>

      {/* Barre « Commander » collée en bas de l'écran (mobile et tablette) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-trait/80 bg-papier/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1 text-[14px] leading-tight">
            <p className="truncate font-medium">
              {pointure ? `Pointure ${pointure}` : enRupture ? "Indisponible" : "Choisissez une pointure"}
            </p>
            <div className="text-gris [&_p]:text-[14px]">
              <Prix chaussure={c} />
            </div>
          </div>
          <motion.button
            type="button"
            animate={bouton}
            onClick={commander}
            disabled={enRupture}
            className="bouton-plein group shrink-0"
          >
            {libelleBouton}
            {!enRupture && (
              <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
