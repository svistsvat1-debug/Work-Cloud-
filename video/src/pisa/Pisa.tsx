import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {Guy, POSES, Pose, headCenter} from './Guy';
import {SB, SH, StoreyState, Tower, TowerFace} from './Tower';
import {
  A_TOP,
  CLOUD_SPAN,
  Cam,
  Clouds,
  GROUND,
  Ground,
  Hills,
  Layer,
  STRONG,
  SOFT,
  Sky,
  Stars,
  SunMoon,
  TX,
  YearSign,
  clayTopY,
} from './World';
import {ClayArm, ClayEyes, FlyingHat, FlyingMallet, Puff, Sparkle, Sweat, ThoughtBubble, WarCloud, WaterDrop, WeightArrow, Zzz} from './Fx';
import {T} from './timing';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, seg, track, wobble} from './util';
import {PisaSound} from './Sound';

const FONT = 'Fredoka';

/* ================================================= camera ================================================= */
type CK = [number, number, number, number]; // t, x, y, k
const CAM: CK[] = [
  [0, 550, 990, 1.08],
  [2.0, 550, 975, 1.12],
  [2.6, 550, 975, 1.12],
  [3.9, 590, 1170, 1.25],
  [6.5, 585, 1190, 1.28],
  [7.35, 560, 1380, 1.3],
  [9.6, 560, 1395, 1.33],
  [10.6, 560, 1395, 1.33],
  [11.55, 560, 1090, 0.95],
  [15.1, 560, 1080, 0.97],
  [17.0, 470, 1290, 1.12],
  [17.9, 440, 1690, 1.75],
  [22.55, 440, 1700, 1.78],
  [23.5, 610, 1060, 1.3],
  [26.25, 610, 1050, 1.3],
  [27.45, 550, 990, 1.08],
  [28.0, 550, 990, 1.08],
];
const camAt = (t: number): Cam => {
  let i = 1;
  while (i < CAM.length - 1 && t > CAM[i][0]) i++;
  const a = CAM[i - 1];
  const b = CAM[i];
  const u = easeInOut(seg(t, a[0], b[0]));
  return {x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u))};
};
const SHAKES: [number, number, number][] = [
  [2.16, 5, 6],
  [5.3, 12, 7],
  [8.44, 16, 6],
  [18.29, 7, 8],
  [18.8, 7, 8],
  [26.62, 5, 9],
  [26.8, 5, 9],
  [26.98, 5, 9],
  [27.16, 5, 9],
  [27.34, 6, 9],
];
const shake = (t: number): [number, number] => {
  let a = 0;
  for (const [t0, amp, dec] of SHAKES) if (t >= t0) a += amp * Math.exp(-dec * (t - t0));
  a += 2.5 * clamp(seg(t, 13.8, 14.0)) * (1 - seg(t, 14.9, 15.2)); // distant war rumble
  return [a * (Math.sin(2 * Math.PI * 13.3 * t) + 0.6 * Math.sin(2 * Math.PI * 7.1 * t + 1)) / 1.6, a * (Math.sin(2 * Math.PI * 11.7 * t + 2) + 0.6 * Math.sin(2 * Math.PI * 5.3 * t)) / 1.6];
};

/* ================================================= tower ================================================= */
const TILT: [number, number, ((u: number) => number)?][] = [
  [0, 6],
  [2.1, 6],
  [2.42, 8.6, easeOut],
  [2.75, 5.6],
  [2.95, 6.2],
  [3.65, 0.8],
  [5.3, 0.8],
  [5.4, 1.4, easeOut],
  [6.9, 1.4],
  [8.4, 3.0],
  [8.52, 3.9, easeOut],
  [19.1, 3.9],
  [21.0, 4.2],
  [26.55, 4.2],
  [26.64, 4.6, easeOut],
  [26.82, 5.0, easeOut],
  [27.0, 5.4, easeOut],
  [27.18, 5.7, easeOut],
  [27.36, 6.0, easeOut],
];
const SINK: [number, number, ((u: number) => number)?][] = [
  [0, 24],
  [2.65, 24],
  [3.65, 0],
  [5.3, 0],
  [5.42, 5, easeOut],
  [6.9, 5],
  [8.4, 14],
  [8.52, 18, easeOut],
  [19.1, 18],
  [21.0, 24],
];
const DENT: [number, number, ((u: number) => number)?][] = [
  [0, 22],
  [2.7, 22],
  [3.6, 4],
  [6.9, 4],
  [8.4, 12],
  [8.5, 16, easeOut],
  [19.1, 16],
  [21.0, 22],
];
const towerPose = (t: number) => ({tilt: track(t, TILT), sink: track(t, SINK)});
/** world x of the tower's right wall at world height Y */
const wallX = (Y: number, tilt: number, sink: number) => {
  const a = (tilt * Math.PI) / 180;
  const h = (GROUND + sink + 280 * Math.sin(a) - Y) / Math.cos(a);
  return TX - 140 + 280 * Math.cos(a) + h * Math.sin(a);
};
const FLY_OFF = (i: number) => 2.62 + (7 - i) * 0.16; // storeys 7..2 lift off ("before it was even finished")
const LAND_2 = 5.3; // the third floor drops back on "three"
const LAND = (i: number) => 26.62 + (i - 3) * 0.18; // coda: storeys 3..7 drop in
const FALL = 0.55;
const storeyState = (i: number, t: number): StoreyState => {
  if (i < 2) return {on: true, dy: 0};
  const tf = FLY_OFF(i);
  if (t < tf) return {on: true, dy: 0};
  const tl = i === 2 ? LAND_2 : LAND(i);
  if (t < tl - FALL) {
    const dt = t - tf;
    const dy = -(300 * dt + 0.5 * 5200 * dt * dt);
    return {on: dy > -2600, dy, rot: 0};
  }
  if (t < tl) {
    const g = (2 * 1600) / (FALL * FALL);
    return {on: true, dy: -0.5 * g * (tl - t) * (tl - t)};
  }
  return {on: true, dy: 0};
};
const landings = [LAND_2, 3, 4, 5, 6, 7].map((x, i) => (i === 0 ? (x as number) : LAND(x as number)));
const towerSquash = (t: number) => {
  let s = 1;
  for (const tl of landings) s += wobble(t, tl, -0.05, 3.5, 7);
  return s;
};

const towerFace = (t: number): TowerFace => {
  const base: TowerFace = {open: 1, mode: 'eyes', look: [0.6, 0.6], brows: -0.1, lid: 0.45};
  const blink = (tb: number) => (t > tb && t < tb + 0.14 ? 1 - Math.sin((Math.PI * (t - tb)) / 0.14) : 1);
  if (t < 2.1) return {...base, open: blink(1.1)};
  if (t < 2.62) return {open: 1, mode: 'eyes', look: [0.3, -0.2], pupil: 0.72, brows: 1, lid: 0, pop: 1 + wobble(t, 2.12, 0.12, 4, 8)};
  if (t < 3.55) return {open: 1, mode: 'eyes', look: [0, -1], brows: 0.5, browUp: 6, lid: 0};
  if (t < 5.0) return {open: blink(4.3), mode: 'eyes', look: [0.75, 0.3], brows: 0, lid: 0};
  if (t < LAND_2) return {open: 1, mode: 'eyes', look: [0, -1], brows: 0.4, browUp: 4, lid: 0};
  if (t < LAND_2 + 0.16) return {open: 1, mode: 'squeeze', look: [0, 0], brows: 0.6};
  if (t < 6.6) return {open: 1, mode: 'eyes', look: [0.6, 0.4], brows: 0, lid: 0, pop: 1 + wobble(t, LAND_2 + 0.16, 0.1, 4, 8)};
  if (t < 8.42) return {open: 1, mode: 'eyes', look: [0.1, 1], brows: 1, lid: 0};
  if (t < 8.6) return {open: 1, mode: 'squeeze', look: [0, 0], brows: 1};
  if (t < 9.7) return {open: 1, mode: 'eyes', look: [0.2, 1], pupil: 0.75, brows: 1, lid: 0, pop: 1 + wobble(t, 8.6, 0.1, 4, 8)};
  if (t < 10.95) return {open: blink(10.2), mode: 'eyes', look: [1, 0.1], brows: 0.5, lid: 0};
  if (t < 12.95) return {open: 0, mode: 'sleep', look: [0, 0], brows: 0};
  if (t < 14.95) {
    const peek = clamp(seg(t, 12.95, 13.15));
    return {open: 1, mode: 'eyes', look: [-1, -0.3], brows: 0.3 * peek, lid: 0.15, winkL: 1};
  }
  if (t < 16.45) return {open: 1, mode: 'eyes', look: [0.1, 0.1], brows: -0.1, lid: 0, pop: 1 + wobble(t, 14.95, 0.12, 4, 8)};
  if (t < 17.3) return {open: 1, mode: 'happy', look: [0, 0], brows: 0};
  if (t < 18.25) return {open: 1, mode: 'eyes', look: [0, 1], brows: 0.3, lid: 0};
  if ((t > 18.25 && t < 18.55) || (t > 18.76 && t < 19.02)) return {open: 1, mode: 'squeeze', look: [0, 0], brows: -0.6};
  if (t < 21.9) return {open: blink(20.4), mode: 'eyes', look: [0.1, 1], brows: 0.2, lid: 0};
  if (t < 22.9) return {open: 1, mode: 'eyes', look: [0, 1], brows: -0.3, browUp: 6, lid: 0, pop: 1 + wobble(t, 21.96, 0.1, 4, 8)};
  if (t < 25.84) return {open: blink(24.0), mode: 'eyes', look: [0.85, -0.8], brows: 0.3, lid: 0};
  if (t < 26.45) return {open: 1, mode: 'eyes', look: [0.85, -0.6], pupil: 0.7, brows: 1, lid: 0, pop: 1 + wobble(t, 25.86, 0.14, 4, 8)};
  if (t < 27.55) return {open: 1, mode: 'eyes', look: [0, -1], brows: 0.4, browUp: 5, lid: 0};
  const u = easeInOut(seg(t, 27.55, 27.85));
  return {...base, look: [lerp(0, 0.6, u), lerp(-1, 0.6, u)], brows: lerp(0.4, -0.1, u), browUp: lerp(5, 0, u), lid: lerp(0, 0.45, u)};
};

/* ================================================= clay + water ================================================= */
const softness = (t: number) => track(t, [
  [0, 0],
  [2.7, 0],
  [3.6, 1],
  [19.1, 1],
  [21.0, 0],
]);
type Drop = {x: number; y: number; keep: boolean};
const DROPS: Drop[] = [
  {x: -330, y: 1640, keep: true},
  {x: 320, y: 1700, keep: true},
  {x: -290, y: 1930, keep: true},
  {x: 300, y: 1945, keep: true},
  {x: -170, y: 1585, keep: false},
  {x: 70, y: 1592, keep: false},
  {x: -60, y: 1650, keep: false},
  {x: 185, y: 1615, keep: false},
  {x: -215, y: 1735, keep: false},
  {x: 120, y: 1725, keep: false},
  {x: 235, y: 1790, keep: false},
  {x: -95, y: 1850, keep: false},
  {x: 30, y: 1880, keep: false},
  {x: 160, y: 1895, keep: false},
  {x: -170, y: 1940, keep: false},
];
const LEAVERS = DROPS.filter((d) => !d.keep);
export const dropLeave = (j: number) => T.squeezed + 0.02 + j * 0.12;
const pulse = (t: number, t0: number) => (t < t0 ? 0 : Math.exp(-7 * (t - t0)));

const DropsLayer: React.FC<{t: number}> = ({t}) => {
  const press = Math.max(pulse(t, T.weight), pulse(t, 18.8));
  return (
    <g>
      {DROPS.map((d, i) => {
        const x0 = TX + d.x;
        if (d.keep) {
          const bob = 3 * Math.sin(t * 3 + i);
          return <WaterDrop key={i} x={x0} y={d.y + bob} s={1} sq={press * 0.6} face={t > 18.2 && t < 21 ? 'squeeze' : 'calm'} look={d.x < 0 ? 1 : -1} />;
        }
        const j = LEAVERS.indexOf(d);
        const ta = 2.72 + j * 0.08;
        const te = dropLeave(j);
        if (t < ta) return null;
        if (t < te) {
          const s = popIn(t, ta, 0.25);
          const near = Math.exp(-((d.x / 220) ** 2));
          return <WaterDrop key={i} x={x0} y={d.y + 2 * Math.sin(t * 4 + i)} s={s} sq={press * (0.5 + 0.5 * near)} face={t > 18.2 ? 'squeeze' : 'calm'} look={d.x < 0 ? 1 : -1} />;
        }
        const u = seg(t, te, te + 0.55);
        if (u >= 1) return null;
        const up = d.y < 1765;
        const ty = up ? A_TOP + 75 : 2075;
        const tx = x0 + Math.sign(d.x || 1) * 110;
        const x = lerp(x0, tx, easeOut(u));
        const y = lerp(d.y, ty, easeOut(u)) - Math.sin(Math.PI * u) * 40;
        const s = popOut(t, te + 0.36, 0.19);
        return <WaterDrop key={i} x={x} y={y} s={s} face="happy" />;
      })}
    </g>
  );
};

/* ================================================= the guy ================================================= */
type GuyState = {pose: Pose; x: number; flip: boolean; sx: number; sy: number; dy: number; show: boolean};
const SWAPS: [number, string][] = [
  [2.12, 'pushStrain'],
  [2.72, 'push'],
  [3.68, 'builderNoHat'],
  [5.32, 'thumbs'],
  [7.3, 'scared'],
  [9.9, 'toss'],
  [10.42, 'walk'],
  [23.42, 'engineer'],
  [25.84, 'engineerWince'],
  [26.44, 'push'],
];
const BUILDER_X = 735;
const ENG_X = 775;
const guyState = (t: number, tilt: number, sink: number): GuyState => {
  const pushX = wallX(GROUND - 160, tilt, sink) + 120;
  const strainX = wallX(GROUND - 158, tilt, sink) + 122;
  let pose: Pose = POSES.push;
  let x = pushX;
  let flip = false;
  let dy = 0;
  let show = true;
  if (t < 2.12) x = pushX;
  else if (t < 2.72) {
    pose = POSES.pushStrain;
    x = strainX;
  } else if (t < 3.68) x = pushX;
  else if (t < 3.86) {
    pose = {...POSES.builder, hat: false};
    x = BUILDER_X;
  } else if (t < 5.32) {
    pose = POSES.builder;
    x = BUILDER_X;
  } else if (t < 7.3) {
    pose = POSES.thumbs;
    x = BUILDER_X;
  } else if (t < 9.9) {
    pose = POSES.scared;
    x = BUILDER_X + 1.6 * Math.sin(2 * Math.PI * 11 * t) * clamp(seg(t, 7.3, 7.5));
  } else if (t < 10.42) {
    pose = POSES.toss;
    x = BUILDER_X;
  } else if (t < 11.7) {
    const k = Math.floor((t - 10.42) / 0.14);
    pose = k % 2 === 0 ? POSES.walkA : POSES.walkB;
    flip = true;
    x = lerp(BUILDER_X, 1560, easeIn(seg(t, 10.42, 11.7)) * 0.45 + seg(t, 10.42, 11.7) * 0.55);
    dy = -9 * Math.abs(Math.sin((Math.PI * (t - 10.42)) / 0.14));
  } else if (t < 22.85) show = false;
  else if (t < 23.42) {
    const k = Math.floor((t - 22.85) / 0.14);
    pose = k % 2 === 0 ? POSES.walkA : POSES.walkB;
    x = lerp(1200, ENG_X, easeOut(seg(t, 22.85, 23.42)));
    dy = -9 * Math.abs(Math.sin((Math.PI * (t - 22.85)) / 0.14));
  } else if (t < 25.84) {
    pose = POSES.engineer;
    x = ENG_X;
  } else if (t < 26.44) {
    pose = POSES.engineerWince;
    x = ENG_X + 1.4 * Math.sin(2 * Math.PI * 12 * t);
  } else {
    pose = POSES.push;
    x = lerp(ENG_X, pushX, easeOut(seg(t, 26.38, 26.6)));
  }
  // squash-swap envelope (narrow before the swap, stretch + damped settle after)
  let sx = 1;
  let sy = 1 + 0.008 * Math.sin(2 * Math.PI * 0.5 * t);
  for (const [ts, name] of SWAPS) {
    if (name === 'walk') continue;
    if (t >= ts - 0.07 && t < ts) {
      const u = seg(t, ts - 0.07, ts);
      sx *= 1 - 0.16 * u;
      sy *= 1 + 0.05 * u;
    } else if (t >= ts && t < ts + 0.6) {
      const d = t - ts;
      const e = Math.exp(-9 * d) * Math.cos(2 * Math.PI * 3 * d);
      sx *= 1 - 0.16 * e;
      sy *= 1 + 0.05 * e;
    }
  }
  // the hat landing: small weight dip
  sy *= 1 + wobble(t, 3.86, -0.04, 4, 9);
  return {pose, x, flip, sx, sy, dy, show};
};

/* ================================================= composition ================================================= */
export const Pisa: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const [fontHandle] = useState(() => delayRender('font'));
  useEffect(() => {
    const f = new FontFace(FONT, `url(${staticFile('fonts/fredoka-latin-700-normal.woff2')})`, {weight: '700'});
    f.load()
      .then((ff) => {
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(ff);
        continueRender(fontHandle);
      })
      .catch(() => continueRender(fontHandle));
  }, [fontHandle]);

  const c0 = camAt(t);
  const [shx, shy] = shake(t);
  const cam: Cam = {x: c0.x - shx / c0.k, y: c0.y - shy / c0.k, k: c0.k};

  // day / night time-lapse: 2 days in 2 s (soft ramps, no strobing)
  const theta0 = Math.atan2(300 - 1330, 230 - 540);
  const phase = 2 * easeInOut(seg(t, 10.95, 12.95)); // days
  const theta = theta0 + 2 * Math.PI * phase;
  const night = 0.85 * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase)); // smooth: sun at the bottom = midnight
  const cloudOff = 140 * Math.sin((2 * Math.PI * t) / 28) + CLOUD_SPAN * easeInOut(seg(t, 10.95, 12.95));

  const {tilt, sink} = towerPose(t);
  const squash = towerSquash(t);
  const storeys = Array.from({length: 8}, (_, i) => storeyState(i, t));
  const face = towerFace(t);
  const soft = softness(t);
  const dent = track(t, DENT);
  const wob = 7 * clamp(seg(t, 6.6, 6.9)) * (1 - seg(t, 8.7, 9.3));
  const g = guyState(t, tilt, sink);
  const dof = clamp((cam.k - 1.12) * 6, 0, 3.2);
  const year = Math.round(lerp(1178, 1272, easeInOut(seg(t, 10.95, 12.85))));
  const clayCol = (() => {
    const pa = [STRONG, SOFT].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    return `rgb(${pa[0].map((v, i) => Math.round(lerp(v, pa[1][i], soft))).join(',')})`;
  })();

  // mini tower in the thought bubble ("if they'd kept building ...")
  const miniN = Array.from({length: 8}, (_, i) => (i < 3 ? 1 : popIn(t, T.without + 0.08 + (i - 3) * 0.17, 0.2)));
  const built = miniN.slice(3).reduce((a, b) => a + clamp(b), 0);
  const TOP0 = 25.5;
  const TOP1 = 25.98;
  const miniTilt = t < TOP0 ? 3.8 + built * 1.05 : t < TOP1 ? 9 + 73 * easeIn(seg(t, TOP0, TOP1)) : 82 + wobble(t, TOP1, -5, 4, 8);

  const hc = headCenter(POSES.engineer);
  const sparkT = T.saved - 0.04;

  return (
    <AbsoluteFill style={{backgroundColor: '#7fcdfc', overflow: 'hidden'}}>
      <Sky night={night} />
      <Stars night={night} t={t} />
      <SunMoon theta={theta} />
      <AbsoluteFill style={{filter: night > 0.005 ? `brightness(${1 - 0.45 * night}) saturate(${1 - 0.3 * night})` : undefined}}>
        <Layer cam={cam} z={4500} blur={dof * 0.8}>
          <Clouds off={cloudOff} />
        </Layer>
        <Layer cam={cam} z={2600} blur={dof}>
          <Hills />
          <WarCloud x={-560} y={1408} t={t} s={1.8 * popIn(t, T.probably + 0.25, 0.3) * popOut(t, 15.22, 0.25)} />
          <Puff x={-560} y={1408} t={t} t0={15.3} dur={0.6} size={3.8} color="#d9c9ad" seed={77} />
        </Layer>
        <Layer cam={cam} z={1000}>
          <Ground soft={soft} dent={dent} wob={wob} t={t} />
          <DropsLayer t={t} />
          <WeightArrow x={TX + 4} y={1462 + sink * 0.3} s={popIn(t, T.weight - 0.08, 0.3) * popOut(t, 20.55, 0.22)} sy={1 + 0.18 * Math.max(pulse(t, T.weight), pulse(t, 18.8))} />
          <ClayEyes x={TX} y={1772} s={popIn(t, T.so + 0.02, 0.32) * popOut(t, 22.95, 0.22)} brows={t > T.stronger ? -1 : 0} look={t > T.stronger ? [0, 0] : [0, -0.6]} />
          {[-1, 1].map((side) => (
            <ClayArm
              key={side}
              side={side}
              x={TX + side * 118}
              y={clayTopY(TX + side * 118, dent, 0, t) + 12}
              s={popIn(t, T.stronger - 0.06, 0.3) * popOut(t, 22.88, 0.22)}
              flex={0.5 + 0.5 * Math.sin(Math.max(0, t - T.stronger) * 2 * Math.PI * 2.2 - Math.PI / 2)}
              color={clayCol}
            />
          ))}
          <YearSign year={year} s={popIn(t, 4.15, 0.32) * popOut(t, 22.95, 0.22)} font={FONT} />
          {/* tower */}
          <g transform={`translate(${TX} ${GROUND + sink}) rotate(${tilt} -140 0)`}>
            <Tower storeys={storeys} face={face} squash={squash} />
            <Sweat t={t} t0={2.18} x={128} y={-150} slide={46} />
            <Sweat t={t} t0={7.32} x={-128} y={-140} slide={50} ang={10} />
            <Sweat t={t} t0={8.2} x={128} y={-128} slide={44} />
            <Sweat t={t} t0={25.9} x={130} y={-140} slide={48} dur={0.8} />
            <Puff x={-160} y={SB[2]} t={t} t0={LAND_2} dur={0.75} size={1.1} dir={-1} seed={3} />
            <Puff x={160} y={SB[2]} t={t} t0={LAND_2} dur={0.75} size={1.1} dir={1} seed={5} />
            {[3, 4, 5, 6, 7].map((i) => (
              <g key={i}>
                <Puff x={-150} y={SB[i]} t={t} t0={LAND(i)} dur={0.5} size={0.7} dir={-1} seed={10 + i} n={5} />
                <Puff x={150} y={SB[i]} t={t} t0={LAND(i)} dur={0.5} size={0.7} dir={1} seed={20 + i} n={5} />
              </g>
            ))}
            <Zzz x={170} y={SB[2] - SH[2] - 30} t={t} t0={11.0} t1={12.75} font={FONT} />
          </g>
          {/* mud kicked up when the clay nearly gives way */}
          <Puff x={TX + 175} y={GROUND - 6} t={t} t0={8.44} dur={0.55} size={0.6} color="#e3c497" dir={1} seed={31} />
          <Puff x={TX - 175} y={GROUND - 6} t={t} t0={8.47} dur={0.55} size={0.55} color="#e3c497" dir={-1} seed={37} />
          {/* "saved it" sparkles */}
          {[
            [-190, 1010, 0],
            [200, 940, 0.07],
            [-120, 880, 0.14],
            [150, 1080, 0.21],
            [240, 820, 0.28],
          ].map(([dx, y, d], i) => (
            <Sparkle key={i} x={TX + dx} y={y} s={popIn(t, sparkT + d, 0.25) * popOut(t, 17.25 + d * 0.5, 0.2) * (1 + 0.15 * Math.sin(t * 14 + i))} rot={t * 40} />
          ))}
          {/* the guy */}
          {g.show && (
            <g transform={`translate(${g.x} ${GROUND + g.dy}) scale(${(g.flip ? -1 : 1) * g.sx} ${g.sy})`}>
              <Guy p={g.pose} />
            </g>
          )}
          {/* hat drops onto his head (becomes the builder) */}
          {t > 3.3 && t < 3.86 && (() => {
            const h = headCenter(POSES.builder);
            const g2 = (2 * 760) / (0.5 * 0.5);
            const dt = 3.86 - t;
            return <FlyingHat x={BUILDER_X + h[0]} y={GROUND + h[1] - 0.5 * g2 * dt * dt} rot={8 * Math.sin(dt * 20)} />;
          })()}
          {/* mallet tossed over his shoulder when the work stops */}
          {t > 9.98 && t < 10.9 && (() => {
            const dt = t - 9.98;
            return <FlyingMallet x={BUILDER_X + 92 + 760 * dt} y={GROUND - 224 - 1100 * dt + 0.5 * 2600 * dt * dt} rot={-40 + 760 * dt} />;
          })()}
          {/* hat flies off at the end (back to frame 0) */}
          {t > 26.44 && t < 27.3 && (() => {
            const dt = t - 26.44;
            return <FlyingHat x={ENG_X + hc[0] + 900 * dt} y={GROUND + hc[1] - 1250 * dt + 0.5 * 2200 * dt * dt} rot={540 * dt} />;
          })()}
          <ThoughtBubble x={790} y={825} t={t} t0={T.without - 0.15} t1={26.3} head={[ENG_X + hc[0], GROUND + hc[1]]} mini={{n: miniN, tilt: miniTilt, drop: TOP1}} />
        </Layer>
      </AbsoluteFill>
      <PisaSound />
    </AbsoluteFill>
  );
};

