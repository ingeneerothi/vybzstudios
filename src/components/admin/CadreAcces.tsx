import { LogoMarque } from "@/components/marque/LogoMarque";

/** Mise en page des écrans de connexion / mot de passe : logo, titre, une seule action. */
export function CadreAcces({ titre, texte, children }: { titre: string; texte?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-vert text-white">
          <LogoMarque className="h-8 w-auto" titre={null} />
        </span>
        <span className="text-[14px] font-extrabold tracking-[0.14em] uppercase">Vertical Store</span>
      </div>
      <h1 className="mt-10 text-[30px] leading-tight font-bold tracking-[-0.02em]">{titre}</h1>
      {texte && <p className="mt-2 text-[17px] text-gris">{texte}</p>}
      <div className="mt-8">{children}</div>
    </main>
  );
}
