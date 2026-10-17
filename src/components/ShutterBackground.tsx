import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLORS} from '../config';
import {wiggle} from '../lib/motion';
import {useGlobalFrame} from '../lib/timeline';

/** Noir texturé : le vrai rideau métallique des vidéos d'origine, très assombri. */
export const ShutterBackground: React.FC<{brightness?: number}> = ({brightness = 0.36}) => {
	const frame = useGlobalFrame();
	const drift = wiggle(frame, 0, 6, 8);
	return (
		<AbsoluteFill style={{backgroundColor: COLORS.black, overflow: 'hidden'}}>
			<Img
				src={staticFile('textures/shutter.webp')}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					filter: `brightness(${brightness}) saturate(0.7) contrast(1.2)`,
					transform: `translateY(${drift.toFixed(2)}px) scale(1.03)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(10,10,10,0) 0%, rgba(10,10,10,0.5) 62%, rgba(10,10,10,0.92) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};
