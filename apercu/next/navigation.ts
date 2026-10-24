// Remplace next/navigation dans l'aperçu : les adresses vivent après le « # » (fichier ouvert sans serveur).
import { useRoute, naviguer } from "../routeur";

export function useRouter() {
  return {
    push: (href: string) => naviguer(href),
    replace: (href: string) => naviguer(href, true),
    back: () => history.back(),
    forward: () => history.forward(),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname(): string {
  return useRoute().chemin;
}

export function useSearchParams(): URLSearchParams {
  return useRoute().recherche;
}

export function redirect(href: string): never {
  naviguer(href, true);
  throw new Error(`Redirection vers ${href}`);
}
