import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {PAL} from './paint/wobble';
import {FontGate} from './paint/Fonts';
import {T, fr, makeSP, SP} from './sailors/core';
import * as A from './sailors/scenesA';
import * as B from './sailors/scenesB';
import * as C from './sailors/scenesC';

const ALL = {...A, ...B, ...C} as Record<string, React.FC<SP>>;

// "What Did WW2 Sailors Actually Do All Day?" — silent picture track; audio is mixed separately (tools/mix_sailors.py)
export const SailorsVideo: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: PAL.white}}>
      {T.scenes.map((sc, i) => {
        const Comp = ALL[`S${i + 1}`];
        const from = fr(sc.start);
        const dur = fr(sc.end) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {Comp ? <Comp {...makeSP(i)} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  </FontGate>
);
export const SAILORS_FRAMES = T.endFrame;
