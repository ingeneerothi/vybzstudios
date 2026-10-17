import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {VIDEO} from './config';
import {OscanIntro, oscanIntroSchema, TOTAL_FRAMES} from './OscanIntro';

// polices embarquées (assets/fonts) : aucun appel réseau au rendu
loadFont({family: 'Courier Prime', url: staticFile('fonts/CourierPrime-Bold.woff2'), weight: '700'});
loadFont({family: 'Anton', url: staticFile('fonts/Anton-Regular.woff2'), weight: '400'});
loadFont({family: 'Luckiest Guy', url: staticFile('fonts/LuckiestGuy-Regular.woff2'), weight: '400'});

export const RemotionRoot: React.FC = () => (
	<Composition
		id="OscanIntro"
		component={OscanIntro}
		durationInFrames={TOTAL_FRAMES}
		fps={VIDEO.fps}
		width={VIDEO.width}
		height={VIDEO.height}
		schema={oscanIntroSchema}
		defaultProps={{showSafeZones: false, musicVolume: 0.9}}
	/>
);
