import { PageAccueil } from "@/components/pages/PageAccueil";
import { getCatalogue } from "@/lib/donnees/catalogue";

export default async function Accueil() {
  return <PageAccueil catalogue={await getCatalogue()} />;
}
