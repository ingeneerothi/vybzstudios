import React from 'react';
import {Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import {MUSIC} from '../config';
import {hasAsset} from '../lib/assets';
import {clamp, easeOut} from '../lib/motion';

/** Musique de fond optionnelle : assets/music.mp3. Absente → vidéo muette, sans erreur. */
export const Music: React.FC<{volume: number}> = ({volume}) => {
	const {durationInFrames, fps} = useVideoConfig();
	if (!hasAsset(MUSIC.file)) {
		return null;
	}
	const fadeOutStart = durationInFrames - Math.round(MUSIC.fadeOutSeconds * fps);
	return (
		<Audio
			src={staticFile(MUSIC.file)}
			trimBefore={Math.round(MUSIC.trimBeforeSeconds * fps)}
			volume={(f) =>
				volume *
				interpolate(f, [0, 3], [0, 1], clamp) *
				interpolate(f, [fadeOutStart, durationInFrames], [1, 0], {...clamp, easing: easeOut})
			}
		/>
	);
};
