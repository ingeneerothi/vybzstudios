import {Config} from '@remotion/cli/config';

// Tous les visuels (captures, découpes, polices, musique optionnelle) vivent dans assets/.
Config.setPublicDir('./assets');

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');

// Chrome headless : Remotion le télécharge tout seul. Pour réutiliser un Chrome déjà
// installé (CI, conteneur sans accès réseau), exporter REMOTION_CHROME=/chemin/vers/chrome.
if (process.env.REMOTION_CHROME) {
	Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
