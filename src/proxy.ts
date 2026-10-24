import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MODE_DEMO, SUPABASE_CLE, SUPABASE_URL } from "@/lib/env";

const PAGES_LIBRES = ["/admin/connexion", "/admin/mot-de-passe-oublie"];

/** Rafraîchit la session admin et renvoie vers la connexion si besoin. */
export async function proxy(requete: NextRequest) {
  if (MODE_DEMO) return NextResponse.next();

  let reponse = NextResponse.next({ request: requete });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLE, {
    cookies: {
      getAll: () => requete.cookies.getAll(),
      setAll(aEcrire, entetes) {
        aEcrire.forEach(({ name, value }) => requete.cookies.set(name, value));
        reponse = NextResponse.next({ request: requete });
        aEcrire.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        Object.entries(entetes).forEach(([cle, valeur]) => reponse.headers.set(cle, valeur));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const chemin = requete.nextUrl.pathname;
  if (!data?.claims && !PAGES_LIBRES.some((p) => chemin.startsWith(p))) {
    const connexion = requete.nextUrl.clone();
    connexion.pathname = "/admin/connexion";
    connexion.search = "";
    return NextResponse.redirect(connexion);
  }
  return reponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
