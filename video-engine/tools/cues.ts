// Node: build boards, validate anchors, export sfx cues + event timeline for QA.
import {writeFileSync} from 'fs';
import {buildBoards, makeK, defaultSfx, drawDur, Timing} from '../components/types';
import timing from '../src/videos/points85/timing.json';
import {boardDefs} from '../src/videos/points85/boards';
const T = timing as unknown as Timing;
const boards = buildBoards(boardDefs(makeK(T)), T);
const cues: {name: string; t: number; gain: number; src: string}[] = [];
const events: number[] = [];
for (const b of boards) {
  events.push(b.start);
  if (b.idx > 0 && b.enter !== 'cut') cues.push({name: b.enter === 'wipe' ? 'board_erase' : 'whoosh_soft', t: b.start + 0.05, gain: 0, src: `board${b.idx}:${b.enter}`});
  for (const e of b.els) {
    events.push(e.at, e.at + drawDur(e));
    if (e.out !== undefined) events.push(e.out);
    if (e.mv) events.push(e.mv[2], e.mv[2] + e.mv[3]);
    for (const key of ['dots', 'labels', 'arrows', 'routes', 'steps', 'remove'])
      for (const o of (e[key] || []) as {at: number; dur?: number}[]) events.push(o.at, o.at + (key === 'routes' ? o.dur ?? 1.5 : 0.3));
    for (const kk of ['valueAt', 'home', 'holdAt', 'sweat', 'flipAt', 'freeze']) if (typeof e[kk] === 'number') events.push(e[kk]);
    for (const m of (e.moods || []) as [number, string][]) events.push(m[0]);
    const s = defaultSfx(e);
    if (s) cues.push({name: s, t: e.sfxAt ?? e.at, gain: e.gain ?? 0, src: `board${b.idx}:${e.k}:${e.text ?? e.name ?? e.title ?? ''}`});
  }
}
events.sort((a, b) => a - b);
writeFileSync(process.argv[2], JSON.stringify({boards: boards.map((b) => ({idx: b.idx, from: b.from, to: b.to, start: b.start, end: b.end, enter: b.enter, n: b.els.length})), cues: cues.sort((a, b) => a.t - b.t), events}, null, 1));
console.log('boards', boards.length, 'elements', boards.reduce((a, b) => a + b.els.length, 0), 'cues', cues.length);
