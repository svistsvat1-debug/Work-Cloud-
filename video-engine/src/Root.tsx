import React from 'react';
import {Composition} from 'remotion';
import {VideoFromTimeline} from './components/VideoFromTimeline';
import timeline from './videos/one-soldier/timeline.json';
import {SCENES} from './videos/one-soldier/scenes';
import {Thumbnail} from './videos/one-soldier/Thumbnail';
import {ThumbA, ThumbB, ThumbC} from './videos/one-soldier/ThumbsV2';

const FPS = 30;

// scene components cannot travel through (JSON-serialised) props, so bind them here
const OneSoldier: React.FC = () => <VideoFromTimeline scenes={(timeline as any).scenes} defs={SCENES} />;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="OneSoldier"
      component={OneSoldier}
      durationInFrames={Math.round((timeline as any).duration * FPS)}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition id="OneSoldierThumb" component={Thumbnail} durationInFrames={1} fps={FPS} width={1280} height={720} />
    <Composition id="ThumbA" component={ThumbA} durationInFrames={1} fps={FPS} width={1280} height={720} />
    <Composition id="ThumbB" component={ThumbB} durationInFrames={1} fps={FPS} width={1280} height={720} />
    <Composition id="ThumbC" component={ThumbC} durationInFrames={1} fps={FPS} width={1280} height={720} />
  </>
);
