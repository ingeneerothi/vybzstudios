"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { useAdmin } from "@/components/admin/Fournisseur";
import { IconeCrayon, IconeDeconnexion, IconePlus, IconePoubelle } from "@/components/site/Icones";
import type { ZoneSaisie } from "@/lib/admin/api";
import { formatPrix } from "@/lib/format";
import type { Chaussure, DetailsZone, Reglages, Zone } from "@/lib/types";

const TYPES_ZONE: Record<DetailsZone, string> = {
  commune_quartier: "Grande ville : on demande la commune et le quartier",
  quartier: "Ville proche : on demande le quartier",
  ville: "Expédition : on demande la ville",
};

const MODES_PAIEMENT = ["À la livraison", "Wave", "Orange Money", "À la livraison ou Wave"];

export default function PageReglages() {
  const uid = useId();
  const { api, executer, confirmer } = useAdmin();
  const router = useRouter();
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [chaussures, setChaussures] = useState<Chaussure[]>([]);
  const [zoneEditee, setZoneEditee] = useState<(ZoneSaisie & { fraisTexte: string }) | null>(null);
  const [email, setEmail] = useState("");

  const charger = useCallback(async () => {
    if (!api) return;
    await executer(async () => {
      const [r, z, c, s] = await Promise.all([api.reglages(), api.zones(), api.chaussures(), api.session()]);
      setReglages(r);
      setZones(z);
      setChaussures(c);
      setEmail(s?.email ?? "");
    });
  }, [api, executer]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function enregistrerReglages(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !reglages) return;
    await executer(() => api.enregistrerReglages(reglages), "Réglages enregistrés ✅");
  }

  async function enregistrerZone(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !zoneEditee) return;
    const frais = Number(zoneEditee.fraisTexte.replace(/\D/g, ""));
    if (!zoneEditee.nom.trim()) return;
    const fait = await executer(
      () =>
        api
          .enregistrerZone({ id: zoneEditee.id, nom: zoneEditee.nom, frais, details: zoneEditee.details })
          .then(() => true),
      zoneEditee.id ? "Zone modifiée ✅" : "Zone ajoutée ✅",
    );
    if (fait) {
      setZoneEditee(null);
      charger();
    }
  }

  async function supprimerZone(z: Zone) {
    if (!api) return;
    const ok = await confirmer({ titre: `Supprimer la zone « ${z.nom} » ?`, bouton: "Oui, supprimer", danger: true });
    if (!ok) return;
    await executer(() => api.supprimerZone(z.id), "Zone supprimée ✅");
    charger();
  }

  async function seDeconnecter() {
    if (!api) return;
    await api.deconnexion();
    router.replace("/admin/connexion");
  }

  return (
    <>
      <EnTeteAdmin titre="Réglages" />
      <div className="mx-auto max-w-xl space-y-10 px-4 pt-6">
        {/* Zones de livraison */}
        <section>
          <h2 className="text-[20px] font-bold">Zones et frais de livraison</h2>
          <ul className="mt-4 space-y-3">
            {zones == null && <li className="h-20 rounded-[22px] bg-carte" aria-busy="true" />}
            {zones?.map((z) => (
              <li key={z.id} className="flex items-center gap-3 rounded-[22px] bg-white p-4 ring-1 ring-trait/70">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold">{z.nom}</p>
                  <p className="text-[16px] tabular-nums">{formatPrix(z.frais)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Modifier ${z.nom}`}
                  onClick={() => setZoneEditee({ ...z, fraisTexte: String(z.frais) })}
                  className="grid size-12 place-items-center rounded-full ring-1 ring-trait"
                >
                  <IconeCrayon className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={`Supprimer ${z.nom}`}
                  onClick={() => supprimerZone(z)}
                  disabled={(zones?.length ?? 0) <= 1}
                  className="grid size-12 place-items-center rounded-full text-promo ring-1 ring-trait disabled:opacity-30"
                >
                  <IconePoubelle className="size-5" />
                </button>
              </li>
            ))}
          </ul>

          {zoneEditee ? (
            <form
              onSubmit={enregistrerZone}
              className="mt-4 space-y-4 rounded-[22px] bg-white p-4 ring-1 ring-trait/70"
            >
              <h3 className="text-[18px] font-bold">{zoneEditee.id ? "Modifier la zone" : "Nouvelle zone"}</h3>
              <div>
                <label htmlFor={`${uid}-zone-nom`} className="mb-2 block font-medium">
                  Nom de la zone
                </label>
                <input
                  id={`${uid}-zone-nom`}
                  required
                  value={zoneEditee.nom}
                  onChange={(e) => setZoneEditee({ ...zoneEditee, nom: e.target.value })}
                  className="champ min-h-14 text-[17px]"
                />
              </div>
              <div>
                <label htmlFor={`${uid}-zone-frais`} className="mb-2 block font-medium">
                  Frais de livraison (FCFA)
                </label>
                <input
                  id={`${uid}-zone-frais`}
                  inputMode="numeric"
                  required
                  value={zoneEditee.fraisTexte}
                  onChange={(e) => setZoneEditee({ ...zoneEditee, fraisTexte: e.target.value.replace(/\D/g, "") })}
                  className="champ min-h-14 text-[17px] tabular-nums"
                />
              </div>
              <fieldset>
                <legend className="mb-2 font-medium">Ce qu&apos;on demande au client</legend>
                <div className="space-y-2">
                  {(Object.keys(TYPES_ZONE) as DetailsZone[]).map((t) => (
                    <label
                      key={t}
                      className="flex min-h-12 items-center gap-3 rounded-2xl px-3 ring-1 ring-trait has-[:checked]:ring-2 has-[:checked]:ring-vert"
                    >
                      <input
                        type="radio"
                        name="type-zone"
                        checked={zoneEditee.details === t}
                        onChange={() => setZoneEditee({ ...zoneEditee, details: t })}
                        className="size-5 accent-[var(--color-vert)]"
                      />
                      <span className="text-[15px]">{TYPES_ZONE[t]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setZoneEditee(null)}
                  className="bouton-contour min-h-14 text-[17px]"
                >
                  Annuler
                </button>
                <button type="submit" className="bouton-plein min-h-14 text-[17px]">
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setZoneEditee({ nom: "", frais: 0, fraisTexte: "", details: "quartier" })}
              className="bouton-contour mt-4 min-h-14 w-full text-[17px]"
            >
              <IconePlus className="size-6" />
              Ajouter une zone
            </button>
          )}
        </section>

        {/* Boutique */}
        {reglages && (
          <form onSubmit={enregistrerReglages} className="space-y-5">
            <h2 className="text-[20px] font-bold">Boutique</h2>
            <div>
              <label htmlFor={`${uid}-slogan`} className="mb-2 block font-medium">
                Slogan de l&apos;accueil
              </label>
              <input
                id={`${uid}-slogan`}
                maxLength={120}
                value={reglages.slogan}
                onChange={(e) => setReglages({ ...reglages, slogan: e.target.value })}
                className="champ min-h-14 text-[17px]"
              />
            </div>
            <div>
              <label htmlFor={`${uid}-vedette`} className="mb-2 block font-medium">
                Chaussure vedette (grande photo de l&apos;accueil)
              </label>
              <select
                id={`${uid}-vedette`}
                value={reglages.chaussureVedetteId ?? ""}
                onChange={(e) => setReglages({ ...reglages, chaussureVedetteId: e.target.value || null })}
                className="champ min-h-14 text-[17px]"
              >
                <option value="">Automatique</option>
                {chaussures.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.marque} {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-paiement`} className="mb-2 block font-medium">
                Mode de paiement
              </label>
              <input
                id={`${uid}-paiement`}
                list={`${uid}-modes-paiement`}
                maxLength={80}
                value={reglages.modePaiement}
                onChange={(e) => setReglages({ ...reglages, modePaiement: e.target.value })}
                className="champ min-h-14 text-[17px]"
              />
              <datalist id={`${uid}-modes-paiement`}>
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <button type="submit" className="bouton-plein min-h-14 w-full text-[17px]">
              Enregistrer
            </button>
          </form>
        )}

        {/* Compte */}
        <section className="space-y-3">
          <h2 className="text-[20px] font-bold">Mon compte</h2>
          {email && <p className="text-[16px] text-gris">Connecté : {email}</p>}
          <Link href="/admin/nouveau-mot-de-passe" className="bouton-contour min-h-14 w-full text-[17px]">
            Changer mon mot de passe
          </Link>
          <button
            type="button"
            onClick={seDeconnecter}
            className="bouton-contour min-h-14 w-full text-[17px] text-promo"
          >
            <IconeDeconnexion className="size-6" />
            Se déconnecter
          </button>
          <p className="pt-2 text-[14px] leading-relaxed text-gris">
            Astuce : installez l&apos;admin sur l&apos;écran d&apos;accueil. Sur Android : menu ⋮ du navigateur puis «
            Ajouter à l&apos;écran d&apos;accueil ». Sur iPhone : bouton Partager puis « Sur l&apos;écran d&apos;accueil
            ».
          </p>
        </section>
      </div>
    </>
  );
}
