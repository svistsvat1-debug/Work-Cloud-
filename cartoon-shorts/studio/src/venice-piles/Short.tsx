import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "In 1902, Venice's giant bell tower collapsed..." - one side-view set: the square above the ground line G, a
// school-diagram cut-away below it (stone slab, wooden platform, five poles with faces in the mud). The tower (with a
// face) trembles and drops into a rubble pile; the bell bounces out. The guy blames the poles, the camera sinks into the
// cut-away: sleepy poles with cobwebs. He digs a hole; the poles wake up and hold. Air bubbles fall down the hole and
// bounce off the mud; a mushroom pops out to bite a pole, chokes, turns blue and flops. The tower pops back (rebuilt) and
// the camera glides back to frame 0 for the loop.

const F = (n: string) => staticFile(`venice-piles/${n}.png`);
export const FONT = 'VeniceInter';
export const useVpFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 1.0; // raw voice peaks at -5.2 dBFS
const INK = '#000';
const SKY = '#9BD2F1';

// ---------- world ----------
export const G = 1000; // pavement top
const BGS = 1.5;
const BG_X = 540 - (SPR.bg.w * BGS) / 2;
const BG_Y = G - 866 * BGS; // the plate's pavement starts at row 866
const SLAB = 45; // stone slab thickness
const PLAT = {x0: 436, x1: 884, y0: G + SLAB, y1: G + SLAB + 32}; // wooden platform under the tower
const TX = 660; // tower centre
const TS = 0.78; // tower scale (native 1476 tall -> ~1131)
const TOWER_H = (SPR.tower.feet[1] - SPR.tower.top) * TS;
const PS = 0.5; // pole scale
const POLE_X = [0, 1, 2, 3, 4].map((i) => TX + (i - 2) * 85);
const POLE_TOP = PLAT.y1 - 2;
const HOLE_X = 400; // the dig hole (left of the platform)
const HOLE_W = 92;
const HOLE_BOTTOM = G + 150;
const GX = 300; // the guy's feet / head x
const HEAD_R = 80;
const MUSH = {x: 418, y: 1262}; // the fungus (its feet) beside pole 0
const BELL_LAND = {x: 900, y: G};

const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const squashSwap = (t: number, tSwap: number) => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const breathe = (tr: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr + ph);
const outPop = (t: number, t0: number, t1: number, d0 = 0.25, d1 = 0.18) => pop(t, t0, d0) * (1 - easeInCubic(prog(t, t1, t1 + d1)));

// tower drop: 0 = standing, TOWER_H = fully under the ground line (clipped)
const T_DROP0 = 3.32;
const T_DROP1 = 3.74;
const T_RISE0 = 17.12;
const T_RISE1 = 17.5;
const dropAt = (t: number) => {
  if (t < T_DROP0) return 0;
  if (t < T_RISE0) return TOWER_H * easeInCubic(prog(t, T_DROP0, T_DROP1));
  return TOWER_H * (1 - easeOutCubic(prog(t, T_RISE0, T_RISE1)));
};
const rubbleOn = (t: number) => t > 3.5 && t < T_RISE0 + 0.12;

// hole depth (below G)
const holeAt = (t: number) => {
  if (t > T_RISE0 - 0.05) return 0;
  const d1 = 60 * easeOutCubic(prog(t, T.dug, T.dug + 0.18));
  const d2 = 50 * easeOutCubic(prog(t, T.down, T.down + 0.18));
  const d3 = 40 * easeOutCubic(prog(t, 9.5, 9.68));
  return d1 + d2 + d3;
};
const DIGS = [T.dug, T.down, 9.5];

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 520, y: 470, k: 1.0};
const KEYS: CamKey[] = [
  CAM0,
  {t: 3.2, x: 530, y: 455, k: 1.04},
  {t: 4.7, x: 530, y: 455, k: 1.04},
  {t: 6.0, x: 600, y: 1175, k: 1.45},
  {t: 8.3, x: 615, y: 1195, k: 1.55},
  {t: 8.62, x: 615, y: 1195, k: 1.55},
  {t: 9.4, x: 530, y: 1150, k: 1.6},
  {t: 11.5, x: 545, y: 1160, k: 1.66},
  {t: 12.3, x: 515, y: 1165, k: 2.0},
  {t: 14.45, x: 515, y: 1180, k: 2.1},
  {t: 15.1, x: 455, y: 1235, k: 2.9},
  {t: 16.85, x: 455, y: 1240, k: 2.98},
  {t: 17.85, x: CAM0.x, y: CAM0.y, k: CAM0.k},
];
export const camFor = (t: number): Cam => camAt(t, KEYS);

// ---------- helpers ----------
type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  filter,
  children,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s, filter}} />
      {children ? (
        <svg style={{position: 'absolute', left: -fx * s, top: -fy * s, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
          {children}
        </svg>
      ) : null}
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -3000, top: -3000, overflow: 'visible'}} width={9000} height={9000} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Poof: React.FC<{x: number; y: number; t: number; t0: number; R?: number; fill?: string}> = ({x, y, t, t0, R = 120, fill = '#FFFFFF'}) => {
  const u = prog(t, t0, t0 + 0.55);
  if (u <= 0 || u >= 1) return null;
  const sz = Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u * 0.4);
  const puffs: Puff[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    return {x: x + Math.cos(a) * R * (0.5 + 0.5 * u), y: y + Math.sin(a) * R * 0.7 * (0.5 + 0.5 * u), r: R * 0.55 * sz * (0.8 + 0.4 * rnd(i))};
  });
  puffs.push({x, y, r: R * 0.75 * sz});
  return <PuffCluster puffs={puffs} fill={fill} ink={6} />;
};
const Zzz: React.FC<{x: number; y: number; t: number; t0: number; t1: number; size: number}> = ({x, y, t, t0, t1, size}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const ph = (t - t0) * 0.55 - i / 3;
      if (t < t0 || t > t1 || ph < 0) return null;
      const u = ph % 1;
      const fade = 1 - prog(t, t1 - 0.3, t1);
      const s = Math.sin(Math.PI * u) * fade;
      if (s <= 0.01) return null;
      return <Mark key={i} x={x + u * size * 1.2 + Math.sin(u * 6) * 6} y={y - u * size * 2.2} size={size * (0.6 + 0.5 * u)} s={s} text="z" rot={-12} />;
    })}
  </g>
);

// ---------- the set ----------
const Backdrop: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -2000, top: BG_Y - 3000, width: 5000, height: 3004, background: SKY}} />
    <Img src={F('bg')} style={{position: 'absolute', left: BG_X, top: BG_Y, width: SPR.bg.w * BGS, height: SPR.bg.h * BGS}} />
  </>
);

// the cut-away under the pavement: slab, mud bands, strata, pebbles, platform
const Underground: React.FC<{t: number}> = ({t}) => {
  const hd = holeAt(t);
  const strata = [1210, 1420, 1640, 1880];
  return (
    <g>
      <rect x={-1500} y={G} width={4200} height={2600} fill="#7B5A3E" />
      <rect x={-1500} y={1320} width={4200} height={2400} fill="#6E4F36" />
      <rect x={-1500} y={1720} width={4200} height={2000} fill="#5F432D" />
      {strata.map((y, i) => (
        <path
          key={y}
          d={`M -1500 ${y} ${Array.from({length: 40}, (_, k) => `Q ${-1500 + k * 110 + 55} ${y + (k % 2 ? 9 : -9) + i * 2} ${-1500 + (k + 1) * 110} ${y}`).join(' ')}`}
          fill="none"
          stroke="#4E3524"
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
      {Array.from({length: 46}, (_, i) => {
        const x = -400 + rnd(i) * 1900;
        const y = G + 90 + rnd(i + 50) * 1100;
        if (x > PLAT.x0 - 30 && x < PLAT.x1 + 30 && y < POLE_TOP + 480) return null;
        return <ellipse key={i} cx={x} cy={y} rx={7 + rnd(i + 9) * 9} ry={5 + rnd(i + 3) * 5} fill="#8C6B4C" stroke="#4E3524" strokeWidth={3} />;
      })}
      {/* stone slab */}
      <rect x={-1500} y={G} width={4200} height={SLAB} fill="#CDBFA4" />
      {Array.from({length: 40}, (_, i) => (
        <line key={i} x1={-1500 + i * 110} x2={-1500 + i * 110} y1={G} y2={G + SLAB} stroke="#9C8E74" strokeWidth={4} />
      ))}
      <line x1={-1500} x2={2700} y1={G + SLAB} y2={G + SLAB} stroke={INK} strokeWidth={5} />
      <line x1={-1500} x2={2700} y1={G} y2={G} stroke={INK} strokeWidth={6} />
      {/* wooden platform */}
      <rect x={PLAT.x0} y={PLAT.y0} width={PLAT.x1 - PLAT.x0} height={PLAT.y1 - PLAT.y0} fill="#B07A45" stroke={INK} strokeWidth={5} />
      {[1, 2, 3, 4, 5, 6].map((i) => {
        const x = PLAT.x0 + ((PLAT.x1 - PLAT.x0) * i) / 7;
        return <line key={i} x1={x} x2={x} y1={PLAT.y0 + 3} y2={PLAT.y1 - 3} stroke="#7E5530" strokeWidth={3} />;
      })}
      {/* the dig hole */}
      {hd > 1 ? (
        <path
          d={`M ${HOLE_X - HOLE_W / 2} ${G - 2} L ${HOLE_X - HOLE_W / 2 + 6} ${G + hd - 20} Q ${HOLE_X} ${G + hd + 14} ${HOLE_X + HOLE_W / 2 - 6} ${G + hd - 20} L ${HOLE_X + HOLE_W / 2} ${G - 2} Z`}
          fill="#3B2718"
          stroke={INK}
          strokeWidth={5}
        />
      ) : null}
    </g>
  );
};

// dirt clumps thrown left on each dig + a mound that grows on the pavement
const Dirt: React.FC<{t: number}> = ({t}) => {
  if (t > T_RISE0 + 0.1) return null;
  const n = DIGS.filter((d) => t > d + 0.3).length;
  const mound = n === 0 ? 0 : n * 0.33 + 0.1 * spring(t - DIGS[n - 1] - 0.3, 3, 8);
  const mx = 175;
  return (
    <g>
      {DIGS.map((d, j) =>
        [0, 1, 2].map((i) => {
          const u = prog(t, d + 0.05, d + 0.35);
          if (u <= 0 || u >= 1) return null;
          const x = lerp(HOLE_X, mx + (i - 1) * 26, u);
          const y = G - 10 - 220 * (1 - (2 * u - 1) ** 2) * (0.8 + 0.3 * rnd(j * 3 + i)) + 10 * u;
          return <ellipse key={`${j}-${i}`} cx={x} cy={y} rx={13 + 4 * rnd(i + j)} ry={10} transform={`rotate(${u * 300} ${x} ${y})`} fill="#5C3F28" stroke={INK} strokeWidth={4} />;
        }),
      )}
      {mound > 0.01 ? (
        <path d={`M ${mx - 70 * Math.min(mound, 1.1)} ${G + 1} Q ${mx} ${G - 70 * mound} ${mx + 70 * Math.min(mound, 1.1)} ${G + 1} Z`} fill="#5C3F28" stroke={INK} strokeWidth={5} />
      ) : null}
    </g>
  );
};

// ---------- the tower with a face ----------
const Tower: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const d = dropAt(t);
  if (d >= TOWER_H - 1) return null;
  const tremble = (t > T.bell && t < T_DROP1 ? clamp((t - T.bell) / 0.6) : 0) * (3.5 * Math.sin(2 * Math.PI * 17 * tr) + 2 * Math.sin(2 * Math.PI * 9.3 * tr));
  const rise = t > T_RISE0;
  const squash = rise ? 1 + 0.03 * spring(t - T_RISE1, 2.5, 6) : 1 - 0.04 * clamp((t - T_DROP0) / 0.2);
  // face in native tower px (on the brick shaft under the belfry)
  const worried = t > T.tower - 0.15 && t < T_RISE0;
  const squeeze = t > T.collapsed - 0.12 && t < T_RISE0;
  const look: [number, number] = worried ? [0, 1] : [-0.3, 0.1];
  const sweat = worried && !squeeze ? pop(t, T.tower + 0.15, 0.25) : 0;
  const eo = rise ? easeOutBack(prog(t, T_RISE1 - 0.1, T_RISE1 + 0.2), 2) : 1;
  const ex = 126;
  const ey = 640;
  return (
    <div style={{position: 'absolute', left: TX - 300, top: G - 2000, width: 600, height: 2000, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 300 + tremble, top: 2000 + d}}>
        <Spr n="tower" x={0} y={0} s={TS} sy={squash}>
          <Eye x={ex - 38} y={ey} r={24} open={eo} look={look} squeeze={squeeze} side={-1} brow={0.75} browTilt={worried ? 0.9 : 0} ink={0.2} />
          <Eye x={ex + 38} y={ey} r={24} open={eo} look={look} squeeze={squeeze} side={1} brow={0.75} browTilt={worried ? 0.9 : 0} ink={0.2} />
          {worried ? (
            <path d={`M ${ex - 26} ${ey + 70} Q ${ex - 13} ${ey + 58} ${ex} ${ey + 70} Q ${ex + 13} ${ey + 82} ${ex + 26} ${ey + 70}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          ) : (
            <path d={`M ${ex - 26} ${ey + 62} Q ${ex} ${ey + 90} ${ex + 26} ${ey + 62}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          )}
          <SweatDrop x={ex + 82} y={ey - 30 + 60 * prog(t, T.tower + 0.2, T.collapsed)} r={16} s={sweat} />
        </Spr>
      </div>
    </div>
  );
};

// the bell flies out of the dust and bounces to a stop on the right
const Bell: React.FC<{t: number}> = ({t}) => {
  if (t < 3.6 || t > T_RISE0 + 0.15) return null;
  const s = 0.22 * (t > T_RISE0 ? 1 - prog(t, T_RISE0, T_RISE0 + 0.15) : 1);
  const t0 = 3.6;
  const t1 = 4.0;
  let x;
  let y;
  let rot;
  if (t < t1) {
    const u = (t - t0) / (t1 - t0);
    x = lerp(TX + 40, BELL_LAND.x, u);
    y = lerp(G - 260, BELL_LAND.y, u) - 260 * u * (1 - u) * 2.2;
    rot = 540 * u;
  } else {
    const b = Math.abs(Math.sin(Math.PI * clamp((t - t1) / 0.3))) * Math.exp(-3 * (t - t1));
    x = BELL_LAND.x + 20 * easeOutCubic(prog(t, t1, t1 + 0.5));
    y = BELL_LAND.y - 50 * (t < t1 + 0.3 ? b : 0);
    rot = 18 * Math.sin(2 * Math.PI * 1.6 * (t - t1)) * Math.exp(-2.4 * (t - t1));
  }
  return <Spr n="bell" x={x} y={y} s={s} rot={rot} ay={SPR.bell.bottom - 10} />;
};

const Rubble: React.FC<{t: number}> = ({t}) => {
  if (!rubbleOn(t)) return null;
  const g = easeOutBack(prog(t, 3.5, 3.85), 1.8);
  return <Spr n="rubble" x={TX} y={G + 6} s={0.6} sx={1} sy={g} />;
};

const Dust: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, 3.42, 4.9);
  if (u <= 0 || u >= 1) return null;
  const grow = easeOutCubic(prog(t, 3.42, 3.9));
  const shrink = 1 - easeInCubic(prog(t, 4.2, 4.9));
  const puffs: Puff[] = Array.from({length: 11}, (_, i) => {
    const a = (i / 11) * Math.PI;
    const R = 120 + 160 * grow;
    return {x: TX - Math.cos(a) * R * 1.3, y: G - 20 - Math.sin(a) * R * 0.7 - 20 * u, r: (70 + 30 * rnd(i)) * grow * shrink};
  });
  puffs.push({x: TX, y: G - 90, r: 120 * grow * shrink});
  return <PuffCluster puffs={puffs} fill="#EFE7D8" shade="#DDD1BB" ink={6} />;
};

// ---------- the poles with faces ----------
const poleLid = (t: number, i: number) => {
  const wake = T.poles2 + i * 0.06;
  if (t < wake) return 1;
  if (t < T_RISE0 + 0.15) {
    // a slow blink now and then
    const bl = bump(t, 12.9 + i * 0.13, 0.16) + bump(t, 15.2 + i * 0.09, 0.16);
    const smug = t > T.breathe ? 0.45 * easeOutCubic(prog(t, T.breathe, T.breathe + 0.25)) : 0;
    return Math.max(1 - easeOutCubic(prog(t, wake, wake + 0.12)), bl, smug);
  }
  return Math.min(1, 0.45 + 0.55 * easeInOutCubic(prog(t, T_RISE0 + 0.15, 17.7)));
};
const poleLook = (t: number, i: number): [number, number] => {
  if (t < T.still) return [-0.6, -0.4];
  if (t < T.because) return [-0.2, -0.5];
  if (t < T.so2) return [-0.4, -0.9];
  return i === 0 ? [-0.9, 0.5] : [-0.8, 0.3];
};
const Poles: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const hold = t > T.holding ? 1 + 0.05 * spring(t - T.holding, 3, 5) : 1;
  const strain = t > T.still - 0.05 && t < T.holding + 0.3;
  return (
    <>
      {POLE_X.map((x, i) => {
        const sp = SPR[`pole${i}` as 'pole0'];
        const ps = PS * (i === 2 ? 1 : 1);
        const lid = poleLid(t, i);
        const sleeping = lid > 0.96;
        const look = poleLook(t, i);
        const fy = 140; // face native y (eyes)
        const fx = sp.feet[0];
        const breath = sleeping ? 1 + 0.012 * Math.sin(2 * Math.PI * 0.45 * tr + i) : 1;
        const tremble = strain ? 1.4 * Math.sin(2 * Math.PI * 15 * tr + i) : 0;
        const brows = t > T.still - 0.05 && t < T.because;
        return (
          <Spr key={i} n={`pole${i}` as 'pole0'} x={x + tremble} y={POLE_TOP} s={ps} sy={hold * breath} ay={sp.top + 4}>
            {sleeping ? (
              [-26, 26].map((dx) => <path key={dx} d={`M ${fx + dx - 17} ${fy - 2} Q ${fx + dx} ${fy + 14} ${fx + dx + 17} ${fy - 2}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />)
            ) : (
              <>
                <Eye x={fx - 26} y={fy} r={22} open={1} lid={lid} look={look} side={-1} brow={brows ? 0.7 : NaN} browTilt={brows ? -1.1 : 0} ink={0.2} />
                <Eye x={fx + 26} y={fy} r={22} open={1} lid={lid} look={look} side={1} brow={brows ? 0.7 : NaN} browTilt={brows ? -1.1 : 0} ink={0.2} />
              </>
            )}
            {sleeping ? (
              <ellipse cx={fx} cy={fy + 58} rx={9} ry={7 + 3 * Math.sin(2 * Math.PI * 0.45 * tr + i)} fill="#3B2718" stroke={INK} strokeWidth={5} />
            ) : strain ? (
              <g>
                <rect x={fx - 26} y={fy + 44} width={52} height={22} rx={8} fill="#FFF" stroke={INK} strokeWidth={6} />
                <line x1={fx - 24} x2={fx + 24} y1={fy + 55} y2={fy + 55} stroke={INK} strokeWidth={4} />
              </g>
            ) : (
              <path d={`M ${fx - 26} ${fy + 48} Q ${fx} ${fy + 78} ${fx + 26} ${fy + 48}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            )}
          </Spr>
        );
      })}
    </>
  );
};

// cobwebs between neighbouring pole tops ("for centuries"); blown off when the poles wake up
const Cobwebs: React.FC<{t: number}> = ({t}) => {
  const s = outPop(t, T.centuries, T.poles2, 0.3, 0.2);
  if (s <= 0.01) return null;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const x0 = POLE_X[i] + 28;
        const x1 = POLE_X[i + 1] - 28;
        const y = POLE_TOP + 10;
        const cx = (x0 + x1) / 2;
        const sc = s * (0.85 + 0.15 * rnd(i));
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${sc}) translate(${-cx} ${-y})`} opacity={0.95}>
            {[0, 0.33, 0.66, 1].map((f) => (
              <line key={f} x1={lerp(x0, x1, f)} y1={y} x2={cx} y2={y + 46} stroke="#F4F1EA" strokeWidth={4.5} />
            ))}
            {[0.4, 0.75].map((f) => (
              <path key={f} d={`M ${lerp(cx, x0, f)} ${lerp(y + 46, y, f)} Q ${cx} ${lerp(y + 46, y, f) + 10} ${lerp(cx, x1, f)} ${lerp(y + 46, y, f)}`} fill="none" stroke="#F4F1EA" strokeWidth={4.5} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// air bubbles fall down the hole and bounce off the mud; the last one squishes and pops on "air"
const BUB_R = 34;
const Bubbles: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  const floor = HOLE_BOTTOM - BUB_R - 4;
  for (let j = 0; j < 4; j++) {
    const t0 = 11.85 + j * 0.42;
    const last = j === 3;
    const tf = t0 + 0.42; // impact
    const tEnd = last ? T.air + 0.02 : tf + 0.75;
    if (t < t0 || t > tEnd) continue;
    const x0 = HOLE_X + (j % 2 ? 14 : -14);
    let x = x0;
    let y;
    let sx = 1;
    let sy = 1;
    let s = pop(t, t0, 0.18);
    if (t < tf) {
      const u = (t - t0) / (tf - t0);
      y = lerp(G - 260, floor, u * u);
    } else if (!last) {
      const v = t - tf;
      const sq = Math.exp(-14 * v) * Math.cos(2 * Math.PI * 4 * v);
      sy = 1 - 0.35 * Math.max(0, sq);
      sx = 1 + 0.3 * Math.max(0, sq);
      y = floor + BUB_R * (1 - sy) - 230 * easeOutCubic(prog(t, tf + 0.05, tf + 0.75));
      x = x0 + (j % 2 ? 1 : -1) * 110 * easeInCubic(prog(t, tf + 0.25, tf + 0.75));
      s *= 1 - easeInCubic(prog(t, tf + 0.5, tf + 0.75));
    } else {
      // keeps pushing into the mud: three squishes, each harder
      const v = t - tf;
      const push = 0.25 + 0.2 * Math.abs(Math.sin(2 * Math.PI * 2.2 * v));
      sy = 1 - push;
      sx = 1 + push * 0.9;
      y = floor + BUB_R * (1 - sy);
    }
    const face = (
      <g key={j} transform={`translate(${x} ${y}) scale(${s * sx} ${s * sy})`}>
        <circle r={BUB_R} fill="#CDEBFF" stroke={INK} strokeWidth={5} />
        <ellipse cx={-9} cy={-11} rx={6} ry={8} fill="#FFFFFF" />
        <text x={0} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#2B6CB0">
          AIR
        </text>
      </g>
    );
    out.push(face);
  }
  // pop burst on "air"
  const pu = prog(t, T.air, T.air + 0.3);
  if (pu > 0 && pu < 1) {
    out.push(
      <g key="burst" transform={`translate(${HOLE_X} ${floor + 8})`}>
        {Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r0 = 20 + 50 * pu;
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + 22 * (1 - pu))} y2={Math.sin(a) * (r0 + 22 * (1 - pu))} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
        })}
      </g>,
    );
  }
  return <g>{out}</g>;
};

// the fungus: pops up hungry, lunges at the pole on "rot", chokes on "can't", flops on "breathe"
const T_MUSH = T.fungi - 0.04;
const Fungus: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < T_MUSH || t > T_RISE0 + 0.1) return null;
  const s0 = 0.32;
  const appear = easeOutBack(prog(t, T_MUSH, T_MUSH + 0.3), 2.2);
  const gone = 1 - easeInCubic(prog(t, T_RISE0 - 0.25, T_RISE0));
  const lunge = t < T.cant ? 18 * bump(t, T.rot - 0.05, 0.3) + 6 * bump(t, T.wood + 0.12, 0.25) : 0;
  const choke = t > T.cant - 0.04;
  const flop = easeInCubic(prog(t, T.breathe + 0.05, T.breathe + 0.35));
  const rot = choke ? -6 * Math.sin(2 * Math.PI * 9 * tr) * (1 - flop) - 92 * flop : 4 * Math.sin(2 * Math.PI * 1.3 * tr);
  const blue = clamp((t - T.cant + 0.04) / 0.1);
  const sp = SPR.mush;
  const hx = sp.feet[0];
  const eyeY = 160;
  return (
    <>
      <Spr
        n="mush"
        x={MUSH.x + lunge}
        y={MUSH.y + 8 * flop}
        s={s0 * appear * gone}
        rot={rot}
        filter={blue > 0 ? `hue-rotate(${-170 * blue}deg) saturate(${1 + 0.6 * blue}) brightness(${1 - 0.1 * blue})` : undefined}
      >
        {choke ? (
          <>
            <Eye x={hx - 38} y={eyeY} r={22} open={1} squeeze side={-1} ink={0.22} />
            <Eye x={hx + 38} y={eyeY} r={22} open={1} squeeze side={1} ink={0.22} />
            <ellipse cx={hx} cy={eyeY + 52} rx={20} ry={14 + 4 * Math.sin(2 * Math.PI * 6 * tr)} fill="#3B2718" stroke={INK} strokeWidth={6} />
            <ellipse cx={hx + 6} cy={eyeY + 66} rx={10} ry={12} fill="#FC8D90" stroke={INK} strokeWidth={4} />
          </>
        ) : (
          <>
            <Eye x={hx - 38} y={eyeY} r={22} open={1} look={[0.9, -0.2]} side={-1} brow={0.75} browTilt={-1.0} ink={0.22} />
            <Eye x={hx + 38} y={eyeY} r={22} open={1} look={[0.9, -0.2]} side={1} brow={0.75} browTilt={-1.0} ink={0.22} />
            <path d={`M ${hx - 34} ${eyeY + 42} Q ${hx} ${eyeY + 90 + 14 * bump(t, T.rot - 0.05, 0.3)} ${hx + 34} ${eyeY + 42} Z`} fill="#3B2718" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d={`M ${hx - 22} ${eyeY + 46} L ${hx - 14} ${eyeY + 58} L ${hx - 6} ${eyeY + 47} M ${hx + 6} ${eyeY + 47} L ${hx + 14} ${eyeY + 58} L ${hx + 22} ${eyeY + 46}`} fill="#FFF" stroke={INK} strokeWidth={3} />
          </>
        )}
      </Spr>
    </>
  );
};

// ---------- the guy ----------
type Pose = 'thumb' | 'shock' | 'hero' | 'dig';
const POSES: [number, Pose][] = [
  [0, 'thumb'],
  [T.collapsed + 0.02, 'shock'],
  [T.blamed, 'hero'],
  [T.but + 0.04, 'dig'],
  [T.still, 'shock'],
  [17.0, 'thumb'],
];
const poseAt = (t: number): [Pose, number] => {
  let p: [Pose, number] = [POSES[0][1], -10];
  for (const [ts, n] of POSES) if (t >= ts) p = [n, ts];
  return p;
};
const nextSwap = (t: number) => POSES.map((p) => p[0]).find((ts) => ts > t + 1e-6) ?? 999;
const Guy: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const [n, ts] = poseAt(t);
  const nx = nextSwap(t);
  const [ax, ay] = t > nx - 0.08 ? squashSwap(t, nx) : squashSwap(t, ts);
  const sp = SPR[n];
  const s = HEAD_R / sp.head[2];
  // anchor: head x over GX, bottom on G (dig: the back foot on G, the blade goes into the ground)
  const footY = n === 'dig' ? 1290 : sp.feet[1];
  const headX = n === 'dig' ? sp.head[0] - 10 : sp.feet[0];
  let rot = 0;
  let dip = 0;
  if (n === 'dig') {
    for (const d of DIGS) {
      rot += -5 * bump(t, d - 0.1, 0.32);
      dip += 8 * bump(t, d - 0.05, 0.25);
    }
  }
  const trem = n === 'shock' ? 1.5 * Math.sin(2 * Math.PI * 13 * tr) : 0;
  const hop = n === 'thumb' && t < 3 ? 10 * bump(t, T.venice, 0.3) : 0;
  return (
    <div style={{position: 'absolute', left: GX + trem, top: G + dip - hop, transform: `rotate(${rot}deg) scale(${ax}, ${ay * breathe(tr)})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -headX * s, top: -footY * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Shadow: React.FC<{t: number}> = () => (
  <div style={{position: 'absolute', left: GX - 70, top: G - 10, width: 140, height: 20, borderRadius: '50%', background: 'rgba(72, 54, 42, 0.26)', filter: 'blur(3px)'}} />
);

// ---------- the world scene ----------
export const Scene: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => (
  <World cam={cam}>
    <Backdrop />
    <Svg>
      <Underground t={t} />
    </Svg>
    <Poles t={t} tr={tr} />
    <Svg>
      <Cobwebs t={t} />
      <Zzz x={POLE_X[1] + 30} y={POLE_TOP + 20} t={t} t0={T.stuck - 0.1} t1={T.poles2} size={58} />
      <Zzz x={POLE_X[3] + 30} y={POLE_TOP + 30} t={t} t0={T.stuck + 0.5} t1={T.poles2} size={50} />
      <Bubbles t={t} />
    </Svg>
    <Fungus t={t} tr={tr} />
    <Rubble t={t} />
    <Tower t={t} tr={tr} />
    <Bell t={t} />
    <Shadow t={t} />
    <Guy t={t} tr={tr} />
    <Svg>
      <Dirt t={t} />
      <Dust t={t} />
      <Poof x={TX} y={G - 80} t={t} t0={T_RISE0 - 0.05} R={190} />
      <Poof x={HOLE_X - 60} y={G - 30} t={t} t0={T_RISE0 - 0.12} R={110} />
      <Poof x={MUSH.x} y={MUSH.y - 30} t={t} t0={T_RISE0 - 0.3} R={60} fill="#EFE7D8" />
    </Svg>
  </World>
);

// the "1902" tag (screen space, top left), pops in on the year
const YearTag: React.FC<{t: number}> = ({t}) => {
  const s = outPop(t, T.y1902, 4.4, 0.3, 0.2);
  if (s <= 0.01) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(250 300) rotate(-6) scale(${s})`}>
        <rect x={-170} y={-78} width={340} height={156} rx={26} fill="#FFD23F" stroke={INK} strokeWidth={10} />
        <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={124} fill={INK}>
          1902
        </text>
      </g>
    </svg>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'rumble', at: 2.5, db: -30, keys: [[2.5, -34], [3.3, -22], [3.6, -40]], dur: 1.15},
  {f: 'rock_crack', at: T_DROP0 - 0.02, db: -17},
  {f: 'boom', at: 3.62, db: -11},
  {f: 'bell', at: 4.0, db: -21},
  {f: 'whoosh', at: 4.75, db: -29},
  {f: 'snore', at: 6.3, db: -31},
  {f: 'dig', at: T.dug - 0.03, db: -17},
  {f: 'dig', at: T.down - 0.03, db: -19},
  {f: 'dig', at: 9.47, db: -18},
  {f: 'boing', at: T.poles2, db: -26},
  {f: 'pop', at: T.holding, db: -20},
  {f: 'whoosh', at: 11.45, db: -31},
  {f: 'boing', at: 12.27, db: -27, rate: 1.4},
  {f: 'boing', at: 12.69, db: -28, rate: 1.55},
  {f: 'boing', at: 13.11, db: -28, rate: 1.3},
  {f: 'pop', at: T.air, db: -16},
  {f: 'dustplop', at: T_MUSH, db: -20},
  {f: 'munch', at: T.rot - 0.05, db: -22},
  {f: 'choke', at: T.cant - 0.04, db: -19},
  {f: 'whoosh', at: 16.9, db: -28},
  {f: 'boing', at: T_RISE0 + 0.05, db: -22, rate: 0.85},
];

export const VenicePilesShort: React.FC = () => {
  useVpFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cam = camFor(t);
  let amp = 0;
  amp += t > T.bell && t < T_DROP0 ? 2.5 * prog(t, T.bell, T_DROP0) : 0;
  amp += t > 3.62 && t < 4.6 ? 22 * Math.exp(-6 * (t - 3.62)) : 0;
  amp += t > 4.0 && t < 4.5 ? 4 * Math.exp(-9 * (t - 4.0)) : 0;
  for (const d of DIGS) amp += t > d && t < d + 0.4 ? 3 * Math.exp(-12 * (t - d)) : 0;
  amp += t > T_RISE1 - 0.05 && t < T_RISE1 + 0.4 ? 5 * Math.exp(-10 * (t - T_RISE1 + 0.05)) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <YearTag t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('venice-piles/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="venice-piles/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

