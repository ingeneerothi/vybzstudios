import Link from "next/link";
import { IconeRetour } from "@/components/site/Icones";

/** Titre de l'écran, avec un retour simple si besoin. */
export function EnTeteAdmin({
  titre,
  retour,
  action,
}: {
  titre: string;
  retour?: { href: string; libelle: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-trait/70 bg-papier/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-xl items-center gap-3 px-4">
        {retour && (
          <Link
            href={retour.href}
            aria-label={retour.libelle}
            className="-ml-2 grid size-12 shrink-0 place-items-center rounded-full hover:bg-carte"
          >
            <IconeRetour className="size-6" />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-bold tracking-[-0.01em]">{titre}</h1>
        {action}
      </div>
    </header>
  );
}
