import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
export {DURATION as SUEZ_DURATION, FPS as SUEZ_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "What happened to the Suez ship after it got unstuck?" - part 2 of the 2021 Ever Given story, told as a story.
// The giant ship is finally free (29 Mar 2021) - but at the Great Bitter Lake, about halfway along the canal, it is held:
// the Suez Canal Authority claims ~$916M (court in Ismailia, 13 Apr), the owners contest it, the ship waits in the lake with
// most of its crew aboard; a settlement on 7 Jul 2021; on 20 Aug 2021 it crosses the same canal again, escorted by two tugs.
// Sources: NPR / PBS / UPI 7 Jul 2021, Euronews 2021, Al Jazeera / BBC 20-21 Aug 2021 (see videos/suez-sequel/upload.md).

const F = (n: string) => staticFile(`suez-sequel/${n}.${n === 'canal' || n === 'lake' ? 'jpg' : 'png'}`);
export const FONT = 'SUEInter';
export const useSuezFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const RED = '#E8302A';
const YEL = '#FFE45C';
const SAND = '#EBCB8B';
const SAND_D = '#D8B26F';
const WATER_C = '#43A6D1';
const WATER_L = '#7CC6E6';
const SHADOW = 'rgba(72,54,42,0.26)';

// ---------- world layout (world px = plate px of the padded plates, 2048 x 1936) ----------
const WATER_BOT = 1545; // canal: near-bank edge
const WL = 1440; // canal waterline of the ship
const SS = 0.62; // ship scale in the canal
const LWL = 1480; // lake waterline
const LSS = 0.6;
const GUY_S = 0.42;
const BANK_Y = 1745; // guy's feet on the near bank
const CUT_LAKE = T.so2 - 0.02;
const CUT_BACK = T.and - 0.02;

// ---------- helpers ----------
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.18))));
const bump = (t: number, t0: number, d = 0.3, a = 0.08) => (t > t0 && t < t0 + d ? 1 + a * Math.pow(Math.sin((Math.PI * (t - t0)) / d), 2) : 1);
const pulse = (t: number, t0: number, d = 0.35) => (t > t0 && t < t0 + d ? Math.sin((Math.PI * (t - t0)) / d) : 0);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number; rodtip?: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{
  n: string;
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  ax?: number;
  ay?: number;
  children?: React.ReactNode;
}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, children}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  if (s <= 0.0005) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);

// text label (screen space), thick black stroke
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; stroke?: number}> = ({
  x, y, text, size, s, rot = 0, fill = '#fff', stroke,
}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT, fontSize: size, lineHeight: 1, color: fill, whiteSpace: 'nowrap',
        WebkitTextStroke: `${stroke ?? Math.round(size * 0.2)}px #000`, paintOrder: 'stroke fill', textAlign: 'center',
      }}
    >
      {text}
    </div>
  );

// ---------- guy ----------
type Pose = 'nervous' | 'cheer' | 'point' | 'shock' | 'refuse' | 'fish';
const HEAD_R = 135; // equalised head radius (native px of the sheet poses are all ~128-141)
const Guy: React.FC<{t: number; pose: Pose; x: number; y: number; s: number; swapAt: number; sx?: number; tremble?: number; ax?: number; ay?: number}> = ({
  t, pose, x, y, s, swapAt, sx = 1, tremble = 0, ax, ay,
}) => {
  const sp = S(pose);
  const k = (s * HEAD_R) / (sp.hd ? sp.hd[2] : HEAD_R);
  const [qx, qy] = squashSwap(t, swapAt);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tx = tremble * (Math.sin(2 * Math.PI * 17 * t) + 0.5 * Math.sin(2 * Math.PI * 9 * t));
  return (
    <>
      {pose !== 'fish' ? (
        <div style={{position: 'absolute', left: x - 80 * k * 1.4, top: y - 14 * k, width: 160 * k * 1.4, height: 28 * k, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)'}} />
      ) : null}
      <Spr n={pose} x={x + tx} y={y} s={k} sx={qx * sx} sy={qy * br} ax={ax} ay={ay} />
    </>
  );
};

// ---------- ship (with a code face on the hull near the bow) ----------
type Face = {open: number; lid: number; look: [number, number]; squeeze?: boolean; brow: number; browTilt: number; mouth: 'smile' | 'o' | 'wavy' | 'flat' | 'grit'};
const ShipFace: React.FC<{f: Face}> = ({f}) => {
  const ex = [1232, 1332];
  const ey = 328;
  const r = 38;
  const mx = 1282;
  const my = 372;
  const m =
    f.mouth === 'smile' ? `M ${mx - 26} ${my - 4} Q ${mx} ${my + 14} ${mx + 26} ${my - 4}`
    : f.mouth === 'o' ? ''
    : f.mouth === 'wavy' ? `M ${mx - 26} ${my} q 9 -8 17 0 q 9 8 17 0 q 9 -8 17 0`
    : f.mouth === 'grit' ? `M ${mx - 22} ${my} L ${mx + 22} ${my}`
    : `M ${mx - 18} ${my + 2} L ${mx + 18} ${my + 2}`;
  return (
    <g>
      <Eye x={ex[0]} y={ey} r={r} open={f.open} lid={f.lid} look={f.look} squeeze={f.squeeze} side={-1} brow={f.brow} browTilt={f.browTilt} />
      <Eye x={ex[1]} y={ey} r={r} open={f.open} lid={f.lid} look={f.look} squeeze={f.squeeze} side={1} brow={f.brow} browTilt={f.browTilt} />
      {f.open > 0.01 ? (
        f.mouth === 'o' ? (
          <ellipse cx={mx} cy={my + 2} rx={11} ry={12} fill="#7A1F2B" stroke={INK} strokeWidth={5} />
        ) : f.mouth === 'grit' ? (
          <g>
            <rect x={mx - 24} y={my - 8} width={48} height={16} rx={6} fill="#fff" stroke={INK} strokeWidth={5} />
            <line x1={mx - 8} x2={mx - 8} y1={my - 8} y2={my + 8} stroke={INK} strokeWidth={3} />
            <line x1={mx + 8} x2={mx + 8} y1={my - 8} y2={my + 8} stroke={INK} strokeWidth={3} />
          </g>
        ) : (
          <path d={m} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        )
      ) : null}
    </g>
  );
};

const shipFace = (t: number): Face => {
  const blink = (t0: number) => (t > t0 && t < t0 + 0.14 ? Math.sin((Math.PI * (t - t0)) / 0.14) : 0);
  if (t < T.unstuck) return {open: 1, lid: 0, look: [0, 0], squeeze: true, brow: 0.55, browTilt: 0, mouth: 'grit'};
  if (t < T.but) return {open: easeOutBack(clamp((t - T.unstuck) / 0.25), 2.4), lid: blink(3.9), look: [0.5, -0.3], brow: 0.75, browTilt: 0, mouth: 'smile'};
  if (t < T.stops - 0.05) return {open: 1, lid: 0, look: [0.8, -0.1], brow: 0.6, browTilt: 0, mouth: 'smile'};
  if (t < T.pay) return {open: 1 + 0.15 * pulse(t, T.stops, 0.4), lid: 0, look: [0.7, -0.2], brow: 0.9, browTilt: -0.6, mouth: 'o'};
  if (t < T.refuse) return {open: 1, lid: 0, look: [-0.3, -0.9], brow: 0.85, browTilt: -0.8, mouth: t > T.dollars ? 'o' : 'wavy'};
  if (t < CUT_LAKE) return {open: 1, lid: 0.15, look: [-0.8, -0.4], brow: 0.7, browTilt: -0.6, mouth: 'wavy'};
  if (t < T.then) {
    const sleepy = lerp(0.45, 0.72, prog(t, T.for, T.months + 0.4));
    return {open: 1, lid: Math.max(sleepy, blink(15.2) * 0.9), look: [0.2, 0.4], brow: 0.45, browTilt: 0.3, mouth: 'flat'};
  }
  if (t < CUT_BACK) return {open: 1 + 0.12 * pulse(t, T.deal - 0.05, 0.4), lid: t < T.deal - 0.05 ? 0.5 * (1 - prog(t, T.then, T.then + 0.2)) : 0, look: [0, -0.5], brow: 0.8, browTilt: 0, mouth: t < T.deal - 0.05 ? 'flat' : 'smile'};
  // the return trip: nervous, eyes darting at the banks, then at the tugs
  const dart = Math.sin(2 * Math.PI * 1.1 * (t - CUT_BACK));
  if (t < T.two) return {open: 1, lid: 0, look: [0.2, dart > 0 ? -0.7 : 0.7], brow: 0.75, browTilt: -0.7, mouth: 'grit'};
  const lk = t < T.watching ? (Math.sin(2 * Math.PI * 1.5 * (t - T.two)) > 0 ? 0.9 : -0.9) : -0.9;
  return {open: 1 + 0.1 * pulse(t, T.watching, 0.35), lid: 0, look: [lk, 0], brow: 0.85, browTilt: -0.8, mouth: t > T.watching ? 'o' : 'grit'};
};

const Ship: React.FC<{t: number; x: number; y: number; s: number; rot?: number; sx?: number; sy?: number; face: Face; sweat?: number}> = ({t, x, y, s, rot = 0, sx = 1, sy = 1, face, sweat = 0}) => (
  <Spr n="ship" x={x} y={y} s={s} rot={rot} sx={sx} sy={sy} ax={749} ay={398}>
    <ShipFace f={face} />
    <SweatDrop x={1190 - 40 * prog(t % 1.3, 0, 1.3)} y={270 + 60 * prog(t % 1.3, 0, 1.3)} r={22} s={sweat} rot={-20} />
  </Spr>
);

// water in front of the hull (so the ship sits IN the water), with moving ripple dashes
const WaterFront: React.FC<{t: number; y0: number; y1: number; x0: number; x1: number; col: string; steps?: [number, string][]}> = ({t, y0, y1, x0, x1, col, steps}) => (
  <Svg>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={col} />
    {steps?.map(([yy, c]) => <rect key={yy} x={x0} y={yy} width={x1 - x0} height={y1 - yy} fill={c} />)}
    {Array.from({length: 26}).map((_, i) => {
      const yy = y0 + 10 + (i % 4) * ((y1 - y0 - 20) / 4) * 0.8;
      const xx = x0 + ((i * 173 + t * 30 * (1 + (i % 3))) % (x1 - x0));
      return <line key={i} x1={xx} x2={xx + 46} y1={yy} y2={yy} stroke={WATER_L} strokeWidth={5} strokeLinecap="round" />;
    })}
    <path d={Array.from({length: 60}).map((_, i) => `${i ? 'L' : 'M'} ${x0 + i * ((x1 - x0) / 59)} ${y0 + 3 * Math.sin(i * 0.9 + t * 3)}`).join(' ')} fill="none" stroke={WATER_L} strokeWidth={6} />
  </Svg>
);

// sand mound around the stuck bow (code drawn, flat with one outline)
const Mound: React.FC<{t: number}> = ({t}) => {
  const dent = clamp((t - T.unstuck) / 0.3);
  return (
    <Svg>
      <path d={`M 1330 1452 Q 1400 ${1330 + 30 * dent} 1500 1318 Q 1620 1300 1700 1360 L 1760 1452 Z`} fill={SAND} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M 1420 1440 Q 1500 1380 1600 1400`} fill="none" stroke={SAND_D} strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={1640} cy={1420} rx={34} ry={10} fill={SAND_D} />
    </Svg>
  );
};

// sand clods flying when the bow pops out
const SandBurst: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (t < t0 || t > t0 + 1.2) return null;
  const u = t - t0;
  return (
    <Svg>
      {Array.from({length: 16}).map((_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * rnd(i));
        const v = 420 + 380 * rnd(i + 9);
        const x = 1460 + Math.cos(a) * v * u;
        const y = 1360 + Math.sin(a) * v * u + 0.5 * 1500 * u * u;
        const r = (9 + 10 * rnd(i + 3)) * (1 - 0.6 * prog(u, 0.6, 1.2));
        return y < 1460 ? <circle key={i} cx={x} cy={y} r={r} fill={SAND} stroke={INK} strokeWidth={4} /> : null;
      })}
    </Svg>
  );
};

// splash rings on the water
const Rings: React.FC<{t: number; t0: number; x: number; y: number; w?: number}> = ({t, t0, x, y, w = 1}) => {
  if (t < t0 || t > t0 + 1.1) return null;
  return (
    <Svg>
      {[0, 0.25].map((d) => {
        const u = prog(t, t0 + d, t0 + d + 0.8);
        if (u <= 0 || u >= 1) return null;
        return <ellipse key={d} cx={x} cy={y} rx={w * (60 + 220 * u)} ry={w * (10 + 26 * u)} fill="none" stroke="#fff" strokeWidth={8 * (1 - u)} />;
      })}
    </Svg>
  );
};

// barrier gate arm on the far bank (swings down on "stops")
const Barrier: React.FC<{t: number}> = ({t}) => {
  if (t < T.but || t > CUT_LAKE) return null;
  const up = pop(t, T.halfway, 0.3);
  const ang = t < T.stops - 0.25 ? -88 : lerp(-88, 0, easeInCubic(prog(t, T.stops - 0.25, T.stops))) + (t > T.stops ? -6 * spring(t - T.stops, 3, 6) : 0);
  const px = 1830;
  const py = 1300;
  return (
    <Svg>
      <g transform={`translate(${px} ${py}) scale(${up})`}>
        <rect x={-14} y={-150} width={28} height={150} fill="#6B6F76" stroke={INK} strokeWidth={6} />
        <g transform={`translate(0 -130) rotate(${ang})`}>
          <rect x={-240} y={-14} width={240} height={28} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-230 + i * 60} y={-11} width={30} height={22} fill={RED} />)}
          <rect x={-240} y={-14} width={240} height={28} rx={8} fill="none" stroke={INK} strokeWidth={6} />
        </g>
        <circle cx={0} cy={-130} r={20} fill={YEL} stroke={INK} strokeWidth={6} />
      </g>
    </Svg>
  );
};

// a STOP sign that pops on the barrier post
const StopSign: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.stops, T.pay + 0.1, 0.3);
  if (s <= 0.001) return null;
  const pts = Array.from({length: 8}).map((_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    return `${Math.cos(a) * 92},${Math.sin(a) * 92}`;
  });
  return (
    <Svg>
      <g transform={`translate(1700 1010) scale(${s}) rotate(${6 * Math.sin(t * 9) * (1 - prog(t, T.stops, T.stops + 0.6))})`}>
        <rect x={-8} y={60} width={16} height={130} fill="#6B6F76" stroke={INK} strokeWidth={5} />
        <polygon points={pts.join(' ')} fill={RED} stroke={INK} strokeWidth={8} />
        <polygon points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={5} transform="scale(0.86)" />
        <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontSize={46} fill="#fff">STOP</text>
      </g>
    </Svg>
  );
};

// far-bank signpost "SUEZ CANAL" (and later the EUROPE arrow)
const Signpost: React.FC<{t: number; x: number; y: number; arrow: number; s?: number}> = ({x, y, arrow, s = 1}) => (
  <Svg>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-8} y={-150} width={16} height={150} fill="#8A5A3B" stroke={INK} strokeWidth={5} />
      <rect x={-120} y={-200} width={240} height={64} rx={10} fill="#2F7D4F" stroke={INK} strokeWidth={6} />
      <text x={0} y={-155} textAnchor="middle" fontFamily={FONT} fontSize={36} fill="#fff">SUEZ CANAL</text>
      {arrow > 0.001 ? (
        <g transform={`translate(30 -100) scale(${arrow})`}>
          <path d="M -110 -26 L 70 -26 L 70 -46 L 120 0 L 70 46 L 70 26 L -110 26 Z" fill="#3C7FC0" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <text x={-15} y={13} textAnchor="middle" fontFamily={FONT} fontSize={34} fill="#fff">EUROPE</text>
        </g>
      ) : null}
    </g>
  </Svg>
);

// ---------- screen-space insets ----------
// "halfway": a progress track with a little ship icon
const Halfway: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.halfway - 0.1, T.pay - 0.1, 0.3);
  if (s <= 0.001) return null;
  const u = 0.5 * easeInOutCubic(prog(t, T.halfway, T.egypt));
  const x0 = 170;
  const x1 = 910;
  const xx = lerp(x0, x1, u);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 600, transform: `scale(${s})`, transformOrigin: '540px 250px'}}>
      <svg width={1080} height={600} style={{position: 'absolute'}}>
        <rect x={x0 - 30} y={210} width={x1 - x0 + 60} height={44} rx={22} fill="#fff" stroke={INK} strokeWidth={8} />
        <rect x={x0 - 22} y={218} width={Math.max(0, xx - x0 + 22)} height={28} rx={14} fill="#43A6D1" />
        <line x1={540} x2={540} y1={190} y2={274} stroke={INK} strokeWidth={8} strokeDasharray="10 8" />
        <g transform={`translate(${xx} 180)`}>
          <path d="M -46 0 L 40 0 L 56 -16 L 56 6 L 44 22 L -40 22 Z" fill="#2B3F5C" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-34} y={-22} width={62} height={22} fill="#F08A3C" stroke={INK} strokeWidth={4} />
          <rect x={-46} y={-34} width={14} height={34} fill="#fff" stroke={INK} strokeWidth={4} />
        </g>
      </svg>
      <Label x={540} y={330} text="HALFWAY" size={64} s={pop(t, T.halfway + 0.35, 0.3)} fill={YEL} />
    </div>
  );
};

// the bill: unrolls from the top, the total counts up to $916,000,000, REFUSED stamp, then it flies away
const Bill: React.FC<{t: number}> = ({t}) => {
  if (t < T.pay - 0.05 || t > T.so2 + 0.1) return null;
  const unroll = easeOutCubic(prog(t, T.pay - 0.05, T.mess + 0.3));
  const fly = easeInCubic(prog(t, T.refuse + 0.55, T.so2));
  const H = 760 * unroll;
  const cnt = prog(t, T.over, T.dollars);
  const val = t < T.over ? 0 : Math.round(916 * easeOutCubic(cnt));
  const total = t >= T.dollars ? '$916,000,000' : `$${val},${String(Math.floor(rnd(Math.floor(t * 30)) * 999)).padStart(3, '0')},000`;
  const st = pop(t, T.refuse - 0.02, 0.22);
  const shk = t > T.refuse ? shake(t, 10 * Math.max(0, 1 - (t - T.refuse) / 0.3)) : {x: 0, y: 0};
  return (
    <div style={{position: 'absolute', left: 260 + shk.x, top: -40 - 1300 * fly + shk.y, width: 560, height: 900, transform: `rotate(${-3 + 25 * fly}deg)`, transformOrigin: '280px 0'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 560, height: H + 40, background: '#FFFDF4', border: '8px solid #000', borderTop: 'none', borderRadius: '0 0 18px 18px', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 70, width: 544, textAlign: 'center', fontFamily: FONT, fontSize: 64, color: '#000'}}>BILL</div>
        <div style={{position: 'absolute', left: 0, top: 150, width: 544, textAlign: 'center', fontFamily: FONT, fontSize: 34, color: '#555'}}>FOR THE MESS</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{position: 'absolute', left: 50, top: 230 + i * 62, width: 444, height: 16, borderRadius: 8, background: '#D9D4C8', transform: `scaleX(${0.6 + 0.4 * rnd(i + 2)})`, transformOrigin: '0 0'}} />
        ))}
        <div style={{position: 'absolute', left: 40, top: 500, width: 464, borderTop: '6px dashed #000'}} />
        <div style={{position: 'absolute', left: 0, top: 530, width: 544, textAlign: 'center', fontFamily: FONT, fontSize: 36, color: '#555'}}>TOTAL</div>
        <div style={{position: 'absolute', left: 0, top: 585, width: 544, textAlign: 'center', fontFamily: FONT, fontSize: 58, color: t >= T.dollars ? RED : '#000', transform: `scale(${bump(t, T.dollars, 0.35, 0.15)})`}}>
          {t >= T.over ? total : ''}
        </div>
        {st > 0.001 ? (
          <div style={{position: 'absolute', left: 272, top: 400, transform: `translate(-50%, -50%) rotate(-14deg) scale(${(2.2 - 1.2 * st) * st})`, border: `10px solid ${RED}`, borderRadius: 18, padding: '6px 22px', fontFamily: FONT, fontSize: 88, color: RED, opacity: 0.92, background: 'rgba(255,255,255,0.4)'}}>
            REFUSED
          </div>
        ) : null}
      </div>
      {/* the paper roll at the top */}
      <div style={{position: 'absolute', left: -20, top: 0, width: 600, height: 56, borderRadius: 28, background: '#F1ECDD', border: '8px solid #000'}} />
    </div>
  );
};

// tear-off calendar for "three months" (APR -> MAY -> JUN -> JUL)
const Calendar: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.for - 0.15, T.then + 0.3, 0.3);
  if (s <= 0.001) return null;
  const months = ['APR', 'MAY', 'JUN', 'JUL'];
  const flips = [T.three - 0.05, T.months - 0.15, T.months + 0.35];
  let i = 0;
  flips.forEach((f) => (t >= f ? (i += 1) : null));
  const lastFlip = flips[i - 1] ?? -10;
  const fu = prog(t, lastFlip, lastFlip + 0.3);
  return (
    <div style={{position: 'absolute', left: 540, top: 330, transform: `translate(-50%, -50%) scale(${s}) rotate(-4deg)`}}>
      <div style={{position: 'relative', width: 300, height: 300, background: '#fff', border: '8px solid #000', borderRadius: 20, overflow: 'visible'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 284, height: 80, background: RED, borderRadius: '12px 12px 0 0', borderBottom: '8px solid #000'}} />
        <div style={{position: 'absolute', left: 0, top: 110, width: 284, textAlign: 'center', fontFamily: FONT, fontSize: 104, color: '#000'}}>{months[i]}</div>
        {i > 0 && fu < 1 ? (
          <div style={{position: 'absolute', left: -8, top: 80, width: 300, height: 212, background: '#fff', border: '8px solid #000', transformOrigin: '50% 0', transform: `rotateX(${150 * fu}deg) translateY(${300 * fu * fu}px) rotate(${30 * fu}deg)`, opacity: 1 - fu * 0.2}}>
            <div style={{position: 'absolute', left: 0, top: 22, width: 284, textAlign: 'center', fontFamily: FONT, fontSize: 104}}>{months[i - 1]}</div>
          </div>
        ) : null}
        {[70, 214].map((xx) => <div key={xx} style={{position: 'absolute', left: xx - 12, top: -26, width: 24, height: 52, borderRadius: 12, background: '#888', border: '6px solid #000'}} />)}
      </div>
    </div>
  );
};

// "DEAL" contract card
const DealCard: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.then, CUT_BACK - 0.15, 0.3);
  if (s <= 0.001) return null;
  const st = pop(t, T.deal - 0.03, 0.22);
  return (
    <div style={{position: 'absolute', left: 540, top: 400, transform: `translate(-50%, -50%) scale(${s}) rotate(3deg)`}}>
      <div style={{position: 'relative', width: 420, height: 400, background: '#FFFDF4', border: '8px solid #000', borderRadius: 16}}>
        <div style={{position: 'absolute', left: 0, top: 36, width: 404, textAlign: 'center', fontFamily: FONT, fontSize: 40}}>AGREEMENT</div>
        {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 50, top: 110 + i * 50, width: 300 * (0.7 + 0.3 * rnd(i + 7)), height: 14, borderRadius: 7, background: '#D9D4C8'}} />)}
        <svg width={404} height={384} style={{position: 'absolute', left: 0, top: 0}}>
          <path d={`M 60 330 q 30 -40 60 0 t 60 0 t 60 -10`} fill="none" stroke="#2B4C7E" strokeWidth={6} strokeDasharray={260} strokeDashoffset={260 * (1 - prog(t, T.then + 0.2, T.deal - 0.1))} strokeLinecap="round" />
        </svg>
        {st > 0.001 ? (
          <div style={{position: 'absolute', left: 202, top: 230, transform: `translate(-50%, -50%) rotate(-12deg) scale(${(2.2 - 1.2 * st) * st})`, border: '10px solid #2E9E4F', borderRadius: 18, padding: '4px 26px', fontFamily: FONT, fontSize: 96, color: '#2E9E4F', background: 'rgba(255,255,255,0.5)'}}>
            DEAL
          </div>
        ) : null}
      </div>
    </div>
  );
};

// banner "6 WEEKS LATER"
const Banner: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.and + 0.02, T.sails + 0.25, 0.28);
  return <Label x={540} y={300} text="6 WEEKS LATER" size={96} s={s} rot={-3} fill={YEL} />;
};

// confetti (world)
const Confetti: React.FC<{t: number; t0: number; x: number; y: number}> = ({t, t0, x, y}) => {
  if (t < t0 || t > t0 + 1.6) return null;
  const u = t - t0;
  const cols = [RED, YEL, '#3C7FC0', '#2E9E4F', '#F08A3C'];
  return (
    <Svg>
      {Array.from({length: 22}).map((_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * rnd(i + 40));
        const v = 380 + 300 * rnd(i + 50);
        const px = x + Math.cos(a) * v * u;
        const py = y + Math.sin(a) * v * u + 0.5 * 700 * u * u;
        return <rect key={i} x={px} y={py} width={18} height={10} fill={cols[i % 5]} stroke={INK} strokeWidth={3} transform={`rotate(${400 * u * (rnd(i) - 0.5)} ${px} ${py})`} opacity={1 - prog(u, 1.2, 1.6)} />;
      })}
    </Svg>
  );
};

// anchor on a chain from the bow (lake)
const Anchor: React.FC<{t: number; x: number; y0: number}> = ({t, x, y0}) => {
  if (t < T.sits - 0.3) return null;
  const down = easeInCubic(prog(t, T.sits - 0.3, T.sits + 0.05));
  const up = easeInOutCubic(prog(t, T.deal + 0.15, T.deal + 0.6));
  const y = y0 + 150 * down - 150 * up;
  return (
    <Svg>
      <line x1={x} x2={x} y1={y0 - 60} y2={y - 30} stroke={INK} strokeWidth={6} strokeDasharray="12 6" />
      <g transform={`translate(${x} ${y})`}>
        <circle cx={0} cy={-34} r={10} fill="none" stroke={INK} strokeWidth={6} />
        <line x1={0} x2={0} y1={-24} y2={30} stroke={INK} strokeWidth={9} />
        <line x1={-18} x2={18} y1={-10} y2={-10} stroke={INK} strokeWidth={7} />
        <path d="M -30 12 Q -24 36 0 36 Q 24 36 30 12" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      </g>
    </Svg>
  );
};

// sun racing over the sky (lake, "three months")
const SunRace: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T.for - 0.1, T.then - 0.05);
  if (u <= 0 || u >= 1) return null;
  const cyc = (u * 3) % 1;
  const x = lerp(250, 1800, cyc);
  const y = 700 - 380 * Math.sin(Math.PI * cyc);
  return (
    <Svg>
      <circle cx={x} cy={y} r={58} fill="#FFE27A" stroke={INK} strokeWidth={7} />
      {Array.from({length: 8}).map((_, i) => {
        const a = (Math.PI / 4) * i + t * 3;
        return <line key={i} x1={x + Math.cos(a) * 74} y1={y + Math.sin(a) * 74} x2={x + Math.cos(a) * 98} y2={y + Math.sin(a) * 98} stroke={INK} strokeWidth={8} strokeLinecap="round" />;
      })}
    </Svg>
  );
};

// Zzz letters (lake)
const Zzz: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  if (t < T.lake || t > T.then) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const u = ((t - T.lake) * 0.7 + i / 3) % 1;
        return (
          <div key={i} style={{position: 'absolute', left: x + 60 * u + 20 * Math.sin(u * 6), top: y - 160 * u, fontFamily: FONT, fontSize: 40 + 30 * u, color: '#fff', WebkitTextStroke: '8px #000', paintOrder: 'stroke fill', opacity: u < 0.8 ? 1 : 1 - (u - 0.8) * 5}}>
            Z
          </div>
        );
      })}
    </>
  );
};

// tugboat with code eyes over its round windows
const Tug: React.FC<{t: number; x: number; y: number; s: number; sx: number; t0: number; lookX: number; lookY?: number}> = ({t, x, y, s, sx, t0, lookX, lookY = 0}) => {
  const p = pop(t, t0, 0.3);
  if (p <= 0.001) return null;
  const bob = 6 * Math.sin(2 * Math.PI * 0.9 * t + t0);
  const sus = prog(t, T.watching - 0.05, T.watching + 0.2);
  return (
    <Spr n="tug" x={x} y={y + bob} s={s * p} sx={sx} ax={205} ay={300}>
      {[[170, 149], [238, 159]].map(([ex, ey], i) => (
        <Eye key={i} x={ex} y={ey} r={24} open={1} lid={0.45 * sus} lidTilt={0} look={[lookX * sx, lookY]} side={i ? 1 : -1} brow={0.75 - 0.3 * sus} browTilt={-0.9 * sus} ink={0.2} />
      ))}
    </Spr>
  );
};

// ---------- camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 1300, y: 1210, k: 1.36},
  {t: 1.3, x: 1290, y: 1215, k: 1.4},
  {t: T.unstuck + 0.2, x: 1290, y: 1215, k: 1.4},
  {t: T.canal + 0.3, x: 1040, y: 1090, k: 1.12},
  {t: T.off, x: 1040, y: 1090, k: 1.12},
  {t: T.stops - 0.1, x: 1300, y: 1090, k: 1.12},
  {t: T.stops + 0.35, x: 1330, y: 1110, k: 1.16, ease: 'out'},
  {t: T.refuse + 0.4, x: 1290, y: 1100, k: 1.14},
  // lake (cut)
  {t: CUT_LAKE, x: 1024, y: 1130, k: 1.2, ease: 'cut'},
  {t: T.crew - 0.35, x: 1060, y: 1150, k: 1.24},
  {t: T.board + 0.15, x: 1360, y: 1330, k: 1.9},
  {t: T.for + 0.15, x: 1360, y: 1330, k: 1.9},
  {t: T.three + 0.3, x: 1024, y: 1130, k: 1.2},
  {t: CUT_BACK - 0.05, x: 1040, y: 1130, k: 1.22},
];
// back in the canal: the camera follows the ship (see backCam)
const backShipX = (t: number) => lerp(1540, 1010, easeInOutCubic(prog(t, CUT_BACK, 24.5)) * 0.35 + prog(t, CUT_BACK, 24.5) * 0.65);
const backCam = (t: number): Cam => {
  const u = easeInOutCubic(prog(t, T.two - 0.25, T.two + 0.55));
  const k = lerp(1.06, 1.34, u) * (1 + 0.05 * easeInOutCubic(prog(t, T.watching - 0.2, T.watching + 0.5)));
  const ymax = 1936 - 960 / k;
  const bow = backShipX(t) - (1481 - 749) * SS;
  return {x: lerp(backShipX(t) - 20, bow + 190, u), y: Math.min(lerp(1000, 1215, u), ymax), k};
};

// ---------- the scene ----------
export const SuezScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camOverride, cover}) => {
  const base = camOverride ?? (t >= CUT_BACK ? backCam(t) : camAt(t, CAM));
  // shake: unstuck lurch, barrier slam, stamp
  const sh =
    t > T.unstuck && t < T.unstuck + 0.5 ? shake(t, 12 * (1 - (t - T.unstuck) / 0.5))
    : t > T.stops && t < T.stops + 0.45 ? shake(t, 14 * (1 - (t - T.stops) / 0.45))
    : t < T.unstuck ? shake(t, 2.2)
    : {x: 0, y: 0};
  const cam = {x: base.x - sh.x / base.k, y: base.y - sh.y / base.k, k: base.k};
  const inLake = !cover && t >= CUT_LAKE && t < CUT_BACK;
  const back = !cover && t >= CUT_BACK;

  if (inLake) {
    // ---------- LAKE ----------
    const sx = 1024;
    const bobY = 5 * Math.sin(2 * Math.PI * 0.35 * t);
    const rock = 0.6 * Math.sin(2 * Math.PI * 0.35 * t + 0.6);
    const bowX = sx + (1440 - 749) * LSS;
    const deckY = LWL - (398 - 226) * LSS + bobY;
    const guyPose: Pose = t < T.deal - 0.02 ? 'fish' : 'cheer';
    const rodtip = S('fish').rodtip ?? [478, 132];
    const gk = (0.24 * HEAD_R) / (S('fish').hd?.[2] ?? HEAD_R);
    const gx = bowX - 40;
    const tipX = gx + (rodtip[0] - 150) * gk;
    const tipY = deckY + (rodtip[1] - 560) * gk;
    const bobber = [tipX + 70, LWL + 30 + 4 * Math.sin(t * 3)];
    return (
      <AbsoluteFill style={{backgroundColor: '#AFDCF0'}}>
        <World cam={cam}>
          <Img src={F('lake')} style={{position: 'absolute', left: 0, top: 0, width: 2048, height: 1936}} />
          <SunRace t={t} />
          {/* night tint pulses during the three months */}
          <Ship t={t} x={sx} y={LWL + bobY} s={LSS} rot={rock} face={shipFace(t)} />
          {guyPose === 'fish' ? (
            <>
              <Svg>
                <path d={`M ${tipX} ${tipY} Q ${tipX + 60} ${tipY + 120} ${bobber[0]} ${bobber[1]}`} fill="none" stroke={INK} strokeWidth={3} />
                <circle cx={bobber[0]} cy={bobber[1]} r={11} fill={RED} stroke={INK} strokeWidth={4} />
              </Svg>
              <Guy t={t} pose="fish" x={gx} y={deckY} s={0.24} swapAt={-1} ax={150} ay={560} />
            </>
          ) : (
            <Guy t={t} pose="cheer" x={gx + 10} y={deckY} s={0.24} swapAt={T.deal - 0.02} />
          )}
          <Anchor t={t} x={bowX + 25} y0={LWL - 20} />
          <WaterFront t={t} y0={LWL} y1={1936} x0={0} x1={2048} col="#4B9ED3" steps={[[1640, '#4294CC'], [1840, '#3B8DC6']]} />
          <Rings t={t} t0={T.sits + 0.05} x={bowX + 25} y={LWL + 8} w={0.6} />
          <Confetti t={t} t0={T.deal} x={bowX - 20} y={deckY - 120} />
        </World>
        {/* night tint pulses (three nights) */}
        {(() => {
          const u = prog(t, T.for - 0.1, T.then - 0.05);
          if (u <= 0 || u >= 1) return null;
          const n = Math.max(0, -Math.cos(2 * Math.PI * u * 3)) * 0.22;
          return <AbsoluteFill style={{background: `rgba(20,30,80,${n})`}} />;
        })()}
        <Zzz t={t} x={(1060 - cam.x) * cam.k + 540} y={(1300 - cam.y) * cam.k + 960} />
        <Label x={540} y={1560} text="CREW ON BOARD" size={64} s={popOut(t, T.crew - 0.05, T.for + 0.1, 0.25)} rot={-3} fill={YEL} />
        <Calendar t={t} />
        <DealCard t={t} />
      </AbsoluteFill>
    );
  }

  // ---------- CANAL ----------
  // ship x / rotation
  let shipX: number;
  let rot = 0;
  let sx = 1;
  let sq: [number, number] = [1, 1];
  if (!back) {
    if (t < T.unstuck) {
      shipX = 1000;
      rot = -2.2 + 0.4 * Math.sin(2 * Math.PI * 2.2 * t) * prog(t, 0.6, 1.6);
    } else if (t < T.off) {
      const u = easeOutBack(prog(t, T.unstuck, T.unstuck + 0.55), 1.6);
      shipX = lerp(1000, 930, u);
      rot = lerp(-2.2, 0, easeOutCubic(prog(t, T.unstuck, T.unstuck + 0.4))) + 1.2 * Math.sin(2 * Math.PI * 1.4 * (t - T.unstuck)) * Math.exp(-3 * (t - T.unstuck));
    } else {
      const u = easeInOutCubic(prog(t, T.off, T.stops + 0.02));
      shipX = lerp(930, 1110, u);
      if (t > T.stops) {
        const s = spring(t - T.stops, 2.5, 5);
        sq = [1 - 0.05 * s, 1 + 0.05 * s];
        rot = -2.5 * s;
      }
    }
  } else {
    sx = -1;
    shipX = backShipX(t);
  }
  const bob = 4 * Math.sin(2 * Math.PI * 0.4 * t);
  const sweat =
    t > T.stops && t < CUT_LAKE ? pop(t, T.stops + 0.1, 0.2)
    : back ? pop(t, CUT_BACK + 0.3, 0.2)
    : 0;
  // guy pose
  let pose: Pose = 'nervous';
  let swapAt = -1;
  if (back) {
    pose = 'nervous';
  } else if (t >= T.refuse - 0.02) {
    pose = 'refuse';
    swapAt = T.refuse - 0.02;
  } else if (t >= T.stops) {
    pose = 'shock';
    swapAt = T.stops;
  } else if (t >= T.off - 0.05) {
    pose = 'point';
    swapAt = T.off - 0.05;
  } else if (t >= T.unstuck) {
    pose = 'cheer';
    swapAt = T.unstuck;
  }
  const guyX = back ? backShipX(t) - (1481 - 749) * SS + lerp(330, 480, easeInOutCubic(prog(t, T.two - 0.25, T.two + 0.55))) : 1010;
  const hop = pose === 'cheer' ? -30 * Math.abs(Math.sin(2 * Math.PI * 1.6 * (t - T.unstuck))) * (1 - prog(t, T.unstuck, T.off)) : 0;
  const dig = t < T.unstuck ? 4 * Math.sin(2 * Math.PI * 1.8 * t) : 0;
  const diggerJump = t > T.unstuck && t < T.unstuck + 0.5 ? -40 * Math.sin((Math.PI * (t - T.unstuck)) / 0.5) : 0;
  const arrow = back ? 0 : popOut(t, T.europe - 0.05, T.but, 0.3);
  const bowX = back ? shipX - (1481 - 749) * SS : shipX + (1481 - 749) * SS;
  const sternX = back ? shipX + 740 * SS : shipX - 740 * SS;
  return (
    <AbsoluteFill style={{backgroundColor: '#B0DFF2'}}>
      <World cam={cam}>
        <Img src={F('canal')} style={{position: 'absolute', left: 0, top: 0, width: 2048, height: 1936}} />
        <Svg>
          <circle cx={1669} cy={556} r={84} fill="#B0DFF2" />
        </Svg>
        {/* far-bank palms + signpost */}
        <Spr n="palm" x={420} y={1295} s={0.42} />
        <Spr n="palm" x={1660} y={1290} s={0.36} sx={-1} />
        <Signpost t={t} x={back ? 1300 : 640} y={1292} arrow={arrow} s={0.9} />
        <Barrier t={t} />
        <StopSign t={t} />
        {/* the mound only before the ship leaves */}
        {!back && t < T.stops ? <Mound t={t} /> : null}
        <Ship t={t} x={shipX} y={WL + bob} s={SS} rot={rot} sx={sx * sq[0]} sy={sq[1]} face={shipFace(t)} sweat={sweat} />
        {!back && t < T.stops ? (
          <Spr n="digger" x={1640} y={1345 + diggerJump} s={0.3} sx={-1} rot={dig} />
        ) : null}
        <WaterFront t={t} y0={WL + 6} y1={WATER_BOT} x0={0} x1={2048} col={WATER_C} />
        {/* wake behind the stern while sailing */}
        {(!back && t > T.off && t < T.stops) || back ? (
          <Svg>
            {[0, 1, 2].map((i) => {
              const u = ((t * 1.2 + i / 3) % 1);
              const wx = sternX + (back ? 1 : -1) * (30 + 140 * u);
              return <line key={i} x1={wx} x2={wx + (back ? 1 : -1) * 70} y1={WL + 22 + 10 * i} y2={WL + 22 + 10 * i} stroke="#fff" strokeWidth={8 * (1 - u)} strokeLinecap="round" />;
            })}
          </Svg>
        ) : null}
        <SandBurst t={t} t0={T.unstuck} />
        <Rings t={t} t0={T.unstuck + 0.05} x={bowX - 60} y={WL + 14} />
        <Confetti t={t} t0={T.unstuck} x={guyX} y={BANK_Y - 220} />
        {back ? (
          <>
            <Tug t={t} x={bowX - 70} y={WL + 60} s={0.44} sx={-1} t0={T.two - 0.05} lookX={1} lookY={-0.5} />
            <Tug t={t} x={bowX + 210} y={WL + 100} s={0.44} sx={1} t0={T.two + 0.12} lookX={1} lookY={-0.7} />
          </>
        ) : null}
        <Guy t={t} pose={pose} x={guyX} y={BANK_Y + hop} s={GUY_S} swapAt={swapAt} tremble={pose === 'shock' || pose === 'nervous' ? 1.4 : 0} />
      </World>
      {!cover ? (
        <>
          <Halfway t={t} />
          <Bill t={t} />
          <Banner t={t} />
          <Label x={540} y={300} text="UNSTUCK!" size={110} s={popOut(t, T.unstuck + 0.05, T.so - 0.2, 0.3)} rot={-4} fill={YEL} />
          <Label x={540} y={330} text="BABYSITTERS" size={96} s={popOut(t, T.tugboats + 0.05, 24.6, 0.3)} rot={3} fill={YEL} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'dig', at: 0.25, db: -24},
  {f: 'dig', at: 0.82, db: -25, rate: 1.1},
  {f: 'dig', at: 1.38, db: -24},
  {f: 'sand_suction', at: T.unstuck - 0.02, db: -13},
  {f: 'splash', at: T.unstuck + 0.08, db: -22},
  {f: 'pop', at: T.unstuck + 0.05, db: -24},
  {f: 'party_horn', at: T.unstuck + 0.12, db: -21},
  {f: 'ship_horn', at: T.so - 0.02, db: -20, dur: 0.45},
  {f: 'pop', at: T.europe - 0.05, db: -22},
  {f: 'scratch', at: T.but - 0.03, db: -18},
  {f: 'pop', at: T.halfway - 0.05, db: -23, rate: 1.2},
  {f: 'whoosh', at: T.halfway + 0.05, db: -28},
  {f: 'barrier', at: T.stops - 0.02, db: -14},
  {f: 'gulp', at: T.it - 0.05, db: -20},
  {f: 'unroll', at: T.pay - 0.06, db: -18},
  {f: 'receipt', at: T.mess - 0.05, db: -25, dur: 1.0},
  {f: 'tick_tock', at: T.over, db: -24},
  {f: 'kaching', at: T.dollars - 0.02, db: -17},
  {f: 'stamp', at: T.refuse - 0.02, db: -14},
  {f: 'whoosh', at: T.refuse + 0.6, db: -25},
  {f: 'splash', at: T.sits - 0.02, db: -22},
  {f: 'winch', at: T.sits - 0.35, db: -27, dur: 0.4},
  {f: 'crickets', at: T.lake + 0.1, db: -27},
  {f: 'flip', at: T.three - 0.3, db: -22},
  {f: 'flip', at: T.months - 0.45, db: -22},
  {f: 'flip', at: T.months + 0.05, db: -23},
  {f: 'stamp', at: T.deal - 0.03, db: -15},
  {f: 'twinkle', at: T.deal + 0.05, db: -22},
  {f: 'winch', at: T.deal + 0.15, db: -27, dur: 0.5},
  {f: 'whoosh', at: CUT_BACK - 0.05, db: -26},
  {f: 'flip', at: T.and - 0.25, db: -23},
  {f: 'chug', at: T.two - 0.05, db: -22},
  {f: 'pop', at: T.two - 0.05, db: -22},
  {f: 'pop', at: T.two + 0.12, db: -22, rate: 1.2},
  {f: 'gulp', at: T.watching + 0.02, db: -17},
];

export const SuezSequelShort: React.FC = () => {
  useSuezFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#B0DFF2'}}>
      <SuezScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('suez-sequel/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('suez-sequel/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="suez-sequel/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
