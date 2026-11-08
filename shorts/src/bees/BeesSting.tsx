import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {S} from './sprites';
import {FPS, T} from './T';
import {
  Cam,
  CamKey,
  Layer,
  P,
  Spr,
  WSvg,
  camAt,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  easeOutBack,
  keys,
  kick,
  lerp,
  linear,
  placed,
  popScale,
  seg,
  shakeAt,
  springTo,
  wob,
} from './lib';
import {Bandage, Bang, Card, Drop, Glint, GuyFace, HiveFace, INK, Mood, PainLines, Puff, Puffs, Ring, Star, Sweat, Wavy} from './fx';
import {SoundTrack} from './sound';

// ====================================================================== world constants (Z = 1000 plane)
const YG = 1760; // ground line of every layer
const GUY: P = [960, 1740];
const GS = 0.66;
const HAND_TOP = placed('guy_hand', GUY, 'feet', GS, 'handTop');
const STING_PT: P = [HAND_TOP[0] - 24, HAND_TOP[1] + 5];
const FLOWER: P = [330, YG];
const FS = 0.41;
const BEE_S = 0.25;
const BEE_HOVER: P = [330, 860];
const WASP_S = 0.3;
// hive sits on the mid ground (Z 2200), far to the left
const HIVE_Z = 2200;
const HIVE: P = [-1150, YG];
const HS = 0.8;
const HIVE_ENT = placed('hive', HIVE, 'feet', HS, 'entrance');
const HIVE_DOME = placed('hive', HIVE, 'feet', HS, 'dome');

const ink = (z: number, cam: Cam, px = 7) => (px * (z - cam.z)) / 1000; // constant on-screen outline width

// ====================================================================== guy pose helpers
type GuyX = {sx: number; sy: number; dy: number};
const mapGuy = (p: P, g: GuyX): P => [GUY[0] + (p[0] - GUY[0]) * g.sx, GUY[1] + g.dy + (p[1] - GUY[1]) * g.sy];
const breathe = (t: number) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);

// ====================================================================== shared meadow background
const SoftShadow: React.FC<{x: number; y: number; rx: number; ry: number; o?: number}> = ({x, y, rx, ry, o = 0.26}) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`rgba(72,54,42,${o})`} />
);

const CloudPuffs = (cx: number, cy: number, sc: number): Puff[] =>
  [
    [-150, 10, 70],
    [-60, -40, 95],
    [60, -30, 85],
    [150, 15, 65],
    [0, 25, 80],
  ].map(([x, y, r]) => ({x: cx + x * sc, y: cy + y * sc, r: r * sc}));

const Meadow: React.FC<{cam: Cam; t: number; hiveFace?: {s: number; angry: number; look: [number, number]; bang: number; squash: number}; dof: number}> = ({
  cam,
  t,
  hiveFace,
  dof,
}) => {
  const hs = hiveFace?.squash ?? 0;
  return (
    <>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #74BFF3 0%, #A9DBFB 45%, #D6F0FF 70%, #D6F0FF 100%)'}} />
      <Layer cam={cam} z={4500} blur={dof * 0.6}>
        <WSvg>
          <Puffs puffs={CloudPuffs(-1000 + t * 6, -1500, 2.2)} fill="#FFFFFF" ink={ink(4500, cam, 6)} />
          <Puffs puffs={CloudPuffs(2500 + t * 4, -2300, 2.6)} fill="#FFFFFF" ink={ink(4500, cam, 6)} />
          <Puffs puffs={CloudPuffs(-3400 + t * 5, -2600, 1.8)} fill="#FFFFFF" ink={ink(4500, cam, 6)} />
        </WSvg>
      </Layer>
      <Layer cam={cam} z={3000} blur={dof}>
        <WSvg>
          <rect x={-20000} y={YG} width={40000} height={30000} fill="#88D066" />
          <line x1={-20000} y1={YG} x2={20000} y2={YG} stroke={INK} strokeWidth={ink(3000, cam, 5)} />
        </WSvg>
      </Layer>
      <Layer cam={cam} z={HIVE_Z} blur={dof}>
        <WSvg>
          <SoftShadow x={HIVE[0] - 160} y={YG} rx={560} ry={50} />
        </WSvg>
        <Spr n="hive" at={HIVE} a="feet" s={HS} sy={1 + hs} sx={1 - hs * 0.5}>
          {hiveFace ? <HiveFace s={hiveFace.s} angry={hiveFace.angry} look={hiveFace.look} /> : null}
        </Spr>
        {hiveFace ? (
          <WSvg>
            <Bang x={HIVE_DOME[0] + 420} y={HIVE_DOME[1] - 420} s={hiveFace.bang} size={1.5} rot={12} />
          </WSvg>
        ) : null}
      </Layer>
      <Layer cam={cam} z={1800} blur={dof * 0.7}>
        <Spr n="plant1" at={[-450, YG]} a="feet" s={1.0} />
        <Spr n="plant5" at={[120, YG]} a="feet" s={0.9} />
        <Spr n="plant3" at={[1550, YG]} a="feet" s={1.1} />
        <Spr n="plant2" at={[2300, YG]} a="feet" s={0.9} />
        <Spr n="plant4" at={[-1500, YG]} a="feet" s={1.0} />
      </Layer>
    </>
  );
};

const Foreground: React.FC<{cam: Cam}> = ({cam}) => (
  <Layer cam={cam} z={650} minDepth={330}>
    <Spr n="plant4" at={[40, YG]} a="feet" s={1.25} />
    <Spr n="plant1" at={[1020, YG]} a="feet" s={1.35} />
    <Spr n="plant2" at={[-700, YG]} a="feet" s={1.2} />
  </Layer>
);

// ====================================================================== SHOT A  0 - 6.92  (meadow: bee vs wasp, then the hand)
const camA: CamKey[] = [
  {t: 0, x: 450, y: 1040, k: 0.86},
  {t: 3.5, x: 460, y: 1030, k: 0.9, e: linear},
  {t: 4.55, x: 650, y: 960, k: 1.45},
  {t: 5.45, x: 660, y: 955, k: 1.52, e: linear},
  {t: 6.3, x: 590, y: 920, k: 2.25},
  {t: 6.92, x: 585, y: 915, k: 2.37, e: linear},
];

export const ShotA: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, camA);
  const K = 1000 / (1000 - cam.z);
  const dof = clamp((K - 1.15) / 0.7) * 3.2;

  // --- guy
  const ouchT = t - 4.7;
  const g: GuyX = {
    sx: 1 + 0.03 * kick(ouchT, 3.5, 6),
    sy: breathe(t) - 0.05 * kick(ouchT, 3.5, 6),
    dy: -26 * Math.max(0, kick(ouchT, 2.2, 7)),
  };
  let mood: Mood = 'curious';
  let look: [number, number] = [-1, 0.3];
  if (t >= 4.7 && t < 5.9) mood = 'ouch';
  if (t >= 5.9) {
    mood = 'worried';
    look = [-1, 0.8];
  }
  const blink = t < 4.6 && Math.abs(t - 2.9) < 0.07 ? 1 - Math.abs(t - 2.9) / 0.07 : 0;

  // --- wasp: creeps in, gets stung, knocked away spinning
  const wDt = t - 2.2;
  let wasp: {at: P; rot: number} | null = null;
  if (wDt < 0) {
    wasp = {at: [keys(t, [[0, -75], [2.0, -24, easeOut]]), 1006 + 9 * Math.sin(t * 5.1)], rot: 4 * Math.sin(t * 3.3)};
  } else if (wDt < 0.7) {
    wasp = {at: [-24 - 950 * wDt, 1006 - 900 * wDt + 0.5 * 2600 * wDt * wDt], rot: -760 * wDt};
  }

  // --- bee
  type BeeState = {n: 'bee_hero' | 'bee_sting' | 'bee_uhoh'; at: P; a: string; rot: number; flip: boolean; sx: number; sy: number; s: number};
  let bee: BeeState;
  const bob = 10 * Math.sin(2 * Math.PI * 1.3 * t);
  if (t < 2.1) {
    const ant = seg(t, 1.85, 2.1);
    bee = {
      n: 'bee_hero',
      at: [BEE_HOVER[0] + 16 * easeOut(ant), BEE_HOVER[1] + bob * (1 - ant)],
      a: 'c',
      rot: 4 * Math.sin(t * 2.7),
      flip: true,
      sx: 1 + 0.08 * easeOut(ant),
      sy: 1 - 0.1 * easeOut(ant),
      s: BEE_S,
    };
  } else if (t < 2.45) {
    const dash = easeOut(seg(t, 2.1, 2.18));
    const back = springTo(t - 2.18, 3, 9);
    const x = t < 2.18 ? lerp(BEE_HOVER[0] + 16, BEE_HOVER[0] - 10, dash) : lerp(BEE_HOVER[0] - 10, BEE_HOVER[0], back);
    bee = {n: 'bee_sting', at: [x, BEE_HOVER[1] - 6], a: 'c', rot: 0, flip: true, sx: 1.04 - 0.04 * dash, sy: 0.97 + 0.03 * dash, s: BEE_S};
  } else if (t < 3.55) {
    const u = seg(t, 2.55, 3.35);
    const th = easeInOut(u) * Math.PI * 2;
    const st = 1 + 0.06 * kick(t - 2.45, 4, 9);
    bee = {
      n: 'bee_hero',
      at: [BEE_HOVER[0] + 70 * Math.sin(th), BEE_HOVER[1] - 70 + 70 * Math.cos(th) + bob * 0.5],
      a: 'c',
      rot: (th * 180) / Math.PI,
      flip: true,
      sx: 1 / st,
      sy: st,
      s: BEE_S,
    };
  } else if (t < 4.4) {
    // turn (squash, flip on the narrowest frame) then fly to the hand on an arc
    const turn = t < 3.62 ? 1 - 0.25 * easeIn(seg(t, 3.55, 3.62)) : 0.75 + 0.25 * easeOutBack(seg(t, 3.62, 3.72));
    const u = easeInOut(seg(t, 3.7, 4.4));
    const p0 = BEE_HOVER;
    const p2: P = [STING_PT[0] + 40, STING_PT[1] - 150];
    const c: P = [440, 670];
    const x = (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p2[0];
    const y = (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p2[1];
    bee = {n: 'bee_hero', at: [x, y + bob * 0.4], a: 'c', rot: keys(t, [[4.0, 0], [4.4, -20]]), flip: t < 3.62, sx: turn, sy: 1, s: BEE_S};
  } else if (t < 4.7) {
    // anticipation (rise + tilt the stinger down) then the jab
    const rise = easeOut(seg(t, 4.4, 4.6));
    const jab = easeIn(seg(t, 4.6, 4.7));
    const rot = lerp(-20, -55, rise);
    // place by the stinger tip: hovering point above the hand -> the hand
    const tip44 = placed('bee_hero', [STING_PT[0] + 40, STING_PT[1] - 150], 'c', BEE_S, 'tip', false, -20);
    const hover: P = [lerp(tip44[0], STING_PT[0] + 18, rise), lerp(tip44[1], STING_PT[1] - 95, rise)];
    const hit = mapGuy(STING_PT, g);
    bee = {
      n: 'bee_hero',
      at: [lerp(hover[0], hit[0], jab), lerp(hover[1], hit[1], jab)],
      a: 'tip',
      rot,
      flip: false,
      sx: 1 + 0.06 * rise - 0.06 * jab,
      sy: 1 - 0.08 * rise + 0.1 * jab,
      s: BEE_S,
    };
  } else {
    // stuck in the hand: pivot at the stinger tip, struggling; "dies" -> uh-oh face
    const hit = mapGuy(STING_PT, g);
    const struggle = t < 5.9 ? 6 * Math.sin((t - 4.7) * 2 * Math.PI * 2.6) * clamp((t - 4.75) / 0.2) : 0;
    const pop = 1 + 0.16 * kick(t - 5.96, 3.5, 7);
    bee = {
      n: t < 5.96 ? 'bee_hero' : 'bee_uhoh',
      at: hit,
      a: 'tip',
      rot: -55 + struggle + (t > 5.96 ? 2 * Math.sin(t * 3) : 0),
      flip: false,
      sx: pop,
      sy: pop * (t > 5.96 ? breathe(t * 1.7) : 1),
      s: BEE_S,
    };
  }

  const shake = shakeAt(t, [
    {at: 2.18, amp: 9},
    {at: 4.7, amp: 16},
    {at: 5.96, amp: 5},
  ]);
  const beeTip = placed(bee.n, bee.at, bee.a, bee.s, 'tip', bee.flip, bee.rot);

  return (
    <AbsoluteFill style={{transform: `translate(${shake[0]}px, ${shake[1]}px)`}}>
      <Meadow cam={cam} t={t} dof={dof} />
      <Layer cam={cam} z={1000}>
        <WSvg>
          <SoftShadow x={GUY[0] - 10} y={GUY[1] + 4} rx={150} ry={22} />
          <SoftShadow x={FLOWER[0]} y={FLOWER[1] - 2} rx={70} ry={14} />
        </WSvg>
        <Spr n="flower" at={FLOWER} a="feet" s={FS} rot={1.5 * Math.sin(t * 1.4)} />
        <Spr n="guy_hand" at={[GUY[0], GUY[1] + g.dy]} a="feet" s={GS} sx={g.sx} sy={g.sy}>
          <GuyFace head={S.guy_hand.head as unknown as number[]} mood={mood} look={look} blink={blink} />
        </Spr>
        {wasp ? <Spr n="wasp" at={wasp.at} a="c" s={WASP_S} flip rot={wasp.rot} /> : null}
        <Spr n={bee.n} at={bee.at} a={bee.a} s={bee.s} rot={bee.rot} flip={bee.flip} sx={bee.sx} sy={bee.sy} />
        <WSvg>
          <Star x={210} y={966} r={80} s={popScale(t, 2.18, 0.12, 2.3, 0.15)} rot={t * 90} />
          <Glint x={beeTip[0]} y={beeTip[1]} r={52} s={popScale(t, 3.4, 0.16, 3.72, 0.2)} rot={t * 140} />
          <Star x={STING_PT[0]} y={STING_PT[1] + 6} r={64} s={popScale(t, 4.7, 0.1, 4.84, 0.14)} rot={t * 90} />
          <PainLines x={STING_PT[0] + 8} y={STING_PT[1] + 10} s={t > 4.7 && t < 5.8 ? easeOutBack(seg(t, 4.7, 4.86)) * (1 - easeIn(seg(t, 5.6, 5.8))) : 0} r={58} />
        </WSvg>
      </Layer>
      <Foreground cam={cam} />
    </AbsoluteFill>
  );
};

// ====================================================================== SHOT B  6.92 - 17.70  (inside the skin)
const SKIN_S = 0.78;
const SKIN_AT: P = [63, 1080]; // world point of the cube's front-top-left corner
const ENTRY: P = [552, 990]; // where the stinger goes through the top face
const ST_S = 0.4;
const ST_TIP: P = [ENTRY[0] + (S.stinger.tip[0] - 365) * ST_S, ENTRY[1] + (S.stinger.tip[1] - 600) * ST_S];
const stPt = (name: keyof typeof S.stinger): P => {
  const v = S.stinger[name] as unknown as number[];
  return [ST_TIP[0] + (v[0] - S.stinger.tip[0]) * ST_S, ST_TIP[1] + (v[1] - S.stinger.tip[1]) * ST_S];
};
const ST_TOP = stPt('top');
const SAC_C = stPt('sac');
const SAC_ATT = stPt('sacAttach');
const BARBS = (['barb0', 'barb1', 'barb2', 'barb3', 'barb4', 'barb5'] as const).map((b) => stPt(b));
const BEE_T_S = 0.5;

const camB: CamKey[] = [
  {t: T.cutB, x: 540, y: 960, k: 1.0},
  {t: 9.6, x: 545, y: 930, k: 1.06, e: linear},
  {t: 10.5, x: 548, y: 960, k: 1.08},
  {t: 11.2, x: 570, y: 1060, k: 1.34},
  {t: 16.6, x: 575, y: 1070, k: 1.42, e: linear},
  {t: 17.7, x: 580, y: 1040, k: 1.3},
];

const PUMP0 = 13.5;
const PUMP_DT = 0.42;
const PUMP_N = 8; // 13.5 .. 16.44

export const ShotB: React.FC<{t: number}> = ({t}) => {
  let cam = camAt(t, camB);
  // little zoom bump on "barbed"
  const bump = 0.045 * kick(t - T.barbed, 2.5, 6);
  cam = {...cam, z: 1000 - (1000 - cam.z) / (1 + bump)};

  // bee: tugs, then rips away and flies off dizzy
  const tug = 30 * Math.max(0, kick(t - T.pulling, 2.2, 5)) + 46 * Math.max(0, kick(t - 9.45, 2.4, 5));
  const ripU = seg(t, T.rips, T.rips + 0.9);
  const ripY = t < T.rips ? 0 : -(260 * easeOut(seg(t, T.rips, T.rips + 0.18)) + 1300 * easeIn(ripU));
  const ripX = t < T.rips ? 0 : 140 * Math.sin(ripU * 5) * ripU;
  const beeStretch = 1 + 0.07 * Math.max(0, kick(t - T.pulling, 2.2, 5)) + 0.1 * Math.max(0, kick(t - 9.45, 2.4, 5));
  const beeRot = t < T.rips ? 2 * Math.sin(t * 9) * seg(t, T.pulling, T.pulling + 0.1) : 18 * Math.sin((t - T.rips) * 9) * Math.exp(-(t - T.rips) * 1.5) - 25 * ripU;
  // the stinger is pulled a little with the tugs, the barbs hold it back
  const stLift = t < T.rips ? -tug * 0.22 : 0;
  const stWobble = t < T.rips ? 0 : 7 * kick(t - T.rips, 3, 5);

  // flick-off on "fast": the card scrapes, the stinger + sac fly out
  const flyT = t - 16.8;
  const stFly: {dx: number; dy: number; rot: number} =
    flyT < 0 ? {dx: 0, dy: 0, rot: 0} : {dx: 1100 * flyT, dy: -1900 * flyT + 0.5 * 3200 * flyT * flyT, rot: 600 * flyT};

  // venom pumping
  let sacSX = 1;
  let sacSY = 1;
  const drops: {x: number; y: number}[] = [];
  let poolR = 0;
  for (let i = 0; i < PUMP_N; i++) {
    const p0 = PUMP0 + i * PUMP_DT;
    const d = t - p0;
    if (d > 0 && d < 0.3) {
      const sq = Math.sin((d / 0.3) * Math.PI);
      sacSX -= 0.13 * sq;
      sacSY -= 0.07 * sq;
    }
    const dropU = (t - (p0 + 0.08)) / 0.32;
    if (dropU > 0 && dropU < 1 && flyT < 0) {
      const a = SAC_ATT;
      const y = lerp(a[1] + 30, ST_TIP[1], easeIn(dropU));
      const x = lerp(a[0] - 10, ST_TIP[0], dropU);
      drops.push({x, y});
    }
  }
  const fill = clamp((t - (PUMP0 + 0.4)) / (PUMP_N * PUMP_DT));
  poolR = fill > 0 ? 40 + 150 * easeOut(fill) : 0;

  // highlight ring: stinger -> sac -> torn belly bits
  const ringTargets = [
    {cx: ST_TIP[0] - 4, cy: (ST_TOP[1] + ST_TIP[1]) / 2 + 60, rx: 120, ry: 470},
    {cx: SAC_C[0] + 8, cy: SAC_C[1], rx: 110, ry: 120},
    {cx: ST_TOP[0] + 20, cy: ST_TOP[1] + 30, rx: 140, ry: 85},
  ];
  const rt = [T.stinger, T.venomSac, T.belly];
  let ring = ringTargets[0];
  for (let i = 1; i < 3; i++) {
    const u = easeInOut(seg(t, rt[i] - 0.12, rt[i] + 0.16));
    if (u > 0) {
      const a = i === 1 ? ringTargets[0] : ringTargets[1];
      const b = ringTargets[i];
      ring = {cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), rx: lerp(a.rx, b.rx, u), ry: lerp(a.ry, b.ry, u)};
    }
  }
  const ringS = popScale(t, T.stinger, 0.25, 13.2, 0.2) * (1 + 0.08 * kick(t - T.venomSac, 3, 7) + 0.08 * kick(t - T.belly, 3, 7));

  // stopwatch + card
  const swS = popScale(t, T.minute, 0.28, 17.0, 0.25);
  const swHand = 360 * keys(t, [[15.55, 0], [16.62, 1, linear]]);
  const cardX = keys(t, [[16.5, -320], [16.8, 470, easeOut], [17.15, 1500, easeIn]]);
  const shake = shakeAt(t, [
    {at: T.rips, amp: 12},
    {at: 16.8, amp: 10},
  ]);

  const stGroup = (children: React.ReactNode) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0',
        transform: `translate(${ST_TIP[0] + stFly.dx}px, ${ST_TIP[1] + stLift + stFly.dy}px) rotate(${stWobble + stFly.rot}deg) translate(${-ST_TIP[0]}px, ${-ST_TIP[1]}px)`,
      }}
    >
      {children}
    </div>
  );
  const sacSq = (
    <Spr n="sac" at={SAC_ATT} a="attach" s={ST_S} sx={sacSX} sy={sacSY} />
  );

  // torn bits burst on the rip
  const shards = [
    [-1, -1.6, 20],
    [1.2, -1.4, -30],
    [-1.6, -0.6, 50],
    [1.7, -0.8, -60],
    [0.3, -2.0, 80],
    [-0.4, -1.9, -20],
  ];
  const rd = t - T.rips;

  return (
    <AbsoluteFill style={{transform: `translate(${shake[0]}px, ${shake[1]}px)`}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #FFF6EA 0%, #FDE3CF 55%, #F2C3AE 100%)'}} />
      <Layer cam={cam} z={1000}>
        <Spr n="skin" at={SKIN_AT} a="topFront" s={SKIN_S} sy={1 - 0.025 * kick(t - T.skin, 3, 6)} />
        {/* venom pool inside the skin (no outline: liquid) */}
        <WSvg>
          {poolR > 0 && flyT < 1.5 ? (
            <>
              <ellipse cx={ST_TIP[0]} cy={ST_TIP[1] - 20} rx={poolR * 1.25} ry={poolR * 0.75} fill="rgba(206,236,80,0.45)" />
              <ellipse cx={ST_TIP[0]} cy={ST_TIP[1] - 20} rx={poolR * 0.75} ry={poolR * 0.45} fill="rgba(222,246,110,0.55)" />
            </>
          ) : null}
        </WSvg>
        {flyT < 0.7 && stGroup(
          <>
            <Spr n="stinger" at={ST_TIP} a="tip" s={ST_S} />
            {sacSq}
          </>,
        )}
        <WSvg>
          {drops.map((d, i) => (
            <Drop key={i} x={d.x} y={d.y} size={32} />
          ))}
          {BARBS.map((b, i) => (
            <Glint key={i} x={b[0] + (b[0] < ST_TIP[0] ? -6 : 6)} y={b[1] + stLift} r={40} s={popScale(t, T.barbed + i * 0.07, 0.14, T.barbed + 0.55 + i * 0.07, 0.18)} rot={t * 120 + i * 30} />
          ))}
          {rd > 0 && rd < 0.8
            ? shards.map(([vx, vy, sp], i) => {
                const x = ST_TOP[0] + vx * 420 * rd;
                const y = ST_TOP[1] + vy * 520 * rd + 0.5 * 2400 * rd * rd;
                const sc = 1 - seg(rd, 0.45, 0.8);
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${sp * rd * 10}) scale(${sc})`}>
                    <polygon points="-18,-14 20,-8 -4,18" fill="#FCCE34" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
                  </g>
                );
              })
            : null}
          <Ring cx={ring.cx} cy={ring.cy + stLift} rx={ring.rx} ry={ring.ry} s={ringS} />
        </WSvg>
        {/* the bee (attached at the torn end until the rip) */}
        {t < T.rips + 1.0 ? (
          <Spr n="bee_torn" at={[ST_TOP[0] + ripX, ST_TOP[1] - tug + ripY]} a="end" s={BEE_T_S} rot={beeRot} sx={1 / Math.sqrt(beeStretch)} sy={beeStretch} />
        ) : null}
        {/* dizzy stars around the bee's head while it flies off */}
        <WSvg>
          {t > T.rips + 0.1 && t < T.rips + 1.0
            ? [0, 1, 2].map((i) => {
                const a = (t - T.rips) * 9 + (i * Math.PI * 2) / 3;
                return <Star key={i} x={ST_TOP[0] + ripX + 100 + Math.cos(a) * 130} y={ST_TOP[1] + ripY - 640 + Math.sin(a) * 40} r={34} s={1} points={5} rot={a * 40} />;
              })
            : null}
        </WSvg>
        {swS > 0 ? (
          <Spr n="stopwatch" at={[748, 560]} a="face" s={0.28 * swS} rot={6 * Math.sin(t * 7) * seg(t, 15.5, 15.7)}>
            <g transform={`translate(${S.stopwatch.face[0]} ${S.stopwatch.face[1]}) rotate(${swHand})`}>
              <line x1={0} y1={30} x2={0} y2={-330} stroke={INK} strokeWidth={34} strokeLinecap="round" />
              <line x1={0} y1={30} x2={0} y2={-330} stroke="#FF4A3D" strokeWidth={16} strokeLinecap="round" />
              <circle cx={0} cy={0} r={30} fill={INK} />
            </g>
          </Spr>
        ) : null}
        {t > 16.45 && t < 17.2 ? (
          <WSvg>
            <Card x={cardX} y={ENTRY[1] - 40} rot={-14 + 10 * seg(t, 16.75, 16.85)} />
          </WSvg>
        ) : null}
      </Layer>
    </AbsoluteFill>
  );
};

// ====================================================================== SHOT C  17.70 - 23.18 (alarm scent -> hive -> swarm -> run)
const camC: CamKey[] = [
  {t: T.cutC, x: 700, y: 930, k: 1.38},
  {t: 18.72, x: 640, y: 900, k: 1.2},
  {t: 19.32, x: -1300, y: 1150, k: 1.55},
  {t: 20.3, x: -1305, y: 1145, k: 1.6, e: linear},
  {t: 21.1, x: 780, y: 1010, k: 1.0},
  {t: 21.85, x: 800, y: 1010, k: 1.0, e: linear},
  {t: 22.9, x: 1210, y: 1010, k: 0.96},
  {t: T.cutD, x: 1260, y: 1010, k: 0.96, e: linear},
];

const SWARM_N = 13;
const swarmBee = (i: number, t: number, guyAt: P) => {
  const t0 = T.calls + i * 0.055;
  const d = t - t0;
  if (d < 0) return null;
  const ang = i * 2.4;
  const fly = easeInOut(seg(d, 0, 0.85));
  // target: a ring around the guy's head, then chase
  const ringR = 230 + (i % 3) * 60;
  const tgt: P = [guyAt[0] + Math.cos(ang + t * 2.2) * ringR, guyAt[1] - 700 + Math.sin(ang + t * 2.6) * ringR * 0.55];
  const start: P = [HIVE_ENT[0] + 10, HIVE_ENT[1] - 10];
  const z = lerp(HIVE_Z - 40, 1000 - 10 * (i % 4), fly);
  const x = lerp(start[0], tgt[0], fly) + Math.sin(d * 6 + i) * 30 * (1 - fly);
  const y = lerp(start[1], tgt[1], fly) - Math.sin(fly * Math.PI) * 220;
  return {x, y, z, flip: true, rot: 8 * Math.sin(t * 8 + i)};
};

const ShotC: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, camC);
  const K = 1000 / (1000 - cam.z);
  const dof = t > 18.9 && t < 20.6 ? 0 : clamp((K - 1.2) / 0.6) * 2.5;

  // guy: worried looking at the hand -> scared on "you" -> runs right
  const scared = t >= T.you2;
  const running = t >= 21.85;
  const sqIn = seg(t, T.you2 - 0.06, T.you2);
  const g: GuyX = {
    sx: 1 + 0.06 * sqIn * (scared ? 0 : 1) + (scared ? 0.04 * kick(t - T.you2, 3, 6) : 0),
    sy: breathe(t) - 0.08 * sqIn * (scared ? 0 : 1) + (scared ? 0.06 * kick(t - T.you2, 3, 6) : 0),
    dy: 0,
  };
  const trem = scared && !running ? 2 * Math.sin(t * 2 * Math.PI * 9) : 0;
  const runX = running ? 1500 * easeIn(seg(t, 21.85, 22.95)) + 260 * seg(t, 21.85, 22.95) : 0;
  const runBob = running ? -Math.abs(Math.sin((t - 21.85) * Math.PI * 6.4)) * 46 : 0;
  const guyAt: P = [GUY[0] + runX, GUY[1]];

  // scent cloud: grows out of the sting site, rises, then travels into the hive entrance
  const sc0 = 17.85;
  const grow = easeOutBack(seg(t, sc0, sc0 + 0.5));
  const travel = easeInOut(seg(t, 18.8, 19.38));
  const cloudZ = lerp(1000, HIVE_Z - 60, travel);
  const startC: P = [STING_PT[0] - 40, STING_PT[1] - 70 - 200 * easeOut(seg(t, sc0, 18.7))];
  const endC: P = [HIVE_ENT[0] + 40, HIVE_ENT[1] - 40];
  const cpos: P = [lerp(startC[0], endC[0], travel), lerp(startC[1], endC[1], travel) - Math.sin(travel * Math.PI) * 260];
  const shrink = 1 - easeIn(seg(t, 19.3, 19.48));
  const cs = grow * shrink;
  const cloud: Puff[] = [
    [0, 0, 64],
    [-58, 18, 46],
    [56, 14, 50],
    [-20, -44, 46],
    [30, -40, 40],
  ].map(([x, y, r], i) => ({x: cpos[0] + x * cs + 6 * Math.sin(t * 3 + i), y: cpos[1] + y * cs + 6 * Math.cos(t * 2.6 + i), r: r * cs * (1 + 0.05 * Math.sin(t * 4 + i * 2))}));
  const banS = popScale(t, T.banana, 0.25) * shrink;

  // hive comes alive on "alarm"
  const eyesS = t < T.alarm ? 0 : easeOutBack(seg(t, T.alarm, T.alarm + 0.2));
  const hiveFace = {
    s: eyesS,
    angry: easeOut(seg(t, T.alarm + 0.1, T.alarm + 0.35)),
    look: [t < 20.4 ? 0.2 : 1, 0.3] as [number, number],
    bang: popScale(t, T.alarm + 0.12, 0.2, 20.6, 0.2),
    squash: 0.05 * kick(t - T.alarm, 2.5, 5) + 0.06 * kick(t - T.calls, 3, 6),
  };

  const bees = Array.from({length: SWARM_N}, (_, i) => swarmBee(i, t, [guyAt[0], guyAt[1] + runBob]));
  const sweatS = scared ? popScale(t, T.you2 + 0.08, 0.15) : 0;
  const sweatY = scared ? 90 * easeIn(seg(t, T.you2 + 0.3, 21.85)) : 0;

  return (
    <AbsoluteFill>
      <Meadow cam={cam} t={t} dof={dof} hiveFace={hiveFace} />
      {/* cloud on its own depth while it travels */}
      {cs > 0.01 ? (
        <Layer cam={cam} z={cloudZ}>
          <WSvg>
            <Puffs puffs={cloud} fill="#FFF09A" ink={ink(cloudZ, cam, 7)} />
            {[0, 1, 2].map((i) => (
              <Wavy key={i} x={cpos[0] - 60 + i * 60} y={cpos[1] - 70 * cs} len={110} t={t + i} color="#FFE45C" s={cs * (travel < 0.2 ? 1 : 0)} />
            ))}
          </WSvg>
          {banS > 0 ? <Spr n="banana" at={[cpos[0], cpos[1] - 4]} a="c" s={0.1 * banS * cs} rot={-20 + 8 * Math.sin(t * 3)} /> : null}
        </Layer>
      ) : null}
      {bees
        .map((b, i) => ({b, i}))
        .filter((x) => x.b && x.b.z > 1000 + 1)
        .map(({b, i}) => (
          <Layer key={`f${i}`} cam={cam} z={b!.z}>
            <Spr n="bee_angry" at={[b!.x, b!.y]} a="c" s={0.13} flip={b!.flip} rot={b!.rot} sy={1 + 0.04 * Math.sin(t * 70 + i)} />
          </Layer>
        ))}
      <Layer cam={cam} z={1000}>
        <WSvg>
          <SoftShadow x={guyAt[0] - 10} y={GUY[1] + 4} rx={150 * (1 + runBob / 300)} ry={22} />
          <SoftShadow x={FLOWER[0]} y={FLOWER[1] - 2} rx={70} ry={14} />
        </WSvg>
        <Spr n="flower" at={FLOWER} a="feet" s={FS} rot={1.5 * Math.sin(t * 1.4)} />
        {!scared ? (
          <Spr n="guy_hand" at={GUY} a="feet" s={GS} sx={g.sx} sy={g.sy}>
            <GuyFace head={S.guy_hand.head as unknown as number[]} mood="worried" look={[-1, 0.7]} />
          </Spr>
        ) : !running ? (
          <Spr n="guy_scared" at={[GUY[0] + trem, GUY[1]]} a="feet" s={GS} sx={g.sx} sy={g.sy}>
            <Sweat x={S.guy_scared.head[0] + 250} y={S.guy_scared.head[1] - 170 + sweatY} size={56} s={sweatS} rot={-15} />
          </Spr>
        ) : (
          <Spr n="guy_run" at={[guyAt[0], guyAt[1] + runBob]} a={[640, S.guy_run.feet[1]]} s={0.82} flip rot={4 * Math.sin((t - 21.85) * Math.PI * 6.4)}>
            <Sweat x={S.guy_run.head[0] - 200} y={S.guy_run.head[1] - 150} size={70} s={1} rot={20} />
          </Spr>
        )}
        {bees
          .map((b, i) => ({b, i}))
          .filter((x) => x.b && x.b.z <= 1000 + 1)
          .map(({b, i}) => (
            <Spr key={`n${i}`} n="bee_angry" at={[b!.x, b!.y]} a="c" s={0.13} flip={b!.flip} rot={b!.rot} sy={1 + 0.04 * Math.sin(t * 70 + i)} />
          ))}
      </Layer>
      <Foreground cam={cam} />
    </AbsoluteFill>
  );
};

// ====================================================================== SHOT D  23.18 - 27.10 (bee or wasp? + subscribe)
const ShotD: React.FC<{t: number}> = ({t}) => {
  const bump = 1 + 0.035 * kick(t - T.worse, 2.5, 6) + 0.02 * kick(t - 24.18, 3, 7);
  const beeX = keys(t, [[T.cutD, -420], [T.cutD + 0.32, 285, easeOutBack]]) + 34 * easeInOut(seg(t, T.whichIsWorse, T.whichIsWorse + 0.25));
  const lean = 6 * easeInOut(seg(t, T.whichIsWorse, T.whichIsWorse + 0.25));
  // wasp anchored at its stinger tip so the jabs read clearly
  const restTip: P = [1062 - 34 * easeInOut(seg(t, T.whichIsWorse, T.whichIsWorse + 0.25)), 1530];
  const inX = keys(t, [[T.wasp - 0.02, 760], [T.wasp + 0.3, 0, easeOutBack]]);
  const jabPos: P = [690, 1428];
  const toJab = easeInOut(seg(t, 25.72, 25.98));
  const jabs = [26.0, 26.22, 26.44];
  let jabDy = 0;
  for (const j of jabs) {
    const d = t - j;
    if (d > -0.07 && d < 0) jabDy = Math.max(jabDy, 1 + d / 0.07);
    else if (d >= 0 && d < 0.12) jabDy = Math.max(jabDy, 1 - d / 0.12);
  }
  const zip = easeIn(seg(t, 26.75, 27.05));
  const tip: P = [lerp(restTip[0] + inX, jabPos[0], toJab) - 1500 * zip, lerp(restTip[1], jabPos[1], toJab) - 40 + jabDy * 52 - 300 * zip];
  const waspRot = lerp(-4 * Math.sin(t * 2.3) - lean, -32, toJab) + 20 * zip;
  const btnY = keys(t, [[T.subscribe - 0.05, 2150], [T.subscribe + 0.3, 1560, easeOutBack]]);
  const pressed = jabs.reduce((acc, j) => acc + Math.max(0, kick(t - j, 4, 10)), 0);
  const subbed = t >= jabs[2];
  const vsS = popScale(t, 24.18, 0.22) * (1 + 0.06 * kick(t - T.worse, 3, 6));
  const wingBuzz = 1 + 0.02 * Math.sin(t * 60);

  return (
    <AbsoluteFill style={{transform: `scale(${bump})`}}>
      <AbsoluteFill style={{background: '#FFD54A'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <polygon points="700,-10 1090,-10 1090,1930 380,1930" fill="#8E7CF0" />
        <line x1={700} y1={-10} x2={380} y2={1930} stroke={INK} strokeWidth={16} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <Spr n="bee_smug" at={[beeX, 780 + 12 * Math.sin(t * 3.1)]} a="c" s={0.38} rot={lean + 3 * Math.sin(t * 2.2)} sy={wingBuzz} />
        {t > T.wasp - 0.03 ? (
          <Spr n="wasp" at={tip} a="tip" s={0.42} rot={waspRot}>
            <Bandage x={1150} y={1000} s={1} rot={30} size={0.9} />
          </Spr>
        ) : null}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {vsS > 0 ? (
            <g transform={`translate(560 420) scale(${vsS}) rotate(-6)`}>
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={900} fontSize={250} fill="#FF4A3D" stroke={INK} strokeWidth={40} strokeLinejoin="round" paintOrder="stroke" dx={10} dy={12}>
                VS
              </text>
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight={900} fontSize={250} fill="#FFFFFF" stroke={INK} strokeWidth={22} strokeLinejoin="round" paintOrder="stroke">
                VS
              </text>
            </g>
          ) : null}
        </svg>
        {btnY < 2100 ? (
          <div
            style={{
              position: 'absolute',
              left: 540 - 330,
              top: btnY - 85,
              width: 660,
              height: 170,
              transformOrigin: '50% 100%',
              transform: `scale(${1 + 0.06 * pressed}, ${1 - 0.1 * pressed})`,
              borderRadius: 48,
              border: `10px solid ${INK}`,
              background: subbed ? '#9A9A9A' : '#FF2D2D',
              boxShadow: `0 14px 0 ${INK}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: subbed ? 74 : 88,
              letterSpacing: 2,
              color: '#FFFFFF',
              WebkitTextStroke: `4px ${INK}`,
              boxSizing: 'border-box',
            }}
          >
            {subbed ? 'SUBSCRIBED ✓' : 'SUBSCRIBE'}
          </div>
        ) : null}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {jabs.map((j, i) => (
            <Star key={i} x={jabPos[0] + 4} y={jabPos[1] + 26} r={46} s={popScale(t, j, 0.08, j + 0.1, 0.1)} rot={i * 25} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ====================================================================== composition
export const BeesSting: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#D6F0FF', overflow: 'hidden'}}>
      {t < T.cutB ? <ShotA t={t} /> : t < T.cutC ? <ShotB t={t} /> : t < T.cutD ? <ShotC t={t} /> : <ShotD t={t} />}
      <SoundTrack />
    </AbsoluteFill>
  );
};
