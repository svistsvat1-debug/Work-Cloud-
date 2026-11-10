import React from 'react';
import {Composition} from 'remotion';
import {FlamingoShort, DURATION, FPS} from './flamingo/FlamingoShort';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FlamingoShort"
      component={FlamingoShort}
      durationInFrames={Math.round(DURATION * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
