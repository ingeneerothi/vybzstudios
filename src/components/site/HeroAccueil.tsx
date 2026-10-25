import Image from "next/image";
import Link from "next/link";
import { LogoMarque } from "@/components/marque/LogoMarque";
import type { Chaussure } from "@/lib/types";
import { IconeFleche } from "./Icones";

/**
 * Ouverture : le logo apparaît en fondu (0,8 s), puis la chaussure vedette descend
 * et se pose sur son ombre avant de flotter doucement. Un seul « moment fort » sur le site.
 * Animations en CSS : elles démarrent dès le premier affichage, sans attendre le JavaScript.
 */
export function HeroAccueil({ vedette, slogan }: { vedette?: Chaussure; slogan: string }) {
  return (
    <section className="relative isolate flex h-svh min-h-[600px] flex-col overflow-hidden bg-[#141b0c] text-white">
      <Image
        src="/marque/fond-1024.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={60}
        className="-z-20 object-cover opacity-90"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_45%_at_50%_54%,rgb(255_255_255/0.2),transparent_75%),linear-gradient(180deg,rgb(8_10_6/0.55)_0%,rgb(8_10_6/0.2)_40%,rgb(8_10_6/0.7)_100%)]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-10 text-center">
        <div className="flex animate-[entree-douce_0.8s_var(--ease-sortie)_both] flex-col items-center drop-shadow-[0_2px_10px_rgb(0_0_0/0.55)]">
          <LogoMarque className="h-12 w-auto sm:h-14" titre={null} />
          <h1 className="mt-3 text-[15px] font-extrabold tracking-[0.32em] uppercase sm:text-[17px]">Vertical Store</h1>
        </div>

        {vedette?.images[0] && (
          <Link
            href={`/chaussure/${vedette.slug}`}
            aria-label={`Voir ${vedette.marque} ${vedette.nom}`}
            className="relative mt-4 block aspect-[2/1] w-full max-w-[min(92vw,640px)]"
          >
            <div
              aria-hidden
              className="ombre-sol absolute inset-x-[16%] top-[64%] h-[12%] animate-[ombre-poser_1s_var(--ease-sortie)_0.6s_both]"
            >
              <div className="size-full animate-[ombre-flotter_4.8s_var(--ease-transition)_1.6s_infinite]" />
            </div>
            <div className="absolute inset-x-0 top-[-80%] aspect-square animate-[poser_1s_var(--ease-sortie)_0.6s_both]">
              <div className="relative size-full animate-[flotter_4.8s_var(--ease-transition)_1.6s_infinite]">
                <Image
                  src={vedette.images[0]}
                  alt={`${vedette.marque} ${vedette.nom}`}
                  fill
                  priority
                  sizes="(min-width: 768px) 640px, 92vw"
                  quality={80}
                  className="object-contain drop-shadow-[0_24px_30px_rgb(0_0_0/0.35)]"
                />
              </div>
            </div>
          </Link>
        )}

        <div className="mt-2 flex animate-[monter-doux_0.6s_var(--ease-sortie)_1.2s_both] flex-col items-center">
          <p className="max-w-[16ch] text-[clamp(2rem,8.5vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.035em] text-balance">
            {slogan}
          </p>
          <Link href="/collection" className="group bouton-clair mt-7">
            Voir la collection
            <IconeFleche className="size-4 transition-transform duration-400 ease-sortie group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
