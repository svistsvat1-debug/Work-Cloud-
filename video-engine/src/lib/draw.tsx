// Marker-whiteboard drawing primitives. Every element "draws on" from its `at` time (seconds).
import React, { useId } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C, F } from './theme';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const prog = (t: number, at: number, dur: number) => easeOut(clamp((t - at) / Math.max(dur, 1e-3)));
export const backOut = (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c1 = 1.9, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

// deterministic pseudo random
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// static hand-drawn jitter: nudges every coordinate pair a little (deterministic, cached)
const JC = new Map<string, string>();
export const jit = (d: string, a = 1.3) => {
  const key = a + d;
  const hit = JC.get(key);
  if (hit) return hit;
  let i = 0;
  const out = d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_m, x, y) => {
    i++;
    const dx = (rnd(i * 13.7 + d.length) - 0.5) * 2 * a, dy = (rnd(i * 7.3 + d.length * 0.5) - 0.5) * 2 * a;
    return `${(+x + dx).toFixed(1)},${(+y + dy).toFixed(1)}`;
  });
  JC.set(key, out);
  return out;
};

// bounding box of an absolute path made only of number pairs (M L C Q Z)
export const bbox = (d: string) => {
  const n = (d.match(/-?\d*\.?\d+/g) || []).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  return [x0, y0, x1 - x0, y1 - y0];
};

// circle / ellipse as cubic beziers (keeps paths "pairs only")
export const ell = (cx: number, cy: number, rx: number, ry = rx) => {
  const k = 0.5523;
  return `M${cx - rx},${cy} C${cx - rx},${cy - ry * k} ${cx - rx * k},${cy - ry} ${cx},${cy - ry} C${cx + rx * k},${cy - ry} ${cx + rx},${cy - ry * k} ${cx + rx},${cy} C${cx + rx},${cy + ry * k} ${cx + rx * k},${cy + ry} ${cx},${cy + ry} C${cx - rx * k},${cy + ry} ${cx - rx},${cy + ry * k} ${cx - rx},${cy} Z`;
};
export const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;

// ---------- ink stroke that draws on ----------
export const Ink: React.FC<{ d: string; at: number; dur?: number; color?: string; w?: number; ns?: boolean; dash?: string; opacity?: number }> = ({ d, at, dur = 0.8, color = C.ink, w = 6, ns = true, dash, opacity = 1 }) => {
  const t = useT();
  const k = prog(t, at, dur);
  if (k <= 0) return null;
  if (dash) {
    // dashed lines reveal with a mask-like clip of the dash pattern: draw as solid dashes with growing length
    return <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={opacity * (k < 1 ? 0.4 + 0.6 * k : 1)} vectorEffect={ns ? 'non-scaling-stroke' : undefined} pathLength={undefined} style={{ clipPath: undefined }} />;
  }
  return (
    <path d={d} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - k} stroke={color} strokeWidth={w} fill="none"
      strokeLinecap="round" strokeLinejoin="round" vectorEffect={ns ? 'non-scaling-stroke' : undefined} opacity={opacity} />
  );
};

// ---------- dense marker colouring (Golpo-like): a solid, saturated fill that is "painted in" with
// thick marker strokes, plus darker/lighter streaks and a few white highlights for the marker texture ----------
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mix = (c: string, m: string, k: number) => {
  if (!c.startsWith('#') || c.length < 7) return c;
  const a = hex(c), b = hex(m);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const zigzag = (x: number, y: number, w: number, h: number, g: number, s: number, seed: number, slant: number) => {
  const pts: string[] = [];
  const n = Math.ceil((w + h * Math.abs(slant)) / g) + 3;
  const x0 = x - (slant > 0 ? h * slant : 0) - g;
  for (let i = 0; i <= n; i++) {
    const jx = (rnd(seed * 31 + i) - 0.5) * g * 0.45;
    const xx = x0 + i * g + jx;
    pts.push(i % 2 === 0 ? `${xx.toFixed(1)},${(y + h + s).toFixed(1)}` : `${(xx + h * slant).toFixed(1)},${(y - s).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
};
export const Scribble: React.FC<{ clip: string; at: number; dur?: number; color: string; gap?: number; sw?: number; seed?: number; tint?: number; flat?: boolean }> = ({ clip, at, dur = 0.8, color, gap, seed = 1, flat }) => {
  const t = useT();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const k = prog(t, at, dur);
  if (k <= 0) return null;
  const [x, y, w, h] = bbox(clip);
  const g = gap ?? Math.max(4, Math.min(w, h) / 7);
  const slant = 0.25 + rnd(seed * 3.1) * 0.35;
  const paint = zigzag(x, y, w, h, g, g * 1.6, seed, slant);
  const dark = mix(color, '#000000', 0.22), light = mix(color, '#FFFFFF', 0.35);
  const tex1 = zigzag(x, y, w, h, g * 0.85, g * 0.5, seed + 5, -slant * 0.8);
  const tex2 = zigzag(x + g * 0.4, y, w, h, g * 1.3, g * 0.5, seed + 9, slant * 1.4);
  const done = k >= 1;
  const body = (
    <>
      <path d={clip} fill={color} />
      {!flat && <path d={tex1} stroke={dark} strokeWidth={g * 0.32} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />}
      {!flat && <path d={tex2} stroke={light} strokeWidth={g * 0.26} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />}
      {!flat && w > 30 && h > 30 && [0, 1, 2].map((i) => {
        const hx = x + w * (0.18 + 0.22 * i + rnd(seed + i) * 0.08), hy = y + h * (0.2 + rnd(seed * 2 + i) * 0.25);
        return <path key={i} d={`M${hx},${hy} L${hx + g * 0.9},${hy - g * 0.35}`} stroke="#FFFFFF" strokeWidth={Math.max(1.5, g * 0.22)} strokeLinecap="round" opacity={0.75} />;
      })}
    </>
  );
  return (
    <g>
      <defs>
        <clipPath id={'c' + uid}><path d={clip} /></clipPath>
        {!done && (
          <mask id={'m' + uid} maskUnits="userSpaceOnUse" x={x - 2 * g} y={y - 2 * g} width={w + 4 * g} height={h + 4 * g}>
            <path d={paint} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - k} stroke="#FFFFFF" strokeWidth={g * 2.3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        )}
      </defs>
      <g clipPath={`url(#c${uid})`} mask={done ? undefined : `url(#m${uid})`}>{body}</g>
    </g>
  );
};

export type Def = { lines: string[]; fills?: [string, string][]; dots?: string[]; w?: number };

// ---------- an icon: outline draws on, then color scribble ----------
export const Sketch: React.FC<{ def: Def; x: number; y: number; s?: number; at: number; dur?: number; rot?: number; flip?: boolean; opacity?: number; lw?: number; noFill?: boolean }> = ({ def, x, y, s = 1, at, dur = 0.9, rot = 0, flip, opacity = 1, lw, noFill }) => {
  const t = useT();
  if (t < at) return null;
  const fillAt = at + dur * 0.9;
  const W = lw ?? def.w ?? Math.max(5, Math.min(8, 4.5 + s * 2.2));
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s}) translate(-100,-100)`} opacity={opacity}>
      {!noFill && (def.fills || []).map(([d, c], i) => <Scribble key={'f' + i} clip={d} at={fillAt + i * 0.12} dur={0.75} color={c} seed={i + 3} />)}
      {(def.dots || []).map((d, i) => <path key={'d' + i} d={d} fill={C.ink} opacity={prog(t, at + dur * 0.5, 0.2)} />)}
      {def.lines.map((d, i) => <Ink key={'l' + i} d={jit(d, 1.6)} at={at + (i / Math.max(def.lines.length, 1)) * dur * 0.3} dur={dur * 0.65} w={W} />)}
    </g>
  );
};

// ---------- canvas text measuring ----------
let _ctx: CanvasRenderingContext2D | null = null;
export const measure = (text: string, size: number, font: string) => {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
  _ctx!.font = `${size}px "${font}"`;
  return _ctx!.measureText(text).width;
};

// ---------- hand-lettered text that writes on left-to-right, then a red underline sweeps ----------
export const Write: React.FC<{ text: string; x: number; y: number; size?: number; font?: 'pm' | 'cb'; color?: string; at: number; dur?: number; ul?: boolean | string; anchor?: 'start' | 'middle' | 'end'; rot?: number; opacity?: number; weight?: number }> = ({ text, x, y, size = 64, font = 'pm', color = C.ink, at, dur, ul, anchor = 'start', rot = 0, opacity = 1 }) => {
  const t = useT();
  const id = 'w' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (t < at) return null;
  const fam = font === 'pm' ? F.pm : F.cb;
  const lines = text.split('\n');
  const lh = size * 1.12;
  const widths = lines.map((l) => measure(l, size, fam));
  const W = Math.max(...widths);
  const total = lines.reduce((a, l) => a + l.length, 0);
  const D = dur ?? Math.min(2.2, 0.25 + total * 0.045);
  const k = clamp((t - at) / D);
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - W / 2 : x - W;
  // reveal: line by line wipe
  let acc = 0;
  const clips = lines.map((l, i) => {
    const share = l.length / Math.max(total, 1);
    const kk = clamp((k - acc) / Math.max(share, 1e-3));
    acc += share;
    const lx = anchor === 'start' ? x : anchor === 'middle' ? x - widths[i] / 2 : x - widths[i];
    return { lx, w: widths[i] * kk + (kk > 0 ? size * 0.15 : 0), y: y + i * lh };
  });
  const ulK = ul ? prog(t, at + D, 0.45) : 0;
  const uy = y + (lines.length - 1) * lh + size * 0.22;
  const ulColor = typeof ul === 'string' ? ul : C.red;
  return (
    <g opacity={opacity} transform={rot ? `rotate(${rot},${x},${y})` : undefined}>
      <defs>
        <clipPath id={id}>
          {clips.map((c, i) => <rect key={i} x={c.lx - size * 0.2} y={c.y - size * 1.05} width={Math.max(0, c.w + size * 0.2)} height={size * 1.45} />)}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {lines.map((l, i) => (
          <text key={i} x={x} y={y + i * lh} fontFamily={fam} fontSize={size} fill={color} textAnchor={anchor} style={{ whiteSpace: 'pre' }}>{l}</text>
        ))}
      </g>
      {ul && ulK > 0 && (
        <path d={`M${x0 - 6},${uy + 4} C${x0 + W * 0.3},${uy + 10} ${x0 + W * 0.7},${uy - 2} ${x0 + W + 10},${uy + 6}`} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - ulK}
          stroke={ulColor} strokeWidth={Math.max(5, size * 0.11)} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------- yellow burst dashes (= 1944 =) ----------
export const Burst: React.FC<{ x: number; y: number; w: number; h: number; at: number; color?: string }> = ({ x, y, w, h, at, color = C.yellow }) => {
  const t = useT();
  const k = backOut(clamp((t - at) / 0.4));
  if (k <= 0) return null;
  const segs: string[] = [];
  const L = Math.max(26, h * 0.35);
  for (const side of [-1, 1]) {
    for (const a of [-32, 0, 32]) {
      const r = (a * Math.PI) / 180;
      const cx = x + side * (w / 2 + 18), cy = y + Math.sin(r) * h * 0.55;
      const dx = side * Math.cos(r) * L, dy = Math.sin(r) * L;
      segs.push(`M${cx},${cy} L${cx + dx * k},${cy + dy * k}`);
    }
  }
  return <g>{segs.map((d, i) => <path key={i} d={d} stroke={color} strokeWidth={11} strokeLinecap="round" fill="none" />)}</g>;
};

// ---------- red hand-drawn arrow with optional label ----------
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; bend?: number; at: number; dur?: number; color?: string; w?: number; label?: string; lx?: number; ly?: number; lsize?: number; dash?: boolean }> = ({ x1, y1, x2, y2, bend = 0.2, at, dur = 0.6, color = C.red, w = 9, label, lx, ly, lsize = 46, dash }) => {
  const t = useT();
  const k = prog(t, at, dur);
  if (k <= 0) return null;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = -(y2 - y1), ny = x2 - x1;
  const cx = mx + nx * bend, cy = my + ny * bend;
  const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const hl = 30;
  const hk = clamp((k - 0.85) / 0.15);
  const h1 = `M${x2},${y2} L${x2 - Math.cos(ang - 0.5) * hl * hk},${y2 - Math.sin(ang - 0.5) * hl * hk}`;
  const h2 = `M${x2},${y2} L${x2 - Math.cos(ang + 0.5) * hl * hk},${y2 - Math.sin(ang + 0.5) * hl * hk}`;
  return (
    <g>
      {dash ? (
        <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray="4 22" opacity={k} />
      ) : (
        <path d={d} pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - k} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      )}
      {hk > 0 && <path d={h1 + ' ' + h2} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />}
      {label && <Write text={label} x={lx ?? x1} y={ly ?? y1 - 20} size={lsize} font="cb" color={color} at={at + dur * 0.6} />}
    </g>
  );
};

export const Cross: React.FC<{ x: number; y: number; size?: number; at: number; color?: string; w?: number }> = ({ x, y, size = 120, at, color = C.red, w = 14 }) => {
  const s = size / 2;
  return (
    <g>
      <Ink d={`M${x - s},${y - s} C${x - s * 0.3},${y - s * 0.35} ${x + s * 0.3},${y + s * 0.4} ${x + s},${y + s}`} at={at} dur={0.22} color={color} w={w} ns={false} />
      <Ink d={`M${x + s},${y - s} C${x + s * 0.35},${y - s * 0.3} ${x - s * 0.3},${y + s * 0.3} ${x - s},${y + s}`} at={at + 0.2} dur={0.22} color={color} w={w} ns={false} />
    </g>
  );
};

export const Check: React.FC<{ x: number; y: number; size?: number; at: number }> = ({ x, y, size = 90, at }) => (
  <Ink d={`M${x - size * 0.5},${y} L${x - size * 0.12},${y + size * 0.4} L${x + size * 0.55},${y - size * 0.5}`} at={at} dur={0.35} color={C.green} w={14} ns={false} />
);

// pop-in wrapper (scale with overshoot around a point)
export const Pop: React.FC<{ x: number; y: number; at: number; children: React.ReactNode }> = ({ x, y, at, children }) => {
  const t = useT();
  const k = backOut(clamp((t - at) / 0.38));
  if (k <= 0) return null;
  return <g transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>{children}</g>;
};
