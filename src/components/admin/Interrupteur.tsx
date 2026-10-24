"use client";

import { cn } from "@/lib/cn";

/** Gros interrupteur (oui / non), facile à toucher. */
export function Interrupteur({
  actif,
  onChange,
  libelle,
  disabled,
}: {
  actif: boolean;
  onChange: (actif: boolean) => void;
  libelle: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={cn(
        "relative h-9 w-16 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40",
        actif ? "bg-vert" : "bg-trait",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-7 rounded-full bg-white shadow transition-transform duration-200 ease-sortie",
          actif && "translate-x-7",
        )}
      />
    </button>
  );
}
