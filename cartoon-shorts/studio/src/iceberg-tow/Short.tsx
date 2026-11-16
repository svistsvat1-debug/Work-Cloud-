import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_E, CUT_F, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as IT_DURATION, FPS as IT_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we just tow icebergs to deserts?" - a side-view sea cutaway (surface y = 0).
// S1 open sea: the guy tows an iceberg (with a face) behind his tugboat toward Dubai on the horizon; "But": the water
//    turns see-through and shows the huge hidden bulk; it drags like an anchor, a duck overtakes; a calendar flips
//    months, the warm sea's little mouths nibble the iceberg from below and it shrinks.
// S2: a 2 km iceberg grows out of it, twenty tugs pop in, horns.
// S3 shore: the iceberg's keel hits the rising sea floor far from the beach; the guy pulls from the beach in vain;
//    it melts away into the sea while he holds an empty glass.

const F = (n: string) => staticFile(`iceberg-tow/${n}.png`);
export const FONT = 'ITInter';
export const useITFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const SKY = '#72C5FD';
const SEA_FAR = '#288ADB';
const TEXT_YEL = '#FFD23F';
const SAND = '#F4CF7A';
const SAND_D = '#D9A94E';

// ---------- world ----------
const ICE_S = 1300 / 1367; // iceberg sprite -> world at melt scale 1
const ICE_AX = 465; // sprite anchor = the waterline point
const ICE_AY = 328;
const ICE_X = -380;
const TUG_X = 330;
const TUG_S = 500 / 1284;
const TUG_AX = 645;
const TUG_AY = 604; // tug waterline (sprite px)
const PLATE_DEPTH = 1.25;
const HORIZON = -500; // plate-layer y of the horizon
const HR1 = 50; // guy head radius on the tug
const HR3 = 92; // guy head radius on the beach (cartoon cheat: closer to the camera)
const BEACH_X = 2400;
const FLOOR_Y0 = 1400;
const floorY = (x: number) => (x >= BEACH_X ? -30 : Math.min(FLOOR_Y0, (FLOOR_Y0 * (BEACH_X - x)) / 2800));
const GUY3_X = 2500;
const CITY3_X = 2980;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: -20, y: -380, k: 0.9};
const CAMS_1: CamKey[] = [
  CAM0,
  {t: 2.6, x: 10, y: -390, k: 0.93},
  {t: T.most, x: 10, y: -390, k: 0.93},
  {t: 5.3, x: -60, y: 260, k: 0.5, ease: 'io'},
  {t: 6.7, x: -60, y: 262, k: 0.5},
  {t: 7.6, x: 120, y: -180, k: 0.72, ease: 'io'},
  {t: 10.5, x: 125, y: -182, k: 0.73},
  {t: 11.25, x: -330, y: 430, k: 0.62, ease: 'io'},
  {t: CUT_E, x: -335, y: 440, k: 0.63},
];
const CAMS_2: CamKey[] = [
  {t: CUT_E, x: -900, y: 380, k: 0.42},
  {t: 13.4, x: 250, y: 600, k: 0.17, ease: 'io'},
  {t: CUT_F, x: 260, y: 590, k: 0.175},
];
const CAMS_3: CamKey[] = [
  {t: CUT_F, x: 1760, y: -40, k: 0.47},
  {t: 17.5, x: 1790, y: -30, k: 0.48, ease: 'io'},
  {t: 19.4, x: 1795, y: -35, k: 0.485},
  {t: 20.4, x: 1680, y: -200, k: 0.58, ease: 'io'},
  {t: 21.9, x: 1690, y: -205, k: 0.6},
  {t: 22.55, x: 2150, y: -330, k: 0.9, ease: 'io'},
  {t: DURATION, x: 2152, y: -331, k: 0.905},
];
export const camOf = (t: number): Cam => {
  if (t < CUT_E) return camAt(t, CAMS_1);
  if (t < CUT_F) return camAt(t, CAMS_2);
  return camAt(t, CAMS_3);
};

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
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

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: [number, number]; head?: number[]; left: number; right: number; top: number; bottom: number; rope?: number[]; hand?: number[]};
const sp = (n: SprName) => SPR[n] as unknown as SP;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; o?: number; filter?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  ax,
  ay,
  o = 1,
  filter,
}) => {
  const p = sp(n);
  const axx = ax ?? p.feet[0];
  const ayy = ay ?? p.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity: o}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: p.w * s, height: p.h * s, filter}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 12000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; s: number; text: string; size?: number; rot?: number; color?: string}> = ({x, y, s, text, size = 64, rot = 0, color = TEXT_YEL}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${size * 0.2}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );

// a rope as a sagging quadratic curve (sag in world units, + = down)
const Rope: React.FC<{x0: number; y0: number; x1: number; y1: number; sag: number; w?: number}> = ({x0, y0, x1, y1, sag, w = 12}) => {
  const d = `M ${x0} ${y0} Q ${(x0 + x1) / 2} ${(y0 + y1) / 2 + 2 * sag} ${x1} ${y1}`;
  return (
    <g>
      <path d={d} stroke="#000" strokeWidth={w * 1.9} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#9B6A3C" strokeWidth={w} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#C48B52" strokeWidth={w * 0.35} fill="none" strokeLinecap="round" strokeDasharray={`${w * 1.2} ${w * 1.6}`} />
    </g>
  );
};

// ---------- the iceberg (sprite + code face) ----------
const icePt = (x: number, m: number, px: number, py: number): [number, number] => [x + (px - ICE_AX) * ICE_S * m, (py - ICE_AY) * ICE_S * m];
type Mood = {open: number; look: [number, number]; squeeze?: boolean; lid?: number; brow?: number; browTilt?: number; mouth: 'smile' | 'o' | 'sad' | 'flat' | 'grit'; sweat?: number};
const Iceberg: React.FC<{x: number; m: number; sx?: number; sy?: number; rot?: number; mood?: Mood; big?: boolean}> = ({x, m, sx = 1, sy = 1, rot = 0, mood}) => {
  if (m <= 0.005) return null;
  const [ex1, ey] = icePt(0, 1, 412, 200);
  const [ex2] = icePt(0, 1, 520, 200);
  const [mx, my] = icePt(0, 1, 466, 268);
  const er = 30 * ICE_S;
  return (
    <div style={{position: 'absolute', left: x, top: 0, transform: `rotate(${rot}deg) scale(${sx * m}, ${sy * m})`, transformOrigin: '0 0'}}>
      <Img src={F('iceberg')} style={{position: 'absolute', left: -ICE_AX * ICE_S, top: -ICE_AY * ICE_S, width: sp('iceberg').w * ICE_S, height: sp('iceberg').h * ICE_S}} />
      {mood && mood.open > 0.001 ? (
        <Svg r={2000}>
          <Eye x={ex1} y={ey} r={er} open={mood.open} look={mood.look} side={-1} squeeze={mood.squeeze} lid={mood.lid ?? 0} brow={mood.brow ?? 0.6} browTilt={mood.browTilt ?? 0} />
          <Eye x={ex2} y={ey} r={er} open={mood.open} look={mood.look} side={1} squeeze={mood.squeeze} lid={mood.lid ?? 0} brow={mood.brow ?? 0.6} browTilt={mood.browTilt ?? 0} />
          <g transform={`translate(${mx} ${my}) scale(${mood.open})`}>
            {mood.mouth === 'smile' ? <path d="M -26 -4 Q 0 22 26 -4" stroke="#000" strokeWidth={8} fill="none" strokeLinecap="round" /> : null}
            {mood.mouth === 'o' ? <ellipse cx={0} cy={4} rx={15} ry={20} fill="#3A1F2E" stroke="#000" strokeWidth={7} /> : null}
            {mood.mouth === 'sad' ? <path d="M -24 12 Q 0 -10 24 12" stroke="#000" strokeWidth={8} fill="none" strokeLinecap="round" /> : null}
            {mood.mouth === 'flat' ? <path d="M -20 4 L 20 4" stroke="#000" strokeWidth={8} fill="none" strokeLinecap="round" /> : null}
            {mood.mouth === 'grit' ? (
              <g>
                <rect x={-28} y={-10} width={56} height={24} rx={8} fill="#fff" stroke="#000" strokeWidth={7} />
                <line x1={-28} y1={2} x2={28} y2={2} stroke="#000" strokeWidth={4} />
              </g>
            ) : null}
          </g>
          {mood.sweat ? <SweatDrop x={ex2 + er * 2.1} y={ey - er * 0.5 + 18 * (mood.sweat % 1)} r={16} s={Math.min(1, mood.sweat * 4)} rot={10} /> : null}
        </Svg>
      ) : null}
    </div>
  );
};

// ---------- the tugboat ----------
const tugPt = (x: number, px: number, py: number, s = TUG_S): [number, number] => [x + (px - TUG_AX) * s, (py - TUG_AY) * s];
const Tug: React.FC<{x: number; t: number; s?: number; chug?: number; ph?: number}> = ({x, t, s = TUG_S, chug = 1, ph = 0}) => {
  const rock = Math.sin(2 * Math.PI * 0.7 * t + ph) * 1.6 + chug * Math.sin(2 * Math.PI * 4.2 * t + ph) * 0.6;
  const bob = Math.sin(2 * Math.PI * 0.7 * t + ph + 1) * 5;
  return <Spr n="tug" x={x} y={bob} s={s} ax={TUG_AX} ay={TUG_AY} rot={rock} />;
};
// funnel smoke puffs (pulses)
const Smoke: React.FC<{x: number; y: number; t: number; t0: number; t1: number; rate?: number; sc?: number; dark?: boolean}> = ({x, y, t, t0, t1, rate = 2.2, sc = 1, dark = false}) => {
  if (t < t0) return null;
  const out = [];
  for (let i = 0; i < 8; i++) {
    const born = t0 + i / rate + Math.floor((t - t0) * rate / 8) * (8 / rate);
    const b2 = born > t ? born - 8 / rate : born;
    if (b2 > t1 || b2 < t0) continue;
    const u = prog(t, b2, b2 + 1.6);
    if (u <= 0 || u >= 1) continue;
    out.push({x: x - 70 * u * sc + 10 * Math.sin(u * 6 + i), y: y - 170 * u * sc, r: sc * (14 + 30 * Math.sin(Math.PI * Math.min(1, u * 1.3)))});
  }
  return <PuffCluster puffs={out} fill={dark ? '#7D7A78' : '#B9BDC2'} ink={7 * sc} shade={dark ? '#6A6765' : '#A4A9AF'} />;
};

// ---------- the guy ----------
type Pose = 'hero' | 'tired' | 'shock' | 'strain' | 'glass';
const headR = (n: Pose) => (sp(n).head as number[])[2];
const Guy: React.FC<{t: number; pose: Pose; tSwap: number; x: number; y: number; hr: number; rot?: number}> = ({t, pose, tSwap, x, y, hr, rot = 0}) => {
  const s = hr / headR(pose);
  const [sqx, sqy] = squashSwap(t, tSwap);
  const tremble = pose === 'strain' ? Math.sin(2 * Math.PI * 11 * t) * 2.2 : pose === 'shock' ? Math.sin(2 * Math.PI * 9 * t) * 1.4 : 0;
  const pull = pose === 'hero' ? Math.sin(2 * Math.PI * 1.1 * t) * 1.5 : 0;
  return <Spr n={pose} x={x + tremble} y={y} s={s} sx={sqx} sy={sqy * breathe(t)} rot={rot + pull} />;
};

// ---------- the Sun (code) ----------
const Sun: React.FC<{t: number; x: number; y: number; r: number; hot: number}> = ({t, x, y, r, hot}) => {
  const spin = t * 16;
  const pulse = 1 + 0.04 * Math.sin(2 * Math.PI * 0.9 * t) + 0.14 * bump(t, T.warm, 0.4) + 0.08 * bump(t, T.dubai, 0.3);
  const rays = [...Array(12)].map((_, i) => {
    const a = ((spin + i * 30) * Math.PI) / 180;
    const r0 = r * 1.12;
    const r1 = r * (1.42 + 0.06 * Math.sin(2 * Math.PI * 1.2 * t + i) + 0.12 * hot);
    const w = 0.13;
    return `M ${x + r0 * Math.cos(a - w)} ${y + r0 * Math.sin(a - w)} L ${x + r1 * Math.cos(a)} ${y + r1 * Math.sin(a)} L ${x + r0 * Math.cos(a + w)} ${y + r0 * Math.sin(a + w)} Z`;
  });
  const look: [number, number] = [-0.6, 0.5];
  return (
    <g transform={`translate(${x} ${y}) scale(${pulse}) translate(${-x} ${-y})`}>
      <circle cx={x} cy={y} r={r * 1.6} fill="#FFE07A" opacity={0.3 + 0.2 * hot} />
      {rays.map((d, i) => (
        <path key={i} d={d} fill={hot > 0.5 ? '#FFA63A' : '#FFC23A'} stroke="#000" strokeWidth={7} strokeLinejoin="round" />
      ))}
      <circle cx={x} cy={y} r={r} fill="#FFD93D" stroke="#000" strokeWidth={9} />
      <circle cx={x - r * 0.18} cy={y + r * 0.2} r={r * 0.72} fill="#FFC72C" opacity={0.6} />
      <circle cx={x - r * 0.6} cy={y + r * 0.25} r={r * 0.14} fill="#FF9B6A" opacity={0.8} />
      <circle cx={x + r * 0.42} cy={y + r * 0.25} r={r * 0.14} fill="#FF9B6A" opacity={0.8} />
      <Eye x={x - r * 0.38} y={y - r * 0.18} r={r * 0.21} open={1} lid={hot > 0.5 ? 0.4 : 0} lidTilt={hot > 0.5 ? 20 : 0} look={look} side={-1} brow={0.55} browTilt={hot > 0.5 ? 1 : 0} />
      <Eye x={x + r * 0.22} y={y - r * 0.18} r={r * 0.21} open={1} lid={hot > 0.5 ? 0.4 : 0} lidTilt={hot > 0.5 ? 20 : 0} look={look} side={1} brow={0.55} browTilt={hot > 0.5 ? 1 : 0} />
      <path d={`M ${x - r * 0.42} ${y + r * 0.3} Q ${x - r * 0.1} ${y + r * (0.62 + 0.15 * hot)} ${x + r * 0.28} ${y + r * 0.3}`} stroke="#000" strokeWidth={9} fill={hot > 0.5 ? '#C2412B' : 'none'} strokeLinecap="round" />
    </g>
  );
};

// ---------- far layer: sky plate, sea, horizon city ----------
const FarLayer: React.FC<{t: number; cam: Cam; city: boolean; hot: number; sun?: boolean}> = ({t, cam, city, hot, sun = true}) => {
  const P = sp('city');
  const cw = 520;
  const cs = cw / (P.right - P.left);
  const cp = city ? (t < T.dubai - 0.05 ? 1 : 1 + 0.25 * bump(t, T.dubai, 0.35)) : 0;
  return (
    <World cam={cam} depth={PLATE_DEPTH}>
      <div style={{position: 'absolute', left: -30000, top: -30000, width: 60000, height: 30000 + HORIZON - 1690 + 40, background: SKY}} />
      <div style={{position: 'absolute', left: -30000, top: HORIZON + 40, width: 60000, height: 30000, background: SEA_FAR}} />
      {[-4, -3, -2, -1, 0, 1, 2, 3].map((i) => (
        <Img
          key={i}
          src={F('bg')}
          style={{position: 'absolute', left: i * 2048, top: HORIZON - 1690, width: 2048, height: 3072, transform: i % 2 ? 'scaleX(-1)' : undefined}}
        />
      ))}
      <Svg>
        {sun ? <Sun t={t} x={430} y={HORIZON - 880} r={120} hot={hot} /> : null}
      </Svg>
      {cp > 0 ? <Spr n="city" x={420} y={HORIZON + 14} s={cs * cp} /> : null}
      {city ? <Label x={420} y={HORIZON - 410} s={pop(t, T.dubai, 0.3)} text="DUBAI" size={70} rot={-3} /> : null}
    </World>
  );
};

// ---------- water: see-through blue over everything under y = 0 ----------
const Water: React.FC<{t: number; alpha: number; warm: number; drift: number; floor?: boolean}> = ({alpha, warm, drift, floor}) => {
  const c = [lerp(31, 44, warm), lerp(127, 170, warm), lerp(208, 190, warm)].map(Math.round);
  const waves = [...Array(60)].map((_, i) => {
    const x = (((i * 260 - drift) % 15600) + 15600) % 15600 - 7800;
    return <path key={i} d={`M ${x} 26 q 30 -16 60 0`} stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.55} />;
  });
  return (
    <Svg>
      <rect x={-12000} y={0} width={24000} height={12000} fill={`rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`} />
      {floor ? (
        <path
          d={`M -12000 ${FLOOR_Y0} L -400 ${FLOOR_Y0} L ${BEACH_X} 0 L ${BEACH_X + 260} -36 L 12000 -36 L 12000 12000 L -12000 12000 Z`}
          fill={SAND}
          stroke="#000"
          strokeWidth={14}
          strokeLinejoin="round"
        />
      ) : null}
      {floor
        ? [...Array(14)].map((_, i) => {
            const x = -300 + i * 230 + 60 * rnd(i);
            const y = floorY(x) + 60 + 80 * rnd(i + 3);
            return <ellipse key={i} cx={x} cy={y} rx={22} ry={12} fill={SAND_D} />;
          })
        : null}
      <line x1={-12000} y1={0} x2={floor ? BEACH_X : 12000} y2={0} stroke="#0E4E8A" strokeWidth={10} />
      {waves}
    </Svg>
  );
};

// ---------- the duck that overtakes (S1) ----------
const Duck: React.FC<{t: number}> = ({t}) => {
  if (t < T.slower - 0.4 || t > 10.3) return null;
  const u = prog(t, T.slower - 0.4, 10.2);
  const x = lerp(-700, 1500, u);
  const bob = Math.sin(2 * Math.PI * 2.4 * t) * 5;
  const look = t > 8.0 && t < 9.3;
  return (
    <g transform={`translate(${x} ${-6 + bob}) rotate(${Math.sin(2 * Math.PI * 2.4 * t) * 4})`}>
      <ellipse cx={0} cy={-34} rx={62} ry={38} fill="#FFD84A" stroke="#000" strokeWidth={8} />
      <path d="M -50 -48 Q -84 -70 -70 -34" fill="#FFD84A" stroke="#000" strokeWidth={8} strokeLinejoin="round" />
      <circle cx={42} cy={-86} r={30} fill="#FFD84A" stroke="#000" strokeWidth={8} />
      <path d="M 66 -84 L 100 -78 L 66 -68 Z" fill="#FF9A2E" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
      <Eye x={look ? 36 : 48} y={-92} r={9} open={1} look={look ? [-1, 0.2] : [1, 0]} side={1} brow={look ? 0.7 : NaN} browTilt={look ? -1 : 0} />
      <path d="M -10 -30 Q 10 -14 30 -30" stroke="#E0B52E" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

// ---------- calendar (screen space) ----------
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
const Calendar: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.months - 0.05, 12.0, 0.3);
  if (s <= 0.001) return null;
  const u = clamp((t - T.months - 0.25) / 2.3);
  const idx = Math.min(MONTHS.length - 1, Math.floor(u * MONTHS.length * 0.999));
  const flip = (u * MONTHS.length) % 1;
  const ang = t > T.months + 0.25 && idx < MONTHS.length - 1 ? -90 * easeInCubic(flip) : 0;
  return (
    <div style={{position: 'absolute', left: 205, top: 330, transform: `translate(-50%, -50%) scale(${s}) rotate(-5deg)`}}>
      <div style={{position: 'relative', width: 250, height: 250, background: '#fff', border: '10px solid #000', borderRadius: 26, overflow: 'hidden'}}>
        <div style={{height: 64, background: '#E8382D', borderBottom: '10px solid #000'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 86, textAlign: 'center', fontFamily: FONT, fontSize: 92, lineHeight: 1}}>{MONTHS[Math.min(idx + 1, MONTHS.length - 1)]}</div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 74,
            bottom: 0,
            background: '#fff',
            transformOrigin: '50% 0',
            transform: `perspective(600px) rotateX(${-ang}deg)`,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 92,
            lineHeight: 1,
            paddingTop: 12,
            display: idx < MONTHS.length - 1 ? 'block' : 'none',
          }}
        >
          {MONTHS[idx]}
        </div>
      </div>
      <div style={{position: 'absolute', left: -40, top: 262, width: 330, textAlign: 'center', fontFamily: FONT, fontSize: 64, color: TEXT_YEL, WebkitTextStroke: '13px #000', paintOrder: 'stroke fill'}}>MONTHS</div>
    </div>
  );
};

// ---------- the warm sea's little mouths (S1, "eats it from below") ----------
const Nibblers: React.FC<{t: number; m: number}> = ({t, m}) => {
  if (t < T.eats - 0.15 || t >= CUT_E) return null;
  const pts: [number, number][] = [
    [180, 900],
    [250, 1170],
    [400, 1360],
    [560, 1330],
    [700, 1150],
    [800, 870],
  ];
  return (
    <g>
      {pts.map(([px, py], i) => {
        const [x, y] = icePt(ICE_X, m, px, py);
        const dx = x - ICE_X;
        const dy = y - 500 * m;
        const L = Math.hypot(dx, dy);
        const nx = dx / L;
        const ny = dy / L;
        const s = pop(t, T.eats - 0.1 + i * 0.07, 0.3);
        const chomp = Math.abs(Math.sin(2 * Math.PI * 3.2 * t + i));
        const cx = x + nx * 70;
        const cy = y + ny * 70;
        const ang = (Math.atan2(-ny, -nx) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
            <g transform={`rotate(${ang})`}>
              <path
                d={`M 0 0 L ${50 * Math.cos(0.65 * chomp)} ${-50 * Math.sin(0.65 * chomp)} A 50 50 0 1 0 ${50 * Math.cos(0.65 * chomp)} ${50 * Math.sin(0.65 * chomp)} Z`}
                fill="#5BC7E8"
                stroke="#000"
                strokeWidth={8}
                strokeLinejoin="round"
              />
            </g>
            <Eye x={-nx * 4 - ny * 18} y={-ny * 4 + nx * 18 - 14} r={12} open={1} look={[-nx, -ny]} side={1} brow={0.7} lidTilt={20} lid={0.25} />
          </g>
        );
      })}
      {/* bitten-off crumbs floating up */}
      {[...Array(10)].map((_, i) => {
        const t0 = T.eats + 0.12 * i;
        const u = prog(t, t0, t0 + 0.9);
        if (u <= 0 || u >= 1) return null;
        const [x, y] = icePt(ICE_X, m, 200 + 60 * i, 1150 + 120 * Math.sin(i));
        return <rect key={i} x={x - 9 + 30 * Math.sin(i + u * 5)} y={y - 220 * u} width={18} height={18} rx={4} fill="#E6F6FF" stroke="#000" strokeWidth={4} opacity={1 - u} transform={`rotate(${u * 200} ${x} ${y})`} />;
      })}
    </g>
  );
};

// ---------- S1: the open sea ----------
const iceMood1 = (t: number): Mood => {
  const open = pop(t, T.iceberg, 0.3);
  if (t < T.but) return {open, look: [0.9, 0.1], mouth: 'flat', brow: 0.6, browTilt: -0.3};
  if (t < T.so2) return {open, look: [0.2, 1], mouth: 'o', brow: 0.75};
  if (t < T.months) return {open, look: [0.7, 0], mouth: 'grit', lid: 0.35, lidTilt: 0, browTilt: 1, brow: 0.45} as Mood;
  if (t < T.eats) return {open, look: [-0.3, 0.3], mouth: 'sad', brow: 0.6, browTilt: -1, sweat: (t - T.months) * 0.7};
  return {open, look: [0, 0], squeeze: true, mouth: 'o', sweat: (t - T.months) * 0.7};
};
const Scene1: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const reveal = cover ? 0 : easeInOutCubic(prog(t, T.hides - 0.05, T.water));
  const warm = easeInOutCubic(prog(t, T.warm - 0.1, T.sea + 0.3));
  const m = 1 - 0.28 * easeInOutCubic(prog(t, T.eats + 0.05, 12.15));
  const strain = t > T.drags ? 1 : 0;
  const drift = t * 60;
  // the iceberg drags: a little stretch toward the tug on "drags", and leans back on "anchor"
  const lean = -2.5 * bump(t, T.drags, 0.5) + -3 * bump(t, T.anchor, 0.6) + 0.6 * Math.sin(2 * Math.PI * 0.35 * t);
  const pose: Pose = t < T.walk ? 'hero' : t < T.eats ? 'tired' : 'shock';
  const tSwap = pose === 'hero' ? -9 : pose === 'tired' ? T.walk : T.eats;
  const [dx, dy] = tugPt(TUG_X, 288, 411);
  const guyHR = HR1 * (pose === 'hero' ? 1 : 1.08);
  const gs = guyHR / headR(pose);
  const tugLurch = 14 * bump(t, T.tow, 0.4) - 10 * bump(t, T.anchor, 0.5);
  const tx = TUG_X + tugLurch;
  // rope: from the hero's rope end (or the stern) to the knot on the iceberg's peak
  const P = sp('hero');
  const ropeA: [number, number] =
    pose === 'hero' ? [dx + tugLurch + ((P.rope as number[])[0] - P.feet[0]) * gs, dy + ((P.rope as number[])[1] - P.feet[1]) * gs] : tugPt(tx, 40, 405);
  const knot = icePt(ICE_X, m, 610, 255);
  const sagIn = t < T.rope ? 120 * (1 - easeOutBack(prog(t, T.tie, T.rope), 2)) + 0 : 0;
  const sag = (t < T.rope ? 120 - 110 * easeOutBack(prog(t, T.tie + 0.05, T.rope + 0.05), 2.4) : 10 + 4 * Math.sin(2 * Math.PI * 1.1 * t)) + 0 * sagIn;
  const hot = warm;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <FarLayer t={t} cam={cam} city={!cover} hot={hot} sun={!cover} />
      <World cam={cam}>
        <Iceberg x={ICE_X} m={m} rot={lean} mood={cover ? {open: 1, look: [0.9, 0.1], mouth: 'flat', browTilt: -0.3} : iceMood1(t)} />
        <Svg>
          <Rope x0={ropeA[0]} y0={ropeA[1]} x1={knot[0]} y1={knot[1]} sag={sag} />
          <circle cx={knot[0]} cy={knot[1]} r={16} fill="#9B6A3C" stroke="#000" strokeWidth={7} />
          {/* foam at the stern while it chugs */}
          {[0, 1, 2].map((i) => {
            const u = ((t * 1.6 + i / 3) % 1);
            const [sx] = tugPt(tx, 30, 600);
            return <ellipse key={i} cx={sx - 40 - 110 * u} cy={6} rx={30 * (1 - u) + 8} ry={12 * (1 - u) + 4} fill="#fff" stroke="#000" strokeWidth={5} opacity={1 - u} />;
          })}
        </Svg>
        <Tug x={tx} t={t} chug={strain ? 1.6 : 1} />
        <Svg>
          <Smoke x={tugPt(tx, 640, 20)[0]} y={tugPt(tx, 640, 20)[1]} t={t} t0={T.tow - 0.2} t1={CUT_E} rate={t > T.drags ? 3.4 : 2.2} dark={t > T.drags} />
        </Svg>
        <Guy t={t} pose={pose} tSwap={tSwap} x={dx + tugLurch} y={dy} hr={guyHR} />
        {pose === 'tired' || pose === 'shock' ? (
          <Svg>
            <SweatDrop x={dx + tugLurch + guyHR * 1.1} y={dy - guyHR * 3.2 + 20 * prog(t, tSwap, tSwap + 1.5)} r={12} s={pop(t, tSwap + 0.1, 0.25)} rot={10} />
          </Svg>
        ) : null}
        <Svg>
          <Duck t={t} />
        </Svg>
        <Water t={t} alpha={lerp(0.93, 0.42, reveal)} warm={warm} drift={drift} />
        <Svg>
          <Nibblers t={t} m={m} />
          {/* a ghost anchor stamped on the hidden bulk on "anchor" */}
          {t > T.anchor - 0.05 && t < T.walk ? (
            <g transform={`translate(${ICE_X} 560) scale(${popOut(t, T.anchor - 0.05, T.slower + 0.4, 0.3) * 2.2})`} opacity={0.85}>
              <path d="M 0 -120 L 0 110 M -60 -70 L 60 -70 M -110 40 Q -100 120 0 120 Q 100 120 110 40" stroke="#000" strokeWidth={34} fill="none" strokeLinecap="round" />
              <path d="M 0 -120 L 0 110 M -60 -70 L 60 -70 M -110 40 Q -100 120 0 120 Q 100 120 110 40" stroke="#5A6B7A" strokeWidth={18} fill="none" strokeLinecap="round" />
              <circle cx={0} cy={-150} r={30} fill="none" stroke="#000" strokeWidth={30} />
              <circle cx={0} cy={-150} r={30} fill="none" stroke="#5A6B7A" strokeWidth={14} />
              <path d="M -130 20 L -100 70 L -150 70 Z M 130 20 L 100 70 L 150 70 Z" fill="#5A6B7A" stroke="#000" strokeWidth={10} strokeLinejoin="round" />
            </g>
          ) : null}
          {/* "most of it": a dashed waterline bracket on the hidden part */}
          {reveal > 0.5 && t < T.anchor ? (
            <g opacity={clamp((reveal - 0.5) * 2) * (1 - prog(t, T.anchor - 0.3, T.anchor))}>
              <path d={`M ${ICE_X - 560} 20 L ${ICE_X - 600} 20 L ${ICE_X - 600} 1000 L ${ICE_X - 560} 1000`} stroke="#000" strokeWidth={26} fill="none" strokeLinejoin="round" />
              <path d={`M ${ICE_X - 560} 20 L ${ICE_X - 600} 20 L ${ICE_X - 600} 1000 L ${ICE_X - 560} 1000`} stroke={TEXT_YEL} strokeWidth={12} fill="none" strokeLinejoin="round" />
            </g>
          ) : null}
        </Svg>
        {reveal > 0.5 && t < T.anchor ? <Label x={ICE_X} y={420} s={pop(t, T.water, 0.3) * (1 - prog(t, T.anchor - 0.3, T.anchor))} text="HIDDEN" size={110} rot={-6} /> : null}
        {/* heat squiggles over the warm sea */}
        <Svg>
          {warm > 0.01
            ? [...Array(8)].map((_, i) => {
                const t0 = T.warm + 0.2 * i;
                const u = ((t - t0) / 1.2) % 1;
                if (t < t0 || t > 11.4) return null;
                const x = -1000 + i * 290;
                const L = 120;
                const pts: string[] = [];
                for (let j = 0; j <= 10; j++) pts.push(`${x + Math.sin((j / 10) * 9 + u * 8) * 14} ${-20 - u * 260 - (j / 10) * L}`);
                const d = `M ${pts.join(' L ')}`;
                const o = Math.sin(Math.PI * u);
                return (
                  <g key={i} opacity={o}>
                    <path d={d} stroke="#000" strokeWidth={18} fill="none" strokeLinecap="round" />
                    <path d={d} stroke="#FF8A2B" strokeWidth={9} fill="none" strokeLinecap="round" />
                  </g>
                );
              })
            : null}
        </Svg>
      </World>
      {warm > 0.01 ? <AbsoluteFill style={{background: `rgba(255, 140, 40, ${0.08 * warm})`}} /> : null}
      {cover ? null : <Calendar t={t} />}
    </AbsoluteFill>
  );
};

// ---------- S2: the 2 km iceberg and twenty ships ----------
const GX = -1550;
const TUGS20 = [...Array(20)].map((_, i) => {
  const row = 3 - Math.floor(i / 5); // back rows first (drawn first)
  const col = i % 5;
  return {x: 250 + col * 560 + (row % 2) * 230, row, sc: 2.3 - 0.25 * row, t0: T.upto - 0.05 + (19 - i) * 0.045};
});
const Scene2: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const g = 0.72 + (3.3 - 0.72) * easeOutBack(prog(t, T.need - 0.1, T.km + 0.2), 1.3);
  const gw = 862 * g;
  const arrowS = pop(t, T.km - 0.05, 0.3);
  const top = -0.235 * 1300 * g - 260;
  const shockS = pop(t, T.two - 0.05, 0.3);
  const counter = Math.max(0, Math.min(20, TUGS20.filter((s) => t >= s.t0).length));
  return (
    <AbsoluteFill style={{background: SKY}}>
      <FarLayer t={t} cam={cam} city={false} hot={1} />
      <World cam={cam}>
        <Iceberg x={GX} m={g} rot={Math.sin(2 * Math.PI * 0.3 * t) * 0.4} mood={{open: 1, look: [0.8, 0.2], mouth: t > T.ships ? 'o' : 'smile', brow: 0.6, browTilt: -0.5}} />
        <Svg>
          {TUGS20.map((s, i) => {
            const p = pop(t, s.t0, 0.25);
            if (p <= 0.001) return null;
            const [kx, ky] = icePt(GX, g, 640, 260);
            const ax = s.x - 240 * s.sc;
            return <Rope key={i} x0={kx} y0={ky + 12 * i} x1={ax} y1={-110 * s.sc - s.row * 110} sag={18} w={16} />;
          })}
        </Svg>
        {TUGS20.map((s, i) => {
          const p = pop(t, s.t0, 0.25);
          if (p <= 0.001) return null;
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: -s.row * 110}}>
              <Tug x={s.x} t={t} s={TUG_S * s.sc * p} ph={i * 0.9} chug={1.4} />
            </div>
          );
        })}
        <Svg>
          {TUGS20.map((s, i) => (t > s.t0 + 0.2 ? <Smoke key={i} x={s.x} y={-220 * s.sc - s.row * 110} t={t} t0={s.t0 + 0.2} t1={CUT_F} rate={2.6} sc={s.sc} /> : null))}
        </Svg>
        <Water t={t} alpha={0.42} warm={1} drift={t * 60} />
        <Svg>
          {arrowS > 0.001 ? (
            <g opacity={Math.min(1, arrowS)}>
              {[
                [26, '#000'],
                [12, TEXT_YEL],
              ].map(([w, c], i) => (
                <g key={i}>
                  <line x1={GX - gw / 2 + 40} y1={top} x2={GX - gw / 2 + 40 + (gw - 80) * Math.min(1, arrowS)} y2={top} stroke={c as string} strokeWidth={(w as number) * 2.4} strokeLinecap="round" />
                  <line x1={GX - gw / 2 + 40} y1={top - 90} x2={GX - gw / 2 + 40} y2={top + 90} stroke={c as string} strokeWidth={(w as number) * 2.4} strokeLinecap="round" />
                  <line x1={GX + gw / 2 - 40} y1={top - 90} x2={GX + gw / 2 - 40} y2={top + 90} stroke={c as string} strokeWidth={(w as number) * 2.4} strokeLinecap="round" opacity={arrowS > 0.95 ? 1 : 0} />
                </g>
              ))}
            </g>
          ) : null}
        </Svg>
        <Label x={GX} y={top - 330} s={pop(t, T.km, 0.3) * 4.2} text="2 KM" size={110} rot={-3} />
        <Label x={1500} y={-1500} s={pop(t, T.ships - 0.05, 0.3) * 4.2} text={`x${counter}`} size={110} rot={4} color="#FFFFFF" />
      </World>
      {/* the guy's reaction in screen space */}
      {shockS > 0.001 ? (
        <div style={{position: 'absolute', left: 860, top: 1720, transform: `scale(${shockS})`, transformOrigin: '50% 100%'}}>
          <Guy t={t} pose="shock" tSwap={T.two} x={0} y={0} hr={110} />
        </div>
      ) : null}
      <AbsoluteFill style={{background: 'rgba(255, 140, 40, 0.06)'}} />
    </AbsoluteFill>
  );
};

// ---------- S3: the shore ----------
const M3 = 0.72;
const ICE3_STOP = 960;
const ice3X = (t: number) => (t < T.deep ? lerp(150, ICE3_STOP, easeOutCubic(prog(t, CUT_F, T.deep)) * 0.15 + 0.85 * prog(t, CUT_F, T.deep)) : ICE3_STOP);
const melt3 = (t: number) => M3 * (1 - easeInCubic(prog(t, T.offshore, 21.95)));
const iceMood3 = (t: number): Mood => {
  if (t < T.deep) return {open: 1, look: [0.9, 0.1], mouth: 'smile', browTilt: -0.3};
  if (t < T.reach + 0.2) return {open: 1, look: [0, 0], squeeze: true, mouth: 'o'};
  if (t < T.offshore) return {open: 1, look: [0.9, 0.3], mouth: 'sad', browTilt: -1};
  return {open: 1, look: [0.8, 0.5], mouth: 'sad', browTilt: -1, sweat: (t - T.offshore) * 0.8};
};
const Scene3: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const x = ice3X(t);
  const m = melt3(t);
  const thud = t >= T.deep ? spring(t - T.deep, 2.4, 5) : 0;
  const pose: Pose = t < T.melts ? 'strain' : 'glass';
  const tSwap = pose === 'strain' ? -9 : T.melts;
  const hr = HR3 * (pose === 'glass' ? 1.04 : 1);
  const gs = hr / headR(pose);
  const P = sp('strain');
  const hand: [number, number] = [GUY3_X + ((P.hand as number[])[0] - P.feet[0]) * gs, -30 + ((P.hand as number[])[1] - P.feet[1]) * gs];
  const knot = icePt(x, Math.max(m, 0.05), 610, 255);
  const pullJerk = 6 * Math.sin(2 * Math.PI * 2.2 * t) * (t > T.reach && t < T.melts ? 1 : 0);
  const C = sp('city');
  const cs = 1150 / (C.right - C.left);
  const gone = t > 21.95;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <FarLayer t={t} cam={cam} city={false} hot={1} />
      <World cam={cam}>
        <Spr n="city" x={CITY3_X} y={-20} s={cs} />
        <Iceberg x={x} m={m} sx={1 + 0.05 * thud} sy={1 - 0.05 * thud} rot={-2.5 * thud} mood={iceMood3(t)} />
        <Svg>
          {/* the rope: taut while pulling, droops into the sea once the iceberg is gone */}
          {pose === 'strain' ? (
            <Rope x0={hand[0] + pullJerk} y0={hand[1]} x1={knot[0]} y1={knot[1]} sag={t > T.offshore ? 40 + 120 * prog(t, T.offshore, T.melts) : 12} w={14} />
          ) : (
            <Rope x0={GUY3_X - 120} y0={-34} x1={gone ? GUY3_X - 900 : knot[0]} y1={gone ? 120 : knot[1]} sag={gone ? 60 : 160} w={14} />
          )}
          {/* drips and puddle rings while it melts */}
          {t > T.offshore
            ? [...Array(10)].map((_, i) => {
                const t0 = T.offshore + 0.2 * i;
                const u = ((t - t0) / 0.7) % 1;
                if (t < t0 || t > 22.2) return null;
                const px = x + (i % 2 ? 1 : -1) * (60 + 40 * rnd(i)) * (m / M3 + 0.2);
                const py = -220 * (m / M3) + u * 220 * (m / M3);
                return <path key={i} d={`M ${px} ${py - 22} Q ${px + 13} ${py} ${px} ${py + 10} Q ${px - 13} ${py} ${px} ${py - 22} Z`} fill="#8FD6FF" stroke="#000" strokeWidth={5} />;
              })
            : null}
          {t > T.offshore
            ? [0, 1, 2].map((i) => {
                const u = ((t - T.offshore) * 0.9 + i / 3) % 1;
                const r = (80 + 260 * u) * (0.4 + m / M3);
                return <ellipse key={i} cx={x} cy={4} rx={r} ry={r * 0.12} fill="none" stroke="#fff" strokeWidth={8} opacity={(1 - u) * 0.9} />;
              })
            : null}
          {gone ? (
            <ellipse cx={x} cy={4} rx={120 + 600 * prog(t, 21.95, 22.7)} ry={(120 + 600 * prog(t, 21.95, 22.7)) * 0.12} fill="none" stroke="#fff" strokeWidth={10} opacity={1 - prog(t, 21.95, 22.7)} />
          ) : null}
        </Svg>
        <Water t={t} alpha={0.42} warm={1} drift={t * 30} floor />
        <Svg>
          {/* thud dust puff where the keel hits the floor */}
          {t > T.deep && t < T.deep + 0.9 ? (
            <PuffCluster
              puffs={[-1, 0, 1].map((i) => {
                const u = prog(t, T.deep, T.deep + 0.9);
                const [kx, ky] = icePt(x, m, 477, 1380);
                return {x: kx + i * 90 * (0.5 + u), y: ky - 30 - 40 * u, r: 50 * Math.sin(Math.PI * u) + 2};
              })}
              fill={SAND}
              ink={8}
              shade={SAND_D}
            />
          ) : null}
          {/* "too far" gap arrow on the surface */}
          {t > T.reach - 0.1 && t < T.offshore + 0.3 ? (
            <g opacity={1 - prog(t, T.offshore, T.offshore + 0.3)}>
              {[
                [30, '#000'],
                [14, TEXT_YEL],
              ].map(([w, c], i) => {
                const x0 = x + 330;
                const x1 = x0 + (BEACH_X - 100 - x0) * easeOutCubic(prog(t, T.reach - 0.1, T.beach));
                return (
                  <g key={i}>
                    <line x1={x0} y1={-140} x2={x1} y2={-140} stroke={c as string} strokeWidth={w as number} strokeLinecap="round" strokeDasharray={i === 0 ? undefined : '40 30'} />
                    <path d={`M ${x1 - 50} -185 L ${x1 + 10} -140 L ${x1 - 50} -95`} stroke={c as string} strokeWidth={w as number} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                );
              })}
            </g>
          ) : null}
        </Svg>
        <Guy t={t} pose={pose} tSwap={tSwap} x={GUY3_X} y={-30} hr={hr} rot={pose === 'strain' ? 3 + 2 * bump(t, T.beach, 0.4) : 0} />
        {pose === 'glass' ? (
          <Svg>
            <SweatDrop x={GUY3_X + hr * 1.6} y={-30 - hr * 4.3 + 30 * prog(t, T.salt, DURATION)} r={20} s={pop(t, T.salt, 0.25)} rot={10} />
          </Svg>
        ) : null}
      </World>
      <AbsoluteFill style={{background: 'rgba(255, 140, 40, 0.07)'}} />
      {cover ? null : null}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const sh = shake(t, 3 * bump(t, T.anchor, 0.3) + 7 * bump(t, T.deep, 0.35) + 2 * bump(t, T.ships, 0.3));
  const camS = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  if (t >= CUT_F) return <Scene3 t={t} cam={camS} cover={cover} />;
  if (t >= CUT_E) return <Scene2 t={t} cam={camS} />;
  return <Scene1 t={t} cam={camS} cover={cover} />;
};

const CUES: Cue[] = [
  {f: 'rope', at: T.rope - 0.1, db: -16},
  {f: 'pop', at: T.iceberg, db: -22},
  {f: 'chug', at: T.tow - 0.1, db: -24, keys: [[2.2, -24], [3.5, -26], [3.9, -40]]},
  {f: 'boing', at: T.dubai, db: -25, rate: 1.2},
  {f: 'whoosh', at: T.hides - 0.1, db: -27, rate: 0.8},
  {f: 'gulp', at: T.water, db: -21},
  {f: 'chug', at: T.drags - 0.1, db: -21, rate: 0.85},
  {f: 'glacier_groan', at: T.anchor - 0.05, db: -20, keys: [[6.69, -20], [7.6, -22], [8.4, -40]]},
  {f: 'splash', at: T.slower - 0.3, db: -27, rate: 1.3},
  {f: 'pop', at: T.walk, db: -23, rate: 1.4},
  {f: 'pop', at: T.months - 0.05, db: -22},
  {f: 'whoosh', at: 9.9, db: -32, rate: 1.3},
  {f: 'whoosh', at: 10.5, db: -32, rate: 1.3},
  {f: 'whoosh', at: 11.1, db: -32, rate: 1.3},
  {f: 'nibble', at: T.eats - 0.05, db: -17},
  {f: 'nibble', at: T.eats + 0.8, db: -20, rate: 1.1},
  {f: 'whoosh', at: CUT_E - 0.08, db: -24},
  {f: 'glacier_groan', at: T.need, db: -22, keys: [[12.58, -26], [13.0, -20], [13.9, -40]]},
  {f: 'boing', at: T.km, db: -24, rate: 0.8},
  {f: 'pop', at: 14.45, db: -26, rate: 1.0},
  {f: 'pop', at: 14.65, db: -26, rate: 1.15},
  {f: 'pop', at: 14.85, db: -26, rate: 1.3},
  {f: 'pop', at: 15.05, db: -26, rate: 1.45},
  {f: 'horns', at: T.ships + 0.03, db: -19, keys: [[15.25, -19], [16.0, -21], [16.4, -40]]},
  {f: 'whoosh', at: CUT_F - 0.08, db: -25},
  {f: 'chug', at: CUT_F, db: -28, keys: [[16.1, -28], [17.3, -28], [17.6, -45]]},
  {f: 'ground', at: T.deep - 0.02, db: -12},
  {f: 'rope', at: T.reach, db: -18, rate: 0.9},
  {f: 'drip', at: T.offshore, db: -22},
  {f: 'drip', at: 20.6, db: -24, rate: 1.1},
  {f: 'drip', at: 21.3, db: -24, rate: 0.9},
  {f: 'pop', at: T.melts, db: -24, rate: 0.8},
  {f: 'splash', at: 21.95, db: -22, rate: 0.9},
  {f: 'sad_horn', at: 22.05, db: -27, keys: [[22.05, -27], [22.5, -29], [22.74, -60]]},
];

export const IcebergTowShort: React.FC = () => {
  useITFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={camOf(t)} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('iceberg-tow/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('iceberg-tow/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="iceberg-tow/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
