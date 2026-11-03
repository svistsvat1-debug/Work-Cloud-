import {T} from './timing';

/* One cue list for every effect. `at` = when the file starts. Impacts start on the hit (their onset is at
 * ~5 ms); whooshes start early so their measured PEAK lands on the motion. Levels are relative to the
 * voice; the voice itself plays at VO_DB. Big sounds sit in pauses (war clash after "wars"). */
export type Cue = {f: string; at: number; db: number};
export const VO_DB = 0;
export const SFX_OFFSET = 3; // effect levels below were set against a -3 dB voice
const PEAK = {whoosh_up: 0.169, whoosh_down: 0.457, swish: 0.133, whoosh_big: 0.478};
const w = (f: keyof typeof PEAK, motion: number, db: number): Cue => ({f, at: motion - PEAK[f], db});

const flyOff = (i: number) => 2.62 + (7 - i) * 0.16;
const land = (i: number) => 26.62 + (i - 3) * 0.18;
const dropLeave = (j: number) => T.squeezed + 0.02 + j * 0.12;

const RAW: Cue[] = [
  // L1 - "should have fallen ... before it was even finished"
  {f: 'creak', at: 2.08, db: -17},
  ...[7, 6, 5, 4, 3, 2].map((i) => w('whoosh_up', flyOff(i) + 0.12, -25 - (i % 2) * 2)),
  {f: 'plip1', at: 2.8, db: -31},
  {f: 'plip0', at: 3.12, db: -31},
  {f: 'plip2', at: 3.42, db: -31},
  w('swish', 3.7, -27),
  {f: 'tok', at: 3.86, db: -15},
  {f: 'pop', at: 4.15, db: -24},
  // L2 - "Only three floors up, the soft clay ... close to giving way"
  w('whoosh_down', 5.22, -25),
  {f: 'thud', at: 5.3, db: -12},
  {f: 'squish', at: 6.62, db: -17},
  {f: 'rumble', at: 6.9, db: -24},
  {f: 'plip2', at: 7.32, db: -29},
  {f: 'plip0', at: 8.2, db: -29},
  {f: 'crack', at: 8.42, db: -15},
  {f: 'creak', at: 8.44, db: -19},
  // L3 - "Then the work stopped for almost a hundred years, probably because of wars"
  w('swish', 10.08, -22),
  ...Array.from({length: 8}, (_, k) => ({f: 'step', at: 10.48 + k * 0.14, db: -29 - k * 0.6})),
  {f: 'timelapse', at: 10.9, db: -21},
  ...Array.from({length: 12}, (_, k) => ({f: 'tick', at: 11.0 + k * 0.155, db: -28})),
  {f: 'poof', at: T.probably + 0.25, db: -24},
  {f: 'rumble', at: 13.15, db: -27},
  {f: 'clash', at: 13.38, db: -24},
  {f: 'clash', at: 13.66, db: -25},
  {f: 'clash', at: T.wars + 0.02, db: -21},
  {f: 'clash', at: 14.4, db: -20},
  {f: 'clash', at: 14.62, db: -21},
  {f: 'clash', at: 14.86, db: -22},
  {f: 'poof', at: 15.3, db: -21},
  // L4 - "And that's basically what saved it"
  {f: 'sparkle', at: T.saved - 0.08, db: -21},
  // L5 - weight squeezes the water out, the clay gets stronger
  w('whoosh_big', 17.55, -27),
  {f: 'pop', at: T.weight - 0.06, db: -24},
  {f: 'thud_heavy', at: T.weight, db: -13},
  {f: 'thud_heavy', at: 18.8, db: -15},
  ...Array.from({length: 11}, (_, j) => ({f: `plip${j % 3}`, at: dropLeave(j) + 0.03, db: -22 - (j % 2) * 2})),
  {f: 'pop', at: T.so + 0.02, db: -21},
  {f: 'boing', at: T.stronger - 0.04, db: -18},
  {f: 'boing', at: T.stronger + 0.42, db: -23},
  {f: 'pop_small', at: 22.88, db: -26},
  // L6 - engineers / thought bubble / toppled
  w('whoosh_big', 23.0, -28),
  ...Array.from({length: 4}, (_, k) => ({f: 'step', at: 22.9 + k * 0.14, db: -29})),
  {f: 'pop_small', at: T.without - 0.15, db: -26},
  {f: 'pop_small', at: T.without - 0.09, db: -24},
  {f: 'pop', at: T.without - 0.03, db: -21},
  ...Array.from({length: 5}, (_, k) => ({f: 'pop_small', at: T.without + 0.08 + k * 0.17, db: -27 + k})),
  w('swish', 25.8, -24),
  {f: 'thud_small', at: 25.98, db: -17},
  {f: 'poof', at: 25.99, db: -22},
  {f: 'gulp', at: 26.06, db: -18},
  {f: 'pop_small', at: 26.3, db: -25},
  // coda - floors drop back on, back to frame 0
  w('swish', 26.6, -24),
  ...[3, 4, 5, 6, 7].map((i) => ({f: 'thud', at: land(i), db: -17 + (i - 3) * 0.6})),
];
export const CUES: Cue[] = RAW.map((c) => ({...c, at: Math.max(0, c.at)}));
