// World layout, beat times and cameras for "Why don't we dump our trash on the Moon?"
// Earth world units = night plate pixels x 1.5 (1024 x 1536 -> 1536 x 2304). Lunar world: same scale for its plate.
import {SPR} from './sprites';
import {clamp, lerp, type CamKey, type Cam} from '../shared/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 25.0;

// beat times (video seconds) = Scribe word starts + 0.1 s voice offset (word ends checked against loudness pauses)
export const T = {
  trash: 1.38,
  moon: 1.78,
  nobody: 2.66,
  so: 3.58,
  cares: 3.94,
  right: 4.34,
  but: 5.14,
  kilo: 6.1,
  costs: 7.14,
  million: 8.02,
  dollars: 8.5,
  soWeek: 9.46,
  millions: 11.46,
  kaching: 11.98,
  every: 12.58,
  counts: 13.38,
  apollo: 14.34,
  astronauts: 14.82,
  left: 15.46,
  fly: 16.66,
  home: 16.82,
  lighter: 17.06,
  which: 17.78,
  theMoon: 18.34,
  dump: 19.54,
  ninety: 20.42,
  bags: 21.14,
  some: 22.1,
  astronaut: 22.74,
  poop: 23.22,
  voEnd: 23.7,
  outStart: 23.8,
  outEnd: 24.95,
};

// ---------- Earth world ----------
export const BG_S = 1.5;
export const C0: Cam = {x: 840, y: 920, k: 1.0}; // frame-0 camera (far layers are aligned to it)
export const DS = 1.45; // sky depth
export const DM = 1.25; // Moon depth
// far-layer placement: a point designed in depth-1 coords at camera c maps to these far-layer coords
export const far = (p: [number, number], d: number, c: Cam = C0): [number, number] => [c.x + (p[0] - c.x) * d, c.y + (p[1] - c.y) * d];

const top = SPR.bg_night.top as readonly number[];
export const hillY = (x: number) => {
  const bx = x / BG_S / 16;
  const i = clamp(Math.floor(bx), 0, top.length - 2);
  return lerp(top[i], top[i + 1], clamp(bx - i, 0, 1)) * BG_S;
};

export const HR = 115; // head radius of every full-body pose (world units)
export const HX = 700;
export const HY = hillY(HX) + 95; // feet on the grass, below the crest line

// the Moon (depth-1 design position at C0, then pushed back to DM)
export const MOON_P: [number, number] = [1000, 430];
export const MOON_R0 = 290;
export const MOON_Q = far(MOON_P, DM);
export const MOON_R = MOON_R0 * DM;
export const MOON_S = MOON_R / (SPR.moon.disc[2] as number);
// pile of Apollo bags sitting on the Moon's top-right shoulder (far-layer coords), angle from straight up
export const PILE_ANG = (34 * Math.PI) / 180;
export const PILE_B: [number, number] = [MOON_Q[0] + MOON_R * Math.sin(PILE_ANG), MOON_Q[1] - MOON_R * Math.cos(PILE_ANG)];

// flying bag
export const BAG_W = 150; // world width of the black bag
export const BAG_S = BAG_W / 825;
export const BAG_H = SPR.trash_bag.h * BAG_S;
export const APEX: [number, number] = [905, 760];

// S3 pile of a week of trash: 7 bags (bag centres) + landing times
const pileX = [960, 1080, 1200, 1320, 1020, 1140, 1260];
export const WEEK = pileX.map((x, i) => {
  const row = i < 4 ? 0 : 1;
  const base = hillY(x) + 95 - BAG_H * 0.42;
  return {x: row ? x : x, y: base - row * BAG_H * 0.62 - (row ? 8 : 0), at: 9.62 + i * 0.3, rot: ((i * 37) % 17) - 8};
});
export const WEEK_KG = 15.6; // EPA 4.9 lb per person per day x 7
export const PRICE_KG = 1200000; // Astrobotic published price per kg to the lunar surface (2021 guide)

// cameras (one list per shot; shots are hard cuts)
export const CAM_A: CamKey[] = [
  {t: 0, x: 830, y: 930, k: 1.12},
  {t: 2.5, x: 822, y: 948, k: 1.18},
  {t: 3.3, x: 960, y: 520, k: 1.08},
  {t: 3.42, x: 962, y: 516, k: 1.08},
  {t: 4.2, x: 850, y: 885, k: 0.95},
  {t: 4.6, x: 870, y: 850, k: 0.96},
  {t: 5.14, x: 895, y: 812, k: 1.02},
  {t: 6.2, x: 960, y: 840, k: 1.38},
  {t: 7.14, x: 962, y: 845, k: 1.4},
  {t: 8.0, x: 805, y: 1290, k: 1.22},
  {t: 8.5, x: 806, y: 1296, k: 1.24},
];
export const CAM_B: Cam = {x: 735, y: 1210, k: 1.55}; // close-up background (blurred)
export const CAM_C: CamKey[] = [
  {t: 9.46, x: 905, y: 1010, k: 0.86},
  {t: 12.58, x: 905, y: 1030, k: 0.91},
];
export const CAM_E: CamKey[] = [
  {t: 17.78, x: 1040, y: 226, k: 1.5},
  {t: 22.6, x: 1052, y: 214, k: 1.58},
  {t: 23.25, x: 1120, y: 150, k: 1.8},
  {t: T.outStart, x: 1118, y: 152, k: 1.8},
  {t: T.outEnd, x: 830, y: 930, k: 1.12}, // = frame 0 (loop)
];

// ---------- Lunar world ----------
export const DL = 1.5; // lunar sky depth
export const C4: Cam = {x: 830, y: 1480, k: 1.22};
export const SKY_OFF: [number, number] = [430, 690]; // shift the lunar sky so the Earth sits top-left
export const LM_S = 0.52;
export const LM_LEFT = 400;
export const LM_BOTTOM = 1740;
export const LM_TOP = LM_BOTTOM - SPR.lander.h * LM_S;
export const HR_A = 48; // astronaut head radius
export const AX = 1010;
export const AY = 1772;
export const TOSS = [15.46, 15.76, 16.06];
export const TOSS_LAND: [number, number][] = [
  [1105, 1795],
  [1185, 1818],
  [1160, 1764],
];
export const CAM_D: CamKey[] = [
  {t: 12.58, x: 662, y: 1440, k: 1.62},
  {t: 13.9, x: 690, y: 1455, k: 1.56},
  {t: 14.75, x: 885, y: 1525, k: 1.48},
  {t: 16.25, x: 905, y: 1530, k: 1.46},
  {t: 16.95, x: 760, y: 1420, k: 1.18},
  {t: 17.78, x: 740, y: 1190, k: 1.1},
];

// sprite placement: scale so the head radius is hr, anchor the feet point at (fx, fy)
export const poseBox = (name: keyof typeof SPR, fx: number, fy: number, hr = HR) => {
  const s = SPR[name] as unknown as {w: number; h: number; head: readonly number[]; feet: readonly number[]};
  const k = hr / s.head[2];
  return {left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k, s};
};
