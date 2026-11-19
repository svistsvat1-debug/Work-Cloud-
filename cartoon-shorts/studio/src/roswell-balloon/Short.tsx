import React, {useRef, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {SP} from './sprites';
import {SP as SPN} from '../not-a-bomb/sprites';
import {C_BASE, C_BUT, C_SKY, C_TURNS, C_YEARS, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as RSW_DURATION, FPS as RSW_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "What really crashed at Roswell?" (Roswell, New Mexico, 1947 - Wikipedia Roswell incident / Project Mogul, USAF Roswell Report 1995,
// Skeptical Inquirer 1995). A rancher in a cowboy hat finds shiny foil, rubber and sticks all over the ranch (a foil glint, a rubber strip
// boings, a stick flips, the camera pulls out: bits everywhere, foil flapping on the windmill). SO (cut): at the army airfield an officer
// shouts into a megaphone, a newspaper spins in - ARMY CAPTURES FLYING DISC - and lands in the rancher's hands. BUT (punch-in, music stop):
// a clock spins 'hours later', the officer swaps to his sign - JUST A / WEATHER / BALLOON - and the hovering flying saucer poofs into a
// limp weather balloon; the rancher drops the paper and shrugs. THIRTY YEARS LATER (cut): the ranch at night, the calendar flips 1947 ->
// 1978, tinfoil-hat fans at a conspiracy board with red strings, an alien drawing, a COVER-UP? stamp. TURNS OUT (cut): the airfield, the
// officer goes 'shh', a fan peeks in shocked, TOP SECRET slams onto the hangar doors. IT REALLY WAS A BALLOON: the doors slide open and
// a long train of balloons with foil kites rises out (the camera tilts up), the top balloon smiles; a rain cloud shakes its head - not for
// weather. A SECRET ONE (cut): high above the clouds, down the line to a little listening device with a huge ear and a TOP SECRET tag;
// far away a tiny mushroom cloud, sound rings travel to the ear and the device jumps on 'bombs'; a foil scrap tears off and falls (loop).
// Pictures: 8 ElevenLabs GPT Image 2.5 pictures, all 1K LOW (hero + 3 three-pose sheets + objects sheet + 3 plates) + 2 reused reporter
// cut-outs from not-a-bomb (#39); everything else is code.

const F = (n: string) => (n.startsWith('nab:') ? staticFile(`not-a-bomb/${n.slice(4)}.png`) : staticFile(`roswell-balloon/${n}.png`));
export const FONT = 'RSWInter';
export const useRSWFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const OW = 5;
const RED = '#E8382E';
const YEL = '#FFE45C';
const FOIL = '#C9CDD2';
const FOIL_SH = '#8E959D';
const FOIL_HI = '#F2F4F6';
const WOOD = '#E2C38E';
const RUBBER = '#8A7262';
const BALLOON = '#F1E4C8';
const BALLOON_SH = '#D9C59E';
const CORK = '#C8955A';
const CORK_SH = '#A9763F';
const FRAME = '#7E5128';
const PAPER = '#FBF7EC';

// ---------- helpers ----------
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));
const tremble = (t: number, a: number) => a * (Math.sin(2 * Math.PI * 17 * t) * 0.6 + Math.sin(2 * Math.PI * 23 * t + 1) * 0.4);

// SVG <image> that holds the frame until the picture is loaded; keyed by href so a pose swap waits again.
const SImg: React.FC<{href: string; x: number; y: number; width: number; height: number; preserveAspectRatio?: string}> = ({href, ...rest}) => {
  const [handle] = useState(() => delayRender(`svg image ${href}`, {timeoutInMilliseconds: 60000}));
  const done = useRef(false);
  const fin = () => {
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  };
  return <image href={href} {...rest} onLoad={fin} onError={fin} />;
};

type Info = {w: number; h: number; feet: [number, number]; hw?: [number, number, number]; R?: number; [k: string]: unknown};
const S = (n: string): Info =>
  n.startsWith('nab:') ? (SPN as unknown as Record<string, Info>)[n.slice(4)] : (SP as unknown as Record<string, Info>)[n];
const headR = (n: string) => (n.startsWith('nab:') ? 104 : (S(n).R as number));
const sc = (n: string, r: number) => r / headR(n);

// a character sprite inside a world SVG, anchored at the feet; r = head radius in world px
const G: React.FC<{n: string; x: number; y: number; r: number; mir?: boolean; sx?: number; sy?: number; rot?: number}> = ({n, x, y, r, mir = false, sx = 1, sy = 1, rot = 0}) => {
  const sp = S(n);
  const s = sc(n, r);
  const [ax, ay] = sp.feet;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(mir ? -1 : 1) * sx} ${sy})`}>
      <SImg key={n} href={F(n)} x={-ax * s} y={-ay * s} width={sp.w * s} height={sp.h * s} />
    </g>
  );
};
// world point of a sprite pixel for a sprite placed with G (no rotation)
const spt = (n: string, x: number, y: number, r: number, px: number, py: number, mir = false): [number, number] => {
  const sp = S(n);
  const s = sc(n, r);
  return [x + (mir ? -1 : 1) * (px - sp.feet[0]) * s, y + (py - sp.feet[1]) * s];
};
const headOf = (n: string, x: number, y: number, r: number, mir = false): [number, number] => {
  const h = S(n).hw as [number, number, number];
  return spt(n, x, y, r, h[0], h[1], mir);
};
// an object sprite centred at (x, y), scale s, rotation rot
const O: React.FC<{n: string; x: number; y: number; s: number; rot?: number; sx?: number; sy?: number}> = ({n, x, y, s, rot = 0, sx = 1, sy = 1}) => {
  const sp = S(n);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s * sy})`}>
      <SImg href={F(n)} x={-sp.w / 2} y={-sp.h / 2} width={sp.w} height={sp.h} />
    </g>
  );
};
// a character with breathing + optional squash, at its feet
const Guy: React.FC<{n: string; x: number; y: number; r: number; t: number; mir?: boolean; sw?: [number, number]; ph?: number; rot?: number; dx?: number}> = ({n, x, y, r, t, mir = false, sw = [1, 1], ph = 0, rot = 0, dx = 0}) => (
  <g transform={`translate(${x + dx} ${y}) rotate(${rot}) scale(${sw[0]} ${sw[1] * breathe(t, ph)})`}>
    <ellipse cx={0} cy={0} rx={r * 1.15} ry={r * 0.16} fill="rgba(72,54,42,0.26)" />
    <G n={n} x={0} y={0} r={r} mir={mir} />
  </g>
);

const FullSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -9000, top: -9000, overflow: 'visible'}} width={18000} height={27000} viewBox="-9000 -9000 18000 27000">
    {children}
  </svg>
);
const Screen: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {children}
    </svg>
  </AbsoluteFill>
);
// a world point -> screen point for a camera
const toScreen = (cam: Cam, x: number, y: number): [number, number] => [540 + (x - cam.x) * cam.k, 960 + (y - cam.y) * cam.k];

// ---------- plates (mirror-padded in prep; horizon / cloud line at world y = 0, original plate centre at world x = 0) ----------
type PlateDef = {n: string; ps: number; horizon: number; padL: number; w: number; h: number; skyTop: string; ground: string};
const RANCH: PlateDef = {n: 'ranch_pad', ps: 1.45, horizon: 822, padL: 512, w: 2048, h: 1920, skyTop: '#75CCFC', ground: '#E5BB78'};
const BASE: PlateDef = {n: 'base_pad', ps: 1.5, horizon: 840, padL: 0, w: 1024, h: 1920, skyTop: '#79CCF9', ground: '#BCB8AF'};
const SKY: PlateDef = {n: 'sky_pad', ps: 1.5, horizon: 920, padL: 512, w: 2048, h: 1920, skyTop: '#2E78D6', ground: '#D8E9F7'};
const Plate: React.FC<{p: PlateDef}> = ({p}) => {
  const x0 = -(p.padL + 512) * p.ps;
  const y0 = -p.horizon * p.ps;
  return (
    <FullSvg>
      <rect x={-9000} y={-9000} width={18000} height={9000 + y0 + 4} fill={p.skyTop} />
      <rect x={-9000} y={y0 + p.h * p.ps - 4} width={18000} height={9000} fill={p.ground} />
      <SImg href={F(p.n)} x={x0} y={y0} width={p.w * p.ps} height={p.h * p.ps} />
    </FullSvg>
  );
};

// ---------- small code props ----------
const Glint: React.FC<{x: number; y: number; t: number; t0: number; size?: number; dur?: number}> = ({x, y, t, t0, size = 1, dur = 0.5}) => {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return null;
  const s = size * Math.sin(Math.PI * u);
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${u * 90}) scale(${s})`}
      d="M 0 -42 L 9 -9 L 42 0 L 9 9 L 0 42 L -9 9 L -42 0 L -9 -9 Z"
      fill="#fff"
      stroke={INK}
      strokeWidth={4.5}
      strokeLinejoin="round"
    />
  );
};
const Scrap: React.FC<{x: number; y: number; s: number; rot?: number; seed?: number}> = ({x, y, s, rot = 0, seed = 1}) => {
  const pts = Array.from({length: 7}, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const r = 30 + 14 * rnd(seed * 13 + i);
    return `${(r * Math.cos(a) * 1.4).toFixed(1)},${(r * Math.sin(a) * 0.7).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <polygon points={pts} fill={FOIL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -20 -6 L 4 4 L 22 -8" fill="none" stroke={FOIL_SH} strokeWidth={4} />
      <path d="M -8 -14 L 10 -12" fill="none" stroke={FOIL_HI} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};
const TextT: React.FC<{x: number; y: number; size: number; fill?: string; stroke?: number; children: React.ReactNode; rot?: number; anchor?: 'middle' | 'start'}> = ({
  x,
  y,
  size,
  fill = '#fff',
  stroke = 0,
  children,
  rot = 0,
  anchor = 'middle',
}) => (
  <text
    x={x}
    y={y}
    transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}
    textAnchor={anchor}
    fontFamily={FONT}
    fontWeight={900}
    fontSize={size}
    fill={fill}
    stroke={stroke ? INK : undefined}
    strokeWidth={stroke || undefined}
    strokeLinejoin="round"
    style={{paintOrder: 'stroke'}}
  >
    {children}
  </text>
);
const FlashBurst: React.FC<{x: number; y: number; t: number; t0: number; size?: number}> = ({x, y, t, t0, size = 1}) => {
  const u = (t - t0) / 0.22;
  if (u < 0 || u > 1) return null;
  const s = size * (0.6 + 0.8 * easeOutCubic(u)) * (1 - 0.6 * u);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d={
          Array.from({length: 16}, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r = i % 2 ? 46 : 120;
            return `${i ? 'L' : 'M'} ${r * Math.cos(a)} ${r * Math.sin(a)}`;
          }).join(' ') + ' Z'
        }
        fill="#FFF7B8"
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle r={40} fill="#fff" />
    </g>
  );
};
// a neoprene sounding balloon (code), centre (x, y), width w; face = 0..1 pop of happy eyes; sad droops
const Balloon: React.FC<{x: number; y: number; w: number; rot?: number; face?: number; sad?: number; t?: number; squash?: number}> = ({x, y, w, rot = 0, face = 0, sad = 0, t = 0, squash = 1}) => {
  const h = w * 1.18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${1 / Math.sqrt(squash)} ${squash})`}>
      <path d={`M 0 ${h * 0.5} L ${-w * 0.08} ${h * 0.6} L ${w * 0.08} ${h * 0.6} Z`} fill={BALLOON_SH} stroke={INK} strokeWidth={w * 0.035} strokeLinejoin="round" />
      <ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} fill={BALLOON} stroke={INK} strokeWidth={w * 0.045} />
      <ellipse cx={w * 0.12} cy={h * 0.1} rx={w * 0.3} ry={h * 0.34} fill={BALLOON_SH} opacity={0.55} />
      <ellipse cx={-w * 0.2} cy={-h * 0.22} rx={w * 0.08} ry={h * 0.12} fill="#fff" opacity={0.85} />
      {face > 0.01 ? (
        <g>
          <Eye x={-w * 0.15} y={-h * 0.04} r={w * 0.11} open={face} side={-1} look={[0.2, -0.2]} brow={sad > 0.5 ? 0.5 : 0.55} browTilt={sad > 0.5 ? -0.9 : 0} lid={sad > 0.5 ? 0.35 : 0} />
          <Eye x={w * 0.15} y={-h * 0.04} r={w * 0.11} open={face} side={1} look={[0.2, -0.2]} brow={sad > 0.5 ? 0.5 : 0.55} browTilt={sad > 0.5 ? -0.9 : 0} lid={sad > 0.5 ? 0.35 : 0} />
          <path
            d={sad > 0.5 ? `M ${-w * 0.12} ${h * 0.22} Q 0 ${h * 0.12} ${w * 0.12} ${h * 0.22}` : `M ${-w * 0.14} ${h * 0.14} Q 0 ${h * 0.28} ${w * 0.14} ${h * 0.14}`}
            fill="none"
            stroke={INK}
            strokeWidth={w * 0.04}
            strokeLinecap="round"
            transform={`scale(${face})`}
          />
        </g>
      ) : null}
      {t ? null : null}
    </g>
  );
};
// the TOP SECRET tag / stamp text box
const Stamp: React.FC<{x: number; y: number; s: number; rot?: number; text: string; w?: number; color?: string}> = ({x, y, s, rot = -8, text, w = 520, color = RED}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-62} width={w} height={124} rx={14} fill="rgba(255,255,255,0.18)" stroke={color} strokeWidth={14} />
      <rect x={-w / 2 + 16} y={-46} width={w - 32} height={92} rx={8} fill="none" stroke={color} strokeWidth={5} />
      <TextT x={0} y={26} size={76} fill={color}>
        {text}
      </TextT>
    </g>
  );

// ======================================================================================================
// scene 1: the ranch (0 - 4.74)
// ======================================================================================================
const R1 = {x: -90, y: 760, r: 150};
const HEAP = {x: 330, y: 820, s: 0.85};
const FAR: [number, number, number, number][] = [
  // x, y(bottom), scale, flip
  [-560, 380, 0.42, 1],
  [640, 330, 0.36, -1],
  [-250, 170, 0.27, -1],
  [420, 120, 0.22, 1],
  [-720, 140, 0.25, 1],
  [90, 70, 0.18, -1],
  [760, 620, 0.5, 1],
];
const SCRAPS: [number, number, number, number][] = [
  [-420, 900, 1.0, 20],
  [120, 960, 0.9, -15],
  [-650, 620, 0.8, 40],
  [560, 520, 0.7, -30],
  [-120, 420, 0.55, 10],
  [250, 260, 0.45, 25],
  [-380, 260, 0.4, -20],
];
const WIND = {x: (894 - 512) * 1.45, y: (650 - 822) * 1.45};
const RANCH_CAM: CamKey[] = [
  {t: 0, x: 40, y: 300, k: 1.05},
  {t: 3.25, x: 20, y: 290, k: 1.1},
  {t: 4.55, x: 60, y: 140, k: 0.68},
  {t: C_BASE, x: 60, y: 136, k: 0.675},
];
const Heap: React.FC<{x: number; y: number; s: number; flip?: number}> = ({x, y, s, flip = 1}) => {
  const sp = S('debris');
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <SImg href={F('debris')} x={-sp.w / 2} y={-sp.h + 12} width={sp.w} height={sp.h} />
    </g>
  );
};
const RanchScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, RANCH_CAM);
  const up = t >= T.all;
  const sw = squashSwap(t, T.all);
  const hop = t > T.finds ? -10 * Math.exp(-5 * (t - T.finds)) * Math.abs(Math.sin(Math.PI * Math.min(1, (t - T.finds) / 0.25))) : 0;
  const foilP = spt('puzzle', R1.x, R1.y, R1.r, 797, 436);
  const head = headOf('puzzle', R1.x, R1.y, R1.r);
  const q = popOut(t, T.finds, 2.2, 0.28);
  // the rubber strip boings out of the heap on "rubber"
  const rb = t > T.rubber - 0.05 ? Math.exp(-3.2 * (t - T.rubber)) : 0;
  const rubberAmp = rb * 1;
  const rubberUp = t > T.rubber - 0.05 ? easeOutBack(prog(t, T.rubber - 0.05, T.rubber + 0.2), 2.5) : 0;
  // a stick flips out of the heap on "sticks" and lands on the ground
  const st = prog(t, T.sticks - 0.02, T.sticksEnd + 0.02);
  const stickX = lerp(HEAP.x - 40, HEAP.x - 330, st);
  const stickY = st <= 0 ? HEAP.y - 120 : lerp(HEAP.y - 120, HEAP.y + 70, st) - 520 * st * (1 - st) * 2;
  const stickRot = st <= 0 ? -20 : -20 - 540 * st;
  const stickBounce = t > T.sticksEnd + 0.02 ? -12 * Math.exp(-7 * (t - T.sticksEnd)) * Math.abs(Math.sin(2 * Math.PI * 3 * (t - T.sticksEnd))) : 0;
  return (
    <AbsoluteFill style={{background: RANCH.skyTop}}>
      <World cam={cam}>
        <Plate p={RANCH} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* foil caught on the windmill, flapping */}
          <g transform={`translate(${WIND.x - 10} ${WIND.y + 60})`}>
            <path
              d={`M 0 0 L ${70 + 8 * Math.sin(2 * Math.PI * 3.1 * t)} ${-18 + 12 * Math.sin(2 * Math.PI * 3.1 * t + 1)} L ${64 + 10 * Math.sin(2 * Math.PI * 3.1 * t + 0.5)} ${30 + 10 * Math.sin(2 * Math.PI * 3.1 * t + 2)} L 4 36 Z`}
              fill={FOIL}
              stroke={INK}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <path d="M 14 8 L 50 4" stroke={FOIL_HI} strokeWidth={6} strokeLinecap="round" />
          </g>
          {/* far bits of debris all over the ranch */}
          {FAR.map(([x, y, s, f], i) => (
            <Heap key={i} x={x} y={y} s={s} flip={f} />
          ))}
          {SCRAPS.map(([x, y, s, r], i) => (
            <Scrap key={i} x={x} y={y} s={s} rot={r} seed={i + 2} />
          ))}
          {/* a broken kite lying on its side */}
          <O n="kite" x={-470} y={610} s={0.5} rot={-78} />
          {/* the rancher */}
          <g transform={`translate(0 ${hop})`}>
            <Guy n={up ? 'r_up' : 'puzzle'} x={R1.x} y={R1.y} r={R1.r} t={t} sw={sw} />
          </g>
          {/* the main heap with the boinging rubber strip */}
          <Heap x={HEAP.x} y={HEAP.y} s={HEAP.s} />
          {rubberUp > 0.01 ? (
            <path
              d={(() => {
                const bx = HEAP.x + 40;
                const by = HEAP.y - 120;
                const L = 210 * rubberUp;
                const pts: string[] = [];
                for (let i = 0; i <= 12; i++) {
                  const f = i / 12;
                  const x = bx + 26 * Math.sin(f * Math.PI * 2.2 + t * 9) * rubberAmp * f + f * 30;
                  const y = by - f * L;
                  pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke={INK}
              strokeWidth={36}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {rubberUp > 0.01 ? (
            <path
              d={(() => {
                const bx = HEAP.x + 40;
                const by = HEAP.y - 120;
                const L = 210 * rubberUp;
                const pts: string[] = [];
                for (let i = 0; i <= 12; i++) {
                  const f = i / 12;
                  const x = bx + 26 * Math.sin(f * Math.PI * 2.2 + t * 9) * rubberAmp * f + f * 30;
                  const y = by - f * L;
                  pts.push(`${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke={RUBBER}
              strokeWidth={24}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {/* the flipping stick */}
          {t > T.sticks - 0.05 ? (
            <g transform={`translate(${stickX} ${stickY + stickBounce}) rotate(${stickRot})`}>
              <rect x={-130} y={-13} width={260} height={26} rx={12} fill={WOOD} stroke={INK} strokeWidth={5} />
              <rect x={-60} y={-15} width={46} height={30} fill="#fff" stroke={INK} strokeWidth={4} />
              <circle cx={-46} cy={-2} r={5} fill="#F28DB5" />
              <circle cx={-28} cy={4} r={5} fill="#F28DB5" />
            </g>
          ) : null}
          {/* the question mark over the rancher */}
          {q > 0.001 ? (
            <g transform={`translate(${head[0] + 120} ${head[1] - 360}) rotate(${8 * Math.sin(2 * Math.PI * 1.3 * t)}) scale(${q})`}>
              <TextT x={0} y={50} size={170} fill="#fff" stroke={14}>
                ?
              </TextT>
            </g>
          ) : null}
          {/* glints: the foil in his hand, the heap, then the far bits one by one */}
          <Glint x={foilP[0] + 30} y={foilP[1] - 40} t={t} t0={T.shiny - 0.04} size={1.2} />
          <Glint x={HEAP.x - 120} y={HEAP.y - 150} t={t} t0={T.shiny + 0.2} size={1.0} />
          <Glint x={foilP[0] - 20} y={foilP[1] + 10} t={t} t0={T.foil + 0.05} size={0.9} />
          {FAR.map(([x, y, s], i) => (
            <Glint key={i} x={x + 30} y={y - 120 * s} t={t} t0={3.45 + i * 0.13} size={0.9 + s} dur={0.45} />
          ))}
          <Glint x={WIND.x + 40} y={WIND.y + 60} t={t} t0={4.2} size={1.1} />
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scenes 2 + 3: the army airfield (4.74 - 11.19)
// ======================================================================================================
const OFF = {x: -240, y: 760, r: 112};
const RAN = {x: 370, y: 800, r: 105};
const REP = {x: 90, y: 545, r: 68};
const SAUCER = {x: 150, y: -330, s: 0.72};
const PAPER_W = 640;
const PAPER_H = 500;
const BASE_CAM: CamKey[] = [
  {t: C_BASE, x: 40, y: 330, k: 1.0},
  {t: 7.5, x: 30, y: 350, k: 1.05},
  {t: C_BUT, x: 30, y: 350, k: 1.05, ease: 'cut'},
];
const BUT_CAM: CamKey[] = [
  {t: C_BUT, x: -180, y: 250, k: 1.35},
  {t: 8.9, x: -170, y: 250, k: 1.37},
  {t: 9.8, x: -20, y: 170, k: 0.98},
  {t: C_YEARS, x: -10, y: 160, k: 1.0},
];
// the headline, drawn on any paper-shaped rect
const Headline: React.FC<{x: number; y: number; w: number; h: number; showPhoto?: boolean}> = ({x, y, w, h, showPhoto = true}) => {
  const sp = S('saucer');
  const s = (w * 0.5) / sp.w;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={PAPER} stroke={INK} strokeWidth={w * 0.012} />
      <rect x={x} y={y} width={w} height={h * 0.13} fill={INK} />
      <TextT x={x + w / 2} y={y + h * 0.105} size={h * 0.09} fill="#fff">
        EXTRA!
      </TextT>
      <TextT x={x + w / 2} y={y + h * 0.27} size={h * 0.115} fill={INK}>
        ARMY CAPTURES
      </TextT>
      <TextT x={x + w / 2} y={y + h * 0.41} size={h * 0.135} fill={RED}>
        FLYING DISC
      </TextT>
      {showPhoto ? (
        <g>
          <rect x={x + w * 0.06} y={y + h * 0.48} width={w * 0.56} height={h * 0.44} fill="#BFE6F7" stroke={INK} strokeWidth={w * 0.008} />
          <SImg href={F('saucer')} x={x + w * 0.09} y={y + h * 0.56} width={sp.w * s} height={sp.h * s} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={x + w * 0.67} y={y + h * (0.5 + i * 0.07)} width={w * 0.27} height={h * 0.025} fill="#B9B3A6" />
          ))}
        </g>
      ) : null}
    </g>
  );
};
const MegaArcs: React.FC<{x: number; y: number; t: number; t0: number; t1: number}> = ({x, y, t, t0, t1}) => {
  if (t < t0 || t > t1 + 0.4) return null;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const u = ((t - t0) * 2.2 + i / 3) % 1;
        const fade = t > t1 ? 1 - prog(t, t1, t1 + 0.4) : 1;
        const r = 40 + 170 * u;
        return (
          <path
            key={i}
            d={`M ${x + r * Math.cos(-0.6)} ${y + r * Math.sin(-0.6)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(0.6)} ${y + r * Math.sin(0.6)}`}
            fill="none"
            stroke={INK}
            strokeWidth={9 * (1 - u) + 2}
            strokeLinecap="round"
            opacity={(1 - u) * fade}
          />
        );
      })}
    </g>
  );
};
const SignBoard: React.FC<{x0: number; y0: number; x1: number; y1: number; lines: [string, number][]; t: number; size: number}> = ({x0, y0, x1, y1, lines, t, size}) => {
  const cx = (x0 + x1) / 2;
  const lh = (y1 - y0) / (lines.length + 0.3);
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={OW * 1.3} />
      <rect x={x0 + 6} y={y1 - (y1 - y0) * 0.12} width={x1 - x0 - 12} height={(y1 - y0) * 0.12 - 6} fill="#ECEAE4" />
      {lines.map(([txt, t0], i) => {
        const s = t0 < 0 ? 1 : pop(t, t0, 0.22);
        return s <= 0.001 ? null : (
          <g key={i} transform={`translate(${cx} ${y0 + lh * (i + 0.8)}) scale(${s})`}>
            <TextT x={0} y={size * 0.35} size={size} fill={i === 2 ? RED : INK}>
              {txt}
            </TextT>
          </g>
        );
      })}
    </g>
  );
};
const Clock: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const s = popOut(t, T.hours - 0.02, 8.85, 0.25);
  if (s <= 0.001) return null;
  const spin = clamp((t - T.hours) / (T.laterEnd - T.hours));
  const minA = 360 * 9 * easeInOutCubic(spin);
  const hrA = minA / 12 + 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${4 * Math.sin(2 * Math.PI * 1.4 * t)})`}>
      <circle r={118} fill="#FFFFFF" stroke={INK} strokeWidth={12} />
      <circle r={100} fill="none" stroke="#E7E3DA" strokeWidth={6} />
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={0} y1={-84} x2={0} y2={-70} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-48} stroke={INK} strokeWidth={12} strokeLinecap="round" transform={`rotate(${hrA})`} />
      <line x1={0} y1={0} x2={0} y2={-80} stroke={RED} strokeWidth={8} strokeLinecap="round" transform={`rotate(${minA})`} />
      <circle r={10} fill={INK} />
      <path d="M -70 -150 L -40 -110 M 70 -150 L 40 -110" stroke={INK} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};
const BaseScene: React.FC<{t: number}> = ({t}) => {
  const but = t >= C_BUT;
  const cam = but ? camAt(t, BUT_CAM) : camAt(t, BASE_CAM);
  // officer: megaphone -> sign on "takes"
  const offPose = t < T.takes ? 'o_mega' : 'o_sign';
  const offSw = t < T.takes ? squashSwap(t, C_BASE + 0.02) : squashSwap(t, T.takes);
  const bell = spt('o_mega', OFF.x, OFF.y, OFF.r, 525, 232);
  const board = S('o_sign').board as [number, number, number, number];
  const b0 = spt('o_sign', OFF.x, OFF.y, OFF.r, board[0], board[1]);
  const b1 = spt('o_sign', OFF.x, OFF.y, OFF.r, board[2], board[3]);
  const offHead = headOf('o_sign', OFF.x, OFF.y, OFF.r);
  const sweat = t > 9.2 ? pop(t, 9.2, 0.25) : 0;
  const sweatSlide = t > 9.2 ? Math.min(1, (t - 9.2) / 1.6) : 0;
  // rancher: paper -> shrug on "balloon" (the paper drops)
  const ranPose = t < T.balloon ? 'r_paper' : 'r_shrug';
  const ranSw = squashSwap(t, T.balloon);
  const paper = S('r_paper').paper as [number, number, number, number];
  const p0 = spt('r_paper', RAN.x, RAN.y, RAN.r, paper[0], paper[1]);
  const p1 = spt('r_paper', RAN.x, RAN.y, RAN.r, paper[2], paper[3]);
  const paperOn = t >= 7.45;
  const drop = prog(t, T.balloon, T.balloon + 0.35);
  // the saucer hovers (from the cut on "But"), poofs into a limp weather balloon on "balloon"
  const sauc = but && t < T.balloon + 0.04;
  const bob = 14 * Math.sin(2 * Math.PI * 0.8 * t);
  const poofU = prog(t, T.balloon - 0.02, T.balloon + 0.34);
  const wb = t > T.balloon + 0.02;
  const sink = wb ? 40 * easeInOutCubic(prog(t, T.balloon + 0.3, C_YEARS)) : 0;
  const limp = wb ? 0.82 + 0.06 * Math.sin(2 * Math.PI * 1.1 * t) : 1;
  const flashP = spt('nab:p_cam', REP.x, REP.y, REP.r, 73, 152);
  // the newspaper (screen space): spins in, slams on "disc", flies into the rancher's hands
  const inU = prog(t, 6.02, T.disc - 0.04);
  const toHands = easeInOutCubic(prog(t, 7.15, 7.45));
  const pc = toScreen(cam, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
  const pw = (p1[0] - p0[0]) * cam.k;
  const npScale = lerp(easeOutBack(inU, 1.5), pw / PAPER_W, toHands);
  const npX = lerp(540, pc[0], toHands);
  const npY = lerp(640, pc[1], toHands);
  const npRot = lerp(-720 * (1 - easeOutCubic(inU)) - 4, 0, toHands);
  const shk = t > T.disc && t < T.disc + 0.4 ? shake(t, 10 * (1 - prog(t, T.disc, T.disc + 0.4))) : {x: 0, y: 0};
  return (
    <AbsoluteFill style={{background: BASE.skyTop, transform: `translate(${shk.x}px, ${shk.y}px)`}}>
      <World cam={cam}>
        <Plate p={BASE} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* the hovering saucer -> poof -> limp weather balloon with a little foil radar target */}
          {sauc ? (
            <g transform={`translate(${SAUCER.x} ${SAUCER.y + bob}) rotate(${5 * Math.sin(2 * Math.PI * 0.6 * t)})`}>
              <O n="saucer" x={0} y={0} s={SAUCER.s * (1 - 0.6 * easeInCubic(prog(t, T.balloon - 0.12, T.balloon + 0.04)))} />
              {[-0.34, -0.17, 0, 0.17, 0.34].map((f, i) => (
                <circle key={i} cx={f * 505 * SAUCER.s} cy={22} r={10} fill={Math.floor(t * 6 + i) % 2 ? '#FFF6A0' : '#F7D046'} opacity={0.9} />
              ))}
            </g>
          ) : null}
          {wb ? (
            <g transform={`translate(${SAUCER.x} ${SAUCER.y + 40 + sink})`}>
              <line x1={0} y1={100} x2={0} y2={300} stroke="#3A3A3A" strokeWidth={6} />
              <g transform="translate(0 340)">
                <O n="kite" x={0} y={0} s={0.3} rot={8 * Math.sin(2 * Math.PI * 0.7 * t)} />
              </g>
              <g transform={`scale(${pop(t, T.balloon + 0.04, 0.3)})`}>
                <Balloon x={0} y={0} w={210} rot={-12 + 6 * Math.sin(2 * Math.PI * 0.9 * t)} squash={limp} face={pop(t, T.balloon + 0.2, 0.3)} sad={1} />
              </g>
            </g>
          ) : null}
          {poofU > 0 && poofU < 1 ? (
            <PuffCluster
              puffs={Array.from({length: 8}, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const g = Math.sin(Math.PI * poofU);
                return {x: SAUCER.x + Math.cos(a) * 120 * (0.4 + poofU), y: SAUCER.y + Math.sin(a) * 60 * (0.4 + poofU), r: 70 * g};
              })}
              fill="#FFFFFF"
            />
          ) : null}
          {/* reporter (reused cut-out from not-a-bomb) with flashes */}
          <Guy n="nab:p_cam" x={REP.x} y={REP.y} r={REP.r} t={t} ph={2} />
          {[5.9, 6.32, 6.7].map((f, i) => (
            <FlashBurst key={i} x={flashP[0]} y={flashP[1]} t={t} t0={f} size={0.6} />
          ))}
          {/* the officer */}
          <Guy n={offPose} x={OFF.x} y={OFF.y} r={OFF.r} t={t} sw={offSw} ph={0.5} dx={t > T.takes ? tremble(t, 1.5) : 0} />
          {offPose === 'o_sign' ? (
            <SignBoard
              x0={b0[0] - 40}
              y0={b0[1] - 40}
              x1={b1[0] + 14}
              y1={b1[1] + 6}
              t={t}
              size={39}
              lines={[
                ['JUST A', T.just - 0.02],
                ['WEATHER', T.weather - 0.02],
                ['BALLOON', T.balloon - 0.02],
              ]}
            />
          ) : null}
          <SweatDrop x={offHead[0] + 70} y={offHead[1] - 40 + 70 * sweatSlide} r={16} s={sweat * (t < C_YEARS - 0.1 ? 1 : 0)} rot={10} />
          {/* the rancher */}
          <Guy n={ranPose} x={RAN.x} y={RAN.y} r={RAN.r} t={t} sw={ranSw} ph={1.2} />
          {ranPose === 'r_paper' && paperOn ? <Headline x={p0[0] + 4} y={p0[1] + 4} w={p1[0] - p0[0] - 8} h={p1[1] - p0[1] - 8} /> : null}
          {!but ? <MegaArcs x={bell[0] + 10} y={bell[1]} t={t} t0={T.announces - 0.05} t1={T.discEnd} /> : null}
          {ranPose === 'r_shrug' ? (
            <g transform={`translate(${lerp((p0[0] + p1[0]) / 2, RAN.x - 190, drop)} ${lerp((p0[1] + p1[1]) / 2, RAN.y + 40, easeInCubic(drop))}) rotate(${-8 * drop}) scale(${1 - 0.1 * drop} ${1 - 0.7 * drop})`}>
              <Headline x={-(p1[0] - p0[0]) / 2} y={-(p1[1] - p0[1]) / 2} w={p1[0] - p0[0]} h={p1[1] - p0[1]} showPhoto={drop < 0.5} />
            </g>
          ) : null}
        </FullSvg>
      </World>
      <Screen>
        {!but && t >= 6.0 && t < 7.46 ? (
          <g transform={`translate(${npX} ${npY}) rotate(${npRot}) scale(${npScale})`}>
            <rect x={-PAPER_W / 2 + 14} y={-PAPER_H / 2 + 18} width={PAPER_W} height={PAPER_H} fill="rgba(0,0,0,0.25)" />
            <Headline x={-PAPER_W / 2} y={-PAPER_H / 2} w={PAPER_W} h={PAPER_H} />
          </g>
        ) : null}
        {but ? <Clock x={830} y={360} t={t} /> : null}
      </Screen>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 4: thirty years later - the ranch at night (11.19 - 15.67)
// ======================================================================================================
const BOARD = {x: 40, y: 190, w: 600, h: 440};
const FAN1 = {x: -400, y: 790, r: 100};
const FAN2 = {x: 420, y: 800, r: 100};
const NIGHT_CAM: CamKey[] = [
  {t: C_YEARS, x: 10, y: 270, k: 0.98},
  {t: C_TURNS, x: 20, y: 250, k: 1.07},
];
const STARS: [number, number, number][] = Array.from({length: 22}, (_, i) => [lerp(-900, 900, rnd(i * 3 + 1)), lerp(-1300, -300, rnd(i * 5 + 2)), 0.5 + rnd(i * 7) * 0.7]);
const YEARS = ['1947', '1953', '1959', '1966', '1972', '1978'];
const Calendar: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, C_YEARS - 0.02, 13.0, 0.25);
  if (s <= 0.001) return null;
  const k = clamp(Math.floor((t - 11.25) / 0.2) + 1, 0, YEARS.length - 1);
  const flipU = t > 11.25 && k < YEARS.length - 1 ? ((t - 11.25) % 0.2) / 0.2 : 1;
  return (
    <g transform={`translate(540 300) scale(${s}) rotate(-3)`}>
      <rect x={-170} y={-150} width={340} height={300} rx={18} fill="#FFFFFF" stroke={INK} strokeWidth={10} />
      <path d="M -170 -100 L -170 -132 Q -170 -150 -152 -150 L 152 -150 Q 170 -150 170 -132 L 170 -100 Z" fill={RED} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      {[-90, 0, 90].map((x) => (
        <rect key={x} x={x - 9} y={-172} width={18} height={44} rx={8} fill="#555" stroke={INK} strokeWidth={5} />
      ))}
      <g transform={`translate(0 40) scale(1 ${0.25 + 0.75 * Math.abs(Math.cos(Math.PI * Math.min(1, flipU) * 0.5 + (flipU < 1 ? Math.PI * 0.5 : 0)))})`}>
        <TextT x={0} y={36} size={112} fill={k === YEARS.length - 1 ? RED : INK}>
          {YEARS[k]}
        </TextT>
      </g>
    </g>
  );
};
const Alien: React.FC<{s: number}> = ({s}) =>
  s <= 0.001 ? null : (
    <g transform={`scale(${s})`}>
      <path d="M 0 -78 C 58 -78 70 -30 62 6 C 52 52 20 74 0 78 C -20 74 -52 52 -62 6 C -70 -30 -58 -78 0 -78 Z" fill="#8EE07A" stroke={INK} strokeWidth={6} />
      <ellipse cx={-27} cy={-2} rx={22} ry={13} transform="rotate(25 -27 -2)" fill={INK} />
      <ellipse cx={27} cy={-2} rx={22} ry={13} transform="rotate(-25 27 -2)" fill={INK} />
      <path d="M -10 44 Q 0 50 10 44" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
const Pin: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <circle cx={x} cy={y} r={13} fill={RED} stroke={INK} strokeWidth={4} />
    <circle cx={x - 4} cy={y - 4} r={4} fill="#fff" />
  </g>
);
const NightScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, NIGHT_CAM);
  const bx = BOARD.x - BOARD.w / 2;
  const by = BOARD.y - BOARD.h / 2;
  // board items (board-local centre points)
  const clip: [number, number] = [-170, -110];
  const photo: [number, number] = [160, -120];
  const kiteN: [number, number] = [-190, 105];
  const alienP: [number, number] = [10, 20];
  const stampP: [number, number] = [165, 120];
  const W = (p: [number, number]): [number, number] => [BOARD.x + p[0], BOARD.y + p[1]];
  const strings: [[number, number], [number, number], number][] = [
    [clip, photo, T.saying - 0.05],
    [kiteN, clip, T.saying + 0.15],
    [photo, alienP, T.aliens + 0.05],
    [clip, alienP, T.aliens + 0.2],
    [alienP, stampP, T.cover + 0.05],
    [kiteN, stampP, T.cover + 0.2],
  ];
  const fan1 = pop(t, T.people - 0.02, 0.3);
  const fan2 = pop(t, T.aliens - 0.04, 0.3);
  const alien = pop(t, T.aliens - 0.02, 0.3);
  const stamp = t > T.cover - 0.02 ? lerp(2.2, 1, easeOutCubic(prog(t, T.cover - 0.02, T.cover + 0.1))) : 0;
  const shk = t > T.cover + 0.08 && t < T.cover + 0.4 ? shake(t, 8 * (1 - prog(t, T.cover + 0.08, T.cover + 0.4))) : {x: 0, y: 0};
  const glow = 0.85 + 0.08 * Math.sin(2 * Math.PI * 2.3 * t) + 0.05 * Math.sin(2 * Math.PI * 5.1 * t);
  return (
    <AbsoluteFill style={{background: '#1E2350', transform: `translate(${shk.x}px, ${shk.y}px)`}}>
      <World cam={cam}>
        <Plate p={RANCH} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* night */}
          <rect x={-9000} y={-9000} width={18000} height={18000} fill="rgba(22,24,74,0.62)" />
          {STARS.map(([x, y, s], i) => (
            <path
              key={i}
              transform={`translate(${x} ${y}) scale(${s * (0.75 + 0.25 * Math.sin(2 * Math.PI * 0.8 * t + i))})`}
              d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z"
              fill="#FFF6C8"
            />
          ))}
          <path d="M 600 -820 A 90 90 0 1 0 690 -700 A 70 70 0 1 1 600 -820 Z" fill="#FFF3B0" stroke={INK} strokeWidth={6} />
          {/* lantern glow on the ground */}
          <ellipse cx={BOARD.x - 10} cy={BOARD.y + 420} rx={760 * glow} ry={430 * glow} fill="rgba(255,196,90,0.22)" />
          <ellipse cx={BOARD.x - 10} cy={BOARD.y + 420} rx={430 * glow} ry={240 * glow} fill="rgba(255,206,110,0.22)" />
          {/* easel */}
          <path d={`M ${BOARD.x - 200} ${BOARD.y + 560} L ${BOARD.x - 120} ${by + 40} M ${BOARD.x + 200} ${BOARD.y + 560} L ${BOARD.x + 120} ${by + 40} M ${BOARD.x} ${BOARD.y + 520} L ${BOARD.x} ${by}`} stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path d={`M ${BOARD.x - 200} ${BOARD.y + 560} L ${BOARD.x - 120} ${by + 40} M ${BOARD.x + 200} ${BOARD.y + 560} L ${BOARD.x + 120} ${by + 40} M ${BOARD.x} ${BOARD.y + 520} L ${BOARD.x} ${by}`} stroke={FRAME} strokeWidth={18} strokeLinecap="round" />
          {/* board */}
          <rect x={bx - 22} y={by - 22} width={BOARD.w + 44} height={BOARD.h + 44} rx={14} fill={FRAME} stroke={INK} strokeWidth={8} />
          <rect x={bx} y={by} width={BOARD.w} height={BOARD.h} fill={CORK} stroke={INK} strokeWidth={5} />
          {Array.from({length: 30}, (_, i) => (
            <circle key={i} cx={bx + 20 + rnd(i * 11) * (BOARD.w - 40)} cy={by + 20 + rnd(i * 17 + 3) * (BOARD.h - 40)} r={4 + 3 * rnd(i)} fill={CORK_SH} />
          ))}
          {/* the clipping */}
          <g transform={`translate(${W(clip)[0]} ${W(clip)[1]}) rotate(-6)`}>
            <rect x={-95} y={-62} width={190} height={124} fill={PAPER} stroke={INK} strokeWidth={4} />
            <TextT x={0} y={-14} size={30} fill={INK}>
              FLYING
            </TextT>
            <TextT x={0} y={26} size={30} fill={RED}>
              DISC?
            </TextT>
          </g>
          {/* the saucer photo */}
          <g transform={`translate(${W(photo)[0]} ${W(photo)[1]}) rotate(5)`}>
            <rect x={-92} y={-80} width={184} height={170} fill="#fff" stroke={INK} strokeWidth={4} />
            <rect x={-78} y={-66} width={156} height={118} fill="#9FD6F2" />
            <O n="saucer" x={0} y={-8} s={0.27} rot={-8} />
          </g>
          {/* the kite sketch */}
          <g transform={`translate(${W(kiteN)[0]} ${W(kiteN)[1]}) rotate(-4)`}>
            <rect x={-78} y={-88} width={156} height={176} fill={PAPER} stroke={INK} strokeWidth={4} />
            <O n="kite" x={0} y={0} s={0.34} />
          </g>
          {/* the alien drawing pops on "aliens" */}
          {alien > 0.001 ? (
            <g transform={`translate(${W(alienP)[0]} ${W(alienP)[1]}) rotate(3) scale(${alien})`}>
              <rect x={-92} y={-102} width={184} height={204} fill={PAPER} stroke={INK} strokeWidth={4} />
              <Alien s={1} />
            </g>
          ) : null}
          {/* red strings */}
          {strings.map(([a, b, t0], i) => {
            const u = easeOutCubic(prog(t, t0, t0 + 0.25));
            if (u <= 0) return null;
            const A = W(a);
            const B = W(b);
            return (
              <g key={i}>
                <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], u)} y2={lerp(A[1], B[1], u)} stroke="#7A0E0E" strokeWidth={9} strokeLinecap="round" />
                <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], u)} y2={lerp(A[1], B[1], u)} stroke="#E0302A" strokeWidth={5} strokeLinecap="round" />
              </g>
            );
          })}
          {[clip, photo, kiteN, ...(alien > 0.5 ? [alienP] : []), ...(stamp > 0 ? [stampP] : [])].map((p, i) => (
            <Pin key={i} x={W(p)[0]} y={W(p)[1]} />
          ))}
          {stamp > 0 ? <Stamp x={W(stampP)[0] - 10} y={W(stampP)[1] + 30} s={0.48 * stamp} rot={-12} text="COVER-UP?" w={560} /> : null}
          {/* the tinfoil fans */}
          {fan1 > 0.001 ? (
            <g transform={`translate(${FAN1.x} ${FAN1.y}) scale(${fan1})`}>
              <Guy n="f_point" x={0} y={0} r={FAN1.r} t={t} ph={0.3} dx={tremble(t, 1.2)} />
            </g>
          ) : null}
          {fan2 > 0.001 ? (
            <g transform={`translate(${FAN2.x} ${FAN2.y}) scale(${fan2})`}>
              <Guy n="f_arms" x={0} y={0} r={FAN2.r} t={t} ph={1.7} />
            </g>
          ) : null}
        </FullSvg>
      </World>
      <Screen>
        <Calendar t={t} />
      </Screen>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scenes 5 + 6: turns out - the airfield again; the hangar opens and the balloon train rises (15.67 - 20.62)
// ======================================================================================================
const DOORS = {x0: (276 - 512) * 1.5, y0: (732 - 840) * 1.5, x1: (586 - 512) * 1.5, y1: (838 - 840) * 1.5};
const DOOR_CX = (DOORS.x0 + DOORS.x1) / 2;
const SHH = {x: 290, y: 780, r: 112};
const PEEK = {x: -430, y: 820, r: 100};
const RISE_T0 = 17.92;
const TOP_END = -1780;
const trainTop = (t: number) => (t < RISE_T0 ? DOORS.y1 + 40 : t < 19.4 ? lerp(DOORS.y1 + 40, TOP_END, easeInOutCubic(prog(t, RISE_T0, 19.4))) : TOP_END - 50 * (t - 19.4));
// train elements: distance below the top balloon and kind
type TEl = {d: number; kind: 'b' | 'k' | 'dev'};
const TRAIN: TEl[] = [
  {d: 0, kind: 'b'},
  {d: 150, kind: 'b'},
  {d: 300, kind: 'b'},
  {d: 450, kind: 'b'},
  {d: 600, kind: 'b'},
  {d: 760, kind: 'k'},
  {d: 930, kind: 'b'},
  {d: 1080, kind: 'b'},
  {d: 1250, kind: 'k'},
  {d: 1430, kind: 'dev'},
];
const TURN_CAM: CamKey[] = [
  {t: C_TURNS, x: -20, y: 260, k: 0.9},
  {t: 16.4, x: -25, y: 250, k: 0.92},
  {t: 17.05, x: -80, y: 150, k: 1.06},
  {t: 17.7, x: -70, y: 150, k: 1.04},
  {t: 18.15, x: -60, y: 120, k: 0.9},
  {t: 19.35, x: -90, y: -860, k: 0.82},
  {t: C_SKY, x: -90, y: -930, k: 0.82},
];
const RainCloud: React.FC<{x: number; y: number; t: number; s: number}> = ({x, y, t, s}) => {
  if (s <= 0.001) return null;
  const shakeNo = t > T.not - 0.05 && t < T.not + 0.7 ? 14 * Math.sin(2 * Math.PI * 4 * (t - T.not)) * (1 - prog(t, T.not, T.not + 0.7)) : 0;
  const rain = t > T.weather2 - 0.05;
  return (
    <g transform={`translate(${x} ${y}) rotate(${shakeNo}) scale(${s})`}>
      {rain
        ? Array.from({length: 7}, (_, i) => {
            const ph = ((t - T.weather2) * 2.2 + i * 0.37) % 1;
            return <path key={i} d={`M ${-110 + i * 36} ${70 + ph * 220} q 8 14 0 22 q -8 -8 0 -22 Z`} fill="#8FD3FF" stroke={INK} strokeWidth={4} opacity={1 - ph} />;
          })
        : null}
      <PuffCluster
        puffs={[
          {x: -110, y: 20, r: 62},
          {x: -40, y: -30, r: 82},
          {x: 50, y: -24, r: 76},
          {x: 120, y: 24, r: 56},
          {x: 0, y: 34, r: 70},
        ]}
        fill="#9AA6B4"
        ink={6}
      />
      <Eye x={-34} y={0} r={20} open={1} side={-1} look={[-0.6, 0]} lid={0.35} brow={0.45} browTilt={0.9} />
      <Eye x={34} y={0} r={20} open={1} side={1} look={[-0.6, 0]} lid={0.35} brow={0.45} browTilt={0.9} />
      <path d="M -26 44 Q 0 34 26 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};
const KiteEl: React.FC<{x: number; y: number; s: number; t: number; ph: number}> = ({x, y, s, t, ph}) => (
  <O n="kite" x={x} y={y} s={s} rot={6 * Math.sin(2 * Math.PI * 0.6 * t + ph)} />
);
const TurnScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, TURN_CAM);
  const shhSw = squashSwap(t, C_TURNS + 0.02);
  const peek = easeOutBack(prog(t, T.out - 0.05, T.out + 0.25), 1.6);
  const stamp = t > T.cover2 - 0.03 ? lerp(2.4, 1, easeOutCubic(prog(t, T.cover2 - 0.03, T.cover2 + 0.09))) : 0;
  const shk = t > T.cover2 + 0.06 && t < T.cover2 + 0.4 ? shake(t, 10 * (1 - prog(t, T.cover2 + 0.06, T.cover2 + 0.4))) : {x: 0, y: 0};
  // doors slide open on "It"
  const open = easeInOutCubic(prog(t, T.it2 - 0.05, T.it2 + 0.4));
  const dw = (DOORS.x1 - DOORS.x0) / 2;
  const top = trainTop(t);
  const sway = (d: number) => 26 * Math.sin(2 * Math.PI * 0.35 * t + d * 0.004) * Math.min(1, (DOORS.y1 - (top + d)) / 900);
  const visible = (d: number) => top + d < DOORS.y1 - 10;
  const lastVis = TRAIN.filter((e) => visible(e.d)).pop();
  const face = pop(t, T.balloon2 - 0.02, 0.3);
  const cloud = easeOutBack(prog(t, 19.25, 19.6), 1.4) * (1 - easeInCubic(prog(t, 20.4, 20.62)));
  const cloudX = lerp(700, 280, easeOutCubic(prog(t, 19.25, 19.65)));
  // the stamp sits on the hangar doors and splits with them
  const stampSplit = open * dw;
  return (
    <AbsoluteFill style={{background: BASE.skyTop, transform: `translate(${shk.x}px, ${shk.y}px)`}}>
      <World cam={cam}>
        <Plate p={BASE} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* the hangar doors (code over the plate's doors): dark inside + two sliding panels */}
          <rect x={DOORS.x0} y={DOORS.y0} width={DOORS.x1 - DOORS.x0} height={DOORS.y1 - DOORS.y0} fill="#232823" />
          {/* the balloon train (behind the door panels while still inside) */}
          {lastVis ? (
            <line x1={DOOR_CX + sway(0)} y1={top} x2={DOOR_CX + sway(lastVis.d)} y2={Math.min(top + lastVis.d + 60, DOORS.y1 - 10)} stroke="#2E2E2E" strokeWidth={5} />
          ) : null}
          {TRAIN.map((e, i) => {
            if (!visible(e.d)) return null;
            const x = DOOR_CX + sway(e.d);
            const y = top + e.d;
            if (e.kind === 'b') return <Balloon key={i} x={x} y={y} w={118} rot={4 * Math.sin(2 * Math.PI * 0.5 * t + i)} face={i === 0 ? face : 0} />;
            if (e.kind === 'k') return <KiteEl key={i} x={x} y={y} s={0.36} t={t} ph={i} />;
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <rect x={-22} y={-40} width={44} height={80} rx={10} fill={FOIL} stroke={INK} strokeWidth={5} />
              </g>
            );
          })}
          {/* door panels */}
          <g>
            <rect x={DOORS.x0 - open * dw * 0.95} y={DOORS.y0} width={dw} height={DOORS.y1 - DOORS.y0} fill="#6E7A6C" stroke={INK} strokeWidth={5} />
            <rect x={DOORS.x0 + dw + open * dw * 0.95} y={DOORS.y0} width={dw} height={DOORS.y1 - DOORS.y0} fill="#6E7A6C" stroke={INK} strokeWidth={5} />
            {[0.25, 0.5, 0.75].map((f) => (
              <g key={f}>
                <line x1={DOORS.x0 - open * dw * 0.95 + f * dw} y1={DOORS.y0 + 6} x2={DOORS.x0 - open * dw * 0.95 + f * dw} y2={DOORS.y1 - 4} stroke="#5A665A" strokeWidth={4} />
                <line x1={DOORS.x0 + dw + open * dw * 0.95 + f * dw} y1={DOORS.y0 + 6} x2={DOORS.x0 + dw + open * dw * 0.95 + f * dw} y2={DOORS.y1 - 4} stroke="#5A665A" strokeWidth={4} />
              </g>
            ))}
          </g>
          {/* TOP SECRET slams onto the doors on "cover-up" (and splits when they open) */}
          {stamp > 0 ? (
            <g>
              <clipPath id="stampL">
                <rect x={-9000} y={-9000} width={9000 + DOOR_CX} height={18000} />
              </clipPath>
              <clipPath id="stampR">
                <rect x={DOOR_CX} y={-9000} width={9000} height={18000} />
              </clipPath>
              <g clipPath="url(#stampL)">
                <g transform={`translate(${-stampSplit * 0.95} 0)`}>
                  <Stamp x={DOOR_CX} y={(DOORS.y0 + DOORS.y1) / 2 - 10} s={0.8 * stamp} rot={-7} text="TOP SECRET" w={620} />
                </g>
              </g>
              <g clipPath="url(#stampR)">
                <g transform={`translate(${stampSplit * 0.95} 0)`}>
                  <Stamp x={DOOR_CX} y={(DOORS.y0 + DOORS.y1) / 2 - 10} s={0.8 * stamp} rot={-7} text="TOP SECRET" w={620} />
                </g>
              </g>
            </g>
          ) : null}
          {/* the officer: shh */}
          <Guy n="o_shh" x={SHH.x} y={SHH.y} r={SHH.r} t={t} sw={shhSw} ph={0.4} />
          {/* the tinfoil fan peeks in from the left, shocked */}
          {peek > 0.001 ? <Guy n="f_shock" x={lerp(PEEK.x - 420, PEEK.x, peek)} y={PEEK.y} r={PEEK.r} t={t} mir ph={1.1} dx={tremble(t, 2)} /> : null}
          {/* not for weather: a grumpy rain cloud shakes its head */}
          <RainCloud x={cloudX} y={-1400} t={t} s={cloud} />
          {face > 0.5 ? <Glint x={DOOR_CX + 80} y={top - 70} t={t} t0={T.balloon2} size={1} /> : null}
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 7: a secret one - above the clouds (20.62 - 24.5)
// ======================================================================================================
const DEV = {x: 40, y: -430};
const BLAST = {x: -390, y: 30};
const SKY_TRAIN: TEl[] = [
  ...Array.from({length: 9}, (_, i) => ({d: i * 165, kind: 'b' as const})),
  {d: 1640, kind: 'k'},
  {d: 2140, kind: 'k'},
  {d: 2600, kind: 'dev'},
];
const SKY_TOP_Y = DEV.y - 2600;
const SKY_CAM: CamKey[] = [
  {t: C_SKY, x: 20, y: -2050, k: 0.86},
  {t: 21.75, x: 30, y: -560, k: 1.12},
  {t: 22.55, x: 10, y: -540, k: 1.1},
  {t: 23.15, x: -150, y: -250, k: 1.1},
  {t: DURATION, x: -140, y: -270, k: 1.15},
];
const ear = (t: number) => 1 + 0.65 * (t > T.listen - 0.04 ? easeOutBack(prog(t, T.listen - 0.04, T.listen + 0.25), 2.4) : 0);
const Device: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const jump = t > T.bombs - 0.03 ? -60 * Math.exp(-5 * (t - T.bombs)) * Math.abs(Math.sin(Math.PI * Math.min(1, (t - T.bombs) / 0.3))) : 0;
  const shocked = t > T.bombs - 0.03;
  const listening = t > T.listen - 0.04 && !shocked;
  const e = ear(t);
  const eyeOpen = pop(t, C_SKY + 0.6, 0.3);
  const tag = pop(t, T.secret - 0.03, 0.3);
  const tagSwing = 18 * Math.sin(2 * Math.PI * 1.1 * (t - T.secret)) * Math.exp(-0.9 * Math.max(0, t - T.secret));
  const bang = pop(t, T.bombs, 0.22) * (t < 24.3 ? 1 : 0);
  const wiggle = shocked ? 10 * Math.sin(2 * Math.PI * 7 * (t - T.bombs)) * Math.exp(-3 * (t - T.bombs)) : 0;
  return (
    <g transform={`translate(${x} ${y + jump}) scale(1.3)`}>
      {/* the TOP SECRET tag swinging under it */}
      {tag > 0.001 ? (
        <g transform={`translate(0 110) rotate(${tagSwing}) scale(${tag})`}>
          <line x1={0} y1={-24} x2={0} y2={18} stroke="#3A3A3A" strokeWidth={4} />
          <path d="M -112 18 L 112 18 L 112 88 L -112 88 Z" fill="#E9C97D" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <TextT x={0} y={63} size={29} fill={RED}>
            TOP SECRET
          </TextT>
        </g>
      ) : null}
      {/* the ear (left side, toward the far blast) */}
      <g transform={`translate(-58 -8) rotate(${wiggle}) scale(${e})`}>
        <path d="M 4 -54 C -60 -70 -86 -10 -62 26 C -46 48 -30 40 -26 62 C -22 80 4 74 8 56" fill="#F7A9A8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -8 -30 C -44 -36 -54 -2 -38 18" fill="none" stroke="#D97878" strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* the body: a little silver cylinder */}
      <rect x={-52} y={-96} width={104} height={192} rx={22} fill={FOIL} stroke={INK} strokeWidth={7} />
      <rect x={-52} y={-60} width={104} height={14} fill={FOIL_SH} />
      <rect x={-52} y={50} width={104} height={14} fill={FOIL_SH} />
      <rect x={-34} y={-90} width={16} height={180} rx={8} fill={FOIL_HI} opacity={0.9} />
      <rect x={-52} y={-96} width={104} height={192} rx={22} fill="none" stroke={INK} strokeWidth={7} />
      <circle cx={0} cy={-112} r={14} fill="none" stroke={INK} strokeWidth={7} />
      <Eye x={-18} y={-12} r={shocked ? 22 : 18} open={eyeOpen} side={-1} look={[-0.7, 0]} lid={listening ? 0.42 : 0} brow={shocked ? 0.85 : 0.5} browTilt={listening ? 0.6 : 0} />
      <Eye x={22} y={-12} r={shocked ? 22 : 18} open={eyeOpen} side={1} look={[-0.7, 0]} lid={listening ? 0.42 : 0} brow={shocked ? 0.85 : 0.5} browTilt={listening ? 0.6 : 0} />
      {shocked ? <ellipse cx={2} cy={34} rx={12} ry={16 * pop(t, T.bombs, 0.2)} fill="#3A1414" stroke={INK} strokeWidth={4} /> : null}
      {bang > 0.001 ? (
        <g transform={`translate(70 -150) rotate(12) scale(${bang})`}>
          <TextT x={0} y={40} size={120} fill={RED} stroke={12}>
            !
          </TextT>
        </g>
      ) : null}
    </g>
  );
};
const Mushroom: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const u = easeOutCubic(prog(t, T.soviet - 0.05, T.nuclear + 0.15));
  if (u <= 0) return null;
  const fade = 1 - 0.5 * prog(t, 23.8, DURATION);
  const H = 250 * u;
  return (
    <g transform={`translate(${x} ${y})`} opacity={fade}>
      <ellipse cx={0} cy={-6} rx={120 * u} ry={26 * u} fill="rgba(255,170,80,0.35)" />
      <path d={`M ${-22 * u} 0 L ${-14 * u} ${-H} L ${14 * u} ${-H} L ${22 * u} 0 Z`} fill="#B7AFA6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <PuffCluster
        puffs={[
          {x: -66 * u, y: -H, r: 52 * u},
          {x: 66 * u, y: -H, r: 52 * u},
          {x: 0, y: -H - 34 * u, r: 68 * u},
          {x: -34 * u, y: -H - 66 * u, r: 44 * u},
          {x: 40 * u, y: -H - 60 * u, r: 42 * u},
        ]}
        fill="#C9C1B7"
        ink={5}
        shade="#ADA49A"
      />
      <ellipse cx={0} cy={-H * 0.35} rx={30 * u} ry={18 * u} fill="rgba(255,150,60,0.55)" />
    </g>
  );
};
const SoundRings: React.FC<{t: number; from: [number, number]; to: [number, number]}> = ({t, from, to}) => {
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const spawns = [22.82, 22.97, 23.12];
  const travel = 0.48;
  return (
    <g>
      {spawns.map((s0, i) => {
        const u = (t - s0) / travel;
        if (u < 0 || u > 1) return null;
        const r = 40 + (d - 40) * u;
        const half = 0.42;
        const a0 = ang - half;
        const a1 = ang + half;
        return (
          <g key={i} opacity={u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15}>
            <path
              d={`M ${from[0] + r * Math.cos(a0)} ${from[1] + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${from[0] + r * Math.cos(a1)} ${from[1] + r * Math.sin(a1)}`}
              fill="none"
              stroke={INK}
              strokeWidth={20}
              strokeLinecap="round"
            />
            <path
              d={`M ${from[0] + r * Math.cos(a0)} ${from[1] + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${from[0] + r * Math.cos(a1)} ${from[1] + r * Math.sin(a1)}`}
              fill="none"
              stroke={YEL}
              strokeWidth={11}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
};
const SkyScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, SKY_CAM);
  const sway = (d: number) => 18 * Math.sin(2 * Math.PI * 0.3 * t + d * 0.002) * (d / 2600);
  // a foil scrap tears off the lower kite at the end and falls (-> frame 0)
  const fall = prog(t, 23.92, DURATION);
  const kiteLow = SKY_TRAIN[SKY_TRAIN.length - 2];
  const kx = DEV.x + sway(kiteLow.d);
  const ky = SKY_TOP_Y + kiteLow.d;
  return (
    <AbsoluteFill style={{background: SKY.skyTop}}>
      <World cam={cam}>
        <Plate p={SKY} />
      </World>
      <World cam={cam}>
        <FullSvg>
          <Mushroom x={BLAST.x} y={BLAST.y} t={t} />
          <line x1={DEV.x + sway(0)} y1={SKY_TOP_Y} x2={DEV.x} y2={DEV.y - 150} stroke="#2E2E2E" strokeWidth={5} />
          {SKY_TRAIN.map((e, i) => {
            const x = DEV.x + sway(e.d);
            const y = SKY_TOP_Y + e.d;
            if (e.kind === 'b') return <Balloon key={i} x={x} y={y} w={128} rot={4 * Math.sin(2 * Math.PI * 0.45 * t + i)} />;
            if (e.kind === 'k') return <KiteEl key={i} x={x} y={y} s={0.42} t={t} ph={i} />;
            return null;
          })}
          <Device x={DEV.x} y={DEV.y} t={t} />
          <SoundRings t={t} from={[BLAST.x, BLAST.y - 150]} to={[DEV.x - 150, DEV.y - 10]} />
          {fall > 0 ? (
            <g transform={`translate(${kx - 40 - 160 * fall} ${ky + 60 + 1500 * easeInCubic(fall)}) rotate(${720 * fall})`}>
              <Scrap x={0} y={0} s={1.2} seed={9} />
            </g>
          ) : null}
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'foil', at: 0.12, db: -20},
  {f: 'pop', at: T.finds - 0.02, db: -25},
  {f: 'twinkle', at: T.shiny - 0.04, db: -22},
  {f: 'boing', at: T.rubber - 0.03, db: -23},
  {f: 'crash', at: T.sticksEnd - 0.1, db: -20},
  {f: 'gust', at: T.all, db: -28},
  {f: 'twinkle', at: 3.95, db: -27, rate: 1.15},
  {f: 'megaphone', at: T.announces - 0.06, db: -20},
  {f: 'press_frenzy', at: 5.86, db: -22},
  {f: 'whoosh', at: 6.02, db: -24},
  {f: 'stamp', at: T.disc - 0.05, db: -18},
  {f: 'whoosh', at: 7.12, db: -29, rate: 1.2},
  {f: 'ticks', at: T.hours, db: -24, dur: 0.85, keys: [[T.hours, -24], [8.55, -24], [8.66, -60]]},
  {f: 'pop', at: T.takes - 0.04, db: -26},
  {f: 'pop', at: T.just - 0.04, db: -27},
  {f: 'pop', at: T.weather - 0.04, db: -27, rate: 1.1},
  {f: 'sun_poof', at: T.balloon - 0.05, db: -19},
  {f: 'deflate', at: T.balloon + 0.12, db: -23},
  {f: 'flip', at: 11.22, db: -19},
  {f: 'flip', at: 11.72, db: -20},
  {f: 'pop', at: T.people - 0.03, db: -25},
  {f: 'pin', at: T.saying - 0.06, db: -18},
  {f: 'pop', at: T.aliens - 0.04, db: -23, rate: 0.9},
  {f: 'pin', at: T.aliens + 0.04, db: -20},
  {f: 'stamp', at: T.cover - 0.03, db: -17},
  {f: 'pin', at: T.cover + 0.18, db: -21},
  {f: 'pop', at: T.out - 0.06, db: -24},
  {f: 'squeak', at: T.out + 0.1, db: -27},
  {f: 'stamp', at: T.cover2 - 0.04, db: -15},
  {f: 'whoosh', at: T.it2 - 0.06, db: -24, rate: 0.85},
  {f: 'balloons', at: 17.86, db: -20},
  {f: 'magic', at: T.balloon2 - 0.02, db: -26},
  {f: 'swoop', at: 19.25, db: -27},
  {f: 'boing', at: T.not - 0.04, db: -28, rate: 0.8},
  {f: 'whoosh', at: C_SKY - 0.05, db: -28, rate: 0.9},
  {f: 'pop', at: T.secret - 0.05, db: -26},
  {f: 'listen', at: 21.86, db: -23},
  {f: 'squeak', at: T.listen - 0.03, db: -24},
  {f: 'boom_low', at: T.soviet, db: -22},
  {f: 'boing', at: T.bombs - 0.03, db: -21},
  {f: 'zoomaway', at: 23.95, db: -27},
];

export const RoswellBalloonShort: React.FC = () => {
  useRSWFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#75CCFC'}}>
      {t < C_BASE ? <RanchScene t={t} /> : t < C_YEARS ? <BaseScene t={t} /> : t < C_TURNS ? <NightScene t={t} /> : t < C_SKY ? <TurnScene t={t} /> : <SkyScene t={t} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('roswell-balloon/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('roswell-balloon/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="roswell-balloon/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
