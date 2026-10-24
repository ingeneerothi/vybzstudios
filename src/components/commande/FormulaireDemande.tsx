"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { IconeAppareilPhoto, IconeCroix, IconeFleche } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { ErreurEnvoi, creerDemande } from "@/lib/commande";
import { compresserPhoto } from "@/lib/images/compresser";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { formaterSaisieTelephone, normaliserTelephone } from "@/lib/telephone";
import { lienWhatsapp, messageDemande } from "@/lib/whatsapp";
import { Champ } from "./Champ";
import { Validation } from "./Validation";

const POINTURES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];

type Erreurs = Partial<Record<"photo" | "nom" | "telephone" | "lieu", string>>;

export function FormulaireDemande({ whatsapp }: { whatsapp: string }) {
  const uid = useId();
  const id = (nom: string) => `${uid}-${nom}`;
  const entreeFichier = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [apercu, setApercu] = useState<string | null>(null);
  const [preparation, setPreparation] = useState(false);
  const [pointure, setPointure] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [lieu, setLieu] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurEnvoi, setErreurEnvoi] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ code: string; lien: string } | null>(null);

  useEffect(() => () => void (apercu && URL.revokeObjectURL(apercu)), [apercu]);

  async function choisirPhoto(fichier: File | undefined) {
    if (!fichier) return;
    setPreparation(true);
    setErreurs((e) => ({ ...e, photo: undefined }));
    try {
      const compressee = await compresserPhoto(fichier);
      setPhoto(compressee);
      setApercu(URL.createObjectURL(compressee));
    } catch (err) {
      setErreurs((e) => ({ ...e, photo: err instanceof Error ? err.message : "Photo illisible." }));
    } finally {
      setPreparation(false);
    }
  }

  function retirerPhoto() {
    setPhoto(null);
    setApercu(null);
    if (entreeFichier.current) entreeFichier.current.value = "";
  }

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    setErreurEnvoi("");
    const e: Erreurs = {};
    if (!photo && commentaire.trim().length < 3)
      e.photo = "Ajoutez une photo (ou décrivez la chaussure en commentaire).";
    if (nom.trim().length < 2) e.nom = "Indiquez votre nom complet.";
    if (!normaliserTelephone(telephone)) e.telephone = "Numéro invalide. Exemple : 07 08 09 10 11.";
    if (lieu.trim().length < 2) e.lieu = "Indiquez votre commune, quartier ou ville.";
    setErreurs(e);
    const premier = Object.keys(e)[0];
    if (premier) {
      document.getElementById(`${id(premier)}-bloc`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setEnvoi(true);
    try {
      const saisie = {
        photo,
        pointure,
        nom: nom.trim(),
        telephone,
        lieu: lieu.trim(),
        commentaire: commentaire.trim(),
      };
      const r = await creerDemande(saisie, whatsapp);
      const message = messageDemande({
        code: r.code,
        photoUrl: r.photoUrl,
        pointure,
        nom: saisie.nom,
        telephone: normaliserTelephone(telephone) ?? telephone,
        lieu: saisie.lieu,
        commentaire: saisie.commentaire,
      });
      setResultat({ code: r.code, lien: lienWhatsapp(r.whatsapp, message) });
    } catch (err) {
      setErreurEnvoi(err instanceof ErreurEnvoi ? err.message : "Un problème est survenu. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <form onSubmit={envoyer} noValidate className="mt-8 space-y-6">
        <Champ id={id("photo")} libelle="Photo de la chaussure" erreur={erreurs.photo}>
          <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {apercu ? (
                <motion.div
                  key="apercu"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
                  className="relative overflow-hidden rounded-[22px] bg-carte"
                >
                  {/* Aperçu local (blob:) : pas besoin d'optimisation d'image ici */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={apercu} alt="Photo choisie" className="max-h-80 w-full object-contain" />
                  <button
                    type="button"
                    onClick={retirerPhoto}
                    aria-label="Retirer la photo"
                    className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-white/90 text-encre shadow"
                  >
                    <IconeCroix className="size-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.label
                  key="choisir"
                  htmlFor={id("photo")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DUREE.micro }}
                  className={cn(
                    "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed bg-white px-6 text-center transition-colors",
                    erreurs.photo ? "border-promo/60" : "border-trait hover:border-vert",
                  )}
                >
                  <span className="grid size-12 place-items-center rounded-full bg-papier text-vert">
                    <IconeAppareilPhoto className="size-6" />
                  </span>
                  <span className="text-[16px] font-medium">
                    {preparation ? "Préparation de la photo…" : "Ajouter une photo"}
                  </span>
                  <span className="text-[13px] text-gris">Depuis votre galerie ou l&apos;appareil photo</span>
                </motion.label>
              )}
            </AnimatePresence>
            <input
              ref={entreeFichier}
              id={id("photo")}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => choisirPhoto(e.target.files?.[0])}
            />
          </div>
        </Champ>

        <Champ id={id("pointure-demande")} libelle="Pointure">
          <select
            id={id("pointure-demande")}
            value={pointure}
            onChange={(e) => setPointure(e.target.value)}
            className="champ"
          >
            <option value="">Je ne sais pas encore</option>
            {POINTURES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Champ>
        <Champ id={id("nom")} libelle="Nom complet" erreur={erreurs.nom}>
          <input
            id={id("nom")}
            autoComplete="name"
            autoCapitalize="words"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={cn("champ", erreurs.nom && "champ-erreur")}
            aria-invalid={Boolean(erreurs.nom) || undefined}
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
            placeholder="07 08 09 10 11"
            value={telephone}
            onChange={(e) => setTelephone(formaterSaisieTelephone(e.target.value))}
            className={cn("champ tabular-nums", erreurs.telephone && "champ-erreur")}
            aria-invalid={Boolean(erreurs.telephone) || undefined}
          />
        </Champ>
        <Champ id={id("lieu")} libelle="Lieu de livraison" erreur={erreurs.lieu} aide="Commune et quartier, ou ville.">
          <input
            id={id("lieu")}
            autoComplete="address-level2"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            className={cn("champ", erreurs.lieu && "champ-erreur")}
            aria-invalid={Boolean(erreurs.lieu) || undefined}
          />
        </Champ>
        <Champ id={id("commentaire")} libelle="Commentaire" facultatif>
          <textarea
            id={id("commentaire")}
            rows={3}
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Couleur, budget, modèle exact…"
            className="champ min-h-[6.5rem] py-3.5"
          />
        </Champ>

        {erreurEnvoi && (
          <p role="alert" className="rounded-2xl bg-promo/10 px-4 py-3 text-[15px] text-promo">
            {erreurEnvoi}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi || preparation}
          className="bouton-plein group min-h-14 w-full text-[16px]"
        >
          {envoi ? "Envoi…" : "Envoyer la demande"}
          {!envoi && (
            <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
          )}
        </button>
      </form>

      {resultat && (
        <Validation
          titre="Demande envoyée"
          code={resultat.code}
          lienWhatsapp={resultat.lien}
          onFermer={() => {
            setResultat(null);
            retirerPhoto();
            setCommentaire("");
          }}
        />
      )}
    </>
  );
}
