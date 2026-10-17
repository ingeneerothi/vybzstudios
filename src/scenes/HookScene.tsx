import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {BEAT, COLORS, HOOK_HEADS, VIDEO} from '../config';
import {Head} from '../components/Head';
import {ShutterBackground} from '../components/ShutterBackground';
import {Wordmark} from '../components/Wordmark';
import {clamp, easeOut, shake, SPRINGS, springAt} from '../lib/motion';
import {useBeatFrame} from '../lib/timeline';

/** Une tête par croche (demi-temps) ; le logo s'écrase sur le 4e temps. */
const SLAP_EVERY = BEAT / 2;
const LOGO_AT = SLAP_EVERY * HOOK_HEADS.length;

/**
 * 0–2 s : écran noir, les têtes claquent une à une sur le rideau (comme des stickers),
 * puis le logo OSCAN s'écrase au centre avec un screen shake.
 */
export const HookScene: React.FC = () => {
	const f = useBeatFrame();
	const {fps} = useVideoConfig();
	const slaps = HOOK_HEADS.map((_, i) => i * SLAP_EVERY);

	// le logo repousse les têtes et les met en retrait
	const logoP = springAt(f, fps, LOGO_AT, SPRINGS.slam);
	const pushed = f >= LOGO_AT ? logoP : 0;
	const dim = interpolate(f, [LOGO_AT, LOGO_AT + 8], [1, 0.5], {...clamp, easing: easeOut});

	const camera = shake(f, slaps.slice(1), 5, 10, 'hook-slap') + ' ' + shake(f, [LOGO_AT], 14, 20, 'hook-logo');
	const flash = f < LOGO_AT ? 0 : interpolate(f, [LOGO_AT, LOGO_AT + 7], [0.55, 0], {...clamp, easing: easeOut});
	const ring = interpolate(f, [LOGO_AT, LOGO_AT + 22], [0, 1], {...clamp, easing: easeOut});

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.black}}>
			<AbsoluteFill style={{transform: camera}}>
				<ShutterBackground brightness={0.3} />
				{HOOK_HEADS.map((h, i) => {
					const at = slaps[i];
					if (f < at) {
						return null;
					}
					const p = springAt(f, fps, at, SPRINGS.slam);
					const scale = 1.75 - 0.75 * p;
					const rotate = h.rotate + (i % 2 ? 14 : -14) * (1 - p);
					// poussée radiale depuis le centre quand le logo tombe
					const dx = (h.x - VIDEO.width / 2) * 0.12 * pushed;
					const dy = (h.y - VIDEO.height / 2) * 0.08 * pushed;
					return (
						<div
							key={h.head}
							style={{
								position: 'absolute',
								left: h.x,
								top: h.y,
								transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rotate}deg)`,
								filter: `brightness(${dim})`,
							}}
						>
							<Head name={h.head} width={h.size} />
						</div>
					);
				})}

				{/* onde de choc */}
				{f >= LOGO_AT ? (
					<div
						style={{
							position: 'absolute',
							left: VIDEO.width / 2,
							top: VIDEO.height / 2,
							width: 1400,
							height: 1400,
							borderRadius: '50%',
							border: `${30 * (1 - ring) + 4}px solid ${COLORS.yellow}`,
							transform: `translate(-50%, -50%) scale(${0.15 + ring * 0.95})`,
							opacity: 1 - ring,
						}}
					/>
				) : null}

				{f >= LOGO_AT ? (
					<div
						style={{
							position: 'absolute',
							left: VIDEO.width / 2,
							top: VIDEO.height / 2,
							transform: `translate(-50%, -50%) scale(${3.2 - 2.2 * logoP}) rotate(${-4 - 8 * (1 - logoP)}deg)`,
						}}
					>
						<Wordmark width={940} extrude={COLORS.yellow} />
					</div>
				) : null}
			</AbsoluteFill>
			<AbsoluteFill style={{backgroundColor: COLORS.white, opacity: flash}} />
		</AbsoluteFill>
	);
};
