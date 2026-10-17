/**
 * OSCAN — vidéo de présentation. Tout ce qui se modifie est ici :
 * textes, prix, tailles, couleurs, tempo et durée des scènes.
 * Les chemins d'images sont relatifs au dossier assets/.
 */

export const VIDEO = {width: 1080, height: 1920, fps: 60};

/** Tempo de référence : toutes les coupes tombent sur un temps. */
export const BPM = 100;
/** Durée d'un temps en frames (60 / 100 × 60 = 36). */
export const BEAT = Math.round((60 / BPM) * VIDEO.fps);

/** Durée de chaque scène, en temps (beats). 58 temps = 34,8 s à 100 BPM. */
export const SCENE_BEATS = {
	hook: 4,
	presentation: 5,
	universe: 6,
	drawing: 7,
	product: 3, // par produit
	social: 5,
	cta: 7,
};

/** Durée des transitions en frames (elles se terminent pile sur le temps). */
export const TRANSITION_FRAMES = {shutter: 18, wipe: 12, slide: 12};

export const COLORS = {
	yellow: '#FFD21F',
	yellowRay: '#FFC21A',
	black: '#0A0A0A',
	white: '#FFFFFF',
	paper: '#F3EEE3',
	red: '#E3262E',
	green: '#2E9E46',
};

export const FONTS = {
	/** Machine à écrire : textes, prix, tailles. */
	typewriter: "'Courier Prime', 'Courier New', monospace",
	/** Capitales très épaisses : chiffres, titres. */
	title: "'Anton', Impact, sans-serif",
	/** Wordmark cartoon (même esprit que la pochette du pack stickers). */
	cartoon: "'Luckiest Guy', 'Anton', sans-serif",
};

/** Zones sûres : aucun texte dans les 120 px du haut et du bas. */
export const SAFE = {top: 120, bottom: 120, side: 72};

/** Logo officiel : déposer assets/logo/oscan-logo.png (fond transparent) pour
 *  remplacer le wordmark typographique provisoire. */
export const LOGO_FILE = 'logo/oscan-logo.png';

/** Musique optionnelle : assets/music.mp3. Sans fichier, la vidéo reste muette. */
export const MUSIC = {file: 'music.mp3', volume: 0.9, trimBeforeSeconds: 0, fadeOutSeconds: 1.2};

export const TEXTS = {
	brand: 'OSCAN',
	presentation: {
		title: 'OSCAN —',
		subtitle: 'Made in Djassa',
		tagline: ['Dessiné à Abidjan.', 'Porté par la rue.'],
	},
	universe: 'Chaque tête a son histoire.',
	drawing: {before: 'DU DESSIN…', after: '…AU PRODUIT'},
	collection: 'COLLECTION',
	social: 'La communauté Oscan',
	cta: {line: 'Commande sur WhatsApp', handle: '@_oscvn', madeIn: 'MADE IN DJASSA'},
};

export const STATS = [
	{value: 23.7, decimals: 1, suffix: ' K', label: 'abonnés'},
	{value: 667, decimals: 0, suffix: ' K', label: "j'aime"},
];

export type Product = {
	id: string;
	name: string;
	/** Prix en francs CFA, affiché « 10.000F ». */
	price: number;
	/** Tailles (ou mention à la place des tailles). */
	sizes: string;
	/** Visuels montrés l'un après l'autre (coloris / modèles). */
	images: string[];
	/** Nom affiché au-dessus du titre pour chaque visuel (optionnel). */
	variantNames?: string[];
	note?: string;
	/** Visuel photo (rectangle opaque) plutôt que vêtement détouré. */
	photo?: boolean;
	background: 'yellow' | 'black';
};

/** Ordre du défilé « La collection ». */
export const PRODUCTS: Product[] = [
	{
		id: 'head-tee',
		name: "OSCAN'S HEAD TEE",
		price: 10000,
		sizes: 'M-L-XL-XXL',
		images: ['products/head-tee-white.webp', 'products/head-tee-black.webp'],
		background: 'yellow',
	},
	{
		id: 'longsleeve',
		name: "OSCAN'S HEAD LONGSLEEVE",
		price: 13000,
		sizes: 'M-L-XL-XXL',
		images: ['products/head-longsleeve-white.webp', 'products/head-longsleeve-black.webp'],
		background: 'black',
	},
	{
		id: 'kpocle',
		name: 'KPOCLE LUV MY MONEY TEE',
		price: 10000,
		sizes: 'M-L-XL-XXL',
		images: ['products/kpocle-white.webp', 'products/kpocle-black.webp'],
		background: 'yellow',
	},
	{
		id: 'jersey',
		name: "OSCAN'S HEAD JERSEY",
		price: 10000,
		sizes: 'M-L-XL-XXL',
		images: [
			'products/jersey-candy.webp',
			'products/jersey-helmet.webp',
			'products/jersey-senegal.webp',
			'products/jersey-france.webp',
		],
		note: '4 modèles',
		background: 'black',
	},
	{
		id: 'wart',
		name: 'REPUBLICAN SOLDIERS WART TEE',
		price: 10000,
		sizes: 'M-L-XL-XXL',
		images: ['products/wart-soldiers.webp', 'products/wart-soldier.webp'],
		background: 'yellow',
	},
	{
		id: '3am',
		name: '3AM TEE',
		price: 10000,
		sizes: 'M-L-XL-XXL',
		images: ['products/3am-tee.webp'],
		background: 'black',
	},
	{
		id: 'boob-heads',
		name: 'BOOB HEADS',
		price: 10000,
		sizes: 'S-M-L',
		images: [
			'products/boob-bomboclaat-crop.webp',
			'products/boob-candy-crop.webp',
			'products/boob-broken-crop.webp',
			'products/boob-spiky-crop.webp',
		],
		variantNames: ['BOMBOCLAAT', 'CANDY', 'BROKEN HEART', 'SPIKY'],
		note: 'crop top ou débardeur',
		background: 'yellow',
	},
	{
		id: 'stickers',
		name: 'OSCAN X NAVIGOX STICKERS PACK',
		price: 3000,
		sizes: "06 STICKERS À L'INTÉRIEUR",
		images: ['products/stickers-pack.webp'],
		photo: true,
		background: 'black',
	},
];

/** Scène 1 : têtes qui « claquent » (une par croche), puis le logo s'écrase. */
export const HOOK_HEADS = [
	{head: 'broken-heart', x: 285, y: 470, size: 430, rotate: -4},
	{head: 'rasta', x: 800, y: 430, size: 380, rotate: 5},
	{head: 'candy', x: 770, y: 1030, size: 470, rotate: -3},
	{head: 'spiky', x: 270, y: 1040, size: 420, rotate: 4},
	{head: 'g-pink', x: 320, y: 1530, size: 400, rotate: -5},
	{head: 'g-flame', x: 790, y: 1540, size: 420, rotate: 3},
];

/** Scène 3 : grille 3x3 (la tête du centre est celle dessinée en scène 4). */
export const UNIVERSE_GRID = [
	'g-mask',
	'g-flame',
	'g-thorns',
	'g-pink',
	'g-rasta',
	'g-earth',
	'g-ushanka',
	'g-spiky',
	'g-free',
];

/** Scène 6 : têtes de la « communauté ». */
export const COMMUNITY_HEADS = ['g-rasta', 'g-mask', 'candy', 'g-pink', 'broken-heart', 'g-earth', 'spiky'];
