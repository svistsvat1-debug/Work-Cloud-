// node-side checks: beat counts and holds > 7 s
import { buildTimeline, holds } from "./engine/Timeline";
import { scenes } from "./videos/blitz/scenes";
import data from "./videos/blitz/beats.json";
const beats = data.beats as any[];
scenes.forEach((s, i) => { const n = beats.filter(b => b.scene === i).length; if (n !== s.beats.length) console.log(`MISMATCH scene ${i + 1}: spec ${s.beats.length} vs voice ${n}`); });
const tl = buildTimeline(scenes, beats, 498.41);
const h = holds(tl).filter(x => x.len > 7);
console.log("scenes", scenes.length, "cuts", tl.cuts.length, "elements", tl.placed.length);
console.log("holds > 7 s:", h.map(x => `scene ${x.scene + 1} ${x.from.toFixed(1)}-${x.to.toFixed(1)} (${x.len.toFixed(1)} s)`));
const late = tl.placed.filter(p => { const sb = beats.filter(b => b.scene === p.scene); const end = p.scene + 1 < tl.cuts.length ? tl.cuts[p.scene + 1] : 498.4; return p.t0 + p.dur > end + 0.01; });
console.log("elements not finished before cut:", late.map(p => p.key));
console.log(JSON.stringify({ cuts: tl.cuts }));

// SFX events with absolute times -> out/sfx_events.json
import fs from "fs";
const ev: any[] = [];
scenes.forEach((sc, si) => (sc.sfx ?? []).forEach(x => { const b = beats.filter(b => b.scene === si)[x.beat]; ev.push({ t: +(b.start + 0.1 + (x.delay ?? 0)).toFixed(3), name: x.name, gain: x.gain ?? 0, scene: si + 1 }); }));
fs.writeFileSync("out/sfx_events.json", JSON.stringify(ev, null, 1));
console.log("sfx events", ev.length, "unique", [...new Set(ev.map(e => e.name))].join(","));
