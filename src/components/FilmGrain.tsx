import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';

const TILE = 512;
const VARIANTS = 6;

/** Grain de film animé : une tuile de bruit tirée au hasard (déterministe) à chaque frame. */
export const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.22}) => {
	const frame = useCurrentFrame();
	const variant = Math.floor(random(`grain-v-${frame}`) * VARIANTS);
	const ox = Math.floor(random(`grain-x-${frame}`) * TILE);
	const oy = Math.floor(random(`grain-y-${frame}`) * TILE);
	const src = staticFile(`textures/grain-${variant}.png`);

	const tiles = [];
	for (let row = 0; row < 5; row++) {
		for (let col = 0; col < 4; col++) {
			tiles.push(
				<Img
					key={`${row}-${col}`}
					src={src}
					style={{position: 'absolute', left: col * TILE - ox, top: row * TILE - oy, width: TILE, height: TILE}}
				/>,
			);
		}
	}

	return (
		<>
			<AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>{tiles}</AbsoluteFill>
			{/* overlay n'a aucun effet sur le noir pur : une pointe de bruit en normal pour les noirs */}
			<AbsoluteFill style={{opacity: opacity * 0.18, pointerEvents: 'none'}}>{tiles}</AbsoluteFill>
		</>
	);
};
