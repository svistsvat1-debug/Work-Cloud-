import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Word} from '../lib/timeline';
import type {Phone} from '../lib/visemes';

/** Soft brand-yellow glow behind the avatar so it reads on dark backgrounds. */
const Halo: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '42%',
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      borderRadius: 999,
      background: 'radial-gradient(circle, rgba(255,230,0,0.32) 0%, rgba(255,230,0,0.08) 45%, rgba(255,230,0,0) 70%)',
    }}
  />
);
import {RobotAvatar} from './Robot';
import {useAvatar} from './useAvatar';

type Voice = {phones: Phone[]; words: Word[]};

/**
 * Presenter close-up: the avatar fills the upper frame, captions sit below.
 * `from` is the shot's start frame so lip-sync uses absolute voice time.
 */
export const AvatarCloseup: React.FC<Voice & {from: number; zoom?: number; halo?: boolean; children?: React.ReactNode}> = ({
  phones,
  words,
  from,
  zoom = 1,
  halo,
  children,
}) => {
  const s = useAvatar(phones, words, from);
  const w = 700 * zoom;
  return (
    <div style={{position: 'absolute', left: 540 - w / 2 - 10, top: 1040 - w * 1.2 + (zoom - 1) * 260, width: w}}>
      {halo ? <Halo size={w * 1.25} /> : null}
      <RobotAvatar s={s} width={w} shadow={0.14} />
      {children}
    </div>
  );
};

/** Small presenter in the bottom-left corner during cut-aways. */
export const AvatarPip: React.FC<Voice & {from: number; enterAt?: number; halo?: boolean}> = ({phones, words, from, enterAt = 0, halo}) => {
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
      {halo ? <Halo size={420} /> : null}
      <RobotAvatar s={s} width={300} shadow={0} />
    </div>
  );
};

/**
 * Persistent corner presenter across several cut-away shots, so it does not
 * flicker with each shot's transition. Frames are absolute; ranges are [from, to).
 */
export const AvatarPipTrack: React.FC<Voice & {ranges: [number, number][]; halo?: boolean}> = ({phones, words, ranges, halo}) => {
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
      {halo ? <Halo size={420} /> : null}
      <RobotAvatar s={s} width={300} shadow={0} />
    </div>
  );
};
