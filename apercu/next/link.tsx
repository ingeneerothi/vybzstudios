// Remplace next/link dans l'aperçu : même rendu (<a>), navigation par « # ».
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { naviguer } from "../routeur";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
};

const OPTIONS_NEXT = new Set(["href", "prefetch", "replace", "scroll", "onClick"]);

export default function Link(props: Props) {
  const { href, replace, onClick } = props;
  const attributs = Object.fromEntries(Object.entries(props).filter(([cle]) => !OPTIONS_NEXT.has(cle)));
  const interne = href.startsWith("/");
  function clic(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (!interne || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    naviguer(href, replace);
  }
  return <a {...attributs} href={interne ? `#${href}` : href} onClick={clic} />;
}
