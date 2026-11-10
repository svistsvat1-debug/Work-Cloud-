import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import meta from './sprites.json';

export const FPS = 60;
export const DURATION = 24.6;

// ---------------------------------------------------------------------------------------------
// Beat times (seconds, global). Voice starts at 0.1 s; values = Scribe word starts + 0.1.
const VO = 0.1;
const T = {
  oneLeg: 2.74, two1: 4.74,
  cut1: 5.62, researchers: 5.72, twoB: 7.04, flam: 7.28, zoo: 8.38,
  cut2: 9.04, foot: 9.42, body: 10.36, joints: 11.32, firm: 11.98, no: 12.74, working: 13.32,
  two2: 14.38, hold: 15.86,
  cut3: 16.66, sway: 18.06, doze: 19.06,
  so: 20.18, probably: 22.32, two3: 23.54,
};
const FALL1 = {start: 4.86, dur: 0.5};
const FALL2 = {start: 15.9, dur: 0.5};

// ---------------------------------------------------------------------------------------------
// helpers
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eio = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eout = (u: number) => 1 - Math.pow(1 - u, 3);
const ein = (u: number) => u * u * u;
// 0 -> 1 with a springy overshoot, starting at t0
const pop = (t: number, t0: number) => {
  if (t < t0) return 0;
  const u = t - t0;
  return 1 - Math.exp(-u * 9) * Math.cos(u * 16);
};
// 1 -> 0 shrink, starting at t1
const out = (t: number, t1: number, d = 0.22) => (t < t1 ? 1 : 1 - ein(seg(t, t1, t1 + d)));
const appear = (t: number, t0: number, t1: number) => pop(t, t0) * out(t, t1);
// damped spring offset after an event
const spring = (t: number, t0: number, amp: number, k = 7, w = 22) =>
  t < t0 ? 0 : amp * Math.exp(-(t - t0) * k) * Math.cos((t - t0) * w);

type Cam = {x: number; y: number; z: number};
type Key = Cam & {t: number; e?: (u: number) => number};
const camAt = (keys: Key[], t: number): Cam => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const u = (b.e ?? eio)(seg(t, a.t, b.t));
      const ka = Math.log(1000 / (1000 - a.z));
      const kb = Math.log(1000 / (1000 - b.z));
      const k = Math.exp(lerp(ka, kb, u));
      return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / k};
    }
  }
  return keys[keys.length - 1];
};
const shakeAt = (t: number, ev: {t: number; a: number; d: number}[]) => {
  let amp = 0;
  for (const e of ev) if (t >= e.t) amp += e.a * Math.exp(-((t - e.t) / e.d) * 3);
  return {
    x: amp * (Math.sin(t * 2 * Math.PI * 13.3) + 0.6 * Math.sin(t * 2 * Math.PI * 7.1 + 1.3)),
    y: amp * (Math.sin(t * 2 * Math.PI * 11.7 + 0.4) + 0.5 * Math.sin(t * 2 * Math.PI * 5.3 + 2.1)),
  };
};

// ---------------------------------------------------------------------------------------------
// 2.5D multiplane layer: world units; at cam z=0 a layer at Z=1000 shows 1 unit = 1 px
const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 250) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0',
          transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// pivot-based puppet: children are drawn in the sprite's own pixel space
const Rig: React.FC<{
  x: number; y: number; px: number; py: number; s: number; rot?: number; sx?: number; sy?: number; flip?: boolean;
  children: React.ReactNode;
}> = ({x, y, px, py, s, rot = 0, sx = 1, sy = 1, flip = false, children}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: 0, height: 0, transformOrigin: '0 0',
      transform: `rotate(${rot}deg) scale(${s * sx * (flip ? -1 : 1)}, ${s * sy})`,
    }}
  >
    <div style={{position: 'absolute', left: -px, top: -py}}>{children}</div>
  </div>
);

const SPR = meta as unknown as Record<string, {w: number; h: number}>;
const Sprite: React.FC<{name: string; show?: boolean}> = ({name, show = true}) => (
  <Img
    src={staticFile(`flamingo/sprites/${name}.png`)}
    style={{position: 'absolute', left: 0, top: 0, width: SPR[name].w, height: SPR[name].h, opacity: show ? 1 : 0}}
  />
);

// clip everything below a world y line (feet in water, bodies inside a crate)
const ClipBelow: React.FC<{y: number; x0?: number; x1?: number; children: React.ReactNode}> = ({y, x0 = -6000, x1 = 6000, children}) => (
  <div style={{position: 'absolute', left: x0, top: -6000, width: x1 - x0, height: y + 6000, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: -x0, top: 6000}}>{children}</div>
  </div>
);

const Svg: React.FC<{x: number; y: number; w: number; h: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, children, style}) => (
  <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible', ...style}} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    {children}
  </svg>
);

const INK = '#1b1b1f';
const FONT = 'Inter, "DejaVu Sans", sans-serif';

// ---------------------------------------------------------------------------------------------
// world constants
const FL = (meta as any)._fl;
const SCI = (meta as any)._sci;
const FALL = (meta as any)._fall;
const S_FL = 1000 / (FL.foot[1] - FL.top); // flamingo 1000 world units tall
const S_SCI = 760 / (SCI.feet[1] - SCI.top); // scientist 760 tall
const LEG: [number, number] = [347, FL.foot[1]]; // where the standing leg meets the foot (sprite px)
const FLOOR = 1700;
const WATER = 1655;

const flW = (legX: number, p: number[]) => [legX + (p[0] - LEG[0]) * S_FL, FLOOR + (p[1] - LEG[1]) * S_FL];

// scientist poses live in different frames: each has its own feet pivot
const SCI_PIV: Record<string, number[]> = {
  sci: SCI.feet, sci_oneleg: SCI.feet, sci_pointer: (meta as any).sci_pointer.feet, sci_amazed: (meta as any).sci_amazed.feet,
};
// which pose is on screen at t, with a squash-swap around every change
const poseAt = (t: number, keys: [number, string][]) => {
  let pose = keys[0][1];
  let last = -99;
  let next = 999;
  for (const [k, n] of keys) {
    if (t >= k) { pose = n; last = k; } else if (k < next) next = k;
  }
  const sq = next - t < 0.12 ? swapScale(t, next) : swapScale(t, last);
  return {pose, sx: sq.sx, sy: sq.sy};
};
const SciPose: React.FC<{x: number; y: number; pose: string; rot?: number; sx?: number; sy?: number}> = ({x, y, pose, rot = 0, sx = 1, sy = 1}) => (
  <Rig x={x} y={y} px={SCI_PIV[pose][0]} py={SCI_PIV[pose][1]} s={S_SCI} rot={rot} sx={sx} sy={sy}>
    <Sprite name={pose} />
  </Rig>
);

// X-ray card of the leg, laid over the real leg (card joint = world joint)
const XR = (meta as any).xray_card;
const XR_W = 250;
const XR_S = XR_W / XR.w;
const XR_MID = [334, 653];
const XR_TOP = [342, 128];
const XrayCard: React.FC<{jx: number; jy: number; s: number}> = ({jx, jy, s}) => {
  if (s <= 0.001) return null;
  const x0 = jx - XR_MID[0] * XR_S;
  const y0 = jy - XR_MID[1] * XR_S;
  const w = XR_W;
  const h = XR.h * XR_S;
  return (
    <div style={{position: 'absolute', left: x0, top: y0, width: w, height: h, transformOrigin: `${XR_MID[0] * XR_S}px ${XR_MID[1] * XR_S}px`, transform: `scale(${s})`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 16, overflow: 'hidden', border: `8px solid ${INK}`, boxSizing: 'border-box', background: '#0B1E3F'}}>
        <Img src={staticFile('flamingo/sprites/xray_card.png')} style={{position: 'absolute', left: -8, top: -8, width: w, height: h}} />
      </div>
      <svg style={{position: 'absolute', left: w / 2 - 70, top: -34, overflow: 'visible'}} width={140} height={50}>
        <rect x={0} y={0} width={140} height={46} rx={12} fill="#7FE3FF" stroke={INK} strokeWidth={7} />
        <text x={70} y={33} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={28} fill={INK} letterSpacing={2}>X-RAY</text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// drawn props
const Halo: React.FC<{t: number; scale?: number}> = ({t, scale = 1}) => {
  const bob = Math.sin(t * 2 * Math.PI * 1.1) * 7;
  const cx = FL.headTop[0] + 6;
  const cy = FL.headTop[1] - 70 + bob;
  return (
    <svg style={{position: 'absolute', left: cx - 140, top: cy - 60, overflow: 'visible'}} width={280} height={120}>
      <g transform={`translate(140 60) rotate(-6) scale(${scale})`}>
        <ellipse cx={0} cy={0} rx={98} ry={27} fill="none" stroke={INK} strokeWidth={24} />
        <ellipse cx={0} cy={0} rx={98} ry={27} fill="none" stroke="#FFD84D" strokeWidth={12} />
        <ellipse cx={-30} cy={-14} rx={18} ry={4} fill="#FFF6C8" />
      </g>
    </svg>
  );
};

const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div
    style={{
      position: 'absolute', left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: '50%',
      background: `rgba(72, 54, 60, ${0.24 * o})`, filter: 'blur(4px)',
    }}
  />
);

const Ring: React.FC<{x: number; y: number; rx: number; ry: number; s: number; color?: string}> = ({x, y, rx, ry, s, color = '#FFE45C'}) =>
  s <= 0.001 ? null : (
    <svg style={{position: 'absolute', left: x - rx * 1.6, top: y - ry * 1.6, overflow: 'visible'}} width={rx * 3.2} height={ry * 3.2}>
      <g transform={`translate(${rx * 1.6} ${ry * 1.6}) scale(${s})`}>
        <ellipse rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={15} />
        <ellipse rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={8} />
      </g>
    </svg>
  );

// cluster of round puffs with one merged outline (draw all ink circles first, then all fills)
const Puffs: React.FC<{x: number; y: number; t: number; t0: number; dir?: number; n?: number; spread?: number}> = ({x, y, t, t0, dir = 0, n = 7, spread = 260}) => {
  if (t < t0 || t > t0 + 1.0) return null;
  const u = t - t0;
  const items = Array.from({length: n}, (_, i) => {
    const a = (i / (n - 1) - 0.5) * 2; // -1..1
    const vx = a * spread * 1.4 + dir * 60;
    const px = x + vx * (1 - Math.exp(-u * 4)) / 1.6;
    const py = y - 20 - Math.abs(Math.sin(i * 1.7)) * 40 * (1 - Math.exp(-u * 4)) - u * 30;
    const grow = eout(clamp(u / 0.25));
    const shrink = 1 - ein(seg(u, 0.45, 0.95));
    const r = (34 + 18 * Math.abs(Math.cos(i * 2.3))) * grow * shrink;
    return {px, py, r};
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      {items.map((c, i) => <circle key={`o${i}`} cx={c.px} cy={c.py} r={Math.max(0, c.r + 7)} fill={INK} />)}
      {items.map((c, i) => <circle key={`f${i}`} cx={c.px} cy={c.py} r={Math.max(0, c.r)} fill="#EDEFF2" />)}
      {items.map((c, i) => <circle key={`h${i}`} cx={c.px - c.r * 0.25} cy={c.py - c.r * 0.3} r={Math.max(0, c.r * 0.45)} fill="#FFFFFF" />)}
    </svg>
  );
};

const SweatDrop: React.FC<{x: number; y: number; t: number; t0: number; life?: number}> = ({x, y, t, t0, life = 1.1}) => {
  const s = appear(t, t0, t0 + life);
  if (s <= 0.001) return null;
  const slide = eio(seg(t, t0 + 0.15, t0 + life)) * 40;
  return (
    <svg style={{position: 'absolute', left: x - 40, top: y - 60 + slide, overflow: 'visible'}} width={80} height={110}>
      <g transform={`translate(40 60) scale(${s})`}>
        <path d="M0,-52 C14,-28 30,-6 30,14 C30,32 16,44 0,44 C-16,44 -30,32 -30,14 C-30,-6 -14,-28 0,-52 Z" fill="#8FD3FF" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <ellipse cx={-10} cy={14} rx={6} ry={11} fill="#FFFFFF" />
      </g>
    </svg>
  );
};

const Padlock: React.FC<{x: number; y: number; s: number; closed: number}> = ({x, y, s, closed}) =>
  s <= 0.001 ? null : (
    <svg style={{position: 'absolute', left: x - 80, top: y - 110, overflow: 'visible'}} width={160} height={200}>
      <g transform={`translate(80 110) scale(${s})`}>
        <g transform={`translate(0 ${-26 * (1 - closed)}) rotate(${-14 * (1 - closed)} 22 -30)`}>
          <path d="M-24,-10 L-24,-38 A24,24 0 0 1 24,-38 L24,-10" fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" />
          <path d="M-24,-10 L-24,-38 A24,24 0 0 1 24,-38 L24,-10" fill="none" stroke="#B9C3CC" strokeWidth={11} strokeLinecap="round" />
        </g>
        <rect x={-46} y={-16} width={92} height={74} rx={14} fill="#F4C53A" stroke={INK} strokeWidth={8} />
        <rect x={-38} y={-8} width={14} height={56} rx={6} fill="#FFE27E" />
        <circle cx={0} cy={14} r={9} fill={INK} />
        <rect x={-4} y={16} width={8} height={18} rx={3} fill={INK} />
      </g>
    </svg>
  );

const Monitor: React.FC<{x: number; y: number; s: number; t: number; t0: number}> = ({x, y, s, t, t0}) => {
  if (s <= 0.001) return null;
  const W = 250;
  const H = 170;
  const prog = clamp((t - t0 - 0.15) / 1.1);
  const lx0 = 22;
  const lx1 = lx0 + (W - 44) * prog;
  const ly = 112;
  return (
    <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={W} height={H + 40}>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>
        <rect x={W / 2 - 14} y={H - 6} width={28} height={30} fill="#55606B" stroke={INK} strokeWidth={6} />
        <rect x={W / 2 - 50} y={H + 20} width={100} height={14} rx={6} fill="#55606B" stroke={INK} strokeWidth={6} />
        <rect x={0} y={0} width={W} height={H} rx={18} fill="#3A4652" stroke={INK} strokeWidth={8} />
        <rect x={12} y={12} width={W - 24} height={H - 24} rx={10} fill="#0F2B2F" />
        {[50, 80, 110, 140].map((gy) => <line key={gy} x1={18} x2={W - 18} y1={gy} y2={gy} stroke="#1E4A4F" strokeWidth={2} />)}
        <text x={W / 2} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#CFFFE0" letterSpacing={2}>MUSCLES</text>
        <line x1={lx0} x2={lx1} y1={ly} y2={ly} stroke="#4CFF8A" strokeWidth={6} strokeLinecap="round" />
        <circle cx={lx1} cy={ly} r={8} fill="#B8FFD0" />
        <text x={W - 26} y={150} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#4CFF8A">0%</text>
      </g>
    </svg>
  );
};

const Crate: React.FC<{x: number; y: number; w: number; h: number; stamp: number}> = ({x, y, w, h, stamp}) => (
  <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={w} height={h}>
    <rect x={0} y={0} width={w} height={h} rx={10} fill="#E3A866" stroke={INK} strokeWidth={9} />
    {[1, 2, 3].map((i) => <line key={i} x1={8} x2={w - 8} y1={(h / 4) * i} y2={(h / 4) * i} stroke={INK} strokeWidth={6} />)}
    <rect x={0} y={0} width={w} height={34} rx={8} fill="#C98B4E" stroke={INK} strokeWidth={9} />
    <rect x={10} y={h * 0.25 + 6} width={w - 20} height={h * 0.5 - 12} fill="#EDB97C" opacity={0.0} />
    <line x1={20} y1={44} x2={w - 20} y2={h - 16} stroke="#C98B4E" strokeWidth={20} strokeLinecap="round" opacity={0.0} />
    <g transform={`translate(${w / 2} ${h * 0.62}) scale(${stamp}) rotate(-6)`}>
      <rect x={-118} y={-62} width={236} height={110} rx={10} fill="none" stroke="#7A4A1F" strokeWidth={9} />
      <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={92} fill="#7A4A1F" letterSpacing={6}>ZOO</text>
    </g>
  </svg>
);

const Zs: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  if (t < t0) return null;
  const items = [];
  for (let i = 0; i < 8; i++) {
    const b = t0 + i * 0.85;
    const u = t - b;
    if (u < 0 || u > 2.2) continue;
    const s = eout(clamp(u / 0.4)) * (1 - ein(seg(u, 1.6, 2.2))) * (0.55 + 0.45 * clamp(u / 2));
    const px = x + u * 40 + Math.sin(u * 3 + i) * 14;
    const py = y - u * 120;
    items.push(
      <text
        key={i} x={px} y={py} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={96 * s}
        fill="#FFFFFF" stroke={INK} strokeWidth={11 * s} paintOrder="stroke" strokeLinejoin="round"
        transform={`rotate(-12 ${px} ${py})`}
      >
        Z
      </text>,
    );
  }
  return <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>{items}</svg>;
};

// sway indicator: dashed arc around the foot pivot
const SwayArc: React.FC<{cx: number; cy: number; r: number; deg: number; s: number}> = ({cx, cy, r, deg, s}) => {
  if (s <= 0.001 || deg <= 0.05) return null;
  const a0 = (-90 - deg) * (Math.PI / 180);
  const a1 = (-90 + deg) * (Math.PI / 180);
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  const d = `M${p0[0]},${p0[1]} A${r},${r} 0 0 1 ${p1[0]},${p1[1]}`;
  const head = (p: number[], ang: number, sign: number) => {
    const tx = -Math.sin(ang) * sign;
    const ty = Math.cos(ang) * sign;
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    const L = Math.min(34, r * (deg * Math.PI / 180) * 0.35);
    return `M${p[0] + nx * 22 - tx * L},${p[1] + ny * 22 - ty * L} L${p[0]},${p[1]} L${p[0] - nx * 22 - tx * L},${p[1] - ny * 22 - ty * L}`;
  };
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: clamp(s)}} width={1} height={1}>
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
        <path d={d} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeDasharray="22 18" />
        <path d={head(p0, a0, -1)} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
        <path d={head(p0, a0, -1)} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={head(p1, a1, 1)} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
        <path d={head(p1, a1, 1)} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

const Ripples: React.FC<{x: number; y: number; t: number; w?: number; seed?: number}> = ({x, y, t, w = 60, seed = 0}) => {
  const rings = [0, 1].map((i) => {
    const u = ((t + seed + i * 0.8) % 1.6) / 1.6;
    return {rx: w + u * 110, ry: (w + u * 110) * 0.22, o: 0.85 * (1 - u)};
  });
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <ellipse cx={x} cy={y} rx={w} ry={w * 0.24} fill="#5FB6EE" stroke="#FFFFFF" strokeWidth={6} />
      {rings.map((r, i) => <ellipse key={i} cx={x} cy={y} rx={r.rx} ry={r.ry} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={r.o} />)}
    </svg>
  );
};

const Splash: React.FC<{x: number; y: number; t: number; t0: number}> = ({x, y, t, t0}) => {
  const u = t - t0;
  if (u < 0 || u > 0.9) return null;
  const drops = Array.from({length: 11}, (_, i) => {
    const a = -Math.PI / 2 + (i / 10 - 0.5) * 2.2;
    const v = 520 + 160 * Math.abs(Math.sin(i * 3.1));
    const px = x + Math.cos(a) * v * u * 0.75;
    const py = y + Math.sin(a) * v * u + 0.5 * 2200 * u * u;
    const r = (13 + 7 * Math.abs(Math.cos(i * 1.9))) * (1 - ein(seg(u, 0.45, 0.9)));
    return {px, py, r};
  });
  const ringU = eout(clamp(u / 0.8));
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <ellipse cx={x} cy={y} rx={60 + ringU * 170} ry={(60 + ringU * 170) * 0.22} fill="none" stroke="#FFFFFF" strokeWidth={7} opacity={1 - ringU} />
      {drops.filter((d) => d.py < y + 4).map((d, i) => <circle key={`o${i}`} cx={d.px} cy={d.py} r={Math.max(0, d.r + 6)} fill={INK} />)}
      {drops.filter((d) => d.py < y + 4).map((d, i) => <circle key={`f${i}`} cx={d.px} cy={d.py} r={Math.max(0, d.r)} fill="#9EDBFF" />)}
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------
// backgrounds (one flat plate per set, far away = little parallax)
const BG_Z = 4000;
const Plate: React.FC<{name: string; cx: number; cy: number; w: number}> = ({name, cx, cy, w}) => {
  const h = (w * 16) / 9;
  return <Img src={staticFile(`flamingo/bg/${name}.png`)} style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h}} />;
};

// fall helper: angle (deg) after the start of a stiff topple, landing at `land` after `dur`, then a small bounce
const fallAngle = (t: number, start: number, dur: number, land: number) => {
  const u = t - start;
  if (u <= 0) return 0;
  const th0 = 2;
  const sg = Math.sign(land);
  const w = Math.acosh(1 + Math.abs(land) / th0) / dur;
  if (u < dur) return sg * th0 * (Math.cosh(w * u) - 1);
  const v = u - dur;
  return land - sg * 7 * Math.exp(-v * 7) * Math.abs(Math.sin(v * 13));
};

// squash-swap scale around a pose change at ts
const swapScale = (t: number, ts: number) => {
  const pre = seg(t, ts - 0.12, ts);
  if (t < ts) return {sx: 1 + 0.04 * eio(pre), sy: 1 - 0.06 * eio(pre)};
  const v = spring(t, ts, 0.06, 8, 24);
  return {sx: 1 - v * 0.6, sy: 1 + v};
};

// ---------------------------------------------------------------------------------------------
// SCENE 1: dead flamingo on one leg (lab) -> second leg drops on "two" -> topples
const LAB_BG = {cx: 560, cy: 1006, w: 5600};

const Scene1: React.FC<{t: number}> = ({t}) => {
  const legX = 600;
  const sh = shakeAt(t, [{t: FALL1.start + FALL1.dur, a: 16, d: 0.45}]);
  const c = camAt(
    [
      {t: 0, x: 590, y: 1180, z: 200},
      {t: 3.9, x: 600, y: 1200, z: 290},
      {t: 4.85, x: 600, y: 1200, z: 290},
      {t: 5.45, x: 110, y: 1380, z: -200, e: eio},
    ],
    t,
  );
  const cam = {x: c.x + sh.x, y: c.y + sh.y, z: c.z};
  const two = t >= T.two1;
  const sq = swapScale(t, T.two1);
  const rot = fallAngle(t, FALL1.start, FALL1.dur, FALL.left.land);
  // pivot: standing leg while upright on one leg, left foot edge for the topple
  const piv = two ? FALL.left.pivot : LEG;
  const [wx, wy] = flW(legX, piv);
  const ringS = appear(t, T.oneLeg, 4.3);
  const fallen = seg(t, FALL1.start, FALL1.start + FALL1.dur);
  return (
    <>
      <Layer cam={cam} z={BG_Z} blur={lerp(2.5, 1.2, fallen)}>
        <Plate name="bg_lab" {...LAB_BG} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Shadow x={legX + 10} y={FLOOR} w={lerp(300, 80, fallen)} o={1 - fallen * 0.7} />
        <Ring x={legX + 25} y={FLOOR - 6} rx={120} ry={34} s={ringS} />
        <Rig x={wx} y={wy} px={piv[0]} py={piv[1]} s={S_FL} rot={rot} sx={sq.sx} sy={sq.sy}>
          <Sprite name="fl_dead1" show={!two} />
          <Sprite name="fl_dead2" show={two} />
          <Halo t={t} />
        </Rig>
        <Puffs x={legX - 420} y={FLOOR} t={t} t0={FALL1.start + FALL1.dur} dir={-1} spread={330} />
      </Layer>
    </>
  );
};

// SCENE 2: zoo entrance, a crate drops from the sky, two flamingo heads pop up
const ZOO_BG = {cx: 560, cy: 1317, w: 5600};
const CRATE_DROP = 6.02;
const CRATE_LAND = 6.45;

const Scene2: React.FC<{t: number}> = ({t}) => {
  const sh = shakeAt(t, [{t: CRATE_LAND, a: 10, d: 0.35}, {t: T.zoo, a: 5, d: 0.3}]);
  const c = camAt([{t: T.cut1, x: 660, y: 1330, z: -40}, {t: T.cut2, x: 665, y: 1320, z: 30, e: (u) => u}], t);
  const cam = {x: c.x + sh.x, y: c.y + sh.y, z: c.z};
  const crate = {x: 610, y: 1300, w: 460, h: 400};
  const cu = clamp((t - CRATE_DROP) / (CRATE_LAND - CRATE_DROP));
  const off = t < CRATE_LAND ? -1500 * (1 - cu * cu) : -Math.abs(30 * Math.exp(-(t - CRATE_LAND) * 8) * Math.sin((t - CRATE_LAND) * 17));
  const crateSq = 1 + spring(t, CRATE_LAND, 0.1, 9, 24);
  const hop = Math.max(0, Math.sin(clamp((t - T.researchers) / 0.32) * Math.PI)) * 34;
  const breathe = 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
  const sci = poseAt(t, [[-99, 'sci'], [CRATE_LAND + 0.03, 'sci_amazed'], [7.0, 'sci_pointer']]);
  const headA = 1 - pop(t, T.twoB);
  const headB = 1 - pop(t, T.flam);
  const stamp = 1 + spring(t, T.zoo, 0.18, 6, 20);
  const shadowS = clamp(1 - Math.abs(off) / 1500);
  return (
    <>
      <Layer cam={cam} z={BG_Z} blur={2.2}>
        <Plate name="bg_zoo" {...ZOO_BG} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Shadow x={330} y={FLOOR} w={340} />
        <SciPose x={330} y={FLOOR - hop} pose={sci.pose} sx={sci.sx} sy={sci.sy * breathe} />
        <Shadow x={crate.x + crate.w / 2} y={FLOOR} w={540 * (0.4 + 0.6 * shadowS)} o={shadowS} />
        <ClipBelow y={crate.y + 30 + off}>
          {/* head A faces right, head B mirrored */}
          <Rig x={635} y={FLOOR + 310 + headA * 470 + off} px={LEG[0]} py={LEG[1]} s={S_FL} rot={-4}>
            <Sprite name="fl_dead1" />
            <Halo t={t} />
          </Rig>
          <Rig x={1085} y={FLOOR + 345 + headB * 480 + off} px={LEG[0]} py={LEG[1]} s={S_FL} rot={5} flip>
            <Sprite name="fl_dead1" />
            <Halo t={t + 0.4} />
          </Rig>
        </ClipBelow>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${crate.x + crate.w / 2}px ${FLOOR}px`, transform: `translateY(${off}px) scale(${2 - crateSq}, ${crateSq})`}}>
          <Crate {...crate} stamp={stamp} />
        </div>
        <Puffs x={crate.x + crate.w / 2} y={FLOOR} t={t} t0={CRATE_LAND} spread={240} n={6} />
      </Layer>
    </>
  );
};

// SCENE 3 + 4: foot under the body, joints lock, no muscles; then two legs -> wobble -> falls out of frame
const Scene3: React.FC<{t: number}> = ({t}) => {
  const legX = 690;
  const sciX = 160;
  const landT = FALL2.start + FALL2.dur;
  const sh = shakeAt(t, [{t: T.firm, a: 4, d: 0.25}, {t: landT, a: 15, d: 0.45}]);
  const joint = flW(legX, FL.joint);
  const com = flW(legX, FL.com);
  const c = camAt(
    [
      {t: T.cut2, x: 500, y: 1265, z: -60},
      {t: 10.75, x: 520, y: 1275, z: 0, e: (u) => u},
      {t: 11.5, x: 800, y: 1420, z: 430},
      {t: 13.85, x: 810, y: 1415, z: 455, e: (u) => u},
      {t: 14.4, x: 520, y: 1260, z: -80},
    ],
    t,
  );
  const cam = {x: c.x + sh.x, y: c.y + sh.y, z: c.z};
  const close = clamp((c.z - 0) / 450);
  const two = t >= T.two2;
  const sq = two ? swapScale(t, T.two2) : swapScale(t, T.two2);
  // wobble on two legs, growing, about the middle of the feet
  const wob = t > 14.5 && t < FALL2.start ? lerp(1.2, 7.5, seg(t, 14.5, FALL2.start)) * Math.sin((t - 14.5) * 2 * Math.PI * (3 / (FALL2.start - 14.5))) : 0;
  const falling = t >= FALL2.start;
  const piv = !two ? LEG : falling ? FALL.right.pivot : [389.5, FL.foot[1]];
  const rot = falling ? fallAngle(t, FALL2.start, FALL2.dur, FALL.right.land) : wob;
  const [wx, wy] = flW(legX, piv);
  // explanation graphics
  const footRing = appear(t, T.foot, 10.9);
  const lineU = eio(seg(t, 9.62, 10.3)) * out(t, 10.9, 0.25);
  const dotS = appear(t, T.body, 10.9);
  const cardS = appear(t, T.joints - 0.05, 13.95);
  const lockS = appear(t, 11.62, 13.95);
  const lockClosed = eout(seg(t, T.firm - 0.06, T.firm));
  const lock2S = appear(t, 11.74, 13.95);
  const lock2Closed = eout(seg(t, T.firm + 0.04, T.firm + 0.1));
  const topJ = [joint[0] + (XR_TOP[0] - XR_MID[0]) * XR_S, joint[1] + (XR_TOP[1] - XR_MID[1]) * XR_S];
  const sciP = poseAt(t, [[-99, 'sci_pointer'], [10.85, 'sci'], [landT + 0.03, 'sci_amazed']]);
  const monS = appear(t, 12.42, 13.95);
  const breathe = 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
  const sciHop = Math.max(0, Math.sin(clamp((t - landT) / 0.3) * Math.PI)) * 40;
  const fallen = seg(t, FALL2.start, landT);
  return (
    <>
      <Layer cam={cam} z={BG_Z} blur={lerp(2.5, 6, close)}>
        <Plate name="bg_lab" {...LAB_BG} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Shadow x={sciX} y={FLOOR} w={340} />
        <SciPose x={sciX} y={FLOOR - sciHop} pose={sciP.pose} sx={sciP.sx} sy={sciP.sy * breathe} />
        <SweatDrop x={sciX + 110} y={FLOOR - 650} t={t} t0={landT + 0.12} life={0.9} />
        <Shadow x={legX + 10} y={FLOOR} w={lerp(two ? 340 : 300, 90, fallen)} o={1 - fallen * 0.7} />
        <Ring x={legX + 25} y={FLOOR - 6} rx={120} ry={34} s={footRing} />
        <Rig x={wx} y={wy} px={piv[0]} py={piv[1]} s={S_FL} rot={rot} sx={sq.sx} sy={sq.sy}>
          <Sprite name="fl_dead1" show={!two} />
          <Sprite name="fl_dead2" show={two} />
          <Halo t={t} />
        </Rig>
        {/* plumb line from the body's centre down to the foot */}
        {lineU > 0.001 ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
            <line x1={legX} x2={legX} y1={FLOOR - 20} y2={lerp(FLOOR - 20, com[1], lineU)} stroke={INK} strokeWidth={15} strokeLinecap="round" />
            <line x1={legX} x2={legX} y1={FLOOR - 20} y2={lerp(FLOOR - 20, com[1], lineU)} stroke="#FFE45C" strokeWidth={7} strokeDasharray="20 16" strokeLinecap="round" />
          </svg>
        ) : null}
        {dotS > 0.001 ? (
          <svg style={{position: 'absolute', left: com[0] - 50, top: com[1] - 50, overflow: 'visible'}} width={100} height={100}>
            <g transform={`translate(50 50) scale(${dotS})`}>
              <circle r={34} fill="none" stroke={INK} strokeWidth={16} />
              <circle r={34} fill="none" stroke="#FFE45C" strokeWidth={8} />
              <path d="M-50,0 L50,0 M0,-50 L0,50" stroke={INK} strokeWidth={14} strokeLinecap="round" />
              <path d="M-50,0 L50,0 M0,-50 L0,50" stroke="#FFE45C" strokeWidth={6} strokeLinecap="round" />
            </g>
          </svg>
        ) : null}
        <XrayCard jx={joint[0]} jy={joint[1]} s={cardS} />
        <Padlock x={joint[0] + 2} y={joint[1] + 16} s={lockS * 0.8} closed={lockClosed} />
        <Padlock x={topJ[0] + 2} y={topJ[1] + 16} s={lock2S * 0.8} closed={lock2Closed} />
        <Monitor x={joint[0] + 150} y={joint[1] - 250} s={monS} t={t} t0={12.42} />
        <Puffs x={legX + 640} y={FLOOR} t={t} t0={landT} dir={1} spread={300} />
      </Layer>
    </>
  );
};

// SCENE 5 + 6: living flamingo in the lagoon sways, dozes off, sways less; researcher tries one leg
const LAGOON_BG = {cx: 700, cy: 202, w: 6000};

// distant flock (mid-ground layer), standing in the water
const FLK = (meta as any).flock;
const FLK_M = (meta as any)._flock;
const FLK_S = 600 / (FLK_M.feet_y - FLK_M.top);
const FLK_X = 1000;
const FLK_WATER = 1600;
const Flock: React.FC<{t: number}> = ({t}) => {
  const w = FLK.w * FLK_S;
  const h = FLK.h * FLK_S;
  const bob = Math.sin(t * 2 * Math.PI * 0.3) * 3;
  const top = FLK_WATER + 22 - FLK_M.feet_y * FLK_S + bob;
  return (
    <>
      <ClipBelow y={FLK_WATER}>
        <Img src={staticFile('flamingo/sprites/flock.png')} style={{position: 'absolute', left: FLK_X - w / 2, top, width: w, height: h}} />
      </ClipBelow>
      {[0.09, 0.29, 0.49, 0.69, 0.88].map((f, i) => (
        <Ripples key={i} x={FLK_X - w / 2 + f * w} y={FLK_WATER} t={t} w={30} seed={i * 0.37} />
      ))}
    </>
  );
};

const Scene5: React.FC<{t: number}> = ({t}) => {
  const legX = 540;
  const sciX0 = 1320;
  const c = camAt(
    [
      {t: T.cut3, x: 600, y: 1180, z: -380},
      {t: 17.9, x: 540, y: 1240, z: 120},
      {t: 19.95, x: 545, y: 1225, z: 195, e: (u) => u},
      {t: 21.0, x: 935, y: 1300, z: -270},
      {t: 23.7, x: 925, y: 1300, z: -245, e: (u) => u},
      {t: 24.6, x: 545, y: 1270, z: 250},
    ],
    t,
  );
  const cam = c;
  const asleep = t >= T.doze + 0.06;
  const sq = swapScale(t, T.doze + 0.06);
  const amp = asleep ? lerp(3.2, 0.35, eout(seg(t, T.doze + 0.06, T.doze + 0.9))) : 3.2;
  const sway = amp * Math.sin((t - T.cut3) * 2 * Math.PI * 0.62) + (asleep ? 0 : 0.6 * Math.sin(t * 2 * Math.PI * 1.7));
  const breathe = asleep ? 1 + 0.006 * Math.sin(t * 2 * Math.PI * 0.35) : 1 + 0.008 * Math.sin(t * 2 * Math.PI * 0.7);
  const [wx, wy] = flW(legX, LEG);
  const arcS = appear(t, T.sway - 0.1, 20.05);
  // researcher on one leg
  const sciTwo = t >= T.two3;
  const sciSq = swapScale(t, T.two3);
  const wobAmp = lerp(3, 7, seg(t, 21.0, T.two3));
  const sciRot = sciTwo
    ? spring(t, T.two3, 5, 6, 16)
    : wobAmp * Math.sin(t * 2 * Math.PI * 0.95) + 2.2 * Math.sin(t * 2 * Math.PI * 2.4 + 1);
  const sciBreathe = 1 + 0.009 * Math.sin(t * 2 * Math.PI * 0.6);
  const zHead = flW(legX, [380, 210]);
  const enter = eout(seg(t, 20.12, 20.9));
  const sciX = lerp(1850, sciX0, enter);
  const wade = Math.abs(Math.sin(enter * Math.PI * 3)) * 26 * (1 - enter);
  return (
    <>
      <Layer cam={cam} z={BG_Z} blur={1.8}>
        <Plate name="bg_lagoon" {...LAGOON_BG} />
      </Layer>
      <Layer cam={cam} z={2000} blur={1}>
        <Flock t={t} />
      </Layer>
      <Layer cam={cam} z={1000}>
        <Ripples x={legX + 4} y={WATER} t={t} w={46} />
        <ClipBelow y={WATER}>
          <Rig x={wx} y={wy} px={LEG[0]} py={LEG[1]} s={S_FL} rot={sway} sx={sq.sx} sy={sq.sy * breathe}>
            <Sprite name="fl_awake" show={!asleep} />
            <Sprite name="fl_sleep" show={asleep} />
          </Rig>
        </ClipBelow>
        <SwayArc cx={legX} cy={FLOOR} r={1090} deg={amp * 2.6 + 1.4} s={arcS} />
        <Zs x={zHead[0] - 20} y={zHead[1] - 40} t={t} t0={19.35} />
        {/* researcher */}
        <Ripples x={sciX + 8} y={WATER} t={t} w={70} seed={0.7} />
        <ClipBelow y={WATER}>
          <SciPose x={sciX} y={FLOOR - wade} pose={sciTwo ? 'sci' : 'sci_oneleg'} rot={sciRot} sx={sciSq.sx} sy={sciSq.sy * sciBreathe} />
        </ClipBelow>
        <SweatDrop x={sciX + 120} y={FLOOR - 640} t={t} t0={21.55} life={0.9} />
        <SweatDrop x={sciX - 100} y={FLOOR - 620} t={t} t0={22.55} life={0.9} />
        <SweatDrop x={sciX + 110} y={FLOOR - 650} t={t} t0={T.two3 + 0.1} life={1.0} />
        <Splash x={sciX + 70} y={WATER} t={t} t0={T.two3} />
      </Layer>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// sound: one cue list (file, start, dB). Impacts sit on their measured onsets.
const SFX: {f: string; at: number; db: number}[] = [
  {f: 'pop', at: T.oneLeg, db: -22},
  {f: 'pop', at: T.two1, db: -19},
  {f: 'whoosh', at: FALL1.start + 0.15, db: -25},
  {f: 'thud', at: FALL1.start + FALL1.dur - 0.02, db: -11},
  {f: 'whoosh', at: CRATE_DROP + 0.12, db: -26},
  {f: 'thud', at: CRATE_LAND - 0.02, db: -15},
  {f: 'pop', at: CRATE_LAND + 0.05, db: -24},
  {f: 'pop', at: 7.0, db: -24},
  {f: 'pop', at: T.twoB, db: -16},
  {f: 'pop', at: T.flam, db: -16},
  {f: 'thud', at: T.zoo - 0.02, db: -24},
  {f: 'whoosh', at: T.cut2 - 0.06, db: -30},
  {f: 'pop', at: T.foot, db: -23},
  {f: 'pop', at: T.body, db: -21},
  {f: 'whoosh', at: 10.82, db: -28},
  {f: 'pop', at: T.joints - 0.05, db: -20},
  {f: 'click', at: T.firm - 0.01, db: -13},
  {f: 'click', at: T.firm + 0.09, db: -16},
  {f: 'pop', at: 12.42, db: -21},
  {f: 'whoosh', at: 13.92, db: -29},
  {f: 'pop', at: T.two2, db: -18},
  {f: 'wobble', at: 14.5, db: -21},
  {f: 'whoosh', at: FALL2.start + 0.12, db: -25},
  {f: 'thud', at: FALL2.start + FALL2.dur - 0.02, db: -11},
  {f: 'whoosh', at: T.cut3 - 0.08, db: -31},
  {f: 'whoosh', at: T.cut3 + 0.15, db: -30},
  {f: 'snore', at: 19.32, db: -23},
  {f: 'whoosh', at: 20.12, db: -28},
  {f: 'wobble', at: 21.1, db: -26},
  {f: 'splash', at: T.two3 - 0.1, db: -13},
  {f: 'snore', at: 23.95, db: -25},
];

export const FlamingoShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < T.cut1) scene = <Scene1 t={t} />;
  else if (t < T.cut2) scene = <Scene2 t={t} />;
  else if (t < T.cut3) scene = <Scene3 t={t} />;
  else scene = <Scene5 t={t} />;
  return (
    <AbsoluteFill style={{background: '#BFE3D0'}}>
      {scene}
      <Sequence from={Math.round(VO * FPS)} layout="none">
        <Audio src={staticFile('flamingo/vo/take1.mp3')} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`flamingo/sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
