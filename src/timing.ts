// Scene timeline, in frames at 60 fps (39.7 s in total, under the 40 s cap).
// The clip scenes last exactly as long as their clip so every clip plays in
// full: cement 5.20 s = 312 f, reaction 1.33 s = 80 f (then held), girl
// 3.62 s = 217 f.
export const FPS = 60;

const ORDER = [
  ["hook", 165], // "Tu as une marque. Tu fais de la pub…"
  ["badAd", 312], // full-screen cement clip
  ["reaction", 138], // full-screen reaction, then freeze-frame
  ["noSite", 150], // phone browser that cannot open a site
  ["poster", 170], // dull Nivea poster, customers leave
  ["search", 140], // typing "vybz studios" in the browser
  ["reveal", 150], // the logo, "est là pour t'aider."
  ["relief", 217], // full-screen girl clip
  ["services", 240], // services + "Prix très abordables"; music starts
  ["work", 480], // "Nos réalisations" (unchanged)
  ["cta", 220], // WhatsApp call to action
] as const;

type SceneName = (typeof ORDER)[number][0];

export const SCENES = (() => {
  let from = 0;
  const out = {} as Record<
    SceneName,
    { from: number; durationInFrames: number }
  >;
  for (const [name, durationInFrames] of ORDER) {
    out[name] = { from, durationInFrames };
    from += durationInFrames;
  }
  return out;
})();

export const WORK_SWITCH = 300; // frame inside "work" where Bubble Tea takes over

export const REACTION_PLAY = 80; // the reaction clip, then its last frame is held
export const MUSIC_FROM = SCENES.services.from;
export const TOTAL = SCENES.cta.from + SCENES.cta.durationInFrames; // 2382 f
