#!/usr/bin/env python3
"""
Vertical Store — prépare les fichiers de marque à partir des originaux.

  assets-source/marque/logo-original.jpg  ->  public/marque/logo.svg (vectorisé, couleur = currentColor)
                                              public/icones/*.png (icônes PWA, favicon, Apple)
  assets-source/marque/fond-original.jpg  ->  public/marque/fond-*.webp (accueil + version floue légère)

Utilisation : python scripts/images/preparer_marque.py
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

RACINE = Path(__file__).resolve().parents[2]
SOURCE = RACINE / "assets-source" / "marque"
MARQUE = RACINE / "public" / "marque"
ICONES = RACINE / "public" / "icones"
APP = RACINE / "src" / "app"

VERT = (62, 90, 31)      # vert pelouse de la marque
PAPIER = (246, 245, 240)


def logo_bitmap() -> np.ndarray:
    gris = np.asarray(Image.open(SOURCE / "logo-original.jpg").convert("L"))
    ys, xs = np.nonzero(gris < 200)
    gris = gris[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return gris < 128


def vectoriser(bitmap: np.ndarray) -> str:
    import potrace  # paquet « potracer »

    # potrace dessine les pixels « sombres » (valeur 0) : on lui passe le logo en 0.
    trace = potrace.Bitmap(~bitmap).trace(turdsize=4, alphamax=1.0, opticurve=True, opttolerance=0.2)
    morceaux = []
    for courbe in trace:
        depart = courbe.start_point
        d = [f"M{depart.x:.1f} {depart.y:.1f}"]
        for segment in courbe.segments:
            if segment.is_corner:
                d.append(f"L{segment.c.x:.1f} {segment.c.y:.1f}L{segment.end_point.x:.1f} {segment.end_point.y:.1f}")
            else:
                d.append(
                    f"C{segment.c1.x:.1f} {segment.c1.y:.1f} {segment.c2.x:.1f} {segment.c2.y:.1f} "
                    f"{segment.end_point.x:.1f} {segment.end_point.y:.1f}"
                )
        d.append("Z")
        morceaux.append("".join(d))
    h, w = bitmap.shape
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="currentColor" '
        f'role="img" aria-label="Vertical Store"><path fill-rule="evenodd" d="{" ".join(morceaux)}"/></svg>\n'
    )


def logo_png(bitmap: np.ndarray, hauteur: int, couleur=(0, 0, 0)) -> Image.Image:
    alpha = Image.fromarray((bitmap * 255).astype(np.uint8), "L")
    echelle = hauteur / alpha.height
    alpha = alpha.resize((max(1, round(alpha.width * echelle)), hauteur), Image.LANCZOS)
    logo = Image.new("RGBA", alpha.size, couleur + (255,))
    logo.putalpha(alpha)
    return logo


def icone(bitmap: np.ndarray, cote: int, fond, couleur, zone: float) -> Image.Image:
    """Logo centré dans un carré plein ; `zone` = part du côté occupée par le logo."""
    carre = Image.new("RGBA", (cote, cote), fond + (255,))
    logo = logo_png(bitmap, round(cote * zone), couleur)
    if logo.width > cote * zone:
        logo = logo.resize((round(cote * zone), round(logo.height * cote * zone / logo.width)), Image.LANCZOS)
    carre.alpha_composite(logo, ((cote - logo.width) // 2, (cote - logo.height) // 2))
    return carre


def fond() -> None:
    image = Image.open(SOURCE / "fond-original.jpg").convert("RGB")
    # Le fond est toujours affiché flouté : on floute avant compression (bien plus léger).
    for largeur in (1024, 640):
        hauteur = round(image.height * largeur / image.width)
        reduit = image.resize((largeur, hauteur), Image.LANCZOS)
        reduit.filter(ImageFilter.GaussianBlur(largeur / 110)).save(
            MARQUE / f"fond-{largeur}.webp", "WEBP", quality=70, method=6
        )
    # Version très floue et minuscule : agrandie en CSS, elle ne pèse presque rien.
    petit = image.resize((96, 120), Image.LANCZOS).filter(ImageFilter.GaussianBlur(3))
    petit.save(MARQUE / "fond-flou.webp", "WEBP", quality=80, method=6)


def main() -> None:
    MARQUE.mkdir(parents=True, exist_ok=True)
    ICONES.mkdir(parents=True, exist_ok=True)
    bitmap = logo_bitmap()

    (MARQUE / "logo.svg").write_text(vectoriser(bitmap), encoding="utf-8")
    logo_png(bitmap, 256).save(MARQUE / "logo-256.png", optimize=True)

    icone(bitmap, 192, VERT, (255, 255, 255), 0.62).save(ICONES / "icone-192.png", optimize=True)
    icone(bitmap, 512, VERT, (255, 255, 255), 0.62).save(ICONES / "icone-512.png", optimize=True)
    icone(bitmap, 512, VERT, (255, 255, 255), 0.5).save(ICONES / "icone-maskable-512.png", optimize=True)
    icone(bitmap, 180, VERT, (255, 255, 255), 0.6).convert("RGB").save(APP / "apple-icon.png", optimize=True)
    icone(bitmap, 64, VERT, (255, 255, 255), 0.7).save(APP / "icon.png", optimize=True)
    fond()
    print("Marque prête :", ", ".join(sorted(p.name for p in MARQUE.iterdir())))


if __name__ == "__main__":
    main()
