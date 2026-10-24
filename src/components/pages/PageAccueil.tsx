import Link from "next/link";
import { CarteChaussure } from "@/components/chaussure/CarteChaussure";
import { Apparition } from "@/components/site/Apparition";
import { BlocDemande } from "@/components/site/BlocDemande";
import { HeroAccueil } from "@/components/site/HeroAccueil";
import { TransitionPage } from "@/components/site/TransitionPage";
import { IconeBillet, IconeCamion, IconeEclair, IconeFleche } from "@/components/site/Icones";
import { chaussureVedette } from "@/lib/donnees/preparer";
import { formatPrix, libellePaiement } from "@/lib/format";
import { estEnRupture } from "@/lib/prix";
import type { Catalogue, Chaussure } from "@/lib/types";

export function PageAccueil({ catalogue }: { catalogue: Catalogue }) {
  const vedette = chaussureVedette(catalogue);
  const disponibles = catalogue.chaussures.filter((c) => !estEnRupture(c) && c.images.length > 0);

  const nouveautes = disponibles.filter((c) => c.nouveau);
  const selection = (nouveautes.length >= 2 ? nouveautes : disponibles).slice(0, 4);
  const promos = disponibles.filter((c) => c.promoEnCours && !selection.includes(c)).slice(0, 4);
  const abidjan = catalogue.zones.find((z) => z.details === "commune_quartier") ?? catalogue.zones[0];

  return (
    <TransitionPage>
      <HeroAccueil vedette={vedette} slogan={catalogue.reglages.slogan} />

      <Grille
        titre={nouveautes.length >= 2 ? "Nouveautés" : "La sélection"}
        sousTitre="Les dernières paires arrivées en boutique."
        chaussures={selection}
      />

      {promos.length > 0 && <Grille titre="Promos" sousTitre="Prix réduits, pour un temps." chaussures={promos} />}

      <section aria-label="Comment ça marche" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icone: <IconeCamion className="size-6" />,
              titre: abidjan ? `Livraison ${abidjan.nom} ${formatPrix(abidjan.frais)}` : "Livraison rapide",
              texte: "Et partout en Côte d'Ivoire.",
            },
            {
              icone: <IconeBillet className="size-6" />,
              titre: `Paiement ${libellePaiement(catalogue.reglages.modePaiement)}`,
              texte: /livraison/i.test(catalogue.reglages.modePaiement)
                ? "Vous payez quand vous recevez."
                : "Tout se confirme avec vous sur WhatsApp.",
            },
            {
              icone: <IconeEclair className="size-6" />,
              titre: "Commande en 1 minute",
              texte: "Tout se confirme sur WhatsApp.",
            },
          ].map((point, i) => (
            <li key={point.titre}>
              <Apparition
                delai={i * 0.08}
                className="flex h-full items-start gap-4 rounded-[22px] bg-white p-6 ring-1 ring-trait/70"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-papier text-vert">
                  {point.icone}
                </span>
                <span>
                  <span className="block text-[16px] font-semibold">{point.titre}</span>
                  <span className="mt-1 block text-[15px] text-gris">{point.texte}</span>
                </span>
              </Apparition>
            </li>
          ))}
        </ul>
      </section>

      <BlocDemande />
    </TransitionPage>
  );
}

function Grille({ titre, sousTitre, chaussures }: { titre: string; sousTitre: string; chaussures: Chaussure[] }) {
  if (chaussures.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 md:pt-28">
      <Apparition className="flex items-end justify-between gap-6">
        <div>
          <h2 className="titre-section">{titre}</h2>
          <p className="mt-2 text-[16px] text-gris">{sousTitre}</p>
        </div>
        <Link
          href="/collection"
          className="group hidden min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-medium sm:flex"
        >
          Tout voir
          <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
        </Link>
      </Apparition>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
        {chaussures.map((c, i) => (
          <Apparition key={c.id} delai={(i % 4) * 0.08}>
            <CarteChaussure chaussure={c} tailles="(min-width: 1200px) 270px, (min-width: 768px) 25vw, 50vw" />
          </Apparition>
        ))}
      </div>
      <Link href="/collection" className="bouton-contour mt-10 w-full sm:hidden">
        Voir toute la collection
      </Link>
    </section>
  );
}
