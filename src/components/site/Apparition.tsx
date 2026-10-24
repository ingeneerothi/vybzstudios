import { cn } from "@/lib/cn";

/**
 * Apparition douce au défilement, en CSS natif (scroll-driven animations) :
 * aucun JavaScript, fluide même sur un téléphone modeste. Sans support du navigateur,
 * le contenu est simplement visible.
 */
export function Apparition({
  children,
  className,
  delai = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Décalage en secondes (0,08 par élément) : converti en léger retard dans le défilement. */
  delai?: number;
}) {
  return (
    <div
      className={cn("apparition", className)}
      style={delai ? ({ "--decalage": `${Math.round(delai * 75)}%` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
