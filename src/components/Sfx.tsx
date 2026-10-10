import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { FPS } from "../timing";

// Sound-effect kit (public/sfx, made by scripts/make-sfx.py, balanced by
// loudness). `peak` is where the main hit sits inside the file (seconds), so
// a sound can be placed by its peak; `volume` is its base level in the mix
// (each cue scales it with `gain`).
export const SFX = {
  "whoosh-in": { peak: 0.65, length: 0.95, volume: 0.78 },
  "whoosh-out": { peak: 0.12, length: 0.62, volume: 0.78 },
  swish: { peak: 0.08, length: 0.26, volume: 0.78 },
  "sub-hit": { peak: 0.0, length: 1.25, volume: 0.78 },
  "boom-meme": { peak: 0.0, length: 1.65, volume: 0.78 },
  tap: { peak: 0.0, length: 0.05, volume: 0.8 },
  "key-0": { peak: 0.0, length: 0.05, volume: 0.78 },
  "key-1": { peak: 0.0, length: 0.05, volume: 0.79 },
  "key-2": { peak: 0.0, length: 0.05, volume: 0.83 },
  "key-3": { peak: 0.0, length: 0.05, volume: 0.81 },
  "key-return": { peak: 0.0, length: 0.08, volume: 0.78 },
  "pop-0": { peak: 0.0, length: 0.16, volume: 0.78 },
  "pop-1": { peak: 0.0, length: 0.16, volume: 0.78 },
  "pop-2": { peak: 0.0, length: 0.16, volume: 0.78 },
  ding: { peak: 0.0, length: 0.9, volume: 0.78 },
  success: { peak: 0.2, length: 1.45, volume: 0.78 },
  shimmer: { peak: 0.23, length: 1.0, volume: 0.78 },
  error: { peak: 0.0, length: 0.5, volume: 0.78 },
  glitch: { peak: 0.0, length: 0.42, volume: 0.78 },
  cash: { peak: 0.05, length: 0.9, volume: 0.78 },
} as const;

export type SfxName = keyof typeof SFX;

// Plays a sound effect `at` a frame of the current sequence: its start, or
// its peak when `align` is "peak" (whooshes land their peak on the cut).
export const Sfx: React.FC<{
  name: SfxName;
  at: number;
  align?: "start" | "peak";
  gain?: number;
}> = ({ name, at, align = "start", gain = 1 }) => {
  const s = SFX[name];
  const from = align === "peak" ? at - Math.round(s.peak * FPS) : at;
  return (
    <Sequence
      from={from}
      durationInFrames={Math.ceil(s.length * FPS) + 2}
      layout="none"
      name={`sfx ${name}`}
    >
      <Html5Audio
        src={staticFile(`sfx/${name}.wav`)}
        volume={s.volume * gain}
      />
    </Sequence>
  );
};

const KEYS: SfxName[] = ["key-0", "key-1", "key-2", "key-3"];

// One soft key tick per typed character (spaces included, like a phone).
export const TypingSfx: React.FC<{
  start: number;
  perChar: number;
  text: string;
  gain?: number;
}> = ({ start, perChar, text, gain = 1 }) => (
  <>
    {Array.from(text).map((_, i) => (
      <Sfx
        key={i}
        name={KEYS[i % KEYS.length]}
        at={start + i * perChar}
        gain={gain}
      />
    ))}
  </>
);
