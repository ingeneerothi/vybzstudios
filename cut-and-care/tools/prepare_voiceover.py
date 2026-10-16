"""Prépare la voix off ElevenLabs pour la vidéo (45 s max).

1. Raccourcit les pauses longues (au-delà de 0,20 s, on n'en garde que KEEP_RATIO).
2. Time-stretch rubberband (hauteur de voix conservée) pour finir à TARGET_END.
3. Normalise à -14 LUFS (réseaux sociaux).
4. Détecte les segments de parole et écrit src/voiceover-segments.json.

Usage : python tools/prepare_voiceover.py <voix.mp3>
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 44100
NOISE_DB = -38
MIN_SIL = 0.18
KEEP_FLOOR = 0.20  # durée de pause conservée telle quelle
KEEP_RATIO = 0.45  # part conservée au-delà du plancher
PRE_ROLL = 0.12  # silence avant la première syllabe (s)
TARGET_END = 43.95  # fin de la dernière syllabe dans la vidéo (s)
XFADE = int(0.008 * SR)

ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / "tools" / ".tmp"


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def decode(path):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32).copy()


def write_wav(path, samples):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-c:a", "pcm_s16le", str(path)],
        input=samples.astype(np.float32).tobytes(), check=True,
    )


def silences(path, noise=NOISE_DB, d=MIN_SIL):
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
         f"silencedetect=noise={noise}dB:d={d}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    return list(zip(starts, ends + [None] * (len(starts) - len(ends))))


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).stdout)


def speech_segments(path):
    total = duration(path)
    sil = [(s, e if e is not None else total) for s, e in silences(path)]
    segs, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.05:
            segs.append((round(cur, 3), round(s, 3)))
        cur = e
    if total - cur > 0.05:
        segs.append((round(cur, 3), round(total, 3)))
    return segs, total


def main(src):
    TMP.mkdir(parents=True, exist_ok=True)
    x = decode(src)
    segs, total = speech_segments(src)
    print(f"source: {total:.2f}s, {len(segs)} segments, parole {segs[0][0]:.2f}-{segs[-1][1]:.2f}s")

    # 1. reconstruction avec pauses raccourcies (coupe au milieu de chaque pause)
    pieces = [np.zeros(int(PRE_ROLL * SR), dtype=np.float32)]
    for i, (a, b) in enumerate(segs):
        pieces.append(x[int(a * SR):int(b * SR)])
        if i + 1 < len(segs):
            gap = segs[i + 1][0] - b
            keep = gap if gap <= KEEP_FLOOR else KEEP_FLOOR + KEEP_RATIO * (gap - KEEP_FLOOR)
            g = x[int(b * SR):int(segs[i + 1][0] * SR)]
            half = int(keep * SR / 2)
            if len(g) <= 2 * half + 2 * XFADE:
                pieces.append(g[:int(keep * SR)])
                continue
            # on garde le bruit de fond réel : début + fin de la pause, raccord en fondu
            head, tail = g[:half + XFADE], g[len(g) - half - XFADE:]
            ramp = np.linspace(0, 1, XFADE, dtype=np.float32)
            mid = head[-XFADE:] * (1 - ramp) + tail[:XFADE] * ramp
            pieces.append(np.concatenate([head[:-XFADE], mid, tail[XFADE:]]))
    pieces.append(np.zeros(int(0.10 * SR), dtype=np.float32))
    y = np.concatenate(pieces)
    tight = TMP / "tight.wav"
    write_wav(tight, y)
    tsegs, ttotal = speech_segments(tight)
    speech_end = tsegs[-1][1]
    print(f"pauses raccourcies: {ttotal:.2f}s (parole jusqu'à {speech_end:.2f}s)")

    # 2. time-stretch pour que la dernière syllabe finisse à TARGET_END
    tempo = (speech_end - PRE_ROLL) / (TARGET_END - PRE_ROLL)
    stretched = TMP / "stretched.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(tight), "-af",
         f"rubberband=tempo={tempo:.5f}:transients=mixed:window=standard:pitchq=quality:channels=together",
         "-ar", str(SR), "-c:a", "pcm_s16le", str(stretched)])
    print(f"tempo rubberband: x{tempo:.4f}")

    # 3. loudnorm 2 passes -> -14 LUFS, true peak -1.5 dBTP
    meas = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(stretched), "-af",
         "highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    final = ROOT / "public" / "voix-off.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(stretched), "-af",
         "highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=7:"
         f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
         f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
         "-ar", "48000", "-c:a", "pcm_s16le", str(final)])

    # 4. segments finaux (seuil relevé : le signal est maintenant ~14 dB plus fort)
    fsegs, ftotal = speech_segments_final(final)
    print(f"final: {ftotal:.2f}s, {len(fsegs)} segments, dernière syllabe à {fsegs[-1][1]:.2f}s")
    out = ROOT / "src" / "voiceover-segments.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"duration": round(ftotal, 3), "tempo": round(tempo, 4),
                               "segments": [[a, b] for a, b in fsegs]}, indent=1))
    for i, (a, b) in enumerate(fsegs):
        print(f"{i:2d} {a:6.2f} {b:6.2f}  ({b - a:.2f}s)")


def speech_segments_final(path):
    total = duration(path)
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
         "silencedetect=noise=-30dB:d=0.12", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(v) for v in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", log)] + [total]
    segs, cur = [], 0.0
    for s, e in zip(starts, ends):
        if s - cur > 0.05:
            segs.append((round(cur, 3), round(s, 3)))
        cur = e
    if total - cur > 0.05:
        segs.append((round(cur, 3), round(total, 3)))
    return segs, total


if __name__ == "__main__":
    main(Path(sys.argv[1]))
