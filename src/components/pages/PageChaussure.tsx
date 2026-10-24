import { FicheChaussure } from "@/components/chaussure/FicheChaussure";
import { TransitionPage } from "@/components/site/TransitionPage";
import type { Catalogue } from "@/lib/types";
import { Introuvable } from "./Introuvable";

export function PageChaussure({ catalogue, slug }: { catalogue: Catalogue; slug: string }) {
  const chaussure = catalogue.chaussures.find((c) => c.slug === slug);
  return (
    <TransitionPage>
      {chaussure ? (
        <FicheChaussure chaussure={chaussure} modePaiement={catalogue.reglages.modePaiement} />
      ) : (
        <Introuvable />
      )}
    </TransitionPage>
  );
}
