import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {C_RAMP, C_STUCK, C_TOP, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as MH_DURATION, FPS as MH_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did Easter Island's statues get their 12-ton hats?" - sequel of moai-walk. The islanders want to crown their stone
// giant (a dashed ghost hat on his head; the giant opens his eyes). A 12 TONS tag slams onto the red stone hat. BUT: the guy
// strains, a crane in a thought bubble gets a red X. LUCKY: the hat tips over - it is a wheel - and rolls at him; light bulb.
// SO (cut): a dirt ramp rises against the giant, the hat rolls in, three islanders on top loop a rope around it (parbuckle):
// the free end moves twice as far as the hat (rope marks), a 1/2 badge. ONE LAST SHOVE (cut): the guy rolls it onto the head,
// it teeters, tips and CLONKS down - the giant squeezes > < and grins. ONE HAT (cut): another giant, no hat, sad eyes; the
// camera glides down his ramp to his hat still sitting at the bottom (cobweb, grass) and the guy shrugging.

const F = (n: string) => staticFile(`moai-hats/${n}.png`);
export const FONT = 'MHInter';
export const useMHFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.1;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8382E';
const ROPE = '#C9A46A';
const ROPE_SH = '#8E6A3A';
const DIRT = '#C9A16B';
const DIRT_SH = '#AD844F';
const STONE = '#A39A90';
const STONE_SH = '#857C73';
export const SKY = SPR.bg.cols.sky;
const GRASS = SPR.bg.cols.grass;

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  children,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w * s, height: sp.h * s}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
// world-space svg around a centre point
const Svg: React.FC<{children: React.ReactNode; cx?: number; cy?: number; r?: number}> = ({children, cx = 0, cy = 0, r = 6000}) => (
  <svg style={{position: 'absolute', left: cx - r, top: cy - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${cx - r} ${cy - r} ${2 * r} ${2 * r}`}>
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
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - w * 0.07,
      width: w,
      height: w * 0.14,
      borderRadius: '50%',
      background: `rgba(72, 54, 42, ${0.26 * o})`,
      filter: 'blur(3px)',
    }}
  />
);
// dust: a cluster of beige puffs that grow, drift and shrink away (never fade)
const dustPuffs = (t: number, t0: number, x: number, y: number, n: number, size: number, seed: number, spread = 1): Puff[] => {
  const u = (t - t0) / 0.75;
  if (u <= 0 || u >= 1) return [];
  const out: Puff[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI + (rnd(seed + i) - 0.5) * 0.4;
    const d = size * (0.4 + 1.3 * easeOutCubic(u)) * spread * (0.7 + 0.5 * rnd(seed + 9 + i));
    const r = size * 0.42 * (0.7 + 0.5 * rnd(seed + 20 + i)) * Math.sin(Math.PI * Math.min(1, u * 1.15));
    out.push({x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.45 - size * 0.25 * u, r: Math.max(0, r)});
  }
  return out;
};

// ======================================================================================================
// THE WORLD (side view, school-diagram style). 1 world px = 1 screen px at k = 1. The coast plate is a far layer.
// ======================================================================================================
const GROUND = 2000;
const AHU_TOP = 1880;
const MS = 1; // moai sprite scale
const MOAI_FX = SPR.moai.feet[0];
const MOAI_FY = SPR.moai.feet[1];
const SEAT_Y = AHU_TOP - (MOAI_FY - 16) * MS; // the flat top of the head
const SEAT_DX = (221 - MOAI_FX) * MS;
const EYE_N = {x: 221, y: 208, r: 23}; // in moai sprite px (eye hollows under the brow)
const EYE_F = {x: 357, y: 200, r: 15};
const HS = 0.512; // upright hat: body 645 px -> 330 world px
const DS = 0.583; // the hat on its side (round end): 566 px -> 330
const DISC_C = SPR.hat_disc.c;
const R = DISC_C[2] * DS; // 165
const RH = 92; // head radius of every pose (world px)
type Pose = 'hero' | 'lift' | 'pull' | 'shove' | 'fall' | 'aha' | 'shrug';
const poseS = (p: Pose) => RH / (S(p).hd as [number, number, number])[2];

// the ramp (relative to the moai x): a flat top level with the head + a 55 deg slope down to the ground
const LAND_Y = 520;
const LAND_X0 = 130;
const LAND_X1 = 1150;
const SLOPE = (55 * Math.PI) / 180;
const FOOT_X = LAND_X1 + (GROUND - LAND_Y) / Math.tan(SLOPE);
const SL = Math.hypot(FOOT_X - LAND_X1, GROUND - LAND_Y);
const U: [number, number] = [(LAND_X1 - FOOT_X) / SL, (LAND_Y - GROUND) / SL]; // up the slope
const NRM: [number, number] = [-U[1], U[0]]; // outward normal (up-right)

// coast plate (far layer)
const PS = 3.4;
const DEPTH_BG = 1.7;
const HOR_L = 1694;
const BG_TOP = HOR_L - SPR.bg.horizon * PS;
const Background: React.FC<{cam: Cam; bx: number; blur?: number}> = ({cam, bx, blur = 0}) => (
  <>
    <AbsoluteFill style={{background: SKY}} />
    <World cam={cam} depth={DEPTH_BG} blur={blur}>
      <div style={{position: 'absolute', left: bx - 12000, top: BG_TOP + SPR.bg.h * PS - 8, width: 24000, height: 12000, background: GRASS}} />
      <Img src={F('bg')} style={{position: 'absolute', left: bx - (SPR.bg.w * PS) / 2, top: BG_TOP, width: SPR.bg.w * PS, height: SPR.bg.h * PS}} />
    </World>
  </>
);

const Ahu: React.FC<{x: number}> = ({x}) => (
  <Svg cx={x} cy={1900} r={700}>
    <rect x={x - 300} y={AHU_TOP} width={600} height={GROUND - AHU_TOP + 10} rx={8} fill={STONE} stroke={INK} strokeWidth={8} />
    <rect x={x - 296} y={AHU_TOP + 4} width={70} height={GROUND - AHU_TOP} fill={STONE_SH} />
    {[-160, -20, 120].map((dx) => (
      <line key={dx} x1={x + dx} x2={x + dx} y1={AHU_TOP + 4} y2={AHU_TOP + 60} stroke={INK} strokeWidth={5} />
    ))}
    {[-90, 50, 190].map((dx) => (
      <line key={dx} x1={x + dx} x2={x + dx} y1={AHU_TOP + 60} y2={GROUND + 6} stroke={INK} strokeWidth={5} />
    ))}
    <line x1={x - 296} x2={x + 296} y1={AHU_TOP + 60} y2={AHU_TOP + 60} stroke={INK} strokeWidth={5} />
  </Svg>
);

type EyeSt = {open: number; look: [number, number]; lid: number; tilt: number; squeeze: boolean; big: number};
const EYES_SHUT: EyeSt = {open: 0, look: [0, 0], lid: 0, tilt: 0, squeeze: false, big: 1};
const Moai: React.FC<{x: number; eyes: EyeSt; sy?: number; sx?: number}> = ({x, eyes, sy = 1, sx = 1}) => (
  <>
    <Spr n="moai" x={x} y={AHU_TOP} s={MS} sx={sx} sy={sy}>
      {eyes.open > 0.001 ? (
        <g>
          <Eye x={EYE_N.x} y={EYE_N.y} r={EYE_N.r * eyes.big} open={eyes.open} look={eyes.look} lid={eyes.lid} lidTilt={eyes.tilt} squeeze={eyes.squeeze} side={1} brow={NaN} ink={0.17} />
          <Eye x={EYE_F.x} y={EYE_F.y} r={EYE_F.r * eyes.big} open={eyes.open} look={eyes.look} lid={eyes.lid} lidTilt={eyes.tilt} squeeze={eyes.squeeze} side={-1} brow={NaN} ink={0.2} />
        </g>
      ) : null}
    </Spr>
  </>
);
// eyes that look at a world point
const lookAt = (mx: number, px: number, py: number): [number, number] => {
  const ex = mx + (EYE_N.x - MOAI_FX) * MS;
  const ey = AHU_TOP - (MOAI_FY - EYE_N.y) * MS;
  const dx = px - ex;
  const dy = py - ey;
  const d = Math.hypot(dx, dy) || 1;
  return [clamp((dx / d) * 1.1, -1, 1), clamp((dy / d) * 1.1, -1, 1)];
};

const HatUp: React.FC<{x: number; y: number; sx?: number; sy?: number; rot?: number}> = ({x, y, sx = 1, sy = 1, rot = 0}) => (
  <Spr n="hat_up" x={x} y={y} s={HS} sx={sx} sy={sy} rot={rot} />
);
// the hat on its side: centre + rolling angle; optional squash about the bottom contact point
const HatDisc: React.FC<{cx: number; cy: number; rot?: number; sx?: number; sy?: number}> = ({cx, cy, rot = 0, sx = 1, sy = 1}) => (
  <div style={{position: 'absolute', left: cx, top: cy + R, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
    <Spr n="hat_disc" x={0} y={-R} s={DS} rot={rot} ax={DISC_C[0]} ay={DISC_C[1]} />
  </div>
);

const Guy: React.FC<{p: Pose; x: number; y?: number; sx?: number; sy?: number; rot?: number; flip?: boolean; shadow?: number}> = ({
  p,
  x,
  y = GROUND,
  sx = 1,
  sy = 1,
  rot = 0,
  flip = false,
  shadow = 1,
}) => {
  const sp = S(p);
  const s = poseS(p);
  return (
    <>
      {shadow > 0 ? <Shadow x={x} y={y} w={(sp.right - sp.left) * s * 0.8} o={shadow} /> : null}
      <Spr n={p} x={x} y={y} s={s} sx={(flip ? -1 : 1) * sx} sy={sy} rot={rot} />
    </>
  );
};

// the dirt ramp (behind the moai), relative to the moai x; `rise` 0..1 grows it from the ground
const Ramp: React.FC<{mx: number; rise?: number; old?: boolean}> = ({mx, rise = 1, old = false}) => {
  if (rise <= 0.001) return null;
  const pts: [number, number][] = [
    [mx + 96, GROUND + 8],
    [mx + 96, LAND_Y + 46],
    [mx + LAND_X0 - 6, LAND_Y],
    [mx + LAND_X1, LAND_Y],
    [mx + FOOT_X, GROUND + 8],
  ];
  const d = 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ') + ' Z';
  // strata lines parallel to the slope + a few stones
  const strata = [0.22, 0.45, 0.68].map((f) => {
    const off = f * 520;
    const a: [number, number] = [mx + LAND_X1 - NRM[0] * off, LAND_Y - NRM[1] * off];
    const b: [number, number] = [a[0] - U[0] * 2600, a[1] - U[1] * 2600];
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
  });
  const stones: [number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const sx = mx + 200 + rnd(i * 3.1) * (FOOT_X - 300);
    const sy = LAND_Y + 60 + rnd(i * 7.7) * (GROUND - LAND_Y - 90);
    // keep it inside the ramp (left of the slope line)
    const xSlope = mx + LAND_X1 + ((sy - LAND_Y) / (GROUND - LAND_Y)) * (FOOT_X - LAND_X1);
    if (sx < xSlope - 40) stones.push([sx, sy, 10 + 12 * rnd(i * 5.3)]);
  }
  const grass = old
    ? Array.from({length: 9}, (_, i) => {
        const f = 0.12 + i * 0.1;
        return [mx + LAND_X1 + (FOOT_X - LAND_X1) * f, LAND_Y + (GROUND - LAND_Y) * f] as [number, number];
      })
    : [];
  return (
    <Svg cx={mx + 1100} cy={1300} r={1700}>
      <g transform={`translate(0 ${GROUND}) scale(1 ${rise}) translate(0 ${-GROUND})`}>
        <clipPath id={`rampclip${mx}`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill={DIRT} />
        <g clipPath={`url(#rampclip${mx})`}>
          {strata.map((s, i) => (
            <path key={i} d={s} stroke={DIRT_SH} strokeWidth={26} fill="none" opacity={0.85} />
          ))}
          <rect x={mx + 90} y={LAND_Y} width={70} height={GROUND - LAND_Y + 10} fill={DIRT_SH} />
          {stones.map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={r * 1.3} ry={r} fill={i % 2 ? '#9A9087' : '#B3AA9F'} stroke={INK} strokeWidth={4} />
          ))}
        </g>
        <path d={d} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {grass.map(([x, y], i) => (
          <path
            key={i}
            d={`M ${x - 14} ${y + 2} q 4 -26 10 -30 M ${x} ${y + 2} q 2 -34 4 -40 M ${x + 10} ${y + 2} q 6 -22 14 -26`}
            stroke="#3E7A2E"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    </Svg>
  );
};

// disc centre along the parbuckle path: roll-in on the ground, up the slope, round the top corner
const S0 = 0.0476;
const D_IN = 348;
const D_SLOPE = (1 - S0) * SL;
const ARC_A0 = Math.atan2(NRM[1], NRM[0]); // -35 deg
const D_ARC = R * Math.abs(-Math.PI / 2 - ARC_A0);
const discAt = (mx: number, d: number): [number, number] => {
  const gy = GROUND - R;
  const x0 = mx + FOOT_X + 434; // start (off screen to the right)
  if (d <= D_IN) return [x0 - d, gy];
  const d2 = d - D_IN;
  if (d2 <= D_SLOPE) {
    const s = S0 + d2 / SL;
    const cx = mx + FOOT_X + U[0] * s * SL + NRM[0] * R;
    const cy = GROUND + U[1] * s * SL + NRM[1] * R;
    return [cx, cy];
  }
  const a = ARC_A0 + (-Math.PI / 2 - ARC_A0) * clamp((d2 - D_SLOPE) / D_ARC);
  return [mx + LAND_X1 + R * Math.cos(a), LAND_Y + R * Math.sin(a)];
};
// contact direction (from the centre to where the disc touches the ground / slope / corner)
const contactAng = (mx: number, d: number) => {
  if (d <= D_IN) return Math.PI / 2;
  const d2 = d - D_IN;
  if (d2 <= D_SLOPE) return Math.atan2(-NRM[1], -NRM[0]); // 145 deg
  const [cx, cy] = discAt(mx, d);
  return Math.atan2(LAND_Y - cy, mx + LAND_X1 - cx);
};

// the parbuckle rope: anchored at a stake on the ramp top, down under the hat, round its downhill side, back up to the pullers
const PULLERS = [260, 390, 520];
const STAKE_X = 170;
const handOf = (mx: number, fx: number): [number, number] => {
  const g = (SPR.pull as unknown as {grip: [number, number]}).grip;
  const s = poseS('pull');
  return [mx + fx + (g[0] - SPR.pull.feet[0]) * s, LAND_Y + (g[1] - SPR.pull.feet[1]) * s];
};
const ropeGeom = (mx: number, d: number) => {
  const [cx, cy] = discAt(mx, d);
  const rr = R + 5;
  const ac = contactAng(mx, d);
  const H = handOf(mx, PULLERS[2]);
  const al = Math.atan2(H[1] - cy, H[0] - cx);
  const dd = Math.hypot(H[0] - cx, H[1] - cy);
  const be = Math.acos(clamp(rr / dd, -1, 1));
  const c1 = al + be;
  const c2 = al - be;
  let at = Math.sin(c1) < Math.sin(c2) ? c1 : c2;
  while (ac - at <= 0) at -= 2 * Math.PI;
  while (ac - at > 2 * Math.PI) at += 2 * Math.PI;
  const large = ac - at > Math.PI ? 1 : 0;
  const p0: [number, number] = [cx + rr * Math.cos(ac), cy + rr * Math.sin(ac)];
  const p1: [number, number] = [cx + rr * Math.cos(at), cy + rr * Math.sin(at)];
  const onSlope = d > D_IN && d - D_IN <= D_SLOPE + 1;
  const corner: [number, number] = [mx + LAND_X1 - NRM[0] * 6, LAND_Y - 7];
  const stakeTop: [number, number] = [mx + STAKE_X, LAND_Y - 70];
  let fixed = `M ${stakeTop[0]} ${stakeTop[1]} L ${mx + STAKE_X + 14} ${LAND_Y - 7}`;
  if (d <= D_IN) fixed += ` L ${corner[0]} ${corner[1]} L ${mx + FOOT_X - 4} ${GROUND - 7} L ${p0[0]} ${p0[1]}`;
  else if (onSlope) fixed += ` L ${corner[0]} ${corner[1]} L ${p0[0]} ${p0[1]}`;
  else fixed += ` L ${p0[0]} ${p0[1]}`;
  const wrap = `M ${p0[0]} ${p0[1]} A ${rr} ${rr} 0 ${large} 0 ${p1[0]} ${p1[1]}`;
  const hands = PULLERS.map((fx) => handOf(mx, fx));
  const pulled = `M ${p1[0]} ${p1[1]} L ${hands[2][0]} ${hands[2][1]} L ${hands[1][0]} ${hands[1][1]} L ${hands[0][0]} ${hands[0][1]} L ${hands[0][0] - 70} ${hands[0][1] + 60}`;
  const mid: [number, number] = [(p1[0] + hands[2][0]) / 2, (p1[1] + hands[2][1]) / 2];
  return {fixed, wrap, pulled, mid};
};
const RopeDraw: React.FC<{g: ReturnType<typeof ropeGeom>; reveal: number; drift: number}> = ({g, reveal, drift}) => {
  if (reveal <= 0.001) return null;
  const L = 6000;
  const dash = reveal < 1 ? {strokeDasharray: `${L * reveal} ${L}`} : {};
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {[g.fixed, g.wrap, g.pulled].map((p, i) => (
        <path key={`o${i}`} d={p} stroke={INK} strokeWidth={17} {...dash} />
      ))}
      {[g.fixed, g.wrap, g.pulled].map((p, i) => (
        <path key={`f${i}`} d={p} stroke={ROPE} strokeWidth={9} {...dash} />
      ))}
      {reveal >= 1 ? <path d={g.pulled} stroke={ROPE_SH} strokeWidth={9} strokeDasharray="10 34" strokeDashoffset={-drift} /> : null}
      {reveal >= 1 ? <path d={g.wrap} stroke={ROPE_SH} strokeWidth={9} strokeDasharray="10 34" strokeDashoffset={-drift} /> : null}
    </g>
  );
};

// ======================================================================================================
// SHOT 1 - THE YARD: the giant without a hat, the hat on the grass, the guy
// ======================================================================================================
const HAT1_X = 520;
const GUY1_X = 880;
const CAM1: CamKey[] = [
  {t: 0, x: 330, y: 1290, k: 0.8},
  {t: 3.95, x: 380, y: 1270, k: 0.86},
  {t: 4.6, x: 545, y: 1462, k: 0.92},
  {t: 6.25, x: 550, y: 1462, k: 0.92},
  {t: 7.1, x: 640, y: 1458, k: 0.97},
  {t: C_RAMP, x: 655, y: 1452, k: 0.99},
];
const shake1 = (t: number) => {
  let a = 0;
  if (t > 2.92) a += 6 * Math.exp(-(t - 2.92) * 9);
  if (t > 6.28) a += 10 * Math.exp(-(t - 6.28) * 8);
  return a;
};
const yardEyes = (t: number): EyeSt => {
  if (t < 1.85) return EYES_SHUT;
  const open = pop(t, 1.85, 0.3);
  let look: [number, number] = [0.55, 0.45];
  if (t > 2.6) look = [lerp(0.55, 0.1, easeInOutCubic(prog(t, 2.6, 2.85))), lerp(0.45, -0.9, easeInOutCubic(prog(t, 2.6, 2.85)))];
  if (t > 3.55) look = [lerp(0.1, 0.65, easeInOutCubic(prog(t, 3.55, 3.8))), lerp(-0.9, 0.55, easeInOutCubic(prog(t, 3.55, 3.8)))];
  if (t > 6.4) look = [lerp(0.65, 0.85, prog(t, 6.4, 6.8)), 0.55];
  const blink = t > 5.5 && t < 5.66 ? Math.sin(Math.PI * prog(t, 5.5, 5.66)) : 0;
  const big = 1 + (t > 6.28 ? 0.18 * Math.exp(-(t - 6.28) * 3) : 0);
  return {open, look, lid: blink, tilt: 0, squeeze: false, big};
};
const GhostHat: React.FC<{s: number; mx: number}> = ({s, mx}) => {
  if (s <= 0.001) return null;
  const cx = mx + SEAT_DX;
  const by = SEAT_Y + 4;
  const w = 330;
  const hb = 170;
  const d = `M ${cx - w / 2} ${by - hb} L ${cx - w / 2} ${by - 14} Q ${cx - w / 2} ${by} ${cx - w / 2 + 16} ${by} L ${cx + w / 2 - 16} ${by} Q ${cx + w / 2} ${by} ${cx + w / 2} ${by - 14} L ${cx + w / 2} ${by - hb}`;
  return (
    <Svg cx={cx} cy={by - 120} r={400}>
      <g transform={`translate(${cx} ${by}) scale(${s}) translate(${-cx} ${-by})`}>
        <ellipse cx={cx} cy={by - hb} rx={w / 2} ry={30} fill="rgba(255,255,255,0.28)" />
        <path d={d + ' Z'} fill="rgba(255,255,255,0.28)" />
        <rect x={cx - 42} y={by - hb - 52} width={84} height={44} fill="rgba(255,255,255,0.28)" />
        {[0, 1].map((k) => (
          <g key={k} fill="none" stroke={k ? '#fff' : INK} strokeWidth={k ? 7 : 12} strokeDasharray={k ? '22 16' : undefined} strokeLinecap="round" opacity={k ? 1 : 0.35}>
            <path d={d} />
            <ellipse cx={cx} cy={by - hb} rx={w / 2} ry={30} />
            <path d={`M ${cx - 42} ${by - hb + 2} L ${cx - 42} ${by - hb - 52} L ${cx + 42} ${by - hb - 52} L ${cx + 42} ${by - hb + 2}`} />
          </g>
        ))}
      </g>
    </Svg>
  );
};
const TonTag: React.FC<{t: number}> = ({t}) => {
  if (t < 2.62) return null;
  const land = 2.92;
  const vis = t < T.lucky ? 1 : Math.max(0, 1 - easeInCubic(prog(t, T.lucky, T.lucky + 0.18)));
  if (vis <= 0.001) return null;
  const fall = easeInCubic(prog(t, 2.62, land));
  const x = HAT1_X + 30;
  const y = lerp(GROUND - 1250, GROUND - 120, fall);
  const sq = t > land ? 1 + 0.12 * spring(t - land, 3, 6) : 1;
  return (
    <Svg cx={x} cy={y} r={300}>
      <g transform={`translate(${x} ${y}) rotate(-7) scale(${vis * sq} ${vis / sq})`}>
        <rect x={-136} y={-48} width={272} height={96} rx={18} fill="#FFF7E0" stroke={INK} strokeWidth={8} />
        <circle cx={-112} cy={0} r={9} fill={SKY} stroke={INK} strokeWidth={5} />
        <Txt x={14} y={0} size={46} text="12 TONS" fill={INK} stroke="none" sw={0} />
      </g>
    </Svg>
  );
};
const CraneBubble: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const s = popOut(t, 4.98, 5.86, 0.28);
  if (s <= 0.001) return null;
  const puffs: Puff[] = [
    {x: 0, y: 0, r: 120},
    {x: -105, y: 18, r: 82},
    {x: 108, y: 16, r: 86},
    {x: -50, y: -78, r: 80},
    {x: 62, y: -74, r: 84},
    {x: 0, y: 72, r: 80},
  ];
  const xs = pop(t, 5.32, 0.22);
  return (
    <Svg cx={x} cy={y} r={500}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <PuffCluster puffs={[{x: 120, y: 190, r: 18}, {x: 150, y: 245, r: 12}]} fill="#fff" ink={6} />
        <PuffCluster puffs={puffs} fill="#fff" ink={7} />
        {/* a little yellow tower crane */}
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" transform="scale(1.18)">
          <rect x={-22} y={-60} width={26} height={150} fill="#F6C431" />
          <rect x={-100} y={-82} width={190} height={22} fill="#F6C431" />
          <rect x={-40} y={-60} width={48} height={34} fill="#E89B1D" />
          <line x1={62} y1={-60} x2={62} y2={10} fill="none" />
          <path d="M 52 10 q 10 18 20 0" fill="none" />
          <rect x={-46} y={88} width={74} height={14} fill="#888" />
        </g>
        {xs > 0.001 ? (
          <g transform={`scale(${xs})`} strokeLinecap="round">
            <path d="M -95 -95 L 95 95 M 95 -95 L -95 95" stroke={INK} strokeWidth={42} />
            <path d="M -95 -95 L 95 95 M 95 -95 L -95 95" stroke={RED} strokeWidth={26} />
          </g>
        ) : null}
      </g>
    </Svg>
  );
};
const Bulb: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const s = pop(t, T.round, 0.3);
  if (s <= 0.001) return null;
  const glow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * (t - T.round));
  return (
    <Svg cx={x} cy={y} r={300}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {Array.from({length: 7}, (_, i) => {
          const a = -Math.PI / 2 + ((i - 3) / 3) * 1.25;
          const r0 = 70 + 6 * glow;
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 - 6} x2={Math.cos(a) * (r0 + 34)} y2={Math.sin(a) * (r0 + 34) - 6} stroke={YEL} strokeWidth={10} strokeLinecap="round" />;
        })}
        <circle cx={0} cy={-6} r={48} fill={YEL} stroke={INK} strokeWidth={7} />
        <rect x={-22} y={36} width={44} height={30} rx={6} fill="#B9B9B9" stroke={INK} strokeWidth={6} />
        <path d="M -12 -2 q 12 -24 24 0" stroke={INK} strokeWidth={5} fill="none" />
        <ellipse cx={-18} cy={-24} rx={9} ry={14} fill="#fff" />
      </g>
    </Svg>
  );
};

export const YardScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camIn, cover = false}) => {
  const base = camIn ?? camAt(t, CAM1);
  const sh = shake(t, shake1(t));
  const cam: Cam = {x: base.x - sh.x / base.k, y: base.y - sh.y / base.k, k: base.k};
  const mx = 0;
  // the hat: upright until "Lucky", tips toward the camera, comes up as a wheel, rolls at the guy
  const TIP0 = T.lucky;
  const TIP1 = T.lucky + 0.2;
  const rollX = HAT1_X + 170 * easeOutCubic(prog(t, 6.4, 7.05));
  const rollRot = ((rollX - HAT1_X) / R) * (180 / Math.PI);
  const wob = t > 7.05 ? 2.5 * spring(t - 7.05, 2.2, 3) : 0;
  let hat: React.ReactNode;
  if (cover) {
    hat = <HatUp x={mx + SEAT_DX} y={SEAT_Y + 6} />;
  } else if (t < TIP0) {
    const strain = t > 4.3 && t < TIP0 ? 1 : 0;
    const wr = strain * 1.2 * Math.sin(2 * Math.PI * 6 * t);
    const up = strain * Math.max(0, 4 * Math.sin(2 * Math.PI * 1.6 * (t - 4.3)));
    const land = t > 2.92 ? 1 - 0.05 * spring(t - 2.92, 3, 6) : 1;
    hat = <HatUp x={HAT1_X} y={GROUND - up} rot={wr} sy={land} sx={2 - land} />;
  } else if (t < TIP1) {
    hat = <HatUp x={HAT1_X} y={GROUND} sy={lerp(1, 0.08, easeInCubic(prog(t, TIP0, TIP1)))} sx={1.04} />;
  } else {
    const sy = t < TIP1 + 0.5 ? lerp(0.08, 1, easeOutCubic(prog(t, TIP1, TIP1 + 0.12))) * (1 + 0.07 * spring(t - TIP1 - 0.12, 3.4, 6)) : 1;
    hat = <HatDisc cx={rollX} cy={GROUND - R} rot={rollRot + wob} sy={sy} sx={2 - sy} />;
  }
  // the guy
  let guy: React.ReactNode;
  if (t < T.but || cover) {
    const [sx, sy] = [1, breathe(t)];
    const hop = t > 2.92 && t < 3.4 ? 26 * Math.sin(Math.PI * prog(t, 2.92, 3.4)) : 0;
    const bob = t > T.crown && t < T.crown + 0.4 ? 10 * Math.sin(Math.PI * prog(t, T.crown, T.crown + 0.4)) : 0;
    guy = <Guy p="hero" x={cover ? 650 : GUY1_X} y={GROUND - hop - bob} sx={sx} sy={sy} shadow={1 - hop / 60} />;
  } else if (t < 6.5) {
    const [sx, sy] = squashSwap(t, T.but);
    const tr = t > 4.32 && t < TIP0 ? 1.6 * Math.sin(2 * Math.PI * 17 * t) : 0;
    const heave = t > TIP0 - 0.1 && t < TIP0 + 0.3 ? 0.05 * Math.sin(Math.PI * prog(t, TIP0 - 0.1, TIP0 + 0.3)) : 0;
    guy = <Guy p="lift" x={885 + tr} sx={sx * (1 - heave)} sy={sy * (1 + heave)} />;
  } else if (t < T.round) {
    const [sx, sy] = squashSwap(t, 6.5);
    const lean = -3 - 4 * easeOutCubic(prog(t, 6.5, 6.9));
    guy = <Guy p="fall" x={lerp(900, 960, easeOutCubic(prog(t, 6.5, 6.85)))} sx={sx} sy={sy} rot={lean} />;
  } else {
    const [sx, sy] = squashSwap(t, T.round);
    guy = <Guy p="aha" x={960} sx={sx} sy={sy * breathe(t, 1)} />;
  }
  const sweat = t > 4.62 && t < 6.2 ? popOut(t, 4.62, 6.0, 0.2) : 0;
  const ahaHead = (() => {
    const sp = S('aha');
    const s = poseS('aha');
    return [960 + ((sp.hd as number[])[0] - sp.feet[0]) * s, GROUND - (sp.feet[1] - (sp.hd as number[])[1]) * s] as [number, number];
  })();
  const dust: Puff[] = [
    ...dustPuffs(t, 2.92, HAT1_X + 60, GROUND - 10, 6, 70, 3),
    ...dustPuffs(t, TIP1 + 0.02, HAT1_X, GROUND - 4, 9, 110, 11, 1.2),
    ...dustPuffs(t, 6.45, HAT1_X + 120, GROUND - 4, 5, 60, 21),
  ];
  return (
    <AbsoluteFill>
      <Background cam={cam} bx={500} />
      <World cam={cam}>
        <Shadow x={mx} y={GROUND} w={640} o={0.7} />
        <Ahu x={mx} />
        <Moai x={mx} eyes={cover ? {open: 1, look: [0.55, 0.5], lid: 0, tilt: 0, squeeze: false, big: 1} : yardEyes(t)} />
        {cover ? null : <GhostHat s={popOut(t, T.crown, T.but, 0.3) * (1 + 0.08 * Math.sin(Math.PI * clamp((t - T.hat) / 0.35)))} mx={mx} />}
        {cover ? null : <Shadow x={t < TIP1 ? HAT1_X : rollX} y={GROUND} w={330} o={0.9} />}
        {hat}
        {cover ? null : <TonTag t={t} />}
        {guy}
        <Svg cx={700} cy={1700} r={900}>
          <PuffCluster puffs={dust} fill="#E7D7B5" ink={5} />
          {sweat > 0 ? <SweatDrop x={985} y={1665 + 30 * prog(t, 4.62, 6.0)} r={20} s={sweat} rot={15} /> : null}
        </Svg>
        {cover ? null : <CraneBubble t={t} x={740} y={1290} />}
        {cover ? null : <Bulb t={t} x={ahaHead[0] - 10} y={ahaHead[1] - RH - 120} />}
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 2 - THE RAMP: the ramp rises, the hat rolls in, the rope, the pull
// ======================================================================================================
const CAM2: CamKey[] = [
  {t: C_RAMP, x: 330, y: 980, k: 0.74},
  {t: 9.2, x: 1150, y: 1080, k: 0.4, ease: 'out'},
  {t: 11.3, x: 1150, y: 1075, k: 0.41},
  {t: 12.95, x: 770, y: 640, k: 0.6},
  {t: C_TOP, x: 765, y: 636, k: 0.61},
];
const PULL0 = 11.3;
const PULL1 = 12.9;
// a heavy, steady haul: short ease in / out, linear middle (continuous speed)
const haul = (u: number, a = 0.18) => {
  const v = clamp(u);
  if (v < a) return (v * v) / (2 * a * (1 - a));
  if (v > 1 - a) return 1 - ((1 - v) * (1 - v)) / (2 * a * (1 - a));
  return (v - a / 2) / (1 - a);
};
const discDist2 = (t: number) => {
  let d = 0;
  if (t > T.roll) d = D_IN * easeOutCubic(prog(t, T.roll, T.ramp + 0.05));
  if (t > PULL0) {
    const u = prog(t, PULL0, PULL1);
    const tug = u + 0.02 * Math.sin(2 * Math.PI * 4 * u) * Math.sin(Math.PI * u);
    d = D_IN + (D_SLOPE + D_ARC) * haul(tug);
  }
  return d;
};
const RampScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM2);
  const mx = 0;
  const rise = t < 8.4 ? 0 : clamp(easeOutCubic(prog(t, 8.4, 9.05)) * (1 + 0.04 * Math.sin(Math.PI * prog(t, 8.8, 9.15))), 0, 1.04);
  const d = discDist2(t);
  const [cx, cy] = discAt(mx, d);
  const rot = (-d / R) * (180 / Math.PI);
  const g = ropeGeom(mx, Math.max(d, D_IN));
  const reveal = easeInOutCubic(prog(t, 10.5, 11.25));
  const drift = 2 * Math.max(0, d - D_IN);
  const pullW = clamp((t - PULL0) / 0.2) * (1 - clamp((t - PULL1) / 0.3));
  const eyes: EyeSt = {open: 1, look: lookAt(mx, cx, cy), lid: 0, tilt: 0, squeeze: false, big: 1.25};
  const badge = popOut(t, T.halves, C_TOP + 1, 0.3);
  const dust: Puff[] = [
    ...dustPuffs(t, 8.55, mx + 700, GROUND - 6, 7, 170, 31, 1.3),
    ...dustPuffs(t, 8.75, mx + 1500, GROUND - 6, 7, 170, 41, 1.3),
  ];
  return (
    <AbsoluteFill>
      <Background cam={cam} bx={1100} />
      <World cam={cam}>
        <Ramp mx={mx} rise={rise} />
        <Shadow x={mx} y={GROUND} w={640} o={0.7} />
        <Ahu x={mx} />
        <Moai x={mx} eyes={eyes} />
        {PULLERS.map((fx, i) => {
          const s = pop(t, 10.36 + 0.07 * i, 0.3);
          if (s <= 0.001) return null;
          const lean = -2 + pullW * (-2 - 3 * Math.sin(2 * Math.PI * 2 * (t - PULL0) + i * 0.5));
          return <Guy key={fx} p="pull" x={mx + fx} y={LAND_Y} sx={s} sy={s * breathe(t, i)} rot={lean} shadow={0.8} />;
        })}
        {d > 0 ? <Shadow x={cx} y={cy + R} w={300} o={d <= D_IN ? 0.9 : 0} /> : null}
        {t > T.roll - 0.05 ? <HatDisc cx={cx} cy={cy} rot={rot} /> : null}
        <Svg cx={1200} cy={1200} r={2200}>
          <RopeDraw g={g} reveal={reveal} drift={drift} />
          <PuffCluster puffs={dust} fill="#E7D7B5" ink={6} />
          {badge > 0.001 ? (
            <g transform={`translate(${mx + 830} ${LAND_Y - 470}) scale(${badge})`}>
              <circle cx={0} cy={0} r={150} fill={YEL} stroke={INK} strokeWidth={14} />
              <Txt x={0} y={-4} size={190} text="½" fill={INK} stroke="none" sw={0} />
              <Txt x={0} y={225} size={120} text="PULL" fill="#fff" stroke={INK} sw={0.24} />
            </g>
          ) : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 3 - THE LANDING: one last shove, it rolls onto the head, teeters, tips and CLONKS down
// ======================================================================================================
const CAM3: CamKey[] = [
  {t: C_TOP, x: 500, y: 650, k: 0.75},
  {t: 14.2, x: 495, y: 646, k: 0.77},
  {t: 14.78, x: 40, y: 640, k: 1.0},
  {t: C_STUCK, x: 28, y: 630, k: 1.03},
];
const DISC3_X = 700;
const SHOVE_X = DISC3_X + 387;
const ROLL_T0 = T.shove + 0.04;
const ROLL_T1 = 14.3;
const TEETER = T.flops;
const TIPT = 14.66;
const SWAPT = 14.84;
const LANDT = T.head;
const LandingScene: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, CAM3);
  const amp = t > LANDT ? 16 * Math.exp(-(t - LANDT) * 7) : 0;
  const sh = shake(t, amp);
  const cam: Cam = {x: base.x - sh.x / base.k, y: base.y - sh.y / base.k, k: base.k};
  const mx = 0;
  const seatX = mx + SEAT_DX;
  // disc: on the landing -> rolls onto the head (16 px lower)
  const u = easeOutCubic(prog(t, ROLL_T0, ROLL_T1));
  const dx = lerp(mx + DISC3_X, seatX, u);
  const dy = lerp(LAND_Y - R, SEAT_Y - R, clamp((mx + 200 - dx) / 140));
  const rot = ((dx - (mx + DISC3_X)) / R) * (180 / Math.PI);
  let hat: React.ReactNode;
  if (t < TIPT) {
    const tw = t > TEETER ? 7 * Math.sin(2 * Math.PI * 3.2 * (t - TEETER)) * (1 - prog(t, TEETER, TIPT) * 0.3) : 0;
    hat = <HatDisc cx={dx} cy={dy} rot={rot + tw} />;
  } else if (t < SWAPT) {
    const sy = lerp(1, 0.08, easeInCubic(prog(t, TIPT, SWAPT)));
    hat = <HatDisc cx={dx} cy={dy} rot={rot} sy={sy} sx={1 + 0.06 * (1 - sy)} />;
  } else {
    // the upright hat drops from just above onto the seat, lands on "head"
    const f = easeInCubic(prog(t, SWAPT, LANDT));
    const by = lerp(SEAT_Y - 120, SEAT_Y + 6, f);
    const grow = lerp(0.35, 1, easeOutCubic(prog(t, SWAPT, SWAPT + 0.16)));
    const sq = t > LANDT ? 0.16 * spring(t - LANDT, 3.2, 5) : 0;
    hat = <HatUp x={seatX} y={t > LANDT ? SEAT_Y + 6 : by} sy={grow * (1 - sq)} sx={1 + sq * 0.8} />;
  }
  // the moai: squashes a little under the hit; eyes follow the hat, squeeze, then grin
  const msq = t > LANDT ? 0.025 * spring(t - LANDT, 3, 5) : 0;
  let eyes: EyeSt = {open: 1, look: lookAt(mx, dx, dy), lid: 0, tilt: 0, squeeze: false, big: 1.2};
  if (t > TEETER) eyes = {...eyes, look: [0.15, -1], big: 1.3};
  if (t > LANDT && t < LANDT + 0.38) eyes = {...eyes, squeeze: true, big: 1.35};
  if (t >= LANDT + 0.38) eyes = {open: 1, look: [0.1, -0.85], lid: 0.32, tilt: 0, squeeze: false, big: 1.25};
  // the guy: anticipation, shove, then stands up happy (hero) and watches
  let guy: React.ReactNode;
  if (t < 14.25) {
    const ant = t > 13.2 && t < T.shove ? easeInOutCubic(prog(t, 13.2, T.shove)) : 0;
    const push = t >= T.shove ? spring(t - T.shove, 2.6, 5) : 0;
    const gx = mx + SHOVE_X + 30 * ant - 60 * easeOutCubic(prog(t, T.shove, T.shove + 0.3));
    guy = <Guy p="shove" x={gx} y={LAND_Y} sx={1 + 0.05 * ant - 0.04 * push} sy={1 - 0.06 * ant + 0.05 * push} />;
  } else {
    const [sx, sy] = squashSwap(t, 14.25);
    const hop = t > LANDT + 0.05 && t < LANDT + 0.45 ? 30 * Math.sin(Math.PI * prog(t, LANDT + 0.05, LANDT + 0.45)) : 0;
    guy = <Guy p="hero" x={mx + SHOVE_X - 60} y={LAND_Y - hop} sx={sx} sy={sy * breathe(t)} />;
  }
  const dust: Puff[] = [...dustPuffs(t, LANDT, seatX - 150, SEAT_Y + 2, 5, 80, 51), ...dustPuffs(t, LANDT, seatX + 150, SEAT_Y + 2, 5, 80, 61)];
  const sparkle = t > LANDT + 0.3 ? pop(t, LANDT + 0.3, 0.25) * (1 - prog(t, LANDT + 0.5, C_STUCK) * 0.3) : 0;
  return (
    <AbsoluteFill>
      <Background cam={cam} bx={600} blur={t > 14.5 ? 2.5 : 0} />
      <World cam={cam}>
        <Ramp mx={mx} />
        <Ahu x={mx} />
        <Moai x={mx} eyes={eyes} sy={1 - msq} sx={1 + msq} />
        {hat}
        {guy}
        <Svg cx={seatX} cy={SEAT_Y} r={900}>
          <PuffCluster puffs={dust} fill="#E7D7B5" ink={5} />
          {sparkle > 0.001
            ? [
                [seatX - 230, SEAT_Y - 230, 1],
                [seatX + 215, SEAT_Y - 170, 0.8],
                [seatX + 40, SEAT_Y - 300, 0.65],
              ].map(([x, y, s], i) => {
                const tw = 0.75 + 0.25 * Math.sin(2 * Math.PI * 2.5 * t + i);
                const r = 22 * s * sparkle * tw;
                return (
                  <path
                    key={i}
                    d={`M ${x} ${y - r * 2} L ${x + r * 0.45} ${y - r * 0.45} L ${x + r * 2} ${y} L ${x + r * 0.45} ${y + r * 0.45} L ${x} ${y + r * 2} L ${x - r * 0.45} ${y + r * 0.45} L ${x - r * 2} ${y} L ${x - r * 0.45} ${y - r * 0.45} Z`}
                    fill={YEL}
                    stroke={INK}
                    strokeWidth={5}
                    strokeLinejoin="round"
                  />
                );
              })
            : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 4 - ONE HAT NEVER MADE IT: another giant, no hat; his hat still at the bottom of his ramp
// ======================================================================================================
const MX2 = 8000;
const STUCK_X = MX2 + FOOT_X + 130;
const GUY4_X = MX2 + FOOT_X + 434;
const CAM4: CamKey[] = [
  {t: C_STUCK, x: 8040, y: 760, k: 0.8},
  {t: 16.9, x: 8050, y: 770, k: 0.82},
  {t: 18.25, x: 10300, y: 1150, k: 0.62},
  {t: DURATION, x: 10312, y: 1172, k: 0.67},
];
const Cobweb: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  // a little web in the corner between the stuck hat and the ramp
  const spokes = [0, 1, 2, 3, 4].map((i) => (-Math.PI * 0.95 * i) / 4 - Math.PI * 0.03);
  const ring = (r: number) => spokes.map((a, i) => `${i ? 'L' : 'M'} ${x + Math.cos(a) * r} ${y + Math.sin(a) * r}`).join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`} stroke="#F4F4F4" strokeWidth={4} fill="none" opacity={0.95}>
      {spokes.map((a, i) => (
        <line key={i} x1={x} y1={y} x2={x + Math.cos(a) * 120} y2={y + Math.sin(a) * 120} />
      ))}
      {[40, 75, 110].map((r) => (
        <path key={r} d={ring(r)} />
      ))}
    </g>
  );
};
const StuckScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM4);
  const blink = t > 17.62 && t < 17.78 ? Math.sin(Math.PI * prog(t, 17.62, 17.78)) : 0;
  const droop = 0.3 + 0.2 * easeOutCubic(prog(t, T.though, T.though + 0.3));
  const eyes: EyeSt = {open: 1, look: [0.7, 0.72], lid: Math.max(droop, blink), tilt: -16, squeeze: false, big: 1.35};
  const sweat = popOut(t, 16.4, DURATION + 1, 0.25);
  const sw = MX2 + (EYE_F.x - MOAI_FX) * MS + 70;
  const swY = AHU_TOP - (MOAI_FY - EYE_F.y) * MS - 120 + 40 * prog(t, 16.4, 19.5);
  const [sx, sy] = squashSwap(t, C_STUCK + 0.02);
  const bounce = t > T.still && t < T.still + 0.4 ? 18 * Math.sin(Math.PI * prog(t, T.still, T.still + 0.4)) : 0;
  return (
    <AbsoluteFill>
      <Background cam={cam} bx={9300} />
      <World cam={cam}>
        <Ramp mx={MX2} old />
        <Shadow x={MX2} y={GROUND} w={640} o={0.7} />
        <Ahu x={MX2} />
        <Moai x={MX2} eyes={eyes} />
        <GhostHat s={pop(t, C_STUCK + 0.15, 0.3) * (t < T.though ? 1 : Math.max(0, 1 - easeInCubic(prog(t, T.though, T.though + 0.45))))} mx={MX2} />
        <Shadow x={STUCK_X} y={GROUND} w={330} o={0.9} />
        <HatDisc cx={STUCK_X} cy={GROUND - R} rot={38 + (t > 18.92 ? 4 * spring(t - 18.92, 2.4, 3.2) : 0)} />
        <Svg cx={STUCK_X} cy={GROUND - 200} r={900}>
          <Cobweb x={STUCK_X - R * 0.72} y={GROUND - R * 0.25} s={1} />
          {[-120, -40, 60, 140].map((dx, i) => {
            const x = STUCK_X + dx;
            return <path key={i} d={`M ${x - 16} ${GROUND + 4} q 4 -34 12 -40 M ${x} ${GROUND + 4} q 2 -46 6 -54 M ${x + 14} ${GROUND + 4} q 8 -30 18 -34`} stroke="#3E7A2E" strokeWidth={7} fill="none" strokeLinecap="round" />;
          })}
        </Svg>
        <Guy p="shrug" x={GUY4_X} y={GROUND - bounce} sx={sx} sy={sy * breathe(t)} />
        <Svg cx={sw} cy={swY} r={300}>
          {sweat > 0 ? <SweatDrop x={sw} y={swY} r={30} s={sweat} rot={-10} /> : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// sound cues (library + new ElevenLabs sfx) and the composition
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'beach_bed', at: 0, db: -31},
  {f: 'beach_bed', at: 5.9, db: -31},
  {f: 'beach_bed', at: 11.8, db: -31},
  {f: 'beach_bed', at: 17.7, db: -31, keys: [[17.7, -31], [19.3, -31], [19.95, -70]]},
  {f: 'twinkle', at: T.crown, db: -24},
  {f: 'pop', at: 1.86, db: -21},
  {f: 'stamp', at: 2.9, db: -15},
  {f: 'rubber_stretch', at: 4.32, db: -22},
  {f: 'pop', at: 4.98, db: -23},
  {f: 'crane', at: 5.0, db: -31, dur: 0.6, keys: [[5.0, -31], [5.45, -31], [5.6, -60]]},
  {f: 'buzzer', at: 5.3, db: -21},
  {f: 'pop', at: 5.86, db: -27},
  {f: 'stone_step', at: 6.26, db: -15},
  {f: 'dustplop', at: 6.3, db: -21},
  {f: 'stone_roll', at: 6.38, db: -21, dur: 0.85, keys: [[6.38, -21], [6.95, -21], [7.2, -60]]},
  {f: 'flop', at: 6.58, db: -21},
  {f: 'magic', at: 7.52, db: -23},
  {f: 'whoosh', at: C_RAMP - 0.05, db: -29},
  {f: 'dirt_dump', at: 8.42, db: -16},
  {f: 'dirt_dump', at: 8.74, db: -19},
  {f: 'stone_roll', at: T.roll, db: -19, dur: 0.75, keys: [[T.roll, -19], [9.9, -19], [10.12, -60]]},
  {f: 'rope', at: 10.68, db: -21},
  {f: 'stone_roll', at: PULL0, db: -21},
  {f: 'rope_creak', at: 11.55, db: -24},
  {f: 'pop', at: T.halves, db: -21},
  {f: 'rope_creak', at: 12.1, db: -24},
  {f: 'rope_creak', at: 12.62, db: -25},
  {f: 'whoosh', at: C_TOP - 0.05, db: -30},
  {f: 'stone_roll', at: ROLL_T0, db: -20, dur: 0.8, keys: [[ROLL_T0, -20], [14.15, -20], [14.36, -60]]},
  {f: 'gulp', at: 14.42, db: -24},
  {f: 'hat_clonk', at: LANDT, db: -10},
  {f: 'dustplop', at: LANDT + 0.02, db: -20},
  {f: 'twinkle', at: LANDT + 0.3, db: -25},
  {f: 'whoosh', at: C_STUCK - 0.05, db: -27},
  {f: 'sad_horn', at: 17.02, db: -18},
  {f: 'crickets', at: 17.76, db: -22, keys: [[17.76, -22], [19.2, -22], [19.9, -60]]},
];

export const MoaiHatsShort: React.FC = () => {
  useMHFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < C_RAMP) scene = <YardScene t={t} />;
  else if (t < C_TOP) scene = <RampScene t={t} />;
  else if (t < C_STUCK) scene = <LandingScene t={t} />;
  else scene = <StuckScene t={t} />;
  return (
    <AbsoluteFill style={{background: SKY}}>
      {scene}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('moai-hats/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('moai-hats/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="moai-hats/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const MH_TOTAL = Math.round(DURATION * FPS);
