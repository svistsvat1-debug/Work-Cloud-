// Group builder: author drawings as SVG-like parts, compile to animated marker art.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';
import { Path2D } from '@napi-rs/canvas';
import {
  C, IDENT, mmul, tfMatrix, mapply, mscale, flattenPath, ptsToSubs, wobblePts, bboxOf,
  makeStroke, drawStroke, makeFill, drawFill, subsToPath2D, hashStr, rng,
} from './core.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const loadFont = f => opentype.parse(fs.readFileSync(path.join(__dir, '..', 'fonts', f)).buffer);
export const FONTS = {
  hand: loadFont('CaveatBrush-Regular.ttf'),
  hero: loadFont('Chewy-Regular.ttf'),
  marker: loadFont('PermanentMarker-Regular.ttf'),
};

// ───────────────────────── text layout ─────────────────────────
export function layoutLine(font, str, size, tracking = 0) {
  const sc = size / font.unitsPerEm;
  let x = 0, prev = null;
  const items = [];
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    if (prev) { let k = 0; try { k = font.getKerningValue(prev, g) || 0; } catch (e) { k = 0; } x += k * sc; }
    items.push({ g, x, ch, adv: (g.advanceWidth || 0) * sc });
    x += (g.advanceWidth || 0) * sc + tracking; prev = g;
  }
  return { items, width: Math.max(0, x - tracking) };
}
export function measure(str, { font = 'hand', size = 60, tracking = 0 } = {}) {
  const f = FONTS[font];
  const lines = String(str).split('\n');
  let w = 0; for (const l of lines) w = Math.max(w, layoutLine(f, l, size, tracking).width);
  return { w, h: lines.length * size * 1.08 };
}

// ───────────────────────── group ─────────────────────────
export class G {
  constructor() { this.parts = []; this._stage = 0; }
  stage() { this._stage++; return this; }
  _push(p) { p.stage = this._stage; p.m = p.m || IDENT; this.parts.push(p); return this; }

  // generic SVG path. o: {stroke, w, fill, hatch, gap, sweep, solid, rule, close, wob, alpha, blend, instant, density}
  path(d, o = {}) { return this._push({ t: 'path', d, o }); }
  line(x1, y1, x2, y2, o = {}) { return this.path(`M${x1} ${y1}L${x2} ${y2}`, o); }
  poly(pts, o = {}) { return this.path('M' + pts.map(p => p[0] + ' ' + p[1]).join('L') + (o.open ? '' : 'Z'), o); }
  polyline(pts, o = {}) { return this.path('M' + pts.map(p => p[0] + ' ' + p[1]).join('L'), o); }
  rect(x, y, w, h, o = {}) {
    const r = o.r || 0;
    if (!r) return this.path(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, o);
    return this.path(`M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`, o);
  }
  ellipse(cx, cy, rx, ry, o = {}) {
    // start at top-left-ish like a hand would
    return this.path(`M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx} ${ry} 0 0 1 ${cx - rx} ${cy}Z`, o);
  }
  circle(cx, cy, r, o = {}) { return this.ellipse(cx, cy, r, r, o); }
  // filled dot (solid)
  dot(cx, cy, r, color = C.ink) { return this.ellipse(cx, cy, r, r, { stroke: null, fill: color, solid: true, instant: true }); }

  // handwriting. o: {size, font, color, align, rot, tracking, bold, jitter, lh}
  text(str, x, y, o = {}) { return this._push({ t: 'text', str: String(str), x, y, o }); }
  // outlined + coloured-in display lettering. o: {size, font, fill, outline, w, align, rot, tracking, hatch}
  hero(str, x, y, o = {}) { return this._push({ t: 'hero', str: String(str), x, y, o }); }

  // add a child group with a transform; keepStages=false merges it into the current stage
  add(g, tf = {}, { keepStages = true } = {}) {
    const m = Array.isArray(tf) ? tf : tfMatrix(tf);
    let maxS = 0;
    for (const p of g.parts) {
      const st = keepStages ? p.stage : 0; if (st > maxS) maxS = st;
      this.parts.push({ ...p, m: mmul(m, p.m), stage: this._stage + st });
    }
    this._stage += maxS;
    return this;
  }
  // convenience: return a transformed copy
  at(tf) { return new G().add(this, tf); }
}
export const g = () => new G();

// ───────────────────────── compile ─────────────────────────
const SPEED = 2500;        // logical px of pen travel per second (auto duration)
const FILL_K = 0.26;       // hatch passes are quicker than outlines
const TEXT_K = 0.62;

function effW(w, m) { const s = mscale(m); return Math.max(2.2, w * Math.pow(s, 0.62)); }

export function compile(group, { seed = 1, wob = 1.5 } = {}) {
  const items = [];
  const R = rng(seed);
  let n = 0;
  for (const p of group.parts) {
    n++;
    const ps = (seed * 31 + n * 977) >>> 0;
    if (p.t === 'path') {
      const o = p.o;
      const amp = (o.wob ?? 1) * wob;
      let subs = flattenPath(p.d, p.m, o.step || 5).map(s => ({ pts: wobblePts(s.pts, amp, seed), closed: s.closed }));
      if (!subs.length) continue;
      const strokeColor = o.stroke === undefined ? C.ink : o.stroke;
      const w = effW(o.w ?? 7, p.m);
      const it = { kind: 'shape', stage: p.stage, strokes: [], fill: null, sLen: 0, fWork: 0, alpha: o.alpha ?? 1, blend: o.blend || null, instant: !!o.instant, fillInstant: !!o.fillInstant };
      if (o.fill) {
        it.fill = makeFill(subs, { color: o.fill, angle: o.hatch ?? -32, gap: o.gap ?? null, seed: ps, rule: o.rule || 'evenodd', solid: !!o.solid, sweep: o.sweep ?? null, tone: o.tone ?? 0.035, streak: o.streak ?? 0.13, density: o.density ?? 1 });
        it.fWork = it.fill.total * FILL_K * (o.fillSlow ?? 1);
      }
      if (strokeColor) {
        subs.forEach((s, i) => {
          const S = makeStroke(s.pts, { color: strokeColor, w, seed: ps + i, taper: o.taper ?? true, vary: o.vary ?? 0.13 });
          it.strokes.push(S); it.sLen += S.total;
        });
      }
      it.sWork = it.sLen * (o.slow ?? 1);
      items.push(it);
    } else if (p.t === 'text' || p.t === 'hero') {
      compileText(p, items, seed, ps, wob, R);
    }
  }
  // ── schedule: stages sequential; inside a stage all strokes then all fills
  const stages = new Map();
  for (const it of items) { if (!stages.has(it.stage)) stages.set(it.stage, []); stages.get(it.stage).push(it); }
  const keys = [...stages.keys()].sort((a, b) => a - b);
  let totalWork = 0;
  const sw = keys.map(k => { let w = 0; for (const it of stages.get(k)) if (!it.instant) w += (it.sWork || 0) + (it.fillInstant ? 0 : (it.fWork || 0)); w = Math.max(w, 1); totalWork += w; return w; });
  let acc = 0;
  keys.forEach((k, ki) => {
    const list = stages.get(k);
    const t0 = acc / totalWork, t1 = (acc + sw[ki]) / totalWork; acc += sw[ki];
    let a = 0;
    const span = sw[ki];
    for (const it of list) {
      const w = it.instant ? 0 : (it.sWork || 0);
      it.s0 = t0 + (t1 - t0) * a / span; a += w; it.s1 = t0 + (t1 - t0) * a / span;
    }
    for (const it of list) {
      if (it.fillInstant || it.instant) { it.f0 = it.s0; it.f1 = it.s0; continue; }
      const w = it.fWork || 0;
      it.f0 = t0 + (t1 - t0) * a / span; a += w; it.f1 = t0 + (t1 - t0) * a / span;
    }
  });
  const dur = Math.max(0.35, Math.min(3.4, totalWork / SPEED));
  // bbox
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of items) {
    const bbs = [];
    if (it.kind === 'shape') { for (const S of it.strokes) for (const q of S.pts) bbs.push(q); if (it.fill) { const b = it.fill.bb; bbs.push([b.x0, b.y0], [b.x1, b.y1]); } }
    else for (const gl of it.glyphs) { bbs.push([gl.bb.x0, gl.bb.y0], [gl.bb.x1, gl.bb.y1]); }
    for (const [x, y] of bbs) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { items, work: totalWork, dur, bb: { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }, draw: (ctx, pr) => drawCompiled(ctx, items, pr) };
}

function compileText(p, items, seed, ps, wob, R) {
  const o = p.o;
  const hero = p.t === 'hero';
  const font = FONTS[o.font || (hero ? 'hero' : 'hand')];
  const size = o.size || (hero ? 120 : 60);
  const lines = p.str.split('\n');
  const lh = (o.lh || 1.02) * size;
  const rot = (o.rot || 0) * Math.PI / 180;
  const jit = o.jitter ?? 1;
  const JR = rng(ps * 13 + 5);
  const base = mmul(p.m, tfMatrix({ x: p.x, y: p.y, rot: o.rot || 0 }));
  const sc = mscale(base);
  const dir = [base[0] / sc, base[1] / sc];          // baseline direction in board space
  const nrm = [-dir[1], dir[0]];
  const glyphs = [];
  lines.forEach((line, li) => {
    const lay = layoutLine(font, line, size, o.tracking || 0);
    const ox = o.align === 'center' ? -lay.width / 2 : o.align === 'right' ? -lay.width : 0;
    for (const itg of lay.items) {
      if (itg.ch === ' ' || !itg.g.path || !itg.g.path.commands.length) continue;
      const d = itg.g.getPath(0, 0, size).toPathData(2);
      if (!d) continue;
      const jy = (JR() - 0.5) * size * 0.03 * jit, jr = (JR() - 0.5) * 2.6 * jit, js = 1 + (JR() - 0.5) * 0.05 * jit;
      const gm = mmul(base, tfMatrix({ x: ox + itg.x, y: li * lh + jy, rot: jr, s: js }));
      const amp = (hero ? 0.9 : 0.45) * wob * (o.wob ?? 1);
      const subs = flattenPath(d, gm, hero ? 3.5 : 2.2).map(s => ({ pts: wobblePts(s.pts, amp, seed + 5, 1 / 40), closed: true }));
      if (!subs.length) continue;
      const bb = bboxOf(subs);
      let clen = 0; for (const s of subs) for (let i = 1; i < s.pts.length; i++) clen += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
      glyphs.push({ subs, bb, clen, line: li });
    }
  });
  if (!glyphs.length) return;
  if (!hero) {
    let total = 0;
    for (const gl of glyphs) {
      gl.path = subsToPath2D(gl.subs, true);
      // extents along the baseline for the write-on wipe
      let t0 = Infinity, t1 = -Infinity, n0 = Infinity, n1 = -Infinity;
      for (const s of gl.subs) for (const [x, y] of s.pts) { const t = x * dir[0] + y * dir[1], n = x * nrm[0] + y * nrm[1]; if (t < t0) t0 = t; if (t > t1) t1 = t; if (n < n0) n0 = n; if (n > n1) n1 = n; }
      gl.ext = { t0, t1, n0, n1 };
      gl.len = Math.max(8, gl.clen * 0.5); gl.start = total; total += gl.len;
    }
    const color = o.color || C.ink;
    items.push({ kind: 'text', stage: p.stage, glyphs, color, bold: o.bold ?? size * 0.022 * sc, total, dir, nrm, sWork: total * TEXT_K * 2 * (o.slow ?? 1), fWork: 0, instant: !!o.instant, alpha: o.alpha ?? 1 });
  } else {
    const fillC = o.fill === undefined ? C.red : o.fill;
    const outline = o.outline || fillC || C.ink;
    const w = (o.w ?? Math.max(4, size * 0.05)) * Math.pow(sc, 0.62);
    glyphs.forEach((gl, gi) => {
      const it = { kind: 'shape', stage: p.stage, strokes: [], fill: null, sLen: 0, fWork: 0, alpha: 1, blend: null, instant: !!o.instant, fillInstant: false };
      if (fillC) { it.fill = makeFill(gl.subs, { color: fillC, angle: o.hatch ?? -32, gap: o.gap ?? Math.max(7, size * sc * 0.075), seed: ps + gi * 17, rule: 'nonzero', tone: 0.03, streak: o.streak ?? 0.1 }); it.fWork = it.fill.total * FILL_K * 1.25; }
      gl.subs.forEach((s, i) => { const S = makeStroke(s.pts, { color: outline, w, seed: ps + gi * 7 + i, taper: false, vary: 0.08 }); it.strokes.push(S); it.sLen += S.total; });
      it.sWork = it.sLen * 0.8 * (o.slow ?? 1);
      it.glyphs = null;
      items.push(it);
    });
  }
}

const prog = (p, a, b) => (b <= a ? (p >= a && p > 0 ? 1 : 0) : Math.max(0, Math.min(1, (p - a) / (b - a))));

export function drawCompiled(ctx, items, p) {
  if (p <= 0) return;
  for (const it of items) {
    if (it.kind === 'shape') {
      if (it.fill) {
        const pf = prog(p, it.f0, it.f1);
        if (pf > 0) {
          if (it.blend) ctx.globalCompositeOperation = it.blend;
          if (it.alpha !== 1) ctx.globalAlpha = it.alpha;
          drawFill(ctx, it.fill, pf);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      }
      const psr = prog(p, it.s0, it.s1);
      if (psr > 0 && it.strokes.length) {
        let L = psr * it.sLen;
        for (const S of it.strokes) {
          if (L <= 0) break;
          drawStroke(ctx, S, L / S.total);
          L -= S.total;
        }
      }
    } else if (it.kind === 'text') {
      const q = prog(p, it.s0, it.s1);
      if (q <= 0) continue;
      const L = q * it.total;
      ctx.fillStyle = it.color; ctx.strokeStyle = it.color; ctx.lineJoin = 'round'; ctx.lineWidth = it.bold;
      if (it.alpha !== 1) ctx.globalAlpha = it.alpha;
      for (const gl of it.glyphs) {
        if (gl.start >= L) break;
        const gq = Math.min(1, (L - gl.start) / gl.len);
        if (gq >= 1) { ctx.fill(gl.path, 'nonzero'); if (it.bold > 0.3) ctx.stroke(gl.path); }
        else {
          const e = gl.ext, pad = 6, sl = (e.n1 - e.n0) * 0.18;
          const tq = e.t0 - pad + (e.t1 - e.t0 + 2 * pad + 2 * sl) * gq - sl;
          const P = (t, n) => [it.dir[0] * t + it.nrm[0] * n, it.dir[1] * t + it.nrm[1] * n];
          const a = P(e.t0 - pad - 2, e.n0 - pad), b = P(tq + sl, e.n0 - pad), c = P(tq - sl, e.n1 + pad), d = P(e.t0 - pad - 2, e.n1 + pad);
          ctx.save(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.clip();
          ctx.fill(gl.path, 'nonzero'); if (it.bold > 0.3) ctx.stroke(gl.path);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}
