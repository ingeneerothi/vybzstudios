import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, SHADOW, W } from "../theme";
import { EASE_OUT, clamp, glitchBurst, jitter, ramp } from "../motion";
import { BlurText, type Seg } from "./BlurText";

// Light studio background: cool radial gradient with two soft violet lights
// drifting slowly behind everything.
export const StudioBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 65% at 50% 45%, ${C.bgCenter} 0%, ${C.paper} 55%, ${C.bgEdge} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: -380 + Math.sin(t * 0.35) * 60,
          top: -260 + Math.cos(t * 0.3) * 50,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(91,60,246,0.13) 0%, rgba(91,60,246,0) 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          right: -460 + Math.cos(t * 0.28) * 70,
          bottom: -420 + Math.sin(t * 0.33) * 60,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(91,60,246,0.10) 0%, rgba(91,60,246,0) 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Violet light behind what Vybz Studios brings.
export const Glow: React.FC<{ y: number; size: number; opacity?: number }> = ({
  y,
  size,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: W / 2 - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      opacity,
      background:
        "radial-gradient(circle, rgba(91,60,246,0.30) 0%, rgba(91,60,246,0.12) 38%, rgba(91,60,246,0) 70%)",
    }}
  />
);

// A meme clip shown full screen (the files are already reframed to 9:16).
// It lands with a short zoom punch but is visible from its first frame.
export const FullClip: React.FC<{
  src: string;
  muted?: boolean;
  volume?: (f: number) => number;
  style?: React.CSSProperties;
}> = ({ src, muted, volume, style }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, 0, 12);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${1.1 - 0.1 * p})`,
          filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined,
          ...style,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          muted={muted}
          volume={volume}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* Soft shade under the caption. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 32%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Caption card over a full-screen clip. "fail" captions tremble and glitch;
// "clean" captions stay perfectly still once in.
export const CaptionCard: React.FC<{
  segments: Seg[];
  tone: "fail" | "clean";
  delay?: number;
  size?: number;
  seed: string;
  top?: number;
}> = ({ segments, tone, delay = 0, size = 70, seed, top = 200 }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, delay, 16);
  let wobble = "";
  let shadow = SHADOW;
  if (tone === "fail" && p >= 1) {
    const j = jitter(seed, frame, 3);
    const burst = glitchBurst(frame, delay + 20);
    const tear = burst ? Math.sin(frame * 7.3) * 26 : 0;
    wobble = `translate(${j.x + tear}px, ${j.y}px) rotate(${j.r}deg)`;
    if (burst) {
      shadow = `${-10}px 0 0 rgba(255,59,48,0.7), 10px 0 0 rgba(0,180,255,0.6)`;
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: W - 100,
          padding: "30px 44px 34px",
          borderRadius: 40,
          background: "rgba(255,255,255,0.97)",
          boxShadow: shadow,
          opacity: Math.min(1, p * 1.4),
          transform: `${wobble} translateY(${(1 - p) * -30}px) scale(${0.92 + 0.08 * p})`,
          filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined,
        }}
      >
        <BlurText
          segments={segments}
          size={size}
          delay={delay + 2}
          stagger={3}
          duration={14}
          seed={seed}
        />
      </div>
    </div>
  );
};

// Fades a value in and out over [a, b] with short eased ramps.
export const inOut = (frame: number, a: number, b: number, edge = 10) =>
  interpolate(frame, [a, a + edge, b - edge, b], [0, 1, 1, 0], {
    ...clamp,
    easing: EASE_OUT,
  });
