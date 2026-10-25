import { rafraichirSite } from "@/app/admin/actions";
import { SUPABASE_URL, urlPublique } from "../env";
import { supabaseNavigateur } from "../supabase/navigateur";
import { imageDePartage } from "../images/partage";
import { NOM_PARTAGE } from "../partage";
import { normaliserNumeroWhatsapp } from "../telephone";
import type { Chaussure, Commande, Demande, DetailsZone, Statut } from "../types";
import { type AdminApi, ErreurAdmin } from "./api";
import { creerSlug } from "./slug";

const CHAMPS_CHAUSSURE =
  "id, slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, en_stock, cree_le, chaussure_images (url, position), chaussure_pointures (pointure, en_stock)";

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

function versChaussure(c: LigneChaussure): Chaussure {
  return {
    id: c.id,
    slug: c.slug,
    nom: c.nom,
    marque: c.marque,
    couleur: c.couleur,
    description: c.description,
    prix: c.prix,
    prixPromo: c.prix_promo,
    finPromo: c.fin_promo,
    promoEnCours: false,
    enStock: c.en_stock,
    images: [...c.chaussure_images].sort((a, b) => a.position - b.position).map((i) => i.url),
    pointures: [...c.chaussure_pointures]
      .sort((a, b) => a.pointure - b.pointure)
      .map((p) => ({ pointure: p.pointure, enStock: p.en_stock })),
    creeLe: c.cree_le,
    nouveau: false,
  };
}

function traduire(e: { message?: string; code?: string }): ErreurAdmin {
  const message = e.message ?? "";
  if (e.code === "P0001" && message) return new ErreurAdmin(message);
  if (message.includes("promo_inferieure_au_prix")) {
    return new ErreurAdmin("Le prix promo doit être plus petit que le prix normal.");
  }
  if (e.code === "42501" || /row-level security|JWT|not authorized/i.test(message)) {
    return new ErreurAdmin("Accès refusé. Déconnectez-vous puis reconnectez-vous.");
  }
  if (/fetch|network|Failed to/i.test(message)) return new ErreurAdmin("Pas de connexion internet. Réessayez.");
  return new ErreurAdmin("Une erreur est survenue. Réessayez.");
}

function verifier<T>(r: { data: T; error: { message?: string; code?: string } | null }): T {
  if (r.error) throw traduire(r.error);
  return r.data;
}

/** Comme verifier(), pour une ligne qui doit exister. */
function ligneUnique<T>(r: { data: T | null; error: { message?: string; code?: string } | null }): T {
  const data = verifier(r);
  if (data == null) throw new ErreurAdmin("Élément introuvable. Actualisez la page.");
  return data;
}

/** Chemin dans le bucket « produits » d'une photo hébergée chez Supabase (null pour les photos du dossier public/). */
function cheminProduit(url: string): string | null {
  const repere = `${SUPABASE_URL}/storage/v1/object/public/produits/`;
  return url.startsWith(repere) ? url.slice(repere.length) : null;
}

export function apiSupabase(): AdminApi {
  const sb = supabaseNavigateur();
  const rafraichir = () => rafraichirSite().catch(() => undefined);

  const api: AdminApi = {
    mode: "supabase",

    async connexion(email, motDePasse) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: motDePasse });
      if (error) {
        throw new ErreurAdmin(
          /invalid/i.test(error.message) ? "Email ou mot de passe incorrect." : "Connexion impossible. Réessayez.",
        );
      }
      const { data: admin } = await sb.rpc("est_admin");
      if (admin !== true) {
        await sb.auth.signOut();
        throw new ErreurAdmin("Ce compte n'a pas accès à l'administration.");
      }
    },

    async deconnexion() {
      await sb.auth.signOut();
    },

    async session() {
      const { data } = await sb.auth.getUser();
      return data.user?.email ? { email: data.user.email } : null;
    },

    async motDePasseOublie(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/confirmer?suite=/admin/nouveau-mot-de-passe`,
      });
      if (error) throw new ErreurAdmin("Envoi impossible pour le moment. Réessayez dans quelques minutes.");
    },

    async nouveauMotDePasse(motDePasse) {
      const { error } = await sb.auth.updateUser({ password: motDePasse });
      if (error) {
        throw new ErreurAdmin(
          /different/i.test(error.message)
            ? "Choisissez un mot de passe différent de l'ancien."
            : "Mot de passe non enregistré. Le lien a peut-être expiré : refaites « Mot de passe oublié ».",
        );
      }
    },

    async chaussures() {
      const r = await sb
        .from("chaussures")
        .select(CHAMPS_CHAUSSURE)
        .order("cree_le", { ascending: false })
        .returns<LigneChaussure[]>();
      return (verifier(r) ?? []).map(versChaussure);
    },

    async chaussure(id) {
      const r = await sb.from("chaussures").select(CHAMPS_CHAUSSURE).eq("id", id).maybeSingle<LigneChaussure>();
      const ligne = verifier(r);
      return ligne ? versChaussure(ligne) : null;
    },

    async enregistrerChaussure(s, photos) {
      const ligne = {
        nom: s.nom.trim(),
        marque: s.marque.trim(),
        couleur: s.couleur.trim(),
        description: s.description.trim(),
        prix: s.prix,
        prix_promo: s.prixPromo,
        fin_promo: s.prixPromo ? s.finPromo : null,
        en_stock: s.enStock,
      };

      let id = s.id;
      if (id) {
        verifier(await sb.from("chaussures").update(ligne).eq("id", id));
      } else {
        const existants = verifier(await sb.from("chaussures").select("slug")) ?? [];
        const slug = creerSlug(
          s.marque,
          s.nom,
          existants.map((x: { slug: string }) => x.slug),
        );
        id = ligneUnique(
          await sb
            .from("chaussures")
            .insert({ ...ligne, slug })
            .select("id")
            .single<{ id: string }>(),
        ).id;
      }

      // Photos : on envoie les nouvelles, puis on réécrit la liste dans l'ordre choisi.
      const anciennes = (verifier(await sb.from("chaussure_images").select("url").eq("chaussure_id", id)) ?? []).map(
        (i: { url: string }) => i.url,
      );
      const urls: string[] = [];
      for (const photo of photos) {
        if ("url" in photo) {
          urls.push(photo.url);
          continue;
        }
        const extension = photo.blob.type === "image/webp" ? "webp" : "png";
        const chemin = `${id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await sb.storage.from("produits").upload(chemin, photo.blob, {
          contentType: photo.blob.type,
          cacheControl: "31536000",
        });
        if (error) throw new ErreurAdmin("Une photo n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.");
        urls.push(urlPublique("produits", chemin));
      }
      verifier(await sb.from("chaussure_images").delete().eq("chaussure_id", id));
      if (urls.length > 0) {
        verifier(
          await sb.from("chaussure_images").insert(urls.map((url, position) => ({ chaussure_id: id, url, position }))),
        );
      }
      // Photo montrée par WhatsApp sous le lien de la chaussure (commandes) : à côté de la photo principale.
      const principale = urls[0];
      if (principale && cheminProduit(principale)) {
        const premiere = photos[0];
        try {
          const jpeg = await imageDePartage(premiere && "blob" in premiere ? premiere.blob : principale);
          await sb.storage
            .from("produits")
            .upload(`${id}/${NOM_PARTAGE}`, jpeg, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
        } catch {
          // Facultatif : sans elle, WhatsApp affiche le lien sans photo.
        }
      }

      const retirees = anciennes
        .filter((u: string) => !urls.includes(u))
        .map(cheminProduit)
        .filter((c: string | null): c is string => Boolean(c));
      if (retirees.length > 0) await sb.storage.from("produits").remove(retirees);

      // Pointures proposées et stock par pointure.
      const proposees = s.pointures.map((p) => p.pointure);
      verifier(
        await sb
          .from("chaussure_pointures")
          .delete()
          .eq("chaussure_id", id)
          .not("pointure", "in", `(${proposees.length ? proposees.join(",") : "0"})`),
      );
      if (s.pointures.length > 0) {
        verifier(
          await sb
            .from("chaussure_pointures")
            .upsert(s.pointures.map((p) => ({ chaussure_id: id, pointure: p.pointure, en_stock: p.enStock }))),
        );
      }

      await rafraichir();
      const enregistree = await api.chaussure(id);
      if (!enregistree) throw new ErreurAdmin("Chaussure introuvable après l'enregistrement.");
      return enregistree;
    },

    async supprimerChaussure(id) {
      verifier(await sb.from("chaussures").delete().eq("id", id));
      const { data: fichiers } = await sb.storage.from("produits").list(id);
      if (fichiers?.length) await sb.storage.from("produits").remove(fichiers.map((f) => `${id}/${f.name}`));
      await rafraichir();
    },

    async changerStock(id, enStock) {
      verifier(await sb.from("chaussures").update({ en_stock: enStock }).eq("id", id));
      await rafraichir();
    },

    async changerStockPointure(id, pointure, enStock) {
      verifier(
        await sb
          .from("chaussure_pointures")
          .update({ en_stock: enStock })
          .eq("chaussure_id", id)
          .eq("pointure", pointure),
      );
      await rafraichir();
    },

    async commandes() {
      const r = await sb.from("commandes").select("*").order("cree_le", { ascending: false }).limit(300);
      return (verifier(r) ?? []).map(
        (c): Commande => ({
          id: c.id,
          code: c.code,
          chaussureNom: c.chaussure_nom,
          chaussureImage: c.chaussure_image,
          pointure: c.pointure,
          quantite: c.quantite,
          prixUnitaire: c.prix_unitaire,
          zone: c.zone,
          fraisLivraison: c.frais_livraison,
          total: c.total,
          clientNom: c.client_nom,
          clientTelephone: c.client_telephone,
          commune: c.commune,
          quartier: c.quartier,
          ville: c.ville,
          adresse: c.adresse,
          repere: c.repere,
          modePaiement: c.mode_paiement,
          statut: c.statut as Statut,
          creeLe: c.cree_le,
        }),
      );
    },

    async statutCommande(id, statut) {
      verifier(await sb.from("commandes").update({ statut }).eq("id", id));
    },

    async demandes() {
      const r = await sb.from("demandes").select("*").order("cree_le", { ascending: false }).limit(300);
      return (verifier(r) ?? []).map(
        (d): Demande => ({
          id: d.id,
          code: d.code,
          photo: d.photo ? urlPublique("demandes", d.photo) : null,
          pointure: d.pointure,
          clientNom: d.client_nom,
          clientTelephone: d.client_telephone,
          lieu: d.lieu,
          commentaire: d.commentaire,
          statut: d.statut as Statut,
          creeLe: d.cree_le,
        }),
      );
    },

    async statutDemande(id, statut) {
      verifier(await sb.from("demandes").update({ statut }).eq("id", id));
    },

    async numeros() {
      const r = await sb.from("numeros_whatsapp").select("id, libelle, numero, actif, intro").order("cree_le");
      return verifier(r) ?? [];
    },

    async ajouterNumero(libelle, numero, intro) {
      const normalise = normaliserNumeroWhatsapp(numero);
      if (!normalise) throw new ErreurAdmin("Numéro invalide. Exemple : 05 06 52 38 16 (ou +33... pour l'étranger).");
      const existants = await api.numeros();
      verifier(
        await sb
          .from("numeros_whatsapp")
          .insert({
            libelle: libelle.trim(),
            numero: normalise,
            actif: existants.length === 0,
            intro: intro.trim() || null,
          }),
      );
      await rafraichir();
    },

    async modifierNumero(id, libelle, numero, intro) {
      const normalise = normaliserNumeroWhatsapp(numero);
      if (!normalise) throw new ErreurAdmin("Numéro invalide. Exemple : 05 06 52 38 16 (ou +33... pour l'étranger).");
      verifier(
        await sb
          .from("numeros_whatsapp")
          .update({ libelle: libelle.trim(), numero: normalise, intro: intro.trim() || null })
          .eq("id", id),
      );
      await rafraichir();
    },

    async supprimerNumero(id) {
      verifier(await sb.from("numeros_whatsapp").delete().eq("id", id));
    },

    async activerNumero(id) {
      verifier(await sb.rpc("activer_numero", { p_id: id }));
      await rafraichir();
    },

    async reglages() {
      const r = await sb.from("reglages").select("slogan, chaussure_vedette_id, mode_paiement").eq("id", 1).single();
      const d = ligneUnique(r);
      return { slogan: d.slogan, chaussureVedetteId: d.chaussure_vedette_id, modePaiement: d.mode_paiement };
    },

    async enregistrerReglages(reglages) {
      verifier(
        await sb
          .from("reglages")
          .update({
            slogan: reglages.slogan.trim(),
            chaussure_vedette_id: reglages.chaussureVedetteId,
            mode_paiement: reglages.modePaiement.trim(),
          })
          .eq("id", 1),
      );
      await rafraichir();
    },

    async zones() {
      const r = await sb.from("zones_livraison").select("id, nom, frais, details").order("position");
      return (verifier(r) ?? []).map((z) => ({ ...z, details: z.details as DetailsZone }));
    },

    async enregistrerZone(zone) {
      const ligne = { nom: zone.nom.trim(), frais: zone.frais, details: zone.details };
      if (zone.id) {
        verifier(await sb.from("zones_livraison").update(ligne).eq("id", zone.id));
      } else {
        const zones = await api.zones();
        verifier(await sb.from("zones_livraison").insert({ ...ligne, position: zones.length }));
      }
      await rafraichir();
    },

    async supprimerZone(id) {
      const zones = await api.zones();
      if (zones.length <= 1) throw new ErreurAdmin("Il faut garder au moins une zone de livraison.");
      verifier(await sb.from("zones_livraison").delete().eq("id", id));
      await rafraichir();
    },
  };
  return api;
}
