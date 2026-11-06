import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {DUR, FPS60, T} from './core';
import {PaintingShot} from './painting';
import {LabShot} from './lab';

export const eg03Duration = Math.round(DUR * FPS60);

export const EG03: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS60;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {t < T.cutLab ? <PaintingShot t={t} shot="A" /> : t < T.cutBack ? <LabShot t={t} /> : <PaintingShot t={t} shot="C" />}
      {withAudio && <Html5Audio src={staticFile('gen/eg03/mix.wav')} />}
    </AbsoluteFill>
  );
};
