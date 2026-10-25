"use client";

// Version aperçu de l'écran de validation : la même coche, puis le message que le vendeur
// reçoit sur WhatsApp s'affiche ici, au lieu d'ouvrir WhatsApp automatiquement.
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { IconeWhatsapp } from "@/components/site/Icones";
import { lireDemo } from "@/lib/demo/magasin";
import { DUREE, EASE_SORTIE } from "@/lib/motion";

type Props = {
  titre: string;
  code: string;
  lienWhatsapp: string;
  ouvrirAuto?: boolean;
  onFermer?: () => void;
};

function messageDuLien(lien: string): string {
  try {
    return new URL(lien).searchParams.get("text") ?? "";
  } catch {
    return "";
  }
}

const PHOTO = "🖼️ Photo : ";

/** « https://…/chaussure/x » -> « /chaussure/x » (pas encore d'adresse en ligne dans l'aperçu). */
function chemin(lien: string): string {
  try {
    return new URL(lien).pathname;
  } catch {
    return lien;
  }
}

export function Validation({ titre, code, lienWhatsapp, onFermer }: Props) {
  const message = messageDuLien(lienWhatsapp);
  const lignes = message.split("\n");
  const lienPhoto = lignes.find((l) => l.startsWith(PHOTO))?.slice(PHOTO.length);
  const slug = lienPhoto ? chemin(lienPhoto).split("/").pop() : undefined;
  const chaussure = slug ? lireDemo().chaussures.find((c) => c.slug === slug) : undefined;
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUREE.base }}
      className="fixed inset-0 z-50 overflow-y-auto bg-papier"
    >
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
        <svg viewBox="0 0 96 96" className="size-20" aria-hidden>
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
          className="flex w-full max-w-sm flex-col items-center"
        >
          <h2 className="mt-5 text-[26px] leading-tight font-bold tracking-[-0.02em]">{titre}</h2>
          <p className="mt-2 text-[15px] text-gris">
            N° <span className="font-semibold text-encre tabular-nums">{code}</span>
          </p>
          <p className="mt-6 text-[15px] text-gris">
            Sur le vrai site, WhatsApp s&apos;ouvre ici. Voici le message que vous recevrez :
          </p>
          <div className="mt-4 w-full rounded-[22px] bg-[#e4f2d5] p-3 text-left shadow-sm ring-1 ring-vert/15">
            <p className="flex items-center gap-2 px-1 text-[13px] font-semibold text-vert">
              <IconeWhatsapp className="size-4" />
              WhatsApp
            </p>
            {chaussure && (
              // Ce que WhatsApp affiche grâce au lien « Photo » : la photo de la chaussure en haut du message.
              <div className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                <div className="relative aspect-[1200/630] bg-papier">
                  <Image src={chaussure.images[0]} alt="" fill className="object-contain p-[5%]" />
                </div>
                <div className="px-3 py-2">
                  <p className="text-[13px] leading-snug font-semibold">
                    {chaussure.nom} — {chaussure.marque} · Vertical Store
                  </p>
                  <p className="text-[12px] text-gris">{chaussure.description.split(".")[0]}.</p>
                </div>
              </div>
            )}
            <p className="mt-2 px-1 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-encre">
              {lignes.map((ligne, i) => (
                <Fragment key={i}>
                  {ligne.startsWith(PHOTO) ? (
                    <>
                      {PHOTO}
                      <span className="text-[#1c6fb0] underline">…{chemin(ligne.slice(PHOTO.length))}</span>
                    </>
                  ) : (
                    ligne
                  )}
                  {i < lignes.length - 1 && "\n"}
                </Fragment>
              ))}
            </p>
          </div>
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
      </div>
    </motion.div>
  );
}
