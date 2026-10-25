"use client";

// Version aperçu de l'écran de validation : la même coche, puis ce que le vendeur reçoit sur WhatsApp
// (la photo de la chaussure, puis la commande), au lieu d'ouvrir WhatsApp automatiquement.
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePhotoWhatsapp } from "@/components/commande/usePhotoWhatsapp";
import { IconeAppareilPhoto, IconeWhatsapp } from "@/components/site/Icones";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { partagerPhoto, peutPartager } from "@/lib/partager";

type Props = {
  titre: string;
  code: string;
  lienWhatsapp: string;
  ouvrirAuto?: boolean;
  photo?: { source: string; nomFichier: string; legende: string };
  onFermer?: () => void;
};

function messageDuLien(lien: string): string {
  try {
    return new URL(lien).searchParams.get("text") ?? "";
  } catch {
    return "";
  }
}

function Bulle({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-[18px] rounded-tr-md bg-[#e4f2d5] p-1.5 text-left shadow-sm ring-1 ring-vert/15">
      {children}
    </div>
  );
}

export function Validation({ titre, code, lienWhatsapp, photo, onFermer }: Props) {
  const message = messageDuLien(lienWhatsapp);
  const fichier = usePhotoWhatsapp(photo?.source, photo?.nomFichier ?? "chaussure.jpg");
  // La photo exacte qui part sur WhatsApp (même fabrication que sur le vrai site).
  const apercuPhoto = useMemo(() => (fichier ? URL.createObjectURL(fichier) : null), [fichier]);
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
            Sur le vrai site, le client envoie sa commande sur WhatsApp, puis la photo. Voici ce que vous recevez&nbsp;:
          </p>
          <div className="mt-4 w-full space-y-2">
            <p className="flex items-center gap-2 px-1 text-left text-[13px] font-semibold text-vert">
              <IconeWhatsapp className="size-4" />
              WhatsApp
            </p>
            <Bulle>
              <p className="px-2 py-1 text-[14px] leading-relaxed break-words whitespace-pre-wrap text-encre">
                {message}
              </p>
            </Bulle>
            {photo && (
              <Bulle>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[13px] bg-papier">
                  {apercuPhoto ? (
                    <Image src={apercuPhoto} alt="" fill className="object-cover" />
                  ) : (
                    <Image src={photo.source} alt="" fill className="object-contain p-[6%]" />
                  )}
                </div>
                <p className="px-2 pt-1.5 pb-1 text-[14px] text-encre">{photo.legende}</p>
              </Bulle>
            )}
          </div>
          <a href={lienWhatsapp} className="bouton-plein mt-8 bg-vert hover:bg-vert-fonce">
            <IconeWhatsapp className="size-5" />
            Ouvrir WhatsApp
          </a>
          {photo && peutPartager(fichier) && (
            <button
              type="button"
              onClick={() => partagerPhoto(fichier, photo.legende).catch(() => false)}
              className="bouton-contour mt-3"
            >
              <IconeAppareilPhoto className="size-5" />
              Envoyer la photo
            </button>
          )}
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
