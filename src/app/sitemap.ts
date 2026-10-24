import type { MetadataRoute } from "next";
import { getCatalogue } from "@/lib/donnees/catalogue";
import { URL_SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { chaussures } = await getCatalogue();
  return [
    { url: URL_SITE, priority: 1 },
    { url: `${URL_SITE}/collection`, priority: 0.9 },
    { url: `${URL_SITE}/demande`, priority: 0.5 },
    ...chaussures.map((c) => ({ url: `${URL_SITE}/chaussure/${c.slug}`, priority: 0.8 })),
  ];
}
