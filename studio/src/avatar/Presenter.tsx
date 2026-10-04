import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from '../lib/timeline';
import type {Phone} from '../lib/visemes';
import {RobotAvatar} from './Robot';
import {useAvatar} from './useAvatar';

type Voice = {phones: Phone[]; words: Word[]};

/**
 * Presenter close-up: the avatar fills the upper frame, captions sit below.
 * `from` is the shot's start frame so lip-sync uses absolute voice time.
 */
export const AvatarCloseup: React.FC<Voice & {from: number; zoom?: number; children?: React.ReactNode}> = ({phones, words, from, zoom = 1, children}) => {
  const s = useAvatar(phones, words, from);
  const w = 700 * zoom;
  return (
    <div style={{position: 'absolute', left: 540 - w / 2 - 10, top: 1040 - w * 1.2 + (zoom - 1) * 260, width: w}}>
      <RobotAvatar s={s} width={w} shadow={0.14} />
      {children}
    </div>
  );
};

/** Small presenter in the bottom-left corner during cut-aways. */
export const AvatarPip: React.FC<Voice & {from: number; enterAt?: number}> = ({phones, words, from, enterAt = 0}) => {
  const s = useAvatar(phones, words, from);
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - enterAt, fps, config: {damping: 14, stiffness: 180, mass: 0.7}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        top: 900,
        width: 300,
        transform: `translateY(${(1 - p) * 200}px)`,
        filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.18))',
      }}
    >
      <RobotAvatar s={s} width={300} shadow={0} />
    </div>
  );
};

/**
 * Persistent corner presenter across several cut-away shots, so it does not
 * flicker with each shot's transition. Frames are absolute; ranges are [from, to).
 */
export const AvatarPipTrack: React.FC<Voice & {ranges: [number, number][]}> = ({phones, words, ranges}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const r = ranges.find(([a, b]) => f >= a && f < b);
  const s = useAvatar(phones, words, 0);
  if (!r) return null;
  const enterAt = r[0] === 0 ? 6 : r[0];
  const p = spring({frame: f - enterAt, fps, config: {damping: 14, stiffness: 180, mass: 0.7}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        top: 900,
        width: 300,
        transform: `translateY(${(1 - p) * 220}px)`,
        filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.18))',
      }}
    >
      <RobotAvatar s={s} width={300} shadow={0} />
    </div>
  );
};
