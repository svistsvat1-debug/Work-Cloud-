import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, CUT_C, CUT_D, DURATION, FPS, T, T_IMPACT, VO_AT} from './scene';
export {DURATION as BW_DURATION, FPS as BW_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did a buzzard teach us to fly?" - sand dunes by the sea.
// A: a man hangs under a bat-wing glider; a wind cloud with a face blows, the glider tips; he swings his body, it is not
// enough, he crashes into the sand (dizzy stars). B: two brothers with a bicycle look up; a buzzard glides in, the wind
// tips it too; it stays calm (whistles), twists its wingtips (swap + curved arrows) and rolls back level, winks.
// C: the brothers' biplane glider flies on cables; one brother pulls, the wingtips twist, it rolls back level.
// D: a modern jet flies in, the wind tips it, little flaps on the wingtips flick and it levels; the buzzard flies beside
// it and twists its wingtips the same way on the last word (wink + ping). The wind cloud is back for the loop.

const F = (n: string) => staticFile(`buzzard-wings/${n}.png`);
export const FONT = 'BuzzInter';
export const useBuzzFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.8; // preview mix peaked -4.7 dBFS at -1.5
const INK = '#000';
export const SKY = `rgb(${SPR.bg.sky.join(',')})`;
const SAND = `rgb(${SPR.bg.sand.join(',')})`;
const PUFF_SAND = '#F4DB97';

// ---------- world layout (world units = background plate pixels, 1024 x 1536) ----------
const HEAD = 46; // guy head radius (world)
const GS = 0.95; // bat-wing glider scale
const BX = 512; // glider bar (frame 0)
const BY = 560;
const GROUND = 1250; // where people stand
const BRO1 = 330;
const BRO2 = 700;
const BIRD_S = 0.77;
const WS = 0.47; // Wright glider scale
const WX = 512;
const WY = 470;
const PULL_X = 300;
const PULL_FEET = 1290;
const PLANE_S = 1.0;
export const CAM0: CamKey = {t: 0, x: 506, y: 520, k: 1.45};

const CAMS: CamKey[] = [
  CAM0,
  {t: 2.2, x: 500, y: 522, k: 1.49},
  {t: 3.3, x: 482, y: 540, k: 1.5, ease: 'io'},
  {t: 5.7, x: 472, y: 556, k: 1.54, ease: 'io'},
  {t: 6.2, x: 472, y: 560, k: 1.54},
  {t: 7.1, x: 480, y: 1080, k: 1.72, ease: 'io'},
  {t: 7.95, x: 482, y: 1084, k: 1.78},
  {t: CUT_B, x: 512, y: 1130, k: 2.0, ease: 'cut'},
  {t: 9.6, x: 514, y: 1118, k: 2.04},
  {t: 10.75, x: 512, y: 640, k: 1.2, ease: 'io'},
  {t: 12.95, x: 512, y: 636, k: 1.22},
  {t: 13.7, x: 512, y: 420, k: 1.6, ease: 'io'},
  {t: CUT_C - 0.01, x: 512, y: 416, k: 1.66},
  {t: CUT_C, x: 512, y: 820, k: 1.3, ease: 'cut'},
  {t: CUT_D - 0.01, x: 512, y: 800, k: 1.36},
  {t: CUT_D, x: 512, y: 420, k: 1.35, ease: 'cut'},
  {t: DURATION, x: 512, y: 412, k: 1.4},
];

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));
const rot = (x: number, y: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; flip?: boolean}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  ax,
  ay,
  flip = false,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{x: number; y: number; r?: number; children: React.ReactNode}> = ({x, y, r = 3000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 0.24}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: `rgba(120, 90, 40, ${o})`, filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot: r = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot: a = 0}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d={p} fill="#FFF6B0" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};
const Star: React.FC<{x: number; y: number; r: number; rot?: number}> = ({x, y, r, rot: a = 0}) => {
  const pts = Array.from({length: 10}, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const an = (Math.PI * i) / 5 - Math.PI / 2;
    return `${rr * Math.cos(an)},${rr * Math.sin(an)}`;
  }).join(' ');
  return <polygon points={pts} transform={`translate(${x} ${y}) rotate(${a})`} fill="#FFD23F" stroke={INK} strokeWidth={r * 0.18} strokeLinejoin="round" />;
};
const Note: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot: a = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d={`M ${r * 0.85} ${-r * 0.1} L ${r * 0.85} ${-r * 2.6} Q ${r * 1.9} ${-r * 2.2} ${r * 1.7} ${-r * 1.3}`} fill="none" stroke={INK} strokeWidth={r * 0.55} strokeLinecap="round" />
      <path d={`M ${r * 0.85} ${-r * 0.1} L ${r * 0.85} ${-r * 2.6} Q ${r * 1.9} ${-r * 2.2} ${r * 1.7} ${-r * 1.3}`} fill="none" stroke="#fff" strokeWidth={r * 0.22} strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={r} ry={r * 0.75} transform="rotate(-20)" fill="#fff" stroke={INK} strokeWidth={r * 0.3} />
    </g>
  );

// ---------- the wind cloud (a living gust) ----------
// inhale (stretch, puffed cheeks) before blowing; blowing = round mouth + gust streaks to the right.
const WindCloud: React.FC<{x: number; y: number; s: number; t: number; inhale: number; blow: number; look?: [number, number]}> = ({x, y, s, t, inhale, blow, look = [0.4, 0.1]}) => {
  if (s <= 0.001) return null;
  const br = 1 + 0.02 * Math.sin(2 * Math.PI * 0.7 * t);
  const sx = (1 - 0.05 * inhale + 0.04 * blow) * br;
  const sy = (1 + 0.07 * inhale - 0.03 * blow) * br;
  const puffs: Puff[] = [
    {x: -58, y: 8, r: 40},
    {x: -22, y: -26, r: 48},
    {x: 26, y: -22, r: 44},
    {x: 58, y: 10, r: 38},
    {x: 0, y: 22, r: 46},
    {x: 0, y: -2, r: 44},
  ];
  const cheek = 1 + 0.35 * inhale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sx} ${s * sy})`}>
      <PuffCluster puffs={puffs} fill="#FFFFFF" ink={6} shade="#EEF4FA" />
      <circle cx={-34} cy={22} r={10 * cheek} fill="#FFB3B8" opacity={0.75} />
      <circle cx={42} cy={22} r={10 * cheek} fill="#FFB3B8" opacity={0.75} />
      <Eye x={-14} y={-6} r={13} open={1} look={look} squeeze={inhale > 0.6} side={-1} brow={0.5} browTilt={blow > 0.2 ? 0.9 : 0} />
      <Eye x={22} y={-6} r={13} open={1} look={look} squeeze={inhale > 0.6} side={1} brow={0.5} browTilt={blow > 0.2 ? 0.9 : 0} />
      {blow > 0.05 ? (
        <ellipse cx={46} cy={20} rx={7 + 5 * blow} ry={8 + 6 * blow} fill="#5A2A2A" stroke={INK} strokeWidth={4} />
      ) : (
        <path d={`M ${0} ${24} Q ${6} ${30 - 6 * inhale} ${14} ${24}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      )}
    </g>
  );
};
// gust streaks: white curly lines with an ink underlay, travelling right
const Gust: React.FC<{x0: number; y0: number; len: number; t: number; t0: number; t1: number; spread?: number}> = ({x0, y0, len, t, t0, t1, spread = 120}) => {
  if (t < t0 || t > t1 + 0.6) return null;
  const lines = [0, 1, 2, 3, 4].map((i) => {
    const st = t0 + i * 0.09;
    const u = (t - st) / (t1 - t0 + 0.4);
    if (u <= 0 || u >= 1) return null;
    const head = easeOutCubic(clamp(u * 1.4)) * len;
    const tail = easeInCubic(clamp(u)) * len;
    const yy = y0 + (i - 2) * (spread / 2) + 10 * Math.sin(i * 1.7);
    const pts: string[] = [];
    for (let k = 0; k <= 12; k++) {
      const xx = tail + ((head - tail) * k) / 12;
      pts.push(`${x0 + xx},${yy + 9 * Math.sin(xx / 45 + i)}`);
    }
    return (
      <g key={i}>
        <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  });
  return <g>{lines}</g>;
};

// ---------- the bat-wing glider + the hanging man (shot A) ----------
const gliderState = (t: number) => {
  let roll = 0;
  roll += -24 * easeOutCubic(prog(t, 2.45, 3.1));
  roll += 10 * easeInOutCubic(prog(t, 4.0, 4.8));
  roll += -24 * easeInOutCubic(prog(t, 5.6, 6.3));
  roll += -26 * easeInCubic(prog(t, 6.3, T_IMPACT));
  roll += 2.2 * Math.sin(2 * Math.PI * 0.45 * t);
  const fall = easeInCubic(prog(t, 6.15, T_IMPACT));
  const x = BX + 6 * Math.sin(2 * Math.PI * 0.21 * t) - 42 * easeOutCubic(prog(t, 2.4, 3.3)) - 30 * fall;
  const y = BY + 7 * Math.sin(2 * Math.PI * 0.5 * t) + 22 * easeOutCubic(prog(t, 2.4, 3.3)) + 395 * fall;
  return {x, y, roll};
};
const GliderShot: React.FC<{t: number}> = ({t}) => {
  if (t >= T_IMPACT) return null;
  const g = gliderState(t);
  const gl = SPR.glider;
  const strain = t >= T.throws;
  const n: SprName = strain ? 'strain' : 'hang';
  const sp = SPR[n];
  const hs = HEAD / sp.head[2];
  // the man hangs from the bar: mostly vertical (gravity) with a lagging sway; on "throws" he swings hard
  let sway = -0.18 * g.roll + 3 * Math.sin(2 * Math.PI * 0.8 * t);
  if (strain) sway += 10 * spring(t - T.throws, 1.4, 2.5) - 4;
  const [ssx, ssy] = squashSwap(t, T.throws);
  const sweat = popOut(t, 5.65, 6.9);
  return (
    <>
      <div style={{position: 'absolute', left: g.x, top: g.y, transform: `rotate(${g.roll}deg)`, transformOrigin: '0 0'}}>
        <Spr n="glider" x={0} y={0} s={GS} ax={gl.cx} ay={gl.barY - 4} />
      </div>
      <div style={{position: 'absolute', left: g.x, top: g.y - 6, transform: `rotate(${sway}deg) scale(${ssx}, ${ssy})`, transformOrigin: '0 0'}}>
        <Spr n={n} x={0} y={0} s={hs} ax={sp.grip[0]} ay={sp.grip[1]} />
        <Svg x={0} y={0} r={400}>
          <SweatDrop x={(sp.head[0] - sp.grip[0]) * hs + HEAD * 0.95} y={(sp.head[1] - sp.grip[1]) * hs - HEAD * 0.5 + 30 * prog(t, 5.7, 6.8)} r={13} s={sweat} rot={-10} />
        </Svg>
      </div>
    </>
  );
};
const CrashSite: React.FC<{t: number}> = ({t}) => {
  if (t < T_IMPACT || t >= CUT_B) return null;
  const tt = t - T_IMPACT;
  const sp = SPR.crash;
  const hs = HEAD / sp.head[2];
  const gx = 560;
  const gy = 1205;
  const wob = 6 * spring(tt - 0.15, 2.6, 3.5);
  const sq = 1 - 0.08 * spring(tt, 3, 6);
  const hx = 440 + (sp.head[0] - sp.feet[0]) * hs;
  const hy = GROUND + (sp.head[1] - sp.feet[1]) * hs;
  const stars = popOut(t, T_IMPACT + 0.25, CUT_B + 1);
  return (
    <>
      <div style={{position: 'absolute', left: gx, top: gy, transform: `rotate(${-13 + wob}deg)`, transformOrigin: '0 0'}}>
        <Spr n="glider" x={0} y={0} s={GS} ax={SPR.glider.cx} ay={SPR.glider.barY * 0.62} />
      </div>
      <Shadow x={460} y={GROUND} w={170} />
      <Spr n="crash" x={440} y={GROUND} s={hs} sx={1 / sq} sy={sq} />
      <Svg x={hx} y={hy} r={400}>
        {stars > 0
          ? [0, 1, 2].map((i) => {
              const an = 2 * Math.PI * (tt * 0.9 + i / 3);
              return <Star key={i} x={hx + Math.cos(an) * 62} y={hy - HEAD * 1.35 + Math.sin(an) * 16} r={14 * stars} rot={tt * 160 + i * 40} />;
            })
          : null}
      </Svg>
    </>
  );
};
// sand burst on impact: a merged puff arc that grows then shrinks away
const SandPoof: React.FC<{t: number; x: number; y: number; t0: number; size?: number}> = ({t, x, y, t0, size = 1}) => {
  const u = (t - t0) / 0.55;
  if (u <= 0 || u >= 1) return null;
  const grow = easeOutCubic(clamp(u * 2.2));
  const shrink = 1 - easeInCubic(clamp((u - 0.35) / 0.65));
  const puffs: Puff[] = [-3, -2, -1, 0, 1, 2, 3].map((i) => ({
    x: x + i * 46 * grow * size,
    y: y - (22 + 30 * (1 - Math.abs(i) / 3)) * grow * size - 20 * u,
    r: (34 + 10 * (1 - Math.abs(i) / 3)) * grow * shrink * size,
  }));
  puffs.push({x, y: y - 40 * grow * size, r: 46 * grow * shrink * size});
  return <PuffCluster puffs={puffs} fill={PUFF_SAND} ink={5} shade="#E9CD82" />;
};

// ---------- brothers + bicycle (shot B, C) ----------
const Bicycle: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  if (s <= 0.001) return null;
  const R = 34;
  const wb = 118;
  const red = '#D9443B';
  const seg = (x1: number, y1: number, x2: number, y2: number, w: number, col: string) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={w + 6} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={w} strokeLinecap="round" />
    </>
  );
  const lx = -wb / 2;
  const rx = wb / 2;
  const wy = -R;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[lx, rx].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={wy} r={R} fill="none" stroke={INK} strokeWidth={10} />
          <circle cx={cx} cy={wy} r={R} fill="none" stroke="#555" strokeWidth={4} />
          <circle cx={cx} cy={wy} r={5} fill={INK} />
        </g>
      ))}
      {seg(lx, wy, -8, wy - 52, 6, red)}
      {seg(-8, wy - 52, 40, wy - 52, 6, red)}
      {seg(lx, wy, 6, wy, 6, red)}
      {seg(6, wy, -8, wy - 52, 6, red)}
      {seg(6, wy, 40, wy - 52, 6, red)}
      {seg(40, wy - 52, rx, wy, 6, red)}
      {seg(40, wy - 52, 46, wy - 72, 5, '#666')}
      {seg(34, wy - 74, 60, wy - 70, 6, '#444')}
      <ellipse cx={-12} cy={wy - 60} rx={17} ry={6} fill="#5B3A2A" stroke={INK} strokeWidth={4} />
    </g>
  );
};
const Bulb: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  if (s <= 0.001) return null;
  const glow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const an = ((-150 + i * 30) * Math.PI) / 180;
        return (
          <line key={i} x1={Math.cos(an) * 40} y1={Math.sin(an) * 40 - 6} x2={Math.cos(an) * (54 + 4 * glow)} y2={Math.sin(an) * (54 + 4 * glow) - 6} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        );
      })}
      <circle cx={0} cy={-6} r={28} fill="#FFE45C" stroke={INK} strokeWidth={6} />
      <rect x={-13} y={18} width={26} height={16} rx={4} fill="#B9B9B9" stroke={INK} strokeWidth={5} />
      <path d="M -8 -4 Q 0 -16 8 -4" fill="none" stroke="#C88A00" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// ---------- the buzzard ----------
// anchor: the body centre; flat and twisted drawings are aligned on the eyes.
const BIRD_DY = 68;
const Bird: React.FC<{x: number; y: number; s: number; roll: number; twist: boolean; sx?: number; sy?: number}> = ({x, y, s, roll, twist, sx = 1, sy = 1}) => {
  const b = twist ? SPR.birdTwist : SPR.birdFlat;
  const ex = (b.eyes[0][0] + b.eyes[1][0]) / 2;
  const ey = (b.eyes[0][1] + b.eyes[1][1]) / 2 + BIRD_DY;
  return <Spr n={twist ? 'birdTwist' : 'birdFlat'} x={x} y={y} s={s} sx={sx} sy={sy} rot={roll} ax={ex} ay={ey} />;
};
// a curved arrow (white with ink) showing which way a wingtip twists
const TwistArrow: React.FC<{x: number; y: number; dir: 1 | -1; s: number; r?: number}> = ({x, y, dir, s, r = 34}) => {
  if (s <= 0.001) return null;
  const a0 = dir === -1 ? 160 : 200;
  const a1 = dir === -1 ? 20 : 340;
  const P = (a: number): [number, number] => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r * 0.75];
  const [x0, y0] = P(a0);
  const [x1, y1] = P(a1);
  const d = `M ${x0} ${y0} A ${r} ${r * 0.75} 0 0 ${dir === -1 ? 1 : 0} ${x1} ${y1}`;
  const hx = x1;
  const hy = y1;
  const tip = `M ${hx - 12} ${hy - 12 * dir} L ${hx + 6} ${hy + 4 * dir} L ${hx + 14} ${hy - 16 * dir}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={tip} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <path d={tip} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ---------- the Wright glider (sliced: the wingtips twist about their inner edge) ----------
const WL = 420;
const WR = 1077;
const WCX = 748.5;
const WCY = 170;
const PIV_Y = 150;
const Wright: React.FC<{x: number; y: number; s: number; roll: number; warp: number}> = ({x, y, s, roll, warp}) => {
  const sp = SPR.wright;
  const slice = (x0: number, x1: number, px: number, a: number) => (
    <div
      style={{
        position: 'absolute',
        left: (x0 - WCX) * s,
        top: (-WCY - 10) * s,
        width: (x1 - x0) * s,
        height: (sp.h + 20) * s,
        overflow: 'hidden',
        transformOrigin: `${(px - x0) * s}px ${(PIV_Y + 10) * s}px`,
        transform: `rotate(${a}deg)`,
      }}
    >
      <Img src={F('wright')} style={{position: 'absolute', left: -x0 * s, top: 10 * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${roll}deg)`, transformOrigin: '0 0'}}>
      {slice(WL - 2, WR + 2, WCX, 0)}
      {slice(0, WL + 2, WL, warp)}
      {slice(WR - 2, sp.w, WR, warp)}
    </div>
  );
};
// world position of a point (sprite px) on the Wright glider
const wrightPt = (px: number, py: number, x: number, y: number, s: number, roll: number, warp: number): [number, number] => {
  let lx = px;
  let ly = py;
  if (px < WL || px > WR) {
    const pv = px < WL ? WL : WR;
    const [rx, ry] = rot(px - pv, py - PIV_Y, warp);
    lx = pv + rx;
    ly = PIV_Y + ry;
  }
  const [wx, wy] = rot((lx - WCX) * s, (ly - WCY) * s, roll);
  return [x + wx, y + wy];
};
const wrightState = (t: number) => {
  const roll = -18 + 18 * easeInOutCubic(prog(t, 17.45, T.level)) + 2.5 * Math.sin(2 * Math.PI * 0.5 * t) * (1 - prog(t, 17.4, 18));
  const warp = 10 * easeOutBack(prog(t, T.twist, T.twist + 0.4), 1.6) * (1 - easeInOutCubic(prog(t, T.level + 0.05, T.level + 0.6)));
  const lvl = 1.8 * spring(t - T.level - 0.02, 2.2, 4) * (t > T.level ? 1 : 0);
  return {roll: roll + lvl, warp, x: WX + 5 * Math.sin(2 * Math.PI * 0.3 * t), y: WY + 6 * Math.sin(2 * Math.PI * 0.45 * t)};
};

// ---------- the plane (shot D): flaps drawn in code on the wingtips ----------
const FLAP_L: [number, number, number, number] = [52, 208, 136, 228]; // hinge from -> to (sprite px)
const Plane: React.FC<{x: number; y: number; s: number; roll: number; flapL: number; flapR: number}> = ({x, y, s, roll, flapL, flapR}) => {
  const sp = SPR.plane;
  const cx = sp.cx;
  const cy = 150;
  const flap = (h: [number, number, number, number], def: number, mirror: boolean) => {
    let [x0, y0, x1, y1] = h;
    if (mirror) {
      [x0, x1] = [2 * cx - x0, 2 * cx - x1];
    }
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const hx = ((x0 + x1) / 2 - cx) * s;
    const hy = ((y0 + y1) / 2 - cy) * s;
    return (
      <g transform={`translate(${hx} ${hy}) rotate(${ang}) `}>
        <g transform={`scale(1 ${1})`}>
          <rect x={(-len / 2) * s} y={-3 * s} width={len * s} height={(12 + Math.abs(def) * 1.1) * s} rx={4 * s} fill="#FFC93C" stroke={INK} strokeWidth={4 * s} transform={`translate(0 ${def > 0 ? 0 : -Math.abs(def) * 1.1 * s})`} />
        </g>
      </g>
    );
  };
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${roll}deg)`, transformOrigin: '0 0'}}>
      <Spr n="plane" x={0} y={0} s={s} ax={cx} ay={cy} />
      <Svg x={0} y={0} r={800}>
        {flap(FLAP_L, flapL, false)}
        {flap(FLAP_L, flapR, true)}
      </Svg>
    </div>
  );
};

// ---------- the whole scene at story time t ----------
export const Scene: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const shotA = t < CUT_B;
  const shotB = t >= CUT_B && t < CUT_C;
  const shotC = t >= CUT_C && t < CUT_D;
  const shotD = t >= CUT_D;
  const sk = SPR.bg;

  // ----- wind cloud per shot -----
  let cloud: React.ReactNode = null;
  let gust: React.ReactNode = null;
  if (shotA) {
    const inh = easeInOutCubic(prog(t, 1.6, 2.1)) * (1 - prog(t, 2.12, 2.2));
    const blow = prog(t, 2.1, 2.2) * (1 - easeInOutCubic(prog(t, 3.1, 3.5)));
    const look: [number, number] = t < 1.6 ? [0.5, 0.35] : [0.7, 0.4];
    cloud = <WindCloud x={215} y={180} s={1} t={t} inhale={inh} blow={blow} look={look} />;
    gust = <Gust x0={300} y0={230} len={640} t={t} t0={2.15} t1={3.1} spread={110} />;
  } else if (shotB) {
    const inh = easeInOutCubic(prog(t, 11.0, 11.4)) * (1 - prog(t, 11.42, 11.5));
    const blow = prog(t, 11.42, 11.5) * (1 - easeInOutCubic(prog(t, 12.3, 12.7)));
    cloud = <WindCloud x={180} y={150} s={popOut(t, 10.55, 13.0, 0.3)} t={t} inhale={inh} blow={blow} look={[0.7, 0.5]} />;
    gust = <Gust x0={270} y0={250} len={600} t={t} t0={11.45} t1={12.3} spread={110} />;
  } else if (shotC) {
    const blow = 1 - easeInOutCubic(prog(t, 16.8, 17.3));
    cloud = <WindCloud x={170} y={150} s={1 - easeInCubic(prog(t, 17.3, 17.6))} t={t} inhale={0} blow={blow} look={[0.7, 0.5]} />;
    gust = <Gust x0={250} y0={240} len={560} t={t} t0={CUT_C - 0.35} t1={16.75} spread={100} />;
  } else {
    const inh = easeInOutCubic(prog(t, 20.75, 21.05)) * (1 - prog(t, 21.07, 21.15));
    const inh2 = easeInOutCubic(prog(t, 23.4, 23.9));
    const blow = prog(t, 21.07, 21.15) * (1 - easeInOutCubic(prog(t, 21.8, 22.2)));
    cloud = <WindCloud x={200} y={-140} s={pop(t, CUT_D + 0.05, 0.3)} t={t} inhale={Math.max(inh, inh2)} blow={blow} look={[0.6, 0.6]} />;
    gust = <Gust x0={290} y0={-80} len={600} t={t} t0={21.1} t1={21.8} spread={100} />;
  }

  // ----- shot B: the buzzard -----
  const birdIn = easeOutCubic(prog(t, T.buzzards + 0.05, T.buzzards + 1.05));
  const birdTwist = t >= T.twists;
  const birdRoll =
    -28 * easeOutCubic(prog(t, T.tips2, T.tips2 + 0.45)) * (1 - easeOutBack(prog(t, 15.0, 15.8), 1.8)) + 2 * Math.sin(2 * Math.PI * 0.4 * t);
  const [bsx, bsy] = squashSwap(t, T.twists);
  const bx = lerp(1250, 512, birdIn) - 30 * easeOutCubic(prog(t, T.tips2, T.tips2 + 0.5)) * (1 - prog(t, 15, 15.8));
  const by = 380 + 8 * Math.sin(2 * Math.PI * 0.35 * t) - 60 * (1 - birdIn);
  const tipsArrows = popOut(t, T.twists + 0.08, 15.95);
  const bTipL = rot((SPR.birdTwist.tipL[0] - SPR.birdTwist.body[0] + 40) * BIRD_S, -55 * BIRD_S, birdRoll);
  const bTipR = rot((SPR.birdTwist.tipR[0] - SPR.birdTwist.body[0] - 40) * BIRD_S, 60 * BIRD_S, birdRoll);

  // ----- shot D: the plane + the buzzard beside it -----
  const pin = easeOutCubic(prog(t, CUT_D, CUT_D + 1.0));
  const ps = lerp(0.22, PLANE_S, pin);
  const pRoll =
    -11 * easeOutCubic(prog(t, 21.2, 21.7)) * (1 - easeInOutCubic(prog(t, T.flaps + 0.05, 22.8))) + 1.5 * Math.sin(2 * Math.PI * 0.4 * t);
  const flick = (t0: number) => 18 * Math.sin(Math.PI * prog(t, t0, t0 + 0.55)) * (t < t0 + 0.55 ? 1 : 0);
  const fL = 22 * easeOutCubic(prog(t, T.flaps, T.flaps + 0.15)) * (1 - easeInOutCubic(prog(t, 22.7, 22.86))) + flick(T.wingtips2);
  const fR = -fL;
  const dBirdIn = easeOutCubic(prog(t, 21.5, 22.4));
  const dbx = lerp(1150, 742, dBirdIn);
  const dby = 128 + 6 * Math.sin(2 * Math.PI * 0.4 * t);
  const dTwist = t >= T.wingtips2 && t < 23.75;
  const [dsx, dsy] = squashSwap(t, T.wingtips2);
  const dRoll = 3 * Math.sin(2 * Math.PI * 0.5 * t) - 10 * Math.sin(Math.PI * prog(t, T.wingtips2, T.wingtips2 + 0.8));

  // ----- shot C -----
  const w = wrightState(t);
  const pullSp = SPR.pull;
  const pullS = HEAD / pullSp.head[2];
  const pullLean = 6 * easeOutBack(prog(t, T.twist - 0.05, T.twist + 0.3), 2) - 4 * bump(t, T.cables, 0.4);
  const handBase: [number, number] = [PULL_X + (pullSp.hand[0] - pullSp.feet[0]) * pullS, PULL_FEET + (pullSp.hand[1] - pullSp.feet[1]) * pullS];
  const hand = (() => {
    const [rx, ry] = rot(handBase[0] - PULL_X, handBase[1] - PULL_FEET, pullLean);
    return [PULL_X + rx, PULL_FEET + ry] as [number, number];
  })();
  const tipL = wrightPt(70, 262, w.x, w.y, WS, w.roll, w.warp);
  const tipR = wrightPt(1427, 262, w.x, w.y, WS, w.roll, w.warp);
  const twang = 8 * Math.sin(2 * Math.PI * 9 * t) * Math.exp(-4 * Math.max(0, t - T.cables)) * (t > T.cables ? 1 : 0);
  const cable = (a: [number, number], b: [number, number], k: number) => {
    const mx = (a[0] + b[0]) / 2 + twang * k;
    const my = (a[1] + b[1]) / 2 + 18 * (1 - prog(t, T.twist - 0.05, T.twist + 0.2)) + 4;
    return `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
  };

  // ----- brothers -----
  const heroS = HEAD / SPR.hero.head[2];
  const lookTilt = 3 * easeInOutCubic(prog(t, T.watch, T.watch + 0.4));
  const q = popOut(t, 12.3, 12.95);

  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam}>
        {/* sky above the plate + sand below it */}
        <div style={{position: 'absolute', left: -2000, top: -3000, width: 5024, height: 3010, background: SKY}} />
        <div style={{position: 'absolute', left: -2000, top: sk.h - 10, width: 5024, height: 3000, background: SAND}} />
        <div style={{position: 'absolute', left: -2000, top: 1000, width: 2010, height: sk.h - 990, background: SAND}} />
        <div style={{position: 'absolute', left: sk.w - 10, top: 1000, width: 2010, height: sk.h - 990, background: SAND}} />
        <div style={{position: 'absolute', left: -2000, top: -10, width: 2010, height: sk.seaTop + 10, background: SKY}} />
        <div style={{position: 'absolute', left: sk.w - 10, top: -10, width: 2010, height: sk.seaTop + 10, background: SKY}} />
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: sk.w, height: sk.h}} />

        {/* ---------- shot A ---------- */}
        {shotA ? (
          <>
            <Svg x={512} y={300}>
              {cloud}
              {gust}
            </Svg>
            <CrashSite t={t} />
            <GliderShot t={t} />
            <Svg x={480} y={1200}>
              <SandPoof t={t} x={470} y={GROUND + 28} t0={T_IMPACT - 0.03} size={1.15} />
            </Svg>
          </>
        ) : null}

        {/* ---------- shot B ---------- */}
        {shotB ? (
          <>
            <Svg x={512} y={300}>
              {cloud}
              {gust}
            </Svg>
            <Shadow x={BRO1} y={GROUND} w={150} />
            <Shadow x={BRO2} y={GROUND} w={150} />
            <Shadow x={515} y={GROUND} w={180} o={0.18} />
            <Svg x={515} y={GROUND}>
              <Bicycle x={515} y={GROUND} s={pop(t, T.bike - 0.05, 0.3)} />
            </Svg>
            <Spr n="hero" x={BRO1} y={GROUND} s={heroS} rot={-lookTilt} sy={breathe(t) * (1 + 0.04 * bump(t, T.two - 0.25))} />
            <Spr n="hero" x={BRO2} y={GROUND} s={heroS} flip rot={lookTilt} sy={breathe(t, 1.7) * (1 + 0.05 * bump(t, T.two))} />
            <Svg x={512} y={900}>
              <Mark x={BRO1 + 30} y={GROUND - 290} size={80} s={q} text="?" rot={-8} />
              <Mark x={BRO2 - 30} y={GROUND - 290} size={80} s={q} text="?" rot={8} />
            </Svg>
            {t > T.buzzards ? <Bird x={bx} y={by} s={BIRD_S} roll={birdRoll} twist={birdTwist} sx={bsx} sy={bsy} /> : null}
            <Svg x={bx} y={by} r={900}>
              {[0, 1, 2].map((i) => {
                const t0 = T.but2 + 0.15 + i * 0.35;
                const u = prog(t, t0, t0 + 1.0);
                const s = u > 0 && u < 1 ? Math.min(1, u * 5) * (1 - easeInCubic(clamp((u - 0.6) / 0.4))) : 0;
                return <Note key={i} x={bx + 70 + i * 30 + 40 * u} y={by - 90 - 110 * u} r={20} s={s} rot={-10 + 20 * Math.sin(u * 6)} />;
              })}
              <TwistArrow x={bx + bTipL[0]} y={by + bTipL[1] - 20} dir={-1} s={tipsArrows} />
              <TwistArrow x={bx + bTipR[0]} y={by + bTipR[1] + 10} dir={1} s={tipsArrows} />
              <Sparkle x={bx - 120} y={by - 60} r={22} s={popOut(t, 15.75, 16.15, 0.2)} rot={t * 90} />
              <Sparkle x={bx + 130} y={by - 50} r={16} s={popOut(t, 15.85, 16.2, 0.2)} rot={-t * 90} />
            </Svg>
          </>
        ) : null}

        {/* ---------- shot C ---------- */}
        {shotC ? (
          <>
            <Svg x={512} y={300}>
              {cloud}
              {gust}
            </Svg>
            <Shadow x={PULL_X} y={PULL_FEET} w={150} />
            <Shadow x={BRO2 + 20} y={PULL_FEET} w={150} />
            <Spr n="hero" x={BRO2 + 20} y={PULL_FEET} s={heroS} flip rot={3} sy={breathe(t, 1.2) * (1 + 0.05 * bump(t, T.level, 0.3))} />
            <div style={{position: 'absolute', left: PULL_X, top: PULL_FEET, transform: `rotate(${pullLean}deg)`, transformOrigin: '0 0'}}>
              <Spr n="pull" x={0} y={0} s={pullS} sy={breathe(t)} />
            </div>
            <Wright x={w.x} y={w.y} s={WS} roll={w.roll} warp={w.warp} />
            <Svg x={512} y={800}>
              <path d={cable(hand, tipL, -1)} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
              <path d={cable(hand, tipR, 1)} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
              <circle cx={hand[0]} cy={hand[1]} r={7} fill={INK} />
              <Bulb x={BRO2 + 10} y={PULL_FEET - 300} s={popOut(t, T.so3 - 0.05, 17.15)} t={t} />
              <TwistArrow x={tipL[0] + 10} y={tipL[1] - 70} dir={-1} s={popOut(t, T.twist + 0.1, 19.6)} r={30} />
              <TwistArrow x={tipR[0] - 10} y={tipR[1] - 40} dir={1} s={popOut(t, T.twist + 0.1, 19.6)} r={30} />
              <Sparkle x={w.x - 260} y={w.y - 120} r={24} s={popOut(t, T.level, 20.45, 0.2)} rot={t * 90} />
              <Sparkle x={w.x + 280} y={w.y - 100} r={18} s={popOut(t, T.level + 0.1, 20.45, 0.2)} rot={-t * 90} />
            </Svg>
          </>
        ) : null}

        {/* ---------- shot D ---------- */}
        {shotD ? (
          <>
            <Svg x={512} y={0}>
              {cloud}
              {gust}
            </Svg>
            <Plane x={512} y={lerp(520, 430, pin) + 5 * Math.sin(2 * Math.PI * 0.45 * t)} s={ps} roll={pRoll} flapL={fL} flapR={fR} />
            {t > 21.5 ? <Bird x={dbx} y={dby} s={0.38} roll={dRoll} twist={dTwist} sx={dsx} sy={dsy} /> : null}
            <Svg x={512} y={300}>
              <TwistArrow x={512 - 300 * ps} y={430 + 95 * ps} dir={1} s={popOut(t, T.flaps + 0.05, 23.5)} r={34} />
              <TwistArrow x={512 + 300 * ps} y={430 + 95 * ps} dir={-1} s={popOut(t, T.flaps + 0.05, 23.5)} r={34} />
              <Sparkle x={dbx - 20} y={dby - 80} r={20} s={popOut(t, T.wingtips2 + 0.05, 23.6, 0.2)} rot={t * 90} />
              <Sparkle x={512 - 380} y={330} r={20} s={popOut(t, T.wingtips2 + 0.1, 23.6, 0.2)} rot={-t * 90} />
              <Sparkle x={512 + 380} y={330} r={20} s={popOut(t, T.wingtips2 + 0.1, 23.6, 0.2)} rot={t * 90} />
            </Svg>
          </>
        ) : null}
      </World>
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'gust', at: 1.5, db: -17, keys: [[1.5, -17], [3.0, -17], [3.4, -30]]},
  {f: 'whoosh', at: 3.82, db: -24},
  {f: 'gulp', at: 5.92, db: -17},
  {f: 'whoosh', at: 6.35, db: -22, rate: 0.75},
  {f: 'crash', at: T_IMPACT - 0.02, db: -9},
  {f: 'boing', at: 7.3, db: -21},
  {f: 'clink', at: T.bike + 0.02, db: -19},
  {f: 'cry', at: 9.95, db: -24, keys: [[9.95, -24], [10.9, -27], [11.35, -40]], dur: 1.4},
  {f: 'gust', at: 10.72, db: -18, keys: [[10.72, -18], [12.3, -18], [12.6, -32]]},
  {f: 'flap', at: T.twists - 0.06, db: -14},
  {f: 'pop', at: 15.75, db: -20},
  {f: 'whoosh', at: CUT_C - 0.12, db: -27},
  {f: 'clink', at: T.so3, db: -20},
  {f: 'winch', at: T.twist - 0.04, db: -17},
  {f: 'winch', at: T.cables, db: -19, dur: 0.6},
  {f: 'pop', at: T.level, db: -18},
  {f: 'jet', at: CUT_D - 0.1, db: -15, keys: [[20.45, -15], [21.3, -19], [22.0, -30]]},
  {f: 'gust', at: 20.4, db: -24, keys: [[20.4, -24], [21.6, -24], [22.0, -36]]},
  {f: 'winch', at: T.flaps - 0.02, db: -21, dur: 0.3},
  {f: 'flap', at: T.wingtips2 - 0.06, db: -15},
  {f: 'cry', at: 23.25, db: -25, keys: [[23.25, -25], [23.7, -34]], dur: 0.6},
];

export const BuzzardWingsShort: React.FC = () => {
  useBuzzFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAMS);
  const sh = shake(t, 22 * Math.exp(-7 * Math.max(0, t - T_IMPACT)) * (t >= T_IMPACT ? 1 : 0) + 4 * Math.exp(-6 * Math.max(0, t - T.twist)) * (t >= T.twist ? 1 : 0));
  const cam = {x: cam0.x + sh.x / cam0.k, y: cam0.y + sh.y / cam0.k, k: cam0.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('buzzard-wings/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      {/* the bed is rendered in video time (its own 0.1 s lead-in), so it starts at frame 0 */}
      <Audio src={staticFile('buzzard-wings/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="buzzard-wings/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
