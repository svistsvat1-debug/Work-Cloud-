import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS} from './util';
import {CUES, SFX_OFFSET, VO_DB} from './cues';

const dbToGain = (db: number) => 10 ** (db / 20);

/** voice (0 dB) + one cue list of synthesized effects, each placed by its measured onset */
export const PisaSound: React.FC = () => (
  <>
    <Audio src={staticFile('pisa/vo/take1.wav')} volume={dbToGain(VO_DB)} />
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
        <Audio src={staticFile(`pisa/sfx/${c.f}.wav`)} volume={dbToGain(c.db + SFX_OFFSET)} />
      </Sequence>
    ))}
  </>
);
