#!/usr/bin/env python3
"""Synthesizes the Vybz Studios sound-effects kit (v2): public/sfx/*.wav.

Everything is generated from scratch with numpy (no samples, so the kit is
license-clean) and is deterministic (fixed random seeds). The sound design
follows the reference ad the client sent (Apple-like UI motion):

- transitions are noise "whoosh" swells whose band sweeps up then down, riding
  on a pure sine sub swell, with a short pitch-drop "knock" on the cut;
- UI sounds are glassy taps, soft keyboard ticks, bubbly pops that glide up
  about an octave in ~90 ms, and struck-bar chimes (partials 1 : 2.76 : 5.40,
  like a glockenspiel / vibraphone bar).

Tonal sounds are tuned to the G# minor pentatonic (G#, B, C#, D#, F#): the
music bed (public/media/redcap-audio.m4a) is in G# minor at A440, so the chimes
never clash with it.

Output: 48 kHz, 16-bit, stereo. Every file is high-passed and zero-mean (no
DC), starts and ends at zero (short fades) and stays under -1 dBTP. The kit is
balanced by loudness: each sound is set to its target mix level (K-weighted
loudness of its loudest 100 ms, against clip audio at -14 LUFS), then one
global gain puts the loudest file (boom-meme) at -3 dBFS peak; no other file
peaks higher (the first millisecond of taps / key ticks is limited by <= 1.5
dB). The script prints the volume at which each file hits its target.

Usage: python3 -I scripts/make-sfx.py
The existing click-0..5.wav files come from make-clicks.py and are not touched.
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "sfx")

SEMITONES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
             "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(note):
    """Equal-tempered frequency of a note name such as 'G#5' (A4 = 440 Hz)."""
    midi = 12 * (int(note[-1]) + 1) + SEMITONES[note[:-1]]
    return 440.0 * 2.0 ** ((midi - 69) / 12)


# G# minor pentatonic, high octaves, for sparkles.
SPARKLE_NOTES = [hz(n) for n in ("G#7", "B7", "C#8", "D#8", "F#8", "G#8")]


# --------------------------------------------------------------------------
# DSP helpers
# --------------------------------------------------------------------------

def tt(dur):
    """Time axis (seconds) of a sound lasting `dur` seconds."""
    return np.arange(int(round(dur * SR))) / SR


def db(v):
    return 10.0 ** (np.asarray(v, dtype=float) / 20.0)


def biquad(x, b, a):
    """Transposed direct-form-II biquad on a 1-D signal (a[0] == 1)."""
    b0, b1, b2 = b
    a1, a2 = a[1], a[2]
    y = []
    push = y.append
    z1 = z2 = 0.0
    for xi in x.tolist():
        yi = b0 * xi + z1
        z1 = b1 * xi - a1 * yi + z2
        z2 = b2 * xi - a2 * yi
        push(yi)
    return np.array(y)


def rbj(kind, f0, q=0.7071, gain_db=0.0):
    """RBJ audio-EQ-cookbook biquad coefficients (normalized, a[0] == 1)."""
    w0 = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    amp = 10 ** (gain_db / 40)
    if kind == "lp":
        b, a = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "hp":
        b, a = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "bp":  # 0 dB at the centre frequency
        b, a = [alpha, 0.0, -alpha], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == "peak":
        b = [1 + alpha * amp, -2 * cw, 1 - alpha * amp]
        a = [1 + alpha / amp, -2 * cw, 1 - alpha / amp]
    else:
        raise ValueError(kind)
    return [v / a[0] for v in b], [1.0, a[1] / a[0], a[2] / a[0]]


def filt(x, kind, f0, q=0.7071, gain_db=0.0):
    """RBJ biquad on a mono (n,) or stereo (n, 2) signal."""
    b, a = rbj(kind, f0, q, gain_db)
    if x.ndim == 1:
        return biquad(x, b, a)
    return np.stack([biquad(x[:, c], b, a) for c in range(x.shape[1])], axis=1)


def smooth(x, sec):
    """Hann-window moving average (zero phase), e.g. to round envelope corners."""
    k = max(3, int(sec * SR) | 1)
    w = np.hanning(k)
    pad = np.concatenate([np.full(k, x[0]), x, np.full(k, x[-1])])
    return np.convolve(pad, w / w.sum(), mode="same")[k:-k]


def fade(x, fin=0.0, fout=0.0):
    """Raised-cosine fades (seconds); the first and last samples end up at 0."""
    y = np.array(x, dtype=float)
    if fin > 0:
        k = max(2, int(fin * SR))
        w = 0.5 - 0.5 * np.cos(np.pi * np.arange(k) / k)
        y[:k] *= w if y.ndim == 1 else w[:, None]
    if fout > 0:
        k = max(2, int(fout * SR))
        w = 0.5 + 0.5 * np.cos(np.pi * np.arange(1, k + 1) / k)
        y[len(y) - k:] *= w if y.ndim == 1 else w[:, None]
    return y


def place(dst, src, at):
    """Adds `src` into `dst` starting at time `at` (seconds), clipped to dst."""
    i = int(round(at * SR))
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n]
    return dst


def pan(mono, p):
    """Constant-power pan, p in [-1, 1] (scalar or per sample) -> (n, 2).
    Centre keeps unity gain on both channels."""
    th = (np.asarray(p, dtype=float) + 1) * np.pi / 4
    return np.stack([mono * np.cos(th), mono * np.sin(th)], axis=1) * np.sqrt(2)


def sine(freq, t, phase=0.0):
    """Sine whose frequency may vary per sample (phase-continuous)."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), t.shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def shaped_noise(n, shape, rng, nfft=2048):
    """Noise whose spectrum follows `shape` over time (STFT overlap-add).

    shape(t, f) gets frame-centre times (frames, 1) and bin frequencies
    (1, bins) and returns linear magnitudes. Each frame is normalized to unit
    power, so `shape` only sets the colour; the level is set afterwards by a
    sample-accurate envelope. Hann windows at 75 % overlap keep the power
    constant between frames.
    """
    hop = nfft // 4
    frames = n // hop + 6
    tc = ((np.arange(frames) - 2) * hop / SR)[:, None]
    f = np.fft.rfftfreq(nfft, 1 / SR)[None, :]
    mag = shape(tc, f) * np.ones_like(f)
    mag[:, 0] = 0.0
    mag /= np.sqrt((mag ** 2).sum(axis=1, keepdims=True)) + 1e-12
    spec = (rng.standard_normal(mag.shape) + 1j * rng.standard_normal(mag.shape)) * mag
    win = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(nfft) / nfft)
    blocks = np.fft.irfft(spec, nfft, axis=1) * win
    buf = np.zeros(frames * hop + nfft)
    for i in range(frames):
        buf[i * hop:i * hop + nfft] += blocks[i]
    out = buf[2 * hop + nfft // 2:2 * hop + nfft // 2 + n]
    return out / (np.sqrt(np.mean(out ** 2)) + 1e-12)


def log_band(fc_t, sigma_t, extra=None):
    """Spectral shape for shaped_noise: a Gaussian band in log-frequency whose
    centre fc_t(t) (Hz) and width sigma_t(t) (octaves) move over time, rolled
    off above 13 kHz so nothing gets hissy."""
    def shape(t, f):
        lf = np.log2(np.maximum(f, 1.0))
        m = np.exp(-0.5 * ((lf - np.log2(fc_t(t))) / sigma_t(t)) ** 2)
        if extra is not None:
            m = m + extra(t, f)
        return m / (1 + (f / 13000.0) ** 4)
    return shape


def svf_bandpass(x, fc, q):
    """Zero-delay-feedback state-variable band-pass (0 dB at the centre) with a
    per-sample centre frequency: the moving resonance gives a swoosh its
    'whistle'. Output power is flattened across the sweep."""
    fc = np.clip(np.asarray(fc, dtype=float), 20, 0.45 * SR)
    g = np.tan(np.pi * fc / SR)
    k = 1.0 / q
    a1 = 1 / (1 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    ic1 = ic2 = 0.0
    y = []
    push = y.append
    for xi, c1, c2, c3 in zip(x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()):
        v3 = xi - ic2
        v1 = c1 * ic1 + c2 * v3
        v2 = ic2 + c2 * ic1 + c3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        push(k * v1)
    return np.array(y) * np.sqrt(1000.0 / fc)


def soft_clip(x, c):
    """tanh soft clip at +-c. Used on noise clicks only: a clipped noise burst
    is still a noise burst, but with a much lower crest factor."""
    return c * np.tanh(x / c)


def limit(x, ceiling, window=0.001, release=0.004):
    """Transparent look-ahead peak limiter for short transients. The gain is a
    centred minimum filter of the required gain followed by a centred moving
    average of the same width, so it is never above what each sample needs
    (|x| <= ceiling everywhere) and dips smoothly over ~1 ms around a peak;
    it then recovers with a one-pole release instead of snapping back."""
    from numpy.lib.stride_tricks import sliding_window_view

    need = np.minimum(1.0, ceiling / np.maximum(np.abs(x).max(axis=1), 1e-12))
    if need.min() >= 1.0:
        return x
    w = int(window * SR) | 1
    h = w // 2
    padded = np.concatenate([np.ones(2 * h), need, np.ones(2 * h)])  # silence needs no gain change
    g = sliding_window_view(padded, w).min(axis=1)  # samples -h .. n+h
    g = np.convolve(g, np.ones(w) / w, mode="valid")  # samples 0 .. n
    r = 1.0 - np.exp(-1.0 / (release * SR))
    out, cur = [], 1.0
    for gi in g.tolist():
        cur = min(gi, cur + (1.0 - cur) * r)
        out.append(cur)
    return x * np.array(out)[:, None]


def stereo_pair(a, b, corr):
    """Mixes two independent signals into L/R with the given correlation."""
    m, s = np.sqrt((1 + corr) / 2), np.sqrt((1 - corr) / 2)
    return np.stack([m * a + s * b, m * a - s * b], axis=1)


def convolve(x, h):
    n = len(x) + len(h) - 1
    size = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)[:n]


def reverb(x, rt60, wet_db, seed, predelay=0.012, hf_rt60=None):
    """Soft stereo room: two decorrelated noise impulse responses whose highs
    die faster (rt60 in the lows, hf_rt60 at 10 kHz). Returns the dry signal
    plus the wet tail, longer than x by the impulse-response length."""
    rng = np.random.default_rng(seed)
    hf = hf_rt60 if hf_rt60 is not None else 0.35 * rt60
    n_ir = int(rt60 * SR)

    def shape(t, f):
        r = rt60 + (hf - rt60) * np.clip(f / 10000.0, 0, 1)
        return 10 ** (-3 * np.maximum(t, 0) / r) / (1 + (f / 9000.0) ** 2)

    x = x if x.ndim == 2 else np.stack([x, x], axis=1)
    mono = x.mean(axis=1)
    wet = []
    for _ in range(2):
        ir = shaped_noise(n_ir, shape, rng) * 10 ** (-3 * np.arange(n_ir) / SR / rt60)
        ir = fade(ir, fin=0.006)
        ir /= np.sqrt(np.sum(ir ** 2))
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        wet.append(convolve(mono, ir))
    wet = np.stack(wet, axis=1) * db(wet_db)
    out = np.zeros((len(wet), 2))
    out[:len(x)] += x
    return out + wet


def bar_note(f0, dur, tau, attack=0.003, seed=0):
    """Struck-bar tone (glockenspiel / vibraphone): free-bar partials
    1 : 2.756 : 5.404 : 8.933, the upper ones dying much faster, plus a tiny
    mallet click. `tau` is the fundamental's decay time constant."""
    t = tt(dur)
    y = np.zeros_like(t)
    for ratio, amp, tscale in ((1.0, 1.0, 1.0), (2.756, 0.17, 0.42),
                               (5.404, 0.055, 0.16), (8.933, 0.02, 0.07)):
        f = f0 * ratio
        if f < 15000:
            y += amp * np.sin(2 * np.pi * f * t) * np.exp(-t / (tau * tscale))
    rng = np.random.default_rng(seed)
    m = min(len(t), int(0.03 * SR))
    click = rng.standard_normal(m) * np.exp(-t[:m] / 0.0012)
    y[:m] += 0.06 * filt(click, "bp", min(4.5 * f0, 9000.0), 0.9)
    return fade(y, fin=attack)


def sparkles(dur, count, seed, times, level_db=(-14.0, 0.0), tau=(0.03, 0.11), spread=0.75):
    """Glitter: short high sine grains on pentatonic notes, random pan.
    `times` is a function (rng, count) -> onset times in seconds."""
    rng = np.random.default_rng(seed)
    out = np.zeros((int(round(dur * SR)), 2))
    for at in np.sort(times(rng, count)):
        f = rng.choice(SPARKLE_NOTES) * (1 + rng.uniform(-0.003, 0.003))
        tg = tt(min(dur - at, 7 * tau[1]))
        if len(tg) < 64:
            continue
        g = np.sin(2 * np.pi * f * tg + rng.uniform(0, 2 * np.pi))
        g *= (1 - np.exp(-tg / 0.0025)) * np.exp(-tg / rng.uniform(*tau))
        g *= db(rng.uniform(*level_db))
        place(out, pan(fade(g, fout=0.004), rng.uniform(-spread, spread)), at)
    return out


# --------------------------------------------------------------------------
# Sounds. Each returns a float array (n, 2) or (n,); level is set later.
# --------------------------------------------------------------------------

def whoosh_in():
    """0.95 s swell that peaks at 0.65 s (to land on a cut), then releases.

    Noise band rising 380 Hz -> 2.5 kHz into the peak and falling back to
    1.3 kHz after it (a pass-by), with a moving resonance on top, drifting
    left -> right. A D#2 sine sub swell peaks just before the cut, like the
    reference's whoosh + sub swells."""
    rng = np.random.default_rng(1101)
    dur, tp = 0.95, 0.65
    t = tt(dur)
    n = len(t)

    # Band centre (log): up to 2.5 kHz at 0.62 s, then down to 1.3 kHz.
    lo, hi, end = np.log2(380.0), np.log2(2500.0), np.log2(1300.0)
    up = np.clip(t / 0.62, 0, 1) ** 1.35
    down = np.clip((t - 0.62) / (dur - 0.62), 0, 1)
    lfc = smooth(np.where(t < 0.62, lo + (hi - lo) * up, hi + (end - hi) * down), 0.04)

    def fc_t(tc):
        return 2 ** np.interp(tc, t, lfc)

    def sigma_t(tc):  # band widens from 0.55 to 0.85 octave into the peak
        return 0.55 + 0.30 * np.exp(-0.5 * ((tc - tp) / 0.12) ** 2)

    def air(tc, f):  # breathy top an octave above the band, and some body
        lf = np.log2(np.maximum(f, 1.0))
        c = np.log2(fc_t(tc))
        return (0.14 * np.exp(-0.5 * ((lf - c - 1.0) / 0.8) ** 2)
                + 0.25 * np.exp(-0.5 * ((lf - np.log2(300.0)) / 0.9) ** 2))

    shape = log_band(fc_t, sigma_t, air)
    body = stereo_pair(shaped_noise(n, shape, rng), shaped_noise(n, shape, rng), 0.55)
    whistle = svf_bandpass(rng.standard_normal(n), 2 ** lfc, 3.2)
    whistle /= np.sqrt(np.mean(whistle ** 2))
    noise = body + 0.32 * pan(whistle, 0.0)

    # Swell in dB (smooth ease toward the peak), exponential release after it.
    u = np.clip(t / tp, 0, 1)
    env_db = np.where(t <= tp, -45 * (1 - u) ** 1.7, -8.686 * (t - tp) / 0.07)
    env = smooth(db(env_db), 0.014)
    drift = 0.42 * np.tanh((t - tp + 0.05) / 0.22)  # left -> right across the cut
    th = (drift + 1) * np.pi / 4
    noise = noise * (env * np.sqrt(2))[:, None] * np.stack([np.cos(th), np.sin(th)], axis=1)

    # Sine sub swell: D#2 bending slightly up and back, peak at 0.5 s, its RMS
    # 4.5 dB over the noise peak's (the reference's sub swells dominate the
    # spectrum but sit low enough to be felt rather than heard).
    f_sub = hz("D#2") * (1 + 0.035 * np.sin(np.pi * np.clip(t / 0.8, 0, 1)))
    sub_env = np.where(t <= 0.5, db(-30 * (1 - np.clip(t / 0.5, 0, 1)) ** 2), db(-8.686 * (t - 0.5) / 0.12))
    sub = sine(f_sub, t) * smooth(sub_env, 0.02)
    peak = noise[int((tp - 0.03) * SR):int((tp + 0.03) * SR)]
    out = noise / np.sqrt(np.mean(peak ** 2)) + np.sqrt(2) * db(4.5) * pan(sub, 0.0)
    return fade(filt(out, "hp", 35.0), fin=0.01, fout=0.06)


def whoosh_out():
    """0.62 s fast swoosh for things leaving / zoom-outs: peak at 0.12 s, band
    falling 4.8 kHz -> 450 Hz, drifting to the right."""
    rng = np.random.default_rng(1202)
    dur, tp = 0.62, 0.12
    t = tt(dur)
    n = len(t)
    a, b, c = np.log2(4800.0), np.log2(2900.0), np.log2(450.0)
    after = np.clip((t - tp) / (dur - tp), 0, 1) ** 0.8
    lfc = smooth(np.where(t < tp, a + (b - a) * t / tp, b + (c - b) * after), 0.03)

    def fc_t(tc):
        return 2 ** np.interp(tc, t, lfc)

    def air(tc, f):
        lf = np.log2(np.maximum(f, 1.0))
        return 0.18 * np.exp(-0.5 * ((lf - np.log2(fc_t(tc)) - 1.0) / 0.8) ** 2)

    shape = log_band(fc_t, lambda tc: 0.7 + 0 * tc, air)
    noise = stereo_pair(shaped_noise(n, shape, rng), shaped_noise(n, shape, rng), 0.6)
    whistle = svf_bandpass(rng.standard_normal(n), 2 ** lfc, 2.8)
    noise += 0.3 * pan(whistle / np.sqrt(np.mean(whistle ** 2)), 0.0)

    env_db = np.where(t <= tp, -32 * (1 - np.clip(t / tp, 0, 1)) ** 1.3, -8.686 * (t - tp) / 0.085)
    env = smooth(db(env_db), 0.012)
    th = (0.45 * np.tanh(t / 0.25) + 1) * np.pi / 4  # centre -> right
    noise = noise * (env * np.sqrt(2))[:, None] * np.stack([np.cos(th), np.sin(th)], axis=1)

    # Low "air push" (60-260 Hz) with the attack, so it has some weight.
    push = filt(filt(filt(rng.standard_normal(n), "lp", 260.0), "lp", 260.0), "hp", 60.0)
    push = push / np.abs(push).max() * smooth(db(np.where(t <= tp, -24 * (1 - t / tp), -8.686 * (t - tp) / 0.06)), 0.01)
    out = noise / np.abs(noise).max() + 0.35 * pan(push, 0.0)
    return fade(filt(out, "hp", 40.0), fin=0.006, fout=0.05)


def swish():
    """0.26 s short airy swish for small UI moves (cards sliding in)."""
    rng = np.random.default_rng(1303)
    dur, tp = 0.26, 0.085
    t = tt(dur)
    n = len(t)
    a, b, c = np.log2(1500.0), np.log2(3600.0), np.log2(5200.0)
    lfc = np.where(t < tp, a + (b - a) * t / tp, b + (c - b) * (t - tp) / (dur - tp))

    def fc_t(tc):
        return 2 ** np.interp(tc, t, lfc)

    shape = log_band(fc_t, lambda tc: 0.75 + 0 * tc)
    noise = stereo_pair(shaped_noise(n, shape, rng, nfft=1024), shaped_noise(n, shape, rng, nfft=1024), 0.5)
    noise = filt(noise, "hp", 700.0)
    env_db = np.where(t <= tp, -28 * (1 - np.clip(t / tp, 0, 1)) ** 2, -8.686 * (t - tp) / 0.045)
    env = smooth(db(env_db), 0.008)
    th = (0.22 * np.tanh((t - tp) / 0.08) + 1) * np.pi / 4
    out = noise * (env * np.sqrt(2))[:, None] * np.stack([np.cos(th), np.sin(th)], axis=1)
    return fade(out, fin=0.004, fout=0.03)


def sub_hit():
    """1.25 s deep cinematic impact: a pitch-drop knock (300 Hz falling fast)
    that becomes a sine sub drop 70 -> 38 Hz, a mid 'bwomp' (420 -> 160 Hz,
    the reference's cut sound, lifted around 380 Hz so it reads on phones),
    a soft noise transient and a low rumble tail. Gentle saturation only."""
    rng = np.random.default_rng(1404)
    dur = 1.25
    t = tt(dur)
    n = len(t)
    f = 38 + 32 * np.exp(-t / 0.32) + 230 * np.exp(-t / 0.016)
    sub = sine(f, t) * np.exp(-np.maximum(t - 0.03, 0) / 0.3)
    knock = sine(160 + 260 * np.exp(-t / 0.03), t) * np.exp(-t / 0.09)
    core = sub + 0.4 * knock
    core = np.tanh(1.6 * core) / np.tanh(1.6)
    core = filt(core, "peak", 380.0, 0.9, 5.0)  # so the knock still reads on phone speakers

    click = filt(filt(rng.standard_normal(n), "lp", 2400.0), "lp", 2400.0) * np.exp(-t / 0.006)
    click = stereo_pair(click, filt(filt(rng.standard_normal(n), "lp", 2400.0), "lp", 2400.0) * np.exp(-t / 0.006), 0.4)
    click /= np.abs(click).max()

    rum = [filt(filt(rng.standard_normal(n), "lp", 90.0), "lp", 90.0) for _ in range(2)]
    rumble = stereo_pair(rum[0], rum[1], 0.2)
    rumble *= ((1 - np.exp(-t / 0.04)) * np.exp(-t / 0.5))[:, None]
    rumble /= np.abs(rumble).max()

    out = pan(core, 0.0) + 0.16 * click + 0.22 * rumble
    out = filt(filt(out, "hp", 25.0, 0.54), "hp", 25.0, 1.31)  # 4th-order Butterworth
    return fade(out, fin=0.002, fout=0.2)


def boom_meme():
    """1.65 s 'vine boom': a saturated sine boom with a fast pitch drop
    (130 -> 52 Hz) whose harmonics are lifted around 420 Hz (so it still
    booms on a phone), a pitched punch + thud transient and a short dark
    room tail."""
    rng = np.random.default_rng(1505)
    dur = 1.65
    t = tt(dur)
    n = len(t)
    f = 52 + 80 * np.exp(-t / 0.05)
    env = (1 - np.exp(-t / 0.002)) * np.exp(-np.maximum(t - 0.06, 0) / 0.33)
    core = (sine(f, t) + 0.6 * sine(f * 1.006, t, 1.0)) / 1.6 * env
    core = np.tanh(5.5 * core)  # saturated: strong odd harmonics
    core = filt(core, "peak", 420.0, 0.8, 7.0)  # the boom's body on small speakers
    core = filt(filt(core, "lp", 1800.0), "lp", 2600.0)
    punch = sine(160 + 440 * np.exp(-t / 0.012), t) * np.exp(-t / 0.03)
    thud = filt(filt(rng.standard_normal(n), "lp", 600.0), "lp", 600.0) * np.exp(-t / 0.015)
    dry = core / np.abs(core).max() + 0.3 * punch + 0.25 * thud / np.abs(thud).max()
    dry = soft_clip(dry, 1.0)  # glue: squashes the attack peak like the meme's own boom
    out = reverb(pan(dry, 0.0), rt60=0.9, wet_db=-11.0, seed=2505, predelay=0.018, hf_rt60=0.3)[:n]
    out = filt(filt(out, "hp", 28.0, 0.54), "hp", 28.0, 1.31)
    out = soft_clip(out / np.abs(out).max(), 0.55)  # rounds the sporadic filter-phase peaks
    return fade(filt(out, "hp", 20.0), fin=0.002, fout=0.3)  # clears what the clip made below 20 Hz


def tap():
    """45 ms crisp glassy UI tap: inharmonic modes at 1.66 / 2.05 / 2.78 kHz,
    a 620 Hz body and a soft band-limited click (the reference's taps sit at
    1.35-1.8 kHz with a second mode near 2.7 kHz)."""
    rng = np.random.default_rng(1606)
    t = tt(0.045)
    y = np.zeros_like(t)
    for f, a, tau in ((hz("G#6"), 1.0, 0.0055), (2050.0, 0.4, 0.004), (2780.0, 0.42, 0.0035),
                      (622.0, 0.2, 0.006), (4600.0, 0.1, 0.0015)):
        y += a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    click = filt(rng.standard_normal(len(t)), "hp", 2500.0) * np.exp(-t / 0.0016)
    click /= np.sqrt(np.mean(click[:int(0.004 * SR)] ** 2))
    click = filt(soft_clip(click, 2.0), "lp", 9000.0)
    y += 0.06 * click
    y = filt(y, "hp", 80.0)
    return fade(y, fin=0.00025, fout=0.012)


# (body Hz, key resonance Hz, click dB, decay scale, seed): small variations so
# fast typing never sounds like a machine gun.
KEY_VARIANTS = (
    (332.0, 1350.0, -1.5, 1.00, 1701),
    (346.0, 1295.0, -2.5, 0.92, 1702),
    (318.0, 1395.0, -1.0, 1.08, 1703),
    (339.0, 1320.0, -2.0, 0.96, 1704),
)


def key_tick(body, res, click_db, decay, seed):
    """50 ms soft iPhone-keyboard tick: a hollow 'tok' (~330 Hz) with a tiny
    pitch drop, the key resonance (~1.35 kHz), a faint low thump and a soft
    band-limited click. Rounded 0.3 ms onset so it never clacks."""
    rng = np.random.default_rng(seed)
    t = tt(0.05)
    tok = sine(body * (1 + 0.12 * np.exp(-t / 0.0015)), t) * np.exp(-t / (0.0048 * decay))
    ring = np.sin(2 * np.pi * res * t + 0.4) * np.exp(-t / (0.0036 * decay))
    ring2 = np.sin(2 * np.pi * res * 1.21 * t + 1.1) * np.exp(-t / (0.0025 * decay))
    mid = np.sin(2 * np.pi * body * 1.83 * t + 0.7) * np.exp(-t / (0.004 * decay))
    thump = np.sin(2 * np.pi * 105.0 * t) * np.exp(-t / 0.0045)
    burst = rng.standard_normal(len(t)) * (1 - np.exp(-t / 0.0002)) * np.exp(-t / 0.0014)
    click = filt(burst, "bp", 5500.0 + 400 * rng.uniform(-1, 1), 0.6)
    click /= np.sqrt(np.mean(click[:int(0.004 * SR)] ** 2))
    click = filt(soft_clip(click, 2.0), "lp", 11000.0)  # same noise, lower crest factor
    y = tok + 0.55 * ring + 0.3 * ring2 + 0.2 * mid + 0.3 * thump + db(click_db) * 0.5 * click
    y = filt(y, "hp", 60.0)
    return fade(y, fin=0.0003, fout=0.012)


def key_return():
    """80 ms keyboard return / send key: deeper body, longer ring, and a soft
    second click when the key comes back up."""
    rng = np.random.default_rng(1801)
    t = tt(0.08)
    tok = sine(250.0 * (1 + 0.15 * np.exp(-t / 0.002)), t) * np.exp(-t / 0.0095)
    ring = np.sin(2 * np.pi * 985.0 * t + 0.3) * np.exp(-t / 0.0065)
    thump = np.sin(2 * np.pi * 110.0 * t) * np.exp(-t / 0.011)
    click = filt(rng.standard_normal(len(t)), "bp", 4300.0, 0.7) * np.exp(-t / 0.0012)
    y = tok + 0.5 * ring + 0.4 * thump + 0.5 * click / np.abs(click).max()
    up = np.zeros_like(t)
    place(up, 0.35 * key_tick(360.0, 1450.0, -12.0, 0.8, 1802), 0.03)
    y = filt(y + up, "hp", 60.0)
    return fade(y, fin=0.0003, fout=0.015)


def pop(f0, f1, p, seed):
    """Bubbly pop: a sine gliding up about an octave (f0 -> f1) in 85 ms with a
    fast decay, a touch of 2nd harmonic for body and a tiny room. The three
    pops sit slightly left / centre / right so a sequence of cards moves."""
    t = tt(0.14)
    u = np.clip(t / 0.085, 0, 1)
    f = f0 + (f1 - f0) * (1 - (1 - u) ** 1.6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.08 * np.sin(2 * ph)) * (1 - np.exp(-t / 0.0025)) * np.exp(-t / 0.03)
    y = fade(y, fin=0.001)
    out = reverb(pan(y, p), rt60=0.2, wet_db=-16.0, seed=seed, predelay=0.006)[:len(t) + int(0.02 * SR)]
    return fade(filt(out, "hp", 120.0), fout=0.03)


def ding():
    """0.9 s pleasant two-note notification: G#5 then D#6 (a rising fifth, like
    the reference's message chime), struck-bar partials, 85 ms apart."""
    dur = 0.9
    out = np.zeros((int(dur * SR), 2))
    place(out, pan(0.8 * bar_note(hz("G#5"), dur, 0.19, seed=1901), -0.12), 0.0)
    place(out, pan(1.0 * bar_note(hz("D#6"), dur - 0.085, 0.2, seed=1902), 0.12), 0.085)
    out = reverb(out, rt60=0.7, wet_db=-15.0, seed=2901)[:len(out)]
    return fade(filt(out, "hp", 150.0), fout=0.12)


def success():
    """1.45 s bright confirmation for the logo reveal: a rising B major
    arpeggio B5 -> D#6 -> F#6 (+B6 on top, like the reference) on struck bars,
    with a soft sparkle tail shimmering at ~14 Hz."""
    dur = 1.45
    out = np.zeros((int(dur * SR), 2))
    for note, at, amp, p, tau in (("B5", 0.0, 0.72, -0.22, 0.22), ("D#6", 0.09, 0.84, 0.0, 0.26),
                                  ("F#6", 0.18, 1.0, 0.18, 0.4), ("B6", 0.18, 0.42, 0.3, 0.32)):
        place(out, pan(amp * bar_note(hz(note), dur - at, tau, seed=int(hz(note))), p), at)

    def times(rng, count):
        return 0.2 + rng.gamma(2.0, 0.16, count)

    tail = sparkles(dur, 34, 2002, times, level_db=(-30.0, -18.0), tau=(0.04, 0.13))
    t = tt(dur)
    tail *= (1 - 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 14.0 * t)))[:, None]
    out = reverb(out + tail, rt60=1.0, wet_db=-13.0, seed=3002)[:len(out)]
    return fade(filt(out, "hp", 150.0), fout=0.18)


def shimmer():
    """1.0 s sparkle glitter for the sparkle emoji: high sine grains on the
    pentatonic notes (3.3-6.6 kHz), densest around 0.2 s, random pan, over a
    faint airy hiss, in a small bright room."""
    rng = np.random.default_rng(2101)
    dur = 1.0
    t = tt(dur)

    def times(r, count):
        return np.clip(0.01 + r.gamma(2.2, 0.11, count), 0.0, 0.82)

    grains = sparkles(dur, 70, 2102, times, level_db=(-16.0, 0.0), tau=(0.025, 0.11))
    env = smooth(np.where(t < 0.18, db(-30 * (1 - t / 0.18) ** 2), db(-8.686 * (t - 0.18) / 0.25)), 0.02)
    air = stereo_pair(shaped_noise(len(t), log_band(lambda tc: 8500 + 0 * tc, lambda tc: 0.45 + 0 * tc), rng),
                      shaped_noise(len(t), log_band(lambda tc: 8500 + 0 * tc, lambda tc: 0.45 + 0 * tc), rng), 0.2)
    out = grains / np.abs(grains).max() + 0.035 * air * env[:, None]
    out = reverb(out, rt60=0.6, wet_db=-10.0, seed=3101, hf_rt60=0.35)[:len(t)]
    return fade(filt(out, "hp", 600.0), fin=0.002, fout=0.12)


def error():
    """0.5 s 'wrong' double buzz, low and soft: two short pulses, G#3 then
    F#3, a band-limited saw (harmonics up to ~1.6 kHz) with a sub-octave."""
    dur = 0.5
    out = np.zeros(int(dur * SR))
    for at, note, amp in ((0.0, "G#3", 1.0), (0.17, "F#3", 0.85)):
        t = tt(0.12)
        f0 = hz(note) * (1 - 0.03 * t / 0.12)
        ph = 2 * np.pi * np.cumsum(f0) / SR
        y = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 9))
        y += 0.2 * np.sin(0.5 * ph)
        env = (1 - np.exp(-t / 0.006)) * np.exp(-t / 0.15)
        place(out, amp * fade(y * env, fout=0.03), at)
    out = filt(filt(out, "lp", 1600.0), "lp", 2400.0)
    out = reverb(pan(out, 0.0), rt60=0.3, wet_db=-18.0, seed=2201)[:len(out)]
    return fade(filt(out, "hp", 70.0), fin=0.002, fout=0.04)


def glitch():
    """0.42 s digital glitch stutter for the 'broken ad' text: 12-40 ms
    fragments of bit-crushed / sample-rate-reduced tones and noise, stuttered
    repeats and gaps, jumping around the stereo field. Band-limited to
    160 Hz-7.5 kHz (24 dB/oct) so the aliasing grit never turns into hiss."""
    rng = np.random.default_rng(2301)
    dur = 0.42
    n = int(dur * SR)
    out = np.zeros((n, 2))
    pos = 0.0
    prev = None
    notes = [hz(x) for x in ("G#4", "C#5", "D#5", "G#5", "B5")]
    while pos < dur - 0.03:
        seg = rng.choice([0.012, 0.018, 0.024, 0.03, 0.04])
        kind = rng.choice(["tone", "noise", "stutter", "gap"], p=[0.38, 0.22, 0.28, 0.12])
        t = tt(seg)
        if kind == "stutter" and prev is not None:
            frag = prev[:int(rng.choice([0.008, 0.011, 0.015]) * SR)]
            reps = int(rng.integers(2, 5))
            y = np.concatenate([fade(frag, 0.0007, 0.0007)] * reps)
        elif kind == "gap":
            pos += seg * 0.6
            continue
        else:
            if kind == "tone":
                f = rng.choice(notes) * rng.choice([1.0, 2.0])
                ph = 2 * np.pi * f * t
                y = np.sign(np.sin(ph)) * 0.6 + np.sin(3 * ph) * 0.3
            else:
                y = rng.standard_normal(len(t)) * 0.6
            hold = int(rng.choice([2, 3, 4, 6, 8]))  # sample-rate reduction
            y = np.repeat(y[::hold], hold)[:len(t)]
            bits = int(rng.integers(3, 6))  # bit crush
            y = np.round(y * 2 ** (bits - 1)) / 2 ** (bits - 1)
            prev = y
        y = fade(y, 0.0007, 0.0007) * db(rng.uniform(-6.0, 0.0)) * (1 - 0.55 * pos / dur)
        place(out, pan(y, rng.uniform(-0.55, 0.55)), pos)
        pos += len(y) / SR
    out = filt(filt(out, "lp", 7500.0, 0.54), "lp", 7500.0, 1.31)
    out = filt(filt(out, "hp", 160.0, 0.54), "hp", 160.0, 1.31)
    t = tt(dur)
    out *= db(-30.0 * np.clip((t - (dur - 0.12)) / 0.12, 0, 1))[:, None]  # the stutter dies out
    return fade(out, fin=0.001, fout=0.02)


def cash():
    """0.9 s light 'ka-ching': a soft mechanical click ('ka'), then at 50 ms a
    metallic ring on inharmonic plate modes (B6 base, slightly detuned pairs
    so it shimmers) and a few tiny coin jingles, in a small room."""
    rng = np.random.default_rng(2401)
    dur = 0.9
    n = int(dur * SR)
    out = np.zeros((n, 2))

    t = tt(0.06)
    ka = filt(rng.standard_normal(len(t)), "bp", 2600.0, 0.9) * np.exp(-t / 0.0028)
    ka2 = np.zeros_like(t)
    place(ka2, 0.6 * filt(rng.standard_normal(len(t)), "bp", 3400.0, 1.1) * np.exp(-t / 0.002), 0.012)
    clunk = np.sin(2 * np.pi * 150.0 * t) * np.exp(-t / 0.012)
    ka = (ka + ka2) / np.abs(ka).max() + 0.4 * clunk
    place(out, pan(0.45 * fade(ka, 0.0003, 0.01), -0.1), 0.0)

    t = tt(dur - 0.05)
    f0 = hz("B6")
    ring = np.zeros_like(t)
    for ratio, amp, tau in ((1.0, 1.0, 0.21), (1.594, 0.7, 0.17), (2.136, 0.5, 0.14), (2.296, 0.38, 0.12),
                            (2.653, 0.3, 0.1), (3.156, 0.2, 0.075), (3.501, 0.14, 0.06)):
        for detune, a in ((0.0, 1.0), (2.5 + ratio, 0.6)):
            phase = rng.uniform(0, 2 * np.pi)
            ring += amp * a * np.sin(2 * np.pi * (f0 * ratio + detune) * t + phase) * np.exp(-t / tau)
    ring = filt(ring, "lp", 9000.0)
    place(out, pan(fade(ring / np.abs(ring).max(), fin=0.0015), 0.08), 0.05)

    for at in np.sort(rng.uniform(0.08, 0.38, 6)):
        tg = tt(0.06)
        g = sum(np.sin(2 * np.pi * rng.uniform(4200, 7600) * tg) for _ in range(3))
        g *= (1 - np.exp(-tg / 0.0008)) * np.exp(-tg / rng.uniform(0.008, 0.02))
        place(out, pan(0.07 * g, rng.uniform(-0.6, 0.6)), at)
    out = reverb(out, rt60=0.5, wet_db=-14.0, seed=3401)[:n]
    return fade(filt(out, "hp", 120.0), fout=0.2)


# --------------------------------------------------------------------------
# Kit: (file name, builder, target). The target is the sound's intended mix
# level against clip audio at -14 LUFS: K-weighted loudness of its loudest
# 100 ms, in LUFS (the reference ad's whoosh swells sit ~4 LU above its
# programme, taps ~4 LU and key ticks ~8 LU below the whooshes). The targets
# set the kit's balance; the global gain in main() then decides the playback
# volume that reaches them (printed as 'volume').
# --------------------------------------------------------------------------

KIT = [
    ("whoosh-in", whoosh_in, -15.0),
    ("whoosh-out", whoosh_out, -17.0),
    ("swish", swish, -21.0),
    ("sub-hit", sub_hit, -15.0),
    ("boom-meme", boom_meme, -11.0),
    ("tap", tap, -20.0),
    *[(f"key-{i}", (lambda v=v: key_tick(*v)), -23.0) for i, v in enumerate(KEY_VARIANTS)],
    ("key-return", key_return, -21.0),
    ("pop-0", lambda: pop(470.0, hz("B5"), -0.15, 2601), -19.0),
    ("pop-1", lambda: pop(590.0, hz("D#6"), 0.0, 2602), -19.0),
    ("pop-2", lambda: pop(700.0, hz("F#6"), 0.15, 2603), -19.0),
    ("ding", ding, -16.0),
    ("success", success, -15.0),
    ("shimmer", shimmer, -19.0),
    ("error", error, -17.0),
    ("glitch", glitch, -17.0),
    ("cash", cash, -15.0),
]

PEAK_DBFS = -3.0  # the loudest file of the kit peaks here
TRUE_PEAK_MAX = -1.0


def zero_mean(x):
    """Removes any residual mean (DC) with a Hann-shaped correction, so the
    first and last samples stay at exactly 0."""
    w = np.hanning(len(x))[:, None]
    return x - x.mean(axis=0) * w / w.mean()


def kweight(x):
    """ITU-R BS.1770 K-weighting (48 kHz coefficients) of a stereo signal."""
    pre = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
    rlb = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])
    return np.stack([biquad(biquad(x[:, c], *pre), *rlb) for c in range(2)], axis=1)


def loudness_100ms(x):
    """Loudness (LUFS) of the loudest 100 ms: a stable 'how loud is this hit'
    measure for short sound effects."""
    pad = np.zeros((int(0.1 * SR), 2))
    y = kweight(np.concatenate([pad, x, pad]))
    n = int(0.1 * SR)
    c = np.cumsum(np.concatenate([np.zeros((1, 2)), y ** 2]), axis=0)
    return -0.691 + 10 * np.log10(((c[n:] - c[:-n]) / n).sum(axis=1).max() + 1e-20)


def true_peak(x, factor=4):
    """Inter-sample peak estimate by band-limited (FFT) 4x oversampling."""
    size = 1 << (len(x) + 255).bit_length()
    spec = np.fft.rfft(x, size, axis=0)
    up = np.zeros((size * factor // 2 + 1, x.shape[1]), dtype=complex)
    up[:spec.shape[0]] = spec
    return np.abs(np.fft.irfft(up, size * factor, axis=0) * factor).max()


def write_wav(path, x):
    pcm = np.clip(np.round(x * 32767.0), -32768, 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.ascontiguousarray(pcm).tobytes())


def main():
    os.makedirs(OUT, exist_ok=True)
    sounds = []
    for name, build, target in KIT:
        x = build()
        if x.ndim == 1:
            x = np.stack([x, x], axis=1)
        x = zero_mean(fade(x, 0.0002, 0.002))
        x /= np.abs(x).max()
        x *= db(target - loudness_100ms(x))
        sounds.append((name, x))

    # The loudest-sounding file (highest target) peaks at PEAK_DBFS. Short
    # transients (taps, key ticks) have a higher crest factor: their first
    # millisecond is limited to the same ceiling, so no file peaks above it.
    loudest = max(range(len(KIT)), key=lambda i: KIT[i][2])
    gain = db(PEAK_DBFS) / np.abs(sounds[loudest][1]).max()
    print(f"{'file':16s} {'dur s':>6s} {'peak dBFS':>9s} {'TP dBTP':>8s} {'L100 LUFS':>9s} "
          f"{'limited dB':>10s} {'volume':>7s}")
    for (name, x), (_, _, target) in zip(sounds, KIT):
        x = x * gain
        before = np.abs(x).max()
        x = zero_mean(limit(x, db(PEAK_DBFS) * 0.999))
        x *= min(1.0, db(PEAK_DBFS) / np.abs(x).max())
        tp = true_peak(x)
        if tp > db(TRUE_PEAK_MAX):  # safety: never above -1 dBTP
            x *= db(TRUE_PEAK_MAX - 0.05) / tp
            tp = true_peak(x)
        write_wav(os.path.join(OUT, f"{name}.wav"), x)
        level = loudness_100ms(x)
        print(f"{name + '.wav':16s} {len(x) / SR:6.3f} {20 * np.log10(np.abs(x).max()):9.1f} "
              f"{20 * np.log10(tp):8.1f} {level:9.1f} {20 * np.log10(before / np.abs(x).max()):10.1f} "
              f"{db(target - level):7.2f}")
    print(f"global gain {20 * np.log10(gain):+.1f} dB -> {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
