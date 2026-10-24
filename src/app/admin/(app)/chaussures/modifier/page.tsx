"use client";

import { useEffect, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { FormulaireChaussure } from "@/components/admin/FormulaireChaussure";
import { useAdmin } from "@/components/admin/Fournisseur";
import type { Chaussure } from "@/lib/types";

export default function ModifierChaussure() {
  const { api, executer } = useAdmin();
  const [chaussure, setChaussure] = useState<Chaussure | null | undefined>(undefined);
  const [marques, setMarques] = useState<string[]>([]);

  useEffect(() => {
    if (!api) return;
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    executer(async () => {
      const liste = await api.chaussures();
      setMarques([...new Set(liste.map((c) => c.marque).filter(Boolean))].sort());
      setChaussure(liste.find((c) => c.id === id) ?? null);
    });
  }, [api, executer]);

  return (
    <>
      <EnTeteAdmin
        titre={chaussure?.nom ?? "Modifier"}
        retour={{ href: "/admin/chaussures", libelle: "Retour aux chaussures" }}
      />
      {chaussure === undefined && <p className="px-4 pt-8 text-center text-gris">Chargement…</p>}
      {chaussure === null && <p className="px-4 pt-8 text-center text-gris">Chaussure introuvable.</p>}
      {chaussure && <FormulaireChaussure key={chaussure.id} chaussure={chaussure} marques={marques} />}
    </>
  );
}
