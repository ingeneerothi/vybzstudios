import { ViewTransition } from "react";

/** Fondu doux à l'entrée et à la sortie de chaque page (l'en-tête, lui, ne bouge pas). */
export function TransitionPage({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}
