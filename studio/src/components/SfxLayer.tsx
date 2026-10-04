import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';

export type SfxName =
  | 'whoosh'
  | 'whoosh-short'
  | 'whip'
  | 'pop'
  | 'click'
  | 'tick'
  | 'riser'
  | 'impact'
  | 'glitch'
  | 'check'
  | 'error'
  | 'buzz'
  | 'notify'
  | 'beep';

/** Default levels keep every effect clearly under the voice (voice = 1.0). */
const LEVEL: Record<SfxName, number> = {
  whoosh: 0.32,
  'whoosh-short': 0.28,
  whip: 0.3,
  pop: 0.3,
  click: 0.22,
  tick: 0.14,
  riser: 0.26,
  impact: 0.42,
  glitch: 0.24,
  check: 0.26,
  error: 0.18,
  buzz: 0.3,
  notify: 0.24,
  beep: 0.16,
};

export type SfxCue = {at: number; sfx: SfxName; gain?: number};

/** Places SFX one-shots at absolute frames. */
export const SfxLayer: React.FC<{cues: SfxCue[]}> = ({cues}) => (
  <>
    {cues.map((c, i) => (
      <Sequence key={i} from={Math.max(0, c.at)} durationInFrames={60} layout="none">
        <Html5Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={LEVEL[c.sfx] * (c.gain ?? 1)} />
      </Sequence>
    ))}
  </>
);
