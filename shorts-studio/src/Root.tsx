import React from 'react';
import {Composition} from 'remotion';
import {Phages} from './phages/Phages';
import {PhagesCover} from './phages/Cover';
import {FPS, FRAMES} from './phages/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Phages" component={Phages} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="PhagesCover" component={PhagesCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
