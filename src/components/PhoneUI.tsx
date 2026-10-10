import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, FONT } from "../theme";
import { EASE_OUT, clamp, ramp } from "../motion";
import { SCREEN_H, SCREEN_W } from "./Phone";
import { LogoIcon } from "./Logo";

// iOS-like screens drawn inside the Phone mockup (screen = 621 x 1104 px).
const IOS_BLUE = "#0A84FF";
const FIELD = "#E9EAEE";
const UI_FONT = FONT;

export const StatusBar: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const ink = dark ? "#FFFFFF" : C.ink;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 96,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 46px 0 58px",
        fontFamily: UI_FONT,
        fontWeight: 600,
        fontSize: 29,
        color: ink,
      }}
    >
      <span>21:05</span>
      <svg width={112} height={26} viewBox="0 0 112 26">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 9}
            y={18 - i * 5}
            width={6}
            height={8 + i * 5}
            rx={1.5}
            fill={ink}
          />
        ))}
        <path
          d="M44 9 a14 14 0 0 1 20 0 M47.5 13 a9 9 0 0 1 13 0"
          stroke={ink}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={54} cy={18} r={2.6} fill={ink} />
        <rect
          x={74}
          y={4}
          width={32}
          height={18}
          rx={5}
          fill="none"
          stroke={ink}
          strokeOpacity={0.45}
          strokeWidth={2}
        />
        <rect x={77} y={7} width={22} height={12} rx={2.5} fill={ink} />
        <rect
          x={107}
          y={10}
          width={3}
          height={6}
          rx={1.5}
          fill={ink}
          fillOpacity={0.45}
        />
      </svg>
    </div>
  );
};

// ---------- Keyboard (French AZERTY) ----------

const KB_H = 430;
const PAD = 8;
const GAP = 9;
const KEY_W = (SCREEN_W - PAD * 2 - GAP * 9) / 10;
const KEY_H = 78;
const ROW_Y = [16, 116, 216, 316];

type KeyBox = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  special?: boolean;
};

const buildKeys = (returnLabel: string): KeyBox[] => {
  const keys: KeyBox[] = [];
  const row = (letters: string, y: number, startX: number) =>
    Array.from(letters).forEach((l, i) =>
      keys.push({
        id: l,
        label: l.toUpperCase(),
        x: startX + i * (KEY_W + GAP),
        y,
        w: KEY_W,
      }),
    );
  row("azertyuiop", ROW_Y[0], PAD);
  row("qsdfghjklm", ROW_Y[1], PAD);
  const sideW = 78;
  const row3W = sideW * 2 + 6 * KEY_W + 7 * GAP;
  const r3x = (SCREEN_W - row3W) / 2;
  keys.push({
    id: "shift",
    label: "⇧",
    x: r3x,
    y: ROW_Y[2],
    w: sideW,
    special: true,
  });
  row("wxcvbn", ROW_Y[2], r3x + sideW + GAP);
  keys.push({
    id: "delete",
    label: "⌫",
    x: r3x + row3W - sideW,
    y: ROW_Y[2],
    w: sideW,
    special: true,
  });
  const r4 = [
    { id: "123", label: "123", w: 104, special: true },
    { id: "emoji", label: "☺", w: 74, special: true },
    {
      id: " ",
      label: "espace",
      w: SCREEN_W - PAD * 2 - 104 - 74 - 168 - GAP * 3,
    },
    { id: "return", label: returnLabel, w: 168, special: true },
  ];
  let x = PAD;
  r4.forEach((k) => {
    keys.push({ ...k, x, y: ROW_Y[3] });
    x += k.w + GAP;
  });
  return keys;
};

// `pressed` is the key currently down (its popup shows for a few frames).
export const Keyboard: React.FC<{
  returnLabel: string;
  pressed: string | null;
  slide: number; // 0 = hidden below the screen, 1 = up
}> = ({ returnLabel, pressed, slide }) => {
  const keys = buildKeys(returnLabel);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: SCREEN_W,
        height: KB_H,
        top: SCREEN_H - KB_H * slide,
        background: "#D2D5DC",
        fontFamily: UI_FONT,
      }}
    >
      {keys.map((k) => {
        const down = pressed === k.id;
        const isReturn = k.id === "return";
        const bg = isReturn ? IOS_BLUE : k.special ? "#ADB2BC" : "#FFFFFF";
        return (
          <div
            key={k.id}
            style={{
              position: "absolute",
              left: k.x,
              top: k.y,
              width: k.w,
              height: KEY_H,
              borderRadius: 10,
              background:
                down && !isReturn ? (k.special ? "#FFFFFF" : "#ADB2BC") : bg,
              boxShadow: "0 2px 0 rgba(0,0,0,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: k.label.length > 2 ? 25 : 34,
              fontWeight: isReturn ? 600 : 400,
              color: isReturn ? "#FFFFFF" : C.ink,
              filter: down && isReturn ? "brightness(0.85)" : undefined,
            }}
          >
            {k.label}
          </div>
        );
      })}
      {(() => {
        const k = keys.find(
          (key) => key.id === pressed && !key.special && key.id !== " ",
        );
        if (!k) {
          return null;
        }
        // iOS key popup: an enlarged cap above the key.
        const pw = KEY_W * 1.55;
        return (
          <div
            style={{
              position: "absolute",
              left: k.x + k.w / 2 - pw / 2,
              top: k.y - 112,
              width: pw,
              height: 112 + KEY_H,
              borderRadius: 16,
              background: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              display: "flex",
              justifyContent: "center",
              paddingTop: 14,
              fontSize: 58,
              color: C.ink,
              clipPath: `polygon(0 0, 100% 0, 100% 58%, ${50 + (KEY_W / pw) * 50}% 72%, ${50 + (KEY_W / pw) * 50}% 100%, ${50 - (KEY_W / pw) * 50}% 100%, ${50 - (KEY_W / pw) * 50}% 72%, 0 58%)`,
            }}
          >
            {k.label}
          </div>
        );
      })()}
    </div>
  );
};

// Which key is down at `frame` while `text` is typed from `start`.
export const keyDown = (
  frame: number,
  start: number,
  perChar: number,
  text: string,
) => {
  const i = Math.floor((frame - start) / perChar);
  if (frame < start || i >= text.length) {
    return null;
  }
  return (frame - start) % perChar < perChar - 0.5 ? text[i] : null;
};

export const typedText = (
  frame: number,
  start: number,
  perChar: number,
  text: string,
) =>
  frame < start
    ? ""
    : text.slice(
        0,
        Math.min(text.length, Math.floor((frame - start) / perChar) + 1),
      );

export const Caret: React.FC<{ on: boolean; color?: string }> = ({
  on,
  color = IOS_BLUE,
}) => (
  <span
    style={{
      display: "inline-block",
      width: 3,
      height: "1.15em",
      marginLeft: 2,
      verticalAlign: "-0.2em",
      background: color,
      opacity: on ? 1 : 0,
    }}
  />
);

// Expanding touch ripple at a tap point (screen coordinates).
export const TapRipple: React.FC<{
  frame: number;
  at: number;
  x: number;
  y: number;
}> = ({ frame, at, x, y }) => {
  const p = ramp(frame, at, 16);
  if (frame < at || p >= 1) {
    return null;
  }
  const r = 26 + 54 * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: "rgba(17,18,22,0.18)",
        opacity: 1 - p,
      }}
    />
  );
};

// ---------- Safari address bar + error page (scene "pas de site") ----------

export const SafariScreen: React.FC<{
  frame: number;
  url: string;
  caretOn: boolean;
  loading: number; // 0..1 progress bar
  failAt: number;
}> = ({ frame, url, caretOn, loading, failAt }) => {
  const fail = ramp(frame, failAt, 16);
  const cross = interpolate(frame, [failAt + 4, failAt + 18], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  return (
    <AbsoluteFill style={{ background: "#FFFFFF", fontFamily: UI_FONT }}>
      <StatusBar />
      <div
        style={{
          position: "absolute",
          top: 104,
          left: 22,
          right: 22,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 78,
            borderRadius: 20,
            background: FIELD,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            fontSize: 36,
            color: url ? C.ink : "#8A8D96",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {url || "Rechercher ou saisir un site"}
          <Caret on={caretOn} />
        </div>
        <span style={{ fontSize: 30, color: IOS_BLUE }}>Annuler</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 196,
          left: 0,
          height: 5,
          width: `${loading * 100}%`,
          background: IOS_BLUE,
          opacity: loading > 0 && loading < 1 ? 1 : 0,
        }}
      />
      {/* Favourites grid before the page fails. */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 40,
          right: 40,
          opacity: 1 - fail,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: C.ink,
            marginBottom: 26,
          }}
        >
          Favoris
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 26,
          }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{ height: 112, borderRadius: 24, background: FIELD }}
            />
          ))}
        </div>
      </div>
      {fail > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 290,
            left: 40,
            right: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 22,
            opacity: fail,
            transform: `translateY(${(1 - fail) * 24}px)`,
          }}
        >
          <svg width={170} height={170} viewBox="0 0 170 170">
            <circle cx={85} cy={85} r={80} fill={C.red} />
            <g stroke="#FFFFFF" strokeWidth={15} strokeLinecap="round">
              <line
                x1={56}
                y1={56}
                x2={114}
                y2={114}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - cross}
              />
              <line
                x1={114}
                y1={56}
                x2={56}
                y2={114}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - cross}
              />
            </g>
          </svg>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: C.ink,
              lineHeight: 1.15,
              textWrap: "balance",
            }}
          >
            Impossible d’ouvrir la page
          </div>
          <div style={{ fontSize: 33, color: C.mute, lineHeight: 1.35 }}>
            Aucun site trouvé à cette adresse.
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- Search page with results (scene "on tape vybz studios") ----------

export const RESULT_BOX = { x: 22, y: 320, w: SCREEN_W - 44, h: 196 };

export const SearchScreen: React.FC<{
  frame: number;
  query: string;
  caretOn: boolean;
  focused: number; // 0..1
  resultsAt: number;
  pressAt: number;
}> = ({ frame, query, caretOn, focused, resultsAt, pressAt }) => {
  const top = ramp(frame, resultsAt, 18);
  const pressed = frame >= pressAt && frame < pressAt + 10;
  return (
    <AbsoluteFill style={{ background: "#FFFFFF", fontFamily: UI_FONT }}>
      <StatusBar />
      <div
        style={{
          position: "absolute",
          top: 108,
          left: 30,
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: C.ink,
        }}
      >
        Rechercher
      </div>
      <div
        style={{
          position: "absolute",
          top: 196,
          left: 22,
          right: 22,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 86,
            borderRadius: 22,
            background: FIELD,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 22px",
            fontSize: 38,
            fontWeight: 500,
            color: query ? C.ink : "#8A8D96",
            boxShadow: `0 0 0 ${3 * focused}px ${C.accent}`,
          }}
        >
          <svg width={30} height={30} viewBox="0 0 30 30">
            <circle
              cx={12.5}
              cy={12.5}
              r={9}
              stroke="#8A8D96"
              strokeWidth={3.4}
              fill="none"
            />
            <line
              x1={19.5}
              y1={19.5}
              x2={27}
              y2={27}
              stroke="#8A8D96"
              strokeWidth={3.4}
              strokeLinecap="round"
            />
          </svg>
          <span style={{ whiteSpace: "nowrap" }}>
            {query || "Rechercher sur le web"}
            <Caret on={caretOn} />
          </span>
        </div>
        <span style={{ fontSize: 30, color: IOS_BLUE, opacity: focused }}>
          Annuler
        </span>
      </div>
      {top > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: RESULT_BOX.x,
              top: RESULT_BOX.y,
              width: RESULT_BOX.w,
              height: RESULT_BOX.h,
              borderRadius: 28,
              background: pressed ? "#F1EEFF" : "#FFFFFF",
              border: `2px solid ${C.line}`,
              boxShadow: "0 16px 34px rgba(17,18,22,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "0 26px",
              opacity: Math.min(1, top * 1.3),
              transform: `translateY(${(1 - top) * 40}px) scale(${0.96 + 0.04 * top})`,
              filter: top < 0.99 ? `blur(${(1 - top) * 10}px)` : undefined,
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                flex: "none",
                borderRadius: 28,
                background: C.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogoIcon height={62} color="#FFFFFF" vColor={C.ink} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: C.accent,
                  letterSpacing: "-0.02em",
                }}
              >
                Vybz Studios
              </div>
              <div style={{ fontSize: 27, color: C.mute, lineHeight: 1.3 }}>
                Motion design · Web design · Affiches publicitaires
              </div>
            </div>
          </div>
          {[0, 1].map((i) => {
            const p = ramp(frame, resultsAt + 6 + i * 5, 18);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: RESULT_BOX.x,
                  top: RESULT_BOX.y + RESULT_BOX.h + 26 + i * 168,
                  width: RESULT_BOX.w,
                  height: 142,
                  borderRadius: 28,
                  border: `2px solid ${C.line}`,
                  padding: "28px 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 30}px)`,
                }}
              >
                <div
                  style={{
                    width: "58%",
                    height: 24,
                    borderRadius: 12,
                    background: FIELD,
                  }}
                />
                <div
                  style={{
                    width: "86%",
                    height: 20,
                    borderRadius: 10,
                    background: "#F1F2F5",
                  }}
                />
                <div
                  style={{
                    width: "70%",
                    height: 20,
                    borderRadius: 10,
                    background: "#F1F2F5",
                  }}
                />
              </div>
            );
          })}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
