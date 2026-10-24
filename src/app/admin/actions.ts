"use server";

import { updateTag } from "next/cache";
import { TAG_CATALOGUE } from "@/lib/donnees/catalogue";
import { MODE_DEMO } from "@/lib/env";
import { supabaseServeur } from "@/lib/supabase/serveur";

/** Après une modification dans l'admin : le site public affiche tout de suite la nouvelle version. */
export async function rafraichirSite(): Promise<void> {
  if (MODE_DEMO) return;
  const supabase = await supabaseServeur();
  const { data } = await supabase.rpc("est_admin");
  if (data !== true) throw new Error("Accès refusé");
  updateTag(TAG_CATALOGUE);
}
