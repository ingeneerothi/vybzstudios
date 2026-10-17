import React from 'react';
import {Easing, interpolate, useVideoConfig} from 'remotion';
import {useBeatFrame} from '../lib/timeline';
import {clamp, SPRINGS, springAt} from '../lib/motion';

type Props = {
	to: number;
	decimals?: number;
	suffix?: string;
	/** Frame de départ (comptée depuis le premier temps de la scène). */
	start: number;
	duration: number;
	style?: React.CSSProperties;
};

const format = (value: number, decimals: number) => value.toFixed(decimals).replace('.', ',');

/** Compteur qui monte vite puis ralentit (ease-out) et « tape » en arrivant. */
export const Counter: React.FC<Props> = ({to, decimals = 0, suffix = '', start, duration, style}) => {
	const frame = useBeatFrame();
	const {fps} = useVideoConfig();
	// ease-out « expo » en bézier : arrive exactement à 1 (Easing.exp s'arrête à 0,999)
	const t = interpolate(frame, [start, start + duration], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
	const landed = frame >= start + duration;
	const bump = landed ? 1 - springAt(frame, fps, start + duration, SPRINGS.pop) : 0;
	return (
		<span
			style={{
				display: 'inline-block',
				fontVariantNumeric: 'tabular-nums',
				transform: `scale(${1 + bump * 0.14})`,
				...style,
			}}
		>
			{format(to * t, decimals)}
			{suffix}
		</span>
	);
};
