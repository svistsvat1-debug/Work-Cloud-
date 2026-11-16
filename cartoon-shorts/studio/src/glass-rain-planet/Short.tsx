import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as GRP_DURATION, FPS as GRP_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why can't you swim on this blue planet?" - the channel's white guy (+ swim goggles and a swim ring) stands on a
// diving board sticking out of his little ship above a huge cobalt-blue planet with a sleepy face. He dips a toe,
// winds up, cannonballs in - and falls through the blue: no splash. But there's no ocean, only sky, and it fills up
// with tiny bits of glass. It rains glass (his umbrella pops open), then SIDEWAYS: the umbrella flips inside out, a
// 5,000+ MPH gauge slams into the red, he tumbles. The ship swoops in, he grabs the ladder; inside he cracks the
// porthole for fresh air - a green stink cloud squeezes in: rotten eggs. He slams it, the ship zooms off, the planet
// winks and goes back to sleep (frame 0 again, minus the visitor).

const F = (n: string) => staticFile(`glass-rain-planet/${n}.png`);
export const FONT = 'GRPInter';
export const useGRPFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5; // master: final mix peak ~ -4 dBFS (MIX 0 gave -3.5 dBFS)
const NAVY = '#011954';
const YEL = '#FFD23F';
const ORANGE = '#FF9F1C';
const RED = '#F1301D';
const HULL = '#F6F0F0';
const HULL_SH = '#DED8D8';
const STRIPE = '#FC7E12';
const RIM = '#909090';
const GLASS = '#8AD2EA';
const STINK = '#A6D85A';
const STINK_SH = '#7DB83E';

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: readonly number[]; head?: readonly number[]; fist?: readonly number[]; fists?: readonly number[]};
const sp = (n: SprName) => SPR[n] as unknown as SP;

// ---------- time ----------
const CROUCH = 2.15; // wind-up on the board
const TAKE = T.jump - 0.02; // leaves the board
const APEX = 3.0; // leap -> cannonball
const CUT_SKY = 4.0; // hidden under the cloud wipe
const DIVE_END = 4.42;
const BUT = T.but - 0.02;
const TILT = [7.05, 8.05] as const; // camera looks down: no ocean
const RAIN0 = 11.2; // the glass starts to fall
const UMB_OPEN = 11.33;
const SIDE = T.sideways; // wind
const UMB_FLIP = 13.42;
const CURL = 15.55;
const PADDLE = T.so3;
const GRAB = T.ship - 0.02;
const CUT_PORT = 18.72;
const CRACK = T.crack;
const SNIFF = 19.28;
const YUCK = T.rotten;
const GREEN_T = T.eggs - 0.04;
const SLAM = 21.22;
const CUT_END = 21.45;
const WINK = 22.22; // the planet winks after the ship is gone
const SLEEP0 = 22.62; // ...and closes its eyes again (frame 0)

// ---------- helpers ----------
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
// squash-swap: anticipation squash before the swap frame, damped stretch after it
const squashSwap = (t: number, tSwap: number, amt = 1): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u * amt, 1 - 0.07 * u * amt];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s * amt, 1 + 0.04 * s * amt];
};
const mulSq = (a: [number, number], b: [number, number]): [number, number] => [a[0] * b[0], a[1] * b[1]];
const popOut = (t: number, t0: number, t1: number, dur = 0.22) => pop(t, t0, dur) * (1 - easeInCubic(prog(t, t1 - 0.15, t1)));

const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 9000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);

// the guy: any pose, anchored at its head centre (default), feet or a given sprite point; head radius R in the world.
const Guy: React.FC<{
  n: SprName;
  x: number;
  y: number;
  R: number;
  anchor?: 'head' | 'feet' | 'center' | readonly number[];
  sx?: number;
  sy?: number;
  rot?: number;
  green?: number;
}> = ({n, x, y, R, anchor = 'head', sx = 1, sy = 1, rot = 0, green = 0}) => {
  const p = sp(n);
  const h = p.head as readonly number[];
  const s = R / h[2];
  const [ax, ay] =
    typeof anchor === 'string'
      ? anchor === 'feet'
        ? [p.feet[0], p.feet[1]]
        : anchor === 'center'
          ? [p.w / 2, p.h / 2]
          : [h[0], h[1]]
      : [anchor[0], anchor[1]];
  const W = p.w * s;
  const Hh = p.h * s;
  const box: React.CSSProperties = {position: 'absolute', left: -ax * s, top: -ay * s, width: W, height: Hh};
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={box} />
      {green > 0.001 ? (
        <div
          style={{
            ...box,
            background: '#7CCB4A',
            WebkitMaskImage: `url(${F(n)})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${F(n)})`,
            maskSize: '100% 100%',
            mixBlendMode: 'multiply',
            opacity: green,
          }}
        />
      ) : null}
    </div>
  );
};
// a sprite point (sprite px) of pose n drawn head-anchored at (x, y) with head radius R -> world position
const ptOf = (n: SprName, R: number, x: number, y: number, px: readonly number[], rot = 0) => {
  const h = sp(n).head as readonly number[];
  const s = R / h[2];
  const dx = (px[0] - h[0]) * s;
  const dy = (px[1] - h[1]) * s;
  const c = Math.cos((rot * Math.PI) / 180);
  const si = Math.sin((rot * Math.PI) / 180);
  return {x: x + dx * c - dy * si, y: y + dx * si + dy * c};
};

const Label: React.FC<{x: number; y: number; s: number; text: string; size?: number; rot?: number; color?: string}> = ({x, y, s, text, size = 64, rot = 0, color = YEL}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${size * 0.22}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );

// four-point star (space)
const Star4: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <path
    d={`M ${x} ${y - r} Q ${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q ${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q ${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q ${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`}
    fill="#fff"
  />
);

// a tiny bit of glass: faceted shard with an outline and a glint. a = angle (deg), s = size scale (0 hides it)
const Shard: React.FC<{x: number; y: number; r: number; a: number; s: number; glint?: number; tail?: number; dir?: number}> = ({x, y, r, a, s, glint = 0, tail = 0, dir = 90}) => {
  if (s <= 0.001) return null;
  const k = r * s;
  return (
    <g>
      {tail > 1 ? (
        <line
          x1={x}
          y1={y}
          x2={x - Math.cos((dir * Math.PI) / 180) * tail}
          y2={y - Math.sin((dir * Math.PI) / 180) * tail}
          stroke="rgba(235, 250, 255, 0.75)"
          strokeWidth={Math.max(2, k * 0.5)}
          strokeLinecap="round"
        />
      ) : null}
      <g transform={`translate(${x} ${y}) rotate(${a})`}>
        <path d={`M 0 ${-k} L ${k * 0.62} ${-k * 0.1} L ${k * 0.18} ${k} L ${-k * 0.6} ${k * 0.25} Z`} fill="#D9F7FF" stroke="#000" strokeWidth={Math.max(2, k * 0.2)} strokeLinejoin="round" />
        <path d={`M 0 ${-k} L ${k * 0.18} ${k}`} stroke="#9EDCF0" strokeWidth={Math.max(1.5, k * 0.12)} />
        {glint > 0.01 ? (
          <g transform={`scale(${0.4 + glint})`}>
            <path d={`M 0 ${-k * 1.6} L ${k * 0.18} ${-k * 0.18} L ${k * 1.6} 0 L ${k * 0.18} ${k * 0.18} L 0 ${k * 1.6} L ${-k * 0.18} ${k * 0.18} L ${-k * 1.6} 0 L ${-k * 0.18} ${-k * 0.18} Z`} fill="#fff" opacity={glint} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// a flat cartoon cloud: one merged outline (shared PuffCluster)
const cloudPuffs = (x: number, y: number, w: number, seed: number): Puff[] => {
  const n = 6;
  return Array.from({length: n}, (_, i) => {
    const u = i / (n - 1);
    const r = w * (0.17 + 0.1 * Math.sin(Math.PI * u) + 0.03 * rnd(seed + i));
    return {x: x - w / 2 + u * w, y: y - Math.sin(Math.PI * u) * w * 0.1, r};
  });
};

// ======================================================================================================
// SPACE (scenes A and D): the plate centred on the origin, PS = 1.3 (1024 -> 1331 px), navy extends above it
// ======================================================================================================
const PS = 1.3;
const PL_X = -512 * PS;
const PL_Y = -768 * PS;
const PLANET = {x: (SPR.space.planet[0] - 512) * PS, y: (SPR.space.planet[1] - 768) * PS, r: SPR.space.planet[2] * PS};
const FACE = {x: PLANET.x, y: PLANET.y - PLANET.r + 200};
const SH_S = 0.58;
const SHIP = {x: -230, y: -505}; // ship feet anchor in the world
const BOARD = {x0: -20, x1: 330, y: -666, th: 22};
const BX = 270; // his feet on the board
const R_A = 92;
const LEAP_OFF = {x: ((sp('leap').head as readonly number[])[0] - sp('leap').feet[0]) * (R_A / 153), y: ((sp('leap').head as readonly number[])[1] - sp('leap').feet[1]) * (R_A / 153)};

export const CAM0: CamKey = {t: 0, x: -72, y: -477, k: 1.0};
const CAMS_A: CamKey[] = [
  CAM0,
  {t: 2.35, x: -10, y: -505, k: 1.13, ease: 'io'},
  {t: TAKE, x: -8, y: -508, k: 1.13},
  {t: APEX, x: 50, y: -620, k: 1.08, ease: 'out'},
  {t: 3.55, x: 130, y: -300, k: 1.1, ease: 'in'},
  {t: CUT_SKY + 0.05, x: 190, y: 120, k: 1.16, ease: 'io'},
];
const CAMS_D: CamKey[] = [
  {t: CUT_END, x: -40, y: -470, k: 1.07},
  {t: DURATION, x: -72, y: -477, k: 1.05, ease: 'io'},
];
const camOfA = (t: number): Cam => (t < CUT_END ? camAt(t, CAMS_A) : camAt(t, CAMS_D));

// board bend (px at the free end): crouch pushes it down, take-off springs it
const boardBend = (t: number) => {
  if (t < CROUCH) return 3 * bump(t, 0.9, 0.3) + 3 * bump(t, 1.5, 0.3);
  if (t < TAKE) return 26 * easeOutCubic(prog(t, CROUCH, CROUCH + 0.25));
  return 26 * spring(t - TAKE, 4.5, 4.5) * -1;
};

// head path in the jump (world)
const H0 = {x: BX + LEAP_OFF.x, y: BOARD.y + LEAP_OFF.y};
const YA = H0.y - 175;
const G = (2 * (H0.y - YA)) / ((APEX - TAKE) * (APEX - TAKE));
const headPath = (t: number) => ({x: H0.x + 175 * (t - TAKE), y: YA + 0.5 * G * (t - APEX) * (t - APEX)});

const Board: React.FC<{t: number; show: boolean; long?: boolean}> = ({t, show, long}) => {
  if (!show) return null;
  const d = boardBend(t);
  const {x1, y, th} = BOARD;
  const x0 = long ? -900 : BOARD.x0;
  const xm = lerp(x0, x1, 0.55);
  return (
    <Svg>
      <path
        d={`M ${x0} ${y} Q ${xm} ${y + d * 0.35} ${x1} ${y + d} L ${x1} ${y + d + th} Q ${xm} ${y + th + d * 0.35} ${x0} ${y + th} Z`}
        fill="#FFFFFF"
        stroke="#000"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d={`M ${x0 + 30} ${y + 5} Q ${xm} ${y + 5 + d * 0.35} ${x1 - 12} ${y + 5 + d * 0.95}`} stroke="#5ACBF6" strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* bracket under the board */}
      <path d={`M ${x0 + 10} ${y + th} L ${x0 + 60} ${y + th} L ${x0 + 10} ${y + th + 50} Z`} fill={RIM} stroke="#000" strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
};

const ShipSpr: React.FC<{x: number; y: number; s: number; rot?: number; flame?: number; t: number}> = ({x, y, s, rot = 0, flame = 0, t}) => {
  const p = sp('ship');
  const W = p.w * s;
  const Hh = p.h * s;
  const fl = flame * (1 + 0.15 * Math.sin(t * 60));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: '0 0'}}>
      {flame > 0.01 ? (
        <svg style={{position: 'absolute', left: -p.feet[0] * s - 400, top: -p.feet[1] * s - 400, overflow: 'visible'}} width={W + 800} height={Hh + 800}>
          {[285, 425].map((py) => (
            <g key={py} transform={`translate(${400 + 20 * s} ${400 + py * s})`}>
              <path d={`M 0 ${-34 * s} Q ${-260 * s * fl} 0 0 ${34 * s} Z`} fill="#FF7A1A" stroke="#000" strokeWidth={5} strokeLinejoin="round" />
              <path d={`M 0 ${-18 * s} Q ${-150 * s * fl} 0 0 ${18 * s} Z`} fill="#FFE066" />
            </g>
          ))}
        </svg>
      ) : null}
      <Img src={F('ship')} style={{position: 'absolute', left: -p.feet[0] * s, top: -p.feet[1] * s, width: W, height: Hh}} />
    </div>
  );
};

// the planet's code face
const PlanetFace: React.FC<{t: number}> = ({t}) => {
  const {x, y} = FACE;
  const er = 52;
  const ex = 150;
  // open: eyes pop on "blue"; ending: wink + sleep again
  const opened = t >= T.blue - 0.04 && t < SLEEP0;
  const openS = t < CUT_END ? pop(t, T.blue - 0.04, 0.24) : 1;
  const sleepU = prog(t, SLEEP0, SLEEP0 + 0.3);
  const wink = t > WINK && t < WINK + 0.34;
  // look target
  let look: [number, number] = [0.2, -0.6];
  if (t >= TAKE && t < CUT_SKY) {
    const hp = headPath(t);
    const dx = hp.x - x;
    const dy = hp.y - (y - 0);
    const L = Math.hypot(dx, dy) || 1;
    look = [clamp(dx / L, -1, 1), clamp(dy / L, -1, 1)];
  }
  if (t >= CUT_END) look = [0.55, -0.8];
  const blink = t > 1.95 && t < 2.05 ? 0.95 : 0;
  const happy = t < CUT_SKY && opened;
  const squint = t > 3.62 && t < CUT_SKY; // he hits the face
  return (
    <Svg>
      {opened ? (
        <>
          <Eye x={x - ex} y={y} r={er} open={openS} lid={blink} look={look} squeeze={squint} side={-1} brow={0.6} />
          {wink ? (
            <Eye x={x + ex} y={y} r={er} open={1} squeeze side={1} brow={0.6} />
          ) : (
            <Eye x={x + ex} y={y} r={er} open={openS} lid={blink} look={look} squeeze={squint} side={1} brow={0.6} />
          )}
        </>
      ) : (
        // sleepy closed eyes: two soft arcs
        [-1, 1].map((sd) => (
          <path
            key={sd}
            d={`M ${x + sd * ex - 40} ${y + 4 - 8 * sleepU} Q ${x + sd * ex} ${y + 30} ${x + sd * ex + 40} ${y + 4 - 8 * sleepU}`}
            fill="none"
            stroke="#000"
            strokeWidth={9}
            strokeLinecap="round"
          />
        ))
      )}
      {/* mouth */}
      {happy ? (
        <g transform={`translate(${x} ${y + 120}) scale(${0.6 + 0.4 * openS})`}>
          <path d="M -70 -14 Q 0 -4 70 -14 Q 60 60 0 66 Q -60 60 -70 -14 Z" fill="#06216A" stroke="#000" strokeWidth={9} strokeLinejoin="round" />
          <path d="M -34 40 Q 0 20 34 40 Q 18 62 0 63 Q -18 62 -34 40 Z" fill="#FC8D90" />
        </g>
      ) : t >= CUT_END && t < SLEEP0 ? (
        <path d={`M ${x - 60} ${y + 116} Q ${x + 10} ${y + 150} ${x + 70} ${y + 100}`} fill="none" stroke="#000" strokeWidth={10} strokeLinecap="round" />
      ) : (
        <path d={`M ${x - 50} ${y + 110} Q ${x} ${y + 140} ${x + 50} ${y + 110}`} fill="none" stroke="#000" strokeWidth={10} strokeLinecap="round" />
      )}
      {/* sleepy z's after the wink */}
      {[0, 1, 2].map((i) => {
        const u = (t - SLEEP0 - 0.15 - i * 0.28) / 1.1;
        if (u <= 0 || u >= 1) return null;
        const zx = x + 210 + 50 * i + 30 * Math.sin(u * 5);
        const zy = y - 40 - 260 * u;
        const zs = 0.7 + 0.5 * u;
        return (
          <text key={i} x={zx} y={zy} fontFamily={FONT} fontSize={70 * zs} fill="#fff" stroke="#000" strokeWidth={10 * zs} paintOrder="stroke" opacity={Math.sin(Math.PI * Math.min(1, u * 1.6))}>
            z
          </text>
        );
      })}
      {/* cheeks */}
      <ellipse cx={x - ex - 55} cy={y + 80} rx={34} ry={18} fill="#4E7BFF" opacity={0.55} />
      <ellipse cx={x + ex + 55} cy={y + 80} rx={34} ry={18} fill="#4E7BFF" opacity={0.55} />
    </Svg>
  );
};

const SpaceBack: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => (
  <>
    <Svg>
      <rect x={-9000} y={-9000} width={18000} height={18000} fill={NAVY} />
      {[
        [-420, -1180, 16],
        [260, -1290, 13],
        [520, -1110, 11],
        [-150, -1420, 12],
        [430, -1500, 15],
      ].map(([sx, sy, r], i) => (
        <Star4 key={i} x={sx} y={sy} r={r * (0.85 + 0.15 * Math.sin(t * 3 + i * 1.7))} />
      ))}
    </Svg>
    <Img src={F('space')} style={{position: 'absolute', left: PL_X, top: PL_Y, width: 1024 * PS, height: 1536 * PS}} />
    <Svg>
      {/* the plate's sun sat right behind the ship's nozzles (read as exhaust): cover it, draw the orange star top-right */}
      <circle cx={PL_X + 120 * PS} cy={PL_Y + 116 * PS} r={78 * PS} fill={NAVY} />
      {cover ? null : (
        <>
          <circle cx={300} cy={-1230} r={92} fill="#FFB938" stroke="#000" strokeWidth={8} />
          <circle cx={300} cy={-1230} r={66} fill="#FFD25E" />
          <circle cx={273} cy={-1260} r={16} fill="#FFF1B8" />
        </>
      )}
    </Svg>
  </>
);

// a shine sweeping along the planet's rim in the first second
const RimGlint: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, 0.25, 1.35);
  if (u <= 0 || u >= 1) return null;
  const a0 = -152 + 112 * easeInOutCubic(u);
  const pt = (a: number) => [PLANET.x + (PLANET.r - 14) * Math.cos((a * Math.PI) / 180), PLANET.y + (PLANET.r - 14) * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0 - 9);
  const [x1, y1] = pt(a0 + 9);
  const [sx, sy] = pt(a0);
  return (
    <Svg>
      <path d={`M ${x0} ${y0} A ${PLANET.r - 14} ${PLANET.r - 14} 0 0 1 ${x1} ${y1}`} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.85 * Math.sin(Math.PI * u)} />
      <Star4 x={sx} y={sy - 6} r={34 * Math.sin(Math.PI * u)} />
    </Svg>
  );
};

const SpaceScene: React.FC<{t: number; cover?: boolean; camOverride?: Cam}> = ({t, cover, camOverride}) => {
  const cam = camOverride ?? camOfA(t);
  const sh = shake(t, 0);
  const camS = {...cam, x: cam.x + sh.x, y: cam.y + sh.y};
  const ending = t >= CUT_END;
  // ----- the guy (scene A) -----
  let guy: React.ReactNode = null;
  if (!ending) {
    const feet = {x: BX, y: BOARD.y + boardBend(t) * ((BX - BOARD.x0) / (BOARD.x1 - BOARD.x0))};
    if (t < TAKE) {
      const n: SprName = t < 1.55 ? 'hero' : t < CROUCH ? 'toe' : 'crouch';
      let sq: [number, number] = [breathe(t), 1 / breathe(t)];
      sq = mulSq(sq, squashSwap(t, 1.55));
      sq = mulSq(sq, squashSwap(t, CROUCH));
      const hop = -10 * bump(t, 0.9, 0.3) - 10 * bump(t, 1.5, 0.3);
      // toe pose: the toe dips over the edge on "Earth"
      const dip = n === 'toe' ? 6 * bump(t, T.earth - 0.05, 0.35) : 0;
      guy = <Guy n={n} x={feet.x + (n === 'toe' ? -18 : 0)} y={feet.y + hop + dip} R={R_A} anchor="feet" sx={sq[0]} sy={sq[1]} />;
    } else if (t < APEX) {
      // leap: feet-anchored on the projectile, stretched by the launch
      const hp = headPath(t);
      const st = squashSwap(t, TAKE, 1.4);
      guy = <Guy n="leap" x={hp.x} y={hp.y} R={R_A} sx={st[0]} sy={st[1]} />;
    } else {
      const hp = headPath(t);
      const st = squashSwap(t, APEX, 1.2);
      const rot = 520 * easeInCubic(prog(t, APEX, CUT_SKY)) * 1.0;
      const sR = R_A * (1 - 0.25 * prog(t, 3.4, CUT_SKY));
      guy = <Guy n="ball" x={hp.x} y={hp.y + 40} R={sR} anchor="center" sx={st[0]} sy={st[1]} rot={rot} />;
    }
  }
  // ----- the ship -----
  let ship: React.ReactNode;
  if (!ending) {
    const bob = 4 * Math.sin(2 * Math.PI * 0.45 * t);
    ship = <ShipSpr t={t} x={SHIP.x} y={SHIP.y + bob} s={SH_S} />;
  } else {
    const u = prog(t, CUT_END + 0.02, 22.25);
    const e = u * u;
    const x = 230 + 1150 * e;
    const y = -330 - 1250 * e - 60 * Math.sin(Math.PI * u);
    const s = SH_S * (1 - 0.45 * u);
    ship = u < 0.999 ? <ShipSpr t={t} x={x} y={y} s={s} rot={-38 * easeOutCubic(prog(t, CUT_END, CUT_END + 0.3))} flame={easeOutCubic(prog(t, CUT_END, CUT_END + 0.15))} /> : null;
  }
  // stink trail after the ship (ending)
  const trail: Puff[] = ending
    ? Array.from({length: 7}, (_, i) => {
        const ti = CUT_END + 0.05 + i * 0.1;
        const u = prog(ti, CUT_END + 0.02, 22.25);
        const e = u * u;
        const age = t - ti;
        if (age < 0) return {x: 0, y: 0, r: 0};
        const r = 30 * (1 - i * 0.08) * Math.sin(Math.PI * clamp(age / 0.9));
        return {x: 200 + 1150 * e + 10 * i, y: -300 - 1250 * e + 20 * age, r};
      })
    : [];
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <World cam={camS}>
        <SpaceBack t={t} cover={cover} />
        {cover ? null : <RimGlint t={t} />}
        <PlanetFace t={t} />
        {ending ? (
          <Svg>
            <PuffCluster puffs={trail} fill={STINK} shade={STINK_SH} ink={5} />
          </Svg>
        ) : null}
        <Board t={t} show={!ending} long={cover} />
        {cover ? null : ship}
        {cover ? null : guy}
        {cover ? <Guy n="toe" x={BX - 18} y={BOARD.y} R={R_A} anchor="feet" /> : null}
      </World>
    </AbsoluteFill>
  );
};

// cloud wipe between space and sky (screen space, on top)
const CloudWipe: React.FC<{t: number}> = ({t}) => {
  if (t < 3.6 || t > 4.45) return null;
  const top = t < CUT_SKY ? lerp(2350, -420, easeInCubic(prog(t, 3.6, 3.97))) : -420;
  const bot = t < CUT_SKY ? 2600 : lerp(2350, -480, easeInOutCubic(prog(t, CUT_SKY + 0.02, 4.42)));
  const edge = (y: number, flip: boolean, seed: number): Puff[] =>
    Array.from({length: 9}, (_, i) => ({x: -60 + i * 150, y: y + (flip ? 1 : -1) * (30 + 40 * rnd(seed + i)), r: 120 + 50 * rnd(seed + 7 * i)}));
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
        <rect x={-100} y={top} width={1280} height={Math.max(0, bot - top)} fill="#EAF6FF" />
        <PuffCluster puffs={edge(top, false, 3)} fill="#EAF6FF" shade="#CFE8FA" ink={7} />
        {t >= CUT_SKY ? <PuffCluster puffs={edge(bot, true, 11)} fill="#EAF6FF" ink={7} /> : null}
        <rect x={-100} y={top + 40} width={1280} height={Math.max(0, bot - top - 80)} fill="#EAF6FF" />
      </svg>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SKY (scene B): screen space; the plate scrolls up (we fall / the camera looks down); code clouds + streaks
// ======================================================================================================
const PS2 = 1.6;
const SKY_X = 540 - (1024 * PS2) / 2;
const SKY_MAX = 1536 * PS2 - 1920; // 538
const R_B = 88;
const scrollOf = (t: number) => {
  let s = 230 * easeInOutCubic(prog(t, CUT_SKY, BUT)) * 0.4 + 230 * 0.6 * prog(t, CUT_SKY, BUT);
  s += (SKY_MAX - 230) * easeInOutCubic(prog(t, TILT[0], TILT[1]));
  s -= 70 * easeInOutCubic(prog(t, 10.55, 11.25));
  return s;
};
// distance fallen (drives the near clouds + speed lines); freezes on "But"
const fallOf = (t: number) => {
  const a = Math.min(t, BUT) - CUT_SKY;
  if (a <= 0) return 0;
  const after = clamp(t - BUT, 0, 0.18);
  return 950 * a + 950 * (after - (after * after) / (2 * 0.18));
};
// the rescue ship in the sky + its rope ladder
const SHIP_SKY_S = 0.6;
const shipSky = (t: number) => {
  const shipU = easeOutCubic(prog(t, PADDLE, 18.1));
  const shipX = lerp(-520, 420, shipU) - 140 * easeInCubic(prog(t, GRAB + 0.05, CUT_PORT));
  const shipY = lerp(500, 470, shipU) - 200 * easeInCubic(prog(t, GRAB + 0.05, CUT_PORT)) + 8 * Math.sin(t * 5);
  const ladTop = {x: shipX + (315 - sp('ship').feet[0]) * SHIP_SKY_S, y: shipY + (640 - sp('ship').feet[1]) * SHIP_SKY_S};
  const ladAng = 12 + 6 * Math.sin(t * 9); // swings with the wind (deg from vertical, to the right)
  const ladLen = 330;
  const ladBot = {x: ladTop.x + ladLen * Math.sin((ladAng * Math.PI) / 180), y: ladTop.y + ladLen * Math.cos((ladAng * Math.PI) / 180)};
  return {shipX, shipY, ladTop, ladBot};
};
const hangRot = (t: number) => -18 + 10 * Math.sin(t * 16);
// where the hang pose's head is when its fists hold the ladder at time t
const hangHead = (t: number) => {
  const {ladBot} = shipSky(t);
  const h = sp('hang').head as readonly number[];
  const f = sp('hang').fists as readonly number[];
  const sc = R_B / h[2];
  const dx = (h[0] - f[0]) * sc;
  const dy = (h[1] - f[1]) * sc;
  const a = (hangRot(t) * Math.PI) / 180;
  return {x: ladBot.x + dx * Math.cos(a) - dy * Math.sin(a), y: ladBot.y + dx * Math.sin(a) + dy * Math.cos(a)};
};
// guy position on screen
const guyB = (t: number) => {
  let x = 540 + 14 * Math.sin(2 * Math.PI * 0.7 * t);
  let y = 800 + 10 * Math.sin(2 * Math.PI * 0.9 * t + 1);
  if (t < DIVE_END) y = lerp(560, 800, easeOutCubic(prog(t, CUT_SKY, DIVE_END)));
  y -= 220 * easeInOutCubic(prog(t, TILT[0], TILT[1]));
  y += 120 * easeInOutCubic(prog(t, 10.55, 11.25));
  // wind: blown right, then paddles back to the ladder
  x += 170 * easeInOutCubic(prog(t, SIDE + 0.1, CURL)) + 70 * easeInOutCubic(prog(t, CURL, PADDLE));
  if (t >= PADDLE) {
    const u = easeInOutCubic(prog(t, PADDLE, GRAB));
    const hh = hangHead(GRAB);
    x = lerp(x, hh.x, u);
    y = lerp(y, hh.y, u);
  }
  return {x, y};
};

const SKY_CLOUDS = [
  {x: 140, y: 220, w: 300, f: 1.0},
  {x: 950, y: 640, w: 280, f: 0.85},
  {x: 110, y: 1180, w: 330, f: 1.2},
  {x: 980, y: 1520, w: 300, f: 0.95},
  {x: 560, y: 2050, w: 240, f: 0.7},
  {x: 300, y: 1760, w: 200, f: 0.6},
];
const SPECKS = Array.from({length: 76}, (_, i) => {
  const ring = 150 + 820 * rnd(i * 3 + 1);
  const a = 2 * Math.PI * rnd(i * 7 + 2);
  return {
    bx: 540 + Math.cos(a) * ring * 0.75,
    by: 760 + Math.sin(a) * ring * 1.15,
    z: 0.6 + 0.8 * rnd(i * 11 + 5),
    t0: T.just + 1.3 * rnd(i * 13 + 4),
    rot: 360 * rnd(i * 17 + 6),
    late: i >= 50, // only in the rain
  };
});
// common glass displacement (straight down, then sideways): integrate the velocity
const rainVel = (t: number): [number, number] => {
  if (t < RAIN0) return [0, 0];
  const v = 900 * easeInCubic(prog(t, RAIN0, RAIN0 + 0.7)) + 1900 * easeInOutCubic(prog(t, SIDE, SIDE + 0.45));
  const ang = lerp(90, 8, easeInOutCubic(prog(t, SIDE, SIDE + 0.35)));
  return [v * Math.cos((ang * Math.PI) / 180), v * Math.sin((ang * Math.PI) / 180)];
};
const rainDisp = (t: number): [number, number] => {
  if (t <= RAIN0) return [0, 0];
  const dt = 1 / 120;
  let x = 0;
  let y = 0;
  for (let s = RAIN0; s < t; s += dt) {
    const [vx, vy] = rainVel(s);
    x += vx * dt;
    y += vy * dt;
  }
  return [x, y];
};
const wrap = (v: number, lo: number, hi: number) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

// umbrella (code): canopy over the raised fist. inv: 1 = normal dome, -1 = inside out
const Umbrella: React.FC<{x: number; y: number; s: number; inv: number; rot?: number}> = ({x, y, s, inv, rot = 0}) => {
  if (s <= 0.001) return null;
  const R = 170;
  const h = R * 0.72 * inv;
  const sc = 4;
  const scal = Array.from({length: sc}, (_, i) => {
    const xa = -R + (2 * R * i) / sc;
    const xb = -R + (2 * R * (i + 1)) / sc;
    return `Q ${(xa + xb) / 2} ${-26 * inv + 20} ${xb} 0`;
  }).join(' ');
  const scalRev = Array.from({length: sc}, (_, i) => {
    const xa = R - (2 * R * i) / sc;
    const xb = R - (2 * R * (i + 1)) / sc;
    return `Q ${(xa + xb) / 2} ${-26 * inv + 20} ${xb} 0`;
  }).join(' ');
  void scal;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* handle */}
      <path d="M 0 -150 L 0 6 Q 0 30 -22 30 Q -40 30 -40 12" fill="none" stroke="#000" strokeWidth={20} strokeLinecap="round" />
      <path d="M 0 -150 L 0 6 Q 0 30 -22 30 Q -40 30 -40 12" fill="none" stroke="#7A4A2A" strokeWidth={10} strokeLinecap="round" />
      <g transform="translate(0 -150)">
        <path d={`M ${-R} 0 C ${-R} ${-h * 1.3} ${R} ${-h * 1.3} ${R} 0 ${scalRev} Z`} fill={YEL} stroke="#000" strokeWidth={9} strokeLinejoin="round" />
        {/* panels */}
        <path d={`M ${-R * 0.35} ${-h * 0.92} Q ${-R * 0.3} ${-h * 0.4} ${-R * 0.5} 0`} fill="none" stroke="#000" strokeWidth={6} />
        <path d={`M ${R * 0.35} ${-h * 0.92} Q ${R * 0.3} ${-h * 0.4} ${R * 0.5} 0`} fill="none" stroke="#000" strokeWidth={6} />
        <path d={`M ${-R * 0.35} ${-h * 0.92} Q ${0} ${-h * 1.1} ${R * 0.35} ${-h * 0.92} Q ${R * 0.3} ${-h * 0.4} ${R * 0.5} 0 L ${-R * 0.5} 0 Q ${-R * 0.3} ${-h * 0.4} ${-R * 0.35} ${-h * 0.92} Z`} fill={ORANGE} stroke="#000" strokeWidth={6} strokeLinejoin="round" />
        <circle cx={0} cy={-h * 0.98} r={9} fill="#000" />
      </g>
    </g>
  );
};

// wind gauge (code): needle from 0 to the red zone
const Gauge: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, 14.3, 17.25, 0.25);
  if (s <= 0.001) return null;
  const x = 300;
  const y = 340;
  const r = 140;
  const u = prog(t, T.five - 0.05, T.thousand + 0.05);
  const ang = -120 + 215 * easeOutBack(u, 2.6) + (u >= 1 ? 4 * Math.sin(t * 55) : 0);
  const arc = (a0: number, a1: number, rr: number) => {
    const p = (a: number) => [x + rr * Math.sin((a * Math.PI) / 180), y - rr * Math.cos((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke="#000" strokeWidth={10} />
      <path d={arc(-120, 40, r - 26)} fill="none" stroke="#5BD06B" strokeWidth={22} />
      <path d={arc(40, 120, r - 26)} fill="none" stroke={RED} strokeWidth={22} />
      {Array.from({length: 9}, (_, i) => {
        const a = ((-120 + i * 30) * Math.PI) / 180;
        return <line key={i} x1={x + (r - 50) * Math.sin(a)} y1={y - (r - 50) * Math.cos(a)} x2={x + (r - 66) * Math.sin(a)} y2={y - (r - 66) * Math.cos(a)} stroke="#000" strokeWidth={6} />;
      })}
      <g transform={`rotate(${ang} ${x} ${y})`}>
        <path d={`M ${x - 9} ${y} L ${x} ${y - r + 34} L ${x + 9} ${y} Z`} fill={RED} stroke="#000" strokeWidth={5} strokeLinejoin="round" />
      </g>
      <circle cx={x} cy={y} r={16} fill="#000" />
    </g>
  );
};

const SkyScene: React.FC<{t: number}> = ({t}) => {
  const scroll = scrollOf(t);
  const fall = fallOf(t);
  const wind = prog(t, SIDE, SIDE + 0.4);
  const sh = shake(t, 6 * bump(t, UMB_FLIP, 0.4) + 3 * bump(t, T.thousand, 0.4) + 3 * wind * (t < CUT_PORT ? 1 : 0) * 0.5);
  // ----- guy pose -----
  const g = guyB(t);
  let n: SprName = 'diver';
  let rot = 0;
  let sq: [number, number] = [1, 1];
  if (t < DIVE_END) {
    n = 'diver';
    rot = 180 + 180 * easeInOutCubic(prog(t, 4.12, DIVE_END));
  } else if (t < 5.22) n = 'pinch';
  else if (t < 5.98) n = 'star';
  else if (t < BUT) n = 'scratch';
  else if (t < 10.15) n = 'cheeks';
  else if (t < T.so2) n = 'flail';
  else if (t < UMB_FLIP + 0.03) n = 'smug';
  else if (t < CURL) n = 'lean';
  else if (t < PADDLE) n = 'curl';
  else if (t < GRAB) n = 'paddle';
  else n = 'hang';
  for (const ts of [DIVE_END, 5.22, 5.98, BUT, 10.15, T.so2, UMB_FLIP + 0.03, CURL, PADDLE, GRAB]) sq = mulSq(sq, squashSwap(t, ts));
  if (n === 'pinch') rot = 4 * Math.sin(t * 9);
  if (n === 'star') rot = 6 * Math.sin(t * 2.5);
  if (n === 'cheeks') rot = 0;
  if (n === 'flail') rot = 5 * Math.sin(t * 14);
  if (n === 'lean') rot = -6 + 2 * Math.sin(t * 20);
  if (n === 'curl') rot = 720 * easeInOutCubic(prog(t, CURL, PADDLE));
  if (n === 'paddle') rot = 5 * Math.sin(t * 18);
  // hang: fists on the ladder rung
  const {shipX, shipY, ladTop, ladBot} = shipSky(t);
  const SS = SHIP_SKY_S;
  let guyNode: React.ReactNode;
  if (n === 'hang') {
    const fists = sp('hang').fists as readonly number[];
    guyNode = <Guy n="hang" x={ladBot.x} y={ladBot.y} R={R_B} anchor={fists} rot={hangRot(t)} sx={sq[0]} sy={sq[1]} />;
  } else if (n === 'curl' || n === 'diver') {
    guyNode = <Guy n={n} x={g.x} y={g.y} R={R_B} anchor="center" rot={rot} sx={sq[0]} sy={sq[1]} />;
  } else {
    guyNode = <Guy n={n} x={g.x} y={g.y} R={R_B} rot={rot} sx={sq[0] * breathe(t)} sy={sq[1] / breathe(t)} />;
  }
  // ----- umbrella -----
  const fistW = ptOf('smug', R_B, g.x, g.y, sp('smug').fist as readonly number[], 0);
  const umbOpen = easeOutBack(prog(t, UMB_OPEN, UMB_OPEN + 0.25), 2.2);
  const flipU = prog(t, UMB_FLIP, UMB_FLIP + 0.12);
  const flyU = prog(t, UMB_FLIP + 0.12, UMB_FLIP + 0.8);
  const umb =
    t >= UMB_OPEN && flyU < 1 ? (
      <Umbrella
        x={fistW.x + 1300 * easeInCubic(flyU)}
        y={fistW.y + 40 - 380 * easeOutCubic(flyU)}
        s={umbOpen * (0.86 + 0.05 * bump(t, 12.02, 0.2) + 0.05 * bump(t, 12.6, 0.2))}
        inv={lerp(1, -0.9, easeOutBack(flipU, 2))}
        rot={540 * flyU + (t < UMB_FLIP ? 3 * Math.sin(t * 7) : 0)}
      />
    ) : null;
  // canopy span for hiding the rain under the umbrella
  const canopy = t >= UMB_OPEN && t < UMB_FLIP + 0.1 ? {x0: fistW.x - 146, x1: fistW.x + 146, y: fistW.y - 150 * 0.86 - 50} : null;
  // ----- specks / rain -----
  const [dx, dy] = rainDisp(t);
  const [vx, vy] = rainVel(t);
  const vmag = Math.hypot(vx, vy);
  const dir = (Math.atan2(vy, vx) * 180) / Math.PI;
  const glintAll = bump(t, T.glass, 0.35);
  const specks = SPECKS.map((p, i) => {
    if (p.late && t < RAIN0) return null;
    const appear = p.late ? pop(t, RAIN0 + 0.4 * rnd(i), 0.2) : pop(t, p.t0, 0.22);
    if (appear <= 0.001) return null;
    let x = p.bx + 20 * Math.sin(t * 0.8 + i);
    let y = p.by + 16 * Math.cos(t * 0.7 + i * 1.3) - (scroll - 230) * 0.15 * p.z;
    if (p.late) y -= 1100;
    x = wrap(x + dx * p.z, -120, 1200);
    y = wrap(y + dy * p.z, -150, 2070);
    if (canopy && x > canopy.x0 && x < canopy.x1 && y > canopy.y && y < canopy.y + 900) return null;
    const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 2.1);
    const glint = Math.max(glintAll * 0.9, t > p.t0 && t < p.t0 + 0.3 ? 1 - (t - p.t0) / 0.3 : 0) * (0.6 + 0.4 * tw);
    return <Shard key={i} x={x} y={y} r={21 * p.z} a={p.rot + t * 40 * (i % 2 ? 1 : -1)} s={appear * (1 + 0.3 * glintAll)} glint={glint} tail={vmag > 50 ? Math.min(260, vmag * 0.06) * p.z : 0} dir={dir} />;
  });
  // the speck that lands on his goggles ("tiny")
  const goggleSpeck = t > T.tiny - 0.3 && t < T.glass + 0.1 && n === 'cheeks';
  const gogglePos = {x: g.x + 30, y: g.y - R_B * 0.72};
  const gsU = prog(t, T.tiny - 0.3, T.tiny + 0.05);
  // ----- clouds + speed lines -----
  const clouds = SKY_CLOUDS.map((c, i) => {
    const y = wrap(c.y - fall * c.f * 0.9 - (scroll - 230) * 0.6 * c.f, -300, 2300);
    const x = wrap(c.x + (t > SIDE ? -(t - SIDE) * 420 * c.f * wind : 0), -300, 1380);
    return <PuffCluster key={i} puffs={cloudPuffs(x, y, c.w * c.f, i * 5)} fill="#DCEFFF" shade="#C3E0F7" ink={5} />;
  });
  const speedLines =
    t < BUT + 0.2
      ? Array.from({length: 10}, (_, i) => {
          const x = 120 + ((i * 271) % 860);
          const y = wrap(1900 - fall * 2.4 - i * 230, -300, 2200);
          const o = (1 - prog(t, BUT, BUT + 0.2)) * 0.7;
          return <line key={i} x1={x} y1={y} x2={x} y2={y + 160 + 80 * rnd(i)} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={o} />;
        })
      : null;
  const windLines =
    t > SIDE
      ? Array.from({length: 14}, (_, i) => {
          const y = 180 + ((i * 433) % 1600);
          const x = wrap(-400 + (t - SIDE) * 2600 * (0.8 + 0.4 * rnd(i)) + i * 300, -500, 1500);
          const L = 220 + 260 * rnd(i + 2);
          return <line key={i} x1={x} y1={y} x2={x - L} y2={y + 12} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.75 * wind} />;
        })
      : null;
  // thought bubble on "But": the ocean he expected, crossed out on "no ocean"
  const bubS = popOut(t, BUT + 0.04, 8.15, 0.22);
  const xS = t >= T.no ? easeOutBack(prog(t, T.no, T.no + 0.18), 2) * (1 + 0.6 * (1 - prog(t, T.no, T.no + 0.12))) : 0;
  // label
  const lblS = popOut(t, T.thousand, 17.25, 0.25);
  const sweatS = popOut(t, 9.7, 11.1, 0.2);
  return (
    <AbsoluteFill style={{background: '#56BEFE'}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <Img src={F('sky')} style={{position: 'absolute', left: SKY_X, top: -scroll, width: 1024 * PS2, height: 1536 * PS2}} />
        <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
          {clouds}
          {speedLines}
        </svg>
        {/* the ship (rescue) */}
        {t >= PADDLE ? (
          <>
            <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
              <g>
                <line x1={ladTop.x - 18} y1={ladTop.y} x2={ladBot.x - 18} y2={ladBot.y} stroke="#000" strokeWidth={11} />
                <line x1={ladTop.x + 18} y1={ladTop.y} x2={ladBot.x + 18} y2={ladBot.y} stroke="#000" strokeWidth={11} />
                <line x1={ladTop.x - 18} y1={ladTop.y} x2={ladBot.x - 18} y2={ladBot.y} stroke="#C99A5B" strokeWidth={5} />
                <line x1={ladTop.x + 18} y1={ladTop.y} x2={ladBot.x + 18} y2={ladBot.y} stroke="#C99A5B" strokeWidth={5} />
                {Array.from({length: 7}, (_, i) => {
                  const u = (i + 1) / 7;
                  const cx = lerp(ladTop.x, ladBot.x, u);
                  const cy = lerp(ladTop.y, ladBot.y, u);
                  return <line key={i} x1={cx - 24} y1={cy} x2={cx + 24} y2={cy} stroke="#000" strokeWidth={10} strokeLinecap="round" />;
                })}
              </g>
            </svg>
            <ShipSpr t={t} x={shipX} y={shipY} s={SS} rot={-6 + 4 * Math.sin(t * 6)} flame={0.6} />
          </>
        ) : null}
        {guyNode}
        <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
          {umb}
          {specks}
          {goggleSpeck ? <Shard x={lerp(gogglePos.x + 160, gogglePos.x, easeInCubic(gsU))} y={lerp(gogglePos.y - 300, gogglePos.y, easeInCubic(gsU))} r={16} a={30 + 200 * gsU} s={1} glint={bump(t, T.tiny, 0.3)} /> : null}
          {windLines}
          <SweatDrop x={g.x + R_B * 0.95} y={g.y - R_B * 0.45} r={20} s={sweatS} rot={15} />
          <Gauge t={t} />
        </svg>
        {bubS > 0.001 ? (
          <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
            <g transform={`translate(${g.x + 150} ${g.y - R_B - 190}) scale(${bubS})`}>
              <PuffCluster
                puffs={[
                  {x: -95, y: 0, r: 70},
                  {x: -30, y: -38, r: 82},
                  {x: 55, y: -30, r: 78},
                  {x: 110, y: 18, r: 62},
                  {x: 30, y: 40, r: 75},
                  {x: -60, y: 45, r: 66},
                ]}
                fill="#FFFFFF"
                ink={7}
              />
              <circle cx={-110} cy={120} r={22} fill="#fff" stroke="#000" strokeWidth={6} />
              <circle cx={-140} cy={168} r={13} fill="#fff" stroke="#000" strokeWidth={5} />
              {/* the ocean he expected: waves + a splash */}
              <path d="M -120 20 q 30 -26 60 0 q 30 26 60 0 q 30 -26 60 0 q 30 26 60 0 L 120 70 L -120 70 Z" fill="#2E8BFF" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
              <path d="M -110 30 q 25 -18 50 0" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
              <path d="M 10 30 q 25 -18 50 0" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
              <path d="M -20 -8 q -10 -40 -34 -50 M 0 -12 q 0 -46 4 -62 M 20 -8 q 12 -38 34 -48" fill="none" stroke="#2E8BFF" strokeWidth={9} strokeLinecap="round" />
              {xS > 0.001 ? (
                <g transform={`scale(${xS})`}>
                  <path d="M -95 -80 L 95 80 M 95 -80 L -95 80" stroke="#000" strokeWidth={42} strokeLinecap="round" />
                  <path d="M -95 -80 L 95 80 M 95 -80 L -95 80" stroke="#F1301D" strokeWidth={26} strokeLinecap="round" />
                </g>
              ) : null}
            </g>
          </svg>
        ) : null}
        <Label x={310} y={555} s={lblS} text="5,000+ MPH" size={62} rot={-4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// PORTHOLE close-up (scene C): screen space
// ======================================================================================================
const PC = {x: 540, y: 900};
const R_GLASS = 330;
const R_RIM = 420;
const R_C = 165;
const PorthScene: React.FC<{t: number}> = ({t}) => {
  const sh = shake(t, 12 * bump(t, SLAM, 0.35) + 3 * bump(t, GREEN_T, 0.3));
  // window pane: 1 = shut, 0.78 = cracked open (hinge on the left)
  const open = t < SLAM ? 1 - 0.3 * easeOutBack(prog(t, CRACK, CRACK + 0.2), 2.4) : 1 - 0.3 * (1 - easeInCubic(prog(t, SLAM - 0.06, SLAM)));
  const k = t < SLAM - 0.06 ? open : t < SLAM ? open : 1;
  const paneCx = PC.x - R_GLASS + R_GLASS * k;
  // guy
  const n: SprName = t < YUCK ? 'breath' : 'yuck';
  let sq: [number, number] = [breathe(t), 1 / breathe(t)];
  sq = mulSq(sq, squashSwap(t, YUCK, 1.3));
  const sniffU = bump(t, SNIFF, 0.6);
  sq = mulSq(sq, [1 + 0.03 * sniffU, 1 + 0.05 * sniffU]);
  const green = 0.9 * easeOutCubic(prog(t, GREEN_T, GREEN_T + 0.25));
  const recoil = t > SLAM ? 14 * spring(t - SLAM, 3, 6) : 0;
  const gy = PC.y - 60 - 10 * sniffU + recoil;
  // stink cloud: slides in through the gap, wraps around his head, squeezed out on the slam
  const inU = easeInOutCubic(prog(t, T.it2, T.rotten - 0.05));
  const outU = easeInCubic(prog(t, SLAM - 0.02, SLAM + 0.25));
  const cX = lerp(1150, 790, inU) + 600 * outU;
  const cY = PC.y - 120;
  const cS = (0.5 + 0.5 * inU) * (1 - 0.2 * outU);
  const stink: Puff[] = Array.from({length: 7}, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const r = (70 + 20 * Math.sin(t * 5 + i)) * cS;
    return {x: cX + Math.cos(a) * 85 * cS - (i === 0 ? 120 * inU : 0), y: cY + Math.sin(a) * 55 * cS, r};
  });
  const stinkVis = t >= T.it2 && t < SLAM + 0.3;
  // rain outside (horizontal glass streaks), masked away from the porthole
  const rain = Array.from({length: 26}, (_, i) => {
    const y = 120 + ((i * 271) % 1700);
    const x = wrap(-300 + (t - CUT_PORT) * 2400 * (0.8 + 0.5 * rnd(i)) + i * 211, -300, 1400);
    const z = 0.7 + 0.6 * rnd(i + 3);
    if (Math.hypot(x - PC.x, y - PC.y) < R_RIM + 20) return null;
    return <Shard key={i} x={x} y={y} r={14 * z} a={i * 37} s={1} tail={140 * z} dir={6} />;
  });
  const pings = [19.0, 19.55, 20.25].map((tp, i) => {
    const u = bump(tp > 0 ? t : 0, tp, 0.25);
    if (u <= 0.01) return null;
    const a = 0.6 + i * 1.7;
    return <Star4 key={i} x={PC.x + Math.cos(a) * 250} y={PC.y + Math.sin(a) * 250} r={34 * u} />;
  });
  const lines = t > GREEN_T
    ? [-1, 0, 1].map((i) => {
        const u = ((t - GREEN_T) * 1.3 + i * 0.33) % 1;
        const x = PC.x + i * 90;
        const y = PC.y - 260 - 120 * u;
        return <path key={i} d={`M ${x} ${y} q 18 -25 0 -50 q -18 -25 0 -50`} fill="none" stroke={STINK_SH} strokeWidth={10} strokeLinecap="round" opacity={Math.sin(Math.PI * u)} />;
      })
    : null;
  const eggS = popOut(t, T.rotten, SLAM + 0.25, 0.25);
  const egg =
    eggS > 0.001 ? (
      <g transform={`translate(${cX - 30 * cS - 600 * outU} ${cY + 95}) rotate(${-14 + 6 * Math.sin(t * 9)}) scale(${eggS})`}>
        <ellipse cx={0} cy={0} rx={40} ry={52} fill="#F1EFD2" stroke="#000" strokeWidth={7} />
        <ellipse cx={14} cy={18} rx={16} ry={12} fill="#9CC24A" />
        <path d="M -38 -6 L -20 -18 L -6 -4 L 10 -20 L 24 -6 L 38 -16" fill="none" stroke="#000" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
        {[-18, 0, 18].map((dx) => (
          <path key={dx} d={`M ${dx} -62 q 9 -12 0 -24 q -9 -12 0 -24`} fill="none" stroke={STINK_SH} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        ))}
      </g>
    ) : null;
  const airU = prog(t, CRACK + 0.02, CRACK + 0.55);
  const air =
    airU > 0 && airU < 1 ? (
      <path
        d={`M ${PC.x + R_GLASS + 120} ${PC.y - 140} C ${PC.x + R_GLASS} ${PC.y - 170} ${PC.x + 200} ${PC.y - 40} ${PC.x + 60} ${PC.y - 110}`}
        fill="none"
        stroke="#fff"
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray="900"
        strokeDashoffset={900 * (1 - easeOutCubic(airU))}
        opacity={1 - airU * airU}
      />
    ) : null;
  return (
    <AbsoluteFill style={{background: HULL}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
          <rect x={-200} y={-200} width={1480} height={2320} fill={HULL} />
          <rect x={-200} y={PC.y - 300} width={1480} height={600} fill={STRIPE} stroke="#000" strokeWidth={12} />
          <rect x={-200} y={1600} width={1480} height={600} fill={HULL_SH} />
          <line x1={-200} y1={1600} x2={1280} y2={1600} stroke="#000" strokeWidth={10} />
          {[60, 1020].map((x) => (
            <g key={x}>
              <line x1={x} y1={-200} x2={x} y2={2200} stroke="#000" strokeWidth={8} />
              {Array.from({length: 9}, (_, i) => (
                <circle key={i} cx={x + (x < 540 ? 26 : -26)} cy={120 + i * 220} r={9} fill={HULL_SH} stroke="#000" strokeWidth={4} />
              ))}
            </g>
          ))}
          {rain}
          <defs>
            <clipPath id="porthole-clip">
              <circle cx={PC.x} cy={PC.y} r={R_GLASS} />
            </clipPath>
          </defs>
          {/* interior */}
          <g clipPath="url(#porthole-clip)">
            <rect x={PC.x - R_GLASS} y={PC.y - R_GLASS} width={2 * R_GLASS} height={2 * R_GLASS} fill="#20325E" />
            <ellipse cx={PC.x - 120} cy={PC.y - 160} rx={120} ry={80} fill="#2C4278" />
          </g>
        </svg>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, clipPath: `circle(${R_GLASS}px at ${PC.x}px ${PC.y}px)`}}>
          <Guy n={n} x={PC.x - 20} y={gy} R={R_C} sx={sq[0]} sy={sq[1]} green={green} />
          {stinkVis ? (
            <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
              <PuffCluster puffs={stink} fill={STINK} shade={STINK_SH} ink={6} />
              {egg}
              {lines}
            </svg>
          ) : null}
        </div>
        <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
          {/* the stink cloud's eyes + the part still outside the gap */}
          {stinkVis && cX > PC.x + R_GLASS * (2 * k - 1) - 60 ? (
            <g>
              <PuffCluster puffs={stink.map((p) => ({...p, r: Math.hypot(p.x - PC.x, p.y - PC.y) > R_GLASS - 10 ? p.r : 0}))} fill={STINK} shade={STINK_SH} ink={6} />
            </g>
          ) : null}
          {stinkVis ? (
            <g>
              <Eye x={cX - 40 * cS} y={cY - 10} r={24 * cS} open={1} look={[-1, 0.2]} squeeze={t > SLAM} side={-1} brow={0.5} browTilt={1.2} lid={0.35} lidTilt={18} />
              <Eye x={cX + 30 * cS} y={cY - 10} r={24 * cS} open={1} look={[-1, 0.2]} squeeze={t > SLAM} side={1} brow={0.5} browTilt={1.2} lid={0.35} lidTilt={18} />
              <path d={`M ${cX - 40 * cS} ${cY + 30 * cS} Q ${cX - 5 * cS} ${cY + 55 * cS} ${cX + 30 * cS} ${cY + 28 * cS}`} fill="none" stroke="#000" strokeWidth={7} strokeLinecap="round" />
            </g>
          ) : null}
          {/* glass pane (hinged on the left) */}
          <g>
            <ellipse cx={paneCx} cy={PC.y} rx={R_GLASS * k} ry={R_GLASS} fill={GLASS} opacity={0.22} />
            <path d={`M ${paneCx - R_GLASS * k * 0.55} ${PC.y - R_GLASS * 0.55} Q ${paneCx - R_GLASS * k * 0.2} ${PC.y - R_GLASS * 0.82} ${paneCx + R_GLASS * k * 0.2} ${PC.y - R_GLASS * 0.78}`} fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" opacity={0.75} />
            <path d={`M ${paneCx - R_GLASS * k * 0.7} ${PC.y - R_GLASS * 0.2} Q ${paneCx - R_GLASS * k * 0.72} ${PC.y - R_GLASS * 0.38} ${paneCx - R_GLASS * k * 0.62} ${PC.y - R_GLASS * 0.5}`} fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={0.6} />
            {k < 0.995 ? <ellipse cx={paneCx} cy={PC.y} rx={R_GLASS * k} ry={R_GLASS} fill="none" stroke="#000" strokeWidth={8} /> : null}
          </g>
          {/* rim */}
          <circle cx={PC.x} cy={PC.y} r={(R_RIM + R_GLASS) / 2} fill="none" stroke={RIM} strokeWidth={R_RIM - R_GLASS} />
          <path d={`M ${PC.x - R_RIM * 0.86} ${PC.y - R_RIM * 0.42} A ${R_RIM - 20} ${R_RIM - 20} 0 0 1 ${PC.x + R_RIM * 0.3} ${PC.y - R_RIM * 0.9}`} fill="none" stroke="#B8B8B8" strokeWidth={22} strokeLinecap="round" />
          <circle cx={PC.x} cy={PC.y} r={R_RIM} fill="none" stroke="#000" strokeWidth={12} />
          <circle cx={PC.x} cy={PC.y} r={R_GLASS} fill="none" stroke="#000" strokeWidth={12} />
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + 0.3;
            return <circle key={i} cx={PC.x + Math.cos(a) * (R_RIM + R_GLASS) / 2} cy={PC.y + Math.sin(a) * (R_RIM + R_GLASS) / 2} r={14} fill="#5E5E5E" stroke="#000" strokeWidth={5} />;
          })}
          {/* hinge on the left */}
          <rect x={PC.x - R_GLASS - 30} y={PC.y - 60} width={46} height={120} rx={10} fill="#6B6B6B" stroke="#000" strokeWidth={6} />
          {pings}
          {air}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const RAIN_LOOP = 2.61;
export const CUES: Cue[] = [
  {f: 'pop', at: T.blue - 0.06, db: -24},
  {f: 'boing', at: TAKE - 0.04, db: -20},
  {f: 'whoosh', at: TAKE, db: -22},
  {f: 'whoosh', at: 3.5, db: -26, rate: 0.85},
  {f: 'gust', at: 3.6, db: -20},
  {f: 'howl', at: 4.05, db: -36, keys: [[4.05, -44], [4.4, -34], [6.45, -34], [6.62, -70]]},
  {f: 'gulp', at: BUT - 0.02, db: -16},
  {f: 'stamp', at: T.no - 0.01, db: -14},
  {f: 'twinkle', at: T.just + 0.05, db: -24},
  {f: 'twinkle', at: 8.85, db: -27, rate: 1.2},
  {f: 'glass_ping', at: T.tiny + 0.04, db: -20},
  {f: 'twinkle', at: T.glass - 0.02, db: -21},
  {f: 'pop', at: UMB_OPEN - 0.02, db: -16},
  {f: 'glass_rain', at: RAIN0 + 0.3, db: -26, keys: [[RAIN0 + 0.3, -40], [RAIN0 + 0.9, -27], [RAIN0 + 0.3 + RAIN_LOOP, -27]]},
  {f: 'glass_rain', at: RAIN0 + 0.3 + RAIN_LOOP, db: -24},
  {f: 'glass_rain', at: RAIN0 + 0.3 + 2 * RAIN_LOOP, db: -24},
  {f: 'glass_rain', at: RAIN0 + 0.3 + 3 * RAIN_LOOP, db: -26, keys: [[RAIN0 + 0.3 + 3 * RAIN_LOOP, -26], [CUT_PORT + 0.4, -34], [21.2, -40]], dur: 21.2 - (RAIN0 + 0.3 + 3 * RAIN_LOOP)},
  {f: 'glass_ping', at: 12.02, db: -22},
  {f: 'glass_ping', at: 12.62, db: -24, rate: 1.12},
  {f: 'umbrella_flip', at: UMB_FLIP - 0.08, db: -12},
  {f: 'howl', at: SIDE + 0.05, db: -23},
  {f: 'howl', at: SIDE + 2.7, db: -25, keys: [[SIDE + 2.7, -25], [CUT_PORT, -25], [CUT_PORT + 0.2, -36]]},
  {f: 'boing', at: T.thousand - 0.05, db: -24, rate: 0.9},
  {f: 'swoop', at: PADDLE + 0.02, db: -18},
  {f: 'stamp', at: GRAB + 0.02, db: -26},
  {f: 'glass_ping', at: 19.0, db: -28},
  {f: 'can', at: CRACK - 0.02, db: -16},
  {f: 'sniff', at: SNIFF - 0.05, db: -12},
  {f: 'glass_ping', at: 19.55, db: -30, rate: 1.2},
  {f: 'stink', at: T.it2 + 0.05, db: -16},
  {f: 'glass_ping', at: 20.25, db: -30},
  {f: 'stink', at: GREEN_T, db: -14, rate: 0.85},
  {f: 'stamp', at: SLAM - 0.02, db: -12},
  {f: 'clink', at: SLAM, db: -22},
  {f: 'zoomaway', at: CUT_END + 0.05, db: -16},
  {f: 'twinkle', at: WINK + 0.02, db: -24},
];

// ======================================================================================================
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  let scene: React.ReactNode;
  if (t < CUT_SKY) scene = <SpaceScene t={t} />;
  else if (t < CUT_PORT) scene = <SkyScene t={t} />;
  else if (t < CUT_END) scene = <PorthScene t={t} />;
  else scene = <SpaceScene t={t} />;
  return (
    <AbsoluteFill>
      {scene}
      <CloudWipe t={t} />
    </AbsoluteFill>
  );
};

export const CoverScene: React.FC<{cam?: Cam}> = ({cam}) => (
  <AbsoluteFill>
    <SpaceScene t={1.75} cover camOverride={cam} />
    <svg width={1080} height={1920} style={{position: 'absolute', overflow: 'visible'}}>
      {[
        [130, 560, 26, 20], [905, 600, 30, 70], [210, 820, 22, 140], [960, 880, 24, 200], [120, 1060, 28, 250],
        [880, 1110, 22, 300], [330, 700, 18, 40], [790, 760, 20, 110], [60, 760, 16, 190], [1010, 420, 18, 10],
      ].map(([x, y, r, a], i) => (
        <Shard key={i} x={x} y={y} r={r} a={a} s={1} glint={i % 3 === 0 ? 0.9 : 0} tail={70} dir={60} />
      ))}
    </svg>
  </AbsoluteFill>
);

export const GlassRainPlanetShort: React.FC = () => {
  useGRPFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('glass-rain-planet/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('glass-rain-planet/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="glass-rain-planet/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
