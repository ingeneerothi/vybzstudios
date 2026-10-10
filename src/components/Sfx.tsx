import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { FPS } from "../timing";

// Sound-effect kit (public/sfx, made by scripts/make-sfx.py).
// `peak` is where the main hit sits inside the file (seconds), so a sound can
// be placed by its peak; `volume` is its level in the mix.
export const SFX = {
  "whoosh-in": { peak: 0.65, length: 0.95, volume: 0.55 },
  "whoosh-out": { peak: 0.12, length: 0.65, volume: 0.5 },
  swish: { peak: 0.06, length: 0.3, volume: 0.45 },
  "sub-hit": { peak: 0.0, length: 1.25, volume: 0.7 },
  "boom-meme": { peak: 0.0, length: 1.65, volume: 0.75 },
  tap: { peak: 0.0, length: 0.06, volume: 0.6 },
  "key-0": { peak: 0.0, length: 0.05, volume: 0.45 },
  "key-1": { peak: 0.0, length: 0.05, volume: 0.45 },
  "key-2": { peak: 0.0, length: 0.05, volume: 0.45 },
  "key-3": { peak: 0.0, length: 0.05, volume: 0.45 },
  "key-return": { peak: 0.0, length: 0.08, volume: 0.55 },
  "pop-0": { peak: 0.0, length: 0.12, volume: 0.45 },
  "pop-1": { peak: 0.0, length: 0.12, volume: 0.45 },
  "pop-2": { peak: 0.0, length: 0.12, volume: 0.45 },
  ding: { peak: 0.0, length: 0.95, volume: 0.45 },
  success: { peak: 0.0, length: 1.45, volume: 0.5 },
  shimmer: { peak: 0.2, length: 1.05, volume: 0.35 },
  error: { peak: 0.0, length: 0.55, volume: 0.5 },
  glitch: { peak: 0.0, length: 0.45, volume: 0.4 },
  cash: { peak: 0.05, length: 0.95, volume: 0.55 },
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
