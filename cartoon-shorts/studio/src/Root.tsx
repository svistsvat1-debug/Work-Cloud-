import React from 'react';
import {Composition, Still} from 'remotion';
import {OceanTrenchShort} from './ocean-trench/Short';
import {OceanTrenchCover} from './ocean-trench/Cover';
import {DURATION, FPS} from './ocean-trench/scene';
import {MoonTrashShort} from './moon-trash/Short';
import {MoonTrashCover} from './moon-trash/Cover';
import {DURATION as MT_DURATION, FPS as MT_FPS} from './moon-trash/scene';
import {LavaFireHoseShort} from './lava-fire-hose/Short';
import {LavaFireHoseCover} from './lava-fire-hose/Cover';
import {DURATION as LAVA_DURATION, FPS as LAVA_FPS} from './lava-fire-hose/scene';
import {Doomsday2026Short} from './doomsday-2026/Short';
import {Doomsday2026Cover} from './doomsday-2026/Cover';
import {DURATION as DOOM_DURATION, FPS as DOOM_FPS} from './doomsday-2026/scene';

// One composition per Short (+ its cover still).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="OceanTrench" component={OceanTrenchShort} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
      <Still id="OceanTrenchCover" component={OceanTrenchCover} width={1080} height={1920} />
      <Composition id="MoonTrash" component={MoonTrashShort} durationInFrames={Math.round(MT_DURATION * MT_FPS)} fps={MT_FPS} width={1080} height={1920} />
      <Still id="MoonTrashCover" component={MoonTrashCover} width={1080} height={1920} />
      <Composition id="LavaFireHose" component={LavaFireHoseShort} durationInFrames={Math.round(LAVA_DURATION * LAVA_FPS)} fps={LAVA_FPS} width={1080} height={1920} />
      <Still id="LavaFireHoseCover" component={LavaFireHoseCover} width={1080} height={1920} />
      <Composition id="Doomsday2026" component={Doomsday2026Short} durationInFrames={Math.round(DOOM_DURATION * DOOM_FPS)} fps={DOOM_FPS} width={1080} height={1920} />
      <Still id="Doomsday2026Cover" component={Doomsday2026Cover} width={1080} height={1920} />
    </>
  );
};
