"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import { ViewTransition, useEffect, useRef, useState } from "react";
import { IconeGlisser } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE, EASE_TRANSITION, RESSORT } from "@/lib/motion";

const SEUIL_GLISSE = 70;
const CLE_INDICE = "vs-indice-galerie";
const TAILLES = "(min-width: 1024px) 560px, 100vw";

type Props = {
  images: string[];
  nom: string;
  slug: string;
  enRupture?: boolean;
  /** false pour des photos locales (aperçu dans l'admin) : pas d'optimisation d'image. */
  optimiser?: boolean;
};

/**
 * Galerie d'angles : on glisse (doigt ou souris) pour faire pivoter la chaussure vers l'angle suivant.
 * Inclinaison légère au survol, zoom au double toucher, points indicateurs, préchargement discret.
 */
export function GalerieAngles({ images, nom, slug, enRupture, optimiser = true }: Props) {
  const reduit = useReducedMotion();
  const scene = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [sens, setSens] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [indice, setIndice] = useState(false);
  const [premiereChargee, setPremiereChargee] = useState(false);
  const plusieurs = images.length > 1;

  // Glisser : la scène suit le doigt et pivote en perspective.
  const glisse = useMotionValue(0);
  const glisseX = useTransform(glisse, (v) => v * 0.55);
  const pivot = useTransform(glisse, (v) => v * -0.09);
  const fondu = useTransform(glisse, (v) => 1 - Math.min(Math.abs(v) / 700, 0.35));

  // Inclinaison au survol (souris).
  const inclinaisonX = useMotionValue(0);
  const inclinaisonY = useMotionValue(0);
  const rotateX = useSpring(inclinaisonX, RESSORT);
  const rotateY = useSpring(inclinaisonY, RESSORT);

  const pointeur = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const dernierTap = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    if (!plusieurs) return;
    let vu = false;
    try {
      vu = localStorage.getItem(CLE_INDICE) === "1";
      localStorage.setItem(CLE_INDICE, "1");
    } catch {}
    if (vu) return;
    const montrer = window.setTimeout(() => setIndice(true), 900);
    const cacher = window.setTimeout(() => setIndice(false), 4800);
    return () => {
      window.clearTimeout(montrer);
      window.clearTimeout(cacher);
    };
  }, [plusieurs]);

  function aller(delta: number) {
    if (!plusieurs) return;
    setIndice(false);
    setZoom(null);
    setSens(delta);
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  function choisir(i: number) {
    if (i === index) return;
    setIndice(false);
    setZoom(null);
    setSens(i > index ? 1 : -1);
    setIndex(i);
  }

  function basculerZoom(clientX: number, clientY: number) {
    if (zoom) return setZoom(null);
    const r = scene.current!.getBoundingClientRect();
    setZoom({ x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 });
  }

  function surAppui(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointeur.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function surMouvement(e: React.PointerEvent) {
    const r = scene.current!.getBoundingClientRect();
    if (zoom) {
      if (pointeur.current || e.pointerType === "mouse") {
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }
      return;
    }
    if (!pointeur.current) {
      if (e.pointerType === "mouse" && !reduit) {
        inclinaisonY.set(((e.clientX - r.left) / r.width - 0.5) * 10);
        inclinaisonX.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
      }
      return;
    }
    if (plusieurs) glisse.set(e.clientX - pointeur.current.x);
  }

  function surRelache(e: React.PointerEvent) {
    const depart = pointeur.current;
    pointeur.current = null;
    if (!depart) return;
    const dx = e.clientX - depart.x;
    const dy = e.clientY - depart.y;
    const duree = performance.now() - depart.t;

    if (!zoom && plusieurs && Math.abs(dx) > 8) {
      const vitesse = dx / Math.max(duree, 1);
      if (dx + vitesse * 120 < -SEUIL_GLISSE) aller(1);
      else if (dx + vitesse * 120 > SEUIL_GLISSE) aller(-1);
      animate(glisse, 0, RESSORT);
      return;
    }
    animate(glisse, 0, RESSORT);

    // Double toucher (ou double clic) : zoom.
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const maintenant = performance.now();
      const avant = dernierTap.current;
      if (avant && maintenant - avant.t < 320 && Math.hypot(e.clientX - avant.x, e.clientY - avant.y) < 30) {
        dernierTap.current = null;
        basculerZoom(e.clientX, e.clientY);
      } else {
        dernierTap.current = { x: e.clientX, y: e.clientY, t: maintenant };
      }
    }
  }

  function surSortie() {
    inclinaisonX.set(0);
    inclinaisonY.set(0);
  }

  function surClavier(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") aller(1);
    else if (e.key === "ArrowLeft") aller(-1);
    else if (e.key === "Escape") setZoom(null);
  }

  const variantes = {
    entree: (s: number) => ({ x: `${s * 45}%`, rotateY: s * -55, opacity: 0, scale: 0.94 }),
    centre: { x: "0%", rotateY: 0, opacity: 1, scale: 1 },
    sortie: (s: number) => ({ x: `${s * -45}%`, rotateY: s * 55, opacity: 0, scale: 0.94 }),
  };

  return (
    <div className="select-none">
      <div
        ref={scene}
        role="group"
        aria-roledescription="galerie"
        aria-label={`${nom}, vue ${index + 1} sur ${images.length}. Flèches gauche et droite pour changer d'angle, double clic pour zoomer.`}
        tabIndex={0}
        onKeyDown={surClavier}
        onPointerDown={surAppui}
        onPointerMove={surMouvement}
        onPointerUp={surRelache}
        onPointerCancel={surRelache}
        onPointerLeave={surSortie}
        className={cn(
          "fond-marque relative aspect-square w-full overflow-hidden [perspective:1100px] lg:rounded-[28px]",
          zoom ? "touch-none" : "touch-pan-y",
          zoom ? "cursor-zoom-out" : plusieurs ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
      >
        <div
          aria-hidden
          className="ombre-sol absolute inset-x-[18%] top-[80%] h-[7%] animate-[ombre-flotter_4.8s_var(--ease-transition)_infinite]"
        />

        <motion.div className="absolute inset-0" style={{ x: glisseX, rotateY: pivot, opacity: fondu }}>
          <motion.div className="absolute inset-0" style={{ rotateX, rotateY }}>
            <AnimatePresence initial={false} custom={sens}>
              <motion.div
                key={index}
                custom={sens}
                variants={variantes}
                initial="entree"
                animate="centre"
                exit="sortie"
                transition={{
                  default: { duration: DUREE.entree, ease: EASE_SORTIE },
                  opacity: { duration: DUREE.base, ease: EASE_TRANSITION },
                }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 animate-flotter">
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: zoom ? 2.2 : 1 }}
                    transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
                    style={{ transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 60%" }}
                  >
                    {index === 0 ? (
                      <ViewTransition name={`chaussure-${slug}`} share="morph" default="none">
                        <Image
                          src={images[0]}
                          alt={`${nom}, vue 1`}
                          fill
                          priority
                          sizes={TAILLES}
                          quality={80}
                          draggable={false}
                          unoptimized={!optimiser}
                          onLoad={() => setPremiereChargee(true)}
                          className={cn("object-contain p-[3%]", enRupture && "opacity-60")}
                        />
                      </ViewTransition>
                    ) : (
                      <Image
                        src={images[index]}
                        alt={`${nom}, vue ${index + 1}`}
                        fill
                        sizes={TAILLES}
                        quality={80}
                        draggable={false}
                        unoptimized={!optimiser}
                        className={cn("object-contain p-[3%]", enRupture && "opacity-60")}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Préchargement des autres angles, une fois la première vue affichée. */}
        {premiereChargee && (
          <div aria-hidden className="pointer-events-none absolute size-px overflow-hidden opacity-0">
            {images.slice(1).map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={1}
                height={1}
                sizes={TAILLES}
                quality={80}
                loading="eager"
                fetchPriority="low"
                unoptimized={!optimiser}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {indice && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
              className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
            >
              <span className="flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-md">
                <IconeGlisser className="size-4" />
                Glissez pour voir tous les angles
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {plusieurs && (
        <div className="mt-4 flex justify-center gap-1" aria-label="Choisir un angle">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-pressed={i === index}
              aria-label={`Vue ${i + 1}`}
              onClick={() => choisir(i)}
              className="grid size-8 place-items-center"
            >
              <span
                className={cn(
                  "block size-2 rounded-full bg-encre transition-[opacity,transform] duration-400 ease-sortie",
                  i === index ? "scale-125 opacity-100" : "opacity-25",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
