import React from 'react';
import {Composition} from 'remotion';
import {SleepingBirds} from './sleeping-birds/SleepingBirds';
import {DURATION, FPS} from './sleeping-birds/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SleepingBirds"
      component={SleepingBirds}
      durationInFrames={Math.round(DURATION * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
