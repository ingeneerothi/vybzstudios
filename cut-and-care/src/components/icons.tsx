import React from 'react';
import {C} from '../theme';

type IconProps = {size: number; style?: React.CSSProperties};

/** Pastille WhatsApp (bulle + combiné). */
export const WhatsAppIcon: React.FC<IconProps> = ({size, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <circle cx="50" cy="50" r="50" fill={C.whatsapp} />
    <circle cx="51" cy="48" r="29" fill="none" stroke="#fff" strokeWidth="6" />
    <path d="M30.5 66 L24 81 L39.5 74.5 Z" fill="#fff" />
    <g transform="translate(36.5 34) scale(1.13)">
      <path
        fill="#fff"
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </g>
  </svg>
);

/** Pastille TikTok (note de musique stylisée). */
export const TikTokIcon: React.FC<IconProps & {bg?: string}> = ({size, style, bg = C.ink}) => {
  const note = (dx: number, dy: number, color: string, opacity = 1) => (
    <g transform={`translate(${dx} ${dy})`} opacity={opacity}>
      <circle cx="41" cy="63" r="11.5" fill="none" stroke={color} strokeWidth="7.5" />
      <path d="M52.5 63 V24" stroke={color} strokeWidth="7.5" strokeLinecap="round" />
      <path d="M52.5 26 C55 35 62 40.5 71 40.5" fill="none" stroke={color} strokeWidth="7.5" strokeLinecap="round" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <circle cx="50" cy="50" r="50" fill={bg} />
      {note(-2.2, -1.8, '#25F4EE', 0.9)}
      {note(2.2, 1.8, '#FE2C55', 0.9)}
      {note(0, 0, '#fff')}
    </svg>
  );
};

/** Pastille Instagram (appareil photo). */
export const InstagramIcon: React.FC<IconProps> = ({size, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <defs>
      <radialGradient id="ig-grad" cx="0.3" cy="1.05" r="1.2">
        <stop offset="0" stopColor="#FDD06A" />
        <stop offset="0.35" stopColor="#F77737" />
        <stop offset="0.6" stopColor="#E1306C" />
        <stop offset="1" stopColor="#833AB4" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#ig-grad)" />
    <rect x="25" y="25" width="50" height="50" rx="15" fill="none" stroke="#fff" strokeWidth="6.5" />
    <circle cx="50" cy="50" r="12" fill="none" stroke="#fff" strokeWidth="6.5" />
    <circle cx="64.5" cy="35.5" r="4" fill="#fff" />
  </svg>
);

/** Maison au trait (p = progression du tracé 0→1). */
export const HouseIcon: React.FC<IconProps & {p?: number; color?: string}> = ({size, style, p = 1, color = C.brown}) => {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth: 4.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    pathLength: 1,
    strokeDasharray: 1,
  };
  const seg = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <path d="M14 47 L50 17 L86 47" {...stroke} strokeDashoffset={1 - seg(0, 0.45)} />
      <path d="M24 39 V83 H76 V39" {...stroke} strokeDashoffset={1 - seg(0.25, 0.75)} />
      <path d="M43 83 V61 H57 V83" {...stroke} strokeDashoffset={1 - seg(0.6, 0.9)} />
      <path d="M63 29 V19 H71 V35" {...stroke} strokeDashoffset={1 - seg(0.7, 1)} />
      <circle cx="50" cy="44" r="5.5" fill={C.terracotta} opacity={seg(0.85, 1)} />
    </svg>
  );
};

/** Épingle de localisation (Material « place »). */
export const PinIcon: React.FC<IconProps & {color?: string}> = ({size, style, color = C.terracotta}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path
      fill={color}
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    />
  </svg>
);

/** Voiture (Material « directions_car »). */
export const CarIcon: React.FC<IconProps & {color?: string}> = ({size, style, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path
      fill={color}
      d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"
    />
  </svg>
);

/** Carte étudiant / scolaire. */
export const StudentCardIcon: React.FC<IconProps> = ({size, style}) => (
  <svg width={size} height={size * 0.68} viewBox="0 0 100 68" style={style}>
    <rect x="2" y="2" width="96" height="64" rx="9" fill={C.creamLight} stroke={C.brown} strokeWidth="2.5" />
    <path d="M2 11 a9 9 0 0 1 9 -9 h78 a9 9 0 0 1 9 9 v7 H2 Z" fill={C.terracotta} />
    <circle cx="24" cy="40" r="10" fill={C.beige} />
    <path d="M12 60 c2-8 7-11 12-11 s10 3 12 11" fill={C.beige} />
    <rect x="44" y="30" width="44" height="5" rx="2.5" fill={C.sand} />
    <rect x="44" y="41" width="36" height="5" rx="2.5" fill={C.sand} />
    <rect x="44" y="52" width="26" height="5" rx="2.5" fill={C.sand} />
    <path d="M50 6.5 l9 3.5 -9 3.5 -9 -3.5 z" fill="#fff" opacity="0.9" />
  </svg>
);

/** Coche dans un rond. */
export const CheckIcon: React.FC<IconProps & {bg?: string}> = ({size, style, bg = C.brown}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="12" fill={bg} />
    <path fill="#fff" d="M9.6 15.6 6.2 12.2l-1.3 1.3 4.7 4.7L19.1 8.7l-1.3-1.3z" />
  </svg>
);
