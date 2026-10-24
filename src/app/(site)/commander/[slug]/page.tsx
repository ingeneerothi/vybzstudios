import type { Metadata } from "next";
import Link from "next/link";
import { TransitionPage } from "@/components/site/TransitionPage";
import { FormulaireCommande } from "@/components/commande/FormulaireCommande";
import { getCatalogue } from "@/lib/donnees/catalogue";
import { estEnRupture } from "@/lib/prix";

export const metadata: Metadata = {
  title: "Commande",
  robots: { index: false },
};

export async function generateStaticParams() {
  const { chaussures } = await getCatalogue();
  const slugs = chaussures.map((c) => ({ slug: c.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "apercu" }];
}

export default function PageCommande({ params }: PageProps<"/commander/[slug]">) {
  return (
    <TransitionPage>
      <Commande params={params} />
    </TransitionPage>
  );
}

async function Commande({ params }: Pick<PageProps<"/commander/[slug]">, "params">) {
  const { slug } = await params;
  const catalogue = await getCatalogue();
  const chaussure = catalogue.chaussures.find((c) => c.slug === slug);

  if (!chaussure || estEnRupture(chaussure)) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-36 pb-24 text-center">
        <h1 className="titre-section">{chaussure ? "Rupture de stock" : "Chaussure introuvable"}</h1>
        <p className="mt-4 text-[16px] text-gris">
          {chaussure
            ? "Cette paire n'est plus disponible pour le moment."
            : "Elle a peut-être été retirée de la boutique."}
        </p>
        <Link href="/collection" className="bouton-plein mt-8">
          Voir la collection
        </Link>
      </div>
    );
  }

  return (
    <FormulaireCommande
      chaussure={chaussure}
      zones={catalogue.zones}
      modePaiement={catalogue.reglages.modePaiement}
      whatsapp={catalogue.whatsapp}
    />
  );
}
