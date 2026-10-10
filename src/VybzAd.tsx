import React from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { StudioBackground } from "./components/Stage";
import { BadAd, Hook, NoSite, Poster, Reaction } from "./scenes/Problem";
import {
  CTA,
  CallToAction,
  Relief,
  Reveal,
  Search,
  Services,
} from "./scenes/Solution";
import { Work } from "./scenes/Work";
import { SoundDesign } from "./SoundDesign";
import { MUSIC_FROM, SCENES, TOTAL } from "./timing";
import { EASE_IN, EASE_OUT, clamp } from "./motion";
import { loadFonts } from "./fonts";

loadFonts();

const MUSIC_LENGTH = TOTAL - MUSIC_FROM;
const MUSIC_FADE_OUT = 96; // 1.6 s
// The music dips by ~4 dB while the phone number is typed so its key ticks
// stay audible (frames relative to the music start).
const DUCK_FROM = SCENES.cta.from + CTA.numberStart - MUSIC_FROM;
const DUCK_TO = DUCK_FROM + CTA.number.length * CTA.perChar + 4;

// The house transition for the light scenes: each one lands with a small
// camera settle and leaves by zooming through a short blur, while a whoosh
// lands its peak on the cut.
const Cam: React.FC<{
  total: number;
  exit?: boolean;
  children: React.ReactNode;
}> = ({ total, exit = true, children }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 16], [1.045, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const out = exit
    ? interpolate(frame, [total - 8, total], [0, 1], {
        ...clamp,
        easing: EASE_IN,
      })
    : 0;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${enter * (1 + 0.06 * out)})`,
        filter: out > 0.01 ? `blur(${out * 10}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Vybz Studios ad v2: 39.7 s, 1080x1920 at 60 fps (rendered at 2x for 4K).
// The meme clips keep their own sound; from "Nos services" the red-cap audio
// plays from its start to the end, fading out; sound effects on top.
export const VybzAd: React.FC = () => (
  <AbsoluteFill>
    <StudioBackground />
    <Sequence name="1 Accroche" {...SCENES.hook}>
      <Cam total={SCENES.hook.durationInFrames}>
        <Hook />
      </Cam>
    </Sequence>
    <Sequence name="2 Pub ratée" {...SCENES.badAd}>
      <BadAd />
    </Sequence>
    <Sequence name="3 Réaction" {...SCENES.reaction}>
      <Reaction />
    </Sequence>
    <Sequence name="4 Pas de site" {...SCENES.noSite}>
      <Cam total={SCENES.noSite.durationInFrames}>
        <NoSite />
      </Cam>
    </Sequence>
    <Sequence name="5 Affiche ratée" {...SCENES.poster}>
      <Cam total={SCENES.poster.durationInFrames}>
        <Poster />
      </Cam>
    </Sequence>
    <Sequence name="6 Recherche" {...SCENES.search}>
      <Search />
    </Sequence>
    <Sequence name="7 Logo" {...SCENES.reveal}>
      <Cam total={SCENES.reveal.durationInFrames}>
        <Reveal />
      </Cam>
    </Sequence>
    <Sequence name="8 Soulagement" {...SCENES.relief}>
      <Relief />
    </Sequence>
    <Sequence name="9 Services" {...SCENES.services}>
      <Cam total={SCENES.services.durationInFrames}>
        <Services />
      </Cam>
    </Sequence>
    <Sequence name="10 Réalisations" {...SCENES.work}>
      <Work />
    </Sequence>
    <Sequence name="11 Contact" {...SCENES.cta}>
      <Cam total={SCENES.cta.durationInFrames} exit={false}>
        <CallToAction />
      </Cam>
    </Sequence>
    <SoundDesign />
    <Sequence
      name="Son casquette rouge"
      from={MUSIC_FROM}
      durationInFrames={MUSIC_LENGTH}
    >
      <Html5Audio
        src={staticFile("media/redcap-audio.m4a")}
        volume={(f) =>
          interpolate(
            f,
            [
              0,
              4,
              DUCK_FROM - 10,
              DUCK_FROM,
              DUCK_TO,
              DUCK_TO + 12,
              MUSIC_LENGTH - MUSIC_FADE_OUT,
              MUSIC_LENGTH,
            ],
            [0, 1, 1, 0.63, 0.63, 1, 1, 0],
            clamp,
          )
        }
      />
    </Sequence>
  </AbsoluteFill>
);
