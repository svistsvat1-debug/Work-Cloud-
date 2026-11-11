// Larger parametric components: maps, clock, dugout, calendar, thermometer, tints, timeline, etc.
import React from 'react';
import { C, F } from './theme';
import { Ink, Scribble, Write, ell, rect, prog, useT, clamp, easeInOut, backOut, rnd } from './draw';
import MAPS from '../data/maps.json';

const M: any = MAPS;

export const mapPoint = (name: string, lon: number, lat: number, x: number, y: number, s: number) => {
  const [lon0, lat1, kx, ky] = M[name].proj;
  return [x + (lon - lon0) * kx * s, y + (lat1 - lat) * ky * s];
};

export const MapView: React.FC<{ name: string; x: number; y: number; s?: number; at: number; dur?: number; fills?: { codes: string[]; color: string; at: number }[]; stroke?: string; fade?: number }> = ({ name, x, y, s = 1, at, dur = 1.6, fills = [], stroke = C.ink, fade = 1 }) => {
  const t = useT();
  if (t < at) return null;
  const m = M[name];
  const codes = Object.keys(m.paths);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={fade}>
      {fills.map((f, i) => f.codes.filter((c) => m.paths[c]).map((c, j) => (
        <Scribble key={`${i}-${c}`} clip={m.paths[c]} at={f.at + j * 0.12} dur={0.9} color={f.color} gap={9} sw={13} seed={j + i * 7} tint={0.35} />
      )))}
      {codes.map((c, i) => <Ink key={c} d={m.paths[c]} at={at + (i / codes.length) * dur * 0.5} dur={dur * 0.6} w={3} color={stroke} />)}
    </g>
  );
};

export const Dot: React.FC<{ x: number; y: number; at: number; r?: number; color?: string }> = ({ x, y, at, r = 10, color = C.red }) => {
  const t = useT();
  const k = backOut(clamp((t - at) / 0.3));
  if (k <= 0) return null;
  return <circle cx={x} cy={y} r={r * k} fill={color} stroke={C.ink} strokeWidth={3} />;
};

// 24h clock: optional wedges
export const Clock: React.FC<{ x: number; y: number; r?: number; at: number; hour?: number; hourAt?: number; wedges?: { a0: number; a1: number; color: string; at: number }[] }> = ({ x, y, r = 120, at, hour = 12, hourAt, wedges = [] }) => {
  const t = useT();
  if (t < at) return null;
  const hk = hourAt != null ? prog(t, hourAt, 0.8) : 1;
  const h = 12 + (hour - 12) * hk;
  const ah = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
  const am = -Math.PI / 2;
  return (
    <g>
      {wedges.map((w, i) => {
        const k = prog(t, w.at, 0.8);
        if (k <= 0) return null;
        const a0 = (w.a0 - 90) * Math.PI / 180, a1 = (w.a0 + (w.a1 - w.a0) * k - 90) * Math.PI / 180;
        const steps = 24;
        let d = `M${x},${y}`;
        for (let s = 0; s <= steps; s++) { const a = a0 + (a1 - a0) * s / steps; d += ` L${x + Math.cos(a) * r * 0.94},${y + Math.sin(a) * r * 0.94}`; }
        d += ' Z';
        return <path key={i} d={d} fill={w.color} opacity={0.85} />;
      })}
      <Ink d={ell(x, y, r)} at={at} dur={0.8} w={6} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Ink key={i} d={`M${x + Math.cos(a) * r * 0.82},${y + Math.sin(a) * r * 0.82} L${x + Math.cos(a) * r * 0.92},${y + Math.sin(a) * r * 0.92}`} at={at + 0.4 + i * 0.02} dur={0.2} w={4} />;
      })}
      <Ink d={`M${x},${y} L${x + Math.cos(ah) * r * 0.5},${y + Math.sin(ah) * r * 0.5}`} at={at + 0.6} dur={0.3} w={8} />
      <Ink d={`M${x},${y} L${x + Math.cos(am) * r * 0.75},${y + Math.sin(am) * r * 0.75}`} at={at + 0.7} dur={0.3} w={5} />
    </g>
  );
};

// dugout cross-section (zemlyanka)
export const Dugout: React.FC<{ x: number; y: number; at: number; mudAt?: number }> = ({ x, y, at, mudAt }) => {
  const t = useT();
  if (t < at) return null;
  const ground = `M${x - 520},${y - 150} L${x + 520},${y - 150} L${x + 520},${y + 230} L${x - 520},${y + 230} Z`;
  const cavity = `M${x - 380},${y - 110} L${x + 380},${y - 110} L${x + 380},${y + 170} L${x - 380},${y + 170} Z`;
  const logs = Array.from({ length: 13 }).map((_, i) => ell(x - 360 + i * 60, y - 130, 30, 22));
  const floor = `M${x - 380},${y + 140} L${x + 380},${y + 140} L${x + 380},${y + 170} L${x - 380},${y + 170} Z`;
  return (
    <g>
      <Scribble clip={ground} at={at + 0.4} dur={1.0} color={C.earth} gap={16} sw={20} tint={0.4} />
      <path d={cavity} fill="#E9DFC8" opacity={prog(t, at + 0.9, 0.4)} />
      <Ink d={ground} at={at} dur={1.0} w={5} />
      <Ink d={cavity} at={at + 0.3} dur={1.0} w={5} />
      <Ink d={`M${x - 600},${y - 200} C${x - 300},${y - 215} ${x + 300},${y - 190} ${x + 600},${y - 205}`} at={at} dur={0.8} w={5} />
      {logs.map((d, i) => <g key={i}><Scribble clip={d} at={at + 0.8 + i * 0.05} dur={0.4} color={C.wood} seed={i} /><Ink d={d} at={at + 0.6 + i * 0.05} dur={0.4} w={4} /></g>)}
      {/* plank bed */}
      <Ink d={`M${x - 340},${y + 60} L${x + 40},${y + 60}`} at={at + 1.0} dur={0.5} w={10} color={C.brown} />
      <Ink d={`M${x - 320},${y + 60} L${x - 320},${y + 140} M${x + 20},${y + 60} L${x + 20},${y + 140}`} at={at + 1.2} dur={0.4} w={6} color={C.brown} />
      {mudAt != null && <Scribble clip={floor} at={mudAt} dur={0.8} color="#6B4A2B" gap={10} sw={14} tint={0.6} />}
    </g>
  );
};

export const Calendar: React.FC<{ x: number; y: number; at: number; pages: { text: string; at: number }[]; w?: number; size?: number }> = ({ x, y, at, pages, w = 260, size = 64 }) => {
  const t = useT();
  if (t < at) return null;
  const h = w * 0.9;
  let cur = pages[0];
  for (const p of pages) if (t >= p.at) cur = p;
  const flip = clamp((t - cur.at) / 0.25);
  const body = rect(x - w / 2, y - h / 2, w, h);
  const top = rect(x - w / 2, y - h / 2, w, h * 0.24);
  return (
    <g>
      <Scribble clip={body} at={at + 0.4} dur={0.4} color="#FFFDF5" tint={1} />
      <Scribble clip={top} at={at + 0.5} dur={0.4} color={C.red} />
      <Ink d={body} at={at} dur={0.6} w={5} />
      <Ink d={`M${x - w / 2},${y - h / 2 + h * 0.24} L${x + w / 2},${y - h / 2 + h * 0.24}`} at={at + 0.3} dur={0.3} w={5} />
      <Ink d={`M${x - w * 0.25},${y - h / 2 - 16} L${x - w * 0.25},${y - h / 2 + 18} M${x + w * 0.25},${y - h / 2 - 16} L${x + w * 0.25},${y - h / 2 + 18}`} at={at + 0.4} dur={0.3} w={7} />
      <g opacity={t >= at + 0.6 ? 0.3 + 0.7 * flip : 0} transform={`translate(0,${(1 - flip) * -10})`}>
        <text x={x} y={y + h * 0.2} textAnchor="middle" fontFamily={F.pm} fontSize={size} fill={C.ink}>{cur.text}</text>
      </g>
    </g>
  );
};

export const Thermometer: React.FC<{ x: number; y: number; at: number; dropAt: number; s?: number }> = ({ x, y, at, dropAt, s = 1 }) => {
  const t = useT();
  if (t < at) return null;
  const tube = `M${x - 18 * s},${y - 200 * s} C${x - 18 * s},${y - 230 * s} ${x + 18 * s},${y - 230 * s} ${x + 18 * s},${y - 200 * s} L${x + 18 * s},${y + 60 * s} L${x - 18 * s},${y + 60 * s} Z`;
  const bulb = ell(x, y + 90 * s, 40 * s);
  const level = 1 - 0.8 * prog(t, dropAt, 1.6);
  const top = y + 60 * s - level * 250 * s;
  return (
    <g>
      <path d={tube} fill="#fff" opacity={prog(t, at + 0.3, 0.3)} />
      <rect x={x - 9 * s} y={top} width={18 * s} height={y + 70 * s - top} fill={C.red} opacity={prog(t, at + 0.5, 0.3)} />
      <Scribble clip={bulb} at={at + 0.5} dur={0.4} color={C.red} tint={0.9} />
      <Ink d={tube} at={at} dur={0.7} w={5} />
      <Ink d={bulb} at={at + 0.2} dur={0.5} w={5} />
      {[0, 1, 2, 3, 4].map((i) => <Ink key={i} d={`M${x + 18 * s},${y - 160 * s + i * 50 * s} L${x + 34 * s},${y - 160 * s + i * 50 * s}`} at={at + 0.5 + i * 0.05} dur={0.2} w={4} />)}
      <Write text="0°" x={x + 44 * s} y={y - 30 * s} size={40} font="cb" at={at + 0.8} color={C.blue} />
    </g>
  );
};

// full-board colour wash (night, frost) – keyed list of [time, level]
export const Tint: React.FC<{ keys: [number, number][]; color?: string; max?: number }> = ({ keys, color = C.night, max = 0.32 }) => {
  const t = useT();
  let v = 0;
  for (let i = 0; i < keys.length; i++) {
    const [tt, lv] = keys[i];
    if (t >= tt) {
      const prev = i > 0 ? keys[i - 1][1] : 0;
      v = prev + (lv - prev) * easeInOut(clamp((t - tt) / 1.2));
    }
  }
  if (v <= 0.001) return null;
  return <rect x={-200} y={-200} width={2320} height={1480} fill={color} opacity={v * max} style={{ mixBlendMode: 'multiply' }} />;
};

export const Frost: React.FC<{ at: number; until?: number }> = ({ at, until }) => {
  const t = useT();
  const k0 = until != null ? 1 - prog(t, until, 1.0) : 1;
  if (t < at || k0 <= 0) return null;
  const flakes: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const side = i % 4;
    const p = rnd(i + 1) * (side < 2 ? 1920 : 1080);
    const depth = 30 + rnd(i + 9) * 120;
    const x = side === 0 || side === 1 ? p : side === 2 ? depth : 1920 - depth;
    const y = side === 0 ? depth : side === 1 ? 1080 - depth : p;
    const r = 10 + rnd(i + 21) * 16;
    const k = prog(t, at + rnd(i + 33) * 1.2, 0.4);
    if (k <= 0) continue;
    const d = [0, 60, 120].map((a) => { const ra = (a * Math.PI) / 180; return `M${x - Math.cos(ra) * r * k},${y - Math.sin(ra) * r * k} L${x + Math.cos(ra) * r * k},${y + Math.sin(ra) * r * k}`; }).join(' ');
    flakes.push(<path key={i} d={d} stroke="#5E9BD8" strokeWidth={5} strokeLinecap="round" />);
  }
  return <g opacity={0.85 * k0}>{flakes}</g>;
};

export const Smoke: React.FC<{ x: number; y: number; at: number; color?: string; h?: number }> = ({ x, y, at, color = C.grey, h = 180 }) => {
  const t = useT();
  if (t < at) return null;
  const sway = Math.sin(t * 2) * 10;
  const d1 = `M${x},${y} C${x - 30 + sway},${y - h * 0.3} ${x + 30 - sway},${y - h * 0.6} ${x + sway},${y - h}`;
  const d2 = `M${x + 18},${y - 10} C${x - 10 - sway},${y - h * 0.35} ${x + 50 + sway},${y - h * 0.65} ${x + 30 + sway},${y - h * 0.95}`;
  return <g><Ink d={d1} at={at} dur={1.2} color={color} w={9} /><Ink d={d2} at={at + 0.3} dur={1.2} color={color} w={7} /></g>;
};

// moves its children along a path (absolute) between t0..t1
export const Mover: React.FC<{ at: number; t0: number; t1: number; pts: [number, number][]; children: React.ReactNode }> = ({ at, t0, t1, pts, children }) => {
  const t = useT();
  if (t < at) return null;
  const k = easeInOut(clamp((t - t0) / Math.max(t1 - t0, 0.01)));
  const n = pts.length - 1;
  const seg = Math.min(n - 1, Math.floor(k * n));
  const lk = k * n - seg;
  const x = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * lk;
  const y = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * lk;
  return <g transform={`translate(${x},${y})`}>{children}</g>;
};

export const Bubble: React.FC<{ x: number; y: number; w: number; h: number; at: number; until?: number; tx: number; ty: number; children?: React.ReactNode }> = ({ x, y, w, h, at, until, tx, ty, children }) => {
  const t = useT();
  if (t < at) return null;
  const k = backOut(clamp((t - at) / 0.4));
  const out = until != null ? 1 - clamp((t - until) / 0.3) : 1;
  if (out <= 0) return null;
  const cloud = ell(x, y, w / 2, h / 2);
  return (
    <g opacity={out} transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>
      <path d={cloud} fill="#fff" />
      <Ink d={cloud} at={at} dur={0.4} w={5} />
      {[0, 1, 2].map((i) => {
        const cx = tx + (x - tx) * (0.15 + i * 0.22), cy = ty + (y + h / 2 - ty) * (0.15 + i * 0.22);
        return <Ink key={i} d={ell(cx, cy, 8 + i * 5)} at={at + 0.1 * i} dur={0.2} w={4} />;
      })}
      {children}
    </g>
  );
};

export const Trench: React.FC<{ at: number; pts: [number, number][]; w?: number }> = ({ at, pts, w = 70 }) => {
  const d = 'M' + pts.map((p) => p.join(',')).join(' L');
  return (
    <g>
      <Ink d={d} at={at} dur={1.0} w={w} color="#B58A5E" ns={false} />
      <Ink d={d} at={at + 0.2} dur={1.0} w={w - 22} color="#E2CFAE" ns={false} />
    </g>
  );
};

// a black censor bar that sweeps across
export const Bar: React.FC<{ x: number; y: number; w: number; h?: number; at: number; color?: string }> = ({ x, y, w, h = 22, at, color = C.ink }) => {
  const t = useT();
  const k = prog(t, at, 0.4);
  if (k <= 0) return null;
  return <rect x={x} y={y - h / 2} width={w * k} height={h} rx={6} fill={color} />;
};

export const Box: React.FC<{ x: number; y: number; w: number; h: number; at: number; color?: string; fill?: string }> = ({ x, y, w, h, at, color = C.ink, fill }) => {
  const d = rect(x, y, w, h);
  return <g>{fill && <Scribble clip={d} at={at + 0.3} dur={0.4} color={fill} />}<Ink d={d} at={at} dur={0.5} color={color} w={5} /></g>;
};

export const Pie: React.FC<{ x: number; y: number; r: number; at: number; slices: { frac: number; color: string; at: number }[] }> = ({ x, y, r, at, slices }) => {
  let a = 0;
  return (
    <g>
      {slices.map((s, i) => {
        const a0 = a, a1 = a + s.frac * 360; a = a1;
        return <Slice key={i} x={x} y={y} r={r} a0={a0} a1={a1} color={s.color} at={s.at} />;
      })}
      <Ink d={ell(x, y, r)} at={at} dur={0.8} w={6} />
    </g>
  );
};
const Slice: React.FC<{ x: number; y: number; r: number; a0: number; a1: number; color: string; at: number }> = ({ x, y, r, a0, a1, color, at }) => {
  const t = useT();
  const k = prog(t, at, 0.9);
  if (k <= 0) return null;
  const e = a0 + (a1 - a0) * k;
  let d = `M${x},${y}`;
  for (let s = 0; s <= 40; s++) { const a = ((a0 + (e - a0) * s / 40) - 90) * Math.PI / 180; d += ` L${x + Math.cos(a) * r},${y + Math.sin(a) * r}`; }
  d += ' Z';
  return <g><Scribble clip={d} at={at} dur={0.5} color={color} gap={12} sw={16} tint={0.5} /><Ink d={d} at={at} dur={0.6} w={4} /></g>;
};
