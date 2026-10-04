import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './brand';
import './fonts';
import {Video01, video01Duration} from './videos/v01/Video01';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="v01-ask-chatgpt" component={Video01} durationInFrames={video01Duration} fps={FPS} width={W} height={H} />
  </>
);
