import Link from "next/link";

export default function PageIntrouvable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="etiquette text-gris">Erreur 404</p>
      <h1 className="titre-section mt-3">Page introuvable</h1>
      <p className="mt-4 text-[16px] text-gris">Le lien est peut-être incomplet, ou la page a été retirée.</p>
      <Link href="/" className="bouton-plein mt-8">
        Retour à la boutique
      </Link>
    </main>
  );
}
