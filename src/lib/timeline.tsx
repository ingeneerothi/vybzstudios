import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

type SceneTiming = {
	/** Frame globale où la séquence de la scène commence (transition d'entrée comprise). */
	startFrame: number;
	/** Durée de la transition d'entrée : le premier temps de la scène tombe ici. */
	intro: number;
};

const SceneContext = createContext<SceneTiming>({startFrame: 0, intro: 0});

export const SceneProvider = SceneContext.Provider;

/** Frame absolue de la vidéo, pour tout ce qui se cale sur le tempo global. */
export const useGlobalFrame = () => useCurrentFrame() + useContext(SceneContext).startFrame;

/** Frame locale comptée depuis le premier temps de la scène (0 = fin de la transition d'entrée). */
export const useBeatFrame = () => useCurrentFrame() - useContext(SceneContext).intro;
