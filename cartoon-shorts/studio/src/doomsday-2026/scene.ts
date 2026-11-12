// Beat times, world layout, cameras and the chart for "Why didn't the world end on November 13, 2026?"
// Lab world units = lab plate pixels x 1.5 (1024 x 1536 -> 1536 x 2304); the wall is extended upward and the floor
// downward in code, so the camera may leave the plate there.
import {SPR} from './sprites';
import type {CamKey} from '../shared/anim';

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 29.0;
export const BG_S = 1.5;

// beat times (video s) = Scribe word start + 0.1 s voice offset, checked against the pauses found by loudness
export const T = {
  y1960: 0.34,
  scientists: 1.7,
  calculated: 2.22,
  doomsday: 3.3,
  stamp: 3.93, // in the pause after "doomsday:"
  friday: 4.42,
  november: 5.06,
  th13: 5.46,
  y2026: 6.38,
  people: 7.86,
  multiplying: 8.42,
  faster: 9.22,
  so: 10.74,
  math: 11.06,
  infinite: 11.94,
  people2: 12.42,
  thatDay: 12.98,
  cutB: 13.8, // "Which means" -> the Earth
  wed: 14.5,
  squeezed: 15.3, // -> close-up
  death: 15.94,
  their: 16.74,
  cutC: 17.8, // "Worse" -> the board
  decades: 18.58,
  dots: [18.72, 19.52, 20.32] as const,
  curve: 20.98,
  cutD: 21.86, // "So why are we still here?" -> pull back, the crowd vanishes
  still: 22.86,
  because: 23.86,
  families: 24.18,
  shrank: 24.66,
  two: 25.7,
  kids: 26.02,
  that: 26.82,
  cure: 27.46,
  doomsday2: 27.86,
  print: 28.08,
  loop: 28.45, // cut back to the frame-0 shot (the next doomsday page)
  end: DURATION,
};

// ---------- the lab ----------
const LB = SPR.bg_lab;
export const LAB = {
  w: LB.w * BG_S,
  h: LB.h * BG_S,
  floor: LB.floor * BG_S, // wall / floor line
  wall: LB.wall,
  wood: LB.wood,
  board: {x: LB.board[0] * BG_S, y: LB.board[1] * BG_S, w: LB.board[2] * BG_S, h: LB.board[3] * BG_S},
  hero: {x: 820, y: 2150},
  hr: 190, // adult head radius (world units)
  computer: {x: 330, y: 2000, h: 1250},
};

// fake floor perspective: a body standing further back (smaller feet y) is drawn smaller
export const depthScale = (fy: number) => 0.55 + (0.45 * (fy - 1400)) / (LAB.hero.y - 1400);

// ---------- cameras ----------
export const CAM_A: CamKey[] = [
  {t: 0, x: 820, y: 1640, k: 1.25}, // frame 0: the guy + the doomsday page
  {t: 3.0, x: 760, y: 1560, k: 1.02}, // reveal the 1960 computer
  {t: 4.4, x: 760, y: 1560, k: 1.02},
  {t: 7.55, x: 815, y: 1610, k: 1.16}, // slow push in while the date is read
  {t: 7.86, x: 815, y: 1610, k: 1.16},
  {t: 10.5, x: 800, y: 1440, k: 0.8, ease: 'out'}, // the crowd fills the room
  {t: 10.74, x: 800, y: 1440, k: 0.8},
  {t: 11.45, x: 1000, y: 640, k: 1.15}, // whip up to the board
  {t: 11.94, x: 1000, y: 640, k: 1.15},
  {t: 12.7, x: 1110, y: 260, k: 0.98}, // follow the line up to infinity
  {t: 13.9, x: 1115, y: 250, k: 0.97},
];
export const CAM_B: CamKey[] = [
  {t: T.cutB, x: 768, y: 1180, k: 0.93},
  {t: T.squeezed, x: 768, y: 1090, k: 1.04},
];
export const CAM_C: CamKey[] = [
  {t: T.cutC, x: 996, y: 640, k: 1.2},
  {t: T.cutD, x: 996, y: 660, k: 1.25},
];
export const CAM_D: CamKey[] = [
  {t: T.cutD, x: 996, y: 660, k: 1.25},
  {t: 22.55, x: 800, y: 1400, k: 0.8},
  {t: 23.8, x: 800, y: 1400, k: 0.8},
  {t: 26.6, x: 820, y: 1420, k: 0.86},
  {t: 27.5, x: 800, y: 1350, k: 0.845},
  {t: T.loop, x: 798, y: 1350, k: 0.85},
];

// ---------- the chart on the board (world units) ----------
export const CH = {
  x0: 640, // year 1900
  x1: 1390, // year 2030
  yAxis: 900, // 0 people
  yTop: 330, // 12 billion
};
export const chartX = (year: number) => CH.x0 + ((year - 1900) / 130) * (CH.x1 - CH.x0);
export const chartY = (people: number) => CH.yAxis - (people / 12e9) * (CH.yAxis - CH.yTop);
// von Foerster, Mora & Amiot (Science, 1960): N = 1.79e11 / (2026.87 - t)^0.99
export const doom = (year: number) => 1.79e11 / Math.pow(2026.87 - year, 0.99);
// world population (UN estimates, rounded) for the "real numbers" dots and line
export const REAL: [number, number][] = [
  [1970, 3.7e9],
  [1980, 4.4e9],
  [1990, 5.3e9],
  [2000, 6.1e9],
  [2010, 6.9e9],
  [2020, 7.8e9],
  [2026, 8.3e9],
];

// ---------- the Earth (space shot) ----------
const SB = SPR.bg_space;
export const SPACE = {w: SB.w * BG_S, h: SB.h * BG_S, sky: SB.sky};
export const EARTH = {x: 768, y: 1400, r: 560};

type PoseName = 'hero' | 'calendar' | 'panic' | 'shrug' | 'happy' | 'squeezed' | 'kid_wave' | 'kid_hug';
export const poseBox = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as {w: number; h: number; head: readonly number[]; feet: readonly number[]};
  const k = hr / s.head[2];
  return {left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k};
};
export type {PoseName};
