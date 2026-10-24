"use client";

import { useEffect, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { FormulaireChaussure } from "@/components/admin/FormulaireChaussure";
import { useAdmin } from "@/components/admin/Fournisseur";

export default function NouvelleChaussure() {
  const { api } = useAdmin();
  const [marques, setMarques] = useState<string[]>([]);

  useEffect(() => {
    api?.chaussures().then((liste) => setMarques([...new Set(liste.map((c) => c.marque).filter(Boolean))].sort()));
  }, [api]);

  return (
    <>
      <EnTeteAdmin
        titre="Nouvelle chaussure"
        retour={{ href: "/admin/chaussures", libelle: "Retour aux chaussures" }}
      />
      <FormulaireChaussure marques={marques} />
    </>
  );
}
