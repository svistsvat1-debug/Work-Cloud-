import React from 'react';
import {Composition} from 'remotion';
import {GearShort, PoseSheet} from './gear/Scene';
import {DURATION, FPS} from './gear/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GearConcrete" component={GearShort} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="GearPoseSheet" component={PoseSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
