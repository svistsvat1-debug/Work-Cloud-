import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {
  BirdFront, BirdSide, Brain, Bushes, Cloud, Ground, Hammer, Hills, Human, HUMAN_HEAD, INK,
  Magnifier, MovieCamera, Pillow, Spring, SW, TIP_FWD, Tree, TRUNK,
} from './sprites';

export const FPS = 60;
export const DUR = 26.2; // voice ends 25.31 s -> +0.9 s for the loop glide
const VO = 0.1; // voice placed at 0.1 s
// beat words (voice time from words_est.json) shifted by VO
const T = {
  slams: 0.77 + VO, over: 2.34 + VO, so: 3.93 + VO, concussion: 5.36 + VO, people: 6.33 + VO, skull: 7.95 + VO,
  shock: 9.15 + VO, but: 10.51 + VO, slow: 10.73 + VO, noCush: 12.59 + VO, its: 14.0 + VO, hammer: 15.83 + VO,
  padding: 16.89 + VO, waste: 17.53 + VO, force: 18.01 + VO, drill: 19.0 + VO, what: 19.88 + VO, size: 20.87 + VO,
  brain: 21.88 + VO, small: 22.41 + VO, concuss: 24.15 + VO, human: 24.81 + VO,
};

// ---------- helpers ----------
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const eIO = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eOut = (u: number) => 1 - Math.pow(1 - u, 3);
const eIn = (u: number) => u * u * u;
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const overshoot = (u: number) => { // 0 -> 1 with a springy overshoot (pop-on)
  if (u <= 0) return 0; if (u >= 1) return 1;
  return 1 - Math.exp(-6 * u) * Math.cos(10 * u) * (1 - u) - 0 * u;
};
const damp = (t: number, f = 7, d = 6) => (t < 0 ? 0 : Math.exp(-d * t) * Math.sin(2 * Math.PI * f * t)); // decaying wobble
const rnd = (seed: number) => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

// ---------- camera ----------
type Cam = {x: number; y: number; z: number};
const A: Cam = {x: 590, y: 965, z: 250};
const KEYS: Array<{t: number; c: Cam; e?: (u: number) => number}> = [
  {t: 0, c: A},
  {t: 3.9, c: {x: 600, y: 950, z: 290}},
  {t: 6.45, c: {x: 600, y: 950, z: 290}},
  {t: 7.75, c: {x: 650, y: 905, z: 470}},
  {t: 10.95, c: {x: 650, y: 905, z: 470}},
  {t: 13.3, c: {x: 655, y: 900, z: 520}},
  {t: 13.75, c: {x: 655, y: 900, z: 520}},
  {t: 14.95, c: {x: 600, y: 1010, z: 200}},
  {t: 19.95, c: {x: 600, y: 1010, z: 200}},
  {t: 21.05, c: {x: 690, y: 875, z: 520}},
  {t: 22.75, c: {x: 690, y: 875, z: 520}},
  {t: 23.95, c: {x: 690, y: 1180, z: -150}, e: eIO},
  {t: 25.05, c: {x: 690, y: 1180, z: -150}},
  {t: 26.2, c: A},
];
const camAt = (t: number): Cam => {
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1]; const u = (b.e ?? eIO)(prog(t, a.t, b.t));
  const ka = 1000 / (1000 - a.c.z), kb = 1000 / (1000 - b.c.z);
  const k = Math.exp(lerp(Math.log(ka), Math.log(kb), u));
  return {x: lerp(a.c.x, b.c.x, u), y: lerp(a.c.y, b.c.y, u), z: 1000 - 1000 / k};
};

const Layer: React.FC<{cam: Cam; z: number; blur?: number; minDepth?: number; children: React.ReactNode}> = ({cam, z, blur = 0, minDepth = 300, children}) => {
  const d = z - cam.z; if (d < minDepth) return null; const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>
        <svg width={1} height={1} style={{overflow: 'visible', position: 'absolute'}}>{children}</svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------- pecks ----------
type Peck = {c: number; d: number; kind: 'wood' | 'big' | 'drum' | 'spring' | 'pillow' | 'hammer'};
const PECKS: Peck[] = [];
const add = (c: number, d: number, kind: Peck['kind']) => PECKS.push({c, d, kind});
add(0, 0.36, 'wood'); add(0.45, 0.36, 'wood'); add(T.slams + 0.1, 0.4, 'big'); add(1.4, 0.32, 'wood'); add(1.8, 0.32, 'wood'); add(2.15, 0.3, 'wood');
for (let c = T.over + 0.12; c < 3.62; c += 0.09) add(c, 0.09, 'drum');
add(9.8, 0.34, 'spring'); add(10.25, 0.34, 'spring');
add(16.25, 0.3, 'hammer'); add(16.55, 0.3, 'hammer');
add(T.waste + 0.12, 0.36, 'pillow'); add(T.force + 0.2, 0.36, 'pillow');
for (let c = T.drill + 0.1; c < 19.9; c += 0.09) add(c, 0.09, 'drum');
add(25.75, 0.36, 'wood'); add(DUR - 1 / FPS, 0.36, 'wood');
const SLOW = {wind: 11.0, go: 11.4, hit: 13.05, back: 13.35, end: 13.75}; // the slow-motion peck
const WOOD_HITS = [...PECKS.filter((p) => p.kind !== 'spring' && p.kind !== 'pillow').map((p) => ({t: p.c, kind: p.kind})), {t: SLOW.hit, kind: 'big' as const}];

const peckReach = (t: number) => {
  let r = 0; let active: Peck | null = null;
  for (const p of PECKS) {
    const u = (t - (p.c - p.d * 0.5)) / p.d; if (u < 0 || u > 1) continue;
    active = p;
    if (u < 0.3) r = -0.25 * eOut(u / 0.3);
    else if (u < 0.5) r = lerp(-0.25, 1, eIn((u - 0.3) / 0.2));
    else if (u < 0.62) r = 1;
    else r = 1 - eOut((u - 0.62) / 0.38);
  }
  if (t >= SLOW.wind && t <= SLOW.end) {
    if (t < SLOW.go) r = -0.3 * eOut(prog(t, SLOW.wind, SLOW.go));
    else if (t < SLOW.hit) r = lerp(-0.3, 1, Math.pow(prog(t, SLOW.go, SLOW.hit), 2.2));
    else if (t < SLOW.back) r = 1;
    else r = 1 - eOut(prog(t, SLOW.back, SLOW.end));
  }
  return {r, active};
};

// ---------- attachments (spring / pillow) ----------
const SPRING_ON = T.shock + 0.1, SPRING_OFF = T.noCush + 0.1;
const PILLOW_ON = T.padding + 0.1, PILLOW_OFF = 18.75;
const SPRING_L = 100, PILLOW_L = 120;
const leanShift = (t: number) => {
  const s = 70 * eIO(prog(t, SPRING_ON - 0.05, SPRING_ON + 0.25)) * (1 - eIO(prog(t, SPRING_OFF, SPRING_OFF + 0.6)));
  const p = 95 * eIO(prog(t, PILLOW_ON - 0.05, PILLOW_ON + 0.25)) * (1 - eIO(prog(t, PILLOW_OFF, PILLOW_OFF + 0.3)));
  return s + p;
};

// ---------- bird state ----------
const REST = {x: 575, y: 860};
const TURN1 = T.so + 0.12, TURN2 = T.people + 0.1;
const birdBasePose = (t: number): 'rest' | 'front' | 'determined' | 'smug' => {
  if (t >= TURN1 && t < TURN2) return 'front';
  if (t >= T.its + 0.1 && t < PILLOW_ON - 0.05) return 'determined';
  if (t >= T.drill - 0.1 && t < T.what + 0.05) return 'determined';
  if (t >= T.small + 0.1 && t < 25.3) return 'smug';
  return 'rest';
};
const birdState = (t: number) => {
  const {r, active} = peckReach(t);
  const base = birdBasePose(t);
  const springOn = t >= SPRING_ON && t < SPRING_OFF, pillowOn = t >= PILLOW_ON && t < PILLOW_OFF;
  const minGap = springOn ? 46 : pillowOn ? PILLOW_L * 0.45 : 0;
  const rest = REST.x + leanShift(t);
  const pose: 'front' | 'peck' | 'rest' | 'determined' | 'smug' = base === 'front' ? 'front' : r > 0.8 ? 'peck' : base;
  const target = TRUNK.x1 + 2 + minGap - TIP_FWD.x; // root x at full contact (peck pose)
  const rootX = r >= 0 ? lerp(rest, target, r) : rest - r * 40;
  const tipX = rootX + (pose === 'peck' ? TIP_FWD.x : 0), tipY = REST.y + (pose === 'peck' ? TIP_FWD.y : 0);
  return {pose, rootX, rootY: REST.y, tipX, tipY, r, active, springOn, pillowOn};
};

// squash used at the two turns (scaleX about the feet) and life on holds
const birdScale = (t: number) => {
  let sx = 1, sy = 1;
  for (const tt of [TURN1, TURN2]) { const u = (t - tt) / 0.1; if (Math.abs(u) < 1) { const q = 1 - Math.abs(u); sx -= 0.22 * q; sy += 0.04 * q; } }
  sy *= 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  sy += 0.04 * damp(t - T.concussion, 5, 7);
  return {sx, sy};
};

// ---------- chips ----------
type Chip = {t0: number; x: number; y: number; vx: number; vy: number; w: number; h: number; spin: number; rot: number; col: string};
const CHIPS: Chip[] = [];
WOOD_HITS.forEach((h, i) => {
  if (h.kind === 'hammer') return;
  const R = rnd(i + 3); const n = h.kind === 'big' ? 7 : h.kind === 'drum' ? 2 : 4;
  for (let j = 0; j < n; j++) CHIPS.push({t0: h.t, x: TRUNK.x1 + 4, y: 885 + (R() - 0.5) * 20, vx: 180 + R() * 480, vy: -650 + R() * 520,
    w: 12 + R() * 12, h: 7 + R() * 6, spin: (R() - 0.5) * 1500, rot: R() * 180, col: R() > 0.5 ? '#E3B077' : '#C88C55'});
});
const Chips: React.FC<{t: number}> = ({t}) => (
  <g>
    {CHIPS.map((c, i) => {
      let dt = t - c.t0; if (dt < 0 || dt > 1.3) return null;
      if (c.t0 === SLOW.hit) dt *= 0.35; // slow-motion chips
      const x = c.x + c.vx * dt, y = c.y + c.vy * dt + 0.5 * 2300 * dt * dt;
      return <rect key={i} x={-c.w / 2} y={-c.h / 2} width={c.w} height={c.h} rx={2} fill={c.col} stroke={INK} strokeWidth={4}
        transform={`translate(${x} ${y}) rotate(${c.rot + c.spin * dt})`} />;
    })}
  </g>
);
const ImpactLines: React.FC<{t: number}> = ({t}) => {
  const h = [...WOOD_HITS].reverse().find((w) => w.t <= t && t - w.t < (w.kind === 'drum' ? 0.05 : 0.09));
  if (!h) return null; const y = h.kind === 'hammer' ? 1150 : 881; const L = h.kind === 'drum' ? 22 : 34;
  return (
    <g stroke={INK} strokeWidth={6} strokeLinecap="round">
      {[-40, 0, 40].map((a) => { const r = (a * Math.PI) / 180; return <line key={a} x1={TRUNK.x1 + 22 * Math.cos(r)} y1={y - 22 * Math.sin(r) - (y === 881 ? 46 : 54)}
        x2={TRUNK.x1 + (22 + L) * Math.cos(r)} y2={y - (22 + L) * Math.sin(r) - (y === 881 ? 46 : 54)} />; })}
    </g>
  );
};

// ---------- the tree's face ----------
type Face = 'open' | 'squeeze' | 'dizzy' | 'smug' | 'wide';
const treeFace = (t: number): Face => {
  if (t >= T.concussion - 0.05 && t < 6.7) return 'dizzy';
  if (t >= T.waste && t < PILLOW_OFF + 0.1) return 'smug';
  if (WOOD_HITS.some((h) => t >= h.t && t < h.t + (h.kind === 'drum' ? 0.1 : h.t === SLOW.hit ? 0.5 : 0.2))) return 'squeeze';
  if (t >= T.hammer + 0.1 && t < 16.2) return 'wide';
  return 'open';
};
const TreeFace: React.FC<{t: number}> = ({t}) => {
  const f = treeFace(t); const E = [{x: 345, y: 1080}, {x: 440, y: 1080}]; const M = {x: 392, y: 1195};
  const look = {x: 9, y: -9};
  const blink = (t % 3.7) > 3.6 && f === 'open';
  return (
    <g>
      {E.map((e, i) => {
        const s = i === 0 ? -1 : 1;
        if (f === 'squeeze') return <g key={i}>
          <path d={`M ${e.x - 22 * s} ${e.y - 20} L ${e.x + 12 * s} ${e.y} L ${e.x - 22 * s} ${e.y + 20}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </g>;
        if (f === 'dizzy') { const a = t * 600 * s; let d = ''; for (let k = 0; k <= 40; k++) { const th = (k / 40) * 4 * Math.PI; const rr = 3 + k * 0.62; d += `${k ? 'L' : 'M'} ${e.x + rr * Math.cos(th)} ${e.y + rr * Math.sin(th)} `; }
          return <g key={i}><ellipse cx={e.x} cy={e.y} rx={30} ry={38} fill="#fff" stroke={INK} strokeWidth={SW} />
            <path d={d} fill="none" stroke={INK} strokeWidth={5} transform={`rotate(${a} ${e.x} ${e.y})`} /></g>; }
        const ry = f === 'wide' ? 44 : 38;
        return <g key={i}>
          <clipPath id={`te${i}`}><ellipse cx={e.x} cy={e.y} rx={30} ry={ry} /></clipPath>
          <ellipse cx={e.x} cy={e.y} rx={30} ry={blink ? 4 : ry} fill="#fff" stroke={INK} strokeWidth={SW} />
          {!blink && <g clipPath={`url(#te${i})`}>
            <circle cx={e.x + look.x} cy={e.y + look.y} r={f === 'wide' ? 9 : 13} fill={INK} />
            <circle cx={e.x + look.x + 4} cy={e.y + look.y - 5} r={4} fill="#fff" />
            {f === 'smug' && <><rect x={e.x - 40} y={e.y - 60} width={80} height={56} fill="#8E5C33" />
              <line x1={e.x - 40} y1={e.y - 4} x2={e.x + 40} y2={e.y - 4} stroke={INK} strokeWidth={SW} /></>}
          </g>}
          {!blink && <ellipse cx={e.x} cy={e.y} rx={30} ry={ry} fill="none" stroke={INK} strokeWidth={SW} />}
        </g>;
      })}
      {/* brows */}
      {f === 'squeeze' && <path d={`M 312 1028 L 365 1042 M 473 1028 L 420 1042`} stroke={INK} strokeWidth={10} strokeLinecap="round" />}
      {f === 'smug' && <path d={`M 318 1024 Q 345 1014 372 1024 M 413 1024 Q 440 1014 467 1024`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />}
      {f === 'wide' && <path d={`M 318 1012 Q 345 996 372 1012 M 413 1012 Q 440 996 467 1012`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />}
      {/* mouth */}
      {f === 'open' && <path d={`M ${M.x - 30} ${M.y} Q ${M.x} ${M.y + 8} ${M.x + 30} ${M.y}`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />}
      {f === 'squeeze' && <path d={`M ${M.x - 36} ${M.y} l 12 -10 l 12 10 l 12 -10 l 12 10 l 12 -10`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />}
      {f === 'dizzy' && <path d={`M ${M.x - 36} ${M.y} q 9 -12 18 0 q 9 12 18 0 q 9 -12 18 0 q 9 12 18 0`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />}
      {f === 'smug' && <path d={`M ${M.x - 34} ${M.y - 6} Q ${M.x} ${M.y + 26} ${M.x + 34} ${M.y - 12}`} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />}
      {f === 'wide' && <ellipse cx={M.x} cy={M.y} rx={16} ry={20} fill="#5A2A1A" stroke={INK} strokeWidth={SW} />}
    </g>
  );
};

// ---------- small code-drawn effects ----------
const SweatDrop: React.FC<{t: number; t0: number; t1: number; x: number; y: number; slide?: number; flip?: boolean}> = ({t, t0, t1, x, y, slide = 50, flip}) => {
  if (t < t0 || t > t1) return null; const u = prog(t, t0, t1);
  const s = u < 0.15 ? overshoot(u / 0.15) : u > 0.85 ? 1 - prog(u, 0.85, 1) : 1;
  return (
    <g transform={`translate(${x} ${y + slide * eIO(u)}) scale(${(flip ? -1 : 1) * s} ${s})`}>
      <path d="M 0 -30 Q 22 0 16 14 A 17 17 0 0 1 -16 14 Q -22 0 0 -30 Z" fill="#9FD8FF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -6 2 Q -8 10 -2 14" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};
const Star: React.FC<{x: number; y: number; r: number; rot: number}> = ({x, y, r, rot}) => {
  let d = ''; for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2; const rr = k % 2 ? r * 0.45 : r; d += `${k ? 'L' : 'M'} ${x + rr * Math.cos(a)} ${y + rr * Math.sin(a)} `; }
  return <path d={d + 'Z'} fill="#FFD84A" stroke={INK} strokeWidth={5} strokeLinejoin="round" transform={`rotate(${rot} ${x} ${y})`} />;
};
const Puff: React.FC<{t: number; t0: number; x: number; y: number}> = ({t, t0, x, y}) => {
  const dt = t - t0; if (dt < 0 || dt > 0.45) return null; const u = dt / 0.45;
  const pts = [[-10, -30], [20, -10], [-22, 18], [14, 26], [-40, 0]];
  const r = 18 * Math.sin(Math.PI * Math.min(1, u * 1.2));
  return (<g>
    {pts.map(([px, py], i) => <circle key={`o${i}`} cx={x + px * (1 + u)} cy={y + py * (1 + u)} r={Math.max(0, r + 3.5)} fill={INK} />)}
    {pts.map(([px, py], i) => <circle key={`f${i}`} cx={x + px * (1 + u)} cy={y + py * (1 + u)} r={Math.max(0, r - 3.5)} fill="#fff" />)}
  </g>);
};

// ---------- sound cues ----------
type Cue = {f: string; at: number; db: number};
const CUES: Cue[] = [{f: 'wind', at: 0, db: -36}];
PECKS.forEach((p) => {
  if (p.kind === 'spring') CUES.push({f: 'boing', at: p.c, db: -19});
  else if (p.kind === 'pillow') CUES.push({f: 'thump', at: p.c, db: -15});
  else if (p.kind === 'drum') CUES.push({f: 'knock_hi', at: p.c, db: -19});
  else if (p.kind === 'big') CUES.push({f: 'knock_big', at: p.c, db: -13});
  else if (p.kind === 'hammer') CUES.push({f: 'knock_big', at: p.c, db: -15});
  else CUES.push({f: 'knock', at: p.c, db: -17});
});
CUES.push(
  {f: 'whoosh', at: TURN1 - 0.2, db: -29}, {f: 'whoosh', at: TURN2 - 0.2, db: -29}, {f: 'slide', at: T.concussion - 0.05, db: -27},
  {f: 'pop', at: SPRING_ON, db: -17}, {f: 'click', at: T.but + 0.1, db: -20}, {f: 'projector', at: T.slow + 0.1, db: -30},
  {f: 'sproing', at: SPRING_OFF, db: -18}, {f: 'knock_big', at: SLOW.hit, db: -14},
  {f: 'whoosh', at: 13.35, db: -28}, {f: 'pop', at: T.hammer + 0.1, db: -17}, {f: 'whoosh', at: 16.75, db: -27},
  {f: 'pop', at: PILLOW_ON, db: -17}, {f: 'whoosh', at: PILLOW_OFF - 0.1, db: -26}, {f: 'whoosh', at: T.what + 0.05, db: -31},
  {f: 'sparkle', at: T.size + 0.1, db: -21}, {f: 'twinkle', at: T.small + 0.1, db: -25}, {f: 'pop', at: 23.0, db: -20},
  {f: 'bonk', at: T.concuss + 0.2, db: -14}, {f: 'twinkle', at: T.concuss + 0.3, db: -26}, {f: 'whoosh', at: 25.15, db: -31},
);

// ---------- composition ----------
export const Woodpecker: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const cam0 = camAt(t);
  // screen shake: sums of sines x decaying envelope from impacts
  let amp = 0;
  for (const h of WOOD_HITS) { const dt = t - h.t; if (dt >= 0 && dt < 0.4) amp += (h.kind === 'big' ? 7 : h.kind === 'hammer' ? 6 : h.kind === 'drum' ? 2.2 : 3) * Math.exp(-dt * 14); }
  const bonkT = T.concuss + 0.2; if (t >= bonkT && t < bonkT + 0.5) amp += 9 * Math.exp(-(t - bonkT) * 9);
  const shx = amp * (Math.sin(2 * Math.PI * 13.3 * t) * 0.6 + Math.sin(2 * Math.PI * 7.1 * t + 1) * 0.4);
  const shy = amp * (Math.sin(2 * Math.PI * 11.7 * t + 2) * 0.6 + Math.sin(2 * Math.PI * 5.3 * t) * 0.4);
  const cam = cam0;
  const dof = clamp((cam.z - 260) / 220) * 3.2;
  const b = birdState(t); const sc = birdScale(t);

  // spring geometry
  const springLen = Math.max(46, Math.min(SPRING_L, b.tipX - TRUNK.x1));
  const springPop = overshoot(prog(t, SPRING_ON, SPRING_ON + 0.35));
  // flying spring after it pops off (slow-motion physics)
  const fs = t - SPRING_OFF;
  // pillow
  const pillowSx = Math.max(0.45, Math.min(1, (b.tipX - TRUNK.x1) / PILLOW_L));
  const pillowPop = overshoot(prog(t, PILLOW_ON, PILLOW_ON + 0.35));
  const fp = t - PILLOW_OFF;
  // hammer
  const hamIn = T.hammer + 0.1, hamOut = 16.75;
  const hamReach = Math.max(0, ...PECKS.filter((p) => p.kind === 'hammer').map((p) => { const u = (t - (p.c - p.d * 0.5)) / p.d; return u < 0 || u > 1 ? 0 : u < 0.3 ? -0.25 * eOut(u / 0.3) : u < 0.5 ? lerp(-0.25, 1, eIn((u - 0.3) / 0.2)) : u < 0.62 ? 1 : 1 - eOut((u - 0.62) / 0.38); }));
  const hamX = lerp(610, TRUNK.x1 + 2, hamReach), hamY = 1150;
  // magnifier + brain
  const magIn = T.size + 0.1, magOut = 23.0;
  const headC = {x: b.rootX + 118, y: b.rootY - 10};
  // human
  const walkIn = 23.0, stop = 23.95, lunge = T.concuss + 0.05, hit = T.concuss + 0.2, exit = 25.15;
  let hx = 1500, hy = 1762, hrot = 0, hpose: 'walk' | 'bonk' = 'walk';
  if (t < stop) { hx = lerp(1500, 820, eOut(prog(t, walkIn, stop))); hy -= 14 * Math.abs(Math.sin(Math.PI * 4 * prog(t, walkIn, stop))); }
  else if (t < lunge) { hx = 820; }
  else if (t < hit) { hx = lerp(820, TRUNK.x1 + 98 + 6, eIn(prog(t, lunge, hit))); hrot = -8 * prog(t, lunge, hit); }
  else if (t < exit) { hpose = 'bonk'; hx = lerp(TRUNK.x1 + 104, 780, eOut(prog(t, hit, hit + 0.35))); hrot = 6 * damp(t - hit, 3, 3); }
  else { hpose = 'bonk'; const u = prog(t, exit, 25.95); hx = lerp(780, 1600, eIn(u)); hrot = 8 * Math.sin(2 * Math.PI * 3 * (t - exit)); hy -= 12 * Math.abs(Math.sin(Math.PI * 6 * u)); }
  const showHuman = t >= walkIn && t < 26.0;
  // movie camera prop (slow-motion beat)
  const mcIn = T.but + 0.05, mcOut = 13.45;
  const mcY = 1075 + 420 * (1 - eOut(prog(t, mcIn, mcIn + 0.4))) + 600 * eIn(prog(t, mcOut, mcOut + 0.45));
  const filmOn = clamp(eOut(prog(t, T.slow + 0.1, T.slow + 0.35)) - eIO(prog(t, 13.5, 13.8)));

  const BirdSprite = () => {
    const pose = b.pose;
    return (
      <g transform={`translate(${b.rootX} ${b.rootY + 10}) scale(${sc.sx} ${sc.sy}) translate(0 -10)`}>
        <g transform={`translate(-40 210) ${t >= TURN1 && t < TURN2 ? `rotate(${-4 + 3 * damp(t - T.concussion, 2, 4)} 60 120)` : ''} translate(40 -210)`}>
          {pose === 'front' ? <BirdFront /> : <BirdSide pose={pose} />}
        </g>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{background: 'linear-gradient(#8ECDF8 0%, #CBEBFF 60%, #E6F6FF 100%)', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${shx}px, ${shy}px)`}}>
        <Layer cam={cam} z={4200} blur={dof * 1.1}>
          <circle cx={1500} cy={-300} r={150} fill="#FFE27A" stroke={INK} strokeWidth={10} />
          <g transform={`translate(${-900 + t * 12} 120) scale(1.4)`}><Cloud /></g>
          <g transform={`translate(${900 + t * 9} -420) scale(1.1)`}><Cloud /></g>
          <g transform={`translate(${2100 + t * 10} 420) scale(1.2)`}><Cloud /></g>
        </Layer>
        <Layer cam={cam} z={3000} blur={dof}><Hills /></Layer>
        <Layer cam={cam} z={1800} blur={dof * 0.8}><Bushes /></Layer>
        <Layer cam={cam} z={1000}>
          <Ground />
          <Tree />
          <ellipse cx={TRUNK.x1 - 2} cy={884} rx={9} ry={15} fill="#4A2A15" stroke={INK} strokeWidth={5} />
          <TreeFace t={t} />
          <SweatDrop t={t} t0={T.concussion + 0.15} t1={6.6} x={300} y={1010} slide={70} flip />
          {/* contact shadow under the human */}
          {showHuman && <ellipse cx={hx} cy={1764} rx={80} ry={12} fill="rgba(72,54,42,0.26)" style={{filter: 'blur(3px)'}} />}
          {showHuman && <g transform={`translate(${hx} ${hy}) rotate(${hrot})`}><Human pose={hpose} /></g>}
          {showHuman && t >= hit && (() => {
            const hc = {x: hx + HUMAN_HEAD.x, y: hy + HUMAN_HEAD.y - 95}; const s = overshoot(prog(t, hit, hit + 0.3));
            return <g>{[0, 1, 2, 3].map((k) => { const a = t * 5 + (k * Math.PI) / 2; return <Star key={k} x={hc.x + 100 * Math.cos(a)} y={hc.y + 26 * Math.sin(a)} r={22 * s} rot={t * 200} />; })}</g>;
          })()}
          {showHuman && <SweatDrop t={t} t0={hit + 0.15} t1={25.9} x={hx + 92} y={hy - 520} slide={40} />}
          <Chips t={t} />
          <ImpactLines t={t} />
          {/* flying spring after "no cushioning" */}
          {t >= SPRING_OFF && fs < 2 && <g transform={`translate(${b.tipX - 20 + 330 * fs} ${b.tipY - 380 * fs + 0.5 * 500 * fs * fs}) rotate(${-160 * fs})`}><Spring len={SPRING_L} /></g>}
          {/* flying pillow */}
          {t >= PILLOW_OFF && fp < 1.2 && <g transform={`translate(${b.tipX + 40 + 700 * fp} ${b.tipY - 900 * fp + 0.5 * 2400 * fp * fp}) rotate(${420 * fp})`}><Pillow sx={1} /></g>}
          <BirdSprite />
          {b.springOn && <g transform={`translate(${b.tipX} ${b.tipY}) scale(${springPop})`}><Spring len={springLen} /></g>}
          {b.pillowOn && <g transform={`translate(${b.tipX} ${b.tipY}) scale(${pillowPop})`}><Pillow sx={pillowSx} /></g>}
          {PECKS.filter((p) => p.kind === 'pillow').map((p, i) => <Puff key={i} t={t} t0={p.c} x={TRUNK.x1 + 20} y={b.tipY} />)}
          {/* hammer with a face */}
          {t >= hamIn && t < hamOut + 1 && (() => {
            const s = overshoot(prog(t, hamIn, hamIn + 0.35)); const fo = t - hamOut;
            const x = fo > 0 ? hamX + 500 * fo : hamX, y = fo > 0 ? hamY - 500 * fo + 0.5 * 3000 * fo * fo : hamY;
            return <g transform={`translate(${x} ${y}) rotate(${fo > 0 ? 300 * fo : 0}) scale(${s})`}><Hammer squeeze={hamReach > 0.95} /></g>;
          })()}
          {/* magnifier showing the tiny brain */}
          {t >= magIn && t < magOut + 0.25 && (() => {
            const s = t < magOut ? overshoot(prog(t, magIn, magIn + 0.4)) : 1 - eIn(prog(t, magOut, magOut + 0.2));
            const bb = 1 + 0.25 * damp(t - (T.small + 0.1), 3, 4);
            return <g transform={`translate(${headC.x} ${headC.y}) scale(${s})`}>
              <Magnifier>
                <circle cx={0} cy={0} r={76} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="14 12" />
                <path d="M -76 -6 Q -100 4 -128 12 L -76 30" fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="14 12" />
                <g transform={`translate(-6 -18) scale(${0.62 * bb})`}><Brain wink={t > T.small + 0.1 && t < T.small + 0.6} /></g>
              </Magnifier>
            </g>;
          })()}
        </Layer>
        {/* the slow-motion movie camera, close to the lens */}
        {t >= mcIn && t < mcOut + 0.5 && (
          <Layer cam={cam} z={800} blur={0}>
            <g transform={`translate(705 ${mcY}) scale(0.42) rotate(-12)`}><MovieCamera spin={t * 240} rec={Math.floor(t * 3) % 2 === 0} /></g>
          </Layer>
        )}
      </AbsoluteFill>
      {/* film-strip frame during the slow-motion beat (screen space) */}
      {filmOn > 0 && (
        <AbsoluteFill>
          <svg width={1080} height={1920}>
            {[0, 1].map((side) => {
              const w = 78, x = side ? 1080 - w * filmOn : -w + w * filmOn;
              return <g key={side}>
                <rect x={x} y={0} width={w} height={1920} fill="#1E1E1E" />
                {Array.from({length: 22}).map((_, k) => <rect key={k} x={x + 22} y={((k * 96 + t * 260) % 2112) - 96} width={34} height={52} rx={9} fill="#F4F1E8" />)}
              </g>;
            })}
          </svg>
        </AbsoluteFill>
      )}
      <Sequence from={Math.round(VO * FPS)} layout="none"><Audio src={staticFile('woodpecker/vo/take1.wav')} volume={1} /></Sequence>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`woodpecker/sfx/${c.f}.wav`)} volume={10 ** (c.db / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
