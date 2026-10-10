import { continueRender, delayRender, staticFile } from "remotion";

const WEIGHTS = [500, 600, 700, 800, 900];

// Poppins is served from public/fonts so rendering never depends on the
// network. Rendering waits until every weight is ready.
let started = false;

export const loadFonts = () => {
  if (started) {
    return;
  }
  started = true;
  const handle = delayRender("Loading Poppins");
  Promise.all(
    WEIGHTS.map((weight) =>
      new FontFace(
        "Poppins",
        `url(${staticFile(`fonts/poppins-latin-${weight}-normal.woff2`)}) format('woff2')`,
        { weight: String(weight) },
      )
        .load()
        .then((face) => document.fonts.add(face)),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
