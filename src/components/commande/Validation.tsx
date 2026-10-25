"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconeAppareilPhoto, IconeCoche, IconeWhatsapp } from "@/components/site/Icones";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { partagerPhoto, peutPartager } from "@/lib/partager";
import { usePhotoWhatsapp } from "./usePhotoWhatsapp";

type Props = {
  titre: string;
  code: string;
  lienWhatsapp: string;
  /** Ouvre WhatsApp automatiquement après l'animation. */
  ouvrirAuto?: boolean;
  /** Photo de la chaussure, envoyée comme une vraie photo après le message (téléphones qui savent partager). */
  photo?: { source: string; nomFichier: string; legende: string };
  /** Appelé quand le client retourne à la boutique (le formulaire repart à zéro). */
  onFermer?: () => void;
};

/**
 * Écran de validation : une coche se dessine, puis WhatsApp s'ouvre avec le message prêt.
 * Sur un téléphone qui sait partager une photo, deux étapes : le message, puis la photo dans la même discussion
 * (un lien WhatsApp ne transporte que du texte, la photo passe par le menu « Partager »).
 */
export function Validation({ titre, code, lienWhatsapp, ouvrirAuto = true, photo, onFermer }: Props) {
  // Une seule ouverture automatique : Next peut réafficher cette page plus tard (écran gardé en mémoire).
  const dejaOuvert = useRef(false);
  const fichier = usePhotoWhatsapp(photo?.source, photo?.nomFichier ?? "chaussure.jpg");
  const [tactile] = useState(() => typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches);
  const etapes = Boolean(photo) && tactile && peutPartager(fichier);
  const [photoEnvoyee, setPhotoEnvoyee] = useState(false);

  useEffect(() => {
    // En deux étapes, c'est le client qui ouvre WhatsApp : l'écran reste là pour l'étape « photo ».
    if (!ouvrirAuto || etapes || dejaOuvert.current) return;
    const minuteur = window.setTimeout(() => {
      dejaOuvert.current = true;
      window.location.assign(lienWhatsapp);
    }, 1400);
    return () => window.clearTimeout(minuteur);
  }, [lienWhatsapp, ouvrirAuto, etapes]);

  async function envoyerPhoto() {
    if (!photo || !peutPartager(fichier)) return;
    if (await partagerPhoto(fichier, photo.legende).catch(() => false)) setPhotoEnvoyee(true);
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUREE.base }}
      className="fixed inset-0 z-50 overflow-y-auto bg-papier"
    >
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
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
          className="flex w-full max-w-xs flex-col items-center"
        >
          <h2 className="mt-6 text-[26px] leading-tight font-bold tracking-[-0.02em]">{titre}</h2>
          <p className="mt-2 text-[15px] text-gris">
            N° <span className="font-semibold text-encre tabular-nums">{code}</span>
          </p>

          {etapes ? (
            <ol className="mt-7 w-full space-y-5 text-left">
              <li>
                <p className="text-[15px] text-gris">
                  <span className="font-semibold text-encre">1.</span> Envoyez votre commande sur WhatsApp.
                </p>
                <a href={lienWhatsapp} className="bouton-plein mt-2 w-full bg-vert hover:bg-vert-fonce">
                  <IconeWhatsapp className="size-5" />
                  Ouvrir WhatsApp
                </a>
              </li>
              <li>
                <p className="text-[15px] text-gris">
                  <span className="font-semibold text-encre">2.</span> Puis la photo de la chaussure : choisissez la
                  même discussion.
                </p>
                <button type="button" onClick={envoyerPhoto} className="bouton-contour mt-2 w-full">
                  {photoEnvoyee ? <IconeCoche className="size-5" /> : <IconeAppareilPhoto className="size-5" />}
                  {photoEnvoyee ? "Photo envoyée" : "Envoyer la photo"}
                </button>
              </li>
            </ol>
          ) : (
            <>
              <p className="mt-6 text-[15px] text-gris">
                WhatsApp s&apos;ouvre avec votre message prêt : appuyez simplement sur{" "}
                <strong className="text-encre">Envoyer</strong>.
              </p>
              <a href={lienWhatsapp} className="bouton-plein mt-8 bg-vert hover:bg-vert-fonce">
                <IconeWhatsapp className="size-5" />
                Ouvrir WhatsApp
              </a>
            </>
          )}
          <Link
            href="/"
            onClick={onFermer}
            className="mt-5 min-h-11 content-center text-[15px] text-gris underline underline-offset-4"
          >
            Retour à la boutique
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
