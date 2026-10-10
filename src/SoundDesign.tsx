import React from "react";
import { Sfx, TypingSfx, type SfxName } from "./components/Sfx";
import {
  BAD_AD_GLITCH,
  CEMENT_END_CARD,
  HOOK_WIDGETS,
  URL,
  URL_FAIL,
  URL_PER_CHAR,
  URL_RETURN,
  URL_START,
} from "./scenes/Problem";
import {
  CTA,
  CTA_DONE,
  PRICE_AT,
  QUERY,
  REVEAL,
  SEARCH,
  SERVICE_AT,
} from "./scenes/Solution";
import { SWAP_AT } from "./scenes/Work";
import { REACTION_PLAY, SCENES as S } from "./timing";

const POPS: SfxName[] = ["pop-0", "pop-1", "pop-2"];

// Every sound effect of the ad on the global timeline, so none is cut off by
// the end of a scene. Whooshes land their peak exactly on the cut; UI sounds
// sit on the frame of the action they belong to.
export const SoundDesign: React.FC = () => (
  <>
    {/* 1. Hook: a swell that builds into the first words */}
    <Sfx name="whoosh-in" at={0} gain={0.6} />
    <Sfx name="sub-hit" at={36} gain={0.5} />
    {HOOK_WIDGETS.map((w, i) => (
      <Sfx
        key={`hook${i}`}
        name={POPS[i % 3]}
        at={S.hook.from + w.at + 4}
        gain={0.6}
      />
    ))}

    {/* 2. Bad ad (the clip itself is nearly silent) */}
    <Sfx name="whoosh-in" align="peak" at={S.badAd.from} gain={0.8} />
    <Sfx name="sub-hit" at={S.badAd.from} gain={0.45} />
    {/* glitch sounds on 3 of the caption's glitch bursts (every 56 f) */}
    {[0, 2, 4].map((n) => (
      <Sfx
        key={`glitch${n}`}
        name="glitch"
        at={S.badAd.from + BAD_AD_GLITCH + n * 56}
        gain={0.9 - n * 0.12}
      />
    ))}
    {/* the punchline: the clip cuts to its white end card */}
    <Sfx name="sub-hit" at={S.badAd.from + CEMENT_END_CARD} gain={0.55} />

    {/* 3. Reaction: light swish under the clip's own sound, boom on freeze */}
    <Sfx name="swish" at={S.reaction.from} gain={0.5} />
    <Sfx name="boom-meme" at={S.reaction.from + REACTION_PLAY} />

    {/* 4. No website */}
    <Sfx name="whoosh-in" align="peak" at={S.noSite.from} gain={0.7} />
    <TypingSfx
      start={S.noSite.from + URL_START}
      perChar={URL_PER_CHAR}
      text={URL}
    />
    <Sfx name="key-return" at={S.noSite.from + URL_RETURN} />
    <Sfx name="error" at={S.noSite.from + URL_FAIL} />

    {/* 5. Dull poster: customers walk away */}
    <Sfx name="whoosh-in" align="peak" at={S.poster.from} gain={0.7} />
    <Sfx name="whoosh-out" at={S.poster.from + 24} gain={0.6} />
    <Sfx name="whoosh-out" at={S.poster.from + 50} gain={0.45} />
    {/* glitch sounds on the headline's glitch bursts (settled at local 31) */}
    <Sfx name="glitch" at={S.poster.from + 87} gain={0.5} />
    <Sfx name="glitch" at={S.poster.from + 143} gain={0.4} />

    {/* 6. Search "vybz studios" */}
    <Sfx name="whoosh-in" align="peak" at={S.search.from} gain={0.7} />
    <Sfx name="tap" at={S.search.from + SEARCH.tapField} />
    <Sfx name="swish" at={S.search.from + SEARCH.tapField + 2} gain={0.45} />
    <TypingSfx
      start={S.search.from + SEARCH.typeStart}
      perChar={SEARCH.perChar}
      text={QUERY}
    />
    <Sfx name="key-return" at={S.search.from + SEARCH.enter} />
    <Sfx name="pop-2" at={S.search.from + SEARCH.results + 2} />
    <Sfx name="tap" at={S.search.from + SEARCH.tapResult} />

    {/* 7. Logo */}
    <Sfx name="whoosh-in" align="peak" at={S.reveal.from} gain={1} />
    <Sfx name="sub-hit" at={S.reveal.from} gain={0.8} />
    <Sfx name="success" at={S.reveal.from + REVEAL.logo + 10} />
    <Sfx name="shimmer" at={S.reveal.from + REVEAL.shine} gain={0.8} />

    {/* 8. Relief (clip sound) */}
    <Sfx name="whoosh-in" align="peak" at={S.relief.from} gain={0.6} />
    <Sfx name="swish" at={S.relief.from} gain={0.45} />

    {/* 9. Services (the music starts here) */}
    <Sfx name="whoosh-in" align="peak" at={S.services.from} gain={0.8} />
    {SERVICE_AT.map((at, i) => (
      <Sfx key={`svc${i}`} name={POPS[i % 3]} at={S.services.from + at + 2} />
    ))}
    <Sfx name="cash" at={S.services.from + PRICE_AT} />

    {/* 10. Our work */}
    <Sfx name="whoosh-in" align="peak" at={S.work.from} gain={0.7} />
    <Sfx name="shimmer" at={S.work.from + 8} gain={0.7} />
    <Sfx name="swish" at={S.work.from + SWAP_AT} gain={0.6} />

    {/* 11. Call to action */}
    <Sfx name="whoosh-in" align="peak" at={S.cta.from} gain={0.7} />
    <Sfx name="pop-1" at={S.cta.from + CTA.pill + 2} />
    <TypingSfx
      start={S.cta.from + CTA.numberStart}
      perChar={CTA.perChar}
      text={CTA.number}
    />
    <Sfx name="ding" at={S.cta.from + CTA_DONE} />
  </>
);
