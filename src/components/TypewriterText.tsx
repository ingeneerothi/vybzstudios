import React from 'react';
import {random} from 'remotion';
import {useBeatFrame} from '../lib/timeline';
import {easeOut} from '../lib/motion';

type Props = {
	text: string;
	/** Frame de la première lettre (comptée depuis le premier temps de la scène). */
	start: number;
	framesPerChar?: number;
	style?: React.CSSProperties;
	cursor?: boolean;
	cursorColor?: string;
	/** Petites imperfections de frappe (décalage / rotation par lettre). */
	jitter?: number;
	seed?: string;
};

/**
 * Texte tapé lettre par lettre façon machine à écrire. La mise en page est réservée dès
 * le départ (lettres invisibles) : rien ne saute quand le texte s'allonge.
 */
export const TypewriterText: React.FC<Props> = ({
	text,
	start,
	framesPerChar = 2,
	style,
	cursor = true,
	cursorColor = 'currentColor',
	jitter = 1,
	seed = 'tw',
}) => {
	const frame = useBeatFrame();
	const elapsed = frame - start;
	const chars = Array.from(text);
	const count = elapsed < 0 ? 0 : Math.min(chars.length, Math.floor(elapsed / framesPerChar) + 1);
	const doneAt = chars.length * framesPerChar;
	const showCursor =
		cursor && elapsed >= 0 && (elapsed < doneAt || Math.floor((elapsed - doneAt) / 18) % 2 === 0);

	const cursorEl = (
		<span
			style={{
				position: 'absolute',
				top: '0.08em',
				width: '0.5em',
				height: '0.95em',
				background: cursorColor,
				opacity: showCursor ? 1 : 0,
			}}
		/>
	);

	// mots insécables pour un retour à la ligne propre ; chaque lettre est un inline-block animable
	let index = 0;
	const words = text.split(' ');
	return (
		<span style={{position: 'relative', ...style}}>
			{count === 0 ? <span style={{position: 'relative'}}>{React.cloneElement(cursorEl, {style: {...cursorEl.props.style, left: 0}})}</span> : null}
			{words.map((word, w) => {
				const letters = Array.from(word).map((ch) => {
					const i = index++;
					const visible = i < count;
					const age = elapsed - i * framesPerChar;
					const p = visible ? easeOut(Math.min(1, age / 6)) : 0;
					const jx = (random(`${seed}-x-${i}`) - 0.5) * 0.04 * jitter;
					const jy = (random(`${seed}-y-${i}`) - 0.5) * 0.05 * jitter;
					const jr = (random(`${seed}-r-${i}`) - 0.5) * 3 * jitter;
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								position: 'relative',
								opacity: visible ? 1 : 0,
								transform: `translate(${jx}em, ${jy - (1 - p) * 0.12}em) rotate(${jr}deg) scale(${1 + (1 - p) * 0.18})`,
							}}
						>
							{ch}
							{i === count - 1 ? React.cloneElement(cursorEl, {style: {...cursorEl.props.style, left: '100%', marginLeft: '0.06em'}}) : null}
						</span>
					);
				});
				const isLast = w === words.length - 1;
				if (!isLast) {
					index++; // l'espace compte comme une frappe
				}
				const spaceVisible = index - 1 < count;
				return (
					<React.Fragment key={w}>
						<span style={{whiteSpace: 'nowrap'}}>{letters}</span>
						{isLast ? null : (
							<span style={{position: 'relative'}}>
								{' '}
								{spaceVisible && index - 1 === count - 1
									? React.cloneElement(cursorEl, {style: {...cursorEl.props.style, left: '100%'}})
									: null}
							</span>
						)}
					</React.Fragment>
				);
			})}
		</span>
	);
};
