import Link from "next/link";

/** Seul ajout de l'aperçu : un lien pour passer du site client à l'espace vendeur, et retour. */
export function BandeauApercu({ cote }: { cote: "site" | "vendeur" }) {
  if (cote === "site") {
    return (
      <footer data-apercu className="border-t border-trait bg-carte px-4 py-5 text-center text-[14px] text-gris">
        Aperçu du site Vertical Store ·{" "}
        <Link href="/admin" className="font-semibold text-encre underline underline-offset-4">
          Voir l&apos;espace vendeur →
        </Link>
      </footer>
    );
  }
  return (
    <div data-apercu className="flex items-center justify-between gap-3 bg-encre px-4 py-2.5 text-[14px] text-white">
      <span>Aperçu de l&apos;espace vendeur</span>
      <Link href="/" className="font-semibold underline underline-offset-4">
        ← Voir le site
      </Link>
    </div>
  );
}
