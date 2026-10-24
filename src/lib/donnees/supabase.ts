import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CLE, SUPABASE_URL } from "../env";
import type { Catalogue, DetailsZone } from "../types";

interface LigneChaussure {
  id: string;
  slug: string;
  nom: string;
  marque: string;
  couleur: string;
  description: string;
  prix: number;
  prix_promo: number | null;
  fin_promo: string | null;
  en_stock: boolean;
  cree_le: string;
  chaussure_images: { url: string; position: number }[];
  chaussure_pointures: { pointure: number; en_stock: boolean }[];
}

/** Lecture publique (clé anonyme, sans session) de tout ce que le site affiche. */
export async function chargerCatalogueSupabase(): Promise<Catalogue> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_CLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [chaussures, zones, reglages, numero] = await Promise.all([
    supabase
      .from("chaussures")
      .select(
        "id, slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, en_stock, cree_le, chaussure_images (url, position), chaussure_pointures (pointure, en_stock)",
      )
      .order("cree_le", { ascending: false })
      .returns<LigneChaussure[]>(),
    supabase.from("zones_livraison").select("id, nom, frais, details").order("position"),
    supabase.from("reglages").select("slogan, chaussure_vedette_id, mode_paiement").eq("id", 1).maybeSingle(),
    supabase.rpc("numero_actif"),
  ]);

  const erreur = chaussures.error ?? zones.error ?? reglages.error ?? numero.error;
  if (erreur) {
    throw new Error(
      `Lecture Supabase impossible : ${erreur.message}. Vérifiez que supabase/installation.sql a été lancé ` +
        "et que l'URL et la clé sont les bonnes (voir MISE-EN-LIGNE.md).",
    );
  }

  return {
    chaussures: (chaussures.data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      nom: c.nom,
      marque: c.marque,
      couleur: c.couleur,
      description: c.description,
      prix: c.prix,
      prixPromo: c.prix_promo,
      finPromo: c.fin_promo,
      enStock: c.en_stock,
      images: [...c.chaussure_images].sort((a, b) => a.position - b.position).map((i) => i.url),
      pointures: [...c.chaussure_pointures]
        .sort((a, b) => a.pointure - b.pointure)
        .map((p) => ({ pointure: p.pointure, enStock: p.en_stock })),
      creeLe: c.cree_le,
      nouveau: false,
      promoEnCours: false,
    })),
    zones: (zones.data ?? []).map((z) => ({
      id: z.id,
      nom: z.nom,
      frais: z.frais,
      details: z.details as DetailsZone,
    })),
    reglages: {
      slogan: reglages.data?.slogan ?? "",
      chaussureVedetteId: reglages.data?.chaussure_vedette_id ?? null,
      modePaiement: reglages.data?.mode_paiement ?? "À la livraison",
    },
    whatsapp: (numero.data as string | null) ?? "",
  };
}
