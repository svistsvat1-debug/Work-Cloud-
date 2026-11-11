import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {circPts, ellPts, markerPath, Pt, rectPts, roundRectPts, seedOf, starPts} from '../lib/sketch';
import {C, FONT_LABEL, FONT_TITLE} from '../lib/theme';
import {popScale, prog} from '../lib/timing';
import {Drawing, Part, Stroke} from './primitives';

type IP = {x: number; y: number; at: number; s?: number; dur?: number; seed?: number; rot?: number};

const G: React.FC<{x: number; y: number; s?: number; rot?: number; children: React.ReactNode}> = ({x, y, s = 1, rot = 0, children}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>{children}</g>
);

const mk = (parts: Part[], defDur = 20, extra?: (p: IP & {f: number}) => React.ReactNode) => {
  const Comp: React.FC<IP> = (p) => {
    const f = useCurrentFrame();
    if (f < p.at) return null;
    return (
      <G x={p.x} y={p.y} s={p.s} rot={p.rot}>
        <Drawing parts={parts} at={p.at} dur={p.dur ?? defDur} seed={p.seed ?? seedOf(parts.length, defDur)} />
        {extra ? extra({...p, f}) : null}
      </G>
    );
  };
  return Comp;
};

const txt = (t: string, x: number, y: number, size: number, opacity: number, color = C.ink, font = FONT_LABEL, anchor: 'middle' | 'start' = 'middle') => (
  <text x={x} y={y} fontFamily={font} fontSize={size} fill={color} textAnchor={anchor} opacity={opacity}>
    {t}
  </text>
);

// ---------------- terrain ----------------
export const Foxhole = mk(
  [
    {pts: [[-260, 0], [-170, -40], [-60, -52], [60, -52], [170, -40], [260, 0]], closed: true, fill: C.mud, gap: 12},
    {pts: ellPts(0, -36, 130, 26, 20), closed: true, fill: '#3E2C1E', solid: true},
  ],
  16,
);

export const Hedgerow: React.FC<IP & {width?: number}> = ({x, y, at, width = 1500, dur = 26}) => {
  const pts = useMemo(() => {
    const out: Pt[] = [];
    const n = Math.round(width / 70);
    for (let i = 0; i <= n; i++) {
      const xx = -width / 2 + (width * i) / n;
      out.push([xx, -40 - (i % 2 === 0 ? 28 : 6) - ((i * 37) % 17)]);
    }
    return [...out, [width / 2, 0], [-width / 2, 0]] as Pt[];
  }, [width]);
  return (
    <G x={x} y={y}>
      <Drawing parts={[{pts, closed: true, fill: C.green, gap: 13}]} at={at} dur={dur} seed={11} />
    </G>
  );
};

// ---------------- food ----------------
export const KBox: React.FC<IP & {label?: string; color?: string}> = ({x, y, at, s = 1, label = '', color = C.khaki, dur = 14}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-80, -55, 160, 110), closed: true, fill: color, gap: 11}, {pts: [[-80, -22], [80, -22]], w: 3}], [color]);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={dur} seed={seedOf('kbox', label)} />
      {txt('U.S. ARMY', 0, -30, 22, prog(f, at + dur, 6), C.ink, FONT_TITLE)}
      {txt(label, 0, 30, Math.min(32, 240 / Math.max(1, label.length)), prog(f, at + dur, 6), C.ink, FONT_TITLE)}
    </G>
  );
};

export const Cigarettes = mk([{pts: rectPts(-28, -40, 56, 80), closed: true, fill: C.white, solid: true}, {pts: rectPts(-28, -40, 56, 22), closed: true, fill: C.red, gap: 6}, {pts: [[-12, -40], [-12, -58]], w: 8, color: C.paper}, {pts: [[8, -40], [8, -52]], w: 8, color: C.paper}], 10);
export const Gum = mk([{pts: rectPts(-40, -12, 80, 24), closed: true, fill: C.green, gap: 6}], 8);
export const ToiletRoll = mk([{pts: ellPts(0, 0, 34, 40, 18), closed: true, fill: C.white, solid: true}, {pts: ellPts(0, 0, 10, 12, 10), closed: true}, {pts: [[34, 0], [34, 60], [70, 70]], w: 4}], 10);
export const Chocolate = mk([{pts: rectPts(-90, -40, 180, 80), closed: true, fill: C.brown, gap: 10}, {pts: [[-30, -40], [-30, 40]], w: 3}, {pts: [[30, -40], [30, 40]], w: 3}, {pts: [[-90, 0], [90, 0]], w: 3}], 16);
export const Potato = mk([{pts: [[-80, -10], [-60, -48], [0, -60], [60, -44], [86, 0], [60, 44], [0, 54], [-60, 40]], closed: true, fill: '#C9A26B', gap: 10}, {pts: [[-20, -20], [-14, -16]], w: 5}, {pts: [[24, 10], [30, 14]], w: 5}, {pts: [[-36, 20], [-30, 24]], w: 5}], 16);
export const Campfire = mk([{pts: [[-50, 20], [50, -10]], w: 9, color: C.brown}, {pts: [[-50, -10], [50, 20]], w: 9, color: C.brown}, {pts: [[-30, 0], [-36, -50], [-10, -30], [0, -80], [14, -34], [34, -56], [30, 0]], closed: true, fill: C.orange, gap: 8}], 14);
export const Pot: React.FC<IP> = (p) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [
    {pts: [[-110, -80], [110, -80], [96, 40], [-96, 40]], closed: true, fill: C.steel, gap: 11},
    {pts: [[-124, -84], [124, -84]], w: 8},
    {pts: [[-80, 40], [-96, 96]], w: 7},
    {pts: [[80, 40], [96, 96]], w: 7},
  ], []);
  if (f < p.at) return null;
  const steamO = prog(f, p.at + 20, 10);
  const t = f / 8;
  return (
    <G x={p.x} y={p.y} s={p.s}>
      <Drawing parts={parts} at={p.at} dur={p.dur ?? 18} seed={77} />
      {[-50, 0, 50].map((sx, i) => (
        <path key={i} d={`M${sx},-100 q${18 * Math.sin(t + i)},-25 0,-50 q${-18 * Math.sin(t + i)},-25 0,-50`} stroke={C.grey} strokeWidth={6} fill="none" strokeLinecap="round" opacity={steamO * 0.9} />
      ))}
    </G>
  );
};

// ---------------- crates ----------------
export const CrateGrid: React.FC<IP & {cols: number; rows: number; size?: number; gapX?: number; per?: number}> = ({x, y, at, cols, rows, size = 46, per = 1.2}) => {
  const f = useCurrentFrame();
  const items = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const t0 = at + i * per;
      const o = prog(f, t0, 4);
      if (o <= 0) continue;
      const xx = x + c * size * 1.12;
      const yy = y - r * size * 0.92;
      items.push(
        <g key={i} opacity={o}>
          <rect x={xx} y={yy - size * 0.75} width={size} height={size * 0.75} fill={C.khaki} stroke={C.ink} strokeWidth={3} rx={2} />
          <line x1={xx} y1={yy - size * 0.5} x2={xx + size} y2={yy - size * 0.5} stroke={C.ink} strokeWidth={2} />
        </g>,
      );
    }
  return <g>{items}</g>;
};

// ---------------- vehicles ----------------
const truckParts: Part[] = [
  {pts: [[-200, -40], [60, -40], [60, -170], [-200, -170]], closed: true, fill: C.olive, gap: 12},
  {pts: [[-200, -170], [-190, -200], [50, -200], [60, -170]], closed: true, fill: C.khaki, gap: 9},
  {pts: [[60, -40], [60, -140], [140, -140], [170, -95], [200, -90], [200, -40]], closed: true, fill: C.olive, gap: 10},
  {pts: [[78, -132], [128, -132], [150, -100], [78, -100]], closed: true, fill: '#BFE3F5', solid: true},
  {pts: circPts(-140, -38, 34, 16), closed: true, fill: C.ink, solid: true},
  {pts: circPts(-60, -38, 34, 16), closed: true, fill: C.ink, solid: true},
  {pts: circPts(140, -38, 34, 16), closed: true, fill: C.ink, solid: true},
];
export const Truck: React.FC<IP & {star?: boolean; label?: string; shake?: boolean}> = ({x, y, at, s = 1, dur = 22, star = true, label, shake = false}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const sy = shake ? Math.sin(f * 1.7) * 1.5 : 0;
  const o = prog(f, at + dur, 6);
  return (
    <G x={x} y={y + sy} s={s}>
      <Drawing parts={truckParts} at={at} dur={dur} seed={41} />
      {star ? <path d={starPath(110, -70, 16)} fill={C.white} stroke={C.ink} strokeWidth={2} opacity={o} /> : null}
      {label ? txt(label, -70, -95, 34, o, C.ink, FONT_TITLE) : null}
    </G>
  );
};

export const starPath = (cx: number, cy: number, r: number) => {
  const p = starPts(cx, cy, r, r * 0.42);
  return `M${p.map((q) => q.join(',')).join('L')}Z`;
};

const tankParts: Part[] = [
  {pts: roundRectPts(-210, -70, 420, 74, 34), closed: true, fill: '#4A4A3A', gap: 10},
  {pts: [[-190, -70], [-160, -130], [170, -130], [200, -70]], closed: true, fill: C.olive, gap: 11},
  {pts: [[-90, -130], [-70, -190], [70, -190], [90, -130]], closed: true, fill: C.olive, gap: 10},
  {pts: [[70, -165], [290, -165]], w: 12},
  ...[-150, -80, -10, 60, 130].map((cx) => ({pts: circPts(cx, -33, 22, 12), closed: true} as Part)),
];
export const Tank: React.FC<IP & {side?: 'us' | 'de'}> = ({x, y, at, s = 1, dur = 24, side = 'us'}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => (side === 'us' ? tankParts : tankParts.map((p) => (p.fill === C.olive ? {...p, fill: C.steel} : p))), [side]);
  if (f < at) return null;
  const o = prog(f, at + dur, 6);
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={dur} seed={side === 'us' ? 51 : 52} />
      {side === 'us' ? (
        <g opacity={o}>
          <circle cx={0} cy={-100} r={22} fill="none" stroke={C.white} strokeWidth={4} />
          <path d={starPath(0, -100, 20)} fill={C.white} />
        </g>
      ) : (
        <g opacity={o}>
          <Balkenkreuz x={0} y={-100} s={0.8} />
        </g>
      )}
    </G>
  );
};

export const Balkenkreuz: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-8,-30 H8 V-8 H30 V8 H8 V30 H-8 V8 H-30 V-8 H-8 Z" fill={C.white} />
    <path d="M-5,-27 H5 V-5 H27 V5 H5 V27 H-5 V5 H-27 V-5 H-5 Z" fill={C.ink} />
  </g>
);

export const Jerrycan = mk([{pts: [[-40, -60], [30, -60], [40, -50], [40, 60], [-40, 60]], closed: true, fill: C.olive, gap: 9}, {pts: [[-30, -50], [30, 50]], w: 4}, {pts: [[30, -50], [-30, 50]], w: 4}, {pts: [[-26, -60], [-26, -82], [10, -82], [10, -60]], w: 6}], 12);

export const Gauge: React.FC<IP & {level: number; levelFrom?: number; levelAt?: number}> = ({x, y, at, s = 1, level, levelFrom = 1, levelAt}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [...ellPts(0, 0, 120, 120, 20, Math.PI, Math.PI * 2), [120, 20], [-120, 20]], closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  const lv = levelAt === undefined ? level : levelFrom + (level - levelFrom) * prog(f, levelAt, 18);
  const a = Math.PI + Math.PI * lv;
  const o = prog(f, at + 12, 6);
  const flash = levelAt !== undefined && f > levelAt + 18 && lv < 0.1 && Math.floor(f / 6) % 2 === 0;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={61} />
      <g opacity={o}>
        {txt('E', -95, -12, 40, 1, C.red, FONT_TITLE)}
        {txt('F', 95, -12, 40, 1, C.ink, FONT_TITLE)}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const aa = Math.PI + Math.PI * t;
          return <line key={t} x1={Math.cos(aa) * 92} y1={Math.sin(aa) * 92} x2={Math.cos(aa) * 112} y2={Math.sin(aa) * 112} stroke={C.ink} strokeWidth={5} />;
        })}
        <line x1={0} y1={0} x2={Math.cos(a) * 90} y2={Math.sin(a) * 90} stroke={flash ? C.red : C.ink} strokeWidth={8} strokeLinecap="round" />
        <circle cx={0} cy={0} r={10} fill={C.ink} />
        {txt('FUEL', 0, -40, 30, 1, C.ink, FONT_TITLE)}
      </g>
    </G>
  );
};

export const Explosion: React.FC<IP> = ({x, y, at, s = 1}) => {
  const f = useCurrentFrame();
  const sc = popScale(f, at, 8);
  const fade = 1 - prog(f, at + 26, 10);
  const outer = useMemo(() => markerPath(starPts(0, 0, 80, 52, 9), true, seedOf('ex', x, y), 4), [x, y]);
  const inner = useMemo(() => markerPath(starPts(0, 0, 46, 30, 7), true, seedOf('ex2', x, y), 3), [x, y]);
  if (sc <= 0 || fade <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${sc * s})`} opacity={fade}>
      <path d={outer} fill={C.orange} stroke={C.ink} strokeWidth={5} />
      <path d={inner} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
    </g>
  );
};

export const RedBall: React.FC<IP> = ({x, y, at, s = 1}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: circPts(0, 0, 110, 28), closed: true, fill: C.red, gap: 11}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={14} seed={71} />
    </G>
  );
};

// ---------------- time ----------------
export const Clock: React.FC<IP & {spin?: number; segments?: number; segAt?: number}> = ({x, y, at, s = 1, spin = 1, segments = 0, segAt = 0}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: circPts(0, 0, 100, 26), closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  const o = prog(f, at + 12, 6);
  const t = (f - at) * 0.05 * spin;
  const segColors = [C.yellow, C.orange, C.blue];
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={81} />
      {Array.from({length: segments}).map((_, i) => {
        const p = prog(f, segAt + i * 8, 8);
        if (p <= 0) return null;
        const a0 = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        const a1 = a0 + ((Math.PI * 2) / 3) * p;
        const pts = [[0, 0], ...ellPts(0, 0, 92, 92, 10, a0, a1)] as Pt[];
        return <path key={i} d={`M${pts.map((q) => q.join(',')).join('L')}Z`} fill={segColors[i]} opacity={0.55} />;
      })}
      <g opacity={o}>
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.cos(a) * 80} y1={Math.sin(a) * 80} x2={Math.cos(a) * 92} y2={Math.sin(a) * 92} stroke={C.ink} strokeWidth={4} />;
        })}
        <line x1={0} y1={0} x2={Math.cos(t - 1.57) * 70} y2={Math.sin(t - 1.57) * 70} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.cos(t / 12) * 46} y2={Math.sin(t / 12) * 46} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
        <circle r={8} fill={C.red} />
      </g>
    </G>
  );
};

export const Calendar: React.FC<IP & {text: string; sub?: string; flip?: number; flipAt?: number; w?: number}> = ({x, y, at, s = 1, text, sub, flip = 0, flipAt = 0, w = 220}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-w / 2, -80, w, 170), closed: true, fill: C.white, solid: true}, {pts: rectPts(-w / 2, -80, w, 46), closed: true, fill: C.red, gap: 8}], [w]);
  if (f < at) return null;
  const o = prog(f, at + 12, 6);
  const pages = flip ? Math.min(flip, Math.max(0, Math.floor((f - flipAt) / 7))) : 0;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={seedOf('cal', text)} />
      <g opacity={o}>
        <text x={0} y={36} fontFamily={FONT_TITLE} fontSize={text.length > 6 ? 40 : 56} textAnchor="middle" fill={C.ink}>
          {text}
        </text>
        {sub ? txt(sub, 0, 76, 30, 1) : null}
        {pages > 0 ? txt(`+${pages} DAY${pages > 1 ? 'S' : ''}`, 0, 140, 34, 1, C.red, FONT_TITLE) : null}
      </g>
    </G>
  );
};

export const Speedo: React.FC<IP & {from: number; to: number; moveAt: number}> = ({x, y, at, s = 1, from, to, moveAt}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [...ellPts(0, 0, 130, 130, 20, Math.PI, Math.PI * 2), [130, 16], [-130, 16]], closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  const v = from + (to - from) * prog(f, moveAt, 14);
  const a = Math.PI + Math.PI * (v / 80);
  const o = prog(f, at + 12, 6);
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={91} />
      <g opacity={o}>
        {[0, 20, 40, 60, 80].map((n) => {
          const aa = Math.PI + Math.PI * (n / 80);
          return (
            <g key={n}>
              <line x1={Math.cos(aa) * 100} y1={Math.sin(aa) * 100} x2={Math.cos(aa) * 122} y2={Math.sin(aa) * 122} stroke={C.ink} strokeWidth={5} />
              {txt(String(n), Math.cos(aa) * 76, Math.sin(aa) * 76 + 10, 30, 1, n >= 60 ? C.red : C.ink, FONT_TITLE)}
            </g>
          );
        })}
        <line x1={0} y1={0} x2={Math.cos(a) * 104} y2={Math.sin(a) * 104} stroke={v > 55 ? C.red : C.ink} strokeWidth={8} strokeLinecap="round" />
        <circle r={10} fill={C.ink} />
        {txt('MPH', 0, -30, 28, 1, C.ink, FONT_TITLE)}
      </g>
    </G>
  );
};

// ---------------- mail ----------------
export const Envelope: React.FC<IP & {heart?: boolean; addr?: string; stamp?: string; stampAt?: number}> = ({x, y, at, s = 1, heart = false, addr, stamp, stampAt = 0, dur = 14}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-110, -70, 220, 140), closed: true, fill: C.white, solid: true}, {pts: [[-110, -70], [0, 10], [110, -70]], w: 5}], []);
  if (f < at) return null;
  const o = prog(f, at + dur, 6);
  const so = stamp ? popScale(f, stampAt, 8) : 0;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={dur} seed={101} />
      {heart ? <path d="M0,40 C-30,10 -40,30 -20,48 L0,64 L20,48 C40,30 30,10 0,40Z" fill={C.red} opacity={o} transform="translate(60,-6) scale(0.7)" /> : null}
      {addr ? txt(addr, 0, 52, 30, o, C.ink) : null}
      {stamp && so > 0 ? (
        <g transform={`rotate(-14) scale(${so})`}>
          <rect x={-150} y={-32} width={300} height={64} fill="none" stroke={C.red} strokeWidth={6} rx={6} />
          {txt(stamp, 0, 14, 38, 1, C.red, FONT_TITLE)}
        </g>
      ) : null}
    </G>
  );
};

export const MailSack: React.FC<IP & {label?: boolean}> = ({x, y, at, s = 1, dur = 12, label = true}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [[-60, 0], [-70, -70], [-40, -120], [-20, -130], [20, -130], [40, -120], [70, -70], [60, 0]], closed: true, fill: C.khaki, gap: 10}, {pts: [[-24, -128], [24, -128]], w: 7}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={dur} seed={111} />
      {label ? txt('U.S. MAIL', 0, -50, 26, prog(f, at + dur, 5), C.ink, FONT_TITLE) : null}
    </G>
  );
};

export const SackPile: React.FC<IP & {count: number; per?: number; cols?: number; shrink?: number; shrinkAt?: number}> = ({x, y, at, count, s = 1, per = 1.5, cols = 10, shrink = 1, shrinkAt = 0}) => {
  const f = useCurrentFrame();
  const out = [];
  // pyramid layout
  let i = 0;
  let row = 0;
  let inRow = cols;
  while (i < count) {
    for (let c = 0; c < inRow && i < count; c++, i++) {
      const xx = x + (c - (inRow - 1) / 2) * 62 * s;
      const yy = y - row * 54 * s;
      const t0 = at + i * per;
      const o = prog(f, t0, 4);
      if (o <= 0) continue;
      out.push(
        <g key={i} opacity={o} transform={`translate(${xx},${yy}) scale(${s * 0.5})`}>
          <path d="M-60,0 L-70,-70 L-40,-120 L40,-120 L70,-70 L60,0 Z" fill={C.khaki} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
          <line x1={-24} y1={-118} x2={24} y2={-118} stroke={C.ink} strokeWidth={7} />
        </g>,
      );
    }
    row++;
    inRow = Math.max(1, inRow - 1);
  }
  const sc = shrink === 1 ? 1 : 1 - (1 - shrink) * prog(f, shrinkAt, 30);
  return <g transform={`translate(${x},${y}) scale(${sc}) translate(${-x},${-y})`}>{out}</g>;
};

export const FilmReel = mk([{pts: circPts(0, 0, 70, 22), closed: true, fill: C.steel, gap: 9}, {pts: circPts(0, 0, 14, 10), closed: true, fill: C.white, solid: true}, ...[0, 1, 2, 3, 4].map((i) => ({pts: circPts(Math.cos((i * Math.PI * 2) / 5) * 40, Math.sin((i * Math.PI * 2) / 5) * 40, 11, 8), closed: true, fill: C.white, solid: true} as Part))], 14);
export const Camera = mk([{pts: rectPts(-80, -50, 160, 100), closed: true, fill: C.ink, gap: 9}, {pts: circPts(0, 0, 34, 16), closed: true, fill: C.steel, solid: true}, {pts: rectPts(-60, -70, 40, 20), closed: true}], 12);

export const Scale: React.FC<IP & {reading: string; readAt?: number}> = ({x, y, at, s = 1, reading, readAt}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-120, -30, 240, 50), closed: true, fill: C.steel, gap: 10}, {pts: [[-90, 20], [-100, 50]], w: 7}, {pts: [[90, 20], [100, 50]], w: 7}, {pts: rectPts(-120, -120, 240, 80), closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={14} seed={121} />
      {txt(reading, 0, -64, 50, prog(f, readAt ?? at + 14, 6), C.red, FONT_TITLE)}
    </G>
  );
};

export const Warehouse = mk([{pts: [[-260, 0], [-260, -200], [0, -300], [260, -200], [260, 0]], closed: true, fill: C.khaki, gap: 14}, {pts: rectPts(-60, -130, 120, 130), closed: true, fill: '#5B4636', solid: true}], 22);

export const Magnifier = mk([{pts: circPts(0, 0, 50, 18), closed: true, fill: '#BFE3F5', solid: true}, {pts: [[36, 36], [100, 100]], w: 14, color: C.brown}], 10);

// ---------------- medical ----------------
export const Stretcher = mk([{pts: [[-130, 0], [130, 0]], w: 7, color: C.brown}, {pts: [[-110, 0], [110, 0], [100, -16], [-100, -16]], closed: true, fill: C.khaki, gap: 7}], 10);
export const Bottle: React.FC<IP & {label: string}> = ({x, y, at, s = 1, label}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [[-40, 0], [-40, -110], [-20, -140], [20, -140], [40, -110], [40, 0]], closed: true, fill: '#F6E6A6', gap: 9}, {pts: rectPts(-18, -168, 36, 28), closed: true, fill: C.steel, solid: true}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={seedOf('bt', label)} />
      {txt(label, 0, 34, 30, prog(f, at + 12, 5), C.ink, FONT_TITLE)}
    </G>
  );
};
export const Bag: React.FC<IP & {label?: string}> = ({x, y, at, s = 1, label = 'MEDIC'}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: roundRectPts(-80, -60, 160, 100, 14), closed: true, fill: C.olive, gap: 9}, {pts: [[-40, -60], [-30, -90], [30, -90], [40, -60]], w: 6}, {pts: rectPts(-50, -36, 100, 40), closed: true, fill: C.white, solid: true}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={131} />
      {txt(label, 0, -6, 30, prog(f, at + 12, 5), C.ink, FONT_TITLE)}
    </G>
  );
};

// ---------------- remembrance ----------------
export const HelmetGround = mk([{pts: [...ellPts(0, 0, 90, 70, 16, Math.PI, Math.PI * 2), [110, 8], [-110, 8]], closed: true, fill: C.olive, gap: 10}, {pts: [[-180, 14], [180, 14]], w: 5, color: C.mud}], 16);
export const DogTags: React.FC<IP & {split?: number; splitAt?: number}> = ({x, y, at, s = 1, split = 0, splitAt = 0}) => {
  const f = useCurrentFrame();
  const tag = useMemo<Part[]>(() => [{pts: roundRectPts(-46, -30, 92, 60, 16), closed: true, fill: C.grey, gap: 8}], []);
  if (f < at) return null;
  const p = split ? prog(f, splitAt, 22) : 0;
  return (
    <G x={x} y={y} s={s}>
      <path d="M-120,-140 Q0,-30 120,-140" stroke={C.steel} strokeWidth={4} fill="none" strokeDasharray="6 6" opacity={prog(f, at, 8) * (1 - p)} />
      <g transform="translate(-50,0) rotate(-8)">
        <Drawing parts={tag} at={at + 4} dur={10} seed={141} />
      </g>
      <g transform={`translate(${50 + p * split},${p * 20}) rotate(${10 - p * 10})`}>
        <Drawing parts={tag} at={at + 8} dur={10} seed={142} />
      </g>
    </G>
  );
};
export const Folder: React.FC<IP & {label: string}> = ({x, y, at, s = 1, label}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [[-120, -80], [-40, -80], [-24, -60], [120, -60], [120, 80], [-120, 80]], closed: true, fill: C.khaki, gap: 10}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={seedOf('fold', label)} />
      {txt(label, 0, 20, 40, prog(f, at + 12, 5), C.ink, FONT_TITLE)}
    </G>
  );
};
export const Ship = mk([{pts: [[-150, -20], [150, -20], [110, 40], [-120, 40]], closed: true, fill: C.steel, gap: 10}, {pts: rectPts(-60, -70, 100, 50), closed: true, fill: C.white, solid: true}, {pts: rectPts(-10, -110, 26, 40), closed: true, fill: C.red, gap: 6}], 14);
export const Graves: React.FC<IP & {rows?: number; cols?: number; per?: number}> = ({x, y, at, rows = 4, cols = 14, per = 1.2}) => {
  const f = useCurrentFrame();
  const out = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      const sc = 0.55 + r * 0.15;
      const xx = x + (c - (cols - 1) / 2) * 84 * sc + (r % 2) * 20;
      const yy = y + r * 78;
      const o = prog(f, at + i * per, 6);
      if (o <= 0) continue;
      const star = (c * 7 + r * 3) % 11 === 4;
      out.push(
        <g key={i} transform={`translate(${xx},${yy}) scale(${sc})`} opacity={o}>
          {star ? (
            <g fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round">
              <path d="M0,-70 L22,-32 L-22,-32 Z" />
              <path d="M0,-18 L22,-56 L-22,-56 Z" />
              <rect x={-4} y={-18} width={8} height={18} />
            </g>
          ) : (
            <path d="M-7,0 V-50 H-24 V-62 H-7 V-80 H7 V-62 H24 V-50 H7 V0 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          )}
        </g>,
      );
    }
  }
  return <g>{out}</g>;
};

// ---------------- replacements ----------------
export const Notice: React.FC<IP & {lines: string[]}> = ({x, y, at, s = 1, lines}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-260, -170, 520, 340), closed: true, fill: C.paper, solid: true}], []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={12} seed={151} />
      <circle cx={0} cy={-150} r={12} fill={C.red} stroke={C.ink} strokeWidth={3} opacity={prog(f, at + 10, 4)} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-70 + i * 72} fontFamily={FONT_TITLE} fontSize={i === 0 ? 56 : 46} textAnchor="middle" fill={i === 0 ? C.red : C.ink}>
          {[...l].map((ch, k) => (
            <tspan key={k} opacity={f >= at + 14 + i * 16 + k * 1.2 ? 1 : 0}>
              {ch}
            </tspan>
          ))}
        </text>
      ))}
    </G>
  );
};
export const Sleeve: React.FC<IP & {eraseAt: number}> = ({x, y, at, s = 1, eraseAt}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: [[-180, -110], [140, -130], [170, 110], [-160, 130]], closed: true, fill: C.olive, gap: 12}], []);
  const chev = useMemo(() => [0, 1, 2].map((i) => markerPath([[-90, -20 + i * 46], [0, -64 + i * 46], [90, -20 + i * 46]], false, seedOf('chev', i), 1.5)), []);
  if (f < at) return null;
  const e = prog(f, eraseAt, 14);
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={14} seed={161} />
      <g opacity={1 - e}>
        {chev.map((d, i) => (
          <Stroke key={i} d={d} at={at + 14 + i * 5} dur={8} color={C.yellow} w={16} />
        ))}
      </g>
      {e > 0 && e < 1 ? <rect x={-120 + 240 * e - 40} y={-80} width={80} height={160} rx={18} fill={C.white} stroke={C.ink} strokeWidth={4} /> : null}
    </G>
  );
};
export const Wall: React.FC<IP & {crackAt: number; label?: string}> = ({x, y, at, s = 1, crackAt, label = 'SEGREGATION'}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => {
    const p: Part[] = [{pts: rectPts(-260, -160, 520, 220), closed: true, fill: '#C46A4A', gap: 13}];
    for (let r = 1; r < 4; r++) p.push({pts: [[-260, -160 + r * 55], [260, -160 + r * 55]], w: 3});
    return p;
  }, []);
  const crack = useMemo(() => markerPath([[10, -160], [-12, -110], [20, -70], [-6, -20], [16, 30], [0, 60]], false, seedOf('crack'), 1), []);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={16} seed={171} />
      {txt(label, 0, -60, 52, prog(f, at + 16, 6), C.white, FONT_TITLE)}
      <Stroke d={crack} at={crackAt} dur={10} w={9} />
    </G>
  );
};

// ---------------- the enemy's tail ----------------
export const HorseWagon: React.FC<IP & {gun?: boolean}> = ({x, y, at, s = 1, gun = true, dur = 26}) => {
  const f = useCurrentFrame();
  const horse = useMemo<Part[]>(() => [
    {pts: ellPts(0, -120, 95, 45, 20), closed: true, fill: '#8A6A4A', gap: 10},
    {pts: [[70, -140], [110, -210], [150, -220], [160, -196], [120, -170], [96, -120]], closed: true, fill: '#8A6A4A', gap: 9},
    {pts: [[-60, -90], [-66, 0]], w: 8},
    {pts: [[-30, -86], [-24, 0]], w: 8},
    {pts: [[40, -86], [34, 0]], w: 8},
    {pts: [[70, -92], [78, 0]], w: 8},
    {pts: [[-94, -130], [-130, -70]], w: 7},
  ], []);
  const wagon = useMemo<Part[]>(() => [
    {pts: rectPts(-480, -150, 300, 90), closed: true, fill: C.steel, gap: 11},
    {pts: [[-180, -110], [-60, -110]], w: 6},
    {pts: circPts(-430, -50, 46, 16), closed: true},
    {pts: circPts(-230, -50, 46, 16), closed: true},
    ...(gun ? [{pts: [[-420, -150], [-300, -200]], w: 14} as Part] : []),
  ], [gun]);
  if (f < at) return null;
  const walk = Math.sin(f / 5) * 2;
  return (
    <G x={x} y={y + walk} s={s}>
      <Drawing parts={wagon} at={at} dur={dur * 0.5} seed={181} />
      <Drawing parts={horse} at={at + dur * 0.4} dur={dur * 0.6} seed={182} />
      <circle cx={130} cy={-200} r={5} fill={C.ink} opacity={prog(f, at + dur, 4)} />
    </G>
  );
};
export const HayBale: React.FC<IP & {eatAt?: number}> = ({x, y, at, s = 1, eatAt}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: roundRectPts(-90, -70, 180, 70, 14), closed: true, fill: C.yellow, gap: 9}, {pts: [[-40, -70], [-40, 0]], w: 4}, {pts: [[40, -70], [40, 0]], w: 4}], []);
  if (f < at) return null;
  const sc = eatAt === undefined ? 1 : 1 - 0.6 * prog(f, eatAt, 60);
  return (
    <G x={x} y={y} s={s * sc}>
      <Drawing parts={parts} at={at} dur={12} seed={191} />
    </G>
  );
};
export const FilmFrame = mk([{pts: rectPts(-360, -220, 720, 440), closed: true}, ...[-300, -180, -60, 60, 180, 300].map((xx) => ({pts: rectPts(xx - 18, -206, 36, 22), closed: true, fill: C.ink, solid: true} as Part)), ...[-300, -180, -60, 60, 180, 300].map((xx) => ({pts: rectPts(xx - 18, 184, 36, 22), closed: true, fill: C.ink, solid: true} as Part))], 18);

// ---------------- signs, symbols ----------------
export const Sign: React.FC<IP & {text: string; color?: string; w?: number}> = ({x, y, at, s = 1, text, color = C.white, w = 220}) => {
  const f = useCurrentFrame();
  const parts = useMemo<Part[]>(() => [{pts: rectPts(-w / 2, -70, w, 110), closed: true, fill: color, solid: true}, {pts: [[0, 40], [0, 170]], w: 8}], [w, color]);
  if (f < at) return null;
  return (
    <G x={x} y={y} s={s}>
      <Drawing parts={parts} at={at} dur={10} seed={seedOf('sign', text)} />
      {txt(text, 0, 6, 50, prog(f, at + 10, 5), color === C.red ? C.white : C.ink, FONT_TITLE)}
    </G>
  );
};
export const Stop: React.FC<IP> = ({x, y, at, s = 1}) => {
  const f = useCurrentFrame();
  const sc = popScale(f, at, 9);
  if (sc <= 0) return null;
  const pts = Array.from({length: 8}).map((_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return [Math.cos(a) * 80, Math.sin(a) * 80];
  });
  return (
    <g transform={`translate(${x},${y}) scale(${sc * s})`}>
      <path d={`M${pts.map((q) => q.join(',')).join('L')}Z`} fill={C.red} stroke={C.ink} strokeWidth={6} />
      <text x={0} y={16} fontFamily={FONT_TITLE} fontSize={46} fill={C.white} textAnchor="middle">
        STOP
      </text>
    </g>
  );
};
export const Sun: React.FC<IP & {moon?: number}> = ({x, y, at, s = 1, moon = 0}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 8);
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <g opacity={1 - moon}>
        <circle r={44} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
        {Array.from({length: 8}).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={Math.cos(a) * 58} y1={Math.sin(a) * 58} x2={Math.cos(a) * 78} y2={Math.sin(a) * 78} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />;
        })}
      </g>
      <g opacity={moon}>
        <path d="M10,-44 A44,44 0 1,0 10,44 A34,34 0 1,1 10,-44Z" fill="#E9E4C8" stroke={C.ink} strokeWidth={5} />
      </g>
    </g>
  );
};
export const Bars: React.FC<IP & {values: {label: string; v: number; color: string}[]; max: number; h?: number}> = ({x, y, at, values, max, h = 300}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {values.map((b, i) => {
        const p = prog(f, at + i * 12, 16);
        if (p <= 0) return null;
        const bh = (b.v / max) * h * p;
        const bx = x + i * 220;
        return (
          <g key={i}>
            <rect x={bx} y={y - bh} width={140} height={bh} fill={b.color} stroke={C.ink} strokeWidth={5} />
            {txt(b.label, bx + 70, y + 50, 40, 1, C.ink, FONT_TITLE)}
          </g>
        );
      })}
    </g>
  );
};
