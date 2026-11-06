import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import SP from './sprites.json';

export const FPS = 60;
export const VO_OFFSET = 0.1; // voice starts at 0.1 s
export const DURATION = 25.0 + VO_OFFSET;

// ---------------------------------------------------------------- helpers
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eio = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eout = (u: number) => 1 - Math.pow(1 - u, 3);
const ein = (u: number) => u * u * u;
// pop-in with overshoot 0..1 over d seconds
const pop = (t: number, at: number, d = 0.22) => {
  if (t < at) return 0;
  const u = (t - at) / d;
  if (u >= 1) return 1 + 0.08 * Math.exp(-(u - 1) * 4) * Math.cos((u - 1) * 9);
  return eout(u) * 1.12 - 0.12 * u * u;
};
const popOut = (t: number, at: number, d = 0.16) => (t < at ? 1 : clamp(1 - (t - at) / d));

// ---------------------------------------------------------------- world constants
type PoseName = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P08';
type Meta = {w: number; h: number; head: number[]; feet: number[]};
const META = SP as unknown as Record<string, Meta>;
const R = 95; // head radius in world units
const FX = 930; // feet x on the balcony
const FY = 432; // feet y (balcony top)
const sc = (p: PoseName) => R / META[p].head[2];
const toW = (p: PoseName, x: number, y: number): [number, number] => [
  FX + (x - META[p].feet[0]) * sc(p),
  FY - (META[p].feet[1] - y) * sc(p),
];

const MOUTH = toW('P03', 700, 620);
const MOUTH_Y = MOUTH[1];
const GRIP: Partial<Record<PoseName, [number, number]>> = {
  P01: toW('P01', 850, 1050),
  P03: toW('P03', 785, 950),
  P04: toW('P04', 958, 1200),
  P05: toW('P05', 1075, 800),
};
const REST: [number, number] = [1048, MOUTH_Y];

// glass
const GX = 1062;
const GB = 1890;
const GT = 1780;
const GS = 1796; // juice surface
const STRAW_B: [number, number] = [GX + 6, GB - 12];
const METER = (GS - MOUTH_Y) / 11;
const LIMIT = GS - 10.3 * METER; // perfect-vacuum limit at sea level
const TEN = GS - 10 * METER;
const RULER_X = 1262;

// ---------------------------------------------------------------- timeline (voice time)
const T = {
  eleven: 1.6,
  toClose: 2.75,
  its: 3.72,
  lungs: 4.96,
  sip0: 6.15,
  toGlass: 6.3,
  suck: 7.38,
  toMid: 8.5,
  sip: 9.22,
  lower: 10.0,
  toGlass2: 11.15,
  puffs: 11.95,
  pushes: 12.42,
  rise: 12.5,
  limit: 15.18,
  toWide: 16.35,
  confused: 16.45,
  ten: 18.06,
  toPump: 19.45,
  fall: 20.35,
  land: 21.0,
  strokes: 21.25,
  short: 22.52,
  lips: 23.12,
  outro: 24.0,
  back: 24.45,
  end: 25.0,
};

const SWAPS: [number, PoseName][] = [
  [0, 'P01'],
  [T.its, 'P02'],
  [T.sip0, 'P03'],
  [12.6, 'P04'],
  [T.confused, 'P05'],
  [T.land, 'P06'],
  [T.lips, 'P08'],
  [T.back, 'P01'],
];
const poseAt = (t: number) => {
  let i = 0;
  for (let k = 0; k < SWAPS.length; k++) if (t >= SWAPS[k][0]) i = k;
  return {pose: SWAPS[i][1], since: t - SWAPS[i][0], next: SWAPS[i + 1]?.[0] ?? 1e9, swapT: SWAPS[i][0]};
};

// juice level in the straw (world y of the top of the column)
const levelAt = (t: number) => {
  if (t < T.rise) return GS;
  if (t < T.limit) {
    const u = prog(t, T.rise, T.limit);
    return GS - (GS - LIMIT) * (1 - Math.pow(1 - u, 2.4));
  }
  if (t < T.outro) {
    let l = LIMIT + 3 * Math.exp(-(t - T.limit) * 5) * Math.sin((t - T.limit) * 30);
    if (t > T.strokes && t < 22.95) l += 1.6 * Math.sin((t - T.strokes) * 2 * Math.PI / 0.42);
    return l;
  }
  return lerp(LIMIT, GS, ein(prog(t, T.outro, 24.9)));
};

// ---------------------------------------------------------------- camera
type Cam = {x: number; y: number; z: number};
const W: Cam = {x: 820, y: 960, z: 0.8};
const WD: Cam = {x: 828, y: 930, z: 0.83};
const C: Cam = {x: 985, y: 262, z: 3.0};
const G: Cam = {x: 1064, y: 1800, z: 3.1};
const MID: Cam = {x: 1000, y: 300, z: 1.9};
const G2: Cam = {x: 1064, y: 1770, z: 3.0};
const C2: Cam = {x: 1000, y: LIMIT - 25, z: 2.7};
const P: Cam = {x: 1108, y: 235, z: 1.75};

const move = (a: Cam, b: Cam, u: number, dip = 0): Cam => {
  const e = eio(u);
  const s = (1 - Math.cos(Math.PI * e)) / 2;
  const cw = dip > 0 ? s : e;
  return {
    x: lerp(a.x, b.x, cw),
    y: lerp(a.y, b.y, cw),
    z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), e) - dip * Math.sin(Math.PI * e)),
  };
};

const camAt = (t: number): Cam => {
  if (t < T.toClose) return move(W, WD, prog(t, 0, T.toClose));
  if (t < 3.65) return move(WD, C, prog(t, T.toClose, 3.65));
  if (t < T.toGlass) return C;
  if (t < 7.4) return move(C, G, prog(t, T.toGlass, 7.4), 1.1);
  if (t < T.toMid) return G;
  if (t < 9.3) return move(G, MID, prog(t, T.toMid, 9.3), 0.8);
  if (t < T.toGlass2) return MID;
  if (t < 12.0) return move(MID, G2, prog(t, T.toGlass2, 12.0), 0.8);
  if (t < T.rise) return G2;
  if (t < 15.4) {
    const u = eio(prog(t, T.rise, 15.4));
    return {x: lerp(G2.x, C2.x, u), y: Math.min(G2.y, levelAt(t) - 25), z: lerp(G2.z, C2.z, u)};
  }
  if (t < T.toWide) return C2;
  if (t < 17.9) return move(C2, W, prog(t, T.toWide, 17.9));
  if (t < T.toPump) return W;
  if (t < 20.45) return move(W, P, prog(t, T.toPump, 20.45));
  if (t < T.outro) return P;
  return move(P, W, prog(t, T.outro, T.end));
};

const shakeAt = (t: number) => {
  let a = 0;
  if (t > T.land) a += 16 * Math.exp(-(t - T.land) * 6);
  if (t > T.limit) a += 5 * Math.exp(-(t - T.limit) * 8);
  if (t > T.strokes && t < 23.0) a += 1.5;
  return {
    x: a * (Math.sin(t * 2 * Math.PI * 13.3) * 0.6 + Math.sin(t * 2 * Math.PI * 7.1) * 0.4),
    y: a * (Math.sin(t * 2 * Math.PI * 11.7 + 1) * 0.6 + Math.sin(t * 2 * Math.PI * 5.3) * 0.4),
  };
};

// ---------------------------------------------------------------- drawing pieces
const INK = '#141414';
const LW = 2.6; // outline width in world units

const Cloud: React.FC<{x: number; y: number; s: number; fill?: string; lw?: number}> = ({x, y, s, fill = '#fff', lw = 3}) => {
  const c = [
    [0, 0, 1],
    [-0.9, 0.25, 0.7],
    [0.95, 0.2, 0.75],
    [0.4, -0.45, 0.7],
    [-0.4, -0.35, 0.6],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {c.map(([a, b, r], i) => (
        <circle key={'o' + i} cx={a * 40} cy={b * 40} r={r * 40 + lw / s} fill={INK} />
      ))}
      {c.map(([a, b, r], i) => (
        <circle key={'f' + i} cx={a * 40} cy={b * 40} r={r * 40} fill={fill} />
      ))}
    </g>
  );
};

const Sprite: React.FC<{
  src: string;
  pose: PoseName;
  sx?: number;
  sy?: number;
  dx?: number;
  dy?: number;
}> = ({src, pose, sx = 1, sy = 1, dx = 0, dy = 0}) => {
  const m = META[pose];
  const s = sc(pose);
  return (
    <div
      style={{
        position: 'absolute',
        left: FX - m.feet[0] * s + dx,
        top: FY - m.feet[1] * s + dy,
        width: m.w * s,
        height: m.h * s,
        transformOrigin: `${m.feet[0] * s}px ${m.feet[1] * s}px`,
        transform: `scale(${sx}, ${sy})`,
      }}
    >
      <Img src={staticFile(`straw/${src}.png`)} style={{width: '100%', height: '100%'}} />
    </div>
  );
};

// pump in P06 sprite coordinates (rod + T-handle drawn in code, body from the picture)
const PumpRig: React.FC<{t: number; posing: boolean; pullSy: number}> = ({t, posing, pullSy}) => {
  const m = META.P06;
  const s = sc('P06');
  const fall = t < T.fall ? 1 : t < T.land ? 1 - Math.pow(prog(t, T.fall, T.land), 2) : 0;
  const dy = -1100 * fall;
  const land = t > T.land ? Math.exp(-(t - T.land) * 7) * Math.cos((t - T.land) * 26) : 0;
  const sqY = 1 - 0.14 * land;
  const sqX = 1 + 0.08 * land;
  const gone = t >= T.outro ? 1 - pop(t, T.outro, 0.01) * 0 : 0; // placeholder (no-op)
  const outS = t < 24.05 ? 1 : clamp(1 - (t - 24.05) / 0.18);
  if (t < T.fall || outS <= 0) return null;
  void gone;
  const baseX = 1110; // pump axis in sprite px
  const baseY = 1745;
  const rodTop = posing ? m.feet[1] - (m.feet[1] - 652) * pullSy : 640;
  return (
    <div
      style={{
        position: 'absolute',
        left: FX - m.feet[0] * s,
        top: FY - m.feet[1] * s + dy,
        width: m.w * s,
        height: m.h * s,
        transformOrigin: `${baseX * s}px ${baseY * s}px`,
        transform: `rotate(${fall * 8}deg) scale(${sqX * outS}, ${sqY * outS})`,
      }}
    >
      <svg viewBox={`0 0 ${m.w} ${m.h}`} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible'}}>
        <rect x={1088} y={rodTop} width={44} height={870 - rodTop} fill="#B9BEC3" stroke={INK} strokeWidth={10} />
        {!posing && (
          <rect x={1045} y={588} width={255} height={50} rx={22} fill="#9EA4AA" stroke={INK} strokeWidth={11} />
        )}
      </svg>
      <Img src={staticFile('straw/P06_pump.png')} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
    </div>
  );
};

// ---------------------------------------------------------------- main composition
export const Straw: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS - VO_OFFSET;
  const cam = camAt(t);
  const sh = shakeAt(t);
  const pa = poseAt(t);
  const pose = pa.pose;

  // squash & stretch around swaps
  let sx = 1;
  let sy = 1;
  if (pa.next - t < 0.1 && pa.next - t > 0) {
    const k = 1 - (pa.next - t) / 0.1;
    sy -= 0.06 * k;
    sx += 0.04 * k;
  }
  if (pa.swapT > 0 && pa.since < 0.6) {
    const d = pa.since;
    const w = Math.exp(-d * 7) * Math.cos(d * 22);
    sy += 0.05 * w;
    sx -= 0.03 * w;
  }
  sy *= 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
  // bounce on "lungs"
  if (t > T.lungs && t < T.lungs + 0.5) sy *= 1 + 0.04 * Math.sin(prog(t, T.lungs, T.lungs + 0.5) * Math.PI);
  let jx = 0;
  if (pose === 'P04') jx = 1.1 * Math.sin(t * 2 * Math.PI * 9) + 0.6 * Math.sin(t * 2 * Math.PI * 14.3);

  // pumping
  const pumping = pose === 'P06' && t > T.strokes && t < 22.95;
  const pumpU = pumping ? 0.5 - 0.5 * Math.cos(((t - T.strokes) * 2 * Math.PI) / 0.42) : 0;
  const pullSy = 1 + 0.075 * pumpU;

  // straw geometry
  const grip = GRIP[pose] ?? REST;
  const top: [number, number] = [grip[0], grip[1]];
  const bot = STRAW_B;
  const atY = (y: number): [number, number] => {
    const u = (y - top[1]) / (bot[1] - top[1]);
    return [lerp(top[0], bot[0], u), y];
  };
  const level = levelAt(t);
  const juiceTop = atY(Math.max(level, top[1]));
  const strawW = 9;

  // hose
  const hoseP = t < T.land + 0.05 ? 0 : t < T.outro ? eout(prog(t, T.land + 0.05, T.land + 0.35)) : 1 - prog(t, T.outro, 24.2);
  const fit = toW('P06', 1250, 1665);
  const hoseD = `M ${fit[0]} ${fit[1]} C ${fit[0] + 60} ${fit[1] - 20}, 1225 260, 1205 170 S 1080 70, ${REST[0]} ${REST[1] - 4}`;

  // glass face
  const eyeOpen = t < T.suck ? 0 : t > 24.2 ? clamp(1 - (t - 24.2) / 0.12) : pop(t, T.suck, 0.18);
  const blink = (() => {
    for (const b of [9.9, 13.3, 17.2, 19.9, 23.6]) if (t > b && t < b + 0.13) return 1 - Math.sin(prog(t, b, b + 0.13) * Math.PI);
    return 1;
  })();
  let look: [number, number] = [0, 0];
  if (t > 7.5 && t < 8.6) look = [-2, -4];
  if (t > T.pushes && t < 16.5) look = [-1, -5];
  const worried = t > T.pushes && t < 16.0;
  const mouthO = t > T.pushes && t < 13.6 ? 1 : 0;
  const juiceDip = t > T.rise && t < 24.9 ? 5 * eout(prog(t, T.rise, T.limit)) * (t > T.outro ? 1 - prog(t, T.outro, 24.9) : 1) : 0;

  // air puffs on the glass
  const puffs = [
    {x: GX - 34, y: 1757, s: 0.27, at: T.puffs},
    {x: GX + 38, y: 1755, s: 0.26, at: T.puffs + 0.1},
    {x: GX - 70, y: 1730, s: 0.22, at: T.puffs + 0.2},
  ];
  const pushK = t > T.pushes ? eout(prog(t, T.pushes, T.pushes + 0.18)) : 0;
  const puffGone = popOut(t, 14.2);

  // ruler highlight
  const tenOn = pop(t, T.ten, 0.25);
  const tenLine = t < T.ten ? 0 : t < T.outro ? eout(prog(t, T.ten, T.ten + 0.35)) : 1 - prog(t, T.outro, 24.3);
  const elevenPulse = t > T.eleven && t < T.eleven + 0.6 ? 1 + 0.25 * Math.sin(prog(t, T.eleven, T.eleven + 0.6) * Math.PI) : 1;

  // gap bracket
  const gap = t < T.short ? 0 : t < T.outro ? pop(t, T.short, 0.22) : popOut(t, T.outro, 0.15);

  // sweat drops
  const sweat = (() => {
    for (const [a, p] of [
      [15.3, 'P04'],
      [23.3, 'P08'],
    ] as [number, PoseName][]) {
      if (t > a && t < a + 1.0 && pose === p) {
        const u = prog(t, a, a + 1.0);
        const hm = META[p].head;
        const c = toW(p, hm[0], hm[1]);
        const sc0 = u < 0.15 ? pop(t, a, 0.15) : u > 0.85 ? clamp((1 - u) / 0.15) : 1;
        return {x: c[0] + R * 0.78, y: c[1] - R * 0.45 + 30 * eio(u), s: sc0};
      }
    }
    return null;
  })();

  // dust on landing
  const dust = t > T.land && t < T.land + 0.6 ? prog(t, T.land, T.land + 0.6) : -1;

  // air dots inside the straw while sipping
  const dots: [number, number][] = [];
  if (t > 8.9 && t < 11.6) {
    const n = t < T.lower ? 9 : Math.round(lerp(9, 2, prog(t, T.lower, 10.6)));
    for (let i = 0; i < n; i++) {
      const y = 560 - (((t * 150 + i * 29) % 260) + 260) % 260;
      if (y > top[1] + 30) dots.push(atY(y) as [number, number]);
    }
  }

  // far layer camera (parallax)
  const pz = W.z * Math.pow(cam.z / W.z, 0.3);
  const px = W.x + (cam.x - W.x) * 0.3;
  const py = W.y + (cam.y - W.y) * 0.3;
  const farBlur = clamp((cam.z - 1.3) * 1.6, 0, 3.4);

  const worldStyle = (c: Cam): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${540 + sh.x}px, ${960 + sh.y}px) scale(${c.z}) translate(${-c.x}px, ${-c.y}px)`,
  });

  const svgBox = {position: 'absolute' as const, left: -2000, top: -2000, width: 6000, height: 6000, overflow: 'visible' as const};
  const vb = '-2000 -2000 6000 6000';

  const charSrc = pose === 'P06' ? 'P06_pull' : pose;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#7CC8F8 0%, #BFE6FF 70%, #DDF3FF 100%)', overflow: 'hidden'}}>
      {/* far clouds */}
      <AbsoluteFill style={{filter: farBlur ? `blur(${farBlur}px)` : undefined}}>
        <div style={worldStyle({x: px, y: py, z: pz})}>
          <svg style={svgBox} viewBox={vb}>
            <Cloud x={160 + Math.sin(t * 0.2) * 10} y={-80} s={1.6} />
            <Cloud x={1420} y={150} s={1.25} />
            <Cloud x={420} y={640} s={1.0} />
            <Cloud x={1560} y={-420} s={1.4} />
            <Cloud x={-120} y={1050} s={1.1} />
          </svg>
        </div>
      </AbsoluteFill>

      {/* main world */}
      <div style={worldStyle(cam)}>
        {/* ground */}
        <svg style={svgBox} viewBox={vb}>
          <rect x={-2000} y={1878} width={6000} height={3000} fill="#86CF5F" />
          <rect x={-2000} y={1960} width={6000} height={3000} fill="#79C454" />
          <line x1={-2000} x2={4000} y1={1878} y2={1878} stroke={INK} strokeWidth={4} />
        </svg>
        {/* building */}
        <Img src={staticFile('straw/S01.png')} style={{position: 'absolute', left: 0, top: 0, width: META.S01.w, height: META.S01.h}} />
        {/* railing (behind the character) + slab */}
        <svg style={svgBox} viewBox={vb}>
          {Array.from({length: 16}).map((_, i) => {
            const x = 742 + i * 27.5;
            return <line key={i} x1={x} x2={x} y1={318} y2={432} stroke={INK} strokeWidth={4} />;
          })}
          <rect x={728} y={308} width={438} height={13} rx={4} fill="#A6AEB6" stroke={INK} strokeWidth={4} />
          <rect x={722} y={428} width={446} height={74} fill="#E7DFC9" stroke={INK} strokeWidth={5} />
          <rect x={724.5} y={468} width={441} height={31.5} fill="#CFC5AB" />
          <line x1={722} x2={1168} y1={468} y2={468} stroke={INK} strokeWidth={3} />
          <rect x={722} y={428} width={446} height={74} fill="none" stroke={INK} strokeWidth={5} />
        </svg>

        {/* hose (vacuum pump -> straw top) */}
        {hoseP > 0 && (
          <svg style={svgBox} viewBox={vb}>
            <path d={hoseD} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - hoseP} />
            <path d={hoseD} fill="none" stroke="#4B525B" strokeWidth={7.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - hoseP} />
          </svg>
        )}

        {/* straw */}
        <svg style={svgBox} viewBox={vb}>
          <line x1={top[0]} y1={top[1]} x2={bot[0]} y2={bot[1]} stroke={INK} strokeWidth={strawW + 2 * LW} strokeLinecap="round" />
          <line x1={top[0]} y1={top[1]} x2={bot[0]} y2={bot[1]} stroke="#FFFFFF" strokeWidth={strawW} strokeLinecap="round" />
          {level < GS + 1 && (
            <line x1={juiceTop[0]} y1={juiceTop[1]} x2={bot[0]} y2={bot[1]} stroke="#FF9A1F" strokeWidth={strawW} />
          )}
          <line
            x1={top[0]}
            y1={top[1]}
            x2={bot[0]}
            y2={bot[1]}
            stroke="#E8473B"
            strokeOpacity={0.85}
            strokeWidth={strawW}
            strokeDasharray="5 13"
          />
          {level < GS - 3 && (
            <ellipse cx={juiceTop[0]} cy={juiceTop[1]} rx={strawW / 2} ry={2.2} fill="#FFC25A" />
          )}
          {dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.3} fill="#5A6F86" />
          ))}
          <ellipse cx={top[0]} cy={top[1]} rx={strawW / 2 + LW / 2} ry={2.6} fill="#fff" stroke={INK} strokeWidth={LW} />
        </svg>

        {/* pump */}
        <PumpRig t={t} posing={pose === 'P06'} pullSy={pullSy} />

        {/* dust puffs */}
        {dust >= 0 && (
          <svg style={svgBox} viewBox={vb}>
            {[
              [1075, 425, -1],
              [1195, 425, 1],
            ].map(([x, y, d], i) => {
              const s = 0.35 * Math.sin(Math.min(1, dust * 1.2) * Math.PI) + 0.01;
              return <Cloud key={i} x={x + d * 40 * eout(dust)} y={y - 12 * dust} s={s} fill="#DADDE0" lw={3} />;
            })}
          </svg>
        )}

        {/* character */}
        <Sprite src={charSrc} pose={pose} sx={pumping ? 1 : sx} sy={pumping ? pullSy : sy} dx={jx} />

        {/* sweat drop */}
        {sweat && (
          <svg style={svgBox} viewBox={vb}>
            <g transform={`translate(${sweat.x} ${sweat.y}) scale(${sweat.s})`}>
              <path d="M 0 -16 C 6 -6, 10 0, 10 6 A 10 10 0 0 1 -10 6 C -10 0, -6 -6, 0 -16 Z" fill="#8FD8FF" stroke={INK} strokeWidth={2.6} />
              <ellipse cx={-3.5} cy={5} rx={2} ry={3.2} fill="#fff" />
            </g>
          </svg>
        )}

        {/* glass with a face */}
        <svg style={svgBox} viewBox={vb}>
          <path d={`M ${GX - 43} ${GT} L ${GX + 43} ${GT} L ${GX + 34} ${GB} L ${GX - 34} ${GB} Z`} fill="#E3F4FF" />
          <path
            d={`M ${GX - 41.5} ${GS + juiceDip} L ${GX + 41.5} ${GS + juiceDip} L ${GX + 34} ${GB - 2} L ${GX - 34} ${GB - 2} Z`}
            fill="#FF9A1F"
          />
          <ellipse cx={GX} cy={GS + juiceDip} rx={41} ry={5} fill="#FFC25A" />
          <rect x={GX - 28} y={1806 + juiceDip} width={16} height={14} rx={3} fill="#FFE2B0" opacity={0.9} transform={`rotate(-12 ${GX - 20} 1813)`} />
          <rect x={GX + 12} y={1812 + juiceDip} width={14} height={12} rx={3} fill="#FFE2B0" opacity={0.9} transform={`rotate(10 ${GX + 19} 1818)`} />
          {/* face */}
          {[GX - 16, GX + 17].map((ex, i) => {
            const ey = 1840;
            const o = eyeOpen * blink;
            return (
              <g key={i}>
                {o > 0.05 ? (
                  <g transform={`translate(${ex} ${ey}) scale(1 ${o})`}>
                    <ellipse rx={10} ry={13} fill="#fff" stroke={INK} strokeWidth={2.6} />
                    <circle cx={look[0]} cy={look[1]} r={5.2} fill={INK} />
                    <circle cx={look[0] - 1.8} cy={look[1] - 2} r={1.6} fill="#fff" />
                  </g>
                ) : (
                  <path d={`M ${ex - 8} ${ey + 1} Q ${ex} ${ey + 6} ${ex + 8} ${ey + 1}`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
                )}
                {eyeOpen > 0.5 && (
                  <line
                    x1={ex - 9}
                    x2={ex + 9}
                    y1={ey - 19 + (worried ? (i === 0 ? 3 : -3) : 0)}
                    y2={ey - 19 + (worried ? (i === 0 ? -3 : 3) : 0)}
                    stroke={INK}
                    strokeWidth={3.4}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
          {mouthO > 0 && <ellipse cx={GX + 1} cy={1866} rx={4.5} ry={6} fill="#5A1A10" stroke={INK} strokeWidth={2} />}
          {/* glass outline + glints */}
          <path d={`M ${GX - 43} ${GT} L ${GX + 43} ${GT} L ${GX + 34} ${GB} L ${GX - 34} ${GB} Z`} fill="none" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
          <ellipse cx={GX} cy={GT} rx={43} ry={4} fill="none" stroke={INK} strokeWidth={2.4} />
          <line x1={GX + 30} y1={GT + 14} x2={GX + 25} y2={GT + 60} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          <line x1={GX + 24} y1={GT + 70} x2={GX + 22} y2={GT + 84} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </svg>

        {/* air puffs pushing on the drink */}
        {t > T.puffs && puffGone > 0 && (
          <svg style={svgBox} viewBox={vb}>
            {puffs.map((p, i) => {
              const s = pop(t, p.at, 0.2) * puffGone;
              if (s <= 0) return null;
              const syq = 1 - 0.2 * pushK + 0.03 * Math.sin(t * 20 + i) * pushK;
              const sxq = 1 + 0.14 * pushK;
              const yy = p.y + 10 * pushK;
              return (
                <g key={i} transform={`translate(${p.x} ${yy}) scale(${s * sxq} ${s * syq})`}>
                  <Cloud x={0} y={0} s={1} lw={6} />
                  <ellipse cx={-10} cy={-2} rx={4.5} ry={6} fill={INK} />
                  <ellipse cx={12} cy={-2} rx={4.5} ry={6} fill={INK} />
                  <line x1={-18} y1={-16} x2={-4} y2={-11} stroke={INK} strokeWidth={4} strokeLinecap="round" />
                  <line x1={20} y1={-16} x2={6} y2={-11} stroke={INK} strokeWidth={4} strokeLinecap="round" />
                  {pushK > 0 && t < 13.4 &&
                    [-22, 0, 22].map((lx, k) => (
                      <line key={k} x1={lx} x2={lx} y1={44} y2={44 + 18 * Math.abs(Math.sin(t * 9 + k))} stroke={INK} strokeWidth={4} strokeLinecap="round" />
                    ))}
                </g>
              );
            })}
          </svg>
        )}

        {/* measuring tape */}
        <svg style={svgBox} viewBox={vb}>
          <rect x={RULER_X} y={MOUTH_Y - 34} width={30} height={GS - MOUTH_Y + 34 + 6} rx={5} fill="#FFD447" stroke={INK} strokeWidth={4} />
          {Array.from({length: 23}).map((_, i) => {
            const y = GS - (i / 2) * METER;
            const major = i % 2 === 0;
            return <line key={i} x1={RULER_X} x2={RULER_X + (major ? 17 : 9)} y1={y} y2={y} stroke={INK} strokeWidth={major ? 4 : 2.5} />;
          })}
          {Array.from({length: 11}).map((_, i) => {
            const m = i;
            const y = GS - m * METER;
            const isTen = m === 10;
            const s = isTen ? 1 + 0.35 * tenOn : 1;
            return (
              <text
                key={i}
                x={RULER_X + 40}
                y={y + 11}
                fontFamily="DejaVu Sans, Arial, sans-serif"
                fontWeight={900}
                fontSize={30}
                fill={isTen && tenOn > 0 ? '#E5372E' : INK}
                stroke="#fff"
                strokeWidth={6}
                paintOrder="stroke"
                transform={`translate(${RULER_X + 40} ${y}) scale(${s}) translate(${-(RULER_X + 40)} ${-y})`}
              >
                {isTen && tenOn > 0 ? '10 m' : m}
              </text>
            );
          })}
          <text
            x={RULER_X + 40}
            y={MOUTH_Y + 15}
            fontFamily="DejaVu Sans, Arial, sans-serif"
            fontWeight={900}
            fontSize={44}
            fill={INK}
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
            transform={`translate(${RULER_X + 40} ${MOUTH_Y}) scale(${elevenPulse}) translate(${-(RULER_X + 40)} ${-MOUTH_Y})`}
          >
            11 m
          </text>
          {tenLine > 0 && (
            <line
              x1={RULER_X}
              x2={lerp(RULER_X, atY(TEN)[0] + 10, tenLine)}
              y1={TEN}
              y2={TEN}
              stroke="#E5372E"
              strokeWidth={4.5}
              strokeDasharray="12 9"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* gap between the water and the top of the straw */}
        {gap > 0 && (
          <svg style={svgBox} viewBox={vb}>
            <line x1={RULER_X - 26} x2={lerp(RULER_X - 26, atY(LIMIT)[0] + 8, Math.min(1, gap))} y1={LIMIT} y2={LIMIT} stroke="#E5372E" strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
            <g transform={`translate(${RULER_X - 14} ${(LIMIT + REST[1]) / 2}) scale(${gap}) translate(${-(RULER_X - 14)} ${-(LIMIT + REST[1]) / 2})`}>
              {[
                [REST[1] + 2, 1],
                [LIMIT - 2, -1],
              ].map(([y, d], i) => (
                <g key={i}>
                  <line x1={RULER_X - 24} x2={RULER_X - 4} y1={y} y2={y} stroke="#E5372E" strokeWidth={4} strokeLinecap="round" />
                  <path d={`M ${RULER_X - 21} ${y + d * 11} L ${RULER_X - 14} ${y + d * 2} L ${RULER_X - 7} ${y + d * 11}`} fill="none" stroke="#E5372E" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ))}
              <line x1={RULER_X - 14} x2={RULER_X - 14} y1={REST[1] + 4} y2={LIMIT - 4} stroke="#E5372E" strokeWidth={4} strokeLinecap="round" />
              <text
                x={RULER_X + 40}
                y={(LIMIT + REST[1]) / 2 + 22}
                fontFamily="DejaVu Sans, Arial, sans-serif"
                fontWeight={900}
                fontSize={26}
                fill="#E5372E"
                stroke="#fff"
                strokeWidth={6}
                paintOrder="stroke"
              >
                0.7 m
              </text>
            </g>
          </svg>
        )}
      </div>

      <Sequence from={Math.round(VO_OFFSET * FPS)} layout="none">
        <Audio src={staticFile('straw/vo.mp3')} />
      </Sequence>
      <Audio src={staticFile('straw/sfx.wav')} />
    </AbsoluteFill>
  );
};

export const LEVELS = {MOUTH_Y, METER, LIMIT, TEN};
