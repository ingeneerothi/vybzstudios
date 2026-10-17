import React, {useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useVideoConfig} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {BEAT, COLORS, FONTS, SAFE, TEXTS, UNIVERSE_GRID, VIDEO} from '../config';
import {PRODUCT_BOX, fitProduct} from '../components/ProductCard';
import {Sunburst} from '../components/Sunburst';
import {TypewriterText} from '../components/TypewriterText';
import {headSrc, manifest} from '../lib/assets';
import {clamp, easeInOut, easeOut, shake, SPRINGS, springAt} from '../lib/motion';
import {useBeatFrame} from '../lib/timeline';
import {UNIVERSE_ZOOM} from './UniverseScene';
import lineart from '../../assets/lineart/rasta.json';

// --- repères temporels (frames depuis le début de la scène) -------------------------
const DRAW_SPREAD = 40; // décalage max entre le premier et le dernier contour
const DRAW_LEN = 44; // durée de tracé d'un contour
const INK_AT = 62; // le trait se remplit d'encre
const COLOR_AT = 84; // la couleur envahit la tête
const BG_AT = BEAT * 3; // fond papier -> jaune, sur le temps
const TEE_AT = BG_AT + 6; // le t-shirt monte
const FLY_AT = BG_AT + 12; // la tête part vers le t-shirt
const LAND_AT = BG_AT + 48; // ... et s'y pose
const STAMP_AT = LAND_AT + 6; // les 8 autres têtes s'impriment
const REAL_AT = STAMP_AT + 8 * 3 + 10; // fondu vers le vrai visuel produit

const TEE = 'products/head-tee-white.webp';
const TEE_TILT = -1.2; // même inclinaison que la première carte produit (raccord)
const HEAD = {w: manifest.heads.rasta.w, h: manifest.heads.rasta.h};

/** Taille d'affichage de la tête dessinée : celle de la tête zoomée en fin de scène 3. */
const gRasta = manifest.heads['g-rasta'];
const DRAW_W = Math.min(250, (250 * gRasta.w) / gRasta.h) * UNIVERSE_ZOOM.scale;

type Slot = {x: number; y: number; w: number; h: number};
const slots = manifest.blankTee.slots as Record<string, Slot>;

/** Position écran du centre d'un emplacement de tête, t-shirt en place. */
const slotOnScreen = (slot: Slot, tee: {w: number; h: number}) => {
	const lx = (slot.x + slot.w / 2 - 0.5) * tee.w;
	const ly = (slot.y + slot.h / 2 - 0.5) * tee.h;
	const a = (TEE_TILT * Math.PI) / 180;
	return {
		x: PRODUCT_BOX.cx + lx * Math.cos(a) - ly * Math.sin(a),
		y: PRODUCT_BOX.cy + lx * Math.sin(a) + ly * Math.cos(a),
		w: slot.w * tee.w,
	};
};

/** 10–14 s : le trait se trace, la tête se remplit de couleurs, puis glisse sur le t-shirt. */
export const DrawingScene: React.FC = () => {
	const f = useBeatFrame();
	const {fps} = useVideoConfig();
	const tee = fitProduct(TEE);
	const target = slotOnScreen(slots['g-rasta'], tee);

	const strokes = useMemo(() => lineart.paths, []);
	const compound = useMemo(() => lineart.paths.join(' '), []);

	// fond : papier puis jaune (cercle qui s'ouvre depuis la tête, sur le temps)
	const bg = interpolate(f, [BG_AT, BG_AT + 16], [0, 1], {...clamp, easing: easeOut});

	// encre + couleur
	const ink = interpolate(f, [INK_AT, INK_AT + 18], [0, 1], {...clamp, easing: easeOut});
	const colorR = interpolate(f, [COLOR_AT, COLOR_AT + 22], [0, 78], {...clamp, easing: easeOut});
	const linesOut = interpolate(f, [COLOR_AT + 16, COLOR_AT + 26], [1, 0], {...clamp, easing: easeOut});

	// vol de la tête vers son emplacement
	const fly = interpolate(f, [FLY_AT, LAND_AT], [0, 1], {...clamp, easing: easeInOut});
	const hx = interpolate(fly, [0, 1], [UNIVERSE_ZOOM.cx, target.x]);
	const hy = interpolate(fly, [0, 1], [UNIVERSE_ZOOM.cy, target.y]) - Math.sin(fly * Math.PI) * 140;
	const hw = interpolate(fly, [0, 1], [DRAW_W, target.w]);
	const hr = interpolate(fly, [0, 1], [0, TEE_TILT]) + Math.sin(fly * Math.PI) * -10;
	const landed = f >= LAND_AT;

	// t-shirt qui monte
	const teeIn = springAt(f, fps, TEE_AT, SPRINGS.soft);
	const teeBump = f >= STAMP_AT + 8 * 3 ? 1 + 0.035 * (1 - springAt(f, fps, STAMP_AT + 8 * 3, SPRINGS.pop)) : 1;
	const real = interpolate(f, [REAL_AT, REAL_AT + 14], [0, 1], {...clamp, easing: easeOut});
	const camera = shake(f, [LAND_AT], 9, 14, 'land');

	const label = f < BG_AT ? TEXTS.drawing.before : TEXTS.drawing.after;

	return (
		<AbsoluteFill style={{backgroundColor: COLORS.paper}}>
			{/* papier quadrillé (carnet de croquis) */}
			<AbsoluteFill
				style={{
					backgroundImage:
						'linear-gradient(rgba(10,10,10,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(10,10,10,0.07) 2px, transparent 2px)',
					backgroundSize: '60px 60px',
					backgroundPosition: '30px 30px',
				}}
			/>
			{bg > 0 ? (
				<AbsoluteFill style={{clipPath: `circle(${bg * 150}% at 50% ${(UNIVERSE_ZOOM.cy / VIDEO.height) * 100}%)`}}>
					<Sunburst />
				</AbsoluteFill>
			) : null}

			<AbsoluteFill style={{transform: camera}}>
				{/* t-shirt vierge + têtes imprimées */}
				{f >= TEE_AT ? (
					<div
						style={{
							position: 'absolute',
							left: PRODUCT_BOX.cx - tee.w / 2,
							top: PRODUCT_BOX.cy - tee.h / 2,
							width: tee.w,
							height: tee.h,
							transform: `translateY(${(1 - teeIn) * 1300}px) rotate(${TEE_TILT}deg) scale(${teeBump})`,
						}}
					>
						<Img src={staticFile('tee/head-tee-blank.webp')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 26px 26px rgba(80,40,0,0.32))'}} />
						{UNIVERSE_GRID.map((name) => {
							const slot = slots[name];
							const order = name === 'g-rasta' ? -1 : UNIVERSE_GRID.filter((n) => n !== 'g-rasta').indexOf(name);
							const at = order < 0 ? LAND_AT : STAMP_AT + order * 3;
							if (f < at) {
								return null;
							}
							const p = springAt(f, fps, at, SPRINGS.slam);
							const fadeIn = order < 0 ? interpolate(f, [LAND_AT, LAND_AT + 6], [0, 1], clamp) : 1;
							return (
								<Img
									key={name}
									src={headSrc(name)}
									style={{
										position: 'absolute',
										left: `${slot.x * 100}%`,
										top: `${slot.y * 100}%`,
										width: `${slot.w * 100}%`,
										height: `${slot.h * 100}%`,
										opacity: fadeIn,
										transform: `scale(${order < 0 ? 1 : 1.5 - 0.5 * p})`,
									}}
								/>
							);
						})}
						<Img src={staticFile(TEE)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: real}} />
					</div>
				) : null}

				{/* la tête : trait qui se trace -> encre -> couleurs -> vol vers le t-shirt */}
				{f < LAND_AT + 6 ? (
					<div
						style={{
							position: 'absolute',
							left: hx,
							top: hy,
							width: hw,
							height: (hw * HEAD.h) / HEAD.w,
							transform: `translate(-50%, -50%) rotate(${hr}deg)`,
							opacity: landed ? interpolate(f, [LAND_AT, LAND_AT + 6], [1, 0], clamp) : 1,
						}}
					>
						<Img
							src={headSrc('rasta')}
							style={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								clipPath: `circle(${colorR}% at 50% 50%)`,
							}}
						/>
						{linesOut > 0 ? (
							<svg
								viewBox={`0 0 ${lineart.width} ${lineart.height}`}
								style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: linesOut}}
							>
								<path d={compound} fill={COLORS.black} fillRule="evenodd" opacity={ink} />
								{strokes.map((d, i) => {
									const start = (i / Math.max(1, strokes.length - 1)) * DRAW_SPREAD;
									const progress = interpolate(f, [start, start + DRAW_LEN], [0, 1], {...clamp, easing: easeInOut});
									if (progress <= 0) {
										return null;
									}
									const evolved = evolvePath(progress, d);
									return (
										<path
											key={i}
											d={d}
											fill="none"
											stroke={COLORS.black}
											strokeWidth={2.4}
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeDasharray={evolved.strokeDasharray}
											strokeDashoffset={evolved.strokeDashoffset}
										/>
									);
								})}
							</svg>
						) : null}
					</div>
				) : null}
			</AbsoluteFill>

			<div
				style={{
					position: 'absolute',
					top: SAFE.top + 80,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: FONTS.typewriter,
					fontWeight: 700,
					fontSize: 70,
					letterSpacing: '0.04em',
					color: COLORS.black,
				}}
			>
				<TypewriterText key={label} text={label} start={f < BG_AT ? 4 : BG_AT} framesPerChar={2} seed={label} cursorColor={COLORS.black} />
			</div>
		</AbsoluteFill>
	);
};
