import { Composition } from "remotion";
import { VybzAd } from "./VybzAd";
import { FPS, TOTAL } from "./timing";
import { H, W } from "./theme";

// Render in 4K (2160x3840) with:  npx remotion render VybzAd --scale=2
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VybzAd"
      component={VybzAd}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
