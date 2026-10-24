// L'aperçu tourne toujours en mode démo : Supabase n'y est jamais appelé.
function indisponible(): never {
  throw new Error("Supabase n'est pas disponible dans l'aperçu.");
}
export const apiSupabase = indisponible;
export const supabaseNavigateur = indisponible;
