import {Easing, interpolate} from 'remotion';

export const FPS = 30;
export const DURATION_S = 45;
export const DURATION_FRAMES = DURATION_S * FPS;

/** secondes -> frame */
export const f = (s: number) => Math.round(s * FPS);

/**
 * Repères de la voix off (public/voix-off.wav, secondes), mesurés par
 * tools/prepare_voiceover.py (silencedetect) puis affinés mot à mot.
 * Texte : version A validée.
 */
export const T = {
  // « Mesdames, évitez la foule du week-end. »
  hook: {start: 0, mesdames: 0.17, evitez: 0.88, weekend: 1.85, end: 2.41},
  // « Offre semaine chez Cut and Care Styling : du mardi au vendredi, coiffez-vous au calme, et économisez. »
  offre: {start: 2.41, chez: 3.33, panel: 4.32, mardi: 4.62, mercredi: 4.78, jeudi: 4.94, vendredi: 5.12, coiffez: 5.77, calme: 6.3, economisez: 7.0, end: 8.06},
  // « Tissage, ouvert ou fermé : sept mille neuf cents. »
  tissage: {start: 8.06, ouvert: 8.74, prix: 9.74, end: 10.79},
  // « Nattes : dix mille, tresses : quinze mille, mèches incluses. »
  nattes: {start: 10.79, prix: 11.39},
  tresses: {start: 12.15, prix: 12.79, meches: 13.51, end: 14.46},
  // « Micro twist : quinze mille. »
  twist: {start: 14.46, prix: 15.4},
  // « Micro twist locks, taille quatorze : cinquante-cinq mille, mèches incluses. »
  locks: {start: 16.16, taille: 17.15, prix: 18.01, meches: 19.04, end: 19.99},
  // « Coupe : douze mille, maintenance : quatre mille. »
  coupe: {start: 19.99, prix: 20.46, maintenance: 21.25, maintenancePrix: 22.04, end: 22.79},
  // « Shampoing traitant et hydratant inclus, pause collation offerte. »
  soins: {start: 22.79, collation: 24.77, end: 25.99},
  // « Carte étudiant ou scolaire ? Moins trente-trois pour cent sur braids et tresses simples. »
  etudiant: {start: 25.99, moins: 27.21, condition: 28.35, end: 29.76},
  // « Service à domicile. »
  domicile: {start: 29.76, end: 30.99},
  // « TikTok et Instagram : arobase Cut Care zéro un. »
  reseaux: {start: 30.99, instagram: 31.53, handle: 32.15, handleEnd: 33.65, end: 33.88},
  // « À Angré Djibi un, sur Yango : Cut Care Styling. »
  adresse: {start: 33.88, yango: 34.98, nom: 35.8, nomEnd: 36.68, end: 36.9},
  // « Écrivez-nous sur WhatsApp : zéro sept, un sept, deux deux, un sept, cinq quatre. »
  whatsapp: {start: 36.9, pairs: [38.21, 38.98, 39.7, 40.33, 40.95], end: 41.84},
  // « Le style, le soin, la beauté. »
  slogan: {start: 41.84, soin: 42.61, beaute: 43.31, endCard: 42.95, end: DURATION_S},
} as const;

/** Les changements d'image arrivent un poil avant le mot (anticipation de montage). */
export const LEAD = 0.18;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);

/** progression 0→1 entre t0 et t0+dur (secondes), easée et bornée */
export const prog = (frame: number, t0: number, dur: number, easing = EASE_OUT) =>
  interpolate(frame, [f(t0), f(t0) + Math.max(1, f(dur))], [0, 1], {...clamp, easing});

/** valeur linéaire bornée entre deux instants (secondes) */
export const span = (frame: number, t0: number, t1: number, from: number, to: number, easing = EASE_IN_OUT) =>
  interpolate(frame, [f(t0), Math.max(f(t0) + 1, f(t1))], [from, to], {...clamp, easing});

export const visible = (frame: number, t0: number, t1: number) => frame >= f(t0) && frame <= f(t1);
