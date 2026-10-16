import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {EASE_IN_OUT, LEAD, T, f, prog, span} from '../timeline';
import {Divider, Dust, FadeUp, Paper, PlacedPhoto, WriteOn, centerX} from '../components/ui';
import {CrossLogo} from '../components/Logo';
import {InstagramIcon, PinIcon, TikTokIcon, WhatsAppIcon} from '../components/icons';

const Row: React.FC<{p: number; icons: React.ReactNode; children: React.ReactNode}> = ({p, icons, children}) => (
  <FadeUp p={p} dy={22} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
    <div style={{display: 'flex', gap: 8}}>{icons}</div>
    <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40, color: C.brownDeep, whiteSpace: 'nowrap'}}>{children}</div>
  </FadeUp>
);

/** 14 · « Le style, le soin, la beauté. » — zoom sur le vrai cadre du salon, puis carte finale. */
export const Final: React.FC<{frame: number; whatsapp: string; handle: string; adresse: string; yango: string}> = ({
  frame,
  whatsapp,
  handle,
  adresse,
  yango,
}) => {
  const {slogan} = T;
  const t0 = slogan.start - LEAD - 0.06;
  if (frame < f(t0)) return null;
  const bg = prog(frame, t0, 0.35, EASE_IN_OUT);
  // le cadre « LE STYLE LE SOIN LA BEAUTÉ » (photo collation, centre ≈ 547,283) vient au centre
  const z = span(frame, t0, slogan.endCard + 0.35, 0, 1, EASE_IN_OUT);
  const k = 1.5 + 1.35 * z;
  const at: [number, number] = [820.5 - 220.5 * z, 424.5 + 335.5 * z];

  const card = prog(frame, slogan.endCard, 0.5, EASE_IN_OUT);
  const letter = (i: number) => prog(frame, slogan.endCard + 0.1 + i * 0.045, 0.45);
  const l1 = prog(frame, slogan.endCard + 0.05, 0.45, EASE_IN_OUT);
  const l2 = prog(frame, slogan.beaute - 0.02, 0.55, EASE_IN_OUT);
  const pTop = prog(frame, slogan.endCard + 0.2, 0.5);
  const pDiv = prog(frame, slogan.beaute + 0.25, 0.5);
  const row = (i: number) => prog(frame, slogan.beaute + 0.35 + i * 0.12, 0.45);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: bg, overflow: 'hidden', background: C.brownDeep}}>
        <PlacedPhoto src="salon-collation.jpg" natural={[720, 1280]} k={k} anchor={[547, 283]} at={at} />
        <AbsoluteFill style={{background: 'radial-gradient(75% 50% at 52% 42%, rgba(0,0,0,0) 55%, rgba(25,10,3,0.55) 100%)'}} />
      </AbsoluteFill>
      {card > 0 && (
        <AbsoluteFill style={{opacity: card}}>
          <Paper />
          <Dust frame={frame} seed="final" opacity={0.45} count={18} />
          <FadeUp p={pTop} style={{...centerX, top: 150}}>
            <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30, letterSpacing: '0.24em', marginLeft: '0.24em', color: C.terracotta}}>
              OFFRE SEMAINE · DU MARDI AU VENDREDI
            </div>
          </FadeUp>
          <div style={{...centerX, top: 300, display: 'flex', justifyContent: 'center'}}>
            <CrossLogo scale={0.86} color={C.ink} pLetter={letter} />
          </div>
          <div style={{...centerX, top: 760, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <WriteOn p={l1}>
              <div style={{fontFamily: F.script, fontSize: 112, color: C.brown, lineHeight: 1.25, padding: '0 40px'}}>Le style, le soin,</div>
            </WriteOn>
            <WriteOn p={l2} style={{marginTop: -18}}>
              <div style={{fontFamily: F.script, fontSize: 112, color: C.brown, lineHeight: 1.25, padding: '0 40px'}}>la beauté.</div>
            </WriteOn>
          </div>
          <div style={{...centerX, top: 1046}}>
            <Divider w={520} p={pDiv} />
          </div>
          <div style={{position: 'absolute', top: 1100, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
            <Row p={row(0)} icons={<WhatsAppIcon size={60} />}>
              {whatsapp}
            </Row>
            <Row p={row(1)} icons={[<TikTokIcon key="t" size={60} />, <InstagramIcon key="i" size={60} />]}>
              {handle}
            </Row>
            <Row p={row(2)} icons={<PinIcon size={60} />}>
              {adresse} · Yango : {yango}
            </Row>
            <FadeUp p={row(3)} dy={18}>
              <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 32, letterSpacing: '0.22em', marginLeft: '0.22em', color: C.terracotta, marginTop: 6}}>
                SERVICE À DOMICILE
              </div>
            </FadeUp>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
