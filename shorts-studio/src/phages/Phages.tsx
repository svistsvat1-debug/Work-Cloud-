// "Why don't doctors use phages?" - cut-out cartoon Short. Pictures: Google Flow (keyed, trimmed by prep.py).
// Motion, camera, physics, faces and effects: this file. Beats: timing.ts. Sound: sound.tsx.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as A from '../lib/anim';
import {Face, FaceP} from '../lib/Face';
import {Film, Flash, Puff, Ring, Shadow, Sweat} from '../lib/fx';
import {Spr} from '../lib/Spr';
import {camAt, kOf, Layer, WorldSvg} from '../lib/World';
import {cues, Sound} from './sound';
import {S} from './sprites';
import {BW, C0, FLOOR, FPS, GUY_X, HEAD_R, HORIZON_Y, LAB_W, PHAGE_H, PILL_LAND_X, PILL_V, PILL_W, RODA_X, SHAKES, SHOTS, T, TOUGH_K, TOUGH_X} from './timing';

type Pt = A.P;
const TAU = Math.PI * 2;
const INK_W = 4.5; // world px outline weight for code-drawn faces / drops

// ------------------------------------------------------------------ sizes
const PS = PHAGE_H / S.phage.h;
const bs = (name: string, k = 1) => (BW[name] / S[name].w) * k;
const PILL_S = PILL_W / S.pill.w;
const PILL_H = S.pill.h * PILL_S;

// ------------------------------------------------------------------ the guy
type Swap = {t: number; pose: string; kind: 'turn' | 'action' | 'flash'};
const SWAPS: Swap[] = [
  {t: 0, pose: 'guy_present', kind: 'flash'},
  {t: T.shrug, pose: 'guy_shrug', kind: 'turn'},
  {t: T.flash1, pose: 'guy_oldtimey', kind: 'flash'},
  {t: T.flash2, pose: 'guy_present', kind: 'flash'},
  {t: T.drop, pose: 'guy_drop', kind: 'action'},
  {t: T.scared, pose: 'guy_scared', kind: 'turn'},
  {t: T.present, pose: 'guy_present', kind: 'turn'},
];
const CATCHES = [T.palm1, T.hopShrug1, T.palmBack, T.palmEnd];

function guyAt(t: number) {
  const pose = A.step(t, SWAPS.map((s) => [s.t, s.pose] as [number, string]));
  let sx = 1;
  let sy = 1;
  for (const s of SWAPS) {
    if (s.kind === 'turn') {
      const b = A.bump(t, s.t, 0.1); // squash narrow and swap on the narrowest frame
      sx *= 1 - 0.2 * b;
      sy *= 1 + 0.03 * b;
    }
    if (s.kind === 'action') {
      if (t > s.t - 0.12 && t < s.t) {
        const u = A.easeInOutSine(A.inv(s.t - 0.12, s.t, t)); // anticipation
        sy *= 1 - 0.06 * u;
        sx *= 1 + 0.04 * u;
      }
      const sp = A.spring(t, s.t, 0.035, 2.8, 6.5); // stretch, settle
      sy *= 1 + sp;
      sx *= 1 - sp * 0.6;
    }
    if (s.kind === 'flash' && s.t > 0) {
      const sp = A.spring(t, s.t, 0.025, 3, 7);
      sy *= 1 + sp;
      sx *= 1 - sp * 0.5;
    }
  }
  for (const tc of CATCHES) sy *= 1 + A.spring(t, tc, -0.022, 3, 7); // weight dip on a catch
  sy *= 1 + A.spring(t, T.boing, -0.03, 3.5, 8); // phage boings off the head
  sy *= 1 + 0.009 * Math.sin(TAU * 0.6 * t); // breathing
  let dx = 0;
  let dy = 0;
  if (pose === 'guy_scared') {
    dx = 1.6 * Math.sin(TAU * 13.3 * t) + 1.0 * Math.sin(TAU * 7.1 * t);
    dy = 0.8 * Math.sin(TAU * 11 * t);
  }
  return {pose, s: poseScale(pose), sx, sy, dx, dy};
}

/** AI poses differ in proportions (head vs body). Pure head-normalising makes the height jump on a swap, pure
 * height-normalising makes the head jump - split the difference: both change by the square root of the mismatch. */
const ratio = (pose: string) => {
  const m = S[pose];
  return (m.feet![1] - (m.head![1] - m.head![2])) / m.head![2];
};
export function poseScale(pose: string) {
  const m = S[pose];
  return (HEAD_R / m.head![2]) * Math.sqrt(ratio('guy_present') / ratio(pose));
}

/** world position of a point given in the CURRENT pose's sprite pixels */
function guyPt(t: number, local: number[]): Pt {
  const g = guyAt(t);
  const f = S[g.pose].feet!;
  return {x: GUY_X + g.dx + (local[0] - f[0]) * g.s * g.sx, y: FLOOR + g.dy + (local[1] - f[1]) * g.s * g.sy};
}
const palmAt = (t: number) => guyPt(t, S.guy_present.palm!);
const headTopAt = (t: number) => {
  const h = S.guy_present.head!;
  return guyPt(t, [h[0], h[1] - h[2] + 6]);
};

// ------------------------------------------------------------------ bacteria
type BState = {
  id: string;
  name: string;
  vis: boolean;
  air: boolean; // ground: (x, y) = bottom centre; air: (x, y) = face centre, rotating about it
  x: number;
  y: number;
  s: number;
  sx: number;
  sy: number;
  rot: number;
  face: FaceP;
  sweat?: [number, number];
};

/** y of a bacterium's top outline at world x (ground state) */
function topAt(b: BState, xw: number): number {
  const m = S[b.name];
  const lx = (xw - b.x) / (b.s * b.sx) + m.w / 2;
  const top = m.top!;
  const i = Math.round(A.clamp(lx / 10, 0, top.length - 1));
  let ty = top[i];
  if (ty < 0) ty = Math.min(...top.filter((v) => v >= 0));
  return b.y - (m.bottom! - ty) * b.s * b.sy;
}
function centreOf(b: BState): Pt {
  if (b.air) return {x: b.x, y: b.y};
  const m = S[b.name];
  const f = m.face!;
  return {x: b.x + (f[0] - m.w / 2) * b.s * b.sx, y: b.y - (m.bottom! - f[1]) * b.s * b.sy};
}

const idle = (t: number, seed: number) => 0.014 * Math.sin(TAU * 1.25 * t + seed);
const smug: FaceP = {lid: 0.38, brow: 1, browAngle: 8, mouth: 'grin', look: [0.7, 0]};
const neutral: FaceP = {lid: 0.15, mouth: 'smile', look: [0.4, 0.1]};
const annoyed: FaceP = {lid: 0.3, lidTilt: 14, brow: 1, browAngle: 22, mouth: 'grin', look: [-0.6, -0.4]};
const shocked: FaceP = {pop: 1.15, brow: 1, browAngle: -16, browRaise: 0.7, mouth: 'o', look: [0.3, -0.9]};
const squeezed: FaceP = {squeeze: true, brow: 1, browAngle: -10, mouth: 'scream'};

function rodA(t: number): BState {
  const s = bs('bact_rod');
  const swell = t > T.swell0 ? A.easeInCubic(A.inv(T.swell0, T.pop1, t)) : 0;
  const wob = 0.03 * Math.sin(TAU * 14 * t) * swell;
  const land = A.spring(t, T.land1, -0.07, 3.5, 8);
  const i = idle(t, 0);
  const face = t < T.land1 ? smug : t < T.pump2 ? {...shocked, look: [0.2, -1] as [number, number]} : squeezed;
  return {id: 'rodA', name: 'bact_rod', vis: t < T.pop1, air: false, x: RODA_X, y: FLOOR, s, sx: 1 + 0.18 * swell + wob - land * 0.5 - i, sy: 1 + 0.22 * swell - wob + land + i, rot: 0, face};
}

const LINE = {comma1: 40, round1: -290, rodL: -650};
const pillHitTime = (bx: number, bw: number) => T.pillLand + (bx - bw / 2 - PILL_W * 0.4 - PILL_LAND_X) / PILL_V;
type Bowl = {id: string; name: string; x: number; k: number; tIn: number};
const BOWL: Bowl[] = [
  {id: 'round2', name: 'bact_round', x: -860, k: 0.75, tIn: T.extras},
  {id: 'comma2', name: 'bact_comma', x: -575, k: 0.8, tIn: T.extras + 0.07},
  {id: 'round1', name: 'bact_round', x: LINE.round1, k: 1, tIn: T.flash2},
  {id: 'comma1', name: 'bact_comma', x: LINE.comma1, k: 1, tIn: T.flash2},
  {id: 'rod2', name: 'bact_rod', x: 360, k: 0.7, tIn: T.extras + 0.14},
];
const HIT = Object.fromEntries(BOWL.map((b) => [b.id, pillHitTime(b.x, BW[b.name] * b.k)]));
const POP_AFTER_HIT = 0.42;

function bowlB(t: number, b: Bowl, i: number): BState {
  const s = bs(b.name, b.k);
  const th = HIT[b.id];
  const pin = b.tIn === T.flash2 ? 1 : A.popIn(t, b.tIn, 0.3);
  const vis = t >= b.tIn && t < th + POP_AFTER_HIT;
  let face: FaceP = neutral;
  let boing = 0;
  if (b.id === 'comma1') {
    boing = A.spring(t, T.boingA, -0.12, 3.5, 7);
    if (t >= T.boingA && t < 15.2) face = annoyed;
    else if (t >= 15.2) face = smug;
    else if (t >= T.landA) face = {...shocked, mouth: 'flat'};
  }
  if (b.id === 'round1') {
    boing = A.spring(t, T.boingB, -0.12, 3.5, 7);
    if (t >= T.boingB && t < 15.8) face = annoyed;
    else if (t >= 15.8) face = smug;
    else if (t >= T.landB) face = {...shocked, mouth: 'flat'};
  }
  if (t >= 19.0 && t < th) face = {...shocked, look: [-1, 0]};
  if (t >= th) {
    // knocked flying like a bowling pin
    const c0 = centreOf({id: b.id, name: b.name, vis, air: false, x: b.x, y: FLOOR, s, sx: 1, sy: 1, rot: 0, face});
    const tau = t - th;
    const vx = 420 + 90 * i;
    const vy0 = -1250 - 80 * i;
    return {id: b.id, name: b.name, vis, air: true, x: c0.x + vx * tau, y: c0.y + vy0 * tau + 0.5 * 3000 * tau * tau, s, sx: 1, sy: 1, rot: (i % 2 ? 1 : -1) * 620 * tau, face: squeezed};
  }
  const k = idle(t, i * 1.7);
  return {id: b.id, name: b.name, vis, air: false, x: b.x, y: FLOOR, s: s * pin, sx: 1 - k - boing * 0.5, sy: 1 + k + boing, rot: 0, face};
}

function rodL(t: number): BState {
  const s = bs('bact_rod');
  const land = A.spring(t, T.match, -0.09, 3.5, 8);
  const k = idle(t, 2.2);
  let face: FaceP = {lid: 0.2, mouth: 'flat', look: [0.5, 0]};
  if (t >= 16.2) face = {lid: 0, mouth: 'flat', look: [0.6, -0.8]};
  if (t >= T.dive) face = {...shocked, look: [0.5, -1]};
  if (t >= T.match + 0.12) face = squeezed;
  const swell = A.easeInCubic(A.inv(T.match + 0.1, T.popL, t));
  const wob = 0.03 * Math.sin(TAU * 14 * t) * swell;
  return {id: 'rodL', name: 'bact_rod', vis: t >= T.flash2 && t < T.popL, air: false, x: LINE.rodL, y: FLOOR, s, sx: 1 + 0.15 * swell + wob - land * 0.5 - k, sy: 1 + 0.18 * swell - wob + land + k, rot: 0, face};
}

function tough(t: number): BState {
  const s = bs('bact_rod', TOUGH_K);
  const x = A.keys(t, [
    [T.toughIn0, -700],
    [T.toughIn1, TOUGH_X, A.easeOutCubic],
  ]);
  const arrive = A.spring(t, T.toughIn1, 0.08, 3, 6);
  const hit = A.spring(t, T.pillHit, -0.12, 3.5, 7);
  const k = idle(t, 4.1);
  let face: FaceP = {lid: 0.25, lidTilt: 15, brow: 1, browAngle: 22, mouth: 'grin', look: [1, 0]};
  if (t >= T.pillHit && t < T.pillHit + 0.14) face = {squeeze: true, brow: 1, browAngle: 20, mouth: 'flat'};
  if (t >= T.pillHit + 0.14) face = {lid: 0.45, brow: 1, browAngle: 10, mouth: 'grin', look: [1, -0.2]};
  if (t >= T.worried) face = {pop: 1.1, brow: 1, browAngle: -20, browRaise: 0.8, mouth: 'wavy', look: [1, -0.3]};
  return {id: 'tough', name: 'bact_rod', vis: t >= T.toughIn0, air: false, x, y: FLOOR, s, sx: 1 + arrive * 0.6 - hit * 0.5 - k, sy: 1 - arrive + hit + k, rot: 0, face, sweat: [T.worried + 0.05, 99]};
}

// ------------------------------------------------------------------ the pill
const SHRUG_S = poseScale('guy_shrug');
const PILL_HOVER: Pt = {
  x: GUY_X + (S.guy_shrug.palmR![0] - S.guy_shrug.feet![0]) * SHRUG_S + 90, // clear of the head
  y: FLOOR + (S.guy_shrug.palmR![1] - S.guy_shrug.feet![1]) * SHRUG_S - PILL_H / 2 - 30,
};
const PILL_R = (PILL_W / 2 + PILL_H / 2) / 2;

function pillAt(t: number) {
  const base = {vis: true, sx: 1, sy: 1, k: 1};
  if (t >= T.pillIn && t < T.poof + 0.12) {
    const out = t > T.poof ? 1 - A.inv(T.poof, T.poof + 0.12, t) : 1;
    const sq = t > T.poof - 0.08 && t <= T.poof ? 1 - 0.25 * A.inv(T.poof - 0.08, T.poof, t) : 1;
    return {...base, x: PILL_HOVER.x, y: PILL_HOVER.y + 6 * Math.sin(TAU * 0.9 * t), rot: 4 * Math.sin(TAU * 0.7 * t), k: A.popIn(t, T.pillIn, 0.3) * out, sy: sq, sx: 2 - sq, face: {lid: 0.2, mouth: 'smile', look: [-0.6, 0.2]} as FaceP};
  }
  if (t >= T.pillThrow && t < T.pillLand) {
    const h = A.hop(t, T.pillThrow, T.pillLand, {x: -1400, y: 650}, {x: PILL_LAND_X, y: FLOOR - PILL_H / 2}, 40);
    return {...base, x: h.x, y: h.y, rot: 540 * h.u, face: {lid: 0.2, lidTilt: 12, brow: 1, browAngle: 20, mouth: 'grin', look: [1, 0.3]} as FaceP};
  }
  if (t >= T.pillLand && t < 20.9) {
    const x = PILL_LAND_X + PILL_V * (t - T.pillLand);
    const th = (x - PILL_LAND_X) / PILL_R;
    const y = FLOOR - (PILL_H / 2 + (PILL_W / 2 - PILL_H / 2) * Math.abs(Math.sin(th)));
    return {...base, x, y, rot: (th * 180) / Math.PI, face: {lid: 0.2, lidTilt: 12, brow: 1, browAngle: 20, mouth: 'grin', look: [1, 0]} as FaceP};
  }
  if (t >= T.pillThrow2 && t < T.pillHit) {
    const hp = pillHitPoint();
    const h = A.hop(t, T.pillThrow2, T.pillHit, {x: -520, y: 420}, hp, 50);
    return {...base, x: h.x, y: h.y, rot: 300 * h.u, face: {lid: 0.2, lidTilt: 12, brow: 1, browAngle: 22, mouth: 'grin', look: [1, 0.6]} as FaceP};
  }
  if (t >= T.pillHit && t < T.pillGone) {
    const h = A.hop(t, T.pillHit, T.pillGone, pillHitPoint(), {x: 1460, y: 860}, 170);
    return {...base, x: h.x, y: h.y, rot: 300 + 900 * h.u, face: {squeeze: true, mouth: 'scream'} as FaceP};
  }
  return {...base, vis: false, x: 0, y: 0, rot: 0, face: {} as FaceP};
}
function pillHitPoint(): Pt {
  const b = tough(T.toughIn1 + 0.5);
  const xw = b.x - BW.bact_rod * TOUGH_K * 0.22;
  return {x: xw - PILL_W * 0.3, y: topAt(b, xw) - PILL_H * 0.45};
}

// ------------------------------------------------------------------ the phage (feet point + spin)
const HOVER: Pt = {x: -420, y: 1150};
const DROP_G = 3200;
const DROP_VX = 140;
const dropFrom = () => palmAt(T.drop - 0.001);
const DROP_LAND = T.drop + A.fallTime(palmAt(T.drop - 0.001).y, FLOOR, DROP_G);
const DROP_X = palmAt(T.drop - 0.001).x + DROP_VX * (DROP_LAND - T.drop);
const BOUNCE_END = DROP_LAND + 0.2;
const bTop = (b: BState, dx = 0) => ({x: centreOf(b).x + dx, y: topAt(b, centreOf(b).x + dx)});
const commaB = (t: number) => bowlB(t, BOWL[3], 3);
const roundB = (t: number) => bowlB(t, BOWL[2], 2);

function phageAt(t: number) {
  let p: Pt = {x: 0, y: 0};
  let rot = 0;
  let sy = 1;
  let vis = true;
  const land = (t0: number, a = -0.13) => A.spring(t, t0, a, 3.5, 8);
  if (t < T.hop1) p = palmAt(t);
  else if (t < T.land1) {
    p = A.hop(t, T.hop1, T.land1, palmAt(T.hop1), bTop(rodA(T.land1), -20), 150);
    rot = -10 * Math.sin(Math.PI * A.inv(T.hop1, T.land1, t));
  } else if (t < T.pop1) {
    p = bTop(rodA(t), -20);
    sy += land(T.land1) - 0.16 * A.bump(t, T.pump1, 0.07) - 0.16 * A.bump(t, T.pump2, 0.07);
  } else if (t < T.landHead) {
    const h = A.hop(t, T.pop1, T.landHead, bTop(rodA(T.pop1 - 0.001), -20), headTopAt(T.landHead), 230);
    p = h;
    rot = 360 * h.u;
  } else if (t < T.boing) {
    p = headTopAt(t);
    sy += land(T.landHead, -0.1) - 0.22 * A.bump(t, T.jab, 0.07);
  } else if (t < T.palm1) {
    const h = A.hop(t, T.boing, T.palm1, headTopAt(T.boing), palmAt(T.palm1), 130);
    p = h;
    rot = -360 * h.u;
  } else if (t < T.shrug) {
    p = palmAt(t);
    sy += land(T.palm1);
  } else if (t < T.hopShrug1) {
    p = A.hop(t, T.shrug, T.hopShrug1, palmAt(T.shrug - 0.001), guyPt(T.hopShrug1, S.guy_shrug.palmL!), 70);
  } else if (t < T.flash1) {
    p = guyPt(t, S.guy_shrug.palmL!);
    sy += land(T.hopShrug1, -0.1);
  } else if (t < T.flash2) vis = false;
  else if (t < T.hopA) p = palmAt(t);
  else if (t < T.landA) {
    p = A.hop(t, T.hopA, T.landA, palmAt(T.hopA), bTop(commaB(T.landA)), 200);
    rot = -12 * Math.sin(Math.PI * A.inv(T.hopA, T.landA, t));
  } else if (t < T.boingA) {
    p = bTop(commaB(t));
    sy += land(T.landA) - 0.2 * A.bump(t, T.jabA, 0.06);
  } else if (t < T.landB) {
    const h = A.hop(t, T.boingA, T.landB, bTop(commaB(T.boingA)), bTop(roundB(T.landB)), 170);
    p = h;
    rot = -360 * h.u;
  } else if (t < T.boingB) {
    p = bTop(roundB(t));
    sy += land(T.landB) - 0.2 * A.bump(t, T.jabB, 0.06);
  } else if (t < T.hover) {
    const h = A.hop(t, T.boingB, T.hover, bTop(roundB(T.boingB)), HOVER, 120);
    p = h;
    rot = 25 * Math.sin(TAU * h.u);
  } else if (t < T.dive) {
    p = {x: HOVER.x, y: HOVER.y + 12 * Math.sin(TAU * 1.3 * (t - T.hover))};
    rot = 5 * Math.sin(TAU * 0.9 * (t - T.hover));
  } else if (t < T.match) {
    const p0 = {x: HOVER.x, y: HOVER.y + 12 * Math.sin(TAU * 1.3 * (T.dive - T.hover))};
    p = A.hop(t, T.dive, T.match, p0, bTop(rodL(T.match)), 80);
    rot = -15 * Math.sin(Math.PI * A.inv(T.dive, T.match, t));
  } else if (t < T.popL) {
    p = bTop(rodL(t));
    sy += land(T.match);
  } else if (t < T.palmBack) {
    const h = A.hop(t, T.popL, T.palmBack, bTop(rodL(T.popL - 0.001)), palmAt(T.palmBack), 420);
    p = h;
    rot = 360 * h.u;
  } else if (t < T.drop) {
    p = palmAt(t);
    sy += land(T.palmBack);
  } else if (t < DROP_LAND) {
    p = A.fall(t, T.drop, dropFrom(), DROP_G, FLOOR, DROP_VX);
    rot = 10 * A.inv(T.drop, DROP_LAND, t);
  } else if (t < BOUNCE_END) {
    const f = {x: DROP_X, y: FLOOR};
    p = A.hop(t, DROP_LAND, BOUNCE_END, f, f, 26);
    rot = 10 * (1 - A.inv(DROP_LAND, BOUNCE_END, t));
    sy += land(DROP_LAND, -0.2);
  } else if (t < T.hopUp0) {
    p = {x: DROP_X, y: FLOOR};
    sy += land(BOUNCE_END, -0.1);
  } else if (t < T.palmEnd) {
    p = A.hop(t, T.hopUp0, T.palmEnd, {x: DROP_X, y: FLOOR}, palmAt(T.palmEnd), 110);
  } else {
    p = palmAt(t);
    sy += land(T.palmEnd);
  }
  return {vis, p, rot, sy, face: phageFace(t)};
}

function phageFace(t: number): FaceP {
  if (t < T.eyesOpen) return {lid: 1, mouth: 'smile'};
  if (t < T.hop1) {
    const pop = 0.6 + 0.4 * A.popIn(t, T.eyesOpen, 0.3);
    return {pop, mouth: 'smile', look: t > 2.1 ? [-0.8, 0.4] : [0, 0.1], brow: t > 2.15 ? 1 : 0, browAngle: 18};
  }
  if (t < T.pop1) return {brow: 1, browAngle: 18, lid: 0.15, lidTilt: 10, mouth: 'grin', look: [-0.3, 0.8]};
  if (t < T.landHead) return {happyEyes: true, mouth: 'happy'};
  if (t < T.boing) return {brow: 1, browAngle: 18, lid: 0.15, lidTilt: 10, mouth: 'grin', look: [0, 0.9]};
  if (t < T.shrug) return {brow: 1, browAngle: -18, browRaise: 0.4, mouth: 'wavy', look: [0.6, -0.8]};
  if (t < T.pillIn + 0.1) return {mouth: 'smile', look: [0, 0.1]};
  if (t < T.flash1) return {brow: 1, browAngle: 16, lid: 0.3, lidTilt: 10, mouth: 'flat', look: [1, -0.2]};
  if (t < T.hopA) return {mouth: 'smile', look: [-0.7, 0.2]};
  if (t < T.boingA) return {brow: 1, browAngle: 18, lid: 0.15, lidTilt: 10, mouth: 'grin', look: [-0.4, 0.8]};
  if (t < T.landB) return {brow: 1, browAngle: -18, browRaise: 0.4, mouth: 'wavy', look: [0.3, -0.6]};
  if (t < T.boingB) return {brow: 1, browAngle: 14, mouth: 'flat', look: [0, 0.9]};
  if (t < T.hover) return {brow: 1, browAngle: -18, browRaise: 0.4, mouth: 'wavy', look: [0.3, -0.6]};
  if (t < 16.55) {
    const look: [number, number] = t < 15.6 ? [0.6, 0.7] : t < 16.2 ? [1, 0.4] : [-0.9, 0.7];
    return {brow: 1, browAngle: -6, browRaise: 0.3, mouth: 'flat', look};
  }
  if (t < T.match) return {brow: 1, browAngle: 20, lid: 0.15, lidTilt: 12, mouth: 'grin', look: [-0.5, 0.9]};
  if (t < T.palmBack + 0.3) return {happyEyes: true, mouth: 'happy'};
  if (t < T.drop) {
    const px = pillAt(t);
    const lx = px.vis ? A.clamp((px.x - palmAt(t).x) / 700, -1, 1) : -0.3;
    return {mouth: 'smile', look: [lx, 0.4]};
  }
  if (t < DROP_LAND) return {pop: 1.2, brow: 1, browAngle: -18, browRaise: 0.8, mouth: 'o', look: [0.5, -0.9]};
  if (t < 24.3) return {lid: 0.3, brow: 1, browAngle: -20, browRaise: 0.5, mouth: 'frown', look: [0.5, -0.8]};
  if (t < 26.45) return {lid: 0.3, brow: 1, browAngle: -20, browRaise: 0.5, mouth: 'frown', look: [-1, -0.2]};
  if (t < T.palmEnd) return {brow: 1, browAngle: 22, lid: 0.1, lidTilt: 10, mouth: 'flat', look: [0.6, -0.9]};
  return {brow: 1, browAngle: 22, lid: 0.15, lidTilt: 12, mouth: 'grin', look: [-1, 0.2]};
}

// ------------------------------------------------------------------ mini phages + puffs
type Burst = {t0: number; at: () => Pt};
const MINI_BURSTS: Burst[] = [
  {t0: T.pop1, at: () => centreOf(rodA(T.pop1 - 0.001))},
  {t0: T.popL, at: () => centreOf(rodL(T.popL - 0.001))},
];
type PuffE = {t0: number; at: () => Pt; size: number; fill: string};
const PALE: Record<string, string> = {bact_rod: '#dff3c2', bact_round: '#ffe3c4', bact_comma: '#ffd6ea'};
const PUFFS: PuffE[] = [
  {t0: T.pop1, at: () => centreOf(rodA(T.pop1 - 0.001)), size: 125, fill: PALE.bact_rod},
  {t0: T.poof, at: () => PILL_HOVER, size: 80, fill: '#ffffff'},
  {t0: T.popL, at: () => centreOf(rodL(T.popL - 0.001)), size: 125, fill: PALE.bact_rod},
  ...BOWL.map((b, i) => ({t0: HIT[b.id] + POP_AFTER_HIT, at: () => centreOf(bowlB(HIT[b.id] + POP_AFTER_HIT - 0.001, b, i)), size: 95 * b.k, fill: PALE[b.name]})),
];

const CUE_LIST = cues(BOWL.map((b) => HIT[b.id]), POP_AFTER_HIT, DROP_LAND);

// ------------------------------------------------------------------ drawing helpers
const BactSprite: React.FC<{b: BState; t: number}> = ({b, t}) => {
  if (!b.vis || b.s <= 0.001) return null;
  const m = S[b.name];
  const f = m.face!;
  const ax = b.air ? f[0] : m.w / 2;
  const ay = b.air ? f[1] : m.bottom!;
  const lid = shade(m.body ?? '#cccccc', 0.85);
  return (
    <Spr name={b.name} x={b.x} y={b.y} ax={ax} ay={ay} s={b.s} sx={b.sx} sy={b.sy} rot={b.rot}>
      <Face id={b.id} cx={f[0]} cy={f[1]} r={f[2]} ink={INK_W / b.s} lidColor={lid} {...b.face} />
      {b.sweat ? <Sweat t={t} t0={b.sweat[0]} t1={b.sweat[1]} x={f[0] + f[2] * 0.8} y={f[1] - f[2] * 0.6} size={f[2] * 0.3} ink={INK_W / b.s} slide={0.4} /> : null}
    </Spr>
  );
};

export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `rgb(${c.join(',')})`;
}

// ------------------------------------------------------------------ composition
export const Phages: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t, C0, SHOTS);
  const k = kOf(cam.z);
  const sh = A.shake(t, SHAKES);
  const sepia = t >= T.flash1 && t < T.flash2;
  const farBlur = 3.2 * A.clamp((k - 1.05) / 0.3);

  const g = guyAt(t);
  const gm = S[g.pose];
  const ph = phageAt(t);
  const pm = S.phage;
  const pf = pm.face!;
  const pdFeet = (pm.feet![1] - pm.h / 2) * PS; // feet -> centre distance
  const pc = {x: ph.p.x, y: ph.p.y - pdFeet * ph.sy};
  const pill = pillAt(t);

  const bacteria: BState[] = [rodA(t), rodL(t), ...BOWL.map((b, i) => bowlB(t, b, i)), tough(t)];

  const shadows: React.ReactNode[] = [];
  for (const b of bacteria) {
    if (!b.vis) continue;
    if (b.air) {
      const o = A.clamp(1 - (FLOOR - b.y) / 500);
      shadows.push(<Shadow key={`s-${b.id}`} x={b.x} y={FLOOR} w={BW[b.name] * 0.6 * o} o={o} />);
    } else shadows.push(<Shadow key={`s-${b.id}`} x={centreOf(b).x} y={FLOOR} w={S[b.name].w * b.s * 0.85 * b.sx} />);
  }
  shadows.push(<Shadow key="s-guy" x={GUY_X + g.dx} y={FLOOR} w={270 * g.sx} />);
  if (ph.vis) {
    const o = A.clamp(1 - (FLOOR - ph.p.y) / 350);
    if (o > 0) shadows.push(<Shadow key="s-phage" x={ph.p.x} y={FLOOR} w={115 * o} o={o} />);
  }
  if (pill.vis && FLOOR - pill.y < 300) shadows.push(<Shadow key="s-pill" x={pill.x} y={FLOOR} w={PILL_W * 0.8 * A.clamp(1 - (FLOOR - pill.y - PILL_H / 2) / 300)} />);

  const minis: React.ReactNode[] = [];
  MINI_BURSTS.forEach((bu, bi) => {
    const tau = t - bu.t0;
    if (tau < 0 || tau > 0.9) return;
    const c = bu.at();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42 + (A.rand(bi * 10 + i) - 0.5) * 0.25;
      const v = 650 + A.rand(bi * 20 + i) * 350;
      const x = c.x + Math.cos(a) * v * tau;
      const y = c.y + Math.sin(a) * v * tau + 0.5 * 1800 * tau * tau;
      const shrink = 1 - A.clamp((tau - 0.5) / 0.4);
      const sc = PS * 0.32 * A.popIn(t, bu.t0, 0.15) * shrink;
      if (sc > 0.002) minis.push(<Spr key={`m${bi}-${i}`} name="phage" x={x} y={y} ax={pm.w / 2} ay={pm.h / 2} s={sc} rot={(i % 2 ? 1 : -1) * 500 * tau} />);
    }
  });

  return (
    <AbsoluteFill style={{background: '#e6f2ea'}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`, filter: sepia ? 'sepia(0.9) saturate(0.8) contrast(1.12) brightness(0.97)' : undefined}}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #eef6ef 0%, #dcefe3 60%, #d3eadb 100%)'}} />
        <Layer cam={cam} z={3000} blur={farBlur}>
          {[-1300, 1700].map((x) => (
            <Spr key={x} name="lab_bg" x={x} y={HORIZON_Y + 4} ax={S.lab_bg.w / 2} ay={S.lab_bg.h} s={LAB_W / S.lab_bg.w} />
          ))}
          <div style={{position: 'absolute', left: -20000, top: HORIZON_Y, width: 40000, height: 20000, background: '#efe4cf', borderTop: '9px solid #111'}} />
        </Layer>
        <Layer cam={cam} z={1000}>
          {shadows}
          {bacteria.map((b) => (
            <BactSprite key={b.id} b={b} t={t} />
          ))}
          {pill.vis && pill.k > 0.001 ? (
            <Spr name="pill" x={pill.x} y={pill.y} ax={S.pill.w / 2} ay={S.pill.h / 2} s={PILL_S * pill.k} sx={pill.sx} sy={pill.sy} rot={pill.rot}>
              <Face id="pill" cx={S.pill.face![0]} cy={S.pill.face![1]} r={S.pill.face![2] * 1.15} ink={INK_W / PILL_S} lidColor="#d94848" spread={0.5} eyeSize={0.8} mouthY={0.38} {...pill.face} />
            </Spr>
          ) : null}
          <Spr name={g.pose} x={GUY_X + g.dx} y={FLOOR + g.dy} ax={gm.feet![0]} ay={gm.feet![1]} s={g.s} sx={g.sx} sy={g.sy}>
            {g.pose === 'guy_scared' ? (
              <Sweat t={t} t0={T.scared + 0.1} t1={T.present - 0.05} x={gm.head![0] + gm.head![2] * 0.78} y={gm.head![1] - gm.head![2] * 0.45} size={gm.head![2] * 0.28} ink={INK_W / g.s} />
            ) : null}
          </Spr>
          {ph.vis ? (
            <Spr name="phage" x={pc.x} y={pc.y} ax={pm.w / 2} ay={pm.h / 2} s={PS} sx={2 - ph.sy} sy={ph.sy} rot={ph.rot}>
              <Face id="phage" cx={pf[0]} cy={pf[1]} r={pf[2]} ink={INK_W / PS} lidColor={shade(pm.body ?? '#c8b4f0', 0.85)} spread={0.34} {...ph.face} />
              <Sweat t={t} t0={4.62} t1={5.4} x={pf[0] + pf[2] * 0.75} y={pf[1] - pf[2] * 0.55} size={pf[2] * 0.28} ink={INK_W / PS} />
            </Spr>
          ) : null}
          {minis}
          <WorldSvg>
            {PUFFS.map((pu, i) => {
              if (t < pu.t0 || t > pu.t0 + 0.8) return null;
              const c = pu.at();
              return <Puff key={i} t={t} t0={pu.t0} x={c.x} y={c.y} size={pu.size} fill={pu.fill} seed={i * 13} />;
            })}
            {t >= T.match && t < T.match + 0.5 ? <Ring t={t} t0={T.match} x={bTop(rodL(T.match)).x} y={bTop(rodL(T.match)).y - 10} size={120} /> : null}
          </WorldSvg>
        </Layer>
      </AbsoluteFill>
      <Film frame={frame} on={sepia} />
      <Flash t={t} at={[T.flash1, T.flash2]} />
      <Sound list={CUE_LIST} />
    </AbsoluteFill>
  );
};
