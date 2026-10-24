import type { Metadata } from "next";
import Link from "next/link";
import { TransitionPage } from "@/components/site/TransitionPage";
import { FicheChaussure } from "@/components/chaussure/FicheChaussure";
import { getCatalogue, getChaussure } from "@/lib/donnees/catalogue";

export async function generateStaticParams() {
  const { chaussures } = await getCatalogue();
  const slugs = chaussures.map((c) => ({ slug: c.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "apercu" }];
}

export async function generateMetadata({ params }: PageProps<"/chaussure/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getChaussure(slug);
  if (!c) return { title: "Chaussure introuvable" };
  return {
    title: `${c.nom} — ${c.marque}`,
    description: c.description,
    openGraph: { images: c.images[0] ? [{ url: c.images[0] }] : undefined },
  };
}

export default function PageChaussure({ params }: PageProps<"/chaussure/[slug]">) {
  return (
    <TransitionPage>
      <Fiche params={params} />
    </TransitionPage>
  );
}

async function Fiche({ params }: Pick<PageProps<"/chaussure/[slug]">, "params">) {
  const { slug } = await params;
  const [chaussure, catalogue] = await Promise.all([getChaussure(slug), getCatalogue()]);
  if (!chaussure) return <Introuvable />;
  return <FicheChaussure chaussure={chaussure} modePaiement={catalogue.reglages.modePaiement} />;
}

function Introuvable() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-36 pb-24 text-center">
      <h1 className="titre-section">Chaussure introuvable</h1>
      <p className="mt-4 text-[16px] text-gris">Elle a peut-être été retirée de la boutique.</p>
      <Link href="/collection" className="bouton-plein mt-8">
        Voir la collection
      </Link>
    </div>
  );
}
