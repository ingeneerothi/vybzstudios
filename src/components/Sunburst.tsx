import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BEAT, COLORS, VIDEO} from '../config';
import {easeOut} from '../lib/motion';
import {useGlobalFrame} from '../lib/timeline';

type Props = {
	rays?: number;
	color?: string;
	rayColor?: string;
	cx?: number;
	cy?: number;
	/** 1 = sens horaire, -1 = anti-horaire. */
	spin?: 1 | -1;
};

/**
 * Aplat jaune à rayons (comme la pochette du pack stickers). Les rayons avancent d'un
 * demi-rayon à chaque temps avec un ease-out : rotation rythmée, jamais linéaire.
 */
export const Sunburst: React.FC<Props> = ({
	rays = 22,
	color = COLORS.yellow,
	rayColor = COLORS.yellowRay,
	cx = VIDEO.width / 2,
	cy = VIDEO.height * 0.42,
	spin = 1,
}) => {
	const frame = useGlobalFrame();
	const step = 360 / rays;
	const ticks = Math.floor(frame / BEAT);
	const within = Math.min(1, (frame % BEAT) / (BEAT * 0.45));
	const angle = spin * (ticks + easeOut(within)) * (step / 2);

	const R = 2600;
	const wedges = [];
	for (let i = 0; i < rays; i += 2) {
		const a0 = ((i * step - step / 2) * Math.PI) / 180;
		const a1 = ((i * step + step / 2) * Math.PI) / 180;
		wedges.push(
			<polygon
				key={i}
				points={`${cx},${cy} ${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)}`}
			/>,
		);
	}

	return (
		<AbsoluteFill style={{backgroundColor: color}}>
			<svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}>
				<g fill={rayColor} transform={`rotate(${angle.toFixed(3)} ${cx} ${cy})`}>
					{wedges}
				</g>
			</svg>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at ${(cx / VIDEO.width) * 100}% ${(cy / VIDEO.height) * 100}%, rgba(255,240,170,0.55) 0%, rgba(255,210,31,0) 38%, rgba(214,140,0,0.28) 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
