import React from 'react';
import {C, F} from '../theme';

/**
 * Logo « en croix » comme l'enseigne murale du salon :
 * CUT & CARE à l'horizontale, STYLING à la verticale qui partage le T de CUT.
 * pLetter(i) donne la progression d'apparition de chaque lettre (0→1).
 */
export const CrossLogo: React.FC<{
  scale?: number;
  color?: string;
  pLetter?: (i: number) => number;
}> = ({scale = 1, color = C.ink, pLetter = () => 1}) => {
  const big = 112 * scale;
  const small = 80 * scale;
  const vert = 74 * scale;
  let n = 0;
  const L = (ch: string, size: number, extra?: React.CSSProperties) => {
    const p = pLetter(n++);
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize: size,
          opacity: p,
          transform: `translateY(${(1 - p) * 24 * scale}px)`,
          ...extra,
        }}
      >
        {ch}
      </span>
    );
  };
  const hTop = L('C', big);
  const hU = L('U', small);
  const tP = pLetter(n++);
  const sP = pLetter(n++);
  const vertical = 'YLING'.split('').map((c) => ({c, p: pLetter(n++)}));
  const rest = [L('&', small * 0.82, {margin: `0 ${4 * scale}px`}), L('C', big), L('A', small), L('R', small), L('E', small)];

  return (
    <div
      style={{
        fontFamily: F.logo,
        fontWeight: 700,
        color,
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        letterSpacing: `${2 * scale}px`,
        textShadow: '0 3px 0 rgba(0,0,0,0.08)',
      }}
    >
      {hTop}
      {hU}
      <span style={{position: 'relative', display: 'inline-block', fontSize: small}}>
        <span style={{opacity: tP}}>T</span>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            marginBottom: 6 * scale,
            transform: `translate(-50%, ${(1 - sP) * -20 * scale}px)`,
            fontSize: vert * 1.06,
            opacity: sP,
          }}
        >
          S
        </span>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            marginTop: 8 * scale,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: vert,
            lineHeight: 1.02,
          }}
        >
          {vertical.map(({c, p}, i) => (
            <span key={i} style={{opacity: p, transform: `translateY(${(1 - p) * -18 * scale}px)`}}>
              {c}
            </span>
          ))}
        </span>
      </span>
      {rest}
    </div>
  );
};

/** Nombre de lettres animables du logo (pour l'échelonnement). */
export const LOGO_LETTERS = 14;
