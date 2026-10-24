"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CadreAcces } from "@/components/admin/CadreAcces";
import { useAdmin } from "@/components/admin/Fournisseur";
import { ErreurAdmin } from "@/lib/admin/api";

export default function MotDePasseOublie() {
  const uid = useId();
  const { api } = useAdmin();
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!api) return;
    setErreur("");
    setEnvoi(true);
    try {
      await api.motDePasseOublie(email);
      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof ErreurAdmin ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <CadreAcces
        titre="Email envoyé ✅"
        texte="Ouvrez l'email reçu et appuyez sur le lien pour choisir un nouveau mot de passe. Pensez à regarder dans les spams."
      >
        <Link href="/admin/connexion" className="bouton-contour min-h-14 w-full text-[17px]">
          Retour à la connexion
        </Link>
      </CadreAcces>
    );
  }

  return (
    <CadreAcces
      titre="Mot de passe oublié"
      texte="Entrez votre email : vous recevrez un lien pour en choisir un nouveau."
    >
      <form onSubmit={envoyer} className="space-y-5">
        <div>
          <label htmlFor={`${uid}-email`} className="mb-2 block font-medium">
            Email
          </label>
          <input
            id={`${uid}-email`}
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="champ min-h-14 text-[17px]"
          />
        </div>
        {erreur && (
          <p role="alert" className="rounded-2xl bg-promo/10 px-4 py-3 text-[16px] text-promo">
            {erreur}
          </p>
        )}
        <button type="submit" disabled={envoi || !api} className="bouton-plein min-h-14 w-full text-[17px]">
          {envoi ? "Envoi…" : "Recevoir le lien"}
        </button>
      </form>
      <Link href="/admin/connexion" className="mt-6 block min-h-12 content-center text-center text-[16px] text-gris">
        Retour à la connexion
      </Link>
    </CadreAcces>
  );
}
