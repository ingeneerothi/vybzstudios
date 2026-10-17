import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SAFE} from '../config';

/** Repères de zones sûres (activer `showSafeZones` dans le Studio). */
export const SafeZones: React.FC = () => {
	const band: React.CSSProperties = {position: 'absolute', left: 0, right: 0, background: 'rgba(255,0,80,0.28)'};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{...band, top: 0, height: SAFE.top}} />
			<div style={{...band, bottom: 0, height: SAFE.bottom}} />
			<div style={{position: 'absolute', top: SAFE.top, bottom: SAFE.bottom, left: SAFE.side, right: SAFE.side, outline: '2px dashed rgba(255,0,80,0.7)'}} />
		</AbsoluteFill>
	);
};
