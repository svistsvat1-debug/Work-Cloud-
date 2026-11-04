import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import beats from './beats.json';
import {Blackbird, BEAK_TIP, HEAD_FRONT, Woodpecker, WPExpr} from './birds';
import {Brain, BrainFace, BrainProps, SweatDrop} from './brain';
import {
  C,
  CamKey,
  DUR,
  FPS60,
  INK,
  Layer,
  T,
  camAt,
  clamp,
  easeIn,
  easeInOut,
  easeOut,
  easeOutBack,
  impactAmp,
  lerp,
  popIn,
  popOut,
  prog,
  shakeXY,
  wobble,
} from './core';
import {
  BirdPicture,
  Calendar,
  ChipSpawn,
  Chips,
  Cloud,
  Football,
  Hills,
  ImpactLines,
  Jar,
  Magnifier,
  QMark,
  Shelf,
  Sparkle,
  Stanchions,
  Star,
  Trunk,
  branchTopY,
} from './props';

export const wp02Duration = Math.round(DUR * FPS60);

// ------------------------------------------------------------ world anchors
const WP = {x: 600, y: 1250}; // woodpecker feet on the trunk
const HEAD = {x: WP.x + HEAD_FRONT[0], y: WP.y + HEAD_FRONT[1]}; // front head centre (world)
const BB = {x: 150, y: branchTopY(150)}; // blackbird perch
const CAM0 = {x: 470, y: 975, z: 250};
const CAM_HEAD = {x: HEAD.x, y: HEAD.y + 6, z: 640};

// ------------------------------------------------------------ pecking
const PERIOD = beats.period;
const peckD = (tau: number) => {
  const c = ((tau % PERIOD) + PERIOD) % PERIOD;
  if (c < 0.04) return 0;
  if (c < 0.07) return lerp(0, -26, easeOut((c - 0.04) / 0.03));
  if (c < 0.1) return lerp(-26, 22, easeIn((c - 0.07) / 0.03));
  for (const h of [0.1, 0.2]) {
    const local = c - h;
    if (local < 0.1) return local < 0.06 ? lerp(22, -26, easeOut(local / 0.06)) : lerp(-26, 22, easeIn((local - 0.06) / 0.04));
  }
  const local = c - 0.3;
  return local < 0.12 ? lerp(22, 0, easeOut(local / 0.12)) : 0;
};
const peckAt = (t: number) => {
  for (const [a, b] of beats.pecking) if (t >= a && t < b) return peckD(t - a);
  return 0;
};
const CHIP_SPAWNS: ChipSpawn[] = beats.pecks.map((p) => ({
  t: p.t,
  seed: p.c * 10 + p.j + 1,
  x: WP.x + BEAK_TIP[0] + 18,
  y: WP.y + BEAK_TIP[1] + 4,
}));

// ------------------------------------------------------------ helpers
const blinkAt = (t: number, times: number[]) => {
  for (const b of times) {
    const d = Math.abs(t - b);
    if (d < 0.07) return 1 - d / 0.07;
  }
  return 0;
};
/** narrow-point squash used to hide a drawing swap */
const swapSquash = (t: number, at: number, w = 0.08, depth = 0.24) => 1 - depth * Math.max(0, 1 - Math.abs(t - at) / w);
const breathe = (t: number): [number, number] => [1 - 0.004 * Math.sin(2 * Math.PI * 0.6 * t), 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t)];

// ------------------------------------------------------------ cameras
const forestCam = (t: number) => {
  if (t < T.cutMuseum)
    return camAt(
      [
        {t: 0, ...CAM0},
        {t: T.pushSlow, ...CAM0},
        {t: T.never, x: 462, y: 945, z: 330},
        {t: T.so1 - 0.05, x: 462, y: 945, z: 330},
        {t: T.brain1 + 0.4, ...CAM_HEAD},
      ],
      t,
    );
  if (t < T.cutBird) return {x: 455, y: 900, z: 300};
  const keys: CamKey[] = [
    {t: T.cutBird, x: 360, y: 1170, z: -160},
    {t: T.pushBrain, x: 360, y: 1170, z: -160},
    {t: T.pushBrain + 0.62, ...CAM_HEAD},
    {t: T.pullBack, ...CAM_HEAD},
    {t: T.pullBack + 1.0, ...CAM0},
  ];
  return camAt(keys, t);
};
const museumCam = (t: number) =>
  camAt(
    [
      {t: T.cutMuseum, x: 180, y: 1080, z: -420},
      {t: T.checked + 0.1, x: 540, y: 1150, z: -100},
      {t: T.lensZoom, x: 540, y: 1150, z: -100},
      {t: T.found + 0.3, x: 540, y: 1159, z: 740},
    ],
    t,
  );

// ------------------------------------------------------------ woodpecker state
const woodpeckerState = (t: number) => {
  const sideA = t < T.turnFront;
  const sideB = t >= T.turnBack + 0.06;
  const head: 'side' | 'front' = sideA || sideB ? 'side' : 'front';
  let peck = peckAt(t);
  if (t >= T.never && t < T.turnFront) peck = lerp(0, -12, easeOut(prog(t, T.never + 0.1, T.turnFront)));
  let headScaleX = swapSquash(t, T.turnFront) * swapSquash(t, T.turnBack + 0.06);
  let headRot = 0;
  let headDX = 0;
  let headDY = 0;
  let expr: WPExpr = 'neutral';
  let look: [number, number] | undefined;
  let wing: 'rest' | 'shrug' = 'rest';
  let xray = 0;
  let helmet: {y: number; rot: number} | null = null;
  const brain: BrainProps = {id: 'wpb', face: 'happy', look: [0, 0]};
  let sq = breathe(t);
  const blink = blinkAt(t, [1.35, 9.0, 15.05, 16.75, 20.0, 25.05]);

  // --- shot 1
  if (t < T.cutMuseum) {
    if (t >= T.turnFront) expr = t < T.knocked ? 'neutral' : t < T.out + 0.12 ? 'up' : 'smug';
    headRot += 9 * wobble(t, T.out, 5.2, 4.5);
    headDY += -14 * Math.max(0, wobble(t, T.turnFront, 2.6, 6));
    xray = easeInOut(prog(t, T.so1, T.brain1 + 0.05));
    if (t >= T.fine) brain.face = t < T.right ? 'proud' : 'happy';
    if (t >= T.doubt) {
      brain.face = 'side';
      brain.look = [0.9, 0];
      brain.sweat = prog(t, T.doubt + 0.1, T.cutMuseum + 0.2);
    }
  }
  // --- shot 3 football
  else if (t >= T.cutFootball && t < T.cutBird) {
    expr = t < T.players ? 'up' : t < T.players + 0.32 ? 'squeeze' : t < T.buildup - 0.5 ? 'neutral' : t < T.damage1 ? 'worried' : 'dizzy';
    for (const h of [T.hit1, T.hit2, T.hit3]) {
      if (t >= h && t < h + 0.12) expr = 'squeeze';
      headDX += 16 * wobble(t, h, 3.2, 8);
      headRot += 7 * wobble(t, h, 3.2, 8);
    }
    const fallT = 0.24;
    if (t >= T.football) {
      const tf = t - T.football;
      const g = (2 * 900) / (fallT * fallT);
      const y = tf < fallT ? -900 + 0.5 * g * tf * tf : -26 * Math.max(0, wobble(t, T.players, 3.2, 8));
      helmet = {y, rot: tf < fallT ? -14 * (1 - tf / fallT) : 9 * wobble(t, T.players, 3.6, 6)};
    }
    const land = Math.max(0, wobble(t, T.players, 3.4, 7));
    sq = [sq[0] * (1 + 0.07 * land), sq[1] * (1 - 0.09 * land)];
  }
  // --- shot 4/5/6 (blackbird, brain close-up, shrug)
  else if (t >= T.cutBird) {
    expr = t < T.blackbirds ? 'neutral' : t < T.dontPeck ? 'look' : 'side';
    xray = easeInOut(prog(t, T.showed, T.showed + 0.32)) * (1 - easeInOut(prog(t, T.pullBack + 0.06, T.pullBack + 0.38)));
    brain.clumps = [1, 1, 1, 1, 1, 1];
    brain.face = 'worried';
    brain.sweat = t < T.pushBrain ? prog(t, T.none + 0.05, T.none + 0.95) : -1;
    if (t >= T.damage2) {
      brain.face = 'dizzy';
      brain.crack = prog(t, T.damage2, T.damage2 + 0.16);
    }
    if (t >= T.protection) {
      brain.face = 'proud';
      brain.crack = -1;
      brain.helmet = popIn(t, T.protection, 0.3);
    }
    if (t >= T.pullBack) {
      expr = t < T.nobody ? 'neutral' : 'shrug';
      if (t >= T.nobody && t < T.yet + 0.16) wing = 'shrug';
    }
    headRot += t >= T.nobody && t < T.yet + 0.16 ? 6 * easeOut(prog(t, T.nobody, T.nobody + 0.2)) : 0;
    // shrug swaps hide inside an anticipation squash
    const s1 = swapSquash(t, T.nobody, 0.08, 0.06);
    const s2 = swapSquash(t, T.yet + 0.16, 0.08, 0.06);
    sq = [sq[0] * (2 - s1 * s2), sq[1] * s1 * s2];
  }
  if (t >= T.turnBack + 0.06) {
    expr = 'neutral';
  }
  // brain bob on "right?" (nod) and head nod
  if (t >= T.right && t < T.right + 0.5) headDY += 10 * Math.sin(((t - T.right) / 0.25) * Math.PI) * (1 - prog(t, T.right, T.right + 0.5));
  headScaleX = clamp(headScaleX, 0.7, 1);
  return {head, peck, headScaleX, headRot, headDX, headDY, expr, look, wing, xray, helmet, brain, squash: sq, blink};
};

// ------------------------------------------------------------ backgrounds
const Sky: React.FC = () => <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyBottom} 78%)`}} />;

const ForestScene: React.FC<{t: number}> = ({t}) => {
  const cam = forestCam(t);
  const peckBump = impactAmp(
    t,
    beats.pecks.map((p) => ({t: p.t, a: 1.6})),
    18,
  );
  const hitBump = impactAmp(t, [
    {t: T.players, a: 16},
    {t: T.hit1, a: 9},
    {t: T.hit2, a: 9},
    {t: T.hit3, a: 11},
  ]);
  const shake = shakeXY(t, peckBump + hitBump);
  const dof = 3.4 * clamp((cam.z - 150) / 400);
  const s = woodpeckerState(t);

  // blackbird
  let bb: React.ReactNode = null;
  if (t >= T.cutBird && t < T.pushBrain + 0.9) {
    let x = BB.x;
    let y = BB.y;
    let flying: number | undefined;
    let perched = true;
    let sq: [number, number] = [1, 1];
    if (t < T.blackbirds) {
      const u = prog(t, T.cutBird, T.blackbirds);
      x = lerp(-760, BB.x, easeOut(u));
      y = lerp(760, BB.y, Math.pow(u, 1.7));
      flying = t * 30;
      perched = false;
    } else if (t >= T.pushBrain + 0.06) {
      const u = prog(t, T.pushBrain + 0.06, T.pushBrain + 0.66);
      x = lerp(BB.x, -1300, easeIn(u));
      y = BB.y - 1100 * u + 300 * u * u;
      flying = t * 30;
      perched = false;
    } else {
      const land = Math.max(0, wobble(t, T.blackbirds, 3.2, 7));
      sq = [1 + 0.1 * land, 1 - 0.13 * land];
    }
    const shakeNo = t >= T.dontPeck && t < T.dontPeck + 0.72 ? 13 * Math.sin(2 * Math.PI * 3.4 * (t - T.dontPeck)) * (1 - prog(t, T.dontPeck, T.dontPeck + 0.72)) : 0;
    const expr = t < T.blackbirds + 0.15 ? 'neutral' : t >= T.dontPeck && t < T.dontPeck + 0.72 ? 'happy' : t >= T.showed ? 'happy' : 'smug';
    bb = (
      <g transform={`translate(${x} ${y}) scale(1.12)`}>
        <Blackbird
          id="bb"
          expr={expr}
          blink={blinkAt(t, [19.9, 21.0])}
          headRot={shakeNo}
          squash={sq}
          flying={flying}
          perched={perched}
          xray={easeInOut(prog(t, T.showed, T.showed + 0.32))}
          brain={{id: 'bbb', face: 'proud'}}
        />
        {[0, 1, 2].map((i) => {
          const at = T.none + 0.05 + i * 0.1;
          const sc = popIn(t, at, 0.22) * popOut(t, at + 0.55, 0.2);
          const pos = [
            [-50, -390],
            [120, -330],
            [-110, -260],
          ][i];
          return <Sparkle key={i} x={pos[0]} y={pos[1]} s={sc * 1.1} rot={(t - at) * 90} />;
        })}
      </g>
    );
  }

  // football shot extras
  const balls: React.ReactNode[] = [];
  if (t >= T.cutFootball && t < T.cutBird) {
    [T.hit1, T.hit2, T.hit3].forEach((h, i) => {
      const t0 = h - 0.3;
      if (t < t0 || t > h + 0.8) return;
      const hx = HEAD.x - 128 + s.headDX * 0;
      const hy = HEAD.y - 40;
      let x: number;
      let y: number;
      let rot: number;
      if (t < h) {
        const u = (t - t0) / 0.3;
        x = lerp(-140, hx, u);
        y = lerp(hy - 260 + i * 120, hy, u) - 140 * 4 * u * (1 - u);
        rot = -60 + 300 * u;
      } else {
        const a = t - h;
        x = hx - 420 * a;
        y = hy - 520 * a + 0.5 * 3200 * a * a;
        rot = 240 - 900 * a;
      }
      balls.push(
        <g key={`ball-${i}`} transform={`translate(${x} ${y})`}>
          <Football rot={rot} />
        </g>,
      );
      balls.push(<ImpactLines key={`imp-${i}`} x={hx - 20} y={hy} u={prog(t, h, h + 0.22)} />);
    });
  }

  // stars
  const stars: React.ReactNode[] = [];
  const starRing = (t0: number, tOut: number, cy: number, rx: number) => {
    for (let i = 0; i < 3; i++) {
      const sc = popIn(t, t0 + i * 0.06, 0.24) * popOut(t, tOut + i * 0.04, 0.2);
      if (sc <= 0.01) continue;
      const a = (t - t0) * 7 + (i * 2 * Math.PI) / 3;
      stars.push(<Star key={`st-${t0}-${i}`} x={HEAD.x + Math.cos(a) * rx} y={HEAD.y + cy + Math.sin(a) * rx * 0.28} s={sc * (0.9 + 0.25 * Math.sin(a))} rot={(t - t0) * 160} />);
    }
  };
  if (t < T.cutMuseum) starRing(T.knocked, T.out + 0.1, -175, 150);
  if (t >= T.cutFootball && t < T.cutBird) starRing(T.damage1, T.cutBird + 1, -215, 165);

  // sparkles near the brain
  const sparkles: React.ReactNode[] = [];
  const brainSpark = (at: number, pts: [number, number][]) =>
    pts.forEach(([dx, dy], i) => {
      const a = at + i * 0.08;
      const sc = popIn(t, a, 0.22) * popOut(t, a + 0.5, 0.2);
      sparkles.push(<Sparkle key={`sp-${at}-${i}`} x={HEAD.x + dx} y={HEAD.y + dy} s={sc * 0.75} rot={(t - a) * 120} />);
    });
  if (t < T.cutMuseum) brainSpark(T.fine, [[78, -96], [-86, -60]]);
  if (t >= T.cutBird) brainSpark(T.protection + 0.1, [[84, -112], [-92, -84], [10, -150]]);

  // question marks
  const qs: React.ReactNode[] = [];
  if (t >= T.nobody) {
    const pts: [number, number, number][] = [
      [-215, -150, -14],
      [185, -175, 12],
      [-40, -330, -4],
    ];
    pts.forEach(([dx, dy, r], i) => {
      const at = T.nobody + 0.16 + i * 0.15;
      const sc = popIn(t, at, 0.26) * popOut(t, T.yet + 0.12 + i * 0.03, 0.18);
      qs.push(<QMark key={`q-${i}`} x={HEAD.x + dx} y={HEAD.y + dy + 6 * Math.sin((t - at) * 6)} s={sc} rot={r + 4 * Math.sin((t - at) * 5)} />);
    });
  }

  // sweat on the woodpecker's head in the football shot
  const wpSweat =
    t >= T.buildup && t < T.damage1 ? (
      <SweatDrop x={HEAD.x + 118} y={HEAD.y + lerp(-60, 10, prog(t, T.buildup, T.damage1 - 0.1))} s={1.6 * popIn(t, T.buildup, 0.2) * popOut(t, T.damage1 - 0.2, 0.18)} />
    ) : null;

  return (
    <AbsoluteFill>
      <Sky />
      <Layer cam={cam} z={4200} blur={dof * 1.1} shake={shake}>
        <Cloud x={-900} y={-1650} s={3.6} />
        <Cloud x={1950} y={-700} s={3.2} />
        <Cloud x={2400} y={-2300} s={2.8} />
        <Cloud x={-1900} y={-300} s={3.0} />
      </Layer>
      <Layer cam={cam} z={3200} blur={dof} shake={shake}>
        <Hills y={2380} color={C.hillFar} seed={3} amp={110} step={760} />
      </Layer>
      <Layer cam={cam} z={2400} blur={dof * 0.9} shake={shake}>
        <Hills y={2330} color={C.hillMid} seed={11} amp={80} step={520} outline />
      </Layer>
      <Layer cam={cam} z={1700} blur={dof * 0.7} shake={shake}>
        <Hills y={2240} color={C.hillNear} seed={21} amp={60} step={300} outline />
      </Layer>
      <Layer cam={cam} z={1000} shake={shake}>
        <Trunk />
        {bb}
        <g transform={`translate(${WP.x} ${WP.y})`}>
          <Woodpecker
            id="wp"
            head={s.head}
            expr={s.expr}
            look={s.look}
            blink={s.blink}
            peck={s.peck}
            headRot={s.headRot}
            headDX={s.headDX}
            headDY={s.headDY}
            squash={s.squash}
            wing={s.wing}
            xray={s.xray}
            brain={s.brain}
            helmet={s.helmet}
            headScaleX={s.headScaleX}
          />
        </g>
        <Chips t={t} spawns={CHIP_SPAWNS} />
        {stars}
        {sparkles}
        {balls}
        {wpSweat}
        {qs}
      </Layer>
    </AbsoluteFill>
  );
};

const MuseumScene: React.FC<{t: number}> = ({t}) => {
  const cam = museumCam(t);
  const zoomU = easeInOut(prog(t, T.lensZoom, T.found + 0.3));
  const jarXs = [-380, 80, 540, 1000, 1460];
  const jarBrain = (i: number): BrainProps => {
    if (i === 2) {
      const awake = t >= T.wpBrains;
      return {id: `jb${i}`, face: awake ? 'open' : 'sleep', look: [0.35, -0.6]};
    }
    const at = T.museums + [0, 0.09, 0, 0.18, 0.27][i];
    return {id: `jb${i}`, face: t >= at ? 'open' : 'sleep', look: [i < 2 ? 0.85 : -0.85, -0.1]};
  };
  const bobFor = (i: number) => {
    const at = i === 2 ? T.wpBrains : T.museums + [0, 0.09, 0, 0.18, 0.27][i];
    return -16 * Math.max(0, wobble(t, at, 3, 6)) + 4 * Math.sin(t * 1.6 + i);
  };
  // magnifier slides in on "checked"
  const magU = prog(t, T.checked, T.checked + 0.42);
  const magX = t < T.checked ? 2200 : lerp(2200, 540, easeOutBack(magU, 1.3));
  const magY = 1159 + 6 * Math.sin(t * 2.2) * (1 - zoomU);
  // magnified brain inside the lens
  let face: BrainFace = 'open';
  if (t >= T.clumps) face = 'shock';
  if (t >= T.protein) face = 'worried';
  if (t >= T.tau) face = 'gulp';
  const clumps = [0, 1, 2, 3, 4, 5].map((i) => popIn(t, T.clumps + i * 0.085, 0.24));
  const S = lerp(1.25, 0.66, zoomU);
  const lensBrain: BrainProps = {
    id: 'lens',
    face,
    look: [0, -0.15],
    clumps,
    clumpWiggle: t >= T.tau ? prog(t, T.tau, T.tau + 1) : 0,
    sweat: t >= T.protein ? prog(t, T.protein + 0.1, T.cutFootball) : -1,
  };
  const flip = easeIn(prog(t, T.y2018, T.y2018 + 0.2));
  const fgBlur = 3;
  const wallBlur = 2.6 * zoomU;
  return (
    <AbsoluteFill style={{backgroundColor: C.wall}}>
      <Layer cam={cam} z={2600} blur={wallBlur}>
        <rect x={-8000} y={-8000} width={16000} height={16000} fill={C.wall} />
        {Array.from({length: 40}).map((_, i) => (
          <rect key={i} x={-4000 + i * 220} y={-6000} width={70} height={8000} fill={C.wallShade} />
        ))}
        <rect x={-8000} y={1960} width={16000} height={6000} fill={C.wainscot} />
        <rect x={-8000} y={1940} width={16000} height={44} fill={C.wainscotDark} stroke={INK} strokeWidth={10} />
        {Array.from({length: 30}).map((_, i) => (
          <rect key={`p${i}`} x={-4000 + i * 420} y={2100} width={300} height={500} rx={20} fill="none" stroke={C.wainscotDark} strokeWidth={14} />
        ))}
        <Calendar x={-700} y={-380} flip={flip} />
        <BirdPicture x={1150} y={-520} />
      </Layer>
      <Layer cam={cam} z={1000} minDepth={150}>
        <Shelf x0={-900} x1={2100} y={1300} />
        {jarXs.map((x, i) => (
          <Jar key={i} x={x} y={1300} brain={jarBrain(i)} bob={bobFor(i)} labelIcon={i === 2} />
        ))}
      </Layer>
      <Layer cam={cam} z={900} minDepth={60}>
        <g transform={`translate(${magX} ${magY})`}>
          <Magnifier id="mag">
            <g transform={`scale(${S})`}>
              <Brain {...lensBrain} />
            </g>
          </Magnifier>
        </g>
      </Layer>
      <Layer cam={cam} z={650} blur={fgBlur}>
        <Stanchions xs={[-480, 200, 890, 1580]} y={2085} />
      </Layer>
    </AbsoluteFill>
  );
};

export const WP02: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS60;
  const museum = t >= T.cutMuseum && t < T.cutFootball;
  return (
    <AbsoluteFill style={{backgroundColor: C.skyBottom}}>
      {museum ? <MuseumScene t={t} /> : <ForestScene t={t} />}
      {withAudio && <Html5Audio src={staticFile('gen/wp02/mix.wav')} />}
    </AbsoluteFill>
  );
};

