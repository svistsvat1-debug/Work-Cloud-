import React from 'react';
import {Composition, Still} from 'remotion';
import {BeesCover} from './bees/Cover';
import {BeesSting} from './bees/BeesSting';
import {DURATION_FRAMES, FPS} from './bees/T';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BeesSting" component={BeesSting} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />
    <Still id="BeesCover" component={BeesCover} width={1080} height={1920} />
  </>
);
