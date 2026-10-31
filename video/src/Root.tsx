import React from 'react';
import {Composition, Still} from 'remotion';
import {Sheet} from './woodpecker/Sheet';
import {Woodpecker, FPS, DUR} from './woodpecker/Woodpecker';
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Woodpecker" component={Woodpecker} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DUR * FPS)} />
    <Still id="SpriteSheet" component={Sheet} width={1080} height={1920} />
  </>
);
