import type { Metadata } from "next";
import { PageCommande } from "@/components/pages/PageCommande";
import { getCatalogue } from "@/lib/donnees/catalogue";

export const metadata: Metadata = {
  title: "Commande",
  robots: { index: false },
};

export async function generateStaticParams() {
  const { chaussures } = await getCatalogue();
  const slugs = chaussures.map((c) => ({ slug: c.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "apercu" }];
}

export default async function Commander({ params }: PageProps<"/commander/[slug]">) {
  const { slug } = await params;
  return <PageCommande catalogue={await getCatalogue()} slug={slug} />;
}
