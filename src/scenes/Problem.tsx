import React from "react";
import {
  AbsoluteFill,
  Freeze,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BlurText, type Seg } from "../components/BlurText";
import { CaptionCard, FullClip } from "../components/Stage";
import { PersonIcon } from "../components/Icons";
import { Phone } from "../components/Phone";
import {
  Keyboard,
  SafariScreen,
  keyDown,
  typedText,
} from "../components/PhoneUI";
import {
  MegaphoneWidget,
  PostWidget,
  StatsWidget,
  VideoWidget,
} from "../components/Widgets";
import { C, SHADOW, TOP_TEXT } from "../theme";
import { EASE_IN_OUT, clamp, drift, jitter, ramp } from "../motion";
import { REACTION_PLAY, SCENES } from "../timing";

const Headline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

// 1. Hook (0 - 2.75 s): ad widgets float in depth around the two lines.
export const HOOK_WIDGETS = [
  { W: MegaphoneWidget, x: 40, y: 250, r: -9, far: true, at: 0 },
  { W: PostWidget, x: 690, y: 190, r: 7, far: false, at: 5 },
  { W: VideoWidget, x: 70, y: 1330, r: -5, far: false, at: 9 },
  { W: StatsWidget, x: 770, y: 1380, r: 8, far: true, at: 13 },
];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.hook.durationInFrames;
  return (
    <AbsoluteFill
      style={{ transform: drift(frame, total, { y: -14, scale: 0.05 }) }}
    >
      {HOOK_WIDGETS.map(({ W, x, y, r, far, at }, i) => {
        const p = ramp(frame, at, 24);
        const float = Math.sin((frame + i * 40) / 38) * (far ? 10 : 16);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + float,
              opacity: Math.min(1, p * 1.3),
              transform: `translateY(${(1 - p) * 90}px) rotate(${r}deg) scale(${(far ? 0.86 : 1) * (0.9 + 0.1 * p)})`,
              filter: `blur(${(far ? 7 : 0) + (1 - p) * 14}px)`,
            }}
          >
            <W />
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 1100,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${C.bgCenter} 25%, rgba(247,248,251,0) 70%)`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <BlurText
            size={96}
            delay={2}
            stagger={3}
            segments={[
              { text: "Tu as une " },
              { text: "marque.", color: C.accent },
            ]}
          />
          <BlurText
            size={96}
            delay={14}
            stagger={3}
            segments={[
              { text: "Tu fais de la " },
              { text: "pub…", color: C.accent },
            ]}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 2. Bad ad: the cement clip full screen, with its own sound.
const BAD_AD_CAPTION: Seg[] = [
  { text: "…mais ta pub ressemble " },
  { text: "à ça ", emoji: "grimacing", color: C.red, nowrap: true },
];

// First glitch burst of the caption (for the sound design).
export const BAD_AD_GLITCH = 26;
// Frame of the scene where the cement clip cuts to its white end card.
export const CEMENT_END_CARD = 284;

export const BadAd: React.FC = () => (
  <AbsoluteFill>
    <FullClip src="media/cement-full.mp4" />
    <CaptionCard tone="fail" seed="badad" delay={6} segments={BAD_AD_CAPTION} />
  </AbsoluteFill>
);

// 3. Reaction: the clip in full, then its last frame is held with a punch-in
// and a deep "boom".
const REACTION_HELD = REACTION_PLAY - 1;

export const Reaction: React.FC = () => {
  const frame = useCurrentFrame();
  const held = frame >= REACTION_PLAY;
  const punch = ramp(frame, REACTION_PLAY, 10);
  return (
    <AbsoluteFill>
      {held ? (
        <AbsoluteFill
          style={{
            // Punch toward the man's face (top centre of the reframed clip).
            transformOrigin: "47% 16%",
            transform: `scale(${1 + 0.2 * punch}) rotate(${-1.6 * punch}deg)`,
            filter: `saturate(${1 - 0.25 * punch}) contrast(${1 + 0.08 * punch})`,
          }}
        >
          <Freeze frame={REACTION_HELD}>
            <FullClip src="media/reaction-full.mp4" muted />
          </Freeze>
        </AbsoluteFill>
      ) : (
        <FullClip
          src="media/reaction-full.mp4"
          // Short fade so the sound does not stop dead at the freeze.
          volume={(f) =>
            interpolate(
              f,
              [REACTION_PLAY - 6, REACTION_PLAY - 2],
              [1, 0],
              clamp,
            )
          }
        />
      )}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          opacity: punch,
        }}
      />
      <CaptionCard
        tone="clean"
        seed="reaction"
        delay={-2}
        // His face is at the top of the frame: the caption sits low.
        top={1270}
        segments={[
          { text: "Tes clients quand ils voient " },
          { text: "ta pub :", color: C.red, nowrap: true },
        ]}
      />
    </AbsoluteFill>
  );
};

// 4. No website: an address is typed in Safari and the page cannot open.
export const URL = "ta-marque.com";
export const URL_START = 14;
export const URL_PER_CHAR = 3;
export const URL_RETURN = URL_START + URL.length * URL_PER_CHAR + 4;
export const URL_FAIL = URL_RETURN + 28;

export const NoSite: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.noSite.durationInFrames;
  const phoneIn = ramp(frame, 0, 18);
  const kb = 1 - ramp(frame, URL_RETURN + 3, 12, EASE_IN_OUT);
  const loading = interpolate(
    frame,
    [URL_RETURN + 2, URL_FAIL - 2],
    [0, 0.85],
    clamp,
  );
  const failed = frame >= URL_FAIL;
  const shake = jitter(
    "nosite-phone",
    frame,
    9 * (1 - ramp(frame, URL_FAIL, 26)),
    2,
  );
  return (
    <AbsoluteFill>
      <Headline>
        <BlurText
          size={86}
          delay={-2}
          stagger={3}
          fail
          seed="nosite"
          segments={[
            { text: "Et tu n’as " },
            { text: "même pas", color: C.red, nowrap: true },
            { text: " de site web." },
          ]}
        />
      </Headline>
      <AbsoluteFill
        style={{ transform: drift(frame, total, { y: -10, scale: 0.04 }) }}
      >
        <Phone
          style={{
            left: (1080 - 653) / 2,
            top: 548,
            opacity: Math.min(1, phoneIn * 1.4),
            transform: `translate(${failed ? shake.x : 0}px, ${(1 - phoneIn) * 120 + (failed ? shake.y : 0)}px) scale(0.88) rotate(${failed ? shake.r : 0}deg)`,
            transformOrigin: "50% 0%",
          }}
        >
          <SafariScreen
            frame={frame}
            url={typedText(frame, URL_START, URL_PER_CHAR, URL)}
            caretOn={frame < URL_RETURN && Math.floor(frame / 16) % 2 === 0}
            loading={failed ? 0 : loading}
            failAt={URL_FAIL}
          />
          <Keyboard
            returnLabel="aller"
            pressed={
              frame >= URL_RETURN && frame < URL_RETURN + 6
                ? "return"
                : keyDown(frame, URL_START, URL_PER_CHAR, URL)
            }
            slide={kb}
          />
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 5. Dull poster: the Nivea photo in grey trembles while the customers in
// front of it walk away (the outer ones first, so nobody crosses).
export const CUSTOMERS = [
  { x: 210, dir: -1, start: 24, size: 150 },
  { x: 380, dir: -1, start: 50, size: 130 },
  { x: 700, dir: 1, start: 56, size: 142 },
  { x: 870, dir: 1, start: 30, size: 124 },
];

export const Poster: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.poster.durationInFrames;
  const j = jitter("poster", frame, 3.5);
  const inP = ramp(frame, 0, 18);
  return (
    <AbsoluteFill>
      <Headline>
        <BlurText
          size={86}
          delay={-2}
          stagger={3}
          fail
          seed="poster"
          segments={[
            { text: "Tes affiches attirent " },
            { text: "peu", color: C.red },
            { text: " de clients." },
          ]}
        />
      </Headline>
      <AbsoluteFill
        style={{ transform: drift(frame, total, { y: -12, scale: 0.04 }) }}
      >
        <div
          style={{
            position: "absolute",
            left: 280,
            top: 600,
            width: 520,
            padding: 16,
            background: "#F7F7F5",
            boxShadow: SHADOW,
            opacity: Math.min(1, inP * 1.4),
            transform: `translate(${j.x}px, ${j.y + (1 - inP) * 80}px) rotate(${-2 + j.r}deg)`,
            filter: inP < 0.99 ? `blur(${(1 - inP) * 12}px)` : undefined,
          }}
        >
          <Img
            src={staticFile("images/nivea.webp")}
            style={{
              display: "block",
              width: 488,
              height: 488 * (1269 / 952),
              filter: "grayscale(1) contrast(0.78) brightness(1.04)",
            }}
          />
          <AbsoluteFill style={{ background: "rgba(150,148,142,0.18)" }} />
        </div>
        {CUSTOMERS.map((c, i) => {
          const t = Math.max(0, frame - c.start);
          const dist = t * t * 0.06 + t * 2.4;
          const speed = 0.12 * t + 2.4;
          const bob = t > 0 ? -Math.abs(Math.sin(t / 4)) * 9 : 0;
          const fade = interpolate(dist, [200, 400], [1, 0], clamp);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.x - c.size * 0.3 + c.dir * dist,
                top: 1580 - c.size + bob,
                opacity: fade * Math.min(1, inP * 1.4),
                transform: `rotate(${t > 0 ? c.dir * 6 : 0}deg)`,
                transformOrigin: "50% 100%",
                filter:
                  t > 0 ? `blur(${Math.min(6, speed * 0.6)}px)` : undefined,
              }}
            >
              <PersonIcon size={c.size} color={C.ink} />
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
