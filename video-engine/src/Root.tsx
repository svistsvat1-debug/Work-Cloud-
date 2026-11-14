import React from 'react';
import {Composition} from 'remotion';
import {Habakkuk} from './Habakkuk';
import timing from './habakkuk-timing.json';

export const Root: React.FC = () => (
  <Composition id="PaintTest" component={Habakkuk} durationInFrames={timing.end} fps={30} width={1920} height={1080} />
);
