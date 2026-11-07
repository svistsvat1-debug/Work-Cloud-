import React from 'react';
import {Composition} from 'remotion';
import {Woodpecker} from './woodpecker/Woodpecker';
import {DURATION, FPS} from './woodpecker/geo';

export const RemotionRoot: React.FC = () => (
  <Composition id="WoodpeckerTongue" component={Woodpecker} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
