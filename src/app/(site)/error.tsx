"use client";

export default function ErreurSite({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-center justify-center px-6 pt-20 text-center">
      <h1 className="titre-section">Petit souci de connexion</h1>
      <p className="mt-4 text-[16px] text-gris">
        La page n&apos;a pas pu se charger. Vérifiez votre réseau puis réessayez.
      </p>
      <button type="button" onClick={reset} className="bouton-plein mt-8">
        Réessayer
      </button>
    </div>
  );
}
