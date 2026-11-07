import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {BONK, CLICKS, FPS, SNIPS, T, VO_AT, XR_IN, XR_OUT} from './timing';

// one cue list: file, start (s), level (dB). Impacts start on their onset; whooshes are placed so their peak hits the beat.
type Cue = {f: string; at: number; db: number};
const W_PEAK = 0.42; // whoosh.wav peak
const WS_PEAK = 0.66; // whoosh_soft.wav peak
export const CUES: Cue[] = [
  {f: 'wind', at: 1.45, db: -21},
  {f: 'rustle', at: 1.95, db: -25},
  {f: 'rustle', at: 2.3, db: -26},
  {f: 'rustle', at: 2.6, db: -27},
  {f: 'bonk', at: BONK, db: -15},
  {f: 'scan_down', at: XR_IN[0], db: -21},
  {f: 'hum', at: 4.3, db: -37},
  {f: 'fwip', at: T.tendons, db: -23},
  {f: 'ping', at: T.joint, db: -22},
  {f: 'fwip', at: T.into + 0.05, db: -27},
  {f: 'creak', at: T.crouching, db: -26},
  {f: 'click', at: T.shut + 0.06, db: -15},
  {f: 'pop', at: T.backward, db: -20},
  {f: 'flip', at: T.actually + 0.12, db: -23},
  {f: 'pop', at: T.ankleEnd - 0.24, db: -20},
  {f: 'pop_low', at: 13.36, db: -18},
  {f: 'shimmer', at: T.ridges, db: -26},
  ...CLICKS.slice(0, 3).map((c) => ({f: 'click', at: c, db: -17})),
  {f: 'ratchet', at: CLICKS[3] - 0.03, db: -19},
  {f: 'click', at: CLICKS[4], db: -19},
  {f: 'boing', at: 16.97, db: -19},
  {f: 'whoosh', at: 17.55 - W_PEAK, db: -27},
  {f: 'pop', at: 17.92, db: -21},
  {f: 'whoosh', at: 18.4 - W_PEAK, db: -29},
  {f: 'whoosh_soft', at: 19.3 - WS_PEAK, db: -26},
  {f: 'whoosh', at: 20.36 - W_PEAK, db: -26},
  ...SNIPS.map((s) => ({f: 'snip', at: s, db: -15})),
  ...SNIPS.map((s) => ({f: 'slack', at: s + 0.06, db: -23})),
  {f: 'scan_up', at: XR_OUT[0], db: -22},
  {f: 'creak_s', at: 22.86, db: -25},
  {f: 'creak_s', at: 23.16, db: -27},
  {f: 'creak_s', at: 23.44, db: -29},
  {f: 'whoosh_soft', at: 25.3 - WS_PEAK, db: -26},
  {f: 'chime', at: 24.85, db: -21},
];

export const Soundtrack: React.FC = () => (
  <>
    <Sequence from={Math.round(VO_AT * FPS)} layout="none">
      <Audio src={staticFile('sleeping-birds/vo/take1.mp3')} />
    </Sequence>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
        <Audio src={staticFile(`sleeping-birds/sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} />
      </Sequence>
    ))}
  </>
);
