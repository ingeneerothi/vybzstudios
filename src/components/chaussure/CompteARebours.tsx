"use client";

import { useEffect, useState } from "react";

function decouper(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { j: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const deux = (n: number) => String(n).padStart(2, "0");

/** Temps réel restant avant la fin de la promo (rien d'inventé : basé sur la date saisie dans l'admin). */
export function CompteARebours({ fin }: { fin: string }) {
  const [restant, setRestant] = useState<number | null>(null);

  useEffect(() => {
    const cible = new Date(fin).getTime();
    const maj = () => setRestant(cible - Date.now());
    maj();
    const minuteur = window.setInterval(maj, 1000);
    return () => window.clearInterval(minuteur);
  }, [fin]);

  if (restant == null || restant <= 0) return null;
  const { j, h, m, s } = decouper(restant);
  const texte = j > 0 ? `${j} j ${deux(h)} h ${deux(m)} min` : `${deux(h)} h ${deux(m)} min ${deux(s)} s`;

  return (
    <p className="text-[14px] text-gris">
      Fin de la promo dans <span className="font-semibold text-promo tabular-nums">{texte}</span>
    </p>
  );
}
