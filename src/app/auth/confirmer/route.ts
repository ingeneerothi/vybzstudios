import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { supabaseServeur } from "@/lib/supabase/serveur";

/**
 * Arrivée depuis un lien reçu par email (mot de passe oublié).
 * Accepte le format recommandé (token_hash) et le format par défaut de Supabase (code).
 */
export async function GET(requete: NextRequest) {
  const params = requete.nextUrl.searchParams;
  const suite = params.get("suite") ?? "/admin";
  // Uniquement vers l'admin du site : pas de redirection vers un autre domaine.
  const destination = /^\/admin(\/[a-z0-9/-]*)?$/.test(suite) ? suite : "/admin";
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");

  const supabase = await supabaseServeur();
  let reussi = false;
  if (tokenHash && type) {
    reussi = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  } else if (code) {
    reussi = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }
  redirect(reussi ? destination : "/admin/connexion?lien=expire");
}
