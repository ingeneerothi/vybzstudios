import Link from "next/link";
import { Apparition } from "./Apparition";
import { IconeFleche } from "./Icones";

export function BlocDemande() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-28">
      <Apparition>
        <div className="relative overflow-hidden rounded-[28px] bg-vert px-6 py-12 text-white sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.16),transparent)]"
          />
          <p className="etiquette text-vert-clair">Sur demande</p>
          <h2 className="titre-section mt-3 max-w-[18ch]">Vous ne trouvez pas votre chaussure ?</h2>
          <p className="mt-3 max-w-md text-[16px] text-white/80">
            Envoyez-nous une photo du modèle et votre pointure. On vous répond sur WhatsApp.
          </p>
          <Link href="/demande" className="bouton-clair group mt-8">
            Envoyer une photo
            <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
          </Link>
        </div>
      </Apparition>
    </section>
  );
}
