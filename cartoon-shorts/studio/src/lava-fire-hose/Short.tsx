import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {A, B, BG_S, CAM_A, CAM_B, DURATION, FPS, T, VO_AT, WH, WW, poseBox} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

const F = (n: string) => staticFile(`lava-fire-hose/${n}.png`);
export const FONT = 'LavaHoseInter';
export const useLavaFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));

const LAVA = '#FF6A2B';
const LAVA_DEEP = '#E2501E';
const LAVA_HOT = '#FFA445';
const LAVA_CORE = '#FFC867';
const ROCK = '#5B5452';
const ROCK_SHADE = '#47403E';
const SEA = '#23649A';
const WATER = '#8FD8FF';
const HOSE = '#D8342B';

// ---------- sounds (all ElevenLabs: new for this video + reused from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'lava_glop', at: 0.0, db: -31},
  {f: 'whoosh', at: T.sprayOn - 0.12, db: -27},
  {f: 'hose_spray', at: T.sprayOn, db: -27, dur: 2.0},
  {f: 'hose_spray', at: T.sprayOn + 1.98, db: -29, dur: 2.0},
  {f: 'hose_spray', at: T.sprayOn + 3.96, db: -29, dur: 0.92},
  {f: 'sizzle', at: T.hit, db: -21},
  {f: 'rock_crack', at: T.rock - 0.04, db: -19},
  {f: 'rock_crack', at: T.but - 0.03, db: -15},
  {f: 'lava_glop', at: T.but + 0.05, db: -20},
  {f: 'sizzle', at: T.but + 0.6, db: -27},
  {f: 'lava_glop', at: T.cuOut, db: -22},
  {f: 'hose_spray', at: T.cuOut, db: -30, dur: 1.6},
  {f: 'rumble', at: T.there, db: -40, dur: 1.9, keys: [[T.there, -42], [10.2, -30], [11.25, -40]]},
  {f: 'sputter', at: T.sputter - 0.05, db: -15},
  {f: 'horn', at: T.cutB, db: -21},
  {f: 'lava_glop', at: T.crept - 0.1, db: -25},
  {f: 'whoosh', at: T.shipIn, db: -24},
  {f: 'cannon', at: T.pumped - 0.02, db: -16},
  {f: 'hose_spray', at: T.pumped + 0.6, db: -27, dur: 2.0},
  {f: 'hose_spray', at: T.pumped + 2.58, db: -28, dur: T.sprayOff - (T.pumped + 2.58)},
  {f: 'sizzle', at: T.pumped + 0.25, db: -20},
  {f: 'sizzle', at: 16.2, db: -27},
  {f: 'ticks', at: 16.85, db: -24, dur: 1.5},
  {f: 'rock_crack', at: T.froze - 0.02, db: -14},
  {f: 'sizzle', at: T.froze + 0.1, db: -26},
  {f: 'rock_crack', at: T.stopped - 0.02, db: -16},
  {f: 'wave_crash', at: T.protects - 0.45, db: -15},
  {f: 'splash', at: T.protects + 0.55, db: -24},
  {f: 'wave_crash', at: 23.36, db: -24},
];

// ---------- small helpers ----------
type P = [number, number];
// closed / open smooth path through points (Catmull-Rom -> cubic Bezier)
const smooth = (pts: P[], closed = true) => {
  const n = pts.length;
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + ' Z' : d;
};
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const mix = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(u)))).join(',')})`;
};

// ---------- the guy ----------
type Pose = 'hero_aim' | 'worried_aim' | 'deadpan_nozzle' | 'cheer' | 'yawn' | 'proud';
type GuyState = {pose: Pose; fx: number; fy: number; hr: number; sx: number; sy: number; rot: number};
// world position of a point given in sprite pixels, with the squash / rotation about the feet
const guyPoint = (g: GuyState, px: number, py: number): P => {
  const b = poseBox(g.pose, g.fx, g.fy, g.hr);
  const s = SPR[g.pose] as {feet: readonly number[]};
  const dx = (px - s.feet[0]) * b.k * g.sx;
  const dy = (py - s.feet[1]) * b.k * g.sy;
  const r = (g.rot * Math.PI) / 180;
  return [g.fx + dx * Math.cos(r) - dy * Math.sin(r), g.fy + dx * Math.sin(r) + dy * Math.cos(r)];
};
const Guy: React.FC<{g: GuyState}> = ({g}) => {
  const b = poseBox(g.pose, g.fx, g.fy, g.hr);
  const s = SPR[g.pose] as {feet: readonly number[]};
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: g.fx - b.width * 0.36,
          top: g.fy - 14,
          width: b.width * 0.72,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(40, 30, 24, 0.28)',
          filter: 'blur(3px)',
        }}
      />
      <div style={{position: 'absolute', left: g.fx, top: g.fy, transform: `rotate(${g.rot}deg) scale(${g.sx}, ${g.sy})`, transformOrigin: '0 0'}}>
        <Img src={F(g.pose)} style={{position: 'absolute', left: -s.feet[0] * b.k, top: -s.feet[1] * b.k, width: b.width, height: b.height}} />
      </div>
    </>
  );
};

// ---------- water stream (hose or cannon) ----------
const Stream: React.FC<{from: P; to: P; w: number; lift: number; grow: number; t: number}> = ({from, to, w, lift, grow, t}) => {
  if (grow <= 0.001 || w < 0.5) return null;
  const c: P = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - lift];
  const d = `M ${from[0]} ${from[1]} Q ${c[0]} ${c[1]} ${to[0]} ${to[1]}`;
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) * 1.25;
  const dash = {strokeDasharray: `${len * grow} ${len * 2}`};
  const ink = Math.max(4, w * 0.22);
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke="#000" strokeWidth={w + ink * 2} style={dash} />
      <path d={d} stroke={WATER} strokeWidth={w} style={dash} />
      <path d={d} stroke="#FFFFFF" strokeWidth={w * 0.32} strokeDasharray={`${w * 1.6} ${w * 1.4}`} strokeDashoffset={-t * w * 22} opacity={grow >= 1 ? 0.9 : 0} />
    </g>
  );
};

// steam puffs from a hit point: born in pulses, rise, grow, then shrink away
const steamAt = (t: number, t0: number, t1: number, at: P, scale: number, seed: number, every = 0.11, life = 1.15): Puff[] => {
  const out: Puff[] = [];
  const first = Math.max(0, Math.floor((t - life - t0) / every));
  for (let i = first; ; i++) {
    const b = t0 + i * every;
    if (b > t || b > t1) break;
    const age = (t - b) / life;
    if (age >= 1) continue;
    const r1 = rnd(i * 3.1 + seed);
    const r2 = rnd(i * 7.7 + seed);
    const gr = age < 0.55 ? easeOutCubic(age / 0.55) : 1 - easeInCubic((age - 0.55) / 0.45);
    out.push({
      x: at[0] + (r1 - 0.45) * 60 * scale + age * (40 + 70 * r2) * scale,
      y: at[1] - 10 * scale - age * (190 + 120 * r1) * scale,
      r: (16 + 30 * r2) * scale * gr,
    });
  }
  return out;
};

// ---------- the lava character (scene A and B) ----------
type Face = {open: number; look: P; squeeze?: boolean; lid?: number; lidTilt?: number; brow?: number; browTilt?: number; mouth: 'grin' | 'wobble' | 'o' | 'smirk'; wink?: boolean};
const LavaFace: React.FC<{x: number; y: number; r: number; f: Face}> = ({x, y, r, f}) => {
  const e1: P = [x, y + r * 0.1];
  const e2: P = [x + r * 2.6, y - r * 0.15];
  const m: P = [x + r * 1.2, y + r * 2.1];
  const mw = r * 1.15;
  let mouth: React.ReactNode = null;
  if (f.mouth === 'grin')
    mouth = <path d={`M ${m[0] - mw} ${m[1] - r * 0.2} Q ${m[0]} ${m[1] + r * 1.1} ${m[0] + mw} ${m[1] - r * 0.35} Z`} fill="#6E1A0C" stroke="#000" strokeWidth={r * 0.16} strokeLinejoin="round" />;
  if (f.mouth === 'smirk') mouth = <path d={`M ${m[0] - mw * 0.8} ${m[1]} Q ${m[0]} ${m[1] + r * 0.6} ${m[0] + mw} ${m[1] - r * 0.45}`} fill="none" stroke="#000" strokeWidth={r * 0.2} strokeLinecap="round" />;
  if (f.mouth === 'o') mouth = <ellipse cx={m[0]} cy={m[1] + r * 0.2} rx={r * 0.5} ry={r * 0.7} fill="#6E1A0C" stroke="#000" strokeWidth={r * 0.16} />;
  if (f.mouth === 'wobble') {
    let d = `M ${m[0] - mw} ${m[1]}`;
    for (let i = 1; i <= 6; i++) d += ` L ${m[0] - mw + (i * 2 * mw) / 6} ${m[1] + (i % 2 ? -1 : 1) * r * 0.22}`;
    mouth = <path d={d} fill="none" stroke="#000" strokeWidth={r * 0.18} strokeLinecap="round" strokeLinejoin="round" />;
  }
  return (
    <g>
      <Eye x={e1[0]} y={e1[1]} r={r} open={f.open} look={f.look} squeeze={f.squeeze} lid={f.lid} lidTilt={f.lidTilt} side={-1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      <Eye x={e2[0]} y={e2[1]} r={r} open={f.open} look={f.look} squeeze={f.squeeze || f.wink} lid={f.lid} lidTilt={f.lidTilt} side={1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      {f.open > 0.5 ? mouth : null}
    </g>
  );
};

// lava blob: front edge on the left at `front`, flat-ish top, extends right to `right`
const blobPts = (front: number, top: number, bottom: number, right: number, t: number, roundRight: boolean, slope = 0): P[] => {
  const pts: P[] = [];
  const H = bottom - top;
  // front edge (bottom -> top), bulging to the left in the middle
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const y = bottom - u * H;
    const bulge = Math.sin(Math.PI * clamp(0.15 + u * 0.8)) * 26 + 6 * Math.sin(t * 2.3 + i * 1.7);
    pts.push([front - bulge + (u > 0.85 ? (u - 0.85) * 220 : 0), y]);
  }
  // top edge (left -> right), lumpy and slowly rolling
  const n = Math.max(4, Math.round((right - front) / 70));
  for (let i = 1; i <= n; i++) {
    const x = front + 34 + (i * (right - front - 34)) / n;
    pts.push([x, top - slope * (i / n) + 10 * Math.sin(i * 1.9 + t * 1.6) + 6 * Math.sin(i * 0.7 - t * 2.1)]);
  }
  if (roundRight) {
    pts.push([right + 38, top + H * 0.35]);
    pts.push([right + 30, bottom - 20]);
  } else {
    pts.push([right + 400, top - slope]);
    pts.push([right + 400, bottom]);
  }
  return pts;
};

const Lava: React.FC<{
  id: string;
  front: number;
  top: number;
  bottom: number;
  right: number;
  t: number;
  roundRight?: boolean;
  rock?: number; // 0..1 rock reveal from the front backwards
  rockFrom?: number;
  squashY?: number;
  slope?: number;
}> = ({id, front, top, bottom, right, t, roundRight = false, rock = 0, squashY = 1, slope = 0}) => {
  const pts = blobPts(front, top, bottom, right, t, roundRight, slope);
  const d = smooth(pts);
  const W = right - front + (roundRight ? 80 : 420);
  const crusts = Array.from({length: 7}, (_, i) => {
    const u = (rnd(i * 5.3) * 0.9 + t * 0.012 * (0.5 + rnd(i))) % 1;
    const life = Math.sin(Math.PI * u); // grow in, shrink away: no jump at the wrap
    return {x: right - u * (right - front + 40), y: top + 30 + rnd(i * 2.1) * (bottom - top - 60) * 0.7, r: (16 + 22 * rnd(i * 9.1)) * Math.min(1, life * 2.5)};
  });
  const rx = front - 60;
  const rw = rock * (W + 120);
  return (
    <g transform={`translate(0 ${bottom}) scale(1 ${squashY}) translate(0 ${-bottom})`}>
      <defs>
        <clipPath id={`lc-${id}`}>
          <path d={d} />
        </clipPath>
        <clipPath id={`rc-${id}`}>
          <rect x={rx} y={top - 200} width={rw} height={bottom - top + 400} />
        </clipPath>
      </defs>
      <path d={d} fill={LAVA} />
      <g clipPath={`url(#lc-${id})`}>
        <path d={d} fill="none" stroke={LAVA_DEEP} strokeWidth={34} />
        {crusts.map((c, i) => (
          <ellipse key={i} cx={c.x} cy={c.y} rx={c.r * 1.6} ry={c.r * 0.7} fill={LAVA_DEEP} opacity={0.7} />
        ))}
        {[0, 1, 2].map((i) => {
          const y = top + 40 + i * 46;
          const ph = ((t * 30 + i * 90) % 200) / 200;
          const x0 = front + 60 + ph * 200;
          const sw = 9 * Math.min(1, Math.sin(Math.PI * ph) * 3);
          return <path key={`h${i}`} d={`M ${x0} ${y} q 60 -14 120 0 t 120 0`} fill="none" stroke={LAVA_CORE} strokeWidth={sw} strokeLinecap="round" opacity={0.9} />;
        })}
        <ellipse cx={front + 120} cy={top + 30} rx={90} ry={22} fill={LAVA_HOT} opacity={0.8} />
      </g>
      {rock > 0.001 ? (
        <g clipPath={`url(#rc-${id})`}>
          <path d={d} fill={ROCK} stroke="#000" strokeWidth={8} strokeLinejoin="round" />
          <g clipPath={`url(#lc-${id})`}>
            <path d={d} fill="none" stroke={ROCK_SHADE} strokeWidth={30} transform="translate(10 12)" />
            {[0, 1, 2, 3].map((i) => {
              const x = front + 70 + i * 85;
              return (
                <path key={`k${i}`} d={`M ${x} ${top + 40 + 30 * rnd(i)} l 18 30 l -14 26 l 20 34`} fill="none" stroke="#000" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              );
            })}
          </g>
          {/* glowing seam at the reveal edge */}
          <rect x={rx + rw - 10} y={top - 40} width={rock < 1 ? 14 : 0} height={bottom - top + 80} fill={LAVA_CORE} opacity={0.9} />
        </g>
      ) : null}
    </g>
  );
};

// little wooden sign that pops in with a place + year
const Sign: React.FC<{x: number; base: number; s: number; lines: string[]; scale: number}> = ({x, base, s, lines, scale}) => {
  if (s <= 0.001) return null;
  const w = 250 * scale;
  const h = 130 * scale;
  const post = 150 * scale;
  return (
    <div style={{position: 'absolute', left: x, top: base, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -9 * scale, top: -post, width: 18 * scale, height: post, background: '#8A5A33', border: `${5 * scale}px solid #000`, borderRadius: 4 * scale}} />
      <div
        style={{
          position: 'absolute',
          left: -w / 2,
          top: -post - h + 20 * scale,
          width: w,
          height: h,
          background: '#E3B074',
          border: `${7 * scale}px solid #000`,
          borderRadius: 14 * scale,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          color: '#2B1A0E',
          lineHeight: 1.0,
        }}
      >
        <div style={{fontSize: 52 * scale}}>{lines[0]}</div>
        <div style={{fontSize: 40 * scale, color: '#7A3B12'}}>{lines[1]}</div>
      </div>
    </div>
  );
};

const SweatDrop: React.FC<{x: number; y: number; s: number; r: number}> = ({x, y, s, r}) => {
  if (s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 ${-r * 1.6} C ${r * 0.9} ${-r * 0.4} ${r} ${r * 0.2} 0 ${r} C ${-r} ${r * 0.2} ${-r * 0.9} ${-r * 0.4} 0 ${-r * 1.6} Z`} fill="#8FD3FF" stroke="#000" strokeWidth={r * 0.22} />
      <ellipse cx={-r * 0.3} cy={r * 0.05} rx={r * 0.18} ry={r * 0.3} fill="#fff" />
    </g>
  );
};

// ============================================================
// SCENE A: Hawaii field
// ============================================================
const lavaFrontA = (t: number) => {
  if (t < 2.9) return lerp(1010, 985, easeInOutCubic(prog(t, 0, 2.9)));
  if (t < T.but) return 985 + 5 * Math.sin(t * 3);
  if (t < T.cuIn) return lerp(985, 905, easeOutCubic(prog(t, T.but, T.but + 0.9))) - 20 * prog(t, T.but + 0.9, T.cuIn);
  if (t < T.there) return lerp(800, 770, prog(t, T.cuOut, T.there));
  return lerp(770, 735, easeOutCubic(prog(t, T.there, 11.3)));
};
const lavaTopA = (t: number) => A.lavaTop - 95 * easeInOutCubic(prog(t, T.there + 0.1, 10.5));

const guyA = (t: number): GuyState => {
  let pose: Pose = 'hero_aim';
  if (t >= 5.45) pose = 'worried_aim';
  if (t >= T.deadpan) pose = 'deadpan_nozzle';
  let fx = A.feet[0];
  let fy = A.feet[1];
  if (t >= T.cuOut) {
    fx = lerp(480, 452, easeInOutCubic(prog(t, 8.9, 9.15)));
    fy -= 26 * bump(t, 8.9, 0.25);
  }
  let sx = 1;
  let sy = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  let rot = 0;
  sy += 0.035 * bump(t, T.hose, 0.22) + 0.03 * bump(t, T.right, 0.24);
  // recoil when the water comes on
  rot -= 2.5 * Math.max(0, spring(t - T.sprayOn, 2.2, 4)) * (t > T.sprayOn ? 1 : 0);
  // swap to worried on "But": anticipation squash then stretch
  if (t > 5.36 && t < 5.45) {
    const u = prog(t, 5.36, 5.45);
    sy -= 0.06 * u;
    sx += 0.04 * u;
  }
  if (t >= 5.45 && t < 7) sy += 0.04 * spring(t - 5.45, 3.2, 6);
  if (t >= 5.45 && t < T.deadpan) sx += 0.006 * Math.sin(2 * Math.PI * 15 * t); // tremble
  if (t > T.deadpan - 0.09 && t < T.deadpan) {
    const u = prog(t, T.deadpan - 0.09, T.deadpan);
    sy -= 0.07 * u;
    sx += 0.05 * u;
  }
  if (t >= T.deadpan) sy += 0.035 * spring(t - T.deadpan, 3, 6);
  return {pose, fx, fy, hr: A.hr, sx, sy, rot};
};
const nozzleA = (g: GuyState) => {
  const s = SPR[g.pose as 'hero_aim'] as unknown as {tip: number[]; back: number[]};
  return {tip: guyPoint(g, s.tip[0], s.tip[1]), back: guyPoint(g, s.back[0], s.back[1])};
};

const faceA = (t: number): Face => {
  const open = 1;
  if (t < T.hit) return {open, look: [-0.7, 0.25], mouth: 'smirk', lid: 0.25, browTilt: -0.4};
  if (t < T.but) return {open, look: [0, 0], squeeze: true, mouth: 'wobble'};
  if (t < T.cuIn) return {open: easeOutBackish(t, T.but), look: [-0.7, 0.2], lid: 0.32, lidTilt: 24, browTilt: 1.2, mouth: 'grin'};
  return {open: 1, look: [-0.8, 0.3], lid: 0.42, lidTilt: -6, browTilt: -0.3, mouth: 'grin'};
};
function easeOutBackish(t: number, t0: number) {
  return 0.75 + 0.25 * pop(t, t0, 0.22);
}

const SceneA: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const g = guyA(t);
  const nz = nozzleA(g);
  const front = lavaFrontA(t);
  const top = lavaTopA(t);
  const hitY = Math.max(top + 70, Math.min(nz.tip[1] + 40, 1860));
  const hit: P = [front - 8, hitY];
  const sprayOn = t >= T.sprayOn && t < T.deadpan;
  const grow = prog(t, T.sprayOn, T.hit);
  const weak = 1 - 0.65 * prog(t, 9.75, T.deadpan);
  const reveal = easeInOutCubic(prog(t, T.there + 0.1, 10.5));
  // the crust that forms where the water hits (then breaks on "But")
  const crustS = t < T.but ? clamp(prog(t, T.hit + 0.2, T.rock) * 0.75 + 0.25 * pop(t, T.rock, 0.25) * (t >= T.rock ? 1 : 0)) : 0;
  const crustPts: P[] = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = 70 * (0.8 + 0.3 * rnd(i * 4.4));
    return [Math.cos(a) * r * 0.75, Math.sin(a) * r];
  });
  const shards = t >= T.but && t < T.but + 0.8;
  // hose: from the nozzle's back down to the ground and away to the left
  const hb = nz.back;
  const hosePts: P[] = [hb, [hb[0] - 40, hb[1] + 90], [g.fx - 70, g.fy + 25], [g.fx - 260, g.fy + 45], [g.fx - 520, g.fy + 20], [-300, g.fy + 50]];
  const sh = shake(t, 7 * Math.exp(-6 * Math.max(0, t - T.but)) * (t > T.but ? 1 : 0));
  const c = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  // far lava: river down the volcano + a band across the ground that widens on "too much lava"
  const riverD = `M ${A.crater[0]} ${A.crater[1] + 6} C 1320 840 1380 930 1470 1035`;
  const bandL = lerp(1520, 330, reveal);
  const bandPts: P[] = [
    [bandL, A.horizon + 6],
    [1600, A.horizon + 6],
    [1600, top + 40],
    [front + 120, top + 40],
    [lerp(1560, front - 40, reveal), lerp(1100, 1470, reveal)],
    [bandL - 60, lerp(1080, 1330, reveal)],
  ];
  const signS = pop(t, T.hawaii, 0.3);
  const steam = sprayOn ? steamAt(t, T.hit, T.deadpan, [hit[0] + 10, hit[1]], 1, 1) : [];
  // sputter drops on "lava." after the deadpan swap
  const drops: Puff[] = [];
  if (t >= T.sputter && t < T.sputter + 1.2) {
    for (let i = 0; i < 3; i++) {
      const b = T.sputter + i * 0.13;
      const a = t - b;
      if (a < 0 || a > 0.55) continue;
      drops.push({x: nz.tip[0] + (i - 1) * 40 * a, y: nz.tip[1] - 260 * a + 900 * a * a, r: 9 - i});
    }
    const a = t - (T.sputter + 0.55);
    if (a > 0) drops.push({x: nz.tip[0] + 2, y: nz.tip[1] - 8 + Math.min(260, 700 * a * a), r: 11 * (a < 0.6 ? 1 : 0)});
  }
  return (
    <AbsoluteFill style={{backgroundColor: '#76C7FC'}}>
      <World cam={c}>
        <Img src={F('bg_field')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
          <path d={riverD} fill="none" stroke={LAVA_DEEP} strokeWidth={lerp(46, 70, reveal)} strokeLinecap="round" />
          <path d={riverD} fill="none" stroke={LAVA} strokeWidth={lerp(32, 52, reveal)} strokeLinecap="round" />
          <path d={riverD} fill="none" stroke={LAVA_CORE} strokeWidth={8} strokeLinecap="round" strokeDasharray="40 60" strokeDashoffset={-t * 60} />
          {reveal > 0.01 ? (
            <g>
              <path d={smooth(bandPts)} fill={LAVA_DEEP} />
              <path d={smooth(bandPts)} fill={LAVA} transform={`translate(0 14)`} />
              {[0, 1, 2].map((i) => {
                const ph = ((t * 25 + i * 40) % 120) / 120;
                return (
                  <path
                    key={i}
                    d={`M ${lerp(bandL + 150, 1200, i / 3) + ph * 120} ${lerp(1120, 1380, i / 3)} q 70 -16 140 0 t 140 0`}
                    fill="none"
                    stroke={LAVA_CORE}
                    strokeWidth={8 * Math.min(1, Math.sin(Math.PI * ph) * 3)}
                    strokeLinecap="round"
                    opacity={reveal}
                  />
                );
              })}
            </g>
          ) : null}
        </svg>
        <Img src={F('house')} style={{position: 'absolute', left: A.house.x - A.house.w / 2, top: A.house.base - (A.house.w * SPR.house.h) / SPR.house.w, width: A.house.w}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
          <path d={smooth(hosePts, false)} fill="none" stroke="#000" strokeWidth={34} strokeLinecap="round" />
          <path d={smooth(hosePts, false)} fill="none" stroke={HOSE} strokeWidth={22} strokeLinecap="round" />
        </svg>
        <Guy g={g} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
          <Lava id="a" front={front} top={top} bottom={2420} right={1540} t={t} slope={150} />
          {crustS > 0.001 ? (
            <g transform={`translate(${hit[0] + 30} ${hit[1]}) scale(${crustS})`}>
              <path d={smooth(crustPts)} fill={ROCK} stroke="#000" strokeWidth={7} />
              <path d="M -20 -30 l 14 22 l -10 18" fill="none" stroke="#000" strokeWidth={5} strokeLinecap="round" />
            </g>
          ) : null}
          {shards
            ? [0, 1, 2].map((i) => {
                const a = t - T.but;
                const vx = (i - 1) * 120 - 40;
                const vy = -260 - 80 * i;
                const x = hit[0] + 30 + vx * a;
                const y = hit[1] + vy * a + 1100 * a * a;
                const s = 1 - clamp(a / 0.8);
                const p3 = crustPts.slice(i * 3, i * 3 + 4);
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${(i - 1) * 260 * a}) scale(${s})`}>
                    <path d={smooth([[0, 0], ...p3] as P[])} fill={ROCK} stroke="#000" strokeWidth={6} />
                  </g>
                );
              })
            : null}
          <LavaFace x={front + 88} y={top + 78} r={40} f={faceA(t)} />
          <Stream from={nz.tip} to={hit} w={sprayOn ? 17 * weak : 0} lift={40} grow={grow} t={t} />
          <PuffCluster puffs={steam} fill="#FFFFFF" ink={5} shade="#E3EBF1" />
          <PuffCluster puffs={drops} fill={WATER} ink={4} />
        </svg>
        <Sign x={A.sign.x} base={A.sign.base} s={signS} lines={['HAWAII', '1986']} scale={0.9} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- the shocked close-up (screen space) ----------
const CloseUp: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T.cuIn, T.cuOut);
  const s = 1.1;
  const cu = SPR.shock_cu;
  const hx = 420;
  const left = hx - cu.head[0] * s;
  const top = 1920 - cu.h * s + 6;
  const tr = 3 * Math.sin(2 * Math.PI * 17 * t);
  const zoom = 1 + 0.04 * easeOutCubic(u);
  const front = lerp(700, 560, easeOutCubic(u));
  const sweat = pop(t, T.cuIn + 0.18, 0.2);
  const headTop = top + (cu.head[1] - cu.head[2]) * s;
  return (
    <AbsoluteFill style={{backgroundColor: '#5a5150', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '420px 1100px'}}>
        <Img src={F('bg_field')} style={{position: 'absolute', left: -1250, top: -2050, width: 1024 * 3.3, height: 1536 * 3.3, filter: 'blur(9px)'}} />
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 300,
            width: 1400,
            height: 1500,
            background: 'radial-gradient(closest-side, rgba(255,140,60,0.55), rgba(255,140,60,0))',
          }}
        />
        <svg style={{position: 'absolute', left: 0, top: 0, filter: 'blur(3px)', overflow: 'visible'}} width={1080} height={1920}>
          <g transform="translate(0 -900) scale(1.25)">
            <Lava id="cu" front={front} top={1200} bottom={2400} right={1300} t={t} />
            <LavaFace x={front + 90} y={1290} r={44} f={{open: 1, look: [-0.8, 0.1], lid: 0.32, lidTilt: 24, browTilt: 1.2, mouth: 'grin'}} />
          </g>
        </svg>
        <Img src={F('shock_cu')} style={{position: 'absolute', left: left + tr, top, width: cu.w * s, height: cu.h * s}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
          <SweatDrop x={left + 150 + tr} y={headTop + 210 + 140 * easeInCubic(prog(t, T.cuIn + 0.3, T.cuOut))} s={sweat} r={34} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============================================================
// SCENE B: the harbour
// ============================================================
const frontB = (t: number) => {
  if (t < 14.3) return lerp(1130, 975, easeInOutCubic(prog(t, T.cutB, 14.3)));
  return lerp(975, 958, prog(t, 14.3, T.froze));
};
const rockB = (t: number) => {
  if (t < T.froze) return 0.13 * easeOutCubic(prog(t, T.pumped + 0.4, T.sprayOff));
  return lerp(0.13, 1, easeInOutCubic(prog(t, T.froze, T.froze + 0.6)));
};
const faceB = (t: number): Face => {
  if (t < T.pumped + 0.2) return {open: 1, look: [-0.9, 0.2], lid: 0.3, browTilt: -0.4, mouth: 'grin'};
  if (t < T.froze) return {open: 1, look: [0, 0], squeeze: true, mouth: 'wobble'};
  if (t < T.stopped) return {open: 0.8 + 0.2 * pop(t, T.froze, 0.22), look: [-0.3, -0.2], brow: 0.85, mouth: 'o'};
  if (t < T.stopped + 0.35) return {open: 1, look: [0, 0], squeeze: true, mouth: 'wobble'};
  if (t < T.protects) return {open: 1, look: [-0.6, 0.1], lid: 0.38, lidTilt: -6, browTilt: -0.4, mouth: 'smirk'};
  if (t < T.protects + 0.4) return {open: 1, look: [0, 0], squeeze: true, mouth: 'wobble'};
  return {open: 1, look: [0.7, -0.1], lid: 0.42, lidTilt: -8, browTilt: -0.5, mouth: 'grin', wink: t > T.storms + 0.25};
};
const guyB = (t: number): GuyState => {
  let pose: Pose = 'deadpan_nozzle';
  if (t >= T.ocean) pose = 'cheer';
  if (t >= T.five) pose = 'yawn';
  if (t >= T.stopped) pose = 'proud';
  let sx = 1;
  let sy = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  let fy = B.feet[1];
  for (const sw of [T.ocean, T.five]) {
    if (t > sw - 0.09 && t < sw) {
      const u = prog(t, sw - 0.09, sw);
      sy -= 0.07 * u;
      sx += 0.05 * u;
    }
    if (t >= sw && t < sw + 1) sy += 0.04 * spring(t - sw, 3, 6);
  }
  // cheer: jumping
  if (t >= T.ocean && t < T.five) fy -= 40 * Math.abs(Math.sin(Math.PI * 2.2 * (t - T.ocean))) * (1 - prog(t, T.ocean + 1.1, T.five));
  // yawn: slow stretch
  if (t >= T.five && t < T.stopped) sy += 0.03 * Math.sin(Math.PI * prog(t, T.five, T.five + 1.2));
  return {pose, fx: B.feet[0], fy, hr: B.hr, sx, sy, rot: 0};
};
const shipB = (t: number) => {
  const x = lerp(-420, B.ship.x, easeOutCubic(prog(t, T.shipIn, T.shipIn + 0.55)));
  const recoil = t > T.pumped ? -22 * Math.max(0, spring(t - T.pumped, 1.8, 3.5)) : 0;
  const bob = 6 * Math.sin(2 * Math.PI * 0.7 * t);
  const rot = 1.4 * Math.sin(2 * Math.PI * 0.55 * t + 1);
  return {x: x + recoil, bob, rot};
};

const Floating: React.FC<{src: string; cx: number; wl: number; w: number; sw: number; sh: number; keel: number; bob: number; rot: number; sink?: number}> = ({
  src,
  cx,
  wl,
  w,
  sw,
  sh,
  keel,
  bob,
  rot,
  sink = 26,
}) => {
  const k = w / sw;
  const h = sh * k;
  const top = wl + sink - keel * k + bob;
  return (
    <>
      <div style={{position: 'absolute', left: cx - w / 2, top, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: '50% 85%'}}>
        <Img src={F(src)} style={{width: w, height: h}} />
      </div>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
        <path d={smooth([[cx - w / 2 - 30, wl + 8 + bob * 0.3], [cx - w / 6, wl + 2 - bob * 0.3], [cx + w / 6, wl + 10 + bob * 0.3], [cx + w / 2 + 30, wl + 4 - bob * 0.3], [cx + w / 2 + 30, wl + 220], [cx - w / 2 - 30, wl + 220]])} fill={SEA} />
        <path d={`M ${cx - w / 2 - 10} ${wl + 6 + bob * 0.3} q ${w / 4} -10 ${w / 2} 0 t ${w / 2} 0`} fill="none" stroke="#5FA6DE" strokeWidth={6} strokeLinecap="round" />
      </svg>
    </>
  );
};

const SceneB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const g = guyB(t);
  const front = frontB(t);
  const rock = rockB(t);
  const ship = shipB(t);
  const shipK = B.ship.w / SPR.ship.w;
  const shipLeft = ship.x - B.ship.w / 2;
  const shipTop = B.ship.wl + 30 - SPR.ship.keel * shipK + ship.bob;
  const muzzle: P = [shipLeft + SPR.ship.muzzle[0] * shipK, shipTop + SPR.ship.muzzle[1] * shipK + 6];
  const hit: P = [front - 6, B.tongueTop + 95];
  const sprayOn = t >= T.pumped && t < T.sprayOff;
  const grow = prog(t, T.pumped, T.pumped + 0.22);
  const wFade = 1 - prog(t, T.sprayOff - 0.25, T.sprayOff);
  const steam = t >= T.pumped + 0.2 ? steamAt(t, T.pumped + 0.2, T.froze + 0.4, [hit[0] + 20, hit[1] - 20], 1.5, 3, 0.09, 1.5) : [];
  // wall bump when the lava behind it is stopped
  const wallSquash = 1 - 0.035 * Math.max(0, spring(t - T.stopped, 2.5, 5)) * (t > T.stopped ? 1 : 0);
  // storm
  const storm = easeInOutCubic(prog(t, 21.5, 22.2));
  const wave1 = prog(t, 21.85, T.protects);
  const waveX = t < T.protects ? lerp(1720, 1372, easeInCubic(wave1)) : lerp(1372, 1720, easeInOutCubic(prog(t, T.protects + 0.25, 23.5)));
  const waveH = t < T.protects ? lerp(90, 330, wave1) : lerp(330, 30, easeOutCubic(prog(t, T.protects, T.protects + 0.45)));
  const wave2 = prog(t, 23.15, 23.82);
  const wave2X = t < 23.82 ? lerp(1720, 1380, easeInCubic(wave2)) : lerp(1380, 1720, prog(t, 23.9, 24.9));
  const wave2H = t < 23.82 ? lerp(40, 150, wave2) : lerp(150, 25, easeOutCubic(prog(t, 23.82, 24.2)));
  const spray: Puff[] = [];
  for (const [t0, n, s] of [
    [T.protects, 26, 1.15],
    [23.82, 12, 0.6],
  ] as [number, number, number][]) {
    const a = t - t0;
    if (a < 0 || a > 1.3) continue;
    for (let i = 0; i < n; i++) {
      const vx = -(120 + 380 * rnd(i * 3.3 + t0)) * s;
      const vy = -(700 + 520 * rnd(i * 1.7 + t0)) * s;
      const y = B.tongueTop + 60 + vy * a + 1500 * a * a;
      if (y > B.wl + 40) continue;
      spray.push({x: B.tongueRight + 10 + vx * a, y, r: (14 + 18 * rnd(i * 5.1)) * s * (1 - clamp((a - 0.8) / 0.5))});
    }
  }
  const sh1 = shake(t, 9 * Math.exp(-5 * Math.max(0, t - T.pumped)) * (t > T.pumped ? 1 : 0));
  const sh2 = shake(t, 10 * Math.exp(-6 * Math.max(0, t - T.stopped)) * (t > T.stopped ? 1 : 0));
  const sh3 = shake(t, 15 * Math.exp(-4 * Math.max(0, t - T.protects)) * (t > T.protects ? 1 : 0));
  const c = {x: cam.x - (sh1.x + sh2.x + sh3.x) / cam.k, y: cam.y - (sh1.y + sh2.y + sh3.y) / cam.k, k: cam.k};
  const rp: P[] = [[1196, 1010], [1182, 1050], [1172, 1095], [1166, 1140], [1162, 1180], [1158, B.tongueTop + 50]];
  const rw = [6, 9, 12, 16, 21, 27];
  const rL = rp.map((p, i) => [p[0] - rw[i], p[1]] as P);
  const rR = rp.map((p, i) => [p[0] + rw[i], p[1]] as P).reverse();
  const riverD = smooth([...rL, ...rR]);
  const riverC = smooth(rp, false);
  const riverRock = easeInOutCubic(prog(t, T.stopped + 0.1, T.stopped + 0.9));
  const signS = pop(t, T.iceland, 0.3);
  const wavePath = (x: number, H: number) => {
    const base = B.wl + 6;
    return smooth([
      [x - 40, base + 10],
      [x - 30, base - H * 0.45],
      [x + 10, base - H * 0.95],
      [x + 80, base - H * 1.12],
      [x + 170, base - H],
      [x + 240, base - H * 0.6],
      [x + 380, base - H * 0.15],
      [x + 600, base],
      [x + 600, base + 160],
      [x - 40, base + 160],
    ]);
  };
  const clouds: Puff[][] = [0, 1, 2].map((i) => {
    const x = lerp(1900 + i * 200, 650 + i * 330, easeOutCubic(prog(t, 21.4 + i * 0.12, 22.6 + i * 0.12)));
    const y = 280 + i * 110;
    return [0, 1, 2, 3].map((j) => ({x: x + j * 70 - 100, y: y - (j % 2) * 40, r: 70 + 18 * ((j + i) % 3)}));
  });
  return (
    <AbsoluteFill style={{backgroundColor: '#91B1CF'}}>
      <World cam={c}>
        <Img src={F('bg_harbor')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
          {storm > 0.01 ? clouds.map((cl, i) => <PuffCluster key={i} puffs={cl} fill="#6F7783" ink={6} shade="#5E6570" />) : null}
          <path d={riverD} fill={mix(LAVA, '#3E3D40', riverRock)} stroke={mix(LAVA_DEEP, '#3E3D40', riverRock)} strokeWidth={6} strokeLinejoin="round" />
          {riverRock < 0.9 ? <PuffCluster puffs={steamAt(t, T.cutB - 1.2, T.stopped, [1196, 1000], 0.45, 9, 0.22, 1.4)} fill="#C9C4C2" ink={4} /> : null}
          {riverRock < 0.5 ? <path d={riverC} fill="none" stroke={LAVA_CORE} strokeWidth={7} strokeLinecap="round" strokeDasharray="30 50" strokeDashoffset={-t * 50} /> : null}
          <Lava id="b" front={front} top={B.tongueTop} bottom={B.tongueBottom} right={B.tongueRight} t={t < T.froze + 0.6 ? t : T.froze + 0.6} roundRight rock={rock} squashY={wallSquash} />
          <LavaFace x={front + 58} y={B.tongueTop + 62} r={31} f={faceB(t)} />
          {/* the sea in front of the tongue's foot */}
          <path d={smooth([[820, B.wl + 70], [1050, B.wl + 60], [1250, B.wl + 74], [1450, B.wl + 62], [1700, B.wl + 70], [1700, B.wl + 500], [820, B.wl + 500]])} fill={SEA} />
          {t > 21.8 ? (
            <g>
              <path d={wavePath(waveX, waveH)} fill="#2E7FC9" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
              <path d={`M ${waveX + 150} ${B.wl - waveH * 0.98} C ${waveX + 60} ${B.wl - waveH * 1.2} ${waveX - 40} ${B.wl - waveH * 1.0} ${waveX - 30} ${B.wl - waveH * 0.62}`} fill="none" stroke="#000" strokeWidth={34} strokeLinecap="round" />
              <path d={`M ${waveX + 150} ${B.wl - waveH * 0.98} C ${waveX + 60} ${B.wl - waveH * 1.2} ${waveX - 40} ${B.wl - waveH * 1.0} ${waveX - 30} ${B.wl - waveH * 0.62}`} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" />
              <path d={`M ${waveX + 60} ${B.wl - waveH * 0.5} q 70 -40 150 -10`} fill="none" stroke="#9BD0F5" strokeWidth={14} strokeLinecap="round" />
              <PuffCluster puffs={[0, 1, 2, 3, 4].map((j) => ({x: waveX + j * 42, y: B.wl + 6 - waveH * [0.95, 1.12, 1.14, 1.04, 0.85][j], r: [26, 30, 26, 22, 16][j] * clamp(waveH / 140)}))} fill="#FFFFFF" ink={5} />
            </g>
          ) : null}
          {t > 23.1 ? <path d={wavePath(wave2X, wave2H)} fill="#2E7FC9" stroke="#000" strokeWidth={6} strokeLinejoin="round" /> : null}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const sp = 30 + 160 * storm;
            const ph = ((t * sp + i * 260) % 1500) / 1500;
            const x = 1700 - ph * 1500;
            const y = B.wl + 120 + i * 105;
            const a = 0.35 + 0.5 * storm;
            return <path key={`sq${i}`} d={`M ${x} ${y} q 40 -${10 + 18 * storm} 80 0 t 80 0`} fill="none" stroke="#6FB2E6" strokeWidth={8 * Math.min(1, Math.sin(Math.PI * ph) * 4)} strokeLinecap="round" opacity={a} />;
          })}
        </svg>
        <Floating src="boat_orange" cx={B.boatOrange.x} wl={B.boatOrange.wl} w={B.boatOrange.w} sw={SPR.boat_orange.w} sh={SPR.boat_orange.h} keel={SPR.boat_orange.h - 12} bob={5 * Math.sin(2 * Math.PI * 0.6 * t + 2)} rot={1.5 * Math.sin(2 * Math.PI * 0.5 * t)} />
        <Floating src="boat_blue" cx={B.boatBlue.x} wl={B.boatBlue.wl} w={B.boatBlue.w} sw={SPR.boat_blue.w} sh={SPR.boat_blue.h} keel={SPR.boat_blue.h - 12} bob={6 * Math.sin(2 * Math.PI * 0.55 * t)} rot={1.8 * Math.sin(2 * Math.PI * 0.45 * t + 1)} />
        <Sign x={B.sign.x} base={B.sign.base} s={signS} lines={['ICELAND', '1973']} scale={0.72} />
        <Guy g={g} />
        {t >= T.shipIn ? <Floating src="ship" cx={ship.x} wl={B.ship.wl} w={B.ship.w} sw={SPR.ship.w} sh={SPR.ship.h} keel={SPR.ship.keel} bob={ship.bob} rot={ship.rot} sink={30} /> : null}
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={WH}>
          <Stream from={muzzle} to={hit} w={sprayOn ? 46 * wFade : 0} lift={170} grow={grow} t={t} />
          <PuffCluster puffs={steam} fill="#FFFFFF" ink={6} shade="#E3EBF1" />
          <PuffCluster puffs={spray} fill="#DFF3FF" ink={5} />
        </svg>
        <div style={{position: 'absolute', left: -400, top: 0, width: WW + 800, height: WH, background: '#1E2A44', opacity: 0.3 * storm}} />
      </World>
    </AbsoluteFill>
  );
};

// "For five months": calendar card flipping FEB -> JUL (screen space)
const MONTHS = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
const Calendar: React.FC<{t: number}> = ({t}) => {
  const tin = 16.78;
  const tout = 18.3;
  if (t < tin || t > tout + 0.3) return null;
  const s = t < tout ? pop(t, tin, 0.28) : 1 - easeInCubic(prog(t, tout, tout + 0.25));
  const step = 0.21;
  const i = clamp(Math.floor((t - 16.95) / step), 0, 5);
  const ph = (t - 16.95) / step - Math.floor((t - 16.95) / step);
  const flip = t > 16.95 && t < 16.95 + step * 6 ? 1 - 0.5 * Math.max(0, 1 - ph / 0.35) : 1;
  return (
    <div style={{position: 'absolute', left: 360, top: 170, width: 330, height: 350, transform: `scale(${s}) rotate(-4deg)`, transformOrigin: '50% 50%'}}>
      <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', border: '9px solid #000', borderRadius: 28, overflow: 'hidden'}}>
        <div style={{height: 104, background: '#E2412F', borderBottom: '9px solid #000', fontFamily: FONT, color: '#fff', fontSize: 64, textAlign: 'center', lineHeight: '100px'}}>1973</div>
        <div style={{fontFamily: FONT, color: '#111', fontSize: 120, textAlign: 'center', marginTop: 34, transform: `scaleY(${flip})`}}>{MONTHS[i]}</div>
      </div>
      {[90, 240].map((x) => (
        <div key={x} style={{position: 'absolute', left: x - 14, top: -26, width: 28, height: 64, background: '#9AA3AD', border: '7px solid #000', borderRadius: 14}} />
      ))}
    </div>
  );
};

// the whole picture at time t (used by the Short and by the cover)
export const WorldScene: React.FC<{t: number; camOverride?: Cam}> = ({t, camOverride}) => {
  if (t < T.cutB) {
    if (t >= T.cuIn && t < T.cuOut) return <CloseUp t={t} />;
    return <SceneA t={t} cam={camOverride ?? camAt(t, CAM_A)} />;
  }
  return (
    <AbsoluteFill>
      <SceneB t={t} cam={camOverride ?? camAt(t, CAM_B)} />
      <Calendar t={t} />
    </AbsoluteFill>
  );
};

export const LavaFireHoseShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useLavaFont();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <WorldScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('lava-fire-hose/vo/take1.mp3')} />
      </Sequence>
      <SoundCues cues={CUES} dir="lava-fire-hose/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

export const LAVA_DURATION = DURATION;
export const BG_SCALE = BG_S;
