// Parametric icon geometry for the marker-whiteboard style. Local box about -100..100.
import {C} from './theme';
import {Pt, Stroke, line, poly, rect, rrect, ellipse, star} from './rough';
import type {Geo, Fill} from './draw';

const F = (s: Stroke, color: string, extra: Partial<Fill> = {}): Fill => ({pts: s.pts, color, ...extra});

export type IconOpts = {fill?: string; fill2?: string};

export const ICONS: Record<string, (o: IconOpts) => Geo> = {
  helmet: (o) => {
    const dome = ellipse(0, 20, 78, 66, Math.PI, Math.PI * 2, 24);
    return {strokes: [dome, poly([[-92, 22], [92, 22]]), poly([[-60, 22], [-62, 34], [62, 34], [60, 22]])], fills: [F({pts: [...dome.pts, [78, 22], [-78, 22]]}, o.fill || C.olive)]};
  },
  medal: (o) => {
    const rib1 = poly([[-40, -90], [-10, -90], [12, -10], [-18, -10]], true);
    const rib2 = poly([[40, -90], [10, -90], [-12, -10], [18, -10]], true);
    const c = ellipse(0, 30, 44, 44);
    return {strokes: [rib1, rib2, c, star(0, 30, 26)], fills: [F(rib1, o.fill2 || C.red), F(rib2, C.blue), F(c, o.fill || C.yellow)]};
  },
  star: (o) => {
    const s = star(0, 0, 90);
    return {strokes: [s], fills: [F(s, o.fill || C.yellow)]};
  },
  baby: (o) => {
    const head = ellipse(0, -45, 38, 38);
    const body = rrect(-48, -10, 96, 100, 40);
    return {
      strokes: [head, body, poly([[-30, 25], [30, 25]])],
      thin: [ellipse(-13, -50, 3, 3), ellipse(13, -50, 3, 3), ellipse(0, -32, 9, 5, 0, Math.PI)],
      fills: [F(body, o.fill || C.lightBlue)],
    };
  },
  ring: (o) => {
    const r = ellipse(0, 20, 62, 62);
    const r2 = ellipse(0, 20, 46, 46);
    const gem = poly([[-22, -42], [22, -42], [32, -60], [0, -84], [-32, -60]], true);
    return {strokes: [r, r2, gem], fills: [F(gem, C.lightBlue)], thin: []};
  },
  cake: (o) => {
    const b = rect(-80, -10, 160, 80);
    const t = rect(-60, -60, 120, 50);
    const candle = rect(-6, -100, 12, 40);
    const flame = poly([[0, -132], [10, -112], [0, -102], [-10, -112]], true);
    return {strokes: [b, t, candle, flame], fills: [F(b, C.pink), F(t, C.pink), F(flame, C.orange)]};
  },
  doc: (o) => {
    const page = poly([[-70, -95], [40, -95], [70, -65], [70, 95], [-70, 95]], true);
    return {strokes: [page, poly([[40, -95], [40, -65], [70, -65]])], thin: [line(-50, -40, 50, -40), line(-50, -10, 50, -10), line(-50, 20, 50, 20), line(-50, 50, 20, 50)], fills: [F(page, o.fill || C.white, {solid: true})]};
  },
  letter: (o) => {
    const page = rect(-75, -95, 150, 190);
    return {strokes: [page], thin: [line(-55, -60, 55, -60), line(-55, -30, 55, -30), line(-55, 0, 55, 0), line(-55, 30, 30, 30), line(-55, 60, 10, 60)], fills: [F(page, C.white, {solid: true})]};
  },
  envelope: (o) => {
    const e = rect(-95, -60, 190, 120);
    return {strokes: [e, poly([[-95, -60], [0, 15], [95, -60]])], fills: [F(e, o.fill || C.white, {solid: true})]};
  },
  tent: (o) => {
    const t = poly([[-95, 70], [0, -70], [95, 70]], true);
    const door = poly([[-22, 70], [0, 10], [22, 70]], true);
    return {strokes: [t, door, line(0, -70, 0, -90)], fills: [F(t, o.fill || C.khaki)]};
  },
  truck: (o) => {
    const bed = rect(-95, -55, 120, 70);
    const cab = poly([[25, 15], [25, -30], [70, -30], [92, -5], [92, 15]], true);
    return {strokes: [bed, cab, ellipse(-60, 30, 18, 18), ellipse(-20, 30, 18, 18), ellipse(65, 30, 18, 18), line(25, -10, 25, 15)], fills: [F(bed, o.fill || C.olive), F(cab, o.fill || C.olive)]};
  },
  cigpack: (o) => {
    const p = rect(-55, -70, 110, 160);
    const band = rect(-55, -30, 110, 34);
    return {
      strokes: [p, line(-55, -40, 55, -40), rect(-40, -98, 20, 28), rect(-10, -108, 20, 38), rect(20, -94, 20, 24)],
      fills: [F(p, C.white, {solid: true}), F(band, o.fill || C.red)],
    };
  },
  padlock: (o) => {
    const body = rrect(-60, -15, 120, 100, 10);
    return {strokes: [ellipse(0, -15, 40, 55, Math.PI, Math.PI * 2, 16), body, ellipse(0, 25, 10, 10), line(0, 35, 0, 55)], fills: [F(body, o.fill || C.steel)]};
  },
  bottle: (o) => {
    const b = poly([[-12, -95], [12, -95], [12, -50], [55, -10], [55, 95], [-55, 95], [-55, -10], [-12, -50]], true);
    return {strokes: [b], fills: []};
  },
  house: (o) => {
    const body = rect(-70, -10, 140, 100);
    const roof = poly([[-90, -10], [0, -90], [90, -10]], true);
    return {strokes: [body, roof, rect(-18, 35, 36, 55), rect(30, 10, 28, 26)], fills: [F(roof, o.fill2 || C.red), F(body, o.fill || C.khaki)]};
  },
  dome: (o) => {
    const base = rect(-95, 30, 190, 55);
    const dome = ellipse(0, 30, 60, 70, Math.PI, Math.PI * 2, 20);
    return {strokes: [base, dome, line(-60, 30, 60, 30), rect(-8, -62, 16, 22), line(0, -62, 0, -80), line(-60, 45, -60, 85), line(-20, 45, -20, 85), line(20, 45, 20, 85), line(60, 45, 60, 85)], fills: [F({pts: [...dome.pts]}, o.fill || C.white, {solid: true})]};
  },
  gavel: (o) => {
    const head = poly([[-80, -60], [-20, -100], [5, -62], [-55, -22]], true);
    return {strokes: [head, poly([[-30, -45], [75, 70]]), poly([[-15, -58], [88, 58]])], fills: [F(head, o.fill || C.khaki)]};
  },
  suitcase: (o) => {
    const b = rrect(-90, -45, 180, 120, 12);
    return {strokes: [b, rrect(-35, -75, 70, 30, 8), line(-50, -45, -50, 75), line(50, -45, 50, 75)], fills: [F(b, o.fill || C.orange)]};
  },
  pricetag: (o) => {
    const t = poly([[-90, -45], [40, -45], [90, 0], [40, 45], [-90, 45]], true);
    return {strokes: [t, ellipse(45, 0, 9, 9)], fills: [F(t, o.fill || C.yellow)]};
  },
  pin: (o) => {
    const ring = ellipse(0, 0, 88, 88);
    const inner = ellipse(0, 0, 70, 70);
    const eagle = poly([[-55, -5], [-30, -25], [-10, -15], [0, -45], [10, -15], [30, -25], [55, -5], [20, 0], [10, 35], [0, 25], [-10, 35], [-20, 0]], true);
    return {strokes: [ring, inner, eagle], fills: [F(ring, o.fill || C.yellow), F(eagle, C.orange)]};
  },
  duck: (o) => {
    const body = poly([[-80, 20], [-60, -10], [-10, -5], [0, -40], [25, -65], [55, -60], [70, -40], [95, -35], [70, -25], [55, -15], [60, 10], [40, 50], [-30, 55], [-70, 45]], true);
    return {strokes: [body, poly([[-40, 15], [-5, 25], [20, 10]])], thin: [ellipse(45, -45, 4, 4)], fills: [F(body, o.fill || C.yellow)]};
  },
  clock: (o) => {
    const c = ellipse(0, 0, 90, 90);
    return {strokes: [c], thin: [line(0, -80, 0, -68), line(80, 0, 68, 0), line(0, 80, 0, 68), line(-80, 0, -68, 0)], fills: [F(c, C.white, {solid: true})]};
  },
  pencil: (o) => {
    const b = poly([[-90, -14], [55, -14], [90, 0], [55, 14], [-90, 14]], true);
    return {strokes: [b, line(55, -14, 55, 14), line(-70, -14, -70, 14)], fills: [F(b, o.fill || C.yellow)]};
  },
  check: () => ({strokes: [poly([[-70, 0], [-20, 55], [80, -65]])], fills: []}),
  xmark: () => ({strokes: [line(-70, -70, 70, 70), line(70, -70, -70, 70)], fills: []}),
  flag: (o) => {
    const f = poly([[-50, -90], [70, -78], [60, -30], [-50, -40]], true);
    return {strokes: [line(-50, -95, -50, 95), f], fills: [F(f, o.fill || C.white, {solid: o.fill === undefined})]};
  },
  building: (o) => {
    const body = rect(-90, -30, 180, 120);
    const roof = poly([[-100, -30], [0, -90], [100, -30]], true);
    return {strokes: [body, roof, line(-55, -15, -55, 90), line(-20, -15, -20, 90), line(20, -15, 20, 90), line(55, -15, 55, 90)], fills: [F(roof, o.fill || C.khaki)]};
  },
  pedal: (o) => {
    const pad = rrect(-60, -30, 120, 50, 10);
    return {strokes: [pad, poly([[0, 20], [10, 90]]), line(-45, -5, 45, -5)], fills: [F(pad, o.fill || C.steel)]};
  },
  funnel: (o) => {
    const fn = poly([[-90, -80], [90, -80], [15, 10], [15, 90], [-15, 90], [-15, 10]], true);
    return {strokes: [fn], fills: [F(fn, o.fill || C.khaki)]};
  },
  ticket: (o) => {
    const t = poly([[-95, -45], [95, -45], [95, -12], [82, 0], [95, 12], [95, 45], [-95, 45], [-95, 12], [-82, 0], [-95, -12]], true);
    return {strokes: [t, line(40, -40, 40, 40)], fills: [F(t, o.fill || C.yellow)]};
  },
  briefcase: (o) => {
    const b = rrect(-90, -40, 180, 120, 10);
    return {strokes: [b, rrect(-30, -70, 60, 30, 8), line(-90, 10, 90, 10)], fills: [F(b, o.fill || C.orange)]};
  },
  shirt: (o) => {
    const s = poly([[-35, -80], [-90, -50], [-70, -10], [-50, -25], [-50, 90], [50, 90], [50, -25], [70, -10], [90, -50], [35, -80], [0, -60]], true);
    return {strokes: [s], fills: [F(s, o.fill || C.lightBlue)]};
  },
  puff: (o) => {
    const pts: Pt[] = [];
    for (let i = 0; i < 9; i++) {
      const a0 = (i / 9) * Math.PI * 2;
      for (let k = 0; k <= 6; k++) {
        const a = a0 + (k / 6) * (Math.PI * 2) / 9;
        const r = 70 + 22 * Math.sin((k / 6) * Math.PI);
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.85]);
      }
    }
    const p = poly(pts, true);
    const core = ellipse(0, 0, 40, 34);
    return {strokes: [p], fills: [F(p, o.fill || C.orange), F(core, C.yellow)]};
  },
  anchor: () => ({strokes: [ellipse(0, -75, 16, 16), line(0, -59, 0, 80), line(-40, -35, 40, -35), poly([[-70, 30], [-50, 70], [0, 85], [50, 70], [70, 30]])], fills: []}),
  wrench: (o) => {
    const w = poly([[-80, 70], [-60, 90], [30, 0], [60, 10], [90, -20], [80, -60], [55, -35], [35, -45], [30, -70], [55, -90], [10, -90], [-15, -55], [-5, -20]], true);
    return {strokes: [w], fills: [F(w, o.fill || C.steel)]};
  },
  thermometer: (o) => {
    const t = poly([[-15, 40], [-15, -85], [15, -85], [15, 40]]);
    const bulb = ellipse(0, 60, 30, 30);
    return {strokes: [t, bulb], fills: [F(bulb, o.fill || C.blue)], thin: [line(15, -60, 30, -60), line(15, -30, 30, -30), line(15, 0, 30, 0)]};
  },
  snowflake: () => ({strokes: [line(0, -80, 0, 80), line(-70, -40, 70, 40), line(-70, 40, 70, -40), poly([[-15, -60], [0, -45], [15, -60]]), poly([[-15, 60], [0, 45], [15, 60]])], fills: []}),
  stripes: (o) => {
    const v = (y: number) => poly([[-60, y], [0, y - 35], [60, y], [60, y + 20], [0, y - 15], [-60, y + 20]], true);
    const a = v(-30), b = v(10), c = v(50);
    return {strokes: [a, b, c], fills: [F(a, o.fill || C.yellow), F(b, o.fill || C.yellow), F(c, o.fill || C.yellow)]};
  },
  wire: () => {
    const s: Stroke[] = [poly([[-100, 0], [-50, -6], [0, 4], [50, -4], [100, 2]])];
    for (const x of [-70, -20, 30, 80]) s.push(line(x - 12, -14, x + 12, 14), line(x + 12, -14, x - 12, 14));
    return {strokes: s, fills: []};
  },
  desk: (o) => {
    const top = rect(-95, 0, 190, 18);
    const p1 = rect(-50, -60, 70, 60);
    return {strokes: [top, line(-80, 18, -80, 90), line(80, 18, 80, 90), p1, line(-40, -45, 10, -45), line(-40, -30, 10, -30), rect(30, -30, 45, 30)], fills: [F(top, o.fill || C.khaki), F(p1, C.white, {solid: true})]};
  },
  scale: () => ({strokes: [line(0, -80, 0, 80), line(-60, 80, 60, 80), line(-80, -60, 80, -60), poly([[-80, -60], [-100, 0], [-60, 0], [-80, -60]]), poly([[80, -60], [60, 0], [100, 0], [80, -60]])], fills: []}),
  door: (o) => {
    const d = rect(-55, -95, 110, 190);
    return {strokes: [d, ellipse(35, 5, 7, 7)], fills: [F(d, o.fill || C.khaki)]};
  },
  bag: (o) => {
    const b = rrect(-95, -40, 190, 85, 40);
    return {strokes: [b, ellipse(-75, 2, 14, 40), poly([[-30, -40], [-20, -70], [20, -70], [30, -40]])], fills: [F(b, o.fill || C.olive)]};
  },
  skyline: (o) => {
    const s = poly([[-100, 90], [-100, 10], [-75, 10], [-75, -30], [-50, -30], [-50, 40], [-30, 40], [-30, -70], [-18, -70], [-12, -100], [-6, -70], [6, -70], [6, 0], [30, 0], [30, -45], [55, -45], [55, 20], [75, 20], [75, -15], [100, -15], [100, 90]], true);
    return {strokes: [s], fills: [F(s, o.fill || C.grey)]};
  },
  bunks: (o) => {
    const s: Stroke[] = [line(-90, -90, -90, 90), line(90, -90, 90, 90)];
    const f: Fill[] = [];
    for (const y of [-80, -35, 10, 55]) {
      const r = rect(-90, y, 180, 22);
      s.push(r);
      f.push(F(r, o.fill || C.khaki));
    }
    return {strokes: s, fills: f};
  },
  eraser: () => {
    const b = rrect(-70, -40, 140, 80, 10);
    const felt = rect(-70, 15, 140, 25);
    return {strokes: [b, line(-70, 15, 70, 15)], fills: [F(b, C.steel), F(felt, C.grey)]};
  },
  stamptool: (o) => {
    const handle = ellipse(0, -70, 25, 25);
    const base = rect(-70, 10, 140, 40);
    return {strokes: [handle, poly([[-12, -48], [-12, 10]]), poly([[12, -48], [12, 10]]), base], fills: [F(handle, o.fill || C.red), F(base, C.steel)]};
  },
  crate: (o) => {
    const b = rect(-70, -50, 140, 100);
    return {strokes: [b, line(-70, -50, 70, 50), line(-70, 50, 70, -50)], fills: [F(b, o.fill || C.khaki)]};
  },
  whiteflag: () => {
    const f = poly([[-50, -90], [70, -78], [60, -30], [-50, -40]], true);
    return {strokes: [line(-50, -95, -50, 95), f], fills: [F(f, C.white, {solid: true})]};
  },
  card: (o) => {
    const c = rrect(-90, -125, 180, 250, 16);
    return {strokes: [c], fills: [F(c, o.fill || C.white, {solid: true})]};
  },
  bigq: () => ({strokes: [poly([[-45, -45], [-35, -80], [0, -95], [40, -80], [45, -45], [20, -20], [0, 0], [0, 30]]), ellipse(0, 70, 8, 8)], fills: []}),
  ballot: (o) => {
    const b = rect(-80, -40, 160, 120);
    return {strokes: [b, line(-40, -40, 40, -40), rect(-60, -100, 120, 60)], fills: [F(b, o.fill || C.blue)]};
  },
  ship: (o) => {
    const hull = poly([[-95, 0], [95, 0], [75, 40], [-80, 40]], true);
    const sup = rect(-30, -35, 60, 35);
    return {strokes: [hull, sup, rect(-10, -60, 16, 25)], fills: [F(hull, o.fill || C.steel), F(sup, C.white, {solid: true})]};
  },
  bread: () => ({strokes: [], fills: []}),
};

export function iconGeo(name: string, o: IconOpts = {}): Geo {
  const fn = ICONS[name];
  if (!fn) throw new Error('unknown icon ' + name);
  return fn(o);
}
