import { cn } from "@/lib/cn";

type Props = {
  id: string;
  libelle: string;
  erreur?: string;
  aide?: string;
  facultatif?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Libellé au-dessus, message d'erreur dessous (lu par les lecteurs d'écran). */
export function Champ({ id, libelle, erreur, aide, facultatif, children, className }: Props) {
  return (
    <div className={cn("scroll-mt-28", className)} id={`${id}-bloc`}>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-medium">
        {libelle}
        {facultatif && <span className="font-normal text-gris"> (facultatif)</span>}
      </label>
      {children}
      {erreur ? (
        <p id={`${id}-erreur`} className="mt-1.5 text-[14px] text-promo">
          {erreur}
        </p>
      ) : aide ? (
        <p className="mt-1.5 text-[13px] text-gris">{aide}</p>
      ) : null}
    </div>
  );
}
