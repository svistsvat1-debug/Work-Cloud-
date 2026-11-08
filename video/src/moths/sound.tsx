import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS} from './timing';
import cues from './sfx-cues.json';

// one cue list: file, start (s), level (dB). Files: public/moths/sfx/*.wav (made by images/moths/scripts/sfx.py)
type Cue = {f: string; at: number; db: number; fadeOut?: number; dur?: number};
export const SFX: React.FC = () => (
  <>
    {(cues as Cue[]).map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(`moths/sfx/${c.f}.wav`)} volume={(f) => {
          const g = 10 ** (c.db / 20);
          if (!c.fadeOut || !c.dur) return g;
          const left = c.dur - f / FPS;
          return g * Math.min(1, Math.max(0, left / c.fadeOut));
        }} />
      </Sequence>
    ))}
  </>
);
