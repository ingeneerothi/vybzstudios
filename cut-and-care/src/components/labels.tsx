import React from 'react';
import {C, F} from '../theme';
import {FadeUp, MaskUp, priceStyle} from './ui';

/** Intitulé en capitales (Cinzel), dans les bandeaux marron. */
export const Label: React.FC<{p: number; size?: number; color?: string; children: React.ReactNode}> = ({
  p,
  size = 62,
  color = C.white,
  children,
}) => (
  <FadeUp p={p} dy={22}>
    <div
      style={{
        fontFamily: F.logo,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: `${0.14 + (1 - p) * 0.18}em`,
        color,
        lineHeight: 1.12,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  </FadeUp>
);

/** Précision en italique (Cormorant). */
export const Note: React.FC<{p: number; size?: number; color?: string; children: React.ReactNode}> = ({
  p,
  size = 52,
  color = '#F4DEC0',
  children,
}) => (
  <FadeUp p={p} dy={16}>
    <div style={{fontFamily: F.body, fontStyle: 'italic', fontWeight: 500, fontSize: size, color, lineHeight: 1.15, whiteSpace: 'nowrap'}}>
      {children}
    </div>
  </FadeUp>
);

/** Prix + « FCFA ». */
export const PriceLine: React.FC<{p: number; value: string; size?: number}> = ({p, value, size = 118}) => (
  <MaskUp p={p}>
    <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: size * 0.14}}>
      <span style={priceStyle(size)}>{value}</span>
      <span style={{...priceStyle(size * 0.42, C.goldLight), letterSpacing: '0.08em'}}>FCFA</span>
    </div>
  </MaskUp>
);
