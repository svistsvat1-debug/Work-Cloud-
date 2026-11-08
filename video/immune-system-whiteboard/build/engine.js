// Whiteboard animation engine: deterministic render(t) for frame capture.
const NS = 'http://www.w3.org/2000/svg';
const INK = '#232323';
const C = {
  red: '#e63b2e', blue: '#2f6fd6', yellow: '#ffc928', green: '#8cc63f', dgreen: '#5d9a2a',
  orange: '#ff9a3c', purple: '#b48ee6', dpurple: '#7d55c7', pink: '#f7a8c0', dpink: '#c0508a',
  tblue: '#62b0ef', dtblue: '#3a86cf', byellow: '#ffd23f', dbyellow: '#eea200', skin: '#f6c39a',
  lred: '#f7a3a3', drop: '#5ab4f0', gray: '#9a9a9a', gold: '#ffc23d'
};
let B = 0;               // base time of current board
const anims = [];
const tfs = new Set();
let uidN = 0;
const uid = () => 'u' + (uidN++);

const io = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const lin = p => p;
const out = p => 1 - Math.pow(1 - p, 3);
const inq = p => p * p * p;
const outB = p => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };

function A(t, dur, f, ease = io) { anims.push({ t0: B + t, t1: B + t + Math.max(dur, 0.001), f, ease }); }

function render(t) {
  for (const a of anims) {
    if (t < a.t0) continue;
    let p = (t - a.t0) / (a.t1 - a.t0); if (p > 1) p = 1;
    a.f(a.ease(p));
  }
  commitTf();
}
function initAnims() {
  anims.sort((a, b) => a.t0 - b.t0);
  for (let i = anims.length - 1; i >= 0; i--) anims[i].f(anims[i].ease(0));
  commitTf();
}
function commitTf() {
  for (const el of tfs) {
    const t = el._t;
    el.setAttribute('transform', `translate(${t.x.toFixed(2)} ${t.y.toFixed(2)}) rotate(${t.r.toFixed(2)}) scale(${(t.s * t.sx).toFixed(4)} ${(t.s * t.sy).toFixed(4)})`);
  }
}

function el(tag, attrs = {}, par) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (par) par.appendChild(e);
  return e;
}
const defs = () => document.getElementById('defs');

// group with transform state (_t = live, _p = planned for chaining moves)
function G(par, x = 0, y = 0, s = 1, r = 0) {
  const g = el('g', {}, par);
  g._t = { x, y, s, r, sx: 1, sy: 1 };
  g._p = { ...g._t };
  tfs.add(g);
  return g;
}
// animate transform props from planned state to new values
function mv(g, t, dur, to, ease = io) {
  const from = { ...g._p };
  Object.assign(g._p, to);
  const tgt = { ...g._p };
  A(t, dur, v => { for (const k in to) g._t[k] = from[k] + (tgt[k] - from[k]) * v; }, ease);
}
function pop(g, t, dur = 0.45, s = null) {
  const s1 = s == null ? g._p.s : s;
  g._p.s = s1;
  A(t, dur, v => { g._t.s = s1 * v; }, outB);
}
function fade(e, t, dur, from, to, ease = io) {
  A(t, dur, v => e.setAttribute('opacity', from + (to - from) * v), ease);
}
function wig(g, t, dur, amp = 6, freq = 1.2, prop = 'r', phase = 0) {
  const base = g._p[prop];
  A(t, dur, v => { g._t[prop] = base + amp * Math.sin((v * dur * freq + phase) * Math.PI * 2); }, lin);
}

// ---- drawing primitives ----
function stroke(g, d, t, dur, o = {}) {
  const subs = d.trim().split(/(?=M)/).filter(s => s.trim());
  const parts = [];
  const lens = subs.map(s => { const p = el('path', { d: s }, g); const L = p.getTotalLength() || 1; p.remove(); return L; });
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  subs.forEach((s, i) => {
    const p = el('path', {
      d: s, fill: 'none', stroke: o.c || INK, 'stroke-width': o.w || 6,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 2'
    }, g);
    if (o.dash) { p.setAttribute('stroke-dasharray', o.dash); p.removeAttribute('pathLength'); }
    const st = t + dur * acc / total, du = dur * lens[i] / total;
    acc += lens[i];
    if (o.dash) fade(p, st, du, 0, 1); else A(st, du, v => p.setAttribute('stroke-dashoffset', (1 - v).toFixed(4)), o.ease || lin);
    parts.push(p);
  });
  return parts;
}
// marker fill revealed by a scribble mask
function fill(g, d, color, t, dur, o = {}) {
  const tmp = el('path', { d }, g); const bb = tmp.getBBox(); tmp.remove();
  const id = uid();
  const pad = 30;
  const m = el('mask', { id, maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', x: bb.x - pad, y: bb.y - pad, width: bb.width + 2 * pad, height: bb.height + 2 * pad }, defs());
  const step = Math.max(10, Math.min(38, bb.height / 5));
  let zz = '', y = bb.y - step / 2, k = 0;
  zz = `M ${bb.x - 10} ${y}`;
  while (y < bb.y + bb.height + step) {
    y += step; k++;
    zz += ` L ${k % 2 ? bb.x + bb.width + 10 : bb.x - 10} ${y}`;
  }
  const mp = el('path', { d: zz, fill: 'none', stroke: '#fff', 'stroke-width': step * 2.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 2' }, m);
  const p = el('path', { d, fill: color, mask: `url(#${id})`, filter: o.nof ? '' : 'url(#mk)' }, g);
  if (o.op != null) p.setAttribute('fill-opacity', o.op);
  A(t, dur, v => mp.setAttribute('stroke-dashoffset', (1 - v).toFixed(4)), lin);
  return p;
}
// filled + outlined shape
function shape(g, d, color, t, dur = 0.6, o = {}) {
  const f = color ? fill(g, d, color, t + dur * 0.5, dur * 0.55, o) : null;
  const s = stroke(g, d, t, dur * 0.6, { w: o.w || 6, c: o.c });
  return { f, s };
}
// handwritten text revealed left-to-right
function txt(g, str, x, y, size, t, dur, o = {}) {
  const tx = el('text', {
    x, y, 'font-size': size, 'font-family': 'Caveat', 'font-weight': 700, fill: o.c || INK,
    'text-anchor': o.a || 'start', stroke: o.c || INK, 'stroke-width': size / 40, 'paint-order': 'stroke'
  }, g);
  tx.textContent = str;
  const bb = tx.getBBox();
  const id = uid();
  const m = el('mask', { id, maskUnits: 'userSpaceOnUse', x: bb.x - 40, y: bb.y - 40, width: bb.width + 80, height: bb.height + 80 }, defs());
  const r = el('rect', { x: bb.x - 20, y: bb.y - 30, height: bb.height + 60, width: 0, fill: '#fff' }, m);
  tx.setAttribute('mask', `url(#${id})`);
  A(t, dur, v => r.setAttribute('width', (bb.width + 40) * v), lin);
  tx._bb = bb;
  return tx;
}
function underline(g, tx, t, dur = 0.35, c = C.red, dy = 18) {
  const bb = tx._bb;
  const y = bb.y + bb.height + dy - bb.height * 0.12;
  return stroke(g, `M ${bb.x + 6} ${y + 4} Q ${bb.x + bb.width / 2} ${y - 8} ${bb.x + bb.width - 4} ${y}`, t, dur, { c, w: 9 });
}

// ---- geometry helpers ----
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function closedCurve(pts) {
  const n = pts.length; let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}
function blob(cx, cy, rx, ry, wob, seed, n = 9) {
  const R = rng(seed); const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2; const k = 1 + (R() * 2 - 1) * wob; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return closedCurve(pts);
}
function starBlob(cx, cy, r1, r2, n, seed) {
  const R = rng(seed); const pts = [];
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2; const r = (i % 2 ? r2 : r1) * (1 + (R() - .5) * .25); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return closedCurve(pts);
}
const circ = (cx, cy, r) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
function capsule(cx, cy, L, W) {
  const r = W / 2, x0 = cx - L / 2 + r, x1 = cx + L / 2 - r;
  return `M ${x0} ${cy - r} L ${x1} ${cy - r} A ${r} ${r} 0 0 1 ${x1} ${cy + r} L ${x0} ${cy + r} A ${r} ${r} 0 0 1 ${x0} ${cy - r} Z`;
}
function starPath(cx, cy, r1, r2, n = 5) {
  let d = ''; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? r2 : r1; d += (i ? ' L ' : 'M ') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1); }
  return d + ' Z';
}

// ---- reusable doodles ----
function arrow(g, x1, y1, x2, y2, t, dur = 0.45, o = {}) {
  const bend = o.bend == null ? 0.15 : o.bend;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const ang = Math.atan2(y2 - my, x2 - mx), h = o.head || 26;
  const a1 = ang + 2.6, a2 = ang - 2.6;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2} M ${x2 + Math.cos(a1) * h} ${y2 + Math.sin(a1) * h} L ${x2} ${y2} L ${x2 + Math.cos(a2) * h} ${y2 + Math.sin(a2) * h}`;
  return stroke(g, d, t, dur, { w: o.w || 7, c: o.c || INK, dash: o.dash });
}
function burst(g, x, y, r1, r2, n, a0, a1, t, dur = 0.4, c = C.yellow, w = 9) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI / 180;
    d += `M ${x + Math.cos(a) * r1} ${y + Math.sin(a) * r1} L ${x + Math.cos(a) * r2} ${y + Math.sin(a) * r2} `;
  }
  return stroke(g, d, t, dur, { c, w });
}
function face(g, x, y, s, mood, t, dur = 0.3) {
  const f = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, g);
  const eyes = el('g', {}, f);
  el('circle', { cx: -14, cy: 0, r: 6, fill: INK }, eyes); el('circle', { cx: 14, cy: 0, r: 6, fill: INK }, eyes);
  el('circle', { cx: -12, cy: -2, r: 2, fill: '#fff' }, eyes); el('circle', { cx: 16, cy: -2, r: 2, fill: '#fff' }, eyes);
  fade(eyes, t, 0.1, 0, 1);
  if (mood === 'angry') { stroke(f, 'M -26 -16 L -6 -9 M 26 -16 L 6 -9', t + .05, dur * .5, { w: 5 }); stroke(f, 'M -10 20 Q 0 12 10 20', t + .15, dur * .4, { w: 5 }); }
  else if (mood === 'happy') { stroke(f, 'M -12 14 Q 0 26 12 14', t + .1, dur * .5, { w: 5 }); }
  else if (mood === 'brave') { stroke(f, 'M -24 -14 L -6 -12 M 24 -14 L 6 -12', t + .05, dur * .4, { w: 5 }); stroke(f, 'M -12 15 Q 0 22 12 15', t + .15, dur * .4, { w: 5 }); }
  else if (mood === 'shock') { stroke(f, circ(0, 20, 7), t + .1, dur * .5, { w: 4 }); }
  else if (mood === 'sleep') { eyes.remove(); stroke(f, 'M -20 0 Q -14 6 -8 0 M 8 0 Q 14 6 20 0 M -8 18 L 8 18', t, dur, { w: 4 }); }
  return f;
}
// character container: outer (position) > inner (pop/wiggle)
function CH(par, x, y, s = 1, r = 0) { const o = G(par, x, y, 1, 0); const i = G(o, 0, 0, s, r); o.inner = i; return o; }

function bacterium(par, x, y, s, r, t, o = {}) {
  const ch = CH(par, x, y, s, r), g = ch.inner, sp = o.sp || 1;
  stroke(g, 'M 58 -4 q 18 -16 36 -4 t 36 -4 M 52 18 q 18 -6 34 8 t 34 6', t + .3 * sp, .25 * sp, { w: 4 });
  shape(g, capsule(0, 0, 120, 58), o.c || C.green, t, .6 * sp);
  const R = rng(o.seed || 3);
  for (let i = 0; i < 3; i++) { const c = el('circle', { cx: -40 + R() * 10 + i * 34, cy: (i % 2 ? 14 : -15) + R() * 6, r: 4 + R() * 2, fill: C.dgreen }, g); fade(c, t + .5 * sp, .1, 0, 1); }
  if (!o.noface) face(g, -6, -2, .9, o.mood || 'angry', t + .45 * sp, .25 * sp);
  return ch;
}
function virus(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner; let d = '';
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; d += `M ${Math.cos(a) * 30} ${Math.sin(a) * 30} L ${Math.cos(a) * 48} ${Math.sin(a) * 48} `; }
  stroke(g, d, t, .3, { w: 5 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const c = el('circle', { cx: Math.cos(a) * 50, cy: Math.sin(a) * 50, r: 7, fill: C.red, stroke: INK, 'stroke-width': 3 }, g); fade(c, t + .3, .1, 0, 1); }
  shape(g, circ(0, 0, 32), o.c || C.purple, t, .45);
  return ch;
}
function coccus(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  [[0, 0], [34, 6], [16, 32]].forEach(([a, b], i) => shape(g, circ(a, b, 20), o.c || C.orange, t + i * .08, .35));
  return ch;
}
function macrophage(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  shape(g, blob(0, 0, 190, 160, .2, o.seed || 11, 11), C.purple, t, 1.0);
  shape(g, blob(-60, 45, 62, 48, .15, 5, 7), C.dpurple, t + .6, .4, { w: 5 });
  const R = rng(9);
  for (let i = 0; i < 7; i++) { const c = el('circle', { cx: -120 + R() * 240, cy: -90 + R() * 70 + (i % 2) * 120, r: 6, fill: C.dpurple }, g); fade(c, t + .8, .1, 0, 1); }
  face(g, 40, -30, 1.5, o.mood || 'brave', t + .8, .3);
  return ch;
}
function neutrophil(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  shape(g, blob(0, 0, 72, 68, .08, o.seed || 4, 8), C.pink, t, .5);
  shape(g, circ(-28, 22, 15) + circ(0, 32, 15) + circ(28, 22, 15), C.dpink, t + .3, .3, { w: 4 });
  face(g, 0, -18, 1, o.mood || 'angry', t + .4, .25);
  return ch;
}
function dendritic(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  shape(g, starBlob(0, 0, 120, 55, 7, o.seed || 2), C.orange, t, .8);
  shape(g, circ(0, 10, 26), '#e0702a', t + .5, .3, { w: 5 });
  face(g, 0, -20, 1, o.mood || 'brave', t + .6, .25);
  return ch;
}
function tcell(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  shape(g, circ(0, 0, 72), C.tblue, t, .5);
  shape(g, circ(0, 8, 46), C.dtblue, t + .3, .3, { w: 4 });
  face(g, 0, 2, 1, o.mood || 'brave', t + .45, .25);
  return ch;
}
function bcell(par, x, y, s, t, o = {}) {
  const ch = CH(par, x, y, s), g = ch.inner;
  let d = '';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7 * 360 + 10) * Math.PI / 180, cx = Math.cos(a), cy = Math.sin(a);
    const bx = cx * 72, by = cy * 72, ex = cx * 92, ey = cy * 92, px = -cy * 12, py = cx * 12;
    d += `M ${bx} ${by} L ${ex} ${ey} M ${ex} ${ey} L ${ex + cx * 12 + px} ${ey + cy * 12 + py} M ${ex} ${ey} L ${ex + cx * 12 - px} ${ey + cy * 12 - py} `;
  }
  stroke(g, d, t + .35, .3, { w: 5, c: C.blue });
  shape(g, circ(0, 0, 72), C.byellow, t, .5);
  shape(g, circ(0, 8, 44), C.dbyellow, t + .3, .3, { w: 4 });
  face(g, 0, 2, 1, o.mood || 'brave', t + .45, .25);
  return ch;
}
function antibody(par, x, y, s, r, t, dur = .3) {
  const ch = CH(par, x, y, s, r), g = ch.inner;
  const d = 'M 0 34 L 0 0 M 0 0 L -24 -28 M 0 0 L 24 -28';
  stroke(g, d, t, dur, { w: 17 }); stroke(g, d, t + dur * .3, dur, { w: 9, c: C.blue });
  return ch;
}
function xMark(g, x, y, r, t, dur = .3, c = C.red) { return stroke(g, `M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}`, t, dur, { c, w: 11 }); }
function check(g, x, y, r, t, dur = .3, c = '#2fa84f') { return stroke(g, `M ${x - r} ${y} L ${x - r * .3} ${y + r * .7} L ${x + r} ${y - r * .8}`, t, dur, { c, w: 12 }); }
function shieldPath(s = 1) { return `M 0 ${-170 * s} C ${60 * s} ${-130 * s} ${110 * s} ${-125 * s} ${150 * s} ${-130 * s} C ${150 * s} ${30 * s} ${100 * s} ${120 * s} 0 ${180 * s} C ${-100 * s} ${120 * s} ${-150 * s} ${30 * s} ${-150 * s} ${-130 * s} C ${-110 * s} ${-125 * s} ${-60 * s} ${-130 * s} 0 ${-170 * s} Z`; }
const heartPath = (s = 1) => `M 0 ${40 * s} C ${-80 * s} ${-10 * s} ${-60 * s} ${-80 * s} 0 ${-45 * s} C ${60 * s} ${-80 * s} ${80 * s} ${-10 * s} 0 ${40 * s} Z`;
function thermometer(par, x, y, s, t) {
  const g = G(par, x, y, s);
  shape(g, 'M -14 60 L -14 -70 A 14 14 0 0 1 14 -70 L 14 60 A 30 30 0 1 1 -14 60 Z', '#ffffff', t, .5, { nof: 1 });
  fill(g, 'M -7 70 L -7 -40 L 7 -40 L 7 70 Z' + circ(0, 86, 20), C.red, t + .45, .3);
  stroke(g, 'M 22 -50 L 34 -50 M 22 -20 L 34 -20 M 22 10 L 34 10 M 22 40 L 34 40', t + .5, .2, { w: 4 });
  return g;
}
function dropShape(par, x, y, s, t, c = C.drop) { const g = G(par, x, y, s); shape(g, 'M 0 -50 C 20 -20 36 0 36 18 A 36 36 0 0 1 -36 18 C -36 0 -20 -20 0 -50 Z', c, t, .45); return g; }
function clock(par, x, y, s, t) {
  const g = G(par, x, y, s);
  shape(g, circ(0, 0, 60), '#ffffff', t, .45, { nof: 1 });
  stroke(g, 'M 0 -50 L 0 -42 M 50 0 L 42 0 M 0 50 L 0 42 M -50 0 L -42 0', t + .3, .2, { w: 5 });
  const h = G(g, 0, 0); stroke(h, 'M 0 0 L 0 -38', t + .4, .15, { w: 6, c: C.red });
  stroke(g, 'M 0 0 L 26 0', t + .45, .15, { w: 7 });
  return { g, hand: h };
}
function lightning(par, x, y, s, t) { const g = G(par, x, y, s); shape(g, 'M 10 -70 L -30 10 L 0 10 L -12 70 L 34 -14 L 4 -14 Z', C.yellow, t, .4); return g; }
