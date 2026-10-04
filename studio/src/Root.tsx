import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './brand';
import './fonts';
import {Video01, video01Duration} from './videos/v01/Video01';
import {Video02, video02Duration} from './videos/v02/Video02';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="v01-ask-chatgpt" component={Video01} durationInFrames={video01Duration} fps={FPS} width={W} height={H} />
    <Composition id="v02-hold-it-down" component={Video02} durationInFrames={video02Duration} fps={FPS} width={W} height={H} />
  </>
);
