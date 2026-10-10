import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CleanText } from "../components/Text";
import { Glow } from "../components/Stage";
import { Phone, SCREEN_W } from "../components/Phone";
import { WORK_SWITCH } from "../timing";
import { C, FONT, W } from "../theme";

// "Nos réalisations", kept as the client approved it: one phone; Cut & Care
// "Avant / Après" (5 s, muted) then the Bubble Tea poster slides in with a
// slow zoom. Only the glow colour (palette) and the ✨ (3D emoji) changed.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cover: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

export const SWAP_AT = WORK_SWITCH - 6;
const PHONE_TOP = 446;

const Caption: React.FC<{ text: string; opacity: number }> = ({
  text,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 330,
      display: "flex",
      justifyContent: "center",
      opacity,
    }}
  >
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 44,
        color: C.ink,
        background: C.card,
        borderRadius: 48,
        padding: "14px 38px",
        boxShadow: "0 10px 26px rgba(20,17,15,0.12)",
        transform: `translateY(${(1 - opacity) * 16}px)`,
      }}
    >
      {text}
    </div>
  </div>
);

export const Work: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame + 2,
    fps,
    config: { damping: 15, stiffness: 190 },
  });
  const swap = spring({
    frame: frame - SWAP_AT,
    fps,
    config: { damping: 20, stiffness: 160 },
  });
  const showPoster = frame >= SWAP_AT;
  const zoom = interpolate(frame, [SWAP_AT, SWAP_AT + 186], [1, 1.09], clamp);
  const phoneLeft = (W - (SCREEN_W + 32)) / 2;
  const caption1 =
    spring({ frame: frame - 4, fps, config: { damping: 18 } }) *
    interpolate(frame, [SWAP_AT - 10, SWAP_AT], [1, 0], clamp);
  const caption2 = spring({
    frame: frame - SWAP_AT - 2,
    fps,
    config: { damping: 18 },
  });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 196 }}>
        <CleanText
          size={96}
          delay={-4}
          segments={[
            { text: "Nos réalisations " },
            { text: "✨", emoji: "sparkles", twinkle: true },
          ]}
        />
      </div>
      <Caption text="Pub vidéo · Cut & Care Styling" opacity={caption1} />
      {showPoster ? (
        <Caption text="Affiche · Bubble Tea" opacity={caption2} />
      ) : null}
      <Glow y={PHONE_TOP + 570} size={1500} opacity={0.75} />
      <Phone
        style={{
          left: phoneLeft,
          top: PHONE_TOP,
          opacity: interpolate(frame, [0, 3], [0.4, 1], clamp),
          transform: `translateY(${(1 - pop) * 70}px) scale(${0.92 + 0.08 * pop})`,
        }}
      >
        <OffthreadVideo
          src={staticFile("media/cutcare-avant-apres.mp4")}
          muted
          style={{ ...cover, display: "block" }}
        />
        {showPoster ? (
          <AbsoluteFill
            style={{
              transform: `translateX(${(1 - swap) * SCREEN_W}px)`,
              background: C.night,
            }}
          >
            <Img
              src={staticFile("media/bubble-tea-bg.jpg")}
              style={{ ...cover, transform: "scale(1.1)" }}
            />
            <AbsoluteFill
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <Img
                src={staticFile("images/bubble-tea.webp")}
                style={{
                  width: SCREEN_W,
                  height: SCREEN_W * (1307 / 924),
                  transform: `scale(${zoom})`,
                  boxShadow: "0 0 60px rgba(0,0,0,0.6)",
                }}
              />
            </AbsoluteFill>
          </AbsoluteFill>
        ) : null}
      </Phone>
    </AbsoluteFill>
  );
};
