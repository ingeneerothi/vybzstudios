// Envoi d'une commande ou d'une demande depuis le navigateur.
// Avec Supabase : la base vérifie tout et recalcule le prix. En démo : calcul local identique.
import { MODE_DEMO, urlPublique } from "./env";
import { prixActuel } from "./prix";
import { normaliserTelephone } from "./telephone";
import type { Chaussure, ResultatCommande, ResultatDemande, SaisieCommande, SaisieDemande, Zone } from "./types";

export class ErreurEnvoi extends Error {}

function messageErreur(erreur: { message?: string; code?: string } | null): string {
  if (erreur?.code === "P0001" && erreur.message) return erreur.message;
  if (erreur?.message?.toLowerCase().includes("fetch")) {
    return "Connexion impossible. Vérifiez votre réseau puis réessayez.";
  }
  return "Un problème est survenu. Réessayez dans un instant.";
}

export interface ContexteCommande {
  chaussure: Chaussure;
  zone: Zone;
  modePaiement: string;
  whatsapp: string;
}

export async function creerCommande(s: SaisieCommande, ctx: ContexteCommande): Promise<ResultatCommande> {
  if (MODE_DEMO) return creerCommandeDemo(s, ctx);
  const { supabaseNavigateur } = await import("./supabase/navigateur");
  const { data, error } = await supabaseNavigateur().rpc("creer_commande", {
    p_slug: s.slug,
    p_pointure: s.pointure,
    p_quantite: s.quantite,
    p_zone_id: s.zoneId,
    p_nom: s.nom,
    p_telephone: s.telephone,
    p_commune: s.commune || null,
    p_quartier: s.quartier || null,
    p_ville: s.ville || null,
    p_adresse: s.adresse,
    p_repere: s.repere || null,
  });
  if (error) throw new ErreurEnvoi(messageErreur(error));
  return data as ResultatCommande;
}

async function creerCommandeDemo(s: SaisieCommande, ctx: ContexteCommande): Promise<ResultatCommande> {
  const { codeSuivant, identifiant, modifierDemo } = await import("./demo/magasin");
  const prixUnitaire = prixActuel(ctx.chaussure);
  const total = prixUnitaire * s.quantite + ctx.zone.frais;
  return modifierDemo((etat) => {
    etat.compteurCommandes += 1;
    const code = codeSuivant("CMD", etat.compteurCommandes);
    const actif = etat.numeros.find((n) => n.actif)?.numero ?? ctx.whatsapp;
    etat.commandes.unshift({
      id: identifiant(),
      code,
      chaussureNom: ctx.chaussure.nom,
      chaussureImage: ctx.chaussure.images[0] ?? null,
      pointure: s.pointure,
      quantite: s.quantite,
      prixUnitaire,
      zone: ctx.zone.nom,
      fraisLivraison: ctx.zone.frais,
      total,
      clientNom: s.nom.trim(),
      clientTelephone: normaliserTelephone(s.telephone) ?? s.telephone,
      commune: s.commune || null,
      quartier: s.quartier || null,
      ville: s.ville || null,
      adresse: s.adresse.trim(),
      repere: s.repere.trim() || null,
      modePaiement: ctx.modePaiement,
      statut: "nouvelle",
      creeLe: new Date().toISOString(),
    });
    return {
      code,
      chaussure: ctx.chaussure.nom,
      pointure: s.pointure,
      quantite: s.quantite,
      prixUnitaire,
      zone: ctx.zone.nom,
      fraisLivraison: ctx.zone.frais,
      total,
      modePaiement: ctx.modePaiement,
      whatsapp: actif,
    };
  });
}

export async function creerDemande(s: SaisieDemande, whatsappDemo: string): Promise<ResultatDemande> {
  if (MODE_DEMO) return creerDemandeDemo(s, whatsappDemo);
  const { supabaseNavigateur } = await import("./supabase/navigateur");
  const supabase = supabaseNavigateur();
  let chemin: string | null = null;
  if (s.photo) {
    const extension = s.photo.type === "image/webp" ? "webp" : "jpg";
    chemin = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("demandes").upload(chemin, s.photo, {
      contentType: s.photo.type,
      cacheControl: "31536000",
    });
    if (error) throw new ErreurEnvoi("La photo n'a pas pu être envoyée. Réessayez.");
  }
  const { data, error } = await supabase.rpc("creer_demande", {
    p_photo: chemin,
    p_pointure: s.pointure,
    p_nom: s.nom,
    p_telephone: s.telephone,
    p_lieu: s.lieu,
    p_commentaire: s.commentaire || null,
  });
  if (error) throw new ErreurEnvoi(messageErreur(error));
  const r = data as { code: string; whatsapp: string; photo: string | null };
  return { code: r.code, whatsapp: r.whatsapp, photoUrl: r.photo ? urlPublique("demandes", r.photo) : null };
}

async function creerDemandeDemo(s: SaisieDemande, whatsappDemo: string): Promise<ResultatDemande> {
  const { codeSuivant, identifiant, modifierDemo } = await import("./demo/magasin");
  const apercu = s.photo ? await miniature(s.photo) : null;
  return modifierDemo((etat) => {
    etat.compteurDemandes += 1;
    const code = codeSuivant("DEM", etat.compteurDemandes);
    etat.demandes.unshift({
      id: identifiant(),
      code,
      photo: apercu,
      pointure: s.pointure || null,
      clientNom: s.nom.trim(),
      clientTelephone: normaliserTelephone(s.telephone) ?? s.telephone,
      lieu: s.lieu.trim(),
      commentaire: s.commentaire.trim() || null,
      statut: "nouvelle",
      creeLe: new Date().toISOString(),
    });
    const actif = etat.numeros.find((n) => n.actif)?.numero ?? whatsappDemo;
    return { code, whatsapp: actif, photoUrl: s.photo ? "(photo visible dans l'admin — mode démo)" : null };
  });
}

/** Petite version de la photo pour la garder dans le navigateur en mode démo. */
async function miniature(photo: Blob): Promise<string> {
  const bitmap = await createImageBitmap(photo);
  const echelle = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * echelle);
  canvas.height = Math.round(bitmap.height * echelle);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
