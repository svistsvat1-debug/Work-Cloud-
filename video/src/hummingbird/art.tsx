// Every character, prop and set piece of the Short, drawn as flat SVG cut-outs:
// thick even black outlines, flat fills, one soft shade. All sizes are world px (Z = 1000 layer).
import React from 'react';
import {mix, clamp, lerp} from './anim';

export const INK = '#1d1a22';
export const SW = 7; // outline width
export const FONT = "'InterBlack', 'DejaVu Sans', sans-serif";

// ---------- small helpers ----------
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** circle with bumpy "fluffed feathers" outline */
export const scallop = (cx: number, cy: number, R: number, n: number, bump = 0.12, start = -Math.PI / 2) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    if (i === 0) d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
    else {
      const am = start + ((i - 0.5) / n) * Math.PI * 2;
      d += ` Q ${(cx + R * (1 + bump) * Math.cos(am)).toFixed(1)} ${(cy + R * (1 + bump) * Math.sin(am)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return d + ' Z';
};

/** upper part of an ellipse (an eyelid) closed to fraction f (0 open .. 1 shut) */
const lidPath = (cx: number, cy: number, rx: number, ry: number, f: number) => {
  const y0 = cy - ry + 2 * ry * clamp(f, 0.001, 0.999);
  const hw = rx * Math.sqrt(Math.max(0, 1 - ((y0 - cy) / ry) ** 2));
  return `M ${cx - hw} ${y0} A ${rx} ${ry} 0 ${f > 0.5 ? 1 : 0} 1 ${cx + hw} ${y0} Z`;
};

export type Face = 'neutral' | 'worried' | 'smug' | 'surprised' | 'happy' | 'sleep' | 'squeeze';

/** one cartoon eye + brow. skin = colour of the lid */
export const Eye: React.FC<{
  x: number; y: number; face: Face; blink?: number; skin: string; size?: number; look?: [number, number]; mirror?: boolean;
}> = ({x, y, face, blink = 0, skin, size = 1, look = [0, 0], mirror = false}) => {
  const rx = 12 * size, ry = 15 * size;
  const m = mirror ? -1 : 1;
  const brow = {
    neutral: {dy: -30, tilt: 0, curve: -8},
    worried: {dy: -36, tilt: -9, curve: -10},
    smug: {dy: -22, tilt: 4, curve: -3},
    surprised: {dy: -42, tilt: 0, curve: -12},
    happy: {dy: -34, tilt: 0, curve: -10},
    sleep: {dy: -26, tilt: 0, curve: -4},
    squeeze: {dy: -24, tilt: 8, curve: -2},
  }[face];
  const big = face === 'surprised' ? 1.25 : 1;
  const bw = 17 * size;
  const by = y + brow.dy * size;
  const browD = `M ${x - bw * m} ${by - brow.tilt * size} Q ${x} ${by + brow.curve * size} ${x + bw * m} ${by + brow.tilt * size}`;
  let eye: React.ReactNode;
  if (face === 'happy') eye = <path d={`M ${x - 13 * size} ${y + 4 * size} Q ${x} ${y - 16 * size} ${x + 13 * size} ${y + 4 * size}`} fill="none" stroke={INK} strokeWidth={6 * size} strokeLinecap="round" />;
  else if (face === 'sleep') eye = <path d={`M ${x - 13 * size} ${y - 3 * size} Q ${x} ${y + 12 * size} ${x + 13 * size} ${y - 3 * size}`} fill="none" stroke={INK} strokeWidth={6 * size} strokeLinecap="round" />;
  else if (face === 'squeeze') eye = <path d={`M ${x - 11 * size * m} ${y - 11 * size} L ${x + 9 * size * m} ${y} L ${x - 11 * size * m} ${y + 11 * size}`} fill="none" stroke={INK} strokeWidth={6 * size} strokeLinecap="round" strokeLinejoin="round" />;
  else {
    const f = face === 'smug' ? Math.max(0.5, blink) : blink;
    eye = (
      <g>
        <ellipse cx={x + look[0]} cy={y + look[1]} rx={rx * big} ry={ry * big} fill={INK} />
        <circle cx={x + look[0] + 4 * size} cy={y + look[1] - 6 * size} r={4.2 * size * big} fill="#fff" />
        {f > 0.02 && <path d={lidPath(x + look[0], y + look[1], rx * big + 1.5, ry * big + 1.5, f)} fill={skin} stroke={INK} strokeWidth={4 * size} strokeLinejoin="round" />}
      </g>
    );
  }
  return (
    <g>
      {eye}
      {face !== 'sleep' && <path d={browD} fill="none" stroke={INK} strokeWidth={6.5 * size} strokeLinecap="round" />}
    </g>
  );
};

export const SweatDrop: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -26 C 12 -8 18 2 18 10 C 18 22 9 30 0 30 C -9 30 -18 22 -18 10 C -18 2 -12 -8 0 -26 Z" fill="#8FD3FF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={-6} cy={12} rx={4} ry={7} fill="#fff" />
    </g>
  );

export const Sparkle: React.FC<{x: number; y: number; s: number; color?: string; rot?: number}> = ({x, y, s, color = '#FFF6C9', rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -30 Q 5 -5 30 0 Q 5 5 0 30 Q -5 5 -30 0 Q -5 -5 0 -30 Z" fill={color} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );

// ---------- the hummingbird ----------
export type Pose = 'hover' | 'perch' | 'puff';
export const FEET: Record<Pose, number> = {hover: 0, perch: 98, puff: 128}; // local y of the feet

const C = {
  body: '#4FA35F', shade: '#3C8A4D', belly: '#C4E6A6', head: '#4FA35F', tail: '#6A55D8', tailShade: '#5141B5',
  wing: '#8CC79B', wingBack: '#5E9E6E', beak: '#2B2730', cheek: '#F59AA8',
};
const COLD = {
  body: '#8DB9D4', shade: '#6F9CBC', belly: '#E6F5FB', head: '#8DB9D4', tail: '#8B95E0', tailShade: '#6E78C4',
  wing: '#C3E2EE', wingBack: '#93BCD2', beak: '#43546B', cheek: '#C9D6F2',
};

const WING = 'M 0 0 C 50 -30 62 -150 12 -218 C -30 -170 -38 -62 0 0 Z';
const Wing: React.FC<{x: number; y: number; rot: number; sx?: number; sy?: number; fill: string}> = ({x, y, rot, sx = 1, sy = 1, fill}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
    <path d={WING} fill={fill} stroke={INK} strokeWidth={SW / Math.max(0.6, Math.min(sx, sy))} strokeLinejoin="round" />
    <path d="M 4 -30 C 18 -80 22 -130 10 -180" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
  </g>
);

export const Bird: React.FC<{
  pose: Pose; wing?: number; face?: Face; blink?: number; cold?: number; look?: [number, number];
  iceBeak?: number; snowCap?: number; sweat?: number; frost?: number; t?: number;
}> = ({pose, wing = 0, face = 'neutral', blink = 0, cold = 0, look = [0, 0], iceBeak = 0, snowCap = 0, sweat = 0, frost = 0, t = 0}) => {
  const c = Object.fromEntries(Object.keys(C).map((k) => [k, mix((C as any)[k], (COLD as any)[k], cold)])) as typeof C;

  if (pose === 'puff') {
    const body = scallop(0, 0, 116, 15, 0.13);
    return (
      <g>
        {/* tail behind */}
        {[[-62, 128, 78], [-38, 136, 96], [-84, 116, 60]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={62} ry={18} transform={`rotate(${r} ${x} ${y})`} fill={i === 1 ? c.tail : c.tailShade} stroke={INK} strokeWidth={SW} />
        ))}
        {/* merged outline: ink pass, then colour pass */}
        <path d={body} fill={INK} stroke={INK} strokeWidth={SW * 2} strokeLinejoin="round" />
        <circle cx={20} cy={-108} r={66} fill={INK} stroke={INK} strokeWidth={SW * 2} />
        <path d={body} fill={c.shade} />
        <path d={scallop(9, 6, 104, 15, 0.12)} fill={c.body} />
        <circle cx={20} cy={-108} r={66} fill={c.head} />
        <path d={scallop(26, 34, 66, 10, 0.14)} fill={c.belly} />
        {/* folded wing tucked in the fluff */}
        <Wing x={-38} y={-20} rot={-160} sx={0.62} sy={0.62} fill={c.wingBack} />
        {/* beak pointing at the sky */}
        <path d="M 12 -164 L 58 -356 Q 62 -362 66 -355 L 40 -158 Z" fill={c.beak} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {iceBeak > 0.01 && (
          <g transform={`translate(58 -330) scale(${iceBeak})`}>
            <path d="M -16 40 L 2 -36 Q 6 -42 10 -35 L 18 44 Q 2 54 -16 40 Z" fill="#CFF1FF" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={0.95} />
            <path d="M 2 -20 L -4 28" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
        <ellipse cx={58} cy={-84} rx={15} ry={9} fill={c.cheek} opacity={0.75} />
        <Eye x={52} y={-112} face={face} blink={blink} skin={c.head} look={look} />
        {/* feet gripping the branch */}
        {[-14, 22].map((x, i) => (
          <path key={i} d={`M ${x} 110 L ${x - 2} 130 M ${x - 12} 132 Q ${x - 2} 124 ${x + 10} 132`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ))}
        {snowCap > 0.01 && (
          <g transform={`translate(4 -168) scale(${snowCap})`}>
            <path d={scallop(0, 0, 34, 7, 0.22, Math.PI)} transform="scale(1.25 0.7)" fill="#fff" stroke={INK} strokeWidth={5} />
          </g>
        )}
        {frost > 0.01 &&
          [[-88, -40, 0.9], [96, 18, 0.7], [-30, 92, 0.6], [70, -150, 0.55], [-60, -100, 0.5]].map(([x, y, s], i) => (
            <Sparkle key={i} x={x} y={y} s={s * frost * (0.85 + 0.15 * Math.sin(t * 6 + i * 2))} color="#EFFBFF" rot={i * 20} />
          ))}
        <SweatDrop x={-40} y={-160} s={sweat} />
      </g>
    );
  }

  // hover / perch share the same body
  const hovering = pose === 'hover';
  const phases = [
    {rot: -14, sx: 1, sy: 1},
    {rot: -58, sx: 0.8, sy: 0.95},
    {rot: -100, sx: 0.95, sy: 0.85},
  ];
  const ph = phases[((wing % 3) + 3) % 3];
  return (
    <g>
      {/* far wing behind the body */}
      {hovering ? <Wing x={-20} y={-52} rot={ph.rot + 14} sx={ph.sx * 0.9} sy={ph.sy * 0.9} fill={c.wingBack} /> : null}
      {/* tail */}
      {[[-140, 82, 22], [-128, 100, 40], [-112, 114, 58]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={70} ry={20} transform={`rotate(${r} ${x} ${y})`} fill={i === 1 ? c.tail : c.tailShade} stroke={INK} strokeWidth={SW} />
      ))}
      {/* merged outline of body + head */}
      <ellipse cx={0} cy={0} rx={108} ry={80} transform="rotate(-25)" fill={INK} stroke={INK} strokeWidth={SW * 2} />
      <circle cx={70} cy={-66} r={66} fill={INK} stroke={INK} strokeWidth={SW * 2} />
      <ellipse cx={0} cy={0} rx={108} ry={80} transform="rotate(-25)" fill={c.shade} />
      <ellipse cx={8} cy={7} rx={100} ry={72} transform="rotate(-25 8 7)" fill={c.body} />
      <circle cx={70} cy={-66} r={66} fill={c.head} />
      <ellipse cx={34} cy={26} rx={62} ry={40} transform="rotate(-25 34 26)" fill={c.belly} />
      {/* beak */}
      <path d="M 126 -82 L 308 -92 Q 314 -88 308 -84 L 128 -56 Z" fill={c.beak} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx={100} cy={-44} rx={15} ry={9} fill={c.cheek} opacity={0.75} />
      <Eye x={96} y={-78} face={face} blink={blink} skin={c.head} look={look} />
      {/* near wing */}
      {hovering ? (
        <g>
          <Wing x={-6} y={-46} rot={ph.rot} sx={ph.sx} sy={ph.sy} fill={c.wing} />
          {/* buzz arcs (no motion blur: two thin ink arcs) */}
          <path d="M -150 -150 Q -205 -60 -170 30" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
          <path d="M -120 -205 Q -200 -120 -195 -20" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.3} />
        </g>
      ) : (
        <Wing x={-8} y={-28} rot={-116} sx={0.78} sy={0.78} fill={c.wing} />
      )}
      {!hovering &&
        [6, 34].map((x, i) => (
          <path key={i} d={`M ${x} 70 L ${x - 3} 96 M ${x - 15} 98 Q ${x - 3} 90 ${x + 10} 98`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ))}
      <SweatDrop x={10} y={-140} s={sweat} rot={-15} />
    </g>
  );
};

// ---------- flower with a face (hangs from a twig, opens to the left) ----------
export const Flower: React.FC<{open: number; face: Face; blink?: number; shakeRot?: number}> = ({open, face, blink = 0, shakeRot = 0}) => {
  const petals = [-70, -25, 20, 65, 110, 155, 200];
  return (
    <g transform={`rotate(${shakeRot})`}>
      <path d="M 0 -150 Q 20 -90 0 -40" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M 0 -150 Q 20 -90 0 -40" fill="none" stroke="#5DAE5B" strokeWidth={10} strokeLinecap="round" />
      {/* sepals */}
      <path d="M -30 -46 Q 0 -78 30 -46 Q 0 -30 -30 -46 Z" fill="#5DAE5B" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <g transform="translate(0 20)">
        {petals.map((a, i) => {
          const ang = lerp(90, a - 90, open) ; // closed: all petals point down into a bud
          const len = lerp(62, 74, open);
          return (
            <ellipse key={i} cx={0} cy={len * 0.55} rx={lerp(20, 30, open)} ry={len * 0.62}
              transform={`rotate(${ang - 90})`} fill={i % 2 ? '#E9468C' : '#F2639F'} stroke={INK} strokeWidth={SW} />
          );
        })}
        {open > 0.15 && (
          <g transform={`scale(${clamp((open - 0.15) / 0.5)})`}>
            <circle r={40} fill="#FFD15C" stroke={INK} strokeWidth={SW} />
            <Eye x={-14} y={-4} face={face} blink={blink} skin="#FFD15C" size={0.62} />
            <Eye x={14} y={-4} face={face} blink={blink} skin="#FFD15C" size={0.62} mirror />
            {face === 'squeeze' || face === 'worried' ? (
              <path d="M -10 20 Q 0 12 10 20" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
            ) : (
              <path d="M -10 16 Q 0 26 10 16" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
            )}
          </g>
        )}
      </g>
    </g>
  );
};

// ---------- battery with a face ----------
export const Battery: React.FC<{level: number; face: Face; blink?: number; sweat?: number}> = ({level, face, blink = 0, sweat = 0}) => {
  const col = level > 0.55 ? '#5CCB5F' : level > 0.28 ? '#F6C945' : '#F0564A';
  const bars = 4;
  return (
    <g>
      <rect x={-150} y={-70} width={300} height={140} rx={30} fill="#F4F1EA" stroke={INK} strokeWidth={SW} />
      <rect x={150} y={-30} width={26} height={60} rx={10} fill="#C9C3B8" stroke={INK} strokeWidth={SW} />
      {Array.from({length: bars}).map((_, i) => {
        const f = clamp(level * bars - i);
        return f <= 0 ? null : (
          <rect key={i} x={-128 + i * 66} y={-48} width={56 * f} height={96} rx={10} fill={col} stroke={INK} strokeWidth={4.5} />
        );
      })}
      <g transform="translate(0 4)">
        <ellipse cx={-38} cy={-4} rx={21} ry={24} fill="#fff" stroke={INK} strokeWidth={5} />
        <ellipse cx={38} cy={-4} rx={21} ry={24} fill="#fff" stroke={INK} strokeWidth={5} />
        {face === 'squeeze' ? (
          <>
            <path d="M -50 -16 L -30 -4 L -50 8" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 50 -16 L 30 -4 L 50 8" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <circle cx={-34} cy={-2} r={9} fill={INK} />
            <circle cx={42} cy={-2} r={9} fill={INK} />
            {blink > 0.02 && <path d={lidPath(-38, -4, 23, 26, blink)} fill="#F4F1EA" stroke={INK} strokeWidth={4} />}
            {blink > 0.02 && <path d={lidPath(38, -4, 23, 26, blink)} fill="#F4F1EA" stroke={INK} strokeWidth={4} />}
          </>
        )}
        {face === 'worried' || face === 'squeeze' ? (
          <path d="M -18 44 Q 0 32 18 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ) : (
          <path d="M -18 36 Q 0 50 18 36" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        )}
        <path d={face === 'worried' || face === 'squeeze' ? 'M -62 -44 L -18 -34 M 62 -44 L 18 -34' : 'M -60 -38 Q -40 -48 -18 -40 M 60 -38 Q 40 -48 18 -40'}
          fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" transform={face === 'worried' || face === 'squeeze' ? 'scale(1 -1) translate(0 76)' : undefined} />
      </g>
      <SweatDrop x={162} y={-78} s={sweat} rot={20} />
    </g>
  );
};

// ---------- moon -> sun night bar ----------
export const NightBar: React.FC<{dot: number; stop: number}> = ({dot, stop}) => (
  <g>
    <line x1={-150} y1={0} x2={150} y2={0} stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <line x1={-150} y1={0} x2={150} y2={0} stroke="#3B3F73" strokeWidth={6} strokeLinecap="round" />
    <line x1={-150} y1={0} x2={lerp(-150, 150, dot)} y2={0} stroke="#F6C945" strokeWidth={6} strokeLinecap="round" />
    {/* moon */}
    <g transform="translate(-190 0)">
      <path d="M 10 -30 A 32 32 0 1 0 10 30 A 24 24 0 1 1 10 -30 Z" fill="#FFF1B8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
    {/* sun */}
    <g transform="translate(192 0)">
      {Array.from({length: 8}).map((_, i) => (
        <line key={i} x1={0} y1={-30} x2={0} y2={-42} transform={`rotate(${i * 45})`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ))}
      <circle r={24} fill="#FFC23D" stroke={INK} strokeWidth={5} />
    </g>
    <circle cx={lerp(-150, 150, dot)} cy={0} r={15} fill={stop > 0.5 ? '#F0564A' : '#fff'} stroke={INK} strokeWidth={5} />
  </g>
);

// ---------- thermostat dial ----------
export const Dial: React.FC<{needle: number}> = ({needle}) => {
  // needle 0 = warm (right, red), 1 = cold (left, blue)
  const ang = lerp(55, -55, needle);
  return (
    <g>
      <circle r={86} fill="#F4F1EA" stroke={INK} strokeWidth={SW} />
      <path d="M 0 0 L 0 -70 A 70 70 0 0 1 60.6 -35 Z" fill="#F0564A" />
      <path d="M 0 0 L 0 -70 A 70 70 0 0 0 -60.6 -35 Z" fill="#4AA6F0" />
      <path d="M -60.6 -35 A 70 70 0 0 1 60.6 -35" fill="none" stroke={INK} strokeWidth={5} />
      <circle r={44} fill="#F4F1EA" stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${ang})`}>
        <path d="M -9 0 L 0 -76 L 9 0 Z" fill={INK} />
      </g>
      <circle r={13} fill={INK} />
      {/* sun and snowflake marks */}
      <g transform="translate(58 46)">
        <circle r={10} fill="#FFC23D" stroke={INK} strokeWidth={4} />
      </g>
      <g transform="translate(-58 46)" stroke={INK} strokeWidth={5} strokeLinecap="round">
        <line x1={-11} y1={0} x2={11} y2={0} />
        <line x1={-5.5} y1={-9.5} x2={5.5} y2={9.5} />
        <line x1={5.5} y1={-9.5} x2={-5.5} y2={9.5} />
      </g>
    </g>
  );
};

// ---------- heart with a face ----------
const HEART = 'M 0 78 C -132 -6 -124 -118 -56 -118 C -22 -118 0 -96 0 -64 C 0 -96 22 -118 56 -118 C 124 -118 132 -6 0 78 Z';
export const Heart: React.FC<{beat: number; face: Face; blink?: number; cap?: number; yawn?: number}> = ({beat, face, blink = 0, cap = 0, yawn = 0}) => (
  <g transform={`scale(${1 + 0.12 * beat} ${1 + 0.09 * beat})`}>
    <path d={HEART} fill="#F0564A" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M -84 -70 C -86 -92 -66 -100 -54 -98" fill="none" stroke="#FFB2A8" strokeWidth={9} strokeLinecap="round" />
    <Eye x={-34} y={-34} face={face} blink={blink} skin="#F0564A" size={0.95} />
    <Eye x={34} y={-34} face={face} blink={blink} skin="#F0564A" size={0.95} mirror />
    {yawn > 0.05 ? (
      <ellipse cx={0} cy={10} rx={10 + 6 * yawn} ry={6 + 16 * yawn} fill="#7A1F2B" stroke={INK} strokeWidth={5} />
    ) : (
      <path d="M -14 4 Q 0 16 14 4" fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
    )}
    {cap > 0.01 && (
      <g transform={`translate(-40 -112) rotate(-24) scale(${cap})`}>
        <path d="M -52 8 Q 0 -14 52 8 L 30 -50 Q 10 -96 -40 -110 Q -14 -60 -52 8 Z" fill="#4A6CD8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -56 8 Q 0 -16 56 8 Q 58 22 52 26 Q 0 4 -52 26 Q -60 20 -56 8 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={-42} cy={-110} r={16} fill="#fff" stroke={INK} strokeWidth={6} />
      </g>
    )}
  </g>
);

/** rounded number tag, e.g. 1,200 / per minute */
export const Tag: React.FC<{big: string; small?: string; w?: number; color?: string}> = ({big, small, w = 250, color = '#fff'}) => (
  <g>
    <rect x={-w / 2} y={-56} width={w} height={small ? 120 : 100} rx={26} fill={color} stroke={INK} strokeWidth={SW} />
    <text x={0} y={small ? 8 : 18} textAnchor="middle" fontFamily={FONT} fontSize={66} fill={INK} style={{fontVariantNumeric: 'tabular-nums'}}>{big}</text>
    {small && <text x={0} y={48} textAnchor="middle" fontFamily={FONT} fontSize={26} fill="#5a5560" letterSpacing={1}>{small}</text>}
  </g>
);

// ---------- thermometer with a face ----------
export const Thermometer: React.FC<{value: number; face: Face; blink?: number; chatter?: number}> = ({value, face, blink = 0, chatter = 0}) => {
  const yOf = (v: number) => 130 - v * 9.6; // 0 C at y 130, 40 C at y -254
  const liquid = mix('#E8473F', '#3FA4E8', clamp((40 - value) / 36));
  const top = yOf(value);
  return (
    <g>
      <rect x={-36} y={-300} width={72} height={470} rx={36} fill="#F4F8FB" stroke={INK} strokeWidth={SW} />
      <circle cx={0} cy={214} r={64} fill="#F4F8FB" stroke={INK} strokeWidth={SW} />
      <rect x={-17} y={top} width={34} height={190 - top} fill={liquid} />
      <circle cx={0} cy={214} r={48} fill={liquid} />
      <rect x={-17} y={top - 2} width={34} height={6} rx={3} fill={liquid} stroke={INK} strokeWidth={3} />
      {[0, 10, 20, 30, 40].map((v) => (
        <line key={v} x1={36} y1={yOf(v)} x2={60} y2={yOf(v)} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      ))}
      <path d="M -24 -270 L -24 120" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
      <Eye x={-19} y={204} face={face} blink={blink} skin={liquid} size={0.75} />
      <Eye x={19} y={204} face={face} blink={blink} skin={liquid} size={0.75} mirror />
      {chatter > 0.05 ? (
        <g transform={`translate(0 ${238 + 2 * Math.sin(chatter * 60)})`}>
          <rect x={-18} y={-7} width={36} height={14} rx={4} fill="#fff" stroke={INK} strokeWidth={4} />
          <line x1={-6} y1={-7} x2={-6} y2={7} stroke={INK} strokeWidth={3} />
          <line x1={6} y1={-7} x2={6} y2={7} stroke={INK} strokeWidth={3} />
        </g>
      ) : (
        <path d="M -10 232 Q 0 242 10 232" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------- fridge with a face (origin = bottom centre) ----------
export const Fridge: React.FC<{door: number; face: Face; blink?: number; look?: [number, number]}> = ({door, face, blink = 0, look = [0, 0]}) => {
  const W = 330, H = 590;
  const sx = 1 - 1.3 * door; // door hinge on the left: 1 closed .. -0.3 open
  return (
    <g transform={`translate(${-W / 2} ${-H})`}>
      {/* body + inside */}
      <rect x={0} y={0} width={W} height={H} rx={34} fill="#E9F3F8" stroke={INK} strokeWidth={SW} />
      <rect x={14} y={196} width={W - 28} height={H - 214} rx={18} fill="#BFE8FF" stroke={INK} strokeWidth={5} />
      <rect x={30} y={330} width={W - 60} height={10} rx={5} fill="#fff" stroke={INK} strokeWidth={4} />
      <rect x={30} y={450} width={W - 60} height={10} rx={5} fill="#fff" stroke={INK} strokeWidth={4} />
      {/* milk carton + an egg */}
      <path d="M 64 330 L 64 262 L 84 240 L 112 240 L 112 330 Z" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={70} y={280} width={36} height={24} fill="#4AA6F0" />
      <ellipse cx={224} cy={432} rx={20} ry={18} fill="#FFF5E6" stroke={INK} strokeWidth={5} />
      {/* freezer door with the face */}
      <rect x={0} y={0} width={W} height={196} rx={34} fill="#F4FAFD" stroke={INK} strokeWidth={SW} />
      <rect x={W - 56} y={120} width={18} height={56} rx={9} fill="#C9D3DA" stroke={INK} strokeWidth={5} />
      <Eye x={W / 2 - 48} y={92} face={face} blink={blink} skin="#F4FAFD" size={1.05} look={look} />
      <Eye x={W / 2 + 48} y={92} face={face} blink={blink} skin="#F4FAFD" size={1.05} look={look} mirror />
      {face === 'surprised' ? (
        <ellipse cx={W / 2} cy={150} rx={14} ry={17} fill="#7A1F2B" stroke={INK} strokeWidth={5} />
      ) : face === 'squeeze' ? (
        <path d={`M ${W / 2 - 24} 150 L ${W / 2 - 12} 142 L ${W / 2} 152 L ${W / 2 + 12} 142 L ${W / 2 + 24} 150`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M ${W / 2 - 22} 144 Q ${W / 2} 162 ${W / 2 + 22} 144`} fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
      )}
      {/* main door (swings open around the left hinge) */}
      <g transform={`translate(0 196) scale(${sx} 1)`}>
        <rect x={0} y={0} width={W} height={H - 196} rx={30} fill={sx >= 0 ? '#F4FAFD' : '#DDEBF2'} stroke={INK} strokeWidth={SW / Math.max(0.3, Math.abs(sx))} />
        {sx > 0.2 && <rect x={W - 56} y={30} width={18} height={90} rx={9} fill="#C9D3DA" stroke={INK} strokeWidth={5 / sx} />}
      </g>
      {/* little feet */}
      <rect x={30} y={H - 4} width={40} height={14} rx={6} fill={INK} />
      <rect x={W - 70} y={H - 4} width={40} height={14} rx={6} fill={INK} />
    </g>
  );
};

// ---------- gold medal ----------
export const Medal: React.FC<{spin?: number}> = ({spin = 0}) => (
  <g>
    <path d="M -34 -112 L -10 -18 L 10 -18 L -6 -112 Z" fill="#4A6CD8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 34 -112 L 10 -18 L -10 -18 L 6 -112 Z" fill="#F0564A" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <g transform={`scale(${Math.cos(spin)} 1)`}>
      <circle cx={0} cy={22} r={46} fill="#FFC23D" stroke={INK} strokeWidth={SW} />
      <circle cx={0} cy={22} r={32} fill="#FFD86B" stroke={INK} strokeWidth={4} />
      <path d="M 0 2 L 6 16 L 21 16 L 9 25 L 13 40 L 0 31 L -13 40 L -9 25 L -21 16 L -6 16 Z" fill="#FFF3C4" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    </g>
  </g>
);

// ---------- moon with a face ----------
export const Moon: React.FC<{face: Face; blink?: number}> = ({face, blink = 0}) => (
  <g>
    <circle r={120} fill="#FFF1B8" stroke={INK} strokeWidth={SW} />
    <circle cx={-46} cy={-52} r={18} fill="#F2DE95" />
    <circle cx={52} cy={48} r={24} fill="#F2DE95" />
    <circle cx={-60} cy={52} r={11} fill="#F2DE95" />
    <Eye x={-34} y={-8} face={face} blink={blink} skin="#FFF1B8" size={0.95} />
    <Eye x={34} y={-8} face={face} blink={blink} skin="#FFF1B8" size={0.95} mirror />
    {face === 'surprised' ? (
      <ellipse cx={0} cy={40} rx={12} ry={15} fill="#7A1F2B" stroke={INK} strokeWidth={5} />
    ) : (
      <path d="M -14 34 Q 0 44 14 34" fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
    )}
  </g>
);

// ---------- set pieces ----------
export const Mountains: React.FC<{color: string; snow: boolean; pts: [number, number][]; base: number}> = ({color, snow, pts, base}) => {
  const d = `M ${pts[0][0]} ${base} ` + pts.map(([x, y]) => `L ${x} ${y}`).join(' ') + ` L ${pts[pts.length - 1][0]} ${base} Z`;
  return (
    <g>
      <path d={d} fill={color} stroke={INK} strokeWidth={SW * 2.2} strokeLinejoin="round" />
      {snow &&
        pts.map(([x, y], i) => {
          if (i === 0 || i === pts.length - 1) return null;
          const [px, py] = pts[i - 1], [nx, ny] = pts[i + 1];
          if (y > py || y > ny) return null; // only peaks
          const k = 0.28;
          const lx = lerp(x, px, k), ly = lerp(y, py, k), rx = lerp(x, nx, k), ry = lerp(y, ny, k);
          return (
            <path key={i} d={`M ${x} ${y} L ${lx} ${ly} Q ${lerp(lx, rx, 0.3)} ${Math.max(ly, ry) - 20} ${lerp(lx, rx, 0.5)} ${Math.max(ly, ry) + 10} Q ${lerp(lx, rx, 0.7)} ${Math.max(ly, ry) - 20} ${rx} ${ry} Z`}
              fill="#EEF4FF" stroke={INK} strokeWidth={SW * 2.2} strokeLinejoin="round" />
          );
        })}
    </g>
  );
};

/** main branch centre line (quadratic) - shared with the scene so things can sit on it */
export const BRANCH = {x0: -420, y0: 1350, cx: 300, cy: 1236, x1: 1300, y1: 1318, thick: 48};
export const branchY = (x: number, dip = 0) => {
  // solve x(s) by bisection, return centre y (+ a dip that bends the branch near the fridge)
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const s = (lo + hi) / 2;
    const xs = (1 - s) ** 2 * BRANCH.x0 + 2 * (1 - s) * s * BRANCH.cx + s * s * BRANCH.x1;
    if (xs < x) lo = s; else hi = s;
  }
  const s = (lo + hi) / 2;
  const base = (1 - s) ** 2 * BRANCH.y0 + 2 * (1 - s) * s * BRANCH.cy + s * s * BRANCH.y1;
  return base + dip * Math.exp(-(((x - 880) / 260) ** 2));
};

export const Branch: React.FC<{dip?: number; icicles?: number}> = ({dip = 0, icicles = 0}) => {
  const pts: string[] = [];
  for (let x = BRANCH.x0; x <= BRANCH.x1; x += 40) pts.push(`${x},${branchY(x, dip).toFixed(1)}`);
  const d = 'M ' + pts.join(' L ');
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={BRANCH.thick + SW * 2} strokeLinecap="round" strokeLinejoin="round" />
      {/* side twig with leaves */}
      <path d={`M 140 ${branchY(140) - 10} Q 110 1120 40 1060`} fill="none" stroke={INK} strokeWidth={22 + SW * 2} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#7A4E2D" strokeWidth={BRANCH.thick} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 140 ${branchY(140) - 10} Q 110 1120 40 1060`} fill="none" stroke="#7A4E2D" strokeWidth={22} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#9A6A40" strokeWidth={10} strokeLinecap="round" transform="translate(0 -12)" opacity={0.8} />
      {[[40, 1060, -40], [70, 1100, 30], [-120, branchY(-120) + 12, 150], [1080, branchY(1080, dip) + 14, 160]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M 0 0 C 30 -30 80 -30 110 0 C 80 30 30 30 0 0 Z" fill={i % 2 ? '#4F9E58' : '#5DAE5B'} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 10 0 L 96 0" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      {icicles > 0.01 &&
        [[380, 1, 46], [430, 0.7, 30], [560, 0.85, 40], [610, 0.6, 26]].map(([x, s, len], i) => {
          const y = branchY(x) + BRANCH.thick / 2 - 4;
          const L = len * s * icicles * 1.6;
          return <path key={i} d={`M ${x - 11} ${y} L ${x} ${y + L} L ${x + 11} ${y} Z`} fill="#CFF1FF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
        })}
    </g>
  );
};

/** twig from the top-right that the flower hangs from (flower attaches at 980, 630) */
export const TopTwig: React.FC = () => (
  <g>
    <path d="M 1320 380 Q 1100 430 985 492" fill="none" stroke={INK} strokeWidth={30 + SW * 2} strokeLinecap="round" />
    <path d="M 1320 380 Q 1100 430 985 492" fill="none" stroke="#7A4E2D" strokeWidth={30} strokeLinecap="round" />
    {[[1110, 420, -120], [1180, 400, -60]].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M 0 0 C 30 -30 80 -30 110 0 C 80 30 30 30 0 0 Z" fill={i % 2 ? '#4F9E58' : '#5DAE5B'} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      </g>
    ))}
  </g>
);

/** steam / cold mist puff: circles with one merged outline; draws ink pass then fill pass */
export type Blob = {x: number; y: number; r: number};
export const Puffs: React.FC<{blobs: Blob[]; fill?: string}> = ({blobs, fill = '#FFFFFF'}) => (
  <g>
    {blobs.map((b, i) => (b.r > 0.5 ? <circle key={'i' + i} cx={b.x} cy={b.y} r={b.r + SW * 0.8} fill={INK} /> : null))}
    {blobs.map((b, i) => (b.r > 0.5 ? <circle key={'f' + i} cx={b.x} cy={b.y} r={b.r} fill={fill} /> : null))}
  </g>
);

export const Leaf: React.FC<{x: number; y: number; r: number; s: number; c?: string}> = ({x, y, r, s, c = '#2F5F3A'}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M 0 0 C 60 -70 200 -70 260 0 C 200 70 60 70 0 0 Z" fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M 20 0 L 230 0" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
  </g>
);
