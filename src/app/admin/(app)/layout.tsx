"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarreOnglets } from "@/components/admin/BarreOnglets";
import { useAdmin } from "@/components/admin/Fournisseur";

/** Écrans réservés : on vérifie la session, puis on affiche le menu du bas. */
export default function AdminConnecte({ children }: { children: React.ReactNode }) {
  const { api } = useAdmin();
  const router = useRouter();
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!api) return;
    api.session().then((session) => {
      if (session) setPret(true);
      else router.replace("/admin/connexion");
    });
  }, [api, router]);

  if (!pret) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <span className="size-10 animate-spin rounded-full border-4 border-trait border-t-vert" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  return (
    <>
      {api?.mode === "demo" && (
        <p className="bg-vert-clair/60 px-4 py-2 text-center text-[14px]">
          Mode démo : les changements restent sur ce téléphone. Branchez Supabase pour la vraie boutique.
        </p>
      )}
      <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">{children}</div>
      <BarreOnglets />
    </>
  );
}
