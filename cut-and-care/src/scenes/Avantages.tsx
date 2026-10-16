import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, F} from '../theme';
import {EASE_IN_OUT, EASE_OUT, FPS, LEAD, T, clamp, f, prog, span} from '../timeline';
import {Arch, Band, Dust, FadeUp, Paper, Photo, PlacedPhoto, WriteOn, centerX, priceStyle, textShadow} from '../components/ui';
import {Label, Note} from '../components/labels';
import {CheckIcon, HouseIcon, StudentCardIcon} from '../components/icons';

/** Ouverture « en arche » d'une scène photo (0 = petite arche au centre, 1 = plein cadre). */
export const archClip = (open: number) => {
  const ix = interpolate(open, [0, 1], [320, 0], clamp);
  const itop = interpolate(open, [0, 1], [600, 0], clamp);
  const ibot = interpolate(open, [0, 1], [500, 0], clamp);
  const r = interpolate(open, [0, 1], [220, 0], clamp);
  return `inset(${itop}px ${ix}px ${ibot}px ${ix}px round ${r}px ${r}px 0px 0px)`;
};

/** Vapeur qui s'élève d'une tasse (coordonnées photo, 1 unité = 1 px de la photo 720 px). */
const Steam: React.FC<{x: number; y: number; frame: number; seed: number}> = ({x, y, frame, seed}) => {
  const h = 78;
  const paths = [0, 1, 2].map((i) => {
    const ph = frame / 13 + seed * 2.3 + i * 2.1;
    const pts: string[] = [];
    for (let s = 0; s <= 14; s++) {
      const yy = h - (s * h) / 14;
      const amp = 1.6 + s * 0.55;
      const xx = 30 + (i - 1) * 4.5 + Math.sin(ph - s * 0.55) * amp;
      pts.push(`${s === 0 ? 'M' : 'L'}${xx.toFixed(2)} ${yy.toFixed(2)}`);
    }
    return pts.join(' ');
  });
  const breathe = 0.65 + 0.35 * Math.sin(frame / 21 + seed);
  return (
    <svg
      width={60}
      height={h}
      viewBox={`0 0 60 ${h}`}
      style={{position: 'absolute', left: x - 30, top: y - h, overflow: 'visible', opacity: breathe, mixBlendMode: 'screen'}}
    >
      <defs>
        <linearGradient id={`steam-${seed}`} gradientUnits="userSpaceOnUse" x1="0" y1={h} x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`steam-blur-${seed}`} x="-50%" y="-20%" width="200%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#steam-${seed})`} strokeWidth={3.4 - i * 0.6} strokeLinecap="round" filter={`url(#steam-blur-${seed})`} />
      ))}
    </svg>
  );
};

const Pill: React.FC<{p: number; children: React.ReactNode}> = ({p, children}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      background: 'rgba(252,248,242,0.96)',
      borderRadius: 80,
      padding: '22px 50px 22px 24px',
      border: `2px solid ${C.goldLight}`,
      boxShadow: '0 26px 50px -18px rgba(25,10,2,0.65)',
      opacity: p,
      transform: `translateY(${(1 - p) * 46}px) scale(${0.95 + 0.05 * p})`,
    }}
  >
    <CheckIcon size={80} />
    <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 42, color: C.brownDeep, lineHeight: 1.2}}>{children}</div>
  </div>
);

/** 8 · « Shampoing traitant et hydratant inclus, pause collation offerte. » */
export const Soins: React.FC<{frame: number}> = ({frame}) => {
  const {soins, etudiant} = T;
  const t0 = soins.start - LEAD - 0.06;
  if (frame < f(t0) || frame > f(etudiant.start + 0.3)) return null;
  const open = prog(frame, t0, 0.62, EASE_IN_OUT);
  const k = span(frame, t0, etudiant.start + 0.3, 2.2, 2.38, (t: number) => t);
  const pTitle = prog(frame, soins.start + 0.1, 0.8, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{clipPath: archClip(open), opacity: interpolate(open, [0, 0.15], [0, 1], clamp)}}>
      <AbsoluteFill style={{overflow: 'hidden', background: C.brownDeep}}>
        <PlacedPhoto src="salon-fauteuil.jpg" natural={[720, 1280]} k={k} anchor={[120, 760]} at={[264, 880]}>
          <Steam x={87} y={758} frame={frame} seed={1} />
          <Steam x={155} y={746} frame={frame} seed={2} />
        </PlacedPhoto>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(36,16,6,0.6) 0%, rgba(36,16,6,0.05) 26%, rgba(36,16,6,0) 50%, rgba(30,12,4,0.55) 72%, rgba(26,10,3,0.85) 100%)',
        }}
      />
      <Dust frame={frame} color={C.goldLight} seed="soins" opacity={0.4} count={14} />
      <div style={{...centerX, top: 190, display: 'flex', justifyContent: 'center'}}>
        <WriteOn p={pTitle}>
          <div style={{fontFamily: F.script, fontSize: 150, color: C.white, textShadow, padding: '0 40px', lineHeight: 1.3}}>Détendez-vous…</div>
        </WriteOn>
      </div>
      <div style={{position: 'absolute', top: 1100, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Pill p={prog(frame, soins.start + 0.02, 0.55)}>
          Shampooing traitant
          <br />& hydratant inclus
        </Pill>
        <Pill p={prog(frame, soins.collation - 0.04, 0.55)}>Pause collation offerte</Pill>
      </div>
    </AbsoluteFill>
  );
};

/** 9 · « Carte étudiant ou scolaire ? Moins trente-trois pour cent sur braids et tresses simples. » */
export const Etudiant: React.FC<{frame: number}> = ({frame}) => {
  const {etudiant, domicile} = T;
  const t0 = etudiant.start - LEAD - 0.08;
  if (frame < f(t0) || frame > f(domicile.start + 0.35)) return null;
  const bg = prog(frame, t0, 0.35, EASE_IN_OUT);
  const pin = prog(frame, t0 + 0.04, 0.6);
  const kb = span(frame, t0, domicile.start + 0.4, 1.1, 1.0, EASE_OUT);
  const card = spring({frame: frame - f(etudiant.start + 0.02), fps: FPS, config: {damping: 15, stiffness: 120}});
  const badge = spring({frame: frame - f(etudiant.moins - 0.05), fps: FPS, config: {damping: 10, stiffness: 170, mass: 0.8}});
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Paper />
      <Dust frame={frame} seed="etudiant" opacity={0.4} count={14} />
      <div
        style={{
          position: 'absolute',
          top: 318,
          left: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: pin,
          transform: `translateY(${(1 - pin) * 60}px)`,
        }}
      >
        <Arch w={660} h={800}>
          <Photo src="tresses-2.jpg" focus={[0.5, 0.6]} scale={kb} />
        </Arch>
        <Band w={830} style={{marginTop: -64}}>
          <Label p={prog(frame, etudiant.start, 0.45)} size={54}>
            CARTE ÉTUDIANT
          </Label>
          <Label p={prog(frame, etudiant.start + 0.25, 0.45)} size={54}>
            OU SCOLAIRE ?
          </Label>
          <div style={{marginTop: 8}}>
            <Note p={prog(frame, etudiant.condition, 0.45)}>sur braids &amp; tresses simples</Note>
          </div>
        </Band>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 54,
          top: 300,
          opacity: Math.min(1, card * 1.3),
          transform: `translateX(${(1 - card) * -260}px) rotate(${interpolate(card, [0, 1], [-30, -11])}deg)`,
          filter: 'drop-shadow(0 22px 26px rgba(70,30,8,0.35))',
        }}
      >
        <StudentCardIcon size={270} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 712,
          top: 262,
          width: 310,
          height: 310,
          opacity: Math.min(1, badge * 1.6),
          transform: `scale(${interpolate(badge, [0, 1], [1.9, 1])}) rotate(${interpolate(badge, [0, 1], [-28, 9])}deg)`,
          filter: 'drop-shadow(0 26px 30px rgba(90,35,8,0.45))',
        }}
      >
        <svg width={310} height={310} viewBox="0 0 100 100" style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="badge-g" cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#D27A3E" />
              <stop offset="1" stopColor="#97461A" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="url(#badge-g)" />
          <circle cx="50" cy="50" r="43.5" fill="none" stroke="rgba(255,236,205,0.7)" strokeWidth="0.9" strokeDasharray="2.2 1.8" />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{display: 'flex', alignItems: 'flex-start'}}>
            <span style={priceStyle(124)}>–33</span>
            <span style={{...priceStyle(62), marginTop: 8, marginLeft: 4}}>%</span>
          </div>
          <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 25, letterSpacing: '0.22em', marginLeft: '0.22em', color: C.goldLight, marginTop: 6}}>
            RÉDUCTION
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 10 · « Service à domicile. » */
export const Domicile: React.FC<{frame: number}> = ({frame}) => {
  const {domicile, reseaux} = T;
  const t0 = domicile.start - LEAD - 0.05;
  if (frame < f(t0) || frame > f(reseaux.start + 0.35)) return null;
  const bg = prog(frame, t0, 0.3, EASE_IN_OUT);
  const disc = spring({frame: frame - f(t0), fps: FPS, config: {damping: 14, stiffness: 140}});
  const draw = prog(frame, t0 + 0.08, 0.8, EASE_IN_OUT);
  const p1 = prog(frame, domicile.start - 0.02, 0.45);
  const p2 = prog(frame, domicile.start + 0.32, 0.6, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Paper />
      <Dust frame={frame} seed="domicile" opacity={0.4} count={14} />
      <div
        style={{
          position: 'absolute',
          left: 540 - 200,
          top: 380,
          width: 400,
          height: 400,
          borderRadius: 200,
          background: `radial-gradient(circle at 50% 40%, ${C.creamLight} 0%, #F1E3D0 100%)`,
          border: `3px solid ${C.gold}`,
          boxShadow: '0 30px 60px -24px rgba(110,50,12,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${interpolate(disc, [0, 1], [0.6, 1])})`,
          opacity: Math.min(1, disc * 1.5),
        }}
      >
        <HouseIcon size={270} p={draw} />
      </div>
      <FadeUp p={p1} style={{...centerX, top: 870}}>
        <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 108, letterSpacing: '0.08em', color: C.brown, lineHeight: 1.12}}>
          SERVICE
          <br />À DOMICILE
        </div>
      </FadeUp>
      <div style={{...centerX, top: 1140, display: 'flex', justifyContent: 'center'}}>
        <WriteOn p={p2}>
          <div style={{fontFamily: F.script, fontSize: 124, color: C.terracotta, padding: '0 40px', lineHeight: 1.3}}>on vient chez vous</div>
        </WriteOn>
      </div>
    </AbsoluteFill>
  );
};
