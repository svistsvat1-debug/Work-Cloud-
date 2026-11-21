import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {camAt, clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam} from '../shared/anim';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why did two kinds of cicadas meet in 2024?" - PART 2 of the 2021 viral Brood X cicadas, told as a story.
// Facts (Univ. of Illinois Extension, USDA Forest Service, 2024): Brood XIII (17-year) and Brood XIX (13-year) emerged in
// the same spring of 2024; Illinois is the only state where they could meet (both found in a few central counties); the
// last time both came up together was 1803 (Jefferson was president 1801-1809); next time 2245. Trillions of cicadas.

export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.3;
const W = (s: number) => s + VO_AT; // fitted-voice word start -> video time
export const T = {
  cicada: W(0.08), seventeen: W(2.66), years: W(3.43), so: W(4.35), digs: W(5.2), sun: W(6.04), bumps: W(7.12), stranger: W(7.74),
  cicada2: W(8.58), thirteen: W(9.96), two: W(10.89), broods: W(11.35), spring: W(12.89), so2: W(13.67), trillions: W(13.9),
  sing: W(14.79), once: W(15.17), lawn: W(16.29), mower: W(16.66), but: W(17.16), met: W(18.2), thomas: W(18.82),
  president: W(19.78), next: W(20.55), time: W(20.86), twenty: W(21.31), fortyfive: W(21.85), end: W(22.65),
};

const F = (n: string) => staticFile(`cicada-reunion/${n}`);
export const FONT = 'CRInter';
export const useCRFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const PS = 1.4;
const PW = 1024 * PS;
const PH = 1536 * PS;
const SURF = 470; // grass line on the under plate (world)
const TUN_X = 714;
const FLOOR = 1450; // chamber floor
const GROUND = 1530; // grass on the tree plate

type SprInfo = {w: number; h: number; feet: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; filter?: string}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, filter}) => {
  const sp = S(n);
  if (s <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter}}>
      <Img src={F(`${n}.png`)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.09, width: w, height: w * 0.18, borderRadius: '50%', background: 'rgba(40,50,30,0.25)', filter: 'blur(3px)'}} />
);
const Txt: React.FC<{x: number; y: number; size: number; color?: string; rot?: number; s?: number; children: React.ReactNode}> = ({x, y, size, color = '#FFE45C', rot = 0, s = 1, children}) =>
  s <= 0.001 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, fontFamily: FONT, fontSize: size,
      lineHeight: 1.02, textAlign: 'center', color, WebkitTextStroke: `${size * 0.2}px #000`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
      {children}
    </div>
  );
const swapSq = (t: number, ts: number): [number, number] => {
  if (t < ts) return [1, 1];
  const s = spring(t - ts, 3.2, 7);
  return [1 - 0.05 * s, 1 + 0.06 * s];
};
const breathe = (t: number) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
const clampCam = (c: Cam): Cam => ({k: c.k, x: clamp(c.x, 540 / c.k, PW - 540 / c.k), y: clamp(c.y, 960 / c.k, PH - 960 / c.k)});
const WorldDiv: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam: c0, children}) => { const cam = clampCam(c0); return (
  <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 960px) scale(${cam.k}) translate(${-cam.x}px, ${-cam.y}px)`}}>{children}</div>
); };
const STRANGER = 'hue-rotate(-28deg) saturate(1.4) brightness(0.92)'; // the 13-year brood: a redder tint, drawn in code

// dirt crumbs thrown up while digging
const Crumbs: React.FC<{t: number; t0: number; t1: number; x: number; y: number}> = ({t, t0, t1, x, y}) => (
  <>
    {Array.from({length: 18}, (_, i) => {
      const born = t0 + (i / 18) * (t1 - t0);
      const tt = t - born;
      if (tt < 0 || tt > 0.6) return null;
      const a = -Math.PI / 2 + (rnd(i) - 0.5) * 1.6;
      const v = 380 + 260 * rnd(i + 3);
      const px = x + Math.cos(a) * v * tt;
      const py = y + Math.sin(a) * v * tt + 900 * tt * tt;
      const r = 9 + 8 * rnd(i + 7);
      return <div key={i} style={{position: 'absolute', left: px - r, top: py - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: '#7A5232', border: '3px solid #000'}} />;
    })}
  </>
);

// sound waves around a singer
const Waves: React.FC<{t: number; x: number; y: number; s: number}> = ({t, x, y, s}) => (
  <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={1} height={1}>
    {[0, 1, 2].map((i) => {
      const u = ((t * 2.2 + i / 3) % 1);
      const r = (40 + 120 * u) * s;
      return (
        <g key={i} opacity={1 - u}>
          <path d={`M ${-r} ${-r * 0.6} A ${r} ${r} 0 0 0 ${-r} ${r * 0.6}`} stroke="#000" strokeWidth={14 * s} fill="none" strokeLinecap="round" />
          <path d={`M ${r} ${-r * 0.6} A ${r} ${r} 0 0 1 ${r} ${r * 0.6}`} stroke="#000" strokeWidth={14 * s} fill="none" strokeLinecap="round" />
          <path d={`M ${-r} ${-r * 0.6} A ${r} ${r} 0 0 0 ${-r} ${r * 0.6}`} stroke="#FFE45C" strokeWidth={7 * s} fill="none" strokeLinecap="round" />
          <path d={`M ${r} ${-r * 0.6} A ${r} ${r} 0 0 1 ${r} ${r * 0.6}`} stroke="#FFE45C" strokeWidth={7 * s} fill="none" strokeLinecap="round" />
        </g>
      );
    })}
  </svg>
);

// the swarm on the tree: [x, y, scale, rot, appear-order]
const SWARM: [number, number, number, number][] = Array.from({length: 34}, (_, i) => {
  const onTrunk = i < 10;
  const x = onTrunk ? 640 + 140 * rnd(i + 40) : 140 + 1150 * rnd(i + 11);
  const y = onTrunk ? 900 + 520 * rnd(i + 50) : 180 + 640 * rnd(i + 21);
  return [x, y, 0.16 + 0.07 * rnd(i + 31), (rnd(i + 61) - 0.5) * 70];
});

export const CRScene: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const tree = (t >= T.so2 - 0.1 || cover) && !(cover === false);
  const sh = shake(t, (t > T.bumps && t < T.bumps + 0.35 ? 10 * (1 - prog(t, T.bumps, T.bumps + 0.35)) : 0) + (t > T.sing && t < T.but ? 5 : 0) + (t > T.fortyfive && t < T.fortyfive + 0.3 ? 9 * (1 - prog(t, T.fortyfive, T.fortyfive + 0.3)) : 0));

  if (!tree) {
    // ---------------- UNDERGROUND (hook -> stranger -> two broods) ----------------
    const cam = camAt(t, [
      {t: 0, x: 717, y: 960, k: 1.12},
      {t: T.years, x: 740, y: 1060, k: 1.3, ease: 'io'},
      {t: T.digs, x: 740, y: 1000, k: 1.3},
      {t: T.sun + 0.2, x: 760, y: 560, k: 1.45, ease: 'io'},
      {t: T.stranger + 0.3, x: 800, y: 520, k: 1.6, ease: 'io'},
      {t: T.two, x: 800, y: 520, k: 1.6},
      {t: T.broods + 0.4, x: 717, y: 640, k: 1.15, ease: 'io'},
      {t: T.so2, x: 717, y: 640, k: 1.15},
    ]);
    // nymph 1: sleeps in the chamber, climbs the tunnel on "digs", pops out on "sun"
    const climb = easeInOutCubic(prog(t, T.so + 0.2, T.sun));
    const n1y = t < T.sun ? lerp(FLOOR, SURF + 40, climb) : SURF;
    const n1x = t < T.sun ? (climb > 0.05 ? TUN_X : 700) : lerp(TUN_X, 650, easeOutCubic(prog(t, T.sun, T.sun + 0.3)));
    const popOut = t > T.sun ? spring(t - T.sun, 3, 6) : 0;
    const wiggle = t > T.so + 0.2 && t < T.sun ? 6 * Math.sin(2 * Math.PI * 7 * t) : 0;
    // nymph 2 (the stranger, 13-year brood) pops out of the grass right next to it on "bumps"
    const n2on = t > T.bumps - 0.25;
    const n2rise = easeOutCubic(prog(t, T.bumps - 0.25, T.bumps));
    const bonk = t > T.bumps ? spring(t - T.bumps, 4, 6) : 0;
    const yearsN = Math.max(1, Math.min(17, Math.floor(1 + 16 * prog(t, 0.15, T.years))));
    // the crowd: both broods pop out all over the lawn
    const crowd = Array.from({length: 12}, (_, i) => ({x: 120 + i * 108 + (i % 2) * 20, at: T.two + 0.05 + rnd(i + 5) * 1.6, red: i % 2 === 1}));
    return (
      <AbsoluteFill style={{background: '#BEE3F2', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
          <WorldDiv cam={cam}>
            <Img src={F('under.jpg')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
            {/* the human listening to the ground */}
            <Spr n="listen" x={1010} y={SURF + 6} s={0.46} sy={breathe(t)} />
            {/* crowd of both broods */}
            {crowd.map((c, i) => {
              if (t < c.at || Math.abs(c.x - 650) < 140 || Math.abs(c.x - 830) < 120 || Math.abs(c.x - 1010) < 130) return null;
              const u = easeOutCubic(prog(t, c.at, c.at + 0.25));
              const b = spring(t - c.at - 0.25, 3, 6);
              return <Spr key={i} n="nymph" x={c.x} y={SURF + 140 * (1 - u)} s={0.24} sx={i % 3 ? 1 : -1} sy={1 + 0.1 * b} filter={c.red ? STRANGER : undefined} />;
            })}
            {/* soil cover over the crowd's lower bodies (they come out of the ground) */}
            <div style={{position: 'absolute', left: 0, top: SURF + 2, width: PW, height: 160, background: 'transparent'}} />
            {/* nymph 1 */}
            {t > T.so + 0.2 && t < T.sun + 0.2 ? <Crumbs t={t} t0={T.digs - 0.2} t1={T.sun + 0.1} x={TUN_X} y={SURF} /> : null}
            <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: t < T.sun ? n1y + 4 : PH, overflow: t < T.sun ? 'visible' : 'visible'}}>
              <Spr n="nymph" x={n1x + wiggle} y={n1y} s={0.42} sx={(1 - 0.06 * popOut) * (1 + 0.04 * bonk)} sy={(1 + 0.08 * popOut) * (t < T.so ? breathe(t * 0.6) : 1)} rot={t > T.bumps ? -8 * bonk : 0} />
            </div>
            {t < T.so ? (
              /* Zzz while waiting */
              [0, 1, 2].map((i) => {
                const u = ((t + i * 0.6) % 1.8) / 1.8;
                return <Txt key={i} x={760 + 30 * i + 40 * u} y={FLOOR - 230 - 200 * u} size={46 + 20 * u} color="#fff" s={u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15}>Z</Txt>;
              })
            ) : null}
            {n2on ? <Spr n="nymph" x={850} y={SURF + 160 * (1 - n2rise)} s={0.42} sx={-1 * (1 + 0.05 * bonk)} sy={1 - 0.05 * bonk} rot={8 * bonk} filter={STRANGER} /> : null}
            {/* bonk stars */}
            {t > T.bumps && t < T.stranger + 0.6
              ? [0, 1, 2].map((i) => {
                  const a = 2 * Math.PI * (t * 1.5 + i / 3);
                  return <Txt key={i} x={750 + 70 * Math.cos(a)} y={SURF - 230 + 22 * Math.sin(a)} size={44} s={1}>★</Txt>;
                })
              : null}
            {/* the stranger reveal: age tags */}
            {t > T.stranger && t < T.two ? <Txt x={640} y={SURF - 300} size={64} color="#fff" s={pop(t, T.stranger, 0.3)} rot={-5}>17 YRS</Txt> : null}
            {t > T.thirteen && t < T.two ? <Txt x={870} y={SURF - 300} size={64} color="#FF6B57" s={pop(t, T.thirteen, 0.3)} rot={5}>13 YRS</Txt> : null}
            {t > T.cicada2 && t < T.thirteen ? <Txt x={880} y={SURF - 330} size={90} s={pop(t, T.cicada2, 0.25)}>?</Txt> : null}
          </WorldDiv>
        </div>
        {/* HUD year counter (hook) */}
        {t < T.so + 0.3 ? (
          <Txt x={540} y={260} size={92} s={1 - prog(t, T.so + 0.1, T.so + 0.3)}>
            YEAR {yearsN}
          </Txt>
        ) : null}
        {t > T.two && t < T.so2 ? (
          <Txt x={540} y={270} size={72} color="#fff" s={pop(t, T.two, 0.3)}>
            17 + 13 <span style={{color: '#FFE45C'}}>= SAME SPRING</span>
          </Txt>
        ) : null}
      </AbsoluteFill>
    );
  }

  // ---------------- TREE (trillions sing -> but 1803 -> next time 2245) ----------------
  const cam = camAt(t, [
    {t: T.so2 - 0.1, x: 717, y: 1300, k: 1.35},
    {t: T.sing, x: 717, y: 1000, k: 1.12, ease: 'io'},
    {t: T.mower, x: 717, y: 1050, k: 1.12},
    {t: T.but + 0.1, x: 800, y: 1300, k: 1.35, ease: 'io'},
    {t: T.end, x: 800, y: 1300, k: 1.35},
    {t: DURATION, x: 717, y: 1300, k: 1.35, ease: 'io'},
  ]);
  const c = cover ? {x: 760, y: 1250, k: 1.3} : cam;
  const past = t > T.but && t < T.next; // sepia flashback
  const singing = t > T.sing || cover;
  const guyPose = cover ? 'ears' : t > T.fortyfive ? 'shrug' : t > T.sing ? 'ears' : 'listen';
  const swapT = t > T.fortyfive ? T.fortyfive : t > T.sing ? T.sing : T.so2;
  const [qx, qy] = swapSq(t, swapT);
  const shiver = guyPose === 'ears' && t < T.but ? 4 * Math.sin(2 * Math.PI * 11 * t) : 0;
  const nVis = cover ? SWARM.length : Math.floor(SWARM.length * prog(t, T.trillions - 0.1, T.sing));
  const mowerX = lerp(-500, 330, easeOutCubic(prog(t, T.lawn - 0.4, T.mower)));
  const hatY = t < T.thomas ? -400 : lerp(GROUND - 500, GROUND + 230 - 360, Math.min(1, easeOutCubic(prog(t, T.thomas, T.thomas + 0.35))));
  const hatOff = t > T.fortyfive ? easeOutCubic(prog(t, T.fortyfive, T.fortyfive + 0.5)) : 0;
  // calendar year: 1803 on the flashback, rolling to 2245 on "next time"
  const yr = t < T.next ? 1803 : Math.round(lerp(1803, 2245, easeInOutCubic(prog(t, T.next, T.fortyfive))));
  const calOn = t > T.met - 0.2 && !cover;
  return (
    <AbsoluteFill style={{background: '#BEE3F2', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${sh.x}px, ${sh.y}px)`, filter: past ? 'sepia(0.85) saturate(0.8)' : undefined}}>
        <WorldDiv cam={c}>
          <Img src={F('tree.jpg')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
          {SWARM.slice(0, nVis).map(([x, y, s, r], i) => {
            const vib = singing ? 1 + 0.06 * Math.sin(2 * Math.PI * 9 * t + i) : 1;
            return <Spr key={i} n={singing && i % 3 === 0 ? 'sing' : 'adult'} x={x} y={y} s={s} sx={vib} sy={vib} rot={r} filter={i % 2 ? STRANGER : undefined} />;
          })}
          {singing && !past ? <Waves t={t} x={720} y={560} s={1.6} /> : null}
          {/* the lawn mower comparison */}
          {t > T.lawn - 0.4 && t < T.but && !cover ? <Spr n="mower" x={mowerX} y={GROUND + 230} s={0.62} sy={1 + 0.03 * Math.sin(2 * Math.PI * 14 * t)} /> : null}
          {/* the human */}
          <Shadow x={1050} y={GROUND + 230} w={170} />
          <Spr n={guyPose} x={1050 + shiver} y={GROUND + 230} s={0.62} sx={qx} sy={qy * breathe(t)} />
          {guyPose === 'ears' && !cover ? (
            <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={10} height={10}>
              <SweatDrop x={1130} y={GROUND - 120 + 40 * prog(t, T.sing + 0.2, T.but)} r={14} s={pop(t, T.sing + 0.2, 0.2)} />
            </svg>
          ) : null}
          {/* Jefferson hat lands on the guy, flies off on the payoff */}
          {t > T.thomas && !cover ? <Spr n="hat" x={1055 + 500 * hatOff} y={hatY - 700 * hatOff + 1200 * hatOff * hatOff} s={0.5} rot={-6 + 300 * hatOff} /> : null}
        </WorldDiv>
      </div>
      {/* HUD */}
      {t > T.trillions && t < T.but && !cover ? (
        <Txt x={540} y={250} size={92} s={pop(t, T.trillions, 0.3) * (1 + 0.03 * Math.sin(2 * Math.PI * 9 * t))}>TRILLIONS</Txt>
      ) : null}
      {t > T.lawn && t < T.but && !cover ? <Txt x={300} y={1180} size={64} color="#fff" s={pop(t, T.lawn, 0.25)} rot={-6}>AS LOUD AS</Txt> : null}
      {calOn ? (
        <div style={{position: 'absolute', left: 270, top: 640, transform: `scale(${pop(t, T.met - 0.2, 0.3) * (t > T.fortyfive ? 1 + 0.15 * spring(t - T.fortyfive, 3, 6) : 1)})`, transformOrigin: '50% 50%'}}>
          <Spr n="cal" x={0} y={0} s={1.25} />
          <Txt x={-6} y={-150} size={118} color={t > T.fortyfive ? '#FF4F6D' : '#222'}>{yr}</Txt>
          {t > T.next && t < T.fortyfive ? <Txt x={-6} y={-30} size={40} color="#fff">→→→</Txt> : null}
        </div>
      ) : null}
      {t > T.president && t < T.next ? <Txt x={820} y={330} size={58} color="#fff" s={pop(t, T.president, 0.3)} rot={6}>LAST TIME</Txt> : null}
      {t > T.time && t < T.end + 0.1 ? <Txt x={820} y={330} size={58} color="#fff" s={pop(t, T.time, 0.3)} rot={6}>NEXT TIME</Txt> : null}
      {/* "But" record-scratch freeze flash */}
      {t > T.but && t < T.but + 0.1 ? <AbsoluteFill style={{background: 'rgba(255,255,255,0.45)'}} /> : null}
      {/* comment hook end card */}
      {t > T.end + 0.1 && !cover ? (
        <>
          <Txt x={560} y={720} size={84} color="#fff" s={pop(t, T.end + 0.1, 0.35)} rot={-3}>
            HOW OLD WILL YOU
            <br />
            BE IN 2245?
          </Txt>
          <Txt x={540} y={930} size={64} s={pop(t, T.end + 0.5, 0.3) * (1 + 0.06 * Math.sin(2 * Math.PI * 2 * t))}>COMMENT ↓</Txt>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const CUES: Cue[] = [
  {f: 'ticks', at: 0.15, db: -24, dur: 3.3},
  {f: 'dig', at: T.digs - 0.2, db: -16},
  {f: 'dig', at: T.digs + 0.25, db: -17, rate: 1.1},
  {f: 'dig', at: T.digs + 0.65, db: -17, rate: 0.95},
  {f: 'pop', at: T.sun, db: -14},
  {f: 'twinkle', at: T.sun + 0.05, db: -24},
  {f: 'smack', at: T.bumps, db: -15},
  {f: 'boing', at: T.bumps + 0.05, db: -22},
  {f: 'pop', at: T.stranger, db: -20},
  {f: 'pop', at: T.thirteen, db: -19, rate: 1.2},
  ...Array.from({length: 7}, (_, i) => ({f: 'pop', at: T.two + 0.1 + i * 0.22, db: -22 - (i % 3), rate: 0.9 + 0.07 * i})),
  {f: 'whoosh', at: T.so2 - 0.2, db: -26},
  {f: 'sprout', at: T.trillions, db: -22},
  {f: 'cicada_chorus', at: T.sing - 0.05, db: -20, keys: [[T.sing, -20], [T.lawn, -22], [T.but - 0.05, -22], [T.but, -60]]},
  {f: 'mower', at: T.lawn - 0.35, db: -21, keys: [[T.lawn, -21], [T.but - 0.05, -21], [T.but, -60]]},
  {f: 'scratch', at: T.but - 0.02, db: -16},
  {f: 'knock', at: T.thomas + 0.33, db: -18},
  {f: 'rewind', at: T.next, db: -22},
  {f: 'ticks', at: T.next + 0.1, db: -20, dur: 1.2},
  {f: 'kaching', at: T.fortyfive, db: -17},
  {f: 'crickets', at: T.end + 0.2, db: -24},
];

export const CicadaReunionShort: React.FC = () => {
  useCRFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <CRScene t={t} cover={undefined} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={F('vo/take1_fit.wav')} />
      </Sequence>
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={F('music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="cicada-reunion/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const CR_DURATION = DURATION;
export const CR_FPS = FPS;
