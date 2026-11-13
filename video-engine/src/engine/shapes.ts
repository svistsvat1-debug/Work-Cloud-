// Shape helpers: every shape knows its path data and bounding box,
// so the Reveal component can build scribble masks that fully cover it.
export type BBox = [number, number, number, number]; // x0 y0 x1 y1
export type Shape = { d: string; bb: BBox };
export type Pt = [number, number];

const n = (v: number) => Math.round(v * 10) / 10;
export const bbOf = (pts: Pt[]): BBox => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};
export const union = (a: BBox, b: BBox): BBox => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

/** straight polygon / polyline */
export const P = (pts: Pt[], closed = true): Shape => ({
  d: "M" + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join(" L") + (closed ? " Z" : ""),
  bb: bbOf(pts),
});

/** smooth Catmull-Rom curve through points */
export const S = (pts: Pt[], closed = true, k = 1): Shape => {
  const p = pts; const L = p.length;
  const get = (i: number) => closed ? p[(i + L) % L] : p[Math.max(0, Math.min(L - 1, i))];
  let d = `M${n(p[0][0])} ${n(p[0][1])}`;
  const segs = closed ? L : L - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
    d += ` C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  }
  return { d: d + (closed ? " Z" : ""), bb: bbOf(pts) };
};

/** rounded rectangle */
export const R = (x: number, y: number, w: number, h: number, r = 0): Shape => {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  const d = `M${n(x + r)} ${n(y)} H${n(x + w - r)} Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + r)} V${n(y + h - r)} Q${n(x + w)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)} H${n(x + r)} Q${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - r)} V${n(y + r)} Q${n(x)} ${n(y)} ${n(x + r)} ${n(y)} Z`;
  return { d, bb: [x, y, x + w, y + h] };
};

/** ellipse */
export const E = (cx: number, cy: number, rx: number, ry = rx): Shape => ({
  d: `M${n(cx - rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 0 ${n(cx + rx)} ${n(cy)} A${n(rx)} ${n(ry)} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`,
  bb: [cx - rx, cy - ry, cx + rx, cy + ry],
});

/** arch: rectangle with a semicircular top (tunnel mouth) */
export const Arch = (x: number, y: number, w: number, h: number): Shape => {
  const r = w / 2;
  return { d: `M${n(x)} ${n(y + h)} V${n(y + r)} A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)} V${n(y + h)} Z`, bb: [x, y, x + w, y + h] };
};

/** join several shapes into one compound path */
export const J = (...s: Shape[]): Shape => ({ d: s.map(x => x.d).join(" "), bb: s.map(x => x.bb).reduce(union) });

// ---------- parts & drawables ----------
export type Part = {
  s: Shape;
  fill?: string;        // filled region (scribble-revealed)
  detail?: boolean;     // drawn last as a line
  stroke?: string;      // outline / detail colour (default ink)
  sw?: number;          // stroke width in screen px (default 7 outline, 5 detail)
  noOutline?: boolean;  // fill only
  streak?: boolean;     // white paper streak highlight (default: auto for big regions)
  text?: { x: number; y: number; t: string; size: number; color?: string; font?: "pm" | "cb"; anchor?: "start" | "middle" | "end"; rot?: number };
};
export type Drawable = { w: number; h: number; parts: Part[] };

export const F = (s: Shape, fill: string, o: Partial<Part> = {}): Part => ({ s, fill, ...o });
export const D = (s: Shape | Part, o: Partial<Part> = {}): Part => ((s as Part).s ? { ...(s as Part), detail: true, ...o } : { s: s as Shape, detail: true, ...o });
export const T = (x: number, y: number, t: string, size: number, o: Partial<NonNullable<Part["text"]>> = {}): Part => ({
  s: { d: "", bb: [x, y - size, x + t.length * size * 0.5, y] }, detail: true, text: { x, y, t, size, ...o },
});

export const C = {
  ink: "#111111", red: "#F0281E", orange: "#F5541A", orange2: "#F5781E", amber: "#F9A825", yellow: "#FFCC1A",
  blue: "#1EA0F0", navy: "#1673B8", green: "#2E9E4A", olive: "#6B7B3A", khaki: "#C2B280", steel: "#6E7B85",
  board: "#FAF8F3", cream: "#F3E6C4", skin: "#F2C9A0", brown: "#8A5A35", dbrown: "#5C3B22", grey: "#A9B1B6",
  lgrey: "#D5D9DB", soil: "#B88B5A", soil2: "#9C7044", white: "#FFFFFF", tile: "#E9E2CF", water: "#4FA8E0",
};
