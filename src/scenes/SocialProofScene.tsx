import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BEAT, COLORS, COMMUNITY_HEADS, FONTS, STATS, TEXTS, VIDEO} from '../config';
import {Counter} from '../components/Counter';
import {Head} from '../components/Head';
import {PopIn} from '../components/PopIn';
import {ShutterBackground} from '../components/ShutterBackground';
import {TypewriterText} from '../components/TypewriterText';
import {clamp, easeOut, shake, wiggle} from '../lib/motion';
import {useBeatFrame, useGlobalFrame} from '../lib/timeline';

const COUNT_LEN = 54;
/** Un compteur par temps et demi : un seul élément principal à la fois. */
const STAT_AT = STATS.map((_, i) => Math.round(i * BEAT * 1.5));
const COMMUNITY_AT = BEAT * 3;

/** 24–28 s : compteurs animés + « La communauté Oscan ». */
export const SocialProofScene: React.FC = () => {
	const f = useBeatFrame();
	const g = useGlobalFrame();
	const impacts = STAT_AT.map((t) => t + COUNT_LEN);
	const camera = shake(f, impacts, 8, 14, 'stats');

	return (
		<AbsoluteFill>
			<ShutterBackground />
			<AbsoluteFill style={{transform: camera}}>
				{STATS.map((stat, i) => {
					const at = STAT_AT[i];
					// le compteur précédent passe au second plan quand le suivant démarre
					const next = STAT_AT[i + 1];
					const dim = next === undefined ? 1 : interpolate(f, [next, next + 10], [1, 0.45], {...clamp, easing: easeOut});
					return (
						<div
							key={stat.label}
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 330 + i * 470,
								textAlign: 'center',
								opacity: dim,
							}}
						>
							<PopIn delay={at - 2} from={0.4} offset={[0, 60]}>
								<div style={{fontFamily: FONTS.title, fontSize: 250, lineHeight: 1, color: COLORS.yellow, letterSpacing: '0.01em'}}>
									<Counter to={stat.value} decimals={stat.decimals} suffix={stat.suffix} start={at} duration={COUNT_LEN} />
								</div>
								<div style={{fontFamily: FONTS.typewriter, fontWeight: 700, fontSize: 64, color: COLORS.white, marginTop: 12}}>
									<TypewriterText text={stat.label} start={at + 6} framesPerChar={2} cursor={false} seed={`stat-${i}`} />
								</div>
							</PopIn>
						</div>
					);
				})}

				<div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center'}}>
					<div
						style={{
							display: 'inline-block',
							background: COLORS.yellow,
							color: COLORS.black,
							fontFamily: FONTS.typewriter,
							fontWeight: 700,
							fontSize: 60,
							padding: '14px 28px',
							transform: 'rotate(-1.5deg)',
							opacity: f >= COMMUNITY_AT ? 1 : 0,
						}}
					>
						<TypewriterText text={TEXTS.social} start={COMMUNITY_AT} framesPerChar={1.5} seed="community" cursorColor={COLORS.black} />
					</div>
				</div>

				{/* la communauté : une rangée de têtes qui surgit */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 1490, height: 220}}>
					{COMMUNITY_HEADS.map((name, i) => {
						const n = COMMUNITY_HEADS.length;
						const x = VIDEO.width / 2 + (i - (n - 1) / 2) * 138;
						return (
							<div key={name} style={{position: 'absolute', left: x, top: 100, transform: 'translate(-50%, -50%)'}}>
								<PopIn delay={COMMUNITY_AT + 10 + i * 3} offset={[0, 120]} rotateFrom={i % 2 ? 20 : -20} rotate={i % 2 ? 6 : -6}>
									<div style={{transform: `translateY(${wiggle(g, i, 8, 1)}px)`}}>
										<Head name={name} width={130} />
									</div>
								</PopIn>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
