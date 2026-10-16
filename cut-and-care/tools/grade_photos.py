"""Étalonnage + finition des photos upscalées (ESRGAN x2) pour la vidéo.

Entrée : PNG upscalés x2 (dossier), sortie : JPEG dans public/images/.
- recadrage (bandes noires de la capture du tissage)
- balance des blancs partielle vers un rendu chaud homogène
- exposition, courbe en S douce, clarté locale (CLAHE), vibrance
- netteté finale légère
Usage : python tools/grade_photos.py <dossier_png_x2>
"""
import sys
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).resolve().parent.parent / "public" / "images"

# source (n° de photo envoyée) -> (nom, recadrage x2 en px : (x0, y0, x1, y1) ou None)
PHOTOS = {
    "9": ("salon-fauteuil", None),
    "8": ("salon-logo", None),
    "10": ("salon-collation", None),
    "3": ("tissage", (0, 232, None, 2326)),
    "4": ("coupe", None),
    "5": ("tresses-1", None),
    "6": ("tresses-2", None),
    "7": ("nattes", None),
    "2": ("micro-twist", None),
}

TARGET_RG = 1.20  # R/G moyen visé (chaud)
TARGET_BG = 0.80  # B/G moyen visé
WB_STRENGTH = 0.5
TARGET_L = 120.0


def grade(img):
    f = img.astype(np.float32) / 255.0
    # 1. balance des blancs partielle (ratios moyens)
    b, g, r = [f[..., i].mean() for i in range(3)]
    gain_r = (TARGET_RG * g / r) ** WB_STRENGTH
    gain_b = (TARGET_BG * g / b) ** WB_STRENGTH
    f[..., 2] *= gain_r
    f[..., 0] *= gain_b
    f = np.clip(f, 0, 1)

    # 2. exposition (gamma) vers une luminance moyenne commune
    lab = cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_BGR2LAB)
    L = lab[..., 0].astype(np.float32)
    mean_l = L.mean()
    gamma = np.clip(np.log(TARGET_L / 255.0) / np.log(max(mean_l, 1) / 255.0), 0.8, 1.15)
    L = 255.0 * (L / 255.0) ** gamma

    # 3. courbe en S douce + clarté locale
    x = L / 255.0
    s = 1 / (1 + np.exp(-6.0 * (x - 0.5)))
    s0, s1 = 1 / (1 + np.exp(3.0)), 1 / (1 + np.exp(-3.0))
    x = 0.7 * x + 0.3 * (s - s0) / (s1 - s0)
    L = np.clip(x * 255.0, 0, 255)
    clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
    L_cl = clahe.apply(L.astype(np.uint8)).astype(np.float32)
    L = 0.72 * L + 0.28 * L_cl
    lab[..., 0] = np.clip(L, 0, 255).astype(np.uint8)

    # 4. vibrance (renforce surtout les couleurs peu saturées)
    a = lab[..., 1].astype(np.float32) - 128
    bb = lab[..., 2].astype(np.float32) - 128
    chroma = np.sqrt(a * a + bb * bb)
    boost = 1.0 + 0.16 * (1 - np.clip(chroma / 60.0, 0, 1))
    lab[..., 1] = np.clip(a * boost + 128, 0, 255).astype(np.uint8)
    lab[..., 2] = np.clip(bb * boost + 128, 0, 255).astype(np.uint8)
    out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR).astype(np.float32)

    # 5. netteté finale légère (unsharp mask)
    blur = cv2.GaussianBlur(out, (0, 0), 1.3)
    out = np.clip(out + 0.35 * (out - blur), 0, 255)
    return out.astype(np.uint8)


def main(src_dir):
    OUT.mkdir(parents=True, exist_ok=True)
    for key, (name, crop) in PHOTOS.items():
        p = Path(src_dir) / f"{key}.png"
        if not p.exists():
            print(f"(manque {p.name})")
            continue
        img = cv2.imread(str(p), cv2.IMREAD_COLOR)
        if crop:
            x0, y0, x1, y1 = crop
            img = img[y0:y1, x0:x1]
        res = grade(img)
        dst = OUT / f"{name}.jpg"
        cv2.imwrite(str(dst), res, [cv2.IMWRITE_JPEG_QUALITY, 93, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
        print(f"{p.name} -> {dst.name} {res.shape[1]}x{res.shape[0]} ({dst.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main(sys.argv[1])
