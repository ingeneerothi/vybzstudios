"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import { type AdminApi, ErreurAdmin, obtenirApi } from "@/lib/admin/api";
import { DUREE, EASE_SORTIE } from "@/lib/motion";

interface Confirmation {
  titre: string;
  texte?: string;
  bouton: string;
  danger?: boolean;
}

interface ContexteAdmin {
  api: AdminApi | null;
  notifier: (message: string) => void;
  confirmer: (c: Confirmation) => Promise<boolean>;
  /** Exécute une action et affiche l'erreur en clair si elle échoue. */
  executer: <T>(action: () => Promise<T>, succes?: string) => Promise<T | undefined>;
}

const Contexte = createContext<ContexteAdmin | null>(null);

export function useAdmin(): ContexteAdmin {
  const ctx = use(Contexte);
  if (!ctx) throw new Error("useAdmin hors du fournisseur admin");
  return ctx;
}

export function FournisseurAdmin({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<AdminApi | null>(null);
  const [message, setMessage] = useState<{ id: number; texte: string } | null>(null);
  const [demande, setDemande] = useState<(Confirmation & { repondre: (ok: boolean) => void }) | null>(null);
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    obtenirApi().then(setApi);
  }, []);

  useEffect(() => {
    if (!message) return;
    const minuteur = window.setTimeout(() => setMessage(null), 2800);
    return () => window.clearTimeout(minuteur);
  }, [message]);

  useEffect(() => {
    if (demande) dialogue.current?.showModal();
    else dialogue.current?.close();
  }, [demande]);

  const notifier = useCallback((texte: string) => setMessage({ id: Date.now(), texte }), []);

  const confirmer = useCallback(
    (c: Confirmation) => new Promise<boolean>((repondre) => setDemande({ ...c, repondre })),
    [],
  );

  const executer = useCallback(
    async <T,>(action: () => Promise<T>, succes?: string) => {
      try {
        const resultat = await action();
        if (succes) notifier(succes);
        return resultat;
      } catch (e) {
        notifier(e instanceof ErreurAdmin || e instanceof Error ? `⚠️ ${e.message}` : "⚠️ Une erreur est survenue.");
        return undefined;
      }
    },
    [notifier],
  );

  function repondre(ok: boolean) {
    demande?.repondre(ok);
    setDemande(null);
  }

  return (
    <Contexte value={{ api, notifier, confirmer, executer }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4"
      >
        <AnimatePresence>
          {message && (
            <motion.p
              key={message.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: DUREE.base, ease: EASE_SORTIE }}
              className="max-w-sm rounded-2xl bg-encre px-5 py-3.5 text-center text-[16px] font-medium text-white shadow-xl"
            >
              {message.texte}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <dialog
        ref={dialogue}
        onCancel={(e) => {
          e.preventDefault();
          repondre(false);
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-[26px] bg-white p-0 text-encre backdrop:bg-encre/50"
      >
        {demande && (
          <div className="p-6">
            <h2 className="text-[21px] leading-snug font-bold">{demande.titre}</h2>
            {demande.texte && <p className="mt-2 text-[16px] text-gris">{demande.texte}</p>}
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => repondre(true)}
                className={
                  demande.danger
                    ? "bouton min-h-14 bg-promo text-[17px] text-white"
                    : "bouton-plein min-h-14 text-[17px]"
                }
              >
                {demande.bouton}
              </button>
              <button
                type="button"
                onClick={() => repondre(false)}
                className="bouton-contour min-h-14 text-[17px]"
                autoFocus
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </dialog>
    </Contexte>
  );
}
