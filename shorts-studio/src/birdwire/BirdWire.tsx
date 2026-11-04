import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {A, DURATION, T} from './timing';
import {
  BIRD_X,
  EAGLE_X,
  FPS,
  INK,
  WireId,
  bump,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  mulberry32,
  popIn,
  popOut,
  popWindow,
  imp,
  seg,
  step,
  wireBase,
  POLE_X,
  SPAN,
} from './util';
import {Bird, BirdPose, Bolt, Dot, Eagle, EaglePose, Equals, Feather, Note, Pole, Puffs, Spark, Sweat, eagleWingTip} from './art';
import {Clouds, FarHills, Layer, NearHills, Sky} from './Scenery';
import {Sound} from './Sound';

// ---------------------------------------------------------------- keyframe helper (eased between points, holds = repeated values)
type KF = [number, number][];
const kf = (t: number, pts: KF, ease = easeInOutCubic) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return t1 === t0 ? v1 : lerp(v0, v1, ease(seg(t, t0, t1)));
  }
  return pts[pts.length - 1][1];
};

// ---------------------------------------------------------------- camera
type Key = {t: number; x: number; y: number; k: number};
const C0 = {x: 560, y: 1030, k: 2.45}; // frame 0 = last frame (loop)
const CAM: Key[] = [
  {t: 0, ...C0},
  {t: T.power - 0.1, ...C0},
  {t: T.l1end, x: 565, y: 1045, k: 1.85},
  {t: T.feet - 0.05, x: 560, y: 1072, k: 2.75},
  {t: T.l2end + 0.12, x: 560, y: 1072, k: 2.75},
  {t: T.current + 0.32, x: 640, y: 880, k: 1.0},
  {t: T.l3end - 0.25, x: 640, y: 880, k: 1.0},
  {t: T.feet2 + 0.3, x: 560, y: 1080, k: 2.6},
  {t: T.flows + 0.15, x: 560, y: 1080, k: 2.6},
  {t: T.but + 0.3, x: 660, y: 905, k: 1.08},
  {t: T.wing, x: 660, y: 905, k: 1.08},
  {t: A.touch - 0.05, x: 700, y: 885, k: 1.2},
  {t: A.zap + 0.6, x: 700, y: 885, k: 1.2},
  {t: T.eagles + 0.2, x: 700, y: 935, k: 1.32},
  {t: A.loopBack, x: 700, y: 935, k: 1.32},
  {t: A.loopBack + 1.0, ...C0},
  {t: 999, ...C0},
];
const cameraAt = (t: number) => {
  for (let i = 0; i < CAM.length - 1; i++) {
    const a = CAM[i];
    const b = CAM[i + 1];
    if (t <= b.t) {
      const u = easeInOutCubic(seg(t, a.t, b.t));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))};
    }
  }
  return C0;
};

const shakeAt = (t: number) => {
  let a = 0;
  if (t > A.zap) a += 26 * Math.exp(-3.4 * (t - A.zap)) * (t < A.zapEnd ? 1 : Math.exp(-6 * (t - A.zapEnd)));
  if (t > A.eagleLand) a += 9 * Math.exp(-8 * (t - A.eagleLand));
  if (t > A.poof) a += 6 * Math.exp(-9 * (t - A.poof));
  const w = 2 * Math.PI;
  return {
    x: a * (Math.sin(w * 13.3 * t) + 0.5 * Math.sin(w * 7.1 * t + 1.3)) * 0.67,
    y: a * (Math.cos(w * 11.7 * t) + 0.5 * Math.sin(w * 5.3 * t + 2.1)) * 0.67,
  };
};

// ---------------------------------------------------------------- wire with the eagle's weight on it
const onWire = (t: number) => t >= A.eagleLand && t < A.takeoff + 0.12;
const lowDip = (t: number) => {
  // weight of the eagle (smooth on/off) + a springy bounce on landing and on take-off
  let d = 12 * (step(t, A.eagleLand, A.eagleLand + 0.08) - step(t, A.takeoff + 0.08, A.takeoff + 0.2));
  d += 30 * imp(t, A.eagleLand, 2.8, 3.0);
  d -= 16 * imp(t, A.takeoff + 0.1, 3.0, 3.6);
  return d;
};
const wireY = (w: WireId, x: number, t: number) => {
  const b = wireBase(w, x);
  if (w !== 'low') return b;
  const g = Math.exp(-Math.pow((x - EAGLE_X) / 330, 2));
  return b + g * lowDip(t);
};

// ---------------------------------------------------------------- the zip spark (one character, several appearances)
type SparkState = {x: number; y: number; s: number; lookX: number; lookY: number; grin: number; vx: number; squash: number} | null;
const bez = (p0: number[], c: number[], p1: number[], u: number) => [
  (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0],
  (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1],
];
const RING_X = 430;

const EAGLE_TOUCH = (() => {
  // wing angle where the right wing tip meets the upper wire (eagle standing still on the wire)
  const fy = wireBase('low', EAGLE_X) + 12;
  let lo = -179;
  let hi = -60;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    const tip = eagleWingTip(m);
    const below = fy + tip.y > wireBase('up', EAGLE_X + tip.x); // screen y grows downwards
    if (below) hi = m; // not high enough yet: raise more (more negative angle)
    else lo = m;
  }
  return hi;
})();

const sparkAt = (t: number): SparkState => {
  // L1: rides the lower wire under the bird's feet
  if (t > T.power + 0.1 && t < T.l1end + 0.35) {
    const v = 620;
    const x = BIRD_X + (t - A.zipPass) * v;
    return {x, y: wireY('low', x, t), s: 0.9, lookX: t > A.zipPass - 0.12 && t < A.zipPass + 0.2 ? 0.3 : 1, lookY: t > A.zipPass - 0.12 && t < A.zipPass + 0.2 ? -1 : 0, grin: 0.6, vx: v, squash: 1};
  }
  // L3: "current" - pops up, walks to the spot, runs along the dotted path to the other wire
  if (t > T.current - 0.02 && t < T.l3end + 0.1) {
    const s = 1.3 * (t < T.l3end - 0.25 ? popIn(t, T.current - 0.02, 0.26) : popOut(t, T.l3end - 0.25, 0.18));
    const walk = step(t, T.goes, T.goes + 0.7);
    const run = step(t, T.voltages - 0.03, T.voltages + 0.38, easeInOutCubic);
    if (run <= 0) {
      const x = lerp(300, RING_X, walk);
      const hop = 18 * bump(t, T.current + 0.15, T.current + 0.42);
      return {x, y: wireY('low', x, t) - hop, s, lookX: walk > 0 && walk < 1 ? 1 : 0.3, lookY: 0, grin: 0.8, vx: walk > 0 && walk < 1 ? 300 : 0, squash: 1 - 0.12 * bump(t, T.current + 0.4, T.current + 0.6)};
    }
    const A0 = [RING_X, wireY('low', RING_X, t)];
    const B0 = [RING_X, wireY('up', RING_X, t)];
    const p = bez(A0, [300, (A0[1] + B0[1]) / 2], B0, run);
    const jump = run >= 1 ? 22 * bump(t, T.voltages + 0.4, T.voltages + 0.7) : 0;
    return {x: p[0], y: p[1] - jump, s, lookX: 0, lookY: run < 1 ? -1 : 0, grin: 1, vx: run > 0 && run < 1 ? -900 : 0, squash: 1};
  }
  // L4: comes along the lower wire, stops under the feet, looks up, shrugs, leaves
  if (t > T.so - 0.4 && t < T.l4end) {
    const tin = T.so - 0.35;
    const tstop = T.so + 0.15;
    const tgo = T.really + 0.05;
    let x: number;
    let vx = 0;
    if (t < tstop) {
      x = lerp(250, BIRD_X, easeOutCubic(seg(t, tin, tstop)));
      vx = 700;
    } else if (t < tgo) x = BIRD_X;
    else {
      x = lerp(BIRD_X, 1000, easeInCubic(seg(t, tgo, tgo + 0.55)));
      vx = 900;
    }
    const up = t > tstop + 0.05 && t < tgo;
    return {x, y: wireY('low', x, t), s: 0.9, lookX: up ? 0 : 1, lookY: up ? -1 : 0, grin: up ? 0 : 0.5, vx: t < tstop || t > tgo ? vx : 0, squash: 1 - 0.16 * bump(t, T.nothing + 0.05, T.nothing + 0.35)};
  }
  // L5: on the upper wire, waits next to the wing tip, dives in when it touches
  if (t > T.another - 0.05 && t < A.zap + 0.04) {
    const tipX = EAGLE_X + eagleWingTip(EAGLE_TOUCH).x;
    const wait = tipX - 52;
    const s = 1.2 * popIn(t, T.another - 0.05, 0.25) * (t > A.zap - 0.02 ? 0 : 1);
    if (t < A.zipDive) {
      const x = lerp(430, wait, easeOutCubic(seg(t, T.another, T.wire2 + 0.25)));
      const lookPole = t > T.pole - 0.05 && t < T.pole + 0.45;
      return {x, y: wireY('up', x, t), s, lookX: lookPole ? -1 : 1, lookY: lookPole ? 0 : 0.4, grin: t > A.touch ? 1 : 0.2, vx: t < T.wire2 + 0.15 ? 500 : 0, squash: 1 - 0.15 * bump(t, A.touch, A.touch + 0.2)};
    }
    // dive: from its spot into the wing tip, then down the wing to the body
    const tip = eagleWingTip(EAGLE_TOUCH);
    const fy = wireBase('low', EAGLE_X) + 12;
    const p0 = [wait, wireY('up', wait, t)];
    const p1 = [EAGLE_X + tip.x, fy + tip.y];
    const p2 = [EAGLE_X + 40, fy - 170];
    const u1 = step(t, A.zipDive, A.zipDive + 0.18, easeInCubic);
    const u2 = step(t, A.zipDive + 0.18, A.zap, easeInOutCubic);
    const p = u2 <= 0 ? [lerp(p0[0], p1[0], u1), lerp(p0[1], p1[1], u1) - 30 * Math.sin(Math.PI * u1)] : [lerp(p1[0], p2[0], u2), lerp(p1[1], p2[1], u2)];
    return {x: p[0], y: p[1], s: s * (1 - 0.3 * u2), lookX: 0, lookY: 1, grin: 1, vx: 800, squash: 1};
  }
  return null;
};

// ---------------------------------------------------------------- small bird
const blinks = [0.85, 3.47, 6.1, 9.05, 11.55, 16.0, 20.15];
const birdPoseAt = (t: number): {pose: BirdPose; hop: number; sx: number; sy: number; rot: number} => {
  const spark = sparkAt(t);
  let lookX = 0;
  let lookY = 0.1;
  const follow = (lx: number, ly: number) => {
    lookX = lx;
    lookY = ly;
  };
  if (t > T.power + 0.15 && t < T.l1end - 0.05 && spark) follow(clamp((spark.x - BIRD_X) / 160, -1, 1), 0.85);
  else if (t >= A.bootsOn && t < A.bootsOff + 0.1) follow(0, 0.95);
  else if (t >= A.footUp && t < T.l2end + 0.05) follow(0.55, 0.9);
  else if (t >= T.current && t < T.voltages) follow(-0.75, 0.25);
  else if (t >= T.voltages && t < T.l3end) follow(-0.7, -0.5);
  else if (t >= T.l3end && t < T.so - 0.1) follow(0, 0.95);
  else if (t >= T.so - 0.1 && t < T.really + 0.1 && spark) follow(clamp((spark.x - BIRD_X) / 160, -1, 1), 0.95);
  else if (t >= A.eagleIn - 0.1 && t < A.eagleLand) follow(0.85, -0.6);
  else if (t >= A.eagleLand && t < A.wingStart) follow(1, -0.25);
  else if (t >= A.wingStart && t < A.zap) follow(0.75, -0.9);
  else if (t >= A.zap + 0.55 && t < A.takeoff) follow(1, -0.2);
  else if (t >= A.takeoff && t < T.danger - 0.05) follow(0.9, -0.9);

  let open = 1;
  for (const b of blinks) open = Math.min(open, 1 - bump(t, b, b + 0.15) * 1.2);
  if (t > T.so + 0.25 && t < T.l4end - 0.05) open = Math.min(open, 0.55); // smug
  const squeeze = (t > A.zipPass - 0.03 && t < A.zipPass + 0.32) || (t > A.zap && t < A.zap + 0.55);

  const brow = kf(t, [
    [0, 0],
    [T.so + 0.2, 0],
    [T.so + 0.35, 3],
    [T.l4end, 3],
    [A.eagleLand, 0],
    [A.wingStart, 0],
    [A.wingStart + 0.3, -7],
    [A.zap, -9],
    [T.l6end, -7],
    [A.loopBack + 0.7, 0],
  ]);
  const browUp = kf(t, [
    [A.zipPass + 0.3, 0],
    [A.zipPass + 0.38, 12],
    [A.bootsOn, 12],
    [A.bootsOn + 0.2, 0],
    [A.eagleLand - 0.05, 0],
    [A.eagleLand + 0.05, 12],
    [A.eagleLand + 0.5, 2],
    [A.zap + 0.5, 2],
    [A.zap + 0.6, 12],
    [T.l6end, 12],
    [A.loopBack + 0.7, 0],
  ]);
  const beak = Math.max(
    0.6 * bump(t, T.bird, T.bird + 0.22),
    0.35 * bump(t, T.flows - 0.15, T.l4end) * (0.6 + 0.4 * Math.sin(t * 40)),
    0.85 * bump(t, A.zap, A.zap + 0.55),
    0.4 * bump(t, T.danger, T.l6end + 0.15),
  );
  const wings = Math.max(
    55 * bump(t, A.bootsOff + 0.12, A.bootsOff + 0.42), // shrug
    40 * bump(t, A.eagleLand, A.eagleLand + 0.45) * Math.abs(Math.sin((t - A.eagleLand) * 22)),
    75 * bump(t, A.zap, A.zap + 0.6),
  );
  const footLift = kf(t, [
    [A.footUp, 0],
    [A.footUp + 0.17, 1],
    [T.l2end - 0.02, 1],
    [T.l2end + 0.14, 0],
  ]);
  const hop = -16 * bump(t, T.bird - 0.02, T.bird + 0.2) - 34 * bump(t, A.eagleLand, A.eagleLand + 0.34);
  const breath = Math.round(0.6 * DURATION) / DURATION; // whole cycles -> seamless loop
  let sy = 1 + 0.009 * Math.sin(2 * Math.PI * breath * t);
  for (const [te, amp] of [
    [T.bird + 0.2, 0.06],
    [A.eagleLand + 0.34, 0.08],
    [A.zipPass, 0.05],
    [A.zap, 0.06],
  ] as [number, number][])
    sy -= amp * Math.max(0, imp(t, te, 3.5, 7));
  const sx = 1 + (1 - sy) * 0.8;
  const rot = -9 * kf(t, [
    [A.zap, 0],
    [A.zap + 0.1, 1],
    [T.big, 1],
    [T.big + 0.5, 0.3],
    [T.l6end, 0.3],
    [A.loopBack + 0.6, 0],
  ]);
  const tuft = clamp(kf(t, [[A.zap, 0], [A.zap + 0.08, 1], [A.poof + 0.4, 1], [T.big + 0.4, 0.3], [A.loopBack + 0.5, 0]]) + 0.5 * Math.max(0, imp(t, A.eagleLand + 0.34, 4, 6)), 0, 1.2);
  return {
    pose: {
      eyes: {open, lookX, lookY, squeeze},
      brow,
      browUp,
      beak,
      wingL: wings,
      wingR: wings,
      footLift,
      toeWiggle: (t - A.footUp) * 20,
      boots: popWindow(t, A.bootsOn, A.bootsOff, 0.22, 0.12),
      tuft,
    },
    hop,
    sx,
    sy,
    rot,
  };
};

// ---------------------------------------------------------------- eagle
const eagleAt = (t: number): {x: number; y: number; rot: number; sx: number; sy: number; pose: EaglePose; tx: number} | null => {
  if (t < A.eagleIn || t > A.takeoff + 0.85) return null;
  const fy = wireY('low', EAGLE_X, t);
  let x = EAGLE_X;
  let y = fy;
  let rot = 0;
  let wingL = 6;
  let wingR = 6;
  const flap = (f: number, a: number) => -100 + a * Math.sin(2 * Math.PI * f * t);
  if (t < A.eagleLand) {
    const u = seg(t, A.eagleIn, A.eagleLand);
    const uu = 1 - (1 - u) * (1 - u);
    const p = bez([1460, 230], [1250, 640], [EAGLE_X, fy], uu);
    x = p[0];
    y = p[1];
    rot = lerp(-16, 0, uu);
    wingL = wingR = flap(4.5, 38);
  } else if (t > A.takeoff) {
    const u = easeInCubic(seg(t, A.takeoff, A.takeoff + 0.8));
    x = lerp(EAGLE_X, 1560, u) + 40 * Math.sin((t - A.takeoff) * 9);
    y = lerp(fy, 150, u);
    rot = 10 * Math.sin((t - A.takeoff) * 11);
    wingL = wingR = lerp(6, flap(6, 45), easeOutCubic(seg(t, A.takeoff, A.takeoff + 0.14)));
  } else {
    const fold = easeOutBack(seg(t, A.eagleLand, A.eagleLand + 0.38), 1.6);
    const wLand = -100 + 38 * Math.sin(2 * Math.PI * 4.5 * A.eagleLand);
    wingL = wingR = lerp(wLand, 6, fold);
    // the stretch: right wing up towards the upper wire
    const near = EAGLE_TOUCH + 10;
    if (t > A.wingStart) {
      wingR = kf(t, [
        [A.wingStart, 6],
        [A.wingNear, near],
        [T.circuit, near],
        [A.touch, EAGLE_TOUCH],
      ]);
      wingL = kf(t, [
        [A.wingStart, 6],
        [A.wingNear, -24],
      ]);
    }
    if (t > A.poof + 0.12) {
      wingR = 6;
      wingL = 6 + 4 * Math.sin(t * 5);
    }
    if (t > A.poof + 0.2) rot = 4 * Math.sin(2 * Math.PI * 0.9 * (t - A.poof));
  }
  const zapping = t > A.zap && t < A.zapEnd;
  const tx = zapping ? 5 * Math.sin(2 * Math.PI * 23 * t) : 0;
  const ty = zapping ? 4 * Math.sin(2 * Math.PI * 19 * t + 1) : 0;
  let sy = 1 + 0.01 * Math.sin(2 * Math.PI * 0.55 * t + 1);
  sy -= 0.12 * Math.max(0, imp(t, A.eagleLand, 3.2, 6));
  sy += 0.04 * bump(t, A.wingStart, A.wingNear + 0.6) * (t < A.zap ? 1 : 0);
  const sx = 1 + (1 - sy) * 0.7;

  const after = t > A.poof + 0.12;
  let open = 1;
  for (const b of [14.6, 19.9]) open = Math.min(open, 1 - bump(t, b, b + 0.15) * 1.2);
  if (t > A.wingStart + 0.1 && t < A.wingNear + 0.2) open = 0; // eyes shut, enjoying the stretch
  else if (t >= A.wingNear + 0.2 && t < A.touch) open = 0.55; // sleepy
  const lookX = t < A.eagleLand ? -0.6 : t < A.wingStart ? -0.9 : t < A.touch ? 0.2 : 0.7;
  const lookY = t < A.wingStart ? 0.2 : t < A.touch ? -0.2 : -0.8;
  const beak = Math.max(
    0.9 * bump(t, A.wingStart + 0.1, A.wingNear + 0.15), // yawn
    1.0 * bump(t, A.zap, A.zapEnd),
    0.7 * bump(t, A.cough, A.cough + 0.28),
    0.25 * (after && t < A.cough ? 1 : 0),
  );
  const pose: EaglePose = {
    eyes: {open: after ? 1 : open, lookX, lookY, spiral: after ? (t - A.poof) * 7 : undefined, squeeze: false},
    brow: after ? -4 : t < A.wingStart ? 6 : 0,
    beak,
    wingL,
    wingR,
    frizz: after ? 1 : 0,
    skeleton: t > A.zap + 0.04 && t < A.zap + 0.34,
    glow: zapping ? 0.7 + 0.3 * Math.sin(t * 60) : 0,
  };
  return {x: x + tx, y: y + ty, rot, sx, sy, pose, tx};
};

// ---------------------------------------------------------------- composition
export const BirdWire: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = cameraAt(t);
  const cam = {x: c.x, y: c.y, z: 1000 - 1000 / c.k};
  const shake = shakeAt(t);
  const dof = clamp((c.k - 1.35) / 1.1) * 3.2;

  // wires: dashes travel along both wires (speed chosen so the loop is seamless)
  const spacing = 240;
  const speed = (spacing * Math.round((DURATION * 150) / spacing)) / DURATION;
  const wirePath = (w: WireId) => {
    let d = '';
    for (let x = -1800; x <= 3900; x += 20) d += `${x === -1800 ? 'M' : 'L'}${x},${wireY(w, x, t).toFixed(1)}`;
    return d;
  };
  const dashes = (w: WireId, ph: number) => {
    const off = ((t * speed + ph) % spacing) - spacing;
    const out: React.ReactNode[] = [];
    for (let x = -1200 + off; x < 3000; x += spacing) {
      out.push(<line key={w + x} x1={x - 13} y1={wireY(w, x - 13, t)} x2={x + 13} y2={wireY(w, x + 13, t)} stroke="#FFE04A" strokeWidth={4} strokeLinecap="round" />);
    }
    return out;
  };

  const bird = birdPoseAt(t);
  const birdY = wireY('low', BIRD_X, t) + bird.hop;
  const eagle = eagleAt(t);
  const spark = sparkAt(t);
  const R = mulberry32(Math.floor(t * 15) + 5);

  // L3 dots + dotted path
  const yA = wireY('low', RING_X, t);
  const yB = wireY('up', RING_X, t);
  const l3Out = T.l3end - 0.25;
  const dotA = popWindow(t, T.two, l3Out);
  const dotB = popWindow(t, T.spots, l3Out);
  const path = step(t, T.different, T.different + 0.45, easeOutCubic);
  const pathS = t < l3Out ? 1 : popOut(t, l3Out, 0.16);
  // L4 dots on the feet
  const l4Out = T.l4end - 0.15;
  const footY = wireY('low', BIRD_X, t);
  const dotL = popWindow(t, T.both + 0.03, l4Out);
  const dotR = popWindow(t, T.feet2 + 0.03, l4Out);
  const eq = popWindow(t, T.same + 0.05, l4Out);

  // zap bolts
  const zapping = t > A.zap && t < A.zapEnd;
  const fyE = wireBase('low', EAGLE_X) + 12;
  const tipW = eagleWingTip(EAGLE_TOUCH);
  // contact spark when the wing touches
  const contact = popWindow(t, A.touch, A.zap + 0.05, 0.1, 0.1);

  // smoke
  const smoke: {x: number; y: number; r: number}[] = [];
  if (t > A.poof && t < A.poof + 0.7) {
    const u = seg(t, A.poof, A.poof + 0.7);
    const g = u < 0.18 ? easeOutCubic(u / 0.18) : u < 0.35 ? 1 : 1 - easeInCubic((u - 0.35) / 0.65);
    const Rs = mulberry32(42);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + Rs();
      const d = 70 + Rs() * 90;
      smoke.push({x: EAGLE_X + Math.cos(a) * d * 1.1, y: fyE - 175 + Math.sin(a) * d - 60 * u, r: (55 + Rs() * 35) * g});
    }
    smoke.push({x: EAGLE_X, y: fyE - 180 - 60 * u, r: 95 * g});
  }
  const wisps: {x: number; y: number; r: number}[] = [];
  if (eagle && t > A.poof + 0.3 && t < A.takeoff) {
    for (let i = 0; i < 8; i++) {
      const born = A.poof + 0.3 + i * 0.42;
      const age = t - born;
      if (age < 0 || age > 1.3) continue;
      const g = Math.sin(Math.PI * (age / 1.3));
      const side = i % 2 ? 1 : -1;
      wisps.push({x: eagle.x + side * 34 + 14 * Math.sin(age * 5 + i), y: eagle.y - 350 - age * 120, r: 16 * g + 6 * g * (i % 3)});
      wisps.push({x: eagle.x + side * 34 + 20 * Math.sin(age * 5 + i) + 10, y: eagle.y - 380 - age * 120, r: 12 * g});
    }
  }
  // cough puff
  const coughPuff: {x: number; y: number; r: number}[] = [];
  if (eagle && t > A.cough + 0.05 && t < A.cough + 0.75) {
    const u = seg(t, A.cough + 0.05, A.cough + 0.75);
    const g = Math.sin(Math.PI * u);
    coughPuff.push({x: eagle.x - 30 - 120 * easeOutCubic(u), y: eagle.y - 230 + 20 * u, r: 30 * g});
    coughPuff.push({x: eagle.x - 55 - 140 * easeOutCubic(u), y: eagle.y - 215 + 25 * u, r: 22 * g});
    coughPuff.push({x: eagle.x - 10 - 100 * easeOutCubic(u), y: eagle.y - 250 + 15 * u, r: 20 * g});
  }
  // boots poof
  const bootPuff: {x: number; y: number; r: number}[] = [];
  if (t > A.bootsOff && t < A.bootsOff + 0.45) {
    const u = seg(t, A.bootsOff, A.bootsOff + 0.45);
    const g = u < 0.25 ? easeOutCubic(u / 0.25) : 1 - easeInCubic((u - 0.25) / 0.75);
    for (const fx of [-19, 19]) {
      for (const [dx, dy, r] of [
        [-14, -10, 14],
        [10, -20, 16],
        [18, 2, 12],
        [-6, 8, 13],
      ])
        bootPuff.push({x: BIRD_X + fx + dx * (1 + u), y: footY + dy * (1 + u) - 14 - 20 * u, r: r * g});
    }
  }

  const feathers = [0, 1].map((i) => {
    const t0 = A.takeoff + 0.1 + i * 0.12;
    if (t < t0) return null;
    const age = t - t0;
    return {x: EAGLE_X + 40 + i * 40 + 70 * age + 25 * Math.sin(age * 4 + i), y: fyE - 200 + 150 * age, rot: 30 * Math.sin(age * 3.5 + i * 2)};
  });

  // sweat drops on the small bird (bird-local)
  const sweat1 = popWindow(t, A.zipPass + 0.05, A.zipPass + 0.6, 0.15, 0.12);
  const sweat2 = popWindow(t, T.danger, T.l6end + 0.25, 0.15, 0.12);
  const notes = [0, 1, 2].map((i) => {
    const t0 = T.flows - 0.15 + i * 0.18;
    const age = t - t0;
    if (age < 0 || age > 0.75) return null;
    return {x: BIRD_X + 28 + 40 * age + 8 * Math.sin(age * 10), y: birdY - 100 - 110 * age, s: popWindow(t, t0, t0 + 0.55, 0.15, 0.18), rot: 15 * Math.sin(age * 8)};
  });

  return (
    <AbsoluteFill style={{background: '#9BD7FA'}}>
      <Sky />
      {/* far layers share ONE depth-of-field blur pass (much cheaper at 4K than one per layer) */}
      <AbsoluteFill style={{filter: dof > 0.05 ? `blur(${dof.toFixed(2)}px)` : undefined}}>
        <Layer cam={cam} z={5200} shake={shake}>
          <Clouds t={t} dur={DURATION} />
        </Layer>
        <Layer cam={cam} z={3800} shake={shake}>
          <FarHills />
        </Layer>
        <Layer cam={cam} z={2300} shake={shake}>
          <NearHills />
        </Layer>
      </AbsoluteFill>
      <Layer cam={cam} z={1000} shake={shake}>
        {[-1, 0, 1].map((k) => (
          <Pole key={k} x={POLE_X + k * SPAN} glow={k === 0 ? bump(t, T.pole - 0.05, T.pole + 0.6) : 0} />
        ))}
        {(['up', 'low'] as WireId[]).map((w) => (
          <path key={w} d={wirePath(w)} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        ))}
        {dashes('up', 70)}
        {dashes('low', 0)}

        {/* L3: two spots at different voltages + the path between them */}
        {path > 0 && pathS > 0.01 &&
          Array.from({length: 13}, (_, i) => {
            const u = (i + 0.5) / 13;
            if (u > path) return null;
            const p = bez([RING_X, yA], [300, (yA + yB) / 2], [RING_X, yB], u);
            return <circle key={i} cx={p[0]} cy={p[1]} r={7 * pathS} fill="#fff" stroke={INK} strokeWidth={4} />;
          })}
        <Dot x={RING_X} y={yA} s={dotA} color="#FFE04A" t={t} />
        <Dot x={RING_X} y={yB} s={dotB} color="#5CE1FF" t={t} phase={0.5} />

        {/* L4: both feet, same voltage */}
        <Dot x={BIRD_X - 19} y={footY} s={dotL * 0.85} color="#FFE04A" t={t} />
        <Dot x={BIRD_X + 19} y={footY} s={dotR * 0.85} color="#FFE04A" t={t} />
        <Equals x={BIRD_X} y={footY + 46} s={eq * 0.8} />

        {spark && <Spark x={spark.x} y={spark.y} s={spark.s} lookX={spark.lookX} lookY={spark.lookY} grin={spark.grin} vx={spark.vx} t={t} squash={spark.squash} />}

        {eagle && (
          <g transform={`translate(${eagle.x},${eagle.y}) rotate(${eagle.rot}) scale(${eagle.sx},${eagle.sy})`}>
            <Eagle pose={eagle.pose} id="eagle" />
          </g>
        )}

        <g transform={`translate(${BIRD_X},${birdY}) rotate(${bird.rot}) scale(${bird.sx},${bird.sy})`}>
          <Bird pose={bird.pose} id="bird" />
          <Sweat x={-62} y={-150 + 40 * seg(t, A.zipPass + 0.05, A.zipPass + 0.6)} s={sweat1} rot={10} />
          <Sweat x={64} y={-150 + 36 * seg(t, T.danger, T.l6end + 0.25)} s={sweat2} rot={-10} />
        </g>

        {contact > 0.01 && (
          <g transform={`translate(${EAGLE_X + tipW.x},${fyE + tipW.y}) scale(${contact})`}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2 + t * 3;
              return <Bolt key={i} x0={0} y0={0} x1={Math.cos(a) * 34} y1={Math.sin(a) * 34} seed={i + Math.floor(t * 15)} amp={6} n={3} w={0.55} />;
            })}
          </g>
        )}

        {zapping && eagle && (
          <g>
            <Bolt x0={EAGLE_X + tipW.x} y0={fyE + tipW.y} x1={eagle.x + 70} y1={eagle.y - 210} seed={Math.floor(t * 15)} amp={20} />
            <Bolt x0={eagle.x + 30} y0={eagle.y - 200} x1={eagle.x - 20} y1={eagle.y - 4} seed={Math.floor(t * 15) + 99} amp={26} />
            {[0, 1, 2, 3].map((i) => {
              const a = R() * Math.PI * 2;
              const cx = eagle.x;
              const cy = eagle.y - 180;
              return <Bolt key={i} x0={cx + Math.cos(a) * 110} y0={cy + Math.sin(a) * 140} x1={cx + Math.cos(a) * 190} y1={cy + Math.sin(a) * 220} seed={i * 13 + Math.floor(t * 15)} amp={14} n={4} w={0.8} />;
            })}
          </g>
        )}

        <Puffs items={wisps} fill="#8E8E96" ol={5} />
        <Puffs items={coughPuff} fill="#8E8E96" ol={5} />
        <Puffs items={bootPuff} fill="#FFFFFF" ol={5} />
        <Puffs items={smoke} fill="#8A8A92" ol={7} />

        {notes.map((n, i) => n && <Note key={i} x={n.x} y={n.y} s={n.s} rot={n.rot} />)}
        {feathers.map((f, i) => f && <Feather key={i} x={f.x} y={f.y} rot={f.rot} />)}
      </Layer>
      {t > A.zap && t < A.zap + 0.06 && <AbsoluteFill style={{background: '#FFF6C8', opacity: 0.45}} />}
      <Sound />
    </AbsoluteFill>
  );
};
