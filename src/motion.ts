import type React from "react";
import { Easing, interpolate, random } from "remotion";

// One motion language for the whole ad:
// - things arrive with EASE_OUT (fast start, long soft landing) and a blur-in,
// - things leave or zoom through with EASE_IN,
// - the camera drifts slowly with EASE_IN_OUT,
// - only what is "raté" trembles and glitches.
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN = Easing.bezier(0.64, 0, 0.78, 0);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 0 -> 1 between `start` and `start + duration`.
export const ramp = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT,
) =>
  interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });

// The house entrance for text and cards: rise a little out of a blur.
export const blurIn = (
  p: number,
  distance = 28,
  blur = 14,
): React.CSSProperties => ({
  opacity: Math.min(1, p * 1.25),
  transform: `translateY(${(1 - p) * distance}px)`,
  filter: p < 0.995 ? `blur(${(1 - p) * blur}px)` : undefined,
});

// Scene entrance: the scene settles from a slight zoom and blur.
export const sceneIn = (frame: number, duration = 14): React.CSSProperties => {
  const p = ramp(frame, 0, duration);
  return {
    opacity: Math.min(1, 0.15 + p * 1.2),
    transform: `scale(${1.06 - 0.06 * p})`,
    filter: p < 0.995 ? `blur(${(1 - p) * 18}px)` : undefined,
  };
};

// Slow camera drift over a whole scene (nothing is ever perfectly static).
export const drift = (
  frame: number,
  total: number,
  { x = 0, y = -18, scale = 0.035, rotate = 0 } = {},
): string => {
  const t = interpolate(frame, [0, total], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  return `translate(${x * t}px, ${y * t}px) scale(${1 + scale * t}) rotate(${rotate * t}deg)`;
};

// The "raté" tremble: a new random offset every `every` frames.
export const jitter = (
  seed: string,
  frame: number,
  amount: number,
  every = 3,
) => {
  const step = Math.floor(frame / every);
  return {
    x: (random(`${seed}x${step}`) - 0.5) * 2 * amount,
    y: (random(`${seed}y${step}`) - 0.5) * 2 * amount,
    r: (random(`${seed}r${step}`) - 0.5) * 0.6 * amount,
  };
};

// Short glitch bursts (frames where a "raté" element tears sideways).
export const glitchBurst = (
  frame: number,
  start: number,
  every = 56,
  length = 5,
) => frame >= start && (frame - start) % every < length;
