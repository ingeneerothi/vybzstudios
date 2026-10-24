import type { Metadata } from "next";
import { PageDemande } from "@/components/pages/PageDemande";
import { getCatalogue } from "@/lib/donnees/catalogue";

export const metadata: Metadata = {
  title: "Sur demande",
  description: "Vous ne trouvez pas votre chaussure ? Envoyez une photo, on vous la trouve.",
};

export default async function Demande() {
  const { whatsapp } = await getCatalogue();
  return <PageDemande whatsapp={whatsapp} />;
}
