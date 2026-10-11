// World: road chunks built lazily around the camera (deterministic per chunk), terrain, forest with LOD,
// roadside props, small towns (each one different), oncoming tractor-trailers.
import * as THREE from 'three';
import { mergeVertices } from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { Builder, roadMatrix } from './geo.js';
import { PAVE } from './road.js';
import { mulberry32, smoothstep, lerp, noise1, fbm2 } from './util.js';

const CHUNK = 40;
const S_WRAP = 2400;          // road (s) attribute wraps here to keep shader noise precise
const M_PLAIN = [0.5, 0.4, 0, 0];
const HI_RANGE = 70, LO_RANGE = 150, VIEW_RANGE = 270;

export function terrainH(road, s, u) {
  const au = Math.abs(u);
  const side = u < 0 ? -1 : 1;
  const tw = road.townWeight(s);
  const base = road.sample(s).y + road.crown(PAVE);
  let prof;
  if (au < 5.0) prof = -0.06 * smoothstep(PAVE, 5.0, au);
  else if (au < 6.3) prof = lerp(-0.06, -0.9, smoothstep(5.0, 6.3, au));
  else if (au < 7.1) prof = -0.9;
  else if (au < 8.6) prof = lerp(-0.9, -0.25, smoothstep(7.1, 8.6, au));
  else {
    const slope = 0.28 + 0.26 * noise1(s / 170 + side * 7.3, 3);
    prof = -0.25 + (au - 8.6) * slope;
  }
  if (au > 5.0) prof = lerp(prof, -0.15 + Math.max(0, au - 30) * 0.02, tw);
  const p = road.point(s, u);
  const w = smoothstep(10, 48, au) * (1 - tw);
  const hills = w * (fbm2(p[0] / 120, p[2] / 120, 5) * 26 + side * noise1(s / 420 + 3.1, 9) * 14);
  return base + prof + hills;
}

function treeGeometries(lo) {
  const rnd = mulberry32(lo ? 43 : 42);
  const hashDisp = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const finish = (parts) => {
    const geos = parts.map(([g, part]) => {
      const ng = g.index ? g.toNonIndexed() : g;
      const n = ng.attributes.position.count;
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', ng.attributes.position);
      out.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(n).fill(part), 1));
      return out;
    });
    let total = 0;
    for (const g of geos) total += g.attributes.position.count;
    const pos = new Float32Array(total * 3), prt = new Float32Array(total);
    let o = 0;
    for (const g of geos) {
      pos.set(g.attributes.position.array, o * 3);
      prt.set(g.attributes.aPart.array, o);
      o += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('aPart', new THREE.BufferAttribute(prt, 1));
    const merged = mergeVertices(out, 1e-4);
    merged.computeVertexNormals();
    return merged;
  };
  const blob = (r, x, y, z, sx = 1, sy = 1, sz = 1, detail = 1) => {
    const g = new THREE.IcosahedronGeometry(r, lo ? 0 : detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
      const d = 0.8 + 0.4 * hashDisp(Math.round(vx * 100), Math.round(vy * 100), Math.round(vz * 100) + r);
      p.setXYZ(i, vx * d * sx + x, vy * d * sy + y, vz * d * sz + z);
    }
    return g;
  };
  const trunkSeg = lo ? 4 : 6;
  const decid = (h, spread, nb) => {
    const parts = [];
    const trunk = new THREE.CylinderGeometry(0.12, 0.24, h * 0.75, trunkSeg, 1, true);
    trunk.translate(0, h * 0.375, 0);
    parts.push([trunk, 0]);
    for (let i = 0; i < nb; i++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * spread;
      const r = 1.6 + rnd() * 1.6;
      parts.push([blob(r, Math.cos(a) * rr, h * (0.55 + rnd() * 0.4), Math.sin(a) * rr, 1.1, 0.85, 1.1), 1]);
    }
    return finish(parts);
  };
  const conifer = (h) => {
    const parts = [];
    const trunk = new THREE.CylinderGeometry(0.08, 0.2, h * 0.5, trunkSeg, 1, true);
    trunk.translate(0, h * 0.25, 0);
    parts.push([trunk, 0]);
    for (let i = 0; i < 4; i++) {
      const ch = h * 0.42, r = (2.6 - i * 0.55) * (h / 16);
      const c = new THREE.ConeGeometry(r, ch, lo ? 6 : 9, 1, true);
      c.translate(0, h * 0.22 + i * h * 0.19 + ch / 2, 0);
      parts.push([c, 1]);
    }
    return finish(parts);
  };
  const bush = () => finish([[blob(1.1, 0, 0.7, 0, 1.3, 0.8, 1.3, 1), 1], [blob(0.8, 0.9, 0.5, 0.4, 1.2, 0.8, 1.2, 1), 1], [blob(0.6, -0.8, 0.45, -0.3, 1.2, 0.9, 1.2, 1), 1]]);
  return [decid(14, 1.5, 3), decid(18, 2.0, 4), decid(10, 1.0, 3), conifer(16), bush()];
}

function fixNormals(geo) {
  const n = geo.attributes.normal;
  for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
}

export class World {
  constructor(road, mats, cfg) {
    this.road = road; this.mats = mats; this.cfg = cfg;
    this.scene = new THREE.Group();
    this.chunks = new Map();
    this.lights = [];
    this.treeHi = treeGeometries(false);
    this.treeLo = treeGeometries(true);
    const rnd = mulberry32(cfg.seed * 31 + 7);
    this.poles = [];
    for (let s = 20 + rnd() * 20; s < road.length - 10; s += 44 + rnd() * 6) this.poles.push(s);
    this.signs = [];
    let last = -1e9;
    for (let s = 200; s < road.length - 200; s += 5) {
      const k0 = Math.abs(road.sample(s).k), k1 = Math.abs(road.sample(s + 110).k);
      if (k0 < 1 / 600 && k1 > 1 / 380 && s - last > 450) {
        this.signs.push({ s, dir: Math.sign(road.sample(s + 110).k) });
        last = s;
      }
    }
    road.towns.forEach((tw, i) => buildTown(road, tw, mats, this.scene, this.lights, mulberry32(cfg.seed * 7 + i * 101 + 3), i));
  }

  update(sCam) {
    const c0 = Math.max(0, Math.floor((sCam - 40) / CHUNK));
    const c1 = Math.floor((sCam + VIEW_RANGE) / CHUNK);
    for (let c = c0; c <= c1; c++) if (!this.chunks.has(c) && (c + 1) * CHUNK < this.road.length) this.chunks.set(c, this.buildChunk(c));
    for (const [c, g] of this.chunks) {
      const s0 = c * CHUNK, s1 = s0 + CHUNK;
      if (s1 < sCam - 60) {
        this.scene.remove(g);
        g.traverse((o) => o.geometry && o.geometry.dispose());
        this.chunks.delete(c);
        continue;
      }
      g.visible = s1 > sCam - 30 && s0 < sCam + VIEW_RANGE;
      const d = s0 - sCam;
      if (g.userData.hi) g.userData.hi.visible = d < HI_RANGE;
      if (g.userData.lo) g.userData.lo.visible = d >= HI_RANGE && d < LO_RANGE;
    }
  }

  buildChunk(c) {
    const { road, mats } = this;
    const rnd = mulberry32(this.cfg.seed * 100003 + c * 7919 + 13);
    const s0 = c * CHUNK, s1 = s0 + CHUNK;
    const sOff = Math.floor(s0 / S_WRAP) * S_WRAP;
    const O = road.point(s0, 0).map((v) => Math.round(v));
    const loc = (p) => [p[0] - O[0], p[1] - O[1], p[2] - O[2]];
    const g = new THREE.Group();
    g.position.set(O[0], O[1], O[2]);

    // road surface
    {
      const us = [-PAVE, -3.7, -2.2, -0.3, 0, 0.3, 2.2, 3.7, PAVE];
      const pos = [], su = [], zone = [], idx = [];
      const rows = CHUNK + 1;
      for (let i = 0; i < rows; i++) {
        const s = s0 + i;
        const z = road.passing(s);
        for (const u of us) { pos.push(...loc(road.point(s, u))); su.push(s - sOff, u); zone.push(z); }
      }
      const nc = us.length;
      for (let i = 0; i < rows - 1; i++)
        for (let j = 0; j < nc - 1; j++) {
          const a = i * nc + j, b = a + 1, d = a + nc, e = d + 1;
          idx.push(a, b, d, b, e, d);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aSU', new THREE.Float32BufferAttribute(su, 2));
      geo.setAttribute('aZone', new THREE.Float32BufferAttribute(zone, 1));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      fixNormals(geo);
      g.add(new THREE.Mesh(geo, mats.road));
    }

    // terrain
    for (const side of [-1, 1]) {
      const us = [PAVE, 5.0, 5.7, 6.3, 7.1, 7.8, 8.6, 10, 12.5, 16, 21, 28, 37, 48, 62, 80].map((u) => u * side);
      const pos = [], su = [], idx = [];
      const step = 2, rows = CHUNK / step + 1;
      for (let i = 0; i < rows; i++) {
        const s = s0 + i * step;
        for (const u of us) {
          const p = road.point(s, u);
          p[1] = terrainH(road, s, u);
          pos.push(...loc(p));
          su.push(s - sOff, u);
        }
      }
      const nc = us.length;
      for (let i = 0; i < rows - 1; i++)
        for (let j = 0; j < nc - 1; j++) {
          const a = i * nc + j, b = a + 1, d = a + nc, e = d + 1;
          if (side > 0) idx.push(a, b, d, b, e, d);
          else idx.push(a, d, b, b, d, e);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('aSU', new THREE.Float32BufferAttribute(su, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      fixNormals(geo);
      g.add(new THREE.Mesh(geo, mats.terrain));
    }

    // forest: placement, then baked hi/lo meshes
    const trees = [];
    const ribbon = [];
    const place = (s, u, k, scale) => {
      const p = road.point(s, u);
      p[1] = terrainH(road, s, u) - 0.25;
      trees.push({ p: loc(p), k, scale, rot: rnd() * Math.PI * 2, seed: rnd(), s, u });
    };
    for (const side of [-1, 1]) {
      for (let s = s0; s < s1; s += 2.2 + rnd() * 1.5) {
        if (road.townWeight(s) > 0.3 && rnd() > 0.06) continue;
        place(s, side * (8.8 + rnd() * 2.5), 4, 0.7 + rnd() * 0.8);
      }
      for (let s = s0; s < s1; s += 4.2) {
        for (let u = 10; u < 34;) {
          const tw = road.townWeight(s);
          const uu = u + rnd() * 4.0, ss = s + rnd() * 4.0;
          u += 4.4;
          if (tw > 0.2 && rnd() > 0.04) continue;
          if (rnd() < 0.12) continue;
          const r = rnd();
          place(ss, side * uu, r < 0.3 ? 0 : r < 0.55 ? 1 : r < 0.72 ? 2 : 3, 0.75 + rnd() * 0.6);
        }
      }
      if (road.townWeight(s0) < 0.95) {
        for (const [uL, hMin, hMax] of [[36, 13, 21], [58, 15, 26]]) {
          const u = side * uL, N = CHUNK / 2;
          for (let i = 0; i <= N; i++) {
            const s = s0 + (i / N) * CHUNK;
            const p = road.point(s, u);
            const gnd = terrainH(road, s, u) - 0.5;
            const crown = gnd + lerp(hMin, hMax, 0.5 + 0.35 * noise1(s * 0.21 + uL, 2) + 0.3 * (rnd() - 0.5));
            ribbon.push({ p: loc(p), gnd: gnd - O[1], crown: crown - O[1], first: i === 0 });
          }
        }
      }
    }
    trees.sort((a, b) => a.s + Math.abs(a.u) * 0.5 - (b.s + Math.abs(b.u) * 0.5));
    const bake = (geos) => {
      let nv = 0, ni = 0;
      for (const t of trees) { nv += geos[t.k].attributes.position.count; ni += geos[t.k].index.count; }
      if (!nv) return null;
      const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), Ol = new Float32Array(nv * 3);
      const PR = new Float32Array(nv), SD = new Float32Array(nv), IDX = new Uint32Array(ni);
      let ov = 0, oi = 0;
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3(), nm = new THREE.Matrix3();
      const up = new THREE.Vector3(0, 1, 0);
      for (const t of trees) {
        const tg = geos[t.k];
        const gp = tg.attributes.position, gn = tg.attributes.normal, ga = tg.attributes.aPart, gi = tg.index;
        q.setFromAxisAngle(up, t.rot);
        sc.set(t.scale, t.scale * (0.9 + t.seed * 0.25), t.scale);
        m.compose(v.set(...t.p), q, sc);
        nm.getNormalMatrix(m);
        for (let i = 0; i < gi.count; i++) IDX[oi++] = gi.getX(i) + ov;
        for (let i = 0; i < gp.count; i++) {
          v.fromBufferAttribute(gp, i);
          Ol[(ov + i) * 3] = v.x + t.seed * 17; Ol[(ov + i) * 3 + 1] = v.y; Ol[(ov + i) * 3 + 2] = v.z;
          v.applyMatrix4(m);
          P[(ov + i) * 3] = v.x; P[(ov + i) * 3 + 1] = v.y; P[(ov + i) * 3 + 2] = v.z;
          v.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize();
          N[(ov + i) * 3] = v.x; N[(ov + i) * 3 + 1] = v.y; N[(ov + i) * 3 + 2] = v.z;
          PR[ov + i] = ga.getX(i);
          SD[ov + i] = t.seed;
        }
        ov += gp.count;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      geo.setAttribute('aLocal', new THREE.BufferAttribute(Ol, 3));
      geo.setAttribute('aPart', new THREE.BufferAttribute(PR, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(SD, 1));
      geo.setIndex(new THREE.BufferAttribute(IDX, 1));
      geo.computeBoundingSphere();
      return new THREE.Mesh(geo, mats.tree);
    };
    g.userData.hi = bake(this.treeHi);
    g.userData.lo = bake(this.treeLo);
    if (g.userData.hi) g.add(g.userData.hi);
    if (g.userData.lo) g.add(g.userData.lo);

    if (ribbon.length) {
      const pos = [], nrm = [], lc = [], idx = [];
      let v = 0;
      for (let i = 0; i < ribbon.length - 1; i++) {
        const a = ribbon[i], b = ribbon[i + 1];
        if (b.first) continue;
        for (const q of [a, b]) {
          pos.push(q.p[0], q.gnd, q.p[2], q.p[0], q.crown, q.p[2]);
          nrm.push(0, 1, 0, 0, 1, 0);
          lc.push(q.p[0], 0, q.p[2], q.p[0], q.crown - q.gnd, q.p[2]);
        }
        idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
        v += 4;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('aLocal', new THREE.Float32BufferAttribute(lc, 3));
      geo.setIndex(idx);
      geo.computeBoundingSphere();
      g.add(new THREE.Mesh(geo, mats.treeline));
    }

    // props: poles, delineators, curve signs (built in world space, then shifted to the chunk origin)
    {
      const b = new Builder();
      const wood = [0.10, 0.08, 0.06];
      const lm = (s, u, h = 0, ry = 0) => {
        const m = roadMatrix(road, s, u, h, ry);
        m.elements[12] -= O[0]; m.elements[13] -= O[1]; m.elements[14] -= O[2];
        return m;
      };
      const gh = (s, u) => terrainH(road, s, u) - road.point(s, u)[1];
      for (const s of this.poles) {
        if (s < s0 || s >= s1) continue;
        const m = lm(s, 9.2, gh(s, 9.2));
        b.cyl(m, 0, 0, -0.5, 10.5, 0.15, 0.12, 7, wood, [0.6, 0.3, 0, 0]);
        b.box(m, -0.3, 9.9, 0, 2.6, 0.13, 0.13, wood, [0.6, 0.3, 0, 0]);
        for (const x of [-1.4, -0.4, 0.75]) b.cyl(m, x, 0, 10.0, 10.25, 0.05, 0.04, 5, [0.25, 0.25, 0.22], [0.3, 0.8, 0, 0]);
      }
      for (let s = Math.ceil(s0 / 53) * 53; s < s1; s += 53) {
        if (road.townWeight(s) > 0.3) continue;
        for (const side of [-1, 1]) {
          const u = side * 5.25;
          const m = lm(s, u, gh(s, u));
          b.box(m, 0, 0.6, 0, 0.09, 1.2, 0.05, [0.55, 0.55, 0.55], [0.5, 0.4, 0.1, 0]);
          b.box(m, 0, 1.08, -0.03, 0.08, 0.16, 0.01, side > 0 ? [0.6, 0.6, 0.6] : [0.6, 0.45, 0.08], [0.3, 0.4, 25.0, 0], 0, ['nz']);
        }
      }
      for (const sg of this.signs) {
        if (sg.s < s0 || sg.s >= s1) continue;
        const u = 5.6;
        const m = lm(sg.s, u, gh(sg.s, u));
        b.box(m, 0, 1.0, 0.03, 0.07, 2.2, 0.07, [0.3, 0.3, 0.3], [0.4, 0.6, 0, 0]);
        const h = 0.53, y = 2.25;
        const vv = (x, yy) => new THREE.Vector3(x, yy, -0.01).applyMatrix4(m);
        b.quad(vv(0, y - h), vv(h, y), vv(0, y + h), vv(-h, y), [0.6, 0.45, 0.04], [0.35, 0.5, 1.6, sg.dir], 1,
          [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]);
      }
      if (b.count) g.add(new THREE.Mesh(b.geometry(), mats.prop));
      // wires from each pole in this chunk to the next one
      const pts = [];
      for (let i = 0; i < this.poles.length - 1; i++) {
        const sA = this.poles[i], sB = this.poles[i + 1];
        if (sA < s0 || sA >= s1) continue;
        for (const x of [-1.4, -0.4, 0.75]) {
          const hA = gh(sA, 9.2) + 10.2, hB = gh(sB, 9.2) + 10.2;
          for (let k = 0; k < 10; k++)
            for (const kk of [k, k + 1]) {
              const f = kk / 10;
              pts.push(...loc(road.point(lerp(sA, sB, f), 9.2 + x, lerp(hA, hB, f) - 4 * f * (1 - f) * 0.9)));
            }
        }
      }
      if (pts.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        g.add(new THREE.LineSegments(geo, mats.wire));
      }
    }
    this.scene.add(g);
    return g;
  }
}

// A small sleeping town: houses, a white church with a flood-lit steeple, an intersection with a blinking
// amber signal, a closed gas station, sodium street lights. Layout varies per town.
function buildTown(road, tw, mats, scene, lights, rnd, index) {
  const b = new Builder();
  const S = (ds) => tw.s + ds;
  const gh = (s, u) => terrainH(road, s, u) - road.point(s, u)[1];
  const WARM = [1.0, 0.72, 0.42], SODIUM = [1.0, 0.52, 0.16];
  const addLight = (pos, col, I, opts = {}) =>
    lights.push({ pos, col: col.map((c) => c * I), dir: opts.dir || [0, -1, 0], type: 0, cone: opts.cone || [-2, -1], vol: opts.vol ?? true, anim: opts.anim || null, range: opts.range || 420 });

  const churchSide = rnd() < 0.5 ? 1 : -1;
  const churchDs = -40 - rnd() * 30;
  const gasDs = 30 + rnd() * 30;
  const hasSignal = index % 2 === 0 || rnd() < 0.4;
  const occupied = [[churchDs, churchSide, 26], [gasDs, -churchSide, 26], [0, 1, 12], [0, -1, 12]];

  // cross road at the intersection
  for (const side of [-1, 1]) {
    for (let u0 = 4.3; u0 < 70; u0 += 6) {
      const corners = [[-3.6, u0], [3.6, u0], [3.6, u0 + 6], [-3.6, u0 + 6]].map(([ds, u]) => {
        const p = road.point(S(ds), side * u);
        p[1] = terrainH(road, S(ds), side * u) + 0.04;
        return new THREE.Vector3(...p);
      });
      b.quad(...corners, [0.045, 0.045, 0.048], [0.12, 1.0, 0, 0]);
    }
  }

  // houses
  const palettes = [[0.30, 0.30, 0.29], [0.27, 0.24, 0.20], [0.21, 0.23, 0.24], [0.29, 0.27, 0.24], [0.19, 0.13, 0.10], [0.22, 0.25, 0.28]];
  let lit = 0;
  for (const side of [-1, 1]) {
    for (let ds = -225 + rnd() * 20; ds < 230; ds += 26 + rnd() * 26) {
      if (occupied.some(([o, sd, r]) => sd === side && Math.abs(ds - o) < r)) continue;
      if (rnd() < 0.18) continue;
      const s = S(ds), u = side * (18 + rnd() * 7);
      const m = roadMatrix(road, s, u, gh(s, u));
      const W = 7 + rnd() * 4, D = 8 + rnd() * 3, two = rnd() < 0.5, H = two ? 5.6 : 3.2;
      const col = palettes[Math.floor(rnd() * palettes.length)];
      const fx = -side * D / 2;
      b.box(m, 0, H / 2 + 0.4, 0, D, H, W, col, [0.55, 0.35, 0, 0]);
      b.box(m, 0, 0.2, 0, D + 0.2, 0.4, W + 0.2, [0.2, 0.2, 0.2], M_PLAIN);
      b.gable(m, 0, H + 0.4, 0, D, 2.2 + rnd() * 1.2, W, [0.05, 0.05, 0.055], [0.3, 0.9, 0, 0]);
      b.box(m, fx - side * 1.1, 2.9, 0, 2.2, 0.15, W * 0.6, [0.08, 0.08, 0.08], [0.4, 0.8, 0, 0]);
      for (const z of [-W * 0.28, W * 0.28]) b.box(m, fx - side * 2.05, 1.6, z, 0.12, 2.5, 0.12, [0.45, 0.45, 0.42], M_PLAIN);
      for (const y of two ? [1.7, 4.3] : [1.7])
        for (const z of [-W * 0.32, W * 0.32]) {
          const on = lit < 3 && rnd() < 0.12;
          if (on) lit++;
          const v = (dz, dy) => new THREE.Vector3(fx - side * 0.03, y + dy, z + dz).applyMatrix4(m);
          b.quad(v(-0.5, -0.65), v(0.5, -0.65), v(0.5, 0.65), v(-0.5, 0.65), on ? [1.0, 0.62, 0.3] : [0.01, 0.01, 0.01],
            [0.1, 1, 0, on ? 0.6 + rnd() * 0.6 : 0], 2);
        }
      {
        const v = (dz, dy) => new THREE.Vector3(fx - side * 0.03, 0.4 + dy, dz).applyMatrix4(m);
        b.quad(v(-0.5, 0), v(0.5, 0), v(0.5, 2.1), v(-0.5, 2.1), [0.07, 0.05, 0.04], [0.5, 0.4, 0, 0]);
      }
      if (rnd() < 0.3) {
        const lp = new THREE.Vector3(fx - side * 0.15, 2.5, 0.8).applyMatrix4(m);
        b.box(m, fx - side * 0.12, 2.5, 0.8, 0.12, 0.2, 0.12, [1.0, 0.75, 0.45], [0, 0, 0, 40], 4);
        addLight([lp.x, lp.y, lp.z], WARM, 2.0, { range: 260 });
      }
      const mu = side * 5.6;
      const mm = roadMatrix(road, s + 3, mu, gh(s + 3, mu));
      b.box(mm, 0, 0.55, 0, 0.08, 1.1, 0.08, [0.12, 0.1, 0.08], M_PLAIN);
      b.box(mm, 0, 1.2, 0, 0.25, 0.25, 0.5, [0.10, 0.10, 0.11], [0.3, 0.8, 0, 0]);
    }
  }

  // church: local +z points away from the road on the church's side
  {
    const s = S(churchDs), u = churchSide * (22 + rnd() * 4);
    const m = roadMatrix(road, s, u, gh(s, u), churchSide > 0 ? Math.PI / 2 : -Math.PI / 2);
    const white = [0.55, 0.55, 0.53];
    b.box(m, 0, 3.8, 3, 11, 7.2, 20, white, [0.5, 0.35, 0, 0]);
    b.gable(m, 0, 7.4, 3, 11, 4.2, 20, [0.07, 0.07, 0.075], [0.3, 0.9, 0, 0]);
    b.box(m, 0, 6.5, -8.2, 3.8, 13, 3.8, white, [0.5, 0.35, 0, 0]);
    b.box(m, 0, 14.6, -8.2, 3.2, 3.2, 3.2, white, [0.5, 0.35, 0, 0]);
    for (const [dx, dz] of [[0, -1.62], [0, 1.62], [-1.62, 0], [1.62, 0]]) {
      const v = (a, y) => new THREE.Vector3(dx === 0 ? a : dx, y, dz === 0 ? -8.2 + a : -8.2 + dz).applyMatrix4(m);
      b.quad(v(-0.6, 13.6), v(0.6, 13.6), v(0.6, 15.8), v(-0.6, 15.8), [0.02, 0.02, 0.02], [0.6, 0.2, 0, 0]);
    }
    b.box(m, 0, 16.35, -8.2, 3.6, 0.3, 3.6, white, M_PLAIN);
    b.pyramid(m, 0, 16.5, -8.2, 3.2, 11.5, white, [0.45, 0.4, 0, 0]);
    b.box(m, 0, 28.4, -8.2, 0.08, 1.2, 0.08, [0.5, 0.5, 0.5], M_PLAIN);
    b.box(m, 0, 28.6, -8.2, 0.6, 0.08, 0.08, [0.5, 0.5, 0.5], M_PLAIN);
    for (let z = -3; z <= 9; z += 4)
      for (const x of [-5.53, 5.53]) {
        const v = (dz, dy) => new THREE.Vector3(x, 1.6 + dy, z + dz).applyMatrix4(m);
        const glow = z === 5 && x < 0;
        b.quad(v(-0.55, 0), v(0.55, 0), v(0.55, 3.2), v(-0.55, 3.2), glow ? [0.9, 0.55, 0.3] : [0.01, 0.01, 0.012], [0.1, 1, 0, glow ? 0.3 : 0], 2);
      }
    {
      const v = (dx, dy) => new THREE.Vector3(dx, 0.2 + dy, -10.13).applyMatrix4(m);
      b.quad(v(-0.8, 0), v(0.8, 0), v(0.8, 2.6), v(-0.8, 2.6), [0.08, 0.05, 0.035], [0.5, 0.4, 0, 0]);
    }
    // gravel lot in front and a few gravestones up the slope behind
    for (let i = 0; i < 14; i++) {
      const gx = (rnd() - 0.5) * 14, gz = 16 + rnd() * 14;
      b.box(m, gx, 0.45, gz, 0.6, 0.9 + rnd() * 0.3, 0.15, [0.3, 0.3, 0.29], [0.6, 0.3, 0, 0]);
    }
    const fl = new THREE.Vector3(0, 0.4, -14.5).applyMatrix4(m);
    const target = new THREE.Vector3(0, 15, -8.2).applyMatrix4(m);
    b.box(m, 0, 0.25, -14.5, 0.35, 0.3, 0.35, [0.1, 0.1, 0.1], M_PLAIN);
    b.box(m, 0, 0.42, -14.35, 0.25, 0.04, 0.25, [1.0, 0.9, 0.75], [0, 0, 0, 30], 4);
    addLight([fl.x, fl.y, fl.z], [1.0, 0.86, 0.68], 240, { dir: target.clone().sub(fl).normalize().toArray(), cone: [Math.cos(0.42), Math.cos(0.22)], range: 520 });
  }

  // blinking amber signal over the intersection
  if (hasSignal) {
    const s = S(0);
    const m = roadMatrix(road, s, 0, 6.6);
    b.box(m, 0, 0, 0, 0.36, 0.95, 0.36, [0.25, 0.2, 0.03], [0.4, 0.6, 0, 0]);
    for (const [x, z] of [[0, -0.19], [0, 0.19], [-0.19, 0], [0.19, 0]]) b.box(m, x, -0.15, z, x ? 0.02 : 0.2, 0.2, z ? 0.02 : 0.2, [1.0, 0.6, 0.08], [0, 0, 0, 160], 6);
    addLight(road.point(s, 0, 6.45), [1.0, 0.55, 0.08], 22, { anim: 'blink', range: 520 });
    const pts = [];
    for (const side of [-1, 1]) {
      pts.push(...road.point(s, 0, 7.1), ...road.point(s, side * 9.0, 7.6));
      const mm = roadMatrix(road, s, side * 9.0, gh(s, side * 9));
      b.cyl(mm, 0, 0, -0.4, 8.2 - gh(s, side * 9), 0.15, 0.12, 7, [0.1, 0.08, 0.06], [0.6, 0.3, 0, 0]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(geo, mats.wire));
  }

  // sodium street lights
  for (let ds = -180 + rnd() * 30, side = rnd() < 0.5 ? 1 : -1; ds < 190; ds += 55 + rnd() * 40, side = -side) {
    const s = S(ds), u = side * 7.4;
    const m = roadMatrix(road, s, u, gh(s, u));
    b.cyl(m, 0, 0, -0.5, 9.4, 0.15, 0.12, 7, [0.1, 0.08, 0.06], [0.6, 0.3, 0, 0]);
    b.box(m, -side * 1.3, 9.0, 0, 2.6, 0.08, 0.08, [0.3, 0.3, 0.3], [0.4, 0.6, 0, 0]);
    b.box(m, -side * 2.7, 8.95, 0, 0.75, 0.2, 0.32, [0.15, 0.15, 0.15], [0.4, 0.6, 0, 0]);
    b.box(m, -side * 2.7, 8.83, 0, 0.55, 0.04, 0.24, [1.0, 0.55, 0.18], [0, 0, 0, 220], 4);
    addLight(road.point(s, u - side * 2.7, gh(s, u) + 8.6), SODIUM, 34, { range: 520 });
  }

  // closed gas station on the other side from the church
  {
    const gside = -churchSide;
    const s = S(gasDs), u = gside * 24;
    const m = roadMatrix(road, s, u, gh(s, u));
    const concrete = [0.22, 0.22, 0.21];
    b.box(m, 0, 0.08, 0, 13, 0.16, 20, concrete, [0.3, 0.7, 0, 0]);
    b.box(m, 0, 5.3, 0, 10, 0.9, 17, [0.45, 0.45, 0.45], [0.4, 0.5, 0, 0]);
    b.box(m, 0, 5.8, 0, 10.2, 0.12, 17.2, [0.12, 0.05, 0.04], [0.4, 0.5, 0, 0]);
    for (const x of [-3.5, 3.5]) for (const z of [-6, 6]) b.box(m, x, 2.45, z, 0.35, 4.8, 0.35, [0.42, 0.42, 0.42], M_PLAIN);
    for (const z of [-6, 6]) {
      b.box(m, 0, 0.3, z, 1.2, 0.3, 4.0, concrete, M_PLAIN);
      for (const dz of [-1.1, 1.1]) b.box(m, 0, 1.1, z + dz, 0.6, 1.6, 0.9, [0.16, 0.17, 0.18], [0.35, 0.8, 0, 0]);
    }
    const onA = Math.floor(rnd() * 4), onB = (onA + 2) % 4;
    [[-2.5, -4], [2.5, -4], [-2.5, 4], [2.5, 4]].forEach(([x, z], i) => {
      const on = i === onA || i === onB;
      b.box(m, x, 4.83, z, 0.5, 0.04, 1.6, [0.75, 0.92, 1.0], [0, 0, 0, on ? 20 : 0.3], on && i === onA ? 5 : 4);
      if (on) {
        const lp = new THREE.Vector3(x, 4.6, z).applyMatrix4(m);
        addLight(lp.toArray(), [0.72, 0.9, 1.0], 8, { anim: i === onA ? 'flicker' : null, range: 450 });
      }
    });
    const st = roadMatrix(road, s + 2, u + gside * 14, gh(s + 2, u + gside * 14));
    const fx = -gside * 4.53;
    b.box(st, 0, 2.2, 0, 9, 4.4, 14, [0.38, 0.36, 0.33], [0.5, 0.4, 0, 0]);
    b.box(st, 0, 4.6, 0, 9.4, 0.4, 14.4, [0.1, 0.1, 0.1], M_PLAIN);
    for (const z of [-4.5, -1.5, 2.5, 5.0]) {
      const v = (dz, dy) => new THREE.Vector3(fx, 0.9 + dy, z + dz).applyMatrix4(st);
      const dim = z === -1.5;
      b.quad(v(-1.2, 0), v(1.2, 0), v(1.2, 1.9), v(-1.2, 1.9), dim ? [0.6, 0.8, 1.0] : [0.01, 0.01, 0.012], [0.08, 1, 0, dim ? 0.18 : 0], 2);
    }
    b.box(st, -gside * 5.05, 0.95, 0.8, 0.8, 1.9, 1.0, [0.08, 0.08, 0.09], M_PLAIN);
    b.box(st, -gside * 5.46, 1.1, 0.8, 0.02, 1.4, 0.7, [0.9, 0.25, 0.2], [0, 0, 0, 3.5], 4);
    const vp = new THREE.Vector3(-gside * 6.0, 1.2, 0.8).applyMatrix4(st);
    addLight(vp.toArray(), [0.9, 0.35, 0.3], 0.9, { vol: false, range: 300 });
  }

  // a few yard trees are placed by the chunk forest; here: fences along some lots
  scene.add(new THREE.Mesh(b.geometry(), mats.prop));
}

export function buildTruck(mats, colorIdx) {
  const b = new Builder();
  const I = new THREE.Matrix4();
  const paints = [[0.22, 0.025, 0.02], [0.5, 0.5, 0.48], [0.03, 0.045, 0.11], [0.06, 0.06, 0.065]];
  const paint = paints[colorIdx % paints.length];
  const PM = [0.25, 1.0, 0, 0];
  const chrome = [0.35, 0.35, 0.35], CM = [0.15, 1.0, 0, 0];
  const dark = [0.02, 0.02, 0.022];
  // tractor
  b.box(I, 0, 0.62, 0.18, 2.5, 0.38, 0.3, chrome, CM);
  b.box(I, 0, 1.45, 0.42, 1.25, 1.25, 0.12, chrome, CM);
  b.box(I, 0, 1.55, 1.7, 1.55, 1.1, 2.6, paint, PM);
  for (const x of [-1.0, 1.0]) b.box(I, x, 1.05, 1.5, 0.55, 0.5, 2.2, paint, PM);
  b.box(I, 0, 2.35, 4.0, 2.45, 2.5, 2.2, paint, PM);
  b.box(I, 0, 2.5, 6.0, 2.45, 2.9, 1.8, paint, PM);
  b.box(I, 0, 0.55, 3.5, 2.3, 0.9, 6.0, dark, M_PLAIN);
  // windshield (dark glass) and mirrors
  {
    const v = (x, y, z) => new THREE.Vector3(x, y, z);
    b.quad(v(1.15, 2.6, 2.88), v(-1.15, 2.6, 2.88), v(-1.1, 3.45, 3.05), v(1.1, 3.45, 3.05), [0.01, 0.01, 0.012], [0.05, 1, 0, 0]);
  }
  for (const x of [-1.45, 1.45]) b.box(I, x, 2.6, 3.0, 0.08, 0.9, 0.3, chrome, CM);
  const wheel = (bb, x, z) => {
    const m = new THREE.Matrix4().makeTranslation(x, 0.52, z).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    bb.cyl(m, 0, 0, -0.3, 0.3, 0.52, 0.52, 12, [0.015, 0.015, 0.015], [0.6, 0.3, 0, 0]);
    bb.cyl(m, 0, 0, x > 0 ? 0.3 : -0.31, x > 0 ? 0.31 : -0.3, 0.3, 0.05, 8, [0.3, 0.3, 0.3], CM);
  };
  for (const x of [-1.05, 1.05]) { wheel(b, x, 1.5); wheel(b, x, 5.6); wheel(b, x, 6.9); }
  for (const x of [-1.15, 1.15]) {
    const m = new THREE.Matrix4().makeTranslation(x, 0.85, 3.9).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    b.cyl(m, 0, 0, -0.75, 0.75, 0.32, 0.32, 10, chrome, CM);
  }
  // headlights (view-dependent glow), amber turn lamps
  for (const x of [-0.95, 0.95]) {
    b.box(I, x, 1.12, 0.36, 0.34, 0.22, 0.05, [1.0, 0.9, 0.75], [0, 0, 0, 350], 3, ['nz']);
    b.box(I, x * 1.22, 1.12, 0.38, 0.14, 0.12, 0.05, [1.0, 0.55, 0.1], [0, 0, 0, 60], 3, ['nz']);
  }
  // five amber clearance lamps on the cab roof, and mirror lamps
  for (let i = -2; i <= 2; i++) b.box(I, i * 0.3, 3.64, 2.98, 0.11, 0.07, 0.07, [1.0, 0.55, 0.1], [0, 0, 0, 60], 4);
  for (const x of [-1.45, 1.45]) b.box(I, x, 3.1, 2.9, 0.06, 0.06, 0.06, [1.0, 0.55, 0.1], [0, 0, 0, 40], 4);
  // trailer: separate mesh, local origin at its front face so it can follow the curve
  const t = new Builder();
  const tl = 14.6;
  t.box(I, 0, 2.78, tl / 2, 2.6, 2.95, tl, [0.48, 0.48, 0.47], [0.35, 0.8, 0, 0]);
  t.box(I, 0, 1.0, tl - 2.0, 2.4, 0.9, 3.0, dark, M_PLAIN);
  t.box(I, 0, 1.27, tl / 2, 2.62, 0.12, tl, [0.12, 0.12, 0.12], [0.4, 0.6, 0, 0]);
  for (let z = 0.6; z < tl; z += 0.6) for (const x of [-1.305, 1.305]) t.box(I, x, 2.78, z, 0.02, 2.9, 0.06, [0.42, 0.42, 0.41], [0.3, 0.8, 0, 0]);
  for (const x of [-1.05, 1.05]) { wheel(t, x, tl - 2.6); wheel(t, x, tl - 1.3); }
  for (const x of [-0.8, 0.8]) t.box(I, x, 0.75, 3.5, 0.12, 1.0, 0.12, [0.1, 0.1, 0.1], M_PLAIN);
  for (let z = 0.3; z < tl; z += 3.0)
    for (const x of [-1.31, 1.31]) t.box(I, x, 1.4, z, 0.04, 0.08, 0.1, [1.0, 0.55, 0.1], [0, 0, 0, 40], 4);
  for (let i = -1; i <= 1; i++) t.box(I, i * 0.4, 4.27, 0.05, 0.1, 0.06, 0.06, [1.0, 0.55, 0.1], [0, 0, 0, 90], 4);
  const trailer = new THREE.Mesh(t.geometry(), mats.prop);
  trailer.matrixAutoUpdate = false;
  trailer.frustumCulled = false;
  const tractor = new THREE.Mesh(b.geometry(), mats.prop);
  tractor.matrixAutoUpdate = false;
  tractor.frustumCulled = false;
  return { tractor, trailer };
}
