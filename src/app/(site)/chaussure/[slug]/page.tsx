import type { Metadata } from "next";
import { PageChaussure } from "@/components/pages/PageChaussure";
import { getCatalogue, getChaussure } from "@/lib/donnees/catalogue";
import { TAILLE_PARTAGE, imagePartage } from "@/lib/partage";

export async function generateStaticParams() {
  const { chaussures } = await getCatalogue();
  const slugs = chaussures.map((c) => ({ slug: c.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "apercu" }];
}

export async function generateMetadata({ params }: PageProps<"/chaussure/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getChaussure(slug);
  if (!c) return { title: "Chaussure introuvable" };
  const partage = imagePartage(c.images[0]);
  return {
    title: `${c.nom} — ${c.marque}`,
    description: c.description,
    // Photo affichée par WhatsApp quand le lien de la fiche arrive avec une commande.
    openGraph: {
      type: "website",
      locale: "fr_CI",
      siteName: "Vertical Store",
      title: `${c.nom} — ${c.marque} · Vertical Store`,
      description: c.description,
      images: partage ? [{ url: partage, ...TAILLE_PARTAGE, alt: `${c.marque} ${c.nom}` }] : undefined,
    },
    twitter: partage ? { card: "summary_large_image" } : undefined,
  };
}

export default async function PageFiche({ params }: PageProps<"/chaussure/[slug]">) {
  const { slug } = await params;
  return <PageChaussure catalogue={await getCatalogue()} slug={slug} />;
}
