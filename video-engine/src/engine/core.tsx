import React from "react";
import { C, Drawable, Part } from "./shapes";

// ---------- timing helpers ----------
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const prog = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
export const LPS = 12; // letters per second for write-on

// ---------- text measuring (fonts are loaded before first render) ----------
let ctx: CanvasRenderingContext2D | null = null;
export const FONT = { pm: "PM", cb: "CB" } as const;
export const measure = (txt: string, size: number, font: "pm" | "cb" = "pm") => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = `${size}px ${FONT[font]}`;
  return ctx!.measureText(txt).width;
};

// ---------- global defs ----------
export const Defs: React.FC = () => (
  <defs>
    <filter id="wob" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="wobS" x="-10%" y="-30%" width="120%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="9" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    {/* directional marker strokes on top of every fill */}
    <pattern id="hD" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
      <line x1="0" y1="5" x2="18" y2="5" stroke="#000" strokeOpacity="0.13" strokeWidth="7" />
    </pattern>
    <pattern id="hL" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <line x1="0" y1="7" x2="26" y2="7" stroke="#fff" strokeOpacity="0.2" strokeWidth="5" />
    </pattern>
  </defs>
);

// zigzag scribble covering a box, sweeping top->bottom (h) or left->right (v)
const zig = (x0: number, y0: number, x1: number, y1: number, step: number, dir: "h" | "v") => {
  let d = "";
  if (dir === "h") { let y = y0, l = true; d = `M${x0} ${y0}`; while (y <= y1 + step) { y += step / 2; d += ` L${l ? x1 : x0} ${y}`; l = !l; } }
  else { let x = x0, u = true; d = `M${x0} ${y0}`; while (x <= x1 + step) { x += step / 2; d += ` L${x} ${u ? y1 : y0}`; u = !u; } }
  return d;
};

// ---------- REVEAL: outline draw-on -> scribble-mask fill -> details ----------
export type RevealProps = {
  dw: Drawable; id: string; t: number; t0: number; dur?: number;
  x: number; y: number; h?: number; w?: number; // centre position and target size (px)
  rot?: number;
};
export const Reveal: React.FC<RevealProps> = ({ dw, id, t, t0, dur = 3.2, x, y, h, w, rot = 0 }) => {
  if (t < t0) return null;
  const s = w ? w / dw.w : (h ?? 400) / dw.h;
  const tx = x - (dw.w * s) / 2, ty = y - (dw.h * s) / 2;
  const fills = dw.parts.filter(p => p.fill);
  const outl = dw.parts.filter(p => !p.detail && !p.noOutline && p.s.d);
  const dets = dw.parts.filter(p => p.detail);
  const oDur = Math.max(0.4, Math.min(0.8, dur * 0.2));
  const fA = t0 + oDur * 0.85, fB = t0 + dur * 0.82;
  const dA = fB, dB = t0 + dur;
  // allocate fill time by sqrt(area)
  const wts = fills.map(p => Math.sqrt(Math.max(1, (p.s.bb[2] - p.s.bb[0]) * (p.s.bb[3] - p.s.bb[1]) * s * s)) + 40);
  const tot = wts.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const tr = `translate(${tx} ${ty}) scale(${s})`;
  const rotT = rot ? `rotate(${rot} ${x} ${y})` : undefined;
  return (
    <g transform={rotT}>
      {/* fills */}
      <g transform={tr}>
        {fills.map((p, i) => {
          const a = fA + ((fB - fA) * acc) / tot; acc += wts[i]; const b = fA + ((fB - fA) * acc) / tot;
          const f = prog(t, a, b);
          if (f <= 0) return null;
          const [x0, y0, x1, y1] = p.s.bb; const bw = x1 - x0, bh = y1 - y0;
          const dir = bw > bh * 1.2 ? "v" : "h";
          const step = Math.max(8, Math.min(46 / s, Math.min(bw, bh) / 3));
          const sw = step * 2.3;
          const m = sw / 2;
          const big = bw * s > 90 && bh * s > 70;
          const streak = p.streak ?? big;
          const body = (
            <>
              <path d={p.s.d} fill={p.fill} fillRule="evenodd" />
              <path d={p.s.d} fill="url(#hD)" fillRule="evenodd" />
              <path d={p.s.d} fill="url(#hL)" fillRule="evenodd" />
              {streak && (
                <g clipPath={`url(#${id}c${i})`}>
                  <path d={`M${x0 + bw * 0.16} ${y0 + bh * 0.62} Q${x0 + bw * 0.2} ${y0 + bh * 0.24} ${x0 + bw * 0.46} ${y0 + bh * 0.16}`} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={9 / s} strokeLinecap="round" />
                  <path d={`M${x0 + bw * 0.24} ${y0 + bh * 0.68} Q${x0 + bw * 0.28} ${y0 + bh * 0.42} ${x0 + bw * 0.4} ${y0 + bh * 0.32}`} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={4.5 / s} strokeLinecap="round" />
                </g>
              )}
            </>
          );
          return (
            <g key={i}>
              <defs>
                <clipPath id={`${id}c${i}`}><path d={p.s.d} /></clipPath>
                {f < 1 && (
                  <mask id={`${id}m${i}`} maskUnits="userSpaceOnUse" x={x0 - m * 2} y={y0 - m * 2} width={bw + m * 4} height={bh + m * 4}>
                    <path d={zig(x0 - m, y0 - m, x1 + m, y1 + m, step, dir as "h" | "v")} fill="none" stroke="#fff" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} />
                  </mask>
                )}
              </defs>
              <g mask={f < 1 ? `url(#${id}m${i})` : undefined}>{body}</g>
            </g>
          );
        })}
      </g>
      {/* outlines */}
      <g filter="url(#wob)">
        <g transform={tr}>
          {outl.map((p, i) => {
            const f = ease(prog(t, t0 + (i / Math.max(1, outl.length)) * oDur * 0.35, t0 + oDur));
            if (f <= 0) return null;
            return <path key={i} d={p.s.d} fill="none" stroke={p.stroke ?? C.ink} strokeWidth={(p.sw ?? 7) / s} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} />;
          })}
        </g>
      </g>
      {/* details */}
      <g filter="url(#wobS)">
        <g transform={tr}>
          {dets.map((p, i) => {
            const a = dA + ((dB - dA) * i) / Math.max(1, dets.length) * 0.6;
            const f = ease(prog(t, a, a + Math.max(0.25, (dB - dA) * 0.5)));
            if (f <= 0) return null;
            if (p.text) {
              const tt = p.text;
              return (
                <text key={i} x={tt.x} y={tt.y} fontFamily={tt.font === "cb" ? "CB" : "PM"} fontSize={tt.size} fill={tt.color ?? C.ink} textAnchor={tt.anchor ?? "middle"} opacity={f} transform={tt.rot ? `rotate(${tt.rot} ${tt.x} ${tt.y})` : undefined}>{tt.t}</text>
              );
            }
            return <path key={i} d={p.s.d} fill="none" stroke={p.stroke ?? C.ink} strokeWidth={(p.sw ?? 5) / s} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} />;
          })}
        </g>
      </g>
    </g>
  );
};

// ---------- wavy underline ----------
export const wavy = (x0: number, x1: number, y: number, amp = 3) => {
  const k = 5; let d = `M${x0} ${y}`;
  for (let i = 1; i <= k; i++) { const x = x0 + ((x1 - x0) * i) / k; d += ` Q${x - (x1 - x0) / k / 2} ${y + (i % 2 ? amp : -amp)} ${x} ${y + (i % 2 ? 1 : -1) * amp * 0.3}`; }
  return d;
};

// ---------- WRITE-ON TEXT (per-word clip + per-word red underline) ----------
export type WriteProps = {
  id: string; t: number; t0: number; lines: { text: string; color?: string; size?: number }[];
  x: number; y: number; size?: number; lineH?: number; font?: "pm" | "cb"; rot?: number;
  underline?: boolean; anchor?: "start" | "middle"; ulColor?: string; lps?: number; color?: string; stroke?: boolean;
};
export const writeDuration = (lines: { text: string }[], lps = LPS) =>
  lines.reduce((a, l) => a + l.text.replace(/\s/g, "").length / lps + l.text.split(" ").length * 0.12, 0);

export const WriteOn: React.FC<WriteProps> = ({ id, t, t0, lines, x, y, size = 80, lineH, font = "pm", rot = -2.5, underline = true, anchor = "start", ulColor = C.red, lps = LPS, color = C.ink, stroke = true }) => {
  if (t < t0) return null;
  const LH = lineH ?? size * 1.25;
  let clock = t0;
  const els: React.ReactNode[] = [];
  lines.forEach((ln, li) => {
    const sz = ln.size ?? size;
    const words = ln.text.split(" ");
    const sp = measure(" ", sz, font);
    const widths = words.map(w => measure(w, sz, font));
    const total = widths.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    let cx = anchor === "middle" ? x - total / 2 : x;
    const by = y + li * LH;
    words.forEach((w, wi) => {
      const d = Math.max(0.12, w.length / lps);
      const f = prog(t, clock, clock + d);
      const uf = ease(prog(t, clock + d, clock + d + 0.2));
      const k = `${id}-${li}-${wi}`;
      if (f > 0) {
        els.push(
          <g key={k}>
            <defs><clipPath id={`${k}c`}><rect x={cx - 8} y={by - sz * 1.15} width={(widths[wi] + 16) * f} height={sz * 1.6} /></clipPath></defs>
            <g clipPath={`url(#${k}c)`}>
              <text x={cx} y={by} fontFamily={FONT[font]} fontSize={sz} fill={ln.color ?? color} stroke={stroke ? ln.color ?? color : undefined} strokeWidth={stroke ? 2.5 : 0} paintOrder="stroke">{w}</text>
            </g>
            {underline && uf > 0 && (
              <path d={wavy(cx + widths[wi] * 0.04, cx + widths[wi] * 0.94, by + sz * 0.2, 2.5)} fill="none" stroke={ulColor} strokeWidth={Math.max(6, sz * 0.1)} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - uf} filter="url(#wobS)" />
            )}
          </g>,
        );
      }
      cx += widths[wi] + sp;
      clock += d + (underline ? 0.12 : 0.05);
    });
  });
  return <g transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{els}</g>;
};

// ---------- ARROW + LABEL ----------
export const arrowPath = (from: [number, number], to: [number, number]) => {
  const [x0, y0] = from, [x1, y1] = to;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const nx = -(y1 - y0), ny = x1 - x0; const L = Math.hypot(nx, ny) || 1;
  const cx = mx + (nx / L) * 40, cy = my + (ny / L) * 40;
  // head direction from control point to tip
  const dx = x1 - cx, dy = y1 - cy; const dl = Math.hypot(dx, dy) || 1; const ux = dx / dl, uy = dy / dl;
  const hx1 = x1 - ux * 34 - uy * 20, hy1 = y1 - uy * 34 + ux * 20;
  const hx2 = x1 - ux * 34 + uy * 20, hy2 = y1 - uy * 34 - ux * 20;
  return { body: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, head: `M${hx1} ${hy1} L${x1} ${y1} L${hx2} ${hy2}` };
};
export type LabelProps = { id: string; t: number; t0: number; text: string; x: number; y: number; to?: [number, number]; from?: [number, number]; size?: number; color?: string; anchor?: "start" | "middle" | "end" };
export const labelDuration = (text: string, arrow = true) => (arrow ? 0.45 : 0) + text.length / 13;
export const Label: React.FC<LabelProps> = ({ id, t, t0, text, x, y, to, from, size = 60, color = C.red, anchor = "start" }) => {
  if (t < t0) return null;
  const w = measure(text, size, "cb");
  const lx = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  let a = 0; const els: React.ReactNode[] = [];
  if (to) {
    const st: [number, number] = from ?? [anchor === "end" ? lx + w + 14 : lx - 14, y - size * 0.3];
    const ap = arrowPath(st, to);
    const fb = ease(prog(t, t0, t0 + 0.3)), fh = ease(prog(t, t0 + 0.3, t0 + 0.42));
    els.push(
      <g key="a" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" filter="url(#wobS)">
        <path d={ap.body} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fb} />
        {fh > 0 && <path d={ap.head} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fh} />}
      </g>,
    );
    a = 0.45;
  }
  const f = prog(t, t0 + a, t0 + a + text.length / 13);
  els.push(
    <g key="t">
      <defs><clipPath id={`${id}lc`}><rect x={lx - 10} y={y - size * 1.1} width={(w + 20) * f} height={size * 1.5} /></clipPath></defs>
      <g clipPath={`url(#${id}lc)`}><text x={lx} y={y} fontFamily="CB" fontSize={size} fill={color}>{text}</text></g>
    </g>,
  );
  return <>{els}</>;
};

// ---------- YELLOW RAYS (3 dashes each side of a box) ----------
export const Rays: React.FC<{ t: number; t0: number; box: [number, number, number, number]; color?: string; sides?: "lr" | "l" | "r" }> = ({ t, t0, box, color = C.yellow, sides = "lr" }) => {
  if (t < t0) return null;
  const [x0, y0, x1, y1] = box; const cy = (y0 + y1) / 2; const hh = (y1 - y0) / 2;
  const paths: string[] = [];
  const offs = [-0.55, 0, 0.55];
  offs.forEach(o => {
    const yy = cy + o * hh * 0.8;
    if (sides.includes("l")) paths.push(`M${x0 - 26} ${yy} L${x0 - 86} ${yy + o * 50}`);
    if (sides.includes("r")) paths.push(`M${x1 + 26} ${yy} L${x1 + 86} ${yy + o * 50}`);
  });
  return (
    <g fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" filter="url(#wobS)">
      {paths.map((d, i) => { const f = ease(prog(t, t0 + i * 0.04, t0 + 0.28 + i * 0.04)); return f > 0 ? <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} /> : null; })}
    </g>
  );
};

// ---------- NUMBER CARD ----------
export type NumberCardProps = { id: string; t: number; t0: number; num: string; unit?: string; caption?: string; y?: number; size?: number };
export const NumberCard: React.FC<NumberCardProps> = ({ id, t, t0, num, unit = "", caption, y = 330, size = 210 }) => {
  if (t < t0) return null;
  const us = size * 0.6;
  const nw = measure(num, size, "pm"); const uw = unit ? measure(unit, us, "pm") + 30 : 0;
  const W = nw + uw; const x0 = 960 - W / 2;
  const rays = 0.3, dA = t0 + rays, dDur = num.length / 9, uA = dA + dDur, uDur = unit.length / 11;
  const ulA = uA + uDur + 0.05, cA = ulA + 0.4;
  const fN = prog(t, dA, dA + dDur), fU = prog(t, uA, uA + uDur), fUl = ease(prog(t, ulA, ulA + 0.35));
  const cy = y - size * 0.35;
  const ray = (side: number) => [-1, 0, 1].map((o, i) => {
    const xs = side < 0 ? x0 - 40 : x0 + W + 40; const ys = cy + o * 52;
    const d = `M${xs} ${ys} L${xs + side * 80} ${ys + o * 40}`;
    const f = ease(prog(t, t0 + i * 0.05, t0 + 0.25 + i * 0.05));
    return f > 0 ? <path key={`${side}${i}`} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} /> : null;
  });
  return (
    <g>
      <g fill="none" stroke={C.yellow} strokeWidth={14} strokeLinecap="round" filter="url(#wobS)">{ray(-1)}{ray(1)}</g>
      <defs>
        <clipPath id={`${id}n`}><rect x={x0 - 10} y={y - size} width={(nw + 20) * fN} height={size * 1.3} /></clipPath>
        <clipPath id={`${id}u`}><rect x={x0 + nw + 20} y={y - size} width={(uw + 10) * fU} height={size * 1.3} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}n)`}><text x={x0} y={y} fontFamily="PM" fontSize={size} fill={C.red} stroke={C.red} strokeWidth={3} paintOrder="stroke">{num}</text></g>
      {unit && <g clipPath={`url(#${id}u)`}><text x={x0 + nw + 30} y={y} fontFamily="PM" fontSize={us} fill={C.blue} stroke={C.blue} strokeWidth={2} paintOrder="stroke">{unit}</text></g>}
      {fUl > 0 && <path d={wavy(x0 + 10, x0 + W - 10, y + 34, 5)} fill="none" stroke={C.red} strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fUl} filter="url(#wobS)" />}
      {caption && <WriteOn id={`${id}cap`} t={t} t0={cA} lines={[{ text: caption }]} x={960} y={y + 150} size={64} font="cb" anchor="middle" underline={false} rot={0} lps={18} stroke={false} />}
    </g>
  );
};
export const numberCardDuration = (num: string, unit = "", caption?: string) => 0.3 + num.length / 9 + unit.length / 11 + 0.45 + (caption ? caption.length / 18 : 0);
