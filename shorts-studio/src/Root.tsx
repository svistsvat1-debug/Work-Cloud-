import React from 'react';
import {Composition} from 'remotion';
import {BirdWire} from './birdwire/BirdWire';
import {DURATION} from './birdwire/timing';
import {FPS, H, W} from './birdwire/util';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BirdWire" component={BirdWire} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
  </>
);
