import React from 'react';
import {AbsoluteFill} from 'remotion';
import {springTiming, TransitionSeries} from '@remotion/transitions';
import type {TransitionPresentation} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import type {SlideDirection} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import type {WipeDirection} from '@remotion/transitions/wipe';
import {z} from 'zod';
import {BEAT, COLORS, PRODUCTS, SCENE_BEATS, TRANSITION_FRAMES} from './config';
import {FilmGrain} from './components/FilmGrain';
import {Music} from './components/Music';
import {ProductCard} from './components/ProductCard';
import type {Entry} from './components/ProductCard';
import {SafeZones} from './components/SafeZones';
import {shutterUp} from './components/Transitions';
import {SceneProvider} from './lib/timeline';
import {CtaScene} from './scenes/CtaScene';
import {DrawingScene} from './scenes/DrawingScene';
import {HookScene} from './scenes/HookScene';
import {PresentationScene} from './scenes/PresentationScene';
import {SocialProofScene} from './scenes/SocialProofScene';
import {UniverseScene} from './scenes/UniverseScene';

export const oscanIntroSchema = z.object({
	showSafeZones: z.boolean(),
	musicVolume: z.number().min(0).max(1),
});

type Transition = {presentation: TransitionPresentation<Record<string, unknown>>; frames: number};

type Scene = {
	id: string;
	beats: number;
	/** Transition d'entrée (absente = coupe franche sur le temps). */
	transition?: Transition;
	render: () => React.ReactNode;
};

const shutter: Transition = {presentation: shutterUp(), frames: TRANSITION_FRAMES.shutter};
const wipeFrom = (direction: WipeDirection): Transition => ({
	presentation: wipe({direction}) as TransitionPresentation<Record<string, unknown>>,
	frames: TRANSITION_FRAMES.wipe,
});
const slideFrom = (direction: SlideDirection): Transition => ({
	presentation: slide({direction}) as TransitionPresentation<Record<string, unknown>>,
	frames: TRANSITION_FRAMES.slide,
});

/** Défilé produits : slides / wipes secs en alternance. */
const productTransitions: (Transition | undefined)[] = [
	undefined, // raccord direct avec le t-shirt de la scène 4
	slideFrom('from-right'),
	wipeFrom('from-left'),
	slideFrom('from-bottom'),
	wipeFrom('from-top-right'),
	slideFrom('from-left'),
	wipeFrom('from-bottom-left'),
	slideFrom('from-right'),
];
const productEntries: Entry[] = ['none', 'right', 'left', 'bottom', 'right', 'left', 'bottom', 'right'];

export const SCENES: Scene[] = [
	{id: 'hook', beats: SCENE_BEATS.hook, render: () => <HookScene />},
	{id: 'presentation', beats: SCENE_BEATS.presentation, transition: shutter, render: () => <PresentationScene />},
	{id: 'universe', beats: SCENE_BEATS.universe, transition: wipeFrom('from-bottom-left'), render: () => <UniverseScene />},
	{id: 'drawing', beats: SCENE_BEATS.drawing, render: () => <DrawingScene />},
	...PRODUCTS.map(
		(product, i): Scene => ({
			id: `product-${product.id}`,
			beats: SCENE_BEATS.product,
			transition: productTransitions[i % productTransitions.length],
			render: () => <ProductCard product={product} index={i} total={PRODUCTS.length} entry={productEntries[i % productEntries.length]} />,
		}),
	),
	{id: 'social', beats: SCENE_BEATS.social, transition: slideFrom('from-bottom'), render: () => <SocialProofScene />},
	{id: 'cta', beats: SCENE_BEATS.cta, transition: wipeFrom('from-top'), render: () => <CtaScene />},
];

/** Durée totale : la somme des temps (les transitions se superposent aux scènes). */
export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + s.beats * BEAT, 0);

/**
 * Chaque transition se termine pile sur le premier temps de la scène suivante :
 * la séquence d'une scène dure (temps × BEAT) + durée de sa transition d'entrée.
 */
export const OscanIntro: React.FC<z.infer<typeof oscanIntroSchema>> = ({showSafeZones, musicVolume}) => {
	let beatStart = 0;
	const items: React.ReactNode[] = [];
	for (const scene of SCENES) {
		const intro = scene.transition?.frames ?? 0;
		if (scene.transition) {
			items.push(
				<TransitionSeries.Transition
					key={`${scene.id}-in`}
					presentation={scene.transition.presentation}
					timing={springTiming({config: {damping: 200}, durationInFrames: intro})}
				/>,
			);
		}
		items.push(
			<TransitionSeries.Sequence key={scene.id} name={scene.id} durationInFrames={scene.beats * BEAT + intro}>
				<SceneProvider value={{startFrame: beatStart - intro, intro}}>{scene.render()}</SceneProvider>
			</TransitionSeries.Sequence>,
		);
		beatStart += scene.beats * BEAT;
	}

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.black}}>
			<TransitionSeries>{items}</TransitionSeries>
			<FilmGrain />
			<Music volume={musicVolume} />
			{showSafeZones ? <SafeZones /> : null}
		</AbsoluteFill>
	);
};
