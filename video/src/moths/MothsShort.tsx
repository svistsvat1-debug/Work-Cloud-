import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, T, VO_AT} from './timing';
import {SceneA, SceneB, SceneC} from './scenes';
import {SFX} from './sound';

export const MothsShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#060C22'}}>
      {t < T.cutB ? <SceneA t={t} /> : t < T.cutC ? <SceneB t={t} /> : <SceneC t={t} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('moths/vo/take1.mp3')} />
      </Sequence>
      <SFX />
    </AbsoluteFill>
  );
};
