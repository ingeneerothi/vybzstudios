// Remplace next/image dans l'aperçu : les photos sont intégrées au fichier.
import type { ImgHTMLAttributes } from "react";
import { image } from "../images";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

const OPTIONS_NEXT = new Set(["src", "fill", "priority", "quality", "unoptimized", "loading", "style"]);

export default function Image(props: Props) {
  const { src, fill, priority, loading, style } = props;
  const attributs = Object.fromEntries(Object.entries(props).filter(([cle]) => !OPTIONS_NEXT.has(cle)));
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- pas de serveur d'images ; alt transmis
    <img
      {...attributs}
      src={image(src)}
      decoding="async"
      loading={priority ? "eager" : (loading ?? "lazy")}
      style={
        fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", color: "transparent", ...style } : style
      }
    />
  );
}
