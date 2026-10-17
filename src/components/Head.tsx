import React from 'react';
import {Img} from 'remotion';
import {headInfo, headSrc} from '../lib/assets';

type Props = {
	name: string;
	/** Largeur de la tête elle-même (le bord sticker déborde autour). */
	width: number;
	sticker?: boolean;
	shadow?: boolean;
	style?: React.CSSProperties;
};

/** Une tête de personnage (découpée des visuels d'origine, jamais redessinée). */
export const Head: React.FC<Props> = ({name, width, sticker = true, shadow = true, style}) => {
	const info = headInfo(name);
	const scale = width / info.w;
	const pad = sticker ? info.stickerPad * scale : 0;
	return (
		<Img
			src={headSrc(name, sticker)}
			style={{
				display: 'block',
				width: width + pad * 2,
				height: info.h * scale + pad * 2,
				margin: -pad,
				filter: shadow ? 'drop-shadow(0px 10px 0px rgba(0,0,0,0.35))' : undefined,
				...style,
			}}
		/>
	);
};
