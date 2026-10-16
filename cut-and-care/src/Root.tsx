import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {OffreSemaine, defaultContent, offreSchema} from './OffreSemaine';
import {DURATION_FRAMES, FPS} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="OffreSemaine"
    component={OffreSemaine}
    durationInFrames={DURATION_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
    schema={offreSchema}
    defaultProps={defaultContent}
  />
);
