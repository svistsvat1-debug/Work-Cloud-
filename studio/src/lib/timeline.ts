import {FPS} from '../brand';

export type Word = {
  text: string;
  start: number;
  end: number;
  seg: number;
  hl: boolean;
  emph: boolean;
  brk: boolean;
};
export type Segment = {index: number; text: string; start: number; end: number};
export type Timestamps = {duration: number; segments: Segment[]; words: Word[]};

export const toFrame = (sec: number) => Math.round(sec * FPS);

/** Lookup helpers bound to one video's timestamps. */
export const timeline = (ts: Timestamps) => {
  const wordsOf = (seg: number) => ts.words.filter((w) => w.seg === seg);
  return {
    /** start (sec) of segment */
    seg: (i: number) => ts.segments[i].start,
    /** start (sec) of the k-th word of segment i */
    word: (i: number, k = 0) => wordsOf(i)[k].start,
    /** end (sec) of the k-th word of segment i (negative k counts from the end) */
    wordEnd: (i: number, k = -1) => {
      const ws = wordsOf(i);
      return ws[(k + ws.length) % ws.length].end;
    },
    durationInFrames: toFrame(ts.duration),
  };
};
