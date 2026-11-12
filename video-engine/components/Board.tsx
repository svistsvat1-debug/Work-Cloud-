import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, W, H} from './theme';
import {clamp01, easeInOut, outAlpha, pop, PathDraw} from './draw';
import {MText, measure} from './text';
import {ACC_DUR, Accent} from './motion';
import {GI} from './GI';
import {Ship} from './Ship';
import {GeoMap} from './GeoMap';
import {Icon, Burst, Arrow, Counter, Calendar, Stamp, BigX, Check, Bar, VBar, Card, Crowd, Tents, Clock, Quote, EraserWipe, SquadRow} from './fx';
import {BoardBuilt, El, drawDur} from './types';
import {hashStr, wobble, toPath, ellipse, rect} from './rough';

const fr = (s: number) => Math.round(s * FPS);

// visual centre of an element, for pulse / wiggle accents
function pivotOf(e: El): [number, number] {
  const hor = (x: number, wd: number, anchor: string) => (anchor === 'start' ? x + wd / 2 : anchor === 'end' ? x - wd / 2 : x);
  if (e.k === 'text') {
    const size = e.size ?? 48;
    const lines = String(e.text).split('\n');
    const wd = Math.max(...lines.map((l) => measure(l, size, e.font ?? 'label')));
    return [hor(e.x, wd, e.anchor ?? 'middle'), e.y - size * 0.35 + ((lines.length - 1) * size * 1.12) / 2];
  }
  if (e.k === 'counter') {
    const size = e.size ?? 110;
    const wd = measure(`${e.prefix ?? ''}${e.to}${e.suffix ?? ''}`, size, e.font ?? 'title');
    return [hor(e.x, wd, e.anchor ?? 'middle'), e.y - size * 0.35];
  }
  return [e.x ?? 0, e.y ?? 0];
}

// automatic accents (MOTION RULE): returns an SVG transform and, for 'ul', the underline progress
function accentState(e: El, f: number): {tf: string; ul?: number} {
  let tf = '';
  let ul: number | undefined;
  for (const a of (e.acc || []) as Accent[]) {
    const a0 = fr(a.t);
    if (a.type === 'ul') {
      if (f >= a0) ul = clamp01((f - a0) / 10);
      continue;
    }
    const u = (f - a0) / fr(ACC_DUR);
    if (u < 0 || u > 1) continue;
    const env = Math.sin(Math.PI * u);
    if (a.type === 'hop') {
      tf = `translate(0 ${(-16 * (e.s ?? 1) * env).toFixed(2)})`;
      continue;
    }
    const [px, py] = pivotOf(e);
    if (a.type === 'pulse') {
      const sc = 1 + (e.k === 'card' || e.k === 'cal' ? 0.06 : 0.1) * env;
      tf = `translate(${px} ${py}) scale(${sc.toFixed(4)}) translate(${-px} ${-py})`;
    } else if (a.type === 'wiggle') {
      tf = `rotate(${(5 * Math.sin(u * Math.PI * 4) * (1 - u)).toFixed(3)} ${px} ${py})`;
    }
  }
  return {tf, ul};
}

function moodAt(e: El, f: number) {
  let m = e.mood;
  for (const [t, mm] of (e.moods || []) as [number, string][]) if (f >= fr(t)) m = mm;
  return m;
}

const RoughEllipse: React.FC<{f: number; inF: number; dF: number; x: number; y: number; rx: number; ry: number; seed: number; color?: string; w?: number}> = ({f, inF, dF, x, y, rx, ry, seed, color = C.red, w = 8}) => {
  const d = React.useMemo(() => toPath(wobble(ellipse(x, y, rx, ry).pts, seed, 3, true)), [x, y, rx, ry, seed]);
  return <PathDraw d={d} p={clamp01((f - inF) / Math.max(1, dF))} color={color} w={w} />;
};

const RoughRect: React.FC<{f: number; inF: number; dF: number; x: number; y: number; w: number; h: number; seed: number; color?: string; fill?: string; label?: string; labelSize?: number; sw?: number}> = ({f, inF, dF, x, y, w, h, seed, color = C.ink, fill, label, labelSize = 48, sw = 6}) => {
  const d = React.useMemo(() => toPath(wobble(rect(x - w / 2, y - h / 2, w, h).pts, seed, 2, true)), [x, y, w, h, seed]);
  const p = clamp01((f - inF) / Math.max(1, dF));
  return (
    <g>
      {fill ? <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={fill} opacity={0.3 * clamp01(p * 2 - 1)} /> : null}
      <PathDraw d={d} p={p} color={color} w={sw} />
      {label ? <MText text={label} x={x} y={y - h / 2 + labelSize + 8} size={labelSize} font="title" anchor="middle" p={clamp01((p - 0.5) * 2)} /> : null}
    </g>
  );
};

const Bubble: React.FC<{f: number; inF: number; x: number; y: number; w: number; h: number; text: string; size?: number; tail?: [number, number]; seed: number}> = ({f, inF, x, y, w, h, text, size = 52, tail = [-60, 90], seed}) => {
  const s = pop(f, inF);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} fill={C.white} stroke={C.ink} strokeWidth={5} />
      <path d={`M${tail[0] * 0.4},${h / 2 - 8} L${tail[0]},${tail[1]} L${tail[0] * 0.1 + 20},${h / 2 - 4}`} fill={C.white} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <MText text={text} x={0} y={size * 0.35} size={size} font="title" anchor="middle" p={clamp01((f - inF - 4) / 14)} seed={seed} />
    </g>
  );
};

// free dashed route in screen coordinates, with a little ship at its head
const Route: React.FC<{f: number; inF: number; dF: number; pts: [number, number][]; seed: number; color?: string; ship?: boolean}> = ({f, inF, dF, pts, seed, color = C.blue, ship = true}) => {
  const d = React.useMemo(() => toPath(wobble(pts, seed, 2)), [pts, seed]);
  const rp = easeInOut(clamp01((f - inF) / Math.max(1, dF)));
  const id = `rt${seed}`;
  const seg = pts.length - 1;
  const u = rp * seg;
  const k = Math.min(seg - 1, Math.floor(u));
  const t = u - k;
  const hx = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t;
  const hy = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t;
  return (
    <g>
      <mask id={id}>
        <path d={d} fill="none" stroke="white" strokeWidth={16} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rp} />
      </mask>
      <path d={d} fill="none" stroke={color} strokeWidth={6} strokeDasharray="16 13" strokeLinecap="round" mask={`url(#${id})`} />
      {ship && rp > 0 && rp < 1.01 ? <path transform={`translate(${hx} ${hy - 14})`} d="M-34,0 L34,0 L25,14 L-27,14Z M-9,0 L-9,-16 L12,-16 L12,0" fill={C.steel} stroke={C.ink} strokeWidth={3} /> : null}
    </g>
  );
};

export const ElView: React.FC<{e: El; f: number; seed: number}> = ({e, f, seed}) => {
  const inF = fr(e.at);
  const dF = Math.max(1, fr(drawDur(e)));
  const outF = e.out !== undefined ? fr(e.out) : undefined;
  if (f < inF - 1) return null;
  if (outF !== undefined && f > outF + 10) return null;
  const a = outAlpha(f, outF);
  const p = clamp01((f - inF) / dF);
  const acc = accentState(e, f);
  let node: React.ReactNode = null;
  switch (e.k) {
    case 'title':
      node = <MText text={e.text} x={e.x ?? 90} y={e.y ?? 125} size={e.size ?? 66} font="title" p={p} ul={clamp01((f - inF - dF) / 10)} seed={seed} />;
      break;
    case 'text':
      node = (
        <MText text={e.text} x={e.x} y={e.y} size={e.size ?? 48} font={e.font ?? 'label'} color={e.color} anchor={e.anchor ?? 'middle'} p={p} ul={e.ul ? clamp01((f - inF - dF) / 10) : acc.ul} seed={seed} rot={e.rot} />
      );
      break;
    case 'gi':
      node = <GI f={f} inF={inF} dF={dF} x={e.x} y={e.y} s={e.s} v={e.v} mood={moodAt(e, f)} pose={e.pose} bust={e.bust} flip={e.flip} seed={seed} sweat={e.sweat !== undefined ? fr(e.sweat) : undefined} hold={e.hold} holdF={e.holdAt !== undefined ? fr(e.holdAt) : undefined} stripes={e.stripes} label={e.label} />;
      break;
    case 'icon':
      node = <Icon f={f} inF={inF} dF={dF} name={e.name} x={e.x} y={e.y} s={e.s} rot={e.rot} seed={seed} fill={e.fill} fill2={e.fill2} popIn={e.pop} label={e.label} labelDy={e.labelDy} />;
      break;
    case 'ship':
      node = <Ship f={f} inF={inF} dF={dF} x={e.x} y={e.y} s={e.s} type={e.type} seed={seed} label={e.label} flip={e.flip} smoke={e.smoke ?? true} wave={e.wave ?? true} />;
      break;
    case 'map': {
      const cv = <T extends {at: number}>(xs?: T[]) => (xs || []).map((o) => ({...o, at: fr(o.at), out: (o as unknown as {out?: number}).out !== undefined ? fr((o as unknown as {out: number}).out) : undefined}));
      node = (
        <GeoMap f={f} inF={inF} dF={dF} region={e.region} x={e.x} y={e.y} w={e.w} h={e.h} seed={seed} fills={e.fills} fillAt={e.fillAt !== undefined ? fr(e.fillAt) : undefined} inkFrom={e.inkFrom} labels={cv(e.labels)} dots={cv(e.dots)} arrows={cv(e.arrows)} routes={((e.routes || []) as {pts: [number, number][]; at: number; dur?: number; color?: string; ship?: boolean}[]).map((r) => ({...r, at: fr(r.at), dur: r.dur !== undefined ? fr(r.dur) : undefined}))} frame={e.frame ?? true} />
      );
      break;
    }
    case 'arrow':
      node = <Arrow f={f} inF={inF} dF={dF} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} bend={e.bend} color={e.color} seed={seed} label={e.label} lx={e.lx} ly={e.ly} />;
      break;
    case 'burst':
      node = <Burst f={f} inF={inF} x={e.x} y={e.y} r={e.r} />;
      break;
    case 'counter':
      node = <Counter f={f} inF={inF} dF={dF} x={e.x} y={e.y} from={e.from} to={e.to} size={e.size} color={e.color} prefix={e.prefix} suffix={e.suffix} anchor={e.anchor} font={e.font} ul={e.ul} />;
      break;
    case 'cal':
      node = <Calendar f={f} inF={inF} x={e.x} y={e.y} s={e.s} top={e.top} big={e.big} bottom={e.bottom} seed={seed} flipAt={e.flipAt !== undefined ? fr(e.flipAt) : undefined} top2={e.top2} big2={e.big2} bottom2={e.bottom2} />;
      break;
    case 'stamp':
      node = <Stamp f={f} inF={inF} x={e.x} y={e.y} text={e.text} rot={e.rot} color={e.color} size={e.size} />;
      break;
    case 'bigx':
      node = <BigX f={f} inF={inF} x={e.x} y={e.y} w={e.w} h={e.h} seed={seed} />;
      break;
    case 'check':
      node = <Check f={f} inF={inF} x={e.x} y={e.y} s={e.s} seed={seed} />;
      break;
    case 'bar':
      node = <Bar f={f} inF={inF} x1={e.x1} x2={e.x2} y={e.y} label={e.label} seed={seed} steps={(e.steps || []).map((s: {at: number; y: number; label: string}) => ({...s, at: fr(s.at)}))} />;
      break;
    case 'vbar':
      node = <VBar f={f} inF={inF} x={e.x} y1={e.y1} y2={e.y2} label={e.label} seed={seed} steps={(e.steps || []).map((s: {at: number; x: number; label: string}) => ({...s, at: fr(s.at)}))} />;
      break;
    case 'card':
      node = <Card f={f} inF={inF} x={e.x} y={e.y} s={e.s} title={e.title} seed={seed} value={e.value} valueAt={e.valueAt !== undefined ? fr(e.valueAt) : undefined} hero={e.hero} mood={moodAt(e, f)} flipHome={e.home !== undefined ? fr(e.home) : undefined} dim={e.dim !== undefined ? fr(e.dim) : undefined} />;
      break;
    case 'crowd':
      node = <Crowd f={f} inF={inF} x={e.x} y={e.y} n={e.n} w={e.w} seed={seed} signs={e.signs} s={e.s} mood={e.mood} />;
      break;
    case 'tents':
      node = <Tents f={f} inF={inF} x={e.x} y={e.y} rows={e.rows} cols={e.cols} dx={e.dx} dy={e.dy} s={e.s} seed={seed} every={e.every} />;
      break;
    case 'clock':
      node = <Clock f={f} inF={inF} x={e.x} y={e.y} s={e.s} seed={seed} freezeAt={e.freeze !== undefined ? fr(e.freeze) : undefined} speed={e.speed} />;
      break;
    case 'quote':
      node = <Quote f={f} inF={inF} dF={dF} x={e.x} y={e.y} w={e.w} lines={e.lines} sign={e.sign} seed={seed} size={e.size} />;
      break;
    case 'squad':
      node = <SquadRow f={f} inF={inF} x={e.x} y={e.y} n={e.n} gap={e.gap} seed={seed} s={e.s} keep={e.keep} remove={(e.remove || []).map((r: {i: number; at: number}) => ({...r, at: fr(r.at)}))} />;
      break;
    case 'circle':
      node = <RoughEllipse f={f} inF={inF} dF={dF} x={e.x} y={e.y} rx={e.rx} ry={e.ry ?? e.rx} seed={seed} color={e.color} w={e.w} />;
      break;
    case 'rect':
      node = <RoughRect f={f} inF={inF} dF={dF} x={e.x} y={e.y} w={e.w} h={e.h} seed={seed} color={e.color} fill={e.fill} label={e.label} labelSize={e.labelSize} />;
      break;
    case 'line': {
      const d = toPath(wobble([[e.x1, e.y1], [e.x2, e.y2]], seed, 2));
      node = <PathDraw d={d} p={p} color={e.color ?? C.red} w={e.w ?? 10} />;
      break;
    }
    case 'bubble':
      node = <Bubble f={f} inF={inF} x={e.x} y={e.y} w={e.w} h={e.h} text={e.text} size={e.size} tail={e.tail} seed={seed} />;
      break;
    case 'route':
      node = <Route f={f} inF={inF} dF={dF} pts={e.pts} seed={seed} color={e.color} ship={e.ship ?? true} />;
      break;
    default:
      throw new Error('unknown element kind ' + e.k);
  }
  let tr = '';
  if (e.mv) {
    const [dx, dy, t0, d] = e.mv as [number, number, number, number];
    const m = easeInOut(clamp01((f - fr(t0)) / Math.max(1, fr(d))));
    tr = `translate(${dx * m} ${dy * m})`;
  }
  if (acc.tf) tr = `${tr} ${acc.tf}`.trim();
  return (
    <g opacity={a} transform={tr || undefined}>
      {node}
    </g>
  );
};

const TRANS = 16;

export const BoardView: React.FC<{b: BoardBuilt; f: number}> = ({b, f}) => {
  const s0 = fr(b.start);
  const s1 = fr(b.end);
  const prog = clamp01((f - s0) / Math.max(1, s1 - s0));
  let punch = 0; // camera punch-in accents (MOTION RULE fallback)
  for (const t of b.cam || []) {
    const u = (f - fr(t)) / fr(ACC_DUR + 0.1);
    if (u >= 0 && u <= 1) punch = Math.max(punch, Math.sin(Math.PI * u));
  }
  const z = 1 + (b.zoom ?? 0.03) * prog + 0.02 * punch;
  return (
    <g transform={`translate(${W / 2} ${H / 2}) scale(${z}) translate(${-W / 2 - 8 * prog} ${-H / 2})`}>
      {b.els.map((e, i) => (
        <ElView key={i} e={e} f={f} seed={(hashStr(`${b.idx}:${i}:${e.k}`) % 90000) + 7} />
      ))}
    </g>
  );
};

export const Boards: React.FC<{boards: BoardBuilt[]; showPaper?: boolean}> = ({boards, showPaper = true}) => {
  const f = useCurrentFrame();
  let cur = boards.findIndex((b) => f >= fr(b.start) && f < fr(b.end));
  if (cur < 0) cur = f < fr(boards[0].start) ? 0 : boards.length - 1;
  const b = boards[cur];
  const prev = cur > 0 ? boards[cur - 1] : null;
  const t = f - fr(b.start);
  const inTrans = prev && t >= 0 && t < TRANS && b.enter !== 'cut';
  const e = easeInOut(clamp01(t / TRANS));
  let content: React.ReactNode;
  if (inTrans && prev && b.enter === 'slide') {
    content = (
      <>
        <g transform={`translate(${-W * e} 0)`}>
          <BoardView b={prev} f={f} />
        </g>
        <g transform={`translate(${W * (1 - e)} 0)`}>
          <BoardView b={b} f={f} />
        </g>
      </>
    );
  } else if (inTrans && prev && b.enter === 'wipe') {
    const ex = -200 + (W + 400) * e;
    content = (
      <>
        <defs>
          <clipPath id={`wipe${cur}`}>
            <rect x={ex} y={0} width={W + 400} height={H} />
          </clipPath>
        </defs>
        <g clipPath={`url(#wipe${cur})`}>
          <BoardView b={prev} f={f} />
        </g>
        <BoardView b={b} f={f} />
        <EraserWipe x={ex} seed={cur} />
      </>
    );
  } else {
    content = <BoardView b={b} f={f} />;
  }
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {showPaper ? <Img src={staticFile('paper.png')} style={{position: 'absolute', width: W, height: H}} /> : null}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
        {content}
      </svg>
    </AbsoluteFill>
  );
};
