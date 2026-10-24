"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { useAdmin } from "@/components/admin/Fournisseur";
import { ErreurAdmin } from "@/lib/admin/api";

export default function NouveauMotDePasse() {
  const uid = useId();
  const { api, notifier } = useAdmin();
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!api) return;
    if (motDePasse.length < 8) return setErreur("Au moins 8 caractères.");
    if (motDePasse !== confirmation) return setErreur("Les deux mots de passe ne sont pas identiques.");
    setErreur("");
    setEnvoi(true);
    try {
      await api.nouveauMotDePasse(motDePasse);
      notifier("Mot de passe changé ✅");
      router.replace("/admin/chaussures");
    } catch (err) {
      setErreur(err instanceof ErreurAdmin ? err.message : "Mot de passe non enregistré. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <>
      <EnTeteAdmin titre="Nouveau mot de passe" retour={{ href: "/admin/reglages", libelle: "Retour aux réglages" }} />
      <form onSubmit={enregistrer} className="mx-auto max-w-xl space-y-5 px-4 pt-6">
        <div>
          <label htmlFor={`${uid}-mdp`} className="mb-2 block font-medium">
            Nouveau mot de passe
          </label>
          <input
            id={`${uid}-mdp`}
            type="password"
            autoComplete="new-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="champ min-h-14 text-[17px]"
          />
          <p className="mt-1.5 text-[14px] text-gris">Au moins 8 caractères.</p>
        </div>
        <div>
          <label htmlFor={`${uid}-mdp2`} className="mb-2 block font-medium">
            Encore une fois
          </label>
          <input
            id={`${uid}-mdp2`}
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="champ min-h-14 text-[17px]"
          />
        </div>
        {erreur && (
          <p role="alert" className="rounded-2xl bg-promo/10 px-4 py-3 text-[16px] text-promo">
            {erreur}
          </p>
        )}
        <button type="submit" disabled={envoi} className="bouton-plein min-h-14 w-full text-[17px]">
          {envoi ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </>
  );
}
