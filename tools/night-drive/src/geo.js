// Tiny mesh builder for props: boxes, cylinders, quads with per-vertex material data.
import * as THREE from 'three';

// mat: [rough, spec, retro, emissive], kind: 0 plain, 1 curve sign, 2 window, 3 headlamp, 4 omni lamp
export class Builder {
  constructor() {
    this.pos = []; this.nrm = []; this.col = []; this.mat = []; this.kind = []; this.uv = []; this.idx = [];
  }
  get count() { return this.pos.length / 3; }

  // Quad from 4 corners (counter-clockwise seen from the front), flat normal.
  quad(a, b, c, d, color, mat, kind = 0, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
    const base = this.count;
    for (const [i, p] of [a, b, c, d].entries()) {
      this.pos.push(p.x, p.y, p.z);
      this.nrm.push(n.x, n.y, n.z);
      this.col.push(...color);
      this.mat.push(...mat);
      this.kind.push(kind);
      this.uv.push(...uv[i]);
    }
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // Axis-aligned box in local space transformed by matrix m.
  box(m, cx, cy, cz, sx, sy, sz, color, mat, kind = 0, faces = 'all', faceKind = null) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = (x, y, z) => new THREE.Vector3(cx + x, cy + y, cz + z).applyMatrix4(m);
    const F = {
      px: [v(hx, -hy, hz), v(hx, -hy, -hz), v(hx, hy, -hz), v(hx, hy, hz)],
      nx: [v(-hx, -hy, -hz), v(-hx, -hy, hz), v(-hx, hy, hz), v(-hx, hy, -hz)],
      py: [v(-hx, hy, hz), v(hx, hy, hz), v(hx, hy, -hz), v(-hx, hy, -hz)],
      ny: [v(-hx, -hy, -hz), v(hx, -hy, -hz), v(hx, -hy, hz), v(-hx, -hy, hz)],
      pz: [v(-hx, -hy, hz), v(hx, -hy, hz), v(hx, hy, hz), v(-hx, hy, hz)],
      nz: [v(hx, -hy, -hz), v(-hx, -hy, -hz), v(-hx, hy, -hz), v(hx, hy, -hz)],
    };
    for (const k of Object.keys(F)) {
      if (faces !== 'all' && !faces.includes(k)) continue;
      const kk = faceKind && faceKind[k] !== undefined ? faceKind[k] : kind;
      this.quad(...F[k], color, mat, kk);
    }
  }

  // Vertical cylinder (open ends) from y0 to y1.
  cyl(m, cx, cz, y0, y1, r0, r1, seg, color, mat, kind = 0) {
    const base = this.count;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (const [y, r] of [[y0, r0], [y1, r1]]) {
        const p = new THREE.Vector3(cx + ca * r, y, cz + sa * r).applyMatrix4(m);
        const n = new THREE.Vector3(ca, (r0 - r1) / (y1 - y0), sa).normalize().transformDirection(m);
        this.pos.push(p.x, p.y, p.z); this.nrm.push(n.x, n.y, n.z);
        this.col.push(...color); this.mat.push(...mat); this.kind.push(kind); this.uv.push(i / seg, y === y0 ? 0 : 1);
      }
    }
    for (let i = 0; i < seg; i++) {
      const a = base + i * 2;
      this.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  // Gable roof prism along local z.
  gable(m, cx, cy, cz, sx, h, sz, color, mat) {
    const v = (x, y, z) => new THREE.Vector3(cx + x, cy + y, cz + z).applyMatrix4(m);
    const hx = sx / 2 + 0.25, hz = sz / 2 + 0.25;
    this.quad(v(-hx, 0, hz), v(0, h, hz), v(0, h, -hz), v(-hx, 0, -hz), color, mat);
    this.quad(v(hx, 0, -hz), v(0, h, -hz), v(0, h, hz), v(hx, 0, hz), color, mat);
    const wall = color.map((c) => c);
    const t1 = [v(-sx / 2, 0, sz / 2), v(sx / 2, 0, sz / 2), v(0, h, sz / 2)];
    const t2 = [v(sx / 2, 0, -sz / 2), v(-sx / 2, 0, -sz / 2), v(0, h, -sz / 2)];
    for (const t of [t1, t2]) this.quad(t[0], t[1], t[2], t[2], wall, mat);
  }

  // Square pyramid (steeple spire).
  pyramid(m, cx, cy, cz, w, h, color, mat) {
    const v = (x, y, z) => new THREE.Vector3(cx + x, cy + y, cz + z).applyMatrix4(m);
    const a = w / 2, top = v(0, h, 0);
    const c = [v(-a, 0, a), v(a, 0, a), v(a, 0, -a), v(-a, 0, -a)];
    for (let i = 0; i < 4; i++) this.quad(c[i], c[(i + 1) % 4], top, top, color, mat);
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.mat, 4));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.kind, 1));
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

// Local frame on the road: origin at (s,u,h), local -z = forward, x = right.
export function roadMatrix(road, s, u, h = 0, extraRotY = 0) {
  const p = road.point(s, u, h);
  const th = road.heading(s);
  const m = new THREE.Matrix4().makeRotationY(-th + extraRotY);
  m.setPosition(p[0], p[1], p[2]);
  return m;
}
