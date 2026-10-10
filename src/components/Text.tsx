import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "../theme";
import { Emoji } from "./BlurText";

export type Seg = {
  text: string;
  color?: string;
  // Yellow marker behind it.
  highlight?: boolean;
  // Gently pulses (used for the ✨).
  twinkle?: boolean;
  // Keep the whole segment on one line.
  nowrap?: boolean;
  // Name of a 3D emoji image in public/emoji, drawn instead of `text`.
  emoji?: string;
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

// Rising headline used by the "Nos réalisations" scene (kept as approved):
// words rise in one after the other and then stay perfectly still.
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
    <div
      style={{
        ...blockStyle(size, weight, color, lineHeight, align),
        ...style,
      }}
    >
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
            {u.seg.emoji ? <Emoji name={u.seg.emoji} /> : u.text}
          </span>
        );
      })}
    </div>
  );
};
