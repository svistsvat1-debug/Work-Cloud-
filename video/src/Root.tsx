import React from 'react';
import {Composition, Still} from 'remotion';
import {FlamingoShort, FlamingoThumb, DURATION, FPS} from './flamingo/FlamingoShort';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FlamingoShort"
      component={FlamingoShort}
      durationInFrames={Math.round(DURATION * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Still id="FlamingoThumb" component={FlamingoThumb} width={1080} height={1920} />
  </>
);
