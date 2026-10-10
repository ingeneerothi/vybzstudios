import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BlurText, Emoji } from "../components/BlurText";
import { CaptionCard, FullClip, Glow } from "../components/Stage";
import { HorizontalLogo, LogoIcon } from "../components/Logo";
import {
  ChatPhoneIcon,
  MotionIcon,
  PosterIcon,
  WebIcon,
} from "../components/Icons";
import { Phone } from "../components/Phone";
import {
  Caret,
  Keyboard,
  RESULT_BOX,
  SearchScreen,
  TapRipple,
  keyDown,
  typedText,
} from "../components/PhoneUI";
import { C, FONT, SHADOW, W } from "../theme";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, clamp, drift, ramp } from "../motion";
import { SCENES } from "../timing";

// ---------------------------------------------------------------------------
// 6. Search: "vybz studios" is typed in the browser, the result is tapped and
// the camera dives into it (the logo appears on the other side).
export const QUERY = "vybz studios";
export const SEARCH = {
  tapField: 8,
  typeStart: 20,
  perChar: 3,
  enter: 60,
  results: 66,
  tapResult: 92,
  diveStart: 100,
};

const PHONE_X = (1080 - 653) / 2;
const PHONE_Y = (1920 - 1136) / 2;
// Screen point -> composition point.
const toFrame = (x: number, y: number) => ({
  x: PHONE_X + 16 + x,
  y: PHONE_Y + 16 + y,
});
const FIELD = toFrame(300, 239);
const RESULT = toFrame(
  RESULT_BOX.x + RESULT_BOX.w / 2,
  RESULT_BOX.y + RESULT_BOX.h / 2,
);

// Camera keyframes as translate(X, Y) scale(S) with origin 0 0. Keeping
// X = fx (1 - S) and Y = fy (1 - S) holds the point (fx, fy) still.
const camAt = (fx: number, fy: number, s: number, tx = fx, ty = fy) => ({
  s,
  x: tx - fx * s,
  y: ty - fy * s,
});

export const Search: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.search.durationInFrames;
  const k0 = camAt(540, 960, 0.94);
  const k1 = camAt(FIELD.x, FIELD.y, 1.16, 540, 760);
  const k2 = camAt(RESULT.x, RESULT.y, 1.02);
  const k3 = camAt(RESULT.x, RESULT.y, 7.5);
  let cam = k0;
  const lerp = (a: typeof k0, b: typeof k0, t: number) => ({
    s: a.s + (b.s - a.s) * t,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  if (frame < SEARCH.enter) {
    cam = lerp(k0, k1, ramp(frame, 0, SEARCH.enter, EASE_IN_OUT));
  } else if (frame < SEARCH.diveStart) {
    cam = lerp(k1, k2, ramp(frame, SEARCH.enter, 28, EASE_IN_OUT));
  } else {
    cam = lerp(
      k2,
      k3,
      ramp(frame, SEARCH.diveStart, total - SEARCH.diveStart, EASE_IN),
    );
  }
  const dive = ramp(frame, total - 16, 16, EASE_IN);
  const inP = ramp(frame, 0, 16);
  const focused = ramp(frame, SEARCH.tapField, 8);
  const kb =
    ramp(frame, SEARCH.tapField + 2, 12, EASE_OUT) *
    (1 - ramp(frame, SEARCH.enter + 2, 12, EASE_IN_OUT));
  const query = typedText(frame, SEARCH.typeStart, SEARCH.perChar, QUERY);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`,
          filter: dive > 0.01 ? `blur(${dive * 16}px)` : undefined,
        }}
      >
        <Phone
          style={{
            left: PHONE_X,
            top: PHONE_Y,
            opacity: Math.min(1, inP * 1.4),
            transform: `translateY(${(1 - inP) * 90}px)`,
            filter: inP < 0.99 ? `blur(${(1 - inP) * 12}px)` : undefined,
          }}
        >
          <SearchScreen
            frame={frame}
            query={query}
            caretOn={
              frame >= SEARCH.tapField &&
              frame < SEARCH.enter &&
              Math.floor(frame / 14) % 2 === 0
            }
            focused={focused * (1 - ramp(frame, SEARCH.enter, 10))}
            resultsAt={SEARCH.results}
            pressAt={SEARCH.tapResult}
          />
          <Keyboard
            returnLabel="rechercher"
            pressed={
              frame >= SEARCH.enter && frame < SEARCH.enter + 6
                ? "return"
                : keyDown(frame, SEARCH.typeStart, SEARCH.perChar, QUERY)
            }
            slide={kb}
          />
          <TapRipple frame={frame} at={SEARCH.tapField} x={300} y={239} />
          <TapRipple
            frame={frame}
            at={SEARCH.tapResult}
            x={RESULT_BOX.x + RESULT_BOX.w / 2}
            y={RESULT_BOX.y + RESULT_BOX.h / 2}
          />
        </Phone>
      </AbsoluteFill>
      {/* The dive ends in a bright violet-white bloom. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, #FFFFFF 0%, #F4F1FF 45%, ${C.accentSoft} 100%)`,
          opacity: ramp(frame, total - 14, 14, EASE_IN),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 7. The logo: out of the bloom, the monitor lands, the V draws itself, the
// letters rise in, then "est là pour t'aider.".
export const REVEAL = { logo: 2, subtitle: 14, shine: 44 };

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.reveal.durationInFrames;
  const bloom = 1 - ramp(frame, 0, 18);
  const icon = ramp(frame, REVEAL.logo, 20);
  const v = ramp(frame, REVEAL.logo + 8, 18, EASE_IN_OUT);
  const shine = interpolate(
    frame,
    [REVEAL.shine, REVEAL.shine + 34],
    [-60, 160],
    clamp,
  );
  const settled = frame >= REVEAL.logo + 30;
  const rays = ramp(frame, 4, 30);
  const vybzSize = 206;
  return (
    <AbsoluteFill
      style={{ transform: drift(frame, total, { y: -10, scale: 0.03 }) }}
    >
      <Glow y={800} size={1500} opacity={rays} />
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-conic-gradient(from ${frame * 0.2}deg at 50% 42%, rgba(91,60,246,0.10) 0deg 4deg, rgba(91,60,246,0) 4deg 14deg)`,
          WebkitMaskImage:
            "radial-gradient(circle at 50% 42%, black 0%, transparent 52%)",
          maskImage:
            "radial-gradient(circle at 50% 42%, black 0%, transparent 52%)",
          opacity: rays,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 450,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: Math.min(1, icon * 1.4),
            transform: `translateY(${(1 - icon) * 60}px) scale(${0.7 + 0.3 * icon})`,
            filter: icon < 0.99 ? `blur(${(1 - icon) * 16}px)` : undefined,
          }}
        >
          <LogoIcon height={330} vProgress={v} />
        </div>
        <div
          style={{
            marginTop: 64,
            display: "inline-flex",
            flexDirection: "column",
            fontFamily: FONT,
            color: C.ink,
          }}
        >
          <div
            style={{
              fontSize: vybzSize,
              fontWeight: 700,
              lineHeight: 0.78,
              letterSpacing: "-0.01em",
              ...(settled
                ? {
                    backgroundImage: `linear-gradient(105deg, ${C.ink} 0%, ${C.ink} 40%, ${C.accent} 46%, #B9A8FF 50%, ${C.accent} 54%, ${C.ink} 60%, ${C.ink} 100%)`,
                    backgroundSize: "300% 100%",
                    backgroundPosition: `${100 - shine}% 0`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : {}),
            }}
          >
            {settled
              ? "VYBZ"
              : Array.from("VYBZ").map((ch, i) => {
                  const p = ramp(frame, REVEAL.logo + 10 + i * 3, 18);
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        opacity: Math.min(1, p * 1.3),
                        transform: `translateY(${(1 - p) * 60}px)`,
                        filter:
                          p < 0.99 ? `blur(${(1 - p) * 18}px)` : undefined,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: vybzSize * 0.255,
              fontWeight: 500,
              lineHeight: 1,
              marginTop: vybzSize * 0.11,
            }}
          >
            {Array.from("STUDIOS").map((ch, i) => {
              const p = ramp(frame, REVEAL.logo + 18 + i * 2, 16);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    opacity: p,
                    filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1260 }}>
        <BlurText
          size={84}
          delay={REVEAL.subtitle}
          stagger={3}
          segments={[
            { text: "est là pour " },
            { text: "t’aider.", color: C.accent },
          ]}
        />
      </div>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: bloom }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 8. Relief: the girl's clip in full, full screen, with a clean caption.
const GIRL_END = SCENES.relief.durationInFrames;

export const Relief: React.FC = () => (
  <AbsoluteFill>
    <FullClip
      src="media/girl-full.mp4"
      // Short fade so the sound does not stop dead at the cut.
      volume={(f) =>
        interpolate(f, [GIRL_END - 6, GIRL_END - 1], [1, 0], clamp)
      }
    />
    <CaptionCard
      tone="clean"
      seed="relief"
      delay={-2}
      // Her face fills the middle of the frame: the caption sits low.
      top={1240}
      size={66}
      segments={[
        { text: "Les vendeurs qui ont enfin trouvé " },
        { text: "Vybz Studios :", color: C.accent, nowrap: true },
      ]}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// 9. Services, one by one, then "Prix très abordables".
const SERVICES = [
  { label: "Motion design", Icon: MotionIcon },
  { label: "Web design", Icon: WebIcon },
  { label: "Affiches publicitaires", Icon: PosterIcon },
];
export const SERVICE_AT = [10, 40, 70];
export const PRICE_AT = 100;

export const Services: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.services.durationInFrames;
  const price = ramp(frame, PRICE_AT, 20);
  const priceShine = interpolate(
    frame,
    [PRICE_AT + 18, PRICE_AT + 52],
    [-40, 140],
    clamp,
  );
  return (
    <AbsoluteFill
      style={{ transform: drift(frame, total, { y: -12, scale: 0.03 }) }}
    >
      <Glow y={900} size={1500} opacity={0.7} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 236 }}>
        <BlurText
          size={104}
          delay={-2}
          segments={[{ text: "Nos " }, { text: "services", color: C.accent }]}
        />
      </div>
      {SERVICES.map(({ label, Icon }, i) => {
        const at = SERVICE_AT[i];
        const p = ramp(frame, at, 22);
        const draw = ramp(frame, at + 6, 24, EASE_IN_OUT);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 80,
              width: 920,
              top: 452 + i * 214,
              height: 184,
              borderRadius: 44,
              background: C.card,
              boxShadow: SHADOW,
              display: "flex",
              alignItems: "center",
              gap: 40,
              padding: "0 30px",
              opacity: Math.min(1, p * 1.3),
              transform: `translateY(${(1 - p) * 70}px) scale(${0.95 + 0.05 * p})`,
              filter: p < 0.99 ? `blur(${(1 - p) * 12}px)` : undefined,
            }}
          >
            <div
              style={{
                width: 128,
                height: 128,
                flex: "none",
                borderRadius: 34,
                background: `linear-gradient(145deg, ${C.accent}, ${C.accentDeep})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={96} progress={draw} />
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 62,
                letterSpacing: "-0.03em",
                color: C.ink,
                lineHeight: 1.05,
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1146,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "26px 52px 26px 40px",
            borderRadius: 999,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 60,
            letterSpacing: "-0.03em",
            color: C.ink,
            backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 60%, rgba(255,255,255,0) 100%), linear-gradient(180deg, #FF9440, ${C.orange})`,
            backgroundSize: "300% 100%, 100% 100%",
            backgroundPosition: `${100 - priceShine}% 0, 0 0`,
            boxShadow: "0 26px 56px rgba(255,122,26,0.38)",
            opacity: Math.min(1, price * 1.4),
            transform: `rotate(${-6 + 4 * price}deg) scale(${1.35 - 0.35 * price})`,
            filter: price < 0.99 ? `blur(${(1 - price) * 12}px)` : undefined,
          }}
        >
          <Emoji name="money-bag" size="1.3em" />
          Prix très abordables
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 11. Call to action. Everything stays until the very end.
const PHONE_NUMBER = "01 53 37 10 00";
export const CTA = {
  pill: 28,
  numberStart: 44,
  perChar: 3,
  number: PHONE_NUMBER,
};
const NUMBER_END = CTA.numberStart + PHONE_NUMBER.length * CTA.perChar;
export const CTA_DONE = NUMBER_END + 4;

export const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const total = SCENES.cta.durationInFrames;
  const logo = ramp(frame, -2, 20);
  const pill = ramp(frame, CTA.pill, 20);
  const typed = typedText(frame, CTA.numberStart, CTA.perChar, PHONE_NUMBER);
  const pulseT = Math.max(0, frame - CTA_DONE) % 60;
  const pulse = frame > CTA_DONE ? interpolate(pulseT, [0, 60], [0, 1]) : 0;
  return (
    <AbsoluteFill
      style={{ transform: drift(frame, total, { y: -8, scale: 0.025 }) }}
    >
      <Glow y={1080} size={1500} opacity={0.75} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, logo * 1.3),
          transform: `translateY(${(1 - logo) * 30}px)`,
          filter: logo < 0.99 ? `blur(${(1 - logo) * 14}px)` : undefined,
        }}
      >
        <HorizontalLogo size={104} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 640 }}>
        <BlurText
          size={100}
          delay={4}
          stagger={4}
          lineHeight={1.08}
          segments={[
            { text: "Contacte " },
            { text: "Vybz Studios", color: C.accent, nowrap: true },
          ]}
        />
        <BlurText
          size={72}
          weight={600}
          delay={18}
          segments={[{ text: "sur WhatsApp :" }]}
          style={{ marginTop: 22 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          width: W - 140,
          top: 1100,
          height: 168,
          borderRadius: 84,
          background: C.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          boxShadow: `0 26px 60px rgba(37,211,102,0.40), 0 0 0 ${pulse * 28}px rgba(37,211,102,${0.4 * (1 - pulse)})`,
          opacity: Math.min(1, pill * 1.4),
          transform: `translateY(${(1 - pill) * 50}px) scale(${0.9 + 0.1 * pill})`,
          filter: pill < 0.99 ? `blur(${(1 - pill) * 12}px)` : undefined,
        }}
      >
        <ChatPhoneIcon size={100} color={C.ink} bg={C.green} />
        {/* The untyped digits are laid out invisibly so the centred number
            does not shift while it is being typed. */}
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 86,
            letterSpacing: "-0.01em",
            color: C.ink,
            whiteSpace: "pre",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {typed}
          <Caret
            on={
              frame >= CTA.numberStart &&
              frame < NUMBER_END + 40 &&
              Math.floor(frame / 16) % 2 === 0
            }
            color={C.ink}
          />
          <span style={{ color: "transparent" }}>
            {PHONE_NUMBER.slice(typed.length)}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
