import React, {useMemo} from 'react';
import {C, FONT_LABEL, FONT_TITLE} from './theme';
import {Drawn, PathDraw, clamp01, pop, easeOut, prog} from './draw';
import {wobble, toPath, rrect, ellipse, line, rect, poly, Pt} from './rough';
import {iconGeo} from './icons';
import {MText} from './text';
import {GI} from './GI';

export const Icon: React.FC<{f: number; inF: number; dF: number; name: string; x: number; y: number; s?: number; rot?: number; seed: number; fill?: string; fill2?: string; popIn?: boolean; label?: string; labelDy?: number; w?: number}> = ({
  f, inF, dF, name, x, y, s = 1, rot = 0, seed, fill, fill2, popIn = false, label, labelDy = 125, w = 6,
}) => {
  const g = useMemo(() => iconGeo(name, {fill, fill2}), [name, fill, fill2]);
  const p = popIn ? 1 : clamp01((f - inF) / Math.max(1, dF));
  const fp = popIn ? 1 : clamp01((f - inF - dF * 0.55) / Math.max(1, dF * 0.6));
  const sc = popIn ? pop(f, inF) : 1;
  if (popIn && sc <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sc})`}>
      <Drawn geo={g} seed={seed} p={p} fp={fp} w={w / Math.max(0.35, s)} />
      {label ? (
        <text x={0} y={labelDy} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={42 / Math.max(0.35, s)} fill={C.ink} opacity={clamp01((p - 0.5) * 3)}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

// "= 85 =" yellow burst dashes around a point
export const Burst: React.FC<{f: number; inF: number; x: number; y: number; r?: number; n?: number; color?: string}> = ({f, inF, x, y, r = 110, n = 10, color = C.yellow}) => {
  const s = pop(f, inF, 9);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.2;
        const r1 = r * 0.82 * s;
        const r2 = r * (1.05 + (i % 2) * 0.15) * s;
        return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1 * 0.8} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2 * 0.8} stroke={color} strokeWidth={9} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const Arrow: React.FC<{f: number; inF: number; dF: number; x1: number; y1: number; x2: number; y2: number; bend?: number; color?: string; w?: number; seed: number; label?: string; lx?: number; ly?: number; dashed?: boolean}> = ({
  f, inF, dF, x1, y1, x2, y2, bend = 0.12, color = C.red, w = 9, seed, label, lx, ly,
}) => {
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const pts: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push([(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2]);
  }
  const d = useMemo(() => toPath(wobble(pts, seed, 1.6)), [x1, y1, x2, y2, bend, seed]);
  const p = clamp01((f - inF) / Math.max(1, dF));
  const ang = Math.atan2(y2 - pts[14][1], x2 - pts[14][0]);
  const hl = 34;
  const head = `M${x2 - hl * Math.cos(ang - 0.5)},${y2 - hl * Math.sin(ang - 0.5)} L${x2},${y2} L${x2 - hl * Math.cos(ang + 0.5)},${y2 - hl * Math.sin(ang + 0.5)}`;
  return (
    <g>
      <PathDraw d={d} p={p} color={color} w={w} />
      <PathDraw d={head} p={clamp01((p - 0.9) * 10)} color={color} w={w} />
      {label ? (
        <text x={lx ?? mx} y={ly ?? my - 20} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={44} fill={color} opacity={clamp01((p - 0.6) * 3)}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

const fmtNum = (v: number) => Math.round(v).toLocaleString('en-US');

export const Counter: React.FC<{f: number; inF: number; dF: number; x: number; y: number; from?: number; to: number; size?: number; color?: string; prefix?: string; suffix?: string; anchor?: 'start' | 'middle' | 'end'; font?: 'title' | 'label'; ul?: boolean}> = ({
  f, inF, dF, x, y, from = 0, to, size = 110, color = C.ink, prefix = '', suffix = '', anchor = 'middle', font = 'title', ul = false,
}) => {
  if (f < inF) return null;
  const t = easeOut(prog(f, inF, dF));
  const v = from + (to - from) * t;
  const s = pop(f, inF, 12);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <text x={0} y={0} textAnchor={anchor} fontFamily={font === 'title' ? FONT_TITLE : FONT_LABEL} fontSize={size} fill={color}>
        {prefix + fmtNum(v) + suffix}
      </text>
      {ul ? <PathDraw d={`M${-size * 1.4},${size * 0.22} L${size * 1.4},${size * 0.16}`} p={clamp01((f - inF - dF) / 10)} color={C.red} w={size * 0.08} /> : null}
    </g>
  );
};

export const Calendar: React.FC<{f: number; inF: number; x: number; y: number; s?: number; top: string; big: string; bottom?: string; seed: number; flipAt?: number; top2?: string; big2?: string; bottom2?: string}> = ({
  f, inF, x, y, s = 1, top, big, bottom, seed, flipAt, top2, big2, bottom2,
}) => {
  const sc = pop(f, inF, 12);
  const page = useMemo(() => ({strokes: [rrect(-120, -130, 240, 260, 14), line(-120, -60, 120, -60)], fills: [{pts: rrect(-120, -130, 240, 70, 14).pts, color: C.red}, {pts: rrect(-120, -60, 240, 190, 1).pts, color: C.white, solid: true}]}), []);
  if (sc <= 0) return null;
  const flipped = flipAt !== undefined && f >= flipAt;
  const fl = flipAt !== undefined ? Math.abs(Math.cos(clamp01((f - flipAt + 6) / 12) * Math.PI)) : 1;
  const T = flipped ? top2 ?? top : top;
  const B = flipped ? big2 ?? big : big;
  const Bo = flipped ? bottom2 ?? bottom : bottom;
  const bigSize = B.length > 4 ? 150 * Math.min(1, 5 / B.length) : 120;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc} ${s * sc * (flipAt !== undefined && f > flipAt - 6 && f < flipAt + 6 ? fl : 1)})`}>
      <Drawn geo={page} seed={seed} p={1} fp={1} w={6} />
      <text x={0} y={-80} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={46} fill={C.white}>
        {T}
      </text>
      <text x={0} y={Bo ? 55 : 75} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={bigSize} fill={C.ink}>
        {B}
      </text>
      {Bo ? (
        <text x={0} y={112} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={50} fill={C.ink}>
          {Bo}
        </text>
      ) : null}
    </g>
  );
};

export const Stamp: React.FC<{f: number; inF: number; x: number; y: number; text: string; rot?: number; color?: string; size?: number}> = ({f, inF, x, y, text, rot = -8, color = C.red, size = 64}) => {
  if (f < inF) return null;
  const t = clamp01((f - inF) / 6);
  const sc = 1.6 - 0.6 * easeOut(t);
  const lines = text.split('\n');
  const wMax = Math.max(...lines.map((l) => l.length)) * size * 0.62 + 50;
  const h = lines.length * size * 1.1 + 30;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={t}>
      <rect x={-wMax / 2} y={-h / 2} width={wMax} height={h} fill="none" stroke={color} strokeWidth={8} rx={10} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + 15 + size * 0.95 + i * size * 1.1} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={size} fill={color}>
          {l}
        </text>
      ))}
    </g>
  );
};

export const BigX: React.FC<{f: number; inF: number; x: number; y: number; w: number; h: number; seed: number; color?: string}> = ({f, inF, x, y, w, h, seed, color = C.red}) => {
  const d1 = useMemo(() => toPath(wobble([[x - w / 2, y - h / 2], [x + w / 2, y + h / 2]], seed, 3)), [x, y, w, h, seed]);
  const d2 = useMemo(() => toPath(wobble([[x + w / 2, y - h / 2], [x - w / 2, y + h / 2]], seed + 1, 3)), [x, y, w, h, seed]);
  const p = clamp01((f - inF) / 14);
  return (
    <g>
      <PathDraw d={d1} p={clamp01(p * 2)} color={color} w={14} />
      <PathDraw d={d2} p={clamp01(p * 2 - 1)} color={color} w={14} />
    </g>
  );
};

export const Check: React.FC<{f: number; inF: number; x: number; y: number; s?: number; seed: number; color?: string}> = ({f, inF, x, y, s = 1, seed, color = C.green}) => {
  const d = useMemo(() => toPath(wobble([[x - 50 * s, y], [x - 12 * s, y + 40 * s], [x + 60 * s, y - 55 * s]], seed, 2)), [x, y, s, seed]);
  return <PathDraw d={d} p={clamp01((f - inF) / 10)} color={color} w={14 * Math.max(0.6, s)} />;
};

// horizontal threshold bar with a label; can slide to new y values
export const Bar: React.FC<{f: number; inF: number; x1: number; x2: number; y: number; label: string; seed: number; color?: string; steps?: {at: number; y: number; label: string}[]}> = ({f, inF, x1, x2, y, label, seed, color = C.red, steps = []}) => {
  let cy = y;
  let lab = label;
  for (const st of steps) {
    if (f >= st.at) {
      const t = easeOut(clamp01((f - st.at) / 14));
      cy = cy + (st.y - cy) * t;
      if (t > 0.5) lab = st.label;
    }
  }
  const d = useMemo(() => toPath(wobble([[x1, 0], [x2, 0]], seed, 2)), [x1, x2, seed]);
  const p = clamp01((f - inF) / 18);
  return (
    <g transform={`translate(0 ${cy})`}>
      <PathDraw d={d} p={p} color={color} w={8} />
      <text x={x2 + 16} y={16} fontFamily={FONT_TITLE} fontSize={56} fill={color} opacity={clamp01((p - 0.5) * 3)}>
        {lab}
      </text>
    </g>
  );
};

// Playing card for the 3-soldier game
export const Card: React.FC<{f: number; inF: number; x: number; y: number; s?: number; title: string; seed: number; value?: string; valueAt?: number; valueColor?: string; hero?: 'father' | 'hero' | 'kid'; mood?: 'neutral' | 'shock' | 'happy' | 'sad' | 'worried'; flipHome?: number; dim?: number}> = ({
  f, inF, x, y, s = 1, title, seed, value, valueAt, valueColor = C.red, hero, mood = 'neutral', flipHome, dim,
}) => {
  const sc = pop(f, inF, 12);
  const geo = useMemo(() => ({strokes: [rrect(-150, -200, 300, 400, 20)], fills: [{pts: rrect(-150, -200, 300, 400, 20).pts, color: C.white, solid: true}]}), []);
  if (sc <= 0) return null;
  const vs = valueAt !== undefined ? pop(f, valueAt) : 1;
  const home = flipHome !== undefined ? clamp01((f - flipHome) / 12) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc})`} opacity={dim !== undefined && f >= dim ? 0.35 : 1}>
      <Drawn geo={geo} seed={seed} p={1} fp={1} w={6} />
      <text x={0} y={-150} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={44} fill={C.ink}>
        {title}
      </text>
      <line x1={-110} y1={-132} x2={110} y2={-136} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
      {hero ? <GI f={f} inF={inF} dF={18} x={0} y={110} s={0.72} v={hero} mood={mood} seed={seed + 5} stripes={hero === 'father'} /> : null}
      {value && vs > 0 ? (
        <g transform={`translate(95 150) scale(${vs})`}>
          <circle r={58} fill={C.white} stroke={valueColor} strokeWidth={7} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={value.length > 2 ? 46 : 60} fill={valueColor}>
            {value}
          </text>
        </g>
      ) : null}
      {home > 0 ? (
        <g opacity={home}>
          <rect x={-150} y={-60} width={300} height={90} fill={C.green} opacity={0.9} transform="rotate(-8)" />
          <text x={0} y={10} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={70} fill={C.white} transform="rotate(-8)">
            HOME
          </text>
        </g>
      ) : null}
    </g>
  );
};

export const Crowd: React.FC<{f: number; inF: number; x: number; y: number; n?: number; w?: number; seed: number; signs?: number; s?: number; mood?: 'angry' | 'neutral'}> = ({f, inF, x, y, n = 9, w = 900, seed, signs = 0, s = 0.55, mood = 'neutral'}) => {
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const px = x - w / 2 + (w * (i + 0.5)) / n + ((i * 37) % 23) - 11;
        const py = y + ((i * 53) % 3) * 14;
        const at = inF + i * 3;
        const isSign = signs > 0 && i % Math.max(1, Math.floor(n / signs)) === 1;
        return <GI key={i} f={f} inF={at} dF={14} x={px} y={py} s={s * (0.9 + ((i * 7) % 5) * 0.04)} v="hero" mood={mood} pose={isSign ? 'up' : 'down'} seed={seed + i * 13} hold={isSign ? 'sign:HOME!' : undefined} holdF={at + 10} />;
      })}
    </g>
  );
};

export const Tents: React.FC<{f: number; inF: number; x: number; y: number; rows: number; cols: number; dx?: number; dy?: number; s?: number; seed: number; every?: number}> = ({f, inF, x, y, rows, cols, dx = 120, dy = 85, s = 0.45, seed, every = 2}) => {
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      out.push(<Icon key={i} f={f} inF={inF + i * every} dF={10} name="tent" x={x + c * dx + (r % 2) * dx * 0.5} y={y + r * dy} s={s * (1 - r * 0.04)} seed={seed + i} />);
    }
  return <g>{out}</g>;
};

// clock with spinning hands; freeze at frame
export const Clock: React.FC<{f: number; inF: number; x: number; y: number; s?: number; seed: number; freezeAt?: number; speed?: number}> = ({f, inF, x, y, s = 1, seed, freezeAt, speed = 1}) => {
  const sc = pop(f, inF, 12);
  const geo = useMemo(() => iconGeo('clock'), []);
  if (sc <= 0) return null;
  const tf = freezeAt !== undefined ? Math.min(f, freezeAt) : f;
  const a = ((tf - inF) * 6 * speed) % 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sc})`}>
      <Drawn geo={geo} seed={seed} p={1} fp={1} w={6} />
      <line x1={0} y1={0} x2={0} y2={-62} stroke={C.ink} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
      <line x1={0} y1={0} x2={0} y2={-40} stroke={C.red} strokeWidth={10} strokeLinecap="round" transform={`rotate(${a / 12 + 40})`} />
      <circle r={8} fill={C.ink} />
    </g>
  );
};

// a hand-written letter / quote on paper
export const Quote: React.FC<{f: number; inF: number; dF: number; x: number; y: number; w?: number; lines: string[]; sign?: string; seed: number; size?: number}> = ({f, inF, dF, x, y, w = 860, lines, sign, seed, size = 54}) => {
  const h = lines.length * size * 1.25 + (sign ? 110 : 60);
  const geo = useMemo(() => ({strokes: [rect(-w / 2, 0, w, h)], fills: [{pts: rect(-w / 2, 0, w, h).pts, color: C.white, solid: true}]}), [w, h]);
  const sc = pop(f, inF, 14);
  if (sc <= 0) return null;
  const tp = clamp01((f - inF - 6) / Math.max(1, dF));
  const total = lines.join('').length;
  let acc = 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc}) rotate(-1.5)`}>
      <Drawn geo={geo} seed={seed} p={1} fp={1} w={5} />
      {lines.map((l, i) => {
        const a = acc / total;
        acc += l.length;
        const b = acc / total;
        const lp = clamp01((tp - a) / Math.max(1e-6, b - a));
        return <MText key={i} text={l} x={-w / 2 + 40} y={size * 1.15 + i * size * 1.25} size={size} font="label" p={lp} seed={seed + i} />;
      })}
      {sign ? <MText text={sign} x={w / 2 - 40} y={h - 34} size={44} anchor="end" p={clamp01((f - inF - 6 - dF) / 12)} color={C.blue} /> : null}
    </g>
  );
};

// felt eraser that sweeps the board (used by wipe transitions)
export const EraserWipe: React.FC<{x: number; seed: number}> = ({x, seed}) => {
  const geo = useMemo(() => iconGeo('eraser'), []);
  return (
    <g transform={`translate(${x} 540) rotate(90) scale(2.4)`}>
      <Drawn geo={geo} seed={seed} p={1} fp={1} w={3} />
    </g>
  );
};

export const SquadRow: React.FC<{f: number; inF: number; x: number; y: number; n: number; gap?: number; seed: number; remove?: {i: number; at: number}[]; s?: number; keep?: number}> = ({f, inF, x, y, n, gap = 170, seed, remove = [], s = 0.75, keep}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const r = remove.find((q) => q.i === i);
      const o = r ? 1 - clamp01((f - r.at) / 10) : 1;
      if (o <= 0) return null;
      return (
        <g key={i} opacity={o}>
          <GI f={f} inF={inF + i * 4} dF={14} x={x + (i - (n - 1) / 2) * gap} y={y} s={s} v={i === keep ? 'hero' : 'plain'} mood={i === keep ? 'worried' : 'neutral'} seed={seed + i * 11} />
        </g>
      );
    })}
  </g>
);

// vertical threshold bar that can step left/right
export const VBar: React.FC<{f: number; inF: number; x: number; y1: number; y2: number; label: string; seed: number; color?: string; steps?: {at: number; x: number; label: string}[]}> = ({f, inF, x, y1, y2, label, seed, color = C.red, steps = []}) => {
  let cx = x;
  let lab = label;
  for (const st of steps) {
    if (f >= st.at) {
      const t = easeOut(clamp01((f - st.at) / 16));
      cx = cx + (st.x - cx) * t;
      if (t > 0.4) lab = st.label;
    }
  }
  const d = useMemo(() => toPath(wobble([[0, y1], [0, y2]], seed, 2)), [y1, y2, seed]);
  const p = clamp01((f - inF) / 18);
  return (
    <g transform={`translate(${cx} 0)`}>
      <PathDraw d={d} p={p} color={color} w={10} />
      <text x={0} y={y1 - 22} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={64} fill={color} opacity={clamp01((p - 0.5) * 3)}>
        {lab}
      </text>
    </g>
  );
};

export {ellipse, poly};
