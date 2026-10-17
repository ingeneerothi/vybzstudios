import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {BEAT, COLORS, FONTS, SAFE, TEXTS, VIDEO} from '../config';
import {PopIn} from '../components/PopIn';
import {Sunburst} from '../components/Sunburst';
import {TypewriterText} from '../components/TypewriterText';
import {Wordmark} from '../components/Wordmark';
import {clamp, easeInOut, easeOut, shake, SPRINGS, springAt, wiggle} from '../lib/motion';
import {useBeatFrame, useGlobalFrame} from '../lib/timeline';

const SHRINK_AT = BEAT; // le logo libère la place
const LINE_AT = BEAT + 14;
const HANDLE_AT = BEAT * 2 + 6;
const ARROW_AT = BEAT * 3;
const MADE_AT = BEAT * 4;

/** 28–32 s : logo plein écran, « Commande sur WhatsApp », @_oscvn, flèche, MADE IN DJASSA. */
export const CtaScene: React.FC = () => {
	const f = useBeatFrame();
	const g = useGlobalFrame();
	const {fps} = useVideoConfig();

	const logoP = springAt(f, fps, 0, SPRINGS.slam);
	const shrink = interpolate(f, [SHRINK_AT, SHRINK_AT + 22], [0, 1], {...clamp, easing: easeInOut});
	const logoScale = (2.6 - 1.6 * logoP) * (1 - 0.38 * shrink);
	const logoY = interpolate(shrink, [0, 1], [VIDEO.height / 2, 560]);
	const camera = shake(f, [0, HANDLE_AT], 14, 18, 'cta');

	// la flèche rebondit sur chaque temps
	const beatPhase = (((g % BEAT) + BEAT) % BEAT) / BEAT;
	const bounce = Math.sin(beatPhase * Math.PI) * 34;
	const arrowIn = springAt(f, fps, ARROW_AT, SPRINGS.pop);
	const made = interpolate(f, [MADE_AT, MADE_AT + 24], [0, 1], {...clamp, easing: easeOut});
	const breathe = 1 + wiggle(f, 0.5, 0.012, 4);

	return (
		<AbsoluteFill>
			<Sunburst cy={560 + (VIDEO.height / 2 - 560) * (1 - shrink)} spin={-1} />
			<AbsoluteFill style={{transform: `${camera} scale(${breathe})`}}>
				<div
					style={{
						position: 'absolute',
						left: VIDEO.width / 2,
						top: logoY,
						transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${-4 + wiggle(g, 0, 1.2, 2)}deg)`,
					}}
				>
					<Wordmark width={960} extrude={COLORS.black} />
				</div>

				<div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center'}}>
					<div
						style={{
							display: 'inline-block',
							background: COLORS.black,
							color: COLORS.yellow,
							fontFamily: FONTS.typewriter,
							fontWeight: 700,
							fontSize: 58,
							padding: '18px 30px',
							transform: 'rotate(-1.5deg)',
							opacity: f >= LINE_AT ? 1 : 0,
							boxShadow: '12px 12px 0 rgba(0,0,0,0.18)',
						}}
					>
						<TypewriterText text={TEXTS.cta.line} start={LINE_AT} framesPerChar={1.2} seed="cta-line" cursorColor={COLORS.yellow} />
					</div>
				</div>

				<div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center'}}>
					<PopIn delay={HANDLE_AT} from={2.2} config={SPRINGS.slam} rotateFrom={-8} rotate={-2}>
						<div style={{fontFamily: FONTS.typewriter, fontWeight: 700, fontSize: 148, color: COLORS.black, letterSpacing: '-0.02em'}}>
							{TEXTS.cta.handle}
						</div>
					</PopIn>
				</div>

				{f >= ARROW_AT ? (
					<div
						style={{
							position: 'absolute',
							left: VIDEO.width / 2,
							top: 1330,
							transform: `translate(-50%, 0) translateY(${bounce * arrowIn}px) scale(${arrowIn})`,
						}}
					>
						<svg width={150} height={190} viewBox="0 0 150 190">
							<path
								d="M48 8 H102 V104 H142 L75 182 L8 104 H48 Z"
								fill={COLORS.black}
								stroke={COLORS.black}
								strokeWidth={10}
								strokeLinejoin="round"
							/>
							<path d="M60 22 H90 V116 H116 L75 164 L34 116 H60 Z" fill={COLORS.white} />
						</svg>
					</div>
				) : null}

				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: SAFE.bottom + 110,
						textAlign: 'center',
						fontFamily: FONTS.typewriter,
						fontWeight: 700,
						fontSize: 52,
						letterSpacing: '0.32em',
						color: COLORS.black,
						opacity: made,
						transform: `translateY(${(1 - made) * 24}px)`,
					}}
				>
					{TEXTS.cta.madeIn}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
