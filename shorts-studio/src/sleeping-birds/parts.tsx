import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/fredoka/700.css';
import {add, clamp, ei, eo, mul, popScale, prog, pts, rad, rnd, rotp, smoothPath, sub, V2} from './anim';
import {BF, BO, BT, Cam, DIR, NRM, SP, TH, W_R, branchW, swayW} from './world';

export const INK = '#16141a';
export const FONT = 'Fredoka, sans-serif';
export const f = (p: string) => staticFile(`sleeping-birds/${p}`);

// ------------------------------------------------------------------ 2.5D layer
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 300) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + cam.sx}px, ${960 + cam.sy}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// a prepared sprite placed in its raw coordinate system (chain maps raw -> world)
type Meta = {w: number; h: number; y0: number; S: number};
export const RawImg: React.FC<{src: string; meta: Meta; chain: string; style?: React.CSSProperties}> = ({src, meta, chain, style}) => (
  <Img
    src={f(src)}
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: meta.w,
      height: meta.h,
      transformOrigin: '0 0',
      transform: `${chain} translate(0px, ${meta.y0 / meta.S}px) scale(${1 / meta.S})`,
      ...style,
    }}
  />
);

// an SVG canvas in raw (or world) units placed with a CSS chain
export const RawSvg: React.FC<{chain: string; children: React.ReactNode; w?: number; h?: number}> = ({chain, children, w = 768, h = 1376}) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transformOrigin: '0 0', transform: chain}}
  >
    {children}
  </svg>
);

// ------------------------------------------------------------------ branch (same geometry as the repainted sprite twigs)
const TOP = '#a97c5b';
const BOT = '#8a6349';
const S0 = -3400;
const S_TAPER = 1730;
const S_TIP = 2010;
function tipT(s: number) {
  return s < S_TAPER ? BT : BT * (1 - 0.48 * ((s - S_TAPER) / (S_TIP - S_TAPER)));
}
function bandPath(a: number, b: number, half: (s: number) => number, cap: boolean) {
  const top: V2[] = [];
  const bot: V2[] = [];
  const n = 14;
  top.push([a, -half(a)]);
  bot.push([a, half(a)]);
  for (let i = 0; i <= n; i++) {
    const s = S_TAPER + ((b - S_TAPER) * i) / n;
    if (s <= a) continue;
    top.push([s, -half(s)]);
    bot.push([s, half(s)]);
  }
  const r = half(b);
  const capPts: V2[] = [];
  if (cap) for (let i = 1; i < 12; i++) capPts.push([b + r * Math.sin((Math.PI * i) / 12), -r * Math.cos((Math.PI * i) / 12)]);
  return 'M' + pts([...top, ...capPts, ...bot.reverse()]).replace(/ /g, ' L') + ' Z';
}
// offshoot twig (local frame of the main branch)
const OFF = {s: 1880, ang: -48, L: 240, t0: 0.55, t1: 0.3};
function offPath(scale: number) {
  const half = (u: number) => (BT * (OFF.t0 + (OFF.t1 - OFF.t0) * u) * scale) / 2;
  const top: V2[] = [];
  const bot: V2[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    top.push([u * OFF.L, -half(u)]);
    bot.push([u * OFF.L, half(u)]);
  }
  const r = half(1);
  const capPts: V2[] = [];
  for (let i = 1; i < 10; i++) capPts.push([OFF.L + r * Math.sin((Math.PI * i) / 10), -r * Math.cos((Math.PI * i) / 10)]);
  return 'M' + pts([[-30, -half(0)], ...top, ...capPts, ...bot.reverse(), [-30, half(0)]]).replace(/ /g, ' L') + ' Z';
}
export const offTip = (): V2 => branchW(OFF.s + Math.cos(rad(OFF.ang)) * OFF.L, -BT * 0.25 + Math.sin(rad(OFF.ang)) * OFF.L);

export const Branch: React.FC<{mode: 'normal' | 'xray'; id: string}> = ({mode, id}) => {
  const outer = bandPath(S0, S_TIP, (s) => tipT(s) / 2, true);
  const fillHalf = (s: number) => tipT(s) / 2 - BO * (0.75 + (0.25 * tipT(s)) / BT);
  const fill = bandPath(S0, S_TIP, fillHalf, true);
  const offO = offPath(1);
  const offF = offPath(0.62);
  const split = -BF / 2 + 0.58 * BF;
  const offTr = `translate(${OFF.s} ${-BT * 0.25}) rotate(${OFF.ang})`;
  if (mode === 'xray') {
    return (
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(${W_R[0]} ${W_R[1]}) rotate(${TH})`}>
          <g transform={offTr}>
            <path d={offO} fill="rgba(120,190,240,0.12)" stroke="#9fe3ff" strokeWidth={3.5} strokeOpacity={0.75} />
          </g>
          <path d={outer} fill="rgba(110,180,235,0.16)" stroke="#7fd0ff" strokeWidth={12} strokeOpacity={0.18} />
          <path d={outer} fill="none" stroke="#bdeeff" strokeWidth={4} strokeOpacity={0.85} />
          <line x1={S0} x2={S_TAPER} y1={split} y2={split} stroke="#9fe3ff" strokeWidth={2} strokeOpacity={0.25} />
        </g>
      </svg>
    );
  }
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}-f`}>
          <path d={fill} />
        </clipPath>
        <clipPath id={`${id}-of`}>
          <path d={offF} />
        </clipPath>
      </defs>
      <g transform={`translate(${W_R[0]} ${W_R[1]}) rotate(${TH})`}>
        <g transform={offTr}>
          <path d={offO} fill={INK} />
          <g clipPath={`url(#${id}-of)`}>
            <rect x={-40} y={-60} width={OFF.L + 80} height={62} fill={TOP} />
            <rect x={-40} y={2} width={OFF.L + 80} height={60} fill={BOT} />
          </g>
        </g>
        <path d={outer} fill={INK} />
        <g clipPath={`url(#${id}-f)`}>
          <rect x={S0 - 10} y={-BT} width={S_TIP - S0 + 100} height={BT + split} fill={TOP} />
          <rect x={S0 - 10} y={split} width={S_TIP - S0 + 100} height={BT} fill={BOT} />
        </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ leaves
type LeafDef = {s: number; side: -1 | 1; off: number; idx: number; L: number; fly?: number; bonk?: boolean; vx?: number; vy?: number; spin?: number};
export const LEAVES: LeafDef[] = [
  {s: -400, side: -1, off: -24, idx: 0, L: 165, fly: 1.95, vx: 560, vy: -520, spin: 380},
  {s: -270, side: 1, off: 28, idx: 2, L: 150, fly: 2.3, bonk: true},
  {s: 370, side: -1, off: 18, idx: 4, L: 150, fly: 2.6, vx: 640, vy: -300, spin: -460},
  {s: 860, side: -1, off: -16, idx: 1, L: 170},
  {s: 1090, side: 1, off: 22, idx: 3, L: 160},
  {s: 1760, side: 1, off: 26, idx: 2, L: 150},
  {s: 1990, side: -1, off: 62, idx: 0, L: 165},
];
const leafAttach = (l: LeafDef): {p: V2; ang: number} => {
  const p = branchW(l.s, l.side * (BT / 2 - 5));
  const u = rotp(mul(NRM, l.side), [0, 0], l.off);
  return {p, ang: (Math.atan2(u[0], -u[1]) * 180) / Math.PI};
};
const leafImgStyle = (idx: number, L: number, p: V2, ang: number, center: boolean): React.CSSProperties => {
  const m = SP.leaves[idx];
  const sc = L / m.h;
  const ax = center ? m.w / 2 : m.stem[0];
  const ay = center ? m.h / 2 : m.stem[1];
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    width: m.w,
    height: m.h,
    transformOrigin: '0 0',
    transform: `translate(${p[0]}px, ${p[1]}px) rotate(${ang}deg) scale(${sc}) translate(${-ax}px, ${-ay}px)`,
  };
};
const XRAY_LEAF: React.CSSProperties = {filter: 'brightness(0) invert(1)', opacity: 0.28};

export const LEAF_BACK = 24.7;
// leaves still on the branch (inside the sway group)
export const AttachedLeaves: React.FC<{t: number; xray?: boolean}> = ({t, xray}) => (
  <>
    {LEAVES.map((l, i) => {
      if (l.fly !== undefined && t >= l.fly && t < LEAF_BACK) return null; // blown away; back on the branch off-screen for the loop
      const {p, ang} = leafAttach(l);
      const flutter = l.fly !== undefined && t > l.fly - 0.5 ? 9 * Math.sin((t - l.fly) * 40) * prog(t, l.fly - 0.5, l.fly) : 0;
      const w = 2.5 * Math.sin(t * 2.1 + i);
      return <Img key={i} src={f(`leaf_${l.idx}.png`)} style={{...leafImgStyle(l.idx, l.L, p, ang + w + flutter, false), ...(xray ? XRAY_LEAF : {})}} />;
    })}
  </>
);

export const BONK_HEAD: V2 = [520, 300]; // robin raw point the leaf hits
// flying leaves (world, outside the sway group)
export function flyingLeafState(l: LeafDef, t: number, hit: V2): {p: V2; ang: number} | null {
  if (l.fly === undefined || t < l.fly || t >= LEAF_BACK) return null;
  const {p: p0r, ang: a0} = leafAttach(l);
  const p0 = swayW(p0r, l.fly);
  const tau = t - l.fly;
  if (l.bonk) {
    const tb = 3.02 - l.fly;
    if (tau <= tb) {
      const u = tau / tb;
      const c: V2 = [p0[0] + 40, p0[1] - 620];
      const q = add(add(mul(p0, (1 - u) * (1 - u)), mul(c, 2 * u * (1 - u))), mul(hit, u * u));
      return {p: q, ang: a0 + 300 * u};
    }
    const tt = tau - tb;
    return {p: [hit[0] + 380 * tt, hit[1] - 950 * tt + 0.5 * 1500 * tt * tt], ang: a0 + 300 + 820 * tt};
  }
  return {p: [p0[0] + (l.vx ?? 500) * tau + 90 * tau * tau, p0[1] + (l.vy ?? -300) * tau + 0.5 * 380 * tau * tau], ang: a0 + (l.spin ?? 300) * tau};
}
export const FlyingLeaves: React.FC<{t: number; hit: V2}> = ({t, hit}) => (
  <>
    {LEAVES.map((l, i) => {
      const st = flyingLeafState(l, t, hit);
      if (!st || st.p[0] > 3400 || st.p[1] < -1500) return null;
      return <Img key={i} src={f(`leaf_${l.idx}.png`)} style={leafImgStyle(l.idx, l.L, st.p, st.ang, true)} />;
    })}
  </>
);

// ------------------------------------------------------------------ bonk star
export const BonkStar: React.FC<{t: number; t0: number; p: V2}> = ({t, t0, p}) => {
  const s = popScale(t, t0, t0 + 0.28, 1.6, 0.18);
  if (s <= 0) return null;
  const rays = [0, 72, 144, 216, 288].map((a) => {
    const d0 = 46;
    const d1 = 92;
    const u: V2 = [Math.cos(rad(a - 90)), Math.sin(rad(a - 90))];
    return [add(p, mul(u, d0 * s)), add(p, mul(u, d1 * s))] as [V2, V2];
  });
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {rays.map(([a, b], i) => (
        <line key={`o${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={17} strokeLinecap="round" />
      ))}
      {rays.map(([a, b], i) => (
        <line key={`i${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#ffe066" strokeWidth={8} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// ------------------------------------------------------------------ Zzz
export const Zzz: React.FC<{t: number; origin: V2; windows: [number, number][]; period: number; seed: number; size?: number}> = ({
  t,
  origin,
  windows,
  period,
  seed,
  size = 50,
}) => {
  const life = 2.3;
  const items: React.ReactNode[] = [];
  for (const [w0, w1] of windows) {
    const i0 = Math.ceil((w0 - life) / period);
    const i1 = Math.floor(w1 / period);
    for (let i = i0; i <= i1; i++) {
      const ts = i * period;
      if (ts < w0 - life || ts > w1) continue;
      const tau = t - ts;
      if (tau < 0 || tau > life) continue;
      if (ts < w0 && t < w0) continue;
      const fade = (t > w1 ? 1 - prog(t, w1, w1 + 0.25) : 1) * (1 - ei(prog(tau, life - 0.45, life)));
      const sc = clamp(eo(prog(tau, 0, 0.35)) * 1.0) * fade;
      if (sc <= 0.01) continue;
      const big = (i + seed) % 2 === 0;
      const x = origin[0] + 55 * tau + 22 * Math.sin(tau * 2.6 + i);
      const y = origin[1] - 150 * tau;
      items.push(
        <text
          key={`${i}`}
          x={0}
          y={0}
          transform={`translate(${x} ${y}) rotate(${-12 + 10 * Math.sin(tau * 2 + i)}) scale(${sc})`}
          fontFamily={FONT}
          fontWeight={700}
          fontSize={big ? size * 1.15 : size * 0.85}
          fill="#ffffff"
          stroke={INK}
          strokeWidth={9}
          strokeLinejoin="round"
          paintOrder="stroke"
          textAnchor="middle"
        >
          {big ? 'Z' : 'z'}
        </text>,
      );
    }
  }
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {items}
    </svg>
  );
};

// ------------------------------------------------------------------ wind lines
const WIND: {t0: number; p: V2[]}[] = [
  {t0: 1.55, p: [[-120, 980], [140, 940], [360, 990], [600, 945], [820, 985], [1060, 940]]},
  {t0: 1.9, p: [[-80, 1500], [180, 1460], [420, 1510], [680, 1465], [940, 1500], [1180, 1455]]},
  {t0: 2.35, p: [[-150, 720], [100, 690], [330, 735], [560, 700], [800, 735], [1050, 700]]},
  {t0: 2.8, p: [[-100, 1230], [160, 1200], [400, 1245], [640, 1205], [880, 1240], [1150, 1210]]},
];
export const WindLines: React.FC<{t: number}> = ({t}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {WIND.map((w, i) => {
      const u = prog(t, w.t0, w.t0 + 1.0) * 1.4;
      if (u <= 0 || u >= 1.4) return null;
      const head = Math.min(1, u);
      const tail = Math.max(0, u - 0.4);
      const d = smoothPath(w.p);
      return (
        <path
          key={i}
          d={d}
          pathLength={1}
          fill="none"
          stroke="#e8f4ff"
          strokeOpacity={0.85}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${(head - tail).toFixed(4)} 3`}
          strokeDashoffset={(-tail).toFixed(4)}
        />
      );
    })}
  </svg>
);

// ------------------------------------------------------------------ sky, stars, moon, hills
export const Sky: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #0a1736 0%, #13285a 55%, #1d3a70 100%)'}} />
);
const STARS = Array.from({length: 54}, (_, i) => ({x: rnd(i) * 1080, y: rnd(i + 100) * 1500, s: 2 + rnd(i + 200) * 6, ph: rnd(i + 300) * 6.28}));
export const Stars: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill>
    <svg width={1080} height={1920}>
      {STARS.map((s, i) => {
        const o = 0.55 + 0.45 * Math.sin(t * 2.2 + s.ph);
        if (s.s > 5.6) {
          const r = s.s * 1.7 * (0.85 + 0.15 * o);
          const d = `M${s.x},${s.y - r} Q${s.x},${s.y} ${s.x + r},${s.y} Q${s.x},${s.y} ${s.x},${s.y + r} Q${s.x},${s.y} ${s.x - r},${s.y} Q${s.x},${s.y} ${s.x},${s.y - r} Z`;
          return <path key={i} d={d} fill="#fff6d8" opacity={0.6 + 0.4 * o} />;
        }
        return <circle key={i} cx={s.x} cy={s.y} r={s.s / 2.4} fill="#e6eeff" opacity={0.35 + 0.5 * o} />;
      })}
    </svg>
  </AbsoluteFill>
);

export const MOON_C: V2 = [-1560, -1440];
export const Moon: React.FC<{t: number}> = ({t}) => {
  const R = 480;
  const [cx, cy] = MOON_C;
  const open = t > 2.82 && t < 3.72 ? Math.min(eo(prog(t, 2.82, 2.98)), 1 - prog(t, 3.56, 3.72)) : 0;
  const eye = (x: number, peek: boolean) => {
    if (peek && open > 0.05) {
      return (
        <g transform={`translate(${x} -40)`}>
          <ellipse rx={78} ry={88 * open} fill="#ffffff" stroke={INK} strokeWidth={30} />
          <ellipse cx={22} cy={22 * open} rx={34} ry={38 * open} fill={INK} />
        </g>
      );
    }
    return <path d={`M${x - 70},-50 Q${x},20 ${x + 70},-50`} fill="none" stroke={INK} strokeWidth={32} strokeLinecap="round" />;
  };
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <circle cx={cx} cy={cy} r={R * 1.9} fill="#fff1c0" opacity={0.05} />
      <circle cx={cx} cy={cy} r={R * 1.4} fill="#fff1c0" opacity={0.07} />
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={R} fill="#ffe7a3" stroke={INK} strokeWidth={46} />
        <path d={`M${R * 0.2},${-R * 0.93} A${R} ${R} 0 0 1 ${R * 0.2},${R * 0.93} A${R * 0.8} ${R * 0.98} 0 0 0 ${R * 0.2},${-R * 0.93} Z`} fill="#f2cf74" />
        <circle cx={-230} cy={-250} r={50} fill="#f2cf74" />
        <circle cx={250} cy={210} r={36} fill="#f2cf74" />
        <ellipse cx={-235} cy={90} rx={62} ry={38} fill="#ff9f9f" opacity={0.45} />
        <ellipse cx={235} cy={90} rx={62} ry={38} fill="#ff9f9f" opacity={0.45} />
        {eye(-150, true)}
        {eye(150, false)}
        <path d="M-70,120 Q0,175 70,120" fill="none" stroke={INK} strokeWidth={28} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const hillPath = (x0: number, x1: number, step: number, yf: (x: number) => number, bottom: number) => {
  const p: V2[] = [];
  for (let x = x0; x <= x1; x += step) p.push([x, yf(x)]);
  return `M${x0},${bottom} L` + pts(p).replace(/ /g, ' L') + ` L${x1},${bottom} Z`;
};
export const FarHills: React.FC = () => (
  <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <path d={hillPath(-14000, 18000, 200, (x) => 3560 + 130 * Math.sin(x / 1500 + 0.5) + 70 * Math.sin(x / 620 + 2), 12000)} fill="#223f6e" stroke={INK} strokeWidth={30} />
  </svg>
);
const TREES = [-1300, -200, 900, 2100, 3300, 4600, 5900];
export const NearHills: React.FC = () => {
  const yf = (x: number) => 2990 + 90 * Math.sin(x / 900) + 50 * Math.sin(x / 400 + 1.3);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {TREES.map((x, i) => {
        const y = yf(x) + 30;
        const r = 120 + 50 * rnd(i + 40);
        const c: [number, number, number][] = [
          [x, y - 260 - r * 0.2, r],
          [x - r * 0.7, y - 190, r * 0.72],
          [x + r * 0.7, y - 200, r * 0.75],
        ];
        return (
          <g key={i}>
            <rect x={x - 22} y={y - 200} width={44} height={230} fill="#10203f" stroke={INK} strokeWidth={20} />
            {c.map(([cx, cy, rr], j) => (
              <circle key={`o${j}`} cx={cx} cy={cy} r={rr + 10} fill={INK} />
            ))}
            {c.map(([cx, cy, rr], j) => (
              <circle key={`f${j}`} cx={cx} cy={cy} r={rr - 10} fill="#183262" />
            ))}
          </g>
        );
      })}
      <path d={hillPath(-9000, 13000, 100, yf, 9000)} fill="#172c55" stroke={INK} strokeWidth={22} />
    </svg>
  );
};

// ------------------------------------------------------------------ captions (screen space)
export const Caption: React.FC<{lines: string[]; y: number; size: number; s: number; rot?: number}> = ({lines, y, size, s, rot = 0}) => {
  if (s <= 0.001) return null;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <g transform={`translate(540 ${y}) rotate(${rot}) scale(${s})`}>
          {lines.map((l, i) => (
            <text
              key={i}
              x={0}
              y={i * size * 1.08}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={700}
              fontSize={size}
              fill="#ffffff"
              stroke={INK}
              strokeWidth={size * 0.2}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {l}
            </text>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export const _dir = DIR;
export const _sub = sub;
