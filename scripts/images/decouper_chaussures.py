#!/usr/bin/env python3
"""
Vertical Store — découpe et détourage des montages de chaussures.

Un montage = plusieurs vues d'une chaussure sur fond blanc, séparées par du blanc.
Pour chaque montage, le script :
  1. repère chaque vue grâce aux zones blanches qui les séparent ;
  2. retire le fond (rembg) et nettoie le halo blanc sur les bords ;
  3. pose chaque vue sur un carré transparent de 1200 px, toujours sur la même
     « ligne de sol » (l'ombre du site tombe ainsi au même endroit pour toutes les vues) ;
  4. enregistre public/chaussures/<slug>/01.webp, 02.webp, ...
  5. crée une planche de contrôle dans assets-source/controle/<slug>.jpg

Utilisation :
  pip install -r scripts/images/requirements.txt
  python scripts/images/decouper_chaussures.py                       # tout le catalogue
  python scripts/images/decouper_chaussures.py --slug nike-shox-tl-noir
  python scripts/images/decouper_chaussures.py --image photo.jpg --slug ma-chaussure
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

RACINE = Path(__file__).resolve().parents[2]
CATALOGUE = RACINE / "data" / "catalogue.json"
MONTAGES = RACINE / "assets-source" / "montages"
SORTIE = RACINE / "public" / "chaussures"
CONTROLE = RACINE / "assets-source" / "controle"

TAILLE = 1200        # côté du carré de sortie, en pixels
LARGEUR_MAX = 0.86   # la chaussure occupe au plus 86 % de la largeur...
HAUTEUR_MAX = 0.70   # ... et 70 % de la hauteur du carré
LIGNE_SOL = 0.83     # le bas de chaque vue est posé sur cette ligne
AGRANDISSEMENT_MAX = 2.0
SEUIL_BLANC = 3      # écart au blanc du fond pour qu'un pixel compte comme « chaussure »
SURFACE_MIN = 0.004  # une vue fait au moins 0,4 % du montage (sinon : poussière, texte)


def detecter_vues(rgb: np.ndarray) -> tuple[list[dict], np.ndarray]:
    """Renvoie les vues trouvées (boîtes en ordre de lecture) et la carte des étiquettes."""
    h, w, _ = rgb.shape
    ecart = 255 - rgb.min(axis=2).astype(np.int16)
    # Niveau du fond mesuré sur les bords : le seuil s'adapte à un fond légèrement gris.
    bords = np.concatenate([ecart[:12].ravel(), ecart[-12:].ravel(), ecart[:, :12].ravel(), ecart[:, -12:].ravel()])
    seuil = int(np.percentile(bords, 99)) + SEUIL_BLANC
    masque = ndimage.binary_opening(ecart > seuil, structure=np.ones((3, 3)))

    # On « soude » les morceaux proches d'une même vue (reflets blancs, lacets...).
    rayon = max(6, int(w * 0.008))
    soude = ndimage.binary_dilation(masque, structure=np.ones((2 * rayon + 1, 2 * rayon + 1)))
    etiquettes, _ = ndimage.label(soude)

    vues = []
    for numero, tranche in enumerate(ndimage.find_objects(etiquettes), start=1):
        if tranche is None:
            continue
        zone = (etiquettes[tranche] == numero) & masque[tranche]
        if zone.sum() < SURFACE_MIN * h * w:
            continue
        ys, xs = np.nonzero(zone)
        x0, x1 = xs.min() + tranche[1].start, xs.max() + tranche[1].start + 1
        y0, y1 = ys.min() + tranche[0].start, ys.max() + tranche[0].start + 1
        marge_bord = 3
        vues.append({
            "etiquette": numero,
            "boite": (int(x0), int(y0), int(x1), int(y1)),
            "coupee": bool(x0 <= marge_bord or y0 <= marge_bord or x1 >= w - marge_bord or y1 >= h - marge_bord),
        })

    # Ordre de lecture : on regroupe par rangée (chevauchement vertical), puis de gauche à droite.
    vues.sort(key=lambda v: (v["boite"][1] + v["boite"][3]) / 2)
    rangees: list[list[dict]] = []
    for vue in vues:
        y0, y1 = vue["boite"][1], vue["boite"][3]
        for rangee in rangees:
            ry0 = min(v["boite"][1] for v in rangee)
            ry1 = max(v["boite"][3] for v in rangee)
            chevauchement = min(y1, ry1) - max(y0, ry0)
            if chevauchement > 0.4 * min(y1 - y0, ry1 - ry0):
                rangee.append(vue)
                break
        else:
            rangees.append([vue])
    ordonnees = [v for rangee in rangees for v in sorted(rangee, key=lambda v: v["boite"][0])]
    return ordonnees, etiquettes


def isoler_vue(image: Image.Image, etiquettes: np.ndarray, vue: dict) -> Image.Image:
    """Recadre une vue avec une petite marge ; les pixels des autres vues sont blanchis."""
    w, h = image.size
    x0, y0, x1, y1 = vue["boite"]
    marge = int(0.06 * max(x1 - x0, y1 - y0))
    x0, y0 = max(0, x0 - marge), max(0, y0 - marge)
    x1, y1 = min(w, x1 + marge), min(h, y1 + marge)
    rgb = np.asarray(image)[y0:y1, x0:x1].copy()
    autres = (etiquettes[y0:y1, x0:x1] != 0) & (etiquettes[y0:y1, x0:x1] != vue["etiquette"])
    rgb[autres] = 255
    return Image.fromarray(rgb)


def detourer(vue: Image.Image, session) -> Image.Image:
    """Masque rembg + suppression du halo blanc (on « démélange » le blanc du bord)."""
    from rembg import remove

    masque = remove(vue, session=session, only_mask=True)
    alpha = np.asarray(masque, dtype=np.float32) / 255.0
    alpha[alpha < 0.04] = 0.0
    rgb = np.asarray(vue, dtype=np.float32)
    a = np.maximum(alpha, 1e-3)[..., None]
    couleur = np.clip((rgb - (1.0 - a) * 255.0) / a, 0, 255)
    couleur = np.where(alpha[..., None] > 0.97, rgb, couleur)
    rgba = np.dstack([couleur, alpha * 255.0]).round().astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def poser_sur_carre(rgba: Image.Image) -> Image.Image:
    """Recadre au plus juste puis pose la vue, centrée, sur la ligne de sol du carré."""
    boite = rgba.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    if boite is None:
        raise ValueError("vue vide après détourage")
    vue = rgba.crop(boite)
    echelle = min(TAILLE * LARGEUR_MAX / vue.width, TAILLE * HAUTEUR_MAX / vue.height, AGRANDISSEMENT_MAX)
    nouvelle = (max(1, round(vue.width * echelle)), max(1, round(vue.height * echelle)))
    vue = vue.convert("RGBa").resize(nouvelle, Image.LANCZOS).convert("RGBA")
    carre = Image.new("RGBA", (TAILLE, TAILLE), (0, 0, 0, 0))
    x = (TAILLE - vue.width) // 2
    y = round(TAILLE * LIGNE_SOL) - vue.height
    carre.alpha_composite(vue, (x, max(0, y)))
    return carre


def damier(taille: tuple[int, int], case: int = 24) -> Image.Image:
    fond = Image.new("RGB", taille, (205, 205, 205))
    dessin = ImageDraw.Draw(fond)
    for y in range(0, taille[1], case):
        for x in range(0, taille[0], case):
            if (x // case + y // case) % 2:
                dessin.rectangle([x, y, x + case - 1, y + case - 1], fill=(160, 160, 160))
    return fond


def police(taille: int):
    for nom in ("DejaVuSans-Bold.ttf", "Arial Bold.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(nom, taille)
        except OSError:
            continue
    return ImageFont.load_default()


def planche_controle(image: Image.Image, vues: list[dict], resultats: list[Image.Image | None], titre: str) -> Image.Image:
    """Gauche : montage avec les boîtes détectées. Droite : vues finales sur damier."""
    largeur_g = 1000
    echelle = largeur_g / image.width
    gauche = image.resize((largeur_g, round(image.height * echelle))).convert("RGB")
    dessin = ImageDraw.Draw(gauche)
    for i, vue in enumerate(vues, start=1):
        x0, y0, x1, y1 = [round(c * echelle) for c in vue["boite"]]
        couleur = (220, 40, 40) if vue.get("exclue") else (30, 150, 70)
        dessin.rectangle([x0, y0, x1, y1], outline=couleur, width=4)
        dessin.rectangle([x0, y0, x0 + 44, y0 + 40], fill=couleur)
        dessin.text((x0 + 10, y0 + 4), str(i), fill="white", font=police(30))

    vignette = 300
    colonnes = 3
    lignes = max(1, -(-len(resultats) // colonnes))
    droite = Image.new("RGB", (colonnes * vignette, lignes * vignette), "white")
    for i, res in enumerate(resultats):
        case = damier((vignette - 8, vignette - 8))
        if res is not None:
            petit = res.resize((vignette - 8, vignette - 8), Image.LANCZOS)
            case.paste(petit, (0, 0), petit)
        else:
            ImageDraw.Draw(case).text((20, 20), "écartée", fill=(200, 0, 0), font=police(28))
        ImageDraw.Draw(case).text((10, 6), str(i + 1), fill=(0, 0, 0), font=police(30))
        droite.paste(case, ((i % colonnes) * vignette + 4, (i // colonnes) * vignette + 4))

    hauteur = max(gauche.height, droite.height) + 60
    planche = Image.new("RGB", (gauche.width + droite.width + 30, hauteur), "white")
    ImageDraw.Draw(planche).text((10, 12), titre, fill=(0, 0, 0), font=police(32))
    planche.paste(gauche, (0, 60))
    planche.paste(droite, (gauche.width + 30, 60))
    return planche


def traiter(source: Path, slug: str, session, exclure: set[int] | None = None) -> list[str]:
    image = Image.open(source).convert("RGB")
    vues, etiquettes = detecter_vues(np.asarray(image))
    if not vues:
        raise ValueError(f"aucune vue détectée dans {source.name}")

    dossier = SORTIE / slug
    dossier.mkdir(parents=True, exist_ok=True)
    for ancien in dossier.glob("*.webp"):
        ancien.unlink()

    exclure = exclure or set()
    chemins, resultats = [], []
    for i, vue in enumerate(vues, start=1):
        vue["exclue"] = i in exclure
        if vue["exclue"]:
            resultats.append(None)
            continue
        carre = poser_sur_carre(detourer(isoler_vue(image, etiquettes, vue), session))
        nom = f"{len(chemins) + 1:02d}.webp"
        carre.save(dossier / nom, "WEBP", quality=84, method=6)
        chemins.append(f"/chaussures/{slug}/{nom}")
        resultats.append(carre)

    CONTROLE.mkdir(parents=True, exist_ok=True)
    coupees = [str(i) for i, v in enumerate(vues, start=1) if v["coupee"]]
    titre = f"{slug} — {len(chemins)} vue(s)"
    if coupees:
        titre += f" — touche le bord : {', '.join(coupees)}"
    planche_controle(image, vues, resultats, titre).save(CONTROLE / f"{slug}.jpg", quality=82)
    return chemins


def ouvrir_session(modele: str):
    """Session rembg sans réserve mémoire (BiRefNet consomme beaucoup de RAM sinon)."""
    import onnxruntime as ort
    from rembg import new_session

    options = ort.SessionOptions()
    options.enable_cpu_mem_arena = False
    options.enable_mem_pattern = False
    return new_session(modele, sess_opts=options)


def main() -> int:
    parser = argparse.ArgumentParser(description="Découpe et détourage des montages de chaussures")
    parser.add_argument("--slug", help="ne traiter que cette chaussure")
    parser.add_argument("--image", help="montage à traiter (hors catalogue), avec --slug")
    parser.add_argument(
        "--modele",
        default="birefnet-general",
        help="modèle rembg : birefnet-general (précis, lent) ou isnet-general-use (rapide)",
    )
    args = parser.parse_args()

    session = ouvrir_session(args.modele)

    if args.image:
        if not args.slug:
            parser.error("--image demande aussi --slug")
        chemins = traiter(Path(args.image), args.slug, session)
        print(f"{args.slug} : {len(chemins)} vue(s) -> public/chaussures/{args.slug}/")
        return 0

    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    for chaussure in catalogue["chaussures"]:
        if args.slug and chaussure["slug"] != args.slug:
            continue
        exclure = set(chaussure.get("exclureVues", []))
        chaussure["images"] = traiter(MONTAGES / chaussure["source"], chaussure["slug"], session, exclure)
        print(f"{chaussure['slug']:40s} {len(chaussure['images'])} vue(s)")

    CATALOGUE.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
