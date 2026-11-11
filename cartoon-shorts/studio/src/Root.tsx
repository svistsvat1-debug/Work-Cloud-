import React from 'react';
import {Composition, Still} from 'remotion';
import {OceanTrenchShort} from './ocean-trench/Short';
import {OceanTrenchCover} from './ocean-trench/Cover';
import {DURATION, FPS} from './ocean-trench/scene';
import {MoonTrashShort} from './moon-trash/Short';
import {MoonTrashCover} from './moon-trash/Cover';
import {DURATION as MT_DURATION, FPS as MT_FPS} from './moon-trash/scene';

// One composition per Short (+ its cover still).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="OceanTrench" component={OceanTrenchShort} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
      <Still id="OceanTrenchCover" component={OceanTrenchCover} width={1080} height={1920} />
      <Composition id="MoonTrash" component={MoonTrashShort} durationInFrames={Math.round(MT_DURATION * MT_FPS)} fps={MT_FPS} width={1080} height={1920} />
      <Still id="MoonTrashCover" component={MoonTrashCover} width={1080} height={1920} />
    </>
  );
};
