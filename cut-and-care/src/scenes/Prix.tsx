import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, F} from '../theme';
import {EASE_IN, EASE_IN_OUT, EASE_OUT, FPS, LEAD, T, f, prog, span} from '../timeline';
import {Arch, Band, Divider, FadeUp, MaskUp, Photo, Ribbon, centerX, priceStyle} from '../components/ui';
import {Label, Note, PriceLine} from '../components/labels';

const SLIDE = 300;
const OUT_SLIDE = 220;
/** entrée d'une carte (un peu après la sortie de la précédente) */
const IN = 0.04;
/** sortie d'une carte avant le mot suivant */
const OUT = 0.22;

/** En-tête persistant pendant les tarifs. */
export const PriceHeader: React.FC<{frame: number}> = ({frame}) => {
  const t0 = T.tissage.start - LEAD - 0.02;
  const t1 = T.soins.start - LEAD;
  if (frame < f(t0) || frame > f(t1 + 0.4)) return null;
  const a = prog(frame, t0, 0.5);
  const b = prog(frame, t1, 0.3, EASE_IN_OUT);
  return (
    <div style={{...centerX, top: 168, opacity: a * (1 - b), transform: `translateY(${(1 - a) * -20}px)`}}>
      <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 50, letterSpacing: '0.32em', marginLeft: '0.32em', color: C.brown}}>
        NOS PRIX
      </div>
      <div style={{fontFamily: F.body, fontStyle: 'italic', fontWeight: 500, fontSize: 46, color: C.terracotta, marginTop: 0}}>
        du mardi au vendredi
      </div>
      <div style={{marginTop: 8}}>
        <Divider w={360} p={a} />
      </div>
    </div>
  );
};

/** Carte : arrive de la droite, sort par la gauche. */
const Card: React.FC<{frame: number; inAt: number; outAt: number; top?: number; children: React.ReactNode}> = ({
  frame,
  inAt,
  outAt,
  top = 330,
  children,
}) => {
  if (frame < f(inAt) || frame > f(outAt + 0.5)) return null;
  const pin = prog(frame, inAt, 0.5);
  const pout = prog(frame, outAt, 0.3, EASE_IN);
  const fadeOut = prog(frame, outAt, 0.24, EASE_OUT);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: pin * (1 - fadeOut),
        transform: `translateX(${(1 - pin) * SLIDE - pout * OUT_SLIDE}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** 3 · « Tissage, ouvert ou fermé : sept mille neuf cents. » */
export const Tissage: React.FC<{frame: number}> = ({frame}) => {
  const {tissage, nattes} = T;
  const inAt = tissage.start - LEAD - IN;
  const outAt = nattes.start - LEAD - OUT;
  const kb = span(frame, inAt, outAt + 0.3, 1.32, 1.18, EASE_OUT);
  return (
    <Card frame={frame} inAt={inAt} outAt={outAt}>
      <Arch w={700} h={830}>
        <Photo src="tissage.jpg" focus={[0.4, 0.6]} scale={kb} />
      </Arch>
      <Band w={800} style={{marginTop: -64}}>
        <Label p={prog(frame, tissage.start, 0.5)}>TISSAGE</Label>
        <Note p={prog(frame, tissage.ouvert, 0.5)}>ouvert ou fermé</Note>
        <div style={{marginTop: 6}}>
          <PriceLine p={prog(frame, tissage.prix - 0.06, 0.48)} value="7 900" />
        </div>
      </Band>
    </Card>
  );
};

/** 4 · « Nattes : dix mille, tresses : quinze mille, mèches incluses. » */
export const NattesTresses: React.FC<{frame: number}> = ({frame}) => {
  const {nattes, tresses, twist} = T;
  const outAt = twist.start - LEAD - OUT;
  if (frame < f(nattes.start - LEAD - IN) || frame > f(outAt + 0.4)) return null;
  const pout = prog(frame, outAt, 0.3, EASE_IN);
  const kbN = span(frame, nattes.start - 0.3, outAt + 0.3, 1.14, 1.02, EASE_OUT);
  const kbT = span(frame, tresses.start - 0.3, outAt + 0.3, 1.34, 1.24, EASE_OUT);
  const rib = spring({frame: frame - f(tresses.meches - 0.06), fps: FPS, config: {damping: 13, stiffness: 150, mass: 0.7}});

  const small = (inAt: number, left: number, src: string, focus: [number, number], kb: number, label: string, pLabel: number, value: string, pPrice: number) => {
    const pin = prog(frame, inAt, 0.55);
    return (
      <div
        style={{
          position: 'absolute',
          top: 352,
          left,
          width: 470,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: pin,
          transform: `translateX(${(1 - pin) * 260}px)`,
        }}
      >
        <Arch w={440} h={630} outline={14}>
          <Photo src={src} focus={focus} scale={kb} />
        </Arch>
        <Band w={466} style={{marginTop: -56, padding: '24px 18px 26px'}}>
          <Label p={pLabel} size={54}>
            {label}
          </Label>
          <div style={{marginTop: 4}}>
            <PriceLine p={pPrice} value={value} size={80} />
          </div>
        </Band>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{opacity: 1 - prog(frame, outAt, 0.24, EASE_OUT), transform: `translateX(${-pout * OUT_SLIDE}px)`}}>
      {small(nattes.start - LEAD - IN, 46, 'nattes.jpg', [0.6, 0.42], kbN, 'NATTES', prog(frame, nattes.start, 0.45), '10 000', prog(frame, nattes.prix - 0.06, 0.45))}
      {small(tresses.start - LEAD - IN, 564, 'tresses-1.jpg', [0.64, 0.6], kbT, 'TRESSES', prog(frame, tresses.start, 0.45), '15 000', prog(frame, tresses.prix - 0.06, 0.45))}
      <div
        style={{
          position: 'absolute',
          top: 1212,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: Math.min(1, rib * 1.4),
          transform: `scale(${interpolate(rib, [0, 1], [0.55, 1])}) rotate(${interpolate(rib, [0, 1], [4, -1.5])}deg)`,
        }}
      >
        <Ribbon w={800} h={128}>
          <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 60, letterSpacing: '0.12em', marginLeft: '0.12em', color: C.white}}>
            MÈCHES INCLUSES
          </div>
        </Ribbon>
      </div>
    </AbsoluteFill>
  );
};

/** 5-6 · « Micro twist : quinze mille. Micro twist locks, taille quatorze : cinquante-cinq mille, mèches incluses. » */
export const TwistLocks: React.FC<{frame: number}> = ({frame}) => {
  const {twist, locks, coupe} = T;
  const inAt = twist.start - LEAD - IN;
  const outAt = coupe.start - LEAD - OUT;
  const zBase = span(frame, inAt, locks.start - 0.1, 1.08, 1.0, EASE_OUT);
  const zLocks = span(frame, locks.start - 0.2, locks.start + 0.95, 0, 1, EASE_IN_OUT);
  const zDrift = span(frame, locks.start + 0.95, outAt + 0.3, 0, 1, (t: number) => t);
  const scale = zBase + zLocks * 0.5 + zDrift * 0.07;
  const swap = prog(frame, locks.start - 0.14, 0.3, EASE_IN_OUT);
  const noteH = 62 * prog(frame, locks.taille - 0.2, 0.35, EASE_IN_OUT);
  const abs: React.CSSProperties = {position: 'absolute', left: 0, right: 0, top: 0};
  return (
    <Card frame={frame} inAt={inAt} outAt={outAt}>
      <Arch w={700} h={830}>
        <Photo src="micro-twist.jpg" focus={[0.66, 0.6]} scale={scale} />
      </Arch>
      <Band w={840} style={{marginTop: -64}}>
        <div style={{position: 'relative', height: 72}}>
          <div style={{...abs, opacity: 1 - swap}}>
            <Label p={prog(frame, twist.start, 0.5)}>MICRO TWIST</Label>
          </div>
          <div style={{...abs, opacity: swap}}>
            <Label p={prog(frame, locks.start, 0.5)} size={56}>
              MICRO TWIST LOCKS
            </Label>
          </div>
        </div>
        <div style={{height: noteH, overflow: 'hidden'}}>
          <Note p={prog(frame, locks.taille, 0.45)}>taille 14</Note>
        </div>
        <div style={{position: 'relative', height: 130, marginTop: 4}}>
          <div style={{...abs, opacity: 1 - swap}}>
            <PriceLine p={prog(frame, twist.prix - 0.06, 0.45)} value="15 000" />
          </div>
          <div style={abs}>
            <PriceLine p={prog(frame, locks.prix - 0.06, 0.45)} value="55 000" />
          </div>
        </div>
        <div style={{height: 62 * prog(frame, locks.meches - 0.2, 0.35, EASE_IN_OUT), overflow: 'hidden'}}>
          <Note p={prog(frame, locks.meches - 0.04, 0.45)}>mèches incluses</Note>
        </div>
      </Band>
    </Card>
  );
};

/** 7 · « Coupe : douze mille, maintenance : quatre mille. » */
export const Coupe: React.FC<{frame: number}> = ({frame}) => {
  const {coupe, soins} = T;
  const inAt = coupe.start - LEAD - IN;
  const outAt = soins.start - LEAD + 0.12;
  const kb = span(frame, inAt, outAt + 0.5, 1.12, 1.0, EASE_OUT);
  const row = (label: string, value: string, pL: number, pP: number) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '8px 6px'}}>
      <FadeUp p={pL} dy={14}>
        <span style={{fontFamily: F.logo, fontWeight: 700, fontSize: 50, letterSpacing: '0.1em', color: C.white, whiteSpace: 'nowrap'}}>
          {label}
        </span>
      </FadeUp>
      <div style={{flex: 1, height: 0, borderBottom: `4px dotted rgba(231,200,148,${0.75 * pL})`, marginTop: 18}} />
      <MaskUp p={pP}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
          <span style={priceStyle(74)}>{value}</span>
          <span style={{...priceStyle(32, C.goldLight), letterSpacing: '0.08em'}}>FCFA</span>
        </div>
      </MaskUp>
    </div>
  );
  return (
    <Card frame={frame} inAt={inAt} outAt={outAt}>
      <Arch w={700} h={800}>
        <Photo src="coupe.jpg" focus={[0.52, 0.6]} scale={kb} />
      </Arch>
      <Band w={890} style={{marginTop: -64, padding: '30px 44px 30px'}}>
        {row('COUPE', '12 000', prog(frame, coupe.start, 0.45), prog(frame, coupe.prix - 0.06, 0.45))}
        {row('MAINTENANCE', '4 000', prog(frame, coupe.maintenance, 0.45), prog(frame, coupe.maintenancePrix - 0.06, 0.45))}
      </Band>
    </Card>
  );
};
