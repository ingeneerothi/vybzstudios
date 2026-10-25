export type DetailsZone = "commune_quartier" | "quartier" | "ville";
export type Statut = "nouvelle" | "envoyee" | "livree" | "annulee";

export interface Pointure {
  pointure: number;
  enStock: boolean;
}

export interface Chaussure {
  id: string;
  slug: string;
  nom: string;
  marque: string;
  couleur: string;
  description: string;
  prix: number;
  prixPromo: number | null;
  /** Date ISO de fin de promo, ou null si la promo n'a pas de fin. */
  finPromo: string | null;
  /** Promo en cours au moment de la mise en cache ; le navigateur revérifie avec l'heure réelle. */
  promoEnCours: boolean;
  enStock: boolean;
  images: string[];
  pointures: Pointure[];
  creeLe: string;
  nouveau: boolean;
}

export interface Zone {
  id: string;
  nom: string;
  frais: number;
  details: DetailsZone;
}

export interface Reglages {
  slogan: string;
  chaussureVedetteId: string | null;
  modePaiement: string;
}

export interface Catalogue {
  chaussures: Chaussure[];
  zones: Zone[];
  reglages: Reglages;
  /** Numéro WhatsApp actif, au format international sans « + » (ex. 2250506523816). */
  whatsapp: string;
}

export interface NumeroWhatsapp {
  id: string;
  libelle: string;
  numero: string;
  actif: boolean;
  /** Phrase en haut des commandes envoyées à ce numéro (ex. « Bonjour c'est Ange »), null pour le principal. */
  intro: string | null;
}

export interface Commande {
  id: string;
  code: string;
  chaussureNom: string;
  chaussureImage: string | null;
  pointure: number;
  quantite: number;
  prixUnitaire: number;
  zone: string;
  fraisLivraison: number;
  total: number;
  clientNom: string;
  clientTelephone: string;
  commune: string | null;
  quartier: string | null;
  ville: string | null;
  adresse: string;
  repere: string | null;
  modePaiement: string;
  statut: Statut;
  creeLe: string;
}

export interface Demande {
  id: string;
  code: string;
  photo: string | null;
  pointure: string | null;
  clientNom: string;
  clientTelephone: string;
  lieu: string;
  commentaire: string | null;
  statut: Statut;
  creeLe: string;
}

export interface SaisieCommande {
  slug: string;
  pointure: number;
  quantite: number;
  zoneId: string;
  nom: string;
  telephone: string;
  commune: string;
  quartier: string;
  ville: string;
  adresse: string;
  repere: string;
}

export interface ResultatCommande {
  code: string;
  chaussure: string;
  pointure: number;
  quantite: number;
  prixUnitaire: number;
  zone: string;
  fraisLivraison: number;
  total: number;
  modePaiement: string;
  whatsapp: string;
  /** Phrase du numéro qui reçoit la commande, à mettre en haut du message. */
  intro?: string | null;
  /** Le site a déjà envoyé la commande au vendeur, avec la photo (API WhatsApp Business). */
  vendeurPrevenu?: boolean;
}

export interface SaisieDemande {
  photo: Blob | null;
  pointure: string;
  nom: string;
  telephone: string;
  lieu: string;
  commentaire: string;
}

export interface ResultatDemande {
  code: string;
  whatsapp: string;
  photoUrl: string | null;
}
