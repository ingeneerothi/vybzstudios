import {Config} from '@remotion/cli/config';

// Chromium headless déjà présent dans l'environnement (pas de téléchargement).
const HEADLESS = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (process.env.REMOTION_BROWSER !== 'auto') {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE ?? HEADLESS);
}

// Livraison réseaux sociaux : H.264, yuv420p, AAC 320k (cf. skill After Effects, export Reels/TikTok).
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setAudioBitrate('320k');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
