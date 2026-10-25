// Aperçu hors ligne : le vrai site et le vrai espace vendeur (mêmes composants), en mode démo,
// dans un seul fichier HTML. Rien n'est envoyé : commandes et changements restent en mémoire.
import "./stockage";
import "./reseau";
import { Fragment, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import AdminConnecte from "@/app/admin/(app)/layout";
import Chaussures from "@/app/admin/(app)/chaussures/page";
import ModifierChaussure from "@/app/admin/(app)/chaussures/modifier/page";
import NouvelleChaussure from "@/app/admin/(app)/chaussures/nouvelle/page";
import Commandes from "@/app/admin/(app)/commandes/page";
import NouveauMotDePasse from "@/app/admin/(app)/nouveau-mot-de-passe/page";
import Numeros from "@/app/admin/(app)/numeros/page";
import Reglages from "@/app/admin/(app)/reglages/page";
import Connexion from "@/app/admin/connexion/page";
import MotDePasseOublie from "@/app/admin/mot-de-passe-oublie/page";
import PageIntrouvable from "@/app/not-found";
import { FournisseurAdmin } from "@/components/admin/Fournisseur";
import { CadreSite } from "@/components/pages/CadreSite";
import { PageAccueil } from "@/components/pages/PageAccueil";
import { PageChaussure } from "@/components/pages/PageChaussure";
import { PageCollection } from "@/components/pages/PageCollection";
import { PageCommande } from "@/components/pages/PageCommande";
import { PageDemande } from "@/components/pages/PageDemande";
import { Mouvement } from "@/components/site/Mouvement";
import { lireDemo } from "@/lib/demo/magasin";
import { preparerCatalogue } from "@/lib/donnees/preparer";
import type { Catalogue } from "@/lib/types";
import { BandeauApercu } from "./BandeauApercu";
import { remplirExemples } from "./exemples";
import { type Route, Routeur } from "./routeur";

remplirExemples();

/** Le site lit les mêmes données que l'admin : un changement dans l'admin se voit sur le site. */
function catalogueActuel(): Catalogue {
  const etat = lireDemo();
  return preparerCatalogue(
    {
      chaussures: etat.chaussures,
      zones: etat.zones,
      reglages: etat.reglages,
      whatsapp: etat.numeros.find((n) => n.actif)?.numero ?? "",
    },
    Date.now(),
  );
}

const PAGES_LIBRES: Record<string, () => React.ReactNode> = {
  "/admin/connexion": Connexion,
  "/admin/mot-de-passe-oublie": MotDePasseOublie,
};

const PAGES_ADMIN: Record<string, () => React.ReactNode> = {
  "/admin/chaussures": Chaussures,
  "/admin/chaussures/nouvelle": NouvelleChaussure,
  "/admin/chaussures/modifier": ModifierChaussure,
  "/admin/commandes": Commandes,
  "/admin/numeros": Numeros,
  "/admin/reglages": Reglages,
  "/admin/nouveau-mot-de-passe": NouveauMotDePasse,
};

function titre(chemin: string, catalogue: Catalogue): string {
  const [, racine, slug] = chemin.split("/");
  if (racine === "admin") return "Admin · Vertical Store";
  if (racine === "collection") return "Collection · Vertical Store";
  if (racine === "commander") return "Commande · Vertical Store";
  if (racine === "demande") return "Sur demande · Vertical Store";
  const c = racine === "chaussure" ? catalogue.chaussures.find((x) => x.slug === slug) : undefined;
  return c ? `${c.nom} — ${c.marque} · Vertical Store` : "Vertical Store — Sneakers à Abidjan";
}

function Ecran({ route }: { route: Route }) {
  const chemin = route.chemin === "/admin" ? "/admin/chaussures" : route.chemin;
  const catalogue = catalogueActuel();

  useEffect(() => {
    document.title = titre(chemin, catalogue);
  }, [chemin, catalogue]);

  if (chemin.startsWith("/admin")) {
    const Libre = PAGES_LIBRES[chemin];
    const Page = PAGES_ADMIN[chemin];
    return (
      <FournisseurAdmin>
        <div className="min-h-dvh bg-papier text-[17px]">
          <BandeauApercu cote="vendeur" />
          {Libre ? (
            <Libre key={chemin} />
          ) : Page ? (
            <AdminConnecte>
              <Page key={chemin} />
            </AdminConnecte>
          ) : (
            <PageIntrouvable />
          )}
        </div>
      </FournisseurAdmin>
    );
  }

  const [, racine, slug = ""] = chemin.split("/");
  const page =
    chemin === "/" ? (
      <PageAccueil catalogue={catalogue} />
    ) : racine === "collection" ? (
      <PageCollection chaussures={catalogue.chaussures} />
    ) : racine === "chaussure" ? (
      <PageChaussure catalogue={catalogue} slug={slug} />
    ) : racine === "commander" ? (
      <PageCommande catalogue={catalogue} slug={slug} />
    ) : racine === "demande" ? (
      <PageDemande whatsapp={catalogue.whatsapp} />
    ) : null;

  if (!page) return <PageIntrouvable />;
  return (
    <>
      <CadreSite catalogue={catalogue}>
        <Fragment key={chemin}>{page}</Fragment>
      </CadreSite>
      <BandeauApercu cote="site" />
    </>
  );
}

/** Le site s'est affiché : on retire les écrans fixes prévus pour les lecteurs qui bloquent le JavaScript. */
function Pret() {
  useEffect(() => {
    window.__apercuPret = true;
    document.documentElement.classList.add("avec-js");
    document.getElementById("ecrans-fixes")?.remove();
  }, []);
  return null;
}

createRoot(document.getElementById("racine")!).render(
  <StrictMode>
    <Mouvement>
      <Routeur>{(route) => <Ecran route={route} />}</Routeur>
    </Mouvement>
    <Pret />
  </StrictMode>,
);
