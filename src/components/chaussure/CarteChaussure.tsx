"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE, RESSORT } from "@/lib/motion";
import { estEnRupture } from "@/lib/prix";
import type { Chaussure } from "@/lib/types";
import { Badges } from "./Badges";
import { Prix } from "./Prix";

type Props = {
  chaussure: Chaussure;
  prioritaire?: boolean;
  tailles?: string;
  /** Niveau du titre selon la page (h2 dans la collection, h3 sous une section de l'accueil). */
  titre?: "h2" | "h3";
};

/**
 * Vignette du catalogue : au survol (souris) la chaussure s'incline vers le pointeur
 * et se soulève ; au toucher elle se soulève. Son image « voyage » jusqu'à la fiche produit.
 */
export function CarteChaussure({
  chaussure: c,
  prioritaire = false,
  tailles = "(min-width: 1200px) 280px, (min-width: 768px) 33vw, 50vw",
  titre: Titre = "h3",
}: Props) {
  const reduit = useReducedMotion();
  const cadre = useRef<HTMLDivElement>(null);
  const inclinaisonX = useMotionValue(0);
  const inclinaisonY = useMotionValue(0);
  const rotateX = useSpring(inclinaisonX, RESSORT);
  const rotateY = useSpring(inclinaisonY, RESSORT);
  const [leve, setLeve] = useState(false);
  const rupture = estEnRupture(c);

  function suivre(e: React.PointerEvent) {
    if (reduit || e.pointerType !== "mouse" || !cadre.current) return;
    const r = cadre.current.getBoundingClientRect();
    inclinaisonY.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    inclinaisonX.set(-((e.clientY - r.top) / r.height - 0.5) * 9);
  }

  function relacher() {
    setLeve(false);
    inclinaisonX.set(0);
    inclinaisonY.set(0);
  }

  return (
    <Link
      href={`/chaussure/${c.slug}`}
      prefetch={true}
      onPointerEnter={() => setLeve(true)}
      onPointerMove={suivre}
      onPointerLeave={relacher}
      onPointerCancel={relacher}
      onPointerUp={(e) => e.pointerType !== "mouse" && relacher()}
      onFocus={() => setLeve(true)}
      onBlur={relacher}
      className="group block rounded-[24px] focus-visible:outline-offset-4"
    >
      <div ref={cadre} className="relative aspect-square overflow-hidden rounded-[22px] bg-carte [perspective:900px]">
        <Badges chaussure={c} className="absolute top-3 left-3 z-10" />
        <motion.div
          aria-hidden
          className="ombre-sol absolute inset-x-[20%] top-[79%] h-[7%]"
          animate={{ scaleX: leve ? 0.82 : 1, opacity: leve ? 0.4 : 0.65 }}
          transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ rotateX, rotateY }}
          animate={{ y: leve ? -10 : 0, scale: leve ? 1.04 : 1 }}
          transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
        >
          {c.images[0] && (
            <ViewTransition name={`chaussure-${c.slug}`} share="morph" default="none">
              <Image
                src={c.images[0]}
                alt={`${c.marque} ${c.nom}`}
                fill
                sizes={tailles}
                quality={80}
                priority={prioritaire}
                className={cn("object-contain p-[4%]", rupture && "opacity-55 grayscale-[30%]")}
              />
            </ViewTransition>
          )}
        </motion.div>
      </div>
      <div className="px-1 pt-3">
        <p className="etiquette text-gris">{c.marque}</p>
        <Titre className="mt-1 line-clamp-2 text-[15px] leading-snug font-medium">{c.nom}</Titre>
        <div className="mt-1">
          <Prix chaussure={c} />
        </div>
      </div>
    </Link>
  );
}
