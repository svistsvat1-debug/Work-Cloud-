// Beat table for the phages Short. All times = composition seconds (voice placed at VO_AT).
// Word times: images/phages/words.json (faster-whisper) checked against loudness pauses.
import {Cam, Shot} from '../lib/World';
import {easeInOutSine} from '../lib/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 28.7; // voice ends 28.03 (file 28.2) + tail
export const FRAMES = Math.round(DURATION * FPS);

// world (Z 1000 plane)
export const FLOOR = 1560;
export const GUY_X = 740;
export const HEAD_R = 115; // every guy pose is scaled so its head has this radius
export const PHAGE_H = 150;
export const BW: Record<string, number> = {bact_rod: 360, bact_round: 240, bact_comma: 300};
export const PILL_W = 230;
export const HORIZON_Y = 1510; // at Z 3000
export const LAB_W = 2500;
export const RODA_X = 320; // frame-0 bacterium
export const TOUGH_X = 305; // the tough one at the end (same spot -> loop)
export const TOUGH_K = 1.05;

export const T = {
  eyesOpen: 1.85, // "phages"
  hop1: 2.36,
  land1: 2.78, // "bacteria"
  pump1: 2.92,
  pump2: 3.12,
  swell0: 2.98,
  pop1: 3.45,
  hop2: 3.5,
  landHead: 4.2, // "infect"
  jab: 4.36,
  boing: 4.52, // "people"
  palm1: 4.98,
  shrug: 5.5, // "So"
  hopShrug1: 5.82,
  pillIn: 7.86, // "antibiotics?"
  flash1: 9.08, // "They did"
  poof: 11.5, // "existed"
  flash2: 12.22,
  hopA: 12.62,
  landA: 13.25, // "phage"
  jabA: 13.33,
  boingA: 13.43,
  landB: 14.08, // "certain"
  jabB: 14.18,
  boingB: 14.32,
  hover: 14.95,
  dive: 17.05,
  match: 17.72, // "match"
  popL: 18.25,
  extras: 18.22,
  hopBack0: 18.32,
  palmBack: 18.95,
  pillThrow: 18.68, // "Antibiotics"
  pillLand: 19.12,
  drop: 22.52, // "dropped"
  toughIn0: 23.85,
  toughIn1: 24.45, // "bacteria"
  pillThrow2: 24.6,
  pillHit: 24.98, // "resist"
  pillGone: 25.85,
  scared: 25.38, // "antibiotics"
  present: 26.58, // "doctors"
  hopUp0: 26.74,
  palmEnd: 27.12, // "testing"
  worried: 27.62, // "again"
};

export const PILL_LAND_X = -1100;
export const PILL_V = 1500;

// camera
export const C0: Cam = {x: 490, y: 1240, z: 300};
export const SHOTS: Shot[] = [
  {t0: 0.0, t1: 2.3, to: {x: 520, y: 1230, z: 420}}, // slow push in on the phage in the hand
  {t0: 2.3, t1: 3.35, to: {x: 420, y: 1250, z: 380}}, // follow the hop to the bacterium
  {t0: 3.55, t1: 4.75, to: {x: 590, y: 1200, z: 340}}, // up to the head
  {t0: 5.3, t1: 6.5, to: {x: 775, y: 1230, z: 350}}, // shrug framing (room for the pill on the right)
  {t0: 8.9, t1: 12.1, to: {x: 760, y: 1215, z: 420}, ease: easeInOutSine}, // creeping push in the flashback
  {t0: 12.25, t1: 13.5, to: {x: -290, y: 1160, z: -30}}, // glide left: the line-up
  {t0: 15.0, t1: 17.0, to: {x: -400, y: 1170, z: 40}}, // drift toward the rod
  {t0: 18.15, t1: 19.15, to: {x: -130, y: 1080, z: -900}}, // wide for the bowling strike
  {t0: 20.7, t1: 22.15, to: {x: 630, y: 1230, z: 360}}, // back to the guy
  {t0: 23.25, t1: 24.4, to: {x: 480, y: 1240, z: 270}}, // room for the tough bacterium
  {t0: 26.4, t1: 27.6, to: C0}, // ends on the frame-0 framing -> loops
];

// screen shake impulses [time, px]
export const SHAKES: Array<[number, number]> = [
  [3.45, 14],
  [4.52, 4],
  [13.43, 3],
  [14.32, 3],
  [17.72, 7],
  [18.25, 9],
  [19.12, 6],
  [19.34, 5],
  [19.49, 5],
  [19.68, 6],
  [19.87, 5],
  [22.52 + 0.41, 5],
  [24.98, 11],
];
