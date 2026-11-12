// Node: build boards, validate anchors, export sfx cues + event timeline for QA.
import {writeFileSync} from 'fs';
import {buildBoards, makeK, defaultSfx, drawDur, Timing} from '../components/types';
import {ACC_DUR, Accent, idleGaps} from '../components/motion';
import timing from '../src/videos/points85/timing.json';
import {boardDefs} from '../src/videos/points85/boards';
const T = timing as unknown as Timing;
const boards = buildBoards(boardDefs(makeK(T)), T);
const cues: {name: string; t: number; gain: number; src: string}[] = [];
const events: number[] = [];
for (const b of boards) {
  events.push(b.start);
  for (const t of b.cam || []) events.push(t, t + ACC_DUR);
  if (b.idx > 0 && b.enter !== 'cut') cues.push({name: b.enter === 'wipe' ? 'board_erase' : 'whoosh_soft', t: b.start + 0.05, gain: 0, src: `board${b.idx}:${b.enter}`});
  for (const e of b.els) {
    events.push(e.at, e.at + drawDur(e));
    if (e.out !== undefined) events.push(e.out);
    if (e.mv) events.push(e.mv[2], e.mv[2] + e.mv[3]);
    for (const key of ['dots', 'labels', 'arrows', 'routes', 'steps', 'remove'])
      for (const o of (e[key] || []) as {at: number; dur?: number}[]) events.push(o.at, o.at + (key === 'routes' ? o.dur ?? 1.5 : 0.3));
    for (const kk of ['valueAt', 'home', 'holdAt', 'sweat', 'flipAt', 'freeze']) if (typeof e[kk] === 'number') events.push(e[kk]);
    for (const m of (e.moods || []) as [number, string][]) events.push(m[0]);
    for (const a of (e.acc || []) as Accent[]) events.push(a.t, a.t + ACC_DUR);
    const s = defaultSfx(e);
    if (s) cues.push({name: s, t: e.sfxAt ?? e.at, gain: e.gain ?? 0, src: `board${b.idx}:${e.k}:${e.text ?? e.name ?? e.title ?? ''}`});
  }
}
events.sort((a, b) => a - b);
const idle = boards.flatMap((b) => idleGaps(b, drawDur).map(([a, z]) => ({board: b.idx, at: +a.toFixed(2), len: +(z - a).toFixed(2)}))).sort((a, b) => b.len - a.len);
const accN: Record<string, number> = {};
for (const b of boards) for (const e of b.els) for (const a of (e.acc || []) as Accent[]) accN[a.type] = (accN[a.type] || 0) + 1;
accN.cam = boards.reduce((n, b) => n + (b.cam || []).length, 0);
console.log('accents', JSON.stringify(accN), 'longest idle', JSON.stringify(idle.slice(0, 5)));
writeFileSync(process.argv[2], JSON.stringify({boards: boards.map((b) => ({idx: b.idx, from: b.from, to: b.to, start: b.start, end: b.end, enter: b.enter, n: b.els.length})), cues: cues.sort((a, b) => a.t - b.t), events, idle: idle.slice(0, 20), accents: accN}, null, 1));
console.log('boards', boards.length, 'elements', boards.reduce((a, b) => a + b.els.length, 0), 'cues', cues.length);
