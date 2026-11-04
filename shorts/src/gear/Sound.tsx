import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T, TAG_T, VO_AT} from './timing';

// One cue list: file, start time (s), level (dB), optional dB keys over absolute time.
type Cue = {f: string; at: number; db: number; keys?: [number, number][]};

const dbAt = (c: Cue, tAbs: number) => {
  if (!c.keys) return c.db;
  const k = c.keys;
  if (tAbs <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    if (tAbs <= k[i + 1][0]) {
      const u = (tAbs - k[i][0]) / (k[i + 1][0] - k[i][0]);
      return k[i][1] + (k[i + 1][1] - k[i][1]) * u;
    }
  }
  return k[k.length - 1][1];
};

// whooshes are placed by their peak, impacts/pops by their onset
export const CUES: Cue[] = [
  {f: 'motor_hum', at: 0, db: -31, keys: [[0, -31], [5.5, -31], [6.3, -26], [7.2, -31], [26.8, -31], [27.0, -40]]},
  {f: 'pop_small', at: T.motor, db: -26},
  {f: 'pop', at: T.last, db: -23},
  {f: 'thud', at: T.concrete, db: -17},
  {f: 'pop', at: T.so, db: -21},
  {f: 'rev', at: 5.55, db: -21},
  {f: 'rumble', at: 5.6, db: -24},
  {f: 'whoosh_long', at: 7.8 - 0.66, db: -28},
  ...TAG_T.map((at, i) => ({f: `tick${String(i).padStart(2, '0')}`, at, db: -23})),
  {f: 'whoosh', at: 13.75 - 0.4, db: -28},
  {f: 'swish', at: 13.55, db: -31},
  {f: 'swish', at: 14.0, db: -32},
  {f: 'swish', at: 14.45, db: -32},
  {f: 'chime', at: 15.02, db: -15},
  {f: 'whoosh', at: 15.75 - 0.4, db: -29},
  {f: 'stopwatch', at: 15.7, db: -27},
  {f: 'twinkle', at: 19.6, db: -25},
  {f: 'shimmer', at: 21.9, db: -27},
  {f: 'whoosh', at: 23.2 - 0.4, db: -29},
  {f: 'poof', at: 22.95, db: -18},
  {f: 'pop', at: T.concrete7, db: -23},
  {f: 'whoosh_long', at: 25.2 - 0.66, db: -30},
  {f: 'pop_small', at: 26.12, db: -27},
];

export const SoundTrack: React.FC = () => (
  <>
    <Sequence from={Math.round(VO_AT * FPS)} layout="none">
      <Audio src={staticFile('gear/vo/take1.wav')} volume={1} />
    </Sequence>
    {CUES.map((c, i) => {
      const from = Math.round(c.at * FPS);
      return (
        <Sequence key={i} from={from} layout="none">
          <Audio src={staticFile(`gear/sfx/${c.f}.wav`)} volume={(f) => 10 ** (dbAt(c, (from + f) / FPS) / 20)} />
        </Sequence>
      );
    })}
  </>
);
