import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT, DURATION} from './scene';
export {DURATION as DRAGON_DURATION, FPS as DRAGON_FPS} from './scene';
import {camAt, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Part 2" of the 2021 viral 'Dragon Man' skull (Harbin cranium, hidden in a well 1933-2018, named Homo longi in 2021).
// June 2025 (Fu Qiaomei's teams, Science + Cell): no DNA from the bone or the tooth -> ancient proteins from the petrous bone,
// then host mitochondrial DNA from a tiny chip of dental calculus (plaque) on its single remaining tooth: closest to the
// Denisovans, until then known mostly from a finger bone (2010) and a few teeth -> 'finally we can put a face on a Denisovan'.
// Sources: National Geographic 18 Jun 2025; Scientific American / Nature 18 Jun 2025 (see videos/dragon-plaque/upload.md).

const F = (n: string) => staticFile(`dragon-plaque/${n}.${n === 'lab' || n === 'ground' ? 'jpg' : 'png'}`);
export const FONT = 'DRGInter';
export const useDragonFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8302A';
const BONE = '#CFAE7E';
const GUNK = '#B08A3E';
const GUNK_D = '#8A6A2C';
const SHADOW = 'rgba(72,54,42,0.26)';

// ---------- world layout (world px = padded plate px, 2048 x 1936) ----------
const CT = 1030; // lab counter top
const FLOOR = 1600;
const STOOL = 1360; // guy's feet on the step stool
const SKX = 1230; // skull on the counter
const SKS = 0.5;
const WX = 1024; // well
const W_TOP = 640;
const W_BOT = 1640;
const IW = 150;
const CUT_LAB = 3.55;
const CUT_TOOTH = 11.8;
const CUT_TUBE = 14.35;
const CUT_BACK = 16.95;

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
const pulse = (t: number, t0: number, d = 0.35) => (t > t0 && t < t0 + d ? Math.sin((Math.PI * (t - t0)) / d) : 0);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; tip?: [number, number]; top?: [number, number]; hand?: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, children,
}) => {
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

// ---------- guy (pose sprites, equal head size, squash swaps) ----------
type Pose = 'present' | 'drill' | 'shock' | 'scrape' | 'tube' | 'cheer';
const HEAD_R = 135;
const guyK = (pose: Pose, s: number) => (s * HEAD_R) / (S(pose).hd ? S(pose).hd![2] : HEAD_R);
const Guy: React.FC<{t: number; pose: Pose; x: number; y: number; s: number; swapAt: number; tremble?: number; shadow?: boolean; bob?: number}> = ({
  t, pose, x, y, s, swapAt, tremble = 0, shadow = true, bob = 0,
}) => {
  const k = guyK(pose, s);
  const [qx, qy] = squashSwap(t, swapAt);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tx = tremble * (Math.sin(2 * Math.PI * 17 * t) + 0.5 * Math.sin(2 * Math.PI * 9 * t));
  return (
    <>
      {shadow ? <div style={{position: 'absolute', left: x - 110 * k, top: y - 12 * k, width: 220 * k, height: 26 * k, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)'}} /> : null}
      <Spr n={pose} x={x + tx} y={y - bob} s={k} sx={qx} sy={qy * br} />
    </>
  );
};
const Stool: React.FC<{x: number}> = ({x}) => (
  <Svg>
    <ellipse cx={x} cy={FLOOR - 4} rx={150} ry={16} fill={SHADOW} />
    <path d={`M ${x - 95} ${STOOL + 30} L ${x - 120} ${FLOOR} M ${x + 95} ${STOOL + 30} L ${x + 120} ${FLOOR}`} stroke={INK} strokeWidth={34} strokeLinecap="round" />
    <path d={`M ${x - 95} ${STOOL + 30} L ${x - 120} ${FLOOR} M ${x + 95} ${STOOL + 30} L ${x + 120} ${FLOOR}`} stroke="#3C7FC0" strokeWidth={20} strokeLinecap="round" />
    <path d={`M ${x - 108} ${STOOL + 120} L ${x + 108} ${STOOL + 120}`} stroke={INK} strokeWidth={26} strokeLinecap="round" />
    <path d={`M ${x - 108} ${STOOL + 120} L ${x + 108} ${STOOL + 120}`} stroke="#3C7FC0" strokeWidth={12} strokeLinecap="round" />
    <rect x={x - 135} y={STOOL - 4} width={270} height={40} rx={14} fill="#F2C14E" stroke={INK} strokeWidth={8} />
  </Svg>
);

// ---------- the skull with code eyes in its sockets ----------
type SkullFace = {open: number; lid: number; look: [number, number]; squeeze?: boolean; tilt?: number; brow?: number};
const SkullEyes: React.FC<{f: SkullFace}> = ({f}) => (
  <g>
    <Eye x={690} y={420} r={92} open={f.open} lid={f.lid} lidTilt={f.tilt ?? 0} look={f.look} squeeze={f.squeeze} side={-1} brow={NaN} ink={0.12} />
    <Eye x={1012} y={372} r={66} open={f.open} lid={f.lid} lidTilt={f.tilt ?? 0} look={f.look} squeeze={f.squeeze} side={1} brow={NaN} ink={0.14} />
  </g>
);
const Skull: React.FC<{x: number; y: number; s: number; f: SkullFace; sx?: number; sy?: number; rot?: number}> = ({x, y, s, f, sx = 1, sy = 1, rot = 0}) => (
  <Spr n="skull" x={x} y={y} s={s} sx={sx} sy={sy} rot={rot} ax={588} ay={870}>
    <SkullEyes f={f} />
  </Spr>
);
const blink = (t: number, at: number[]) => at.reduce((m, a) => Math.max(m, pulse(t, a, 0.16)), 0);

// ---------- small code props ----------
const SmallTooth: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -30 -34 Q -34 -52 -14 -50 Q 0 -44 14 -50 Q 34 -52 30 -34 Q 30 -6 22 6 L 16 34 Q 10 40 6 30 L 0 10 L -6 30 Q -10 40 -16 34 L -22 6 Q -30 -6 -30 -34 Z" fill="#F2E6C8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
const Confetti: React.FC<{t: number; t0: number; n?: number; cx?: number}> = ({t, t0, n = 44, cx = 540}) => {
  if (t < t0 || t > t0 + 2.4) return null;
  const cols = ['#FFE45C', '#E8302A', '#3C7FC0', '#7DB24A', '#F08A3C', '#C77DD9'];
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      {Array.from({length: n}, (_, i) => {
        const tau = t - t0 - rnd(i) * 0.15;
        if (tau < 0) return null;
        const ang = -Math.PI / 2 + (rnd(i + 7) - 0.5) * 2.2;
        const v = 900 + 700 * rnd(i + 3);
        const x = cx + Math.cos(ang) * v * tau + 30 * Math.sin(6 * tau + i);
        const y = 620 + Math.sin(ang) * v * tau + 0.5 * 1500 * tau * tau;
        return <rect key={i} x={x} y={y} width={22} height={13} rx={3} fill={cols[i % cols.length]} stroke={INK} strokeWidth={3} transform={`rotate(${(tau * 400 + i * 40) % 360} ${x + 11} ${y + 6})`} />;
      })}
    </svg>
  );
};
const QMark: React.FC<{x: number; y: number; s: number; rot: number}> = ({x, y, s, rot}) => <Label x={x} y={y} text="?" size={150} s={s} rot={rot} fill={YEL} stroke={30} />;

// ---------- SCENE A: the skull at the bottom of a well (0 - 3.55) ----------
const WellScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, [
    {t: 0, x: WX, y: 1010, k: 1.2},
    {t: 0.3, x: WX, y: 1010, k: 1.2},
    {t: 2.6, x: WX, y: 1340, k: 1.52},
    {t: 3.0, x: WX, y: 1300, k: 1.45, ease: 'out'},
    {t: 3.55, x: WX, y: 1180, k: 1.45, ease: 'in'},
  ]);
  // bucket: down on 'well', skull hops in, yanked up
  const bDown = easeOutCubic(prog(t, T.well - 0.05, T.well + 0.32));
  const yank = easeInCubic(prog(t, 3.28, 3.55));
  const bucketY = lerp(900, 1575, bDown) - 1300 * yank;
  const hop = prog(t, 3.06, 3.26);
  const skBase = 1590;
  const skInY = bucketY - 300;
  const skullY = t < 3.06 ? skBase : t < 3.26 ? lerp(skBase, skInY, hop) - 260 * Math.sin(Math.PI * hop) : skInY;
  const sq = t < 3.06 ? 1 + 0.04 * Math.sin(2 * Math.PI * 0.5 * t) : 1;
  const face: SkullFace = {
    open: 1,
    lid: t < T.hidden ? 0.55 - 0.5 * blink(t, [1.3]) * -1 : Math.max(0, 0.55 - 0.55 * easeOutCubic(prog(t, T.well - 0.2, T.well))),
    look: t < T.well ? [0.2 * Math.sin(t * 1.5), 0.3] : [0, -0.9],
  };
  if (t > 2.9) face.lid = 0;
  const water = (
    <Svg>
      <rect x={WX - IW} y={1555} width={2 * IW} height={W_BOT - 1555} fill="#2F5F86" />
      {[0, 1].map((i) => {
        const a = prog(t, 0.9 + i * 1.1, 1.8 + i * 1.1);
        return a > 0 && a < 1 ? <ellipse key={i} cx={WX - 40 + 80 * i} cy={1560} rx={20 + 70 * a} ry={(20 + 70 * a) * 0.22} fill="none" stroke="#9CCBEA" strokeWidth={6 * (1 - a)} /> : null;
      })}
    </Svg>
  );
  const dropY = (i: number) => {
    const t0 = 0.55 + i * 1.1;
    const u = prog(t, t0, t0 + 0.38);
    return u > 0 && u < 1 ? lerp(W_TOP + 40, 1555, u * u) : null;
  };
  return (
    <>
      <World cam={cam}>
        <Img src={F('ground')} style={{position: 'absolute', left: 0, top: 0, width: 2048, height: 1936}} />
        <Svg>
          {/* shaft: dark inside, stone walls with one merged outline */}
          <rect x={WX - IW} y={W_TOP} width={2 * IW} height={W_BOT - W_TOP} fill="#2B1E16" />
          <rect x={WX - IW} y={W_TOP} width={60} height={W_BOT - W_TOP} fill="#22170F" />
          {Array.from({length: 18}, (_, r) =>
            [-1, 1].map((side) => {
              const y = W_TOP + r * 56;
              const x = side < 0 ? WX - IW - 64 : WX + IW + 4;
              return <rect key={`${r}${side}`} x={x + (r % 2 ? 6 : 0)} y={y + 3} width={54} height={50} rx={10} fill={r % 3 ? '#8E8A84' : '#7A766F'} stroke={INK} strokeWidth={6} />;
            }),
          )}
          {/* rim on the grass */}
          <rect x={WX - IW - 110} y={W_TOP - 50} width={2 * IW + 220} height={70} rx={18} fill="#9A958E" stroke={INK} strokeWidth={9} />
          <path d={`M ${WX - IW - 60} ${W_TOP - 50} L ${WX - IW - 60} ${W_TOP - 330} M ${WX + IW + 60} ${W_TOP - 50} L ${WX + IW + 60} ${W_TOP - 330}`} stroke={INK} strokeWidth={34} strokeLinecap="round" />
          <path d={`M ${WX - IW - 60} ${W_TOP - 50} L ${WX - IW - 60} ${W_TOP - 330} M ${WX + IW + 60} ${W_TOP - 50} L ${WX + IW + 60} ${W_TOP - 330}`} stroke="#9C6B42" strokeWidth={20} strokeLinecap="round" />
          <path d={`M ${WX - IW - 120} ${W_TOP - 300} L ${WX} ${W_TOP - 420} L ${WX + IW + 120} ${W_TOP - 300} Z`} fill="#B5473A" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
          {/* cobweb in the upper left corner of the shaft */}
          <g stroke="#E8E4DC" strokeWidth={3} fill="none" opacity={0.85}>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${WX - IW} ${W_TOP + 40 + i * 30} Q ${WX - IW + 30 + i * 10} ${W_TOP + 60 + i * 26} ${WX - IW + 40 + i * 30} ${W_TOP + 40}`} />
            ))}
            <path d={`M ${WX - IW} ${W_TOP + 40} L ${WX - IW + 150} ${W_TOP + 170} M ${WX - IW} ${W_TOP + 120} L ${WX - IW + 130} ${W_TOP + 40}`} />
          </g>
          {[0, 1].map((i) => {
            const y = dropY(i);
            return y ? <ellipse key={i} cx={WX + 40 - 70 * i} cy={y} rx={9} ry={14} fill="#9CCBEA" stroke={INK} strokeWidth={3} /> : null;
          })}
        </Svg>
        {water}
        {/* rope + bucket */}
        {t > T.well - 0.1 ? (
          <Svg>
            <line x1={WX} y1={0} x2={WX} y2={bucketY - 395} stroke={INK} strokeWidth={14} />
            <line x1={WX} y1={0} x2={WX} y2={bucketY - 395} stroke="#C8A46A" strokeWidth={7} />
          </Svg>
        ) : null}
        <Skull x={WX} y={skullY} s={0.26} sx={sq} sy={2 - sq} f={face} />
        {t > T.well - 0.1 ? <Spr n="bucket" x={WX} y={bucketY} s={0.7} /> : null}
      </World>
      {/* year counter */}
      {(() => {
        const u = prog(t, T.eighty - 0.05, T.years + 0.1);
        const yr = Math.round(lerp(1933, 2018, easeInOutCubic(u)));
        const s = popOut(t, 0.25, 3.3);
        return (
          <>
            <Label x={540} y={250} text={String(yr)} size={170} s={s} fill="#fff" />
            <Label x={540} y={410} text="85 YEARS" size={96} s={popOut(t, T.years, 3.3)} fill={YEL} rot={-3} />
          </>
        );
      })()}
    </>
  );
};

// ---------- SCENES B-F: the lab ----------
const LabScene: React.FC<{t: number; cover?: boolean; cam?: Cam}> = ({t, cover, cam: camOverride}) => {
  const tooth = t >= CUT_TOOTH && t < CUT_TUBE;
  const tube = t >= CUT_TUBE && t < CUT_BACK;
  let cam: Cam;
  if (camOverride) cam = camOverride;
  else if (tooth) cam = camAt(t, [{t: CUT_TOOTH, x: 1010, y: 960, k: 1.16}, {t: 14.3, x: 1030, y: 970, k: 1.24}]);
  else if (tube) cam = camAt(t, [{t: CUT_TUBE, x: 1000, y: 880, k: 1.15}, {t: 15.9, x: 1040, y: 860, k: 1.22}, {t: 16.9, x: 1040, y: 860, k: 1.22}]);
  else
    cam = camAt(t, [
      {t: CUT_LAB, x: 1040, y: 1060, k: 1.1},
      {t: T.but - 0.05, x: 1030, y: 1040, k: 1.13},
      {t: T.but + 0.35, x: 1060, y: 960, k: 1.24, ease: 'out'},
      {t: T.they, x: 1060, y: 960, k: 1.24},
      {t: T.drill + 0.3, x: 1030, y: 980, k: 1.2},
      {t: CUT_TOOTH, x: 1030, y: 980, k: 1.2},
      {t: CUT_BACK, x: 1020, y: 1000, k: 1.12, ease: 'cut'},
      {t: T.lost, x: 1020, y: 1000, k: 1.12},
      {t: T.finger + 0.2, x: 1040, y: 1010, k: 1.2},
      {t: T.finally, x: 1060, y: 1000, k: 1.2},
      {t: T.face - 0.1, x: 1010, y: 1010, k: 1.15},
      {t: DURATION, x: 1010, y: 1000, k: 1.18},
    ]);
  const drilling = t > T.drill && t < T.dna + 0.3;
  const sh = drilling ? shake(t, 5) : t > T.nothing && t < T.nothing + 0.3 ? shake(t, 3 * (1 - prog(t, T.nothing, T.nothing + 0.3))) : {x: 0, y: 0};
  const camS = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};

  // guy pose by time
  let pose: Pose = 'present';
  let swapAt = -1;
  if (t >= T.but && t < T.drill - 0.12) [pose, swapAt] = ['shock', T.but];
  else if (t >= T.drill - 0.12 && t < T.nothing) [pose, swapAt] = ['drill', T.drill - 0.12];
  else if (t >= T.nothing && t < CUT_TOOTH) [pose, swapAt] = ['shock', T.nothing];
  else if (tooth) [pose, swapAt] = ['scrape', -1];
  else if (tube) [pose, swapAt] = ['tube', -1];
  else if (t >= T.face - 0.05) [pose, swapAt] = ['cheer', T.face - 0.05];
  else if (t >= CUT_BACK) [pose, swapAt] = ['present', -1];
  // guy x: walks closer for the drill
  const drillX = 720;
  const gx = pose === 'drill' ? drillX : t > T.nothing && t < CUT_TOOTH ? lerp(drillX, 690, prog(t, T.nothing, T.nothing + 0.3)) : 690;

  // skull face
  const skullDrop = easeOutCubic(prog(t, CUT_LAB, CUT_LAB + 0.3));
  const landSq = t > CUT_LAB + 0.3 ? 1 - 0.08 * spring(t - CUT_LAB - 0.3, 3, 6) : 1;
  let face: SkullFace = {open: 1, lid: 0, look: [-0.4, 0]};
  if (t < T.named) face = {open: 1, lid: 0, look: [0, -0.6]};
  else if (t < T.but) face = {open: pop(t, T.named, 0.2) > 0 ? 1 : 1, lid: 0.45 * easeOutCubic(prog(t, T.dragon, T.dragon + 0.3)), look: [-0.5, 0.1], tilt: -8};
  else if (t < T.drill) face = {open: 1, lid: 0, look: [Math.sin((t - T.but) * 6) > 0 ? 0.8 : -0.8, 0]};
  else if (t < T.nothing) face = {open: 1, lid: 0, look: [0, 0], squeeze: true};
  else if (t < CUT_TOOTH) face = {open: 1, lid: 0.5, look: [-0.7, 0.2]};
  else if (tube) face = {open: 1, lid: 0, look: [-0.9, -0.6]};
  else if (t < T.lost) face = {open: 1, lid: 0.35, look: [-0.6, 0], tilt: -10};
  else face = {open: 1, lid: t > T.teeth ? 0.25 : 0, look: [-0.9, 0.5]};
  face.lid = Math.max(face.lid, blink(t, [5.0, 12.9, 19.0]));
  // skull inhale + poof into the Denisovan
  const inhale = t > T.finally && t < 22.3 ? 0.07 * easeOutCubic(prog(t, T.finally, 22.15)) : 0;
  const poofT = 22.25;
  const showSkull = t < poofT + 0.12;
  const showDen = t >= poofT + 0.12 || cover;
  const skBounce = t > T.man && t < T.man + 0.4 ? 1 + 0.05 * pulse(t, T.man, 0.4) : 1;

  const tubeK = guyK('tube', 1);
  const tubeTop: [number, number] = [790 + (S('tube').top![0] - S('tube').feet[0]) * tubeK, STOOL + (S('tube').top![1] - S('tube').feet[1]) * tubeK];

  return (
    <>
      <World cam={camS} blur={tooth ? 7 : 0}>
        <Img src={F('lab')} style={{position: 'absolute', left: 0, top: 0, width: 2048, height: 1936}} />
      </World>
      <World cam={camS}>
        {!tooth ? (
          <>
            {showSkull ? <Skull x={SKX} y={lerp(-200, CT + 6, skullDrop)} s={SKS} f={face} sx={(2 - landSq) * (1 - inhale * 0.4)} sy={landSq * (1 + inhale) * skBounce} /> : null}
            {showDen && !tube ? (
              <Spr n="denisovan" x={SKX - 60} y={FLOOR - 10} s={0.68 * (cover ? 1 : pop(t, poofT + 0.12, 0.3))} rot={cover ? 0 : 2.5 * Math.sin(2 * Math.PI * 1.6 * (t - 22.6)) * prog(t, 22.5, 22.8)} />
            ) : null}
            {/* cushion with the finger bone + the few teeth */}
            {t > T.finger - 0.1 && t < poofT + 0.12 ? (
              <>
                <Spr n="finger" x={1010} y={CT + 30} s={0.56 * pop(t, T.finger - 0.05, 0.3)} />
                <Svg>
                  {[0, 1, 2].map((i) => {
                    const t0 = T.few - 0.05 + i * 0.14;
                    if (t < t0) return null;
                    const u = prog(t, t0, t0 + 0.3);
                    const x = lerp(700 + 30 * i, 900 + 48 * i, u);
                    const y = lerp(CT - 300, CT + 4, u) - 200 * Math.sin(Math.PI * u);
                    return <SmallTooth key={i} x={x} y={y} s={0.8} rot={u < 1 ? 360 * u : -8 + 8 * i} />;
                  })}
                </Svg>
              </>
            ) : null}
            {/* drill dust + DNA name plate */}
            <Svg>
              {drilling
                ? Array.from({length: 26}, (_, i) => {
                    const t0 = T.drill + (i / 26) * (T.dna + 0.25 - T.drill);
                    const tau = t - t0;
                    if (tau < 0 || tau > 0.55) return null;
                    const ang = Math.PI + (rnd(i) - 0.5) * 1.6;
                    const v = 380 + 300 * rnd(i + 9);
                    const x = 1030 + Math.cos(ang) * v * tau;
                    const y = 985 + Math.sin(ang) * v * tau + 900 * tau * tau;
                    return <circle key={i} cx={x} cy={y} r={(10 + 10 * rnd(i + 4)) * (1 - tau / 0.6)} fill={BONE} stroke={INK} strokeWidth={4} />;
                  })
                : null}
            </Svg>
            {/* name plate on the counter front */}
            {t > T.dragon - 0.05 && t < T.denisovan ? (
              <div style={{position: 'absolute', left: SKX, top: CT + 70, transform: `translate(-50%, -50%) scale(${pop(t, T.dragon - 0.05, 0.3)}) rotate(-2deg)`}}>
                <div style={{fontFamily: FONT, fontSize: 64, color: YEL, background: '#6B4A2E', border: '9px solid #000', borderRadius: 16, padding: '12px 30px', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
                  DRAGON MAN
                </div>
              </div>
            ) : null}
            {tube ? null : <Stool x={690} />}
            {!tube ? <Guy t={t} pose={pose} x={gx} y={STOOL} s={1} swapAt={swapAt} shadow={false} tremble={pose === 'shock' ? 1.5 : pose === 'drill' && drilling ? 2.5 : 0} bob={pose === 'cheer' ? 30 * Math.abs(Math.sin(2 * Math.PI * 1.2 * (t - T.face))) : 0} /> : null}
            {showSkull && t > T.teeth + 0.1 ? (
              <Svg>
                <SweatDrop x={SKX + 150 - 0 * prog(t, T.teeth, T.teeth + 0.8)} y={CT - 360 + 60 * prog(t, T.teeth + 0.1, T.teeth + 0.8)} r={18} s={popOut(t, T.teeth + 0.1, T.finally - 0.1)} />
              </Svg>
            ) : null}
          </>
        ) : null}
        {tooth ? <ToothCloseup t={t} /> : null}
        {tube ? <TubeShot t={t} tubeTop={tubeTop} /> : null}
        {/* poof */}
        {t > poofT - 0.05 && t < poofT + 0.9 ? (
          <Svg>
            <PuffCluster
              fill="#F4F1EA"
              ink={8}
              puffs={Array.from({length: 11}, (_, i) => {
                const a = (i / 11) * 2 * Math.PI;
                const u = prog(t, poofT - 0.05, poofT + 0.25);
                const out = prog(t, poofT + 0.35, poofT + 0.9);
                const d = 120 + 140 * u;
                return {x: SKX + Math.cos(a) * d * 1.3, y: CT - 250 + Math.sin(a) * d, r: (90 + 30 * rnd(i)) * easeOutBack(u) * (1 - easeInCubic(out))};
              })}
            />
          </Svg>
        ) : null}
      </World>
      {/* ---------- screen space ---------- */}
      <Label x={540} y={300} text="NEW HUMAN!" size={118} s={popOut(t, T.brand - 0.05, T.but - 0.05)} rot={-5} fill={YEL} />
      <QMark x={250} y={430} s={popOut(t, T.whose, T.they - 0.05)} rot={-14} />
      <QMark x={540} y={340} s={popOut(t, T.skull2, T.they - 0.05)} rot={6} />
      <QMark x={820} y={430} s={popOut(t, T.it, T.they - 0.05)} rot={16} />
      {/* DNA scan panel */}
      {t > T.dna - 0.3 && t < CUT_TOOTH ? (
        <div style={{position: 'absolute', left: 540, top: 330, transform: `translate(-50%, -50%) scale(${popOut(t, T.dna - 0.3, CUT_TOOTH - 0.2)})`, width: 640, height: 250, background: '#1E2A33', border: '10px solid #000', borderRadius: 30}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: FONT, fontSize: 56, color: '#7FE0A8', WebkitTextStroke: '0px', letterSpacing: 2}}>DNA SCAN</div>
          {t < T.nothing ? (
            <div style={{position: 'absolute', left: 50, top: 140, width: 540 * prog(t, T.dna - 0.1, T.nothing - 0.1), height: 50, background: '#7FE0A8', borderRadius: 12, border: '6px solid #000'}} />
          ) : (
            <div style={{position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', fontFamily: FONT, fontSize: 96, color: RED, transform: `scale(${pop(t, T.nothing, 0.25)})`}}>FOUND: 0</div>
          )}
        </div>
      ) : null}
      {tooth ? <Label x={760} y={330} text="LAST TOOTH" size={92} s={popOut(t, T.last - 0.05, CUT_TUBE - 0.1)} rot={4} fill={YEL} /> : null}
      {/* DENISOVAN stamp */}
      {t > T.denisovan - 0.05 ? (
        <Label
          x={lerp(540, 560, prog(t, T.lost, T.lost + 0.4))}
          y={lerp(820, 300, easeInOutCubic(prog(t, T.lost - 0.1, T.lost + 0.35)))}
          text="DENISOVAN"
          size={130}
          s={(t < T.denisovan + 0.12 ? lerp(2.2, 1, easeInCubic(prog(t, T.denisovan - 0.05, T.denisovan + 0.12))) : 1 + 0.05 * spring(t - T.denisovan - 0.12, 4, 6)) * lerp(1, 0.82, prog(t, T.lost - 0.1, T.lost + 0.35)) * (t > T.face - 0.15 ? 1 - prog(t, T.face - 0.15, T.face) : 1)}
          rot={-7}
          fill="#F08A3C"
        />
      ) : null}
      <Label x={540} y={470} text="LOST COUSIN" size={80} s={popOut(t, T.cousin, T.finger - 0.1)} rot={3} fill="#fff" />
      <Label x={520} y={470} text="ALL WE HAD" size={96} s={popOut(t, T.teeth + 0.05, T.finally)} rot={-3} fill="#fff" />
      <Label x={540} y={210} text="FINALLY," size={110} s={popOut(t, T.face - 0.05, DURATION + 1)} rot={-4} fill="#fff" />
      <Label x={540} y={340} text="A FACE!" size={150} s={popOut(t, T.face + 0.08, DURATION + 1)} rot={-4} fill={YEL} />
      <Confetti t={t} t0={T.brand + 0.05} n={30} />
      <Confetti t={t} t0={T.face} n={50} />
    </>
  );
};

// close-up: scraping the plaque off the last tooth (world coords, the lab blurred behind)
const TX = 1230;
const TY = 1175;
const TS = 1.15;
const ToothCloseup: React.FC<{t: number}> = ({t}) => {
  const tgt: [number, number] = [TX + (70 - 201.5) * TS, TY - (519 - 300) * TS];
  const k = guyK('scrape', 1.05);
  const sp = S('scrape');
  const strokes = [12.2, 12.55, 12.9, 13.25, 13.6, 13.95];
  const stroke = strokes.reduce((m, a) => Math.max(m, pulse(t, a, 0.3)), 0);
  const gx = tgt[0] - (sp.tip![0] - sp.feet[0]) * k - 26 * stroke;
  const gy = tgt[1] - (sp.tip![1] - sp.feet[1]) * k + 14 * stroke;
  const tickle = strokes.some((a) => t > a && t < a + 0.3);
  const wob = 1 + 0.02 * Math.sin(2 * Math.PI * 9 * t) * (tickle ? 1 : 0);
  return (
    <>
      <div style={{position: 'absolute', left: TX - 230, top: TY - 14, width: 460, height: 40, borderRadius: '50%', background: SHADOW, filter: 'blur(4px)'}} />
      <Spr n="tooth" x={TX} y={TY} s={TS} sx={wob} sy={2 - wob}>
        <Eye x={150} y={118} r={32} open={pop(t, CUT_TOOTH + 0.05, 0.3)} squeeze={tickle} side={-1} look={[-0.7, 0.4]} brow={0.5} browTilt={-1} />
        <Eye x={262} y={118} r={32} open={pop(t, CUT_TOOTH + 0.05, 0.3)} squeeze={tickle} side={1} look={[-0.7, 0.4]} brow={0.5} browTilt={-1} />
        {tickle ? <path d="M 175 175 Q 206 205 237 175" fill="#7A2E2E" stroke={INK} strokeWidth={7} /> : <path d="M 180 180 Q 206 192 232 180" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
      </Spr>
      <Svg>
        {strokes.flatMap((a, j) =>
          Array.from({length: 6}, (_, i) => {
            const tau = t - a - 0.12 - i * 0.02;
            if (tau < 0 || tau > 0.7) return null;
            const ang = Math.PI * (0.8 + 0.5 * rnd(i + j * 7));
            const v = 420 + 260 * rnd(i * 3 + j);
            const x = tgt[0] + Math.cos(ang) * v * tau;
            const y = tgt[1] + Math.sin(ang) * v * tau + 1400 * tau * tau;
            const r = 9 + 9 * rnd(i + j);
            return <path key={`${j}-${i}`} d={`M ${x - r} ${y} L ${x - r * 0.2} ${y - r} L ${x + r} ${y - r * 0.3} L ${x + r * 0.5} ${y + r} Z`} fill={i % 2 ? GUNK : GUNK_D} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
          }),
        )}
      </Svg>
      <Spr n="scrape" x={gx} y={gy} s={k} />
    </>
  );
};

// the gunk in a test tube -> zoom bubble -> DNA helix
const TubeShot: React.FC<{t: number; tubeTop: [number, number]}> = ({t, tubeTop}) => {
  const bx = 1250;
  const by = 520;
  const R = 200 * pop(t, T.trapped - 0.1, 0.35);
  const helix = pop(t, T.dna2 - 0.05, 0.35);
  const glow = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
  return (
    <>
      <Stool x={790} />
      <Guy t={t} pose="tube" x={790} y={STOOL} s={1} swapAt={CUT_TUBE} shadow={false} bob={10 * pulse(t, T.dna2, 0.4)} />
      {R > 1 ? (
        <Svg>
          <line x1={tubeTop[0]} y1={tubeTop[1] + 40} x2={bx - R * 0.85} y2={by + R * 0.5} stroke={INK} strokeWidth={6} strokeDasharray="18 14" />
          <circle cx={bx} cy={by} r={R + 10} fill={INK} />
          <circle cx={bx} cy={by} r={R} fill="#FFF6DD" />
          <clipPath id="bub">
            <circle cx={bx} cy={by} r={R - 4} />
          </clipPath>
          <g clipPath="url(#bub)">
            {Array.from({length: 9}, (_, i) => {
              const a = (i / 9) * 2 * Math.PI + 0.3 * Math.sin(t * 2 + i);
              const d = R * (0.35 + 0.45 * rnd(i));
              const wob = 1 + 0.08 * Math.sin(2 * Math.PI * 1.5 * t + i);
              return <ellipse key={i} cx={bx + Math.cos(a) * d} cy={by + Math.sin(a) * d} rx={R * 0.2 * wob} ry={R * 0.15 / wob} fill={i % 2 ? GUNK : GUNK_D} stroke={INK} strokeWidth={5} />;
            })}
            {helix > 0.01 ? (
              <g transform={`translate(${bx} ${by}) scale(${helix}) rotate(-25)`}>
                <circle r={R * 0.75} fill={`rgba(140,230,255,${0.25 + 0.2 * glow})`} />
                {Array.from({length: 9}, (_, i) => {
                  const y = -150 + i * 37.5;
                  const ph = i * 0.7 + t * 4;
                  const xa = 55 * Math.sin(ph);
                  return <line key={i} x1={xa} y1={y} x2={-xa} y2={y} stroke={['#E8302A', '#3C7FC0', '#7DB24A', '#F2C14E'][i % 4]} strokeWidth={14} strokeLinecap="round" />;
                })}
                {[0, Math.PI].map((o, j) => (
                  <path
                    key={j}
                    d={Array.from({length: 25}, (_, i) => `${i ? 'L' : 'M'} ${55 * Math.sin(i * 0.7 * 0.375 + o + t * 4)} ${-150 + i * 12.5}`).join(' ')}
                    fill="none"
                    stroke={INK}
                    strokeWidth={14}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            ) : null}
          </g>
        </Svg>
      ) : null}
      {helix > 0.01 ? <Label x={bx} y={by + R + 70} text="DNA!" size={110} s={helix} rot={-4} fill="#7FE0F7" /> : null}
    </>
  );
};

export const DragonScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam, cover}) =>
  t < CUT_LAB && !cover ? <WellScene t={t} /> : <LabScene t={t} cam={cam} cover={cover} />;

const CUES: Cue[] = [
  {f: 'well_drip', at: 0.5, db: -20},
  {f: 'well_drip', at: 1.6, db: -23},
  {f: 'tick_tock', at: T.eighty - 0.05, db: -26, dur: 0.9},
  {f: 'rope_creak', at: T.well - 0.05, db: -22},
  {f: 'boing', at: 3.06, db: -24},
  {f: 'whoosh', at: 3.3, db: -22},
  {f: 'stamp', at: CUT_LAB + 0.28, db: -18},
  {f: 'stamp', at: T.dragon - 0.04, db: -19},
  {f: 'party_horn', at: T.brand - 0.02, db: -21},
  {f: 'pop', at: T.whose, db: -22},
  {f: 'pop', at: T.skull2, db: -22, rate: 1.15},
  {f: 'pop', at: T.it, db: -22, rate: 1.3},
  {f: 'power_drill', at: T.drill, db: -21, dur: 1.3},
  {f: 'wrong_buzzer', at: T.nothing - 0.02, db: -22},
  {f: 'crickets', at: T.nothing + 0.45, db: -27},
  {f: 'whoosh', at: CUT_TOOTH - 0.05, db: -27},
  {f: 'tooth_scrape', at: 12.15, db: -20},
  {f: 'tooth_scrape', at: 13.2, db: -21, rate: 1.08},
  {f: 'squeak', at: 12.6, db: -24},
  {f: 'pop', at: T.last - 0.05, db: -22},
  {f: 'pop', at: T.trapped - 0.1, db: -22},
  {f: 'magic', at: T.dna2 - 0.08, db: -20},
  {f: 'twinkle', at: T.dna2 + 0.1, db: -22},
  {f: 'stamp', at: T.denisovan + 0.1, db: -14},
  {f: 'pop', at: T.finger - 0.05, db: -21},
  {f: 'pop', at: T.few + 0.25, db: -23, rate: 1.1},
  {f: 'pop', at: T.few + 0.39, db: -23, rate: 1.25},
  {f: 'pop', at: T.few + 0.53, db: -23, rate: 1.4},
  {f: 'gulp', at: T.teeth + 0.15, db: -18},
  {f: 'sun_poof', at: 22.2, db: -17},
  {f: 'twinkle', at: T.face, db: -21},
  {f: 'party_horn', at: T.face + 0.05, db: -20},
];

export const DragonPlaqueShort: React.FC = () => {
  useDragonFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#5E412F'}}>
      <DragonScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('dragon-plaque/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('dragon-plaque/music/bed.wav')} />
      <SoundCues cues={CUES} dir="dragon-plaque/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
