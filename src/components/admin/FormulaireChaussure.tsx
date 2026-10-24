"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Champ } from "@/components/commande/Champ";
import { cn } from "@/lib/cn";
import { type ChaussureSaisie, ErreurAdmin, type PhotoSaisie } from "@/lib/admin/api";
import { genererDescription } from "@/lib/admin/description";
import { formatPrix } from "@/lib/format";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { pourcentageRemise, prixDepuisPourcentage } from "@/lib/prix";
import type { Chaussure, Pointure } from "@/lib/types";
import { EditeurPhotos } from "./EditeurPhotos";
import { useAdmin } from "./Fournisseur";
import { Interrupteur } from "./Interrupteur";

const POINTURES_PAR_DEFAUT = [39, 40, 41, 42, 43, 44, 45, 46, 47];
const TOUTES_POINTURES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];

type Erreurs = Partial<Record<"photos" | "nom" | "prix" | "promo" | "pointures", string>>;

/** Date ISO -> valeur d'un champ datetime-local (heure du téléphone). */
function versChampDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const decalage = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - decalage).toISOString().slice(0, 16);
}

const chiffres = (v: string) => Number(v.replace(/\D/g, "")) || 0;

export function FormulaireChaussure({ chaussure, marques }: { chaussure?: Chaussure; marques: string[] }) {
  const { api, notifier, confirmer } = useAdmin();
  const router = useRouter();
  const modification = Boolean(chaussure);
  const uid = useId();
  const id = (nom: string) => `${uid}-${nom}`;

  const [photos, setPhotos] = useState<PhotoSaisie[]>(() => chaussure?.images.map((url) => ({ cle: url, url })) ?? []);
  const [nom, setNom] = useState(chaussure?.nom ?? "");
  const [marque, setMarque] = useState(chaussure?.marque ?? "");
  const [couleur, setCouleur] = useState(chaussure?.couleur ?? "");
  const [description, setDescription] = useState(chaussure?.description ?? "");
  const [variante, setVariante] = useState(0);
  const [prix, setPrix] = useState(chaussure ? String(chaussure.prix) : "");
  const [promoActive, setPromoActive] = useState(chaussure?.prixPromo != null);
  const [modePromo, setModePromo] = useState<"prix" | "pourcentage">("prix");
  const [prixPromo, setPrixPromo] = useState(chaussure?.prixPromo != null ? String(chaussure.prixPromo) : "");
  const [pourcentage, setPourcentage] = useState(
    chaussure?.prixPromo != null ? String(pourcentageRemise(chaussure)) : "",
  );
  const [finPromo, setFinPromo] = useState(versChampDate(chaussure?.finPromo ?? null));
  const [enStock, setEnStock] = useState(chaussure?.enStock ?? true);
  const [pointures, setPointures] = useState<Pointure[]>(
    chaussure?.pointures ?? POINTURES_PAR_DEFAUT.map((pointure) => ({ pointure, enStock: true })),
  );
  const [listePointures, setListePointures] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState<string | null>(null);

  const prixNombre = chiffres(prix);
  const promoCalculee =
    modePromo === "prix" ? chiffres(prixPromo) : prixDepuisPourcentage(prixNombre, Math.min(95, chiffres(pourcentage)));

  function basculerProposee(p: number) {
    setPointures((liste) =>
      liste.some((x) => x.pointure === p)
        ? liste.filter((x) => x.pointure !== p)
        : [...liste, { pointure: p, enStock: true }].sort((a, b) => a.pointure - b.pointure),
    );
  }

  function basculerStockPointure(p: number) {
    setPointures((liste) => liste.map((x) => (x.pointure === p ? { ...x, enStock: !x.enStock } : x)));
  }

  function generer() {
    if (!nom.trim()) {
      notifier("Écrivez d'abord le nom de la chaussure.");
      return;
    }
    setDescription(genererDescription({ nom, marque, couleur }, variante));
    setVariante((v) => v + 1);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!api) return;
    const err: Erreurs = {};
    if (photos.length === 0) err.photos = "Ajoutez au moins une photo.";
    if (nom.trim().length < 2) err.nom = "Écrivez le nom de la chaussure.";
    if (prixNombre <= 0) err.prix = "Écrivez le prix.";
    if (promoActive && (promoCalculee <= 0 || promoCalculee >= prixNombre)) {
      err.promo = "Le prix promo doit être plus petit que le prix normal.";
    }
    if (pointures.length === 0) err.pointures = "Choisissez au moins une pointure.";
    setErreurs(err);
    const premier = Object.keys(err)[0];
    if (premier) {
      document.getElementById(`${id(premier)}-bloc`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const saisie: ChaussureSaisie = {
      id: chaussure?.id,
      nom,
      marque,
      couleur,
      description,
      prix: prixNombre,
      prixPromo: promoActive ? promoCalculee : null,
      finPromo: promoActive && finPromo ? new Date(finPromo).toISOString() : null,
      enStock,
      pointures,
    };
    setEnvoi(photos.some((p) => "blob" in p) ? "Envoi des photos…" : "Enregistrement…");
    try {
      await api.enregistrerChaussure(saisie, photos);
      notifier(modification ? "Chaussure modifiée ✅" : "Chaussure ajoutée ✅");
      router.push("/admin/chaussures");
    } catch (er) {
      notifier(`⚠️ ${er instanceof ErreurAdmin || er instanceof Error ? er.message : "Enregistrement impossible."}`);
      setEnvoi(null);
    }
  }

  async function supprimer() {
    if (!api || !chaussure) return;
    const ok = await confirmer({
      titre: "Supprimer cette chaussure ?",
      texte: `« ${chaussure.nom} » disparaîtra du site. Les commandes déjà reçues sont gardées.`,
      bouton: "Oui, supprimer",
      danger: true,
    });
    if (!ok) return;
    setEnvoi("Suppression…");
    try {
      await api.supprimerChaussure(chaussure.id);
      notifier("Chaussure supprimée ✅");
      router.push("/admin/chaussures");
    } catch (er) {
      notifier(`⚠️ ${er instanceof Error ? er.message : "Suppression impossible."}`);
      setEnvoi(null);
    }
  }

  const proposees = new Set(pointures.map((p) => p.pointure));

  return (
    <form onSubmit={enregistrer} noValidate className="mx-auto max-w-xl space-y-10 px-4 pt-6 pb-28">
      <Section titre="Photos" id={id("photos-bloc")}>
        <EditeurPhotos photos={photos} onChange={setPhotos} nom={nom} erreur={erreurs.photos} />
      </Section>

      <Section titre="Informations">
        <div className="space-y-5">
          <Champ id={id("nom")} libelle="Nom de la chaussure" erreur={erreurs.nom}>
            <input
              id={id("nom")}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. : Air Max 95 Kaki"
              className={cn("champ min-h-14 text-[17px]", erreurs.nom && "champ-erreur")}
            />
          </Champ>
          <Champ id={id("marque")} libelle="Marque">
            <input
              id={id("marque")}
              list={id("marques")}
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              placeholder="Ex. : Nike"
              className="champ min-h-14 text-[17px]"
            />
            <datalist id={id("marques")}>
              {marques.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Champ>
          <Champ id={id("couleur")} libelle="Couleur" facultatif>
            <input
              id={id("couleur")}
              value={couleur}
              onChange={(e) => setCouleur(e.target.value)}
              placeholder="Ex. : Noir / blanc"
              className="champ min-h-14 text-[17px]"
            />
          </Champ>
        </div>
      </Section>

      <Section titre="Prix">
        <div className="space-y-5">
          <Champ
            id={id("prix")}
            libelle="Prix (FCFA)"
            erreur={erreurs.prix}
            aide={prixNombre ? formatPrix(prixNombre) : undefined}
          >
            <input
              id={id("prix")}
              inputMode="numeric"
              value={prix}
              onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))}
              placeholder="22000"
              className={cn("champ min-h-14 text-[17px] tabular-nums", erreurs.prix && "champ-erreur")}
            />
          </Champ>

          <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white px-4 py-3 ring-1 ring-trait/70">
            <span className="text-[17px] font-medium">Faire une réduction</span>
            <Interrupteur actif={promoActive} onChange={setPromoActive} libelle="Faire une réduction" />
          </div>

          <AnimatePresence initial={false}>
            {promoActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
                className="space-y-5 rounded-[22px] bg-white p-4 ring-1 ring-trait/70"
                id={id("promo-bloc")}
              >
                <div
                  className="grid grid-cols-2 gap-2 rounded-2xl bg-papier p-1"
                  role="radiogroup"
                  aria-label="Type de réduction"
                >
                  {(["prix", "pourcentage"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={modePromo === m}
                      onClick={() => setModePromo(m)}
                      className={cn(
                        "min-h-12 rounded-xl text-[16px] font-medium transition-colors",
                        modePromo === m ? "bg-encre text-white" : "text-encre",
                      )}
                    >
                      {m === "prix" ? "Nouveau prix" : "Pourcentage"}
                    </button>
                  ))}
                </div>
                {modePromo === "prix" ? (
                  <Champ id={id("prix-promo")} libelle="Prix promo (FCFA)" erreur={erreurs.promo}>
                    <input
                      id={id("prix-promo")}
                      inputMode="numeric"
                      value={prixPromo}
                      onChange={(e) => setPrixPromo(e.target.value.replace(/\D/g, ""))}
                      className={cn("champ min-h-14 text-[17px] tabular-nums", erreurs.promo && "champ-erreur")}
                    />
                  </Champ>
                ) : (
                  <Champ id={id("pourcentage")} libelle="Réduction (%)" erreur={erreurs.promo}>
                    <input
                      id={id("pourcentage")}
                      inputMode="numeric"
                      value={pourcentage}
                      onChange={(e) => setPourcentage(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="20"
                      className={cn("champ min-h-14 text-[17px] tabular-nums", erreurs.promo && "champ-erreur")}
                    />
                  </Champ>
                )}
                {prixNombre > 0 && promoCalculee > 0 && promoCalculee < prixNombre && (
                  <p className="text-[16px]">
                    Sur le site : <s className="text-gris">{formatPrix(prixNombre)}</s>{" "}
                    <strong className="text-promo">{formatPrix(promoCalculee)}</strong> ( -
                    {Math.round(((prixNombre - promoCalculee) / prixNombre) * 100)}%)
                  </p>
                )}
                <Champ
                  id={id("fin-promo")}
                  libelle="Fin de la promo"
                  facultatif
                  aide="Sans date, la promo reste jusqu'à ce que vous l'arrêtiez."
                >
                  <input
                    id={id("fin-promo")}
                    type="datetime-local"
                    value={finPromo}
                    onChange={(e) => setFinPromo(e.target.value)}
                    className="champ min-h-14 text-[17px]"
                  />
                </Champ>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      <Section titre="Stock et pointures" id={id("pointures-bloc")}>
        <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white px-4 py-3 ring-1 ring-trait/70">
          <span className="text-[17px] font-medium">
            {enStock ? "En stock" : "En rupture"}
            <span className="block text-[14px] font-normal text-gris">
              {enStock ? "Les clients peuvent commander" : "Affichée « Rupture de stock »"}
            </span>
          </span>
          <Interrupteur actif={enStock} onChange={setEnStock} libelle="Chaussure en stock" />
        </div>

        <p className="mt-5 text-[16px]">
          Touchez une pointure pour la mettre en rupture (barrée) ou la remettre en stock.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {pointures.map((p) => (
            <button
              key={p.pointure}
              type="button"
              aria-pressed={p.enStock}
              aria-label={`Pointure ${p.pointure} ${p.enStock ? "en stock" : "en rupture"}`}
              onClick={() => basculerStockPointure(p.pointure)}
              className={cn(
                "min-h-14 rounded-2xl text-[17px] font-semibold tabular-nums transition-colors",
                p.enStock ? "bg-vert text-white" : "bg-white text-gris line-through ring-1 ring-trait",
              )}
            >
              {p.pointure}
            </button>
          ))}
        </div>
        {erreurs.pointures && <p className="mt-2 text-[15px] text-promo">{erreurs.pointures}</p>}

        <button
          type="button"
          onClick={() => setListePointures((v) => !v)}
          aria-expanded={listePointures}
          className="mt-4 min-h-12 text-[16px] font-medium text-vert underline underline-offset-4"
        >
          {listePointures ? "Fermer" : "Changer les pointures proposées"}
        </button>
        {listePointures && (
          <div className="mt-2 grid grid-cols-5 gap-2">
            {TOUTES_POINTURES.map((p) => (
              <label
                key={p}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl text-[16px] ring-1",
                  proposees.has(p) ? "bg-encre text-white ring-encre" : "bg-white ring-trait",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={proposees.has(p)}
                  onChange={() => basculerProposee(p)}
                />
                {p}
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section titre="Description">
        <button type="button" onClick={generer} className="bouton-contour min-h-13 w-full text-[16px]">
          ✨ Générer la description
        </button>
        <label htmlFor={id("description")} className="sr-only">
          Description
        </label>
        <textarea
          id={id("description")}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="2 ou 3 phrases simples sur la chaussure."
          className="champ mt-3 min-h-32 py-3.5 text-[17px] leading-relaxed"
        />
        <p className="mt-2 text-[14px] text-gris">Vous pouvez modifier le texte proposé avant d&apos;enregistrer.</p>
      </Section>

      {modification && (
        <button
          type="button"
          onClick={supprimer}
          className="bouton min-h-14 w-full border-2 border-promo/40 text-[17px] text-promo hover:bg-promo/5"
        >
          Supprimer cette chaussure
        </button>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 pb-3">
        <button
          type="submit"
          disabled={Boolean(envoi)}
          className="bouton-plein mx-auto flex min-h-14 w-full max-w-xl text-[17px] shadow-lg"
        >
          {envoi ?? (modification ? "Enregistrer les changements" : "Ajouter la chaussure")}
        </button>
      </div>
    </form>
  );
}

function Section({ titre, id, children }: { titre: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-[20px] font-bold">{titre}</h2>
      {children}
    </section>
  );
}
