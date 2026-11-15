import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {PAL} from './paint/wobble';
import {FontGate} from './paint/Fonts';
import {T, fr, makeSP, SP} from './food/core';
import * as A from './food/scenesA';
import * as B from './food/scenesB';
import * as C from './food/scenesC';

const ALL = {...A, ...B, ...C} as Record<string, React.FC<SP>>;

// "Every WW2 Army's Food Ranked" — silent picture track; audio is mixed separately (tools/mix_food.py)
export const FoodVideo: React.FC = () => (
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
export const FOOD_FRAMES = T.endFrame;
