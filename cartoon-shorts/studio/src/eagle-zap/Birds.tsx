import React from 'react';
import {lerp} from '../shared/anim';

// Code-drawn birds in the channel's flat cut-out style (thick black outlines, flat colours, one soft shade).
// All shapes are SVG <g> groups in local units; the caller places them with a transform.

const INK = '#000';
export const C = {
  brown: '#5B3A1E',
  brownHi: '#7A5230',
  white: '#FEFDFD',
  whiteShade: '#E4E1DF',
  beak: '#F5B800',
  beakDark: '#D99A00',
  foot: '#F2C230',
  tongue: '#FC8D90',
  // zapped
  soot: '#2F2724',
  sootHi: '#4A3D35',
  ash: '#9C9894',
  ashShade: '#7D7975',
  xray: '#203458',
  bone: '#F4F7FF',
  // sparrow
  sBrown: '#8B5A2B',
  sDark: '#5E3A18',
  sBelly: '#E8DCC8',
  sCap: '#8E8F96',
};

// ---------- eagle (front view) ----------
// origin = between the feet (on the perch); up is -y. Height ~337, shoulders at (+-60, -200).
export const SHOULDER: [number, number] = [60, -200];
export const WING_L = 380;

// one wing pointing along +x in its own frame (root at 0,0); len = 0..1 folding scale
const WingShape: React.FC<{fill: string; hi: string; sw: number; frizz: number; xray: boolean}> = ({fill, hi, sw, frizz, xray}) => {
  const L = WING_L;
  // leading edge, finger tips, scalloped trailing edge
  const fingers = [
    [L * 0.8, 6],
    [L * 0.9, 2],
    [L * 0.98, -4],
    [L * 1.0, -16],
  ];
  let d = `M 0 -34 C ${L * 0.25} -58 ${L * 0.55} -58 ${L * 0.74} -40 `;
  d += `L ${L * 0.94} -32 Q ${L * 1.04} -30 ${L * 1.0} -16 `;
  // fingers (long primaries)
  const fx = [L * 1.0, L * 0.97, L * 0.9, L * 0.8];
  const fy = [-16, 6, 22, 34];
  for (let i = 0; i < 4; i++) {
    const x = fx[i];
    const y = fy[i];
    d += `L ${x + 18} ${y + 4} Q ${x + 20} ${y + 16} ${x + 2} ${y + 14} `;
  }
  // trailing edge scallops back to the root
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x0 = lerp(L * 0.74, L * 0.06, i / n);
    const x1 = lerp(L * 0.74, L * 0.06, (i + 1) / n);
    const y = lerp(44, 40, i / n);
    d += `Q ${(x0 + x1) / 2} ${y + 22} ${x1} ${y} `;
  }
  d += 'L 0 40 Z';
  void fingers;
  return (
    <g>
      {frizz > 0.01
        ? Array.from({length: 9}, (_, i) => {
            const x = lerp(L * 0.08, L * 0.92, i / 8);
            return <path key={i} d={`M ${x - 16} -48 L ${x} ${-48 - 34 * frizz} L ${x + 16} -50 Z`} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />;
          })
        : null}
      <path d={d} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {!xray ? <path d={`M 6 -26 C ${L * 0.25} -46 ${L * 0.5} -46 ${L * 0.7} -30 Q ${L * 0.45} -6 ${L * 0.1} 6 Z`} fill={hi} /> : null}
      {!xray
        ? [0.25, 0.42, 0.58].map((u) => <path key={u} d={`M ${L * u} 16 Q ${L * u + 14} 28 ${L * u + 4} 40`} fill="none" stroke={INK} strokeWidth={sw * 0.55} strokeLinecap="round" />)
        : null}
      {xray ? (
        // wing bones: humerus -> elbow -> hand -> finger tips
        <g stroke={C.bone} strokeWidth={13} strokeLinecap="round" fill="none">
          <path d={`M 4 0 L ${L * 0.36} -18 L ${L * 0.7} -10 L ${L * 0.95} -10`} />
          <path d={`M ${L * 0.36} -18 L ${L * 0.7} 4`} strokeWidth={8} />
          <path d={`M ${L * 0.7} -10 L ${L * 0.92} 14 M ${L * 0.7} -10 L ${L * 0.86} 26`} strokeWidth={7} />
        </g>
      ) : null}
    </g>
  );
};

const Spiral: React.FC<{x: number; y: number; r: number; rot: number}> = ({x, y, r, rot}) => {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 4.2;
    const rr = (r * i) / 40;
    d += `${i === 0 ? 'M' : 'L'} ${Math.cos(a) * rr} ${Math.sin(a) * rr} `;
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle r={r * 1.15} fill={C.white} stroke={INK} strokeWidth={4} />
      <path d={d} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

export type EagleState = {
  wingL: number; // wing angle in degrees, 0 = straight out, + = down (screen)
  wingR: number;
  fold: number; // 0 = folded against the body, 1 = fully open
  look?: [number, number];
  lid?: number; // 0 open .. 1 closed (smug ~0.45)
  brow?: number; // 0 stern .. 1 raised (worried)
  wide?: number; // 0..1 eyes pop wide
  zapped?: number; // 0..1 sooty + frizzy + dazed
  xray?: boolean;
  beakOpen?: number;
  tremble?: number;
  t?: number;
};

export const Eagle: React.FC<EagleState> = ({wingL, wingR, fold, look = [0, 0], lid = 0, brow = 0, wide = 0, zapped = 0, xray = false, beakOpen = 0, t = 0}) => {
  const z = zapped;
  const sw = 8;
  const body = xray ? C.xray : z > 0.5 ? C.soot : C.brown;
  const bodyHi = xray ? C.xray : z > 0.5 ? C.sootHi : C.brownHi;
  const head = xray ? C.xray : z > 0.5 ? C.ash : C.white;
  const headShade = xray ? C.xray : z > 0.5 ? C.ashShade : C.whiteShade;
  const beak = xray ? C.xray : z > 0.5 ? C.beakDark : C.beak;
  const frizz = z > 0.5 ? z : 0;
  // folded wings: rotate down beside the body and shorten
  const wing = (side: 1 | -1, ang: number) => {
    const a = lerp(side === 1 ? 96 : 96, ang, fold);
    const s = lerp(0.48, 1, fold);
    return (
      <g transform={`translate(${SHOULDER[0] * side} ${SHOULDER[1]}) scale(${side} 1) rotate(${a}) scale(${s} ${lerp(0.9, 1, fold)})`}>
        <WingShape fill={body} hi={bodyHi} sw={sw / s} frizz={frizz} xray={xray} />
      </g>
    );
  };
  const eyeY = -292;
  const er = 17 * (1 + 0.35 * wide);
  const lidH = lid * 2 * er;
  return (
    <g>
      {/* tail behind the legs */}
      <path d="M -40 -46 L -58 6 Q 0 26 58 6 L 40 -46 Z" fill={head} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {/* feathered legs + yellow feet */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 26 - 20} y={-70} width={40} height={58} rx={18} fill={body} stroke={INK} strokeWidth={sw} />
          <path d={`M ${s * 26 - 24} -8 Q ${s * 26} -22 ${s * 26 + 24} -8 L ${s * 26 + 26} 2 Q ${s * 26} 10 ${s * 26 - 26} 2 Z`} fill={xray ? C.xray : C.foot} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
          {[-14, 0, 14].map((dx) => (
            <path key={dx} d={`M ${s * 26 + dx - 4} 4 Q ${s * 26 + dx} 18 ${s * 26 + dx + 6} 12`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          ))}
        </g>
      ))}
      {wing(-1, wingL)}
      {wing(1, wingR)}
      {/* body */}
      {frizz > 0
        ? Array.from({length: 10}, (_, i) => {
            const a = (-Math.PI * 0.9 * i) / 9 - Math.PI * 0.05;
            const x = Math.cos(a) * 82;
            const y = -140 + Math.sin(a) * -110;
            return <path key={i} d={`M ${x - 14} ${y} L ${x * 1.25} ${y + (y + 140) * 0.25} L ${x + 14} ${y + 6} Z`} fill={body} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />;
          })
        : null}
      <ellipse cx={0} cy={-140} rx={84} ry={112} fill={body} stroke={INK} strokeWidth={sw} />
      {!xray ? <ellipse cx={-26} cy={-120} rx={40} ry={74} fill={bodyHi} opacity={0.9} /> : null}
      {!xray ? (
        <path d="M -30 -110 q 10 10 20 0 M 6 -80 q 10 10 20 0 M -20 -60 q 10 10 20 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
      ) : null}
      {xray ? (
        <g stroke={C.bone} strokeWidth={12} strokeLinecap="round" fill="none">
          <path d="M 0 -232 L 0 -60" />
          {[-170, -140, -110].map((y) => (
            <path key={y} d={`M -50 ${y + 14} Q 0 ${y - 16} 50 ${y + 14}`} strokeWidth={8} />
          ))}
          <path d="M -52 -200 L 52 -200" strokeWidth={9} />
          <path d="M -26 -66 L -26 -6 M 26 -66 L 26 -6" />
        </g>
      ) : null}
      {/* head + white neck ruff */}
      {frizz > 0
        ? Array.from({length: 11}, (_, i) => {
            const a = Math.PI + (Math.PI * i) / 10;
            const x = Math.cos(a) * 64;
            const y = -282 + Math.sin(a) * 64;
            return <path key={i} d={`M ${x - 13} ${y + 6} L ${x * 1.42} ${-282 + Math.sin(a) * 100} L ${x + 13} ${y + 4} Z`} fill={head} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />;
          })
        : null}
      <ellipse cx={0} cy={-226} rx={74} ry={40} fill={head} stroke={INK} strokeWidth={sw} />
      <circle cx={0} cy={-282} r={66} fill={head} stroke={INK} strokeWidth={sw} />
      <ellipse cx={0} cy={-226} rx={66} ry={30} fill={head} />
      {!xray ? <path d="M -60 -300 A 66 66 0 0 0 -36 -226 Q -60 -250 -60 -300 Z" fill={headShade} /> : null}
      {xray ? (
        <g>
          <circle cx={0} cy={-286} r={48} fill="none" stroke={C.bone} strokeWidth={10} />
          <circle cx={-22} cy={-292} r={13} fill={C.bone} />
          <circle cx={22} cy={-292} r={13} fill={C.bone} />
        </g>
      ) : null}
      {/* eyes */}
      {!xray && z <= 0.5
        ? [-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * 27} ${eyeY})`}>
              <ellipse rx={er * 0.85} ry={er} fill={C.white} stroke={INK} strokeWidth={4.5} />
              <ellipse cx={look[0] * er * 0.35} cy={look[1] * er * 0.35} rx={er * 0.5} ry={er * 0.6} fill={INK} />
              <circle cx={look[0] * er * 0.35 + er * 0.18} cy={look[1] * er * 0.35 - er * 0.22} r={er * 0.17} fill="#fff" />
              {lidH > 0.5 ? (
                <g>
                  <clipPath id={`elid${s}`}>
                    <ellipse rx={er * 0.85} ry={er} />
                  </clipPath>
                  <rect x={-er} y={-er - 2} width={er * 2} height={lidH + 2} fill={head === C.white ? C.whiteShade : head} clipPath={`url(#elid${s})`} />
                  <line x1={-er * 0.9} x2={er * 0.9} y1={-er + lidH} y2={-er + lidH} stroke={INK} strokeWidth={4.5} />
                </g>
              ) : null}
              {/* stern brow: inner end low; worried: inner end high */}
              <path
                d={`M ${-s * er * 1.0} ${-er - 8 + lerp(10, -10, brow)} L ${s * er * 1.1} ${-er - 8 + lerp(-8, 6, brow)}`}
                stroke={INK}
                strokeWidth={9}
                strokeLinecap="round"
                transform={`translate(0 ${-wide * 6})`}
              />
            </g>
          ))
        : null}
      {!xray && z > 0.5 ? (
        <g>
          <Spiral x={-27} y={eyeY} r={15} rot={t * 520} />
          <Spiral x={27} y={eyeY} r={15} rot={-t * 520} />
        </g>
      ) : null}
      {/* beak (front view, hooked) */}
      <path d="M -24 -268 Q 0 -286 24 -268 L 10 -228 Q 0 -216 -10 -228 Z" fill={beak} stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
      {beakOpen > 0.02 ? (
        <g>
          <path d={`M -16 -244 Q 0 ${-244 + 42 * beakOpen} 16 -244 Z`} fill="#7A1F2B" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <ellipse cx={4} cy={-244 + 26 * beakOpen} rx={9} ry={12 * beakOpen} fill={C.tongue} />
        </g>
      ) : null}
    </g>
  );
};

// wing tip in eagle-local coords (feet origin) for a wing angle (deg), side 1 = right, fold 1
export const wingTip = (side: 1 | -1, angDeg: number): [number, number] => {
  const a = (angDeg * Math.PI) / 180;
  const L = WING_L * 1.02;
  return [side * (SHOULDER[0] + L * Math.cos(a)), SHOULDER[1] + L * Math.sin(a)];
};

// ---------- sparrow (side view, faces +x) ----------
// origin = feet on the wire; height ~95
export const Sparrow: React.FC<{lid?: number; look?: [number, number]; squeeze?: boolean; beakOpen?: number; duck?: number; flap?: number}> = ({
  lid = 0,
  look = [0.3, 0],
  squeeze = false,
  beakOpen = 0,
  duck = 0,
  flap = 0,
}) => {
  const sw = 5;
  const er = 6.5;
  const by = -40 + duck * 10;
  return (
    <g>
      {/* feet */}
      <path d="M -6 -14 L -8 0 M 8 -14 L 6 0" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {/* tail */}
      <path d={`M -26 ${by + 8} L -64 ${by - 10} L -58 ${by + 6} L -30 ${by + 22} Z`} fill={C.sDark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {/* body */}
      <ellipse cx={0} cy={by} rx={36} ry={30} fill={C.sBrown} stroke={INK} strokeWidth={sw} />
      <path d={`M -28 ${by + 10} Q 0 ${by + 38} 30 ${by + 6} Q 10 ${by + 16} -28 ${by + 10} Z`} fill={C.sBelly} />
      <path d={`M 30 ${by + 4} A 36 30 0 0 1 -30 ${by + 16} Q 0 ${by + 22} 30 ${by + 4} Z`} fill={C.sBelly} />
      {/* wing */}
      <g transform={`translate(-4 ${by - 6}) rotate(${-flap * 55})`}>
        <path d="M 14 -6 Q -10 -14 -34 6 Q -10 18 16 8 Z" fill={C.sDark} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M -6 0 L -22 6 M 2 4 L -14 10" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {/* head */}
      <g transform={`translate(${22} ${by - 24 + duck * 8})`}>
        <circle r={21} fill={C.sBrown} stroke={INK} strokeWidth={sw} />
        <path d="M -19 -6 A 21 21 0 0 1 17 -11 Q 2 -6 -19 -6 Z" fill={C.sCap} />
        <path d="M 4 8 Q 14 18 20 6 Q 12 4 4 8 Z" fill={C.sBelly} />
        {/* beak */}
        <path d={`M 17 -4 L 34 ${1 - beakOpen * 4} L 18 4 Z`} fill="#3B2A1E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {beakOpen > 0.05 ? <path d={`M 18 4 L 32 ${6 + beakOpen * 6} L 17 8 Z`} fill="#3B2A1E" stroke={INK} strokeWidth={3} strokeLinejoin="round" /> : null}
        {/* eye */}
        {squeeze ? (
          <path d="M 4 -8 L 11 -3 L 4 2" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <g transform="translate(8 -3)">
            <ellipse rx={er * 0.85} ry={er} fill={INK} transform={`translate(${look[0] * 2} ${look[1] * 2})`} />
            <circle cx={look[0] * 2 + 2} cy={look[1] * 2 - 2.5} r={1.8} fill="#fff" />
            {lid > 0.02 ? (
              <g>
                <rect x={-er - 1} y={-er - 2} width={er * 2 + 2} height={lid * er * 2 + 2} fill={C.sBrown} />
                <line x1={-er} x2={er} y1={-er + lid * er * 2} y2={-er + lid * er * 2} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
              </g>
            ) : null}
          </g>
        )}
      </g>
    </g>
  );
};

// ---------- a little electricity "pulse" critter that runs along a wire ----------
export const Pulse: React.FC<{s?: number; look?: [number, number]; eyes?: number; t: number}> = ({s = 1, look = [1, 0], eyes = 1, t}) => {
  const w = 1 + 0.08 * Math.sin(2 * Math.PI * 9 * t);
  return (
    <g transform={`scale(${s * w} ${s / w})`}>
      <circle r={30} fill="#FFE34D" opacity={0.35} />
      <path d="M -14 -20 L 6 -20 L -2 -4 L 14 -4 L -8 22 L -2 4 L -16 4 Z" fill="#FFE34D" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {eyes > 0.05
        ? [-4, 4].map((dx) => (
            <g key={dx} transform={`translate(${dx - 1 + look[0] * 1.2} ${-9 + look[1] * 1.2}) scale(${eyes})`}>
              <ellipse rx={2.4} ry={3.2} fill={INK} />
            </g>
          ))
        : null}
    </g>
  );
};

// a jagged lightning bolt along a polyline (deterministic jitter that changes ~20 times a second)
export const Bolt: React.FC<{pts: [number, number][]; t: number; w?: number; seed?: number}> = ({pts, t, w = 1, seed = 0}) => {
  const k = Math.floor(t * 20) + seed * 31;
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const n = 5;
    for (let j = 0; j < n; j++) {
      const u = j / n;
      const r = Math.sin((k + i * 7 + j * 13) * 12.9898) * 43758.5453;
      const j1 = (r - Math.floor(r) - 0.5) * 46 * w;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const nl = Math.hypot(nx, ny) || 1;
      out.push([lerp(x0, x1, u) + (nx / nl) * (j === 0 ? 0 : j1), lerp(y0, y1, u) + (ny / nl) * (j === 0 ? 0 : j1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  const d = out.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#FFE34D" strokeWidth={60 * w} opacity={0.3} />
      <path d={d} stroke={INK} strokeWidth={26 * w} />
      <path d={d} stroke="#FFE34D" strokeWidth={17 * w} />
      <path d={d} stroke="#FFFFFF" strokeWidth={6 * w} />
    </g>
  );
};

// small spark star at a contact point
export const Spark: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  if (s <= 0.01) return null;
  const rot = Math.floor(t * 24) * 37;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <circle r={34} fill="#FFE34D" opacity={0.35} />
      <path d="M 0 -30 L 7 -8 L 28 -10 L 10 4 L 18 26 L 0 12 L -18 26 L -10 4 L -28 -10 L -7 -8 Z" fill="#FFE34D" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle r={6} fill="#fff" />
    </g>
  );
};
