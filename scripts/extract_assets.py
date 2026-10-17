"""Extrait les visuels de la vidéo depuis les captures TikTok de assets/source/.

Produit (dans assets/) :
  products/*.webp   vêtements détourés (fond transparent)
  heads/*.webp      têtes des personnages détourées (+ version sticker à bord blanc)
  tee/*.webp        t-shirt « Oscan's Head » vierge + positions des 9 têtes (scène 4)
  textures/*.webp   texture rideau métallique (fonds noirs)
  lineart/rasta-mask.png  trait noir de la tête rasta, vectorisé ensuite par trace_lineart.mjs
  manifest.json     tailles + positions utiles au code Remotion

Les personnages ne sont jamais redessinés : uniquement découpés, nettoyés et agrandis
(super-résolution EDSR x4 si le modèle est disponible, sinon Lanczos).

Usage : python3 -I scripts/extract_assets.py
"""

import json
import os
import sys
import urllib.request
from multiprocessing import Pool

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "source")
OUT = os.path.join(ROOT, "assets")
MODEL = os.path.join(ROOT, "scripts", "models", "EDSR_x4.pb")
MODEL_URL = "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb"

# ---------------------------------------------------------------- garments
# (id, image, search box x0,y0,x1,y1, type) — boxes measured on the 819x1456 captures
GARMENTS = [
    ("wart-soldiers", 2, (60, 360, 760, 900), "white"),
    ("wart-soldier", 3, (60, 360, 760, 900), "white"),
    ("3am-tee", 4, (60, 340, 780, 900), "white"),
    ("boob-bomboclaat-crop", 5, (170, 190, 670, 530), "white"),
    ("boob-bomboclaat-tank", 5, (220, 660, 610, 1010), "white"),
    ("boob-candy-crop", 6, (170, 190, 670, 530), "white"),
    ("boob-candy-tank", 6, (220, 660, 610, 1010), "white"),
    ("boob-broken-crop", 7, (170, 190, 670, 530), "white"),
    ("boob-broken-tank", 7, (220, 660, 610, 1010), "white"),
    ("boob-spiky-crop", 8, (170, 190, 670, 530), "white"),
    ("boob-spiky-tank", 8, (200, 660, 610, 1010), "white"),
    ("head-longsleeve-white", 9, (90, 200, 740, 600), "white"),
    ("head-longsleeve-black", 9, (60, 780, 730, 1190), "black"),
    ("head-tee-white", 10, (120, 180, 680, 620), "white"),
    ("head-tee-black", 10, (150, 780, 680, 1190), "black"),
    ("kpocle-white", 11, (140, 180, 680, 600), "white"),
    ("kpocle-black", 11, (110, 770, 680, 1180), "black"),
    ("jersey-candy", 12, (150, 180, 680, 600), "white"),
    ("jersey-helmet", 12, (130, 770, 680, 1180), "white"),
    ("jersey-senegal", 13, (130, 180, 670, 600), "white"),
    ("jersey-france", 13, (130, 770, 680, 1180), "white"),
]
# bottom garments whose silhouette touches the person in the photo: snapped to the
# identical mockup shape found above them
TEMPLATES = {
    "jersey-helmet": "jersey-candy",
    "jersey-france": "jersey-senegal",
    "head-longsleeve-black": "head-longsleeve-white",
}
# TikTok watermark printed over the black longsleeve sleeve -> repainted black
WATERMARK_FIX = {"head-longsleeve-black": (590, 1040, 800, 1100)}

# ---------------------------------------------------------------- heads
# (id, image, box) — box around one head printed on white fabric
HEADS = [
    ("rasta", 5, (273, 814, 391, 951)),
    ("candy", 6, (271, 849, 425, 982)),
    ("broken-heart", 7, (267, 833, 403, 960)),
    ("spiky", 8, (254, 839, 394, 962)),
    ("kpocle-heart", 11, (300, 355, 408, 447)),
]
# the 9 heads of the Oscan's Head tee, row by row
GRID_NAMES = ["g-rasta", "g-mask", "g-thorns", "g-free", "g-earth", "g-pink", "g-ushanka", "g-spiky", "g-flame"]
GRID_SOURCE = ("head-tee-white", 10, (262, 292, 540, 530))


def load(i):
    return np.array(Image.open(os.path.join(SRC, f"{i:02d}.webp")).convert("RGB"))


def largest(m):
    lab, n = ndi.label(m)
    if n == 0:
        return m
    sizes = ndi.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def fabric_white(a):
    a = a.astype(int)
    mn = a.min(2)
    return (mn > 200) & ((a.max(2) - mn) < 26)


def seg_white(sub):
    a = sub.astype(int)
    mn = a.min(2)
    s = a.max(2) - mn
    strong = (mn > 232) & (s < 12)
    weak = (mn > 200) & (s < 24)
    lab, _ = ndi.label(weak)
    keep = np.unique(lab[strong])
    m = np.isin(lab, keep[keep > 0])
    m = ndi.binary_fill_holes(m)
    m = ndi.binary_opening(m, structure=np.ones((5, 5)))
    return ndi.binary_fill_holes(largest(m))


def seg_black(sub):
    mx = sub.astype(int).max(2)
    lab, _ = ndi.label(mx < 40)
    keep = np.unique(lab[largest(mx < 4)])
    m = np.isin(lab, keep[keep > 0])
    m = ndi.binary_fill_holes(m)
    m = ndi.binary_opening(m, structure=np.ones((5, 5)))
    return ndi.binary_fill_holes(largest(m))


def convex_hull(m):
    import cv2

    pts = np.argwhere(m)[:, ::-1].astype(np.int32)
    hull = cv2.convexHull(pts)
    out = np.zeros(m.shape, np.uint8)
    cv2.fillPoly(out, [hull], 1)
    return out.astype(bool)


def include_sleeve_patches(m, sub):
    """Sleeve logo patches sit on the garment edge: they are not holes, so the
    white/black segmentation leaves a notch. Take back the saturated pixels the
    convex hull adds."""
    a = sub.astype(int)
    sat = a.max(2) - a.min(2)
    vivid = (sat > 140) & (a.max(2) > 150)
    cand = convex_hull(m) & ~m
    lab, n = ndi.label(cand)
    for k in range(1, n + 1):
        comp = lab == k
        if comp.sum() < 30:
            continue
        if (vivid & comp).sum() / comp.sum() > 0.25:
            near = ndi.binary_dilation(vivid & comp, iterations=3) & comp
            m = m | near
    return ndi.binary_fill_holes(m)


def snap_to_template(m, tpl):
    """Align the template silhouette on m (shift + small scale) and return it."""
    ys, xs = np.where(m)
    ty, tx = np.where(tpl)
    tpl = tpl[ty.min() : ty.max() + 1, tx.min() : tx.max() + 1]
    best = (-1, None)
    for scale in (0.98, 0.99, 1.0, 1.01, 1.02, 1.03):
        t = np.array(Image.fromarray(tpl.astype(np.uint8) * 255).resize(
            (round(tpl.shape[1] * scale), round(tpl.shape[0] * scale)), Image.BILINEAR)) > 127
        # anchor on the right/top edges (the left edge is the polluted one)
        x1, y0 = xs.max(), ys.min()
        for dx in range(-6, 7):
            for dy in range(-6, 7):
                ox, oy = x1 - t.shape[1] + 1 + dx, y0 + dy
                if ox < 0 or oy < 0 or oy + t.shape[0] > m.shape[0] or ox + t.shape[1] > m.shape[1]:
                    continue
                cand = np.zeros_like(m)
                cand[oy : oy + t.shape[0], ox : ox + t.shape[1]] = t
                iou = (cand & m).sum() / (cand | m).sum()
                if iou > best[0]:
                    best = (iou, cand)
    return best[1], best[0]


# ---------------------------------------------------------------- upscaling
_sr = None


def _init_sr():
    global _sr
    if _sr is None and os.path.exists(MODEL):
        import cv2

        cv2.setNumThreads(2)  # 2 process x 2 threads : EDSR est gourmand en mémoire
        _sr = cv2.dnn_superres.DnnSuperResImpl_create()
        _sr.readModel(MODEL)
        _sr.setModel("edsr", 4)
    return _sr


CACHE = os.path.join(ROOT, "scripts", ".cache")


def upscale4(rgb):
    """RGB uint8 -> x4. EDSR when available (tiled to bound memory, cached on disk),
    Lanczos otherwise."""
    sr = _init_sr()
    h, w = rgb.shape[:2]
    if sr is None:
        return np.array(Image.fromarray(rgb).resize((w * 4, h * 4), Image.LANCZOS))
    import hashlib

    key = hashlib.sha1(np.ascontiguousarray(rgb).tobytes() + bytes(str(rgb.shape), "ascii")).hexdigest()
    cached = os.path.join(CACHE, f"{key}.png")
    if os.path.exists(cached):
        return np.array(Image.open(cached).convert("RGB"))
    out = _edsr_tiled(sr, rgb)
    os.makedirs(CACHE, exist_ok=True)
    Image.fromarray(out).save(cached)
    return out


def _edsr_tiled(sr, rgb):
    import cv2

    h, w = rgb.shape[:2]
    tile, pad = 128, 8
    out = np.zeros((h * 4, w * 4, 3), np.uint8)
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            y0, x0 = max(0, y - pad), max(0, x - pad)
            y1, x1 = min(h, y + tile + pad), min(w, x + tile + pad)
            up = sr.upsample(cv2.cvtColor(np.ascontiguousarray(rgb[y0:y1, x0:x1]), cv2.COLOR_RGB2BGR))
            up = cv2.cvtColor(up, cv2.COLOR_BGR2RGB)
            ty, tx = (y - y0) * 4, (x - x0) * 4
            th, tw = min(tile, h - y) * 4, min(tile, w - x) * 4
            out[y * 4 : y * 4 + th, x * 4 : x * 4 + tw] = up[ty : ty + th, tx : tx + tw]
    return out


def soft_alpha(mask, size, erode=1):
    """Binary mask -> anti-aliased alpha at the target size."""
    if erode:
        mask = ndi.binary_erosion(mask, iterations=erode)
    a = Image.fromarray(mask.astype(np.uint8) * 255).resize(size, Image.LANCZOS)
    a = np.array(a).astype(np.float32) / 255.0
    a = np.clip((a - 0.5) * 1.6 + 0.5, 0, 1)
    return (a * 255).astype(np.uint8)


def save_rgba(path, rgb, alpha, lossless=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
    if path.endswith(".png"):
        img.save(path, optimize=True)
    else:
        img.save(path, "WEBP", quality=94, method=6, lossless=lossless)


def cut(rgb, mask, factor, margin=2):
    ys, xs = np.where(mask)
    y0, y1 = max(0, ys.min() - margin), min(mask.shape[0], ys.max() + 1 + margin)
    x0, x1 = max(0, xs.min() - margin), min(mask.shape[1], xs.max() + 1 + margin)
    sub, m = rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1]
    up = upscale4(sub)
    if factor != 4:
        size = (round(sub.shape[1] * factor), round(sub.shape[0] * factor))
        up = np.array(Image.fromarray(up).resize(size, Image.LANCZOS))
    alpha = soft_alpha(m, (up.shape[1], up.shape[0]))
    return up, alpha, (int(x0), int(y0), int(x1), int(y1))


# ---------------------------------------------------------------- jobs
def garment_masks():
    masks = {}
    for gid, i, (x0, y0, x1, y1), kind in GARMENTS:
        sub = load(i)[y0:y1, x0:x1]
        m = seg_white(sub) if kind == "white" else seg_black(sub)
        m = include_sleeve_patches(m, sub)
        masks[gid] = m
    for gid, tid in TEMPLATES.items():
        snapped, iou = snap_to_template(masks[gid], masks[tid])
        masks[gid] = snapped
        print(f"  {gid}: silhouette calée sur {tid} (IoU {iou:.3f})")
    return masks


def job_garment(args):
    gid, i, box, kind, mask = args
    x0, y0, x1, y1 = box
    rgb = load(i)[y0:y1, x0:x1].copy()
    if gid in WATERMARK_FIX:
        wx0, wy0, wx1, wy1 = WATERMARK_FIX[gid]
        zone = np.zeros(mask.shape, bool)
        zone[wy0 - y0 : wy1 - y0, wx0 - x0 : wx1 - x0] = True
        rgb[zone & mask] = 0
    up, alpha, b = cut(rgb, mask, 3)
    save_rgba(os.path.join(OUT, "products", f"{gid}.webp"), up, alpha)
    return gid, {"w": up.shape[1], "h": up.shape[0]}


def head_mask(sub):
    fab = fabric_white(sub)
    lab, _ = ndi.label(fab)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    m = ndi.binary_fill_holes(~bg)
    m = ndi.binary_opening(m, iterations=1)
    return largest(m) if m.any() else m


def sticker(rgb, alpha, border):
    """White die-cut sticker border around the head (as on the Oscan stickers)."""
    a = alpha > 100
    ring = ndi.binary_dilation(a, iterations=border)
    ring = ndi.binary_closing(ring, iterations=border // 2)
    ring = ndi.binary_fill_holes(ring)
    ra = soft_alpha(ring, (ring.shape[1], ring.shape[0]), erode=0)
    pad = border + 4
    H, W = alpha.shape
    out_rgb = np.full((H + 2 * pad, W + 2 * pad, 3), 255, np.uint8)
    out_a = np.zeros((H + 2 * pad, W + 2 * pad), np.uint8)
    rp = np.pad(ra, pad)
    out_a[:] = rp
    fa = alpha.astype(np.float32)[..., None] / 255.0
    region = out_rgb[pad : pad + H, pad : pad + W].astype(np.float32)
    out_rgb[pad : pad + H, pad : pad + W] = (rgb * fa + region * (1 - fa)).astype(np.uint8)
    return out_rgb, out_a


def job_head(args):
    hid, i, box = args
    x0, y0, x1, y1 = box
    sub = load(i)[y0:y1, x0:x1]
    m = head_mask(sub)
    up, alpha, b = cut(sub, m, 4)
    save_rgba(os.path.join(OUT, "heads", f"{hid}.webp"), up, alpha)
    border = max(10, round(up.shape[1] * 0.045))
    srgb, sa = sticker(up, alpha, border=border)
    save_rgba(os.path.join(OUT, "heads", f"{hid}-sticker.webp"), srgb, sa)
    src_box = [x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]]
    return hid, {"w": up.shape[1], "h": up.shape[0], "stickerPad": border + 4, "srcBox": src_box}


def job_pack(_):
    """Sticker pack (header card + transparent bag): kept as the rectangular photo."""
    x0, y0, x1, y1 = 245, 345, 581, 891
    sub = load(1)[y0:y1, x0:x1]
    up = upscale4(sub)
    size = (round(sub.shape[1] * 3), round(sub.shape[0] * 3))
    up = np.array(Image.fromarray(up).resize(size, Image.LANCZOS))
    save_rgba(os.path.join(OUT, "products", "stickers-pack.webp"), up, np.full(up.shape[:2], 255, np.uint8))
    return "stickers-pack", {"w": up.shape[1], "h": up.shape[0]}


def grid_heads(tee_mask):
    """Detect the 9 printed heads on the white Oscan's Head tee."""
    _, i, (x0, y0, x1, y1) = GRID_SOURCE
    im = load(i)
    sub = im[y0:y1, x0:x1]
    non = ndi.binary_dilation(~fabric_white(sub), iterations=4)
    lab, _ = ndi.label(non)
    boxes = []
    for k, sl in enumerate(ndi.find_objects(lab)):
        area = (lab[sl] == k + 1).sum()
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if area > 1500 and w < 120 and h < 120:
            boxes.append((x0 + sl[1].start - 3, y0 + sl[0].start - 3, x0 + sl[1].stop + 3, y0 + sl[0].stop + 3))
    assert len(boxes) == 9, boxes
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows = [sorted(boxes[r * 3 : r * 3 + 3], key=lambda b: b[0]) for r in range(3)]
    return [b for row in rows for b in row]


def job_blank_tee(args):
    """White Oscan's Head tee with the 9 heads removed (fabric fitted with a smooth
    quadratic surface) — the drawn head lands on it in scene 4. Returns the tee
    bounding box in capture coordinates."""
    mask, box, heads = args
    x0, y0, x1, y1 = box
    rgb = load(10)[y0:y1, x0:x1].astype(np.float32)
    print_zone = np.zeros(mask.shape, bool)
    for hx0, hy0, hx1, hy1 in heads:
        print_zone[hy0 - y0 - 2 : hy1 - y0 + 2, hx0 - x0 - 2 : hx1 - x0 + 2] = True
    print_zone &= ndi.binary_erosion(mask, iterations=6)
    ring = ndi.binary_dilation(print_zone, iterations=14) & ~print_zone & ndi.binary_erosion(mask, iterations=4)
    ring &= fabric_white(rgb.astype(np.uint8))
    yy, xx = np.nonzero(ring)
    A = np.stack([np.ones_like(xx), xx, yy, xx * xx, xx * yy, yy * yy], 1).astype(np.float64)
    fy, fx = np.nonzero(print_zone)
    B = np.stack([np.ones_like(fx), fx, fy, fx * fx, fx * fy, fy * fy], 1).astype(np.float64)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, rgb[yy, xx, c], rcond=None)
        rgb[fy, fx, c] = B @ coef
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    up, alpha, b = cut(rgb, mask, 3)
    save_rgba(os.path.join(OUT, "tee", "head-tee-blank.webp"), up, alpha)
    return {"w": up.shape[1], "h": up.shape[0], "srcBox": [x0 + b[0], y0 + b[1], x0 + b[2], y0 + b[3]]}


def tee_slots(tee, heads):
    """Where each grid head sits on the tee, normalised to the tee image."""
    tx0, ty0, tx1, ty1 = tee["srcBox"]
    tw, th = tx1 - tx0, ty1 - ty0
    slots = {}
    for name in GRID_NAMES:
        hx0, hy0, hx1, hy1 = heads[name]["srcBox"]
        slots[name] = {"x": (hx0 - tx0) / tw, "y": (hy0 - ty0) / th, "w": (hx1 - hx0) / tw, "h": (hy1 - hy0) / th}
    return slots


def shutter_texture():
    """Real metal shutter from the captures, mirrored into a seamless 1080x1920 plate."""
    crop = Image.open(os.path.join(SRC, "02.webp")).convert("RGB").crop((210, 95, 819, 385))
    crop = crop.resize((1080, round(crop.height * 1080 / crop.width)), Image.LANCZOS)
    a = np.array(crop)
    tile = np.concatenate([a, a[::-1]], 0)
    reps = int(np.ceil(1920 / tile.shape[0]))
    plate = np.concatenate([tile] * reps, 0)[:1920]
    os.makedirs(os.path.join(OUT, "textures"), exist_ok=True)
    Image.fromarray(plate).save(os.path.join(OUT, "textures", "shutter.webp"), "WEBP", quality=90)


def grain_tiles(n=6, size=512):
    rng = np.random.default_rng(7)
    os.makedirs(os.path.join(OUT, "textures"), exist_ok=True)
    for k in range(n):
        g = rng.normal(128, 46, (size, size))
        g = ndi.gaussian_filter(g, 0.6)
        g = np.clip(g, 0, 255).astype(np.uint8)
        Image.fromarray(g, "L").save(os.path.join(OUT, "textures", f"grain-{k}.png"), optimize=True)


def lineart_mask():
    """Dark ink of the rasta head (x4) for the draw-on vectorisation."""
    path = os.path.join(OUT, "heads", "rasta.webp")
    img = np.array(Image.open(path).convert("RGBA")).astype(np.int32)
    rgb, a = img[..., :3], img[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    ink = (lum < 75) & (a > 128)
    ink = ndi.binary_opening(ink, iterations=1)
    os.makedirs(os.path.join(OUT, "lineart"), exist_ok=True)
    Image.fromarray(np.where(ink, 0, 255).astype(np.uint8), "L").save(os.path.join(OUT, "lineart", "rasta-mask.png"))
    return {"w": int(img.shape[1]), "h": int(img.shape[0])}


def ensure_model():
    if os.path.exists(MODEL):
        return
    os.makedirs(os.path.dirname(MODEL), exist_ok=True)
    try:
        print("Téléchargement du modèle EDSR x4…")
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    except Exception as e:  # noqa: BLE001
        print(f"  EDSR indisponible ({e}) -> agrandissement Lanczos")


def main():
    missing = [f"{i:02d}.webp" for i in range(1, 14) if not os.path.exists(os.path.join(SRC, f"{i:02d}.webp"))]
    if missing:
        sys.exit(f"Captures manquantes dans assets/source : {missing}")
    ensure_model()
    print("Segmentation des vêtements…")
    masks = garment_masks()
    tee_box = next(g[2] for g in GARMENTS if g[0] == "head-tee-white")
    grid = grid_heads(masks["head-tee-white"])
    jobs_g = [(g[0], g[1], g[2], g[3], masks[g[0]]) for g in GARMENTS]
    jobs_h = list(HEADS) + [(name, 10, b) for name, b in zip(GRID_NAMES, grid)]
    manifest = {"products": {}, "heads": {}}
    with Pool(2) as pool:
        for hid, info in pool.imap_unordered(job_head, jobs_h):
            manifest["heads"][hid] = info
            print("  tête", hid, info, flush=True)
        tee = pool.apply_async(job_blank_tee, ((masks["head-tee-white"], tee_box, grid),))
        pack = pool.apply_async(job_pack, (None,))
        for gid, info in pool.imap_unordered(job_garment, jobs_g):
            manifest["products"][gid] = info
            print("  produit", gid, info, flush=True)
        gid, info = pack.get()
        manifest["products"][gid] = info
        blank = tee.get()
        blank["slots"] = tee_slots(blank, manifest["heads"])
        manifest["blankTee"] = blank
    print("Textures…", flush=True)
    shutter_texture()
    grain_tiles()
    manifest["lineart"] = lineart_mask()
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print("OK -> assets/manifest.json")


if __name__ == "__main__":
    main()
