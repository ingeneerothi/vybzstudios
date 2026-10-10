// Scene timeline, in frames at 60 fps. The clip scenes last exactly as long as
// their clip so every clip plays in full:
//   cement 5.20 s = 312 f, reaction 1.33 s = 80 f, girl 3.62 s = 217 f.
export const FPS = 60;

export const SCENES = {
  hook: { from: 0, durationInFrames: 150 }, // 0 - 2.5 s
  badAd: { from: 150, durationInFrames: 312 }, // 2.5 - 7.7 s
  reaction: { from: 462, durationInFrames: 138 }, // 7.7 - 10 s
  noSite: { from: 600, durationInFrames: 150 }, // 10 - 12.5 s
  poster: { from: 750, durationInFrames: 180 }, // 12.5 - 15.5 s
  solution: { from: 930, durationInFrames: 150 }, // 15.5 - 18 s
  relief: { from: 1080, durationInFrames: 217 }, // 18 - 21.62 s
  services: { from: 1297, durationInFrames: 240 }, // 21.62 - 25.62 s
  work: { from: 1537, durationInFrames: 480 }, // 25.62 - 33.62 s (Cut & Care 300 f, then Bubble Tea 180 f)
  cta: { from: 2017, durationInFrames: 203 }, // 33.62 - 37 s
} as const;

export const WORK_SWITCH = 300; // frame inside "work" where Bubble Tea takes over

export const REACTION_PLAY = 80; // the reaction clip, then its last frame is held
export const MUSIC_FROM = SCENES.services.from;
export const TOTAL = SCENES.cta.from + SCENES.cta.durationInFrames; // 2220 f = 37 s
