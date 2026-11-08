import tl from './timeline.json';
import {Pose} from './hand';
import {V3, prog, ring, clamp, easeOut, easeIn, easeInOut, keys, lerp} from './math';

export const T = tl.T as Record<string, number>;
export const FPS = 60;
export const DURATION = T.end;

/** a finger lift: up fast (with a little overshoot), hold, down fast */
function liftCurve(t: number, up: number, down: number, deg: number) {
  if (t < up - 0.05 || t > down + 0.6) return 0;
  const u = prog(t, up - 0.05, up + 0.22, easeOut);
  const settle = ring(t, up + 0.22, 3.2, 7) * 6;
  const d = prog(t, down, down + 0.17, easeIn);
  const land = ring(t, down + 0.17, 5, 12) * -1.5;
  return deg * u * (1 - d) + settle * (1 - d) + (t > down + 0.17 ? land : 0);
}

export function poseAt(t: number): Pose {
  // fold the middle finger under on "fold ... under", unfold at the very end (loop back to frame 0)
  const foldIn = prog(t, T.fold - 0.02, T.under + 0.02, easeInOut);
  const foldOut = prog(t, T.end - 0.62, T.end - 0.14, easeInOut);
  const fold = foldIn * (1 - foldOut);
  const thumb = liftCurve(t, T.thumb, T.easy1 + 0.45, 82);
  const index = liftCurve(t, T.index, T.easy2 + 0.3, 86);
  const pinky = liftCurve(t, T.pinky, T.easy3 + 0.3, 84) + liftCurve(t, T.backup + 0.14, T.backup + 0.42, 26);
  const index2 = liftCurve(t, T.backup, T.backup + 0.28, 26);

  // ring finger: tries and fails (tremble) during the try-it pause, and again on the leash
  let ringLift = 0;
  const tr1 = clamp((t - (T.ringEnd - 0.35)) / 0.6) * (1 - prog(t, T.pause1 - 0.05, T.pause1 + 0.25));
  ringLift += tr1 * (2.6 + 1.4 * Math.sin(t * 2 * Math.PI * 1.3) + 1.1 * Math.sin(t * 2 * Math.PI * 13));
  const tr2 = clamp((t - (T.holds - 0.1)) / 0.5) * (1 - prog(t, T.leash - 0.25, T.leash - 0.05));
  ringLift += tr2 * (3 + 2 * Math.sin(t * 2 * Math.PI * 1.7) + 1.3 * Math.sin(t * 2 * Math.PI * 12));
  // the yank: a quick try that gets pulled back with a spring
  if (t > T.leash - 0.25 && t < T.leash + 1.2) {
    const up = prog(t, T.leash - 0.25, T.leash - 0.02, easeOut) * 13;
    const back = prog(t, T.leash - 0.02, T.leash + 0.08, easeIn);
    ringLift += up * (1 - back) + ring(t, T.leash + 0.08, 4.5, 6) * 4 * (t > T.leash + 0.08 ? 1 : 0);
  }
  // hand presses down on "table", small life motion
  const dy = -0.35 * ring(t, T.table - 0.08, 3, 6) * (t > T.table - 0.08 ? 1 : 0) + 0.04 * Math.sin(t * 2 * Math.PI * 0.55);
  return {tent: fold, fold, lift: {thumb, index: index + index2, ring: Math.max(0, ringLift), pinky}, dy};
}

export type CamKey = {target: V3; dist: number; pitch: number; yaw: number};
const FRONT0 = {tx: 0.6, ty: 3.4, tz: -2.6, dist: 49, pitch: 30, yaw: 12};
export function frontCamAt(t: number) {
  return keys(t, [
    {t: 0, v: FRONT0},
    {t: T.palm, v: {...FRONT0, dist: 45, tz: -2.0}},
    {t: T.lift, v: {tx: 0.6, ty: 3.4, tz: -0.8, dist: 42, pitch: 28, yaw: 10}},
    {t: T.easy3End, v: {tx: 0.4, ty: 3.4, tz: -0.6, dist: 41, pitch: 28, yaw: 9}},
    {t: T.ring + 0.1, v: {tx: -2.3, ty: 1.6, tz: 3.6, dist: 25, pitch: 30, yaw: 4}},
    {t: T.pause1, v: {tx: -2.3, ty: 1.6, tz: 3.8, dist: 22.5, pitch: 30, yaw: 3}},
    {t: T.most, v: {tx: -0.6, ty: 2.6, tz: 1.0, dist: 32, pitch: 31, yaw: 7}},
    {t: T.cutTop, v: {tx: -0.6, ty: 2.6, tz: 0.8, dist: 31, pitch: 31, yaw: 7}},
  ]);
}
export function front2CamAt(t: number) {
  return keys(t, [
    {t: T.cutFront, v: {tx: -1.0, ty: 2.5, tz: 1.8, dist: 27, pitch: 30, yaw: 5}},
    {t: T.comment, v: {tx: -0.3, ty: 2.6, tz: 0.2, dist: 35, pitch: 30, yaw: 9}},
    {t: T.end - 0.05, v: FRONT0},
  ]);
}
export function topCamAt(t: number) {
  return keys(t, [
    {t: T.cutTop, v: {tx: 0.6, tz: -9.0, h: 62}},
    {t: T.share + 0.4, v: {tx: 0.4, tz: -10.0, h: 60}},
    {t: T.tied, v: {tx: -0.3, tz: -2.6, h: 40}},
    {t: T.like, v: {tx: -0.6, tz: -0.4, h: 32}},
    {t: T.leashEnd, v: {tx: -0.6, tz: -0.5, h: 33}},
    {t: T.backup + 0.05, v: {tx: 0.1, tz: -11.5, h: 55}},
    {t: T.cutFront, v: {tx: 0.0, tz: -11.0, h: 53}},
  ]);
}
export const xrayAt = (t: number) => prog(t, T.cutTop + 0.1, T.cutTop + 0.75, (u) => u);
export const lerpN = lerp;
