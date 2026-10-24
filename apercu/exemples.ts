// Quelques commandes et une demande d'exemple, pour que l'onglet « Commandes » de l'aperçu ne soit pas vide.
import { ecrireDemo, lireDemo } from "@/lib/demo/magasin";
import type { Commande } from "@/lib/types";
import { image } from "./images";

export function remplirExemples(): void {
  const etat = lireDemo();
  const maintenant = Date.now();
  const ilYa = (minutes: number) => new Date(maintenant - minutes * 60_000).toISOString();
  const chaussure = (slug: string) => etat.chaussures.find((c) => c.slug === slug) ?? etat.chaussures[0];
  const zone = (details: string) => etat.zones.find((z) => z.details === details) ?? etat.zones[0];

  const am95 = chaussure("nike-air-max-95-corteiz-kaki");
  const kayano = chaussure("asics-gel-kayano-14-vert");
  const abidjan = zone("commune_quartier");
  const expedition = zone("ville");

  const commandes: Commande[] = [
    {
      id: "exemple-commande-2",
      code: "CMD-0002",
      chaussureNom: am95.nom,
      chaussureImage: am95.images[0] ?? null,
      pointure: 43,
      quantite: 1,
      prixUnitaire: am95.prix,
      zone: abidjan.nom,
      fraisLivraison: abidjan.frais,
      total: am95.prix + abidjan.frais,
      clientNom: "Awa Koné",
      clientTelephone: "0708091011",
      commune: "Cocody",
      quartier: "Riviera 2",
      ville: null,
      adresse: "Rue des jardins, villa 12",
      repere: "Près de la pharmacie",
      modePaiement: etat.reglages.modePaiement,
      statut: "nouvelle",
      creeLe: ilYa(18),
    },
    {
      id: "exemple-commande-1",
      code: "CMD-0001",
      chaussureNom: kayano.nom,
      chaussureImage: kayano.images[0] ?? null,
      pointure: 42,
      quantite: 2,
      prixUnitaire: kayano.prix,
      zone: expedition.nom,
      fraisLivraison: expedition.frais,
      total: kayano.prix * 2 + expedition.frais,
      clientNom: "Yao Kouassi",
      clientTelephone: "0544332211",
      commune: null,
      quartier: null,
      ville: "Bouaké",
      adresse: "Quartier Commerce, gare UTB",
      repere: null,
      modePaiement: etat.reglages.modePaiement,
      statut: "envoyee",
      creeLe: ilYa(26 * 60),
    },
  ];

  etat.commandes = commandes;
  etat.demandes = [
    {
      id: "exemple-demande-1",
      code: "DEM-0001",
      photo: image(chaussure("dior-b30-noir").images[0] ?? ""),
      pointure: "41",
      clientNom: "Mariam Traoré",
      clientTelephone: "0102030405",
      lieu: "Yopougon, Selmer",
      commentaire: "La même en blanc, s'il vous plaît.",
      statut: "nouvelle",
      creeLe: ilYa(45),
    },
  ];
  etat.compteurCommandes = commandes.length;
  etat.compteurDemandes = 1;
  ecrireDemo(etat);
}
