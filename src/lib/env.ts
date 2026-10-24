// Valeurs collées à la main (.env.local, Vercel) ou posées par l'intégration Supabase de Vercel.
// Espaces et « / » final retirés : un copier-coller approximatif ne casse rien.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
export const SUPABASE_CLE = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ""
).trim();

/** Sans Supabase configuré, le site tourne en démonstration (données locales). */
export const MODE_DEMO = !SUPABASE_URL || !SUPABASE_CLE;

export function urlPublique(bucket: "produits" | "demandes", chemin: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${chemin}`;
}
