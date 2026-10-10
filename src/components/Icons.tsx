import React from "react";

// Line icons drawn with strokes so they can "draw themselves" (progress 0..1).
type IconProps = { size: number; progress?: number; color?: string };

const stroke = (progress: number, color: string) => ({
  fill: "none",
  stroke: color,
  strokeWidth: 6.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - progress,
});

export const MotionIcon: React.FC<IconProps> = ({ size, progress = 1, color = "#fff" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx={58} cy={50} r={30} {...stroke(progress, color)} />
    <path d="M51 37 L72 50 L51 63 Z" {...stroke(progress, color)} />
    <path d="M8 38 H20 M4 50 H20 M8 62 H20" {...stroke(progress, color)} />
  </svg>
);

export const WebIcon: React.FC<IconProps> = ({ size, progress = 1, color = "#fff" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <rect x={10} y={18} width={80} height={64} rx={8} {...stroke(progress, color)} />
    <path d="M10 34 H90" {...stroke(progress, color)} />
    <path d="M40 48 L31 57 L40 66 M60 48 L69 57 L60 66 M53 45 L47 69" {...stroke(progress, color)} />
  </svg>
);

export const PosterIcon: React.FC<IconProps> = ({ size, progress = 1, color = "#fff" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <rect x={24} y={10} width={52} height={80} rx={5} {...stroke(progress, color)} />
    <circle cx={60} cy={30} r={6} {...stroke(progress, color)} />
    <path d="M31 72 L44 54 L53 65 L60 58 L69 72" {...stroke(progress, color)} />
  </svg>
);

// Simple pictogram of a person (customer).
export const PersonIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 60 100" width={size * 0.6} height={size}>
    <circle cx={30} cy={16} r={13} fill={color} />
    <path d="M8 98 V52 C8 38 17 32 30 32 C43 32 52 38 52 52 V98 Z" fill={color} />
  </svg>
);

// Chat bubble with a handset, for the WhatsApp button.
export const ChatPhoneIcon: React.FC<{ size: number; color?: string; bg: string }> = ({
  size,
  color = "#fff",
  bg,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <path
      d="M50 6 C25.7 6 6 25.2 6 49 C6 57.4 8.5 65.3 12.8 72 L7 93 L29.3 87.4 C35.6 90.8 42.6 92.6 50 92.6 C74.3 92.6 94 73.4 94 49.6 C94 25.8 74.3 6 50 6 Z"
      fill={color}
    />
    <path
      d="M36.5 30.5 C35.2 27.6 33.8 27.5 32.6 27.5 L29.9 27.4 C28.9 27.4 27.4 27.8 26.1 29.2 C24.8 30.6 21.1 34 21.1 41 C21.1 48 26.2 54.8 26.9 55.7 C27.6 56.7 36.8 71.4 51.3 77.1 C63.4 81.8 65.8 80.9 68.4 80.6 C71 80.4 76.8 77.2 78 73.9 C79.2 70.6 79.2 67.7 78.8 67.1 C78.4 66.5 77.5 66.2 76 65.4 C74.6 64.7 67.4 61.2 66.1 60.7 C64.8 60.2 63.8 60 62.9 61.4 C61.9 62.9 59.1 66.2 58.2 67.1 C57.4 68.1 56.5 68.2 55 67.5 C53.6 66.7 48.9 65.2 43.4 60.3 C39.1 56.5 36.2 51.7 35.3 50.3 C34.5 48.8 35.2 48 36 47.3 C36.6 46.6 37.4 45.6 38.1 44.7 C38.9 43.9 39.1 43.3 39.6 42.3 C40.1 41.3 39.8 40.5 39.5 39.7 C39.1 39 36.3 32 36.5 30.5 Z"
      fill={bg}
    />
  </svg>
);
