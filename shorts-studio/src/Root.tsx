import React from 'react';
import {Composition} from 'remotion';
import {MosquitoRain} from './mosquito/MosquitoRain';
import {DURATION_FRAMES} from './mosquito/timing';
import {FPS, H, W} from './mosquito/util';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MosquitoRain" component={MosquitoRain} durationInFrames={DURATION_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
