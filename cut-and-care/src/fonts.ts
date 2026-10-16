import '@fontsource/great-vibes/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import {continueRender, delayRender} from 'remotion';

// Polices locales (@fontsource) : on attend leur chargement avant de rendre la moindre frame.
const FACES = [
  '400 80px "Great Vibes"',
  '600 80px Cinzel',
  '700 80px Cinzel',
  'italic 400 80px "Playfair Display"',
  '700 80px "Playfair Display"',
  'italic 500 80px "Cormorant Garamond"',
  '600 80px "Cormorant Garamond"',
  '500 80px Montserrat',
  '600 80px Montserrat',
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Chargement des polices');
  Promise.all(FACES.map((face) => document.fonts.load(face, 'AÉÈÀéèàç0123456789 &@«»')))
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}
