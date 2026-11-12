import React from 'react';
import {Composition, Still} from 'remotion';
import {Points85, DURATION_S} from './videos/points85/Video';
import {Thumb85} from './videos/points85/Thumbnail';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Points85" component={Points85} durationInFrames={Math.ceil(DURATION_S * 30)} fps={30} width={1920} height={1080} />
    <Still id="Thumb85" component={Thumb85} width={1280} height={720} />
  </>
);
