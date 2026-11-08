import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T, VO_AT} from './T';

// Effects are synthesised (images/bees/sfx.py). `at` = when the sound should HIT: for whooshes that is the peak,
// so the file starts `peak` seconds earlier. db = level under the voice (voice = 0 dB).
const PEAK: Record<string, number> = {whoosh: 0.24, whoosh_short: 0.14, whoosh_big: 0.42, swish: 0.093, whiff: 0.306};
type Cue = {f: string; at: number; db: number; keys?: [number, number][]};

const cues: Cue[] = [
  // shot A
  {f: 'whoosh_short', at: 1.95, db: -31},
  {f: 'swish', at: 2.14, db: -25},
  {f: 'pok', at: 2.18, db: -15},
  {f: 'bonk', at: 2.22, db: -20},
  {f: 'whoosh', at: 2.42, db: -29},
  {f: 'sparkle', at: T.survive, db: -21},
  {f: 'whoosh', at: 4.05, db: -29},
  {f: 'swish', at: 4.66, db: -25},
  {f: 'thud', at: 4.7, db: -16},
  {f: 'pok', at: 4.7, db: -19},
  {f: 'pop', at: T.dies, db: -22},
  {f: 'dundun', at: 6.44, db: -16},
  // shot B
  {f: 'whoosh_short', at: T.cutB, db: -29},
  {f: 'pop', at: T.skin, db: -27},
  ...[0, 1, 2, 3, 4, 5].map((i) => ({f: 'ting', at: T.barbed + i * 0.07, db: -25 - i})),
  {f: 'squeak', at: T.pulling, db: -27},
  {f: 'squeak', at: 9.45, db: -25},
  {f: 'rip', at: T.rips, db: -14},
  {f: 'boing', at: T.rips + 0.06, db: -22},
  {f: 'pop', at: T.stinger, db: -25},
  {f: 'pop', at: T.venomSac, db: -25},
  {f: 'pop', at: T.belly, db: -25},
  ...Array.from({length: 8}, (_, i) => ({f: 'blup', at: 13.5 + i * 0.42, db: -22})),
  {f: 'pop', at: T.minute, db: -22},
  ...Array.from({length: 12}, (_, i) => ({f: 'tick', at: 15.55 + (i * 1.07) / 12, db: -27})),
  {f: 'whoosh_short', at: 16.72, db: -22},
  {f: 'pop', at: 16.8, db: -16},
  {f: 'whoosh', at: 16.95, db: -29},
  {f: 'whoosh_short', at: 17.08, db: -31},
  // shot C
  {f: 'whoosh_short', at: T.cutC, db: -31},
  {f: 'whiff', at: 18.0, db: -24},
  {f: 'pop', at: T.banana, db: -22},
  {f: 'whoosh_big', at: 19.05, db: -28},
  {f: 'eyes', at: T.alarm, db: -20},
  {f: 'alarm', at: T.alarm + 0.1, db: -25},
  {
    f: 'swarm',
    at: T.calls,
    db: 0,
    keys: [
      [T.calls, -36],
      [21.0, -27],
      [21.7, -21],
      [22.2, -15],
      [22.9, -18],
      [23.12, -40],
      [23.18, -80],
    ],
  },
  {f: 'pop', at: T.you2, db: -22},
  {f: 'plip', at: T.you2 + 0.1, db: -24},
  {f: 'whoosh', at: 21.95, db: -24},
  {f: 'steps', at: 21.92, db: -23},
  // shot D
  {f: 'whoosh_short', at: T.cutD + 0.14, db: -20},
  {f: 'whoosh_short', at: T.wasp + 0.14, db: -20},
  {f: 'hit', at: 24.18, db: -15},
  {f: 'pop', at: T.worse, db: -25},
  {f: 'whoosh', at: T.subscribe + 0.1, db: -26},
  {f: 'click', at: 26.0, db: -15},
  {f: 'click', at: 26.22, db: -15},
  {f: 'click', at: 26.44, db: -15},
  {f: 'ding', at: 26.47, db: -21},
  {f: 'whoosh_short', at: 26.88, db: -24},
];

const dbAt = (c: Cue, t: number) => {
  if (!c.keys) return c.db;
  const k = c.keys;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u;
    }
  }
  return k[k.length - 1][1];
};

export const SoundTrack: React.FC = () => (
  <>
    <Sequence from={Math.round(VO_AT * FPS)} layout="none">
      <Audio src={staticFile('bees/vo/take1.mp3')} />
    </Sequence>
    {cues.map((c, i) => {
      const start = Math.max(0, c.at - (PEAK[c.f] ?? 0));
      const from = Math.round(start * FPS);
      return (
        <Sequence key={i} from={from} layout="none">
          <Audio src={staticFile(`bees/sfx/${c.f}.wav`)} volume={(f) => Math.pow(10, dbAt(c, (from + f) / FPS) / 20)} />
        </Sequence>
      );
    })}
  </>
);
