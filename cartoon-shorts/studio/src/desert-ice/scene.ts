// Beat times, world layout and cameras for "How did people get ice in the desert before fridges?"
// World units = plate pixels x 1.5 (plate 1024 x 1536 -> 1536 x 2304). Four sets share the plate and are swapped on hard
// cuts: A = the hot desert (frame 0), N = the night close-up, P = the ice pool (night -> dawn), D = the mud dome (day).
import { SPR } from "./sprites";
import type { CamKey } from "../shared/anim";

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 25.25;
export const BG_S = 1.5;
export const WW = 1024 * BG_S;
export const WH = 1536 * BG_S;

// beat times (video s) = Scribe word start + 0.1 s voice offset, checked against the pauses found by loudness
export const T = {
  guy: 0.38,
  ice: 0.9,
  summer: 1.94,
  centuries: 2.74,
  before: 3.42,
  fridges: 3.62,
  deserts: 4.66,
  worst: 5.38,
  place: 5.7,
  right: 6.42,
  but1: 7.18, // cut to the night close-up
  clear: 7.54,
  winter: 7.86,
  nights: 8.18,
  wide: 8.9, // cut to the pool at night
  sky: 9.22,
  sucks: 9.7,
  heat: 10.1,
  water: 10.66,
  so: 11.54,
  persians: 11.86,
  filled: 12.42,
  pools: 13.14,
  morning: 14.1,
  froze: 14.7,
  but2: 15.74, // cut to the dome set (day)
  ice2: 15.94,
  melts: 16.26,
  kept: 17.38,
  mud: 17.94,
  dome: 18.18,
  walls: 18.66,
  two: 19.06,
  thick: 19.7,
  thats: 20.54,
  lasted: 21.1,
  all: 21.58,
  summer2: 21.78,
  freezer: 22.82,
  powered: 23.54,
  sky2: 24.1,
  voiceEnd: 24.74,
  end: DURATION,
};

export const SET = (t: number) =>
  t < T.but1 ? "A" : t < T.wide ? "N" : t < T.but2 ? "P" : "D";

// ---------- the world ----------
export const HORIZON = SPR.bg.horizon * BG_S;
export const HR = 110; // head radius of every full-body pose (world units)
export const W = {
  guyA: { x: 760, y: 1900 },
  sunA: { x: 985, y: 990, r: 112 },
  fridge: { x: 455, y: 1900, w: 200, h: 330 },
  // the night close-up: the awe picture's head centre and scale
  awe: { x: 760, y: 1180, s: 0.66 },
  // the ice pool (wall + basin) and the poses around it
  pool: { x: 768, base: 1800, s: 1.3 },
  hrP: 80, // smaller guy in the pool shots so the wall still reads as a wall
  pourFeet: { x: 330, y: 1738 },
  slideY: 1702,
  skyEyes: { y: 640, xl: 650, xr: 970, r: 80 },
  skyMouth: { x: 810, y: 820 },
  // the dome set
  dome: { cx: 1100, base: 1880, s: 0.81 },
  groundD: 1880,
  guyE: { x: 600, y: 1880 },
  sunD: { x: 380, y: 800, r: 110 },
  skyEyesE: { y: 880, xl: 690, xr: 900, r: 52 },
};

const PS = SPR.pool;
export const poolToWorld = (px: number, py: number): [number, number] => [
  W.pool.x + (px - PS.w / 2) * W.pool.s,
  W.pool.base + (py - PS.h) * W.pool.s,
];
const DS = SPR.dome;
export const domeToWorld = (px: number, py: number): [number, number] => [
  W.dome.cx + (px - DS.cx) * W.dome.s,
  W.dome.base + (py - DS.base) * W.dome.s,
];
export const DOOR = (() => {
  const [x0, y0] = domeToWorld(DS.door[0], DS.door[1]);
  const [x1, y1] = domeToWorld(DS.door[2], DS.door[3]);
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
})();

// ---------- cameras ----------
// every key keeps the view inside the plate (x 540/k .. 1536 - 540/k, y 960/k .. 2304 - 960/k)
export const CAM0 = { x: 760, y: 1450, k: 1.3 };
export const CAM: CamKey[] = [
  { t: 0, ...CAM0 },
  { t: 3.3, x: 740, y: 1440, k: 1.3 }, // drift left to make room for the fridge
  { t: 4.5, x: 740, y: 1440, k: 1.3 },
  { t: 5.5, x: 790, y: 1470, k: 1.38 }, // lean in on the melting cube
  { t: T.but1, x: 790, y: 1470, k: 1.4 },
  { t: T.but1 + 0.001, x: 760, y: 1110, k: 1.5, ease: "cut" },
  { t: T.wide, x: 760, y: 1095, k: 1.56 },
  { t: T.wide + 0.001, x: 768, y: 1250, k: 1.0, ease: "cut" },
  { t: 11.45, x: 768, y: 1262, k: 1.01 },
  { t: 12.25, x: 620, y: 1390, k: 1.16 }, // in on the pour
  { t: 13.75, x: 625, y: 1385, k: 1.17 },
  { t: 14.55, x: 768, y: 1290, k: 1.0 }, // out for the whole pool freezing + the slide
  { t: T.but2, x: 790, y: 1290, k: 1.0 },
  { t: T.but2 + 0.001, x: 640, y: 1340, k: 1.05, ease: "cut" },
  { t: 18.0, x: 860, y: 1330, k: 1.05 }, // follow the run to the door
  { t: 18.9, x: 960, y: 1300, k: 1.0 },
  { t: 20.3, x: 965, y: 1300, k: 1.02 },
  { t: 21.0, x: 870, y: 1360, k: 1.02 },
  { t: 22.7, x: 870, y: 1360, k: 1.04 },
  { t: 23.5, x: 660, y: 1450, k: 1.3 }, // in on the guy catching the cube (frame-0 size for the loop)
  { t: DURATION, x: 655, y: 1452, k: 1.31 },
];

export type PoseName = "hero" | "shrug" | "pour" | "slide" | "carry";
export const poseBox = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as {
    w: number;
    h: number;
    head: readonly number[];
    feet: readonly number[];
  };
  const k = hr / s.head[2];
  return {
    left: fx - s.feet[0] * k,
    top: fy - s.feet[1] * k,
    width: s.w * k,
    height: s.h * k,
    k,
  };
};
