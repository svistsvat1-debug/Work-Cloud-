// Sound layer: voice (0 dB) + one cue list of effects. Levels follow the cut-out recipe:
// whooshes -25..-31 dB, impacts -14..-19 dB, beds -26..-33 dB. SFX files: public/phages/sfx (sfx.py).
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, T, VO_AT} from './timing';

type Cue = {f: string; at: number; db: number; dur?: number};
const VOICE_DB = -0.5;

export function cues(hits: number[], popAfterHit: number, dropLand: number): Cue[] {
  return [
    {f: 'sparkle', at: T.eyesOpen, db: -20},
    {f: 'hop', at: T.hop1, db: -24},
    {f: 'plop', at: T.land1, db: -20},
    {f: 'squish', at: T.pump1, db: -21},
    {f: 'squish', at: T.pump2, db: -21},
    {f: 'swell', at: T.swell0, db: -24},
    {f: 'pop', at: T.pop1, db: -15},
    {f: 'whoosh_s', at: T.pop1 + 0.05, db: -28},
    {f: 'plop', at: T.landHead, db: -22},
    {f: 'boing', at: T.boing, db: -17},
    {f: 'plop', at: T.palm1, db: -24},
    {f: 'swish', at: T.shrug - 0.06, db: -28},
    {f: 'hop', at: T.shrug, db: -27},
    {f: 'popin', at: T.pillIn, db: -20},
    {f: 'flash', at: T.flash1, db: -17},
    {f: 'projector', at: T.flash1 + 0.05, db: -30, dur: T.flash2 - T.flash1},
    {f: 'poof', at: T.poof, db: -18},
    {f: 'flash', at: T.flash2, db: -19},
    {f: 'whoosh_l', at: 12.3, db: -30},
    {f: 'hop', at: T.hopA, db: -24},
    {f: 'plop', at: T.landA, db: -22},
    {f: 'boing', at: T.boingA, db: -18},
    {f: 'plop', at: T.landB, db: -22},
    {f: 'boing', at: T.boingB, db: -18},
    {f: 'whoosh_s', at: T.dive + 0.2, db: -26},
    {f: 'click', at: T.match, db: -15},
    {f: 'ding', at: T.match + 0.02, db: -19},
    {f: 'swell', at: T.match + 0.1, db: -26},
    {f: 'pop', at: T.popL, db: -14},
    {f: 'popin', at: T.extras, db: -24},
    {f: 'popin', at: T.extras + 0.07, db: -24},
    {f: 'popin', at: T.extras + 0.14, db: -24},
    {f: 'whoosh_l', at: T.hopBack0, db: -29},
    {f: 'whoosh_s', at: T.pillThrow, db: -26},
    {f: 'thud', at: T.pillLand, db: -18},
    {f: 'roll', at: T.pillLand, db: -28},
    ...hits.map((h, i) => ({f: 'strike', at: h, db: i === 0 ? -16 : -19})),
    ...hits.map((h) => ({f: 'pop', at: h + popAfterHit, db: -21})),
    {f: 'plop', at: T.palmBack, db: -24},
    {f: 'whoosh_l', at: 20.9, db: -31},
    {f: 'swish', at: T.drop - 0.05, db: -27},
    {f: 'whistle', at: T.drop + 0.12, db: -22},
    {f: 'thud', at: dropLand, db: -17},
    {f: 'slide', at: T.toughIn0, db: -23},
    {f: 'whoosh_s', at: T.pillThrow2, db: -26},
    {f: 'boing', at: T.pillHit, db: -16},
    {f: 'whoosh_l', at: 25.15, db: -24},
    {f: 'swish', at: T.scared - 0.06, db: -27},
    {f: 'plink', at: T.scared + 0.1, db: -22},
    {f: 'swish', at: T.present - 0.06, db: -28},
    {f: 'hop', at: T.hopUp0, db: -24},
    {f: 'plop', at: T.palmEnd, db: -22},
    {f: 'plink', at: T.worried + 0.05, db: -23},
  ];
}

export const Sound: React.FC<{list: Cue[]}> = ({list}) => (
  <>
    <Sequence from={Math.round(VO_AT * FPS)} layout="none">
      <Audio src={staticFile('phages/vo/take1.mp3')} volume={10 ** (VOICE_DB / 20)} />
    </Sequence>
    {list.map((c, i) => (
      <Sequence key={i} from={Math.round(c.at * FPS)} durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined} layout="none">
        <Audio src={staticFile(`phages/sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} />
      </Sequence>
    ))}
  </>
);
