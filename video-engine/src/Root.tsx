import React from 'react';
import {Composition} from 'remotion';
import timeline from './data/timeline.json';
import {Video} from './Video';
import {Thumb} from './Thumb';
import {ThumbReal} from './ThumbReal';
import {FPS, H, W} from './lib/theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Video} durationInFrames={Math.ceil(timeline.total * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={FPS} width={1280} height={720} />
    <Composition id="ThumbReal" component={ThumbReal} durationInFrames={1} fps={FPS} width={1280} height={720} />
  </>
);
