"""Images et vidéo du site, à partir des fichiers du projet vidéo (../cut-and-care).

- photos améliorées (ESRGAN x2 + étalonnage) -> WebP 640 / 1280 px de large
- image de partage Open Graph 1200x630 (enseigne murale du salon)
- pub vidéo allégée pour le web (720x1280, H.264, faststart) + affiche
Usage : python tools/prepare_assets.py
"""
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "cut-and-care"
IMG_OUT = ROOT / "public" / "img"
VID_OUT = ROOT / "public" / "video"
WIDTHS = (640, 1280)


def webp(src: Path, name: str):
    im = Image.open(src).convert("RGB")
    for w in WIDTHS:
        h = round(im.height * w / im.width)
        out = IMG_OUT / f"{name}-{w}.webp"
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
        print(f"{out.name} {w}x{h} {out.stat().st_size // 1024} Ko")


def og_image():
    im = Image.open(SRC / "public/images/salon-logo.jpg").convert("RGB")
    # bande horizontale centrée sur l'enseigne (CUT & CARE / STYLING)
    w = im.width
    h = round(w * 630 / 1200)
    top = max(0, min(im.height - h, round(im.height * 0.16)))
    crop = im.crop((0, top, w, top + h)).resize((1200, 630), Image.LANCZOS)
    crop.save(IMG_OUT / "og-cut-and-care.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    print("og-cut-and-care.jpg 1200x630")


def video():
    VID_OUT.mkdir(parents=True, exist_ok=True)
    src = SRC / "out/cut-and-care-offre-semaine.mp4"
    dst = VID_OUT / "pub-offre-semaine.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", "scale=720:1280:flags=lanczos",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-profile:v", "high", "-pix_fmt", "yuv420p",
                    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(dst)], check=True)
    poster = VID_OUT / "pub-offre-semaine.webp"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1.9", "-i", str(src), "-frames:v", "1",
                    "-vf", "scale=720:1280:flags=lanczos", "-quality", "80", str(poster)], check=True)
    print(f"{dst.name} {dst.stat().st_size // 1024} Ko, {poster.name} {poster.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    IMG_OUT.mkdir(parents=True, exist_ok=True)
    for p in sorted((SRC / "public/images").glob("*.jpg")):
        webp(p, p.stem)
    og_image()
    video()
