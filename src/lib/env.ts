export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sans Supabase configuré, le site tourne en démonstration (données locales). */
export const MODE_DEMO = !SUPABASE_URL || !SUPABASE_CLE;

export function urlPublique(bucket: "produits" | "demandes", chemin: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${chemin}`;
}
