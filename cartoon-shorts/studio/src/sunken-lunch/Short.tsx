import React, {useRef, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {C_BOTTOM, C_CLOSE, C_DEEP, C_END, C_LAB, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SL_DURATION, FPS as SL_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why didn't this sandwich rot at the bottom of the sea?" (Alvin, 16 Oct 1968 -> recovered 1969; Jannasch et al. 1971).
// A sandwich with a face rides a little white-and-orange sub that hangs from a crane over the sea, the guy waves from the hatch.
// The camera pulls back: a long way down. The sling cables twang and SNAP, the sub belly-flops, the sandwich bounces into the
// hatch, three crew members leap out into life rings. The sandwich peeks out alone, gulps, and goes under. CUT: 10 MONTHS LATER
// on the sea floor (a fish lives in the hatch now), a hook comes down and the sub is hauled up in one whip. CUT: the bearded
// pilot on the hull, the soggy sandwich opens its eyes - fresh (sparkle). A thermometer: cold, right? BUT (cut): a lab fridge
// at the same cold - germs pop up and eat a twin sandwich x100 faster. CUT: back on the bottom, a cutaway of the cabin: pressure
// arrows squash the germs flat, they slow down and fall asleep. SO (cut): from a ship's stern the scientists lower a lunchbox with
// a face into the sea on purpose - it heads for the bottom like the sandwich in frame 0.
// Every picture is a FINISHED ElevenLabs cut-out from an earlier video (no new pictures: the ElevenLabs connector did not load and
// the REST image API needs a Pro plan); the sub, the sandwich, germs, fish, thermometer, crane, lunchbox and the stern are code.

const F = (n: string, ext = 'png') => staticFile(`sunken-lunch/${n}.${ext}`);
export const FONT = 'SLInter';
export const useSLFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.5;
const INK = '#000';
const OW = 4.4; // code outline width in the ocean world (guy head r = 60)
const YEL = '#FFE45C';
const SKY = '#8cd1f5';
const HULL = '#FEFDFD';
const HULL_SH = '#E2E0E0';
const SAIL = '#F26A1B';
const SAIL_SH = '#C9531A';
const STEEL = '#9A9A9A';
const STEEL_SH = '#6F6F6F';
const CRANE = '#F78A2A';
const CRANE_SH = '#C9651A';
const BREAD = '#F6E7C1';
const CRUST = '#C98A3E';
const BOLOGNA = '#E9878F';
const BOLOGNA_SH = '#C9636D';
const LETTUCE = '#7CC242';
const GERM = '#9BE15D';
const GERM_SH = '#6DB33F';
const RING_RED = '#E8382E';
const BEARD = '#8A5A2B';
const BEARD_SH = '#6B4320';

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
// haul easing: short ease in / out, linear middle (continuous speed, no 3x peak)
const haulEase = (u: number) => {
  const a = 0.18;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const v = 1 / (1 - a); // speed of the linear part
  if (u < a) return (v * u * u) / (2 * a);
  if (u > 1 - a) return 1 - (v * (1 - u) * (1 - u)) / (2 * a);
  return (v * a) / 2 + v * (u - a);
};

// SVG <image> that holds the frame until the picture is loaded (Remotion's <Img> does this for HTML images only);
// keyed by href so a pose swap mounts a new element and waits again.
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

type Info = {w: number; h: number; feet: [number, number]; hd: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, Info>)[n];

// a sprite inside the world SVG; anchor = feet or head centre; r = head radius in world px
const G: React.FC<{n: string; x: number; y: number; r?: number; anchor?: 'feet' | 'head'; mir?: boolean; sx?: number; sy?: number; rot?: number; o?: number}> = ({
  n,
  x,
  y,
  r = 60,
  anchor = 'feet',
  mir = false,
  sx = 1,
  sy = 1,
  rot = 0,
  o = 1,
}) => {
  const sp = S(n);
  const s = r / sp.hd[2];
  const [ax, ay] = anchor === 'feet' ? sp.feet : [sp.hd[0], sp.hd[1]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(mir ? -1 : 1) * sx} ${sy})`} opacity={o}>
      <SImg key={n} href={F(n)} x={-ax * s} y={-ay * s} width={sp.w * s} height={sp.h * s} />
    </g>
  );
};
// head centre of a sprite placed with G (feet anchor) -> world
const headOf = (n: string, x: number, y: number, r = 60, mir = false): [number, number] => {
  const sp = S(n);
  const s = r / sp.hd[2];
  return [x + (mir ? -1 : 1) * (sp.hd[0] - sp.feet[0]) * s, y + (sp.hd[1] - sp.feet[1]) * s];
};
const FullSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -9000, top: -9000, overflow: 'visible'}} width={18000} height={27000} viewBox="-9000 -9000 18000 27000">
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number}> = ({
  x,
  y,
  size,
  s = 1,
  text,
  rot = 0,
  fill = '#fff',
  stroke = INK,
  sw = 0.2,
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );

// ======================================================================================================
// OCEAN WORLD: sea surface at y = 0; the surface plate (deep-dive) above, a code gradient, the bottom plate (megalodon) below.
// ======================================================================================================
const SPS = 2;
const S_X0 = -1024;
const S_Y0 = -297 * SPS;
const S_W = 1024 * SPS;
const S_H = 1536 * SPS;
const GRAD_TOP = S_Y0 + S_H; // 2478
const B_Y0 = 4600;
const B_X0 = -1024;
const B_W = 1024 * SPS;
const B_H = 1536 * SPS;
const FLOOR = B_Y0 + 1163 * SPS; // 6926
const BANDS: [number, number, string][] = [
  [0, 130, '#56c2ec'],
  [130, 432, '#4cb0de'],
  [432, 848, '#2590d1'],
  [848, 1266, '#1b6fb8'],
  [1266, 1670, '#155498'],
  [1670, 2030, '#113e73'],
  [2030, GRAD_TOP + 4, '#0e2e59'],
];
const OceanBack: React.FC<{t: number; dx?: number}> = ({t, dx = 0}) => (
  <FullSvg>
    <g transform={`translate(${dx} 0)`}>
    <defs>
      <linearGradient id="sl-deep" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0e2e59" />
        <stop offset="1" stopColor="#122a5a" />
      </linearGradient>
    </defs>
    <rect x={-9000} y={-9000} width={18000} height={9000 + S_Y0 + 4} fill={SKY} />
    <rect x={-9000} y={S_Y0} width={18000} height={-S_Y0 + 2} fill={SKY} />
    {BANDS.map(([a, b, c]) => (
      <rect key={a} x={-9000} y={a} width={18000} height={b - a + 2} fill={c} />
    ))}
    <rect x={-9000} y={GRAD_TOP} width={18000} height={B_Y0 - GRAD_TOP + 4} fill="url(#sl-deep)" />
    <rect x={-9000} y={B_Y0} width={18000} height={9000} fill="#122a5a" />
    {/* far rock beside the bottom plate (its trench walls continue) */}
    <rect x={-9000} y={B_Y0 + 380} width={9000 + B_X0 + 60} height={9000} fill="#1c2b47" />
    <rect x={B_X0 + B_W - 60} y={B_Y0 + 380} width={9000} height={9000} fill="#1c2b47" />
    <rect x={-9000} y={FLOOR + 6} width={18000} height={4000} fill="#b0a999" />
    <SImg key="bgs" href={F('bg_surface')} x={S_X0} y={S_Y0} width={S_W} height={S_H} preserveAspectRatio="none" />
    <SImg key="bgb" href={F('bg_bottom', 'jpg')} x={B_X0} y={B_Y0} width={B_W} height={B_H} preserveAspectRatio="none" />
    {/* clouds (code, in the plate style) */}
    {[
      [-700, -900, 1.2],
      [380, -1250, 0.9],
      [900, -700, 1.0],
      [-1200, -1500, 0.8],
    ].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x + 14 * Math.sin(0.2 * t + i)} ${y}) scale(${s})`}>
        <PuffCluster
          puffs={[
            {x: -70, y: 10, r: 46},
            {x: 0, y: -12, r: 62},
            {x: 74, y: 8, r: 48},
            {x: 0, y: 22, r: 44},
          ]}
          fill="#fff"
          ink={5}
        />
      </g>
    ))}
    </g>
  </FullSvg>
);

// front water: tints everything under the surface, crisp wavy surface line
const WaterFront: React.FC<{t: number; deep?: boolean}> = ({t}) => {
  const pts: string[] = [];
  for (let x = -4000; x <= 4000; x += 40) pts.push(`${x},${7 * Math.sin(x / 70 + 2.2 * t) + 4 * Math.sin(x / 31 - 1.3 * t)}`);
  return (
    <g>
      <defs>
        <linearGradient id="sl-water" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={B_Y0}>
          <stop offset="0" stopColor="#4fb3e8" stopOpacity={0.42} />
          <stop offset={1200 / B_Y0} stopColor="#1b6fb8" stopOpacity={0.52} />
          <stop offset={GRAD_TOP / B_Y0} stopColor="#0e2e59" stopOpacity={0.6} />
          <stop offset="1" stopColor="#122a5a" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <polygon points={`-4000,${B_Y0} ${pts.join(' ')} 4000,${B_Y0}`} fill="url(#sl-water)" />
      <rect x={-4000} y={B_Y0 - 2} width={8000} height={6000} fill="#122a5a" opacity={0.28} />
      <polyline points={pts.join(' ')} fill="none" stroke="#E9F8FF" strokeWidth={6} strokeLinejoin="round" />
      {Array.from({length: 26}, (_, i) => {
        const x = -3000 + i * 240 + 60 * Math.sin(i * 1.7);
        const y = 7 * Math.sin(x / 70 + 2.2 * t) + 4 * Math.sin(x / 31 - 1.3 * t);
        return <path key={i} d={`M ${x - 22} ${y + 2} Q ${x} ${y - 14} ${x + 22} ${y + 2}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------- the sub (code) ----------
const HRX = 365;
const HRY = 160;
const SAIL_TOP = -280;
const HATCH_X = -100;
const SW_X = 100; // sandwich spot on the sail top
const SW_W = 178; // sandwich width (it is the hero of frame 0)
const EYE_L: [number, number] = [-235, -122];
const EYE_R: [number, number] = [215, -129];
const hullTop = (x: number) => -HRY * Math.sqrt(Math.max(0, 1 - (x / HRX) ** 2));
type SubPose = {x: number; y: number; rot: number};
const subLocal = (p: SubPose, lx: number, ly: number): [number, number] => {
  const a = (p.rot * Math.PI) / 180;
  return [p.x + lx * Math.cos(a) - ly * Math.sin(a), p.y + lx * Math.sin(a) + ly * Math.cos(a)];
};
const SubBody: React.FC<{t: number; fish?: boolean; cut?: number; children?: React.ReactNode; inside?: React.ReactNode; front?: React.ReactNode}> = ({
  t,
  cut = 0,
  children,
  inside,
  front,
}) => {
  const prop = (t * 700) % 360;
  return (
    <g>
      {/* skids */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <rect x={d * 130 - 16} y={HRY - 30} width={32} height={42} fill={STEEL} stroke={INK} strokeWidth={OW} />
          <rect x={d > 0 ? 40 : -230} y={HRY + 6} width={190} height={20} rx={10} fill={STEEL} stroke={INK} strokeWidth={OW} />
        </g>
      ))}
      {/* propeller duct (back = left) */}
      <g transform={`translate(${-HRX - 18} ${12})`}>
        <rect x={-20} y={-12} width={44} height={24} fill={STEEL_SH} stroke={INK} strokeWidth={OW} />
        <ellipse cx={-28} cy={0} rx={12} ry={58 * Math.abs(Math.cos((prop * Math.PI) / 180)) + 8} fill="#C9C9C9" stroke={INK} strokeWidth={OW} />
        <ellipse cx={-28} cy={0} rx={24} ry={66} fill="none" stroke={INK} strokeWidth={OW + 7} />
        <ellipse cx={-28} cy={0} rx={24} ry={66} fill="none" stroke={STEEL} strokeWidth={7} />
      </g>
      {/* sail (tower) */}
      <path
        d={`M -190 -120 L -190 ${SAIL_TOP + 26} Q -190 ${SAIL_TOP} -164 ${SAIL_TOP} L 164 ${SAIL_TOP} Q 190 ${SAIL_TOP} 190 ${SAIL_TOP + 26} L 190 -120 Z`}
        fill={SAIL}
        stroke={INK}
        strokeWidth={OW}
      />
      <path d={`M -186 -124 L -186 ${SAIL_TOP + 26} Q -186 ${SAIL_TOP + 4} -164 ${SAIL_TOP + 4} L -150 ${SAIL_TOP + 4} L -150 -124 Z`} fill={SAIL_SH} />
      <path d={`M -190 -120 L -190 ${SAIL_TOP + 26} Q -190 ${SAIL_TOP} -164 ${SAIL_TOP} L 164 ${SAIL_TOP} Q 190 ${SAIL_TOP} 190 ${SAIL_TOP + 26} L 190 -120`} fill="none" stroke={INK} strokeWidth={OW} />
      {/* small window on the sail */}
      <rect x={60} y={SAIL_TOP + 50} width={70} height={40} rx={14} fill="#9FD8F2" stroke={INK} strokeWidth={OW} />
      {/* hull */}
      <ellipse cx={0} cy={0} rx={HRX} ry={HRY} fill={HULL} stroke={INK} strokeWidth={OW} />
      <path d={`M ${-HRX + 30} 40 Q 0 ${HRY + 60} ${HRX - 30} 40 Q 0 ${HRY - 10} ${-HRX + 30} 40 Z`} fill={HULL_SH} />
      <path d={`M ${-HRX + 60} -70 Q -250 -120 -170 -134`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
      <ellipse cx={0} cy={0} rx={HRX} ry={HRY} fill="none" stroke={INK} strokeWidth={OW} />
      {/* portholes */}
      {[
        [235, -20, 34],
        [300, 52, 22],
        [150, 62, 20],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r + 7} fill={STEEL} stroke={INK} strokeWidth={OW} />
          <circle cx={x} cy={y} r={r} fill="#9FD8F2" stroke={INK} strokeWidth={OW * 0.8} />
          <path d={`M ${x - r * 0.5} ${y - r * 0.2} A ${r * 0.6} ${r * 0.6} 0 0 1 ${x + r * 0.1} ${y - r * 0.6}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* lifting eyes */}
      {[EYE_L, EYE_R].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y - 12} rx={13} ry={15} fill="none" stroke={INK} strokeWidth={OW + 8} />
          <ellipse cx={x} cy={y - 12} rx={13} ry={15} fill="none" stroke={STEEL} strokeWidth={8} />
        </g>
      ))}
      {/* the lift ring on the sail top (the recovery hook takes it) */}
      <ellipse cx={0} cy={SAIL_TOP - 14} rx={14} ry={16} fill="none" stroke={INK} strokeWidth={OW + 8} />
      <ellipse cx={0} cy={SAIL_TOP - 14} rx={14} ry={16} fill="none" stroke={STEEL} strokeWidth={8} />
      {/* cutaway into the cabin (bottom scene) */}
      {cut > 0.001 ? <Cutaway s={cut}>{inside}</Cutaway> : null}
      {/* hatch: lid standing open behind, ring back half, the occupant, ring front half */}
      <g>
        <rect x={HATCH_X - 92} y={SAIL_TOP - 66} width={18} height={64} rx={8} fill={STEEL} stroke={INK} strokeWidth={OW} transform={`rotate(-12 ${HATCH_X - 83} ${SAIL_TOP})`} />
        <ellipse cx={HATCH_X - 98} cy={SAIL_TOP - 34} rx={14} ry={46} fill={STEEL} stroke={INK} strokeWidth={OW} transform={`rotate(-14 ${HATCH_X - 98} ${SAIL_TOP - 34})`} />
        <ellipse cx={HATCH_X} cy={SAIL_TOP} rx={68} ry={18} fill={STEEL} stroke={INK} strokeWidth={OW} />
        <ellipse cx={HATCH_X} cy={SAIL_TOP + 1} rx={54} ry={12} fill="#1E2A30" stroke={INK} strokeWidth={OW * 0.7} />
        <defs>
          <clipPath id="sl-hatch">
            <rect x={-2000} y={-4000} width={4000} height={4000 + SAIL_TOP + 3} />
          </clipPath>
        </defs>
        <g clipPath="url(#sl-hatch)">{children}</g>
        <path d={`M ${HATCH_X - 68} ${SAIL_TOP} A 68 18 0 0 0 ${HATCH_X + 68} ${SAIL_TOP} L ${HATCH_X + 54} ${SAIL_TOP + 1} A 54 12 0 0 1 ${HATCH_X - 54} ${SAIL_TOP + 1} Z`} fill={STEEL} stroke={INK} strokeWidth={OW} />
      </g>
      {front}
    </g>
  );
};
// the cabin seen through a cutaway in the hull (dashed edge = cutaway diagram)
const Cutaway: React.FC<{s: number; children?: React.ReactNode}> = ({s, children}) => (
  <g transform={`translate(30 12) scale(${s})`}>
    <defs>
      <clipPath id="sl-cut">
        <ellipse cx={0} cy={0} rx={250} ry={112} />
      </clipPath>
    </defs>
    <ellipse cx={0} cy={0} rx={250} ry={112} fill="#1D4250" />
    <g clipPath="url(#sl-cut)">
      <rect x={-260} y={40} width={520} height={90} fill="#163541" />
      {/* a seat */}
      <rect x={-80} y={2} width={170} height={56} rx={16} fill="#7A3B2E" stroke={INK} strokeWidth={OW} />
      <rect x={-70} y={-70} width={40} height={90} rx={14} fill="#7A3B2E" stroke={INK} strokeWidth={OW} />
      {children}
    </g>
    <ellipse cx={0} cy={0} rx={250} ry={112} fill="none" stroke={INK} strokeWidth={OW + 6} />
    <ellipse cx={0} cy={0} rx={250} ry={112} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="26 16" />
  </g>
);

// ---------- the sandwich (code) ----------
type Mood = 'happy' | 'worried' | 'scared' | 'sleepy' | 'closed' | 'squeeze' | 'grin';
const Sandwich: React.FC<{
  x: number;
  y: number;
  w?: number;
  sx?: number;
  sy?: number;
  rot?: number;
  mood?: Mood;
  look?: [number, number];
  wet?: number;
  mold?: number;
  bites?: number;
  id?: string;
  shiver?: number;
}> = ({x, y, w = 150, sx = 1, sy = 1, rot = 0, mood = 'happy', look = [0, 0], wet = 0, mold = 0, bites = 0, id = 'a', shiver = 0}) => {
  const h = 0.77 * w;
  const hw = w / 2;
  const ow = w * 0.032;
  const bitesN = Math.floor(bites * 7 + 1e-6);
  const BITE: [number, number, number][] = [
    [hw, -0.72 * h, 0.2 * w],
    [-hw, -0.5 * h, 0.2 * w],
    [0.1 * w, -h, 0.18 * w],
    [hw, -0.25 * h, 0.2 * w],
    [-0.25 * w, -h, 0.2 * w],
    [-hw, -0.12 * h, 0.22 * w],
    [0.35 * w, -0.05 * h, 0.24 * w],
  ];
  const top = `M ${-hw} ${-0.52 * h} L ${-hw} ${-0.84 * h} Q ${-hw} ${-h} ${-hw + 0.2 * w} ${-h} L ${hw - 0.2 * w} ${-h} Q ${hw} ${-h} ${hw} ${-0.84 * h} L ${hw} ${-0.52 * h} Z`;
  const bot = `M ${-hw} ${-0.34 * h} L ${hw} ${-0.34 * h} L ${hw} ${-0.1 * h} Q ${hw} 0 ${hw - 0.1 * w} 0 L ${-hw + 0.1 * w} 0 Q ${-hw} 0 ${-hw} ${-0.1 * h} Z`;
  let lettuce = `M ${-hw - 0.06 * w} ${-0.5 * h}`;
  for (let i = 0; i <= 10; i++) {
    const xx = -hw - 0.06 * w + ((w + 0.12 * w) * i) / 10;
    lettuce += ` L ${xx} ${-0.5 * h + (i % 2 ? 0.07 * h : -0.02 * h)}`;
  }
  lettuce += ` L ${hw + 0.06 * w} ${-0.6 * h} L ${-hw - 0.06 * w} ${-0.6 * h} Z`;
  const bol = `M ${-hw - 0.04 * w} ${-0.48 * h} Q 0 ${-0.52 * h} ${hw + 0.04 * w} ${-0.48 * h} L ${hw + 0.05 * w} ${-0.36 * h} Q 0 ${-0.3 * h} ${-hw - 0.05 * w} ${-0.36 * h} Z`;
  const er = 0.085 * w;
  const ey = -0.78 * h;
  const ex = 0.17 * w;
  const lid = mood === 'sleepy' ? 0.55 : 0;
  const squeeze = mood === 'squeeze';
  const closedEyes = mood === 'closed';
  const jit = shiver;
  return (
    <g transform={`translate(${x + jit} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
      <defs>
        <mask id={`sl-bite-${id}`} maskUnits="userSpaceOnUse" x={-w * 2} y={-w * 2} width={w * 4} height={w * 4}>
          <rect x={-w * 2} y={-w * 2} width={w * 4} height={w * 4} fill="#fff" />
          {BITE.slice(0, bitesN).map(([bx, by, br], i) => (
            <g key={i}>
              <circle cx={bx} cy={by} r={br} fill="#000" />
              <circle cx={bx + br * 0.7} cy={by + br * 0.5} r={br * 0.55} fill="#000" />
              <circle cx={bx - br * 0.7} cy={by - br * 0.4} r={br * 0.55} fill="#000" />
            </g>
          ))}
        </mask>
      </defs>
      <g mask={`url(#sl-bite-${id})`}>
        <path d={bot} fill={CRUST} stroke={INK} strokeWidth={ow} />
        <path d={`M ${-hw + ow * 1.6} ${-0.33 * h} L ${hw - ow * 1.6} ${-0.33 * h} L ${hw - ow * 1.6} ${-0.1 * h} L ${-hw + ow * 1.6} ${-0.1 * h} Z`} fill={BREAD} />
        <path d={bol} fill={BOLOGNA} stroke={INK} strokeWidth={ow} />
        <path d={`M ${-hw - 0.04 * w} ${-0.4 * h} Q 0 ${-0.36 * h} ${hw + 0.04 * w} ${-0.4 * h}`} fill="none" stroke={BOLOGNA_SH} strokeWidth={ow * 1.4} />
        <path d={lettuce} fill={LETTUCE} stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
        <path d={top} fill={CRUST} stroke={INK} strokeWidth={ow} />
        <path
          d={`M ${-hw + ow * 1.7} ${-0.55 * h} L ${-hw + ow * 1.7} ${-0.82 * h} Q ${-hw + ow * 1.7} ${-h + ow * 1.7} ${-hw + 0.2 * w} ${-h + ow * 1.7} L ${hw - 0.2 * w} ${-h + ow * 1.7} Q ${hw - ow * 1.7} ${-h + ow * 1.7} ${hw - ow * 1.7} ${-0.82 * h} L ${hw - ow * 1.7} ${-0.55 * h} Z`}
          fill={BREAD}
        />
        {/* sesame / bread pores */}
        {[
          [-0.3, -0.62],
          [0.32, -0.6],
          [0.0, -0.58],
        ].map(([a, b], i) => (
          <ellipse key={i} cx={a * w} cy={b * h} rx={0.02 * w} ry={0.012 * w} fill="#E3CC9A" />
        ))}
        {/* wet tint + mould */}
        {wet > 0.001 ? (
          <g opacity={0.32 * wet}>
            {[bot, bol, lettuce, top].map((d, i) => (
              <path key={i} d={d} fill="#2F78B8" />
            ))}
          </g>
        ) : null}
        {mold > 0.001 ? (
          <g opacity={clamp(mold * 1.4)}>
            <g opacity={0.38 * mold}>
              {[bot, bol, lettuce, top].map((d, i) => (
                <path key={i} d={d} fill="#6E9E3A" />
              ))}
            </g>
            {[
              [-0.3, -0.85, 0.11],
              [0.25, -0.7, 0.09],
              [-0.05, -0.2, 0.1],
              [0.3, -0.15, 0.08],
              [-0.35, -0.42, 0.07],
            ].map(([a, b, r], i) => (
              <g key={i}>
                <circle cx={a * w} cy={b * h} r={r * w * clamp(mold * 1.6 - i * 0.12)} fill="#5E8F2E" />
                <circle cx={a * w - r * w * 0.3} cy={b * h - r * w * 0.3} r={r * w * 0.45 * clamp(mold * 1.6 - i * 0.12)} fill="#A6CF6A" />
              </g>
            ))}
          </g>
        ) : null}
        {/* face */}
        {squeeze ? (
          <g>
            <Eye x={-ex} y={ey} r={er} open={1} squeeze side={-1} />
            <Eye x={ex} y={ey} r={er} open={1} squeeze side={1} />
          </g>
        ) : closedEyes ? (
          <g>
            <path d={`M ${-ex - er * 0.8} ${ey} Q ${-ex} ${ey + er * 0.7} ${-ex + er * 0.8} ${ey}`} fill="none" stroke={INK} strokeWidth={ow * 1.3} strokeLinecap="round" />
            <path d={`M ${ex - er * 0.8} ${ey} Q ${ex} ${ey + er * 0.7} ${ex + er * 0.8} ${ey}`} fill="none" stroke={INK} strokeWidth={ow * 1.3} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <Eye x={-ex} y={ey} r={er} open={1} look={look} lid={lid} side={-1} brow={mood === 'worried' || mood === 'scared' ? 0.5 : NaN} browTilt={mood === 'worried' ? -0.9 : 0} ink={0.2} />
            <Eye x={ex} y={ey} r={er} open={1} look={look} lid={lid} side={1} brow={mood === 'worried' || mood === 'scared' ? 0.5 : NaN} browTilt={mood === 'worried' ? -0.9 : 0} ink={0.2} />
          </g>
        )}
        {mood === 'scared' ? (
          <ellipse cx={0} cy={-0.6 * h} rx={0.06 * w} ry={0.05 * w} fill="#3a1a1a" stroke={INK} strokeWidth={ow * 0.8} />
        ) : mood === 'worried' ? (
          <path d={`M ${-0.08 * w} ${-0.58 * h} Q 0 ${-0.63 * h} ${0.08 * w} ${-0.58 * h}`} fill="none" stroke={INK} strokeWidth={ow * 1.1} strokeLinecap="round" />
        ) : mood === 'sleepy' ? (
          <path d={`M ${-0.05 * w} ${-0.6 * h} L ${0.05 * w} ${-0.6 * h}`} stroke={INK} strokeWidth={ow * 1.1} strokeLinecap="round" />
        ) : mood === 'grin' ? (
          <path d={`M ${-0.14 * w} ${-0.64 * h} Q 0 ${-0.5 * h} ${0.14 * w} ${-0.64 * h} Z`} fill="#3a1a1a" stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
        ) : (
          <path d={`M ${-0.1 * w} ${-0.62 * h} Q 0 ${-0.54 * h} ${0.1 * w} ${-0.62 * h}`} fill="none" stroke={INK} strokeWidth={ow * 1.1} strokeLinecap="round" />
        )}
      </g>
      {/* bite edges get crumbs-coloured rims */}
      {BITE.slice(0, bitesN).map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill="none" stroke={INK} strokeWidth={ow} strokeDasharray={`${br * 1.2} ${br * 4}`} opacity={0.9} />
      ))}
    </g>
  );
};

// ---------- germs (code) ----------
const Germ: React.FC<{x: number; y: number; r: number; t: number; ph?: number; chomp?: number; squash?: number; sleep?: number; s?: number; mir?: boolean}> = ({
  x,
  y,
  r,
  t,
  ph = 0,
  chomp = 0,
  squash = 0,
  sleep = 0,
  s = 1,
  mir = false,
}) => {
  if (s <= 0.001) return null;
  const pts: string[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const rr = r * (1 + 0.1 * Math.sin(a * 6 + 3 * t + ph));
    pts.push(`${rr * Math.cos(a)},${rr * Math.sin(a)}`);
  }
  const open = chomp > 0 ? 0.5 + 0.5 * Math.sin(2 * Math.PI * (2 + 10 * chomp) * t + ph) : 0;
  const sqx = 1 + 0.35 * squash;
  const sqy = 1 - 0.45 * squash;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * sqx * (mir ? -1 : 1)} ${s * sqy})`}>
      {/* cilia */}
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        return (
          <line key={i} x1={Math.cos(a) * r * 0.95} y1={Math.sin(a) * r * 0.95} x2={Math.cos(a) * r * 1.32} y2={Math.sin(a) * r * 1.32} stroke={INK} strokeWidth={r * 0.1} strokeLinecap="round" />
        );
      })}
      <polygon points={pts.join(' ')} fill={GERM} stroke={INK} strokeWidth={r * 0.12} strokeLinejoin="round" />
      <ellipse cx={-r * 0.25} cy={r * 0.3} rx={r * 0.5} ry={r * 0.35} fill={GERM_SH} opacity={0.6} />
      {squash > 0.5 ? (
        <g>
          <Eye x={-r * 0.3} y={-r * 0.25} r={r * 0.26} open={1} squeeze side={-1} />
          <Eye x={r * 0.3} y={-r * 0.25} r={r * 0.26} open={1} squeeze side={1} />
        </g>
      ) : (
        <g>
          <Eye x={-r * 0.3} y={-r * 0.25} r={r * 0.26} open={1} lid={sleep} brow={NaN} ink={0.2} />
          <Eye x={r * 0.3} y={-r * 0.25} r={r * 0.26} open={1} lid={sleep} brow={NaN} ink={0.2} />
        </g>
      )}
      {chomp > 0 && sleep < 0.5 ? (
        <g>
          <ellipse cx={r * 0.05} cy={r * 0.38} rx={r * 0.42} ry={r * (0.06 + 0.3 * open)} fill="#2a0d0d" stroke={INK} strokeWidth={r * 0.1} />
          {[-0.22, 0, 0.22].map((d, i) => (
            <rect key={i} x={r * (0.05 + d) - r * 0.06} y={r * (0.38 - 0.06 - 0.3 * open)} width={r * 0.12} height={r * 0.12} fill="#fff" />
          ))}
        </g>
      ) : (
        <path d={`M ${-r * 0.2} ${r * 0.4} Q ${r * 0.05} ${r * 0.52} ${r * 0.3} ${r * 0.4}`} fill="none" stroke={INK} strokeWidth={r * 0.1} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------- small code props ----------
const Fish: React.FC<{x: number; y: number; s?: number; dir?: 1 | -1; t: number; rot?: number; look?: [number, number]; flop?: number}> = ({x, y, s = 1, dir = 1, t, rot = 0, look = [0.4, 0], flop = 0}) => {
  const tail = 18 * Math.sin(2 * Math.PI * (3 + 6 * flop) * t);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * dir} ${s})`}>
      <path d={`M -40 0 L -78 -26 L -70 0 L -78 26 Z`} fill="#E0A63A" stroke={INK} strokeWidth={5} strokeLinejoin="round" transform={`rotate(${tail} -40 0)`} />
      <ellipse cx={0} cy={0} rx={50} ry={38} fill="#F2C84B" stroke={INK} strokeWidth={5} />
      <path d={`M -10 -36 Q 6 -58 22 -34`} fill="#E0A63A" stroke={INK} strokeWidth={5} />
      <path d={`M -30 14 Q 0 34 30 16`} fill="none" stroke="#E0A63A" strokeWidth={7} strokeLinecap="round" />
      <Eye x={22} y={-8} r={12} open={1} look={look} brow={NaN} ink={0.2} />
      <path d={`M 40 12 Q 46 16 42 22`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};
const LifeRing: React.FC<{x: number; y: number; r: number; half: 'back' | 'front'}> = ({x, y, r, half}) => {
  const rx = r;
  const ry = r * 0.36;
  const ir = 0.58;
  const segs = 8;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    const isFront = Math.sin(mid) > 0;
    if ((half === 'front') !== isFront) continue;
    const p = (a: number, k: number) => `${x + rx * k * Math.cos(a)},${y + ry * k * Math.sin(a)}`;
    out.push(
      <polygon key={i} points={`${p(a0, 1)} ${p((a0 + a1) / 2, 1.0)} ${p(a1, 1)} ${p(a1, ir)} ${p((a0 + a1) / 2, ir)} ${p(a0, ir)}`} fill={i % 2 ? RING_RED : '#fff'} />,
    );
  }
  return (
    <g>
      {out}
      {half === 'front' ? (
        <g>
          <path d={`M ${x - rx} ${y} A ${rx} ${ry} 0 0 0 ${x + rx} ${y}`} fill="none" stroke={INK} strokeWidth={5} />
          <path d={`M ${x - rx * ir} ${y} A ${rx * ir} ${ry * ir} 0 0 0 ${x + rx * ir} ${y}`} fill="none" stroke={INK} strokeWidth={4} />
        </g>
      ) : (
        <g>
          <path d={`M ${x - rx} ${y} A ${rx} ${ry} 0 0 1 ${x + rx} ${y}`} fill="none" stroke={INK} strokeWidth={5} />
          <path d={`M ${x - rx * ir} ${y} A ${rx * ir} ${ry * ir} 0 0 1 ${x + rx * ir} ${y}`} fill="none" stroke={INK} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};
const Thermo: React.FC<{x: number; y: number; h: number; s: number; level?: number; flake?: number}> = ({x, y, h, s, level = 0.18, flake = 1}) => {
  if (s <= 0.001) return null;
  const w = h * 0.2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* origin = bulb bottom */}
      <rect x={-w / 2} y={-h} width={w} height={h - w * 0.6} rx={w / 2} fill="#fff" stroke={INK} strokeWidth={h * 0.025} />
      <circle cx={0} cy={-w * 0.85} r={w * 0.85} fill="#3D8BFF" stroke={INK} strokeWidth={h * 0.025} />
      <rect x={-w * 0.2} y={-w * 1.2 - (h - w * 1.6) * level} width={w * 0.4} height={(h - w * 1.6) * level + w * 0.5} fill="#3D8BFF" />
      {Array.from({length: 6}, (_, i) => (
        <line key={i} x1={w * 0.18} x2={w * 0.42} y1={-w * 1.6 - i * ((h - w * 2.2) / 5)} y2={-w * 1.6 - i * ((h - w * 2.2) / 5)} stroke={INK} strokeWidth={h * 0.015} />
      ))}
      <circle cx={-w * 0.3} cy={-w * 1.0} r={w * 0.2} fill="#fff" opacity={0.8} />
      {flake > 0.001 ? <Flake x={w * 1.5} y={-h * 0.82} r={h * 0.17 * flake} /> : null}
    </g>
  );
};
const Flake: React.FC<{x: number; y: number; r: number; rot?: number}> = ({x, y, r, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <line x1={-r} x2={r} y1={0} y2={0} stroke={INK} strokeWidth={r * 0.34} strokeLinecap="round" />
        <line x1={-r} x2={r} y1={0} y2={0} stroke="#DDF3FF" strokeWidth={r * 0.18} strokeLinecap="round" />
        {[-1, 1].map((d) => (
          <g key={d}>
            <line x1={d * r * 0.55} y1={0} x2={d * r * 0.85} y2={-r * 0.25} stroke="#DDF3FF" strokeWidth={r * 0.13} strokeLinecap="round" />
            <line x1={d * r * 0.55} y1={0} x2={d * r * 0.85} y2={r * 0.25} stroke="#DDF3FF" strokeWidth={r * 0.13} strokeLinecap="round" />
          </g>
        ))}
      </g>
    ))}
  </g>
);
const Lunchbox: React.FC<{x: number; y: number; w: number; t: number; mood?: 'happy' | 'wink' | 'down'; rot?: number}> = ({x, y, w, t, mood = 'happy', rot = 0}) => {
  const h = w * 0.72;
  const ow = w * 0.035;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {/* origin = top of the handle */}
      <path d={`M ${-w * 0.22} ${w * 0.2} Q ${-w * 0.22} 0 0 0 Q ${w * 0.22} 0 ${w * 0.22} ${w * 0.2}`} fill="none" stroke={INK} strokeWidth={ow + w * 0.06} />
      <path d={`M ${-w * 0.22} ${w * 0.2} Q ${-w * 0.22} 0 0 0 Q ${w * 0.22} 0 ${w * 0.22} ${w * 0.2}`} fill="none" stroke="#C9C9C9" strokeWidth={w * 0.06} />
      <path d={`M ${-w / 2} ${w * 0.42} Q ${-w / 2} ${w * 0.16} 0 ${w * 0.16} Q ${w / 2} ${w * 0.16} ${w / 2} ${w * 0.42} Z`} fill="#D93A2B" stroke={INK} strokeWidth={ow} />
      <rect x={-w / 2} y={w * 0.42} width={w} height={h} rx={w * 0.08} fill="#D93A2B" stroke={INK} strokeWidth={ow} />
      <rect x={-w / 2 + ow} y={w * 0.42 + h * 0.62} width={w - 2 * ow} height={h * 0.34} rx={w * 0.05} fill="#B02A1F" />
      <rect x={-w * 0.07} y={w * 0.36} width={w * 0.14} height={w * 0.14} rx={w * 0.03} fill="#C9C9C9" stroke={INK} strokeWidth={ow * 0.8} />
      {mood === 'wink' ? (
        <path d={`M ${-w * 0.26} ${w * 0.66} Q ${-w * 0.18} ${w * 0.6} ${-w * 0.1} ${w * 0.66}`} fill="none" stroke={INK} strokeWidth={ow * 1.3} strokeLinecap="round" />
      ) : (
        <Eye x={-w * 0.18} y={w * 0.66} r={w * 0.075} open={1} look={mood === 'down' ? [0, 0.8] : [0.2, 0]} brow={NaN} ink={0.2} />
      )}
      <Eye x={w * 0.18} y={w * 0.66} r={w * 0.075} open={1} look={mood === 'down' ? [0, 0.8] : [0.2, 0]} brow={NaN} ink={0.2} />
      <path d={`M ${-w * 0.12} ${w * 0.8} Q 0 ${w * 0.92} ${w * 0.12} ${w * 0.8}`} fill="#3a1a1a" stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
      <path d={`M ${-w * 0.36} ${w * 0.3} Q ${-w * 0.2} ${w * 0.22} ${-w * 0.05} ${w * 0.24}`} fill="none" stroke="#fff" strokeWidth={w * 0.03} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};
// beard (code) on a guy pose: anchor below the mouth, in head-radius units relative to the head centre
const BEARD_AT: Record<string, [number, number, number]> = {p_shock: [0, 0.78, 0.46], p_point: [0.17, 0.52, 0.56], p_cheer: [0, 0.52, 0.6]};
const Beard: React.FC<{n: string; hx: number; hy: number; r: number; mir?: boolean; s?: number}> = ({n, hx, hy, r, mir = false, s = 1}) => {
  const b = BEARD_AT[n];
  if (!b || s <= 0.001) return null;
  const x = hx + (mir ? -1 : 1) * b[0] * r;
  const y = hy + b[1] * r;
  const w = b[2] * r;
  const L = 1.25 * r * s;
  const d = `M ${-w} 0 Q ${-w * 1.15} ${L * 0.5} ${-w * 0.7} ${L * 0.85} Q ${-w * 0.45} ${L * 1.05} ${-w * 0.25} ${L * 0.88} Q 0 ${L * 1.18} ${w * 0.25} ${L * 0.88} Q ${w * 0.45} ${L * 1.05} ${w * 0.7} ${L * 0.85} Q ${w * 1.15} ${L * 0.5} ${w} 0 Q 0 ${r * 0.2} ${-w} 0 Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={d} fill={BEARD} stroke={INK} strokeWidth={r * 0.06} strokeLinejoin="round" />
      <path d={`M ${-w * 0.3} ${L * 0.2} Q ${-w * 0.45} ${L * 0.5} ${-w * 0.25} ${L * 0.72}`} fill="none" stroke={BEARD_SH} strokeWidth={r * 0.06} strokeLinecap="round" />
      <path d={`M ${w * 0.25} ${L * 0.25} Q ${w * 0.4} ${L * 0.5} ${w * 0.2} ${L * 0.7}`} fill="none" stroke={BEARD_SH} strokeWidth={r * 0.06} strokeLinecap="round" />
    </g>
  );
};
const Arrow: React.FC<{x: number; y: number; ang: number; len: number; s: number}> = ({x, y, ang, len, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      {/* points toward +x, tip at the origin */}
      <path d={`M 0 0 L ${-len * 0.42} ${-len * 0.32} L ${-len * 0.42} ${-len * 0.14} L ${-len} ${-len * 0.14} L ${-len} ${len * 0.14} L ${-len * 0.42} ${len * 0.14} L ${-len * 0.42} ${len * 0.32} Z`} fill="#CDEBFF" stroke={INK} strokeWidth={len * 0.045} strokeLinejoin="round" />
    </g>
  );
const Bubbles: React.FC<{t: number; t0: number; t1: number; x: number; y: number; n?: number; spread?: number; seed?: number; rise?: number}> = ({t, t0, t1, x, y, n = 10, spread = 60, seed = 1, rise = 520}) => {
  if (t < t0 || t > t1 + 1.6) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const tb = t0 + ((t1 - t0) * i) / n;
        const u = (t - tb) / 1.5;
        if (u < 0 || u > 1) return null;
        const r = 7 + 9 * rnd(seed + i);
        return (
          <circle
            key={i}
            cx={x + (rnd(seed + 7 + i) - 0.5) * spread + 14 * Math.sin(8 * u + i)}
            cy={y - rise * u}
            r={r * (1 - 0.3 * u)}
            fill="#DFF4FF"
            fillOpacity={0.35}
            stroke="#fff"
            strokeWidth={3.5}
          />
        );
      })}
    </g>
  );
};
// splash: droplets fly out on arcs + a crown of foam puffs that grows and shrinks away
const Splash: React.FC<{t: number; t0: number; x: number; y: number; size: number; seed?: number; dir?: 0 | 1 | -1}> = ({t, t0, x, y, size, seed = 3, dir = 0}) => {
  const u = (t - t0) / 0.75;
  if (u < 0 || u > 1) return null;
  const H = size * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - 0.25 * u);
  const W = size * (0.55 + 0.45 * easeOutCubic(u));
  // a cartoon water crown: a sheet with 5 spikes, drops on the tips
  const spikes = [-1, -0.55, 0, 0.55, 1];
  let d = `M ${x - W} ${y + 6}`;
  spikes.forEach((f, i) => {
    const lean = dir === 0 ? f : dir;
    const sx = x + f * W * 0.86 + lean * H * 0.18;
    const sy = y - H * (i === 2 ? 1 : i % 2 ? 0.82 : 0.62) * (0.85 + 0.3 * rnd(seed + i));
    const vx = x + (f - 0.27) * W * 0.86;
    d += ` Q ${vx} ${y - H * 0.25} ${sx} ${sy}`;
    d += ` Q ${sx + W * 0.12} ${y - H * 0.25} ${x + (f + 0.27) * W * 0.86} ${y - H * 0.12}`;
  });
  d += ` L ${x + W} ${y + 6} Z`;
  return (
    <g>
      <path d={d} fill="#EAF8FF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d={`M ${x - W * 0.7} ${y + 2} Q ${x} ${y - H * 0.35} ${x + W * 0.7} ${y + 2} Z`} fill="#BFE6FA" />
      {Array.from({length: 9}, (_, i) => {
        const f = (i / 8) * 2 - 1;
        const tt = u;
        const px = x + f * W * 1.1 + (dir || f) * size * 0.5 * tt;
        const py = y - H * 1.15 - size * 0.3 * Math.sin(Math.PI * tt) * (0.6 + 0.6 * rnd(seed + 50 + i)) + size * 0.9 * tt * tt;
        if (py > y) return null;
        const r = size * 0.045 * (0.7 + 0.6 * rnd(seed + 80 + i));
        return <path key={i} d={`M ${px} ${py - r * 1.9} Q ${px + r * 1.1} ${py - r * 0.2} ${px} ${py + r} Q ${px - r * 1.1} ${py - r * 0.2} ${px} ${py - r * 1.9} Z`} fill="#EAF8FF" stroke={INK} strokeWidth={3} />;
      })}
    </g>
  );
};

// ======================================================================================================
// SHOT 1 + the haul (one continuous ocean world, 0 - 9.94 s; the bottom part from 7.94)
// ======================================================================================================
const PULLEY: [number, number] = [0, -1400];
const HANG_Y = -330;
const subPose = (t: number): SubPose => {
  if (t < T.snap + 0.02) {
    const tw = t > T.cables && t < T.snap ? 1.6 * Math.sin(2 * Math.PI * 9 * t) * (1 - prog(t, T.cables, T.snap) * 0.4) : 0;
    return {x: 0, y: HANG_Y + 4 * Math.sin(2 * Math.PI * 0.4 * t), rot: 1.2 * Math.sin(2 * Math.PI * 0.33 * t) + tw};
  }
  if (t < C_BOTTOM) {
    const tf = t - (T.snap + 0.02);
    const hitT = 0.22;
    let y: number;
    if (tf < hitT) y = HANG_Y + 0.5 * 7025 * tf * tf;
    else {
      const ti = tf - hitT;
      const plunge = 130 * Math.exp(-3.2 * ti) * Math.sin(Math.PI * Math.min(1, ti / 0.42) * 1.0);
      const settle = -170 + 170 * (1 - Math.exp(-6 * ti)) + 40 * Math.exp(-2.5 * ti) * Math.sin(2 * Math.PI * 1.1 * ti);
      y = settle + plunge;
    }
    // flooding: sinks slowly, then goes under after "doesn't"
    y += 130 * easeInCubic(prog(t, 5.4, 6.95)) + 160 * easeInCubic(prog(t, 6.95, 7.35)) + 520 * easeInCubic(prog(t, 7.35, C_BOTTOM));
    const rot = (tf < hitT ? -3 * (tf / hitT) : 7 * Math.exp(-2 * (tf - hitT)) * Math.cos(2 * Math.PI * 0.9 * (tf - hitT))) + 6 * prog(t, 6.6, C_BOTTOM);
    return {x: 0, y, rot};
  }
  // on the sea floor, then hauled up
  const rest: SubPose = {x: 0, y: FLOOR - 150, rot: -5};
  if (t < T.haul) return rest;
  const u = prog(t, T.haul, 9.56);
  const y = lerp(FLOOR - 150, HANG_Y, haulEase(u));
  const sw = t > 9.56 ? 4 * Math.exp(-3 * (t - 9.56)) * Math.sin(2 * Math.PI * 0.8 * (t - 9.56)) : 0;
  return {x: 0, y: y + (t > 9.56 ? 18 * Math.exp(-4 * (t - 9.56)) * Math.sin(2 * Math.PI * 1.3 * (t - 9.56)) : 0), rot: lerp(-5, 0, easeOutCubic(prog(t, T.haul, 9.4))) + sw};
};
const SHOT1: CamKey[] = [
  {t: 0, x: 45, y: -500, k: 1.52},
  {t: 0.95, x: 50, y: -505, k: 1.62},
  {t: 2.35, x: 0, y: 980, k: 0.5},
  {t: 2.95, x: 0, y: 1000, k: 0.5},
  {t: 3.55, x: 0, y: -440, k: 0.98, ease: 'io'},
  {t: 4.15, x: 0, y: -420, k: 1.02},
  {t: 4.75, x: 30, y: -170, k: 1.0},
  {t: 5.2, x: 60, y: -300, k: 1.02},
  {t: 6.0, x: 60, y: -290, k: 1.04},
  {t: 6.55, x: -95, y: -150, k: 1.95},
  {t: 7.3, x: -95, y: -40, k: 2.0},
  {t: C_BOTTOM, x: -60, y: 760, k: 1.15, ease: 'in'},
];
// crew: three leap out of the hatch on arcs and land in life rings
type Jumper = {n: string; float: string; t0: number; land: number; x1: number; apex: number; mir: boolean; r: number};
const JUMPERS: Jumper[] = [
  {n: 'p_leap', float: 'p_shock', t0: T.jumps, land: T.jumps + 0.48, x1: 300, apex: -840, mir: false, r: 62},
  {n: 's_scared', float: 's_shock', t0: T.jumps + 0.16, land: T.jumps + 0.64, x1: -360, apex: -800, mir: true, r: 60},
  {n: 'c_panic', float: 'c_panic', t0: T.jumps + 0.3, land: T.jumps + 0.8, x1: 520, apex: -900, mir: false, r: 58},
];
const CrewInWater: React.FC<{t: number}> = ({t}) => (
  <g>
    {JUMPERS.map((j, i) => {
      if (t < j.land || t > C_BOTTOM) return null;
      const bob = 7 * Math.sin(2 * Math.PI * 0.9 * t + i * 1.7);
      const sink = 30 * Math.exp(-5 * (t - j.land));
      const y = bob + sink;
      const hdY = y - 1.55 * j.r;
      const sp = S(j.float);
      const s = j.r / sp.hd[2];
      const fy = hdY + (sp.feet[1] - sp.hd[1]) * s;
      const fx = j.x1 + (j.mir ? -1 : 1) * (sp.feet[0] - sp.hd[0]) * s;
      const sq = squashSwap(t, j.land);
      return (
        <g key={i}>
          <LifeRing x={j.x1} y={y + 6} r={j.r * 1.25} half="back" />
          <defs>
            <clipPath id={`sl-float-${i}`}>
              <rect x={j.x1 - 400} y={y - 1200} width={800} height={1200 + 8} />
            </clipPath>
          </defs>
          <g clipPath={`url(#sl-float-${i})`}>
            <G n={j.float} x={fx} y={fy} r={j.r} mir={j.mir} sx={sq[0]} sy={sq[1]} />
          </g>
          <LifeRing x={j.x1} y={y + 6} r={j.r * 1.25} half="front" />
        </g>
      );
    })}
  </g>
);
const Jumpers: React.FC<{t: number; sub: SubPose}> = ({t, sub}) => (
  <g>
    {JUMPERS.map((j, i) => {
      if (t < j.t0 || t >= j.land) return null;
      const [hx0, hy0] = subLocal(sub, HATCH_X, SAIL_TOP);
      const u = prog(t, j.t0, j.land);
      const x = lerp(hx0, j.x1, u);
      // parabola through the apex
      const y0 = hy0 - 40;
      const y1 = -40;
      const ya = j.apex;
      const r = Math.sqrt((y0 - ya) / (y1 - ya));
      const ta = r / (1 + r);
      const g = (2 * (y0 - ya)) / (ta * ta);
      const y = ya + 0.5 * g * (u - ta) * (u - ta);
      const spin = (j.mir ? -1 : 1) * 40 * u;
      return <G key={i} n={j.n} x={x} y={y} r={j.r} anchor="head" mir={j.mir} rot={spin} />;
    })}
  </g>
);
// the guy in the hatch (shot 1): thumbs up -> scared on "cables" -> gone (leaps) on "jumps"
const HatchGuy: React.FC<{t: number}> = ({t}) => {
  if (t >= T.jumps) return null;
  const n = t < T.cables ? 'p_thumb' : 'p_scared';
  const tsw = T.cables;
  const sq = squashSwap(t, tsw);
  const r = 60;
  const trem = n === 'p_scared' ? 3 * Math.sin(2 * Math.PI * 13 * t) : 0;
  const rise = t > T.jumps - 0.12 ? -60 * prog(t, T.jumps - 0.12, T.jumps) : 0;
  const hy = SAIL_TOP - 2.1 * r + rise + (n === 'p_scared' ? -0.35 * r : 0);
  const sp = S(n);
  const s = r / sp.hd[2];
  const wave = n === 'p_thumb' ? 2.5 * Math.sin(2 * Math.PI * 1.6 * t) : 0;
  return (
    <g transform={`translate(${HATCH_X + trem} ${hy}) rotate(${wave}) scale(${sq[0] * breathe(t)} ${sq[1]})`}>
      <SImg key={n} href={F(n)} x={-sp.hd[0] * s} y={-sp.hd[1] * s} width={sp.w * s} height={sp.h * s} />
    </g>
  );
};
// sandwich in shot 1: on the sail top -> bounced into the hatch at the splash -> peeks out alone -> ducks under
const SPLASH_T = T.snap + 0.24;
const sandwichShot1 = (t: number) => {
  // returns {mode, x, y (sub-local), mood, look, sx, sy}
  if (t < SPLASH_T) {
    const hop = t < 0.6 ? -26 * Math.abs(Math.sin(Math.PI * prog(t, 0.2, 0.6) * 2)) : 0;
    let mood: Mood = 'happy';
    let look: [number, number] = [-0.25, 0.1];
    if (t > T.bottom - 0.1) look = [0, 0.95];
    if (t > T.sea + 0.1) mood = 'worried';
    if (t > T.cables) {
      look = [0.3, -0.95];
      mood = 'worried';
    }
    if (t > T.snap) {
      mood = 'scared';
      look = [0, 0];
    }
    return {mode: 'top' as const, x: SW_X, y: SAIL_TOP + hop, mood, look, sx: 1, sy: 1, rot: 0};
  }
  if (t < SPLASH_T + 0.36) {
    const u = prog(t, SPLASH_T, SPLASH_T + 0.36);
    const x = lerp(SW_X, HATCH_X, u);
    const y = lerp(SAIL_TOP, SAIL_TOP + 120, u) - 230 * Math.sin(Math.PI * u) * (u < 0.5 ? 1 : 1);
    return {mode: 'fly' as const, x, y, mood: 'squeeze' as Mood, look: [0, 0] as [number, number], sx: 1, sy: 1, rot: -400 * u};
  }
  if (t < 6.22) return {mode: 'hidden' as const, x: HATCH_X, y: SAIL_TOP + 200, mood: 'happy' as Mood, look: [0, 0] as [number, number], sx: 1, sy: 1, rot: 0};
  // peeks out: top half above the rim
  const up = easeOutBack(prog(t, 6.22, 6.45), 2) - easeInCubic(prog(t, 7.3, 7.52)) * 1.1;
  let look: [number, number] = [0, 0];
  if (t > 6.45 && t < 6.75) look = [-0.95, 0];
  else if (t > 6.78 && t < 7.04) look = [0.95, 0];
  else if (t >= 7.04) look = [0, 0.2];
  const mood: Mood = t > T.doesnt ? 'worried' : 'happy';
  return {mode: 'peek' as const, x: HATCH_X + 4, y: SAIL_TOP + 190 - 135 * up, mood, look, sx: 1, sy: 1, rot: 0};
};

const CraneArm: React.FC<{p: [number, number]}> = ({p}) => {
  const [px, py] = p;
  const x0 = -2600;
  const y0 = -2700;
  const a = Math.atan2(py - y0, px - x0);
  const L = Math.hypot(px - x0, py - y0);
  return (
    <g>
      <g transform={`translate(${x0} ${y0}) rotate(${(a * 180) / Math.PI})`}>
        <rect x={0} y={-40} width={L + 30} height={80} fill={CRANE} stroke={INK} strokeWidth={OW + 1} />
        <rect x={0} y={14} width={L + 30} height={22} fill={CRANE_SH} />
        <rect x={0} y={-40} width={L + 30} height={80} fill="none" stroke={INK} strokeWidth={OW + 1} />
        {Array.from({length: Math.floor(L / 160)}, (_, i) => (
          <circle key={i} cx={80 + i * 160} cy={-14} r={9} fill={CRANE_SH} stroke={INK} strokeWidth={3} />
        ))}
      </g>
      <circle cx={px} cy={py + 40} r={44} fill={STEEL} stroke={INK} strokeWidth={OW} />
      <circle cx={px} cy={py + 40} r={14} fill={STEEL_SH} stroke={INK} strokeWidth={OW * 0.8} />
    </g>
  );
};
const HookBlock: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x - 34} y={y - 70} width={68} height={74} rx={14} fill="#F2C230" stroke={INK} strokeWidth={OW} />
    <rect x={x - 34} y={y - 70} width={68} height={22} rx={10} fill="#D4A21A" stroke={INK} strokeWidth={OW * 0.8} />
    <path d={`M ${x} ${y + 4} L ${x} ${y + 30} Q ${x} ${y + 70} ${x - 30} ${y + 66} Q ${x - 50} ${y + 60} ${x - 44} ${y + 40}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d={`M ${x} ${y + 4} L ${x} ${y + 30} Q ${x} ${y + 70} ${x - 30} ${y + 66} Q ${x - 50} ${y + 60} ${x - 44} ${y + 40}`} fill="none" stroke={STEEL} strokeWidth={12} strokeLinecap="round" />
  </g>
);
const Cable: React.FC<{x1: number; y1: number; x2: number; y2: number; sag?: number; w?: number}> = ({x1, y1, x2, y2, sag = 0, w = 7}) => {
  const mx = (x1 + x2) / 2 + sag;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={INK} strokeWidth={w + 6} strokeLinecap="round" />
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke="#5A5A5A" strokeWidth={w} strokeLinecap="round" />
    </g>
  );
};

const OceanScene: React.FC<{t: number; coverCam?: Cam}> = ({t, coverCam}) => {
  const sub = subPose(t);
  // camera: shot 1 keys, the bottom (from "Ten"), the whip up with the haul, then settle over the water
  let c: Cam;
  if (coverCam) c = coverCam;
  else if (t < C_BOTTOM) c = camAt(t, SHOT1);
  else if (t < T.haul) c = {x: -30, y: FLOOR - 470 + 30 * prog(t, C_BOTTOM, T.haul), k: lerp(1.22, 1.32, easeInOutCubic(prog(t, C_BOTTOM, T.haul)))};
  else if (t < 9.56) c = {x: lerp(-30, 20, prog(t, T.haul, 9.56)), y: sub.y - 200 - 30 * prog(t, T.haul, 9.56), k: lerp(1.32, 1.06, easeInOutCubic(prog(t, T.haul, 9.56))) - 0.08 * Math.sin(Math.PI * prog(t, T.haul, 9.56))};
  else c = {x: lerp(20, 0, easeOutCubic(prog(t, 9.56, C_CLOSE))), y: lerp(HANG_Y - 230, HANG_Y - 300, easeOutCubic(prog(t, 9.56, C_CLOSE))), k: lerp(1.06, 1.12, prog(t, 9.56, C_CLOSE))};
  const hit = (t0: number, a: number, d = 7) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const amp = hit(T.snap, 7) + hit(SPLASH_T, 12) + hit(9.48, 8);
  const sh = shake(t, amp);
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const blur = c.k > 1.3 ? clamp((c.k - 1.3) / 0.4) * 3 : 0;
  const sw = sandwichShot1(t);
  const snapped = t >= T.snap;
  const [eLx, eLy] = subLocal(sub, EYE_L[0], EYE_L[1] - 24);
  const [eRx, eRy] = subLocal(sub, EYE_R[0], EYE_R[1] - 24);
  // hook block hangs above the sub on the sling; after the snap it bounces up and swings
  const blockY = snapped ? HANG_Y - 640 - 60 * Math.exp(-4 * (t - T.snap)) * Math.cos(2 * Math.PI * 1.2 * (t - T.snap)) : HANG_Y - 640 + 4 * Math.sin(2 * Math.PI * 0.4 * t);
  const swingA = snapped ? 14 * Math.exp(-1.2 * (t - T.snap)) * Math.sin(2 * Math.PI * 0.7 * (t - T.snap)) : 0;
  const twang = t > T.cables && t < T.snap ? 26 * Math.sin(2 * Math.PI * 11 * t) * (0.4 + 0.6 * prog(t, T.cables, T.snap)) : 0;
  // broken sling ends: whip up from the eyes, then dangle
  const endY = (y0: number) => lerp(y0, blockY + 160, easeOutCubic(prog(t, T.snap, T.snap + 0.3)));
  const bottom = t >= C_BOTTOM;
  const haul = t >= 8.72;
  const hookY = !haul ? -2000 : t < T.haul ? lerp(FLOOR - 1500, sub.y + SAIL_TOP - 30, easeOutCubic(prog(t, 8.72, 9.02))) : sub.y + SAIL_TOP - 30;
  const fishOut = t > 8.25 && t < 9.06;
  const tagS = popOut(t, C_BOTTOM + 0.04, 8.92, 0.3);
  // after the haul the sub drips and a fish flops out of the hatch
  const flopU = prog(t, 9.6, 10.05);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} blur={blur}>
        <OceanBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* crane + cables (surface) */}
          {!bottom || t >= T.haul ? <CraneArm p={PULLEY} /> : null}
          {!bottom ? (
            <g>
              <Cable x1={PULLEY[0]} y1={PULLEY[1] + 40} x2={PULLEY[0] + swingA * 2} y2={blockY - 70} />
              <HookBlock x={PULLEY[0] + swingA * 3} y={blockY} />
              {!snapped ? (
                <g>
                  <Cable x1={PULLEY[0] - 20} y1={blockY + 2} x2={eLx} y2={eLy} sag={twang} w={7} />
                  <Cable x1={PULLEY[0] + 20} y1={blockY + 2} x2={eRx} y2={eRy} sag={-twang} w={7} />
                </g>
              ) : (
                <g>
                  <Cable x1={PULLEY[0] - 20 + swingA * 3} y1={blockY + 2} x2={eLx * 0.4 + swingA * 6} y2={endY(eLy)} sag={-40 * Math.sin(8 * t)} />
                  <Cable x1={PULLEY[0] + 20 + swingA * 3} y1={blockY + 2} x2={eRx * 0.4 + swingA * 6} y2={endY(eRy)} sag={40 * Math.sin(8 * t)} />
                </g>
              )}
            </g>
          ) : null}
          {/* the hook that comes down on the bottom and hauls the sub up */}
          {haul ? (
            <g>
              <Cable x1={0} y1={t < T.haul ? hookY - 4000 : PULLEY[1] + 40} x2={0} y2={hookY - 70} />
              <HookBlock x={0} y={hookY} />
            </g>
          ) : null}
          {/* sea-floor dressing: a starfish beside the sub */}
          <g transform={`translate(380 ${FLOOR + 4}) rotate(-12)`}>
            <path d="M 0 -46 L 13 -14 L 46 -12 L 20 9 L 29 42 L 0 23 L -29 42 L -20 9 L -46 -12 L -13 -14 Z" fill="#F08A5D" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <Eye x={-9} y={-4} r={6} open={1} brow={NaN} look={[-0.5, -0.5]} />
            <Eye x={9} y={-4} r={6} open={1} brow={NaN} look={[-0.5, -0.5]} />
          </g>
          {/* the sub */}
          <g transform={`translate(${sub.x} ${sub.y}) rotate(${sub.rot})`}>
            <SubBody t={t}>
              <HatchGuy t={t} />
              {sw.mode === 'peek' || sw.mode === 'fly' ? (
                <Sandwich x={sw.x} y={sw.y} w={SW_W} mood={sw.mood} look={sw.look} rot={sw.rot} id="p1" />
              ) : null}
              {bottom && t < 9.5 ? (
                // on the floor: the sandwich peeks out, sleepy; it ducks when the hook comes
                <Sandwich x={HATCH_X + 4} y={SAIL_TOP + 190 - 130 * (1 - easeInCubic(prog(t, 8.9, 9.1)))} w={SW_W} mood={t > 8.9 ? 'scared' : 'sleepy'} look={t > 8.75 ? [0, -0.9] : [0.3, 0.2]} id="p2" wet={0.6} />
              ) : null}
            </SubBody>
            {sw.mode === 'top' && !bottom ? <Sandwich x={sw.x} y={sw.y} w={SW_W} mood={sw.mood} look={sw.look} id="top" /> : null}
            {/* sweat drops: after 'bottom of the sea' and on "doesn't" */}
            <SweatDrop x={SW_X + 72} y={SAIL_TOP - 118 + 40 * prog(t, T.sea + 0.15, 3.1)} r={13} s={popOut(t, T.sea + 0.15, 3.1, 0.2)} rot={10} />
            <SweatDrop x={HATCH_X + 76} y={SAIL_TOP - 40 + 30 * prog(t, T.doesnt, 7.4)} r={13} s={popOut(t, T.doesnt, 7.36, 0.2)} rot={10} />
            {/* seaweed on the sail after 10 months */}
            {bottom
              ? [-170, 160].map((x, i) => (
                  <path
                    key={i}
                    d={`M ${x} ${SAIL_TOP + 4} Q ${x + 20 * Math.sin(2 * t + i)} ${SAIL_TOP - 50} ${x - 10} ${SAIL_TOP - 100} Q ${x + 25 * Math.sin(2 * t + i + 1)} ${SAIL_TOP - 140} ${x + 6} ${SAIL_TOP - 175}`}
                    fill="none"
                    stroke="#3E8E41"
                    strokeWidth={14}
                    strokeLinecap="round"
                  />
                ))
              : null}
          </g>
          {/* the sandwich's dotted road to the bottom: a bold dashed arrow into the dark */}
          {t > T.bottom - 0.1 && t < 3.2 ? (
            (() => {
              const L = 2050 * easeOutCubic(prog(t, T.bottom - 0.1, T.sea + 0.15));
              const y0 = HANG_Y + HRY + 60;
              const o = 1 - prog(t, 2.95, 3.2);
              return (
                <g opacity={o}>
                  <line x1={SW_X} y1={y0} x2={SW_X} y2={y0 + L} stroke={INK} strokeWidth={46} strokeDasharray="70 50" strokeLinecap="round" />
                  <line x1={SW_X} y1={y0} x2={SW_X} y2={y0 + L} stroke="#fff" strokeWidth={30} strokeDasharray="70 50" strokeLinecap="round" />
                  {L > 300 ? (
                    <g transform={`translate(${SW_X} ${y0 + L + 40})`}>
                      <path d="M -120 -110 L 0 20 L 120 -110" fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M -120 -110 L 0 20 L 120 -110" fill="none" stroke="#fff" strokeWidth={32} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ) : null}
                </g>
              );
            })()
          ) : null}
          {/* fish crossing the deep water during the reveal */}
          {t > 1.2 && t < 3.3
            ? [
                [-1300, 900, 1, 1.6, 0],
                [1300, 1500, -1, 1.9, 0.3],
                [-1300, 2100, 1, 1.4, 0.6],
              ].map(([x0, y, dir, s, d], i) => {
                const u = prog(t, 1.2 + d, 3.3);
                return <Fish key={i} x={x0 + dir * 2400 * u} y={y + 30 * Math.sin(3 * t + i)} s={s} dir={dir as 1 | -1} t={t} look={[0.6, 0.6]} />;
              })
            : null}
          {/* crew */}
          <Jumpers t={t} sub={sub} />
          {/* fish that lives in the hatch now (bottom) */}
          {fishOut ? (
            (() => {
              const u = prog(t, 8.25, 9.06);
              const [hx, hy] = subLocal(sub, HATCH_X, SAIL_TOP);
              const x = hx + 40 + 420 * Math.sin(Math.PI * 0.9 * u) - 380 * u;
              const y = hy - 60 - 200 * Math.sin(Math.PI * u);
              return <Fish x={x} y={y} s={1.1} dir={u < 0.5 ? 1 : -1} t={t} look={[0.3, 0.5]} />;
            })()
          ) : null}
          {/* the fish flops out after the haul */}
          {t > 9.6 && t < 10.1 ? (
            (() => {
              const [hx, hy] = subLocal(sub, HATCH_X, SAIL_TOP);
              const x = hx + 260 * flopU;
              const y = hy - 60 - 260 * Math.sin(Math.PI * Math.min(1, flopU * 1.2)) + 900 * flopU * flopU;
              return <Fish x={x} y={y} s={1.1} t={t} rot={300 * flopU} flop={1} look={[-0.3, -0.3]} />;
            })()
          ) : null}
          <Bubbles t={t} t0={7.2} t1={C_BOTTOM} x={HATCH_X} y={sub.y + SAIL_TOP} n={14} spread={140} seed={11} rise={700} />
          <Bubbles t={t} t0={T.haul} t1={9.5} x={0} y={sub.y + 200} n={14} spread={300} seed={31} rise={900} />
          <WaterFront t={t} />
          <CrewInWater t={t} />
          <Splash t={t} t0={SPLASH_T} x={-330} y={0} size={240} seed={5} dir={-1} />
          <Splash t={t} t0={SPLASH_T + 0.03} x={340} y={0} size={240} seed={9} dir={1} />
          {JUMPERS.map((j, i) => (
            <Splash key={i} t={t} t0={j.land} x={j.x1} y={0} size={120} seed={13 + i * 7} />
          ))}
          <Splash t={t} t0={9.45} x={-300} y={0} size={210} seed={21} dir={-1} />
          <Splash t={t} t0={9.47} x={310} y={0} size={210} seed={25} dir={1} />
          {/* water pouring off the hauled sub */}
          {t > 9.5 && t < C_CLOSE ? (
            <g opacity={1 - prog(t, 9.8, C_CLOSE)}>
              {[-280, -120, 60, 230].map((dx, i) => {
                const [x, y] = subLocal(sub, dx, hullTop(dx) + 40);
                return <path key={i} d={`M ${x} ${y} q ${10 + i * 4} 160 ${-6} ${-y + 10}`} fill="none" stroke="#BFE8FF" strokeWidth={16 - i * 2} strokeLinecap="round" opacity={0.85} />;
              })}
            </g>
          ) : null}
        </FullSvg>
      </World>
      {/* whip speed lines (screen space) */}
      {t > T.haul && t < 9.55 ? <SpeedLines t={t} /> : null}
      {/* 10 MONTHS LATER tag */}
      {tagS > 0.001 ? (
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          <Txt x={540} y={300} size={150} s={tagS} text="10 MONTHS" fill={YEL} rot={-4} sw={0.2} />
          <Txt x={540} y={455} size={150} s={tagS} text="LATER" rot={-4} sw={0.2} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
const SpeedLines: React.FC<{t: number}> = ({t}) => (
  <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
    {Array.from({length: 16}, (_, i) => {
      const x = 40 + 1000 * rnd(i + 3);
      const y = ((t * 5200 + i * 397) % 2600) - 340;
      return <line key={i} x1={x} x2={x} y1={y} y2={y + 260 + 140 * rnd(i)} stroke="#fff" strokeWidth={8 + 6 * rnd(i + 9)} strokeLinecap="round" opacity={0.55} />;
    })}
  </svg>
);

// ======================================================================================================
// SHOT 4 - close on the hatch: the bearded pilot on the hull, the soggy sandwich goes FRESH, a thermometer
// ======================================================================================================
const CLOSE_KEYS: CamKey[] = [
  {t: C_CLOSE, x: 168, y: HANG_Y - 300, k: 1.74},
  {t: T.cold - 0.05, x: 160, y: HANG_Y - 306, k: 1.84},
  {t: T.cold + 0.4, x: 110, y: HANG_Y - 318, k: 1.7, ease: 'out'},
  {t: C_LAB, x: 110, y: HANG_Y - 320, k: 1.76},
];
const CloseScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camIn, cover}) => {
  const c = camIn ?? camAt(t, CLOSE_KEYS);
  const hit = (t0: number, a: number, d = 8) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(T.fresh, 4));
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const sub: SubPose = {x: 0, y: HANG_Y + 4 * Math.sin(2 * Math.PI * 0.4 * t), rot: 1 * Math.sin(2 * Math.PI * 0.3 * t)};
  const fresh = t >= T.fresh;
  const pn = t < T.cold ? 'p_shock' : 'p_point';
  const sq = squashSwap(t, T.cold);
  const r = 60;
  const [fx, fy] = [335, hullTop(335) + 2];
  const mir = pn === 'p_point';
  const [hx, hy] = headOf(pn, fx, fy, r, mir);
  const hopU = prog(t, T.fresh, T.fresh + 0.45);
  const hop = fresh ? -60 * Math.sin(Math.PI * hopU) : 0;
  const swS: [number, number] = fresh ? [1 - 0.06 * spring(t - T.fresh, 3, 6), 1 + 0.08 * spring(t - T.fresh, 3, 6)] : [1.05, 0.92];
  const wet = 1 - easeOutCubic(prog(t, T.fresh, T.fresh + 0.5));
  const shiver = t > T.cold + 0.15 ? 3 * Math.sin(2 * Math.PI * 22 * t) : 0;
  const sparkle = t > T.fresh ? popOut(t, T.fresh, T.fresh + 0.9, 0.2) : 0;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} blur={2.6}>
        <OceanBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          <CraneArm p={PULLEY} />
          <Cable x1={0} y1={PULLEY[1] + 40} x2={0} y2={sub.y + SAIL_TOP - 26} />
          <g transform={`translate(${sub.x} ${sub.y}) rotate(${sub.rot})`}>
            <SubBody t={t}>
              {/* the thermometer rises out of the hatch on "Cold" */}
              <Thermo x={HATCH_X} y={SAIL_TOP + 250 - 300 * easeOutBack(prog(t, T.cold, T.cold + 0.35), 1.6)} h={230} s={t > T.cold ? 1 : 0} level={0.15} flake={popOut(t, T.cold + 0.2, 99, 0.3)} />
            </SubBody>
            {/* drips off the hull */}
            {[-260, -40, 210].map((dx, i) => {
              const ph = ((t * 1.3 + i * 0.37) % 1) * 1;
              return <ellipse key={i} cx={dx} cy={hullTop(dx) + HRY * 1.6 + 300 * ph} rx={7} ry={11} fill="#BFE8FF" stroke={INK} strokeWidth={3} opacity={1 - ph} />;
            })}
            <g transform={`translate(${shiver} 0)`}>
              <Sandwich x={SW_X} y={SAIL_TOP + hop} w={SW_W} sx={swS[0]} sy={swS[1]} mood={fresh ? (t > T.cold + 0.1 ? 'worried' : 'grin') : 'closed'} look={t > T.cold ? [-0.9, -0.2] : [0, 0]} wet={wet} id="cl" />
            </g>
            {/* drips falling off the soggy sandwich */}
            {!fresh
              ? [0, 1, 2].map((i) => {
                  const ph = (t * 1.6 + i * 0.33) % 1;
                  return <ellipse key={i} cx={SW_X - 50 + 50 * i} cy={SAIL_TOP + 10 + 120 * ph} rx={6} ry={9} fill="#BFE8FF" stroke={INK} strokeWidth={3} opacity={1 - ph} />;
                })
              : null}
            {/* sparkle on "fresh" */}
            {sparkle > 0.001
              ? [
                  [SW_X + 95, SAIL_TOP - 140, 1],
                  [SW_X - 90, SAIL_TOP - 110, 0.7],
                  [SW_X + 30, SAIL_TOP - 190, 0.55],
                ].map(([x, y, s], i) => (
                  <path
                    key={i}
                    transform={`translate(${x} ${y}) scale(${sparkle * s}) rotate(${40 * t})`}
                    d="M 0 -40 Q 6 -6 40 0 Q 6 6 0 40 Q -6 6 -40 0 Q -6 -6 0 -40 Z"
                    fill={YEL}
                    stroke={INK}
                    strokeWidth={5}
                  />
                ))
              : null}
            {/* the pilot (10 months of beard) standing on the hull */}
            <g transform={`translate(${fx} ${fy}) scale(${sq[0]} ${sq[1] * breathe(t)}) translate(${-fx} ${-fy})`}>
              <G n={pn} x={fx} y={fy} r={r} mir={mir} />
              <Beard n={pn} hx={hx} hy={hy} r={r} mir={mir} />
            </g>
          </g>
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 5 - THE LAB: a fridge at the same cold; germs pop up and eat a twin sandwich, x100 faster
// ======================================================================================================
const PL = 1.4;
const LAB_W = 1024 * PL;
const LAB_H = 1536 * PL;
const LAB_X0 = -LAB_W / 2;
const FR_S = 0.4;
const FR_W = 693 * FR_S;
const FR_H = 1399 * FR_S;
const FR_X = 230; // centre
const FR_BOT = 1330;
const FR_TOP = FR_BOT - FR_H + 12 * FR_S;
const SCI_X = -250;
const SCI_FEET = 1470;
const LAB_KEYS: CamKey[] = [
  {t: C_LAB, x: 10, y: 880, k: 1.05},
  {t: T.cold2, x: 40, y: 900, k: 1.12},
  {t: T.germs + 0.15, x: FR_X - 10, y: 1010, k: 1.85, ease: 'io'},
  {t: T.hundred - 0.05, x: FR_X - 10, y: 1010, k: 1.95},
  {t: T.times + 0.35, x: 30, y: 930, k: 1.18, ease: 'io'},
  {t: C_DEEP, x: 30, y: 930, k: 1.22},
];
const GERMS: [number, number, number, number][] = [
  // dx from the sandwich centre, dy from its bottom, radius, appear delay
  [-70, -100, 20, 0],
  [62, -96, 18, 0.07],
  [-10, -132, 17, 0.14],
  [92, -40, 16, 0.2],
  [-96, -36, 17, 0.26],
  [30, -12, 15, 0.3],
  [-40, -70, 14, 0.34],
  [70, -130, 13, 0.38],
];
const LabScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, LAB_KEYS);
  const hit = (t0: number, a: number, d = 8) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(T.hundred, 6));
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const blur = c.k > 1.45 ? clamp((c.k - 1.45) / 0.3) * 3 : 0;
  const doorU = prog(t, T.fridge, T.fridge + 0.3);
  const open = t >= T.fridge + 0.15;
  const sciN = t < T.hundred + 0.3 ? 's_nerd' : 's_shock';
  const sq = squashSwap(t, T.hundred + 0.3);
  const germT = t - T.germs;
  const speed = t < T.hundred ? 0.25 : 1;
  const bites = clamp((t - T.eat) / 3.2) * 0.35 + clamp((t - T.hundred) / 0.9) * 0.65;
  const mold = clamp((t - T.hundred - 0.2) / 0.8);
  const swX = FR_X;
  const swY = FR_TOP + FR_H * 0.56;
  const badge = popOut(t, T.hundred, 99, 0.3);
  const ff = t > T.hundred ? 1 : 0;
  return (
    <AbsoluteFill style={{background: SPR.bg_lab.cols.wall}}>
      <World cam={cam} blur={blur}>
        <FullSvg>
          <rect x={-9000} y={-9000} width={18000} height={9000 + 4} fill={SPR.bg_lab.cols.wall} />
          <rect x={-9000} y={0} width={9000 + LAB_X0 + 2} height={LAB_H} fill={SPR.bg_lab.cols.wall} />
          <rect x={-LAB_X0 - 2} y={0} width={9000} height={LAB_H} fill={SPR.bg_lab.cols.wall} />
          <rect x={-9000} y={1183} width={18000} height={6000} fill={SPR.bg_lab.cols.floor} />
          <SImg key="bgl" href={F('bg_lab')} x={LAB_X0} y={0} width={LAB_W} height={LAB_H} preserveAspectRatio="none" />
        </FullSvg>
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* contact shadows */}
          <ellipse cx={FR_X} cy={FR_BOT} rx={FR_W * 0.55} ry={18} fill="rgba(72,54,42,0.26)" />
          <ellipse cx={SCI_X} cy={SCI_FEET} rx={110} ry={16} fill="rgba(72,54,42,0.26)" />
          {/* the fridge: sprite while closed (mirrored, hinge on the right), code when open */}
          {!open ? (
            <g transform={`translate(${FR_X + FR_W / 2} 0) scale(${-Math.max(0.02, 1 - doorU * 2)} 1)`}>
              <SImg key="fr" href={F('fridge')} x={0} y={FR_TOP - 12 * FR_S} width={FR_W} height={FR_H} />
            </g>
          ) : (
            <OpenFridge t={t} u={doorU}>
              <Thermo x={FR_X - 70} y={FR_TOP + FR_H * 0.33} h={120} s={popOut(t, T.that, 99, 0.3)} level={0.16} flake={popOut(t, T.cold2, 99, 0.3)} />
              <Sandwich x={swX} y={swY} w={128} mood={t < T.germs ? 'happy' : t < T.hundred ? 'worried' : 'squeeze'} look={t < T.germs ? [0, 0] : [0.5, -0.5]} bites={bites} mold={mold} id="fr" />
              {GERMS.map(([dx, dy, r, d], i) => {
                const s = popOut(t, T.germs + d, 99, 0.25);
                const jx = 6 * Math.sin(2 * Math.PI * (1 + 4 * ff) * t + i);
                const jy = 5 * Math.cos(2 * Math.PI * (1.3 + 4 * ff) * t + i * 2);
                return <Germ key={i} x={swX + dx + jx} y={swY + dy + jy} r={r} t={t} ph={i * 1.3} chomp={germT > d + 0.2 ? speed : 0} s={s} mir={dx > 0} />;
              })}
              {/* crumbs fly while they eat */}
              {t > T.eat
                ? Array.from({length: 10}, (_, i) => {
                    const ph = ((t - T.eat) * (1.4 + 2.6 * ff) + i * 0.1) % 1;
                    const a = rnd(i + 3) * Math.PI * 2;
                    return <rect key={i} x={swX + Math.cos(a) * 90 * ph - 5} y={swY - 70 + Math.sin(a) * 60 * ph + 80 * ph * ph} width={10} height={9} fill={CRUST} stroke={INK} strokeWidth={2.5} opacity={1 - ph} />;
                  })
                : null}
            </OpenFridge>
          )}
          {/* the scientist */}
          <g transform={`translate(${SCI_X} ${SCI_FEET}) scale(${sq[0]} ${sq[1] * breathe(t)}) translate(${-SCI_X} ${-SCI_FEET})`}>
            <G n={sciN} x={SCI_X} y={SCI_FEET} r={sciN === 's_nerd' ? 92 : 96} />
          </g>
        </FullSvg>
      </World>
      {badge > 0.001 ? (
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          <g transform={`translate(800 360) rotate(${8 + 4 * Math.sin(8 * t)}) scale(${badge})`}>
            <polygon
              points={Array.from({length: 24}, (_, i) => {
                const a = (i / 24) * Math.PI * 2;
                const rr = i % 2 ? 150 : 190;
                return `${rr * Math.cos(a)},${rr * Math.sin(a)}`;
              }).join(' ')}
              fill={YEL}
              stroke={INK}
              strokeWidth={10}
              strokeLinejoin="round"
            />
            <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill="#fff" stroke={INK} strokeWidth={20} paintOrder="stroke">
              ×100
            </text>
          </g>
          <g transform={`translate(800 600) scale(${badge})`}>
            {[0, 1].map((i) => (
              <path key={i} d={`M ${-70 + i * 70} -50 L ${i * 70} 0 L ${-70 + i * 70} 50 Z`} fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" transform={`translate(${12 * Math.sin(20 * t + i)} 0)`} />
            ))}
          </g>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
const OpenFridge: React.FC<{t: number; u: number; children: React.ReactNode}> = ({u, children}) => {
  const x0 = FR_X - FR_W / 2;
  const y0 = FR_TOP;
  const w = FR_W;
  const h = FR_H - 46;
  const doorW = w * 0.42 * easeOutBack(clamp((u - 0.5) * 2), 1.6);
  return (
    <g>
      {/* cabinet */}
      <rect x={x0} y={y0} width={w} height={h} rx={28} fill="#F4F4F2" stroke={INK} strokeWidth={6} />
      <rect x={x0 + 18} y={y0 + 18} width={w - 36} height={h - 36} rx={16} fill="#E4F4FB" stroke={INK} strokeWidth={4} />
      <ellipse cx={x0 + w / 2} cy={y0 + 60} rx={w * 0.34} ry={40} fill="#FFFBD8" opacity={0.85} />
      {[0.38, 0.62].map((f, i) => (
        <g key={i}>
          <rect x={x0 + 18} y={y0 + h * f} width={w - 36} height={9} fill="#fff" stroke={INK} strokeWidth={3.5} />
        </g>
      ))}
      <rect x={x0 + 26} y={y0 + h * 0.8} width={w - 52} height={h * 0.14} rx={8} fill="#CFE6EF" stroke={INK} strokeWidth={3.5} />
      {children}
      {/* the open door swings toward us on the right */}
      <path d={`M ${x0 + w} ${y0 + 6} L ${x0 + w + doorW} ${y0 - 26} L ${x0 + w + doorW} ${y0 + h + 26} L ${x0 + w} ${y0 + h - 6} Z`} fill="#F4F4F2" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {doorW > 20 ? (
        <g>
          {[0.25, 0.55, 0.8].map((f, i) => (
            <path key={i} d={`M ${x0 + w + 6} ${y0 + h * f} L ${x0 + w + doorW - 8} ${y0 + h * f - 12} L ${x0 + w + doorW - 8} ${y0 + h * f + 22} L ${x0 + w + 6} ${y0 + h * f + 30} Z`} fill="#E4F4FB" stroke={INK} strokeWidth={3.5} />
          ))}
        </g>
      ) : null}
      {/* feet */}
      {[0.18, 0.82].map((f, i) => (
        <rect key={i} x={x0 + w * f - 14} y={y0 + h - 2} width={28} height={40} rx={8} fill="#BDBDBD" stroke={INK} strokeWidth={4} />
      ))}
    </g>
  );
};

// ======================================================================================================
// SHOT 6 - back on the bottom: a cutaway of the cabin, pressure arrows squash the germs, they slow down and sleep
// ======================================================================================================
const DEEP_KEYS: CamKey[] = [
  {t: C_DEEP, x: 20, y: FLOOR - 400, k: 1.3},
  {t: T.pressure + 0.25, x: 25, y: FLOOR - 330, k: 1.42},
  {t: T.slows + 0.1, x: 40, y: FLOOR - 175, k: 2.05, ease: 'io'},
  {t: C_END, x: 40, y: FLOOR - 170, k: 2.12},
];
const ARROWS: [number, number][] = [
  [-90, 345],
  [-123, 372],
  [-57, 372],
  [-152, 420],
  [-28, 420],
];
const DeepScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, DEEP_KEYS);
  const pulse = t > T.crushing ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.4 * (t - T.crushing)) : 0;
  const sh = shake(t, t > T.crushing && t < T.slows ? 3 * pulse : 0);
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const sub: SubPose = {x: 0, y: FLOOR - 150, rot: -5};
  const cut = easeOutBack(prog(t, C_DEEP + 0.1, C_DEEP + 0.45), 1.6);
  const arrowsS = popOut(t, T.crushing, 99, 0.3);
  const squash = clamp(prog(t, T.pressure - 0.1, T.pressure + 0.15) - 0.45 * prog(t, T.slows, T.slows + 0.3));
  const slow = t > T.slows ? 0.04 : 0.5;
  const sleep = easeInOutCubic(prog(t, T.even, T.more + 0.3));
  const hull = 1 - 0.02 * pulse * (t < T.slows + 0.5 ? 1 : 0);
  const zzz = t > T.more ? 1 : 0;
  return (
    <AbsoluteFill style={{background: '#122a5a'}}>
      <World cam={cam} blur={c.k > 1.15 ? 3 : 1.5}>
        <OceanBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          <g transform={`translate(${sub.x} ${sub.y}) rotate(${sub.rot}) scale(${hull} ${1 / hull})`}>
            <SubBody
              t={0}
              cut={cut}
              inside={
                <g>
                  <Sandwich x={0} y={4} w={128} mood={sleep > 0.5 ? 'closed' : 'happy'} look={[0, -0.6]} wet={0.5} id="dp" />
                  {[
                    [-62, -86, 27],
                    [60, -90, 26],
                    [0, -122, 24],
                    [92, -26, 22],
                  ].map(([dx, dy, r], i) => (
                    <Germ key={i} x={dx} y={dy + 4} r={r} t={t * slow * 2 + i} ph={i} chomp={sleep > 0.5 ? 0 : 0.02} squash={squash} sleep={sleep} s={1} mir={dx > 0} />
                  ))}
                </g>
              }
            />
          </g>
          <WaterFront t={t} />
          {/* pressure arrows (the whole sea pressing in) */}
          {ARROWS.map(([ang, d], i) => {
            const push = 40 * pulse;
            const cx = sub.x + 30;
            const cy = sub.y - 70;
            const a = (ang * Math.PI) / 180;
            const x = cx + Math.cos(a) * (d - push);
            const y = cy + Math.sin(a) * (d - push);
            return <Arrow key={i} x={x} y={y} ang={ang + 180} len={175} s={arrowsS * (i === 0 ? 1.15 : 1)} />;
          })}
          {/* Zzz from the sleeping germs */}
          {zzz
            ? [0, 1, 2].map((i) => {
                const u = ((t - T.more) * 0.8 + i * 0.33) % 1;
                return <Txt key={i} x={sub.x + 60 + 120 * u + i * 10} y={sub.y - 120 - 260 * u} size={60 + 30 * i} s={Math.sin(Math.PI * u)} text="Z" fill="#fff" sw={0.22} />;
              })
            : null}
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 7 - the stern: the scientists lower a lunchbox with a face into the sea, on purpose
// ======================================================================================================
const DECK = -240;
const STERN = -330;
const END_PULLEY: [number, number] = [-110, -930];
const END_KEYS: CamKey[] = [
  {t: C_END, x: -360, y: -520, k: 1.5},
  {t: T.sinking, x: -350, y: -500, k: 1.55},
  {t: T.purpose + 0.3, x: -330, y: -430, k: 1.52, ease: 'io'},
  {t: DURATION, x: -200, y: 150, k: 1.55, ease: 'io'},
];
// the lunchbox handle-top y: hangs, is lowered on "start sinking", touches the water on "lunch", then sinks steadily
const LB_ENTRY = -175; // handle y when the box bottom meets the water
const lunchY = (t: number) => {
  const y0 = -560 + 12 * Math.sin(2 * Math.PI * 0.5 * t);
  if (t < T.start) return y0;
  if (t < T.lunch) return lerp(-560 + 12 * Math.sin(2 * Math.PI * 0.5 * T.start), LB_ENTRY, easeInCubic(prog(t, T.start, T.lunch)) * 0.55 + 0.45 * prog(t, T.start, T.lunch));
  return LB_ENTRY + 420 * (t - T.lunch);
};
const EndScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, END_KEYS);
  const cam = c;
  const ly = lunchY(t);
  const lx = END_PULLEY[0] + 10 * Math.sin(2 * Math.PI * 0.45 * t) * (t < T.lunch ? 1 : 0.3);
  const sciN = t < T.purpose ? 's_nerd' : 's_smug';
  const sq = squashSwap(t, T.purpose);
  const pilotSq = squashSwap(t, T.scientists);
  const check = popOut(t, T.purpose + 0.05, 99, 0.25);
  const nerd = S('s_nerd');
  const nr = 62;
  const ns = nr / nerd.hd[2];
  const sciX = -500;
  const pilotX = -655;
  const [phx, phy] = headOf('p_cheer', pilotX, DECK, 60);
  const under = ly > -60;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} blur={1.2}>
        <OceanBack t={t} dx={-640} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* crane on the stern */}
          <rect x={STERN - 120} y={-980} width={60} height={760} fill={CRANE} stroke={INK} strokeWidth={OW} />
          <rect x={STERN - 120} y={-980} width={18} height={760} fill={CRANE_SH} />
          <g transform={`rotate(-4 ${STERN - 90} -960)`}>
            <rect x={STERN - 140} y={-990} width={END_PULLEY[0] - STERN + 190} height={56} fill={CRANE} stroke={INK} strokeWidth={OW} />
            <rect x={STERN - 140} y={-950} width={END_PULLEY[0] - STERN + 190} height={16} fill={CRANE_SH} />
          </g>
          <circle cx={END_PULLEY[0]} cy={END_PULLEY[1]} r={34} fill={STEEL} stroke={INK} strokeWidth={OW} />
          <circle cx={END_PULLEY[0]} cy={END_PULLEY[1]} r={10} fill={STEEL_SH} stroke={INK} strokeWidth={3} />
          {/* rope + lunchbox */}
          <Cable x1={END_PULLEY[0] + 30} y1={END_PULLEY[1]} x2={lx} y2={ly} w={6} />
          <Lunchbox x={lx} y={ly} w={150} t={t} mood={t > T.on ? 'down' : t > T.lunch + 0.3 ? 'wink' : 'happy'} rot={3 * Math.sin(2 * Math.PI * 0.5 * t)} />
          <Bubbles t={t} t0={T.lunch + 0.1} t1={DURATION} x={lx} y={ly + 40} n={12} spread={90} seed={41} rise={500} />
          {/* the people on deck (behind the rail) */}
          <g transform={`translate(${pilotX} ${DECK}) scale(${pilotSq[0]} ${pilotSq[1] * breathe(t, 1)}) translate(${-pilotX} ${-DECK})`}>
            <G n="p_cheer" x={pilotX} y={DECK} r={60} />
            <Beard n="p_cheer" hx={phx} hy={phy} r={60} />
          </g>
          <g transform={`translate(${sciX} ${DECK}) scale(${sq[0]} ${sq[1] * breathe(t)}) translate(${-sciX} ${-DECK})`}>
            <G n={sciN} x={sciX} y={DECK} r={sciN === 's_nerd' ? nr : 58} />
          </g>
          {/* green check on the clipboard ("on purpose") */}
          {check > 0.001 ? (
            <g transform={`translate(${sciX + (300 - nerd.feet[0]) * ns} ${DECK + (640 - nerd.feet[1]) * ns}) scale(${check})`}>
              <path d="M -40 0 L -10 30 L 46 -36" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M -40 0 L -10 30 L 46 -36" fill="none" stroke="#46C64B" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null}
          {/* the stern: hull + rail (code) */}
          <path d={`M -4000 ${DECK} L ${STERN} ${DECK} L ${STERN - 18} 90 L -4000 90 Z`} fill={HULL} stroke={INK} strokeWidth={OW} />
          <path d={`M -4000 ${DECK + 120} L ${STERN - 7} ${DECK + 120} L ${STERN - 10} ${DECK + 160} L -4000 ${DECK + 160} Z`} fill="#1E3F73" />
          <path d={`M -4000 -30 L ${STERN - 14} -30 L ${STERN - 18} 90 L -4000 90 Z`} fill="#C8322B" />
          <path d={`M -4000 ${DECK} L ${STERN} ${DECK} L ${STERN - 18} 90 L -4000 90`} fill="none" stroke={INK} strokeWidth={OW} />
          {Array.from({length: 14}, (_, i) => {
            const x = STERN - 20 - i * 110;
            return <rect key={i} x={x - 7} y={DECK - 96} width={14} height={96} fill="#fff" stroke={INK} strokeWidth={3.5} />;
          })}
          <rect x={-4000} y={DECK - 106} width={4000 + STERN} height={18} rx={9} fill="#fff" stroke={INK} strokeWidth={OW} />
          <rect x={-4000} y={DECK - 52} width={4000 + STERN} height={10} fill="#fff" stroke={INK} strokeWidth={3} />
          <WaterFront t={t} />
          <Splash t={t} t0={T.lunch - 0.04} x={lx} y={0} size={150} seed={51} />
          {/* the dotted road down again (loops to frame 0) */}
          {under && t > T.on ? (
            <g opacity={popOut(t, T.on + 0.1, 99, 0.3)}>
              <line x1={lx} y1={ly + 220} x2={lx} y2={ly + 220 + 1200 * easeOutCubic(prog(t, T.on + 0.1, DURATION))} stroke="#fff" strokeWidth={18} strokeDasharray="36 34" strokeLinecap="round" />
            </g>
          ) : null}
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND (all ElevenLabs: new cues from this video + reused sfx-library files)
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'beach_bed', at: 0.0, db: -31, keys: [[0, -31], [7.2, -31], [7.9, -60]]},
  {f: 'squeak', at: 0.38, db: -20},
  {f: 'zoomaway', at: T.bottom - 0.05, db: -22},
  {f: 'gulp', at: T.sea + 0.2, db: -17},
  {f: 'cable_snap', at: T.snap - 0.43, db: -11},
  {f: 'whoosh', at: T.snap + 0.04, db: -26},
  {f: 'sub_splash', at: SPLASH_T - 0.03, db: -9},
  {f: 'boing', at: SPLASH_T + 0.04, db: -24},
  {f: 'pop', at: SPLASH_T + 0.36, db: -20},
  {f: 'pour', at: 4.95, db: -27},
  {f: 'whoosh', at: T.jumps - 0.05, db: -27},
  {f: 'splash', at: JUMPERS[0].land - 0.02, db: -17},
  {f: 'splash', at: JUMPERS[1].land - 0.02, db: -19},
  {f: 'splash', at: JUMPERS[2].land - 0.02, db: -20},
  {f: 'gulp', at: T.doesnt + 0.05, db: -15},
  {f: 'bubbles', at: 7.25, db: -18},
  {f: 'whoosh', at: 7.6, db: -24},
  {f: 'flip', at: C_BOTTOM, db: -17},
  {f: 'ticks', at: C_BOTTOM + 0.1, db: -24, dur: 0.85},
  {f: 'deep_bed', at: C_BOTTOM, db: -27, dur: 1.2},
  {f: 'dart', at: 8.3, db: -21},
  {f: 'chain', at: 8.72, db: -21},
  {f: 'pop', at: 9.02, db: -19},
  {f: 'winch', at: T.haul, db: -15},
  {f: 'mud_whoomp', at: T.haul + 0.02, db: -16},
  {f: 'zoomaway', at: T.haul + 0.04, db: -21},
  {f: 'pour', at: 9.47, db: -15},
  {f: 'fish_flop', at: 9.62, db: -15},
  {f: 'splash', at: 10.05, db: -27},
  {f: 'beach_bed', at: 9.45, db: -32, dur: 2.8, keys: [[9.45, -40], [9.8, -32], [12.0, -32], [12.25, -60]]},
  {f: 'twinkle', at: T.fresh, db: -13},
  {f: 'freeze', at: T.cold, db: -21},
  {f: 'chatter', at: T.cold + 0.18, db: -21},
  {f: 'fridge_open', at: T.fridge - 0.08, db: -13},
  {f: 'hum', at: T.fridge + 0.3, db: -33, dur: 3.9},
  {f: 'pop', at: T.that, db: -21},
  {f: 'squeak', at: T.germs + 0.02, db: -20},
  {f: 'squeak', at: T.germs + 0.16, db: -22, rate: 1.2},
  {f: 'squeak', at: T.germs + 0.3, db: -22, rate: 0.9},
  {f: 'munch', at: T.eat, db: -16},
  {f: 'munch', at: T.food + 0.12, db: -17},
  {f: 'germ_feast', at: T.hundred - 0.02, db: -12},
  {f: 'ticks', at: T.hundred, db: -26, dur: 1.2, rate: 1.4},
  {f: 'germ_feast', at: T.faster - 0.05, db: -15},
  {f: 'deep_bed', at: C_DEEP, db: -26, dur: 3.04},
  {f: 'hull_creak', at: T.crushing, db: -13},
  {f: 'squash_down', at: T.pressure + 0.02, db: -16},
  {f: 'hull_creak', at: T.down, db: -19},
  {f: 'snore', at: T.more + 0.05, db: -17},
  {f: 'beach_bed', at: C_END, db: -31, keys: [[C_END, -40], [C_END + 0.3, -31], [22.9, -31], [23.35, -60]]},
  {f: 'rope_creak', at: T.start, db: -19},
  {f: 'winch', at: T.sinking - 0.1, db: -22},
  {f: 'splash', at: T.lunch - 0.04, db: -13},
  {f: 'bubbles', at: T.lunch + 0.15, db: -21},
  {f: 'scribble', at: T.purpose + 0.02, db: -16},
];

export const SunkenLunchShort: React.FC = () => {
  useSLFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < C_CLOSE) scene = <OceanScene t={t} />;
  else if (t < C_LAB) scene = <CloseScene t={t} />;
  else if (t < C_DEEP) scene = <LabScene t={t} />;
  else if (t < C_END) scene = <DeepScene t={t} />;
  else scene = <EndScene t={t} />;
  return (
    <AbsoluteFill style={{background: SKY}}>
      {scene}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('sunken-lunch/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('sunken-lunch/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="sunken-lunch/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export {CloseScene, OceanScene};
