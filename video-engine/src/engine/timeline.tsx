// Generic timeline player: each shot is a Sequence; quest boundaries fade through black.
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {ShotClock, FadeBlack} from './core';
import {useFontsReady} from './text';

export type TL = {id: string; from: number; dur: number; fadeIn?: number; fadeOut?: number}[];
export type ShotFn = React.FC;

export const Timeline: React.FC<{tl: TL; shots: Record<string, ShotFn>}> = ({tl, shots}) => {
  useFontsReady();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {tl.map((s) => {
        const C = shots[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            <ShotClock id={s.id}>{C ? <C /> : <Missing id={s.id} />}</ShotClock>
            <FadeBlack inF={s.fadeIn} outF={s.fadeOut} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const Missing: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: '#300', color: '#fff', fontSize: 60, alignItems: 'center', justifyContent: 'center'}}>MISSING {id}</AbsoluteFill>
);

/** render a single shot by id (for stills / previews) */
export const OneShot: React.FC<{id: string; shots: Record<string, ShotFn>}> = ({id, shots}) => {
  useFontsReady();
  const C = shots[id];
  return <ShotClock id={id}>{C ? <C /> : <Missing id={id} />}</ShotClock>;
};
