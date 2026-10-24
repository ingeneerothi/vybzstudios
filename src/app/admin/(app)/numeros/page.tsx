"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { useAdmin } from "@/components/admin/Fournisseur";
import { IconeCrayon, IconePlus, IconePoubelle } from "@/components/site/Icones";
import { cn } from "@/lib/cn";
import { DUREE, EASE_SORTIE } from "@/lib/motion";
import { afficherNumeroWhatsapp } from "@/lib/telephone";
import type { NumeroWhatsapp } from "@/lib/types";

type Edition = { id?: string; libelle: string; numero: string };

export default function Numeros() {
  const uid = useId();
  const { api, executer, confirmer } = useAdmin();
  const [numeros, setNumeros] = useState<NumeroWhatsapp[] | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);

  const charger = useCallback(async () => {
    if (!api) return;
    const liste = await executer(() => api.numeros());
    if (liste) setNumeros(liste);
  }, [api, executer]);

  useEffect(() => {
    if (!api) return;
    let actif = true;
    executer(() => api.numeros()).then((liste) => actif && liste && setNumeros(liste));
    return () => {
      actif = false;
    };
  }, [api, executer]);

  async function activer(n: NumeroWhatsapp) {
    if (!api) return;
    await executer(() => api.activerNumero(n.id), `Numéro activé ✅ Les commandes arrivent chez « ${n.libelle} ».`);
    charger();
  }

  async function supprimer(n: NumeroWhatsapp) {
    if (!api) return;
    const ok = await confirmer({
      titre: `Supprimer « ${n.libelle} » ?`,
      texte: afficherNumeroWhatsapp(n.numero),
      bouton: "Oui, supprimer",
      danger: true,
    });
    if (!ok) return;
    await executer(() => api.supprimerNumero(n.id), "Numéro supprimé ✅");
    charger();
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !edition) return;
    const fait = await executer(
      () =>
        (edition.id
          ? api.modifierNumero(edition.id, edition.libelle, edition.numero)
          : api.ajouterNumero(edition.libelle, edition.numero)
        ).then(() => true),
      edition.id ? "Numéro modifié ✅" : "Numéro ajouté ✅",
    );
    if (fait) {
      setEdition(null);
      charger();
    }
  }

  const actif = numeros?.find((n) => n.actif);

  return (
    <>
      <EnTeteAdmin titre="Numéros WhatsApp" />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <p className="text-[16px] text-gris">
          Toutes les commandes et demandes partent vers le numéro <strong className="text-encre">actif</strong>. Touchez
          « Activer » pour changer : c&apos;est immédiat.
        </p>
        {actif && (
          <p className="mt-4 rounded-[20px] bg-vert px-4 py-3 text-[16px] text-white">
            En ce moment : <strong>{actif.libelle}</strong> · {afficherNumeroWhatsapp(actif.numero)}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {numeros == null && <li className="h-24 rounded-[22px] bg-carte" aria-busy="true" />}
          {numeros?.map((n) => (
            <li
              key={n.id}
              className={cn("rounded-[22px] bg-white p-4 ring-1", n.actif ? "ring-2 ring-vert" : "ring-trait/70")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold">{n.libelle}</p>
                  <p className="text-[16px] text-gris tabular-nums">{afficherNumeroWhatsapp(n.numero)}</p>
                </div>
                {n.actif ? (
                  <span className="shrink-0 rounded-full bg-vert px-3 py-1.5 text-[14px] font-semibold text-white">
                    Actif
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => activer(n)}
                    className="bouton-plein min-h-12 shrink-0 px-5 text-[16px]"
                  >
                    Activer
                  </button>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEdition({ id: n.id, libelle: n.libelle, numero: afficherNumeroWhatsapp(n.numero) })}
                  className="bouton-contour min-h-12 flex-1 px-3 text-[15px]"
                >
                  <IconeCrayon className="size-5" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => supprimer(n)}
                  disabled={n.actif}
                  className="bouton-contour min-h-12 flex-1 px-3 text-[15px] text-promo"
                >
                  <IconePoubelle className="size-5" />
                  Supprimer
                </button>
              </div>
              {n.actif && (
                <p className="mt-2 text-[14px] text-gris">Pour le supprimer, activez d&apos;abord un autre numéro.</p>
              )}
            </li>
          ))}
        </ul>

        <AnimatePresence initial={false} mode="wait">
          {edition ? (
            <motion.form
              key="formulaire"
              onSubmit={enregistrer}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
              className="mt-6 space-y-4 rounded-[22px] bg-white p-4 ring-1 ring-trait/70"
            >
              <h2 className="text-[19px] font-bold">{edition.id ? "Modifier le numéro" : "Nouveau numéro"}</h2>
              <div>
                <label htmlFor={`${uid}-libelle`} className="mb-2 block font-medium">
                  Nom (ex. : Moi, Mon frère, Livreur)
                </label>
                <input
                  id={`${uid}-libelle`}
                  required
                  maxLength={60}
                  value={edition.libelle}
                  onChange={(e) => setEdition({ ...edition, libelle: e.target.value })}
                  className="champ min-h-14 text-[17px]"
                />
              </div>
              <div>
                <label htmlFor={`${uid}-numero`} className="mb-2 block font-medium">
                  Numéro WhatsApp
                </label>
                <input
                  id={`${uid}-numero`}
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="05 06 52 38 16"
                  value={edition.numero}
                  onChange={(e) => setEdition({ ...edition, numero: e.target.value })}
                  className="champ min-h-14 text-[17px] tabular-nums"
                />
                <p className="mt-1.5 text-[14px] text-gris">
                  Numéro ivoirien à 10 chiffres. Étranger : commencez par +.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEdition(null)} className="bouton-contour min-h-14 text-[17px]">
                  Annuler
                </button>
                <button type="submit" className="bouton-plein min-h-14 text-[17px]">
                  Enregistrer
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="ajouter"
              type="button"
              onClick={() => setEdition({ libelle: "", numero: "" })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bouton-plein mt-6 min-h-14 w-full text-[17px]"
            >
              <IconePlus className="size-6" />
              Ajouter un numéro
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
