// Road centreline: curvature + elevation as smooth functions of distance s.
// Positive curvature turns right. Forward at heading th is (sin th, 0, -cos th).
import { mulberry32, smoothstep, clamp, lerp } from './util.js';

export const LANE = 3.6;          // lane width, m
export const EDGE = 3.5;          // white edge line offset
export const PAVE = 4.3;          // pavement half width

export class Road {
  constructor(cfg) {
    this.cfg = cfg;
    const rnd = mulberry32(cfg.seed * 9973 + 1);
    this.ds = 0.5;
    this.s0 = 120;
    this.length = this.s0 + cfg.speed * cfg.duration + 900;
    this.towns = (cfg.towns || []).map((tw) => ({ ...tw, s: this.camS(tw.t) }));

    const curv = [
      { P: 610 + rnd() * 120, a: 1 / 330, ph: rnd() * 6.283 },
      { P: 940 + rnd() * 200, a: 1 / 520, ph: rnd() * 6.283 },
      { P: 330 + rnd() * 60, a: 1 / 900, ph: rnd() * 6.283 },
    ];
    const hills = [
      { P: 720 + rnd() * 100, a: 5.0, ph: rnd() * 6.283 },
      { P: 290 + rnd() * 40, a: 1.6, ph: rnd() * 6.283 },
    ];
    const n = Math.ceil(this.length / this.ds) + 2;
    this.n = n;
    const X = (this.X = new Float64Array(n));
    const Y = (this.Y = new Float64Array(n));
    const Z = (this.Z = new Float64Array(n));
    const TH = (this.TH = new Float64Array(n));
    const K = (this.K = new Float64Array(n));
    const yraw = (s) => hills.reduce((acc, h) => acc + h.a * Math.sin((6.283185 * s) / h.P + h.ph), 0);
    for (let i = 0; i < n; i++) {
      const s = i * this.ds;
      const w = this.townWeight(s);
      K[i] = curv.reduce((acc, c) => acc + c.a * Math.sin((6.283185 * s) / c.P + c.ph), 0) * (1 - w);
      let y = yraw(s);
      for (const tw of this.towns) {
        const wt = this.townWeightOne(s, tw);
        y = lerp(y, yraw(tw.s), wt);
      }
      Y[i] = y;
    }
    for (let i = 1; i < n; i++) {
      TH[i] = TH[i - 1] + K[i - 1] * this.ds;
      X[i] = X[i - 1] + Math.sin(TH[i - 1]) * this.ds;
      Z[i] = Z[i - 1] - Math.cos(TH[i - 1]) * this.ds;
    }
  }

  camS(t) {
    return this.s0 + this.cfg.speed * t;
  }

  townWeightOne(s, tw) {
    const d = Math.abs(s - tw.s);
    return 1 - smoothstep(330, 520, d);
  }

  townWeight(s) {
    let w = 0;
    for (const tw of this.towns) w = Math.max(w, this.townWeightOne(s, tw));
    return w;
  }

  // Linear interpolation of the sampled arrays.
  sample(s) {
    const f = clamp(s / this.ds, 0, this.n - 1.001);
    const i = Math.floor(f);
    const a = f - i;
    return {
      x: lerp(this.X[i], this.X[i + 1], a),
      y: lerp(this.Y[i], this.Y[i + 1], a),
      z: lerp(this.Z[i], this.Z[i + 1], a),
      th: lerp(this.TH[i], this.TH[i + 1], a),
      k: lerp(this.K[i], this.K[i + 1], a),
    };
  }

  // World position of a point at distance s, lateral offset u (right +), height h above the road.
  point(s, u, h = 0) {
    const p = this.sample(s);
    const c = Math.cos(p.th), sn = Math.sin(p.th);
    return [p.x + u * c, p.y + h + this.crown(u), p.z + u * sn];
  }

  // Cross slope: 2% crown on the pavement, flat beyond.
  crown(u) {
    const a = Math.min(Math.abs(u), PAVE);
    return -0.02 * a;
  }

  heading(s) {
    return this.sample(s).th;
  }

  grade(s) {
    return (this.sample(s + 1).y - this.sample(s - 1).y) / 2;
  }

  // Centre-line marking style: 0 double solid, 1 dashed (passing zone).
  passing(s) {
    let maxK = 0;
    for (let d = -60; d <= 220; d += 20) maxK = Math.max(maxK, Math.abs(this.sample(s + d).k));
    const crest = Math.abs(this.sample(s + 120).y - 2 * this.sample(s).y + this.sample(s - 120).y);
    return maxK < 1 / 900 && crest < 1.2 && this.townWeight(s) < 0.01 ? 1 : 0;
  }
}
