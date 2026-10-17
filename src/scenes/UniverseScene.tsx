import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BEAT, COLORS, FONTS, SCENE_BEATS, TEXTS, UNIVERSE_GRID, VIDEO} from '../config';
import {Head} from '../components/Head';
import {PopIn} from '../components/PopIn';
import {ShutterBackground} from '../components/ShutterBackground';
import {TypewriterText} from '../components/TypewriterText';
import {headInfo} from '../lib/assets';
import {beatPulse, clamp, easeInOut, easeOut, wiggle} from '../lib/motion';
import {useBeatFrame, useGlobalFrame} from '../lib/timeline';

const GRID = {cell: 300, gap: 14, top: 470};
const STAGGER = 3;
const END = SCENE_BEATS.universe * BEAT;
const ZOOM_FROM = END - 40;
/** Taille / position de la tête centrale à la fin du zoom (raccord avec la scène 4). */
export const UNIVERSE_ZOOM = {cx: VIDEO.width / 2, cy: 900, scale: 2.5};

const cellCenter = (i: number) => {
	const step = GRID.cell + GRID.gap;
	const col = i % 3;
	const row = Math.floor(i / 3);
	return {
		x: VIDEO.width / 2 + (col - 1) * step,
		y: GRID.top + GRID.cell / 2 + row * step,
	};
};

/** 6–10 s : les neuf têtes en cascade, chacune frétille en rythme. */
export const UniverseScene: React.FC = () => {
	const f = useBeatFrame();
	const g = useGlobalFrame();
	const pulse = beatPulse(g);
	const zoom = interpolate(f, [ZOOM_FROM, END], [0, 1], {...clamp, easing: easeInOut});

	return (
		<AbsoluteFill>
			<ShutterBackground />
			{UNIVERSE_GRID.map((name, i) => {
				const {x, y} = cellCenter(i);
				const info = headInfo(name);
				const width = Math.min(250, (250 * info.w) / info.h);
				const center = i === 4;
				const tx = center ? (UNIVERSE_ZOOM.cx - x) * zoom : 0;
				const ty = center ? (UNIVERSE_ZOOM.cy - y) * zoom : 0;
				const s = center ? 1 + (UNIVERSE_ZOOM.scale - 1) * zoom : 1;
				return (
					<div
						key={name}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							zIndex: center ? 2 : 1,
							transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${s})`,
						}}
					>
						<PopIn
							delay={i * STAGGER}
							rotateFrom={i % 2 ? 18 : -18}
							exitAt={center ? undefined : ZOOM_FROM + (i % 5)}
							exitDuration={12}
						>
							<div
								style={{
									transform: `rotate(${wiggle(g, i * 0.9, 4)}deg) scale(${1 + 0.05 * pulse * (center ? 1 - zoom : 1)})`,
								}}
							>
								<Head name={name} width={width} />
							</div>
						</PopIn>
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: GRID.top + 3 * GRID.cell + 2 * GRID.gap + 90,
					textAlign: 'center',
					fontFamily: FONTS.typewriter,
					fontWeight: 700,
					fontSize: 62,
					color: COLORS.yellow,
					opacity: 1 - interpolate(f, [ZOOM_FROM, ZOOM_FROM + 12], [0, 1], {...clamp, easing: easeOut}),
				}}
			>
				<TypewriterText text={TEXTS.universe} start={34} framesPerChar={1.5} seed="u-cap" cursorColor={COLORS.yellow} />
			</div>
		</AbsoluteFill>
	);
};
