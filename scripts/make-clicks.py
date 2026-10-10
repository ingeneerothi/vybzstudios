"""Synthesizes the soft keyboard clicks used for the typing animations.

Writes public/sfx/click-{0..5}.wav (48 kHz mono). Each click is a short
filtered-noise transient (the key tip) plus a damped low "thock" (the key
bottoming out), with small variations so repeated keystrokes don't sound
mechanical.
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")


def one_pole_lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def click(seed):
    rng = np.random.default_rng(seed)
    n = int(SR * 0.07)
    t = np.arange(n) / SR
    # Tip: bright noise burst, high-passed (noise minus its low-passed copy).
    noise = rng.standard_normal(n)
    bright = noise - one_pole_lowpass(noise, 1800 + 400 * rng.random())
    tip = bright * np.exp(-t / (0.0012 + 0.0006 * rng.random()))
    # Bottom-out: a second, softer burst a few ms later.
    delay = int(SR * (0.007 + 0.004 * rng.random()))
    bottom = np.zeros(n)
    bottom[delay:] = 0.55 * bright[: n - delay] * np.exp(-t[: n - delay] / 0.0018)
    # Thock: damped low sine body.
    f = 190 + 120 * rng.random()
    thock = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.011)
    thock[:delay] *= 0.25
    sig = 0.9 * tip + bottom + 0.35 * thock
    sig = one_pole_lowpass(sig, 7500)
    sig *= np.minimum(1, np.arange(n) / 24)  # no DC step at the start
    sig /= np.max(np.abs(sig))
    return sig * 0.5  # -6 dBFS peak; scaled further in the composition


os.makedirs(OUT, exist_ok=True)
for k in range(6):
    data = (click(1000 + k) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, f"click-{k}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
print("wrote", OUT)
