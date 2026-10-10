import React from "react";
import { C, FONT } from "../theme";

// Vector redraw of the Vybz Studios logo (monitor with a "V" + VYBZ / STUDIOS
// in Poppins), so it stays sharp in 4K and its parts can be animated.
// Geometry measured on the original logo file (viewBox in its pixel units).
const ICON_VIEWBOX = "243 294 605 503";
export const ICON_RATIO = 605 / 503;

export const LogoIcon: React.FC<{
  height: number;
  color?: string;
  vProgress?: number; // 0..1, draws the V stroke
}> = ({ height, color = C.ink, vProgress = 1 }) => (
  <svg
    viewBox={ICON_VIEWBOX}
    height={height}
    width={height * ICON_RATIO}
    style={{ display: "block", overflow: "visible" }}
  >
    <rect x={243} y={294} width={605} height={403} rx={60} fill={color} />
    <rect x={522} y={690} width={47} height={62} fill={color} />
    <rect x={425} y={746} width={241} height={51} rx={25.5} fill={color} />
    <polyline
      points="463,420 545.5,572 628,420"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={45}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - vProgress}
      opacity={vProgress > 0 ? 1 : 0}
    />
  </svg>
);

// VYBZ with STUDIOS spread underneath to the same width, as on the logo.
// Proportions measured on the provided logo files: STUDIOS is ~0.235x VYBZ in
// the horizontal lockup and ~0.255x in the stacked one.
export const Wordmark: React.FC<{
  size: number; // font size of VYBZ
  color?: string;
  vybzStyle?: React.CSSProperties;
  studiosScale?: number;
}> = ({ size, color = C.ink, vybzStyle, studiosScale = 0.235 }) => (
  <div
    style={{
      display: "inline-flex",
      flexDirection: "column",
      fontFamily: FONT,
      color,
    }}
  >
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        lineHeight: 0.78,
        letterSpacing: "-0.01em",
        ...vybzStyle,
      }}
    >
      VYBZ
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: size * studiosScale,
        fontWeight: 500,
        lineHeight: 1,
        marginTop: size * 0.11,
      }}
    >
      {Array.from("STUDIOS").map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </div>
  </div>
);

export const HorizontalLogo: React.FC<{ size: number; color?: string }> = ({
  size,
  color,
}) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: size * 0.32 }}>
    <LogoIcon height={size * 1.33} color={color} />
    <Wordmark size={size} color={color} />
  </div>
);
