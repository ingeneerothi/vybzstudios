import Link from "next/link";

export function Introuvable({
  titre = "Chaussure introuvable",
  texte = "Elle a peut-être été retirée de la boutique.",
}) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-36 pb-24 text-center">
      <h1 className="titre-section">{titre}</h1>
      <p className="mt-4 text-[16px] text-gris">{texte}</p>
      <Link href="/collection" className="bouton-plein mt-8">
        Voir la collection
      </Link>
    </div>
  );
}
