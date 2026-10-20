import type {Word} from './timeline';

export type Chunk = {words: Word[]; start: number; end: number};

const chars = (ws: Word[]) => ws.reduce((n, w) => n + display(w.text).length, 0);

/** Subtitle display form: uppercase, sentence punctuation and double quotes removed (keeps ? ! '). */
export const display = (text: string) => text.toUpperCase().replace(/[.,;:"\u2026\u201c\u201d]/g, '');

/**
 * Group words into 1-4 word subtitle chunks.
 * Breaks on: new segment, manual "|" break, highlight boundary (after 2+ words),
 * 3 words (4 if the chunk stays short).
 */
export const chunkWords = (words: Word[]): Chunk[] => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const allHl = [...cur, w].every((x) => x.hl);
    const full = cur.length >= 4 || (cur.length >= 3 && chars([...cur, w]) > (allHl ? 18 : 14));
    const hlEdge = prev && prev.hl !== w.hl && cur.length >= 2;
    if (prev && (prev.seg !== w.seg || w.brk || full || hlEdge)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out.map((ws) => ({words: ws, start: ws[0].start, end: ws[ws.length - 1].end}));
};
