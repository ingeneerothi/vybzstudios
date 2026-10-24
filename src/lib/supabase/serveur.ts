import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CLE, SUPABASE_URL } from "../env";

/** Client Supabase côté serveur, avec la session de l'admin connecté (actions serveur, routes). */
export async function supabaseServeur() {
  const magasin = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll(aEcrire) {
        try {
          aEcrire.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le proxy se charge de rafraîchir la session.
        }
      },
    },
  });
}
