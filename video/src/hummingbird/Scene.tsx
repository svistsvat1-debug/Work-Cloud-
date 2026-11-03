import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {
  clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, inv, keys, lerp, popIn, popOut, rand, seg, shake, wobble,
} from './anim';
import {
  Battery, Bird, BRANCH, Branch, branchY, Dial, Face, FEET, Flower, Fridge, Heart, INK, Leaf, Medal, Moon, Mountains,
  NightBar, Pose, Puffs, Sparkle, SweatDrop, Tag, Thermometer, TopTwig,
} from './art';
import {DURATION_S, FPS, T, VO_AT} from './timing';

// ------------------------------------------------------------------ world layout
const H = {x: 520, y: 960}; // hover home (frame 0 and the last frame)
const FLOWER = {x: 940, y: 642};
const FEED = {x: 605, y: 762}; // bird centre while the beak is in the flower
const PERCH_X = 480;
const PERCH_FEET = branchY(PERCH_X) - BRANCH.thick / 2 + 2;
const PUFF_C = {x: PERCH_X, y: PERCH_FEET - FEET.puff};
const PERCH_C = {x: PERCH_X, y: PERCH_FEET - FEET.perch};
const BATT = {x: 520, y: 590};
const BAR = {x: 520, y: 742};
const DIAL = {x: 918, y: 862};
const HEART = {x: 815, y: 930};
const HTAG = {x: 815, y: 1150};
const THERMO = {x: 170, y: 1010};
const TTAG = {x: 170, y: 640};
const FRIDGE_X = 885;
const FRIDGE_FEET = branchY(FRIDGE_X) - BRANCH.thick / 2 + 4;

const BOB_F = Math.round(1.6 * DURATION_S) / DURATION_S; // whole number of bobs -> seamless loop

// ------------------------------------------------------------------ camera (x, y, k = scale of the Z 1000 layer)
type Cam = {x: number; y: number; z: number; k: number};
const C0 = [600, 905, 1.22];
const CAM_KEYS = [
  {t: 0, v: C0},
  {t: 1.8, v: [598, 902, 1.19]},
  {t: T.without - 0.05, v: [600, 900, 1.18]},
  {t: T.food + 0.1, v: [665, 865, 1.18]},
  {t: T.l2 - 0.2, v: [665, 865, 1.18]},
  {t: T.burns + 0.15, v: [566, 835, 1.12]},
  {t: T.use, v: [566, 832, 1.14]},
  {t: T.fat + 0.25, v: [566, 826, 1.19]},
  {t: T.l3 - 0.05, v: [566, 826, 1.19]},
  {t: T.l3 + 0.5, v: [650, 880, 1.12]},
  {t: T.l4 + 0.1, v: [650, 880, 1.12]},
  {t: T.lets + 0.1, v: [505, 1045, 1.32]},
  {t: T.l5 - 0.1, v: [505, 1040, 1.28]},
  {t: T.drops, v: [640, 1020, 1.12]},
  {t: T.l6 - 0.05, v: [640, 1020, 1.12]},
  {t: T.l6 + 0.6, v: [420, 990, 1.06]},
  {t: T.l7 - 0.08, v: [420, 990, 1.06]},
  {t: T.fridge + 0.15, v: [556, 985, 0.94]},
  {t: T.l8, v: [556, 985, 0.94]},
  {t: T.colder + 0.2, v: [552, 1000, 0.98]},
  {t: T.voEnd + 0.1, v: [552, 1000, 0.98]},
  {t: DURATION_S - 0.3, v: C0},
];
const camAt = (t: number): Cam => {
  // interpolate scale in log space so zooms feel even
  const lk = keys(t, CAM_KEYS.map((c) => ({t: c.t, v: [c.v[0], c.v[1], Math.log(c.v[2])]})));
  const k = Math.exp(lk[2]);
  return {x: lk[0], y: lk[1], k, z: 1000 - 1000 / k};
};

// ------------------------------------------------------------------ layers
const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - cam.z;
  if (d < 250) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', overflow: 'visible'}}>
        <g transform={`translate(540 960) scale(${k}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
};
/** draw far content in "screen coordinates at the home camera" */
const z0 = 1000 - 1000 / C0[2];
const HomeSpace: React.FC<{z: number; children: React.ReactNode}> = ({z, children}) => {
  const k0 = 1000 / (z - z0);
  return <g transform={`translate(${C0[0] - 540 / k0} ${C0[1] - 960 / k0}) scale(${1 / k0})`}>{children}</g>;
};

// ------------------------------------------------------------------ helpers
const blinkAt = (t: number, times: number[]) => {
  let b = 0;
  for (const s of times) b = Math.max(b, 1 - Math.abs(t - s) / 0.07);
  return clamp(b);
};
const faceAt = (t: number, list: [number, Face][]): Face => {
  let f = list[0][1];
  for (const [s, face] of list) if (t >= s) f = face;
  return f;
};

// heart beat phase (cartoon rate, slows from fast to slow), integrated per frame
const heartRate = (t: number) => lerp(3.6, 0.72, easeInOutCubic(inv(t, T.to5, T.forty + 0.2)));
const HEART_F0 = Math.round(T.heartbeat * FPS);
const HEART_F1 = Math.round((T.l5end + 0.55) * FPS);
const PHI: number[] = [];
const BEATS: number[] = [];
{
  let phi = 0;
  for (let f = 0; f <= HEART_F1 + 1; f++) {
    if (f >= HEART_F0) {
      const prev = phi;
      phi += heartRate(f / FPS) / FPS;
      if (Math.floor(phi) > Math.floor(prev) || f === HEART_F0) BEATS.push(f / FPS);
    }
    PHI[f] = phi;
  }
}

// snow: deterministic flakes, born by a rate curve; they pop in, fall, sway, then shrink away
type Flake = {b: number; x: number; y: number; v: number; s: number; life: number; ph: number};
const FLAKES: Flake[] = [];
{
  let acc = 0, i = 0;
  for (let t = 0; t < DURATION_S; t += 1 / FPS) {
    const rate = t < T.cold1 ? 0 : t < T.go ? 7 : t < T.l8 + 0.2 ? 15 : 0;
    acc += rate / FPS;
    while (acc >= 1) {
      acc -= 1; i++;
      FLAKES.push({b: t, x: -150 + rand(i) * 1400, y: -60 + rand(i + 0.5) * 1500, v: 90 + rand(i + 0.3) * 90, s: 0.6 + rand(i + 0.7) * 0.7, life: 1.8 + rand(i + 0.9) * 0.8, ph: rand(i + 0.2) * 6.28});
    }
  }
}
const Snow: React.FC<{t: number; near: boolean}> = ({t, near}) => (
  <g>
    {FLAKES.map((f, i) => {
      if ((i % 3 === 0) !== near) return null;
      const a = t - f.b;
      if (a < 0 || a > f.life) return null;
      const s = Math.min(easeOutBack(clamp(a / 0.2), 2), 1 - easeInCubic(inv(a, f.life - 0.35, f.life))) * f.s * (near ? 1.5 : 1);
      const x = f.x + 22 * Math.sin(f.ph + a * 2.2);
      const y = f.y + f.v * a;
      return <circle key={i} cx={x} cy={y} r={9 * s} fill="#fff" stroke={INK} strokeWidth={3.2 * s} />;
    })}
  </g>
);

// cold mist pouring out of the fridge
const MIST = Array.from({length: 18}).map((_, i) => ({
  b: T.fridge + 0.08 + i * 0.075 + rand(i + 40) * 0.05,
  x0: FRIDGE_X - 120 + rand(i + 41) * 90, y0: FRIDGE_FEET - 330 + rand(i + 42) * 220,
  vx: -120 - rand(i + 43) * 140, vy: 30 + rand(i + 44) * 70, r: 18 + rand(i + 45) * 18, life: 1.1 + rand(i + 46) * 0.5,
}));

const Stars: React.FC<{t: number}> = ({t}) => (
  <svg width={1080} height={1920} style={{position: 'absolute'}}>
    {Array.from({length: 46}).map((_, i) => {
      const x = rand(i + 100) * 1080, y = rand(i + 200) * 1150;
      const tw = 0.75 + 0.25 * Math.sin(t * (1.5 + rand(i + 300) * 2) + i);
      const r = (2 + rand(i + 400) * 3.2) * tw;
      return i % 6 === 0 ? (
        <path key={i} transform={`translate(${x} ${y}) scale(${tw * 0.55})`} d="M 0 -18 Q 3 -3 18 0 Q 3 3 0 18 Q -3 3 -18 0 Q -3 -3 0 -18 Z" fill="#FFF6C9" />
      ) : (
        <circle key={i} cx={x} cy={y} r={r} fill="#E8ECFF" opacity={0.85} />
      );
    })}
  </svg>
);

const Treeline: React.FC = () => {
  const trees = Array.from({length: 26}).map((_, i) => ({x: -420 + i * 78 + rand(i + 500) * 40, h: 150 + rand(i + 600) * 120, y: 1660 + rand(i + 700) * 50}));
  return (
    <g>
      <rect x={-600} y={1700} width={2400} height={1600} fill="#262B58" stroke={INK} strokeWidth={8} />
      {trees.map((tr, i) => {
        const w = tr.h * 0.42;
        const tiers = [0, 0.32, 0.6].map((k) => {
          const top = tr.y - tr.h + k * tr.h * 0.9, bot = top + tr.h * 0.5, ww = w * (0.6 + k * 0.6);
          return `M ${tr.x} ${top} L ${tr.x + ww} ${bot} L ${tr.x - ww} ${bot} Z`;
        });
        return <path key={i} d={tiers.join(' ')} fill={i % 2 ? '#2B3163' : '#30376E'} stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
      })}
      <rect x={-600} y={1735} width={2400} height={1600} fill="#262B58" />
    </g>
  );
};

const WindLines: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const u = inv(t, t0, t0 + 0.9);
  if (u <= 0 || u >= 1) return null;
  return (
    <g>
      {[[0, 640, 1], [1, 860, 0.8], [2, 1080, 0.9]].map(([i, y, s]) => {
        const head = clamp(u * 1.9 - i * 0.15), tail = clamp(u * 1.9 - i * 0.15 - 0.45);
        const L = 900;
        return (
          <path key={i} d={`M ${-100} ${y} q 220 -50 420 0 t 420 0 q 60 10 70 -40 q 0 -40 -40 -36`}
            fill="none" stroke="#fff" strokeWidth={10 * s} strokeLinecap="round"
            strokeDasharray={`${(head - tail) * L} ${L * 3}`} strokeDashoffset={-tail * L} opacity={0.9} />
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ sound
type Cue = {f: string; at: number; db: number; keys?: [number, number][]};
const dbAt = (c: Cue, t: number) => {
  if (!c.keys) return c.db;
  const k = c.keys;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], inv(t, k[i][0], k[i + 1][0]));
  return k[k.length - 1][1];
};
const LAND = T.still;
const PUFF_SWAP = T.lets - 0.02;
const FRIDGE_LAND = T.l7 + 0.26;
const THAW = T.voEnd + 0.12;
const CUES: Cue[] = [
  {f: 'night_bed', at: 0, db: -31},
  {f: 'wing_hum', at: 0, db: -60, keys: [[0, -27], [LAND - 0.05, -27], [LAND + 0.08, -70], [THAW + 0.4, -70], [THAW + 0.55, -27], [DURATION_S, -27]]},
  {f: 'wind', at: T.cold1 - 0.15, db: -22},
  {f: 'whoosh', at: T.without - 0.08, db: -27},
  {f: 'pop', at: T.food, db: -21},
  {f: 'fwip', at: T.food + 0.12, db: -21},
  {f: 'whoosh', at: T.l1end + 0.02, db: -32},
  {f: 'pop', at: T.burns, db: -19},
  {f: 'drain', at: T.burns + 0.12, db: -27},
  {f: 'pop', at: T.staying, db: -23},
  {f: 'drip', at: T.use + 0.12, db: -22},
  {f: 'bonk', at: T.fat + 0.02, db: -19},
  {f: 'pop', at: T.l3 + 0.06, db: -22},
  {f: 'pip', at: T.l3 + 0.26, db: -27},
  {f: 'whoosh', at: T.opposite - 0.16, db: -31},
  {f: 'click', at: T.opposite + 0.02, db: -15},
  {f: 'pip', at: T.l4 + 0.25, db: -28},
  {f: 'whoosh', at: T.goes - 0.05, db: -30},
  {f: 'tap', at: LAND, db: -19},
  {f: 'poof', at: PUFF_SWAP, db: -19},
  {f: 'freeze', at: T.go - 0.05, db: -21},
  {f: 'wind', at: T.go, db: -30},
  {f: 'pop', at: T.heartbeat, db: -22},
  ...BEATS.map((b, i): Cue => ({f: 'thump', at: b, db: lerp(-17, -13, clamp((b - T.to5) / 1)), })),
  {f: 'pop', at: T.twelve - 0.06, db: -22},
  {f: 'ratchet', at: T.to5, db: -29},
  {f: 'pop', at: T.forty, db: -21},
  {f: 'pop', at: T.l6 + 0.02, db: -22},
  {f: 'slide', at: T.cooled, db: -24},
  {f: 'crack', at: T.celsius, db: -17},
  {f: 'chatter', at: T.three2end + 0.1, db: -31},
  {f: 'fall', at: T.l7 - 0.04, db: -29},
  {f: 'thud', at: FRIDGE_LAND, db: -11},
  {f: 'door', at: T.fridge, db: -19},
  {f: 'mist', at: T.fridge + 0.06, db: -27},
  {f: 'fall', at: T.bird - 0.34, db: -33},
  {f: 'ding', at: T.bird, db: -16},
  {f: 'sparkle', at: T.colder - 0.05, db: -22},
  {f: 'crack', at: THAW + 0.02, db: -23},
  {f: 'poof', at: THAW + 0.36, db: -22},
  {f: 'whoosh', at: THAW + 0.38, db: -29},
];

// ------------------------------------------------------------------ the scene
export const HummingbirdShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // font for the number tags
  const [handle] = useState(() => delayRender('font'));
  useEffect(() => {
    const f = new FontFace('InterBlack', `url(${staticFile('hummingbird/fonts/InterDisplay-Black.otf')})`);
    f.load().then((ff) => { (document.fonts as any).add(ff); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);

  // ---------- camera + shake
  const cam = camAt(t);
  const sh = shake(t, Math.abs(wobble(t, FRIDGE_LAND, 11, 0.01, 4.5)) + Math.abs(wobble(t, T.bird, 3, 0.01, 7)) + Math.abs(wobble(t, T.opposite + 0.02, 2.5, 0.01, 9)));
  const camS = {...cam, x: cam.x + sh.x / cam.k, y: cam.y + sh.y / cam.k};
  const dof = 3.2 * clamp((cam.k - 1.17) / 0.12);

  // ---------- bird state
  let pose: Pose = 'hover';
  if (t >= LAND && t < PUFF_SWAP) pose = 'perch';
  else if (t >= PUFF_SWAP && t < THAW + 0.3) pose = 'puff';
  const bob = 8 * Math.sin(2 * Math.PI * BOB_F * t);
  const hoverPath = keys(t, [
    {t: 0, v: [H.x, H.y]},
    {t: T.without - 0.06, v: [H.x, H.y]},
    {t: T.food - 0.02, v: [FEED.x, FEED.y]},
    {t: T.food + 0.14, v: [FEED.x, FEED.y]},
    {t: T.food + 0.4, v: [FEED.x - 50, FEED.y + 14], ease: easeOutCubic},
    {t: T.l1end + 0.05, v: [FEED.x - 50, FEED.y + 14]},
    {t: T.burns - 0.02, v: [H.x, H.y]},
    {t: T.opposite - 0.14, v: [H.x, H.y]},
    {t: T.opposite, v: [H.x + 46, H.y - 6], ease: easeInCubic},
    {t: T.opposite + 0.3, v: [H.x, H.y], ease: easeOutCubic},
    {t: T.goes - 0.04, v: [H.x, H.y]},
    {t: LAND, v: [PERCH_C.x, PERCH_C.y], ease: easeInOutCubic},
  ]);
  const thawU = easeInOutCubic(inv(t, THAW + 0.3, DURATION_S - 0.35));
  let cx = hoverPath[0], cy = hoverPath[1] + bob * (1 - inv(t, T.goes - 0.2, T.goes));
  if (t >= THAW + 0.3) { cx = lerp(PUFF_C.x, H.x, thawU); cy = lerp(PUFF_C.y - 20, H.y, thawU) + bob * thawU; }

  // squash / stretch around swaps
  let sx = 1, sy = 1;
  const breathe = 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  if (pose === 'hover') {
    sy = 1 + breathe + wobble(t, THAW + 0.3, 0.1, 4, 7);
    sx = 1 - wobble(t, THAW + 0.3, 0.07, 4, 7);
  } else if (pose === 'perch') {
    const land = wobble(t, LAND, -0.12, 4.5, 8);
    const antic = seg(t, PUFF_SWAP - 0.16, PUFF_SWAP, easeInCubic);
    sy = 1 + land - 0.09 * antic; sx = 1 - land * 0.7 + 0.07 * antic;
  } else {
    const fluff = wobble(t, PUFF_SWAP, 0.12, 3.5, 6);
    const antic = seg(t, THAW + 0.14, THAW + 0.3, easeInCubic);
    const torpidBreathe = 0.006 * Math.sin(2 * Math.PI * 0.3 * t);
    sy = 1 + fluff + torpidBreathe - 0.1 * antic; sx = 1 + fluff * 0.6 + 0.08 * antic;
  }
  // landing dip on the medal
  const medalDip = wobble(t, T.bird, -0.05, 4, 8);
  if (pose === 'puff') sy += medalDip;

  const cold = t < T.lets ? 0 : t < THAW ? Math.min(lerp(0, 0.55, seg(t, T.lets + 0.3, T.cold2 + 0.3)) + 0.2 * seg(t, T.l5, T.l6) + 0.25 * seg(t, T.cooled, T.three2end), 1) : 1 - seg(t, THAW, THAW + 0.45);
  const shiver = pose === 'puff' ? clamp((cold - 0.8) / 0.2) * (t < THAW ? 1 : 0) : t > T.cold1 && t < T.cold1 + 0.6 ? 1 - inv(t, T.cold1, T.cold1 + 0.6) : 0;
  cx += 2.2 * shiver * Math.sin(2 * Math.PI * 17 * t);

  const birdFace = faceAt(t, [
    [0, 'neutral'], [T.cold1, 'worried'], [T.cold1 + 0.5, 'neutral'], [T.without - 0.05, 'happy'], [T.food + 0.14, 'surprised'],
    [T.l2, 'neutral'], [T.use - 0.05, 'worried'], [T.l3, 'smug'], [T.opposite + 0.05, 'happy'], [T.l4, 'neutral'],
    [T.lets - 0.02, 'sleep'], [THAW + 0.08, 'surprised'], [THAW + 0.75, 'neutral'],
  ]);
  const birdLook: [number, number] = t > T.burns && t < T.l3 ? [2, -5] : t >= T.l3 && t < T.l4 ? [5, 0] : t > T.cold1 && t < T.without ? [0, -5] : [0, 0];
  const birdBlink = blinkAt(t, [1.05, 4.6, 6.4, T.l4 + 0.05, DURATION_S - 0.55]);
  const birdSweat = popIn(t, T.use + 0.1, 0.3) * popOut(t, T.l3 + 0.1);
  const iceBeak = t < THAW ? popIn(t, T.celsius, 0.3) : popOut(t, THAW, 0.2);
  const snowCap = t < THAW ? popIn(t, T.three + 0.1, 0.4) : popOut(t, THAW, 0.2);
  const frost = t < THAW ? seg(t, T.go, T.cold2 + 0.4) : popOut(t, THAW, 0.2);

  const wingSeq = [0, 1, 2, 1];
  const wingIdx = wingSeq[frame % 4];

  let birdTransform: string;
  const tilt = pose === 'hover' ? -6 + 3 * Math.sin(2 * Math.PI * 0.8 * t) + (t > T.without - 0.06 && t < T.food + 0.15 ? 8 : 0) : 0;
  if (pose === 'hover') birdTransform = `translate(${cx} ${cy}) rotate(${tilt}) scale(${sx} ${sy})`;
  else {
    const c = pose === 'perch' ? PERCH_C : PUFF_C;
    const fx = c.x + (cx - (pose === 'perch' ? PERCH_C.x : PUFF_C.x)) * 0 + 2.2 * shiver * Math.sin(2 * Math.PI * 17 * t);
    birdTransform = `translate(${fx} ${PERCH_FEET}) scale(${sx} ${sy}) translate(0 ${-FEET[pose]})`;
  }

  // ---------- flower
  const flowerOpen = t < T.food + 0.1 ? 1 : t < THAW + 0.3 ? 1 - seg(t, T.food + 0.12, T.food + 0.42, easeInOutCubic) : seg(t, THAW + 0.35, THAW + 0.75, easeOutCubic);
  const flowerFace: Face = t < T.without || t > THAW + 0.3 ? 'happy' : t < T.food + 0.1 ? 'surprised' : 'squeeze';
  const flowerRot = 7 * Math.sin(2 * Math.PI * 0.5 * t) * 0.3 + (t > T.food ? 9 * Math.sin(2 * Math.PI * 6 * (t - T.food)) * Math.exp(-5 * (t - T.food)) : 0);

  // ---------- battery + night bar
  const battS = popIn(t, T.burns) * popOut(t, T.l3 + 0.26);
  const level = keys(t, [{t: T.burns, v: [1]}, {t: T.fast + 0.15, v: [0.63]}, {t: T.staying + 0.05, v: [0.6]}, {t: T.fat + 0.02, v: [0], ease: (u) => u}])[0];
  const battFace: Face = t < T.fast ? 'happy' : t < T.fat ? 'worried' : 'squeeze';
  const barS = popIn(t, T.staying) * popOut(t, T.l3 + 0.26);
  const dot = 0.5 * inv(t, T.staying + 0.05, T.fat + 0.02);
  const battShake = t > T.fat && t < T.l3 + 0.26 ? 3 * Math.sin(2 * Math.PI * 15 * t) : 0;

  // ---------- dial
  const dialS = popIn(t, T.l3 + 0.06) * popOut(t, T.l4 + 0.25);
  const needle = t < T.opposite ? 0 : clamp(seg(t, T.opposite, T.opposite + 0.14, easeOutCubic) + wobble(t, T.opposite + 0.14, -0.12, 5, 7), -0.2, 1.2);

  // ---------- heart + counter
  const heartS = popIn(t, T.heartbeat) * popOut(t, T.l5end + 0.4, 0.38);
  const phi = PHI[Math.min(frame, PHI.length - 1)] ?? 0;
  const beat = t >= T.heartbeat ? Math.exp(-(phi % 1) * 7) : 0;
  const count = t < T.to5 ? 1200 : t >= T.forty + 0.05 ? 40 : Math.round(lerp(1200, 40, easeOutCubic(inv(t, T.to5, T.forty + 0.05))) / 10) * 10;
  const tagS = popIn(t, T.twelve - 0.06) * popOut(t, T.l5end + 0.3, 0.38);
  const heartFace: Face = t < T.to5 ? 'surprised' : 'neutral';
  const heartLids = 0.55 * seg(t, T.to5, T.forty);
  const yawn = Math.sin(Math.PI * inv(t, T.forty + 0.05, T.forty + 0.6));
  const cap = popIn(t, T.forty, 0.4);

  // ---------- thermometer
  const thermoS = popIn(t, T.l6 + 0.02) * popOut(t, THAW);
  const tval = t < T.cooled ? 40 : lerp(40, 3.3, easeOutCubic(inv(t, T.cooled, T.three2end)));
  const tText = tval < 9.95 ? `${tval.toFixed(1)}°C` : `${Math.round(tval)}°C`;
  const thermoFace: Face = t < T.cooled ? 'neutral' : t < T.three2end ? 'surprised' : 'squeeze';
  const chatter = t > T.three2end + 0.1 && t < THAW ? t : 0;

  // ---------- fridge (falls onto the branch)
  const fallT0 = T.l7 - 0.05;
  const fridgeY = t < FRIDGE_LAND ? lerp(FRIDGE_FEET - 1500, FRIDGE_FEET, (inv(t, fallT0, FRIDGE_LAND)) ** 2) : FRIDGE_FEET;
  const fridgeVisible = t >= fallT0 && t < THAW + 0.3;
  const fridgeSq = wobble(t, FRIDGE_LAND, -0.13, 4, 7);
  const fridgeOut = popOut(t, THAW, 0.3);
  const door = t < T.fridge ? 0 : clamp(seg(t, T.fridge, T.fridge + 0.2, easeOutCubic) + wobble(t, T.fridge + 0.2, -0.08, 5, 8), 0, 1.1);
  const fridgeFace: Face = t < FRIDGE_LAND + 0.05 ? 'squeeze' : t < T.cold3 ? 'neutral' : t < T.l8 + 0.3 ? 'surprised' : 'happy';
  const dip = wobble(t, FRIDGE_LAND, 26, 2.6, 4) * (t < THAW + 0.3 ? 1 : 0);

  // ---------- medal
  const medalLand = T.bird;
  const medalT0 = medalLand - 0.32;
  const medalOn = t >= medalT0 && t < THAW + 0.2;
  const medalY = t < medalLand ? lerp(-900, 0, inv(t, medalT0, medalLand) ** 2) : 0;
  const medalS = popOut(t, THAW, 0.2);
  const medalSwing = wobble(t, medalLand, 10, 2.2, 3);

  // ---------- moon
  const moonFace: Face = t >= T.colder - 0.1 && t < THAW + 0.6 ? 'surprised' : 'sleep';

  // ---------- sparkles on "colder"
  const spark = (i: number) => popIn(t, T.colder + i * 0.07, 0.3) * popOut(t, T.colder + 0.75 + i * 0.05, 0.25);

  // ---------- mist
  const mist = MIST.map((m) => {
    const a = t - m.b;
    if (a < 0 || a > m.life || t > THAW + 0.2) return {x: 0, y: 0, r: 0};
    const grow = easeOutCubic(clamp(a / 0.35));
    const shrink = 1 - easeInCubic(inv(a, m.life * 0.55, m.life));
    return {x: m.x0 + m.vx * a, y: m.y0 + m.vy * a + 40 * a * a, r: m.r * grow * shrink};
  });

  const bodyHomeTransform = (x: number, y: number, s: number, extra = '') => `translate(${x} ${y}) scale(${s}) ${extra}`;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #151C45 0%, #27306A 45%, #3E4686 100%)'}}>
      <Stars t={t} />

      {/* moon */}
      <Layer cam={camS} z={3600} blur={dof}>
        <HomeSpace z={3600}>
          <g transform="translate(822 318) scale(0.92)">
            <Moon face={moonFace} blink={moonFace === 'surprised' ? blinkAt(t, [T.colder + 0.6]) : 0} />
          </g>
        </HomeSpace>
      </Layer>

      {/* far Andes */}
      <Layer cam={camS} z={3000} blur={dof}>
        <HomeSpace z={3000}>
          <g>
            <Mountains color="#4A5196" snow base={2900} pts={[[-500, 1500], [-250, 1180], [-60, 1330], [180, 1090], [380, 1290], [560, 1150], [760, 1320], [980, 1060], [1220, 1290], [1450, 1140], [1700, 1400]]} />
          </g>
        </HomeSpace>
      </Layer>
      <Layer cam={camS} z={1900} blur={dof * 0.7}>
        <HomeSpace z={1900}>
          <Mountains color="#373D78" snow={false} base={3200} pts={[[-600, 1620], [-300, 1440], [20, 1560], [300, 1400], [620, 1560], [900, 1420], [1200, 1540], [1500, 1430], [1800, 1600]]} />
        </HomeSpace>
      </Layer>

      <Layer cam={camS} z={1350} blur={dof * 0.5}>
        <HomeSpace z={1350}>
          <Treeline />
        </HomeSpace>
      </Layer>

      {/* far snow */}
      <Layer cam={camS} z={1600} blur={dof * 0.6}>
        <Snow t={t} near={false} />
      </Layer>

      {/* main layer: branches, flower, props, bird */}
      <Layer cam={camS} z={1000}>
        <g transform="translate(-45 0)"><TopTwig /></g>
        <g transform={`translate(${FLOWER.x} ${FLOWER.y})`}>
          <Flower open={flowerOpen} face={flowerFace} blink={blinkAt(t, [1.4])} shakeRot={flowerRot} />
        </g>
        <WindLines t={t} t0={T.cold1 - 0.1} />
        <WindLines t={t} t0={T.go} />
        <Branch dip={dip} icicles={t < THAW ? popIn(t, T.celsius + 0.08, 0.35) : popOut(t, THAW, 0.2)} />

        {thermoS > 0.01 && (
          <g>
            <g transform={bodyHomeTransform(THERMO.x, THERMO.y, thermoS)}>
              <Thermometer value={tval} face={thermoFace} blink={blinkAt(t, [T.l6 + 0.7])} chatter={chatter} />
            </g>
            <g transform={bodyHomeTransform(TTAG.x, TTAG.y, popIn(t, T.l6 + 0.12) * popOut(t, THAW))}>
              <Tag big={tText} w={250} color={tval < 5 ? '#DDF3FF' : '#fff'} />
            </g>
          </g>
        )}

        {fridgeVisible && (
          <g transform={`translate(${FRIDGE_X} ${fridgeY + dip * 0.9}) scale(${(1 - fridgeSq * 0.6) * fridgeOut} ${(1 + fridgeSq) * fridgeOut})`}>
            <Fridge door={door} face={fridgeFace} blink={blinkAt(t, [T.l8 + 0.9])} look={t > T.cold3 && t < THAW ? [-6, 2] : [0, 0]} />
          </g>
        )}
        <Puffs blobs={mist} fill="#F2FBFF" />

        <g transform={birdTransform}>
          <Bird pose={pose} wing={wingIdx} face={birdFace} blink={birdBlink} cold={cold} look={birdLook}
            iceBeak={iceBeak} snowCap={snowCap} sweat={birdSweat} frost={frost} t={t} />
        </g>

        {medalOn && (
          <g transform={`translate(${PUFF_C.x + 34} ${PUFF_C.y + 48 + medalY}) rotate(${medalSwing}) scale(${medalS})`}>
            <Medal spin={t > medalLand ? 0 : (t - medalT0) * 9} />
          </g>
        )}
        {[[-150, -120], [150, -190], [-120, 90], [170, 40], [20, -300]].map(([dx, dy], i) => (
          <Sparkle key={i} x={PUFF_C.x + dx} y={PUFF_C.y + dy} s={spark(i) * 0.9} rot={t * 40 + i * 30} />
        ))}

        {heartS > 0.01 && (
          <g>
            <g transform={bodyHomeTransform(HEART.x, HEART.y, heartS)}>
              <Heart beat={beat} face={heartFace} blink={Math.max(heartLids, blinkAt(t, [T.minute]))} cap={cap} yawn={yawn} />
            </g>
            <g transform={bodyHomeTransform(HTAG.x, HTAG.y, tagS)}>
              <Tag big={count.toLocaleString('en-US')} small="BEATS PER MINUTE" w={300} />
            </g>
          </g>
        )}

        {battS > 0.01 && (
          <g transform={bodyHomeTransform(BATT.x + battShake, BATT.y, battS)}>
            <Battery level={level} face={battFace} blink={blinkAt(t, [4.3])} sweat={popIn(t, T.morning, 0.3)} />
          </g>
        )}
        {barS > 0.01 && (
          <g transform={bodyHomeTransform(BAR.x, BAR.y, barS)}>
            <NightBar dot={dot} stop={t > T.fat ? 1 : 0} />
          </g>
        )}
        {dialS > 0.01 && (
          <g transform={bodyHomeTransform(DIAL.x, DIAL.y, dialS)}>
            <Dial needle={needle} />
          </g>
        )}
      </Layer>

      {/* near snow + foreground leaves */}
      <Layer cam={camS} z={820}>
        <Snow t={t} near />
      </Layer>
      <Layer cam={camS} z={640}>
        <HomeSpace z={640}>
          <Leaf x={-150} y={1830} r={-34} s={1.05} />
          <Leaf x={-170} y={1930} r={-12} s={0.95} c="#27502F" />
          <Leaf x={1230} y={1850} r={212} s={1.0} c="#27502F" />
          <Leaf x={1240} y={1950} r={192} s={0.9} />
        </HomeSpace>
      </Layer>

      {/* sound */}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('hummingbird/vo/take1.wav')} />
      </Sequence>
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * FPS)} layout="none">
          <Audio src={staticFile(`hummingbird/sfx/${c.f}.wav`)} volume={(f) => 10 ** (dbAt(c, c.at + f / FPS) / 20)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
