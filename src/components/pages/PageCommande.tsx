import { FormulaireCommande } from "@/components/commande/FormulaireCommande";
import { TransitionPage } from "@/components/site/TransitionPage";
import { estEnRupture } from "@/lib/prix";
import type { Catalogue } from "@/lib/types";
import { Introuvable } from "./Introuvable";

export function PageCommande({ catalogue, slug }: { catalogue: Catalogue; slug: string }) {
  const chaussure = catalogue.chaussures.find((c) => c.slug === slug);
  return (
    <TransitionPage>
      {!chaussure ? (
        <Introuvable />
      ) : estEnRupture(chaussure) ? (
        <Introuvable titre="Rupture de stock" texte="Cette paire n'est plus disponible pour le moment." />
      ) : (
        <FormulaireCommande
          chaussure={chaussure}
          zones={catalogue.zones}
          modePaiement={catalogue.reglages.modePaiement}
          whatsapp={catalogue.whatsapp}
        />
      )}
    </TransitionPage>
  );
}
