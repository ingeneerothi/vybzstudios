// Navigation de l'aperçu : l'adresse de la page vit après le « # » (ex. fichier.html#/collection),
// ce qui marche sans serveur. Les changements de page passent par une transition, comme sur le vrai site.
import { createContext, startTransition, use, useEffect, useLayoutEffect, useState } from "react";

export interface Route {
  chemin: string;
  recherche: URLSearchParams;
}

const ACCUEIL: Route = { chemin: "/", recherche: new URLSearchParams() };

/** null pour une ancre dans la page (ex. « #contenu ») : on reste sur la même page. */
function lire(): Route | null {
  const brut = decodeURIComponent(location.hash.slice(1));
  if (brut && !brut.startsWith("/")) return null;
  const [chemin, requete = ""] = (brut || "/").split("?");
  return { chemin: chemin.replace(/\/+$/, "") || "/", recherche: new URLSearchParams(requete) };
}

export function naviguer(href: string, remplacer = false) {
  if (remplacer) location.replace(`#${href}`);
  else location.hash = href;
}

const Contexte = createContext<Route>(ACCUEIL);

export function useRoute(): Route {
  return use(Contexte);
}

export function Routeur({ children }: { children: (route: Route) => React.ReactNode }) {
  const [route, setRoute] = useState<Route>(() => lire() ?? ACCUEIL);

  useEffect(() => {
    function changer() {
      const suivante = lire();
      if (suivante) startTransition(() => setRoute(suivante));
      else document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
    window.addEventListener("hashchange", changer);
    return () => window.removeEventListener("hashchange", changer);
  }, []);

  // Nouvelle page : on repart du haut, comme sur le vrai site.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [route.chemin]);

  return <Contexte value={route}>{children(route)}</Contexte>;
}
