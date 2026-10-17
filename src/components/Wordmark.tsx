import React from 'react';
import {Img, staticFile} from 'remotion';
import {COLORS, FONTS, LOGO_FILE, TEXTS} from '../config';
import {hasAsset} from '../lib/assets';

type Props = {
	width: number;
	/** Couleur de l'extrusion (ombre portée pleine). */
	extrude?: string;
	style?: React.CSSProperties;
};

/**
 * Logo OSCAN. Utilise assets/logo/oscan-logo.png s'il existe ; sinon un wordmark
 * provisoire dans l'esprit de la pochette du pack stickers (lettres blanches, gros
 * contour noir, extrusion).
 */
export const Wordmark: React.FC<Props> = ({width, extrude = COLORS.black, style}) => {
	if (hasAsset(LOGO_FILE)) {
		return <Img src={staticFile(LOGO_FILE)} style={{width, height: 'auto', display: 'block', ...style}} />;
	}
	const vw = 1000;
	const vh = 300;
	const fontSize = 268;
	const text = TEXTS.brand;
	const common = {
		x: vw / 2,
		y: 238,
		textAnchor: 'middle' as const,
		fontFamily: FONTS.cartoon,
		fontSize,
		letterSpacing: 6,
	};
	return (
		<svg width={width} height={(width * vh) / vw} viewBox={`0 0 ${vw} ${vh}`} style={{overflow: 'visible', display: 'block', ...style}}>
			{/* extrusion : décalée au-delà du contour pour rester visible */}
			<text
				{...common}
				transform="translate(20 23)"
				fill={extrude}
				stroke={COLORS.black}
				strokeWidth={28}
				strokeLinejoin="round"
				paintOrder="stroke"
			>
				{text}
			</text>
			{/* contour épais */}
			<text {...common} fill={COLORS.black} stroke={COLORS.black} strokeWidth={28} strokeLinejoin="round">
				{text}
			</text>
			<text {...common} fill={COLORS.white}>
				{text}
			</text>
		</svg>
	);
};
