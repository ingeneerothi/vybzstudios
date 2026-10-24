"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { GalerieAngles } from "@/components/chaussure/GalerieAngles";
import {
  IconeAppareilPhoto,
  IconeBas,
  IconeCroix,
  IconeHaut,
  IconePoignee,
  IconePoubelle,
} from "@/components/site/Icones";
import type { PhotoSaisie } from "@/lib/admin/api";
import { preparerPhotos } from "@/lib/admin/detourage";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { Interrupteur } from "./Interrupteur";

type Props = {
  photos: PhotoSaisie[];
  onChange: (photos: PhotoSaisie[]) => void;
  nom: string;
  erreur?: string;
};

const source = (p: PhotoSaisie) => ("url" in p ? p.url : p.apercu);

export function EditeurPhotos({ photos, onChange, nom, erreur }: Props) {
  const entreeSimple = useRef<HTMLInputElement>(null);
  const entreeMontage = useRef<HTMLInputElement>(null);
  const [detourer, setDetourer] = useState(true);
  const [etat, setEtat] = useState<string | null>(null);
  const [probleme, setProbleme] = useState("");
  const [apercu, setApercu] = useState(false);

  async function ajouter(fichiers: FileList | null, montage: boolean) {
    if (!fichiers?.length) return;
    setProbleme("");
    setEtat("Préparation des photos…");
    try {
      const vues = await preparerPhotos([...fichiers], { montage, detourer }, (fait, total) =>
        setEtat(`Préparation des photos… ${fait}/${total}`),
      );
      onChange([...photos, ...vues.map((v) => ({ cle: crypto.randomUUID(), blob: v.blob, apercu: v.apercu }))]);
    } catch (e) {
      setProbleme(e instanceof Error ? e.message : "Ces photos n'ont pas pu être préparées.");
    } finally {
      setEtat(null);
      if (entreeSimple.current) entreeSimple.current.value = "";
      if (entreeMontage.current) entreeMontage.current.value = "";
    }
  }

  function deplacer(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= photos.length) return;
    const copie = [...photos];
    [copie[i], copie[j]] = [copie[j], copie[i]];
    onChange(copie);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => entreeSimple.current?.click()}
          disabled={Boolean(etat)}
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-trait bg-white px-3 text-center text-[16px] font-medium hover:border-vert disabled:opacity-50"
        >
          <IconeAppareilPhoto className="size-7 text-vert" />
          Ajouter des photos
        </button>
        <button
          type="button"
          onClick={() => entreeMontage.current?.click()}
          disabled={Boolean(etat)}
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-trait bg-white px-3 text-center text-[16px] font-medium hover:border-vert disabled:opacity-50"
        >
          <span className="grid grid-cols-2 gap-0.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="size-3 rounded-[3px] bg-vert" />
            ))}
          </span>
          Ajouter un montage
          <span className="text-[13px] font-normal text-gris">plusieurs vues sur 1 image</span>
        </button>
      </div>
      <input
        ref={entreeSimple}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => ajouter(e.target.files, false)}
      />
      <input
        ref={entreeMontage}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => ajouter(e.target.files, true)}
      />

      <div className="mt-4 flex items-center justify-between gap-4 rounded-[20px] bg-white px-4 py-3 ring-1 ring-trait/70">
        <span className="text-[16px]">
          Retirer le fond blanc
          <span className="block text-[14px] text-gris">Automatique, pour photos sur fond blanc</span>
        </span>
        <Interrupteur actif={detourer} onChange={setDetourer} libelle="Retirer le fond blanc automatiquement" />
      </div>

      {etat && (
        <p className="mt-4 flex items-center gap-3 text-[16px]" role="status">
          <span className="size-6 animate-spin rounded-full border-[3px] border-trait border-t-vert" />
          {etat}
        </p>
      )}
      {(probleme || erreur) && (
        <p role="alert" className="mt-4 text-[15px] text-promo">
          {probleme || erreur}
        </p>
      )}

      {photos.length > 0 && (
        <>
          <p className="mt-5 text-[15px] text-gris">
            La 1<sup>re</sup> photo est la photo principale. Glissez la poignée pour changer l&apos;ordre.
          </p>
          <Reorder.Group axis="y" values={photos} onReorder={onChange} className="mt-3 space-y-2">
            {photos.map((p, i) => (
              <LignePhoto
                key={p.cle}
                photo={p}
                index={i}
                total={photos.length}
                onMonter={() => deplacer(i, -1)}
                onDescendre={() => deplacer(i, 1)}
                onRetirer={() => onChange(photos.filter((x) => x.cle !== p.cle))}
              />
            ))}
          </Reorder.Group>
          <button
            type="button"
            onClick={() => setApercu(true)}
            className="bouton-contour mt-4 min-h-13 w-full text-[16px]"
          >
            Voir l&apos;aperçu de la galerie
          </button>
        </>
      )}

      <AnimatePresence>
        {apercu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
            className="fixed inset-0 z-50 flex flex-col bg-papier"
            role="dialog"
            aria-modal="true"
            aria-label="Aperçu de la galerie"
          >
            <div className="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
              <p className="text-[18px] font-semibold">Aperçu sur le site</p>
              <button
                type="button"
                onClick={() => setApercu(false)}
                aria-label="Fermer l'aperçu"
                className="grid size-12 place-items-center rounded-full bg-white ring-1 ring-trait"
              >
                <IconeCroix className="size-6" />
              </button>
            </div>
            <div className="mx-auto w-full max-w-xl">
              <GalerieAngles images={photos.map(source)} nom={nom || "Aperçu"} slug="apercu-admin" optimiser={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LignePhoto({
  photo,
  index,
  total,
  onMonter,
  onDescendre,
  onRetirer,
}: {
  photo: PhotoSaisie;
  index: number;
  total: number;
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
}) {
  const controles = useDragControls();
  return (
    <Reorder.Item
      value={photo}
      dragListener={false}
      dragControls={controles}
      className="flex items-center gap-2 rounded-[20px] bg-white p-2 ring-1 ring-trait/70"
    >
      <button
        type="button"
        aria-label="Déplacer (glisser)"
        onPointerDown={(e) => controles.start(e)}
        className="grid size-12 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-gris active:cursor-grabbing"
      >
        <IconePoignee className="size-6" />
      </button>
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[conic-gradient(#e5e4dc_25%,#f6f5f0_0_50%,#e5e4dc_0_75%,#f6f5f0_0)] bg-[length:16px_16px]">
        <Image src={source(photo)} alt={`Vue ${index + 1}`} fill sizes="64px" className="object-contain" />
      </span>
      <span className="min-w-0 flex-1 text-[16px] leading-tight font-medium">
        {index === 0 ? "Principale" : `Vue ${index + 1}`}
      </span>
      <button
        type="button"
        onClick={onMonter}
        disabled={index === 0}
        aria-label="Monter"
        className="grid size-11 place-items-center rounded-full disabled:opacity-25"
      >
        <IconeHaut className="size-6" />
      </button>
      <button
        type="button"
        onClick={onDescendre}
        disabled={index === total - 1}
        aria-label="Descendre"
        className="grid size-11 place-items-center rounded-full disabled:opacity-25"
      >
        <IconeBas className="size-6" />
      </button>
      <button
        type="button"
        onClick={onRetirer}
        aria-label="Retirer cette photo"
        className="grid size-11 place-items-center rounded-full text-promo"
      >
        <IconePoubelle className="size-6" />
      </button>
    </Reorder.Item>
  );
}
