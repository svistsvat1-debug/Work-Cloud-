// World layout, beat times and camera for "Why don't we dump trash into the deepest ocean trench?"
// World units = background pixels x 1.5 (bg plate 1274 x 1536 -> 1911 x 2304).
import {SPR} from './sprites';
import type {CamKey} from '../shared/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 21.9;

export const BG_S = 1.5;
export const BG_W = SPR.bg.w * BG_S;
export const BG_H = SPR.bg.h * BG_S;
export const SURF = 193 * BG_S; // sea surface line

// beat times (video seconds) = Scribe word times + 0.1 s voice offset, checked against pauses by loudness
export const T = {
  trash: 1.22,
  windup: 1.92,
  swing: 2.5,
  release: 2.6,
  splash: 3.06,
  slides: 4.38,
  land: 4.7,
  eats: 5.82,
  everything: 6.22,
  rightCut: 6.42,
  butCut: 7.26,
  slowSlide: 7.86,
  nailsCut: 9.15,
  so: 10.45,
  sleep: 10.62,
  countA: 11.15,
  countB: 13.45,
  tip: 14.55,
  sinkMagma: 15.15,
  magma: 16.2,
  rise: 16.8,
  comeBack: 18.42,
  inhale: 18.82,
  boom: 19.12,
  catch: 20.32,
  end: 21.9,
};

// character
export const HR = 40; // head radius in world units for every pose
export const GX = 695;
export const GY = SURF + 5; // feet point (hidden behind the hull)
export const BOAT_W = 330;
export const BX = 705;

// volcano set piece
export const V_S = 0.78;
export const V_W = SPR.volcano.w * V_S;
export const V_H = SPR.volcano.h * V_S;
export const V_BASE = 585 * BG_S; // the rocky ledge
export const V_LEFT = 1420 - V_W / 2;
export const V_TOP = V_BASE - V_H;
export const CRATER: [number, number] = [V_LEFT + 515.5 * V_S, V_TOP + 66 * V_S];

// trench + slab path (measured on the bg plate: grey slab / brown rock boundary)
export const TRENCH_TIP: [number, number] = [472 * BG_S, 895 * BG_S];
export const BAG_REST: [number, number] = [712, 1236];
export const SLAB_PATH: [number, number][] = [
  BAG_REST,
  [726, 1322],
  [780, 1400],
  [840, 1442],
  [900, 1474],
  [960, 1507],
  [1020, 1538],
  [1080, 1571],
  [1140, 1607],
  [1200, 1643],
  [1260, 1682],
  [1320, 1726],
  [1380, 1777],
  [1440, 1837],
  [1468, 1872],
];
// dashes that show the plate moving: along the sand top (left plate) and inside the slab
export const DASH_SAND: [number, number][] = [
  [-200, 1016],
  [520, 1016],
];
export const DASH_SLAB: [number, number][] = [
  [740, 1395],
  [800, 1440],
  [900, 1500],
  [1020, 1566],
  [1140, 1636],
  [1260, 1712],
  [1380, 1806],
  [1440, 1866],
];
export const MELT_AT: [number, number] = [1484, 1950];
export const CONDUIT: [number, number][] = [
  MELT_AT,
  [1478, 1720],
  [1452, 1420],
  [1430, 1120],
  [1423, 900],
  [1423, 600],
  [CRATER[0], CRATER[1] + 20],
];

export const SPLASH: [number, number] = [905, SURF];

export const CAM: CamKey[] = [
  {t: 0, x: 740, y: 690, k: 1.36},
  {t: 1.9, x: 718, y: 300, k: 1.62},
  {t: 2.6, x: 745, y: 290, k: 1.6},
  {t: 3.1, x: 800, y: 400, k: 1.35},
  {t: 4.45, x: 750, y: 1080, k: 1.2},
  {t: 5.3, x: 960, y: 1152, k: 0.85},
  {t: 5.45, x: 960, y: 1152, k: 0.85},
  {t: 6.1, x: 715, y: 1190, k: 1.7},
  {t: T.rightCut, x: 715, y: 1192, k: 1.72},
  {t: T.butCut, x: 715, y: 1192, k: 1.72, ease: 'cut'},
  {t: T.butCut + 0.0001, x: 715, y: 1215, k: 1.75, ease: 'cut'},
  {t: T.nailsCut, x: 715, y: 1222, k: 1.95},
  {t: T.nailsCut + 0.0001, x: 700, y: 175, k: 2.3, ease: 'cut'},
  {t: T.so, x: 700, y: 172, k: 2.42},
  {t: 11.45, x: 960, y: 1152, k: 0.85, ease: 'out'},
  {t: 13.75, x: 960, y: 1152, k: 0.85},
  {t: 14.8, x: 1440, y: 1690, k: 1.55},
  {t: 16.6, x: 1452, y: 1690, k: 1.5},
  {t: 18.6, x: 1420, y: 520, k: 1.1},
  {t: T.boom, x: 1420, y: 470, k: 1.18},
  {t: 19.75, x: 1060, y: 300, k: 0.95, ease: 'out'},
  {t: T.catch, x: 760, y: 190, k: 1.5},
  {t: 21.0, x: 700, y: 150, k: 2.05},
  {t: T.end, x: 700, y: 146, k: 2.15},
];

// sprite placement: scale so the head radius is HR, anchor the feet point at (fx, fy)
export const poseBox = (name: keyof typeof SPR, fx: number, fy: number, hr = HR) => {
  const s = SPR[name] as {w: number; h: number; head: readonly number[]; feet: readonly number[]};
  const k = hr / s.head[2];
  return {left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k};
};
