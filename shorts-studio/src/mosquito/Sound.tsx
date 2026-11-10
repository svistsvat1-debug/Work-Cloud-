import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS} from './util';
import {CUES, VO_FILE} from './cues';
import {VO} from './timing';

/** dB keys over time -> linear gain (keys: [time, dB]). */
const dbAt = (keys: [number, number][], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, d0] = keys[i];
    const [t1, d1] = keys[i + 1];
    if (t <= t1) return d0 + (d1 - d0) * ((t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
};

export const Sound: React.FC = () => (
  <>
    <Sequence from={Math.round(VO * FPS)} layout="none">
      <Audio src={staticFile(VO_FILE)} />
    </Sequence>
    {CUES.map((c, i) => {
      const from = Math.round(c.at * FPS);
      const keys: [number, number][] = c.keys ?? [[0, c.db]];
      return (
        <Sequence key={i} from={from} layout="none">
          <Audio
            src={staticFile(`mosquito/sfx/${c.f}.wav`)}
            startFrom={c.offset ? Math.round(c.offset * FPS) : undefined}
            volume={(f) => 10 ** (dbAt(keys, (from + f) / FPS) / 20)}
          />
        </Sequence>
      );
    })}
  </>
);
