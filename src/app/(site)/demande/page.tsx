import type { Metadata } from "next";
import { FormulaireDemande } from "@/components/commande/FormulaireDemande";
import { TransitionPage } from "@/components/site/TransitionPage";
import { getCatalogue } from "@/lib/donnees/catalogue";

export const metadata: Metadata = {
  title: "Sur demande",
  description: "Vous ne trouvez pas votre chaussure ? Envoyez une photo, on vous la trouve.",
};

export default async function Demande() {
  const { whatsapp } = await getCatalogue();
  return (
    <TransitionPage>
      <div className="mx-auto max-w-xl px-4 pt-[calc(6rem+env(safe-area-inset-top))] pb-20 sm:px-6 md:pt-32">
        <p className="etiquette text-vert">Sur demande</p>
        <h1 className="titre-section mt-3">Vous ne trouvez pas votre chaussure ?</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-gris">
          Envoyez une photo du modèle et votre pointure. On cherche pour vous et on vous répond sur WhatsApp.
        </p>
        <FormulaireDemande whatsapp={whatsapp} />
      </div>
    </TransitionPage>
  );
}
