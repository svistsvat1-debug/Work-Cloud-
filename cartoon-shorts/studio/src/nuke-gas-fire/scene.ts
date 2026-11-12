// Beat times, world layout and cameras for "Why did the Soviets put out a fire with a nuke?"
// World units = plate pixels x 1.5 (plates 1024 x 1536 -> 1536 x 2304). The desert plate is the surface; the ground is
// cut open along the front edge G and the underground plate continues below it (a school-diagram cut-away).
import {SPR} from './sprites';
import type {CamKey} from '../shared/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.85;
export const BG_S = 1.5;
export const WW = 1024 * BG_S;

// beat times (video s) = Scribe word start + 0.1 s voice offset, checked against the pauses found by loudness
export const T = {
  fire: 0.42,
  almost: 1.22,
  three: 1.78,
  years: 2.1,
  until: 2.94,
  soviets: 3.22,
  nuked: 3.7,
  yank: 4.2, // pause after "nuked it."
  why: 4.74,
  plug: 5.3,
  well: 5.7,
  they: 6.5,
  tried: 6.74,
  but: 7.46,
  gas: 7.7,
  whole: 8.98,
  city: 9.3,
  every: 9.7,
  day: 10.1,
  escaped: 10.9,
  nearby: 11.7,
  wells: 12.02,
  pop: 12.62, // pause after "wells." - the cork pops off
  so: 13.18,
  nuke: 14.02,
  mile: 14.98,
  underground: 15.46,
  right: 16.26,
  beside: 16.54,
  well2: 16.98,
  blast: 17.25, // pause after "well." - the blast goes off here
  squeezed: 18.42,
  rock: 18.98,
  pinched: 19.54,
  shut: 20.22,
  like: 20.74, // cut to the hose
  stepping: 20.9,
  hose: 21.38,
  fire2: 22.26,
  out: 22.58,
  twentythree: 23.06,
  seconds: 23.62,
  dead: 23.78, // the flame is gone
  voiceEnd: 24.34,
  end: DURATION,
};

// ---------- the world ----------
const D = SPR.bg_desert;
export const W = {
  horizon: D.horizon * BG_S,
  G: 2290, // front edge of the ground slab: the cut-away starts here
  wellX: 960, // main well (pipe centre)
  wellBase: 1960,
  pipeW: 78, // pipe width in world units
  guy: {x: 520, y: 2010},
  hr: 118, // head radius of every pose (world units)
  derrick: {x: 880, base: 1925, s: 0.9}, // mirrored: legs right of the well, the bent top droops to the right
  beams: {x: 1035, base: 2060, s: 0.8},
  valves: [
    {x: 250, base: 1985, s: 0.5},
    {x: 1390, base: 1985, s: 0.5},
  ],
  leakY: 2990, // gas escapes sideways at this depth
  pipeBottom: 4240,
  slant: {x0: 1300, x1: 1052, y1: 3520}, // slant hole from the front edge down to the charge
  gauge: {x: 790},
  flameH: 1250,
};
const WS = SPR.well;
export const WELL_S = W.pipeW / WS.pipe[2];
export const PIPE_TOP = W.wellBase - (WS.base - WS.pipe[1]) * WELL_S; // world y of the torn pipe top
export const BLAST = {x: W.slant.x1, y: W.slant.y1};
export const SLANT_ANG = Math.atan2(W.slant.x0 - W.slant.x1, W.slant.y1 - W.G); // radians from vertical (nose turns left)

// ---------- cameras ----------
// every key keeps the view inside the plates (x within 0..1536) and above the front edge in the surface shots
export const CAM0 = {x: 800, y: 1440, k: 1.15};
export const CAM: CamKey[] = [
  {t: 0, ...CAM0},
  {t: 2.8, x: 800, y: 1440, k: 1.18},
  {t: 3.55, x: 830, y: 1375, k: 1.06}, // make room for the bomb
  {t: 4.6, x: 830, y: 1375, k: 1.06},
  {t: 5.25, x: 770, y: 1640, k: 1.5}, // close on the guy + the cork (improvement pass: was a wide, empty frame)
  {t: 7.46, x: 772, y: 1645, k: 1.52},
  {t: 9.3, x: 768, y: 2620, k: 0.745}, // pull back and tilt down: the cut-away
  {t: 13.25, x: 768, y: 2600, k: 0.75},
  {t: 14.35, x: 980, y: 2500, k: 0.98}, // follow the bomb in
  {t: 15.9, x: 1000, y: 3300, k: 1.28}, // down the slant hole
  {t: 16.7, x: 965, y: 3520, k: 1.5},
  {t: 17.7, x: 965, y: 3520, k: 1.5},
  {t: 20.6, x: 975, y: 3520, k: 1.7}, // slow push in through the squeeze
  {t: T.like, x: 660, y: 1775, k: 1.9, ease: 'cut'}, // the hose
  {t: 22.2, x: 664, y: 1777, k: 1.95},
  {t: 23.1, x: 800, y: 1560, k: 1.38}, // close on the dying flame for the payoff (improvement pass)
  {t: 24.05, x: 800, y: 1560, k: 1.38},
  {t: DURATION, ...CAM0}, // glide back to the frame-0 framing: the Short loops
];

export type PoseName = 'hero' | 'roast' | 'push' | 'shock' | 'step' | 'sad';
export const poseBox = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as {w: number; h: number; head: readonly number[]; feet: readonly number[]};
  const k = hr / s.head[2];
  return {left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k};
};
