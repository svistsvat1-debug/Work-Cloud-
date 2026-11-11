import React from 'react';
import { ICONS } from './lib/icons';
import { Sketch, Write, Burst, Arrow, Cross, Check, Ink, Scribble, useT, clamp, easeInOut, prog } from './lib/draw';
import { Person } from './lib/people';
import { MapView, Dot, Clock, Dugout, Calendar, Thermometer, Tint, Frost, Smoke, Mover, Bubble, Trench, Bar, Box, Pie } from './lib/special';

// fade-out wrapper for `until`
const Until: React.FC<{ until?: number; from?: number; children: React.ReactNode }> = ({ until, from, children }) => {
  const t = useT();
  if (from != null && t < from) return null;
  if (until == null) return <>{children}</>;
  const k = 1 - clamp((t - until) / 0.3);
  if (k <= 0) return null;
  return <g opacity={k}>{children}</g>;
};

const Spin: React.FC<{ at: number; dur: number; deg: number; cx: number; cy: number; children: React.ReactNode }> = ({ at, dur, deg, cx, cy, children }) => {
  const t = useT();
  const a = deg * easeInOut(clamp((t - at) / dur));
  return <g transform={`rotate(${a},${cx},${cy})`}>{children}</g>;
};
const Rise: React.FC<{ at: number; dur: number; dy: number; children: React.ReactNode }> = ({ at, dur, dy, children }) => {
  const t = useT();
  return <g transform={`translate(0,${dy * easeInOut(clamp((t - at) / dur))})`}>{children}</g>;
};

export const El: React.FC<{ e: any }> = ({ e }) => {
  let node: React.ReactNode = null;
  switch (e.k) {
    case 'sketch': {
      const def = ICONS[e.icon];
      if (!def) throw new Error('missing icon ' + e.icon);
      node = <Sketch def={def} x={e.x} y={e.y} s={e.fixed ? e.s : e.s * 1.2} at={e.at} dur={e.dur} rot={e.rot} flip={e.flip} noFill={e.noFill} />;
      break;
    }
    case 'person': node = <Person {...e} />; break;
    case 'write': node = <Write text={e.text} x={e.x} y={e.y} size={e.size} font={e.font} color={e.color} at={e.at} dur={e.dur} ul={e.ul} anchor={e.anchor} rot={e.rot} />; break;
    case 'burst': node = <Burst x={e.x} y={e.y} w={e.w} h={e.h} at={e.at} />; break;
    case 'arrow': node = <Arrow {...e} />; break;
    case 'cross': node = <Cross x={e.x} y={e.y} size={e.size} at={e.at} />; break;
    case 'check': node = <Check x={e.x} y={e.y} size={e.size} at={e.at} />; break;
    case 'map': node = <MapView name={e.name} x={e.x} y={e.y} s={e.s} at={e.at} fills={e.fills} />; break;
    case 'dot': node = <Dot x={e.x} y={e.y} at={e.at} r={e.r} color={e.color} />; break;
    case 'clock': node = <Clock x={e.x} y={e.y} r={e.r} at={e.at} hour={e.hour} hourAt={e.hourAt} />; break;
    case 'pie': node = <Pie x={e.x} y={e.y} r={e.r} at={e.at} slices={e.slices} />; break;
    case 'dugout': node = <Dugout x={e.x} y={e.y} at={e.at} mudAt={e.mudAt} />; break;
    case 'calendar': node = <Calendar x={e.x} y={e.y} at={e.at} pages={e.pages} w={e.w} size={e.size} />; break;
    case 'thermo': node = <Thermometer x={e.x} y={e.y} at={e.at} dropAt={e.dropAt} s={e.s} />; break;
    case 'tint': node = <Tint keys={e.keys} color={e.color} max={e.max} />; break;
    case 'frost': node = <Frost at={e.at} until={e.until} />; break;
    case 'smoke': node = <Smoke x={e.x} y={e.y} at={e.at} h={e.h} />; break;
    case 'trench': node = <Trench at={e.at} pts={e.pts} />; break;
    case 'bar': node = <Bar x={e.x} y={e.y} w={e.w} at={e.at} />; break;
    case 'box': node = <Box x={e.x} y={e.y} w={e.w} h={e.h} at={e.at} fill={e.fill} />; break;
    case 'line': node = e.dash ? <DashLine {...e} /> : <Ink d={e.d} at={e.at} dur={e.dur ?? 0.8} color={e.color} w={e.w ?? 5} ns={false} />; break;
    case 'shape': node = <g>{e.fill && <Scribble clip={e.d} at={e.at + 0.25} dur={0.5} color={e.fill} tint={e.tint ?? 0.35} />}<Ink d={e.d} at={e.at} dur={0.6} w={5} /></g>; break;
    case 'group': node = <>{e.els.map((c: any, i: number) => <El key={i} e={c} />)}</>; break;
    case 'spin': node = <Spin at={e.at} dur={e.dur} deg={e.deg} cx={e.cx} cy={e.cy}>{e.els.map((c: any, i: number) => <El key={i} e={c} />)}</Spin>; break;
    case 'rise': node = <Rise at={e.at} dur={e.dur} dy={e.dy}>{e.els.map((c: any, i: number) => <El key={i} e={c} />)}</Rise>; break;
    case 'mover': node = <Mover at={e.at} t0={e.t0} t1={e.t1} pts={e.pts}>{e.els.map((c: any, i: number) => <El key={i} e={c} />)}</Mover>; break;
    case 'bubble': node = <Bubble x={e.x} y={e.y} w={e.w} h={e.h} at={e.at} until={e.until} tx={e.tx} ty={e.ty}>{e.els.map((c: any, i: number) => <El key={i} e={c} />)}</Bubble>; break;
    default: throw new Error('unknown element ' + e.k);
  }
  if (e.k !== 'bubble' && (e.until != null || e.from != null)) return <Until until={e.until} from={e.from}>{node}</Until>;
  return <>{node}</>;
};

const DashLine: React.FC<any> = ({ d, at, w = 6, color, dash, dur = 0.8 }) => {
  const t = useT();
  const k = prog(t, at, dur);
  if (k <= 0) return null;
  return <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeDasharray={dash} opacity={k} />;
};

// camera: slow push over the board + optional keyed moves [t, zoom, fx, fy]
export const cameraAt = (t: number, b: any) => {
  const dur = Math.max(1, b.end - b.start);
  const base = 1 + 0.035 * clamp((t - b.start) / dur);
  let z = 1, fx = 960, fy = 540;
  for (const [tt, zz, xx, yy] of b.cam || []) {
    const k = easeInOut(clamp((t - tt) / 1.6));
    if (t >= tt) { z = z + (zz - z) * k; fx = fx + (xx - fx) * k; fy = fy + (yy - fy) * k; }
  }
  const s = base * z;
  // keep the focus point near the centre, clamp so the board edge never shows
  let tx = 960 - fx * s, ty = 540 - fy * s;
  tx = Math.min(0, Math.max(1920 - 1920 * s, tx));
  ty = Math.min(0, Math.max(1080 - 1080 * s, ty));
  return `translate(${tx},${ty}) scale(${s})`;
};
