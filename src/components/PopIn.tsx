import React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {useBeatFrame} from '../lib/timeline';
import type {SpringConfig} from 'remotion';
import {clamp, easeOut, SPRINGS, springAt} from '../lib/motion';

type Props = {
	children: React.ReactNode;
	/** Frame de départ (comptée depuis le premier temps de la scène). */
	delay?: number;
	/** Échelle de départ : 0 = pousse, > 1 = « claque » vers l'écran. */
	from?: number;
	rotateFrom?: number;
	rotate?: number;
	/** Décalage de départ en px (x, y). */
	offset?: [number, number];
	config?: Partial<SpringConfig>;
	/** Sortie en ease-out à partir de cette frame. */
	exitAt?: number;
	exitDuration?: number;
	style?: React.CSSProperties;
	origin?: string;
};

/** Entrée en ressort (léger dépassement) + sortie ease-out optionnelle. */
export const PopIn: React.FC<Props> = ({
	children,
	delay = 0,
	from = 0,
	rotateFrom = 0,
	rotate = 0,
	offset = [0, 0],
	config = SPRINGS.pop,
	exitAt,
	exitDuration = 10,
	style,
	origin = '50% 50%',
}) => {
	const frame = useBeatFrame();
	const {fps} = useVideoConfig();
	const p = springAt(frame, fps, delay, config);
	let scale = from + (1 - from) * p;
	let opacity = interpolate(frame - delay, [0, from > 1 ? 1 : 3], [0, 1], clamp);
	const r = rotateFrom + (rotate - rotateFrom) * p;
	const x = offset[0] * (1 - p);
	let y = offset[1] * (1 - p);
	if (exitAt !== undefined) {
		const e = interpolate(frame, [exitAt, exitAt + exitDuration], [0, 1], {...clamp, easing: easeOut});
		scale *= 1 - 0.3 * e;
		opacity *= 1 - e;
		y += 40 * e;
	}
	return (
		<div
			style={{
				transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${r}deg)`,
				transformOrigin: origin,
				opacity,
				...style,
			}}
		>
			{children}
		</div>
	);
};
