"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeChaussure, IconeListe, IconeReglages, IconeWhatsapp } from "@/components/site/Icones";
import { cn } from "@/lib/cn";

const ONGLETS = [
  { href: "/admin/chaussures", libelle: "Chaussures", Icone: IconeChaussure },
  { href: "/admin/commandes", libelle: "Commandes", Icone: IconeListe },
  { href: "/admin/numeros", libelle: "Numéros", Icone: IconeWhatsapp },
  { href: "/admin/reglages", libelle: "Réglages", Icone: IconeReglages },
];

/** Menu en bas de l'écran : 4 onglets, atteignables avec le pouce. */
export function BarreOnglets() {
  const chemin = usePathname();
  return (
    <nav
      aria-label="Menu de l'administration"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trait bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {ONGLETS.map(({ href, libelle, Icone }) => {
          const actif = chemin.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "flex min-h-[68px] flex-col items-center justify-center gap-1 text-[13px] transition-colors duration-200",
                  actif ? "font-semibold text-vert" : "text-gris",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors",
                    actif && "bg-vert/10",
                  )}
                >
                  <Icone className="size-6" />
                </span>
                {libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
