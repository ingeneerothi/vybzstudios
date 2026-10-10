import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caret, CleanText, typedCount } from "../components/Text";
import { Click, MediaCard, TopText } from "../components/Layout";
import { LogoIcon, HorizontalLogo, Wordmark } from "../components/Logo";
import {
  ChatPhoneIcon,
  MotionIcon,
  PosterIcon,
  WebIcon,
} from "../components/Icons";
import { Phone, SCREEN_W } from "../components/Phone";
import { SCENES, WORK_SWITCH } from "../timing";
import { C, FONT, W } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fill: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
};
const cover: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

// Warm light behind what Vybz Studios brings.
const Glow: React.FC<{ y: number; size: number; opacity?: number }> = ({
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
        "radial-gradient(circle, rgba(255,214,10,0.55) 0%, rgba(255,214,10,0.22) 38%, rgba(255,214,10,0) 70%)",
    }}
  />
);

// 6. The solution (15.5 - 18 s): white flash, then the logo zooms in out of
// the light and settles, perfectly still; a shine runs across VYBZ. The
// subtitle is complete by frame 21 so it stays on screen for over 2 s.
const REVEAL_SUB_DELAY = 12;
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, 4, 18], [1, 1, 0], clamp);
  const burst = interpolate(frame, [0, 22], [0.2, 2.6], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const zoom = spring({
    frame: frame - 3,
    fps,
    config: { damping: 15, stiffness: 95, mass: 0.9 },
  });
  const blur = interpolate(frame, [3, 20], [16, 0], clamp);
  const v = interpolate(frame, [12, 30], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const shine = interpolate(frame, [26, 62], [-60, 160], clamp);
  const rays = frame * 0.25;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-conic-gradient(from ${rays}deg at 50% 41%, rgba(255,214,10,0.20) 0deg 5deg, rgba(255,214,10,0) 5deg 15deg)`,
          WebkitMaskImage:
            "radial-gradient(circle at 50% 41%, black 0%, transparent 55%)",
          maskImage:
            "radial-gradient(circle at 50% 41%, black 0%, transparent 55%)",
          opacity: interpolate(frame, [4, 24], [0, 1], clamp),
        }}
      />
      <Glow
        y={790}
        size={1300}
        opacity={interpolate(frame, [0, 20], [0, 1], clamp)}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 470,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: interpolate(frame, [3, 10], [0, 1], clamp),
          transform: `scale(${interpolate(zoom, [0, 1], [2.3, 1])})`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        }}
      >
        <LogoIcon height={330} vProgress={v} />
        <div style={{ marginTop: 64 }}>
          <Wordmark
            size={206}
            studiosScale={0.255}
            vybzStyle={{
              backgroundImage: `linear-gradient(105deg, ${C.ink} 0%, ${C.ink} 40%, #8a8a8a 47%, #ffffff 50%, #8a8a8a 53%, ${C.ink} 60%, ${C.ink} 100%)`,
              backgroundSize: "300% 100%",
              backgroundPosition: `${100 - shine}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1250 }}>
        <CleanText
          delay={REVEAL_SUB_DELAY}
          stagger={3}
          size={84}
          weight={700}
          segments={[
            { text: "est là pour " },
            { text: "t’aider.", highlight: true },
          ]}
        />
      </div>
      <Click at={8} variant={3} volume={0.9} />
      {[0, 1, 2, 3].map((i) => (
        <Click
          key={i}
          at={REVEAL_SUB_DELAY + i * 3}
          variant={i}
          volume={0.55}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 500 * burst,
          top: 790 - 500 * burst,
          width: 1000 * burst,
          height: 1000 * burst,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,250,220,0.9) 40%, rgba(255,255,255,0) 70%)",
          opacity: interpolate(frame, [0, 22], [1, 0], clamp),
        }}
      />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
    </AbsoluteFill>
  );
};

// 7. Relief (18 - 21.6 s): the girl's clip in full, clean and stable.
const GIRL_END = SCENES.relief.durationInFrames;
export const Relief: React.FC = () => (
  <AbsoluteFill>
    <TopText>
      <CleanText
        size={82}
        stagger={2}
        delay={-4}
        segments={[
          { text: "Les vendeurs qui ont enfin trouvé " },
          { text: "Vybz Studios :", highlight: true, nowrap: true },
        ]}
      />
    </TopText>
    <Glow y={1090} size={1400} opacity={0.6} />
    <MediaCard
      top={600}
      height={960}
      aspect={256 / 248}
      background={
        <OffthreadVideo
          src={staticFile("media/girl-bg.mp4")}
          muted
          style={cover}
        />
      }
    >
      <OffthreadVideo
        src={staticFile("media/girl.mp4")}
        style={fill}
        // Short fade so the sound does not stop dead at the cut.
        volume={(f) =>
          interpolate(f, [GIRL_END - 6, GIRL_END - 1], [1, 0], clamp)
        }
      />
    </MediaCard>
  </AbsoluteFill>
);

// 8. Services (21.6 - 25.6 s): three cards, one by one.
const SERVICES = [
  { label: "Motion design", Icon: MotionIcon },
  { label: "Web design", Icon: WebIcon },
  { label: "Affiches\npublicitaires", Icon: PosterIcon },
];
const SERVICE_AT = [14, 62, 110];

export const Services: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 250 }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.32em",
            color: C.mute,
            textAlign: "center",
            opacity: interpolate(frame, [0, 10], [0, 1], clamp),
          }}
        >
          VYBZ STUDIOS
        </div>
        <CleanText
          size={110}
          delay={-2}
          segments={[{ text: "Nos " }, { text: "services", highlight: true }]}
          style={{ marginTop: 14 }}
        />
      </div>
      {SERVICES.map(({ label, Icon }, i) => {
        const at = SERVICE_AT[i];
        const s = spring({
          frame: frame - at,
          fps,
          config: { damping: 17, stiffness: 160 },
        });
        const draw = interpolate(frame, [at + 4, at + 26], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        });
        const ring = interpolate(frame, [at, at + 24], [1, 0], clamp);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 80,
              width: 920,
              top: 600 + i * 270,
              height: 230,
              borderRadius: 40,
              background: C.card,
              display: "flex",
              alignItems: "center",
              gap: 44,
              padding: "0 36px",
              boxShadow: `0 22px 50px rgba(20,17,15,0.12), 0 0 0 ${6 * ring}px rgba(255,214,10,${0.9 * ring})`,
              opacity: s,
              transform: `translateX(${(1 - s) * 160}px)`,
            }}
          >
            <div
              style={{
                width: 164,
                height: 164,
                flex: "none",
                borderRadius: 38,
                background: C.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={118} progress={draw} />
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 72,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: C.ink,
                whiteSpace: "pre-line",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
      {SERVICE_AT.map((at, i) => (
        <Click key={i} at={at} variant={i + 2} volume={0.7} />
      ))}
    </AbsoluteFill>
  );
};

// 9 + 10. Our work (25.6 - 33.6 s): one phone; Cut & Care "Avant / Après"
// (5 s, muted) then the Bubble Tea poster slides in with a slow zoom. The
// phone pops in within a few frames so the first "Avant" shot is visible.
const SWAP_AT = WORK_SWITCH - 6;
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
            { text: "✨", twinkle: true },
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

// 11. Call to action (33.6 - 37 s). Everything stays until the very end.
const PHONE_NUMBER = "01 53 37 10 00";
const NUMBER_START = 40;
const NUMBER_PER_CHAR = 3;

export const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({
    frame: frame + 4,
    fps,
    config: { damping: 15, stiffness: 140 },
  });
  const pillIn = spring({
    frame: frame - 26,
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const typed = typedCount(
    frame,
    NUMBER_START,
    NUMBER_PER_CHAR,
    PHONE_NUMBER.length,
  );
  const typedEnd = NUMBER_START + PHONE_NUMBER.length * NUMBER_PER_CHAR;
  const pulseT = Math.max(0, frame - typedEnd) % 50;
  const pulse = frame > typedEnd ? interpolate(pulseT, [0, 50], [0, 1]) : 0;
  return (
    <AbsoluteFill>
      <Glow y={1060} size={1500} opacity={0.7} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          display: "flex",
          justifyContent: "center",
          opacity: logoIn,
          transform: `translateY(${(1 - logoIn) * -40}px) scale(${0.85 + 0.15 * logoIn})`,
        }}
      >
        <HorizontalLogo size={104} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 640 }}>
        <CleanText
          size={104}
          delay={4}
          stagger={4}
          lineHeight={1.08}
          segments={[
            { text: "Contacte " },
            { text: "Vybz Studios", highlight: true, nowrap: true },
          ]}
        />
        <CleanText
          size={74}
          weight={700}
          delay={20}
          segments={[{ text: "sur WhatsApp :" }]}
          style={{ marginTop: 22 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          width: 940,
          top: 1100,
          height: 164,
          borderRadius: 82,
          background: `linear-gradient(180deg, ${C.greenDeep}, ${C.greenDark})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px",
          gap: 26,
          boxShadow: `0 26px 60px rgba(17,156,75,0.35), 0 0 0 ${pulse * 26}px rgba(37,211,102,${0.35 * (1 - pulse)})`,
          opacity: pillIn,
          transform: `scale(${0.8 + 0.2 * pillIn})`,
        }}
      >
        <ChatPhoneIcon size={100} bg={C.greenDeep} />
        {/* The untyped digits are laid out invisibly so the centred number
            does not shift while it is being typed. */}
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 86,
            letterSpacing: "-0.01em",
            color: "#FFFFFF",
            whiteSpace: "pre",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {PHONE_NUMBER.slice(0, typed)}
          <Caret
            visible={frame >= NUMBER_START && frame < typedEnd + 40}
            color="#FFFFFF"
          />
          <span style={{ color: "transparent" }}>
            {PHONE_NUMBER.slice(typed)}
          </span>
        </div>
      </div>
      {Array.from(PHONE_NUMBER).map((ch, i) =>
        ch === " " ? null : (
          <Click
            key={i}
            at={NUMBER_START + i * NUMBER_PER_CHAR}
            variant={i}
            volume={0.75}
          />
        ),
      )}
    </AbsoluteFill>
  );
};
