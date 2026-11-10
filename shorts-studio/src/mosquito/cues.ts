import {SPLASH_T, T} from './timing';

export const VO_FILE = 'mosquito/vo/take1.mp3';
export type Cue = {f: string; at: number; db: number; keys?: [number, number][]; offset?: number};

const E = T.END;
/** Every SFX file comes from ElevenLabs Sound Effects v2 (sliced + peak-normalised in images/mosquito/sfx_prep.py). */
const ALL: Cue[] = [
  // beds
  {
    f: 'rain_loop',
    at: 0,
    db: -29,
    keys: [
      [0, -29],
      [T.hits, -29],
      [T.hits + 0.25, -37],
      [T.sideways, -37],
      [T.sideways + 0.3, -29],
      [E - 0.2, -29],
      [E, -40],
    ],
  },
  {
    f: 'buzz_loop',
    at: 0,
    db: -30,
    keys: [
      [0, -29],
      [T.cutScale - 0.06, -29],
      [T.cutScale - 0.01, -80],
      [T.cutRide - 0.01, -80],
      [T.cutRide + 0.05, -31],
      [T.hits, -30],
      [T.hits + 0.25, -42],
      [T.sideways, -42],
      [T.sideways + 0.3, -27],
      [E - 0.2, -29],
      [E, -40],
    ],
  },
  // the scale
  {f: 'plop', at: T.dropLand - 0.01, db: -13},
  {f: 'thud', at: T.dropLand, db: -14},
  {f: 'pop', at: T.fifty, db: -16},
  {f: 'swarm', at: T.fifty, db: -21},
  // the bus (engine builds, honks peak just after "bus")
  {f: 'bus', at: T.bus + 0.12 - 0.95, db: -14},
  // the ride
  {f: 'whoosh', at: T.drop + 0.05, db: -21},
  {f: 'slowmo', at: T.hits - 0.04, db: -11},
  {f: 'pop', at: T.doesnt, db: -16},
  {f: 'deflate', at: T.almost, db: -19},
  {f: 'slide', at: T.slides, db: -21},
  {f: 'splash', at: SPLASH_T - 0.04, db: -11},
  {f: 'whoosh', at: T.keeps, db: -27},
];

/** SFX files that exist in public/mosquito/sfx (kept in sync by images/mosquito/sfx_prep.py). */
import AVAILABLE from './sfx_available.json';
export const CUES: Cue[] = ALL.filter((c) => (AVAILABLE as string[]).includes(c.f));
