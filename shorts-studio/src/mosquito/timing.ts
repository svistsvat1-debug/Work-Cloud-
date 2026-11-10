import {FPS, clamp, lerp} from './util';

/** Voice placed at 0.1 s. Word starts measured with faster-whisper + RMS pauses (images/mosquito/words.json). */
export const VO = 0.1;
const w = (s: number) => +(s + VO).toFixed(3);

export const T = {
  // L1 "Why doesn't rain kill mosquitoes?"
  why: w(0.0),
  rain: w(0.64),
  kill: w(1.02),
  mosq1: w(1.36),
  // L2 "A raindrop can weigh 50 times more than one."
  cutScale: w(2.4),
  raindrop: w(2.74),
  dropLand: w(2.95),
  fifty: w(3.5),
  times: w(3.96),
  one: w(4.7),
  // L3 "For you, that's like getting hit by a bus."
  cutBus: w(5.25),
  you: w(5.7),
  thats: w(6.28),
  hit: w(6.84),
  bus: w(7.32),
  // L4 "But a mosquito is so light, the drop barely slows down when it hits."
  cutRide: w(8.08),
  mosquito: w(8.5),
  light: w(9.46),
  drop: w(10.22),
  barely: w(10.42),
  slows: w(10.88),
  when: w(11.48),
  hits: w(11.76),
  // L5 "And if the drop doesn't slow down, almost no force goes into the bug."
  doesnt: w(13.12),
  almost: w(14.3),
  force: w(14.9),
  bug: w(15.84),
  // L6 "So it just rides the drop down for a moment... then slides off sideways and keeps flying."
  rides: w(17.12),
  moment: w(18.54),
  slides: w(19.3),
  sideways: w(19.98),
  keeps: w(20.76),
  flying: w(21.04),
  voEnd: w(21.58),
  END: 22.6,
};

export const DURATION_FRAMES = Math.round(T.END * FPS);

/* ---------------------------------------------------------------- slow motion (ride) */
const TS_KEYS: [number, number][] = [
  [0, 1],
  [T.hits, 1],
  [T.hits + 0.14, 0.12],
  [T.sideways - 0.2, 0.12],
  [T.sideways + 0.25, 1],
  [999, 1],
];

export const timeScale = (t: number) => {
  for (let i = 0; i < TS_KEYS.length - 1; i++) {
    const [t0, v0] = TS_KEYS[i];
    const [t1, v1] = TS_KEYS[i + 1];
    if (t <= t1) return lerp(v0, v1, clamp((t - t0) / (t1 - t0)));
  }
  return 1;
};

/** Integrated "simulation" time (rain, wings, the falling drop all run on it). */
const SIM: number[] = (() => {
  const n = Math.ceil((T.END + 1) * FPS) + 2;
  const arr = new Array<number>(n);
  arr[0] = 0;
  for (let i = 1; i < n; i++) {
    const tm = (i - 0.5) / FPS;
    arr[i] = arr[i - 1] + timeScale(tm) / FPS;
  }
  return arr;
})();

export const simTime = (t: number) => {
  const f = t * FPS;
  const i = Math.max(0, Math.min(SIM.length - 2, Math.floor(f)));
  return lerp(SIM[i], SIM[i + 1], f - i);
};

/* ---------------------------------------------------------------- the big drop in the ride */
export const RIDE = {
  M0: {x: 540, y: 1010}, // mosquito hover point (also frame 0)
  R: 165, // hero drop radius
  dropX: 520,
  dropStartY: -385,
  v: 760, // world px per sim-second
  groundY: 1950,
  puddleY: 2028, // centre of the puddle in BG4 (art/Backgrounds.tsx GROUND.puddleY)
};

export const rideDropY = (t: number) => RIDE.dropStartY + RIDE.v * (simTime(t) - simTime(T.drop));

/** Time the hero drop reaches the puddle (computed once). */
export const SPLASH_T = (() => {
  for (let f = Math.round(T.drop * FPS); f < T.END * FPS; f++) {
    const t = f / FPS;
    if (rideDropY(t) + RIDE.R * 0.9 >= RIDE.puddleY) return t;
  }
  return T.END;
})();
