import { MODE_DEMO } from "../env";
import type { Chaussure, Commande, Demande, NumeroWhatsapp, Pointure, Reglages, Statut, Zone } from "../types";

export interface ChaussureSaisie {
  id?: string;
  nom: string;
  marque: string;
  couleur: string;
  description: string;
  prix: number;
  prixPromo: number | null;
  finPromo: string | null;
  enStock: boolean;
  pointures: Pointure[];
}

/** Photo déjà en ligne (url) ou nouvelle photo préparée dans le navigateur (blob). */
export type PhotoSaisie = { cle: string; url: string } | { cle: string; blob: Blob; apercu: string };

export type ZoneSaisie = Omit<Zone, "id"> & { id?: string };

export interface AdminApi {
  mode: "supabase" | "demo";

  connexion(email: string, motDePasse: string): Promise<void>;
  deconnexion(): Promise<void>;
  session(): Promise<{ email: string } | null>;
  motDePasseOublie(email: string): Promise<void>;
  nouveauMotDePasse(motDePasse: string): Promise<void>;

  chaussures(): Promise<Chaussure[]>;
  chaussure(id: string): Promise<Chaussure | null>;
  enregistrerChaussure(saisie: ChaussureSaisie, photos: PhotoSaisie[]): Promise<Chaussure>;
  supprimerChaussure(id: string): Promise<void>;
  changerStock(id: string, enStock: boolean): Promise<void>;
  changerStockPointure(id: string, pointure: number, enStock: boolean): Promise<void>;

  commandes(): Promise<Commande[]>;
  statutCommande(id: string, statut: Statut): Promise<void>;
  demandes(): Promise<Demande[]>;
  statutDemande(id: string, statut: Statut): Promise<void>;

  numeros(): Promise<NumeroWhatsapp[]>;
  ajouterNumero(libelle: string, numero: string): Promise<void>;
  modifierNumero(id: string, libelle: string, numero: string): Promise<void>;
  supprimerNumero(id: string): Promise<void>;
  activerNumero(id: string): Promise<void>;

  reglages(): Promise<Reglages>;
  enregistrerReglages(reglages: Reglages): Promise<void>;
  zones(): Promise<Zone[]>;
  enregistrerZone(zone: ZoneSaisie): Promise<void>;
  supprimerZone(id: string): Promise<void>;
}

/** Erreur à montrer telle quelle au vendeur (message en français simple). */
export class ErreurAdmin extends Error {}

let api: Promise<AdminApi> | undefined;

export function obtenirApi(): Promise<AdminApi> {
  api ??= MODE_DEMO ? import("./demo").then((m) => m.apiDemo()) : import("./supabase").then((m) => m.apiSupabase());
  return api;
}

export const LIBELLES_STATUT: Record<Statut, string> = {
  nouvelle: "Nouvelle",
  envoyee: "Envoyée au livreur",
  livree: "Livrée",
  annulee: "Annulée",
};
