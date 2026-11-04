import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {A, DURATION, T} from './timing';
import {FPS} from './util';

type Cue = {f: string; at: number; db: number};

// one cue list: file, start time (s), level (dB) — quiet under the voice, the zap goes into the pause
export const CUES: Cue[] = [
  {f: 'chirp', at: T.bird, db: -26},
  {f: 'zip', at: A.zipPass - 0.22, db: -24},
  {f: 'pop', at: A.bootsOn, db: -18},
  {f: 'poof', at: A.bootsOff, db: -19},
  {f: 'squeak', at: T.feet, db: -24},
  {f: 'whoosh', at: T.l2end + 0.12, db: -31},
  {f: 'ding', at: T.current, db: -25},
  {f: 'ding', at: T.two, db: -22},
  {f: 'ding', at: T.spots, db: -22},
  {f: 'zip', at: T.voltages - 0.05, db: -24},
  {f: 'whoosh', at: T.l3end - 0.25, db: -31},
  {f: 'ding', at: T.both + 0.03, db: -25},
  {f: 'ding', at: T.feet2 + 0.03, db: -25},
  {f: 'pop', at: T.same + 0.05, db: -22},
  {f: 'zip', at: T.so - 0.4, db: -27},
  {f: 'squeak', at: T.nothing + 0.05, db: -26},
  {f: 'zip', at: T.really + 0.05, db: -27},
  {f: 'whistle', at: T.flows - 0.15, db: -24},
  {f: 'whoosh', at: A.eagleIn - 0.08, db: -21},
  {f: 'flaps', at: A.eagleIn, db: -24},
  {f: 'twang', at: A.eagleLand, db: -17},
  {f: 'tick', at: A.touch, db: -16},
  {f: 'zip', at: A.zipDive - 0.12, db: -22},
  {f: 'zap', at: A.zap, db: -9},
  {f: 'poof', at: A.poof, db: -15},
  {f: 'sizzle', at: A.poof + 0.1, db: -27},
  {f: 'cough', at: A.cough, db: -20},
  {f: 'flaps6', at: A.takeoff, db: -23},
  {f: 'whoosh', at: A.loopBack, db: -31},
];

const vol = (db: number) => Math.pow(10, db / 20);

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile('birdwire/vo/take1.wav')} volume={1} />
    <Audio
      src={staticFile('birdwire/sfx/hum.wav')}
      volume={(f) => {
        const t = f / FPS;
        const fade = Math.min(1, t / 0.15, (DURATION - t) / 0.15);
        return vol(-35) * Math.max(0, fade);
      }}
    />
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(c.at * FPS))} layout="none">
        <Audio src={staticFile(`birdwire/sfx/${c.f}.wav`)} volume={vol(c.db)} />
      </Sequence>
    ))}
  </>
);
