import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { glitchBurst, jitter, ramp } from "../motion";

export type Seg = {
  text: string;
  color?: string;
  // Keep the whole segment on one line.
  nowrap?: boolean;
  // Name of a 3D emoji image in public/emoji (drawn inline, iPhone-like).
  emoji?: string;
};

type Unit = { text: string; seg: Seg; index: number } | "space";

const toUnits = (segments: Seg[]): Unit[] => {
  const units: Unit[] = [];
  let index = 0;
  segments.forEach((seg) => {
    if (seg.emoji || seg.nowrap) {
      units.push({ text: seg.text, seg, index: index++ });
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

export const wordCount = (segments: Seg[]) =>
  toUnits(segments).filter((u) => u !== "space").length;

export const Emoji: React.FC<{ name: string; size?: string }> = ({
  name,
  size = "1.08em",
}) => (
  <Img
    src={staticFile(`emoji/${name}.png`)}
    style={{
      display: "inline-block",
      width: size,
      height: size,
      verticalAlign: "-0.2em",
      objectFit: "contain",
    }}
  />
);

// Headline text. Each word rises out of a blur, `stagger` frames apart.
// With `fail`, the whole block trembles once it is in and tears sideways in
// short glitch bursts (red/cyan split): the look of everything "raté".
export const BlurText: React.FC<{
  segments: Seg[];
  size: number;
  delay?: number;
  stagger?: number;
  duration?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  align?: "center" | "left";
  fail?: boolean;
  seed?: string;
  style?: React.CSSProperties;
}> = ({
  segments,
  size,
  delay = 0,
  stagger = 4,
  duration = 18,
  weight = 700,
  color = C.ink,
  lineHeight = 1.12,
  align = "center",
  fail = false,
  seed = "text",
  style,
}) => {
  const frame = useCurrentFrame();
  const units = toUnits(segments);
  const words = units.filter((u) => u !== "space").length;
  const settled = delay + (words - 1) * stagger + duration;
  let failStyle: React.CSSProperties = {};
  if (fail) {
    const j = jitter(seed, frame, size * 0.022);
    const burst = glitchBurst(frame, settled);
    const step = Math.floor(frame / 2);
    const tear = burst ? (random(`${seed}t${step}`) - 0.5) * size * 0.4 : 0;
    const split = burst ? size * 0.07 : size * 0.018;
    failStyle = {
      transform: `translate(${j.x + tear}px, ${j.y}px) rotate(${j.r}deg) skewX(${burst ? (random(`${seed}k${step}`) - 0.5) * 14 : 0}deg)`,
      textShadow: `${-split}px 0 rgba(255,59,48,0.55), ${split}px 0 rgba(0,180,255,0.45)`,
    };
  }
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        letterSpacing: "-0.03em",
        color,
        textAlign: align,
        textWrap: "balance",
        ...failStyle,
        ...style,
      }}
    >
      {units.map((u, k) => {
        if (u === "space") {
          return (
            <React.Fragment key={k}>
              <span style={{ display: "inline-block", width: "0.27em" }} />
              <wbr />
            </React.Fragment>
          );
        }
        const p = ramp(frame, delay + u.index * stagger, duration);
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              color: u.seg.color ?? color,
              opacity: Math.min(1, p * 1.3),
              transform: `translateY(${(1 - p) * size * 0.3}px)`,
              filter:
                p < 0.995 ? `blur(${(1 - p) * size * 0.15}px)` : undefined,
            }}
          >
            {u.seg.emoji ? (
              <>
                {u.text}
                <Emoji name={u.seg.emoji} />
              </>
            ) : (
              u.text
            )}
          </span>
        );
      })}
    </div>
  );
};
