import React from 'react';
import {Composition, Still} from 'remotion';
import {PisaSheet} from './pisa/Sheet';
import {Pisa} from './pisa/Pisa';
import {DURATION} from './pisa/timing';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PisaTower" component={Pisa} durationInFrames={Math.round(DURATION * 60)} fps={60} width={1080} height={1920} />
    <Still id="PisaSheet" component={PisaSheet} width={1080} height={1920} />
  </>
);
