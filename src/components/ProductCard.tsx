import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Product} from '../config';
import {BEAT, COLORS, FONTS, SAFE, SCENE_BEATS, TEXTS, VIDEO} from '../config';
import {productInfo} from '../lib/assets';
import {easeIn, formatPrice, shake, SPRINGS, springAt} from '../lib/motion';
import {useBeatFrame} from '../lib/timeline';
import {ShutterBackground} from './ShutterBackground';
import {Sunburst} from './Sunburst';
import {TypewriterText} from './TypewriterText';

export type Entry = 'right' | 'left' | 'bottom' | 'none';

type Props = {
	product: Product;
	index: number;
	total: number;
	/** D'où arrive le produit ; 'none' = déjà en place (raccord avec la scène précédente). */
	entry: Entry;
};

/** Zone produit : l'image tient dans ce cadre, centrée. */
export const PRODUCT_BOX = {cx: VIDEO.width / 2, cy: 770, w: 900, h: 800};

export const fitProduct = (path: string) => {
	const info = productInfo(path);
	const scale = Math.min(PRODUCT_BOX.w / info.w, PRODUCT_BOX.h / info.h);
	return {w: info.w * scale, h: info.h * scale};
};

/** Le prix tombe sur le contretemps, les tailles juste après. */
const PRICE_AT = BEAT / 2;
const SIZES_AT = PRICE_AT + 12;

/** Un plan produit : visuel, nom, prix « 10.000F » et tailles en jaune machine à écrire. */
export const ProductCard: React.FC<Props> = ({product, index, total, entry}) => {
	const f = useBeatFrame();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dark = product.background === 'black';
	const chrome = dark ? COLORS.yellow : COLORS.black;

	// --- coloris / modèles qui se succèdent (flip sec) -------------------------------
	// changement calé sur la grille du tempo : 2 visuels -> à 1,5 temps, 4 visuels -> tous les 3/4 de temps
	const n = product.images.length;
	const every = n > 1 ? Math.round((SCENE_BEATS.product * BEAT) / n) : Infinity;
	const variant = n > 1 ? Math.max(0, Math.min(n - 1, Math.floor(f / every))) : 0;
	let flip = 1;
	for (let k = 1; k < n; k++) {
		const t = k * every;
		if (f >= t - 4 && f < t) {
			flip = 1 - easeIn((f - (t - 4)) / 4);
		} else if (f >= t && f < t + 20) {
			flip = springAt(f, fps, t, SPRINGS.slam);
		}
	}

	// --- entrée du produit ---------------------------------------------------------
	const enter = entry === 'none' ? 1 : springAt(f, fps, -8, SPRINGS.pop);
	const fromX = entry === 'right' ? 420 : entry === 'left' ? -420 : 0;
	const fromY = entry === 'bottom' ? 520 : 0;
	const tilt = index % 2 ? 1.2 : -1.2;
	const rot = (index % 2 ? 8 : -8) * (1 - enter) + tilt + Math.sin(frame / 62) * 0.6;
	const floatY = Math.sin(frame / 48) * 7;

	const src = product.images[variant];
	const size = fitProduct(src);

	// --- étiquette ---------------------------------------------------------------
	const tagIn = springAt(f, fps, 2, SPRINGS.pop);
	const priceP = springAt(f, fps, PRICE_AT, SPRINGS.slam);
	const cardShake = shake(f, [PRICE_AT], 7, 14, `price-${product.id}`);
	const variantName = product.variantNames?.[variant];

	return (
		<AbsoluteFill>
			{dark ? <ShutterBackground /> : <Sunburst spin={index % 4 === 0 ? 1 : -1} />}
			<AbsoluteFill style={{transform: cardShake}}>
				{/* barre du haut */}
				<div
					style={{
						position: 'absolute',
						top: SAFE.top + 30,
						left: SAFE.side,
						right: SAFE.side,
						display: 'flex',
						justifyContent: 'space-between',
						fontFamily: FONTS.typewriter,
						fontWeight: 700,
						fontSize: 40,
						letterSpacing: '0.12em',
						color: chrome,
						opacity: Math.min(1, Math.max(0, (f + 10) / 8)),
					}}
				>
					<span>{TEXTS.collection}</span>
					<span>
						{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
					</span>
				</div>

				{/* visuel produit */}
				<div
					style={{
						position: 'absolute',
						left: PRODUCT_BOX.cx - size.w / 2,
						top: PRODUCT_BOX.cy - size.h / 2,
						width: size.w,
						height: size.h,
						transform: `translate(${fromX * (1 - enter)}px, ${fromY * (1 - enter) + floatY}px) rotate(${rot}deg) scaleX(${flip})`,
					}}
				>
					<Img
						src={staticFile(src)}
						style={{
							width: '100%',
							height: '100%',
							display: 'block',
							borderRadius: product.photo ? 10 : 0,
							border: product.photo ? `10px solid ${COLORS.white}` : undefined,
							boxSizing: 'border-box',
							filter: dark
								? 'drop-shadow(0 0 22px rgba(255,255,255,0.42)) drop-shadow(0 18px 24px rgba(0,0,0,0.6))'
								: 'drop-shadow(0 26px 26px rgba(80,40,0,0.32))',
						}}
					/>
				</div>

				{/* étiquette prix */}
				<div
					style={{
						position: 'absolute',
						left: SAFE.side + 8,
						right: SAFE.side + 8,
						top: 1240,
						padding: '30px 38px 34px',
						background: COLORS.black,
						border: dark ? `4px solid ${COLORS.yellow}` : 'none',
						boxShadow: dark ? 'none' : '14px 14px 0 rgba(0,0,0,0.18)',
						transform: `translateX(${(1 - tagIn) * -1100}px) rotate(-1.5deg)`,
						fontFamily: FONTS.typewriter,
						fontWeight: 700,
						color: COLORS.yellow,
					}}
				>
					{variantName ? (
						<div style={{fontSize: 36, letterSpacing: '0.1em', color: COLORS.white, marginBottom: 6}}>
							<TypewriterText key={variantName} text={variantName} start={variant === 0 ? 4 : variant * every} framesPerChar={1} cursor={false} seed={variantName} />
						</div>
					) : null}
					<div style={{fontSize: product.name.length > 22 ? 46 : 54, lineHeight: 1.12}}>
						<TypewriterText text={product.name} start={4} framesPerChar={1} cursor={false} seed={product.id} />
					</div>
					<div
						style={{
							fontSize: 136,
							lineHeight: 1.05,
							marginTop: 6,
							transformOrigin: '0% 60%',
							transform: `scale(${f < PRICE_AT ? 0 : 1.5 - 0.5 * priceP})`,
							opacity: f < PRICE_AT ? 0 : 1,
						}}
					>
						{formatPrice(product.price)}
					</div>
					<div style={{fontSize: product.sizes.length > 14 ? 40 : 56, letterSpacing: '0.04em', marginTop: 4}}>
						<TypewriterText text={product.sizes} start={SIZES_AT} framesPerChar={1.5} cursorColor={COLORS.yellow} seed={`${product.id}-s`} />
					</div>
					{product.note ? (
						<div style={{fontSize: 34, color: COLORS.white, marginTop: 10, opacity: f > SIZES_AT + 16 ? 1 : 0}}>
							{product.note}
						</div>
					) : null}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
