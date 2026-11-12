// Ambient FX: sky, sun/moon glow, clouds, smoke, sea, mist, rain, snow, birds, searchlight, fire, rays, particles.
import React from 'react';
import {useShot, useUid, rnd, wave, W, H, clamp} from './core';

export type Stops = [number, string][];

export const Sky: React.FC<{stops: Stops; y0?: number; y1?: number}> = ({stops, y0 = -60, y1 = H + 60}) => {
  const u = useUid();
  return (
    <>
      <defs>
        <linearGradient id={u('sky')} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c], i) => (
            <stop key={i} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-200} y={y0} width={W + 400} height={y1 - y0} fill={`url(#${u('sky')})`} />
    </>
  );
};

/** soft glow disc (sun, moon, lamp, explosion glow far away) */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; core?: string; coreR?: number; opacity?: number; pulse?: number}> = ({
  x,
  y,
  r,
  color,
  core,
  coreR = 0,
  opacity = 1,
  pulse = 0,
}) => {
  const u = useUid();
  const {t} = useShot();
  const id = u(`glow${Math.round(x)}${Math.round(y)}${Math.round(r)}`);
  const k = 1 + pulse * wave(t, 3.3);
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={color} stopOpacity={0.4} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * k} fill={`url(#${id})`} />
      {core && coreR > 0 && <circle cx={x} cy={y} r={coreR} fill={core} />}
    </g>
  );
};

const cloudPath = (w: number, h: number) =>
  `M0 ${h} q${w * 0.1} ${-h * 0.9} ${w * 0.3} ${-h * 0.55} q${w * 0.12} ${-h * 0.6} ${w * 0.33} ${-h * 0.2} q${w * 0.2} ${-h * 0.25} ${w * 0.3} ${h * 0.35} q${w * 0.07} 0 ${w * 0.07} ${h * 0.4} z`;

/** flat poster clouds drifting slowly */
export const Clouds: React.FC<{color: string; n?: number; y?: [number, number]; seed?: string; opacity?: number; speed?: number; scale?: number}> = ({
  color,
  n = 4,
  y = [120, 380],
  seed = 'c',
  opacity = 0.55,
  speed = 8,
  scale = 1,
}) => {
  const {t} = useShot();
  return (
    <g fill={color} opacity={opacity}>
      {Array.from({length: n}).map((_, i) => {
        const w = (220 + rnd(`${seed}w${i}`) * 260) * scale;
        const h = w * (0.16 + rnd(`${seed}h${i}`) * 0.06);
        const x0 = -200 + rnd(`${seed}x${i}`) * (W + 300);
        const yy = y[0] + rnd(`${seed}y${i}`) * (y[1] - y[0]);
        const x = ((x0 + t * speed * (0.6 + rnd(`${seed}s${i}`))) % (W + 600)) - 100;
        return <path key={i} transform={`translate(${x} ${yy})`} d={cloudPath(w, h)} />;
      })}
    </g>
  );
};

/** rising smoke column made of drifting soft puffs (no blur filter) */
export const Smoke: React.FC<{x: number; y: number; h?: number; w?: number; color: string; opacity?: number; seed?: string; lean?: number}> = ({
  x,
  y,
  h = 420,
  w = 70,
  color,
  opacity = 0.55,
  seed = 's',
  lean = 0.25,
}) => {
  const {t} = useShot();
  const n = 14;
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const life = ((t * 0.09 + i / n + rnd(`${seed}${i}`) * 0.05) % 1);
        const yy = y - life * h;
        const xx = x + life * h * lean + wave(t + i, 7, i * 0.13) * 14 * life;
        const r = w * (0.35 + life * 0.9);
        return <circle key={i} cx={xx} cy={yy} r={r} opacity={opacity * (1 - life) * Math.min(1, life * 6)} />;
      })}
    </g>
  );
};

/** layered flat sea from horizon down, with slow moving light streaks */
export const Sea: React.FC<{y: number; top: string; bottom: string; streak?: string; streaks?: number; seed?: string}> = ({
  y,
  top,
  bottom,
  streak,
  streaks = 18,
  seed = 'sea',
}) => {
  const u = useUid();
  const {t} = useShot();
  return (
    <g>
      <defs>
        <linearGradient id={u('sea')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-200} y={y} width={W + 400} height={H - y + 200} fill={`url(#${u('sea')})`} />
      {streak &&
        Array.from({length: streaks}).map((_, i) => {
          const yy = y + 6 + Math.pow(rnd(`${seed}y${i}`), 1.6) * (H - y);
          const depth = (yy - y) / (H - y);
          const len = 40 + depth * 220 * rnd(`${seed}l${i}`);
          const xx = rnd(`${seed}x${i}`) * (W + 200) - 100 + wave(t, 9 + i, i * 0.3) * 18 * (0.3 + depth);
          return (
            <rect
              key={i}
              x={xx}
              y={yy}
              width={len}
              height={1.5 + depth * 3}
              rx={2}
              fill={streak}
              opacity={(0.25 + 0.35 * depth) * (0.6 + 0.4 * wave(t, 4 + (i % 5), i * 0.21))}
            />
          );
        })}
    </g>
  );
};

/** soft fog bands */
export const Mist: React.FC<{y: number; color: string; opacity?: number; bands?: number; seed?: string}> = ({y, color, opacity = 0.25, bands = 3, seed = 'm'}) => {
  const {t} = useShot();
  return (
    <g fill={color}>
      {Array.from({length: bands}).map((_, i) => {
        const yy = y + i * 34;
        const x = wave(t, 18 + i * 5, i * 0.3) * 60 - 100;
        return <ellipse key={i} cx={W / 2 + x} cy={yy} rx={W * 0.75} ry={26 + i * 8} opacity={opacity * (1 - i / (bands + 1))} />;
      })}
    </g>
  );
};

export const Rain: React.FC<{color?: string; n?: number; opacity?: number; seed?: string}> = ({color = '#c9d6e0', n = 140, opacity = 0.35, seed = 'r'}) => {
  const {t} = useShot();
  return (
    <g stroke={color} strokeWidth={1.4} opacity={opacity}>
      {Array.from({length: n}).map((_, i) => {
        const sp = 900 + rnd(`${seed}s${i}`) * 400;
        const x0 = rnd(`${seed}x${i}`) * (W + 200) - 100;
        const y = ((rnd(`${seed}y${i}`) * (H + 200) + t * sp) % (H + 200)) - 100;
        const x = x0 - (y + 100) * 0.12;
        return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 34} />;
      })}
    </g>
  );
};

export const Snow: React.FC<{color?: string; n?: number; opacity?: number; seed?: string}> = ({color = '#eef3f8', n = 110, opacity = 0.7, seed = 'sn'}) => {
  const {t} = useShot();
  return (
    <g fill={color} opacity={opacity}>
      {Array.from({length: n}).map((_, i) => {
        const sp = 30 + rnd(`${seed}s${i}`) * 40;
        const r = 1.5 + rnd(`${seed}r${i}`) * 3;
        const y = ((rnd(`${seed}y${i}`) * (H + 100) + t * sp) % (H + 100)) - 50;
        const x = rnd(`${seed}x${i}`) * W + wave(t, 5 + (i % 4), i * 0.17) * 20;
        return <circle key={i} cx={x} cy={y} r={r} />;
      })}
    </g>
  );
};

/** small flock of flat birds slowly crossing */
export const Birds: React.FC<{color: string; n?: number; x?: number; y?: number; speed?: number; seed?: string; scale?: number}> = ({
  color,
  n = 4,
  x = 600,
  y = 260,
  speed = 18,
  seed = 'b',
  scale = 1,
}) => {
  const {t} = useShot();
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const bx = x + i * 60 * scale + rnd(`${seed}${i}`) * 50 + t * speed;
        const by = y + rnd(`${seed}y${i}`) * 60 + wave(t, 6, i * 0.2) * 6;
        const flap = 4 + 4 * wave(t, 0.7, i * 0.37);
        const s = (0.8 + rnd(`${seed}s${i}`) * 0.5) * scale;
        return <path key={i} transform={`translate(${bx} ${by}) scale(${s})`} d={`M-12 ${-flap} L0 0 L12 ${-flap} L0 3z`} />;
      })}
    </g>
  );
};

/** sweeping searchlight beam from a point */
export const Searchlight: React.FC<{x: number; y: number; len?: number; color?: string; angle?: number; sweep?: number; period?: number; opacity?: number; width?: number}> = ({
  x,
  y,
  len = 1300,
  color = '#dfe8f0',
  angle = -70,
  sweep = 18,
  period = 14,
  opacity = 0.16,
  width = 70,
}) => {
  const u = useUid();
  const {t} = useShot();
  const a = angle + sweep * wave(t, period);
  const id = u(`sl${Math.round(x)}`);
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={opacity * 2} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M0 -4 L${len} ${-width} L${len} ${width} L0 4z`} fill={`url(#${id})`} />
    </g>
  );
};

/** flickering warm light source (fire, lamp) */
export const Flicker: React.FC<{x: number; y: number; r: number; color: string; opacity?: number; seed?: string}> = ({x, y, r, color, opacity = 0.8, seed = 'fl'}) => {
  const {f} = useShot();
  const k = 0.85 + 0.15 * rnd(`${seed}${Math.floor(f / 3)}`);
  return <Glow x={x} y={y} r={r * k} color={color} opacity={opacity * k} />;
};

/** fire: flat flame tongues + glow */
export const Fire: React.FC<{x: number; y: number; w?: number; h?: number; seed?: string}> = ({x, y, w = 160, h = 140, seed = 'fire'}) => {
  const {t} = useShot();
  const tongues = 7;
  return (
    <g>
      <Flicker x={x} y={y - h * 0.3} r={w * 2.2} color="#ff9a4a" opacity={0.55} seed={seed} />
      {Array.from({length: tongues}).map((_, i) => {
        const fx = x - w / 2 + (i + 0.5) * (w / tongues);
        const fh = h * (0.5 + 0.5 * rnd(`${seed}h${i}`)) * (0.8 + 0.2 * wave(t, 0.6 + rnd(`${seed}p${i}`) * 0.5, i * 0.3));
        const fw = w / tongues * 1.6;
        return (
          <g key={i}>
            <path d={`M${fx - fw / 2} ${y} Q${fx - fw / 3} ${y - fh * 0.6} ${fx + wave(t, 1.3, i * 0.2) * 8} ${y - fh} Q${fx + fw / 3} ${y - fh * 0.5} ${fx + fw / 2} ${y}z`} fill="#f2763a" opacity={0.9} />
            <path d={`M${fx - fw / 4} ${y} Q${fx} ${y - fh * 0.55} ${fx + fw / 4} ${y}z`} fill="#ffd27a" opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

/** diagonal light shafts (underwater / window light) */
export const Rays: React.FC<{x: number; y: number; color: string; n?: number; opacity?: number; spread?: number; len?: number}> = ({
  x,
  y,
  color,
  n = 5,
  opacity = 0.12,
  spread = 500,
  len = 1100,
}) => {
  const {t} = useShot();
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const dx = -spread / 2 + (i / Math.max(1, n - 1)) * spread;
        const w = 30 + (i % 3) * 25;
        const o = opacity * (0.6 + 0.4 * wave(t, 6 + i, i * 0.27));
        return <path key={i} d={`M${x + dx} ${y} L${x + dx + w} ${y} L${x + dx * 2.2 + w * 3} ${y + len} L${x + dx * 2.2} ${y + len}z`} opacity={o} />;
      })}
    </g>
  );
};

/** floating dust / plankton specks */
export const Particles: React.FC<{color: string; n?: number; opacity?: number; seed?: string; area?: [number, number, number, number]; rise?: number}> = ({
  color,
  n = 60,
  opacity = 0.4,
  seed = 'pt',
  area = [0, 0, W, H],
  rise = 8,
}) => {
  const {t} = useShot();
  const [ax, ay, aw, ah] = area;
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const x = ax + rnd(`${seed}x${i}`) * aw + wave(t, 8 + (i % 5), i * 0.1) * 10;
        const y = ay + ((rnd(`${seed}y${i}`) * ah - t * rise * (0.5 + rnd(`${seed}s${i}`))) % ah + ah) % ah;
        const r = 1 + rnd(`${seed}r${i}`) * 2.2;
        return <circle key={i} cx={x} cy={y} r={r} opacity={opacity * (0.4 + 0.6 * rnd(`${seed}o${i}`))} />;
      })}
    </g>
  );
};

/** bubbles rising */
export const Bubbles: React.FC<{x: number; y: number; color?: string; n?: number; seed?: string}> = ({x, y, color = '#bfe6ee', n = 10, seed = 'bb'}) => {
  const {t} = useShot();
  return (
    <g fill="none" stroke={color} strokeWidth={1.5}>
      {Array.from({length: n}).map((_, i) => {
        const life = (t * 0.25 + i / n) % 1;
        return <circle key={i} cx={x + wave(t, 2, i * 0.3) * 8 + rnd(`${seed}${i}`) * 30} cy={y - life * 300} r={2 + rnd(`${seed}r${i}`) * 5} opacity={0.6 * (1 - life)} />;
      })}
    </g>
  );
};

/** waving flag: plain colors only (pass a render fn for the emblem) */
export const Flag: React.FC<{x: number; y: number; w?: number; h?: number; pole?: number; field: string; emblem?: (w: number, h: number) => React.ReactNode; poleColor?: string}> = ({
  x,
  y,
  w = 90,
  h = 60,
  pole = 160,
  field,
  emblem,
  poleColor = '#1a1a1a',
}) => {
  const {t} = useShot();
  const a = 6 * wave(t, 2.2);
  const b = 6 * wave(t, 2.2, 0.35);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-2} y={0} width={4} height={pole} fill={poleColor} />
      <path d={`M2 4 Q${w * 0.33} ${4 + a} ${w * 0.66} ${4 + b} T${w} ${4 + a} L${w} ${h + a} Q${w * 0.66} ${h + b} ${w * 0.33} ${h + a} T2 ${h}z`} fill={field} />
      {emblem && <g transform={`translate(2 ${4 + a * 0.5})`}>{emblem(w, h)}</g>}
    </g>
  );
};

/** simple ripple rings on water */
export const Ripples: React.FC<{x: number; y: number; color: string; n?: number; period?: number; max?: number}> = ({x, y, color, n = 3, period = 3, max = 120}) => {
  const {t} = useShot();
  return (
    <g fill="none" stroke={color}>
      {Array.from({length: n}).map((_, i) => {
        const life = ((t / period + i / n) % 1);
        return <ellipse key={i} cx={x} cy={y} rx={max * life} ry={max * life * 0.22} strokeWidth={2} opacity={0.6 * (1 - life)} />;
      })}
    </g>
  );
};

/** column of white water rising slowly (mine detonation / underwater blast) - soft, no flash */
export const WaterColumn: React.FC<{x: number; y: number; h: number; w?: number; color?: string; start?: number; dur?: number}> = ({
  x,
  y,
  h,
  w = 90,
  color = '#e8eef0',
  start = 0.25,
  dur = 0.6,
}) => {
  const {p} = useShot();
  const k = clamp((p - start) / dur);
  const rise = Math.sin(Math.min(1, k) * Math.PI * 0.85);
  if (k <= 0) return null;
  const hh = h * rise;
  return (
    <g fill={color}>
      <path d={`M${x - w / 2} ${y} C${x - w / 2} ${y - hh * 0.6} ${x - w * 0.9} ${y - hh * 0.9} ${x - w * 0.3} ${y - hh} C${x} ${y - hh * 1.1} ${x + w * 0.3} ${y - hh} C${x + w * 0.9} ${y - hh * 0.9} ${x + w / 2} ${y - hh * 0.6} ${x + w / 2} ${y}z`} opacity={0.85 * (1 - k * 0.5)} />
      <ellipse cx={x} cy={y} rx={w * 1.8 * k + 20} ry={(w * 1.8 * k + 20) * 0.18} opacity={0.5 * (1 - k)} />
    </g>
  );
};
