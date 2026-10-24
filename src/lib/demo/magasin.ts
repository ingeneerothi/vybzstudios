// Mode démonstration (Supabase pas encore branché) : tout vit dans le navigateur (localStorage).
// Sert à essayer le site et l'admin, et aux tests automatiques. Jamais utilisé une fois Supabase configuré.
import { NUMEROS_DEMO, catalogueDemo } from "../donnees/demo";
import type { Chaussure, Commande, Demande, NumeroWhatsapp, Reglages, Zone } from "../types";

const CLE = "vertical-store-demo-v1";

export interface EtatDemo {
  chaussures: Chaussure[];
  zones: Zone[];
  numeros: NumeroWhatsapp[];
  reglages: Reglages;
  commandes: Commande[];
  demandes: Demande[];
  compteurCommandes: number;
  compteurDemandes: number;
}

function etatInitial(): EtatDemo {
  const catalogue = catalogueDemo(Date.now());
  return {
    chaussures: catalogue.chaussures,
    zones: catalogue.zones,
    numeros: NUMEROS_DEMO.map((n, i) => ({ id: `numero-${i + 1}`, libelle: n.nom, numero: n.numero, actif: n.actif })),
    reglages: catalogue.reglages,
    commandes: [],
    demandes: [],
    compteurCommandes: 0,
    compteurDemandes: 0,
  };
}

export function lireDemo(): EtatDemo {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as EtatDemo;
  } catch {}
  return etatInitial();
}

export function ecrireDemo(etat: EtatDemo): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    throw new Error(
      "Mémoire du navigateur pleine (mode démo). Supprimez quelques photos ou videz les données du site.",
    );
  }
}

export function modifierDemo<T>(modif: (etat: EtatDemo) => T): T {
  const etat = lireDemo();
  const resultat = modif(etat);
  ecrireDemo(etat);
  return resultat;
}

export function codeSuivant(prefixe: "CMD" | "DEM", n: number): string {
  return `${prefixe}-${n < 10000 ? String(n).padStart(4, "0") : n}`;
}

export function identifiant(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
