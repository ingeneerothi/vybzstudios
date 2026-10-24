import type { Metadata } from "next";
import { PageChaussure } from "@/components/pages/PageChaussure";
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

export default async function PageFiche({ params }: PageProps<"/chaussure/[slug]">) {
  const { slug } = await params;
  return <PageChaussure catalogue={await getCatalogue()} slug={slug} />;
}
