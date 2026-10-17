import {getStaticFiles, staticFile} from 'remotion';
import manifest from '../../assets/manifest.json';

export {manifest};

/** Vrai si le fichier existe dans assets/ (musique, logo optionnels). */
export const hasAsset = (name: string) => getStaticFiles().some((f) => f.name === name);

export const headSrc = (name: string, sticker = false) =>
	staticFile(`heads/${name}${sticker ? '-sticker' : ''}.webp`);

export const headInfo = (name: string) => {
	const info = (manifest.heads as Record<string, {w: number; h: number; stickerPad: number}>)[name];
	if (!info) {
		throw new Error(`Tête inconnue dans assets/manifest.json : ${name}`);
	}
	return info;
};

/** Taille naturelle d'une image produit (products/xxx.webp). */
export const productInfo = (path: string) => {
	const id = path.replace(/^products\//, '').replace(/\.webp$/, '');
	const info = (manifest.products as Record<string, {w: number; h: number}>)[id];
	if (!info) {
		throw new Error(`Produit inconnu dans assets/manifest.json : ${path}`);
	}
	return info;
};
