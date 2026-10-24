import Link from "next/link";
import { LogoMarque } from "@/components/marque/LogoMarque";
import { formatPrix, libellePaiement } from "@/lib/format";
import { afficherNumeroWhatsapp } from "@/lib/telephone";
import type { Catalogue } from "@/lib/types";
import { lienWhatsapp } from "@/lib/whatsapp";

export function PiedDePage({ catalogue }: { catalogue: Catalogue }) {
  const { zones, whatsapp, reglages } = catalogue;
  return (
    <footer className="border-t border-trait bg-papier">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMarque className="h-9 w-auto" titre={null} />
            <span className="text-[13px] font-extrabold tracking-[0.14em] uppercase">Vertical Store</span>
          </Link>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-gris">
            Sneakers livrées à Abidjan et partout en Côte d&apos;Ivoire.
          </p>
        </div>

        <div>
          <h2 className="etiquette text-gris">Contact</h2>
          {whatsapp && (
            <a
              href={lienWhatsapp(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-[15px] font-medium underline-offset-4 hover:underline"
            >
              WhatsApp {afficherNumeroWhatsapp(whatsapp)}
            </a>
          )}
          <p className="mt-2 text-[15px] text-gris">Paiement : {libellePaiement(reglages.modePaiement)}</p>
        </div>

        <div>
          <h2 className="etiquette text-gris">Livraison</h2>
          <ul className="mt-3 space-y-1.5 text-[15px]">
            {zones.map((z) => (
              <li key={z.id} className="flex justify-between gap-4">
                <span>{z.nom}</span>
                <span className="text-gris tabular-nums">{formatPrix(z.frais)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-trait px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[13px] text-gris sm:px-6">
        <span>© Vertical Store</span>
        <Link href="/admin" className="min-h-11 content-center hover:text-encre">
          Espace vendeur
        </Link>
      </div>
    </footer>
  );
}
