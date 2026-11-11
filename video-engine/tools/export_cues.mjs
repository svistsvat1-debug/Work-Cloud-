// Builds the SFX cue sheet + checks pacing (no static stretch > 6 s) from the same storyboard the renderer uses.
// usage: node tools/export_cues.mjs src/data/timing.json src/data/maps.json out/cues.json
import fs from 'fs';
import { buildBoards } from '../src/boards.js';
const [, , tp, mp, out] = process.argv;
const T = JSON.parse(fs.readFileSync(tp)); const M = JSON.parse(fs.readFileSync(mp));
const B = buildBoards(T, M);
const cues = []; const events = [];
const walk = (e) => {
  if (e.at != null) events.push(e.at);
  if (e.sfx) cues.push({ t: e.sfxAt ?? e.at, name: e.sfx });
  for (const c of e.els || []) walk(c);
  for (const s of e.slices || []) events.push(s.at);
  for (const p of e.pages || []) events.push(p.at);
  if (e.hourAt) events.push(e.hourAt);
  if (e.t0 != null) events.push(e.t0, e.t1);
};
B.forEach((b, i) => { events.push(b.start); if (i > 0) cues.push({ t: b.start, name: i % 3 === 0 ? 'board_erase' : 'soft_whoosh', gain: -4, board: true }); b.els.forEach(walk); });
events.sort((a, b) => a - b);
let worst = 0, where = 0;
for (let i = 1; i < events.length; i++) { const g = events[i] - events[i - 1]; if (g > worst) { worst = g; where = events[i - 1]; } }
const endGap = T.duration - events[events.length - 1];
cues.sort((a, b) => a.t - b.t);
// thin out: never two cues closer than 0.25 s (keep the first)
const thin = []; for (const c of cues) { if (!thin.length || c.t - thin[thin.length - 1].t >= 0.25) thin.push(c); }
fs.writeFileSync(out, JSON.stringify({ boards: B.map((b) => ({ from: b.from, to: b.to, start: b.start, end: b.end })), cues: thin, events }, null, 1));
console.log(`boards ${B.length}, events ${events.length}, sfx cues ${thin.length} (raw ${cues.length})`);
console.log(`longest gap between new visual events: ${worst.toFixed(2)} s at ${where.toFixed(1)} s; tail after last event ${endGap.toFixed(2)} s`);
const gaps = []; for (let i = 1; i < events.length; i++) { const g = events[i] - events[i - 1]; if (g > 5) gaps.push([events[i - 1].toFixed(1), g.toFixed(1)]); }
console.log('gaps > 5 s:', JSON.stringify(gaps));
// latency of the first visible element on each board
const firstAt = (b) => { let m = Infinity; const w = (e) => { if (e.at != null && e.k !== 'tint') m = Math.min(m, e.at); (e.els || []).forEach(w); }; b.els.forEach(w); return m; };
const late = B.map((b) => [b.from, +(firstAt(b) - b.start).toFixed(2)]).filter(([, d]) => d > 0.6);
console.log('boards whose first element is late (>0.6 s):', JSON.stringify(late));
