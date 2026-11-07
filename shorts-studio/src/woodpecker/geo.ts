// World layout, measured sprite points and the tongue/hyoid track.
// World units: at camera (540, 960, k = 1) one world unit = one 1080x1920 screen px.

export type V = [number, number];

export const FPS = 60;
export const DURATION = 1660; // frames (27.67 s = voice 26.9 s + 0.1 s lead + tail)

// sprite placements (sprite px -> world)
export const HERO = {x: 493, y: 382, s: 0.32, w: 1623, h: 3612};
export const HEAD = {x: 545.23, y: 385.81, s: 0.19132, w: 2178, h: 2307};
export const TRUNK = {x: 92.3, y: -216, s: 0.47, w: 1092, h: 4128};
export const XRAY = {x: 480, y: 370, w: 540, h: 1190}; // xray_body.png world box

export const heroW = ([x, y]: V): V => [HERO.x + x * HERO.s, HERO.y + y * HERO.s];
export const headW = ([x, y]: V): V => [HEAD.x + x * HEAD.s, HEAD.y + y * HEAD.s];

export const PIVOT = heroW([130, 1850]); // feet: the bird rocks about this point when pecking
export const EYE_SPRITE: V = [896, 352]; // hero eye (sprite px)
export const EYE_HEAD: V = [1225, 559]; // X-ray eye socket (head px)
export const NOSTRIL_HEAD: V = [775, 495];
export const HOLE: V = [536, 506]; // peck hole on the trunk's right edge (world)
export const CHAMBER: V = [492, 745]; // larva chamber at the end of the tunnel (world)

// hyoid horns (rear end at the nostril -> tongue base), head px
const HYOID_HEAD: V[] = [
  [790, 478], [850, 410], [930, 335], [1040, 255], [1170, 190], [1320, 150], [1490, 145], [1660, 180],
  [1810, 250], [1920, 360], [1990, 480], [2025, 620], [2020, 760], [1950, 900], [1820, 1000], [1650, 1045],
  [1450, 1055], [1250, 1020], [1080, 940], [1000, 830],
];
// tongue inside the beak (after the tongue base -> tip at rest), head px
const TONGUE_HEAD: V[] = [[900, 750], [700, 712], [400, 680], [110, 642]];
// beyond the beak: gap -> hole -> tunnel -> chamber (world)
const EXT_WORLD: V[] = [
  [549, 506.5], [536, 507.5], [517, 513], [503, 528], [496, 560], [493, 620], [492, 680], [492, 712], [492, 760], [492, 805],
];

export const TUNNEL_PATH = 'M 538 507 L 517 513 Q 500 524 496 548 L 493 690';

// ---------------------------------------------------------------- Catmull-Rom track with arc length
const pts: V[] = [...HYOID_HEAD.map(headW), ...TONGUE_HEAD.map(headW), ...EXT_WORLD];
const IDX_TB = HYOID_HEAD.length - 1;
const IDX_F = HYOID_HEAD.length + TONGUE_HEAD.length - 1;

const samples: V[] = [];
const sampleIdx: number[] = []; // first sample index of every control point
for (let i = 0; i < pts.length - 1; i++) {
  const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
  sampleIdx.push(samples.length);
  const n = 20;
  for (let j = 0; j < n; j++) {
    const t = j / n, t2 = t * t, t3 = t2 * t;
    const f = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    samples.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
}
sampleIdx.push(samples.length);
samples.push(pts[pts.length - 1]);
const cum: number[] = [0];
for (let i = 1; i < samples.length; i++) {
  cum.push(cum[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
}
export const TRACK_LEN = cum[cum.length - 1];
export const sOfPoint = (i: number) => cum[sampleIdx[i]];
export const S_TB = sOfPoint(IDX_TB); // hyoid length (nostril -> tongue base)
export const S_F = sOfPoint(IDX_F); // rod length at rest (tongue tip just inside the beak tip)
export const LH = S_TB;
export const ROD = S_F;

const find = (s: number) => {
  s = Math.max(0, Math.min(TRACK_LEN, s));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] <= s) lo = m; else hi = m;
  }
  const u = (s - cum[lo]) / Math.max(cum[hi] - cum[lo], 1e-6);
  return {lo, hi, u};
};
export const at = (s: number): V => {
  const {lo, hi, u} = find(s);
  return [samples[lo][0] + (samples[hi][0] - samples[lo][0]) * u, samples[lo][1] + (samples[hi][1] - samples[lo][1]) * u];
};
export const tangent = (s: number): V => {
  const a = at(s - 1.5), b = at(s + 1.5);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};
/** polyline points for the track between s0 and s1, optionally offset sideways */
export const poly = (s0: number, s1: number, off = 0): string => {
  if (s1 - s0 < 0.05) return '';
  const out: string[] = [];
  const push = (s: number) => {
    const p = at(s);
    if (off) {
      const t = tangent(s);
      p[0] += -t[1] * off;
      p[1] += t[0] * off;
    }
    out.push(`${p[0].toFixed(2)},${p[1].toFixed(2)}`);
  };
  push(s0);
  const {hi: i0} = find(s0);
  const {lo: i1} = find(s1);
  for (let i = i0; i <= i1; i++) push(cum[i]);
  push(s1);
  return out.join(' ');
};
/** arc position along the track where the y coordinate first reaches `y` past `from` */
export const sAtY = (y: number, from: number) => {
  for (let i = 0; i < samples.length; i++) {
    if (cum[i] >= from && samples[i][1] >= y) return cum[i];
  }
  return TRACK_LEN;
};
// reveal anchors (fractions of the hyoid drawn from the tongue base backwards)
export const REVEAL_BEHIND = 1 - sOfPoint(10) / LH; // ~ point behind the skull (1990, 480)
export const REVEAL_TOP = 1 - sOfPoint(4) / LH; // ~ top front (1170, 190)
