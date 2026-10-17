import {Easing, random, spring} from 'remotion';
import type {SpringConfig} from 'remotion';
import {BEAT} from '../config';

/** Entrées : ressorts avec léger dépassement (5-10 %). Jamais de linéaire. */
export const SPRINGS = {
	/** Pop standard, ~7 % de dépassement. */
	pop: {stiffness: 200, damping: 18, mass: 1},
	/** Impact sec (logo, prix), ~8 % de dépassement, très rapide. */
	slam: {stiffness: 420, damping: 26, mass: 1},
	/** Glissé plus doux, ~4 %. */
	soft: {stiffness: 140, damping: 17, mass: 1},
	/** Sans dépassement (sorties, transitions). */
	smooth: {damping: 200},
} satisfies Record<string, Partial<SpringConfig>>;

/** Sorties : ease-out. */
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const springAt = (
	frame: number,
	fps: number,
	delay: number,
	config: Partial<SpringConfig> = SPRINGS.pop,
) => spring({frame: frame - delay, fps, config});

/**
 * Secousse d'impact : oscillation amortie (déterministe) déclenchée à chaque frame
 * listée dans `impacts`.
 */
export const shake = (frame: number, impacts: number[], amplitude: number, decay = 18, seed = 'shake') => {
	let x = 0;
	let y = 0;
	let r = 0;
	for (const t of impacts) {
		const d = frame - t;
		if (d < 0 || d > decay * 2) {
			continue;
		}
		const k = amplitude * Math.exp(-d / (decay / 3));
		const p1 = random(`${seed}-${t}-a`) * Math.PI * 2;
		const p2 = random(`${seed}-${t}-b`) * Math.PI * 2;
		x += k * (Math.sin(d * 2.1 + p1) * 0.75 + Math.sin(d * 4.3 + p2) * 0.25);
		y += k * (Math.cos(d * 1.8 + p2) * 0.75 + Math.sin(d * 3.7 + p1) * 0.25);
		r += k * 0.06 * Math.sin(d * 1.6 + p1);
	}
	return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`;
};

/** Frémissement en boucle calé sur le tempo (sinus, jamais linéaire). */
export const wiggle = (frame: number, phase: number, amplitude: number, periodBeats = 1) =>
	Math.sin((frame / (BEAT * periodBeats)) * Math.PI * 2 + phase) * amplitude;

/** 1 sur chaque temps, retombe vite à 0 (pour des pulsations calées sur le BPM). */
export const beatPulse = (globalFrame: number, decayFrames = 7) => {
	const f = ((globalFrame % BEAT) + BEAT) % BEAT;
	return Math.exp(-f / decayFrames);
};

/** Prix « 10.000F ». */
export const formatPrice = (value: number) =>
	`${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}F`;
