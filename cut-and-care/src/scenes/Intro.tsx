import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, F} from '../theme';
import {EASE_IN_OUT, EASE_OUT, FPS, LEAD, T, clamp, f, prog, span} from '../timeline';
import {Divider, Dust, FadeUp, Paper, Photo, Ribbon, WriteOn, centerX, textShadow} from '../components/ui';

/** 1 · « Mesdames, évitez la foule du week-end. » — le salon calme, vide, lumière chaude. */
export const Hook: React.FC<{frame: number}> = ({frame}) => {
  const {hook, offre} = T;
  if (frame > f(offre.start + 0.7)) return null;

  const kb = span(frame, 0, offre.start + 0.7, 1.17, 1.05, EASE_OUT);
  const brand = interpolate(frame, [0, 24], [0.9, 1], clamp);
  const mes = prog(frame, hook.mesdames - 0.06, 0.72, EASE_IN_OUT);
  const word = (i: number) => prog(frame, hook.evitez + i * 0.11, 0.5);
  const strike = prog(frame, hook.weekend + 0.08, 0.42, EASE_IN_OUT);

  const wordStyle = (p: number): React.CSSProperties => ({
    display: 'inline-block',
    margin: '0 0.2em',
    opacity: p,
    transform: `translateY(${(1 - p) * 42}px)`,
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Photo src="salon-fauteuil.jpg" focus={[0.42, 0.56]} scale={kb} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(36,16,6,0.62) 0%, rgba(36,16,6,0.08) 24%, rgba(36,16,6,0) 42%, rgba(36,16,6,0.5) 64%, rgba(28,12,4,0.9) 100%)',
        }}
      />
      <Dust frame={frame} color={C.goldLight} seed="hook" opacity={0.45} count={18} />

      <div style={{...centerX, top: 168, opacity: brand, transform: `translateY(${(1 - brand) * -18}px)`}}>
        <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 42, letterSpacing: '0.34em', marginLeft: '0.34em', color: C.white}}>
          CUT &amp; CARE
        </div>
        <div style={{fontFamily: F.script, fontSize: 70, color: C.goldLight, marginTop: -12}}>Styling</div>
      </div>

      <div style={{...centerX, top: 1000, display: 'flex', justifyContent: 'center'}}>
        <WriteOn p={mes}>
          <div style={{fontFamily: F.script, fontSize: 184, color: C.white, textShadow, padding: '0 40px', lineHeight: 1.3}}>
            Mesdames,
          </div>
        </WriteOn>
      </div>

      <div
        style={{
          ...centerX,
          top: 1262,
          fontFamily: F.logo,
          fontWeight: 700,
          fontSize: 80,
          letterSpacing: '0.1em',
          color: C.white,
          lineHeight: 1.2,
          textShadow,
        }}
      >
        <div>
          {['ÉVITEZ', 'LA', 'FOULE'].map((w, i) => (
            <span key={w} style={wordStyle(word(i))}>
              {w}
            </span>
          ))}
        </div>
        <div style={{position: 'relative', display: 'inline-block'}}>
          {['DU', 'WEEK-END'].map((w, i) => (
            <span key={w} style={wordStyle(word(i + 3))}>
              {w}
            </span>
          ))}
          <div
            style={{
              position: 'absolute',
              left: -26,
              right: -26,
              top: '47%',
              height: 10,
              borderRadius: 6,
              background: C.goldLight,
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              transform: `rotate(-2.2deg) scaleX(${strike})`,
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

/** 2 · « Offre semaine chez Cut and Care Styling : du mardi au vendredi, coiffez-vous au calme, et économisez. » */
export const Offre: React.FC<{frame: number}> = ({frame}) => {
  const {offre, tissage} = T;
  const t0 = offre.start - LEAD;
  if (frame < f(t0) || frame > f(tissage.start + 0.4)) return null;

  // A — ouverture en arche sur l'enseigne murale
  const open = prog(frame, t0, 0.62, EASE_IN_OUT);
  const ix = interpolate(open, [0, 1], [320, 0], clamp);
  const itop = interpolate(open, [0, 1], [600, 0], clamp);
  const ibot = interpolate(open, [0, 1], [500, 0], clamp);
  const rad = interpolate(open, [0, 1], [220, 0], clamp);
  const kb = span(frame, t0, offre.panel + 0.6, 1.05, 1.2, EASE_IN_OUT);
  const pOffre = prog(frame, offre.start + 0.05, 0.6, EASE_IN_OUT);
  const pSemaine = prog(frame, offre.start + 0.32, 0.55);
  const pChez = prog(frame, offre.chez, 0.55);

  // B — panneau crème qui monte : calendrier + « Coiffez-vous au calme »
  const rise = prog(frame, offre.panel, 0.6, EASE_IN_OUT);
  const panelTop = interpolate(rise, [0, 1], [1980, 0], clamp);
  const out = prog(frame, tissage.start - LEAD - 0.26, 0.22, EASE_OUT);

  const dayActive: Record<string, number> = {
    MAR: offre.mardi,
    MER: offre.mercredi,
    JEU: offre.jeudi,
    VEN: offre.vendredi,
  };
  const strikeWE = prog(frame, offre.vendredi + 0.2, 0.35, EASE_IN_OUT);
  const pDays = prog(frame, offre.panel + 0.25, 0.5);
  const pTitle = prog(frame, offre.mardi - 0.12, 0.5);
  const w1 = prog(frame, offre.coiffez - 0.04, 0.62, EASE_IN_OUT);
  const w2 = prog(frame, offre.calme - 0.02, 0.6, EASE_IN_OUT);
  const ribbon = spring({frame: frame - f(offre.economisez - 0.06), fps: FPS, config: {damping: 13, stiffness: 160, mass: 0.7}});
  const pSub = prog(frame, offre.economisez + 0.3, 0.5);

  return (
    <AbsoluteFill>
      {/* A */}
      {rise < 1 && (
        <AbsoluteFill
          style={{
            clipPath: `inset(${itop}px ${ix}px ${ibot}px ${ix}px round ${rad}px ${rad}px 0px 0px)`,
            opacity: interpolate(open, [0, 0.15], [0, 1], clamp),
          }}
        >
          <AbsoluteFill style={{overflow: 'hidden'}}>
            <Photo src="salon-logo.jpg" focus={[0.7, 0.26]} scale={kb} />
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(36,16,6,0.25) 0%, rgba(36,16,6,0) 30%, rgba(36,16,6,0.35) 52%, rgba(28,12,4,0.86) 100%)',
            }}
          />
          <div style={{...centerX, top: 930}}>
            <WriteOn p={pOffre} style={{display: 'flex', justifyContent: 'center'}}>
              <div style={{fontFamily: F.script, fontSize: 210, color: C.white, textShadow, lineHeight: 1.25, padding: '0 40px'}}>
                Offre
              </div>
            </WriteOn>
          </div>
          <FadeUp p={pSemaine} style={{...centerX, top: 1178}}>
            <div
              style={{
                fontFamily: F.logo,
                fontWeight: 700,
                fontSize: 128,
                letterSpacing: '0.18em',
                marginLeft: '0.18em',
                color: C.white,
                textShadow,
              }}
            >
              SEMAINE
            </div>
          </FadeUp>
          <FadeUp p={pChez} style={{...centerX, top: 1340}}>
            <div style={{fontFamily: F.body, fontStyle: 'italic', fontWeight: 500, fontSize: 66, color: C.goldLight, textShadow}}>
              chez Cut &amp; Care Styling
            </div>
          </FadeUp>
        </AbsoluteFill>
      )}

      {/* B */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: panelTop,
          width: '100%',
          height: 1920,
          borderRadius: '540px 540px 0 0 / 150px 150px 0 0',
          overflow: 'hidden',
          boxShadow: `0 -30px 60px rgba(40,18,6,${0.35 * (1 - rise)})`,
        }}
      >
        <Paper />
        <Dust frame={frame} seed="offre" opacity={0.4} count={16} />
        <div style={{opacity: 1 - out, position: 'absolute', inset: 0}}>
          <FadeUp p={pDays} style={{...centerX, top: 218}}>
            <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 40, letterSpacing: '0.32em', marginLeft: '0.32em', color: C.brown}}>
              CUT &amp; CARE STYLING
            </div>
            <div style={{marginTop: 22}}>
              <Divider w={430} p={pDays} />
            </div>
          </FadeUp>

          <FadeUp p={pTitle} style={{...centerX, top: 368}}>
            <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40, letterSpacing: '0.26em', marginLeft: '0.26em', color: C.terracotta}}>
              DU MARDI AU VENDREDI
            </div>
          </FadeUp>

          <div style={{position: 'absolute', top: 462, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 14}}>
            {DAYS.map((d, i) => {
              const appear = prog(frame, offre.panel + 0.2 + i * 0.04, 0.45);
              const on = dayActive[d] !== undefined ? spring({frame: frame - f(dayActive[d]), fps: FPS, config: {damping: 14, stiffness: 180, mass: 0.6}}) : 0;
              const we = d === 'SAM' || d === 'DIM';
              const dim = d === 'LUN' ? 0.55 : we ? 1 - 0.5 * strikeWE : 1;
              return (
                <div
                  key={d}
                  style={{
                    position: 'relative',
                    width: 118,
                    height: 172,
                    borderRadius: 59,
                    border: `2.5px solid ${on > 0.5 ? 'transparent' : C.beige}`,
                    background: on > 0 ? `linear-gradient(180deg, rgba(178,96,40,${on}) 0%, rgba(110,52,14,${on}) 100%)` : 'transparent',
                    boxShadow: on > 0.5 ? `0 ${18 * on}px ${30 * on}px -10px rgba(110,50,12,0.5)` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                    opacity: appear * dim,
                    transform: `translateY(${(1 - appear) * 40}px) scale(${1 + 0.08 * on - 0.08 * Math.max(0, on - 1)})`,
                  }}
                >
                  <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 34, color: on > 0.5 ? C.white : C.copper, letterSpacing: '0.04em'}}>
                    {d}
                  </div>
                  <div style={{width: 12, height: 12, borderRadius: 6, background: on > 0.5 ? C.goldLight : C.beige}} />
                  {we && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: 'calc(50% - 3px)',
                        width: 'calc(100% - 28px)',
                        height: 6,
                        borderRadius: 3,
                        background: C.terracotta,
                        transform: `rotate(-62deg) scaleX(${strikeWE * 1.75})`,
                        transformOrigin: 'center',
                        opacity: strikeWE > 0 ? 1 : 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{...centerX, top: 700, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <WriteOn p={w1}>
              <div style={{fontFamily: F.script, fontSize: 176, color: C.brown, lineHeight: 1.22, padding: '0 40px'}}>Coiffez-vous</div>
            </WriteOn>
            <WriteOn p={w2} style={{marginTop: -30}}>
              <div style={{fontFamily: F.script, fontSize: 176, color: C.brown, lineHeight: 1.22, padding: '0 40px'}}>au calme</div>
            </WriteOn>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 1168,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              opacity: Math.min(1, ribbon * 1.4),
              transform: `scale(${interpolate(ribbon, [0, 1], [0.55, 1])}) rotate(${interpolate(ribbon, [0, 1], [-6, -2])}deg)`,
            }}
          >
            <Ribbon w={700} h={124}>
              <div style={{fontFamily: F.logo, fontWeight: 700, fontSize: 62, letterSpacing: '0.12em', marginLeft: '0.12em', color: C.white}}>
                &amp; ÉCONOMISEZ
              </div>
            </Ribbon>
          </div>
          <FadeUp p={pSub} style={{...centerX, top: 1330}}>
            <div style={{fontFamily: F.body, fontStyle: 'italic', fontWeight: 500, fontSize: 52, color: C.copper}}>
              Évitez l’affluence du week-end
            </div>
          </FadeUp>
        </div>
      </div>
    </AbsoluteFill>
  );
};
