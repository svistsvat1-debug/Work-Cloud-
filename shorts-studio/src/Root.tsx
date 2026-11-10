import React from 'react';
import {Composition} from 'remotion';
import {Tiger} from './tiger/Tiger';
import {DURATION_FRAMES, FPS} from './tiger/timing';

export const Root: React.FC = () => (
  <>
    <Composition id="Tiger" component={Tiger} width={1080} height={1920} fps={FPS} durationInFrames={DURATION_FRAMES} />
  </>
);
