import React from "react";
import { C } from "../theme";

export const SCREEN_W = 621;
export const SCREEN_H = 1104; // 9:16
const BEZEL = 16;

// A clean phone mockup; children fill the 9:16 screen.
export const Phone: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      position: "absolute",
      width: SCREEN_W + BEZEL * 2,
      height: SCREEN_H + BEZEL * 2,
      padding: BEZEL,
      borderRadius: 82,
      background: C.ink,
      boxShadow:
        "0 50px 90px rgba(20,17,15,0.30), 0 10px 24px rgba(20,17,15,0.20), inset 0 0 0 3px #2b2b2b",
      ...style,
    }}
  >
    <div
      style={{
        position: "relative",
        width: SCREEN_W,
        height: SCREEN_H,
        borderRadius: 66,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: (SCREEN_W - 150) / 2,
          width: 150,
          height: 40,
          borderRadius: 20,
          background: "#000",
        }}
      />
    </div>
    {[
      { side: "left", top: 230, h: 90 },
      { side: "left", top: 340, h: 90 },
      { side: "right", top: 280, h: 140 },
    ].map((b, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: b.top,
          [b.side]: -6,
          width: 6,
          height: b.h,
          borderRadius: 3,
          background: "#1d1d1d",
        }}
      />
    ))}
  </div>
);
