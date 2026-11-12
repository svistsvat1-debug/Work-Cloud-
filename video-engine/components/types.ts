// Board/element descriptors: plain data, usable in the browser (render) and in Node (sfx cues, QA).
export type El = {
  k: string; // kind
  at: number; // seconds: when it starts drawing
  out?: number; // seconds: when it is erased
  dur?: number; // seconds: draw duration
  sfx?: string | null; // sound cue name (sfx-library) or null for none; undefined = default for kind
  sfxAt?: number; // seconds, overrides the cue time
  gain?: number; // dB offset for the cue
  mv?: [number, number, number, number]; // move by dx, dy starting at sec, over dur sec
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type Enter = 'wipe' | 'slide' | 'cut';

export type BoardDef = {from: number; to: number; enter: Enter; zoom?: number; els: El[]};

export type Scene = {n: number; text: string; start: number; end: number; vo_start: number; vo_end: number; words: {w: string; s: number; e: number}[]};

export type Timing = {audio_dur: number; scenes: Scene[]};

export type BoardBuilt = BoardDef & {start: number; end: number; idx: number};

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function makeK(T: Timing) {
  const sc = (n: number) => {
    const s = T.scenes[n - 1];
    if (!s) throw new Error('no scene ' + n);
    return s;
  };
  // start time of the occ-th word in scene n that starts with `word`
  const w = (n: number, word: string, occ = 1, edge: 's' | 'e' = 's') => {
    const q = norm(word);
    let c = 0;
    for (const x of sc(n).words) {
      if (norm(x.w).startsWith(q)) {
        c++;
        if (c === occ) return edge === 's' ? x.s : x.e;
      }
    }
    throw new Error(`word "${word}" #${occ} not found in scene ${n}: ${sc(n).text}`);
  };
  return {
    w,
    we: (n: number, word: string, occ = 1) => w(n, word, occ, 'e'),
    S: (n: number) => sc(n).start,
    E: (n: number) => sc(n).end,
    V: (n: number) => sc(n).vo_start,
    VE: (n: number) => sc(n).vo_end,
  };
}
export type K = ReturnType<typeof makeK>;

export function buildBoards(defs: BoardDef[], T: Timing): BoardBuilt[] {
  return defs.map((d, idx) => ({...d, idx, start: T.scenes[d.from - 1].start, end: T.scenes[d.to - 1].end}));
}

// default draw durations (s)
export function drawDur(e: El): number {
  if (e.dur !== undefined) return e.dur;
  switch (e.k) {
    case 'title':
      return Math.max(0.6, String(e.text).length * 0.045);
    case 'text':
      return Math.max(0.45, String(e.text).replace(/\n/g, '').length * 0.04);
    case 'map':
      return 1.4;
    case 'ship':
      return 1.0;
    case 'counter':
      return 1.2;
    case 'quote':
      return Math.max(1.5, (e.lines as string[]).join('').length * 0.035);
    case 'arrow':
      return 0.6;
    default:
      return 0.8;
  }
}

// default sound cue per element kind
export function defaultSfx(e: El): string | null {
  if (e.sfx !== undefined) return e.sfx;
  switch (e.k) {
    case 'title':
      return 'marker_squeak_long';
    case 'counter':
      return 'counter_roll';
    case 'stamp':
      return 'rubber_stamp';
    case 'bigx':
      return 'marker_squeak_short';
    case 'map':
      return 'paper_unfold';
    case 'quote':
      return 'paper_unfold';
    case 'cal':
      return 'pop';
    case 'card':
      return 'pop';
    case 'arrow':
      return 'marker_squeak_short';
    case 'check':
      return 'marker_tap';
    case 'text':
      return (e.size ?? 48) >= 80 ? 'marker_squeak_short' : null;
    default:
      return null;
  }
}
