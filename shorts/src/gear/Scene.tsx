import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FPS, T, TAG_T, TAG_FLY_T, TAG_FLY_DUR, DURATION} from './timing';
import {INK, clamp, easeInOutCubic, easeOutCubic, keys, lerp, popIn, popOut, prog, rand, shake, spring, squash, Key} from './util';
import {GuyDrawing, PoseName, FaceName} from './Guy';
import {CONCRETE, Concrete, ConcreteFace, ConcreteFaceState, FACE, GROUND_Y, LAST, MESH, MachineBack} from './Machine';
import {Bush, CText, Cloud, Galaxy, Hills, Pointer, Puff, Star, Sun, SweatDrop, Tag, Toolbox, TurnRing, Zzz} from './Effects';
import {SoundTrack} from './Sound';

// ---- 2.5D multiplane camera ----------------------------------------------------------------------
type Cam = {x: number; y: number; z: number; k: number; sx: number; sy: number};
const Layer: React.FC<{cam: Cam; z: number; filter?: string; minDepth?: number; children: React.ReactNode}> = ({cam, z, filter, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: filter || undefined, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + cam.sx}px, ${960 + cam.sy}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        <svg width={1} height={1} style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}>
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// accelerate, glide at constant speed, decelerate (no velocity jumps)
const trap = (a: number) => (u: number) => {
  const v = 1 / (1 - a);
  if (u < a) return (v * u * u) / (2 * a);
  if (u > 1 - a) {
    const w = 1 - u;
    return 1 - (v * w * w) / (2 * a);
  }
  return v * (u - a / 2);
};

const CAM_KEYS: Key[] = [
  {t: 0, v: [655, 1125, 1.25]},
  {t: 1.7, v: [655, 1130, 1.29], ease: (u) => u},
  {t: 4.4, v: [660, 1440, 1.55]},
  {t: 5.45, v: [660, 1440, 1.55]},
  {t: 6.95, v: [665, 1452, 1.66]},
  {t: 7.25, v: [665, 1452, 1.66]},
  {t: 8.3, v: [765, 615, 1.9]},
  {t: 12.6, v: [765, 1412, 1.9], ease: trap(0.1)},
  {t: 13.35, v: [765, 1412, 1.9]},
  {t: 14.45, v: [650, 1010, 0.92]},
  {t: 15.25, v: [650, 1010, 0.92]},
  {t: 16.25, v: [640, 1440, 1.6]},
  {t: 19.4, v: [642, 1436, 1.66], ease: (u) => u},
  {t: 20.6, v: [650, 1230, 1.22]},
  {t: 22.85, v: [652, 1222, 1.25], ease: (u) => u},
  {t: 23.55, v: [760, 1530, 1.95]},
  {t: 24.45, v: [758, 1526, 1.97], ease: (u) => u},
  {t: 26.0, v: [655, 1125, 1.25]},
  {t: DURATION, v: [655, 1125, 1.25]},
];

const camAt = (t: number): Cam => {
  // interpolate scale in log space so zooms feel even
  const logKeys = CAM_KEYS.map((k) => ({...k, v: [k.v[0], k.v[1], Math.log(k.v[2])]}));
  const [x, y, lk] = keys(t, logKeys);
  const k = Math.exp(lk);
  // shakes: concrete thud, motor rev rumble, poof
  let amp = 0;
  amp += Math.max(0, spring(t - T.concrete, 7, 9, 0)) * (t > T.concrete ? 1 : 0);
  const rev = t > 5.6 && t < 7.4 ? Math.sin(Math.PI * prog(t, 5.6, 7.4)) * 4.5 : 0;
  amp += rev;
  amp += t > 22.95 ? 3.5 * Math.exp(-7 * (t - 22.95)) : 0;
  amp += t > 15.02 ? 2.5 * Math.exp(-8 * (t - 15.02)) : 0;
  const s = shake(t, amp);
  return {x, y, z: 1000 - 1000 / k, k, sx: s.x, sy: s.y};
};

// ---- character schedule ----------------------------------------------------------------------------
type GK = {t: number; pose: PoseName; face: FaceName; look: [number, number]};
const GUY_KEYS: GK[] = [
  {t: 0, pose: 'point', face: 'curious', look: [1, 0.4]},
  {t: 5.52, pose: 'ears', face: 'squeeze', look: [0, 0]},
  {t: 7.22, pose: 'chin', face: 'think', look: [0.4, -1]},
  {t: 13.66, pose: 'shock', face: 'shock', look: [0.2, -1]},
  {t: 15.66, pose: 'watch', face: 'bored', look: [1, 0.2]},
  {t: 19.6, pose: 'sleep', face: 'sleep', look: [0, 0]},
  {t: 22.95, pose: 'shock', face: 'startled', look: [-0.4, -0.2]},
  {t: 24.52, pose: 'shrug', face: 'happy', look: [0.2, 0]},
  {t: 26.12, pose: 'point', face: 'curious', look: [1, 0.4]},
];
const GUY = {x: 440, y: GROUND_Y + 2};
const BLINKS = [1.25, 3.05, 9.5, 11.6, 16.9, 18.15, 25.2];

const Character: React.FC<{t: number}> = ({t}) => {
  let cur = GUY_KEYS[0];
  for (const g of GUY_KEYS) if (t >= g.t) cur = g;
  let sx = 1;
  let sy = 1;
  for (const g of GUY_KEYS.slice(1)) {
    const s = squash(t, g.t);
    sx *= s.sx;
    sy *= s.sy;
  }
  const breathe = 1 + 0.009 * Math.sin((t * 2 * Math.PI * 16) / DURATION);
  sy *= breathe;
  const trem = cur.pose === 'ears' ? 1.6 * Math.sin(t * 2 * Math.PI * 9.3) + 0.8 * Math.sin(t * 2 * Math.PI * 14.1) : 0;
  let blink = 0;
  for (const b of BLINKS) {
    const u = (t - b) / 0.14;
    if (u > 0 && u < 1) blink = Math.sin(u * Math.PI);
  }
  const beard = t < 19.75 || t >= 22.95 ? 0 : easeInOutCubic(prog(t, 19.75, 21.7));
  const tilt = cur.pose === 'sleep' ? -7 + 1.5 * Math.sin(t * 2 * Math.PI * 0.35) : 0;
  // stopwatch hand: speeds up while time "flies"
  const w0 = 15.66;
  const dt = Math.max(0, t - w0);
  const watchHand = 360 * (1.2 * dt + 0.55 * dt * dt);
  return (
    <g transform={`translate(${GUY.x + trem} ${GUY.y}) scale(${sx} ${sy})`}>
      <GuyDrawing pose={cur.pose} face={cur.face} look={cur.look} blink={blink} beard={beard} headTilt={tilt} watchHand={watchHand} />
    </g>
  );
};

// ---- concrete face schedule --------------------------------------------------------------------------
const concreteFace = (t: number): ConcreteFaceState => {
  const base: ConcreteFaceState = {open: 0, lid: 0, look: [0, 0], brow: 0, squeeze: false, mouth: 'none'};
  if (t < T.so || t > 26.32) return base;
  const open = t < 25.98 ? popIn(t, T.so, 0.34) : 1 - easeInOutCubic(prog(t, 26.12, 26.32));
  let s: ConcreteFaceState = {...base, open};
  if (t < 7.2) {
    s = {...s, look: [-0.5, -1], brow: 1, mouth: 'worry'};
    if (t > 6.25 && t < 6.98) s = {...s, squeeze: true};
    if (t >= 6.98) s = {...s, look: [0, 0], brow: 0.6, mouth: 'o'};
  } else if (t < 13.3) {
    s = {...s, look: [-0.2, -1], brow: 0.3, mouth: 'flat'};
  } else if (t < 15.6) {
    s = {...s, look: [-0.2, -1], brow: 1, mouth: 'o'};
  } else if (t < 19.7) {
    s = {...s, look: [0.25, -1], lid: 0.42, brow: -0.1, mouth: 'flat'};
  } else if (t < T.concrete7) {
    s = {...s, lid: lerp(0.42, 1, easeInOutCubic(prog(t, 19.7, 20.1))), brow: 0, mouth: 'sleep'};
  } else {
    const opening = easeOutCubic(prog(t, T.concrete7, T.concrete7 + 0.25));
    const look: [number, number] = t > T.standing && t < T.still ? [0.3, -1] : [0, 0.1];
    s = {...s, lid: lerp(1, 0.38, opening), look, brow: -0.2, mouth: 'smile'};
    if (t > 25.98) s = {...s, lid: lerp(0.38, 1, easeInOutCubic(prog(t, 25.98, 26.12)))};
  }
  return s;
};

// ---- sky: day/night + time-lapse sun ----------------------------------------------------------------
const FAR_Z = 6000;
const K0 = 1000 / FAR_Z;
// place something in the far layer by where it should be on screen in frame 0
const sky = (sx: number, sy: number) => [640 + (sx - 540) / K0, 1090 + (sy - 960) / K0];
const TH0 = 4.2;
const sunTheta = (t: number) => {
  if (t < 15.8) return TH0;
  if (t < 19.45) {
    const u = prog(t, 15.8, 19.45);
    return TH0 + 2 * Math.PI * 2.75 * (0.3 * u + 0.7 * u * u);
  }
  const thEnd = TH0 + 2 * Math.PI * 2.75;
  if (t < 22.85) return thEnd;
  return lerp(thEnd, TH0 + 2 * Math.PI * 3, easeOutCubic(prog(t, 22.85, 23.45)));
};
const sunScreen = (t: number) => {
  const th = sunTheta(t);
  return [540 + 700 * Math.cos(th), 1350 + 1000 * Math.sin(th)];
};
const nightAt = (t: number) => {
  const space = t < 19.45 ? 0 : t < 22.85 ? easeInOutCubic(prog(t, 19.45, 20.1)) : 1 - easeInOutCubic(prog(t, 22.85, 23.35));
  return space;
};
const mix = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `rgb(${A.map((x, i) => Math.round(lerp(x, B[i], u))).join(',')})`;
};

const STARS = Array.from({length: 70}, (_, i) => ({
  x: rand(i * 3.1) * 1180 - 50,
  y: rand(i * 7.7 + 2) * 1150 - 40,
  r: 4 + rand(i * 5.3) * 7,
  at: 19.6 + rand(i * 9.1) * 0.9,
  tw: rand(i * 2.2) * 6,
}));

// ---- the composition ---------------------------------------------------------------------------------
export const GearShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t);
  const n = nightAt(t);
  const dof = 3.2 * clamp((cam.k - 1.15) / 0.5);
  const dim = n > 0.001 ? `brightness(${1 - 0.3 * n}) saturate(${1 - 0.2 * n})` : '';
  const blur = (b: number) => (b > 0.05 ? `blur(${b.toFixed(2)}px)` : '');
  const f = (...xs: string[]) => xs.filter(Boolean).join(' ');

  // motor
  const motorBump = spring(t - T.motor, 0.06, 7, 22) * (t > T.motor ? 1 : 0);
  const revAmp = t > 5.6 && t < 7.2 ? Math.sin(Math.PI * prog(t, 5.6, 7.2)) * 2.6 : 0;
  const motorJitter = shake(t * 1.7, revAmp);
  // concrete squash on "concrete"
  const cq = t > T.concrete ? spring(t - T.concrete, 0.035, 8, 24) : 0;
  const [sunX, sunY] = sunScreen(t);
  const [sunWX, sunWY] = sky(sunX, sunY);

  // tags & banner
  const tagNodes: React.ReactNode[] = [];
  let arrived = 0;
  const BANNER = {x: 650, y: 360};
  TAG_T.forEach((at, i) => {
    const m = MESH[i];
    const side = i % 2 === 0 ? -1 : 1;
    // tag 0 sits above the worm (clear of the motor); the rest alternate left / right of the tower
    const hx = i === 0 ? 862 : side < 0 ? 598 : 930;
    const hy = i === 0 ? 548 : m.y;
    const fly = TAG_FLY_T[i];
    if (t < fly) {
      const s = popIn(t, at, 0.3);
      tagNodes.push(<Tag key={i} x={hx} y={hy} s={s} />);
    } else if (t < fly + TAG_FLY_DUR) {
      const u = easeInOutCubic((t - fly) / TAG_FLY_DUR);
      const x = lerp(hx, BANNER.x + (i - 5.5) * 30, u);
      const y = lerp(hy, BANNER.y, u) - Math.sin(u * Math.PI) * 160;
      tagNodes.push(<Tag key={i} x={x} y={y} s={1 - 0.55 * u} />);
    } else arrived++;
  });
  const bannerIn = TAG_FLY_T[0] + TAG_FLY_DUR;
  const bannerS = t < 15.62 ? popIn(t, bannerIn, 0.3) : popOut(t, 15.62, 0.22);
  let pulse = 0;
  TAG_FLY_T.forEach((ft) => {
    const a = ft + TAG_FLY_DUR;
    if (t > a) pulse += spring(t - a, 0.07, 10, 30);
  });
  pulse += t > 15.0 ? spring(t - 15.0, 0.1, 7, 20) : 0;
  const num0 = arrived > 0 ? (BigInt(50) ** BigInt(arrived)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  const num = num0;
  const bw = 110 + 0.62 * 56 * (num.length + 1) - 0.3 * 56 * (num.split(',').length - 1);

  return (
    <AbsoluteFill style={{background: `linear-gradient(${mix('#69c3f5', '#0b1030', n)}, ${mix('#d6f1ff', '#2a2f66', n)})`}}>
      {/* far sky: sun, stars, galaxy */}
      <Layer cam={cam} z={FAR_Z} filter={f(blur(dof))}>
        {STARS.map((s, i) => {
          const sc = t < 22.85 ? popIn(t, s.at, 0.3) : popOut(t, 22.85 + (i % 7) * 0.03, 0.2);
          const tw = 0.75 + 0.25 * Math.sin(t * 5 + s.tw);
          const [wx, wy] = sky(s.x, s.y);
          return <Star key={i} x={wx} y={wy} r={s.r / K0} s={sc * tw} />;
        })}
        {(() => {
          const [gx, gy] = sky(250, 330);
          const gs = t < 22.85 ? popIn(t, 21.95, 0.45) : popOut(t, 22.85, 0.25);
          return <Galaxy x={gx} y={gy} r={190 / K0} s={gs} rot={(t - 21.9) * 25} />;
        })()}
        {sunY < 1500 && <Sun x={sunWX} y={sunWY} r={62 / K0} t={t} />}
      </Layer>
      {/* clouds */}
      <Layer cam={cam} z={3600} filter={f(blur(dof * 0.9), dim)}>
        <Cloud x={-900 + 260 * Math.sin((2 * Math.PI * t) / DURATION)} y={-1100} s={2.4} />
        <Cloud x={2300 - 200 * Math.sin((2 * Math.PI * t) / DURATION)} y={-700} s={2.0} />
        <Cloud x={600 + 160 * Math.sin((2 * Math.PI * t) / DURATION)} y={-1700} s={1.6} />
      </Layer>
      {/* far ground: hills with the horizon line */}
      <Layer cam={cam} z={3000} filter={f(blur(dof * 0.85), dim)}>
        <Hills y={1960} />
      </Layer>
      {/* mid ground */}
      <Layer cam={cam} z={1800} filter={f(blur(dof * 0.6), dim)}>
        <rect x={-4000} y={1863} width={9000} height={4000} fill="#8ccd6c" />
        <Bush x={-140} y={1890} s={1.5} />
        <Bush x={1480} y={1880} s={1.3} c="#56a852" />
        <Bush x={1700} y={1900} s={1.0} />
      </Layer>
      {/* main plane */}
      <Layer cam={cam} z={1000} filter={dim}>
        <rect x={-3000} y={GROUND_Y} width={8000} height={3000} fill="#8ccd6c" />
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
        </defs>
        <ellipse cx={(CONCRETE.x0 + CONCRETE.x1) / 2} cy={GROUND_Y + 4} rx={170} ry={16} fill="rgba(72,54,42,0.26)" filter="url(#soft)" />
        <ellipse cx={GUY.x + 10} cy={GROUND_Y + 2} rx={86} ry={14} fill="rgba(72,54,42,0.26)" filter="url(#soft)" />
        <MachineBack t={t} motorBump={motorBump} motorJitter={motorJitter} />
        <Concrete sx={1 + cq * 0.6} sy={1 - cq} />
        <ConcreteFace s={concreteFace(t)} />
        <SweatDrop t={t} at={5.9} until={6.95} x={884} y={1492} slide={70} />
        {/* motor puffs */}
        <Puff t={t} at={0.36} x={597} y={515} dx={-30} dy={-70} size={22} seed={1} life={0.9} />
        {[5.7, 6.0, 6.3, 6.6].map((a, k) => (
          <Puff key={k} t={t} at={a} x={597} y={515} dx={-60 + k * 15} dy={-110} size={30} seed={k + 2} life={1.1} />
        ))}
        <Character t={t} />
        <Puff t={t} at={22.95} x={GUY.x + 24} y={GUY.y - 240} dx={0} dy={-20} size={70} color="#ffffff" seed={9} life={0.55} />
        <Zzz t={t} from={20.1} to={22.5} x={GUY.x + 80} y={GUY.y - 420} />
        <Pointer x={LAST.x + 78 + 6 * Math.sin(t * 2 * Math.PI * 2)} y={LAST.y - 18} s={t < 4.75 ? popIn(t, T.last, 0.3) : popOut(t, 4.75)} />
        <TurnRing cx={LAST.x} cy={LAST.y} r={104} u={prog(t, T.turn - 0.03, 18.95)} s={popOut(t, 19.3)} />
        {(() => {
          const s = t < 18.35 ? popIn(t, T.two, 0.3) : popOut(t, 18.35);
          if (s <= 0.001) return null;
          return (
            <g transform={`translate(700 1290) scale(${s})`}>
              <CText x={0} y={0} size={48} fill="#ffe066">
                2+ TRILLION YEARS
              </CText>
            </g>
          );
        })()}
        {tagNodes}
        {bannerS > 0.001 && (
          <g transform={`translate(${BANNER.x} ${BANNER.y}) scale(${bannerS * (1 + pulse)})`}>
            <rect x={-bw / 2} y={-62} width={bw} height={124} rx={30} fill="#fff" stroke={INK} strokeWidth={8} />
            <CText x={0} y={4} size={56} fill="#e8483a" sw={0}>
              {'÷' + num}
            </CText>
          </g>
        )}
      </Layer>
      {/* foreground dressing */}
      <Layer cam={cam} z={700} filter={dim}>
        <Toolbox x={300} y={1690} s={0.75} />
      </Layer>
      <SoundTrack />
    </AbsoluteFill>
  );
};

// QA sheet: every pose / face on a coloured background
export const PoseSheet: React.FC = () => {
  const poses: [PoseName, FaceName, number][] = [
    ['point', 'curious', 0],
    ['ears', 'squeeze', 0],
    ['chin', 'think', 0],
    ['shock', 'shock', 0],
    ['watch', 'bored', 0],
    ['sleep', 'sleep', 1],
    ['shock', 'startled', 0],
    ['shrug', 'happy', 0],
  ];
  return (
    <AbsoluteFill style={{background: '#7fd0c6'}}>
      <svg width={1080} height={1920}>
        {poses.map(([p, fc, b], i) => (
          <g key={i} transform={`translate(${170 + (i % 3) * 370} ${480 + Math.floor(i / 3) * 560}) scale(0.95)`}>
            <GuyDrawing pose={p} face={fc} beard={b} headTilt={p === 'sleep' ? -7 : 0} look={[0.6, 0]} watchHand={40} />
          </g>
        ))}
        <g transform="translate(-380 280) scale(0.9)">
          <MachineBack t={1.3} motorBump={0} motorJitter={{x: 0, y: 0}} />
          <Concrete sx={1} sy={1} />
          <ConcreteFace s={{open: 1, lid: 0.4, look: [0.3, -1], brow: 0.5, squeeze: false, mouth: 'smile'}} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
