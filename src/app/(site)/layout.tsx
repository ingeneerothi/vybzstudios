import { BoutonWhatsapp } from "@/components/site/BoutonWhatsapp";
import { Entete } from "@/components/site/Entete";
import { PiedDePage } from "@/components/site/PiedDePage";
import { getCatalogue } from "@/lib/donnees/catalogue";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const catalogue = await getCatalogue();
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-full bg-encre px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <Entete />
      <main id="contenu">{children}</main>
      <PiedDePage catalogue={catalogue} />
      <BoutonWhatsapp numero={catalogue.whatsapp} />
    </>
  );
}
