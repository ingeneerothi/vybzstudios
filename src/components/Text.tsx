import React from "react";
import {
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "../theme";

export type Seg = {
  text: string;
  color?: string;
  // ShakyText: shakes twice as hard. CleanText: yellow marker behind it.
  strong?: boolean;
  highlight?: boolean;
  // Gently pulses (used for the ✨).
  twinkle?: boolean;
  // Keep the whole segment on one line.
  nowrap?: boolean;
};

type Unit = { text: string; seg: Seg; index: number };

// Splits segments into wrap units: words, or whole segments marked nowrap.
// Spaces inside a nowrap unit become non-breaking so inline-blocks keep them.
const toUnits = (segments: Seg[]): (Unit | "space")[] => {
  const units: (Unit | "space")[] = [];
  let index = 0;
  segments.forEach((seg) => {
    if (seg.nowrap) {
      units.push({ text: seg.text.replace(/ /g, " "), seg, index: index++ });
      return;
    }
    seg.text.split(/( +)/).forEach((part) => {
      if (part === "") {
        return;
      }
      if (/^ +$/.test(part)) {
        units.push("space");
        return;
      }
      units.push({ text: part, seg, index: index++ });
    });
  });
  return units;
};

const blockStyle = (
  size: number,
  weight: number,
  color: string,
  lineHeight: number,
  align: "center" | "left",
): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight,
  textAlign: align,
  letterSpacing: "-0.02em",
  textWrap: "balance",
});

// Text for what is "raté": every letter trembles on its own, the block wobbles
// and glitches (horizontal tear + red/cyan split) every ~0.9 s.
export const ShakyText: React.FC<{
  segments: Seg[];
  size: number;
  seed: string;
  delay?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  intensity?: number;
  style?: React.CSSProperties;
}> = ({
  segments,
  size,
  seed,
  delay = 0,
  weight = 800,
  color = C.ink,
  lineHeight = 1.12,
  intensity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  const enter = spring({
    frame: f,
    fps,
    config: { damping: 8, stiffness: 170, mass: 0.7 },
  });
  const step = Math.floor(f / 3);
  const burst = f > 16 && f % 54 < 6;
  const tearX = burst ? (random(`${seed}-tx-${step}`) - 0.5) * 34 : 0;
  const skew = burst
    ? (random(`${seed}-sk-${step}`) - 0.5) * 16
    : Math.sin(f / 6) * 1.6 * intensity;
  const split = burst ? 7 : 2;

  let charIndex = 0;
  const units = toUnits(segments);
  return (
    <div
      style={{
        ...blockStyle(size, weight, color, lineHeight, "center"),
        opacity: interpolate(f, [0, 5], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateX(${tearX}px) skewX(${skew}deg) scale(${interpolate(enter, [0, 1], [1.4, 1])})`,
        textShadow: `${-split}px 0 rgba(229,37,27,0.55), ${split}px 0 rgba(0,170,255,0.45)`,
        ...style,
      }}
    >
      {units.map((u, k) => {
        if (u === "space") {
          // A real spacer: plain spaces between per-letter inline-blocks
          // render too narrow. <wbr/> keeps the line break opportunity.
          return (
            <React.Fragment key={k}>
              <span style={{ display: "inline-block", width: "0.3em" }} />
              <wbr />
            </React.Fragment>
          );
        }
        const amp = (u.seg.strong ? 1.8 : 1) * intensity;
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              color: u.seg.color ?? color,
            }}
          >
            {Array.from(u.text).map((ch) => {
              const i = charIndex++;
              const dx = (random(`${seed}-x-${i}-${step}`) - 0.5) * 6 * amp;
              const dy = (random(`${seed}-y-${i}-${step}`) - 0.5) * 7 * amp;
              const rot = (random(`${seed}-r-${i}-${step}`) - 0.5) * 8 * amp;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};

// Text for what is "mieux": words rise in cleanly one after the other and then
// stay perfectly still. Highlighted segments get a yellow marker stroke.
export const CleanText: React.FC<{
  segments: Seg[];
  size: number;
  delay?: number;
  stagger?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  highlightDelay?: number;
  align?: "center" | "left";
  style?: React.CSSProperties;
}> = ({
  segments,
  size,
  delay = 0,
  stagger = 3,
  weight = 800,
  color = C.ink,
  lineHeight = 1.12,
  highlightDelay = 14,
  align = "center",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const units = toUnits(segments);
  const wordCount = units.filter((u) => u !== "space").length;
  const markerStart = delay + wordCount * stagger + highlightDelay;
  const marker = interpolate(frame, [markerStart, markerStart + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ ...blockStyle(size, weight, color, lineHeight, align), ...style }}>
      {units.map((u, k) => {
        if (u === "space") {
          return <span key={k}> </span>;
        }
        const s = spring({
          frame: frame - delay - u.index * stagger,
          fps,
          config: { damping: 18, stiffness: 150, mass: 0.8 },
        });
        const twinkle = u.seg.twinkle
          ? 1 + 0.12 * Math.sin((frame - delay) / 9) ** 2
          : 1;
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              color: u.seg.color ?? color,
              opacity: s,
              transform: `translateY(${(1 - s) * 0.45 * size}px) scale(${twinkle})`,
              ...(u.seg.highlight
                ? {
                    backgroundImage: `linear-gradient(${C.yellow}, ${C.yellow})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "0 86%",
                    backgroundSize: `${marker * 100}% 0.42em`,
                    padding: "0 0.06em",
                    margin: "0 -0.06em",
                  }
                : {}),
            }}
          >
            {u.text}
          </span>
        );
      })}
    </div>
  );
};

// Characters typed one by one from `start`, `perChar` frames apart, with a
// blinking caret while typing and shortly after.
export const typedCount = (frame: number, start: number, perChar: number, length: number) =>
  frame < start ? 0 : Math.min(length, Math.floor((frame - start) / perChar) + 1);

export const Caret: React.FC<{ color?: string; height?: string; visible: boolean }> = ({
  color = C.ink,
  height = "0.9em",
  visible,
}) => {
  const frame = useCurrentFrame();
  const on = visible && Math.floor(frame / 16) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.07em",
        height,
        marginLeft: "0.06em",
        verticalAlign: "-0.08em",
        background: color,
        opacity: on ? 1 : 0,
      }}
    />
  );
};
