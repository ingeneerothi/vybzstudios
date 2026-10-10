import React from "react";
import { C, FONT, SHADOW } from "../theme";

// iOS-style widgets floating around the hook ("tu fais de la pub").
const base: React.CSSProperties = {
  position: "absolute",
  borderRadius: 46,
  boxShadow: SHADOW,
  fontFamily: FONT,
  overflow: "hidden",
};

export const MegaphoneWidget: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => (
  <div
    style={{
      ...base,
      width: 300,
      height: 300,
      background: C.night,
      padding: 34,
      ...style,
    }}
  >
    <svg width={92} height={92} viewBox="0 0 100 100">
      <path
        d="M16 42 L16 60 L30 60 L62 80 L62 22 L30 42 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M74 36 Q86 51 74 66"
        fill="none"
        stroke={C.accent}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M30 60 L36 84"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{ marginTop: 40, fontSize: 40, fontWeight: 700, color: "#FFFFFF" }}
    >
      Ta pub
    </div>
    <div
      style={{
        marginTop: 6,
        fontSize: 26,
        fontWeight: 500,
        color: "rgba(255,255,255,0.55)",
      }}
    >
      En ligne
    </div>
  </div>
);

export const PostWidget: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => (
  <div
    style={{
      ...base,
      width: 330,
      height: 420,
      background: C.card,
      padding: 22,
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            width: 140,
            height: 16,
            borderRadius: 8,
            background: "#D9DCE4",
          }}
        />
        <div
          style={{
            width: 90,
            height: 12,
            borderRadius: 6,
            background: "#E8EAF0",
          }}
        />
      </div>
    </div>
    <div
      style={{
        marginTop: 18,
        height: 230,
        borderRadius: 26,
        background:
          "linear-gradient(160deg, #E6E1FF 0%, #F6EEFF 50%, #FFE7D6 100%)",
      }}
    />
    <div style={{ marginTop: 18, display: "flex", gap: 18 }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <path
          d="M20 34 C8 25 4 19 4 13 C4 8 8 5 12 5 C16 5 18 7.5 20 10 C22 7.5 24 5 28 5 C32 5 36 8 36 13 C36 19 32 25 20 34 Z"
          fill="none"
          stroke={C.ink}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
      </svg>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <path
          d="M6 19 C6 11 12 6 20 6 C28 6 34 11 34 19 C34 27 28 32 20 32 C17 32 14 31 12 30 L5 33 L7 26 C6 24 6 21 6 19 Z"
          fill="none"
          stroke={C.ink}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

export const VideoWidget: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => (
  <div
    style={{
      ...base,
      width: 360,
      height: 230,
      background: C.card,
      padding: 24,
      ...style,
    }}
  >
    <div
      style={{
        height: 130,
        borderRadius: 24,
        background: "#1D1E24",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={27} fill="rgba(255,255,255,0.14)" />
        <path d="M23 18 L39 28 L23 38 Z" fill="#FFFFFF" />
      </svg>
    </div>
    <div
      style={{
        marginTop: 22,
        height: 10,
        borderRadius: 5,
        background: "#E8EAF0",
      }}
    >
      <div
        style={{
          width: "36%",
          height: 10,
          borderRadius: 5,
          background: C.accent,
        }}
      />
    </div>
  </div>
);

export const StatsWidget: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => (
  <div
    style={{
      ...base,
      width: 250,
      height: 250,
      background: C.night,
      padding: 30,
      ...style,
    }}
  >
    <div
      style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}
    >
      Vues
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        height: 130,
        marginTop: 30,
      }}
    >
      {[40, 64, 52, 88, 70].map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            borderRadius: 8,
            background: i === 3 ? C.accent : "rgba(255,255,255,0.22)",
          }}
        />
      ))}
    </div>
  </div>
);
