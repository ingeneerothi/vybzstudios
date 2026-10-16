import React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {C, F, H, W} from '../theme';

/** Fond papier crème, lumière chaude venant du haut. */
export const Paper: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <AbsoluteFill
    style={{
      opacity,
      background: `radial-gradient(130% 75% at 50% 6%, ${C.creamLight} 0%, ${C.cream} 50%, #EADBC6 100%)`,
    }}
  >
    <AbsoluteFill
      style={{background: 'radial-gradient(120% 90% at 50% 42%, rgba(0,0,0,0) 62%, rgba(130,67,20,0.10) 100%)'}}
    />
  </AbsoluteFill>
);

/** Poussière dorée qui flotte (déterministe : random(seed)). */
export const Dust: React.FC<{
  frame: number;
  count?: number;
  color?: string;
  seed?: string;
  opacity?: number;
  area?: {top: number; height: number};
}> = ({frame, count = 22, color = C.gold, seed = 'dust', opacity = 0.5, area = {top: 0, height: H}}) => {
  const items = new Array(count).fill(0).map((_, i) => {
    const x0 = random(`${seed}-x-${i}`) * W;
    const y0 = random(`${seed}-y-${i}`) * area.height;
    const r = 2 + random(`${seed}-r-${i}`) * 5.5;
    const speed = 0.25 + random(`${seed}-s-${i}`) * 0.6;
    const phase = random(`${seed}-p-${i}`) * Math.PI * 2;
    const y = area.top + ((((y0 - frame * speed) % area.height) + area.height) % area.height);
    const x = x0 + Math.sin(frame / 45 + phase) * 16;
    const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 17 + phase * 3));
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: color,
          opacity: opacity * twinkle,
          filter: `blur(${r > 4.5 ? 2.2 : 1}px)`,
        }}
      />
    );
  });
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{items}</AbsoluteFill>;
};

/** Photo plein cadre (object-fit cover) avec Ken Burns autour d'un point focal. */
export const Photo: React.FC<{
  src: string;
  focus?: [number, number];
  scale?: number;
  tx?: number;
  ty?: number;
  style?: React.CSSProperties;
}> = ({src, focus = [0.5, 0.5], scale = 1, tx = 0, ty = 0, style}) => (
  <Img
    src={staticFile(`images/${src}`)}
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
      ...style,
    }}
  />
);

/**
 * Photo placée précisément : 1 unité = 1 px de la photo d'origine (720 px de large),
 * k = px vidéo par px photo, (ax, ay) point photo placé en (vx, vy) vidéo.
 * Les enfants sont positionnés en coordonnées photo.
 */
export const PlacedPhoto: React.FC<{
  src: string;
  natural: [number, number];
  k: number;
  anchor: [number, number];
  at: [number, number];
  children?: React.ReactNode;
}> = ({src, natural, k, anchor, at, children}) => {
  const left = at[0] - anchor[0] * k;
  const top = at[1] - anchor[1] * k;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: natural[0] * k,
        height: natural[1] * k,
      }}
    >
      <Img src={staticFile(`images/${src}`)} style={{width: '100%', height: '100%', display: 'block'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: natural[0],
          height: natural[1],
          transform: `scale(${k})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Arche façon affiche : cadre cuivré + liseré doré décalé + ombre douce. */
export const Arch: React.FC<{
  w: number;
  h: number;
  children: React.ReactNode;
  border?: number;
  outline?: number;
}> = ({w, h, children, border = 10, outline = 18}) => {
  const r = w / 2;
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div
        style={{
          position: 'absolute',
          left: -outline,
          top: -outline,
          width: w + outline * 2,
          height: h + outline * 2,
          borderRadius: `${r + outline}px ${r + outline}px 10px 10px`,
          border: `2.5px solid ${C.gold}`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${r}px ${r}px 6px 6px`,
          background: `linear-gradient(165deg, #B5652B 0%, ${C.brown} 55%, ${C.brownDeep} 100%)`,
          padding: border,
          boxShadow: '0 44px 70px -24px rgba(70,30,8,0.55)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: `${r - border}px ${r - border}px 2px 2px`,
            overflow: 'hidden',
            background: C.sand,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/** Bandeau marron (comme les étiquettes de l'affiche). */
export const Band: React.FC<{w: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  w,
  children,
  style,
}) => (
  <div
    style={{
      position: 'relative',
      width: w,
      borderRadius: 24,
      background: `linear-gradient(180deg, #92501F 0%, ${C.brown} 50%, #6A330E 100%)`,
      boxShadow: '0 34px 56px -20px rgba(60,25,5,0.6)',
      padding: '30px 34px 32px',
      textAlign: 'center',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 11,
        borderRadius: 15,
        border: '1.5px solid rgba(231,200,148,0.5)',
        pointerEvents: 'none',
      }}
    />
    {children}
  </div>
);

/** Révélation par masque : le contenu monte depuis le bas. */
export const MaskUp: React.FC<{p: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  children,
  style,
}) => (
  <div style={{overflow: 'hidden', padding: '0.06em 0.1em', ...style}}>
    <div style={{transform: `translateY(${(1 - p) * 110}%)`, opacity: p <= 0 ? 0 : 1}}>{children}</div>
  </div>
);

/** Fondu + montée. */
export const FadeUp: React.FC<{p: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  dy = 36,
  children,
  style,
}) => <div style={{opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style}}>{children}</div>;

/** Écriture à la main : masque qui balaie de gauche à droite (bord doux). */
export const WriteOn: React.FC<{p: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  p,
  children,
  style,
}) => {
  const edge = p * 124 - 12;
  const mask = `linear-gradient(90deg, #000 ${edge - 12}%, rgba(0,0,0,0) ${edge}%)`;
  return <div style={{WebkitMaskImage: mask, maskImage: mask, ...style}}>{children}</div>;
};

/** Filet doré avec losange central. */
export const Divider: React.FC<{w?: number; p?: number; color?: string}> = ({w = 420, p = 1, color = C.gold}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, opacity: p}}>
    <div style={{height: 2, width: (w / 2 - 30) * p, background: `linear-gradient(90deg, rgba(0,0,0,0), ${color})`}} />
    <div style={{width: 16, height: 16, transform: `rotate(45deg) scale(${p})`, background: color}} />
    <div style={{height: 2, width: (w / 2 - 30) * p, background: `linear-gradient(90deg, ${color}, rgba(0,0,0,0))`}} />
  </div>
);

/** Ruban à encoches. */
export const Ribbon: React.FC<{w: number; h: number; color?: string; children: React.ReactNode}> = ({
  w,
  h,
  color = C.terracotta,
  children,
}) => {
  const n = h * 0.32;
  return (
    <div style={{position: 'relative', width: w, height: h, filter: 'drop-shadow(0 18px 24px rgba(90,40,10,0.35))'}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`rib-${w}-${h}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C8743C" />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        </defs>
        <polygon
          points={`0,0 ${w},0 ${w - n},${h / 2} ${w},${h} 0,${h} ${n},${h / 2}`}
          fill={`url(#rib-${w}-${h})`}
        />
        <polygon
          points={`${n + 14},8 ${w - n - 14},8 ${w - n - 14},${h - 8} ${n + 14},${h - 8}`}
          fill="none"
          stroke="rgba(255,240,215,0.45)"
          strokeWidth={1.5}
        />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {children}
      </div>
    </div>
  );
};

/** Liseré doré fin autour de toute la vidéo. */
export const FrameBorder: React.FC<{opacity?: number}> = ({opacity = 0.55}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
    <div style={{position: 'absolute', inset: 30, border: `1.5px solid ${C.gold}`, borderRadius: 26}} />
  </AbsoluteFill>
);

export const centerX: React.CSSProperties = {position: 'absolute', left: 0, width: '100%', textAlign: 'center'};

export const textShadow = '0 6px 26px rgba(20,8,2,0.45)';

export const priceStyle = (size: number, color: string = C.white): React.CSSProperties => ({
  fontFamily: F.serif,
  fontWeight: 700,
  fontSize: size,
  color,
  lineHeight: 1,
  fontVariantNumeric: 'lining-nums tabular-nums',
  whiteSpace: 'nowrap',
});
