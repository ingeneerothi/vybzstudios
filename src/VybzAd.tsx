import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from "remotion";
import { Background } from "./components/Layout";
import { BadAd, Hook, NoSite, Poster, Reaction } from "./scenes/Problem";
import { CallToAction, Relief, Reveal, Services, Work } from "./scenes/Solution";
import { MUSIC_FROM, SCENES, TOTAL } from "./timing";
import { loadFonts } from "./fonts";

loadFonts();

const MUSIC_LENGTH = TOTAL - MUSIC_FROM;
const MUSIC_FADE_OUT = 96; // 1.6 s

// Vybz Studios ad: 37 s, 1080x1920 at 60 fps (rendered at 2x for 4K).
// Scenes 1-7 keep the clips' own sound; from scene 8 the red-cap audio plays
// from its start to the end, fading out.
export const VybzAd: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Sequence name="1 Accroche" {...SCENES.hook}>
      <Hook />
    </Sequence>
    <Sequence name="2 Pub ratée" {...SCENES.badAd}>
      <BadAd />
    </Sequence>
    <Sequence name="3 Réaction" {...SCENES.reaction}>
      <Reaction />
    </Sequence>
    <Sequence name="4 Pas de site" {...SCENES.noSite}>
      <NoSite />
    </Sequence>
    <Sequence name="5 Affiche ratée" {...SCENES.poster}>
      <Poster />
    </Sequence>
    <Sequence name="6 La solution" {...SCENES.solution}>
      <Reveal />
    </Sequence>
    <Sequence name="7 Soulagement" {...SCENES.relief}>
      <Relief />
    </Sequence>
    <Sequence name="8 Nos services" {...SCENES.services}>
      <Services />
    </Sequence>
    <Sequence name="9-10 Réalisations" {...SCENES.work}>
      <Work />
    </Sequence>
    <Sequence name="11 Appel à l'action" {...SCENES.cta}>
      <CallToAction />
    </Sequence>
    <Sequence name="Son casquette rouge" from={MUSIC_FROM} durationInFrames={MUSIC_LENGTH}>
      <Html5Audio
        src={staticFile("media/redcap-audio.m4a")}
        volume={(f) =>
          interpolate(f, [0, 4, MUSIC_LENGTH - MUSIC_FADE_OUT, MUSIC_LENGTH], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </Sequence>
  </AbsoluteFill>
);
