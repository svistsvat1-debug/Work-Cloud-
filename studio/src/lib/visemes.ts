import {random} from 'remotion';
import type {Word} from './timeline';

/** Mouth shape parameters, all 0..1. */
export type Mouth = {open: number; wide: number; round: number; teeth: number; press: number};
export type Phone = [string, number, number]; // [ipa, start, end]

const S = (open: number, wide: number, round = 0, teeth = 0, press = 0): Mouth => ({open, wide, round, teeth, press});

const VISEME: Record<string, Mouth> = {
  rest: S(0.04, 0.55),
  mbp: S(0, 0.5, 0, 0, 1),
  aa: S(0.85, 0.72, 0.05, 0.35),
  ah: S(0.5, 0.62, 0.05, 0.3),
  ee: S(0.3, 1, 0, 0.8),
  oo: S(0.42, 0.28, 1),
  fv: S(0.12, 0.62, 0, 1, 0.35),
  th: S(0.26, 0.62, 0, 0.6),
  sz: S(0.12, 0.85, 0, 1),
  kg: S(0.38, 0.6, 0, 0.25),
  r: S(0.3, 0.42, 0.6, 0.1),
};

const MAP: Record<string, keyof typeof VISEME> = {};
const put = (chars: string, v: keyof typeof VISEME) => [...chars].forEach((c) => (MAP[c] = v));
put('mbp', 'mbp');
put('aæɑɒ', 'aa');
put('ʌəɐɜ', 'ah');
put('iɪeɛjᵻ', 'ee');
put('uʊoɔw', 'oo');
put('fv', 'fv');
put('θð', 'th');
put('ltdnɾʔ', 'th');
put('szʃʒʧʤç', 'sz');
put('kɡgŋhx', 'kg');
put('ɹrɚɝ', 'r');
const MODIFIERS = new Set(['ˈ', 'ˌ', 'ː']);

const lerp = (a: Mouth, b: Mouth, k: number): Mouth => ({
  open: a.open + (b.open - a.open) * k,
  wide: a.wide + (b.wide - a.wide) * k,
  round: a.round + (b.round - a.round) * k,
  teeth: a.teeth + (b.teeth - a.teeth) * k,
  press: a.press + (b.press - a.press) * k,
});

/** Viseme active at time t (modifiers continue the previous phoneme; gaps = rest). */
const rawAt = (phones: Phone[], t: number): Mouth => {
  let lo = 0;
  let hi = phones.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (phones[mid][1] <= t) {
      idx = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (idx < 0 || t > phones[idx][2] + 0.04) return VISEME.rest;
  let k = idx;
  while (k > 0 && (MODIFIERS.has(phones[k][0]) || !MAP[phones[k][0]])) k--;
  const key = MAP[phones[k][0]];
  if (!key) return VISEME.rest;
  // slightly exaggerate stressed vowels
  return VISEME[key];
};

/** Smoothed mouth: short look-back blend + gentle anticipation of the next phoneme. */
export const mouthAt = (phones: Phone[], t: number): Mouth => {
  const now = rawAt(phones, t);
  const a = lerp(rawAt(phones, t - 0.033), now, 0.6);
  const b = lerp(a, rawAt(phones, t - 0.066), 0.2);
  return lerp(b, rawAt(phones, t + 0.03), 0.25);
};

export const isSpeaking = (words: Word[], t: number) => words.some((w) => t >= w.start - 0.05 && t <= w.end + 0.1);

/** Deterministic blinks: returns eyelid closure 0..1. */
export const blinkAt = (t: number, seed = 'blink') => {
  let at = 0.9;
  for (let k = 0; k < 200 && at < t + 1; k++) {
    const d = t - at;
    if (d >= 0 && d < 0.16) return d < 0.06 ? d / 0.06 : 1 - (d - 0.06) / 0.1;
    at += 2.2 + random(`${seed}${k}`) * 2.4;
  }
  return 0;
};

/** Brow raise 0..1 on highlighted / emphasis words. */
export const browAt = (words: Word[], t: number) => {
  for (const w of words) {
    if (!(w.hl || w.emph)) continue;
    const d = t - (w.start - 0.05);
    if (d >= 0 && d < 0.6) return Math.sin((Math.min(d, 0.6) / 0.6) * Math.PI) * (w.emph ? 1 : 0.6);
  }
  return 0;
};

/** Small head nod on emphasis words (0..1 impulse). */
export const nodAt = (words: Word[], t: number) => {
  for (const w of words) {
    if (!w.emph && !w.hl) continue;
    const d = t - w.start;
    if (d >= 0 && d < 0.35) return Math.sin((d / 0.35) * Math.PI);
  }
  return 0;
};
