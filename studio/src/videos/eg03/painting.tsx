import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  CamKey,
  C,
  DUR,
  Layer,
  P2,
  T,
  add,
  blinkAt,
  camAt,
  clamp,
  easeInOut,
  easeOut,
  easeOutBack,
  lerp,
  loopSin,
  popIn,
  popOut,
  prog,
  rand,
  rot,
  shakeXY,
  springStep,
  swapSquash,
  wobble,
} from './core';
import {
  Egyptian,
  Face,
  GROUND,
  GhostPile,
  JAR_MOUTH,
  ManPose,
  PER_ROW,
  POUR_SPOT,
  PullerAnim,
  ROPE_TIE,
  ROWS,
  RowRope,
  SandLens,
  SandStrip,
  Sledge,
  Sparkle,
  Statue,
  StatueFace,
  SweatDrop,
  TombWall,
  WM_FEET,
  WaterStream,
  Splash,
  handWorld,
  pullerPose,
  pullerX,
} from './egypt';
import {Dust, FloorLedge, HangingLamp} from './foreground';

// ============================================================ timeline helpers
const END_FREEZE = 24.98; // everyone settles back into the painting (loop to frame 0)
const FROZEN = DUR - 0.12;
/** 0 = painted (frame 0 / last frame), 1 = alive */
export const aliveAt = (t: number) => clamp(prog(t, T.painting, T.painting + 0.35)) * (1 - easeInOut(prog(t, END_FREEZE, FROZEN)));

// ============================================================ pullers
const PULL_PERIOD = 1.08;
const BOTTOM_SHIFT = 124; // free sand between the bottom row and the runner
const pullerAnim = (t: number, row: number, i: number, al: number): PullerAnim => {
  const ph = (2 * Math.PI * (t - T.painting)) / PULL_PERIOD - i * 0.22 - row * 0.7;
  const s = Math.sin(ph);
  const face: Face = {
    blink: blinkAt(t, [T.painting + 0.05 + rand(row * 31 + i) * 0.12, 4.9 + rand(i * 7 + row) * 3, 13 + rand(i + row * 3) * 9]),
    brow: al > 0.5 ? 'effort' : 'neutral',
    mouth: al > 0.5 && (i + row) % 3 === 0 ? 'grit' : 'neutral',
    look: [0, 0],
  };
  return {lean: -15 + al * 5 * s, step: al * s, bob: al * 3 * Math.sin(2 * ph), reach: al * Math.cos(ph), face};
};

/** the nearest bottom-row puller turns round and glares at the water man */
const glareFlip = (t: number) => {
  const a = T.isnt + 0.12;
  const b = T.ritual + 0.38;
  if (t < a || t > b + 0.2) return {flip: 1, on: false};
  const flipIn = t < a + 0.12 ? lerp(1, -1, easeInOut(prog(t, a, a + 0.12))) : t < b ? -1 : lerp(-1, 1, easeInOut(prog(t, b, b + 0.12)));
  return {flip: Math.sign(flipIn || 1) * Math.max(0.15, Math.abs(flipIn)), on: t >= a + 0.06 && t < b + 0.06};
};

const Pullers: React.FC<{t: number; al: number; xMin: number; xMax: number}> = ({t, al, xMin, xMax}) => {
  const out: React.ReactNode[] = [];
  ROWS.forEach((gy, row) => {
    const anims: PullerAnim[] = [];
    const xs: number[] = [];
    for (let i = 0; i < PER_ROW; i++) {
      anims.push(pullerAnim(t, row, i, al));
      xs.push(pullerX(i) - (row === 3 ? BOTTOM_SHIFT : 0));
    }
    // rope through every front hand, then to the sledge
    const pts: P2[] = [];
    pts.push([xs[PER_ROW - 1] - 260, gy - 120]);
    for (let i = PER_ROW - 1; i >= 0; i--) pts.push(handWorld(xs[i], gy, anims[i]));
    if (row < 3) {
      const tx = 524 + row * 8;
      pts.push([tx, gy - 122]);
      pts.push([tx, ROPE_TIE[1] - 34 - row * 6]);
    }
    pts.push(ROPE_TIE);
    out.push(<RowRope key={`r${row}`} pts={pts} />);
    for (let i = PER_ROW - 1; i >= 0; i--) {
      const x = xs[i];
      if (x < xMin - 150 || x > xMax + 150) continue;
      const a = anims[i];
      let face = a.face;
      if (row === 3 && i === 0) {
        const g = glareFlip(t);
        if (g.on) face = {...face, flip: g.flip, brow: 'angry', mouth: 'neutral', look: [-1, 0]};
        else face = {...face, flip: g.flip};
      }
      out.push(<Egyptian key={`p${row}_${i}`} x={x} y={gy} p={{...pullerPose(a), face}} />);
    }
    // sweat on a few pullers while the statue is being dragged
    if (al > 0.5) {
      [2, 5].forEach((i) => {
        const x = xs[i];
        const ph = ((t - 3.5 - row * 0.4 - i * 0.13) % 1.6) / 1.6;
        if (ph > 0 && ph < 0.5 && row !== 3) out.push(<SweatDrop key={`sw${row}_${i}`} x={x + 6} y={gy - 236 + ph * 60} s={popIn(ph * 1.6, 0, 0.15) * popOut(ph * 1.6, 0.62, 0.15)} rot={20} />);
      });
    }
  });
  return <g>{out}</g>;
};

// ============================================================ water man
const IDLE: ManPose = {
  hip: [0, -100],
  lean: 0,
  footF: [-24, 0],
  footB: [16, 0],
  kneeF: 6,
  kneeB: -2,
  handF: [-66, -152],
  handB: [-10, -150],
  bendF: -16,
  bendB: -14,
  jar: {at: [-38, -150], angle: 0},
  face: {},
  kilt: 'long',
};
const POUR: ManPose = {
  ...IDLE,
  lean: -7,
  handF: [-98, -168],
  handB: [-58, -128],
  bendF: -10,
  bendB: -16,
  jar: {at: [-76, -150], angle: -118},
};
const CAREFUL: ManPose = {
  ...POUR,
  lean: -12,
  footF: [-34, 0],
  footB: [22, 0],
  handF: [-96, -160],
  handB: [-60, -126],
  jar: {at: [-78, -146], angle: -96},
};
const RITUAL: ManPose = {
  ...IDLE,
  handF: [-44, -268],
  bendF: 14,
  handB: [-14, -118],
  bendB: -10,
  jar: {at: [-4, -112], angle: 12},
  openHandF: true,
};

const lerpP = (a: P2, b: P2, u: number): P2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const lerpPose = (a: ManPose, b: ManPose, u: number): ManPose => ({
  ...b,
  hip: lerpP(a.hip, b.hip, u),
  lean: lerp(a.lean, b.lean, u),
  footF: lerpP(a.footF, b.footF, u),
  footB: lerpP(a.footB, b.footB, u),
  handF: lerpP(a.handF, b.handF, u),
  handB: lerpP(a.handB, b.handB, u),
  bendF: lerp(a.bendF ?? -12, b.bendF ?? -12, u),
  bendB: lerp(a.bendB ?? -10, b.bendB ?? -10, u),
  kneeF: lerp(a.kneeF ?? 14, b.kneeF ?? 14, u),
  kneeB: lerp(a.kneeB ?? -4, b.kneeB ?? -4, u),
  jar: a.jar && b.jar ? {at: lerpP(a.jar.at, b.jar.at, u), angle: lerp(a.jar.angle, b.jar.angle, u)} : b.jar,
  openHandF: u > 0.5 ? b.openHandF : a.openHandF,
  face: u > 0.5 ? b.face : a.face,
});

/** blend between poses on a schedule of [time, pose, transition seconds] */
const poseTrack = (t: number, track: [number, ManPose, number][]): ManPose => {
  let cur = track[0][1];
  for (let k = 1; k < track.length; k++) {
    const [tk, pk, dk] = track[k];
    if (t < tk) break;
    const u = easeOutBack(clamp((t - tk) / dk), 1.2);
    cur = lerpPose(cur, pk, Math.min(1.08, u));
  }
  return cur;
};

const waterManPose = (t: number): ManPose => {
  const track: [number, ManPose, number][] = [
    [0, IDLE, 0.01],
    [T.pouring - 0.06, POUR, 0.26],
    [T.maybe - 0.04, RITUAL, 0.24],
    [11.2, IDLE, 0.01],
    [T.just - 0.12, CAREFUL, 0.3],
    [T.so - 0.05, IDLE, 0.3],
    [END_FREEZE, IDLE, 0.01],
  ];
  const p = poseTrack(t, track);
  const al = aliveAt(t);
  // face
  let face: Face = {blink: blinkAt(t, [T.painting + 0.1, 5.1, 6.7, 9.95, 20.0, 23.3])};
  if (al > 0.5) {
    if (t >= T.one && t < T.pouring - 0.1) face = {...face, look: [-1, 0], brow: t > T.isnt + 0.2 ? 'up' : 'neutral', mouth: t > T.isnt + 0.25 ? 'grin' : 'smile'};
    else if (t >= T.pouring - 0.1 && t < T.maybe - 0.04) face = {...face, look: [-0.6, 0.8], mouth: 'smile'};
    else if (t >= T.maybe - 0.04 && t < 11.2) face = {eyes: 'closed', mouth: 'smile', brow: 'up'};
    else if (t >= T.just - 0.12 && t < T.so - 0.05) face = {eyes: 'squint', mouth: 'tongue', brow: 'effort', look: [-0.5, 1]};
    else if (t >= T.so - 0.05 && t < END_FREEZE) face = {...face, mouth: 'grin', brow: 'up', look: [-0.8, 0.6]};
    else face = {...face, look: [-0.3, 0.3]};
  }
  // breathing
  const br = 2.5 * loopSin(t, 15);
  return {...p, hip: [p.hip[0], p.hip[1] + br * al], face};
};

const jarMouth = (p: ManPose): P2 => {
  const j = p.jar!;
  return add(add(WM_FEET, j.at), rot(JAR_MOUTH, j.angle));
};

const streamWidth = (t: number) => {
  const w1 = clamp(prog(t, T.pouring + 0.12, T.pouring + 0.3)) * (1 - clamp(prog(t, T.maybe - 0.08, T.maybe + 0.04)));
  const w2 = clamp(prog(t, T.just + 0.14, T.just + 0.3)) * (1 - clamp(prog(t, T.glues + 0.6, T.glues + 0.75)));
  return 30 * w1 + 11 * w2;
};

// ============================================================ statue
const statueFace = (t: number): StatueFace => {
  const open = popIn(t, T.giant - 0.04, 0.3) * (1 - clamp(prog(t, END_FREEZE - 0.05, END_FREEZE + 0.12)));
  let look: P2 = [-0.8, 0.7];
  let lid = 0;
  let brow = 0;
  if (t > T.statue) {
    lid = 0.55 * easeOut(prog(t, T.statue, T.statue + 0.2));
    brow = 1 * easeOut(prog(t, T.statue, T.statue + 0.2));
  }
  if (t > T.pushMan) {
    lid = lerp(lid, 0.2, easeOut(prog(t, T.pushMan, T.pushMan + 0.3)));
    brow = 0.4;
    look = [-1, 0.9];
  }
  if (t > T.doesnt) look = [-1, 1];
  const bl = blinkAt(t, [6.2, 9.2, 21.0, 23.9]);
  return {open: open * (1 - bl), look, lid, brow};
};

// ============================================================ cameras
export const CAM0 = {x: 600, y: 975, z: 200};
const camA = (t: number) =>
  camAt(
    [
      {t: 0, ...CAM0},
      {t: T.shows, x: 600, y: 975, z: 245},
      {t: T.men + 0.12, x: -200, y: 1010, z: -660},
      {t: T.giant - 0.08, x: 760, y: 905, z: 150},
      {t: T.pushMan, x: 760, y: 905, z: 150},
      {t: T.one + 0.3, x: 488, y: 1236, z: 480},
      {t: T.hes, x: 488, y: 1236, z: 480},
      {t: T.water1, x: 500, y: 1280, z: 520},
      {t: T.maybe - 0.05, x: 500, y: 1280, z: 520},
      {t: T.ritual + 0.4, x: 565, y: 1210, z: 470, ease: easeOut},
    ] as CamKey[],
    t,
  );
const camC = (t: number) =>
  camAt(
    [
      {t: T.cutBack, x: 540, y: 1270, z: 520},
      {t: T.water4, x: 515, y: 1318, z: 575},
      {t: T.so, x: 500, y: 1372, z: 640},
      {t: T.sand + 0.1, x: 500, y: 1364, z: 610},
      {t: T.in - 0.1, x: 500, y: 1364, z: 610},
      {t: END_FREEZE + 0.18, ...CAM0},
    ] as CamKey[],
    t,
  );

// ============================================================ the painting shot (A and C)
export const PaintingShot: React.FC<{t: number; shot: 'A' | 'C'}> = ({t, shot}) => {
  const cam = shot === 'A' ? camA(t) : camC(t);
  const al = aliveAt(t);
  const k = 1000 / (1000 - cam.z);
  const xMin = cam.x - 540 / k;
  const xMax = cam.x + 540 / k;
  const wm = waterManPose(t);
  const mouth = jarMouth(wm);
  const sw = streamWidth(t);
  const heave = -16 * (springStep(t, T.dragging, 1.6, 4) * (1 - easeInOut(prog(t, END_FREEZE, FROZEN))));
  const statueSquash = 1 + 0.03 * wobble(t, T.dragging, 3, 5);
  // sparkle wave when the painting wakes up
  const wake = prog(t, T.painting - 0.05, T.painting + 0.5);
  // ritual sparkles
  const ritualS = (i: number) => popIn(t, T.ritual + i * 0.07, 0.22) * popOut(t, T.ritual + 0.55 + i * 0.03, 0.18);
  // ghost pile
  const gh = easeOut(prog(t, T.doesnt, T.pile + 0.1));
  const gpop = clamp(prog(t, T.in + 0.02, T.in + 0.2));
  const xStampS = popIn(t, T.up - 0.02, 0.2);
  // lens
  const lensS = popIn(t, T.glues - 0.02, 0.3) * popOut(t, T.so - 0.04, 0.2);
  const bridges = easeInOut(prog(t, T.the1 - 0.05, T.together + 0.2));
  const happy = t > T.together + 0.05 ? 1 : 0;
  // shake on the heave and on the statue landing its look
  const sh = shakeXY(t, 6 * Math.exp(-6 * Math.max(0, t - T.dragging)) * (t > T.dragging ? 1 : 0));
  // depth of field: blur the foreground when close
  const fgBlur = clamp((cam.z - 100) / 300) * 4;

  return (
    <AbsoluteFill style={{background: C.ceiling}}>
      <Layer cam={cam} z={1000} shake={sh}>
        <TombWall />
        <SandStrip wet={0} />
        <Pullers t={t} al={al} xMin={xMin} xMax={xMax} />
        <Sledge dx={heave} />
        <Statue dx={heave} face={statueFace(t)} squash={statueSquash} />
        <GhostPile h={gh} pop={gpop} x={xStampS} />
        <WaterStream from={mouth} to={POUR_SPOT} w={sw} t={t} />
        <Egyptian x={WM_FEET[0] + heave} y={WM_FEET[1]} p={wm} />
        <Splash at={POUR_SPOT} t={t} t0={T.pouring + 0.3} t1={T.maybe - 0.05} />
        <Splash at={POUR_SPOT} t={t} t0={T.just + 0.3} t1={T.glues + 0.7} rate={7} size={0.6} />
        {/* ritual sparkles around the water man */}
        {[
          [520, 1060, 0.9],
          [700, 1110, 0.7],
          [470, 1180, 0.6],
          [690, 1010, 0.55],
          [600, 990, 0.8],
        ].map(([x, y, s], i) => (
          <Sparkle key={i} x={x} y={y} s={s * ritualS(i)} rot={i * 20 + t * 60} />
        ))}
        {/* wake-up sparkles */}
        {wake > 0 && wake < 1 &&
          Array.from({length: 14}).map((_, i) => {
            const u = wake * 1.4 - (i / 14) * 0.5;
            const s = Math.max(0, Math.sin(clamp(u) * Math.PI)) * 0.6;
            return <Sparkle key={`w${i}`} x={80 + (i % 7) * 150 + rand(i) * 60} y={480 + Math.floor(i / 7) * 600 + rand(i * 3) * 300} s={s} rot={i * 30} color="#FFF4C2" />;
          })}
      </Layer>
      {/* foreground: lamp + floor ledge (closer to the camera = more parallax) */}
      <Layer cam={cam} z={660} blur={fgBlur} shake={sh}>
        <HangingLamp x={767} y={560} t={t} />
      </Layer>
      <Layer cam={cam} z={720} blur={fgBlur} shake={sh}>
        <FloorLedge y={1830} />
      </Layer>
      {/* torch light + vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 25%, rgba(255,200,110,0.18), rgba(255,200,110,0) 70%), radial-gradient(ellipse 120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,20,5,0.35) 100%)',
        }}
      />
      <Dust t={t} opacity={0.8} />
      <SandLens cx={540} cy={880} R={330} s={lensS} bridges={bridges} happy={happy} t={t} />
    </AbsoluteFill>
  );
};
