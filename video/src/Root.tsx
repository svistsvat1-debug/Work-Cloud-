import React from 'react';
import {Composition} from 'remotion';
import {HummingbirdShort} from './hummingbird/Scene';
import {DURATION_FRAMES, FPS} from './hummingbird/timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="Hummingbird" component={HummingbirdShort} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
);
