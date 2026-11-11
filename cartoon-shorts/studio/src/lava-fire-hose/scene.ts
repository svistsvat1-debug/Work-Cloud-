// Beat times, world layout and cameras for "Why don't we just stop lava with a fire hose?"
// World units = background pixels x 1.5 (bg plates 1024 x 1536 -> 1536 x 2304).
import {SPR} from './sprites';
import type {CamKey} from '../shared/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.9;
export const BG_S = 1.5;
export const WW = 1024 * BG_S;
export const WH = 1536 * BG_S;

// beat times (video s) = Scribe word start + 0.1 s voice offset, checked against the pauses found by loudness
export const T = {
  hose: 2.26,
  sprayOn: 2.74, // in the pause after "hose?"
  hit: 2.92,
  rock: 4.18,
  right: 4.58,
  but: 5.38,
  hawaii: 6.26,
  cuIn: 7.62, // "the lava" -> shocked close-up
  cuOut: 8.46, // "kept coming" -> back to the wide shot
  there: 9.38,
  much: 10.02,
  deadpan: 10.1,
  sputter: 10.62,
  cutB: 11.3, // "So" -> Iceland
  crept: 12.14,
  iceland: 12.66,
  port: 13.86,
  shipIn: 14.42,
  pumped: 14.7,
  ocean: 15.26,
  five: 16.9,
  months: 17.38,
  sprayOff: 18.55,
  froze: 18.82,
  wall: 19.54,
  stopped: 20.94,
  that: 21.78,
  protects: 22.66, // wave hits the wall
  storms: 23.62,
  end: DURATION,
};

// ---------- scene A: the volcanic field (Hawaii) ----------
export const A = {
  feet: [560, 2000] as [number, number],
  hr: 104, // head radius in world units (all poses scaled to it)
  house: {x: 205, base: 1850, w: 360},
  sign: {x: 790, base: 2175},
  lavaTop: 1705,
  crater: [1275, 742] as [number, number],
  horizon: 1040,
};
export const CAM_A: CamKey[] = [
  {t: 0, x: 832, y: 1565, k: 1.27},
  {t: 2.7, x: 830, y: 1490, k: 1.2},
  {t: 5.3, x: 820, y: 1452, k: 1.24},
  {t: 7.55, x: 800, y: 1445, k: 1.16},
  // after the close-up (hard cut back)
  {t: 8.46, x: 700, y: 1455, k: 1.22, ease: 'cut'},
  {t: 9.38, x: 690, y: 1455, k: 1.2},
  {t: 10.5, x: 760, y: 1176, k: 0.86}, // "too much lava" reveal
  {t: 10.66, x: 760, y: 1176, k: 0.86},
  {t: 11.3, x: 620, y: 1290, k: 1.0}, // push in on the deadpan drip
];

// ---------- scene B: the harbour (Heimaey, Iceland) ----------
export const B = {
  wl: 1302, // waterline
  pierTop: 1262,
  feet: [300, 1262] as [number, number],
  hr: 80,
  sign: {x: 478, base: 1262},
  boatBlue: {x: 330, wl: 1530, w: 340},
  boatOrange: {x: 640, wl: 1400, w: 230},
  ship: {x: 420, wl: 1770, w: 640},
  tongueTop: 1215,
  tongueBottom: 1440,
  tongueRight: 1300,
  crater: [1275, 870] as [number, number],
};
export const CAM_B: CamKey[] = [
  {t: T.cutB, x: 745, y: 1200, k: 0.93},
  {t: 14.3, x: 760, y: 1235, k: 0.96},
  {t: 15.4, x: 765, y: 1250, k: 0.98},
  {t: 18.3, x: 770, y: 1250, k: 0.98},
  {t: 19.3, x: 990, y: 1290, k: 1.3},
  {t: 21.5, x: 1000, y: 1290, k: 1.3},
  {t: 22.3, x: 1080, y: 1320, k: 1.25},
  {t: 23.45, x: 1085, y: 1320, k: 1.25},
  {t: 24.45, x: 750, y: 1205, k: 0.93},
  {t: DURATION, x: 748, y: 1205, k: 0.935},
];

type PoseName = 'hero_aim' | 'worried_aim' | 'deadpan_nozzle' | 'cheer' | 'yawn' | 'proud' | 'shock_cu';
export const poseBox = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as {w: number; h: number; head: readonly number[]; feet: readonly number[]};
  const k = hr / s.head[2];
  return {left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k};
};
