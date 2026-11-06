import React from 'react';
import {Composition} from 'remotion';
import {Straw, FPS, DURATION} from './Straw';

export const RemotionRoot: React.FC = () => (
  <Composition id="Straw" component={Straw} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
);
