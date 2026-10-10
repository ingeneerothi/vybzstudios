import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, TOP_TEXT } from "../theme";

// Light paper background with a slowly drifting dot grid.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(11,11,11,0.075) 2.2px, transparent 2.6px)",
          backgroundSize: "46px 46px",
          backgroundPosition: `${frame * 0.12}px ${frame * 0.25}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 42%, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)",
        }}
      />
    </AbsoluteFill>
  );
};

// The headline area at the top of a scene; content is centred vertically in it.
export const TopText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      top: TOP_TEXT.top,
      height: TOP_TEXT.height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

// Jitter that changes every `every` frames: the "raté" tremble.
export const useJitter = (seed: string, amount: number, every = 3) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / every);
  return {
    x: (random(`${seed}x${step}`) - 0.5) * 2 * amount,
    y: (random(`${seed}y${step}`) - 0.5) * 2 * amount,
    r: (random(`${seed}r${step}`) - 0.5) * 0.5 * amount,
  };
};

// A rounded card with a dark blurred copy of the clip filling it and the clip
// itself centred on top, never stretched (it keeps its own aspect ratio).
// The card is opaque from its first frame (only scale/position pop), so the
// start of the clip is never hidden by a fade.
export const MediaCard: React.FC<{
  top: number;
  height: number;
  aspect: number; // width / height of the foreground media
  pad?: number;
  background: React.ReactNode;
  children: React.ReactNode;
  shake?: { x: number; y: number; r: number };
}> = ({ top, height, aspect, pad = 32, background, children, shake }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  const width = 960;
  const boxW = width - pad * 2;
  const boxH = height - pad * 2;
  const fgW = Math.min(boxW, boxH * aspect);
  const fgH = fgW / aspect;
  const s = shake ?? { x: 0, y: 0, r: 0 };
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top,
        width,
        height,
        borderRadius: 44,
        overflow: "hidden",
        background: C.night,
        boxShadow:
          "0 30px 70px rgba(20,17,15,0.28), 0 6px 18px rgba(20,17,15,0.18)",
        transform: `translate(${s.x}px, ${s.y + (1 - enter) * 40}px) rotate(${s.r}deg) scale(${0.95 + 0.05 * enter})`,
      }}
    >
      <AbsoluteFill style={{ transform: "scale(1.08)" }}>
        {background}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(12,10,8,0.5)" }} />
      <div
        style={{
          position: "absolute",
          left: (width - fgW) / 2,
          top: (height - fgH) / 2,
          width: fgW,
          height: fgH,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// A keyboard click, `at` frames into the current sequence.
export const Click: React.FC<{
  at: number;
  variant: number;
  volume?: number;
}> = ({ at, variant, volume = 0.55 }) => (
  <Sequence from={at} durationInFrames={12} layout="none">
    <Html5Audio
      src={staticFile(`sfx/click-${variant % 6}.wav`)}
      volume={volume}
    />
  </Sequence>
);
