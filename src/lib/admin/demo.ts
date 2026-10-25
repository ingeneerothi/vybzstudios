import { identifiant, lireDemo, modifierDemo } from "../demo/magasin";
import { normaliserNumeroWhatsapp } from "../telephone";
import type { Chaussure } from "../types";
import { type AdminApi, ErreurAdmin } from "./api";
import { creerSlug } from "./slug";

const CLE_SESSION = "vertical-store-demo-session";

/** Photo réduite en data URL pour tenir dans la mémoire du navigateur (mode démo uniquement). */
async function enDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const echelle = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * echelle);
  canvas.height = Math.round(bitmap.height * echelle);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = canvas.toDataURL("image/webp", 0.8);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}

function trouver(chaussures: Chaussure[], id: string): Chaussure {
  const c = chaussures.find((x) => x.id === id);
  if (!c) throw new ErreurAdmin("Chaussure introuvable.");
  return c;
}

export function apiDemo(): AdminApi {
  const api: AdminApi = {
    mode: "demo",

    async connexion(email, motDePasse) {
      if (!email.includes("@") || motDePasse.length === 0) throw new ErreurAdmin("Email ou mot de passe incorrect.");
      localStorage.setItem(CLE_SESSION, email.trim().toLowerCase());
    },
    async deconnexion() {
      localStorage.removeItem(CLE_SESSION);
    },
    async session() {
      const email = localStorage.getItem(CLE_SESSION);
      return email ? { email } : null;
    },
    async motDePasseOublie() {},
    async nouveauMotDePasse() {},

    async chaussures() {
      return lireDemo().chaussures;
    },
    async chaussure(id) {
      return lireDemo().chaussures.find((c) => c.id === id) ?? null;
    },

    async enregistrerChaussure(s, photos) {
      const images: string[] = [];
      for (const p of photos) images.push("url" in p ? p.url : await enDataUrl(p.blob));
      return modifierDemo((etat) => {
        const donnees = {
          nom: s.nom.trim(),
          marque: s.marque.trim(),
          couleur: s.couleur.trim(),
          description: s.description.trim(),
          prix: s.prix,
          prixPromo: s.prixPromo,
          finPromo: s.prixPromo ? s.finPromo : null,
          enStock: s.enStock,
          pointures: s.pointures,
          images,
        };
        if (s.id) {
          const c = trouver(etat.chaussures, s.id);
          Object.assign(c, donnees);
          return c;
        }
        const nouvelle: Chaussure = {
          ...donnees,
          id: identifiant(),
          slug: creerSlug(
            s.marque,
            s.nom,
            etat.chaussures.map((c) => c.slug),
          ),
          promoEnCours: false,
          creeLe: new Date().toISOString(),
          nouveau: true,
        };
        etat.chaussures.unshift(nouvelle);
        return nouvelle;
      });
    },

    async supprimerChaussure(id) {
      modifierDemo((etat) => {
        etat.chaussures = etat.chaussures.filter((c) => c.id !== id);
        if (etat.reglages.chaussureVedetteId === id) etat.reglages.chaussureVedetteId = null;
      });
    },
    async changerStock(id, enStock) {
      modifierDemo((etat) => void (trouver(etat.chaussures, id).enStock = enStock));
    },
    async changerStockPointure(id, pointure, enStock) {
      modifierDemo((etat) => {
        const p = trouver(etat.chaussures, id).pointures.find((x) => x.pointure === pointure);
        if (p) p.enStock = enStock;
      });
    },

    async commandes() {
      return lireDemo().commandes;
    },
    async statutCommande(id, statut) {
      modifierDemo((etat) => {
        const c = etat.commandes.find((x) => x.id === id);
        if (c) c.statut = statut;
      });
    },
    async demandes() {
      return lireDemo().demandes;
    },
    async statutDemande(id, statut) {
      modifierDemo((etat) => {
        const d = etat.demandes.find((x) => x.id === id);
        if (d) d.statut = statut;
      });
    },

    async numeros() {
      return lireDemo().numeros;
    },
    async ajouterNumero(libelle, numero, intro) {
      const normalise = normaliserNumeroWhatsapp(numero);
      if (!normalise) throw new ErreurAdmin("Numéro invalide. Exemple : 05 06 52 38 16 (ou +33... pour l'étranger).");
      modifierDemo((etat) => {
        etat.numeros.push({
          id: identifiant(),
          libelle: libelle.trim(),
          numero: normalise,
          actif: etat.numeros.length === 0,
          intro: intro.trim() || null,
        });
      });
    },
    async modifierNumero(id, libelle, numero, intro) {
      const normalise = normaliserNumeroWhatsapp(numero);
      if (!normalise) throw new ErreurAdmin("Numéro invalide. Exemple : 05 06 52 38 16 (ou +33... pour l'étranger).");
      modifierDemo((etat) => {
        const n = etat.numeros.find((x) => x.id === id);
        if (n) Object.assign(n, { libelle: libelle.trim(), numero: normalise, intro: intro.trim() || null });
      });
    },
    async supprimerNumero(id) {
      modifierDemo((etat) => {
        const n = etat.numeros.find((x) => x.id === id);
        if (n?.actif) throw new ErreurAdmin("Il faut toujours un numéro WhatsApp actif.");
        etat.numeros = etat.numeros.filter((x) => x.id !== id);
      });
    },
    async activerNumero(id) {
      modifierDemo((etat) => etat.numeros.forEach((n) => (n.actif = n.id === id)));
    },

    async reglages() {
      return lireDemo().reglages;
    },
    async enregistrerReglages(reglages) {
      modifierDemo((etat) => void (etat.reglages = reglages));
    },
    async zones() {
      return lireDemo().zones;
    },
    async enregistrerZone(zone) {
      modifierDemo((etat) => {
        if (zone.id) {
          const z = etat.zones.find((x) => x.id === zone.id);
          if (z) Object.assign(z, zone);
        } else {
          etat.zones.push({ ...zone, id: identifiant() });
        }
      });
    },
    async supprimerZone(id) {
      modifierDemo((etat) => {
        if (etat.zones.length <= 1) throw new ErreurAdmin("Il faut garder au moins une zone de livraison.");
        etat.zones = etat.zones.filter((z) => z.id !== id);
      });
    },
  };
  return api;
}
