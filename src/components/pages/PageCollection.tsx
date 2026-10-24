import { GrilleCollection } from "@/components/chaussure/GrilleCollection";
import { BlocDemande } from "@/components/site/BlocDemande";
import { TransitionPage } from "@/components/site/TransitionPage";
import type { Chaussure } from "@/lib/types";

export function PageCollection({ chaussures }: { chaussures: Chaussure[] }) {
  return (
    <TransitionPage>
      <div className="mx-auto max-w-6xl px-4 pt-[calc(6rem+env(safe-area-inset-top))] pb-20 sm:px-6 md:pt-32">
        <h1 className="titre-section">Collection</h1>
        <GrilleCollection chaussures={chaussures} />
      </div>
      <BlocDemande />
    </TransitionPage>
  );
}
