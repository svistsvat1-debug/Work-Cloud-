import React from 'react';
import {Composition} from 'remotion';
import {MothsShort} from './moths/MothsShort';
import {FPS, DUR} from './moths/timing';
import {MothsCover} from './moths/Cover';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MothsShort" component={MothsShort} durationInFrames={Math.round(DUR * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="MothsCover" component={MothsCover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
