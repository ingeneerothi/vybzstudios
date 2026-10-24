import source from "../../../data/catalogue.json";
import type { Catalogue, Chaussure, DetailsZone, Zone } from "../types";

const POINTURES_PAR_DEFAUT = [39, 40, 41, 42, 43, 44, 45, 46, 47];

interface ChaussureSource {
  slug: string;
  nom: string;
  marque: string;
  couleur: string;
  description: string;
  prix: number;
  prixPromo?: number | null;
  finPromo?: string | null;
  pointures?: number[];
  images?: string[];
}

/** Catalogue de démonstration, lu dans data/catalogue.json (utilisé tant que Supabase n'est pas branché). */
export function catalogueDemo(maintenant: number): Catalogue {
  const chaussures: Chaussure[] = (source.chaussures as ChaussureSource[]).map((c, i) => ({
    id: c.slug,
    slug: c.slug,
    nom: c.nom,
    marque: c.marque,
    couleur: c.couleur,
    description: c.description,
    prix: c.prix,
    prixPromo: c.prixPromo ?? null,
    finPromo: c.finPromo ?? null,
    enStock: true,
    images: c.images ?? [],
    pointures: (c.pointures ?? POINTURES_PAR_DEFAUT).map((pointure) => ({ pointure, enStock: true })),
    creeLe: new Date(maintenant - i * 60_000).toISOString(),
    nouveau: false,
    promoEnCours: false,
  }));
  const zones: Zone[] = source.zones.map((z, i) => ({
    id: `zone-${i + 1}`,
    nom: z.nom,
    frais: z.frais,
    details: z.details as DetailsZone,
  }));
  const actif = source.numerosWhatsapp.find((n) => n.actif) ?? source.numerosWhatsapp[0];
  return {
    chaussures,
    zones,
    reglages: {
      slogan: source.reglages.slogan,
      chaussureVedetteId: source.reglages.chaussureVedette,
      modePaiement: source.reglages.modePaiement,
    },
    whatsapp: actif.numero,
  };
}

export const NUMEROS_DEMO = source.numerosWhatsapp;
