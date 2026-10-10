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
import {
  Caret,
  CleanText,
  ShakyText,
  typedCount,
  wordCount,
  type Seg,
} from "../components/Text";
import { Click, MediaCard, TopText, useJitter } from "../components/Layout";
import { PersonIcon } from "../components/Icons";
import { REACTION_PLAY } from "../timing";
import { C, FONT } from "../theme";

const media = (name: string) => staticFile(`media/${name}`);

// 1. Hook (0 - 2.5 s): the words land one by one like keystrokes; the whole
// hook is complete at frame 30 (0.5 s) and then stays 2 s.
const HOOK_LINES = [
  ["Tu", "as", "une", "marque."],
  ["Tu", "fais", "de", "la", "pub…"],
];
const HOOK_START = 2;
const HOOK_WORD_GAP = 3;
const HOOK_LINE_GAP = 4;

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let k = 0;
  const appearAt: number[][] = HOOK_LINES.map((line, li) =>
    line.map(() => HOOK_START + k++ * HOOK_WORD_GAP + li * HOOK_LINE_GAP),
  );
  const markerAt = appearAt[1][4] + 14;
  const marker = interpolate(frame, [markerAt, markerAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 100,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: C.ink,
          textAlign: "center",
          marginTop: -80,
        }}
      >
        {HOOK_LINES.map((line, li) => (
          <div key={li} style={{ marginTop: li === 1 ? 36 : 0 }}>
            {line.map((word, wi) => {
              const s = spring({
                frame: frame - appearAt[li][wi],
                fps,
                config: { damping: 13, stiffness: 260, mass: 0.6 },
              });
              const isMarque = li === 0 && wi === 3;
              return (
                <React.Fragment key={wi}>
                  {wi > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      opacity: frame >= appearAt[li][wi] ? 1 : 0,
                      transform: `translateY(${(1 - s) * 26}px) scale(${0.7 + 0.3 * s})`,
                      ...(isMarque
                        ? {
                            backgroundImage: `linear-gradient(${C.yellow}, ${C.yellow})`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "0 88%",
                            backgroundSize: `${marker * 100}% 0.4em`,
                          }
                        : {}),
                    }}
                  >
                    {word}
                  </span>
                </React.Fragment>
              );
            })}
            {li === 1 ? <Caret visible={frame >= appearAt[1][4]} /> : null}
          </div>
        ))}
      </div>
      {appearAt.flat().map((at, i) => (
        <Click key={i} at={at} variant={i} volume={0.6} />
      ))}
    </AbsoluteFill>
  );
};

// 2. Bad ad (2.5 - 7.7 s): the cement clip in full with its own sound.
const BAD_AD_TEXT: Seg[] = [
  { text: "…mais ta pub ressemble " },
  { text: "à ça 😬", color: C.red, strong: true, nowrap: true },
];
const WORD_STAGGER = 4;

// One key click per word of a staggered headline.
const WordClicks: React.FC<{
  segments: Seg[];
  delay?: number;
  volume?: number;
}> = ({ segments, delay = 0, volume = 0.6 }) => (
  <>
    {Array.from({ length: wordCount(segments) }, (_, i) => (
      <Click
        key={i}
        at={delay + i * WORD_STAGGER}
        variant={i + 1}
        volume={volume}
      />
    ))}
  </>
);

export const BadAd: React.FC = () => {
  const shake = useJitter("badad", 3, 4);
  return (
    <AbsoluteFill>
      <TopText>
        <ShakyText
          seed="badad"
          size={92}
          stagger={WORD_STAGGER}
          segments={BAD_AD_TEXT}
        />
      </TopText>
      <WordClicks segments={BAD_AD_TEXT} />
      <MediaCard
        top={590}
        height={1000}
        aspect={560 / 436}
        pad={22}
        shake={shake}
        background={
          <OffthreadVideo src={media("cement-bg.mp4")} muted style={cover} />
        }
      >
        <OffthreadVideo src={media("cement.mp4")} style={fill} />
      </MediaCard>
    </AbsoluteFill>
  );
};

// 3. Reaction (7.7 - 10 s): the clip in full, then its last frame held with a
// slow push-in.
export const Reaction: React.FC = () => {
  const frame = useCurrentFrame();
  const held = frame >= REACTION_PLAY;
  const push = interpolate(frame, [REACTION_PLAY, 138], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <AbsoluteFill>
      <TopText>
        <CleanText
          size={88}
          stagger={2}
          delay={-4}
          segments={[
            { text: "Tes clients quand ils voient " },
            { text: "ta pub :", color: C.red, nowrap: true },
          ]}
        />
      </TopText>
      <MediaCard
        top={590}
        height={1000}
        aspect={480 / 544}
        background={
          held ? (
            <Img src={media("reaction-bg-last.png")} style={cover} />
          ) : (
            <OffthreadVideo
              src={media("reaction-bg.mp4")}
              muted
              style={cover}
            />
          )
        }
      >
        {held ? (
          <Img
            src={media("reaction-last.png")}
            style={{ ...fill, transform: `scale(${push})` }}
          />
        ) : (
          <OffthreadVideo
            src={media("reaction.mp4")}
            style={fill}
            // 3-frame fade so the sound does not stop dead at the cut.
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
      </MediaCard>
    </AbsoluteFill>
  );
};

// 4. No website (10 - 12.5 s): an empty browser, the address gets typed, and
// a red cross is slashed across the empty page.
const URL_TEXT = "www.ta-marque.com";
const URL_START = 14;
const URL_PER_CHAR = 3;
const CROSS_AT = URL_START + URL_TEXT.length * URL_PER_CHAR + 6;

export const NoSite: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = typedCount(frame, URL_START, URL_PER_CHAR, URL_TEXT.length);
  const draw1 = interpolate(frame, [CROSS_AT, CROSS_AT + 8], [0, 1], clamp);
  const draw2 = interpolate(
    frame,
    [CROSS_AT + 6, CROSS_AT + 14],
    [0, 1],
    clamp,
  );
  const hit = interpolate(frame, [CROSS_AT + 14, CROSS_AT + 34], [1, 0], clamp);
  const jitter = useJitter("browser", 2 + 9 * hit, 2);
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <TopText>
        <ShakyText
          seed="nosite"
          size={92}
          delay={-2}
          segments={[
            { text: "Et tu n’as " },
            { text: "même pas", color: C.red, strong: true, nowrap: true },
            { text: " de site web." },
          ]}
        />
      </TopText>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 640,
          width: 880,
          height: 760,
          borderRadius: 36,
          background: C.card,
          border: `5px solid ${C.ink}`,
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(20,17,15,0.18)",
          opacity: enter,
          transform: `translate(${jitter.x}px, ${jitter.y + (1 - enter) * 60}px) rotate(${jitter.r}deg)`,
        }}
      >
        <div
          style={{
            height: 104,
            borderBottom: `5px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            padding: "0 30px",
            gap: 16,
            background: "#ECE9E2",
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                background: c,
                border: `3px solid ${C.ink}`,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 18,
              flex: 1,
              height: 58,
              borderRadius: 29,
              background: C.card,
              border: `4px solid ${C.ink}`,
              display: "flex",
              alignItems: "center",
              padding: "0 26px",
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 34,
              color: C.mute,
            }}
          >
            {URL_TEXT.slice(0, typed)}
            <Caret visible={frame < CROSS_AT + 20} color={C.mute} />
          </div>
        </div>
        <svg
          viewBox="0 0 880 650"
          width={880}
          height={650}
          style={{ display: "block" }}
        >
          {[150, 250, 350].map((y, i) => (
            <rect
              key={i}
              x={110}
              y={y + 10}
              width={i === 2 ? 380 : 660}
              height={34}
              rx={17}
              fill="#EFEDE8"
            />
          ))}
          <g stroke={C.red} strokeWidth={42} strokeLinecap="round">
            <line
              x1={270}
              y1={150}
              x2={610}
              y2={490}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw1}
            />
            <line
              x1={610}
              y1={150}
              x2={270}
              y2={490}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw2}
            />
          </g>
        </svg>
      </div>
      {Array.from(URL_TEXT).map((_, i) => (
        <Click
          key={i}
          at={URL_START + i * URL_PER_CHAR}
          variant={i}
          volume={0.5}
        />
      ))}
    </AbsoluteFill>
  );
};

// 5. Dull poster (12.5 - 15.5 s): the Nivea photo in grey, trembling, while
// the customers in front of it walk away.
const POSTER_TEXT: Seg[] = [
  { text: "Tes affiches attirent " },
  { text: "peu", color: C.red, strong: true },
  { text: " de clients." },
];

// The outer customers leave first so nobody walks through anyone.
const CUSTOMERS = [
  { x: 235, dir: -1, start: 20, size: 156 },
  { x: 395, dir: -1, start: 46, size: 134 },
  { x: 685, dir: 1, start: 52, size: 146 },
  { x: 845, dir: 1, start: 28, size: 128 },
];

export const Poster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const jitter = useJitter("poster", 3.5, 3);
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 150 } });
  return (
    <AbsoluteFill>
      <TopText>
        <ShakyText
          seed="poster"
          size={92}
          stagger={WORD_STAGGER}
          segments={POSTER_TEXT}
        />
      </TopText>
      <WordClicks segments={POSTER_TEXT} />
      <div
        style={{
          position: "absolute",
          left: 270,
          top: 610,
          width: 540,
          padding: 16,
          background: "#F7F7F5",
          boxShadow: "0 26px 60px rgba(20,17,15,0.25)",
          opacity: enter,
          transform: `translate(${jitter.x}px, ${jitter.y + (1 - enter) * 50}px) rotate(${-1.5 + jitter.r}deg)`,
        }}
      >
        <Img
          src={staticFile("images/nivea.webp")}
          style={{
            display: "block",
            width: 508,
            height: 508 * (1269 / 952),
            filter: "grayscale(1) contrast(0.78) brightness(1.04)",
          }}
        />
        <AbsoluteFill style={{ background: "rgba(150,148,142,0.18)" }} />
      </div>
      {CUSTOMERS.map((c, i) => {
        const t = Math.max(0, frame - c.start);
        const dist = t * t * 0.05 + t * 2.2;
        const bob = t > 0 ? -Math.abs(Math.sin(t / 4)) * 9 : 0;
        const lean = t > 0 ? c.dir * 6 : 0;
        const fade = interpolate(dist, [220, 420], [1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - c.size * 0.3 + c.dir * dist,
              top: 1570 - c.size + bob,
              opacity: fade * interpolate(frame, [0, 10], [0, 1], clamp),
              transform: `rotate(${lean}deg)`,
              transformOrigin: "50% 100%",
            }}
          >
            <PersonIcon size={c.size} color={C.ink} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

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
