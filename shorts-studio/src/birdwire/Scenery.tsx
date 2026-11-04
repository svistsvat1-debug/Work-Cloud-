import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {INK} from './util';

export type Cam = {x: number; y: number; z: number};

/** one flat layer of the 2.5D multiplane world. k = F / (Z - camZ), F = 1000 */
export const Layer: React.FC<{cam: Cam; z: number; shake?: {x: number; y: number}; minDepth?: number; children: React.ReactNode}> = ({cam, z, shake = {x: 0, y: 0}, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + shake.x}px, ${960 + shake.y}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        <svg width={1} height={1} style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}>
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const Sky: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, #63BDF3 0%, #9BD7FA 55%, #D9F2FF 100%)'}} />;

// ---------------------------------------------------------------- backdrop geometry (world units of each layer)
type Circle = {x: number; y: number; r: number};

const cloud = (cx: number, cy: number, s: number): Circle[] =>
  [
    [-1.1, 0.25, 0.55],
    [-0.55, -0.15, 0.75],
    [0.15, -0.35, 0.95],
    [0.85, -0.05, 0.7],
    [1.35, 0.3, 0.45],
    [0.2, 0.3, 0.7],
    [-0.5, 0.35, 0.6],
    [0.9, 0.35, 0.55],
  ].map(([x, y, r]) => ({x: cx + x * s, y: cy + y * s, r: r * s}));

const clouds = (t: number, dur: number) => {
  const drift = 70 * Math.sin((2 * Math.PI * t) / dur); // gentle sway that returns -> seamless loop
  return [
    ...cloud(-1250 + drift, -2650, 330),
    ...cloud(1950 + drift * 0.8, -1950, 280),
    ...cloud(250 + drift * 1.1, -1000, 220),
    ...cloud(2900 + drift, -3300, 360),
    ...cloud(-2600 + drift * 0.9, -1300, 260),
  ];
};

const hillPath = (x0: number, x1: number, base: number, amps: [number, number, number][], bottom: number) => {
  let d = `M${x0},${bottom}`;
  for (let x = x0; x <= x1; x += 40) {
    const y = base + amps.reduce((s, [a, f, p]) => s + a * Math.sin(x * f + p), 0);
    d += ` L${x},${y.toFixed(1)}`;
  }
  return d + ` L${x1},${bottom} Z`;
};
const FAR_HILLS = hillPath(-4000, 5000, 2930, [[120, 0.0011, 0.4], [60, 0.0027, 2.0], [25, 0.007, 1.0]], 9000);
const nearBase = 2480;
const nearAmps: [number, number, number][] = [
  [90, 0.0014, 1.7],
  [40, 0.0035, 0.3],
];
const nearY = (x: number) => nearBase + nearAmps.reduce((s, [a, f, p]) => s + a * Math.sin(x * f + p), 0);
const NEAR_HILLS = hillPath(-4000, 5000, nearBase, nearAmps, 9000);
const TREES = [-1500, -350, 1350, 2150, 3300].map((x, i) => ({x, y: nearY(x) + 10, s: i % 2 ? 1.25 : 1.6}));

// ---------------------------------------------------------------- canvas backdrop with cheap depth of field
// The far layers are painted on a canvas. With depth of field on, the canvas runs at a lower resolution
// and is blurred there (the blur hides the lower resolution), so close-ups cost almost nothing at 4K.
const puffs = (ctx: CanvasRenderingContext2D, items: Circle[], fill: string, ol: number) => {
  ctx.fillStyle = INK;
  for (const c of items) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r + ol, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = fill;
  for (const c of items) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
};

const paintLayers = (ctx: CanvasRenderingContext2D, cam: Cam, shake: {x: number; y: number}, t: number, dur: number) => {
  const layer = (z: number, draw: () => void) => {
    const k = 1000 / (z - cam.z);
    ctx.save();
    ctx.translate(540 + shake.x, 960 + shake.y);
    ctx.scale(k, k);
    ctx.translate(-cam.x, -cam.y);
    draw();
    ctx.restore();
  };
  ctx.lineJoin = 'round';
  layer(5200, () => puffs(ctx, clouds(t, dur), '#FFFFFF', 22));
  layer(3800, () => {
    const p = new Path2D(FAR_HILLS);
    ctx.fillStyle = '#A6DD93';
    ctx.fill(p);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 18;
    ctx.stroke(p);
  });
  layer(2300, () => {
    for (const tr of TREES) {
      ctx.save();
      ctx.translate(tr.x, tr.y);
      ctx.scale(tr.s, tr.s);
      ctx.fillStyle = '#8F5F36';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 11;
      ctx.fillRect(-14, -90, 28, 92);
      ctx.strokeRect(-14, -90, 28, 92);
      puffs(
        ctx,
        [
          {x: 0, y: -170, r: 78},
          {x: -58, y: -120, r: 58},
          {x: 58, y: -122, r: 60},
          {x: 0, y: -110, r: 62},
        ],
        '#5FB255',
        11,
      );
      ctx.restore();
    }
    const p = new Path2D(NEAR_HILLS);
    ctx.fillStyle = '#7FC86C';
    ctx.fill(p);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.stroke(p);
  });
};

export const Backdrop: React.FC<{cam: Cam; shake: {x: number; y: number}; dof: number; t: number; dur: number}> = ({cam, shake, dof, t, dur}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  // canvas pixels per composition pixel: full device resolution when sharp, lower when blurred
  const ratio = dof > 0.05 ? Math.max(0.35, Math.min(dpr, 1.6 / dof)) : dpr;
  const w = Math.round(1080 * ratio);
  const h = Math.round(1920 * ratio);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (dof > 0.05) {
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const o = off.getContext('2d')!;
      o.setTransform(ratio, 0, 0, ratio, 0, 0);
      paintLayers(o, cam, shake, t, dur);
      ctx.filter = `blur(${(dof * ratio).toFixed(2)}px)`;
      ctx.drawImage(off, 0, 0);
      ctx.filter = 'none';
    } else {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paintLayers(ctx, cam, shake, t, dur);
    }
  });
  return <canvas ref={ref} width={w} height={h} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} />;
};
