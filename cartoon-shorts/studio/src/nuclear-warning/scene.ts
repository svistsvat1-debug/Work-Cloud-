// Beat times, world layout and cameras for "Why don't we just put a danger sign on buried nuclear waste?"
// Field world units = plate pixels x 1.5 (plate 1024 x 1536 -> 1536 x 2304). The front edge of the ground (G) is a
// school-diagram cut-away: below it the soil, the shaft and the buried barrel are drawn in code.
// Sets (hard cuts in the pauses): A = the field (frame 0: hammer the sign, the barrel falls, 10,000 years pass),
// B = the scroll close-up, C = the skull sign, D = Egypt (tomb, curse ghost, robber), E = the researchers + the cat,
// F = the final run (the guy hammers again, the cat turns green, he runs).
import { SPR } from "./sprites";
import type { CamKey } from "../shared/anim";

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.85;
export const BG_S = 1.5;
export const WW = 1024 * BG_S;
export const WH = 1536 * BG_S;

// beat times (video s) = Scribe word start + 0.1 s voice offset, checked against the pauses found by loudness
export const T = {
  why: 0.1,
  danger: 1.06,
  sign: 1.46,
  buried: 1.94,
  nuclear: 2.26,
  waste: 2.66,
  because: 3.54,
  stays: 3.94,
  deadly: 4.34,
  over: 4.98,
  ten: 5.34,
  thousand: 5.7,
  years: 6.18,
  but: 6.98,
  read: 7.78,
  english: 8.1,
  thousand2: 8.74,
  ago: 9.3,
  scary: 10.1,
  pictures: 10.42,
  egyptians: 11.3,
  curses: 12.1,
  tombs: 12.74,
  robbers: 13.46,
  figured: 14.02,
  treasure: 14.58,
  inside: 14.9,
  so: 15.86,
  eighties: 16.26,
  two: 16.9,
  researchers: 17.14,
  suggested: 17.66,
  cats: 18.26,
  change: 18.82,
  color: 19.14,
  near: 19.46,
  radiation: 19.7,
  plus: 20.74,
  legend: 21.14,
  if: 22.06,
  cat: 22.34,
  changes: 22.58,
  color2: 22.98,
  run: 23.78,
  voiceEnd: 24.42,
  end: DURATION,
};

// hard cuts, each inside a pause of the voice (pauses by loudness, video time)
export const CUT = { B: 6.94, C: 10.0, D: 11.22, E: 15.8, F: 21.98 };
export type SetName = "A" | "B" | "C" | "D" | "E" | "F";
export const SET = (t: number): SetName =>
  t < CUT.B ? "A" : t < CUT.C ? "B" : t < CUT.D ? "C" : t < CUT.E ? "D" : t < CUT.F ? "E" : "F";

// ---------- the field ----------
export const HORIZON = SPR.bg.horizon * BG_S;
export const G = 2000; // front edge of the ground: the cut-away starts here
export const FEET = 1985; // where everybody stands
export const HR = 100; // head radius of every full-body pose (world units)
export const SHAFT = { x: 1160, hw: 150, bottom: 2905 };
export const BARREL = { w: 230, h: 330, landY: 2880 }; // landY = barrel bottom at the bottom of the shaft
export const SIGN = { x: 915, s: 0.62 };
export const GUY = { x: 600 };
export const CAT = { x: 1160, h: 250 };
export const TABLET = { x: 860, w: 390, h: 470 };
export const NERDS = [
  { x: 390, y: FEET, s: 1 },
  { x: 590, y: FEET - 18, s: 0.9 },
];

// ---------- Egypt ----------
export const EG = {
  horizon: 1210,
  ground: 1800,
  tomb: { cx: 760, base: 1800, s: 0.8 },
  ghost: { x: 760, y: 905 },
  robberFrom: 120,
  robberTo: 560,
};

// ---------- cameras ----------
// field keys keep the view inside the plate horizontally (x 540/k .. 1536 - 540/k); below G the code soil covers it
export const CAM0 = { x: 824, y: 1690, k: 1.06 };
export const CAM_A: CamKey[] = [
  { t: 0, ...CAM0 },
  { t: 1.8, x: 830, y: 1696, k: 1.07 },
  { t: 2.75, x: 1020, y: 2330, k: 1.12 }, // follow the barrel down the shaft
  { t: 3.45, x: 1030, y: 2345, k: 1.13 },
  { t: 4.25, x: 1150, y: 2640, k: 1.55 }, // in on the barrel's face
  { t: 4.85, x: 1150, y: 2645, k: 1.58 },
  { t: 5.8, x: 800, y: 2120, k: 0.9 }, // out: the surface and the barrel, 10,000 years pass
  { t: CUT.B, x: 800, y: 2112, k: 0.9 },
];
export const CAM_C: CamKey[] = [
  { t: CUT.C, x: 650, y: 1690, k: 1.28 },
  { t: CUT.D, x: 660, y: 1680, k: 1.33 },
];
export const CAM_D: CamKey[] = [
  { t: CUT.D, x: 760, y: 1440, k: 1.0 },
  { t: 13.3, x: 740, y: 1450, k: 1.03 },
  { t: 14.7, x: 690, y: 1470, k: 1.08 }, // lean in with the robber
  { t: CUT.E, x: 720, y: 1460, k: 1.1 },
];
export const CAM_E: CamKey[] = [
  { t: CUT.E, x: 830, y: 1985, k: 0.95 },
  { t: 18.6, x: 840, y: 1990, k: 0.96 },
  { t: 19.4, x: 975, y: 2070, k: 1.08 }, // in on the cat turning green above the barrel
  { t: 20.45, x: 980, y: 2070, k: 1.09 },
  { t: 21.25, x: 960, y: 1790, k: 1.25 }, // in on the legend tablet + the green cat (the payoff must read)
  { t: CUT.F, x: 962, y: 1786, k: 1.27 },
];
export const CAM_F: CamKey[] = [
  { t: CUT.F, x: 830, y: 1700, k: 1.04 },
  { t: 22.5, x: 836, y: 1706, k: 1.04 },
  { t: 23.2, x: 900, y: 1880, k: 1.02 }, // see the barrel glowing under the cat
  { t: 23.85, x: 890, y: 1870, k: 1.02 },
  { t: 24.35, x: 790, y: 1700, k: 1.04 }, // the guy runs off to the left
  { t: DURATION, x: CAM0.x, y: CAM0.y, k: CAM0.k }, // back to the frame-0 framing for the loop
];

export type PoseName = "up" | "down" | "run" | "skull" | "nerd" | "robber";
// the hammer pair comes from one drawing: one shared scale so the swap never changes the body size
const PAIR_R = 126;
export const poseBox = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as { w: number; h: number; head: readonly number[]; feet: readonly number[] };
  const r = name === "up" || name === "down" ? PAIR_R : s.head[2];
  const k = hr / r;
  return { left: fx - s.feet[0] * k, top: fy - s.feet[1] * k, width: s.w * k, height: s.h * k, k };
};
// head centre of a pose in world units
export const headAt = (name: PoseName, fx: number, fy: number, hr: number) => {
  const s = SPR[name] as { head: readonly number[] };
  const b = poseBox(name, fx, fy, hr);
  return { x: b.left + s.head[0] * b.k, y: b.top + s.head[1] * b.k, r: s.head[2] * b.k };
};
