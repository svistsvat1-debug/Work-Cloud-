// Core of the cinematic 2D engine: shot clock, camera move with parallax layers,
// film overlay (pre-rendered grain + paper + vignette), seeded helpers.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, random} from 'remotion';

export const W = 1920;
export const H = 1080;

// ---------- math helpers ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rnd = (seed: string | number) => random(String(seed));
/** gentle looping value in [-1,1] */
export const wave = (t: number, period: number, phase = 0) => Math.sin(((t / period) + phase) * Math.PI * 2);

// ---------- shot clock ----------
export type ShotCtx = {f: number; d: number; t: number; p: number; e: number; fps: number; id: string};
const Ctx = createContext<ShotCtx>({f: 0, d: 1, t: 0, p: 0, e: 0, fps: 30, id: 'x'});
export const useShot = () => useContext(Ctx);

/** time helpers inside a shot: t = seconds, p = progress 0..1, e = eased progress */
export const ShotClock: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d, fps} = useVideoConfig();
  const p = clamp(f / Math.max(1, d - 1));
  return <Ctx.Provider value={{f, d, t: f / fps, p, e: smooth(p), fps, id}}>{children}</Ctx.Provider>;
};

/** unique svg id per shot (gradients etc.) */
export const useUid = () => {
  const {id} = useShot();
  return (name: string) => `${id}-${name}`;
};

// ---------- camera ----------
export type Move =
  | {type: 'push'; amount?: number; ox?: number; oy?: number}
  | {type: 'pull'; amount?: number; ox?: number; oy?: number}
  | {type: 'drift'; amount?: number; dir?: 1 | -1; ox?: number; oy?: number}
  | {type: 'rise'; amount?: number};

const CamCtx = createContext<Move>({type: 'push', amount: 0.03});

/** A shot frame: one SVG, children are <Layer depth=..>. Camera move applied per layer with parallax. */
export const Frame: React.FC<{move?: Move; bg?: string; children: React.ReactNode; overlay?: React.ReactNode}> = ({
  move = {type: 'push', amount: 0.03},
  bg = '#000',
  children,
  overlay,
}) => {
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <CamCtx.Provider value={move}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
          {children}
        </svg>
      </CamCtx.Provider>
      {overlay}
      <FilmOverlay />
    </AbsoluteFill>
  );
};

/** Parallax layer. depth 0 = far sky (moves least) .. 1 = foreground (moves most). */
export const Layer: React.FC<{depth: number; children: React.ReactNode; opacity?: number}> = ({depth, children, opacity}) => {
  const move = useContext(CamCtx);
  const {e} = useShot();
  const k = 0.35 + depth * 0.95; // parallax factor
  let s = 1;
  let x = 0;
  let y = 0;
  let ox = W * 0.5;
  let oy = H * 0.55;
  if (move.type === 'push' || move.type === 'pull') {
    const a = move.amount ?? 0.03;
    const prog = move.type === 'push' ? e : 1 - e;
    s = 1 + a * prog * k;
    ox = W * (move.ox ?? 0.5);
    oy = H * (move.oy ?? 0.55);
  } else if (move.type === 'drift') {
    const a = move.amount ?? 0.02;
    const dir = move.dir ?? 1;
    x = -dir * W * a * (e - 0.5) * 2 * k * 0.5;
    s = 1.02 + 0.01 * k; // tiny overscan so edges never show
    ox = W * (move.ox ?? 0.5);
    oy = H * (move.oy ?? 0.55);
  } else if (move.type === 'rise') {
    const a = move.amount ?? 0.02;
    y = H * a * (e - 0.5) * 2 * k * 0.5;
    s = 1.02 + 0.01 * k;
  }
  const tr = `translate(${x} ${y}) translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`;
  return (
    <g transform={tr} opacity={opacity}>
      {children}
    </g>
  );
};

// ---------- film overlay ----------
export const FilmOverlay: React.FC<{grain?: number; paper?: number; vignette?: number}> = ({grain = 0.085, paper = 0.16, vignette = 0.55}) => {
  const f = useCurrentFrame();
  const g = f % 8;
  // shift grain a little each frame so even repeats never look static
  const ox = Math.floor(rnd(`gx${f}`) * 40) - 20;
  const oy = Math.floor(rnd(`gy${f}`) * 40) - 20;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Img
        src={staticFile('paper.png')}
        style={{position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'soft-light', opacity: paper * 3}}
      />
      <Img
        src={staticFile(`grain/g${g}.png`)}
        style={{
          position: 'absolute',
          left: -40 + ox,
          top: -40 + oy,
          width: W + 80,
          height: H + 80,
          mixBlendMode: 'overlay',
          opacity: grain * 3,
          imageRendering: 'auto',
        }}
      />
      <AbsoluteFill
        style={{background: `radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`}}
      />
    </AbsoluteFill>
  );
};

// ---------- fade helpers (used by the timeline for quest transitions) ----------
export const FadeBlack: React.FC<{inF?: number; outF?: number}> = ({inF = 0, outF = 0}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  let o = 0;
  if (inF > 0) o = Math.max(o, 1 - clamp(f / inF));
  if (outF > 0) o = Math.max(o, clamp((f - (d - outF)) / outF));
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: '#000', opacity: o}} />;
};
