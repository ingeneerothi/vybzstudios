import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BEAT, COLORS, FONTS, SAFE, TEXTS} from '../config';
import {PopIn} from '../components/PopIn';
import {Sunburst} from '../components/Sunburst';
import {TypewriterText} from '../components/TypewriterText';
import {wiggle} from '../lib/motion';
import {useBeatFrame} from '../lib/timeline';

const {title, subtitle, tagline} = TEXTS.presentation;
const TITLE_AT = 0;
const SUBTITLE_AT = TITLE_AT + Array.from(title).length * 3 + 4;
const TAGLINE_AT = BEAT * 2;

/** 2–6 s : fond jaune sunburst, « OSCAN — Made in Djassa » tapé à la machine. */
export const PresentationScene: React.FC = () => {
	const f = useBeatFrame();
	// le bloc ne reste jamais figé : lente dérive + respiration
	const driftY = wiggle(f, 0, 10, 6);
	const breathe = 1 + wiggle(f, 1.3, 0.012, 4);

	return (
		<AbsoluteFill>
			<Sunburst cy={760} />
			<AbsoluteFill
				style={{
					padding: `0 ${SAFE.side + 20}px`,
					justifyContent: 'center',
					transform: `translateY(${driftY}px) scale(${breathe})`,
				}}
			>
				<div style={{fontFamily: FONTS.typewriter, fontWeight: 700, color: COLORS.black, marginTop: -40}}>
					<div style={{fontSize: 168, lineHeight: 1, letterSpacing: '-0.02em'}}>
						<TypewriterText text={title} start={TITLE_AT} framesPerChar={3} seed="p-title" cursor={false} />
					</div>
					<div style={{fontSize: 100, lineHeight: 1.1, marginTop: 18, whiteSpace: 'nowrap'}}>
						<TypewriterText text={subtitle} start={SUBTITLE_AT} framesPerChar={2} seed="p-sub" cursorColor={COLORS.black} />
					</div>
				</div>
				<PopIn delay={TAGLINE_AT - 4} offset={[-120, 0]} rotate={-1.5} rotateFrom={-6} style={{marginTop: 70, alignSelf: 'flex-start'}}>
					<div
						style={{
							background: COLORS.black,
							color: COLORS.yellow,
							fontFamily: FONTS.typewriter,
							fontWeight: 700,
							fontSize: 56,
							lineHeight: 1.25,
							padding: '22px 30px',
							boxShadow: '12px 12px 0 rgba(0,0,0,0.18)',
						}}
					>
						{tagline.map((line, i) => (
							<div key={line}>
								<TypewriterText
									text={line}
									start={TAGLINE_AT + i * Math.round(Array.from(tagline[0]).length * 1.5 + 4)}
									framesPerChar={1.5}
									seed={`p-tag-${i}`}
									cursor={i === tagline.length - 1}
									cursorColor={COLORS.yellow}
								/>
							</div>
						))}
					</div>
				</PopIn>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
