"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { lienWhatsapp } from "@/lib/whatsapp";
import { IconeWhatsapp } from "./Icones";

/** Bouton WhatsApp flottant, discret, vers le numéro actif. */
export function BoutonWhatsapp({ numero }: { numero: string }) {
  const chemin = usePathname();
  // Sur les formulaires, le bouton gênerait la saisie (et le formulaire mène déjà à WhatsApp).
  if (!numero || chemin.startsWith("/commander") || chemin.startsWith("/demande")) return null;
  const surFiche = chemin.startsWith("/chaussure/");

  return (
    <motion.a
      href={lienWhatsapp(numero, "Bonjour Vertical Store !")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à Vertical Store sur WhatsApp"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DUREE.base, ease: EASE_SORTIE, delay: 1.2 }}
      className={cn(
        "fixed right-4 z-30 size-12 place-items-center rounded-full bg-encre/90 text-white shadow-[0_8px_24px_rgb(0_0_0/0.18)] backdrop-blur",
        "transition-colors duration-200 hover:bg-vert-fonce",
        // Sur la fiche produit (mobile), la barre « Commander » suffit : pas de bouton en plus.
        surFiche ? "hidden bottom-6 lg:grid" : "grid bottom-[calc(1.25rem+env(safe-area-inset-bottom))]",
      )}
    >
      <IconeWhatsapp className="size-6" />
    </motion.a>
  );
}
