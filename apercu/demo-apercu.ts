// Dans l'aperçu, l'espace vendeur garde les données de démonstration, mais sans le bandeau « Mode démo »
// (pensé pour le développeur) : le bandeau de l'aperçu le remplace.
import type { AdminApi } from "@/lib/admin/api";
import { apiDemo as apiDemoSite } from "@/lib/admin/demo";

export function apiDemo(): AdminApi {
  return { ...apiDemoSite(), mode: "apercu" as unknown as AdminApi["mode"] };
}
