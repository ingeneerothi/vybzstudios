import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, F} from '../theme';
import {EASE_IN_OUT, EASE_OUT, FPS, LEAD, T, clamp, f, prog, span} from '../timeline';
import {Arch, Divider, Dust, FadeUp, MaskUp, Paper, Photo, WriteOn, centerX, priceStyle} from '../components/ui';
import {CarIcon, InstagramIcon, PinIcon, TikTokIcon, WhatsAppIcon} from '../components/icons';

/** Texte tapé lettre par lettre entre t0 et t1 (secondes). */
const Typed: React.FC<{frame: number; text: string; t0: number; t1: number; style?: React.CSSProperties}> = ({
  frame,
  text,
  t0,
  t1,
  style,
}) => {
  const n = interpolate(frame, [f(t0), f(t1)], [0.6, text.length], clamp);
  return (
    <span style={{whiteSpace: 'pre', ...style}}>
      {text.split('').map((ch, i) => {
        const p = Math.max(0, Math.min(1, n - i));
        return (
          <span key={i} style={{opacity: p, display: 'inline-block', transform: `translateY(${(1 - p) * 18}px)`}}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </span>
  );
};

/** 11 · « TikTok et Instagram : arobase Cut Care zéro un. » */
export const Reseaux: React.FC<{frame: number}> = ({frame}) => {
  const {reseaux, adresse} = T;
  const t0 = reseaux.start - LEAD - 0.05;
  if (frame < f(t0) || frame > f(adresse.start + 0.35)) return null;
  const bg = prog(frame, t0, 0.3, EASE_IN_OUT);
  const thumbs: [string, [number, number]][] = [
    ['tresses-1.jpg', [0.64, 0.6]],
    ['nattes.jpg', [0.6, 0.42]],
    ['tissage.jpg', [0.42, 0.47]],
  ];
  const tk = spring({frame: frame - f(reseaux.start - 0.06), fps: FPS, config: {damping: 12, stiffness: 160, mass: 0.7}});
  const ig = spring({frame: frame - f(reseaux.instagram - 0.06), fps: FPS, config: {damping: 12, stiffness: 160, mass: 0.7}});
  const pFollow = prog(frame, reseaux.start + 0.05, 0.7, EASE_IN_OUT);
  const pLine = prog(frame, reseaux.handleEnd - 0.2, 0.5, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Paper />
      <Dust frame={frame} seed="reseaux" opacity={0.4} count={14} />
      {thumbs.map(([src, focus], i) => {
        const p = prog(frame, t0 + 0.05 + i * 0.1, 0.55);
        const float = Math.sin(frame / 22 + i * 1.7) * 8;
        return (
          <div
            key={src}
            style={{
              position: 'absolute',
              top: 236 + (i === 1 ? -14 : 10),
              left: 112 + i * 300,
              opacity: p,
              transform: `translateY(${(1 - p) * 50 + float}px) rotate(${(i - 1) * 5}deg)`,
            }}
          >
            <Arch w={256} h={330} border={7} outline={11}>
              <Photo src={src} focus={focus} scale={src === 'tresses-1.jpg' ? 1.3 : 1.06} />
            </Arch>
          </div>
        );
      })}
      <div style={{...centerX, top: 612, display: 'flex', justifyContent: 'center'}}>
        <WriteOn p={pFollow}>
          <div style={{fontFamily: F.script, fontSize: 132, color: C.terracotta, padding: '0 40px', lineHeight: 1.3}}>Suivez-nous</div>
        </WriteOn>
      </div>
      <div style={{position: 'absolute', top: 820, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 120}}>
        {[
          {p: tk, icon: <TikTokIcon size={176} />, label: 'TikTok'},
          {p: ig, icon: <InstagramIcon size={176} />, label: 'Instagram'},
        ].map(({p, icon, label}) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              opacity: Math.min(1, p * 1.5),
              transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`,
            }}
          >
            <div style={{filter: 'drop-shadow(0 18px 24px rgba(60,25,5,0.35))'}}>{icon}</div>
            <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 38, color: C.brown}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{...centerX, top: 1112}}>
        <Typed
          frame={frame}
          text="@cutcare01"
          t0={reseaux.handle - 0.05}
          t1={reseaux.handleEnd - 0.12}
          style={{...priceStyle(126, C.brownDeep), fontWeight: 700}}
        />
        <div style={{marginTop: 18}}>
          <Divider w={560} p={pLine} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 12 · « À Angré Djibi un, sur Yango : Cut Care Styling. » */
export const Adresse: React.FC<{frame: number}> = ({frame}) => {
  const {adresse, whatsapp} = T;
  const t0 = adresse.start - LEAD - 0.05;
  if (frame < f(t0) || frame > f(whatsapp.start + 0.35)) return null;
  const bg = prog(frame, t0, 0.3, EASE_IN_OUT);
  const pCard = prog(frame, t0, 0.55);
  const drop = spring({frame: frame - f(adresse.start - 0.02), fps: FPS, config: {damping: 9, stiffness: 140, mass: 0.8}});
  const ring = ((frame - f(adresse.start + 0.3)) % 36) / 36;
  const ringOn = frame > f(adresse.start + 0.3);
  const pName = prog(frame, adresse.start + 0.05, 0.5);
  const yango = spring({frame: frame - f(adresse.yango - 0.06), fps: FPS, config: {damping: 13, stiffness: 150, mass: 0.7}});
  const drive = span(frame, adresse.yango - 0.06, adresse.nom + 0.3, 0, 1, EASE_OUT);
  const road = '#FBF5EC';
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Paper />
      <Dust frame={frame} seed="adresse" opacity={0.4} count={14} />
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 290,
          width: 860,
          height: 560,
          borderRadius: 46,
          overflow: 'hidden',
          border: `3px solid ${C.gold}`,
          boxShadow: '0 36px 70px -26px rgba(90,40,10,0.5)',
          opacity: pCard,
          transform: `translateY(${(1 - pCard) * 50}px)`,
        }}
      >
        <svg width={860} height={560} viewBox="0 0 860 560" style={{display: 'block'}}>
          <rect width="860" height="560" fill="#EEDCC6" />
          <g fill="#E6D0B5">
            <rect x="40" y="30" width="170" height="110" rx="14" />
            <rect x="330" y="20" width="200" height="90" rx="14" />
            <rect x="650" y="30" width="170" height="150" rx="14" />
            <rect x="30" y="230" width="190" height="130" rx="14" />
            <rect x="380" y="200" width="150" height="110" rx="14" />
            <rect x="660" y="390" width="170" height="140" rx="14" />
            <rect x="40" y="440" width="230" height="100" rx="14" />
            <rect x="360" y="440" width="180" height="100" rx="14" />
          </g>
          <path d="M-20 400 C 200 360, 420 430, 880 330" stroke={road} strokeWidth="36" fill="none" />
          <path d="M270 -20 C 300 160, 250 330, 320 580" stroke={road} strokeWidth="28" fill="none" />
          <path d="M575 -20 L 610 580" stroke={road} strokeWidth="22" fill="none" />
          <path d="M-20 175 L 880 140" stroke={road} strokeWidth="20" fill="none" />
          <path d="M-20 400 C 200 360, 420 430, 880 330" stroke="#E2C9A6" strokeWidth="3" strokeDasharray="16 14" fill="none" />
          <path
            d="M70 520 C 180 470, 260 440, 300 400 S 380 300, 430 268"
            stroke={C.terracotta}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="2 16"
            fill="none"
            opacity={drive}
          />
        </svg>
        {ringOn && (
          <div
            style={{
              position: 'absolute',
              left: 430 - 110 * ring,
              top: 268 - 40 * ring,
              width: 220 * ring,
              height: 80 * ring,
              borderRadius: '50%',
              border: `3px solid ${C.terracotta}`,
              opacity: 1 - ring,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: 430 - 26,
            top: 260,
            width: 52,
            height: 16,
            borderRadius: '50%',
            background: 'rgba(80,35,8,0.35)',
            transform: `scale(${interpolate(drop, [0, 1], [0.3, 1], clamp)})`,
            opacity: Math.min(1, drop),
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 430 - 75,
            top: 268 - 150,
            transform: `translateY(${interpolate(drop, [0, 1], [-420, 0])}px)`,
            opacity: Math.min(1, drop * 3),
            filter: 'drop-shadow(0 14px 14px rgba(70,30,8,0.35))',
          }}
        >
          <PinIcon size={150} />
        </div>
      </div>
      <FadeUp p={pName} style={{...centerX, top: 905}}>
        <div style={{fontFamily: F.serif, fontWeight: 700, fontSize: 112, color: C.brownDeep, lineHeight: 1.05}}>Angré Djibi 1</div>
      </FadeUp>
      <div
        style={{
          position: 'absolute',
          top: 1090,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 26,
          opacity: Math.min(1, yango * 1.4),
          transform: `translateY(${(1 - yango) * 40}px)`,
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            background: `linear-gradient(160deg, #C8743C, ${C.brown})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 26px -10px rgba(90,40,10,0.5)',
            transform: `translateX(${(1 - drive) * -30}px)`,
          }}
        >
          <CarIcon size={62} />
        </div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 52, color: C.brown}}>Sur Yango</div>
      </div>
      <div style={{...centerX, top: 1230}}>
        <Typed
          frame={frame}
          text="« Cut Care Styling »"
          t0={adresse.nom - 0.04}
          t1={adresse.nomEnd}
          style={{fontFamily: F.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 78, color: C.terracotta}}
        />
      </div>
    </AbsoluteFill>
  );
};

/** 13 · « Écrivez-nous sur WhatsApp : zéro sept, un sept, deux deux, un sept, cinq quatre. » */
export const WhatsApp: React.FC<{frame: number; pairs: string[]}> = ({frame, pairs}) => {
  const {whatsapp, slogan} = T;
  const t0 = whatsapp.start - LEAD - 0.05;
  if (frame < f(t0) || frame > f(slogan.start + 0.35)) return null;
  const bg = prog(frame, t0, 0.3, EASE_IN_OUT);
  const icon = spring({frame: frame - f(whatsapp.start - 0.06), fps: FPS, config: {damping: 10, stiffness: 150, mass: 0.8}});
  const pWrite = prog(frame, whatsapp.start + 0.02, 0.75, EASE_IN_OUT);
  const pSur = prog(frame, whatsapp.start + 0.55, 0.5);
  const pCard = prog(frame, whatsapp.pairs[0] - 0.45, 0.5);
  const pDone = prog(frame, whatsapp.end - 0.2, 0.5, EASE_IN_OUT);
  const rings = [0, 1, 2].map((i) => {
    const local = frame - f(whatsapp.start + 0.2) - i * 16;
    if (local < 0) return null;
    const r = (local % 48) / 48;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 115 - 115 * (1 + r * 0.9),
          top: 115 - 115 * (1 + r * 0.9),
          width: 230 * (1 + r * 0.9),
          height: 230 * (1 + r * 0.9),
          borderRadius: '50%',
          border: `3px solid ${C.whatsapp}`,
          opacity: 0.55 * (1 - r),
        }}
      />
    );
  });
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Paper />
      <Dust frame={frame} seed="whatsapp" opacity={0.4} count={14} />
      <div
        style={{
          position: 'absolute',
          left: 540 - 115,
          top: 290,
          width: 230,
          height: 230,
          transform: `scale(${interpolate(icon, [0, 1], [0.4, 1])})`,
          opacity: Math.min(1, icon * 1.5),
        }}
      >
        {rings}
        <WhatsAppIcon size={230} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 20px 26px rgba(10,80,40,0.35))'}} />
      </div>
      <div style={{...centerX, top: 560, display: 'flex', justifyContent: 'center'}}>
        <WriteOn p={pWrite}>
          <div style={{fontFamily: F.script, fontSize: 158, color: C.brown, padding: '0 40px', lineHeight: 1.3}}>Écrivez-nous</div>
        </WriteOn>
      </div>
      <FadeUp p={pSur} style={{...centerX, top: 790}}>
        <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 60, letterSpacing: '0.2em', marginLeft: '0.2em', color: C.terracotta}}>
          SUR WHATSAPP
        </div>
      </FadeUp>
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 930,
          width: 960,
          height: 300,
          borderRadius: 44,
          background: C.creamLight,
          border: `3px solid ${C.gold}`,
          boxShadow: `0 34px 70px -28px rgba(90,40,10,${0.45 + 0.2 * pDone})`,
          opacity: pCard,
          transform: `translateY(${(1 - pCard) * 40}px) scale(${1 + 0.025 * Math.sin(pDone * Math.PI)})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <div style={{...priceStyle(54, C.terracotta), letterSpacing: '0.06em'}}>+225</div>
        <div style={{display: 'flex', gap: 34}}>
          {pairs.map((pair, i) => (
            <MaskUp key={i} p={prog(frame, whatsapp.pairs[i] - 0.05, 0.32)}>
              <span style={priceStyle(118, C.brownDeep)}>{pair}</span>
            </MaskUp>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
