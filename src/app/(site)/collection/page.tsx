import type { Metadata } from "next";
import { PageCollection } from "@/components/pages/PageCollection";
import { getCatalogue } from "@/lib/donnees/catalogue";

export const metadata: Metadata = {
  title: "Collection",
  description: "Toutes les sneakers Vertical Store, livrées à Abidjan et partout en Côte d'Ivoire.",
};

export default async function Collection() {
  const { chaussures } = await getCatalogue();
  return <PageCollection chaussures={chaussures} />;
}
