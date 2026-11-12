import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

// One cue list for every sound effect: file, start (s), level (dB) and optional dB keys over time.
export type Cue = {f: string; at: number; db: number; keys?: [number, number][]; dur?: number; rate?: number};

const dbAt = (c: Cue, t: number) => {
  if (!c.keys || c.keys.length === 0) return c.db;
  const k = c.keys;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t < k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u;
    }
  }
  return k[k.length - 1][1];
};

export const SoundCues: React.FC<{cues: Cue[]; dir: string; fps: number}> = ({cues, dir, fps}) => (
  <>
    {cues.map((c) => {
      const from = Math.round(c.at * fps);
      return (
        <Sequence key={c.f + c.at + (c.rate ?? 1)} from={from} durationInFrames={c.dur ? Math.round(c.dur * fps) : undefined} layout="none">
          <Audio src={staticFile(`${dir}/${c.f}.wav`)} playbackRate={c.rate ?? 1} volume={(f) => Math.pow(10, dbAt(c, (from + f) / fps) / 20)} />
        </Sequence>
      );
    })}
  </>
);
