import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SPR } from "./sprites";
import {
  CAM,
  DOOR,
  FPS,
  HORIZON,
  HR,
  SET,
  T,
  VO_AT,
  W,
  WH,
  WW,
  domeToWorld,
  poolToWorld,
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

const F = (n: string) => staticFile(`desert-ice/${n}.png`);
export const FONT = "DesertIceInter";
export const useDesertFont = () =>
  useFont(FONT, staticFile("fonts/Inter-Black.otf"));

const ICE = "#BFE8FF";
const ICE_LITE = "#E8F7FF";
const WATER = "#5FA6EA";
const WATER_LITE = "#A9D6FF";
const SUN = "#FFC93C";
const SUN_RAY = "#FFB020";
const HEAT = "#FF6A2B";
const MUD = "#C98E5B";
const MUD_DARK = "#A86F42";
const CAVE = "#3B2A20";
const NIGHT = "#283A7A";
const DAWN = "#FF9E7A";
const MIX_DB = 3.5; // Remotion's mix peaks low (lessons): lift voice + effects together

type P = [number, number];

// ---------- sounds (all ElevenLabs: new for this video + reused from sfx-library) ----------
const CUES: Cue[] = [
  { f: "clink", at: 0.62, db: -26 },
  { f: "pop", at: T.before - 0.02, db: -22 },
  { f: "stamp", at: T.fridges + 0.04, db: -16 },
  { f: "pop", at: 4.3, db: -22, rate: 0.8 },
  { f: "whoosh", at: T.worst - 0.05, db: -30, rate: 1.3 },
  { f: "drip", at: 5.62, db: -18 },
  {
    f: "sizzle",
    at: 5.7,
    db: -27,
    dur: 1.4,
    keys: [
      [5.7, -27],
      [6.6, -30],
      [7.1, -45],
    ],
  },
  { f: "boing", at: T.right, db: -26, rate: 1.2 },
  { f: "crickets", at: T.but1 + 0.05, db: -24 },
  { f: "pop", at: T.winter, db: -22, rate: 1.1 },
  { f: "crickets", at: T.wide + 0.2, db: -30 },
  { f: "pop", at: T.sky - 0.05, db: -21 },
  { f: "pop", at: T.sky + 0.07, db: -22, rate: 1.2 },
  { f: "slurp", at: T.sucks - 0.04, db: -15 },
  { f: "pop", at: 11.25, db: -24, rate: 0.9 },
  { f: "whoosh", at: T.so + 0.02, db: -29 },
  { f: "pop", at: 11.95, db: -22, rate: 0.8 },
  { f: "pour", at: T.filled - 0.04, db: -17 },
  { f: "freeze", at: T.froze - 0.12, db: -14 },
  { f: "whoosh", at: 14.95, db: -24, rate: 0.8 },
  { f: "clink", at: 15.5, db: -24, rate: 0.9 },
  {
    f: "sizzle",
    at: T.ice2,
    db: -28,
    dur: 1.6,
    keys: [
      [15.94, -28],
      [17.0, -33],
      [17.5, -45],
    ],
  },
  { f: "drip", at: T.melts + 0.02, db: -18 },
  { f: "drip", at: 17.2, db: -21, rate: 1.15 },
  { f: "whoosh", at: 17.98, db: -24 },
  { f: "stamp", at: 18.32, db: -15 },
  { f: "pop", at: 18.5, db: -21 },
  { f: "pop", at: T.walls, db: -22, rate: 0.9 },
  { f: "pop", at: T.two, db: -22, rate: 1.2 },
  { f: "rock_crack", at: T.thick - 0.02, db: -17 },
  { f: "pop", at: 20.38, db: -24, rate: 0.8 },
  { f: "pop", at: 20.62, db: -23 },
  { f: "flip", at: T.lasted - 0.12, db: -18 },
  { f: "flip", at: T.summer2 - 0.12, db: -18, rate: 1.1 },
  { f: "sizzle", at: 22.0, db: -32, dur: 0.8 },
  { f: "pop", at: T.freezer - 0.02, db: -18, rate: 0.85 },
  { f: "whoosh", at: 22.9, db: -26 },
  { f: "clink", at: 23.33, db: -14 },
  { f: "pop", at: T.sky2 - 0.04, db: -22 },
  { f: "boing", at: 24.36, db: -27, rate: 1.4 },
];

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) =>
  Math.sin(Math.PI * prog(t, t0, t0 + dur));
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    width={WW}
    height={WH}
  >
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
  op?: number;
}> = ({ n, x, y, s, ax, ay, rot = 0, sx = 1, sy = 1, op = 1 }) => {
  const sp = SPR[n as keyof typeof SPR] as { w: number; h: number };
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
        transformOrigin: "0 0",
        opacity: op,
      }}
    >
      <Img
        src={F(n)}
        style={{
          position: "absolute",
          left: -ax * s,
          top: -ay * s,
          width: sp.w * s,
          height: sp.h * s,
        }}
      />
    </div>
  );
};

// ---------- the guy ----------
type GuyState = {
  pose: PoseName;
  fx: number;
  fy: number;
  hr: number;
  sx: number;
  sy: number;
  rot: number;
  shadow: number;
};

const squashSwap = (t: number, tSwap: number) => {
  // anticipation squash before a swap, stretch + damped settle after it
  if (t < tSwap - 0.1) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.1, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};

const guyAt = (t: number, tr: number): GuyState | null => {
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr); // real time, so the loop frames still move
  const set = SET(t);
  if (set === "A") {
    const pose: PoseName = t < T.worst ? "hero" : "shrug";
    const [sx, sy] = squashSwap(t, T.worst);
    const b =
      1 + 0.03 * bump(t, T.ice - 0.05, 0.3) + 0.04 * bump(t, T.right, 0.3);
    return {
      pose,
      fx: W.guyA.x,
      fy: W.guyA.y,
      hr: HR,
      sx,
      sy: sy * breathe * b,
      rot: 0,
      shadow: 1,
    };
  }
  if (set === "N") return null; // the close-up is its own picture
  if (set === "P") {
    if (t < 11.62) return null;
    const app = easeOutBack(prog(t, 11.62, 11.92), 2.0);
    if (t < T.froze) {
      const [sx, sy] = [
        1 + 0.03 * bump(t, T.filled, 0.3),
        1 - 0.03 * bump(t, T.filled, 0.3),
      ];
      return {
        pose: "pour",
        fx: W.pourFeet.x,
        fy: W.pourFeet.y,
        hr: W.hrP * app,
        sx,
        sy: sy * breathe,
        rot: 0,
        shadow: app,
      };
    }
    const [sx, sy] = squashSwap(t, T.froze);
    const u = easeInOutCubic(prog(t, 14.82, 15.72));
    const x = lerp(W.pourFeet.x + 60, 1290, u);
    return {
      pose: "slide",
      fx: x,
      fy: W.slideY,
      hr: W.hrP,
      sx,
      sy,
      rot: -3 * Math.sin(Math.PI * u),
      shadow: 0,
    };
  }
  // set D: run in with the block, throw it in the door, wait in the heat, catch the cube
  const tRel = 18.0;
  if (t < tRel) {
    const u = prog(t, T.but2, tRel);
    const x = lerp(160, W.guyE.x, easeOutCubic(u * 0.85 + 0.15 * u * u));
    const hop = Math.abs(Math.sin(2 * Math.PI * 2.6 * (t - T.but2)));
    return {
      pose: "carry",
      fx: x,
      fy: W.groundD - 26 * hop,
      hr: HR,
      sx: 1,
      sy: 1 + 0.02 * hop,
      rot: 3 * Math.sin(2 * Math.PI * 2.6 * (t - T.but2)),
      shadow: 1 - 0.3 * hop,
    };
  }
  const tCatch = 23.35;
  if (t < tCatch) {
    const [sx, sy] = squashSwap(t, tRel);
    const b = 1 + 0.03 * bump(t, T.thick, 0.3);
    return {
      pose: "shrug",
      fx: W.guyE.x,
      fy: W.groundD,
      hr: HR,
      sx,
      sy: sy * breathe * b,
      rot: 0,
      shadow: 1,
    };
  }
  const [sx, sy] = squashSwap(t, tCatch);
  const dip = 0.03 * bump(t, tCatch, 0.25);
  return {
    pose: "hero",
    fx: W.guyE.x,
    fy: W.groundD,
    hr: HR,
    sx,
    sy: sy * breathe * (1 - dip),
    rot: 0,
    shadow: 1,
  };
};

const Guy: React.FC<{ g: GuyState }> = ({ g }) => {
  const b = poseBox(g.pose, g.fx, g.fy, g.hr);
  return (
    <>
      {g.shadow > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: g.fx - g.hr * 1.5,
            top: g.fy - g.hr * 0.17,
            width: g.hr * 3,
            height: g.hr * 0.34,
            borderRadius: "50%",
            background: `rgba(72, 54, 42, ${0.26 * g.shadow})`,
            filter: "blur(3px)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: g.fx,
          top: g.fy,
          transform: `rotate(${g.rot}deg) scale(${g.sx}, ${g.sy})`,
          transformOrigin: "0 0",
        }}
      >
        <Img
          src={F(g.pose)}
          style={{
            position: "absolute",
            left: b.left - g.fx,
            top: b.top - g.fy,
            width: b.width,
            height: b.height,
          }}
        />
      </div>
    </>
  );
};

// where the ice in a pose's hand is, in world units
const iceIn = (pose: "hero" | "carry", fx: number, fy: number, hr: number) => {
  const s = SPR[pose];
  const b = poseBox(pose, fx, fy, hr);
  const [x0, y0, x1, y1] = s.ice;
  return {
    x: b.left + ((x0 + x1) / 2) * b.k,
    y: b.top + ((y0 + y1) / 2) * b.k,
    w: (x1 - x0) * b.k,
    h: (y1 - y0) * b.k,
  };
};

// ---------- faces ----------
type Mouth = "smile" | "grin" | "o" | "flat" | "smug" | "none";
const MouthShape: React.FC<{
  x: number;
  y: number;
  r: number;
  m: Mouth;
  open?: number;
}> = ({ x, y, r, m, open = 1 }) => {
  const ink = r * 0.16;
  if (m === "none" || open <= 0.01) return null;
  if (m === "o")
    return (
      <ellipse
        cx={x}
        cy={y}
        rx={r * 0.42 * open}
        ry={r * 0.55 * open}
        fill="#5A1A10"
        stroke="#000"
        strokeWidth={ink}
      />
    );
  if (m === "grin")
    return (
      <path
        d={`M ${x - r} ${y - r * 0.15} Q ${x} ${y + r * 1.0} ${x + r} ${y - r * 0.15} Z`}
        fill="#5A1A10"
        stroke="#000"
        strokeWidth={ink}
        strokeLinejoin="round"
      />
    );
  if (m === "flat")
    return (
      <path
        d={`M ${x - r * 0.6} ${y} L ${x + r * 0.6} ${y}`}
        stroke="#000"
        strokeWidth={ink}
        strokeLinecap="round"
      />
    );
  if (m === "smug")
    return (
      <path
        d={`M ${x - r * 0.8} ${y - r * 0.1} Q ${x + r * 0.1} ${y + r * 0.45} ${x + r * 0.85} ${y - r * 0.35}`}
        fill="none"
        stroke="#000"
        strokeWidth={ink}
        strokeLinecap="round"
      />
    );
  return (
    <path
      d={`M ${x - r * 0.8} ${y - r * 0.15} Q ${x} ${y + r * 0.55} ${x + r * 0.8} ${y - r * 0.15}`}
      fill="none"
      stroke="#000"
      strokeWidth={ink}
      strokeLinecap="round"
    />
  );
};

// ---------- the sun (code-drawn, with a face) ----------
const Sun: React.FC<{
  x: number;
  y: number;
  r: number;
  tr: number;
  scale: number;
  look: P;
  mouth: Mouth;
  lid?: number;
  lidTilt?: number;
  brow?: number;
  browTilt?: number;
}> = ({
  x,
  y,
  r,
  tr,
  scale,
  look,
  mouth,
  lid = 0,
  lidTilt = 0,
  brow = 0.5,
  browTilt = 0,
}) => {
  const rays = 12;
  const rot = tr * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform={`rotate(${rot})`}>
        {Array.from({ length: rays }).map((_, i) => {
          const a = (i / rays) * 2 * Math.PI;
          const L =
            r * (1.5 + 0.12 * Math.sin(2 * Math.PI * 1.3 * tr + i * 1.7));
          const w = 0.16;
          const p1: P = [
            Math.cos(a - w) * r * 1.08,
            Math.sin(a - w) * r * 1.08,
          ];
          const p2: P = [Math.cos(a) * L, Math.sin(a) * L];
          const p3: P = [
            Math.cos(a + w) * r * 1.08,
            Math.sin(a + w) * r * 1.08,
          ];
          return (
            <path
              key={i}
              d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} Z`}
              fill={SUN_RAY}
              stroke="#000"
              strokeWidth={r * 0.07}
              strokeLinejoin="round"
            />
          );
        })}
      </g>
      <circle
        cx={0}
        cy={0}
        r={r}
        fill={SUN}
        stroke="#000"
        strokeWidth={r * 0.08}
      />
      <circle
        cx={-r * 0.25}
        cy={r * 0.2}
        r={r * 0.62}
        fill="#FFB52E"
        opacity={0.35}
      />
      <Eye
        x={-r * 0.36}
        y={-r * 0.12}
        r={r * 0.26}
        open={1}
        look={look}
        lid={lid}
        lidTilt={lidTilt}
        side={-1}
        brow={brow}
        browTilt={browTilt}
      />
      <Eye
        x={r * 0.36}
        y={-r * 0.12}
        r={r * 0.26}
        open={1}
        look={look}
        lid={lid}
        lidTilt={lidTilt}
        side={1}
        brow={brow}
        browTilt={browTilt}
      />
      <MouthShape x={0} y={r * 0.42} r={r * 0.36} m={mouth} />
    </g>
  );
};

// ---------- props drawn in code ----------
const Fridge: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  xs: number;
}> = ({ x, y, w, h, s, xs }) => {
  if (s <= 0.001) return null;
  const ink = 9;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect
        x={-w / 2}
        y={-h}
        width={w}
        height={h}
        rx={26}
        fill="#F2F6F9"
        stroke="#000"
        strokeWidth={ink}
      />
      <rect
        x={-w / 2 + 14}
        y={-h + 12}
        width={w * 0.3}
        height={h - 24}
        rx={14}
        fill="#DDE6EC"
        opacity={0.7}
      />
      <line
        x1={-w / 2}
        x2={w / 2}
        y1={-h * 0.62}
        y2={-h * 0.62}
        stroke="#000"
        strokeWidth={ink}
      />
      <rect
        x={w / 2 - 34}
        y={-h * 0.9}
        width={13}
        height={h * 0.18}
        rx={6}
        fill="#9AA6AE"
        stroke="#000"
        strokeWidth={6}
      />
      <rect
        x={w / 2 - 34}
        y={-h * 0.52}
        width={13}
        height={h * 0.22}
        rx={6}
        fill="#9AA6AE"
        stroke="#000"
        strokeWidth={6}
      />
      {xs > 0.001 ? (
        <g transform={`translate(0 ${-h * 0.5}) scale(${xs})`}>
          {[45, -45].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <rect
                x={-h * 0.62}
                y={-24}
                width={h * 1.24}
                height={48}
                rx={24}
                fill="#000"
              />
              <rect
                x={-h * 0.62 + 9}
                y={-15}
                width={h * 1.24 - 18}
                height={30}
                rx={15}
                fill="#E8322B"
              />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};

const puffRing = (
  cx: number,
  cy: number,
  u: number,
  n: number,
  R: number,
  r0: number,
  seed: number,
): Puff[] =>
  Array.from({ length: n }).map((_, i) => {
    const a = (i / n) * 2 * Math.PI + seed;
    const life = Math.sin(Math.PI * clamp(u));
    return {
      x: cx + Math.cos(a) * R * (0.4 + 0.8 * u),
      y: cy + Math.sin(a) * R * 0.6 * (0.4 + 0.8 * u) - 40 * u,
      r: r0 * life * (0.7 + 0.5 * rnd(i + seed)),
    };
  });

// ---------- night sky: stars + the sky's face ----------
const Stars: React.FC<{ tr: number; op: number }> = ({ tr, op }) => {
  if (op <= 0.01) return null;
  return (
    <g opacity={op}>
      {Array.from({ length: 46 }).map((_, i) => {
        const x = rnd(i * 3.1) * WW;
        const y = 40 + rnd(i * 7.7 + 1) * (HORIZON - 120);
        const tw =
          0.6 + 0.4 * Math.sin(2 * Math.PI * (0.5 + rnd(i) * 0.9) * tr + i);
        const r = (5 + 9 * rnd(i * 1.3 + 5)) * tw;
        return (
          <path
            key={i}
            d={`M ${x} ${y - r * 1.6} Q ${x} ${y} ${x + r * 1.6} ${y} Q ${x} ${y} ${x} ${y + r * 1.6} Q ${x} ${y} ${x - r * 1.6} ${y} Q ${x} ${y} ${x} ${y - r * 1.6} Z`}
            fill="#FFF6C8"
          />
        );
      })}
    </g>
  );
};

const SkyFace: React.FC<{
  xl: number;
  xr: number;
  y: number;
  r: number;
  open: number;
  look: P;
  mouth: Mouth;
  mx: number;
  my: number;
  mr: number;
  mOpen?: number;
  wink?: number;
  lid?: number;
  dark?: boolean;
}> = ({
  xl,
  xr,
  y,
  r,
  open,
  look,
  mouth,
  mx,
  my,
  mr,
  mOpen = 1,
  wink = 0,
  lid = 0,
  dark = true,
}) => {
  if (open <= 0.001) return null;
  return (
    <g>
      <Eye
        x={xl}
        y={y}
        r={r}
        open={open}
        look={look}
        side={-1}
        lid={lid}
        brow={0.55}
      />
      {wink > 0.5 ? (
        <path
          d={`M ${xr - r * 0.8} ${y} Q ${xr} ${y - r * 0.55} ${xr + r * 0.8} ${y}`}
          fill="none"
          stroke={dark ? "#FFF6C8" : "#000"}
          strokeWidth={r * 0.22}
          strokeLinecap="round"
        />
      ) : (
        <Eye
          x={xr}
          y={y}
          r={r}
          open={open}
          look={look}
          side={1}
          lid={Math.max(lid, wink * 2)}
          brow={0.55}
        />
      )}
      <g transform={`translate(${mx} ${my}) scale(${open})`}>
        <MouthShape x={0} y={0} r={mr} m={mouth} open={mOpen} />
        {dark && mouth === "smile" ? (
          <path
            d={`M ${-mr * 0.8} ${-mr * 0.15} Q 0 ${mr * 0.55} ${mr * 0.8} ${-mr * 0.15}`}
            fill="none"
            stroke="#FFF6C8"
            strokeWidth={mr * 0.08}
            strokeLinecap="round"
          />
        ) : null}
      </g>
    </g>
  );
};

// a wavy heat line (orange with an ink underlay) centred at (x, y), height h
const Squiggle: React.FC<{
  x: number;
  y: number;
  h: number;
  ph: number;
  s: number;
}> = ({ x, y, h, ph, s }) => {
  if (s <= 0.01) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    pts.push(
      `${(x + Math.sin(u * 3 * Math.PI + ph) * h * 0.13 * s).toFixed(1)},${(y + h / 2 - u * h * s).toFixed(1)}`,
    );
  }
  const d = `M ${pts.join(" L ")}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#000"
        strokeWidth={34 * s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke={HEAT}
        strokeWidth={18 * s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

// ---------- the calendar card (screen space) ----------
const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const right = t >= T.but2;
  let s = 0;
  let word = "WINTER";
  let flipSy = 1;
  if (t >= T.winter && t < T.but2) s = pop(t, T.winter, 0.3);
  if (t >= 20.6) {
    s = pop(t, 20.6, 0.3) * (1 - easeInCubic(prog(t, 23.55, 23.8)));
    const f1 = prog(t, T.lasted - 0.1, T.lasted + 0.12);
    const f2 = prog(t, T.summer2 - 0.1, T.summer2 + 0.12);
    word = f2 >= 0.5 ? "SUMMER" : f1 >= 0.5 ? "SPRING" : "WINTER";
    const f = f2 > 0 && f2 < 1 ? f2 : f1;
    flipSy = f > 0 && f < 1 ? Math.abs(Math.cos(Math.PI * f)) : 1;
  }
  if (s <= 0.001) return null;
  const col =
    word === "WINTER" ? "#2F7BD6" : word === "SPRING" ? "#3FA34D" : "#F07A1A";
  return (
    <div
      style={{
        position: "absolute",
        left: right ? 716 : 52,
        top: right ? 200 : 170,
        width: 300,
        height: 300,
        transform: `scale(${s * (right ? 1 : 0.82)}) rotate(${right ? 5 : -5}deg)`,
        transformOrigin: "50% 0%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 30,
          width: 300,
          height: 260,
          borderRadius: 26,
          background: "#FFFDF6",
          border: "9px solid #000",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 30,
          width: 300,
          height: 82,
          borderRadius: "26px 26px 0 0",
          background: "#E24B3B",
          border: "9px solid #000",
          boxSizing: "border-box",
        }}
      />
      {[70, 210].map((x) => (
        <div
          key={x}
          style={{
            position: "absolute",
            left: x,
            top: 8,
            width: 22,
            height: 50,
            borderRadius: 11,
            background: "#8B8F96",
            border: "7px solid #000",
            boxSizing: "border-box",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 130,
          width: 300,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 60,
          color: col,
          WebkitTextStroke: "3px #000",
          transform: `scaleY(${flipSy})`,
        }}
      >
        {word}
      </div>
    </div>
  );
};

// ---------- the scene ----------
export const Scene: React.FC<{
  t: number;
  tr: number;
  cam: Cam;
  cover?: boolean;
}> = ({ t, tr, cam, cover = false }) => {
  const set = SET(t);
  const g = cover
    ? {
        pose: "hero" as PoseName,
        fx: W.guyA.x,
        fy: W.guyA.y,
        hr: HR,
        sx: 1,
        sy: 1,
        rot: 0,
        shadow: 1,
      }
    : guyAt(t, tr);

  // night amount (overlay) and dawn
  const night =
    set === "N" ? 1 : set === "P" ? 1 - prog(t, T.morning - 0.1, 14.65) : 0;
  const dawn =
    set === "P" ? Math.sin(Math.PI * prog(t, T.morning - 0.1, 15.4)) : 0;
  const bgBlur = set === "N" ? 3.2 : 0;

  // ---- set A: the sun, the fridge, the melting cube ----
  const sunLean =
    1 +
    0.12 * easeOutBack(prog(t, T.deserts, T.worst), 1.8) -
    0.04 * prog(t, T.worst, 6.6);
  const sunA = set === "A" && !cover;
  const fridgeS =
    pop(t, T.before, 0.3) * (1 - easeInCubic(prog(t, 4.25, 4.45)));
  const fridgeX = pop(t, T.fridges, 0.22);
  const fridgePuff = prog(t, 4.25, 4.85);
  // the cube slips out of the hand on "worst", falls and melts into a puddle
  const cube0 = iceIn("hero", W.guyA.x, W.guyA.y, HR);
  const fallU = prog(t, T.worst, T.worst + 0.32);
  const cubeY = lerp(cube0.y, W.guyA.y - 18, easeInCubic(fallU));
  const cubeX = cube0.x + 40 * fallU;
  const melt = easeInOutCubic(prog(t, 5.7, 6.6));
  const cubeS = (cube0.w / SPR.cube.w) * 1.22 * (1 - melt);
  const puddle = easeOutCubic(prog(t, 5.68, 6.4));

  // ---- set P: water, heat squiggles, freezing ----
  const B = SPR.pool.basin.map(([x, y]) => poolToWorld(x, y)) as P[];
  const waterLvl =
    set === "P"
      ? t < T.filled
        ? 0.62
        : lerp(0.62, 1, easeOutCubic(prog(t, T.filled, T.pools + 0.3)))
      : 0;
  const freezeU = easeInOutCubic(prog(t, T.froze - 0.1, T.froze + 0.55));
  const skyOpen =
    set === "P"
      ? pop(t, T.sky - 0.05, 0.3) * (1 - easeInCubic(prog(t, 11.15, 11.4)))
      : 0;
  const suck = prog(t, T.sucks - 0.05, 11.1);
  const skyMouth: Mouth = t > T.sucks - 0.08 && t < 11.05 ? "o" : "smile";
  const pucker =
    1 -
    0.25 * Math.sin(2 * Math.PI * 3 * suck) * (suck > 0 && suck < 1 ? 1 : 0);

  // ---- set D: the dome ----
  const tRel = 18.0;
  const domeS = W.dome.s;
  const gulp = bump(t, 18.3, 0.35);
  const flex = bump(t, T.thick, 0.4);
  const domeSy = 1 - 0.06 * gulp + 0.05 * flex;
  const domeSx = 1 + 0.05 * gulp + 0.03 * flex;
  const domeEyes = set === "D" ? pop(t, 18.45, 0.3) : 0;
  const doorOpen = t > T.freezer - 0.04 && t < 23.6 ? 1 : 0;
  const cutaway =
    set === "D"
      ? pop(t, T.walls, 0.3) * (1 - easeInCubic(prog(t, 20.3, 20.5)))
      : 0;
  const arrowU = easeOutCubic(prog(t, T.two, T.two + 0.35));
  const blockFly = prog(t, tRel, 18.32);
  const carryIce = iceIn("carry", 0, 0, HR);
  const sunD = set === "D";
  const sunDMood = t > 20.4 && t < 23.4;
  const domeSweat =
    t > 21.2 && t < 23.0
      ? pop(t, 21.2, 0.25) * (1 - easeInCubic(prog(t, 22.7, 22.95)))
      : 0;
  const skyE =
    set === "D"
      ? pop(t, T.sky2 - 0.05, 0.3) * (1 - easeInCubic(prog(t, 24.85, 25.1)))
      : 0;
  const wink = t > 24.32 && t < 24.62 ? 1 : 0;

  // the cube shot out of the door into the guy's hand
  const heroIce = iceIn("hero", W.guyE.x, W.groundD, HR);
  const cubeFly = prog(t, 22.88, 23.35);

  // block in the guy's hands drips while he runs (set D)
  const drips: React.ReactNode[] = [];
  if (set === "D" && t < tRel && g) {
    const ic = iceIn("carry", g.fx, g.fy, HR);
    for (let i = 0; i < 7; i++) {
      const t0 = T.ice2 + 0.15 + i * 0.3;
      const u = prog(t, t0, t0 + 0.42);
      if (u <= 0 || u >= 1) continue;
      const x = ic.x - ic.w * 0.35 + ic.w * 0.7 * rnd(i + 3) - (t - t0) * 300;
      drips.push(
        <SweatDrop
          key={i}
          x={x}
          y={ic.y + ic.h * 0.45 + 330 * u * u}
          r={16}
          s={1 - 0.3 * u}
        />,
      );
    }
  }

  const dome = SPR.dome;
  const domeTop = domeToWorld(dome.cx, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: "#9ED3F0" }}>
      {/* background plate (blurred in the close-up) */}
      <World cam={cam} blur={bgBlur}>
        <Img
          src={F("bg")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WW,
            height: WH,
          }}
        />
      </World>

      {/* the ice pool + water: environment, gets the full night colour */}
      {set === "P" ? (
        <World cam={cam}>
          <Spr
            n="pool"
            x={W.pool.x}
            y={W.pool.base}
            s={W.pool.s}
            ax={SPR.pool.w / 2}
            ay={SPR.pool.h}
          />
          <Svg>
            {/* water (fills from the back edge of the basin down to the level) */}
            {(() => {
              const [tl, tr2, br, bl] = B;
              const lv = waterLvl;
              const yTop = lerp(bl[1], tl[1], lv);
              const xl = lerp(bl[0], tl[0], lv);
              const xr = lerp(br[0], tr2[0], lv);
              const water = `M ${xl} ${yTop} L ${xr} ${yTop} L ${br[0]} ${br[1]} L ${bl[0]} ${bl[1]} Z`;
              const fx = lerp(bl[0] - 20, br[0] + 30, freezeU);
              return (
                <>
                  <defs>
                    <clipPath id="iceclip">
                      <rect x={0} y={0} width={fx} height={WH} />
                    </clipPath>
                  </defs>
                  <path d={water} fill={WATER} />
                  {Array.from({ length: 9 }).map((_, i) => {
                    const x =
                      lerp(xl + 60, xr - 120, i / 8) +
                      30 * Math.sin(2 * Math.PI * 0.4 * tr + i);
                    const y = lerp(yTop + 10, bl[1] - 10, rnd(i + 2));
                    const slosh = 1 + 0.6 * bump(t, T.filled, 0.8);
                    return (
                      <path
                        key={i}
                        d={`M ${x} ${y} q 22 -8 44 0 q 22 8 44 0`}
                        fill="none"
                        stroke={WATER_LITE}
                        strokeWidth={6 * slosh}
                        strokeLinecap="round"
                        opacity={0.8}
                      />
                    );
                  })}
                  {freezeU > 0 ? (
                    <g clipPath="url(#iceclip)">
                      <path d={water} fill={ICE} />
                      {Array.from({ length: 7 }).map((_, i) => {
                        const x = lerp(xl + 40, xr - 140, i / 6);
                        return (
                          <path
                            key={i}
                            d={`M ${x} ${bl[1] - 6} L ${x + 60} ${yTop + 6}`}
                            stroke={ICE_LITE}
                            strokeWidth={16}
                            strokeLinecap="round"
                          />
                        );
                      })}
                      {Array.from({ length: 6 }).map((_, i) => {
                        const x =
                          lerp(xl + 120, xr - 200, i / 5) + 40 * rnd(i + 11);
                        const y = lerp(yTop, bl[1], 0.5);
                        return (
                          <path
                            key={`c${i}`}
                            d={`M ${x} ${y} l 30 -12 l 18 16 m -18 -16 l 6 -16`}
                            fill="none"
                            stroke="#7FB8D8"
                            strokeWidth={5}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </g>
                  ) : null}
                  {freezeU > 0 && freezeU < 1 ? (
                    <g>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <path
                          key={i}
                          transform={`translate(${fx} ${lerp(yTop, bl[1], (i + 0.5) / 4)}) rotate(${45 * i + tr * 200}) scale(${0.8 + 0.4 * Math.sin(tr * 30 + i)})`}
                          d="M 0 -26 Q 0 0 26 0 Q 0 0 0 26 Q 0 0 -26 0 Q 0 0 0 -26 Z"
                          fill="#FFFFFF"
                          stroke="#000"
                          strokeWidth={3}
                        />
                      ))}
                    </g>
                  ) : null}
                </>
              );
            })()}
          </Svg>
        </World>
      ) : null}
      {night > 0.001 ? (
        <AbsoluteFill
          style={{
            backgroundColor: NIGHT,
            mixBlendMode: "multiply",
            opacity: 0.66 * night,
          }}
        />
      ) : null}
      {dawn > 0.001 ? (
        <AbsoluteFill
          style={{
            backgroundColor: DAWN,
            mixBlendMode: "multiply",
            opacity: 0.3 * dawn,
          }}
        />
      ) : null}

      <World cam={cam}>
        {/* ---------- set A ---------- */}
        {set === "A" ? (
          <>
            {sunA ? (
              <Svg>
                <Sun
                  x={W.sunA.x}
                  y={W.sunA.y}
                  r={W.sunA.r}
                  tr={tr}
                  scale={
                    sunLean * (1 + 0.015 * Math.sin(2 * Math.PI * 0.8 * tr))
                  }
                  look={t < T.worst ? [-0.7, 0.7] : [-0.5, 0.9]}
                  mouth={t < T.deserts ? "smug" : t < 6.9 ? "grin" : "smug"}
                  lid={t < T.deserts ? 0.35 : 0.15}
                  lidTilt={14}
                  browTilt={-0.6}
                />
              </Svg>
            ) : null}
            {/* heat shimmer over the sand */}
            <Svg>
              {Array.from({ length: 7 }).map((_, i) => {
                const ph = (tr * 0.55 + rnd(i)) % 1;
                const life = Math.sin(Math.PI * ph);
                const x = 160 + i * 205 + 30 * rnd(i + 9);
                const y = 2020 - 260 * ph;
                return (
                  <path
                    key={i}
                    d={`M ${x} ${y} q 12 -22 0 -44 q -12 -22 0 -44`}
                    fill="none"
                    stroke="#FFF3D6"
                    strokeWidth={9 * life}
                    strokeLinecap="round"
                    opacity={0.75 * life}
                  />
                );
              })}
            </Svg>
            {!cover ? (
              <Svg>
                <Fridge
                  x={W.fridge.x}
                  y={W.fridge.y}
                  w={W.fridge.w}
                  h={W.fridge.h}
                  s={fridgeS}
                  xs={fridgeX}
                />
                {fridgePuff > 0 && fridgePuff < 1 ? (
                  <PuffCluster
                    puffs={puffRing(
                      W.fridge.x,
                      W.fridge.y - 160,
                      fridgePuff,
                      7,
                      120,
                      62,
                      1,
                    )}
                    fill="#FFFFFF"
                    ink={8}
                  />
                ) : null}
                {puddle > 0 ? (
                  <ellipse
                    cx={cube0.x + 40}
                    cy={W.guyA.y - 4}
                    rx={30 + 70 * puddle}
                    ry={9 + 15 * puddle}
                    fill={WATER_LITE}
                    stroke="#000"
                    strokeWidth={6}
                  />
                ) : null}
                {melt > 0.05 && melt < 1
                  ? Array.from({ length: 3 }).map((_, i) => {
                      const u = prog(t, 5.75 + i * 0.25, 6.55 + i * 0.25);
                      return u > 0 && u < 1 ? (
                        <PuffCluster
                          key={i}
                          puffs={[
                            {
                              x: cube0.x + 30 + 26 * (i - 1),
                              y: W.guyA.y - 40 - 170 * u,
                              r: 26 * Math.sin(Math.PI * u),
                            },
                          ]}
                          fill="#FFFFFF"
                          ink={6}
                        />
                      ) : null;
                    })
                  : null}
              </Svg>
            ) : null}
            {g ? <Guy g={g} /> : null}
            {t >= T.worst && cubeS > 0.004 && !cover ? (
              <Spr
                n="cube"
                x={cubeX}
                y={cubeY}
                s={cubeS}
                ax={SPR.cube.w / 2}
                ay={SPR.cube.h / 2}
                rot={150 * fallU}
                sy={1 - 0.45 * melt}
              />
            ) : null}
            {t >= 6.0 && t < T.but1 && !cover ? (
              <Svg>
                <SweatDrop
                  x={W.guyA.x + 120}
                  y={W.guyA.y - 560 + 60 * prog(t, 6.2, 7.1)}
                  r={16}
                  s={pop(t, 6.0, 0.25)}
                />
              </Svg>
            ) : null}
          </>
        ) : null}

        {/* ---------- set N: the close-up under the night sky ---------- */}
        {set === "N" ? (
          <Spr
            n="awe"
            x={W.awe.x}
            y={W.awe.y}
            s={W.awe.s}
            ax={SPR.awe.head[0]}
            ay={SPR.awe.head[1]}
            sx={1 + 0.012 * Math.sin(2 * Math.PI * 0.6 * tr)}
            sy={
              1 +
              0.012 * Math.sin(2 * Math.PI * 0.6 * tr + 0.4) +
              0.02 * bump(t, T.nights, 0.3)
            }
            rot={1.5 * Math.sin(2 * Math.PI * 0.35 * (t - T.but1))}
          />
        ) : null}

        {/* ---------- set P: the ice pool ---------- */}
        {set === "P" ? (
          <>
            {g ? <Guy g={g} /> : null}
            {/* the pop-in puff of the guy */}
            {t > 11.6 && t < 12.2 ? (
              <Svg>
                <PuffCluster
                  puffs={puffRing(
                    W.pourFeet.x + 20,
                    W.pourFeet.y - 150,
                    prog(t, 11.6, 12.15),
                    7,
                    120,
                    46,
                    2,
                  )}
                  fill="#FFFFFF"
                  ink={7}
                />
              </Svg>
            ) : null}
          </>
        ) : null}

        {/* ---------- set D: the dome ---------- */}
        {set === "D" ? (
          <>
            {sunD ? (
              <Svg>
                <Sun
                  x={W.sunD.x}
                  y={W.sunD.y}
                  r={W.sunD.r}
                  tr={tr}
                  scale={
                    (1 + 0.18 * bump(t, T.but2 + 0.05, 0.45)) *
                    (1 + 0.06 * bump(t, 21.2, 0.5))
                  }
                  look={
                    t < tRel
                      ? [0.6, 0.8]
                      : t < 23.3
                        ? [0.95, 0.5]
                        : t < 24.0
                          ? [0.6, 0.9]
                          : [0.9, 0.2]
                  }
                  mouth={
                    t < tRel
                      ? "grin"
                      : sunDMood
                        ? "grin"
                        : t > T.sky2
                          ? "o"
                          : "flat"
                  }
                  lid={t < tRel || sunDMood ? 0.3 : 0}
                  lidTilt={18}
                  browTilt={-0.7}
                />
              </Svg>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${W.dome.cx}px, ${W.dome.base}px) scale(${domeSx}, ${domeSy})`,
                transformOrigin: "0 0",
              }}
            >
              <Spr n="dome" x={0} y={0} s={domeS} ax={dome.cx} ay={dome.base} />
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  overflow: "visible",
                }}
                width={10}
                height={10}
              >
                <g transform={`translate(${-W.dome.cx} ${-W.dome.base})`}>
                  {/* open door */}
                  {doorOpen ? (
                    <g>
                      <path
                        d={`M ${DOOR.x0 + 18} ${DOOR.y1 - 4} L ${DOOR.x0 + 18} ${DOOR.cy - 10} Q ${DOOR.cx} ${DOOR.y0 - 6} ${DOOR.x1 - 18} ${DOOR.cy - 10} L ${DOOR.x1 - 18} ${DOOR.y1 - 4} Z`}
                        fill="#120C08"
                        stroke="#000"
                        strokeWidth={7}
                      />
                    </g>
                  ) : null}
                  {/* the dome's face */}
                  {domeEyes > 0 ? (
                    <g>
                      <Eye
                        x={W.dome.cx - 72}
                        y={domeTop[1] + 455 * domeS}
                        r={46}
                        open={domeEyes}
                        look={
                          t < 20.4
                            ? [-0.5, 0.3]
                            : t < 22.8
                              ? [-0.8, -0.6]
                              : [-0.9, 0.4]
                        }
                        lid={t > T.walls && t < 20.4 ? 0.42 : 0.12}
                        side={-1}
                        brow={0.5}
                      />
                      <Eye
                        x={W.dome.cx + 72}
                        y={domeTop[1] + 455 * domeS}
                        r={46}
                        open={domeEyes}
                        look={
                          t < 20.4
                            ? [-0.5, 0.3]
                            : t < 22.8
                              ? [-0.8, -0.6]
                              : [-0.9, 0.4]
                        }
                        lid={t > T.walls && t < 20.4 ? 0.42 : 0.12}
                        side={1}
                        brow={0.5}
                      />
                      <g
                        transform={`translate(${W.dome.cx} ${domeTop[1] + 590 * domeS}) scale(${domeEyes})`}
                      >
                        <MouthShape
                          x={0}
                          y={0}
                          r={58}
                          m={
                            t > 18.3 && t < 18.55
                              ? "o"
                              : t > T.freezer - 0.05 && t < 23.4
                                ? "grin"
                                : "smug"
                          }
                        />
                      </g>
                      {domeSweat > 0 ? (
                        <SweatDrop
                          x={W.dome.cx + 150}
                          y={
                            domeTop[1] + 380 * domeS + 50 * prog(t, 21.4, 22.8)
                          }
                          r={20}
                          s={domeSweat}
                        />
                      ) : null}
                    </g>
                  ) : null}
                  {/* x-ray cut-away above the door: thick wall | the ice inside | thick wall */}
                  {cutaway > 0.001 ? (
                    <g
                      transform={`translate(${W.dome.cx} ${W.dome.base - 330}) scale(${cutaway})`}
                    >
                      <rect
                        x={-215}
                        y={-140}
                        width={430}
                        height={280}
                        rx={30}
                        fill={CAVE}
                        stroke="#000"
                        strokeWidth={10}
                      />
                      {[-1, 1].map((sd) => (
                        <g key={sd}>
                          <rect
                            x={sd < 0 ? -215 : 95}
                            y={-140}
                            width={120}
                            height={280}
                            rx={sd < 0 ? 30 : 30}
                            fill={MUD}
                            stroke="#000"
                            strokeWidth={9}
                          />
                          {[-80, -10, 60].map((y) => (
                            <line
                              key={y}
                              x1={sd < 0 ? -210 : 100}
                              x2={sd < 0 ? -100 : 210}
                              y1={y}
                              y2={y}
                              stroke={MUD_DARK}
                              strokeWidth={6}
                            />
                          ))}
                        </g>
                      ))}
                      {[
                        [-78, 62],
                        [-8, 62],
                        [-44, -6],
                        [26, -6],
                      ].map(([x, y], i) => (
                        <g key={i}>
                          <rect
                            x={x - 6}
                            y={y - 6}
                            width={58}
                            height={58}
                            rx={10}
                            fill={ICE}
                            stroke="#000"
                            strokeWidth={6}
                          />
                          <path
                            d={`M ${x + 4} ${y + 38} L ${x + 28} ${y + 2}`}
                            stroke={ICE_LITE}
                            strokeWidth={8}
                            strokeLinecap="round"
                          />
                        </g>
                      ))}
                      {arrowU > 0 ? (
                        <g transform={`translate(-155 -95) scale(${arrowU} 1)`}>
                          <line
                            x1={-48}
                            x2={48}
                            y1={0}
                            y2={0}
                            stroke="#000"
                            strokeWidth={20}
                            strokeLinecap="round"
                          />
                          <line
                            x1={-48}
                            x2={48}
                            y1={0}
                            y2={0}
                            stroke="#FFE14D"
                            strokeWidth={9}
                            strokeLinecap="round"
                          />
                          <path
                            d="M -62 0 L -38 -20 L -38 20 Z"
                            fill="#FFE14D"
                            stroke="#000"
                            strokeWidth={6}
                            strokeLinejoin="round"
                          />
                          <path
                            d="M 62 0 L 38 -20 L 38 20 Z"
                            fill="#FFE14D"
                            stroke="#000"
                            strokeWidth={6}
                            strokeLinejoin="round"
                          />
                        </g>
                      ) : null}
                    </g>
                  ) : null}
                </g>
              </svg>
            </div>
            {/* the "2 m" tag (outside the dome transform so it does not squash) */}
            {cutaway > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: W.dome.cx - 155 - 260,
                  top: W.dome.base - 330 - 95 - 175,
                  width: 240,
                  textAlign: "center",
                  fontFamily: FONT,
                  fontSize: 92,
                  color: "#FFE14D",
                  WebkitTextStroke: "20px #000",
                  paintOrder: "stroke fill",
                  transform: `scale(${pop(t, T.two + 0.15, 0.3) * cutaway * (1 + 0.12 * bump(t, T.thick, 0.3))}) rotate(-6deg)`,
                }}
              >
                2 m
              </div>
            ) : null}
            {/* the block flies into the door */}
            {blockFly > 0 && blockFly < 1
              ? (() => {
                  const start = {
                    x: W.guyE.x + carryIce.x,
                    y: W.groundD + carryIce.y,
                  };
                  const end = { x: DOOR.cx, y: DOOR.cy + 10 };
                  const u = blockFly;
                  const x = lerp(start.x, end.x, u);
                  const y =
                    lerp(start.y, end.y, u) - 260 * Math.sin(Math.PI * u);
                  const s0 = carryIce.w / SPR.block.w;
                  return (
                    <Spr
                      n="block"
                      x={x}
                      y={y}
                      s={s0 * lerp(1, 0.45, easeInCubic(u))}
                      ax={SPR.block.w / 2}
                      ay={SPR.block.h / 2}
                      rot={-200 * u}
                    />
                  );
                })()
              : null}
            {g ? <Guy g={g} /> : null}
            <Svg>{drips}</Svg>
            {/* the cube shoots out of the door into the guy's hand */}
            {cubeFly > 0 && cubeFly < 1
              ? (() => {
                  const u = cubeFly;
                  const x = lerp(DOOR.cx, heroIce.x, u);
                  const y =
                    lerp(DOOR.cy, heroIce.y, u) - 330 * Math.sin(Math.PI * u);
                  const s1 = (heroIce.w / SPR.cube.w) * 1.22;
                  return (
                    <Spr
                      n="cube"
                      x={x}
                      y={y}
                      s={s1 * lerp(0.6, 1, u)}
                      ax={SPR.cube.w / 2}
                      ay={SPR.cube.h / 2}
                      rot={360 * (1 - u)}
                    />
                  );
                })()
              : null}
            {t > 23.35 && t < 23.9 ? (
              <Svg>
                {Array.from({ length: 4 }).map((_, i) => {
                  const u = prog(t, 23.35 + i * 0.05, 23.75 + i * 0.05);
                  const a = (i / 4) * 2 * Math.PI + 0.6;
                  const R = 50 + 70 * u;
                  return u > 0 && u < 1 ? (
                    <path
                      key={i}
                      transform={`translate(${heroIce.x + Math.cos(a) * R} ${heroIce.y + Math.sin(a) * R}) scale(${Math.sin(Math.PI * u)})`}
                      d="M 0 -22 Q 0 0 22 0 Q 0 0 0 22 Q 0 0 -22 0 Q 0 0 0 -22 Z"
                      fill="#FFFFFF"
                      stroke="#000"
                      strokeWidth={4}
                    />
                  ) : null;
                })}
              </Svg>
            ) : null}
            {skyE > 0 ? (
              <Svg>
                <SkyFace
                  xl={W.skyEyesE.xl}
                  xr={W.skyEyesE.xr}
                  y={W.skyEyesE.y}
                  r={W.skyEyesE.r}
                  open={skyE}
                  look={[-0.3, 0.6]}
                  mouth="smile"
                  mx={(W.skyEyesE.xl + W.skyEyesE.xr) / 2}
                  my={W.skyEyesE.y + 95}
                  mr={70}
                  wink={wink}
                  dark={false}
                />
              </Svg>
            ) : null}
          </>
        ) : null}
      </World>

      {/* weak night colour on the characters (they stay readable) */}
      {night > 0.001 ? (
        <AbsoluteFill
          style={{
            backgroundColor: NIGHT,
            mixBlendMode: "multiply",
            opacity: 0.3 * night,
          }}
        />
      ) : null}

      {/* glowing things above the night colour: stars, the sky's face, the heat being sucked out of the water */}
      {night > 0.001 || set === "P" ? (
        <World cam={cam}>
          <Svg>
            <Stars tr={tr} op={night} />
            {set === "P" ? (
              <>
                <SkyFace
                  xl={W.skyEyes.xl}
                  xr={W.skyEyes.xr}
                  y={W.skyEyes.y}
                  r={W.skyEyes.r}
                  open={skyOpen}
                  look={t < T.sucks ? [0, 0.9] : [0, 1]}
                  lid={t > 10.9 ? 0.35 : 0}
                  mouth={skyMouth}
                  mOpen={pucker}
                  mx={W.skyMouth.x}
                  my={W.skyMouth.y}
                  mr={86}
                />
                {Array.from({ length: 22 }).map((_, i) => {
                  const t0 = T.sucks - 0.05 + i * 0.058;
                  const u = prog(t, t0, t0 + 0.85);
                  if (u <= 0 || u >= 1) return null;
                  const [tl, , br] = B;
                  const x0 = lerp(300, 1240, (i * 0.37 + rnd(i * 2.3 + 4) * 0.3) % 1);
                  const y0 = lerp(tl[1], br[1], 0.5);
                  const e = easeInCubic(u);
                  const x =
                    lerp(x0, W.skyMouth.x, e) + 40 * Math.sin(u * 6 + i);
                  const y = lerp(y0, W.skyMouth.y + 20, e);
                  return (
                    <Squiggle
                      key={i}
                      x={x}
                      y={y}
                      h={170}
                      ph={tr * 9 + i}
                      s={
                        Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - 0.6 * e)
                      }
                    />
                  );
                })}
              </>
            ) : null}
          </Svg>
        </World>
      ) : null}

      {!cover ? <Calendar t={t} /> : null}
    </AbsoluteFill>
  );
};

export const DesertIceShort: React.FC = () => {
  useDesertFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = camAt(t, CAM);
  const sh = shake(
    t,
    9 * bump(t, 18.32, 0.3) +
      6 * bump(t, T.thick, 0.3) +
      4 * bump(t, T.fridges + 0.04, 0.2),
  );
  const cam = { x: c.x - sh.x / c.k, y: c.y - sh.y / c.k, k: c.k };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio
          src={staticFile("desert-ice/vo/take1.mp3")}
          volume={Math.pow(10, MIX_DB / 20)}
        />
      </Sequence>
      <SoundCues
        cues={CUES.map((q) => ({
          ...q,
          db: q.db + MIX_DB,
          keys: q.keys?.map(
            ([kt, kd]) => [kt, kd + MIX_DB] as [number, number],
          ),
        }))}
        dir="desert-ice/sfx"
        fps={FPS}
      />
    </AbsoluteFill>
  );
};
