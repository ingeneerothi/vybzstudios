"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { IconeWhatsapp } from "@/components/site/Icones";
import { DUREE, EASE_SORTIE } from "@/lib/motion";

type Props = {
  titre: string;
  code: string;
  lienWhatsapp: string;
  /** Ouvre WhatsApp automatiquement après l'animation. */
  ouvrirAuto?: boolean;
  /** Appelé quand le client retourne à la boutique (le formulaire repart à zéro). */
  onFermer?: () => void;
};

/** Écran de validation : une coche se dessine, puis WhatsApp s'ouvre avec le message prêt. */
export function Validation({ titre, code, lienWhatsapp, ouvrirAuto = true, onFermer }: Props) {
  // Une seule ouverture automatique : Next peut réafficher cette page plus tard (écran gardé en mémoire).
  const dejaOuvert = useRef(false);

  useEffect(() => {
    if (!ouvrirAuto || dejaOuvert.current) return;
    const minuteur = window.setTimeout(() => {
      dejaOuvert.current = true;
      window.location.assign(lienWhatsapp);
    }, 1400);
    return () => window.clearTimeout(minuteur);
  }, [lienWhatsapp, ouvrirAuto]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUREE.base }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-papier px-6 text-center"
    >
      <svg viewBox="0 0 96 96" className="size-24" aria-hidden>
        <motion.circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke="var(--color-vert)"
          strokeWidth="3"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: DUREE.entree, ease: EASE_SORTIE }}
          style={{ originX: "50%", originY: "50%" }}
        />
        <motion.path
          d="M30 49.5 42.5 62 66 36"
          fill="none"
          stroke="var(--color-vert)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: DUREE.base, ease: EASE_SORTIE, delay: DUREE.base }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUREE.entree, ease: EASE_SORTIE, delay: DUREE.entree }}
        className="flex flex-col items-center"
      >
        <h2 className="mt-6 text-[26px] leading-tight font-bold tracking-[-0.02em]">{titre}</h2>
        <p className="mt-2 text-[15px] text-gris">
          N° <span className="font-semibold text-encre tabular-nums">{code}</span>
        </p>
        <p className="mt-6 max-w-xs text-[15px] text-gris">
          WhatsApp s&apos;ouvre avec votre message prêt : appuyez simplement sur{" "}
          <strong className="text-encre">Envoyer</strong>.
        </p>
        <a href={lienWhatsapp} className="bouton-plein mt-8 bg-vert hover:bg-vert-fonce">
          <IconeWhatsapp className="size-5" />
          Ouvrir WhatsApp
        </a>
        <Link
          href="/"
          onClick={onFermer}
          className="mt-4 min-h-11 content-center text-[15px] text-gris underline underline-offset-4"
        >
          Retour à la boutique
        </Link>
      </motion.div>
    </motion.div>
  );
}
