import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SPR } from "./sprites";
import {
  BARREL,
  CAM_A,
  CAM_C,
  CAM_D,
  CAM_E,
  CAM_F,
  CAT,
  CUT,
  DURATION,
  EG,
  FEET,
  FPS,
  G,
  GUY,
  HR,
  NERDS,
  SET,
  SHAFT,
  SIGN,
  T,
  TABLET,
  VO_AT,
  WH,
  WW,
  headAt,
  poseBox,
  type PoseName,
} from "./scene";
import {
  camAt,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  lerp,
  pop,
  prog,
  rnd,
  shake,
  spring,
  type Cam,
} from "../shared/anim";
import { World } from "../shared/World";
import { Eye } from "../shared/Face";
import { PuffCluster, type Puff } from "../shared/Puffs";
import { SweatDrop } from "../shared/SweatDrop";
import { SoundCues, type Cue } from "../shared/Sound";
import { useFont } from "../shared/useFont";

const F = (n: string) => staticFile(`nuclear-warning/${n}.png`);
export const FONT = "NukeWarnInter";
export const SERIF = "NukeWarnSerif";
export const useNukeFonts = () => {
  useFont(FONT, staticFile("fonts/Inter-Black.otf"));
  useFont(SERIF, staticFile("fonts/FreeSerifBoldItalic.ttf"));
};

const YEL = "#F5C518";
const YEL_SH = "#D9A70F";
const GOO = "#9CFF3A";
const GOO_LITE = "#D8FF9E";
const SOIL1 = "#7B4A24";
const SOIL2 = "#96643A";
const SOIL3 = "#6B3F1F";
const LOOSE = "#A9774A";
const HOLE = "#3E2615";
const ROCK = "#9A948C";
const GRASS = "#6FB04A";
const SAND = "#E9C98B";
const SAND_DK = "#D9B26F";
const SKY = "#9ED3F0";
const GHOST = "#A58BDC";
const GHOST_SH = "#8A6FC4";
const STONE = "#B9B2A6";
const STONE_SH = "#A39C90";
const GOLD = "#FFC83D";
const MIX_DB = 4.0; // Remotion's mix peaks low (lessons): lift voice + effects together

type P = [number, number];

// ---------- sounds (all ElevenLabs: new for this video + reused from sfx-library) ----------
const KNOCKS = [0.25, 1.0, T.sign];
const CUES: Cue[] = [
  { f: "knock", at: KNOCKS[0], db: -13 },
  { f: "knock", at: KNOCKS[1], db: -13, rate: 0.95 },
  { f: "knock", at: KNOCKS[2], db: -12, rate: 0.9 },
  { f: "stamp", at: 1.9, db: -20, rate: 1.3 }, // the plank snaps
  { f: "whoosh", at: 1.98, db: -27, rate: 0.75 },
  { f: "stamp", at: 2.6, db: -15, rate: 0.7 }, // the barrel lands at the bottom
  { f: "catch", at: 2.8, db: -21, rate: 0.8 }, // dirt pours in
  { f: "catch", at: 3.05, db: -23, rate: 0.7 },
  { f: "pop", at: 3.6, db: -21, rate: 0.85 }, // the barrel opens its eyes
  { f: "geiger", at: 4.05, db: -22, dur: 1.9, keys: [[4.05, -22], [5.6, -26], [5.95, -45]] },
  { f: "ticks", at: T.over, db: -25, dur: 1.25 },
  { f: "pop", at: T.thousand, db: -19, rate: 0.8 }, // the guy is gone (time passes)
  { f: "creak", at: 5.98, db: -17 },
  { f: "stamp", at: T.years, db: -16 }, // 10,000+
  { f: "flip", at: CUT.B + 0.02, db: -19 }, // the scroll
  { f: "pop", at: T.read - 0.04, db: -26, rate: 1.2 },
  { f: "pop", at: 9.05, db: -23, rate: 0.9 }, // sweat drop
  { f: "boing", at: T.ago + 0.02, db: -26, rate: 1.3 }, // ???
  { f: "whoosh", at: CUT.C + 0.02, db: -28, rate: 1.3 }, // skull sign up
  { f: "boing", at: T.pictures + 0.02, db: -26, rate: 1.1 },
  { f: "curse", at: 11.95, db: -15 }, // the curse ghost rises
  { f: "pop", at: 12.42, db: -23, rate: 0.8 },
  { f: "curse", at: 13.5, db: -24, rate: 1.25 }, // ghost puffs up at the robber
  { f: "pop", at: T.figured, db: -22 }, // thought bubble
  { f: "kaching", at: T.treasure, db: -16 },
  { f: "whoosh", at: 14.9, db: -23, rate: 1.2 }, // dives in
  { f: "kaching", at: 15.3, db: -21, rate: 1.15 },
  { f: "pop", at: T.eighties, db: -21 }, // 1984
  { f: "pop", at: T.two, db: -21, rate: 0.9 },
  { f: "pop", at: T.two + 0.15, db: -22, rate: 1.1 },
  { f: "meow", at: T.cats, db: -17 },
  { f: "geiger", at: 18.65, db: -23, dur: 1.5, keys: [[18.65, -23], [19.9, -27], [20.15, -45]] },
  { f: "hiss", at: T.color - 0.04, db: -18, dur: 1.4 },
  { f: "boing", at: T.radiation + 0.06, db: -27, rate: 1.2 },
  { f: "grind", at: T.plus, db: -22, dur: 0.6, keys: [[T.plus, -22], [21.2, -26], [21.34, -45]] },
  { f: "stamp", at: T.legend + 0.02, db: -17, rate: 0.8 },
  { f: "pop", at: 21.28, db: -24, rate: 1.0 },
  { f: "pop", at: 21.48, db: -24, rate: 1.15 },
  { f: "pop", at: 21.68, db: -23, rate: 0.9 },
  { f: "knock", at: 22.2, db: -15 },
  { f: "meow", at: T.cat - 0.04, db: -19, rate: 1.1 },
  { f: "geiger", at: 22.62, db: -23, dur: 1.6, keys: [[22.62, -23], [23.9, -26], [24.2, -45]] },
  { f: "hiss", at: T.color2 - 0.06, db: -17, dur: 1.4 },
  { f: "pop", at: 23.28, db: -22, rate: 1.2 }, // "!"
  { f: "zip", at: T.run - 0.02, db: -13 },
];

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const Svg: React.FC<{ children: React.ReactNode; w?: number; h?: number }> = ({ children, w = WW, h = 3600 }) => (
  <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={w} height={h}>
    {children}
  </svg>
);
// a sprite placed by its anchor (ax, ay in sprite px) at world (x, y), scaled s
const Spr: React.FC<{
  n: string;
  x: number;
  y: number;
  s: number;
  ax: number;
  ay: number;
  rot?: number;
  sx?: number;
  sy?: number;
  filter?: string;
}> = ({ n, x, y, s, ax, ay, rot = 0, sx = 1, sy = 1, filter }) => {
  const sp = SPR[n as keyof typeof SPR] as { w: number; h: number };
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: "0 0" }}>
      <Img
        src={F(n)}
        style={{ position: "absolute", left: -ax * s, top: -ay * s, width: sp.w * s, height: sp.h * s, filter }}
      />
    </div>
  );
};
const Label: React.FC<{ x: number; y: number; size: number; text: string; s?: number; rot?: number; color?: string; stroke?: number }> = ({
  x,
  y,
  size,
  text,
  s = 1,
  rot = 0,
  color = "#fff",
  stroke,
}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${stroke ?? size * 0.16}px #000`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );

// anticipation squash before a swap, stretch + damped settle after it
const squashSwap = (t: number, tSwap: number) => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};

// ---------- the guy (any pose) ----------
type GuyState = { pose: PoseName; fx: number; fy: number; hr: number; sx: number; sy: number; rot: number; shadow: number; flip?: boolean };
const Guy: React.FC<{ g: GuyState }> = ({ g }) => {
  const b = poseBox(g.pose, g.fx, g.fy, g.hr);
  return (
    <>
      {g.shadow > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: g.fx - g.hr * 1.4,
            top: FEET - g.hr * 0.15,
            width: g.hr * 2.8,
            height: g.hr * 0.3,
            borderRadius: "50%",
            background: `rgba(52, 70, 30, ${0.28 * g.shadow})`,
            filter: "blur(3px)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: g.fx,
          top: g.fy,
          transform: `rotate(${g.rot}deg) scale(${g.sx * (g.flip ? -1 : 1)}, ${g.sy})`,
          transformOrigin: "0 0",
        }}
      >
        <Img
          src={F(g.pose)}
          style={{ position: "absolute", left: b.left - g.fx, top: b.top - g.fy, width: b.width, height: b.height }}
        />
      </div>
    </>
  );
};

// ---------- the barrel (drawn in code: the generated one was blocked by the content filter) ----------
type Face = {
  open: number;
  lid: number;
  tilt: number;
  look: P;
  squeeze: boolean;
  brow: number;
  browTilt: number;
  mouth: "worry" | "grin" | "o" | "flat";
};
export const Trefoil: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => {
  const blade = (a: number) => {
    const a0 = ((a - 30) * Math.PI) / 180;
    const a1 = ((a + 30) * Math.PI) / 180;
    const r0 = r * 0.32;
    return `M ${x + r0 * Math.cos(a0)} ${y + r0 * Math.sin(a0)} L ${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${
      x + r * Math.cos(a1)
    } ${y + r * Math.sin(a1)} L ${x + r0 * Math.cos(a1)} ${y + r0 * Math.sin(a1)} A ${r0} ${r0} 0 0 0 ${x + r0 * Math.cos(a0)} ${
      y + r0 * Math.sin(a0)
    } Z`;
  };
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.18} fill="#FFE27A" stroke="#000" strokeWidth={5} />
      {[90, 210, 330].map((a) => (
        <path key={a} d={blade(a)} fill="#111" />
      ))}
      <circle cx={x} cy={y} r={r * 0.2} fill="#111" />
    </g>
  );
};
const Barrel: React.FC<{ x: number; y: number; sx?: number; sy?: number; rot?: number; face: Face; t: number; glow: number }> = ({
  x,
  y,
  sx = 1,
  sy = 1,
  rot = 0,
  face,
  t,
  glow,
}) => {
  const w = BARREL.w;
  const h = BARREL.h;
  const hw = w / 2;
  const drip = (i: number) => {
    const ph = (t * 0.55 + i * 0.37) % 1;
    return 22 + 70 * Math.sin(Math.PI * ph); // grows and shrinks back (no wrap jump)
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
      {glow > 0.01 ? (
        <>
          <defs>
            <radialGradient id="bglow">
              <stop offset="0%" stopColor={GOO} stopOpacity={0.55} />
              <stop offset="100%" stopColor={GOO} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={-h / 2} r={h * 1.05} fill="url(#bglow)" opacity={glow} />
        </>
      ) : null}
      {/* body */}
      <rect x={-hw} y={-h} width={w} height={h} rx={20} fill={YEL} stroke="#000" strokeWidth={8} />
      <path d={`M ${-hw + 4} ${-h + 18} L ${-hw + 52} ${-h + 18} L ${-hw + 52} ${-18} L ${-hw + 4} ${-18} Z`} fill={YEL_SH} />
      <rect x={-hw} y={-h} width={w} height={h} rx={20} fill="none" stroke="#000" strokeWidth={8} />
      <path d={`M ${-hw} ${-h + 46} Q 0 ${-h + 60} ${hw} ${-h + 46}`} fill="none" stroke="#000" strokeWidth={7} />
      <path d={`M ${-hw} -36 Q 0 -22 ${hw} -36`} fill="none" stroke="#000" strokeWidth={7} />
      {/* lid + goo over the rim */}
      <ellipse cx={0} cy={-h} rx={hw} ry={20} fill="#E8B90F" stroke="#000" strokeWidth={7} />
      <path
        d={`M ${-hw + 8} ${-h - 6} Q ${-60} ${-h - 34} ${10} ${-h - 26} Q ${80} ${-h - 36} ${hw - 6} ${-h - 4} L ${hw - 6} ${-h + 6} L ${100} ${-h + 6} L ${100} ${
          -h + drip(0)
        } Q ${89} ${-h + drip(0) + 22} ${78} ${-h + drip(0)} L ${78} ${-h + 12} L ${-78} ${-h + 12} L ${-78} ${-h + drip(1) * 0.7} Q ${-88} ${
          -h + drip(1) * 0.7 + 18
        } ${-98} ${-h + drip(1) * 0.7} L ${-98} ${-h + 10} Z`}
        fill={GOO}
        stroke="#000"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <ellipse cx={-10} cy={-h - 20} rx={30} ry={7} fill={GOO_LITE} />
      <Trefoil x={0} y={-90} r={38} />
      {/* face */}
      <Eye x={-46} y={-h + 92} r={25} open={face.open} lid={face.lid} lidTilt={face.tilt} look={face.look} squeeze={face.squeeze} side={-1} brow={face.brow} browTilt={face.browTilt} />
      <Eye x={46} y={-h + 92} r={25} open={face.open} lid={face.lid} lidTilt={face.tilt} look={face.look} squeeze={face.squeeze} side={1} brow={face.brow} browTilt={face.browTilt} />
      {face.mouth === "grin" ? (
        <g>
          <path d={`M -52 ${-h + 134} Q 0 ${-h + 186} 52 ${-h + 134} Q 0 ${-h + 154} -52 ${-h + 134} Z`} fill="#3A1A0A" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
          <path d={`M 18 ${-h + 145} L 30 ${-h + 161} L 38 ${-h + 141} Z`} fill="#fff" stroke="#000" strokeWidth={3} />
        </g>
      ) : face.mouth === "worry" ? (
        <path d={`M -36 ${-h + 146} q 9 -10 18 0 t 18 0 t 18 0 t 18 0`} fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" />
      ) : face.mouth === "o" ? (
        <ellipse cx={0} cy={-h + 148} rx={14} ry={18} fill="#3A1A0A" stroke="#000" strokeWidth={6} />
      ) : (
        <path d={`M -24 ${-h + 148} L 24 ${-h + 148}`} stroke="#000" strokeWidth={6} strokeLinecap="round" />
      )}
    </g>
  );
};

// barrel state in the field (set A animates the fall; later sets show it buried at the bottom of the shaft)
const PLANK_Y = G - 14;
const FALL0 = 1.92;
const LAND = 2.62;
const barrelAt = (t: number, set: string) => {
  const buried = set !== "A" || t >= LAND;
  let y = BARREL.landY;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  if (!buried) {
    if (t < FALL0) {
      y = PLANK_Y - 6;
      const wob = t > T.sign ? Math.sin(2 * Math.PI * 7 * (t - T.sign)) * 3 * (1 - prog(t, T.sign, FALL0) * 0.3) : 0;
      rot = wob + 4 * bump(t, KNOCKS[0], 0.25) - 4 * bump(t, KNOCKS[1], 0.25);
      const hop = 18 * bump(t, KNOCKS[0], 0.2) + 18 * bump(t, KNOCKS[1], 0.2) + 26 * bump(t, KNOCKS[2], 0.24);
      y -= hop;
    } else {
      const u = (t - FALL0) / (LAND - FALL0);
      y = lerp(PLANK_Y - 6, BARREL.landY, u * u); // gravity: y grows with the square of the time
      sy = 1 + 0.08 * u;
      sx = 1 - 0.05 * u;
      rot = 6 * Math.sin(u * 5);
    }
  } else if (set === "A") {
    const s = spring(t - LAND, 3.4, 6);
    sy = 1 - 0.16 * s;
    sx = 1 + 0.1 * s;
  }
  return { x: SHAFT.x, y, sx, sy, rot };
};
const barrelFace = (t: number, set: string, tr: number): Face => {
  const blink = (tr % 3.7) < 0.12 ? 1 : 0;
  const evil: Face = { open: 1, lid: Math.max(0.38, blink), tilt: 22, look: [-0.3, -0.5], squeeze: false, brow: 0.55, browTilt: 1.4, mouth: "grin" };
  if (set === "A") {
    if (t < FALL0) {
      const sq = KNOCKS.some((k) => t >= k && t < k + 0.16);
      return { open: 1, lid: blink, tilt: 0, look: [-0.7, -0.4], squeeze: sq, brow: 0.75, browTilt: -1.0, mouth: t > T.sign ? "o" : "worry" };
    }
    if (t < LAND + 0.1) return { open: 1, lid: 0, tilt: 0, look: [0, 0], squeeze: true, brow: 0.6, browTilt: -1, mouth: "o" };
    if (t < 3.58) return { open: 1, lid: 1, tilt: 0, look: [0, 0], squeeze: false, brow: 0.5, browTilt: 0, mouth: "flat" };
    const o = easeOutBack(prog(t, 3.58, 3.8), 2.4);
    const lid = t < T.deadly ? Math.max(0, 0.15) : evil.lid;
    return { ...evil, open: Math.max(0.6, o), lid: t < 3.8 ? lerp(1, 0.15, prog(t, 3.58, 3.7)) : lid, tilt: t < T.deadly ? 6 : 22, look: [0, 0], mouth: t < 3.9 ? "flat" : "grin" };
  }
  return evil;
};

// ---------- the field: plate, soil cut-away, shaft, plank, sign ----------
const soilBands = (() => {
  const wave = (y0: number, amp: number, seed: number) => {
    const pts: P[] = [];
    for (let x = -400; x <= 1940; x += 80) pts.push([x, y0 + amp * Math.sin(x * 0.006 + seed) + amp * 0.5 * Math.sin(x * 0.017 + seed * 2)]);
    return pts;
  };
  return { b1: wave(2290, 22, 1.2), b2: wave(2660, 26, 3.1) };
})();
const pathOf = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
const ROCKS = [
  [180, 2180, 38, 22],
  [420, 2420, 52, 30],
  [760, 2230, 30, 18],
  [300, 2780, 60, 34],
  [700, 2920, 44, 26],
  [1420, 2350, 46, 26],
  [1350, 2850, 56, 30],
  [880, 2560, 26, 16],
  [40, 2560, 40, 24],
] as const;
const Soil: React.FC<{ t: number; set: string }> = ({ t, set }) => {
  // fill of the shaft: open until the barrel lands, then loose dirt pours in up to the surface
  const fillTop = set === "A" ? lerp(SHAFT.bottom, G, easeInOutCubic(prog(t, 2.78, 3.4))) : G;
  const sx0 = SHAFT.x - SHAFT.hw;
  const sx1 = SHAFT.x + SHAFT.hw;
  const lumps = (y: number) => {
    let d = `M ${sx0} ${y}`;
    for (let i = 0; i <= 6; i++) d += ` Q ${sx0 + (i + 0.5) * (2 * SHAFT.hw) / 6} ${y - 16 - 8 * Math.sin(i * 2.1)} ${sx0 + (i + 1) * (2 * SHAFT.hw) / 6} ${y}`;
    return d;
  };
  return (
    <g>
      <rect x={-400} y={G} width={2340} height={1700} fill={SOIL1} />
      <path d={`${pathOf(soilBands.b1)} L 1940 3700 L -400 3700 Z`} fill={SOIL2} stroke="#000" strokeWidth={6} />
      <path d={`${pathOf(soilBands.b2)} L 1940 3700 L -400 3700 Z`} fill={SOIL3} stroke="#000" strokeWidth={6} />
      {ROCKS.map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={ROCK} stroke="#000" strokeWidth={5} />
      ))}
      {/* the shaft */}
      <path d={`M ${sx0} ${G} L ${sx0} ${SHAFT.bottom - 60} Q ${sx0} ${SHAFT.bottom} ${sx0 + 60} ${SHAFT.bottom} L ${sx1 - 60} ${SHAFT.bottom} Q ${sx1} ${SHAFT.bottom} ${sx1} ${SHAFT.bottom - 60} L ${sx1} ${G} Z`} fill={HOLE} stroke="#000" strokeWidth={7} />
      {fillTop < SHAFT.bottom - 2 ? (
        <path
          d={`${lumps(fillTop)} L ${sx1} ${SHAFT.bottom - 60} Q ${sx1} ${SHAFT.bottom} ${sx1 - 60} ${SHAFT.bottom} L ${sx0 + 60} ${SHAFT.bottom} Q ${sx0} ${SHAFT.bottom} ${sx0} ${SHAFT.bottom - 60} Z`}
          fill={LOOSE}
          stroke="#000"
          strokeWidth={6}
        />
      ) : null}
      {/* grass edge on top of the cut */}
      <rect x={-400} y={G - 6} width={2340} height={22} fill={GRASS} />
      <line x1={-400} x2={1940} y1={G + 16} y2={G + 16} stroke="#000" strokeWidth={6} />
    </g>
  );
};
// falling dirt clods while the shaft is filled
const Clods: React.FC<{ t: number }> = ({ t }) => {
  if (t < 2.72 || t > 3.45) return null;
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const t0 = 2.72 + rnd(i) * 0.45;
        const u = (t - t0) / 0.4;
        if (u < 0 || u > 1) return null;
        const x = SHAFT.x + (rnd(i + 20) - 0.5) * 220;
        const y = G - 260 + u * u * 700;
        const r = 14 + 12 * rnd(i + 40);
        return <circle key={i} cx={x} cy={y} r={r} fill={LOOSE} stroke="#000" strokeWidth={5} />;
      })}
    </g>
  );
};
const Mound: React.FC<{ s: number }> = ({ s }) =>
  s <= 0.01 ? null : (
    <path
      d={`M ${SHAFT.x - 175 * s} ${G + 2} Q ${SHAFT.x - 120 * s} ${G - 52 * s} ${SHAFT.x} ${G - 58 * s} Q ${SHAFT.x + 120 * s} ${G - 52 * s} ${SHAFT.x + 175 * s} ${G + 2} Z`}
      fill={LOOSE}
      stroke="#000"
      strokeWidth={6}
    />
  );
const Plank: React.FC<{ t: number }> = ({ t }) => {
  const x0 = SHAFT.x - 175;
  const x1 = SHAFT.x + 175;
  const br = easeInCubic(prog(t, FALL0 - 0.04, FALL0 + 0.2));
  const crack = t > T.sign;
  const half = (side: -1 | 1) => {
    const px = side < 0 ? x0 : x1;
    const ang = side * -72 * br;
    const len = 175;
    return (
      <g key={side} transform={`rotate(${ang} ${px} ${PLANK_Y})`}>
        <rect x={side < 0 ? px : px - len} y={PLANK_Y - 14} width={len} height={30} fill="#A0703F" stroke="#000" strokeWidth={6} />
      </g>
    );
  };
  if (t < FALL0 - 0.04)
    return (
      <g>
        <rect x={x0} y={PLANK_Y - 14} width={x1 - x0} height={30} rx={4} fill="#A0703F" stroke="#000" strokeWidth={6} />
        {crack ? <path d={`M ${SHAFT.x - 8} ${PLANK_Y - 14} L ${SHAFT.x + 6} ${PLANK_Y} L ${SHAFT.x - 6} ${PLANK_Y + 16}`} fill="none" stroke="#000" strokeWidth={5} /> : null}
      </g>
    );
  return <g>{[half(-1), half(1)]}</g>;
};
const Sign: React.FC<{ t: number; set: string }> = ({ t, set }) => {
  const sp = SPR.sign;
  const s = SIGN.s;
  let sink = 0;
  let rot = 0;
  let rust = 0;
  if (set === "A" || set === "F") {
    const ks = set === "A" ? KNOCKS : [22.2];
    ks.forEach((k) => {
      if (t >= k) sink += 9 * easeOutCubic(prog(t, k, k + 0.08));
      rot += 3 * spring(t - k, 4, 6) * (t >= k ? 1 : 0);
    });
  }
  if (set === "A") {
    rust = prog(t, 5.0, 6.15);
    rot += 80 * easeInCubic(prog(t, 6.02, 6.62)) + (t > 6.62 ? -3 * spring(t - 6.62, 4, 7) : 0);
  }
  const b = sp.board;
  const bx = (b[0] + b[2]) / 2 - sp.post[0];
  const by = (b[1] + b[3]) / 2 - sp.post[1];
  const filter = rust > 0 ? `sepia(${0.8 * rust}) saturate(${1 - 0.5 * rust}) brightness(${1 - 0.3 * rust})` : undefined;
  return (
    <div style={{ position: "absolute", left: SIGN.x, top: FEET + sink, transform: `rotate(${rot}deg)`, transformOrigin: "0 0", filter }}>
      <Img src={F("sign")} style={{ position: "absolute", left: -sp.post[0] * s, top: -sp.post[1] * s, width: sp.w * s, height: sp.h * s }} />
      <div
        style={{
          position: "absolute",
          left: bx * s,
          top: by * s,
          transform: "translate(-50%, -50%)",
          fontFamily: FONT,
          color: "#111",
          textAlign: "center",
          lineHeight: 0.95,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 62 }}>DANGER</div>
        <div style={{ fontSize: 27, marginTop: 6 }}>KEEP OUT</div>
      </div>
      {rust > 0.3 ? (
        <svg style={{ position: "absolute", left: (b[0] - sp.post[0]) * s, top: (b[1] - sp.post[1]) * s, overflow: "visible" }} width={10} height={10}>
          <path d={`M 40 0 L 70 40 L 55 70 L 90 110`} fill="none" stroke="#3A2A1A" strokeWidth={5} opacity={clamp((rust - 0.3) * 2)} />
          <path d={`M 230 158 L 205 120 L 225 95`} fill="none" stroke="#3A2A1A" strokeWidth={5} opacity={clamp((rust - 0.5) * 2)} />
        </svg>
      ) : null}
    </div>
  );
};
// green radiation arcs radiating up from the barrel lid (each one grows, then thins away)
const RadRings: React.FC<{ t: number; from: number; to: number; maxR: number; x?: number }> = ({ t, from, to, maxR, x = SHAFT.x }) => {
  if (t < from || t > to + 1) return null;
  const cy = BARREL.landY - BARREL.h - 10;
  const arc = (r: number) => {
    const a0 = (-150 * Math.PI) / 180;
    const a1 = (-30 * Math.PI) / 180;
    return `M ${x + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  };
  return (
    <g>
      {Array.from({ length: 16 }, (_, i) => {
        const t0 = from + i * 0.3;
        if (t0 > to) return null;
        const u = (t - t0) / 1.0;
        if (u < 0 || u > 1) return null;
        const r = lerp(70, maxR, u);
        const sw = 13 * Math.sin(Math.PI * Math.min(1, u * 1.15));
        if (sw < 0.5) return null;
        return (
          <g key={i}>
            <path d={arc(r)} fill="none" stroke="#000" strokeWidth={sw + 8} strokeLinecap="round" />
            <path d={arc(r)} fill="none" stroke={GOO} strokeWidth={sw} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};
// a white outlined puff that grows then shrinks (vanish / dust)
const puffAt = (t: number, t0: number, x: number, y: number, size: number, n = 7, seed = 0): Puff[] => {
  const u = prog(t, t0, t0 + 0.55);
  if (u <= 0 || u >= 1) return [];
  const life = Math.sin(Math.PI * Math.min(1, u * 1.3)) * (1 - u * 0.4);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI + seed;
    const d = size * (0.35 + 0.65 * u) * (0.7 + 0.3 * rnd(i + seed * 10));
    return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6 - size * 0.3 * u, r: size * 0.45 * life * (0.8 + 0.4 * rnd(i + 5)) };
  });
};

// ---------- the cat ----------
const Cat: React.FC<{ t: number; tIn: number; tSwap: number; x: number; tr: number }> = ({ t, tIn, tSwap, x, tr }) => {
  if (t < tIn) return null;
  const green = t >= tSwap;
  const n = green ? "catg" : "cat";
  const sp = SPR[n];
  const s = CAT.h / SPR.cat.h;
  const app = easeOutBack(prog(t, tIn, tIn + 0.3), 2.2);
  const [qx, qy] = squashSwap(t, tSwap);
  const trem = green ? 2.5 * Math.sin(2 * Math.PI * 13 * tr) : 0;
  const glow = green ? 0.6 + 0.4 * Math.sin(2 * Math.PI * 1.6 * tr) : 0;
  return (
    <div style={{ position: "absolute", left: x + trem, top: FEET, transform: `scale(${app * qx}, ${app * qy})`, transformOrigin: "0 0" }}>
      <div
        style={{
          position: "absolute",
          left: -CAT.h * 1.0,
          top: -CAT.h * 0.08,
          width: CAT.h * 2,
          height: CAT.h * 0.16,
          borderRadius: "50%",
          background: "rgba(52, 70, 30, 0.28)",
          filter: "blur(3px)",
        }}
      />
      <Img
        src={F(n)}
        style={{
          position: "absolute",
          left: (-sp.w / 2) * s,
          top: -(sp.h - 12) * s,
          width: sp.w * s,
          height: sp.h * s,
          filter: green ? `drop-shadow(0 0 ${10 + 14 * glow}px ${GOO}) drop-shadow(0 0 6px ${GOO})` : undefined,
        }}
      />
    </div>
  );
};

// ---------- the legend tablet (pictograms: cat -> green cat -> run) ----------
const Tablet: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.plus) return null;
  const rise = easeOutCubic(prog(t, T.plus, T.legend + 0.02));
  const land = t > T.legend ? spring(t - T.legend - 0.02, 3.5, 7) : 0;
  const w = TABLET.w;
  const h = TABLET.h;
  const y = FEET + h * (1 - rise);
  const icon = (n: "cat" | "catg" | "run", cx: number, cy: number, hh: number, t0: number) => {
    const sp = SPR[n];
    const s = (hh / sp.h) * easeOutBack(prog(t, t0, t0 + 0.25), 2.4);
    if (s <= 0.001) return null;
    return <Img key={n} src={F(n)} style={{ position: "absolute", left: cx - (sp.w * s) / 2, top: cy - (sp.h * s) / 2, width: sp.w * s, height: sp.h * s }} />;
  };
  const arrow = (x0: number, y0: number, x1: number, y1: number, t0: number) => {
    const u = easeOutCubic(prog(t, t0, t0 + 0.2));
    if (u <= 0) return null;
    const xe = lerp(x0, x1, u);
    const ye = lerp(y0, y1, u);
    const a = Math.atan2(y1 - y0, x1 - x0);
    const hd = 18;
    const head = `M ${xe - hd * Math.cos(a - 0.6)} ${ye - hd * Math.sin(a - 0.6)} L ${xe} ${ye} L ${xe - hd * Math.cos(a + 0.6)} ${ye - hd * Math.sin(a + 0.6)}`;
    return (
      <g key={`${x0}-${y0}`}>
        <path d={`M ${x0} ${y0} L ${xe} ${ye}`} stroke="#2A2622" strokeWidth={10} strokeLinecap="round" />
        <path d={head} fill="none" stroke="#2A2622" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  return (
    <div style={{ position: "absolute", left: TABLET.x - w / 2, top: FEET - h - 400, width: w, height: h + 400, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 400 + (y - FEET), width: w, height: h, transform: `scale(${1 + 0.04 * land}, ${1 - 0.05 * land})`, transformOrigin: "50% 100%" }}>
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={w} height={h}>
          <path d={`M 8 ${h} L 8 90 Q 8 8 ${w / 2} 8 Q ${w - 8} 8 ${w - 8} 90 L ${w - 8} ${h} Z`} fill={STONE} stroke="#000" strokeWidth={9} />
          <path d={`M 14 ${h - 4} L 14 92 Q 14 40 60 22 L 60 ${h - 4} Z`} fill={STONE_SH} />
          <path d={`M ${w - 70} 40 L ${w - 52} 78 L ${w - 66} 104`} fill="none" stroke="#5E5850" strokeWidth={5} />
          <path d={`M 36 ${h - 70} L 62 ${h - 96}`} fill="none" stroke="#5E5850" strokeWidth={5} />
          {arrow(w / 2 - 34, 145, w / 2 + 34, 145, 21.4)}
          {arrow(w / 2, 228, w / 2, 282, 21.6)}
        </svg>
        {icon("cat", w / 2 - 105, 140, 120, 21.25)}
        {icon("catg", w / 2 + 108, 135, 140, 21.45)}
        {icon("run", w / 2, 368, 150, 21.65)}
      </div>
    </div>
  );
};

// ---------- field guy per set ----------
const hammerPose = (t: number, swaps: number[]): { pose: PoseName; last: number } => {
  let pose: PoseName = "up";
  let last = -10;
  swaps.forEach((s, i) => {
    if (t >= s) {
      pose = i % 2 === 0 ? "down" : "up";
      last = s;
    }
  });
  return { pose, last };
};
const SWAPS_A = [KNOCKS[0], 0.62, KNOCKS[1], 1.3, KNOCKS[2]];
const SWAPS_F = [22.2, 22.55];
const guyField = (t: number, set: string, tr: number): GuyState | null => {
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr); // real time, so the loop frames still move
  if (set === "A") {
    if (t >= T.thousand + 0.05) return null; // time passes: he is long gone
    const { pose, last } = hammerPose(t, SWAPS_A);
    const [sx, sy] = squashSwap(t, last);
    return { pose, fx: GUY.x, fy: FEET, hr: HR, sx, sy: sy * breathe, rot: 0, shadow: 1 };
  }
  if (set === "C") {
    const [sx, sy] = squashSwap(t, CUT.C);
    const b = 1 + 0.04 * bump(t, T.pictures, 0.3);
    return { pose: "skull", fx: 610, fy: FEET, hr: HR, sx, sy: sy * breathe * b, rot: 0, shadow: 1 };
  }
  if (set === "F") {
    if (t < T.run) {
      const { pose, last } = hammerPose(t, SWAPS_F);
      const [sx, sy] = squashSwap(t, last);
      const trem = t > T.color2 + 0.1 ? 1.5 * Math.sin(2 * Math.PI * 14 * tr) : 0;
      return { pose, fx: GUY.x + trem, fy: FEET, hr: HR, sx, sy: sy * breathe, rot: 0, shadow: 1 };
    }
    const [sx, sy] = squashSwap(t, T.run);
    const u = easeInCubic(prog(t, T.run + 0.08, 24.32));
    const hop = Math.abs(Math.sin(2 * Math.PI * 4 * (t - T.run)));
    return { pose: "run", fx: lerp(GUY.x + 40, -520, u), fy: FEET - 30 - 26 * hop, hr: HR, sx, sy, rot: -4, shadow: 1 - 0.5 * hop };
  }
  return null;
};

// ---------- the field world ----------
const Field: React.FC<{ t: number; tr: number; set: string; cam: Cam }> = ({ t, tr, set, cam }) => {
  const g = guyField(t, set, tr);
  const b = barrelAt(t, set);
  const face = barrelFace(t, set, tr);
  const glow =
    set === "A"
      ? t < LAND
        ? 0.35 + 0.15 * Math.sin(2 * Math.PI * 1.5 * tr)
        : 0.55 + 0.35 * prog(t, T.deadly - 0.2, T.deadly) + 0.15 * Math.sin(2 * Math.PI * 2 * tr)
      : set === "E"
        ? 0.5 + 0.4 * prog(t, 18.6, 19.1) + 0.15 * Math.sin(2 * Math.PI * 2 * tr)
        : 0.45 + 0.4 * prog(t, T.changes, T.color2) + 0.15 * Math.sin(2 * Math.PI * 2 * tr);
  // time-lapse sky (set A, while 10,000 years pass): two smooth dusk dips + a sun that sweeps across twice
  const lapse = set === "A" ? prog(t, T.over, T.years) : 0;
  const dusk = set === "A" && lapse > 0 && lapse < 1 ? 0.32 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * lapse)) : 0;
  const sunU = (lapse * 2) % 1;
  const showSun = set === "A" && lapse > 0 && lapse < 1;
  const mound = set === "A" ? easeOutBack(prog(t, 3.2, 3.5), 2) : 1;
  const tufts = set === "A" ? easeOutCubic(prog(t, 5.0, 6.2)) : 0;
  const vanish = set === "A" ? puffAt(t, T.thousand, GUY.x, FEET - 330, 230, 9, 1.3) : [];
  const knockDust = (set === "A" ? KNOCKS : set === "F" ? [22.2] : []).flatMap((k, i) => puffAt(t, k, SIGN.x - 10, FEET - 6, 60, 5, i * 1.7));
  const landDust = set === "A" ? [...puffAt(t, LAND, SHAFT.x - 105, BARREL.landY - 26, 60, 5, 0.4), ...puffAt(t, LAND, SHAFT.x + 105, BARREL.landY - 26, 60, 5, 1.9)] : [];
  const fallDust = set === "A" ? puffAt(t, 6.62, SIGN.x + 240, FEET - 20, 110, 7, 2.2) : [];
  const runDust: Puff[] =
    set === "F"
      ? [0, 1, 2, 3].flatMap((i) => {
          const tt = T.run + 0.05 + i * 0.1;
          const u = easeInCubic(prog(tt, T.run + 0.08, 24.32));
          return puffAt(t, tt, lerp(GUY.x + 40, -520, u) + 40, FEET - 20, 70, 5, i);
        })
      : [];
  const sweat = set === "F" ? pop(t, 23.12, 0.25) * (t < T.run ? 1 : 0) : 0;
  const bang = set === "F" ? pop(t, 23.28, 0.25) * (t < T.run ? 1 : 0) : 0;
  const head = g ? headAt(g.pose, g.fx, g.fy, g.hr) : null;
  const q = set === "C" ? pop(t, 10.5, 0.28) : 0;
  return (
    <World cam={cam}>
      <Img src={F("bg")} style={{ position: "absolute", left: 0, top: 0, width: WW, height: WH }} />
      {dusk > 0 ? <div style={{ position: "absolute", left: -400, top: -1200, width: 2340, height: G + 1200, background: `rgba(52, 28, 96, ${dusk})` }} /> : null}
      <Svg>
        {showSun ? (
          <circle cx={lerp(-100, 1640, sunU)} cy={760 - 520 * Math.sin(Math.PI * sunU)} r={70} fill="#FFC93C" stroke="#000" strokeWidth={7} />
        ) : null}
        {tufts > 0
          ? [160, 360, 700, 1010, 1300, 1460].map((x, i) => (
              <path
                key={i}
                d={`M ${x - 26 * tufts} ${G - 4} L ${x - 12 * tufts} ${G - 60 * tufts} L ${x} ${G - 10} L ${x + 12 * tufts} ${G - 74 * tufts} L ${x + 26 * tufts} ${G - 4} Z`}
                fill="#5E9E3C"
                stroke="#000"
                strokeWidth={5}
                strokeLinejoin="round"
              />
            ))
          : null}
      </Svg>
      {set !== "E" ? <Sign t={t} set={set} /> : null}
      <Svg>
        <Soil t={t} set={set} />
        <Barrel x={b.x} y={b.y} sx={b.sx} sy={b.sy} rot={b.rot} face={face} t={tr} glow={glow} />
        {set === "A" ? <Plank t={t} /> : null}
        <Clods t={t} />
        <Mound s={mound} />
        {set === "A" ? <RadRings t={t} from={3.75} to={6.6} maxR={430} /> : null}
        {set === "E" ? <RadRings t={t} from={18.6} to={21.9} maxR={600} /> : null}
        {set === "F" ? <RadRings t={t} from={T.changes} to={24.6} maxR={600} /> : null}
        <PuffCluster puffs={landDust} fill="#D9C4A0" ink={5} />
        <PuffCluster puffs={knockDust} fill="#D9C4A0" ink={5} />
        <PuffCluster puffs={fallDust} fill="#D9C4A0" ink={5} />
      </Svg>
      {set === "E" ? <Tablet t={t} /> : null}
      {set === "E"
        ? NERDS.map((n, i) => {
            const tIn = T.two + i * 0.15;
            if (t < tIn) return null;
            const app = easeOutBack(prog(t, tIn, tIn + 0.3), 2.2);
            const bb = 1 + 0.04 * bump(t, T.suggested + i * 0.08, 0.3) + 0.06 * bump(t, T.radiation + 0.05 + i * 0.1, 0.32);
            const hop = 34 * bump(t, T.radiation + 0.05 + i * 0.1, 0.32);
            const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr + i);
            return <Guy key={i} g={{ pose: "nerd", fx: n.x, fy: n.y - hop, hr: HR * n.s, sx: app, sy: app * bb * br, rot: 0, shadow: app }} />;
          })
        : null}
      {set === "E" ? <Cat t={t} tIn={T.cats} tSwap={T.color} x={CAT.x} tr={tr} /> : null}
      {set === "F" ? <Cat t={t} tIn={T.cat} tSwap={T.color2} x={CAT.x} tr={tr} /> : null}
      {g ? <Guy g={g} /> : null}
      <Svg>
        <PuffCluster puffs={vanish} fill="#FFFFFF" ink={6} />
        <PuffCluster puffs={runDust} fill="#D9C4A0" ink={5} />
        {head && sweat > 0 ? <SweatDrop x={head.x - head.r * 0.95} y={head.y - head.r * 0.35} r={22} s={sweat} rot={-10} /> : null}
      </Svg>
      {head && bang > 0 ? <Label x={head.x + head.r * 0.4} y={head.y - head.r * 1.55} size={120} text="!" s={bang} rot={8} /> : null}
      {q > 0 ? <Label x={830} y={1250} size={130} text="?" s={q} rot={12} /> : null}
    </World>
  );
};

// ---------- B: the scroll close-up (screen space) ----------
const OLD = ["Hwæt! We Gardena", "in geardagum,", "þeodcyninga", "þrym gefrunon"];
const ScrollShot: React.FC<{ t: number; tr: number }> = ({ t, tr }) => {
  const sp = SPR.scroll;
  const sc = lerp(1.05, 1.12, easeInOutCubic(prog(t, CUT.B, CUT.C)));
  const [qx, qy] = squashSwap(t, CUT.B);
  const br = 1 + 0.008 * Math.sin(2 * Math.PI * 0.6 * tr);
  const w = sp.w * sc;
  const h = sp.h * sc;
  const left = 540 - w / 2;
  const top = 1920 - (sp.h - 12) * sc + 6;
  const S = (x: number, y: number): P => [left + x * sc, top + y * sc];
  const head = S(sp.head[0], sp.head[1]);
  const hr = sp.head[2] * sc;
  const sweat = pop(t, 9.05, 0.25);
  const qm = [0, 1, 2].map((i) => pop(t, T.ago + 0.02 + i * 0.1, 0.25));
  const flip = t > T.ago ? easeInOutCubic(prog(t, T.ago, T.ago + 0.3)) : 0; // he turns the text upside down: it does not help
  return (
    <AbsoluteFill>
      <World cam={{ x: 640, y: 1500, k: 1.5 }} blur={6}>
        <Img src={F("bg")} style={{ position: "absolute", left: 0, top: 0, width: WW, height: WH }} />
      </World>
      <AbsoluteFill style={{ transform: `scale(${qx}, ${qy * br})`, transformOrigin: "540px 1920px" }}>
        <Img src={F("scroll")} style={{ position: "absolute", left, top, width: w, height: h }} />
        {/* the Old English (Beowulf, first lines) written on the scroll, revealed line by line from "read" */}
        <div
          style={{
            position: "absolute",
            left: S(686, 918)[0],
            top: S(686, 918)[1],
            transform: `translate(-50%, -50%) rotate(${4.5 + 180 * flip}deg) skewX(-9deg) scale(${sc})`,
            fontFamily: SERIF,
            fontSize: 35,
            lineHeight: 1.55,
            color: "#5A3A1A",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {OLD.map((l, i) => {
            const u = prog(t, T.read - 0.1 + i * 0.32, T.read + 0.28 + i * 0.32);
            return (
              <div key={i} style={{ clipPath: `inset(0 ${100 - 100 * u}% 0 0)` }}>
                {l}
              </div>
            );
          })}
        </div>
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
          <SweatDrop x={head[0] - hr * 0.86} y={head[1] - hr * 0.2} r={30} s={sweat} rot={-12} />
        </svg>
        {qm.map((s, i) => (
          <Label key={i} x={head[0] + hr * (0.25 + 0.32 * i)} y={head[1] - hr * (1.12 + 0.08 * Math.sin(i * 2))} size={110 + 10 * i} text="?" s={s} rot={-10 + 12 * i} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- D: Egypt ----------
const ghostPuffs = (s: number, tr: number): Puff[] => {
  const base: [number, number, number][] = [
    [0, -40, 92],
    [-70, 10, 70],
    [70, 10, 70],
    [-40, 70, 60],
    [40, 70, 60],
    [0, 110, 48],
    [-15, 160, 34],
    [10, 200, 22],
  ];
  return base.map(([x, y, r], i) => ({
    x: x * s + (i > 4 ? 14 * Math.sin(2 * Math.PI * 1.2 * tr + i) : 0),
    y: y * s,
    r: r * s * (1 + 0.04 * Math.sin(2 * Math.PI * 1.5 * tr + i)),
  }));
};
const Egypt: React.FC<{ t: number; tr: number; cam: Cam }> = ({ t, tr, cam }) => {
  const tb = SPR.tomb;
  const ts = EG.tomb.s;
  const tl = EG.tomb.cx - (tb.w / 2) * ts;
  const tt = EG.tomb.base - (tb.h - 12) * ts;
  const door = { x0: tl + tb.door[0] * ts, y0: tt + tb.door[1] * ts, x1: tl + tb.door[2] * ts, y1: tt + tb.door[3] * ts };
  const dcx = (door.x0 + door.x1) / 2;
  const tombBump = 1 + 0.03 * bump(t, T.tombs, 0.3);
  // the curse ghost
  const gApp = easeOutBack(prog(t, 12.0, 12.4), 1.8);
  const gy = lerp(door.y0 + 120, EG.ghost.y, easeOutCubic(prog(t, 12.0, 12.45))) + 12 * Math.sin(2 * Math.PI * 0.9 * tr);
  const angry = prog(t, 13.45, 13.65) * (1 - prog(t, 14.9, 15.0));
  const sad = prog(t, 15.1, 15.45);
  const gs = gApp * (1 + 0.16 * angry - 0.3 * sad);
  const gyy = gy + 70 * sad;
  // the robber
  const rT0 = 13.32;
  const rDive = 14.92;
  const ru = prog(t, rT0, rDive - 0.05);
  const rx = lerp(EG.robberFrom, EG.robberTo, ru);
  const tip = Math.abs(Math.sin(2 * Math.PI * 2.3 * (t - rT0)));
  const dive = easeInCubic(prog(t, rDive, rDive + 0.22));
  const robberShown = t >= rT0 && dive < 0.999;
  const rfx = lerp(rx, dcx, dive);
  const rfy = lerp(EG.ground - 14 * tip * (1 - dive), (door.y0 + door.y1) / 2 + 140, dive);
  const rhr = HR * (1 - 0.85 * dive);
  const rHead = headAt("robber", rx, EG.ground, HR);
  const lookX = robberShown ? clamp((rx - EG.ghost.x) / 400, -1, 1) : 0;
  const bubble = t >= T.figured ? easeOutBack(prog(t, T.figured, T.figured + 0.3), 2) * (1 - easeInCubic(prog(t, 14.72, 14.9))) : 0;
  const goldS = bubble * (1 + 0.12 * bump(t, T.treasure, 0.3));
  const bx = rHead.x + 210;
  const by = rHead.y - 300;
  const sparkle = t > 15.25 ? prog(t, 15.25, 15.8) : 0;
  const doorDust = puffAt(t, rDive + 0.2, dcx, door.y1 - 60, 120, 7, 0.9);
  return (
    <World cam={cam}>
      <Svg w={1536} h={3000}>
        <rect x={-600} y={-1500} width={2800} height={EG.horizon + 1500} fill={SKY} />
        <circle cx={1080} cy={690} r={80} fill="#FFC93C" stroke="#000" strokeWidth={8} />
        {[
          [190, 560, 360],
          [1290, 680, 450],
          [1020, 360, 230],
        ].map(([x, bw, hh], i) => (
          <g key={i}>
            <path d={`M ${x - bw / 2} ${EG.horizon} L ${x} ${EG.horizon - hh} L ${x + bw / 2} ${EG.horizon} Z`} fill="#E3B66E" stroke="#000" strokeWidth={7} strokeLinejoin="round" />
            <path d={`M ${x} ${EG.horizon - hh} L ${x + bw / 2} ${EG.horizon} L ${x + bw * 0.08} ${EG.horizon} Z`} fill="#C9974F" stroke="#000" strokeWidth={7} strokeLinejoin="round" />
          </g>
        ))}
        <rect x={-600} y={EG.horizon} width={2800} height={2400} fill={SAND} />
        <line x1={-600} x2={2200} y1={EG.horizon} y2={EG.horizon} stroke="#000" strokeWidth={7} />
        <path d={`M -600 1520 Q -200 1470 200 1520 T 1000 1525 T 1800 1515 T 2600 1520`} fill="none" stroke={SAND_DK} strokeWidth={10} />
        <path d={`M -600 2050 Q -100 2010 400 2050 T 1400 2055 T 2400 2045`} fill="none" stroke={SAND_DK} strokeWidth={10} />
        <ellipse cx={EG.tomb.cx} cy={EG.tomb.base - 4} rx={tb.w * ts * 0.56} ry={26} fill="rgba(120, 84, 40, 0.25)" />
      </Svg>
      <div style={{ position: "absolute", left: EG.tomb.cx, top: EG.tomb.base, transform: `scale(${2 - tombBump}, ${tombBump})`, transformOrigin: "0 0" }}>
        <Img src={F("tomb")} style={{ position: "absolute", left: (-tb.w / 2) * ts, top: -(tb.h - 12) * ts, width: tb.w * ts, height: tb.h * ts }} />
      </div>
      <Svg w={1536} h={3000}>
        {/* golden glints from inside the door after the robber dives in */}
        {sparkle > 0
          ? Array.from({ length: 7 }, (_, i) => {
              const u = clamp(sparkle * 1.6 - i * 0.12);
              if (u <= 0 || u >= 1) return null;
              const s = Math.sin(Math.PI * u) * (20 + 10 * rnd(i));
              const x = dcx + (rnd(i + 3) - 0.5) * 260;
              const y = door.y0 + 60 + rnd(i + 9) * (door.y1 - door.y0 - 120) - 200 * u;
              return (
                <path
                  key={i}
                  d={`M ${x} ${y - 2 * s} Q ${x} ${y} ${x + 2 * s} ${y} Q ${x} ${y} ${x} ${y + 2 * s} Q ${x} ${y} ${x - 2 * s} ${y} Q ${x} ${y} ${x} ${y - 2 * s} Z`}
                  fill={GOLD}
                  stroke="#000"
                  strokeWidth={4}
                />
              );
            })
          : null}
        <PuffCluster puffs={doorDust} fill="#E8D3A6" ink={5} />
        {/* the curse ghost */}
        {gs > 0.01 ? (
          <g transform={`translate(${EG.ghost.x} ${gyy})`}>
            <PuffCluster puffs={ghostPuffs(gs, tr)} fill={GHOST} ink={7} shade={GHOST_SH} />
            <Eye x={-34 * gs} y={-50 * gs} r={22 * gs} open={1} lid={sad > 0.5 ? 0.45 : 0.25 * (1 - angry)} lidTilt={sad > 0.5 ? -18 : 26} look={[lookX, 0.4]} side={-1} brow={0.5} browTilt={sad > 0.5 ? -1.2 : 1.6} />
            <Eye x={34 * gs} y={-50 * gs} r={22 * gs} open={1} lid={sad > 0.5 ? 0.45 : 0.25 * (1 - angry)} lidTilt={sad > 0.5 ? -18 : 26} look={[lookX, 0.4]} side={1} brow={0.5} browTilt={sad > 0.5 ? -1.2 : 1.6} />
            {sad > 0.5 ? (
              <path d={`M ${-30 * gs} ${30 * gs} Q 0 ${8 * gs} ${30 * gs} ${30 * gs}`} fill="none" stroke="#000" strokeWidth={7} strokeLinecap="round" />
            ) : (
              <path
                d={`M ${-42 * gs} ${8 * gs} L ${-26 * gs} ${26 * gs} L ${-10 * gs} ${10 * gs} L ${8 * gs} ${28 * gs} L ${24 * gs} ${10 * gs} L ${42 * gs} ${26 * gs}`}
                fill="none"
                stroke="#000"
                strokeWidth={7 + 3 * angry}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        ) : null}
      </Svg>
      {robberShown ? (
        <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(0deg)` }}>
          <div style={{ position: "absolute", left: rfx, top: rfy, transform: `rotate(${3 * Math.sin(2 * Math.PI * 2.3 * (t - rT0)) * (1 - dive)}deg)`, transformOrigin: "0 0" }}>
            <Guy g={{ pose: "robber", fx: 0, fy: 0, hr: rhr, sx: 1, sy: 1 - 0.03 * tip, rot: 0, shadow: 0 }} />
          </div>
        </div>
      ) : null}
      {bubble > 0 ? (
        <>
          <Svg w={1536} h={3000}>
            <circle cx={rHead.x + 70} cy={rHead.y - 120} r={14 * bubble} fill="#fff" stroke="#000" strokeWidth={5} />
            <circle cx={rHead.x + 120} cy={rHead.y - 180} r={22 * bubble} fill="#fff" stroke="#000" strokeWidth={5} />
            <PuffCluster
              puffs={[
                { x: bx - 90, y: by + 10, r: 80 * bubble },
                { x: bx, y: by - 40, r: 100 * bubble },
                { x: bx + 95, y: by + 5, r: 85 * bubble },
                { x: bx + 10, y: by + 55, r: 85 * bubble },
              ]}
              fill="#FFFFFF"
              ink={6}
            />
          </Svg>
          <Spr n="gold" x={bx} y={by + 10} s={(190 / SPR.gold.w) * goldS} ax={SPR.gold.w / 2} ay={SPR.gold.h / 2} />
        </>
      ) : null}
    </World>
  );
};

// ---------- screen-space UI ----------
const YearCounter: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.over - 0.05 || t >= CUT.B) return null;
  const app = easeOutBack(prog(t, T.over - 0.05, T.over + 0.25), 2);
  const n = Math.floor(10000 * easeInCubic(prog(t, T.over + 0.1, T.years)));
  const done = t >= T.years;
  const st = done ? 1 + 0.25 * bump(t, T.years, 0.25) : 1;
  return (
    <div style={{ position: "absolute", left: 540, top: 250, transform: `translate(-50%, -50%) scale(${app})` }}>
      <div style={{ background: "#FFFDF4", border: "9px solid #000", borderRadius: 34, padding: "18px 30px 22px", textAlign: "center", fontFamily: FONT, width: 560 }}>
        <div style={{ fontSize: 40, color: "#444", letterSpacing: 2 }}>YEARS LATER</div>
        <div style={{ fontSize: 100, lineHeight: 1.08, color: done ? "#E0312B" : "#111", transform: `scale(${st})` }}>{done ? "10,000+" : n.toLocaleString("en-US")}</div>
      </div>
    </div>
  );
};
const YearTag: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.eighties || t >= CUT.F) return null;
  const s = easeOutBack(prog(t, T.eighties, T.eighties + 0.3), 2.4);
  return (
    <div
      style={{
        position: "absolute",
        left: 205,
        top: 215,
        transform: `translate(-50%, -50%) rotate(-7deg) scale(${s})`,
        background: "#FFE45C",
        border: "8px solid #000",
        borderRadius: 14,
        padding: "8px 34px 14px",
        fontFamily: FONT,
        fontSize: 96,
        color: "#111",
      }}
    >
      1984
    </div>
  );
};

// ---------- the Short ----------
export const NuclearWarningShort: React.FC = () => {
  useNukeFonts();
  const frame = useCurrentFrame();
  const tr = frame / FPS;
  const t = tr;
  const set = SET(t);
  const keys = set === "A" ? CAM_A : set === "C" ? CAM_C : set === "D" ? CAM_D : set === "E" ? CAM_E : CAM_F;
  let cam = camAt(t, keys);
  // shakes: knocks, the landing, the sign falling, the tablet landing, the run
  let amp = 0;
  if (set === "A") {
    KNOCKS.forEach((k) => (amp += t >= k ? 7 * Math.exp(-14 * (t - k)) : 0));
    amp += t >= LAND ? 16 * Math.exp(-9 * (t - LAND)) : 0;
    amp += t >= 6.62 ? 7 * Math.exp(-12 * (t - 6.62)) : 0;
  }
  if (set === "E") amp += t >= T.legend ? 8 * Math.exp(-12 * (t - T.legend)) : 0;
  if (set === "F") amp += t >= 22.2 ? 5 * Math.exp(-14 * (t - 22.2)) : 0;
  if (set === "D") amp += t >= 14.95 ? 6 * Math.exp(-10 * (t - 14.95)) : 0;
  const sh = shake(t, amp);
  cam = { x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k };
  return (
    <AbsoluteFill style={{ background: SKY }}>
      {set === "B" ? (
        <ScrollShot t={t} tr={tr} />
      ) : set === "D" ? (
        <Egypt t={t} tr={tr} cam={cam} />
      ) : (
        <Field t={t} tr={tr} set={set} cam={cam} />
      )}
      <YearCounter t={t} />
      <YearTag t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile("nuclear-warning/vo/take1.mp3")} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({ ...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number]) }))} dir="nuclear-warning/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const NW_DURATION = DURATION;
