import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {BG_S, CAM_A, CAM_B, CAM_C, CAM_D, CH, DURATION, EARTH, FPS, LAB, REAL, SPACE, T, VO_AT, chartX, chartY, depthScale, doom, poseBox, type PoseName} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, type Cam} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {SweatDrop} from '../shared/SweatDrop';
import {useFont} from '../shared/useFont';

const F = (n: string) => staticFile(`doomsday-2026/${n}.png`);
export const FONT = 'DoomsdayInter';
export const useDoomFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));

const CHALK = '#F4F1E8';
const CHALK_INK = '#17241d';
const YELLOW = '#FFD54F';
const RED = '#E53935';
const STAMP = '#D32F2F';
const PAPER = '#FBF4DF';

// ---------- sounds (ElevenLabs: 5 new for this video + reused from sfx-library) ----------
const MIX_DB = 4.0; // Remotion's mix of earlier videos peaked ~-8 dBFS; lift voice and effects together
const MIX_GAIN = Math.pow(10, MIX_DB / 20);
const CUES_RAW: Cue[] = [
  {f: 'computer', at: 1.75, db: -24},
  {f: 'stamp', at: T.stamp, db: -11},
  {f: 'boing', at: T.stamp + 0.04, db: -30},
  {f: 'pop', at: 7.9, db: -20},
  {f: 'pop', at: 8.42, db: -21, rate: 1.1},
  {f: 'pop', at: 8.9, db: -21, rate: 1.2},
  {f: 'pop', at: 9.28, db: -22, rate: 1.3},
  {f: 'pop', at: 9.58, db: -22, rate: 1.4},
  {f: 'pop', at: 9.72, db: -23, rate: 1.5},
  {f: 'pop', at: 9.85, db: -23, rate: 1.6},
  {f: 'pop', at: 9.97, db: -24, rate: 1.7},
  {f: 'pop', at: 10.08, db: -24, rate: 1.8},
  {f: 'pop', at: 10.19, db: -25, rate: 1.9},
  {f: 'pop', at: 10.3, db: -25, rate: 2.0},
  {f: 'whoosh', at: 10.82, db: -28},
  {f: 'chalk', at: 11.08, db: -21},
  {f: 'whoosh', at: 11.9, db: -25, rate: 1.2},
  {f: 'rock_crack', at: 12.06, db: -22},
  {f: 'pop', at: 12.42, db: -20, rate: 0.8},
  {f: 'boing', at: 12.44, db: -28},
  {f: 'pop', at: T.thatDay, db: -24, rate: 1.2},
  {f: 'whoosh', at: 13.55, db: -27},
  {f: 'rumble', at: T.cutB, db: -34, dur: 1.5, keys: [[T.cutB, -38], [14.6, -30], [15.3, -34]]},
  {f: 'pop', at: 13.95, db: -27, rate: 1.4},
  {f: 'pop', at: 14.2, db: -27, rate: 1.6},
  {f: 'pop', at: 14.55, db: -26, rate: 1.5},
  {f: 'pop', at: 14.8, db: -26, rate: 1.8},
  {f: 'squeeze', at: T.squeezed - 0.02, db: -15},
  {f: 'squeeze', at: T.death - 0.02, db: -18, rate: 0.9},
  {f: 'whoosh', at: T.their - 0.12, db: -28, rate: 1.3},
  {f: 'catch', at: T.their + 0.06, db: -22},
  {f: 'ticks', at: T.decades - 0.04, db: -25, dur: 2.0},
  {f: 'pop', at: T.dots[0], db: -21, rate: 1.0},
  {f: 'pop', at: T.dots[1], db: -21, rate: 1.15},
  {f: 'pop', at: T.dots[2], db: -21, rate: 1.3},
  {f: 'whoosh', at: T.cutD - 0.02, db: -30},
  {f: 'pop', at: 21.97, db: -25, rate: 1.2},
  {f: 'pop', at: 22.06, db: -26, rate: 1.4},
  {f: 'pop', at: 22.15, db: -26, rate: 1.6},
  {f: 'pop', at: 22.24, db: -27, rate: 1.8},
  {f: 'pop', at: 22.33, db: -28, rate: 2.0},
  {f: 'crickets', at: 22.95, db: -26},
  {f: 'pop', at: T.families, db: -21, rate: 0.95},
  {f: 'chalk', at: 24.22, db: -28, rate: 0.95},
  {f: 'pop', at: T.two, db: -21, rate: 1.3},
  {f: 'pop', at: T.kids, db: -21, rate: 1.5},
  {f: 'boing', at: T.kids + 0.03, db: -28},
  {f: 'computer', at: 26.86, db: -27, dur: 0.62},
  {f: 'kaching', at: T.cure, db: -21},
  {f: 'stamp', at: T.doomsday2 + 0.02, db: -13},
  {f: 'computer', at: T.print, db: -27, dur: 0.42},
  {f: 'whoosh', at: T.loop - 0.08, db: -28},
];
const CUES: Cue[] = CUES_RAW.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}));

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const blink = (t: number, tc: number, half = 0.08) => clamp(1 - Math.abs(t - tc) / half);
type SpriteInfo = {w: number; h: number; head: readonly number[]; feet: readonly number[]};
const info = (p: PoseName) => SPR[p] as unknown as SpriteInfo;

// ---------- a character (full body, standing on its feet point) ----------
type GuyProps = {
  pose: PoseName;
  fx: number;
  fy: number;
  hr: number;
  sx?: number;
  sy?: number;
  rot?: number;
  flip?: boolean;
  shadow?: boolean;
  children?: React.ReactNode; // SVG overlay in sprite pixels
};
const Guy: React.FC<GuyProps> = ({pose, fx, fy, hr, sx = 1, sy = 1, rot = 0, flip = false, shadow = true, children}) => {
  if (sx <= 0.001 || sy <= 0.001) return null;
  const b = poseBox(pose, fx, fy, hr);
  const s = info(pose);
  const sw = hr * 2.6 * Math.min(sx, 1.2);
  return (
    <>
      {shadow ? (
        <div
          style={{
            position: 'absolute',
            left: fx - sw / 2,
            top: fy - hr * 0.09,
            width: sw,
            height: hr * 0.2,
            borderRadius: '50%',
            background: 'rgba(72, 54, 42, 0.26)',
            filter: 'blur(3px)',
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: fx, top: fy, transformOrigin: '0 0', transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * sx}, ${sy})`}}>
        <div style={{position: 'absolute', left: -s.feet[0] * b.k, top: -s.feet[1] * b.k, width: b.width, height: b.height}}>
          <Img src={F(pose)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
          {children ? (
            <svg viewBox={`0 0 ${s.w} ${s.h}`} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible'}}>
              {children}
            </svg>
          ) : null}
        </div>
      </div>
    </>
  );
};

// ---------- the doomsday calendar page (drawn on the page of the "calendar" pose, sprite pixels) ----------
const PAGE = SPR.calendar.page; // [x, y, w, h]
const BAND = SPR.calendar.band;
const pulse = (t: number, t0: number) => 1 + 0.16 * bump(t, t0, 0.3);
const PageText: React.FC<{t: number; stamp: number}> = ({t, stamp}) => {
  const cx = PAGE[0] + PAGE[2] / 2;
  const sb = pulse(t, T.november) * pulse(t, T.y2026);
  const sf = pulse(t, T.friday);
  const s13 = pulse(t, T.th13);
  const z = (s: number, x: number, y: number) => `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;
  const st = stamp <= 0 ? 0 : stamp < 1 ? lerp(1.9, 1, easeInCubic(stamp)) : 1;
  return (
    <g fontFamily={FONT} textAnchor="middle">
      <g transform={z(sb, cx, BAND[1] + BAND[3] / 2)}>
        <text x={cx} y={BAND[1] + BAND[3] / 2 + 15} fontSize={42} fill="#FFFFFF" letterSpacing={3}>
          NOVEMBER 2026
        </text>
      </g>
      <g transform={z(sf, cx, PAGE[1] + 92)}>
        <text x={cx} y={PAGE[1] + 118} fontSize={80} fill="#1B1B1B" letterSpacing={4}>
          FRIDAY
        </text>
      </g>
      <g transform={z(s13, cx, PAGE[1] + 300)}>
        <text x={cx} y={PAGE[1] + 392} fontSize={285} fill="#1B1B1B">
          13
        </text>
      </g>
      {stamp > 0 ? (
        <g transform={`translate(${cx} ${PAGE[1] + 468}) rotate(-8) scale(${st})`} opacity={0.94}>
          <rect x={-296} y={-74} width={592} height={140} rx={22} fill="rgba(255,255,255,0.35)" stroke={STAMP} strokeWidth={16} />
          <text x={0} y={30} fontSize={82} fill={STAMP} letterSpacing={1}>
            DOOMSDAY
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ---------- the 1960 computer (sprite pixels for the overlay, world feet point) ----------
const CMP = SPR.computer;
const CK = LAB.computer.h / CMP.h; // world units per sprite pixel
const LAMPS_X = [120, 195, 270, 345, 420, 495, 570];
const LAMPS_Y = [555, 608, 662];
const LAMP_ON = ['#FF8A80', '#FFF59D', '#B3E5FC'];
const COMPUTE: [number, number][] = [
  [2.2, 3.42],
  [10.8, 12.1],
  [26.86, 27.4],
  [T.print - 0.02, 99],
];
const BLINKS = [1.2, 6.05, 8.95, 23.1, 25.2];
type CompState = {
  spin: number; // reel angle (deg) in compute mode
  computing: boolean;
  lid: number;
  lidTilt: number;
  wink: number; // right eye lid
  look: [number, number];
  brow: number; // lift
  browTilt: number;
  sx: number;
  sy: number;
  dx: number;
  strip: number; // printed paper strip length (sprite px)
  page: number; // new doomsday page length (sprite px)
};
const compState = (t: number): CompState => {
  let computing = false;
  let lid = 0;
  for (const [a, b] of COMPUTE) {
    if (t >= a && t < b) computing = true;
    lid = Math.max(lid, blink(t, a), blink(t, b));
  }
  for (const b of BLINKS) lid = Math.max(lid, blink(t, b, 0.07));
  let look: [number, number] = [0.6, 0.15];
  let lidTilt = 0;
  let brow = 0.35;
  let browTilt = 0;
  let wink = 0;
  let base = 0;
  // smug after the doomsday result
  if (t >= 3.42 && t < 7.86) {
    base = 0.42;
    lidTilt = -10;
    browTilt = -0.4;
  }
  // the room fills up: surprised, eyes dart
  if (t >= 7.86 && t < 10.8) {
    look = [Math.sin(t * 5.3) * 0.8, 0.1];
    brow = 0.75;
  }
  // phase D: the crowd is gone -> looks around
  if (t >= T.cutD && t < 24.1) {
    look = [Math.sin((t - T.cutD) * 3.2) * 0.85, 0];
    brow = 0.6;
  }
  if (t >= 24.1 && t < 26.86) {
    look = [0.7, 0.2];
    brow = 0.55;
  }
  // proud of its cure, wink on "doomsday"
  if (t >= 27.4 && t < T.print) {
    look = [0.6, 0.1];
    base = 0.25;
    brow = 0.6;
    wink = clamp(prog(t, T.doomsday2, T.doomsday2 + 0.08)) * (1 - prog(t, 27.98, 28.04));
  }
  lid = Math.max(lid, base);
  const spin = computing ? t * 900 : 0;
  // squash / hops
  const hop = bump(t, T.stamp - 0.02, 0.24) + bump(t, T.cure - 0.02, 0.24) + 0.8 * bump(t, T.doomsday2, 0.22);
  const jig = computing ? 3 * Math.sin(t * 2 * Math.PI * 11) : 0;
  return {
    spin,
    computing,
    lid,
    lidTilt,
    wink,
    look,
    brow,
    browTilt,
    sx: 1 + 0.04 * hop,
    sy: 1 - 0.05 * hop,
    dx: jig,
    strip: t < 13.9 ? 330 * easeOutCubic(prog(t, 2.3, 3.45)) : 0,
    page: t >= T.print && t < T.loop + 0.1 ? 360 * easeOutCubic(prog(t, T.print, T.loop)) : 0,
  };
};

const ReelEye: React.FC<{cx: number; cy: number; r: number; st: CompState; side: 1 | -1; id: string}> = ({cx, cy, r, st, side, id}) => {
  const lid = side === 1 ? Math.max(st.lid, st.wink) : st.lid;
  const er = r * 0.93;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={er} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={er} fill="#F3EEE2" stroke="#000" strokeWidth={6} />
      <g clipPath={`url(#${id})`}>
        {st.computing ? (
          <g transform={`rotate(${st.spin * (side === 1 ? 1 : 1.13)} ${cx} ${cy})`}>
            {[0, 120, 240].map((a) => (
              <circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * r * 0.55} cy={cy + Math.sin((a * Math.PI) / 180) * r * 0.55} r={r * 0.22} fill="#5A3A24" stroke="#000" strokeWidth={5} />
            ))}
            <circle cx={cx} cy={cy} r={r * 0.2} fill="#9E9E9E" stroke="#000" strokeWidth={5} />
          </g>
        ) : (
          <g>
            <ellipse cx={cx + st.look[0] * er * 0.36} cy={cy + st.look[1] * er * 0.36} rx={er * 0.4} ry={er * 0.46} fill="#000" />
            <circle cx={cx + st.look[0] * er * 0.36 + er * 0.15} cy={cy + st.look[1] * er * 0.36 - er * 0.17} r={er * 0.13} fill="#fff" />
          </g>
        )}
        {lid > 0.001 ? (
          <g transform={`rotate(${st.lidTilt * side} ${cx} ${cy})`}>
            <rect x={cx - er * 1.6} y={cy - er * 1.6} width={er * 3.2} height={er * 0.6 + 2 * er * lid} fill="#BDB4A3" />
            <line x1={cx - er * 1.6} x2={cx + er * 1.6} y1={cy - er + 2 * er * lid} y2={cy - er + 2 * er * lid} stroke="#000" strokeWidth={7} />
          </g>
        ) : null}
      </g>
      <circle cx={cx} cy={cy} r={er} fill="none" stroke="#000" strokeWidth={7} />
    </g>
  );
};

const Computer: React.FC<{t: number; hideFace?: boolean}> = ({t, hideFace = false}) => {
  const st = compState(t);
  const fx = LAB.computer.x + st.dx;
  const fy = LAB.computer.y;
  const w = CMP.w * CK;
  const h = CMP.h * CK;
  const [r1, r2] = CMP.reels;
  const slot = CMP.slot;
  const sx0 = slot[0] + 40;
  const sw = slot[2] - 80;
  const sy0 = slot[1] + slot[3] / 2;
  return (
    <>
      <div style={{position: 'absolute', left: fx - w * 0.42, top: fy - 22, width: w * 0.84, height: 44, borderRadius: '50%', background: 'rgba(72, 54, 42, 0.26)', filter: 'blur(3px)'}} />
      <div style={{position: 'absolute', left: fx, top: fy, transformOrigin: '0 0', transform: `scale(${st.sx}, ${st.sy})`}}>
        <div style={{position: 'absolute', left: -CMP.feet[0] * CK, top: -CMP.feet[1] * CK, width: w, height: h}}>
          <Img src={F('computer')} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
          <svg viewBox={`0 0 ${CMP.w} ${CMP.h}`} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible'}}>
            {/* blinking lamps while it computes */}
            {st.computing
              ? LAMPS_Y.map((ly, j) =>
                  LAMPS_X.map((lx, i) =>
                    rnd(i * 7 + j * 13 + Math.floor(t * 14) * 3.1) > 0.45 ? (
                      <g key={`${i}-${j}`}>
                        <circle cx={lx} cy={ly} r={24} fill={LAMP_ON[j]} opacity={0.35} />
                        <circle cx={lx} cy={ly} r={12} fill={LAMP_ON[j]} />
                      </g>
                    ) : null,
                  ),
                )
              : null}
            {hideFace ? null : (
              <>
                <ReelEye cx={r1[0]} cy={r1[1]} r={r1[2]} st={st} side={-1} id="reelL" />
                <ReelEye cx={r2[0]} cy={r2[1]} r={r2[2]} st={st} side={1} id="reelR" />
                {!st.computing
                  ? [r1, r2].map((rr, i) => {
                      const sd = i === 0 ? -1 : 1;
                      const by = rr[1] - rr[2] * (1.12 + st.brow * 0.25);
                      const tilt = st.browTilt * sd * 26;
                      return (
                        <path
                          key={i}
                          d={`M ${rr[0] - rr[2] * 0.75} ${by + tilt} Q ${rr[0]} ${by - rr[2] * 0.28} ${rr[0] + rr[2] * 0.75} ${by - tilt}`}
                          fill="none"
                          stroke="#000"
                          strokeWidth={22}
                          strokeLinecap="round"
                        />
                      );
                    })
                  : null}
              </>
            )}
            {/* the printed result strip */}
            {st.strip > 1 ? (
              <g>
                <rect x={sx0 + 40} y={sy0} width={sw - 80} height={st.strip} fill={PAPER} stroke="#000" strokeWidth={6} />
                {Array.from({length: Math.floor(st.strip / 34)}).map((_, i) => (
                  <line key={i} x1={sx0 + 70} x2={sx0 + 70 + (sw - 160) * (0.45 + 0.5 * rnd(i + 3))} y1={sy0 + 26 + i * 34} y2={sy0 + 26 + i * 34} stroke="#555" strokeWidth={8} strokeLinecap="round" />
                ))}
              </g>
            ) : null}
            {/* the next doomsday page (loop) */}
            {st.page > 1 ? (
              <g>
                <rect x={sx0} y={sy0} width={sw} height={st.page} fill="#FFF4D6" stroke="#000" strokeWidth={7} />
                <rect x={sx0} y={sy0 + st.page - 34} width={sw} height={34} fill={RED} stroke="#000" strokeWidth={7} />
                {st.page > 200 ? (
                  <text x={sx0 + sw / 2} y={sy0 + st.page - 110} fontFamily={FONT} fontSize={62} fill={STAMP} textAnchor="middle">
                    DOOMSDAY
                  </text>
                ) : null}
              </g>
            ) : null}
            <rect x={slot[0]} y={slot[1] - 4} width={slot[2]} height={slot[3] + 8} fill="#2A2A2A" />
            <g transform={`rotate(-4 346 66)`}>
              <rect x={236} y={22} width={220} height={92} rx={12} fill="#FFF4D6" stroke="#000" strokeWidth={8} />
              <text x={346} y={96} fontFamily={FONT} fontSize={74} fill="#1B1B1B" textAnchor="middle">
                1960
              </text>
            </g>
          </svg>
        </div>
      </div>
    </>
  );
};

// ---------- the crowd (clones of the guy) in the lab ----------
type Clone = {x: number; fy: number; pose: 'panic' | 'hero'; flip: boolean; t0: number; seed: number; tOut: number};
const GEN_T = [7.9, 8.42, 8.9, 9.28, 9.58, 9.85, 10.08, 10.3];
const CLONES: Clone[] = (() => {
  const rows = [1440, 1560, 1690, 1820, 1960, 2100, 2270, 2430];
  const spots: {x: number; fy: number; seed: number}[] = [];
  rows.forEach((fy, ri) => {
    const s = depthScale(fy);
    const step = 0.47 * 900 * s * 0.8;
    let x = 70 + rnd(ri * 3.1 + 1) * step * 0.6;
    let j = 0;
    while (x < 1490) {
      const seed = ri * 40 + j;
      const nearHero = Math.abs(x - LAB.hero.x) < 300 + (fy > 2200 ? 120 : 0) && fy > 1900;
      const behindComputer = x < 660 && fy < 2010;
      if (!nearHero && !behindComputer) spots.push({x: x + (rnd(seed) - 0.5) * 40, fy: fy + (rnd(seed + 9) - 0.5) * 50, seed});
      x += step * (0.92 + 0.22 * rnd(seed + 5));
      j++;
    }
  });
  spots.sort((a, b) => Math.hypot(a.x - LAB.hero.x, (a.fy - LAB.hero.y) * 1.6) - Math.hypot(b.x - LAB.hero.x, (b.fy - LAB.hero.y) * 1.6));
  return spots.map((p, i) => {
    const g = Math.min(GEN_T.length - 1, Math.floor(Math.log2(i + 1)));
    const t0 = GEN_T[g] + (g >= 3 ? rnd(p.seed + 2) * 0.22 : 0);
    return {...p, pose: rnd(p.seed + 4) > 0.3 ? 'panic' : 'hero', flip: p.x > LAB.hero.x ? rnd(p.seed + 6) > 0.25 : rnd(p.seed + 6) > 0.8, t0, tOut: T.cutD + 0.1 + rnd(p.seed + 8) * 0.42};
  });
})();
// more people pop in under the board as the decades pass
const CLONES_C: Clone[] = [0, 1, 2]
  .flatMap((d) =>
    [0, 1, 2].map((j) => {
      const seed = 500 + d * 10 + j;
      const x = 640 + rnd(seed) * 760;
      return {x, fy: 1380 + rnd(seed + 1) * 90, pose: 'panic' as const, flip: rnd(seed + 2) > 0.5, t0: T.dots[d] + j * 0.07, seed, tOut: T.cutD + 0.1 + rnd(seed + 8) * 0.42};
    }),
  );

const clonePuffs = (t: number, c: Clone, hr: number): Puff[] => {
  const u = prog(t, c.tOut + 0.06, c.tOut + 0.4);
  if (u <= 0 || u >= 1) return [];
  const cy = c.fy - hr * 2.6;
  const g = Math.sin(Math.PI * u);
  return [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + c.seed;
    return {x: c.x + Math.cos(a) * hr * (0.6 + 0.9 * u), y: cy + Math.sin(a) * hr * (0.5 + 0.8 * u), r: hr * 0.55 * g};
  });
};

const CloneGuy: React.FC<{c: Clone; t: number}> = ({c, t}) => {
  if (t < c.t0) return null;
  const hr = LAB.hr * depthScale(c.fy);
  const sIn = easeOutBack(clamp((t - c.t0) / 0.2), 2.2);
  const sOut = 1 - easeInCubic(prog(t, c.tOut, c.tOut + 0.12));
  const s = sIn * sOut;
  const tremble = c.pose === 'panic' ? 2.2 * Math.sin(2 * Math.PI * 8.5 * t + c.seed) : 0;
  const breathe = 1 + 0.01 * Math.sin(2 * Math.PI * 0.7 * t + c.seed);
  return <Guy pose={c.pose} fx={c.x + tremble} fy={c.fy} hr={hr} sx={s} sy={s * breathe} flip={c.flip} shadow={s > 0.6} />;
};

// ---------- the chart on the board ----------
const curvePts = (() => {
  const pts: [number, number][] = [];
  for (let y = 1900; y < 2011; y += 3) pts.push([chartX(y), chartY(doom(y))]);
  for (let y = 2011; y < 2021.2; y += 0.25) pts.push([chartX(y), chartY(doom(y))]);
  return pts.filter((p) => p[1] > -640);
})();
const polyLen = (pts: [number, number][]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const boardTop = LAB.board.y;
const iBoard = curvePts.findIndex((p) => p[1] < boardTop + 40);
const LEN_IN = polyLen(curvePts.slice(0, iBoard + 1));
const LEN_ALL = polyLen(curvePts);
const toD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const CURVE_D = toD(curvePts);
const realPts = (from: number) => REAL.filter(([y]) => y >= from).map(([y, n]) => [chartX(y), chartY(n)] as [number, number]);
const REAL_LINE = realPts(1990);
const REAL_LEN = polyLen(REAL_LINE);

const ChalkStroke: React.FC<{d: string; len: number; u: number; w: number; color?: string; dash?: string}> = ({d, len, u, w, color = CHALK, dash}) =>
  u <= 0.001 ? null : (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={CHALK_INK} strokeWidth={w + 8} strokeDasharray={`${len * u} ${len * 3}`} />
      <path d={d} stroke={color} strokeWidth={w} strokeDasharray={dash ?? `${len * u} ${len * 3}`} opacity={dash ? clamp(u * 3) : 1} />
    </g>
  );

const ChalkText: React.FC<{x: number; y: number; s: number; size: number; color?: string; rot?: number; children: React.ReactNode}> = ({x, y, s, size, color = CHALK, rot = 0, children}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.36} fontFamily={FONT} fontSize={size} fill={color} stroke={CHALK_INK} strokeWidth={size * 0.12} paintOrder="stroke fill" textAnchor="middle">
        {children}
      </text>
    </g>
  );

const Chart: React.FC<{t: number}> = ({t}) => {
  if (t < 10.9 || (t >= T.loop && t < 99)) return null;
  const ax = prog(t, 10.9, 11.12);
  const uIn = prog(t, 11.1, 11.9);
  const uUp = prog(t, T.infinite, 12.45);
  const u = uUp > 0 ? (LEN_IN + (LEN_ALL - LEN_IN) * easeInCubic(uUp)) / LEN_ALL : (LEN_IN * easeInOutCubic(uIn)) / LEN_ALL;
  const inf = pop(t, T.people2, 0.3);
  const red = prog(t, T.thatDay, T.thatDay + 0.3);
  const x26 = chartX(2026);
  const yearIdx = t < T.dots[0] ? -1 : t < T.dots[1] ? 0 : t < T.dots[2] ? 1 : 2;
  const year = yearIdx < 0 ? '1960' : String(REAL[yearIdx][0]);
  const showYear = t >= T.cutC - 0.01 && t < T.cutD + 0.5;
  const realU = easeInOutCubic(prog(t, 24.22, 25.5));
  const today = pop(t, 25.5, 0.25);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: LAB.w, height: LAB.h, overflow: 'visible'}} viewBox={`0 0 ${LAB.w} ${LAB.h}`}>
      {/* axes */}
      <ChalkStroke d={`M ${CH.x0} ${CH.yTop - 20} L ${CH.x0} ${CH.yAxis} L ${CH.x1} ${CH.yAxis}`} len={(CH.yAxis - CH.yTop + 20) + (CH.x1 - CH.x0)} u={ax} w={7} />
      <ChalkText x={CH.x0 - 42} y={(CH.yAxis + CH.yTop) / 2} s={ax} size={40} rot={-90}>
        PEOPLE
      </ChalkText>
      <ChalkText x={CH.x0} y={CH.yAxis + 34} s={ax} size={34}>
        1900
      </ChalkText>
      {/* the 2026 asymptote */}
      {red > 0 ? (
        <g>
          <line x1={x26} x2={x26} y1={CH.yAxis} y2={lerp(CH.yAxis, -700, red)} stroke={CHALK_INK} strokeWidth={14} strokeDasharray="34 26" />
          <line x1={x26} x2={x26} y1={CH.yAxis} y2={lerp(CH.yAxis, -700, red)} stroke="#FF6B5E" strokeWidth={8} strokeDasharray="34 26" />
          <ChalkText x={x26} y={CH.yAxis + 34} s={pop(t, T.thatDay, 0.3)} size={36} color="#FF6B5E">
            2026
          </ChalkText>
        </g>
      ) : null}
      {/* the doomsday curve: slow, then straight up off the board */}
      <ChalkStroke d={CURVE_D} len={LEN_ALL} u={u} w={11} />
      <ChalkText x={chartX(2016)} y={-560} s={inf} size={190}>
        ∞
      </ChalkText>
      {/* decades: the real numbers keep up */}
      {showYear ? (
        <ChalkText x={CH.x0 + 150} y={CH.yTop + 50} s={1 + 0.2 * (bump(t, T.dots[0], 0.25) + bump(t, T.dots[1], 0.25) + bump(t, T.dots[2], 0.25))} size={78} color={YELLOW}>
          {year}
        </ChalkText>
      ) : null}
      {REAL.slice(0, 3).map(([y, n], i) => {
        const s = pop(t, T.dots[i], 0.25) * (1 + 0.25 * bump(t, T.curve, 0.3));
        return s > 0.001 ? <circle key={y} cx={chartX(y)} cy={chartY(n)} r={17 * s} fill={YELLOW} stroke={CHALK_INK} strokeWidth={6} /> : null;
      })}
      {/* families shrank: the real line bends away from doomsday */}
      <ChalkStroke d={toD(REAL_LINE)} len={REAL_LEN} u={realU} w={10} color={YELLOW} />
      {today > 0 ? (
        <g>
          <circle cx={REAL_LINE[REAL_LINE.length - 1][0]} cy={REAL_LINE[REAL_LINE.length - 1][1]} r={19 * today} fill={YELLOW} stroke={CHALK_INK} strokeWidth={6} />
          <ChalkText x={REAL_LINE[REAL_LINE.length - 1][0] - 30} y={REAL_LINE[REAL_LINE.length - 1][1] + 58} s={today} size={36} color={YELLOW}>
            TODAY
          </ChalkText>
        </g>
      ) : null}
    </svg>
  );
};

// ---------- the guy in the lab ----------
type HeroState = {pose: PoseName; sx: number; sy: number; fx: number; fy: number};
// t = story time (the loop frame replays t = 0), ta = real time for idle motion (tremble, breathing)
const heroLab = (t: number, ta: number): HeroState => {
  const y = LAB.hero.y;
  const x = t >= T.cutD ? FAM.heroX : LAB.hero.x;
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * ta);
  if (t < T.cutC) {
    const flinch = bump(t, T.stamp, 0.26);
    return {pose: 'calendar', sx: 1 + 0.05 * flinch, sy: breathe - 0.07 * flinch, fx: x + 2 * Math.sin(2 * Math.PI * 9 * ta), fy: y};
  }
  if (t < 22.3) return {pose: 'panic', sx: 1, sy: breathe, fx: x + 2 * Math.sin(2 * Math.PI * 8 * t), fy: y};
  if (t < 24.2) {
    const sq = bump(t, 22.24, 0.24);
    return {pose: 'shrug', sx: 1 + 0.05 * sq, sy: breathe - 0.07 * sq + 0.025 * bump(t, T.still, 0.3), fx: x, fy: y};
  }
  if (t < T.that) {
    const sq = bump(t, 24.12, 0.2);
    return {pose: 'hero', sx: 1 + 0.04 * sq, sy: breathe - 0.06 * sq, fx: x, fy: y};
  }
  const sq = bump(t, T.that - 0.07, 0.24);
  return {pose: 'happy', sx: 1 + 0.05 * sq, sy: breathe - 0.07 * sq + 0.03 * bump(t, T.doomsday2, 0.26), fx: x - 10, fy: y};
};

// family (phase D)
const FAM = {
  heroX: 740, // the guy stands a little to the left once the room is empty
  partner: {x: 1080, y: 2165},
  kidWave: {x: 1285, y: 2255},
  kidHug: {x: 545, y: 2275},
  kidHr: LAB.hr * 0.62,
};

// the cure card, printed by the computer and shown over it
const CureCard: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, 26.95, T.cure);
  if (u <= 0 || t >= T.loop) return null;
  const e = easeOutBack(u, 1.6);
  const x = lerp(331, 430, e);
  const y = lerp(1560, 676, e);
  const s = lerp(0.2, 0.8, e) * (1 + 0.06 * bump(t, T.doomsday2, 0.25));
  const chk = pop(t, T.doomsday2 + 0.02, 0.25);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: LAB.w, height: LAB.h, overflow: 'visible'}} viewBox={`0 0 ${LAB.w} ${LAB.h}`}>
      <g transform={`translate(${x} ${y}) rotate(${lerp(-12, -4, e)}) scale(${s})`} fontFamily={FONT} textAnchor="middle">
        <rect x={-320} y={-190} width={640} height={380} rx={26} fill={PAPER} stroke="#000" strokeWidth={12} />
        <text x={0} y={-108} fontSize={50} fill="#5B5B5B">
          1960 CURE:
        </text>
        <text x={0} y={-12} fontSize={84} fill="#1B1B1B">
          JUST OVER
        </text>
        <text x={0} y={128} fontSize={150} fill="#1B1B1B">
          2 KIDS
        </text>
        {chk > 0 ? (
          <g transform={`translate(262 -150) rotate(-8) scale(${chk})`}>
            <circle cx={0} cy={0} r={92} fill="#43A047" stroke="#000" strokeWidth={12} />
            <path d="M -44 2 L -12 36 L 48 -36" fill="none" stroke="#FFFFFF" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
      </g>
    </svg>
  );
};

// ---------- the lab scene (phases A, C, D and the loop frame) ----------
export const LabScene: React.FC<{t: number; tl: number; cam: Cam; cover?: boolean}> = ({t, tl, cam, cover = false}) => {
  const hs = heroLab(tl, t);
  const showClones = tl >= 7.8 && tl < T.cutD + 0.7;
  const clones = showClones ? [...CLONES, ...(tl >= T.cutC ? CLONES_C : [])].sort((a, b) => a.fy - b.fy) : [];
  const puffs: Puff[] = tl >= T.cutD ? [...CLONES, ...CLONES_C].flatMap((c) => clonePuffs(tl, c, LAB.hr * depthScale(c.fy) * 0.55)) : [];
  const stamp = tl < T.cutC ? prog(tl, T.stamp - 0.1, T.stamp) : 0;
  const sh = shake(t, 9 * Math.exp(-6 * Math.max(0, tl - T.stamp)) * (tl >= T.stamp && tl < 5 ? 1 : 0) + 5 * Math.exp(-7 * Math.max(0, tl - T.doomsday2)) * (tl >= T.doomsday2 && tl < 29 ? 1 : 0));
  const sweat = tl < T.cutC ? pop(tl, T.stamp + 0.08, 0.2) * (1 - prog(tl, 5.6, 5.75)) : 0;
  const sweatSlide = easeInOutCubic(prog(tl, T.stamp + 0.3, 5.5));
  const famIn = (t0: number) => pop(tl, t0, 0.25);
  const showFam = tl >= T.families && tl < T.loop;
  const kidHop = (d: number) => 30 * bump(tl, T.doomsday2 + d, 0.3);
  const all: React.ReactNode[] = [];
  // depth-sorted bodies (computer at fy 2000)
  type Body = {fy: number; node: React.ReactNode};
  const bodies: Body[] = clones.map((c) => ({fy: c.fy, node: <CloneGuy key={`c${c.seed}`} c={c} t={tl} />}));
  if (!cover) bodies.push({fy: LAB.computer.y, node: <Computer key="computer" t={tl} />});
  bodies.push({
    fy: hs.fy,
    node: (
      <Guy key="hero" pose={hs.pose} fx={hs.fx} fy={hs.fy} hr={LAB.hr} sx={hs.sx} sy={hs.sy}>
        {hs.pose === 'calendar' ? (
          <>
            <PageText t={tl} stamp={cover ? 1 : stamp} />
            <SweatDrop x={info('calendar').head[0] + 150} y={info('calendar').head[1] - 70 + 120 * sweatSlide} r={26} s={sweat} />
          </>
        ) : null}
      </Guy>
    ),
  });
  if (showFam) {
    bodies.push({fy: FAM.partner.y, node: <Guy key="partner" pose="hero" fx={FAM.partner.x} fy={FAM.partner.y} hr={LAB.hr * 0.97} sx={famIn(T.families)} sy={famIn(T.families) * (1 + 0.01 * Math.sin(tl * 4))} flip />});
    bodies.push({fy: FAM.kidHug.y, node: <Guy key="kh" pose="kid_hug" fx={FAM.kidHug.x} fy={FAM.kidHug.y - kidHop(0.02)} hr={FAM.kidHr} sx={famIn(T.two)} sy={famIn(T.two)} />});
    bodies.push({fy: FAM.kidWave.y, node: <Guy key="kw" pose="kid_wave" fx={FAM.kidWave.x} fy={FAM.kidWave.y - kidHop(0.1)} hr={FAM.kidHr} sx={famIn(T.kids)} sy={famIn(T.kids)} flip />});
  }
  bodies.sort((a, b) => a.fy - b.fy).forEach((b) => all.push(b.node));
  const planks = Array.from({length: 9}).map((_, i) => LAB.h + 70 + i * 95);
  return (
    <AbsoluteFill style={{background: LAB.wall}}>
      <World cam={cam} off={sh}>
        {/* the wall goes on above the plate, the floor below it */}
        <div style={{position: 'absolute', left: -800, top: -1600, width: LAB.w + 1600, height: 1600 + 10, background: LAB.wall}} />
        <div style={{position: 'absolute', left: -800, top: LAB.h - 10, width: LAB.w + 1600, height: 1400, background: LAB.wood}} />
        <svg style={{position: 'absolute', left: 0, top: 0, width: LAB.w, height: LAB.h + 1400, overflow: 'visible'}} viewBox={`0 0 ${LAB.w} ${LAB.h + 1400}`}>
          {planks.map((y) => (
            <line key={y} x1={-800} x2={LAB.w + 800} y1={y} y2={y} stroke="#9C7B55" strokeWidth={4} />
          ))}
        </svg>
        <Img src={F('bg_lab')} style={{position: 'absolute', left: 0, top: 0, width: LAB.w, height: LAB.h}} />
        <Chart t={cover ? 0 : tl} />
        {all}
        <CureCard t={tl} />
        <svg style={{position: 'absolute', left: 0, top: 0, width: LAB.w, height: LAB.h + 600, overflow: 'visible'}} viewBox={`0 0 ${LAB.w} ${LAB.h + 600}`}>
          {puffs.length ? <PuffCluster puffs={puffs} fill="#FFFFFF" ink={5} /> : null}
        </svg>
      </World>
    </AbsoluteFill>
  );
};

// ---------- scene B: the Earth covered in people ----------
type Tiny = {a: number; R: number; pose: 'panic' | 'hero'; flip: boolean; t0: number; seed: number};
const TINY_H = 138; // world units
const TINY: Tiny[] = (() => {
  const out: Tiny[] = [];
  [0, 1, 2].forEach((ring) => {
    const R = EARTH.r - 6 + ring * TINY_H * 0.86;
    const step = ((TINY_H * 0.44) / R) * (180 / Math.PI);
    const span = ring === 0 ? 84 : ring === 1 ? 76 : 66;
    let i = 0;
    for (let a = -span; a <= span; a += step) {
      const seed = ring * 100 + i++;
      const t0 = ring === 0 ? 0 : ring === 1 ? T.cutB + 0.08 + rnd(seed) * 0.75 : T.wed + rnd(seed) * 0.6;
      out.push({a: a + (rnd(seed + 3) - 0.5) * step * 0.3, R, pose: rnd(seed + 1) > 0.25 ? 'panic' : 'hero', flip: rnd(seed + 2) > 0.5, t0, seed});
    }
  });
  return out;
})();

const TINY_BY_RING = [...TINY].sort((a, b) => b.R - a.R); // outer rings first, the ring on the ground in front
const TinyGuy: React.FC<{g: Tiny; t: number}> = ({g, t}) => {
  if (t < g.t0) return null;
  const s = g.t0 <= 0 ? 1 : easeOutBack(clamp((t - g.t0) / 0.18), 2.2);
  const p = info(g.pose);
  const k = TINY_H / p.h;
  const rad = (g.a * Math.PI) / 180;
  const fx = EARTH.x + Math.sin(rad) * g.R;
  const fy = EARTH.y - Math.cos(rad) * g.R;
  const jit = 1.5 * Math.sin(2 * Math.PI * 9 * t + g.seed);
  return (
    <div style={{position: 'absolute', left: fx, top: fy, transformOrigin: '0 0', transform: `rotate(${g.a + jit * 0.4}deg) scale(${(g.flip ? -1 : 1) * s}, ${s})`}}>
      <Img src={F(g.pose)} style={{position: 'absolute', left: -p.feet[0] * k, top: -p.feet[1] * k, width: p.w * k, height: p.h * k}} />
    </div>
  );
};

const EarthScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM_B);
  const u = easeInOutCubic(prog(t, T.wed, T.squeezed));
  const sx = 1 + 0.05 * u + 0.01 * Math.sin(t * 9) * u;
  const sy = 1 - 0.075 * u;
  const ek = EARTH.r / SPR.earth.r;
  const squeeze = t >= 15.02;
  const look: [number, number] = [Math.sin(t * 4) * 0.5, -0.6];
  const sweat = pop(t, 14.55, 0.2);
  return (
    <AbsoluteFill style={{background: SPACE.sky}}>
      <World cam={cam} depth={1.6} off={{x: 0, y: 0}}>
        <Img src={F('bg_space')} style={{position: 'absolute', left: EARTH.x - SPR.bg_space.w, top: -420, width: SPR.bg_space.w * 2, height: SPR.bg_space.h * 2}} />
      </World>
      <World cam={cam} off={shake(t, 3 * u)}>
        <div style={{position: 'absolute', left: EARTH.x, top: EARTH.y, transformOrigin: '0 0', transform: `scale(${sx}, ${sy})`}}>
          <div style={{position: 'absolute', left: -EARTH.x, top: -EARTH.y}}>
            {TINY_BY_RING.map((g) => (
              <TinyGuy key={g.seed} g={g} t={t} />
            ))}
            <Img
              src={F('earth')}
              style={{position: 'absolute', left: EARTH.x - SPR.earth.c[0] * ek, top: EARTH.y - SPR.earth.c[1] * ek, width: SPR.earth.w * ek, height: SPR.earth.h * ek}}
            />
            <svg style={{position: 'absolute', left: 0, top: 0, width: 1536, height: 2304, overflow: 'visible'}} viewBox="0 0 1536 2304">
              <Eye x={EARTH.x - 165} y={EARTH.y + 10} r={82} open={1} look={look} squeeze={squeeze} side={-1} lid={squeeze ? 0 : 0.18} lidTilt={-14} brow={0.5} browTilt={-0.6} />
              <Eye x={EARTH.x + 165} y={EARTH.y + 10} r={82} open={1} look={look} squeeze={squeeze} side={1} lid={squeeze ? 0 : 0.18} lidTilt={-14} brow={0.5} browTilt={-0.6} />
              <path
                d={`M ${EARTH.x - 110} ${EARTH.y + 200} Q ${EARTH.x - 55} ${EARTH.y + 170 + 14 * Math.sin(t * 20)} ${EARTH.x} ${EARTH.y + 200} Q ${EARTH.x + 55} ${EARTH.y + 230 + 14 * Math.sin(t * 20 + 1)} ${EARTH.x + 110} ${EARTH.y + 200}`}
                fill="none"
                stroke="#000"
                strokeWidth={16}
                strokeLinecap="round"
              />
              <SweatDrop x={EARTH.x + 330} y={EARTH.y - 230 + 90 * prog(t, 14.7, 15.3)} r={34} s={sweat} rot={20} />
              <SweatDrop x={EARTH.x - 360} y={EARTH.y - 150 + 70 * prog(t, 14.9, 15.3)} r={28} s={pop(t, 14.8, 0.2)} rot={-20} />
            </svg>
          </div>
        </div>
      </World>
    </AbsoluteFill>
  );
};

// ---------- scene B2: close-up, squeezed between two clones + "their words" ----------
const Paper: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.their, 0.28);
  if (s <= 0.001) return null;
  const lines = [0, 1, 2, 3, 4, 5];
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} viewBox="0 0 1080 1920">
      <g transform={`translate(540 1440) rotate(-3) scale(${s})`} fontFamily={FONT}>
        <rect x={-430} y={-300} width={860} height={600} rx={14} fill="#F7EFD8" stroke="#000" strokeWidth={9} />
        <text x={-380} y={-232} fontSize={30} fill="#7A6F5C">
          SCIENCE, 4 NOVEMBER 1960
        </text>
        <text x={-380} y={-180} fontSize={40} fill="#1B1B1B">
          DOOMSDAY: FRIDAY, 13 NOVEMBER,
        </text>
        <text x={-380} y={-134} fontSize={40} fill="#1B1B1B">
          A.D. 2026
        </text>
        {lines.map((i) => (
          <rect key={i} x={-380} y={-92 + i * 34} width={i % 3 === 2 ? 520 : 760} height={12} rx={6} fill="#BDB3A0" />
        ))}
        <rect x={-396} y={142} width={792} height={80} rx={12} fill="#FFE45C" opacity={0.95} />
        <text x={0} y={196} fontSize={46} fill="#1B1B1B" textAnchor="middle">
          “...They will be squeezed to death.”
        </text>
        <rect x={-380} y={246} width={600} height={12} rx={6} fill="#BDB3A0" />
      </g>
    </svg>
  );
};

const CloseUp: React.FC<{t: number}> = ({t}) => {
  const sq = easeOutCubic(prog(t, T.squeezed, T.squeezed + 0.16));
  const sq2 = bump(t, T.death - 0.02, 0.3);
  const press = sq + 0.5 * sq2;
  const zoom = 1 + 0.035 * prog(t, T.squeezed, T.cutC);
  const sp = info('squeezed');
  const k = 1.07 * zoom;
  const hx = 540;
  const hy = 860;
  const ps = info('panic');
  const nk = 1.42 * zoom;
  const nx = (side: 1 | -1) => 540 + side * (lerp(900, 640, sq) - 45 * sq2);
  const ny = 820;
  const ek = 3.1;
  const tremble = 3 * Math.sin(2 * Math.PI * 11 * t);
  return (
    <AbsoluteFill style={{background: SPACE.sky}}>
      <Img src={F('bg_space')} style={{position: 'absolute', left: -120, top: -200, width: 1320, height: 1980, filter: 'blur(3px)'}} />
      {/* the Earth's surface under the crowd */}
      <Img
        src={F('earth')}
        style={{position: 'absolute', left: 540 - SPR.earth.c[0] * ek, top: 1840 - (SPR.earth.c[1] - SPR.earth.r) * ek, width: SPR.earth.w * ek, height: SPR.earth.h * ek, filter: 'blur(2.5px)'}}
      />
      <div style={{position: 'absolute', left: hx + tremble, top: hy, transformOrigin: '0 0', transform: `scale(${1 - 0.1 * press}, ${1 + 0.05 * press})`}}>
        <Img src={F('squeezed')} style={{position: 'absolute', left: -sp.head[0] * k, top: -sp.head[1] * k, width: sp.w * k, height: sp.h * k}} />
      </div>
      {[-1, 1].map((side) => (
        <div key={side} style={{position: 'absolute', left: nx(side as 1 | -1), top: ny, transformOrigin: '0 0', transform: `scale(${side === 1 ? -1 : 1}, 1) rotate(${-6 * press}deg)`}}>
          <Img src={F('panic')} style={{position: 'absolute', left: -ps.head[0] * nk, top: -ps.head[1] * nk, width: ps.w * nk, height: ps.h * nk}} />
        </div>
      ))}
      <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} viewBox="0 0 1080 1920">
        <SweatDrop x={830} y={600 + 140 * prog(t, 15.5, 16.6)} r={34} s={pop(t, 15.42, 0.2)} rot={18} />
        <SweatDrop x={250} y={640 + 120 * prog(t, 16.0, 17.2)} r={28} s={pop(t, 15.98, 0.2)} rot={-18} />
      </svg>
      <Paper t={t} />
    </AbsoluteFill>
  );
};

// ---------- the whole Short ----------
const labCam = (t: number): Cam => {
  if (t < T.cutB) return camAt(t, CAM_A);
  if (t < T.cutD) return camAt(t, CAM_C);
  if (t < T.loop) return camAt(t, CAM_D);
  return CAM_A[0];
};

export const Doomsday2026Short: React.FC = () => {
  useDoomFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < T.cutB) scene = <LabScene t={t} tl={t} cam={labCam(t)} />;
  else if (t < T.squeezed) scene = <EarthScene t={t} />;
  else if (t < T.cutC) scene = <CloseUp t={t} />;
  else if (t < T.loop) scene = <LabScene t={t} tl={t} cam={labCam(t)} />;
  else scene = <LabScene t={t} tl={0} cam={labCam(t)} />;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scene}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('doomsday-2026/vo/take1.mp3')} volume={MIX_GAIN} />
      </Sequence>
      <SoundCues cues={CUES} dir="doomsday-2026/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

export {BG_S, DURATION, FPS};
