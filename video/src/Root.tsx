import React from 'react';
import {Composition} from 'remotion';
import {TheEgg, EGG_DURATION_S} from './egg/TheEgg';

export const FPS = 60;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TheEgg"
      component={TheEgg}
      durationInFrames={Math.round(EGG_DURATION_S * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
