// MOTION RULE (every video): something visibly happens at least every ~1 s.
// After the hand-placed cues, every idle stretch longer than MAX_IDLE gets automatic accents,
// snapped to VO word starts: the element being talked about hops / pulses / wiggles / gets underlined,
// or (if nothing suitable is on the board) the camera does a small punch-in.
// Pure data: runs in the browser (render) and in Node (QA event timeline).
import type {BoardBuilt, El, Timing} from './types';

export const MAX_IDLE = 1.2; // s: longest allowed stretch without a discrete visual event
export const ACC_DUR = 0.5; // s: length of one accent animation
const TRANS_S = 16 / 30; // board transition length

export type Accent = {t: number; type: 'pulse' | 'wiggle' | 'hop' | 'ul'};

const KIND_TYPES: Record<string, Accent['type'][]> = {
  text: ['pulse', 'wiggle'],
  counter: ['pulse', 'wiggle'],
  stamp: ['wiggle', 'pulse'],
  icon: ['hop', 'pulse', 'wiggle'],
  cal: ['hop', 'pulse'],
  card: ['hop', 'pulse'],
  gi: ['hop'],
  ship: ['hop'],
  check: ['pulse'],
  bigx: ['pulse'],
  bubble: ['pulse'],
  clock: ['wiggle'],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function numWord(n: number): string | null {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : '');
  if (n < 1000 && n % 100 === 0) return ONES[n / 100] + 'hundred';
  return null;
}

// words an element "is about": its visible text, numbers also as spoken words
function tokens(e: El): string[] {
  const raw = [e.text, e.title, e.label, e.top, e.big, e.bottom, e.top2, e.big2, e.value, e.name, e.k === 'counter' ? String(e.to) : undefined]
    .filter((x) => typeof x === 'string' && x.length > 0)
    .join(' ');
  const out: string[] = [];
  for (const t of raw.split(/[^A-Za-z0-9]+/)) {
    if (!t) continue;
    if (/^\d+$/.test(t)) {
      const wd = numWord(Number(t));
      if (wd) out.push(wd);
    } else if (t.length >= 4) out.push(norm(t));
  }
  return out;
}

// time intervals in which an element is visibly moving on its own
function busy(e: El, drawDur: (e: El) => number): [number, number][] {
  const r: [number, number][] = [[e.at, e.at + drawDur(e)]];
  const pt = (t: unknown, d = 0.45) => {
    if (typeof t === 'number') r.push([t, t + d]);
  };
  if (e.out !== undefined) pt(e.out, 0.35);
  if (e.mv) r.push([e.mv[2], e.mv[2] + e.mv[3]]);
  for (const key of ['labels', 'dots', 'arrows']) for (const o of (e[key] || []) as {at: number}[]) pt(o.at, 0.6);
  for (const o of (e.routes || []) as {at: number; dur?: number}[]) pt(o.at, o.dur ?? 1.5);
  for (const o of (e.steps || []) as {at: number}[]) pt(o.at, 0.6);
  for (const o of (e.remove || []) as {at: number}[]) pt(o.at, 0.5);
  for (const kk of ['valueAt', 'home', 'holdAt', 'sweat', 'flipAt', 'fillAt', 'dim']) pt(e[kk], 0.5);
  for (const m of (e.moods || []) as [number, string][]) pt(m[0], 0.4);
  // things that animate continuously while on the board
  if (e.k === 'ship' || (e.k === 'clock' && e.freeze === undefined)) r.push([e.at, e.out ?? 1e9]);
  if (e.k === 'clock' && typeof e.freeze === 'number') r.push([e.at, e.freeze]);
  return r;
}

// idle stretches (no element drawing / moving / accenting) inside a board, after its entry transition
export function idleGaps(b: BoardBuilt, drawDur: (e: El) => number): [number, number][] {
  const t0 = b.start + TRANS_S;
  const t1 = b.end;
  const iv: [number, number][] = [[b.start, t0]];
  for (const e of b.els) for (const [a, z] of busy(e, drawDur)) iv.push([Math.max(a, b.start), Math.min(z, t1)]);
  for (const e of b.els) for (const a of (e.acc || []) as Accent[]) iv.push([a.t, a.t + ACC_DUR]);
  for (const t of b.cam || []) iv.push([t, t + ACC_DUR]);
  iv.sort((x, y) => x[0] - y[0]);
  const gaps: [number, number][] = [];
  let cur = t0;
  for (const [a, z] of iv) {
    if (z <= cur) continue;
    if (a > cur) gaps.push([cur, Math.min(a, t1)]);
    cur = Math.max(cur, z);
  }
  if (cur < t1) gaps.push([cur, t1]);
  return gaps.filter(([a, z]) => z - a > 1e-3);
}

export function addAccents(b: BoardBuilt, T: Timing, drawDur: (e: El) => number): BoardBuilt {
  const els: El[] = b.els.map((e) => ({...e, acc: [...((e.acc as Accent[]) || [])]}));
  const cam: number[] = [...(b.cam || [])];
  const gaps = idleGaps({...b, els, cam}, drawDur);
  const words = T.scenes.flatMap((s) => s.words).filter((w) => w.s >= b.start && w.s < b.end);
  let lastTarget = -1;
  for (const [g0, g1] of gaps) {
    let t = g0;
    while (g1 - t > MAX_IDLE) {
      // the next accent: on a word start between t+0.45 and t+MAX_IDLE, closest to t+0.85
      const lo = t + 0.45;
      const hi = Math.min(t + MAX_IDLE, g1 - 0.05);
      const cand = words.filter((w) => w.s >= lo && w.s <= hi);
      const ta = cand.length ? cand.reduce((p, w) => (Math.abs(w.s - (t + 0.85)) < Math.abs(p.s - (t + 0.85)) ? w : p)).s : Math.min(t + 0.85, hi);
      const near = words.filter((w) => w.s >= ta - 0.25 && w.s <= ta + 0.9).map((w) => norm(w.w));
      let best = -1;
      let bestScore = -1e9;
      const vis = els
        .map((e, i) => ({e, i}))
        .filter(({e}) => KIND_TYPES[e.k] && e.at + drawDur(e) + 0.1 <= ta && (e.out === undefined || ta + ACC_DUR + 0.1 < e.out))
        .sort((x, y) => y.e.at - x.e.at);
      vis.forEach(({e, i}, rank) => {
        const tk = tokens(e);
        const match = tk.some((x) => near.some((n) => n.startsWith(x) || (x.length >= 5 && x.startsWith(n) && n.length >= 4)));
        let s = (match ? 10 : 0) + Math.max(0, 3 - rank);
        if (i === lastTarget) s -= 4;
        s -= (e.acc as Accent[]).length * 0.6;
        if (s > bestScore) {
          bestScore = s;
          best = i;
        }
      });
      if (best >= 0) {
        const e = els[best];
        const acc = e.acc as Accent[];
        const types = KIND_TYPES[e.k];
        let type = types[acc.length % types.length];
        const tk = tokens(e);
        const match = tk.some((x) => near.some((n) => n.startsWith(x)));
        // a spoken match on a text label gets a hand-drawn underline once (a new stroke, not just a nudge)
        if (e.k === 'text' && match && !e.ul && !acc.some((a) => a.type === 'ul') && (e.size ?? 48) >= 40 && !String(e.text).includes('\n')) type = 'ul';
        acc.push({t: ta, type});
        lastTarget = best;
      } else {
        cam.push(ta);
        lastTarget = -1;
      }
      t = ta + ACC_DUR;
    }
  }
  return {...b, els, cam};
}
