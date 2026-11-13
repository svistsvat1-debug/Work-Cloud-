// Parametric WWII / home-front drawables, all in the same marker look.
// Every function returns a Drawable (own coordinate box) built from Parts.
import { Arch, C, D, Drawable, E, F, P, Part, Pt, R, S, T } from "../engine/shapes";

export const G = (ox = 0, oy = 0, k = 1) => {
  const m = (p: Pt): Pt => [ox + p[0] * k, oy + p[1] * k];
  return {
    k, m,
    P: (pts: Pt[], c = true) => P(pts.map(m), c),
    S: (pts: Pt[], c = true) => S(pts.map(m), c),
    L: (pts: Pt[]) => P(pts.map(m), false),
    Ls: (pts: Pt[]) => S(pts.map(m), false),
    R: (x: number, y: number, w: number, h: number, r = 0) => R(ox + x * k, oy + y * k, w * k, h * k, r * k),
    E: (cx: number, cy: number, rx: number, ry = rx) => E(ox + cx * k, oy + cy * k, rx * k, ry * k),
    Arch: (x: number, y: number, w: number, h: number) => Arch(ox + x * k, oy + y * k, w * k, h * k),
    T: (x: number, y: number, t: string, size: number, o: any = {}) => T(ox + x * k, oy + y * k, t, size * k, o),
  };
};
const rot = (pts: Pt[], cx: number, cy: number, deg: number): Pt[] => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const mk = (w: number, h: number, ...parts: (Part | Part[])[]): Drawable => ({ w, h, parts: parts.flat() });

// ======================= PEOPLE =======================
export type PersonOpt = { coat?: string; legs?: string; hat?: "none" | "helmet" | "cap" | "peaked" | "scarf" | "nurse"; hatColor?: string; bundle?: string; child?: boolean; skirt?: boolean };
/** standing figure, box 120x300 at (ox,oy) scaled k */
export const personParts = (ox: number, oy: number, k: number, o: PersonOpt = {}): Part[] => {
  const g = G(ox, oy, k);
  const coat = o.coat ?? C.navy;
  const parts: Part[] = [];
  if (o.skirt) parts.push(F(g.P([[30, 190], [90, 190], [100, 250], [20, 250]]), coat));
  parts.push(F(g.R(36, 196, 20, 96, 8), o.legs ?? "#3B3B3B"), F(g.R(64, 196, 20, 96, 8), o.legs ?? "#3B3B3B"));
  parts.push(F(g.R(22, 84, 76, 122, 24), coat));
  parts.push(F(g.E(60, 46, 31, 33), C.skin));
  if (o.hat === "helmet") parts.push(F(g.P([[22, 40], [30, 16], [60, 6], [90, 16], [98, 40], [104, 46], [16, 46]]), C.olive));
  if (o.hat === "cap") parts.push(F(g.P([[28, 30], [40, 12], [80, 10], [96, 26], [104, 34], [28, 36]]), o.hatColor ?? "#5A5F63"));
  if (o.hat === "peaked") parts.push(F(g.R(30, 8, 60, 22, 8), o.hatColor ?? C.navy), F(g.R(24, 26, 50, 8, 4), C.ink, { noOutline: true }));
  if (o.hat === "scarf") parts.push(F(g.S([[26, 50], [30, 18], [60, 8], [90, 18], [94, 50], [86, 30], [60, 22], [34, 30]]), o.hatColor ?? C.red));
  if (o.hat === "nurse") parts.push(F(g.R(36, 6, 48, 20, 6), C.white));
  parts.push(D(g.Ls([[30, 100], [16, 150], [20, 196]]), { sw: 6 }), D(g.Ls([[90, 100], [104, 150], [100, 196]]), { sw: 6 }));
  parts.push(F(g.E(50, 46, 3.5), C.ink, { noOutline: true, streak: false }), F(g.E(70, 46, 3.5), C.ink, { noOutline: true, streak: false }));
  if (o.bundle) parts.push(F(g.R(86, 160, 44, 36, 8), o.bundle));
  return parts;
};
export const person = (o: PersonOpt = {}) => mk(140, 300, personParts(10, 0, 1, o));

/** lying sleeper, box 260x100 at (ox,oy) scaled k */
export const sleeperParts = (ox: number, oy: number, k: number, blanket: string = C.khaki): Part[] => {
  const g = G(ox, oy, k);
  return [
    F(g.S([[56, 40], [120, 24], [200, 30], [250, 52], [244, 86], [150, 92], [60, 86]]), blanket),
    F(g.E(36, 58, 24, 22), C.skin),
    D(g.Ls([[110, 40], [140, 70], [130, 88]]), { sw: 4 }),
    D(g.Ls([[24, 56], [32, 58]]), { sw: 3 }),
  ];
};
export const sleeper = (blanket?: string) => mk(270, 100, sleeperParts(5, 0, 1, blanket));

export const childParts = (ox: number, oy: number, k: number, coat = C.red) => personParts(ox, oy, k * 0.72, { coat, legs: "#4A4A4A" });

// ======================= TUBE WORLD =======================
/** big cross-section: houses on the street, soil, deep tunnel with platform */
export const crossSection = (o: { bombers?: boolean; fire?: boolean; family?: boolean; sleepers?: boolean; puff?: boolean; thud?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const W = 1300, top = 300;
  const parts: Part[] = [];
  parts.push(F(g.P([[0, top], [W, top], [W, 860], [0, 860]]), C.soil, { streak: false }));
  // houses
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 190;
    parts.push(F(g.R(x, top - 150, 170, 150), i % 2 ? "#B5543A" : "#A44A33", { streak: false }));
    parts.push(F(g.P([[x - 10, top - 150], [x + 85, top - 230], [x + 180, top - 150]]), "#5E3A2A", { streak: false }));
    parts.push(F(g.R(x + 25, top - 120, 40, 44), C.amber, { streak: false }), F(g.R(x + 105, top - 120, 40, 44), C.amber, { streak: false }));
    parts.push(F(g.R(x + 65, top - 64, 40, 64), C.dbrown, { streak: false }));
  }
  // station building + shaft
  parts.push(F(g.R(880, top - 120, 300, 120), C.lgrey, { streak: false }));
  parts.push(F(g.R(990, top, 90, 400), "#D9D4C4", { streak: false }));
  parts.push(D(g.L([[990, top + 40], [1080, top + 40]])), D(g.L([[990, top + 120], [1080, top + 120]])), D(g.L([[990, top + 200], [1080, top + 200]])), D(g.L([[990, top + 280], [1080, top + 280]])), D(g.L([[990, top + 360], [1080, top + 360]])));
  // tunnel
  parts.push(F(g.E(700, 730, 330, 120), "#C9CED1"));
  parts.push(F(g.R(420, 735, 560, 60, 6), "#8E979C", { streak: false }));
  parts.push(D(g.L([[370, 640], [990, 640]]), { stroke: "#7d6648", sw: 3 }));
  parts.push(D(g.T(1035, top - 40, "STATION", 34, { color: C.ink })));
  if (o.sleepers) {
    for (let i = 0; i < 4; i++) parts.push(...sleeperParts(450 + i * 128, 690, 0.45, [C.khaki, C.blue, C.olive, C.amber][i]));
  }
  if (o.family) {
    parts.push(...personParts(1000, top + 170, 0.42, { coat: C.blue, hat: "scarf" }), ...childParts(1040, top + 230, 0.42, C.red), ...personParts(1000, top + 300, 0.42, { coat: C.olive, hat: "cap", bundle: C.khaki }));
  }
  if (o.bombers) {
    parts.push(...bomberParts(120, 10, 0.55), ...bomberParts(560, 40, 0.45), ...bomberParts(900, 0, 0.5));
  }
  if (o.fire) parts.push(F(g.S([[260, top - 150], [290, top - 250], [320, top - 190], [350, top - 270], [380, top - 150]]), C.orange, { streak: false }));
  if (o.puff) parts.push(...puffParts(620, top - 220, 0.7));
  if (o.thud) parts.push(D(g.T(220, 520, "thud", 44, { color: "#7A7A7A", font: "cb" })), D(g.T(860, 560, "thud", 38, { color: "#7A7A7A", font: "cb" })));
  return mk(W, 880, parts);
};

export const bomberParts = (ox: number, oy: number, k: number): Part[] => {
  const g = G(ox, oy, k);
  return [
    F(g.S([[0, 120], [60, 100], [300, 96], [400, 108], [420, 124], [300, 140], [60, 140]]), "#5B6168"),
    F(g.P([[150, 112], [250, 20], [290, 20], [240, 112]]), "#4B5157"),
    F(g.P([[150, 128], [250, 230], [290, 230], [240, 128]]), "#4B5157"),
    F(g.P([[330, 104], [380, 50], [405, 50], [395, 108]]), "#4B5157"),
  ];
};

export const train = (o: { open?: boolean; urn?: boolean; banner?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const parts: Part[] = [
    F(g.R(20, 40, 900, 200, 50), C.red),
    F(g.R(30, 230, 880, 30, 8), "#3E3E3E", { streak: false }),
  ];
  const wins = [80, 230, 520, 670];
  wins.forEach(x => parts.push(F(g.R(x, 80, 110, 80, 10), "#CFE8F7", { streak: false })));
  if (o.open) {
    parts.push(F(g.R(370, 70, 120, 160, 8), "#F6E7BE", { streak: false }));
    parts.push(F(g.R(385, 165, 45, 55, 4), C.brown), F(g.R(436, 175, 40, 45, 4), C.brown));
    if (o.urn) parts.push(F(g.R(395, 100, 60, 64, 14), C.steel), D(g.L([[425, 92], [425, 100]])));
  } else {
    parts.push(D(g.L([[400, 60], [400, 230]])), D(g.L([[460, 60], [460, 230]])), F(g.R(410, 90, 40, 70, 6), "#CFE8F7", { streak: false }));
  }
  parts.push(F(g.E(880, 190, 16), C.yellow, { streak: false }));
  [120, 230, 690, 800].forEach(x => parts.push(F(g.E(x, 268, 26), "#2B2B2B", { streak: false })));
  if (o.banner) parts.push(D(g.T(470, 30, "TUBE REFRESHMENTS SPECIAL", 40, { color: C.red, font: "pm" })));
  return mk(940, 300, parts);
};

/** platform seen from the side with painted lines and optional sleepers */
export const platform = (o: { lines?: number; sleepersFar?: number; sleepersNear?: number; train?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const parts: Part[] = [
    F(g.P([[0, 120], [1300, 120], [1300, 380], [0, 380]]), "#B9BEC1", { streak: false }),
    F(g.R(0, 380, 1300, 70), "#6B6F72", { streak: false }),
    D(g.L([[0, 420], [1300, 420]]), { sw: 4 }),
  ];
  // lines (y=250: 8ft line, y=320: 4ft line) - painted white
  if ((o.lines ?? 2) >= 1) parts.push(D(g.L([[20, 250], [1280, 250]]), { stroke: C.white, sw: 9 }));
  if ((o.lines ?? 2) >= 2) parts.push(D(g.L([[20, 320], [1280, 320]]), { stroke: C.white, sw: 9 }));
  for (let i = 0; i < (o.sleepersFar ?? 0); i++) parts.push(...sleeperParts(40 + i * 250, 140, 0.8, [C.khaki, C.blue, C.olive, C.amber, C.orange2][i % 5]));
  for (let i = 0; i < (o.sleepersNear ?? 0); i++) parts.push(...sleeperParts(80 + i * 250, 220, 0.75, [C.blue, C.amber, C.khaki, C.olive, C.orange2][i % 5]));
  return mk(1300, 460, parts);
};

export const clock = (hh: number, mm: number, o: { arc?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const parts: Part[] = [F(g.E(150, 150, 130), C.cream), F(g.E(150, 150, 10), C.ink, { noOutline: true })];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; parts.push(D(g.L([[150 + Math.sin(a) * 104, 150 - Math.cos(a) * 104], [150 + Math.sin(a) * 118, 150 - Math.cos(a) * 118]]), { sw: 4 })); }
  if (o.arc) parts.push(D({ d: `M150 30 A120 120 0 0 1 ${150 + Math.sin(Math.PI / 6) * 120} ${150 - Math.cos(Math.PI / 6) * 120}`, bb: [150, 30, 210, 50] }, { stroke: C.red, sw: 14 }));
  const ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
  parts.push(D(g.L([[150, 150], [150 + Math.sin(ha) * 62, 150 - Math.cos(ha) * 62]]), { sw: 9 }));
  parts.push(D(g.L([[150, 150], [150 + Math.sin(ma) * 96, 150 - Math.cos(ma) * 96]]), { sw: 6 }));
  return mk(300, 300, parts);
};

export const escalator = () => {
  const g = G(0, 0, 1);
  const parts: Part[] = [F(g.P([[0, 520], [700, 80], [820, 80], [820, 180], [120, 620], [0, 620]]), C.steel)];
  for (let i = 1; i < 10; i++) { const x = i * 75; parts.push(D(g.L([[x, 560 - i * 47], [x + 60, 560 - i * 47]]), { stroke: "#333", sw: 4 })); }
  parts.push(D(g.Ls([[0, 470], [700, 30], [840, 30]]), { sw: 8 }));
  [[90, 450], [300, 318], [510, 186]].forEach(([x, y], i) => parts.push(...sleeperParts(x, y, 0.62, [C.khaki, C.blue, C.olive][i])));
  return mk(840, 620, parts);
};

export const blanket = () => {
  const g = G(0, 0, 1);
  return mk(300, 200, F(g.R(20, 40, 260, 140, 18), C.khaki), D(g.L([[20, 80], [280, 80]]), { stroke: C.red, sw: 6 }), D(g.L([[20, 140], [280, 140]]), { stroke: C.red, sw: 6 }), D(g.Ls([[40, 40], [150, 20], [260, 40]]), { sw: 4 }));
};

export const queue = (n = 7) => {
  const parts: Part[] = [];
  const g = G(0, 0, 1);
  parts.push(F(g.Arch(1080, 40, 220, 320), "#D9D4C4"), F(g.Arch(1120, 120, 140, 240), "#3A3A3A", { streak: false }));
  for (let i = 0; i < n; i++) parts.push(...personParts(30 + i * 140, 80, 0.9, { coat: [C.navy, C.blue, C.olive, C.brown, C.steel, C.red, C.navy][i % 7], hat: (["cap", "scarf", "none", "cap", "scarf", "none", "cap"] as any)[i % 7], bundle: i % 2 ? C.khaki : undefined }));
  return mk(1320, 370, parts);
};

export const entrance = (o: { open?: boolean; crowd?: boolean; sign?: string } = {}) => {
  const g = G(0, 0, 1);
  const parts: Part[] = [F(g.R(40, 40, 520, 90, 6), C.lgrey, { streak: false }), F(g.R(60, 130, 480, 330), "#D9D4C4", { streak: false }), F(g.Arch(170, 190, 260, 270), "#3A3A3A", { streak: false })];
  if (o.open) parts.push(F(g.P([[170, 330], [90, 300], [90, 460], [170, 460]]), C.brown), F(g.P([[430, 330], [510, 300], [510, 460], [430, 460]]), C.brown));
  parts.push(D(g.T(300, 104, o.sign ?? "STATION", 50, { color: C.ink })));
  if (o.crowd) for (let i = 0; i < 4; i++) parts.push(...personParts(160 + i * 70, 330, 0.42, { coat: [C.blue, C.olive, C.red, C.navy][i] }));
  return mk(600, 470, parts);
};

export const ticket = (txt = "1½d") => {
  const g = G(0, 0, 1);
  return mk(420, 260, F(g.R(10, 10, 400, 240, 18), C.cream), D(g.R(34, 34, 352, 192, 10), { stroke: C.khaki, sw: 4 }), D(g.T(210, 120, "TICKET", 50, { color: C.ink })), D(g.T(210, 205, txt, 80, { color: C.red })));
};

export const shelterTicket = () => {
  const g = G(0, 0, 1);
  return mk(460, 300, F(g.R(10, 10, 440, 280, 16), C.cream), D(g.R(30, 30, 400, 240, 8), { stroke: C.red, sw: 8 }), D(g.T(230, 120, "SHELTER", 64, { color: C.ink })), D(g.T(230, 205, "PLACE No. 27", 46, { color: C.navy, font: "cb" })));
};

export const grid10 = () => {
  const parts: Part[] = [];
  const g = G(0, 0, 1);
  for (let i = 0; i < 10; i++) { const x = (i % 5) * 92 + 10, y = Math.floor(i / 5) * 92 + 10; parts.push(i < 9 ? F(g.R(x, y, 76, 76, 8), C.blue) : D(g.R(x, y, 76, 76, 8), { stroke: C.red, sw: 7 })); }
  return mk(470, 194, parts);
};

export const coins = () => {
  const parts: Part[] = []; const g = G(0, 0, 1);
  [[150, 260], [150, 230], [150, 200], [150, 170], [270, 260], [270, 230], [210, 140]].forEach(([x, y]) => parts.push(F(g.E(x, y, 80, 26), C.amber, { streak: false })));
  parts.push(D(g.T(210, 330, "2s 6d", 0.1)));
  parts.pop();
  return mk(420, 320, parts);
};

export const tunnelStub = (o: { sleepers?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const parts: Part[] = [F(g.Arch(60, 30, 560, 420), "#C9CED1"), F(g.Arch(150, 120, 380, 330), "#4A4F52", { streak: false }), D(g.L([[200, 450], [270, 300]]), { sw: 5 }), D(g.L([[480, 450], [410, 300]]), { sw: 5 })];
  if (o.sleepers) [[170, 380], [310, 330], [230, 270]].forEach(([x, y], i) => parts.push(...sleeperParts(x, y, 0.55, [C.khaki, C.blue, C.amber][i])));
  return mk(680, 460, parts);
};

export const trainIcon = () => {
  const g = G(0, 0, 1);
  return mk(300, 160, F(g.R(10, 20, 280, 100, 30), C.red), F(g.R(40, 40, 60, 40, 6), "#CFE8F7", { streak: false }), F(g.R(130, 40, 60, 40, 6), "#CFE8F7", { streak: false }), F(g.E(70, 130, 16), "#2B2B2B"), F(g.E(230, 130, 16), "#2B2B2B"));
};

export const bunk = () => {
  const g = G(0, 0, 1); const parts: Part[] = [];
  parts.push(F(g.R(20, 0, 30, 620, 6), C.steel), F(g.R(540, 0, 30, 620, 6), C.steel));
  [120, 320, 520].forEach((y, i) => {
    parts.push(F(g.R(50, y, 490, 50, 8), [C.khaki, C.olive, C.amber][i]));
    parts.push(F(g.E(110, y - 22, 30, 26), C.skin));
    parts.push(F(g.S([[150, y - 30], [330, y - 44], [520, y - 30], [520, y + 6], [150, y + 6]]), [C.blue, C.khaki, C.brown][i]));
  });
  return mk(590, 620, parts);
};

export const bag = () => {
  const g = G(0, 0, 1);
  return mk(700, 420,
    F(g.P([[20, 120], [260, 120], [240, 400], [40, 400]]), C.khaki),
    F(g.P([[300, 250], [470, 200], [470, 260], [300, 310]]), C.cream), F(g.P([[300, 280], [470, 230], [470, 260], [300, 310]]), C.green, { streak: false }),
    F(g.R(520, 80, 80, 300, 30), C.steel), F(g.R(530, 50, 60, 40, 10), C.ink, { noOutline: true }),
    F(g.P([[340, 330], [470, 330], [470, 400], [340, 400]]), C.amber), F(g.P([[340, 330], [470, 330], [405, 300]]), "#F7E3B0"),
  );
};

export const rationBook = () => {
  const g = G(0, 0, 1);
  return mk(320, 420, F(g.R(10, 10, 300, 400, 14), "#D8C59A"), D(g.T(160, 110, "RATION", 52, { color: C.ink })), D(g.T(160, 175, "BOOK", 52, { color: C.ink })), D(g.R(50, 240, 220, 120, 6), { sw: 4 }), D(g.L([[70, 280], [250, 280]]), { sw: 3 }), D(g.L([[70, 320], [250, 320]]), { sw: 3 }));
};

export const urn = (o: { steam?: boolean } = {}) => {
  const g = G(0, 0, 1);
  const p: Part[] = [F(g.R(60, 80, 280, 360, 50), C.steel), F(g.R(110, 40, 180, 50, 16), "#555B60"), F(g.R(185, 10, 30, 36, 8), C.ink, { noOutline: true }), F(g.R(330, 320, 60, 26, 6), C.amber), F(g.R(80, 440, 240, 30, 6), "#555B60")];
  if (o.steam) p.push(D(g.Ls([[150, 30], [130, -20], [160, -60]]), { stroke: "#9AA", sw: 5 }), D(g.Ls([[250, 30], [270, -20], [240, -60]]), { stroke: "#9AA", sw: 5 }));
  return mk(400, 480, p);
};

export const bun = () => { const g = G(0, 0, 1); return mk(200, 140, F(g.S([[10, 110], [30, 40], [100, 15], [170, 40], [190, 110]]), "#D99A4E"), D(g.Ls([[60, 60], [100, 50], [140, 60]]), { stroke: C.white, sw: 6 })); };
export const mug = () => { const g = G(0, 0, 1); return mk(200, 180, F(g.R(20, 20, 130, 150, 18), C.white), D(g.Ls([[150, 60], [190, 80], [190, 120], [150, 140]]), { sw: 8 }), F(g.R(30, 30, 110, 26, 6), "#8B5A2B", { streak: false })); };

export const counter = () => {
  const g = G(0, 0, 1); const parts: Part[] = [];
  parts.push(...personParts(330, 40, 1.0, { coat: C.white, hat: "nurse" }));
  parts.push(F(g.R(100, 260, 600, 200, 8), C.brown));
  parts.push(F(g.R(160, 120, 140, 140, 28), C.steel));
  parts.push(...personParts(720, 160, 0.95, { coat: C.blue, hat: "scarf" }), ...personParts(860, 170, 0.9, { coat: C.olive, hat: "cap" }));
  parts.push(F(g.R(820, 300, 40, 44, 6), C.white), F(g.R(960, 300, 40, 44, 6), C.white));
  return mk(1000, 470, parts);
};

export const crowdGrid = (cols = 12, rows = 5) => {
  const parts: Part[] = []; const g = G(0, 0, 1);
  const cs = [C.blue, C.khaki, C.olive, C.amber, C.steel, C.orange2];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = 40 + c * 70 + (r % 2) * 30, y = 40 + r * 70;
    parts.push(F(g.R(x - 26, y + 22, 52, 30, 12), cs[(r * cols + c) % cs.length], { streak: false }), F(g.E(x, y, 22), C.skin, { streak: false }));
  }
  return mk(cols * 70 + 70, rows * 70 + 40, parts);
};

export const toiletIcon = () => { const g = G(0, 0, 1); return mk(160, 200, F(g.R(20, 10, 70, 80, 10), C.lgrey), F(g.S([[20, 100], [140, 100], [120, 160], [80, 190], [40, 160]]), C.white)); };
export const bucketIcon = () => { const g = G(0, 0, 1); return mk(160, 200, F(g.P([[20, 60], [140, 60], [120, 190], [40, 190]]), C.steel), D(g.Ls([[20, 60], [80, 0], [140, 60]]), { sw: 5 })); };

export const tunnelArch = (o: { smell?: boolean; water?: number; dark?: boolean } = {}) => {
  const g = G(0, 0, 1); const p: Part[] = [F(g.Arch(40, 40, 760, 560), C.tile)];
  for (let i = 1; i < 6; i++) p.push(D(g.L([[60, 600 - i * 80], [780, 600 - i * 80]]), { stroke: "#BFB59A", sw: 3 }));
  p.push(F(g.R(40, 560, 760, 60), "#8E979C", { streak: false }));
  if (o.water) p.push(F(g.P([[42, 620 - o.water], [798, 620 - o.water], [798, 620], [42, 620]]), C.water));
  if (o.smell) [[220, 400], [420, 360], [620, 420]].forEach(([x, y]) => p.push(D(g.Ls([[x, y], [x + 20, y - 50], [x - 10, y - 100], [x + 20, y - 150]]), { stroke: C.green, sw: 7 })));
  return mk(840, 640, p);
};

export const thermometer = () => { const g = G(0, 0, 1); return mk(140, 460, F(g.R(45, 10, 50, 360, 25), C.white), F(g.E(70, 390, 55), C.red), F(g.R(58, 120, 24, 270, 10), C.red, { noOutline: true })); };

export const mosquito = () => {
  const g = G(0, 0, 1);
  return mk(600, 360,
    F(g.S([[120, 220], [300, 190], [480, 210], [300, 250]]), "#6E6258"),
    F(g.E(470, 200, 44, 40), "#5A4F47"),
    F(g.S([[250, 190], [200, 40], [320, 80], [300, 190]]), "#DDEFF8"), F(g.S([[330, 195], [380, 40], [450, 120], [350, 200]]), "#DDEFF8"),
    D(g.L([[510, 210], [590, 240]]), { sw: 4 }),
    D(g.Ls([[200, 230], [150, 300], [120, 350]]), { sw: 4 }), D(g.Ls([[280, 240], [260, 310], [250, 350]]), { sw: 4 }), D(g.Ls([[360, 235], [390, 300], [420, 350]]), { sw: 4 }),
  );
};

export const sprayer = () => {
  const g = G(0, 0, 1); const p: Part[] = [F(g.R(80, 120, 160, 260, 40), C.steel), F(g.R(140, 20, 40, 110, 8), "#555B60"), F(g.R(100, 10, 120, 24, 8), C.ink, { noOutline: true }), D(g.Ls([[240, 300], [320, 260], [380, 200]]), { sw: 7 })];
  [[410, 180], [440, 150], [420, 130], [460, 190], [470, 140]].forEach(([x, y]) => p.push(F(g.E(x, y, 7), "#9CC5DD", { noOutline: true })));
  return mk(490, 400, p);
};

export const firstAid = () => {
  const g = G(0, 0, 1);
  return mk(900, 420, ...personParts(560, 60, 1.15, { coat: C.white, hat: "nurse", skirt: true }),
    F(g.R(60, 140, 420, 260, 16), C.white), F(g.R(60, 140, 420, 70, 16), C.green, { streak: false }), D(g.T(270, 192, "FIRST AID", 50, { color: C.white })),
    F(g.R(150, 260, 240, 90, 10), C.khaki), D(g.L([[270, 270], [270, 340]]), { sw: 6 }));
};

export const bookshelf = () => { const g = G(0, 0, 1); const p: Part[] = [F(g.R(10, 10, 280, 260, 8), C.brown)]; [C.red, C.blue, C.green, C.amber, C.navy, C.orange].forEach((c, i) => p.push(F(g.R(30 + i * 40, 40, 32, 100, 4), c, { streak: false }))); [C.olive, C.red, C.blue, C.khaki, C.amber].forEach((c, i) => p.push(F(g.R(30 + i * 48, 155, 40, 100, 4), c, { streak: false }))); return mk(300, 280, p); };
export const gramophone = () => { const g = G(0, 0, 1); return mk(300, 300, F(g.R(40, 200, 220, 90, 10), C.brown), F(g.P([[150, 200], [140, 120], [60, 20], [270, 40], [170, 120]]), C.amber), D(g.L([[150, 200], [150, 120]]), { sw: 6 })); };
export const projector = () => { const g = G(0, 0, 1); return mk(320, 280, F(g.R(40, 140, 200, 110, 14), C.steel), F(g.E(90, 90, 50), "#555B60"), F(g.E(200, 90, 50), "#555B60"), F(g.R(240, 170, 60, 50, 8), C.ink, { noOutline: true })); };
export const house = (o: { q?: boolean } = {}) => { const g = G(0, 0, 1); return mk(300, 300, F(g.R(40, 130, 220, 160), "#B5543A"), F(g.P([[20, 140], [150, 30], [280, 140]]), "#5E3A2A"), F(g.R(125, 200, 50, 90), C.dbrown), F(g.R(60, 160, 46, 40), C.amber, { streak: false }), F(g.R(194, 160, 46, 40), C.amber, { streak: false }), ...(o.q ? [D(g.T(250, 60, "?", 110, { color: C.red }))] : [])); };
export const factory = () => { const g = G(0, 0, 1); return mk(300, 260, F(g.P([[10, 250], [10, 120], [90, 70], [90, 120], [170, 70], [170, 120], [250, 70], [250, 250]]), C.steel), F(g.R(250, 20, 36, 230), "#7A3B2B")); };
export const school = () => { const g = G(0, 0, 1); return mk(300, 260, F(g.R(30, 110, 240, 140), C.amber), F(g.P([[10, 120], [150, 20], [290, 120]]), C.red), F(g.R(125, 170, 50, 80), C.dbrown)); };

export const puffParts = (ox: number, oy: number, k: number): Part[] => {
  const g = G(ox, oy, k);
  const pts: Pt[] = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const r = i % 2 ? 150 : 100; pts.push([200 + Math.cos(a) * r * 1.2, 160 + Math.sin(a) * r * 0.9]); }
  const pts2: Pt[] = pts.map(([x, y]) => [200 + (x - 200) * 0.55, 160 + (y - 160) * 0.55]);
  return [F(g.S(pts), C.orange), F(g.S(pts2), C.yellow, { streak: false })];
};
export const puff = () => mk(400, 320, puffParts(0, 0, 1));

export const busInCrater = () => {
  const g = G(0, 0, 1);
  const body = rot(rectPts(330, 60, 420, 300), 540, 210, 28);
  const win1 = rot(rectPts(360, 90, 360, 60), 540, 210, 28), win2 = rot(rectPts(360, 200, 360, 60), 540, 210, 28);
  return mk(1000, 560,
    F(g.P([[0, 300], [1000, 300], [1000, 560], [0, 560]]), C.soil, { streak: false }),
    F(g.S([[160, 300], [500, 280], [850, 300], [760, 500], [500, 540], [240, 500]]), "#5C4630", { streak: false }),
    F(g.P(body), C.red), F(g.P(win1), "#CFE8F7", { streak: false }), F(g.P(win2), "#CFE8F7", { streak: false }),
    D(g.L([[0, 300], [160, 300]]), { sw: 6 }), D(g.L([[850, 300], [1000, 300]]), { sw: 6 }));
};

export const wreath = (txt?: string) => {
  const g = G(0, 0, 1);
  const p: Part[] = [F({ d: E(150, 150, 130).d + " " + E(150, 150, 82).d, bb: [20, 20, 280, 280] }, C.green, { streak: false })];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p.push(D(g.Ls([[150 + Math.cos(a) * 92, 150 + Math.sin(a) * 92], [150 + Math.cos(a + 0.25) * 120, 150 + Math.sin(a + 0.25) * 120]]), { stroke: "#1E6B32", sw: 5 })); }
  if (txt) p.push(D(g.T(150, 182, txt, txt.length > 2 ? 74 : 92, { color: C.red })));
  return mk(300, 300, p);
};

export const bridge = () => { const g = G(0, 0, 1); const p: Part[] = [F(g.R(0, 200, 700, 40), C.steel)]; for (let i = 0; i < 7; i++) p.push(D(g.L([[i * 100, 200], [i * 100 + 50, 90], [i * 100 + 100, 200]]), { sw: 7 })); p.push(D(g.L([[0, 90], [700, 90]]), { sw: 7 })); p.push(F(g.S([[150, 250], [350, 300], [550, 250], [450, 340], [250, 340]]), "#5C4630", { streak: false })); return mk(700, 350, p); };

export const deepShelter = () => {
  const g = G(0, 0, 1);
  return mk(1100, 760, F(g.P([[0, 80], [1100, 80], [1100, 760], [0, 760]]), C.soil, { streak: false }), D(g.L([[0, 80], [1100, 80]]), { sw: 8 }),
    F(g.E(550, 260, 150, 80), "#C9CED1"), D(g.T(550, 275, "old Tube", 44, { font: "cb" })),
    F(g.E(370, 610, 170, 110), "#E3D8BE"), F(g.E(730, 610, 170, 110), "#E3D8BE"), F(g.R(520, 590, 60, 40, 6), "#C9B892", { streak: false }),
    D(g.L([[550, 350], [550, 470]]), { stroke: C.red, sw: 10 }), D(g.L([[520, 440], [550, 480], [580, 440]]), { stroke: C.red, sw: 10 }));
};

export const calendar = (big: string) => { const g = G(0, 0, 1); return mk(300, 320, F(g.R(10, 30, 280, 280, 14), C.white), F(g.R(10, 30, 280, 70, 14), C.red, { streak: false }), D(g.L([[80, 10], [80, 50]]), { sw: 9 }), D(g.L([[220, 10], [220, 50]]), { sw: 9 }), D(g.T(150, 230, big, 96, { color: C.ink }))); };
export const clover = () => { const g = G(0, 0, 1); const lf = (cx: number, cy: number) => F(g.E(cx, cy, 52), C.green); return mk(300, 320, lf(100, 100), lf(200, 100), lf(100, 200), lf(200, 200), D(g.Ls([[150, 200], [170, 260], [210, 310]]), { stroke: "#1E6B32", sw: 9 })); };
export const paintLine = () => { const g = G(0, 0, 1); return mk(320, 200, F(g.R(10, 60, 300, 100, 8), "#B9BEC1", { streak: false }), D(g.L([[30, 110], [290, 110]]), { stroke: C.white, sw: 14 }), F(g.R(240, 10, 50, 70, 8), C.white)); };
export const archIcon = () => { const g = G(0, 0, 1); return mk(300, 280, F(g.Arch(10, 10, 280, 260), C.tile), F(g.Arch(70, 80, 160, 190), "#3A3A3A", { streak: false })); };
export const clipboard = () => { const g = G(0, 0, 1); const p: Part[] = [F(g.R(20, 40, 360, 460, 16), C.brown), F(g.R(50, 80, 300, 400, 6), C.white, { streak: false }), F(g.R(140, 20, 120, 50, 10), C.steel)]; for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) p.push(D(g.L([[90 + i * 22, 130 + r * 80], [90 + i * 22, 180 + r * 80]]), { sw: 5 })); for (let r = 0; r < 4; r++) p.push(D(g.L([[80, 185 + r * 80], [180, 125 + r * 80]]), { sw: 5 })); return mk(400, 520, p); };

export const stackedBar = (full: boolean, only?: number) => {
  const g = G(0, 0, 1); const W = 1500; const segs: [number, string, string][] = [[0.04, C.blue, "4% Tube"], [0.09, C.olive, "9% public"], [0.27, C.orange2, "27% home shelters"]];
  if (full) segs.push([0.6, C.grey, "~60% at home"]);
  const p: Part[] = []; let x = 0;
  segs.forEach(([f, c, l], i) => { const w = Math.max(f * W, 40); if (only !== undefined && i !== only) { x += w; return; } p.push(F(g.R(x, 120, w, 140, 4), c, { streak: false })); p.push(D(g.T(x + w / 2 + (i === 0 ? 30 : 0), i % 2 ? 340 : 80, l, 62, { color: C.red, font: "cb" }))); x += w; });
  return mk(W + 20, 360, p);
};

export const stairwell = (o: { arrows?: boolean } = {}) => {
  const g = G(0, 0, 1); const p: Part[] = [];
  const pts: Pt[] = [[0, 80]]; for (let i = 0; i < 19; i++) { pts.push([i * 52 + 52, 80 + i * 30]); pts.push([i * 52 + 52, 110 + i * 30]); }
  pts.push([1040, 650], [0, 650]);
  p.push(F(g.P(pts), C.steel));
  p.push(F(g.E(980, 60, 30), C.yellow, { streak: false }), D(g.L([[980, 0], [980, 30]]), { sw: 4 }));
  if (o.arrows) [[60, 20], [260, 120], [460, 240]].forEach(([x, y]) => { p.push(D(g.L([[x, y], [x + 160, y + 92]]), { stroke: C.red, sw: 9 }), D(g.L([[x + 120, y + 100], [x + 160, y + 92], [x + 140, y + 56]]), { stroke: C.red, sw: 9 })); });
  if (o.arrows) p.push(D(g.L([[880, 560], [920, 600]]), { stroke: C.red, sw: 10 }), D(g.L([[920, 560], [880, 600]]), { stroke: C.red, sw: 10 }));
  return mk(1040, 660, p);
};

export const rocketBattery = () => { const g = G(0, 0, 1); const p: Part[] = [F(g.P([[40, 300], [360, 300], [330, 360], [70, 360]]), C.olive)]; [0, 1, 2, 3].forEach(i => p.push(F(g.P(rot(rectPts(110 + i * 50, 90, 34, 220), 200, 300, -30)), "#5B6168", { streak: false }))); [[330, 80], [370, 50], [410, 20]].forEach(([x, y], i) => p.push(D(g.Ls([[x, y + 60], [x + 30, y + 30], [x, y]]), { stroke: C.ink, sw: 5 }))); return mk(460, 380, p); };
export const folder = () => { const g = G(0, 0, 1); return mk(520, 400, F(g.P([[10, 60], [180, 60], [210, 20], [510, 20], [510, 390], [10, 390]]), C.khaki), D(g.R(110, 170, 300, 110, 10), { stroke: C.red, sw: 10, }), D(g.T(260, 252, "SECRET", 76, { color: C.red, rot: -6 }))); };
export const sunStation = () => { const g = G(0, 0, 1); return mk(520, 460, F(g.E(380, 110, 80), C.yellow), F(g.R(40, 220, 360, 230), "#D9D4C4", { streak: false }), F(g.Arch(140, 280, 160, 170), "#3A3A3A", { streak: false }), ...personParts(180, 330, 0.36, { coat: C.blue }), ...personParts(230, 320, 0.38, { coat: C.olive, hat: "cap" })); };
export const handsTogether = () => mk(320, 320, ...personParts(20, 10, 1, { coat: C.blue, hat: "scarf" }), ...personParts(160, 10, 1, { coat: C.olive, hat: "cap" }), F(G().E(150, 190, 18), C.skin));
export const andersonShelter = () => { const g = G(0, 0, 1); return mk(760, 460, F(g.R(0, 330, 760, 130), C.green, { streak: false }), F(g.Arch(120, 70, 520, 330), C.steel), F(g.S([[100, 140], [380, 30], [660, 140], [600, 120], [380, 60], [160, 120]]), C.soil, { streak: false }), F(g.R(320, 250, 120, 150, 8), "#3A3A3A", { streak: false }), ...[1, 2, 3, 4, 5].map(i => D(g.L([[120 + i * 87, 140], [120 + i * 87, 400]]), { stroke: "#4A555D", sw: 3 }))); };
export const siren = () => { const g = G(0, 0, 1); return mk(300, 300, F(g.R(130, 140, 40, 150, 8), C.steel), F(g.S([[60, 140], [80, 60], [220, 60], [240, 140]]), C.grey), D(g.Ls([[250, 70], [285, 100], [250, 130]]), { sw: 5 }), D(g.Ls([[50, 70], [15, 100], [50, 130]]), { sw: 5 })); };
export const sign = (txt: string) => { const g = G(0, 0, 1); return mk(520, 200, F(g.R(10, 10, 500, 140, 12), C.white), D(g.T(260, 105, txt, 56, { color: C.ink })), D(g.L([[30, 30], [490, 130]]), { stroke: C.red, sw: 12 })); };
export const mapPins = () => { const g = G(0, 0, 1); const pin = (x: number, y: number) => F(g.S([[x, y + 90], [x - 40, y + 20], [x, y - 20], [x + 40, y + 20]]), C.red); return mk(420, 360, pin(100, 60), pin(300, 160), D(g.T(100, 210, "Trafalgar Sq.", 34, { font: "cb" })), D(g.T(300, 320, "Bounds Green", 34, { font: "cb" }))); };
export const exerciseBook = () => { const g = G(0, 0, 1); return mk(360, 260, F(g.P([[10, 40], [180, 20], [180, 240], [10, 250]]), C.white), F(g.P([[180, 20], [350, 40], [350, 250], [180, 240]]), C.white), ...[0, 1, 2, 3].map(i => D(g.L([[40, 90 + i * 40], [160, 80 + i * 40]]), { stroke: C.blue, sw: 3 })), F(g.P(rot(rectPts(220, 60, 24, 180), 232, 150, 35)), C.amber)); };
export const boltCrossed = () => { const g = G(0, 0, 1); return mk(260, 300, F(g.P([[140, 10], [50, 160], [120, 160], [90, 290], [210, 110], [140, 110], [190, 10]]), C.yellow), D(g.L([[20, 30], [240, 270]]), { stroke: C.red, sw: 14 })); };
export const qmark = (color = C.red) => mk(200, 260, D(G().T(100, 230, "?", 260, { color })));
export const crack = () => mk(800, 120, D(G().L([[0, 60], [120, 40], [200, 90], [330, 30], [420, 80], [560, 20], [660, 70], [800, 40]]), { sw: 7 }));
export const platformSign = () => { const g = G(0, 0, 1); return mk(700, 360, F(g.R(330, 160, 40, 200, 6), C.steel), F(g.R(20, 20, 660, 170, 16), C.white), D(g.R(40, 40, 620, 130, 10), { stroke: C.navy, sw: 8 }), D(g.T(350, 135, "PLATFORM", 80, { color: C.navy }))); };
export const passage = () => { const g = G(0, 0, 1); return mk(900, 520, F(g.P([[0, 200], [900, 200], [900, 520], [0, 520]]), C.soil, { streak: false }), D(g.L([[0, 200], [900, 200]]), { sw: 8 }), F(g.R(150, 300, 600, 160, 30), "#C9CED1"), D(g.T(450, 400, "subway", 50, { font: "cb" }))); };
export const bookingHall = () => { const g = G(0, 0, 1); return mk(1000, 600, F(g.P([[0, 160], [1000, 160], [1000, 600], [0, 600]]), C.soil, { streak: false }), D(g.L([[0, 160], [1000, 160]]), { sw: 8 }), F(g.R(150, 260, 700, 260, 20), "#D9D4C4"), F(g.R(250, 330, 160, 120, 10), C.brown), F(g.R(560, 330, 160, 120, 10), C.brown), D(g.T(500, 300, "BOOKING HALL", 40))); };
export const bigText = (txt: string, color = C.red, size = 220) => mk(Math.max(300, txt.length * size * 0.62), size * 1.2, D(G().T(Math.max(300, txt.length * size * 0.62) / 2, size, txt, size, { color })));
export const bomb = () => { const g = G(0, 0, 1); return mk(200, 300, F(g.S([[100, 10], [150, 60], [160, 200], [100, 290], [40, 200], [50, 60]]), "#4B5157"), F(g.P([[60, 20], [140, 20], [150, -10], [50, -10]]), "#4B5157")); };
export const linePlatform = () => paintLine();
export const guard = () => person({ coat: C.navy, hat: "peaked" });
export const worker = () => person({ coat: "#4E6A8A", hat: "cap" });
export const soldier = () => person({ coat: C.olive, hat: "helmet" });
export const mother = () => person({ coat: C.blue, hat: "scarf", skirt: true });
export const crates = () => { const g = G(0, 0, 1); return mk(300, 220, F(g.R(10, 80, 130, 130, 6), C.brown), F(g.R(150, 110, 130, 100, 6), C.amber), D(g.L([[10, 80], [140, 210]]), { sw: 4 }), D(g.L([[140, 80], [10, 210]]), { sw: 4 })); };
export const benchFigure = () => { const g = G(0, 0, 1); return mk(360, 360, F(g.R(20, 220, 320, 30, 6), C.brown), F(g.R(40, 250, 24, 90, 4), C.dbrown), F(g.R(300, 250, 24, 90, 4), C.dbrown), ...personParts(110, 20, 0.85, { coat: C.steel, hat: "cap" }), D(g.T(300, 110, "?", 120, { color: C.red }))); };
export const familyPair = () => mk(260, 320, ...personParts(0, 0, 1, { coat: C.blue, hat: "scarf", skirt: true }), ...childParts(130, 84, 1, C.red));
export const childrenReading = () => { const g = G(0, 0, 1); return mk(620, 360, F(g.R(10, 260, 600, 80, 16), C.khaki), ...sleeperParts(30, 180, 0.9, C.blue), ...childParts(380, 90, 1, C.red), F(g.R(470, 200, 90, 60, 6), C.white), D(g.L([[515, 200], [515, 260]]), { sw: 4 })); };

export const helmet = () => { const g = G(0, 0, 1); return mk(320, 220, F(g.S([[20, 180], [40, 70], [160, 20], [280, 70], [300, 180]]), C.olive), F(g.R(0, 170, 320, 36, 16), "#55632C")); };
export const toiletsBuckets = () => { const g = G(0, 0, 1); const p: Part[] = []; for (let i = 0; i < 4; i++) { const x = i * 120; p.push(F(g.R(x + 20, 10, 50, 56, 8), C.lgrey, { streak: false }), F(g.S([[x + 15, 74], [x + 105, 74], [x + 90, 120], [x + 60, 140], [x + 30, 120]]), C.white, { streak: false })); } for (let i = 0; i < 4; i++) { const x = i * 120; p.push(F(g.P([[x + 15, 210], [x + 105, 210], [x + 92, 300], [x + 28, 300]]), C.steel, { streak: false }), D(g.Ls([[x + 15, 210], [x + 60, 168], [x + 105, 210]]), { sw: 4 })); } return mk(480, 310, p); };
export const platformOverlay = (far: number, near: number) => { const p: Part[] = []; for (let i = 0; i < far; i++) p.push(...sleeperParts(40 + i * 250, 140, 0.8, [C.khaki, C.blue, C.olive, C.amber, C.orange2][i % 5])); for (let i = 0; i < near; i++) p.push(...sleeperParts(80 + i * 250, 220, 0.75, [C.blue, C.amber, C.khaki, C.olive, C.orange2][i % 5])); return mk(1300, 460, p); };
export const crossFamily = () => { const top = 300; return mk(1300, 880, [...personParts(1000, top + 170, 0.42, { coat: C.blue, hat: "scarf" }), ...childParts(1040, top + 230, 0.42, C.red), ...personParts(1000, top + 300, 0.42, { coat: C.olive, hat: "cap", bundle: C.khaki })]); };
export const tunnelSleepers = () => mk(680, 460, [[170, 380], [310, 330], [230, 270]].flatMap(([x, y], i) => sleeperParts(x, y, 0.55, [C.khaki, C.blue, C.amber][i])));
export const check = (color = C.red) => mk(200, 200, D(G().L([[20, 110], [80, 170], [180, 30]]), { stroke: color, sw: 16 }));
export const xmark = (color = C.red) => mk(200, 200, D(G().L([[30, 30], [170, 170]]), { stroke: color, sw: 16 }), D(G().L([[170, 30], [30, 170]]), { stroke: color, sw: 16 }));
export const trainCrossed = () => { const t = trainIcon(); return mk(300, 160, ...t.parts, D(G().L([[10, 10], [290, 150]]), { stroke: C.red, sw: 14 }), D(G().L([[290, 10], [10, 150]]), { stroke: C.red, sw: 14 })); };
export const memorialNumber = (txt: string) => wreath(txt);

