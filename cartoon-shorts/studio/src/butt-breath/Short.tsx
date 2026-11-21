import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT, DURATION} from './scene';
export {DURATION as BB_DURATION, FPS as BB_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Can humans breathe through their butts? (Part 2)" - part 2 of the 2021 viral 'butt breathing' story, told as a story.
// 2021 (Okabe, Takebe et al., Med): oxygenated perfluorodecalin given into the rectum raised blood oxygen in mice, rats and
// pigs with failing lungs (2024 Ig Nobel). Part 2 (Fujii, Takebe et al., Med, 20 Oct 2025): 27 healthy men, one rectal dose
// of NON-oxygenated perfluorodecalin each, held for up to 60 min, doses escalated 25 mL -> 1,500 mL; at 1,500 mL over half
// had mild belly pain and some stopped early; 20 of 27 kept the full dose; no serious side effects. Next: oxygenated liquid.

const F = (n: string) => staticFile(`butt-breath/${n}.${n === 'clinic' ? 'jpg' : 'png'}`);
export const FONT = 'BBInter';
export const useBBFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const RED = '#E8302A';
const YEL = '#FFE45C';
const LIQ = '#BFE6F5';
const LIQ_D = '#8FCBE6';
const O2G = '#3DB36B';
const SHADOW = 'rgba(72,54,42,0.22)';

// ---------- world layout (world px; the clinic plate is drawn at PS x its native 1024 x 1536) ----------
const PS = 1.35;
const PW = 1024 * PS; // 1382
const PH = 1536 * PS; // 2074
const PIG = {x: 350, y: 1730, s: 0.7};
const GUY = {x: 790, y: 1820, s: 0.85};
const IV = {x: 975, y: 1810, s: 0.95};
const DOC = {x: 1145, y: 1820, s: 0.8};
const TANK = {x: 150, y: 1700};
const RUN_Y = 1990;
const TOILET = {x: 450, y: 2000, s: 0.6};

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number; bag?: number[]; tube?: number[]; face?: number[]};
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
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 4000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; stroke?: number}> = ({x, y, text, size, s, rot = 0, fill = '#fff', stroke}) =>
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

// ---------- characters ----------
type GPose = 'volunteer' | 'gulp' | 'hold' | 'ache' | 'win' | 'run';
type DPose = 'docTalk' | 'docShow' | 'docClap';
const HEAD_R = 140;
const Person: React.FC<{t: number; pose: string; x: number; y: number; s: number; swapAt: number; sx?: number; sy?: number; tremble?: number; shadow?: boolean}> = ({
  t, pose, x, y, s, swapAt, sx = 1, sy = 1, tremble = 0, shadow = true,
}) => {
  const sp = S(pose);
  const k = (s * HEAD_R) / (sp.hd ? sp.hd[2] : HEAD_R);
  const [qx, qy] = squashSwap(t, swapAt);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + x);
  const tx = tremble * (Math.sin(2 * Math.PI * 17 * t) + 0.5 * Math.sin(2 * Math.PI * 9 * t));
  return (
    <>
      {shadow ? <div style={{position: 'absolute', left: x - 120 * s, top: y - 14 * s, width: 240 * s, height: 30 * s, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)'}} /> : null}
      <Spr n={pose} x={x + tx} y={y} s={k} sx={qx * sx} sy={qy * br * sy} />
    </>
  );
};

// ---------- props drawn in code ----------
// oxygen tank behind the pig + a tube into the pig's rear (2021 part)
const Tank: React.FC<{t: number; show: number; attached: boolean}> = ({t, show, attached}) => {
  if (show <= 0.001) return null;
  const pr = S('pigSick');
  const rearX = PIG.x - (pr.feet[0] - pr.left) * PIG.s + 30;
  const rearY = PIG.y - 0.55 * (pr.bottom - pr.top) * PIG.s;
  const flow = t > T.breathed - 0.2;
  return (
    <Svg>
      <g transform={`translate(${TANK.x} ${TANK.y}) scale(${show})`}>
        <rect x={-48} y={-300} width={96} height={300} rx={40} fill={O2G} stroke={INK} strokeWidth={8} />
        <rect x={-30} y={-280} width={16} height={240} rx={8} fill="#6FD093" />
        <rect x={-18} y={-340} width={36} height={44} fill="#9AA0A8" stroke={INK} strokeWidth={7} />
        <circle cx={0} cy={-350} r={22} fill="#C9CDD2" stroke={INK} strokeWidth={7} />
        <text x={0} y={-130} textAnchor="middle" fontFamily={FONT} fontSize={56} fill="#fff" stroke={INK} strokeWidth={4} paintOrder="stroke">O2</text>
      </g>
      {attached ? <path d={`M ${TANK.x + 20} ${TANK.y - 350} C ${TANK.x + 120} ${TANK.y - 470}, ${rearX - 120} ${rearY - 160}, ${rearX} ${rearY}`} fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" opacity={show} /> : null}
      {attached ? <path d={`M ${TANK.x + 20} ${TANK.y - 350} C ${TANK.x + 120} ${TANK.y - 470}, ${rearX - 120} ${rearY - 160}, ${rearX} ${rearY}`} fill="none" stroke="#DDF3FA" strokeWidth={9} strokeLinecap="round" opacity={show}
        strokeDasharray={flow ? '20 26' : undefined} strokeDashoffset={-t * 160} /> : null}
    </Svg>
  );
};

// bubbles rising (world)
const Bubbles: React.FC<{t: number; t0: number; t1: number; x: number; y: number; n?: number; spread?: number; col?: string}> = ({t, t0, t1, x, y, n = 10, spread = 60, col = '#DDF3FA'}) => {
  if (t < t0 || t > t1 + 1.2) return null;
  return (
    <Svg>
      {Array.from({length: n}).map((_, i) => {
        const born = t0 + (i / n) * Math.max(0.3, t1 - t0);
        const u = (t - born) / 1.1;
        if (u < 0 || u > 1) return null;
        const bx = x + (rnd(i) - 0.5) * spread + 18 * Math.sin(u * 7 + i);
        const by = y - 260 * u;
        const r = (9 + 9 * rnd(i + 3)) * (u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15);
        return (
          <g key={i}>
            <circle cx={bx} cy={by} r={r} fill={col} stroke={INK} strokeWidth={4} />
            <circle cx={bx - r * 0.35} cy={by - r * 0.35} r={r * 0.25} fill="#fff" />
          </g>
        );
      })}
    </Svg>
  );
};

// IV stand with a code liquid level in the bag, a tube to the guy, and an O2 tag at the end
const IVStand: React.FC<{t: number; enter: number; level: number; o2: number; guyHip: [number, number]}> = ({t, enter, level, o2, guyHip}) => {
  const sp = S('iv');
  const bag = sp.bag ?? [218, 99, 317, 257];
  const tube = sp.tube ?? [319, 462];
  const x = lerp(1500, IV.x, easeOutCubic(enter));
  const s = IV.s;
  const W = (bx: number) => x + (bx - sp.feet[0]) * s;
  const H = (by: number) => IV.y + (by - sp.feet[1]) * s;
  const [bx0, by0, bx1, by1] = bag;
  const emptyH = (by1 - by0) * (1 - level);
  const flowing = level > 0.02 && t > T.fill - 0.1 && t < T.half + 0.3;
  const wob = 1 + 0.04 * Math.sin(t * 14) * o2 * (1 - prog(t, T.oxygen + 0.6, T.oxygen + 1.2));
  return (
    <>
      {/* tube from the bag's outlet down and behind the guy (drawn under him) */}
      {enter > 0.6 ? (
        <Svg>
          <path d={`M ${W(tube[0])} ${H(tube[1])} C ${W(tube[0]) + 30} ${IV.y - 60}, ${guyHip[0] + 140} ${guyHip[1] + 120}, ${guyHip[0] + 10} ${guyHip[1]}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d={`M ${W(tube[0])} ${H(tube[1])} C ${W(tube[0]) + 30} ${IV.y - 60}, ${guyHip[0] + 140} ${guyHip[1] + 120}, ${guyHip[0] + 10} ${guyHip[1]}`} fill="none" stroke={LIQ} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={flowing ? '16 20' : undefined} strokeDashoffset={-t * 140} />
        </Svg>
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${IV.y}px) scale(1, ${wob}) translate(${-x}px, ${-IV.y}px)`}}>
        <Spr n="iv" x={x} y={IV.y} s={s}>
          {/* empty part of the bag (clear plastic) from the top down */}
          <clipPath id="bagclip">
            <rect x={bx0 + 6} y={by0 + 4} width={bx1 - bx0 - 12} height={by1 - by0 - 8} rx={14} />
          </clipPath>
          <g clipPath="url(#bagclip)">
            <rect x={bx0} y={by0} width={bx1 - bx0} height={emptyH} fill="#F2FAFD" />
            <line x1={bx0} x2={bx1} y1={by0 + emptyH} y2={by0 + emptyH} stroke={LIQ_D} strokeWidth={5} />
          </g>
          {o2 > 0.01 ? (
            <g transform={`translate(${(bx0 + bx1) / 2} ${(by0 + by1) / 2 + 10}) scale(${o2})`}>
              <circle r={44} fill={O2G} stroke={INK} strokeWidth={7} />
              <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontSize={40} fill="#fff">O2</text>
            </g>
          ) : null}
        </Spr>
      </div>
      {t > T.fill - 0.1 && t < T.but + 1.2 ? <Bubbles t={t} t0={T.fill - 0.05} t1={T.liquid + 0.4} x={W((bx0 + bx1) / 2)} y={H(by1) - 30} n={9} spread={50} /> : null}
      {o2 > 0.01 ? <Bubbles t={t} t0={T.oxygen - 0.05} t1={DURATION} x={W((bx0 + bx1) / 2)} y={H(by0) + 40} n={14} spread={70} /> : null}
    </>
  );
};

// toilet + flush whirl (where the quitters run)
const Toilet: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.some - 0.1, T.twenty + 0.4, 0.3);
  if (s <= 0.001) return null;
  const shk = t > T.quit + 0.15 && t < T.quit + 0.8 ? 5 * Math.sin(t * 60) : 0;
  return <Spr n="toilet" x={TOILET.x + shk} y={TOILET.y} s={TOILET.s * s} sx={-1} />;
};

// runners: 3 quitters dash across the foreground towards the toilet
const RUNS = [
  {t0: T.some - 0.05, d: 0.95, s: 0.5},
  {t0: T.guys + 0.05, d: 0.85, s: 0.47},
  {t0: T.quit - 0.05, d: 0.9, s: 0.52},
];
const Runners: React.FC<{t: number}> = ({t}) => (
  <>
    {RUNS.map((r, i) => {
      const u = (t - r.t0) / r.d;
      if (u < 0 || u > 1) return null;
      const x = lerp(1600, TOILET.x - 40, easeInCubic(u) * 0.35 + u * 0.65);
      const hop = -18 * Math.abs(Math.sin(u * Math.PI * 6));
      const sk = u > 0.92 ? 1 - (u - 0.92) / 0.08 : 1;
      return <Person key={i} t={t} pose="run" x={x} y={RUN_Y + hop + i * 12} s={r.s * sk} sx={-1} swapAt={-1} shadow={false} />;
    })}
    {RUNS.map((r, i) => {
      const u = (t - r.t0 - 0.1) / 0.6;
      if (u < 0 || u > 1) return null;
      const x = lerp(1600, TOILET.x - 40, easeInCubic(clamp((t - r.t0) / r.d)) * 0.35 + clamp((t - r.t0) / r.d) * 0.65) + 160;
      return (
        <Svg key={'d' + i}>
          {[0, 1, 2].map((j) => <line key={j} x1={x + 30 + 50 * u} x2={x + 100 + 60 * u} y1={RUN_Y - 260 + j * 50} y2={RUN_Y - 260 + j * 50} stroke={INK} strokeWidth={7} strokeLinecap="round" opacity={1 - u} />)}
        </Svg>
      );
    })}
  </>
);

// ---------- screen-space overlays ----------
const fmt = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
// stopwatch: 60:00 counts down from 'hold' to 'make'
const Stopwatch: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.test - 0.05, T.so - 0.1, 0.3);
  if (s <= 0.001) return null;
  const sp = S('watch');
  const face = sp.face ?? [220, 363, 172];
  const k = 0.62;
  const u = prog(t, T.hold, T.make);
  const left = 3600 * (1 - Math.pow(u, 1.6));
  const done = t >= T.make;
  const shk = done && t < T.make + 0.6 ? 8 * Math.sin(t * 70) * (1 - (t - T.make) / 0.6) : 0;
  const mv = easeInOutCubic(prog(t, T.twenty - 0.1, T.twenty + 0.3));
  const cx = lerp(540, 175, mv) + shk;
  const cy = lerp(330, 215, mv);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 700, transform: `scale(${s * lerp(1, 0.62, mv) * bump(t, T.make, 0.35, 0.12)})`, transformOrigin: `${cx}px ${cy}px`}}>
      <div style={{position: 'absolute', left: cx - face[0] * k, top: cy - face[1] * k, width: sp.w * k, height: sp.h * k}}>
        <Img src={F('watch')} style={{width: '100%', height: '100%'}} />
      </div>
      <svg width={1080} height={700} style={{position: 'absolute', left: 0, top: 0}}>
        {/* a sweep hand */}
        <line x1={cx} y1={cy} x2={cx + 80 * Math.sin(u * 2 * Math.PI * 6)} y2={cy - 80 * Math.cos(u * 2 * Math.PI * 6)} stroke={RED} strokeWidth={7} strokeLinecap="round" opacity={0.35} />
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy + 4, transform: 'translate(-50%, -50%)', fontFamily: FONT, fontSize: 70, color: done ? '#2E9E4F' : '#000'}}>
        {t < T.hold ? '60:00' : fmt(Math.max(0, left))}
      </div>
      <Label x={cx} y={cy + 160} text="1 HOUR?" size={56} s={popOut(t, T.hour - 0.02, T.the3, 0.25)} rot={-3} fill={YEL} />
    </div>
  );
};

// measuring jug next to the guy: 25 mL -> 1.5 L
const Jug: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const s = popOut(t, T.dose - 0.1, T.bellies + 0.15, 0.3);
  if (s <= 0.001) return null;
  const u = easeInOutCubic(prog(t, T.grows, T.half + 0.15));
  const ml = Math.round(lerp(25, 1500, u * u));
  const txt = ml >= 1500 ? '1.5 L' : ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml / 25) * 25} mL`;
  const H = 300;
  const lvl = lerp(0.04, 0.92, u);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${s}) rotate(4deg)`, transformOrigin: '50% 100%'}}>
      <svg width={240} height={H + 30} style={{overflow: 'visible'}}>
        <path d={`M 40 10 L 200 10 L 190 ${H} Q 190 ${H + 16} 174 ${H + 16} L 66 ${H + 16} Q 50 ${H + 16} 50 ${H} Z`} fill="#F2FAFD" stroke={INK} strokeWidth={8} />
        <clipPath id="jugclip"><path d={`M 44 14 L 196 14 L 186 ${H} Q 186 ${H + 12} 172 ${H + 12} L 68 ${H + 12} Q 54 ${H + 12} 54 ${H} Z`} /></clipPath>
        <rect x={30} y={H + 14 - (H + 2) * lvl + 4 * Math.sin(t * 9)} width={200} height={H} fill={LIQ} clipPath="url(#jugclip)" />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={150} x2={186} y1={H + 12 - H * f} y2={H + 12 - H * f} stroke={INK} strokeWidth={5} />)}
        <path d={`M 200 40 Q 250 40 248 110 Q 246 170 194 170`} fill="none" stroke={INK} strokeWidth={10} />
      </svg>
      <Label x={120} y={-40} text={txt} size={58} s={bump(t, T.half, 0.35, 0.18)} fill={ml >= 1500 ? RED : '#fff'} />
    </div>
  );
};

// 27 volunteers: 7 quit
const Counter: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.twenty - 0.05, T.next, 0.3);
  if (s <= 0.001) return null;
  const quit = new Set([3, 8, 11, 15, 19, 22, 26]);
  const x0 = 540 - 4 * 92;
  const y0 = 430;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1000, transform: `scale(${s})`, transformOrigin: '540px 520px'}}>
      <div style={{position: 'absolute', left: 90, top: 370, width: 900, height: 300, borderRadius: 36, background: 'rgba(255,255,255,0.92)', border: '8px solid #000'}} />
      <svg width={1080} height={1000} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 27}).map((_, i) => {
          const cx = x0 + (i % 9) * 92;
          const cy = y0 + Math.floor(i / 9) * 82 + 10;
          const ps = pop(t, T.twenty + i * 0.022, 0.2);
          const out = quit.has(i) && t > T.twentyseven + 0.15 + 0.05 * [...quit].indexOf(i);
          if (ps <= 0.001) return null;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${ps})`} opacity={out ? 0.4 : 1}>
              <circle r={30} fill={out ? '#BDBDBD' : '#FEFDFD'} stroke={INK} strokeWidth={6} />
              <ellipse cx={-10} cy={-3} rx={4} ry={7} fill={INK} />
              <ellipse cx={10} cy={-3} rx={4} ry={7} fill={INK} />
              {out ? (
                <g stroke={RED} strokeWidth={8} strokeLinecap="round">
                  <line x1={-22} y1={-22} x2={22} y2={22} />
                  <line x1={22} y1={-22} x2={-22} y2={22} />
                </g>
              ) : t > T.make ? (
                <path d="M -12 10 Q 0 20 12 10" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
              ) : null}
            </g>
          );
        })}
      </svg>
      <Label x={540} y={730} text="20 / 27 MADE IT" size={72} s={pop(t, T.make - 0.05, 0.3)} rot={-2} fill={YEL} />
    </div>
  );
};

// confetti (world)
const Confetti: React.FC<{t: number; t0: number; x: number; y: number}> = ({t, t0, x, y}) => {
  if (t < t0 || t > t0 + 1.6) return null;
  const u = t - t0;
  const cols = [RED, YEL, '#3C7FC0', '#2E9E4F', '#F08A3C'];
  return (
    <Svg>
      {Array.from({length: 24}).map((_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * rnd(i + 40));
        const v = 420 + 320 * rnd(i + 50);
        const px = x + Math.cos(a) * v * u;
        const py = y + Math.sin(a) * v * u + 0.5 * 800 * u * u;
        return <rect key={i} x={px} y={py} width={20} height={11} fill={cols[i % 5]} stroke={INK} strokeWidth={3} transform={`rotate(${400 * u * (rnd(i) - 0.5)} ${px} ${py})`} opacity={1 - prog(u, 1.2, 1.6)} />;
      })}
    </Svg>
  );
};

// ---------- camera ----------
const CAM: CamKey[] = [
  {t: 0, x: 570, y: 1239, k: 1.12},
  {t: T.now - 0.05, x: 560, y: 1250, k: 1.17},
  {t: T.volunteers + 0.25, x: 882, y: 1185, k: 1.08},
  {t: T.liquid + 0.4, x: 882, y: 1185, k: 1.08},
  {t: T.but + 0.25, x: 800, y: 1287, k: 1.22, ease: 'out'},
  {t: T.bellies - 0.1, x: 795, y: 1287, k: 1.24},
  {t: T.some + 0.2, x: 800, y: 1114, k: 1.0},
  {t: T.twenty + 0.2, x: 800, y: 1114, k: 1.0},
  {t: T.so, x: 882, y: 1185, k: 1.08},
  {t: T.liquid2, x: 880, y: 1239, k: 1.15},
  {t: T.oxygen + 0.4, x: 880, y: 1239, k: 1.15},
  {t: DURATION - 0.1, x: 570, y: 1239, k: 1.12},
];
const clampCam = (c: Cam): Cam => {
  const hw = 540 / c.k;
  const hh = 960 / c.k;
  return {x: clamp(c.x, hw, PW - hw), y: clamp(c.y, hh, PH - hh), k: c.k};
};

// ---------- the scene ----------
export const BBScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camOverride, cover}) => {
  const base = clampCam(camOverride ?? camAt(t, CAM));
  const sh =
    t > T.but && t < T.but + 0.35 ? shake(t, 10 * (1 - (t - T.but) / 0.35))
    : t > T.bellies && t < T.bellies + 0.4 ? shake(t, 8 * (1 - (t - T.bellies) / 0.4))
    : {x: 0, y: 0};
  const cam = {x: base.x - sh.x / base.k, y: base.y - sh.y / base.k, k: base.k};

  // pig
  const pigPose = cover ? 'pigHappy' : t < T.breathed ? 'pigSick' : t < T.butts + 0.1 || t > DURATION - 1.2 ? 'pigHappy' : 'pigSmug';
  const pigSwap = t < T.butts + 0.1 ? T.breathed : t > DURATION - 1.2 ? DURATION - 1.2 : T.butts + 0.1;
  const [pqx, pqy] = squashSwap(t, pigSwap);
  const pigHop = t > T.breathed && t < T.breathed + 0.5 ? -40 * Math.sin((Math.PI * (t - T.breathed)) / 0.5) : 0;
  const pigOff = cover ? 0 : -560 * easeInOutCubic(prog(t, T.this, T.volunteers + 0.5)) * (1 - easeOutCubic(prog(t, DURATION - 1.5, DURATION - 0.75)));
  const pigWalk = pigOff < -1 && pigOff > -555 ? -10 * Math.abs(Math.sin(t * 18)) : 0;

  // guy pose
  let pose: GPose = 'volunteer';
  let swapAt = -1;
  if (!cover) {
    if (t >= T.oxygen) { pose = 'gulp'; swapAt = T.oxygen; }
    else if (t >= T.make) { pose = 'win'; swapAt = T.make; }
    else if (t >= T.bellies) { pose = 'ache'; swapAt = T.bellies; }
    else if (t >= T.hold) { pose = 'hold'; swapAt = T.hold; }
    else if (t >= T.gut) { pose = 'gulp'; swapAt = T.gut; }
    else if (t >= T.volunteers) { swapAt = T.volunteers; }
  }
  // belly swells with the dose (hold / ache), back to normal after
  const swell = t < T.gut ? 0 : t < T.hold ? 0.03 * prog(t, T.gut, T.liquid + 0.3) : t < T.make ? lerp(0.03, 0.13, easeInOutCubic(prog(t, T.grows, T.half + 0.2))) : 0;
  const guyHop = pose === 'volunteer' && !cover ? -26 * Math.abs(Math.sin(2 * Math.PI * 1.4 * (t - T.volunteers))) * prog(t, T.volunteers, T.volunteers + 0.05) * (1 - prog(t, T.it, T.doctors)) : pose === 'win' ? -40 * Math.abs(Math.sin(2 * Math.PI * 1.5 * (t - T.make))) * (1 - prog(t, T.make + 0.9, T.so)) : 0;
  const tremble = pose === 'hold' ? 1.6 + 2.4 * prog(t, T.grows, T.half) : pose === 'gulp' || pose === 'ache' ? 1.4 : 0;
  const guyHip: [number, number] = [GUY.x + 8, GUY.y - 200];

  // doctor
  const docIn = cover ? 1 : prog(t, T.doctors - 0.25, T.fill + 0.2);
  let dpose: DPose = 'docShow';
  let dswap = -1;
  if (!cover) {
    if (t >= T.next) { dpose = 'docShow'; dswap = T.next; }
    else if (t >= T.make) { dpose = 'docClap'; dswap = T.make; }
    else if (t >= T.test) { dpose = 'docTalk'; dswap = T.test; }
  }
  const docX = lerp(1560, DOC.x, easeOutCubic(docIn));

  // IV bag level: full -> drains on 'fill' a bit, then empties during 'dose grows', refills (with O2) on 'next time'
  const level = cover ? 1 : t < T.fill ? 1 : t < T.but ? lerp(1, 0.75, prog(t, T.fill, T.liquid + 0.4)) : t < T.so ? lerp(0.75, 0.05, easeInOutCubic(prog(t, T.grows, T.half + 0.2))) : lerp(0.05, 1, easeOutCubic(prog(t, T.time, T.liquid2 + 0.3)));
  const o2 = cover ? 0 : pop(t, T.oxygen - 0.02, 0.3);
  const sweat = pose === 'gulp' || pose === 'hold' || pose === 'ache' ? pop(t, swapAt + 0.1, 0.2) : 0;
  const k = (GUY.s * HEAD_R) / (S(pose).hd?.[2] ?? HEAD_R);
  const headY = GUY.y - (S(pose).feet[1] - (S(pose).hd?.[1] ?? 200)) * k;
  const headR = HEAD_R * GUY.s;

  return (
    <AbsoluteFill style={{backgroundColor: '#CFEDE3'}}>
      <World cam={cam}>
        <Img src={F('clinic')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
        {/* 2021: the pig with its oxygen tube */}
        <Tank t={t} show={1} attached={pigOff > -3} />
        {cover ? null : <div style={{position: 'absolute', left: PIG.x + pigOff - 150, top: PIG.y - 12, width: 300, height: 26, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)'}} />}
        {cover ? null : <Spr n={pigPose} x={PIG.x + pigOff} y={PIG.y + pigHop + pigWalk} s={PIG.s} sx={pqx * (pigOff < -1 && t < DURATION - 1.5 ? -1 : 1)} sy={pqy * (1 + (t < T.breathed ? 0.025 : 0.01) * Math.sin(2 * Math.PI * (t < T.breathed ? 1.1 : 0.6) * t))} />}
        {!cover ? <Bubbles t={t} t0={T.breathed - 0.1} t1={T.now} x={PIG.x - 120} y={PIG.y - 170} n={8} /> : null}
        {/* the doctor + IV stand (enter from the right on 'Doctors') */}
        {docIn > 0 ? <IVStand t={t} enter={docIn} level={level} o2={o2} guyHip={guyHip} /> : null}
        {docIn > 0 && !cover ? <Person t={t} pose={dpose} x={docX} y={DOC.y} s={DOC.s} swapAt={dswap} /> : null}
        <Person t={t} pose={pose} x={GUY.x} y={GUY.y + guyHop} s={GUY.s} swapAt={swapAt} sx={1 + swell} sy={1 - swell * 0.25} tremble={tremble} />
        <Svg>
          <SweatDrop x={GUY.x + headR * 0.95} y={headY - headR * 0.2 + 70 * prog((t * 0.8) % 1, 0, 1)} r={20} s={sweat} rot={-15} />
          {pose === 'hold' && t > T.half ? <SweatDrop x={GUY.x - headR * 0.95} y={headY - headR * 0.1 + 60 * prog((t * 0.9 + 0.4) % 1, 0, 1)} r={18} s={pop(t, T.half, 0.2)} rot={15} /> : null}
        </Svg>
        <Toilet t={t} />
        <Runners t={t} />
        <Confetti t={t} t0={T.make} x={GUY.x} y={GUY.y - 650} />
      </World>
      {!cover ? (
        <>
          <Label x={540} y={300} text="2021: PIGS" size={92} s={popOut(t, -1, T.now - 0.15, 0.01)} rot={-4} fill={YEL} />
          <Label x={540} y={300} text="PART 2: HUMANS" size={92} s={popOut(t, T.now - 0.02, T.but - 0.2, 0.3)} rot={3} fill={YEL} />
          <Label x={540} y={470} text="SAME LIQUID" size={64} s={popOut(t, T.same - 0.02, T.but - 0.1, 0.25)} rot={-3} fill="#fff" />
          <Stopwatch t={t} />
          <Jug t={t} x={(GUY.x - 250 - cam.x) * cam.k + 540} y={(GUY.y - 150 - cam.y) * cam.k + 960} />
          <Label x={540} y={560} text="QUIT!" size={110} s={popOut(t, T.quit - 0.02, T.twenty - 0.05, 0.25)} rot={-5} fill={RED} />
          <Counter t={t} />
          <Label x={540} y={360} text="NEXT: + OXYGEN" size={84} s={popOut(t, T.oxygen - 0.02, T.end + 0.05, 0.3)} rot={-3} fill={YEL} />
          <Label x={540} y={330} text="WOULD YOU?" size={120} s={popOut(t, T.end + 0.25, DURATION + 1, 0.3)} rot={4} fill="#fff" />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'bubbles', at: T.breathed - 0.15, db: -26, dur: 1.4},
  {f: 'oink', at: T.butts - 0.38, db: -17},
  {f: 'stamp', at: T.now - 0.02, db: -16},
  {f: 'boing', at: T.volunteers, db: -26},
  {f: 'whoosh', at: T.doctors - 0.3, db: -27},
  {f: 'pour', at: T.fill, db: -27, dur: 1.0},
  {f: 'bubbles', at: T.gut, db: -29, dur: 1.2},
  {f: 'gulp', at: T.gut + 0.05, db: -19},
  {f: 'scratch', at: T.but - 0.03, db: -18},
  {f: 'pop', at: T.test - 0.05, db: -22},
  {f: 'ticks', at: T.hold, db: -28, dur: 7.4, keys: [[T.hold, -30], [T.half, -27], [T.make - 0.05, -27], [T.make, -60]]},
  {f: 'puffup', at: T.grows - 0.05, db: -22},
  {f: 'pop', at: T.half, db: -22, rate: 1.2},
  {f: 'stomach_growl', at: T.bellies - 0.05, db: -15},
  {f: 'pop', at: T.some - 0.1, db: -23},
  {f: 'stampede', at: T.some - 0.05, db: -22},
  {f: 'whoosh', at: T.guys, db: -26},
  {f: 'flush', at: T.quit + 0.15, db: -17},
  {f: 'tick_tock', at: T.twenty, db: -26},
  {f: 'timer_ding', at: T.make - 0.02, db: -12},
  {f: 'party_horn', at: T.make + 0.05, db: -21},
  {f: 'whoosh', at: T.next - 0.1, db: -28},
  {f: 'magic', at: T.oxygen - 0.05, db: -21},
  {f: 'gulp', at: T.oxygen + 0.35, db: -17},
  {f: 'oink', at: DURATION - 1.15, db: -21, dur: 0.6},
];

export const ButtBreathShort: React.FC = () => {
  useBBFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#CFEDE3'}}>
      <BBScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('butt-breath/vo/take1.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('butt-breath/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="butt-breath/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
