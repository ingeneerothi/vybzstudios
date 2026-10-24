"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMarque } from "@/components/marque/LogoMarque";
import { cn } from "@/lib/cn";

/**
 * En-tête fixe : transparent sur le grand visuel de l'accueil, clair ailleurs.
 * Il se range quand on descend et revient dès qu'on remonte.
 */
export function Entete() {
  const chemin = usePathname();
  const surVisuel = chemin === "/";
  const [haut, setHaut] = useState(true);
  const [cache, setCache] = useState(false);

  useEffect(() => {
    let dernier = window.scrollY;
    const suivre = () => {
      const y = window.scrollY;
      setHaut(y < (surVisuel ? window.innerHeight * 0.7 : 8));
      setCache(y > 120 && y > dernier + 4);
      if (Math.abs(y - dernier) > 4) dernier = y;
    };
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    return () => window.removeEventListener("scroll", suivre);
  }, [surVisuel]);

  const transparent = surVisuel && haut;

  return (
    <header
      style={{ viewTransitionName: "entete" }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[transform,background-color,color,border-color] duration-400 ease-sortie",
        "pt-[env(safe-area-inset-top)]",
        transparent
          ? "border-b border-transparent text-white"
          : "border-b border-trait/70 bg-papier/90 text-encre backdrop-blur-md",
        cache && !transparent && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Vertical Store, accueil"
          tabIndex={transparent ? -1 : undefined}
          className={cn(
            "flex min-h-11 items-center gap-2 transition-opacity duration-400",
            // Sur le grand visuel, le logo est déjà au centre : on ne le répète pas.
            transparent && "pointer-events-none opacity-0",
          )}
        >
          <LogoMarque className="h-7 w-auto shrink-0" titre={null} />
          <span className="text-[12px] font-extrabold tracking-[0.12em] whitespace-nowrap uppercase max-[340px]:sr-only">
            Vertical Store
          </span>
        </Link>
        <nav
          aria-label="Navigation principale"
          className="flex items-center gap-1 text-[13px] font-medium sm:text-[14px]"
        >
          <LienNav href="/collection" actif={chemin.startsWith("/collection")}>
            Collection
          </LienNav>
          <LienNav href="/demande" actif={chemin.startsWith("/demande")}>
            Sur demande
          </LienNav>
        </nav>
      </div>
    </header>
  );
}

function LienNav({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center px-2 whitespace-nowrap transition-opacity duration-200",
        "after:absolute after:inset-x-2 after:bottom-2.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-400 after:ease-sortie",
        actif ? "after:scale-x-100" : "opacity-80 after:scale-x-0 hover:opacity-100 hover:after:scale-x-100",
      )}
    >
      {children}
    </Link>
  );
}
