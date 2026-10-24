"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";
import { CadreAcces } from "@/components/admin/CadreAcces";
import { useAdmin } from "@/components/admin/Fournisseur";
import { IconeOeil } from "@/components/site/Icones";
import { ErreurAdmin } from "@/lib/admin/api";
import { MODE_DEMO } from "@/lib/env";

export default function PageConnexion() {
  return (
    <Suspense>
      <Connexion />
    </Suspense>
  );
}

function Connexion() {
  const uid = useId();
  const { api } = useAdmin();
  const lienExpire = useSearchParams().get("lien") === "expire";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    if (!api) return;
    setErreur("");
    setEnvoi(true);
    try {
      await api.connexion(email, motDePasse);
      router.replace("/admin/chaussures");
    } catch (err) {
      setErreur(err instanceof ErreurAdmin ? err.message : "Connexion impossible. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <CadreAcces titre="Connexion" texte="Espace réservé au vendeur.">
      {MODE_DEMO && (
        <p className="mb-6 rounded-2xl bg-vert-clair/50 px-4 py-3 text-[15px]">
          Mode démo : n&apos;importe quel email et mot de passe fonctionnent.
        </p>
      )}
      <form onSubmit={seConnecter} className="space-y-5">
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
        <div>
          <label htmlFor={`${uid}-mot-de-passe`} className="mb-2 block font-medium">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id={`${uid}-mot-de-passe`}
              type={voir ? "text" : "password"}
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="champ min-h-14 pr-14 text-[17px]"
            />
            <button
              type="button"
              onClick={() => setVoir((v) => !v)}
              aria-label={voir ? "Cacher le mot de passe" : "Voir le mot de passe"}
              className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-gris"
            >
              <IconeOeil className="size-6" />
            </button>
          </div>
        </div>
        {(erreur || lienExpire) && (
          <p role="alert" className="rounded-2xl bg-promo/10 px-4 py-3 text-[16px] text-promo">
            {erreur || "Ce lien a expiré ou a déjà servi. Refaites « Mot de passe oublié »."}
          </p>
        )}
        <button type="submit" disabled={envoi || !api} className="bouton-plein min-h-14 w-full text-[17px]">
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <Link
        href="/admin/mot-de-passe-oublie"
        className="mt-6 block min-h-12 content-center text-center text-[16px] font-medium text-vert underline underline-offset-4"
      >
        Mot de passe oublié ?
      </Link>
    </CadreAcces>
  );
}
