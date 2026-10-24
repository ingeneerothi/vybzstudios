"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";
import { usePromo } from "@/components/chaussure/usePromo";
import { IconeFleche, IconeMoins, IconePlus, IconeRetour } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { ErreurEnvoi, creerCommande } from "@/lib/commande";
import { formatPrix, libellePaiement } from "@/lib/format";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { pointuresDisponibles } from "@/lib/prix";
import { formaterSaisieTelephone, normaliserTelephone } from "@/lib/telephone";
import type { Chaussure, ResultatCommande, Zone } from "@/lib/types";
import { decrireLieu, lienWhatsapp, messageCommande } from "@/lib/whatsapp";
import { Champ } from "./Champ";
import { Validation } from "./Validation";

const COMMUNES_ABIDJAN = [
  "Abobo",
  "Adjamé",
  "Anyama",
  "Attécoubé",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
];

type Props = {
  chaussure: Chaussure;
  zones: Zone[];
  modePaiement: string;
  whatsapp: string;
};

type Erreurs = Partial<
  Record<"pointure" | "nom" | "telephone" | "zone" | "commune" | "quartier" | "ville" | "adresse", string>
>;

export function FormulaireCommande({ chaussure: c, zones, modePaiement, whatsapp }: Props) {
  const dispo = pointuresDisponibles(c);
  const promo = usePromo(c);
  // Identifiants uniques : Next garde parfois l'écran précédent caché dans la page.
  const uid = useId();
  const id = (nom: string) => `${uid}-${nom}`;

  const [pointure, setPointure] = useState<number | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [repere, setRepere] = useState("");
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurEnvoi, setErreurEnvoi] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ r: ResultatCommande; lien: string } | null>(null);

  const zone = zones.find((z) => z.id === zoneId);
  const prixUnitaire = promo && c.prixPromo != null ? c.prixPromo : c.prix;
  const total = prixUnitaire * quantite + (zone?.frais ?? 0);

  function verifier(): Erreurs {
    const e: Erreurs = {};
    if (pointure == null) e.pointure = "Choisissez votre pointure.";
    if (nom.trim().length < 2) e.nom = "Indiquez votre nom complet.";
    if (!normaliserTelephone(telephone)) e.telephone = "Numéro invalide. Exemple : 07 08 09 10 11.";
    if (!zone) e.zone = "Choisissez une zone de livraison.";
    if (zone?.details === "commune_quartier" && !commune) e.commune = "Choisissez votre commune.";
    if (zone && zone.details !== "ville" && quartier.trim().length < 2) e.quartier = "Indiquez votre quartier.";
    if (zone?.details === "ville" && ville.trim().length < 2) e.ville = "Indiquez votre ville.";
    if (adresse.trim().length < 3) e.adresse = "Indiquez une adresse précise.";
    return e;
  }

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    setErreurEnvoi("");
    const e = verifier();
    setErreurs(e);
    const premier = Object.keys(e)[0];
    if (premier) {
      document.getElementById(`${id(premier)}-bloc`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(id(premier))?.focus({ preventScroll: true });
      return;
    }
    if (!zone || pointure == null) return;

    setEnvoi(true);
    try {
      const saisie = {
        slug: c.slug,
        pointure,
        quantite,
        zoneId: zone.id,
        nom: nom.trim(),
        telephone,
        commune: zone.details === "commune_quartier" ? commune : "",
        quartier: zone.details !== "ville" ? quartier.trim() : "",
        ville: zone.details === "ville" ? ville.trim() : "",
        adresse: adresse.trim(),
        repere: repere.trim(),
      };
      const r = await creerCommande(saisie, { chaussure: c, zone, modePaiement, whatsapp });
      const message = messageCommande({
        ...r,
        nom: saisie.nom,
        telephone: normaliserTelephone(telephone) ?? telephone,
        lieu: decrireLieu(zone.nom, { details: zone.details, ...saisie }),
        adresse: saisie.adresse,
        repere: saisie.repere,
      });
      setResultat({ r, lien: lienWhatsapp(r.whatsapp, message) });
    } catch (err) {
      setErreurEnvoi(err instanceof ErreurEnvoi ? err.message : "Un problème est survenu. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  }

  const aria = (cle: keyof Erreurs) => ({
    "aria-invalid": Boolean(erreurs[cle]) || undefined,
    "aria-describedby": erreurs[cle] ? `${id(cle)}-erreur` : undefined,
  });

  return (
    <>
      <form
        onSubmit={envoyer}
        noValidate
        className="mx-auto max-w-xl px-4 pt-[calc(5rem+env(safe-area-inset-top))] pb-16 sm:px-6 md:pt-28"
      >
        <Suspense fallback={null}>
          <PointureDepuisLien dispo={dispo} onTrouvee={setPointure} />
        </Suspense>
        <Link
          href={`/chaussure/${c.slug}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-[14px] text-gris hover:text-encre"
        >
          <IconeRetour className="size-4" />
          Retour à la chaussure
        </Link>
        <h1 className="titre-section mt-2">Commande</h1>

        {/* Chaussure choisie */}
        <section aria-label="Votre chaussure" className="mt-6 rounded-[22px] bg-white p-4 ring-1 ring-trait/70">
          <div className="flex gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-carte">
              {c.images[0] && (
                <Image src={c.images[0]} alt="" fill sizes="96px" quality={80} className="object-contain p-1" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="etiquette text-gris">{c.marque}</p>
              <p className="mt-1 text-[16px] leading-snug font-semibold">{c.nom}</p>
              <p className="mt-1 text-[15px] tabular-nums">{formatPrix(prixUnitaire)}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Champ id={id("pointure")} libelle="Pointure" erreur={erreurs.pointure}>
              <select
                id={id("pointure")}
                value={pointure ?? ""}
                onChange={(e) => setPointure(e.target.value ? Number(e.target.value) : null)}
                className={cn("champ", erreurs.pointure && "champ-erreur")}
                {...aria("pointure")}
              >
                <option value="">Choisir</option>
                {dispo.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Champ>
            <div>
              <span id={id("quantite")} className="mb-1.5 block text-[15px] font-medium">
                Quantité
              </span>
              <div
                role="group"
                aria-labelledby={id("quantite")}
                className="flex min-h-13 items-center justify-between rounded-2xl border border-trait bg-white px-1.5"
              >
                <button
                  type="button"
                  aria-label="Une paire de moins"
                  disabled={quantite <= 1}
                  onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-papier disabled:opacity-30"
                >
                  <IconeMoins className="size-5" />
                </button>
                <span className="text-[17px] font-semibold tabular-nums" aria-live="polite">
                  {quantite}
                </span>
                <button
                  type="button"
                  aria-label="Une paire de plus"
                  disabled={quantite >= 10}
                  onClick={() => setQuantite((q) => Math.min(10, q + 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-papier disabled:opacity-30"
                >
                  <IconePlus className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Coordonnées */}
        <section aria-labelledby={id("coordonnees")} className="mt-10 space-y-5">
          <h2 id={id("coordonnees")} className="text-[18px] font-semibold">
            Vos coordonnées
          </h2>
          <Champ id={id("nom")} libelle="Nom complet" erreur={erreurs.nom}>
            <input
              id={id("nom")}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className={cn("champ", erreurs.nom && "champ-erreur")}
              {...aria("nom")}
            />
          </Champ>
          <Champ
            id={id("telephone")}
            libelle="Numéro de téléphone"
            erreur={erreurs.telephone}
            aide="Idéalement votre numéro WhatsApp."
          >
            <input
              id={id("telephone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="07 08 09 10 11"
              value={telephone}
              onChange={(e) => setTelephone(formaterSaisieTelephone(e.target.value))}
              className={cn("champ tabular-nums", erreurs.telephone && "champ-erreur")}
              {...aria("telephone")}
            />
          </Champ>
        </section>

        {/* Livraison */}
        <section aria-labelledby={id("livraison")} className="mt-10 space-y-5">
          <h2 id={id("livraison")} className="text-[18px] font-semibold">
            Livraison
          </h2>
          <Champ id={id("zone")} libelle="Zone de livraison" erreur={erreurs.zone}>
            <select
              id={id("zone")}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className={cn("champ", erreurs.zone && "champ-erreur")}
              {...aria("zone")}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nom} — {formatPrix(z.frais)}
                </option>
              ))}
            </select>
          </Champ>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={zone?.details}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
              className="space-y-5"
            >
              {zone?.details === "commune_quartier" && (
                <Champ id={id("commune")} libelle="Commune" erreur={erreurs.commune}>
                  <select
                    id={id("commune")}
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className={cn("champ", erreurs.commune && "champ-erreur")}
                    {...aria("commune")}
                  >
                    <option value="">Choisir la commune</option>
                    {COMMUNES_ABIDJAN.map((nomCommune) => (
                      <option key={nomCommune}>{nomCommune}</option>
                    ))}
                  </select>
                </Champ>
              )}
              {zone && zone.details !== "ville" && (
                <Champ id={id("quartier")} libelle="Quartier" erreur={erreurs.quartier}>
                  <input
                    id={id("quartier")}
                    autoComplete="address-level3"
                    enterKeyHint="next"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    className={cn("champ", erreurs.quartier && "champ-erreur")}
                    {...aria("quartier")}
                  />
                </Champ>
              )}
              {zone?.details === "ville" && (
                <Champ
                  id={id("ville")}
                  libelle="Ville"
                  erreur={erreurs.ville}
                  aide="Le colis est expédié dans votre ville."
                >
                  <input
                    id={id("ville")}
                    autoComplete="address-level2"
                    enterKeyHint="next"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className={cn("champ", erreurs.ville && "champ-erreur")}
                    {...aria("ville")}
                  />
                </Champ>
              )}
            </motion.div>
          </AnimatePresence>

          <Champ id={id("adresse")} libelle="Adresse précise" erreur={erreurs.adresse}>
            <textarea
              id={id("adresse")}
              rows={2}
              autoComplete="street-address"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              className={cn("champ min-h-[5.5rem] py-3.5", erreurs.adresse && "champ-erreur")}
              {...aria("adresse")}
            />
          </Champ>
          <Champ
            id={id("repere")}
            libelle="Point de repère"
            facultatif
            aide="Ex. : près de la pharmacie, portail bleu."
          >
            <input
              id={id("repere")}
              enterKeyHint="done"
              value={repere}
              onChange={(e) => setRepere(e.target.value)}
              className="champ"
            />
          </Champ>
        </section>

        {/* Récapitulatif */}
        <section aria-labelledby={id("recap")} className="mt-10 rounded-[22px] bg-white p-5 ring-1 ring-trait/70">
          <h2 id={id("recap")} className="text-[18px] font-semibold">
            Récapitulatif
          </h2>
          <dl className="mt-4 space-y-2.5 text-[15px]">
            <div className="flex justify-between gap-4">
              <dt className="text-gris">Chaussure{quantite > 1 ? ` × ${quantite}` : ""}</dt>
              <dd className="tabular-nums">{formatPrix(prixUnitaire * quantite)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gris">Livraison{zone ? ` (${zone.nom})` : ""}</dt>
              <dd className="tabular-nums">{formatPrix(zone?.frais ?? 0)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-trait pt-3">
              <dt className="text-[16px] font-semibold">Total</dt>
              <dd className="text-[22px] font-bold tabular-nums" data-testid="total">
                {formatPrix(total)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[14px] text-gris">Paiement : {libellePaiement(modePaiement)}</p>
        </section>

        {erreurEnvoi && (
          <p role="alert" className="mt-6 rounded-2xl bg-promo/10 px-4 py-3 text-[15px] text-promo">
            {erreurEnvoi}
          </p>
        )}

        <button type="submit" disabled={envoi} className="bouton-plein group mt-6 min-h-14 w-full text-[16px]">
          {envoi ? "Envoi…" : `Commander · ${formatPrix(total)}`}
          {!envoi && (
            <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
          )}
        </button>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-gris">
          WhatsApp s&apos;ouvre ensuite avec votre commande prête : il suffit d&apos;appuyer sur Envoyer.
        </p>
      </form>

      {resultat && (
        <Validation
          titre="Commande enregistrée"
          code={resultat.r.code}
          lienWhatsapp={resultat.lien}
          onFermer={() => {
            setResultat(null);
            setQuantite(1);
            setAdresse("");
            setRepere("");
          }}
        />
      )}
    </>
  );
}

/**
 * Reprend la pointure choisie sur la fiche (« ?pointure=42 »). Lue à part, après l'affichage :
 * le formulaire reste ainsi dans la page statique, visible tout de suite, sans saut de mise en page.
 */
function PointureDepuisLien({ dispo, onTrouvee }: { dispo: number[]; onTrouvee: (p: number) => void }) {
  const demandee = Number(useSearchParams().get("pointure"));
  const valide = dispo.includes(demandee) ? demandee : null;
  useEffect(() => {
    if (valide != null) onTrouvee(valide);
  }, [valide, onTrouvee]);
  return null;
}
