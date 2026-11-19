import React, {useRef, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {SP} from './sprites';
import {C_DEEP, C_POSE, C_PRESS, C_UP, C_WEEKS, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as NAB_DURATION, FPS as NAB_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why did the US call this H-bomb 'not a bomb'?" (Palomares, Spain, 1966 - WHOI, Atomic Heritage Foundation, National Security Archive).
// A fisherman in a little boat points at a parachute far up in the sky (thought bubble: a man on a parachute). EXCEPT - the camera
// whips up: under the canopy hangs a fat bomb with eyes, sweating. It plunges into the sea next to the boat (splash, the fisherman
// screams). SO grey Navy ships rush in over the horizon and a big bow slides in with the saluting officer. BUT (cut, camera flash):
// a beach press scrum - reporters with a microphone and flash cameras, the nervous officer holds up a sign: THE THING / THAT IS NOT /
// A BOMB. FOR WEEKS (cut): on the ship's deck, the calendar flips JAN-FEB-MAR, the officer with binoculars, the hook brings up an
// old boot. UNTIL (cut): deep down a tiny white sub with an orange tower switches on its lamp, a depth counter runs to 2,550 FT; the
// lamp finds the bomb on a steep slope under its white parachute - it opens one squinting eye. EIGHTY DAYS (cut): DAY 1 -> 80, bubbles,
// and the bomb comes up on the cable with a yellow robot tangled in its parachute. AND (cut): the deck photo op - the bomb on a cradle,
// the proud officer presents it, flashbulbs, the old sign falls over, the bomb grins and winks for the cameras.
// Pictures: 8 ElevenLabs GPT Image 2.5 pictures, all 1K LOW (hero + 3 three-pose sheets + objects sheet + 3 plates); everything else is code.

const F = (n: string, ext = 'png') => staticFile(`not-a-bomb/${n}.${ext}`);
export const FONT = 'NABInter';
export const useNABFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const OW = 5;
const RED = '#E8382E';
const YEL = '#FFE45C';
const SKY_TOP = '#71C8FE';
const SKY_LOW = '#C1E9FE';
const SEA_TOP = '#3DB1EA';
const SEA = '#188EDE';
const SHIP = '#8E979E';
const SHIP_SH = '#6E777E';
const SHIP_HI = '#A9B1B7';
const SAND = '#F2DBA8';
const SAND_SH = '#E2C383';
const CANOPY = '#FFFFFF';
const CANOPY_SH = '#DDE2E8';
const WOOD = '#A8693A';
const WOOD_SH = '#7E4C27';
const ROBOT = '#FFC72C';
const ROBOT_SH = '#E0A21A';

// ---------- helpers ----------
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));
const tremble = (t: number, a: number) => a * (Math.sin(2 * Math.PI * 17 * t) * 0.6 + Math.sin(2 * Math.PI * 23 * t + 1) * 0.4);

// SVG <image> that holds the frame until the picture is loaded; keyed by href so a pose swap waits again.
const SImg: React.FC<{href: string; x: number; y: number; width: number; height: number; preserveAspectRatio?: string}> = ({href, ...rest}) => {
  const [handle] = useState(() => delayRender(`svg image ${href}`, {timeoutInMilliseconds: 60000}));
  const done = useRef(false);
  const fin = () => {
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  };
  return <image href={href} {...rest} onLoad={fin} onError={fin} />;
};

type Info = {w: number; h: number; feet: [number, number]; hw?: [number, number, number]; hd?: [number, number, number]; left: number; right: number; top: number; bottom: number};
const S = (n: string) => (SP as unknown as Record<string, Info>)[n];
// one head radius per pose sheet (white face disc measured in prep; hidden faces take the sheet value) -> swaps never change size
const HEAD_R: Record<string, number> = {salute: 161.4, binoc: 105, sign: 105, proud: 105, f_up: 100, f_shock: 100, f_down: 100, p_cam: 104, p_mic: 104, p_note: 104};
const sc = (n: string, r: number) => r / HEAD_R[n];

// a character sprite inside a world SVG, anchored at the feet; r = head radius in world px
const G: React.FC<{n: string; x: number; y: number; r: number; mir?: boolean; sx?: number; sy?: number; rot?: number}> = ({n, x, y, r, mir = false, sx = 1, sy = 1, rot = 0}) => {
  const sp = S(n);
  const s = sc(n, r);
  const [ax, ay] = sp.feet;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${(mir ? -1 : 1) * sx} ${sy})`}>
      <SImg key={n} href={F(n)} x={-ax * s} y={-ay * s} width={sp.w * s} height={sp.h * s} />
    </g>
  );
};
// world point of a sprite pixel for a sprite placed with G (no rotation)
const spt = (n: string, x: number, y: number, r: number, px: number, py: number, mir = false, sx = 1, sy = 1): [number, number] => {
  const sp = S(n);
  const s = sc(n, r);
  return [x + (mir ? -1 : 1) * sx * (px - sp.feet[0]) * s, y + sy * (py - sp.feet[1]) * s];
};
const headOf = (n: string, x: number, y: number, r: number, mir = false): [number, number] => {
  const sp = S(n);
  const h = sp.hw && n !== 'binoc' && n !== 'p_cam' ? sp.hw : sp.hd!;
  return spt(n, x, y, r, h[0], h[1], mir);
};

const FullSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -9000, top: -9000, overflow: 'visible'}} width={18000} height={27000} viewBox="-9000 -9000 18000 27000">
    {children}
  </svg>
);
const Screen: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {children}
    </svg>
  </AbsoluteFill>
);
// ---------- the bomb sprite (code faces drawn upright on top) ----------
const BOMB_C: [number, number] = [369, 168]; // body axis centre in sprite px
const BOMB_LEN = 714; // nose -> tail in sprite px
const BOMB_R = 113; // body radius in sprite px
const Bomb: React.FC<{x: number; y: number; L: number; rot: number; dark?: number}> = ({x, y, L, rot, dark = 0}) => {
  const sp = S('bomb');
  const s = L / BOMB_LEN;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} style={dark > 0.01 ? {filter: `brightness(${1 - 0.68 * dark})`} : undefined}>
      <SImg href={F('bomb')} x={-BOMB_C[0]} y={-BOMB_C[1]} width={sp.w} height={sp.h} />
    </g>
  );
};
// a point given in the bomb's own frame (along = 0 at the centre, +1 at the tail; across = +1 at the bottom side) -> world
const bombPt = (x: number, y: number, L: number, rot: number, along: number, across: number): [number, number] => {
  const a = (rot * Math.PI) / 180;
  const lx = (along * L) / 2;
  const ly = across * (BOMB_R * L) / BOMB_LEN;
  return [x + lx * Math.cos(a) - ly * Math.sin(a), y + lx * Math.sin(a) + ly * Math.cos(a)];
};
type Mood = 'none' | 'open' | 'worried' | 'squeeze' | 'squint' | 'grin' | 'wink';
const BombFace: React.FC<{e1: [number, number]; e2: [number, number]; r: number; mood: Mood; open: number; look?: [number, number]; mouth?: [number, number]; t: number}> = ({e1, e2, r, mood, open, look = [0, 0], mouth, t}) => {
  if (mood === 'none' || open <= 0.001) return null;
  const blink = mood === 'open' || mood === 'grin' ? (Math.abs(((t + 0.3) % 2.6) - 0.08) < 0.06 ? 0.85 : 0) : 0;
  const squeeze = mood === 'squeeze';
  const lid = mood === 'squint' ? 0.48 : mood === 'worried' ? 0.08 : blink;
  return (
    <g>
      <Eye x={e1[0]} y={e1[1]} r={r} open={open} squeeze={squeeze} side={-1} look={look} lid={lid} brow={mood === 'worried' ? 0.5 : mood === 'squint' ? 0.35 : 0.55} browTilt={mood === 'worried' ? -0.9 : 0} />
      {mood === 'wink' ? (
        <path d={`M ${e2[0] - r * 0.8} ${e2[1] + r * 0.1} Q ${e2[0]} ${e2[1] - r * 0.7} ${e2[0] + r * 0.8} ${e2[1] + r * 0.1}`} fill="none" stroke={INK} strokeWidth={r * 0.26} strokeLinecap="round" />
      ) : (
        <Eye x={e2[0]} y={e2[1]} r={r} open={open} squeeze={squeeze} side={1} look={look} lid={mood === 'squint' ? 0.05 : lid} brow={mood === 'worried' ? 0.5 : 0.55} browTilt={mood === 'worried' ? -0.9 : 0} />
      )}
      {mouth && (mood === 'grin' || mood === 'wink') ? (
        <g transform={`translate(${mouth[0]} ${mouth[1]}) scale(${open})`}>
          <path d={`M ${-r * 1.3} ${-r * 0.2} Q 0 ${r * 1.4} ${r * 1.3} ${-r * 0.2} Z`} fill="#3A1414" stroke={INK} strokeWidth={r * 0.2} strokeLinejoin="round" />
          <path d={`M ${-r * 0.55} ${r * 0.42} Q 0 ${r * 0.85} ${r * 0.55} ${r * 0.42} Q 0 ${r * 0.3} ${-r * 0.55} ${r * 0.42} Z`} fill="#FC8D90" />
          <path d={`M ${-r * 1.1} ${-r * 0.1} L ${r * 1.1} ${-r * 0.1} L ${r * 0.9} ${r * 0.18} L ${-r * 0.9} ${r * 0.18} Z`} fill="#fff" />
        </g>
      ) : null}
      {mouth && (mood === 'worried' || mood === 'open') ? (
        <path
          d={`M ${mouth[0] - r * 0.7} ${mouth[1]} Q ${mouth[0] - r * 0.35} ${mouth[1] - r * 0.35} ${mouth[0]} ${mouth[1]} Q ${mouth[0] + r * 0.35} ${mouth[1] + r * 0.35} ${mouth[0] + r * 0.7} ${mouth[1]}`}
          fill="none"
          stroke={INK}
          strokeWidth={r * 0.2}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};

// ---------- the parachute (code) ----------
// canopy: rim centre (cx, cy), width w, height h; lines to the attach point; flutter = 0..1 (scallops wobble)
const Canopy: React.FC<{cx: number; cy: number; w: number; h: number; ax: number; ay: number; t: number; flutter?: number; rot?: number}> = ({cx, cy, w, h, ax, ay, t, flutter = 0.3, rot = 0}) => {
  const n = 6;
  const rim: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const x = cx - w / 2 + f * w;
    const y = cy + Math.sin(f * Math.PI) * h * 0.06 + flutter * 0.04 * h * Math.sin(2 * Math.PI * 3.1 * t + i * 1.7);
    rim.push([x, y]);
  }
  let d = `M ${rim[0][0]} ${rim[0][1]} C ${cx - w * 0.52} ${cy - h * 0.9} ${cx - w * 0.3} ${cy - h * 1.08} ${cx} ${cy - h} C ${cx + w * 0.3} ${cy - h * 1.08} ${cx + w * 0.52} ${cy - h * 0.9} ${rim[n][0]} ${rim[n][1]}`;
  for (let i = n; i > 0; i--) {
    const [x0, y0] = rim[i];
    const [x1, y1] = rim[i - 1];
    d += ` Q ${(x0 + x1) / 2} ${(y0 + y1) / 2 + h * 0.13} ${x1} ${y1}`;
  }
  d += ' Z';
  const sw = Math.max(2.5, w * 0.018);
  return (
    <g transform={`rotate(${rot} ${ax} ${ay})`}>
      {rim.map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={ax} y2={ay} stroke="#2A2A2A" strokeWidth={sw * 0.45} />
      ))}
      <path d={d} fill={CANOPY} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {/* gores */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <path
          key={i}
          d={`M ${cx - w / 2 + f * w} ${cy + h * 0.02} Q ${cx - w / 2 + f * w + (f - 0.5) * w * 0.15} ${cy - h * 0.6} ${cx + (f - 0.5) * w * 0.2} ${cy - h * 0.98}`}
          fill="none"
          stroke={CANOPY_SH}
          strokeWidth={sw * 1.4}
        />
      ))}
      <path d={`M ${cx - w * 0.36} ${cy - h * 0.55} Q ${cx - w * 0.3} ${cy - h * 0.85} ${cx - w * 0.12} ${cy - h * 0.95}`} fill="none" stroke="#fff" strokeWidth={sw * 1.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
};

// splash: a cartoon water crown + drops on arcs
const Splash: React.FC<{t: number; t0: number; x: number; y: number; size: number; seed?: number; dur?: number}> = ({t, t0, x, y, size, seed = 3, dur = 0.8}) => {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return null;
  const H = size * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - 0.25 * u);
  const W = size * (0.55 + 0.45 * easeOutCubic(u));
  const spikes = [-1, -0.55, 0, 0.55, 1];
  let d = `M ${x - W} ${y + 6}`;
  spikes.forEach((f, i) => {
    const sx = x + f * W * 0.86 + f * H * 0.18;
    const sy = y - H * (i === 2 ? 1 : i % 2 ? 0.82 : 0.62) * (0.85 + 0.3 * rnd(seed + i));
    const vx = x + (f - 0.27) * W * 0.86;
    d += ` Q ${vx} ${y - H * 0.25} ${sx} ${sy}`;
    d += ` Q ${sx + W * 0.12} ${y - H * 0.25} ${x + (f + 0.27) * W * 0.86} ${y - H * 0.12}`;
  });
  d += ` L ${x + W} ${y + 6} Z`;
  return (
    <g>
      <path d={d} fill="#EAF8FF" stroke={INK} strokeWidth={size * 0.018 + 2} strokeLinejoin="round" />
      <path d={`M ${x - W * 0.7} ${y + 2} Q ${x} ${y - H * 0.35} ${x + W * 0.7} ${y + 2} Z`} fill="#BFE6FA" />
      {Array.from({length: 9}, (_, i) => {
        const f = (i / 8) * 2 - 1;
        const px = x + f * W * 1.1 + f * size * 0.5 * u;
        const py = y - H * 1.15 - size * 0.3 * Math.sin(Math.PI * u) * (0.6 + 0.6 * rnd(seed + 50 + i)) + size * 0.9 * u * u;
        if (py > y) return null;
        const r = size * 0.045 * (0.7 + 0.6 * rnd(seed + 80 + i));
        return <path key={i} d={`M ${px} ${py - r * 1.9} Q ${px + r * 1.1} ${py - r * 0.2} ${px} ${py + r} Q ${px - r * 1.1} ${py - r * 0.2} ${px} ${py - r * 1.9} Z`} fill="#EAF8FF" stroke={INK} strokeWidth={size * 0.012 + 1.5} />;
      })}
    </g>
  );
};
const Drop: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <path d={`M ${x} ${y - r * 1.9} Q ${x + r * 1.1} ${y - r * 0.2} ${x} ${y + r} Q ${x - r * 1.1} ${y - r * 0.2} ${x} ${y - r * 1.9} Z`} fill="#BFE6FA" stroke={INK} strokeWidth={r * 0.32} />
);
const Bubbles: React.FC<{t: number; t0: number; t1: number; x: number; y: number; n?: number; spread?: number; seed?: number; rise?: number; rr?: number}> = ({
  t,
  t0,
  t1,
  x,
  y,
  n = 10,
  spread = 60,
  seed = 1,
  rise = 520,
  rr = 1,
}) => {
  if (t < t0 || t > t1 + 1.6) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const tb = t0 + ((t1 - t0) * i) / n;
        const u = (t - tb) / 1.5;
        if (u < 0 || u > 1) return null;
        const r = (7 + 9 * rnd(seed + i)) * rr;
        return (
          <circle
            key={i}
            cx={x + (rnd(seed + 7 + i) - 0.5) * spread + 14 * rr * Math.sin(8 * u + i)}
            cy={y - rise * u}
            r={r * (1 - 0.3 * u)}
            fill="#DFF4FF"
            fillOpacity={0.35}
            stroke="#fff"
            strokeWidth={3.5 * rr}
          />
        );
      })}
    </g>
  );
};

// ---------- ships (code, side view facing LEFT; waterline y = 0 at the bow x = 0) ----------
const Warship: React.FC<{x: number; y: number; s: number; t: number; speed?: number; ph?: number}> = ({x, y, s, t, speed = 0, ph = 0}) => {
  const bob = 3 * Math.sin(2 * Math.PI * 0.5 * t + ph);
  const ow = OW / s;
  return (
    <g transform={`translate(${x} ${y + bob * s}) scale(${s})`}>
      {/* wake + bow wave */}
      {speed > 0.05 ? (
        <g opacity={clamp(speed)}>
          <path d={`M 40 -6 Q -40 -30 -120 4 Q -40 -4 40 8 Z`} fill="#fff" stroke={INK} strokeWidth={ow * 0.7} strokeLinejoin="round" />
          <path d={`M 880 -4 Q 1100 -14 1400 6 L 880 10 Z`} fill="#fff" opacity={0.85} />
        </g>
      ) : null}
      {/* mast + yard */}
      <line x1={450} y1={-230} x2={450} y2={-420} stroke={INK} strokeWidth={ow * 2.2} strokeLinecap="round" />
      <line x1={400} y1={-370} x2={500} y2={-370} stroke={INK} strokeWidth={ow * 1.6} strokeLinecap="round" />
      {/* funnel */}
      <path d={`M 590 -110 L 600 -250 L 680 -250 L 690 -110 Z`} fill={SHIP_HI} stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
      <path d={`M 598 -232 L 600 -250 L 680 -250 L 682 -232 Z`} fill="#2B2B2B" />
      {/* superstructure */}
      <path d={`M 320 -110 L 320 -205 L 360 -240 L 560 -240 L 560 -110 Z`} fill={SHIP_HI} stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
      {[350, 395, 440, 485].map((wx) => (
        <rect key={wx} x={wx} y={-218} width={28} height={22} rx={5} fill="#2B3A4A" />
      ))}
      {/* gun turret + barrel */}
      <path d={`M 160 -112 L 165 -160 L 250 -160 L 258 -112 Z`} fill={SHIP_HI} stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
      <rect x={70} y={-150} width={100} height={16} rx={6} fill={SHIP_SH} stroke={INK} strokeWidth={ow * 0.8} />
      {/* hull */}
      <path d={`M -10 -128 Q 400 -96 905 -110 L 885 0 L 70 0 Z`} fill={SHIP} stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
      <path d={`M 52 -26 L 890 -26 L 885 0 L 70 0 Z`} fill="#3A3F44" />
      <path d={`M 120 -60 L 860 -66`} stroke={SHIP_SH} strokeWidth={ow * 1.2} />
      <path d={`M -10 -128 Q 400 -96 905 -110 L 885 0 L 70 0 Z`} fill="none" stroke={INK} strokeWidth={ow} strokeLinejoin="round" />
    </g>
  );
};
// deck height of a Warship placed at (x, y, s): world y of the deck at world x
const shipDeckY = (x0: number, y0: number, s: number, wx: number) => {
  const lx = (wx - x0) / s;
  const u = clamp((lx + 10) / 915);
  return y0 + s * (-128 + (2 * u * (1 - u) * 32 + u * u * 18));
};

// ======================================================================================================
// SEA WORLD (scene 1 and the surface in scene 5): horizon at y = 0, sea plate 2.0x
// ======================================================================================================
const SPS = 2.0;
const SEA_X0 = -1024;
const SEA_Y0 = -778 * SPS;
const SeaBack: React.FC<{t: number}> = ({t}) => (
  <FullSvg>
    <defs>
      <linearGradient id="nab-sky" gradientUnits="userSpaceOnUse" x1={0} y1={SEA_Y0} x2={0} y2={0}>
        <stop offset="0" stopColor={SKY_TOP} />
        <stop offset="1" stopColor={SKY_LOW} />
      </linearGradient>
      <linearGradient id="nab-sea" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={1600}>
        <stop offset="0" stopColor={SEA_TOP} />
        <stop offset="1" stopColor={SEA} />
      </linearGradient>
    </defs>
    <rect x={-9000} y={-9000} width={18000} height={9000 + SEA_Y0 + 4} fill={SKY_TOP} />
    <rect x={-9000} y={SEA_Y0} width={18000} height={-SEA_Y0 + 2} fill="url(#nab-sky)" />
    <rect x={-9000} y={0} width={18000} height={1600} fill="url(#nab-sea)" />
    <rect x={-9000} y={1598} width={18000} height={9000} fill={SEA} />
    <SImg key="sea" href={F('sea')} x={SEA_X0} y={SEA_Y0} width={1024 * SPS} height={1536 * SPS} preserveAspectRatio="none" />
    {/* code clouds drifting */}
    {[
      [700, -1150, 1.0],
      [-760, -1380, 0.8],
    ].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x + 18 * Math.sin(0.25 * t + i)} ${y}) scale(${s})`}>
        <PuffCluster
          puffs={[
            {x: -70, y: 10, r: 46},
            {x: 0, y: -12, r: 62},
            {x: 74, y: 8, r: 48},
            {x: 0, y: 22, r: 44},
          ]}
          fill="#fff"
          ink={5}
        />
      </g>
    ))}
  </FullSvg>
);
// a strip of water in front of everything below the waterline y = wl (sinks boats / bombs into the sea)
const WaterLine: React.FC<{t: number; wl: number; x0: number; x1: number; depth?: number; alpha?: number}> = ({t, wl, x0, x1, depth = 900, alpha = 0.62}) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 30) pts.push(`${x},${wl + 6 * Math.sin(x / 60 + 2.4 * t) + 3 * Math.sin(x / 27 - 1.6 * t)}`);
  return (
    <g>
      <polygon points={`${x0},${wl + depth} ${pts.join(' ')} ${x1},${wl + depth}`} fill={SEA_TOP} opacity={alpha} />
      <polyline points={pts.join(' ')} fill="none" stroke="#EAF8FF" strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

// ---------- scene 1: the sea (0 - 9.06) ----------
const BOAT = {x: -80, wl: 520, sx: 1.45, sy: 1.75};
const BOAT_WL_PX = 215; // sprite row of the waterline (white / red boundary)
const FISH = {dx: 165, dy: 40, r: 78};
const SPLASH_X = 470;
// the falling bomb: centre, length (grows as it comes closer), rotation (nose down = -90), canopy size
type Chute = {x: number; y: number; L: number; rot: number; cw: number; ch: number; flutter: number; dark: number};
const chuteAt = (t: number): Chute => {
  const sway = (a: number) => a * Math.sin(2 * Math.PI * 0.32 * t);
  if (t < T.its2) {
    const y = -640 + 30 * t;
    return {x: 330 + 14 * Math.sin(0.6 * t), y, L: 95, rot: -90 + sway(5), cw: 190, ch: 108, flutter: 0.3, dark: 1 - easeInOutCubic(prog(t, 3.3, 3.9))};
  }
  const y0 = -640 + 30 * T.its2;
  const u = prog(t, T.its2, T.bomb);
  const L = lerp(95, 380, easeInOutCubic(u));
  const yHit = BOAT.wl - L / 2;
  let y = lerp(y0, yHit, u * u);
  if (t > T.bomb) y = yHit + 1500 * (t - T.bomb) ** 1.3;
  return {x: lerp(330 + 14 * Math.sin(0.6 * t), SPLASH_X, u), y, L, rot: -90 + sway(5) * (1 - u), cw: lerp(190, 1.45 * 380, easeInOutCubic(u)) * (1 - easeInOutCubic(prog(t, T.its2, T.its2 + 0.35)) * (0.28 - 0.1 * Math.sin(2 * Math.PI * 4.2 * t))), ch: lerp(108, 300, easeInOutCubic(u)), flutter: lerp(0.3, 1, prog(t, T.its2, T.its2 + 0.35)), dark: 0};
};
// the canopy after the bomb went under: lies on the water, deflates, sinks
const ChuteOnWater: React.FC<{t: number}> = ({t}) => {
  if (t < T.bomb + 0.02 || t > C_PRESS) return null;
  const u = prog(t, T.bomb, T.bomb + 0.35);
  const sink = easeInCubic(prog(t, 7.6, 8.9));
  const w = 520 * (1 - 0.2 * u);
  const h = 260 * (1 - 0.86 * easeOutCubic(u));
  const cx = SPLASH_X + 60 * u;
  const cy = BOAT.wl + 10 + 140 * sink;
  return <Canopy cx={cx} cy={cy} w={w} h={h * (1 - sink)} ax={cx - 40} ay={cy + 60} t={t} flutter={0.6} />;
};
const SEA_KEYS: CamKey[] = [
  {t: 0, x: 20, y: -70, k: 1.0},
  {t: 3.1, x: 40, y: -110, k: 1.07},
];
const seaCam = (t: number): Cam => {
  if (t < T.except) return camAt(t, SEA_KEYS);
  const c0 = camAt(T.except, SEA_KEYS);
  const ch = chuteAt(t);
  if (t < 3.78) {
    const u = easeOutCubic(prog(t, T.except, 3.78));
    const tgt = chuteAt(3.78);
    return {x: lerp(c0.x, tgt.x, u), y: lerp(c0.y, tgt.y - 40, u), k: Math.exp(lerp(Math.log(c0.k), Math.log(3.3), u))};
  }
  if (t < T.its2) return {x: ch.x, y: ch.y - 40, k: 3.3};
  if (t < 6.45) {
    const raw = prog(t, T.its2, 6.45);
    const u = easeInOutCubic(raw);
    return {x: lerp(ch.x, 180, u), y: lerp(ch.y - 40, 170, easeInCubic(raw)), k: Math.exp(lerp(Math.log(3.3), Math.log(1.05), u))};
  }
  const c1 = {x: 180, y: 170, k: 1.05};
  const c2 = {x: 200, y: -40, k: 0.8};
  if (t < 7.0) return c1;
  const u = easeInOutCubic(prog(t, 7.0, 7.85));
  return {x: lerp(c1.x, c2.x, u), y: lerp(c1.y, c2.y, u), k: Math.exp(lerp(Math.log(c1.k), Math.log(c2.k), u))};
};
// small ships racing in on the horizon + the big bow with the officer
const SHIPS = [
  {x0: 1500, x1: -260, s: 0.2, t0: 7.42, dur: 1.15, ph: 0},
  {x0: 1750, x1: 120, s: 0.25, t0: 7.55, dur: 1.15, ph: 1},
  {x0: 2000, x1: 470, s: 0.22, t0: 7.7, dur: 1.1, ph: 2},
];
const BIG = {x0: 1700, x1: 430, y: 640, s: 1.3, t0: 7.95, dur: 0.7};
const bigX = (t: number) => lerp(BIG.x0, BIG.x1, easeOutCubic(prog(t, BIG.t0, BIG.t0 + BIG.dur)));

const ThoughtBubble: React.FC<{t: number; hx: number; hy: number}> = ({t, hx, hy}) => {
  const s = t < T.except ? pop(t, T.man - 0.12, 0.3) : 1 + 0.25 * easeOutCubic(prog(t, T.except, T.except + 0.08));
  if (s <= 0.001 || t > T.except + 0.09) return null;
  const bx = hx - 230;
  const by = hy - 300;
  const bob = 6 * Math.sin(2 * Math.PI * 0.8 * t);
  return (
    <g transform={`translate(${bx} ${by + bob}) scale(${s})`}>
      <circle cx={170} cy={210} r={14} fill="#fff" stroke={INK} strokeWidth={OW} />
      <circle cx={130} cy={170} r={22} fill="#fff" stroke={INK} strokeWidth={OW} />
      <PuffCluster
        puffs={[
          {x: -80, y: 0, r: 70},
          {x: 0, y: -40, r: 88},
          {x: 85, y: -5, r: 72},
          {x: 0, y: 40, r: 74},
          {x: -40, y: 40, r: 60},
          {x: 50, y: 45, r: 60},
        ]}
        fill="#fff"
        ink={OW}
      />
      {/* a tiny man on a parachute */}
      <g transform={`translate(0 ${-10 + 8 * Math.sin(2 * Math.PI * 0.6 * t)}) rotate(${6 * Math.sin(2 * Math.PI * 0.45 * t)})`}>
        <Canopy cx={0} cy={-38} w={120} h={62} ax={0} ay={20} t={t} flutter={0.4} />
        <line x1={-9} y1={52} x2={-14} y2={78} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={9} y1={52} x2={14} y2={78} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={-12} y1={34} x2={-26} y2={14} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={12} y1={34} x2={26} y2={14} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={0} cy={42} rx={13} ry={17} fill="#fff" stroke={INK} strokeWidth={4.5} />
        <circle cx={0} cy={14} r={15} fill="#fff" stroke={INK} strokeWidth={4.5} />
        <ellipse cx={-5} cy={13} rx={2.3} ry={3.6} fill={INK} />
        <ellipse cx={5} cy={13} rx={2.3} ry={3.6} fill={INK} />
      </g>
    </g>
  );
};

const FlagTag: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={0} x2={0} y2={-120} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-120} stroke="#C9A06A" strokeWidth={4} strokeLinecap="round" />
      <g transform="translate(4 -118)">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={0} y={i * 10} width={110} height={10} fill={i % 2 ? '#fff' : RED} />
        ))}
        <rect x={0} y={0} width={46} height={40} fill="#2B4AA0" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={9 + c * 14} cy={8 + r * 12} r={3} fill="#fff" />))}
        <rect x={0} y={0} width={110} height={70} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
    </g>
  );

const SeaScene: React.FC<{t: number}> = ({t}) => {
  const c = seaCam(t);
  const hit = (t0: number, a: number, d = 7) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(T.bomb, 22) + hit(BIG.t0 + BIG.dur - 0.05, 6));
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const ch = chuteAt(t);
  const tail = bombPt(ch.x, ch.y, ch.L, ch.rot, 1, 0);
  const lineLen = 1.25 * ch.L;
  const canopyY = tail[1] - lineLen;
  // the boat rocks; a jolt after the splash
  const rock = 1.6 * Math.sin(2 * Math.PI * 0.42 * t) + hit(T.bomb + 0.05, 7, 3) * Math.sin(2 * Math.PI * 1.6 * (t - T.bomb));
  const heave = 6 * Math.sin(2 * Math.PI * 0.42 * t + 1) + hit(T.bomb + 0.05, 28, 3) * Math.sin(2 * Math.PI * 1.6 * (t - T.bomb) + 1.2);
  const boatSp = S('boat');
  // fisherman pose
  const pose = t < T.bomb + 0.04 ? 'f_up' : t < 8.3 ? 'f_shock' : 'f_down';
  const sw = pose === 'f_shock' ? squashSwap(t, T.bomb + 0.04) : pose === 'f_down' ? squashSwap(t, 8.3) : [1, 1];
  const fx = BOAT.x + FISH.dx;
  const fy = BOAT.wl + FISH.dy;
  const br = breathe(t);
  const [hx, hy] = headOf('f_up', fx, fy, FISH.r);
  // bomb face
  const eyesOpen = t >= T.not ? pop(t, T.not, 0.25) : 0;
  const mood: Mood = t < T.not ? 'none' : t < T.bomb - 0.12 ? 'worried' : 'squeeze';
  const e1 = bombPt(ch.x, ch.y, ch.L, ch.rot, -0.42, -0.42);
  const e2 = bombPt(ch.x, ch.y, ch.L, ch.rot, -0.42, 0.42);
  const look: [number, number] = t < T.man2 ? [0, 0.85] : t < T.its2 ? [0, 0] : [0, 0.9];
  const er = ch.L * 0.1;
  const sweat = popOut(t, 4.5, 6.2, 0.2);
  const flag = t >= T.american ? pop(t, T.american, 0.3) : 0;
  const flagP = bombPt(ch.x, ch.y, ch.L, ch.rot, 0.1, -1.05);
  const officerX = bigX(t) + 330;
  const deckY = shipDeckY(bigX(t), BIG.y, BIG.s, officerX);
  const dripOn = t > T.bomb + 0.15 && t < 8.6;
  return (
    <AbsoluteFill style={{background: SKY_TOP}}>
      <World cam={cam} blur={c.k > 1.6 ? 2.4 : 0}>
        <SeaBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          <defs>
            <clipPath id="nab-above">
              <rect x={-9000} y={-9000} width={18000} height={9000 + BOAT.wl + 4} />
            </clipPath>
          </defs>
          {/* small ships on the horizon */}
          {SHIPS.map((s, i) => {
            if (t < s.t0) return null;
            const u = easeOutCubic(prog(t, s.t0, s.t0 + s.dur));
            return <Warship key={i} x={lerp(s.x0, s.x1, u)} y={10} s={s.s} t={t} speed={1 - u * 0.6} ph={s.ph} />;
          })}
          {/* the parachute + the bomb (clipped at the waterline after the splash) */}
          {t < T.bomb + 0.5 ? (
            <g clipPath="url(#nab-above)" opacity={ch.dark > 0.01 ? 0.92 : 1}>
              {t < T.bomb ? <Canopy cx={tail[0]} cy={canopyY} w={ch.cw} h={ch.ch} ax={tail[0]} ay={tail[1]} t={t} flutter={ch.flutter} /> : null}
              <Bomb x={ch.x} y={ch.y} L={ch.L} rot={ch.rot} dark={ch.dark} />
              <BombFace e1={e1} e2={e2} r={er} mood={mood} open={eyesOpen} look={look} t={t} />
              <FlagTag x={flagP[0]} y={flagP[1]} s={flag * (ch.L / 260)} />
              {sweat > 0 ? <SweatDrop x={e2[0] + er * 1.6} y={e2[1] - er * 1.2} r={er * 0.55} s={sweat} rot={12} /> : null}
            </g>
          ) : null}
          <ChuteOnWater t={t} />
          {/* the boat with the fisherman */}
          <g transform={`translate(${BOAT.x} ${BOAT.wl + heave}) rotate(${rock})`}>
            <g transform={`translate(${fx - BOAT.x} ${fy - BOAT.wl})`}>
              <g transform={`scale(${sw[0]} ${sw[1] * br})`}>
                <G n={pose} x={0} y={0} r={FISH.r} mir={pose === 'f_down'} />
              </g>
            </g>
            <SImg href={F('boat')} x={-279 * BOAT.sx} y={-BOAT_WL_PX * BOAT.sy} width={boatSp.w * BOAT.sx} height={boatSp.h * BOAT.sy} />
            {dripOn
              ? [0, 1, 2].map((i) => {
                  const ph = ((t - T.bomb) * 1.6 + i * 0.37) % 1;
                  const [hhx, hhy] = [hx - BOAT.x + (i - 1) * 46, hy - BOAT.wl - 70];
                  return <Drop key={i} x={hhx} y={hhy + ph * 160} r={10} />;
                })
              : null}
          </g>
          <ThoughtBubble t={t} hx={hx} hy={hy} />
          {/* big bow sliding in with the saluting officer */}
          {t >= BIG.t0 ? (
            <g>
              <g transform={`translate(${officerX} ${deckY})`}>
                <g transform={`scale(1 ${breathe(t, 1)})`}>
                  <G n="salute" x={0} y={0} r={66} />
                </g>
              </g>
              <Warship x={bigX(t)} y={BIG.y} s={BIG.s} t={t} speed={1 - prog(t, BIG.t0, BIG.t0 + BIG.dur)} />
            </g>
          ) : null}
          <WaterLine t={t} wl={BOAT.wl + 40} x0={-1500} x1={1800} alpha={0.42} />
          <Splash t={t} t0={T.bomb} x={SPLASH_X} y={BOAT.wl + 30} size={300} />
          <Splash t={t} t0={T.bomb + 0.12} x={SPLASH_X - 60} y={BOAT.wl + 34} size={170} seed={9} />
          {/* splash rain onto the fisherman */}
          {t > T.bomb && t < T.bomb + 1.0
            ? Array.from({length: 10}, (_, i) => {
                const u = (t - T.bomb - 0.1 - i * 0.04) / 0.7;
                if (u < 0 || u > 1) return null;
                const x = SPLASH_X - 60 - i * 38 - 260 * u;
                const y = BOAT.wl - 300 - 160 * Math.sin(Math.PI * u) + 420 * u * u;
                return <Drop key={i} x={x} y={y} r={11 + 5 * rnd(i)} />;
              })
            : null}
        </FullSvg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 2: the press scrum on the beach (9.06 - 12.82)
// ======================================================================================================
const PRESS_CAM: CamKey[] = [
  {t: C_PRESS, x: -20, y: 282, k: 1.0},
  {t: C_WEEKS, x: 0, y: 262, k: 1.06},
];
const OFF = {x: -20, y: 820, r: 100};
const MIC = {x: -380, y: 820, r: 98, t0: 9.2};
const CAMR = {x: 330, y: 880, r: 90, t0: 9.3};
const NOTE = {x: -170, y: 690, r: 80, t0: 9.42};
// the code board over the sprite's blank sign (mirrored officer)
const BOARD = {x0: 46, y0: 36, x1: 406, y1: 272};
const SignBoard: React.FC<{x0: number; y0: number; x1: number; y1: number; lines: [string, number][]; t: number; size: number; ow?: number}> = ({x0, y0, x1, y1, lines, t, size, ow = OW * 1.3}) => {
  const cx = (x0 + x1) / 2;
  const lh = (y1 - y0) / (lines.length + 0.35);
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={ow} />
      <rect x={x0 + ow} y={y1 - (y1 - y0) * 0.12} width={x1 - x0 - 2 * ow} height={(y1 - y0) * 0.12 - ow} fill="#ECEAE4" />
      {lines.map(([txt, t0], i) => {
        const s = t0 < 0 ? 1 : pop(t, t0, 0.22);
        const parts = txt.split('|');
        return s <= 0.001 ? null : (
          <g key={i} transform={`translate(${cx} ${y0 + lh * (i + 0.85)}) scale(${s})`}>
            <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={INK}>
              {parts.map((p, j) => (
                <tspan key={j} fill={p.startsWith('!') ? RED : INK}>
                  {p.replace('!', '')}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
};
const FlashBurst: React.FC<{x: number; y: number; t: number; t0: number; size?: number}> = ({x, y, t, t0, size = 1}) => {
  const u = (t - t0) / 0.22;
  if (u < 0 || u > 1) return null;
  const s = size * (0.6 + 0.8 * easeOutCubic(u)) * (1 - 0.6 * u);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d={Array.from({length: 16}, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const r = i % 2 ? 46 : 120;
          return `${i ? 'L' : 'M'} ${r * Math.cos(a)} ${r * Math.sin(a)}`;
        }).join(' ') + ' Z'}
        fill="#FFF7B8"
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle r={40} fill="#fff" />
    </g>
  );
};
const PRESS_FLASH = [9.62, 10.22, 11.0, 11.96, 12.5];
const PressScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, PRESS_CAM);
  const cam = {x: c.x, y: c.y, k: c.k};
  const slide = (t0: number, from: number, to: number) => lerp(from, to, easeOutBack(prog(t, t0, t0 + 0.28), 1.4));
  const micX = slide(MIC.t0, -900, MIC.x);
  const camX = slide(CAMR.t0, 1000, CAMR.x);
  const noteS = pop(t, NOTE.t0, 0.3);
  const tr = tremble(t, 1.6) + (t > T.bomb2 - 0.05 ? tremble(t, 2.2) : 0);
  const sweat1 = popOut(t, 10.25, 12.6, 0.2);
  const sweat2 = popOut(t, T.bomb2, 12.7, 0.2);
  const [ohx, ohy] = headOf('sign', OFF.x, OFF.y, OFF.r, true);
  const flashP = spt('p_cam', camX, CAMR.y, CAMR.r, 73, 152);
  const micTip = spt('p_mic', micX, MIC.y, MIC.r, 13, 283, true);
  const lean = 3 * Math.sin(2 * Math.PI * 1.1 * t);
  return (
    <AbsoluteFill style={{background: SKY_TOP}}>
      <World cam={cam} blur={2.2}>
        <SeaBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* the beach */}
          <path d={`M -3000 ${400} Q -1000 ${380} 0 ${396} Q 1200 ${412} 3000 ${392} L 3000 4000 L -3000 4000 Z`} fill={SAND} />
          <path d={`M -3000 ${400} Q -1000 ${380} 0 ${396} Q 1200 ${412} 3000 ${392} L 3000 ${470} Q 0 ${490} -3000 ${470} Z`} fill={SAND_SH} />
          <WaterLine t={t} wl={386} x0={-3000} x1={3000} depth={0} alpha={0} />
          {[-700, -250, 260, 620, -480, 80].map((x, i) => (
            <ellipse key={i} cx={x} cy={560 + (i % 3) * 140} rx={26} ry={9} fill={SAND_SH} />
          ))}
          {/* back reporter (notepad) */}
          {noteS > 0 ? (
            <g transform={`translate(${NOTE.x} ${NOTE.y}) scale(${noteS} ${noteS * breathe(t, 2)})`}>
              <G n="p_note" x={0} y={0} r={NOTE.r} mir />
            </g>
          ) : null}
          {/* the officer with the sign (mirrored: the sign is on his left) */}
          <g transform={`translate(${OFF.x + tr} ${OFF.y})`}>
            <g transform={`scale(1 ${breathe(t)})`}>
              <G n="sign" x={0} y={0} r={OFF.r} mir />
              <SignBoard
                x0={BOARD.x0 - OFF.x}
                y0={BOARD.y0 - OFF.y}
                x1={BOARD.x1 - OFF.x}
                y1={BOARD.y1 - OFF.y}
                t={t}
                size={46}
                lines={[
                  ['THE THING', T.the],
                  ['THAT IS |!NOT', T.that],
                  ['A BOMB', T.a2],
                ]}
              />
            </g>
          </g>
          {sweat1 > 0 ? <SweatDrop x={ohx - 96} y={ohy - 40} r={20} s={sweat1} rot={-15} /> : null}
          {sweat2 > 0 ? <SweatDrop x={ohx + 92} y={ohy - 10} r={24} s={sweat2} rot={18} /> : null}
          {/* front reporters */}
          <g transform={`translate(${micX} ${MIC.y}) rotate(${lean} 0 0)`}>
            <g transform={`scale(1 ${breathe(t, 1)})`}>
              <G n="p_mic" x={0} y={0} r={MIC.r} mir />
            </g>
          </g>
          <g transform={`translate(${camX} ${CAMR.y})`}>
            <g transform={`scale(1 ${breathe(t, 2.5)})`}>
              <G n="p_cam" x={0} y={0} r={CAMR.r} />
            </g>
          </g>
          {PRESS_FLASH.map((f, i) => (
            <FlashBurst key={i} x={flashP[0]} y={flashP[1]} t={t} t0={f} size={0.8} />
          ))}
          {/* sound lines from the microphone */}
          {t > 9.7 && t < 10.4
            ? [0, 1].map((i) => <path key={i} d={`M ${micTip[0] + 40 + i * 26} ${micTip[1] - 40 - i * 10} q 14 18 0 40`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />)
            : null}
        </FullSvg>
      </World>
      <Screen>
        {PRESS_FLASH.filter((_, i) => i % 2 === 0).map((f, i) => {
          const a = t >= f && t < f + 0.16 ? 0.28 * (1 - prog(t, f, f + 0.16)) : 0;
          return a > 0 ? <rect key={i} x={0} y={0} width={1080} height={1920} fill="#fff" opacity={a} /> : null;
        })}
      </Screen>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// DECK WORLD (scenes 3 and 6): deck edge at y = 0, plate 1.6x, railing as a foreground layer
// ======================================================================================================
const DPS = 1.6;
const DECK_X0 = -819;
const DECK_Y0 = -860 * DPS;
const RAIL_Y0 = DECK_Y0 + 664 * DPS;
const DeckBack: React.FC = () => (
  <FullSvg>
    <rect x={-9000} y={-9000} width={18000} height={9000 + DECK_Y0 + 4} fill="#6FCDFD" />
    <rect x={-9000} y={DECK_Y0 + 582 * DPS} width={18000} height={300 * DPS} fill="#269DDE" />
    <rect x={-9000} y={0} width={18000} height={9000} fill="#838F99" />
    <SImg key="deck" href={F('deck')} x={DECK_X0} y={DECK_Y0} width={1024 * DPS} height={1536 * DPS} preserveAspectRatio="none" />
  </FullSvg>
);
const RailFront: React.FC = () => (
  <FullSvg>
    <SImg key="rail" href={F('rail')} x={DECK_X0} y={RAIL_Y0} width={1024 * DPS} height={206 * DPS} preserveAspectRatio="none" />
  </FullSvg>
);
const DECK_CAM_Y = -238;

const Calendar: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, C_WEEKS + 0.05, C_DEEP - 0.12, 0.25);
  if (s <= 0) return null;
  const months = ['JAN', 'FEB', 'MAR'];
  const flips = [13.12, 13.5];
  const idx = t < flips[0] ? 0 : t < flips[1] ? 1 : 2;
  const fl = flips.map((f) => (t >= f - 0.12 && t < f ? 1 - prog(t, f - 0.12, f) : t >= f && t < f + 0.12 ? prog(t, f, f + 0.12) : 1));
  const sy = Math.min(...fl);
  return (
    <Screen>
      <g transform={`translate(300 470) rotate(-4) scale(${s})`}>
        <rect x={-190} y={-160} width={380} height={330} rx={22} fill="#fff" stroke={INK} strokeWidth={12} />
        <path d="M -184 -154 L 184 -154 L 184 -60 L -184 -60 Z" fill={RED} />
        <rect x={-190} y={-160} width={380} height={330} rx={22} fill="none" stroke={INK} strokeWidth={12} />
        {[-100, 0, 100].map((x) => (
          <rect key={x} x={x - 12} y={-190} width={24} height={64} rx={10} fill="#C8CDD3" stroke={INK} strokeWidth={6} />
        ))}
        <text x={0} y={-90} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill="#fff">
          1966
        </text>
        <g transform={`translate(0 60) scale(1 ${Math.max(0.05, sy)})`}>
          <text x={0} y={58} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={160} fill={INK}>
            {months[idx]}
          </text>
        </g>
      </g>
    </Screen>
  );
};
const Boot: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -40 -110 L 30 -110 L 34 10 Q 120 14 130 50 L 130 72 L -44 72 Z" fill="#6B4320" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -44 52 L 130 52 L 130 72 L -44 72 Z" fill="#3A2412" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -36 -110 L 26 -110 L 27 -88 L -37 -88 Z" fill="#8A5A2B" stroke={INK} strokeWidth={6} />
    <path d="M -10 -60 Q 0 -40 -12 -20" fill="none" stroke="#3A2412" strokeWidth={6} strokeLinecap="round" />
    <path d="M 60 40 Q 80 30 100 44" fill="none" stroke="#8A5A2B" strokeWidth={6} strokeLinecap="round" />
  </g>
);
const Grapple: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={0} y1={-3000} x2={0} y2={-40} stroke={INK} strokeWidth={14} />
    <line x1={0} y1={-3000} x2={0} y2={-40} stroke="#C9A06A" strokeWidth={7} />
    <rect x={-10} y={-48} width={20} height={70} rx={8} fill="#8E979E" stroke={INK} strokeWidth={6} />
    {[-1, 0, 1].map((d) => (
      <path key={d} d={`M 0 18 Q ${d * 50} 30 ${d * 52} ${d === 0 ? 60 : 4}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    ))}
    {[-1, 0, 1].map((d) => (
      <path key={`i${d}`} d={`M 0 18 Q ${d * 50} 30 ${d * 52} ${d === 0 ? 60 : 4}`} fill="none" stroke="#8E979E" strokeWidth={7} strokeLinecap="round" />
    ))}
  </g>
);
const WEEKS_CAM: CamKey[] = [
  {t: C_WEEKS, x: 0, y: DECK_CAM_Y, k: 1.0},
  {t: C_DEEP, x: 20, y: DECK_CAM_Y - 10, k: 1.05},
];
const WeeksScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, WEEKS_CAM);
  const hookY = t < 13.85 ? 160 + 8 * Math.sin(2 * Math.PI * 0.7 * t) : lerp(160, -560, easeOutBack(prog(t, 13.85, 14.2), 1.2));
  const swing = t > 13.85 ? 8 * Math.exp(-2.5 * (t - 14.1)) * Math.sin(2 * Math.PI * 1.3 * (t - 14.1)) : 0;
  const sweat = popOut(t, 14.2, C_DEEP, 0.2);
  const [hx, hy] = headOf('binoc', -120, 300, 100);
  const slump = t > 14.15 ? 1 - 0.035 * easeOutCubic(prog(t, 14.15, 14.4)) : 1;
  return (
    <AbsoluteFill style={{background: '#6FCDFD'}}>
      <World cam={cam}>
        <DeckBack />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* hook + boot behind the railing */}
          <g transform={`rotate(${swing} 390 ${hookY - 3000})`}>
            <Grapple x={390} y={hookY} />
            {t > 13.85 ? <Boot x={398} y={hookY + 150} s={0.9} rot={-8 + swing} /> : null}
            {t > 14.15 && t < C_DEEP
              ? [0, 1, 2].map((i) => {
                  const ph = ((t - 14.15) * 1.8 + i * 0.33) % 1;
                  return <Drop key={i} x={398 + (i - 1) * 40} y={hookY + 230 + ph * 200} r={10} />;
                })
              : null}
          </g>
        </FullSvg>
        <RailFront />
        <FullSvg>
          <g transform={`translate(-120 300) rotate(${2.5 * Math.sin(2 * Math.PI * 0.55 * (t - C_WEEKS)) * (1 - easeInOutCubic(prog(t, 13.95, 14.35)))}) scale(1 ${breathe(t) * slump})`}>
            <G n="binoc" x={0} y={0} r={100} />
          </g>
          {sweat > 0 ? <SweatDrop x={hx - 60} y={hy - 70} r={22} s={sweat} rot={-12} /> : null}
        </FullSvg>
      </World>
      <Calendar t={t} />
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 4: the deep slope (14.82 - 18.10). World = deep plate pixels x 1.6 (origin at the plate's top-left)
// ======================================================================================================
const KPS = 1.6;
const SLOPE = (SP as unknown as {deep: {slope: [number, number][]}}).deep.slope;
const slopeY = (wx: number) => {
  const nx = wx / KPS;
  for (let i = 1; i < SLOPE.length; i++) {
    if (nx <= SLOPE[i][0]) {
      const [x0, y0] = SLOPE[i - 1];
      const [x1, y1] = SLOPE[i];
      return KPS * lerp(y0, y1, (nx - x0) / (x1 - x0));
    }
  }
  return KPS * SLOPE[SLOPE.length - 1][1];
};
const SLOPE_ANG = (Math.atan2(slopeY(1400) - slopeY(500), 900) * 180) / Math.PI; // ~ -32 deg
const DB = (() => {
  const L = 400;
  const sx = 1060;
  const a = (SLOPE_ANG * Math.PI) / 180;
  const nx = Math.sin(a);
  const ny = -Math.cos(a);
  const r = (BOMB_R * L) / BOMB_LEN;
  return {x: sx + nx * (r - 8), y: slopeY(sx) + ny * (r - 8), L, rot: SLOPE_ANG};
})();
// the little sub (code; facing right, hull half-length 365)
const HRX = 365;
const HRY = 160;
const SAIL_TOP = -280;
const MiniSub: React.FC<{x: number; y: number; s: number; t: number; rot?: number; lamp: number}> = ({x, y, s, t, rot = 0, lamp}) => {
  const prop = (t * 700) % 360;
  const ow = OW / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {[-1, 1].map((d) => (
        <g key={d}>
          <rect x={d * 130 - 16} y={HRY - 30} width={32} height={42} fill="#9A9A9A" stroke={INK} strokeWidth={ow} />
          <rect x={d > 0 ? 40 : -230} y={HRY + 6} width={190} height={20} rx={10} fill="#9A9A9A" stroke={INK} strokeWidth={ow} />
        </g>
      ))}
      <g transform={`translate(${-HRX - 18} 12)`}>
        <rect x={-20} y={-12} width={44} height={24} fill="#6F6F6F" stroke={INK} strokeWidth={ow} />
        <ellipse cx={-28} cy={0} rx={12} ry={58 * Math.abs(Math.cos((prop * Math.PI) / 180)) + 8} fill="#C9C9C9" stroke={INK} strokeWidth={ow} />
        <ellipse cx={-28} cy={0} rx={24} ry={66} fill="none" stroke={INK} strokeWidth={ow + 7} />
        <ellipse cx={-28} cy={0} rx={24} ry={66} fill="none" stroke="#9A9A9A" strokeWidth={7} />
      </g>
      <path d={`M -190 -120 L -190 ${SAIL_TOP + 26} Q -190 ${SAIL_TOP} -164 ${SAIL_TOP} L 164 ${SAIL_TOP} Q 190 ${SAIL_TOP} 190 ${SAIL_TOP + 26} L 190 -120 Z`} fill="#F26A1B" stroke={INK} strokeWidth={ow} />
      <path d={`M -186 -124 L -186 ${SAIL_TOP + 26} Q -186 ${SAIL_TOP + 4} -164 ${SAIL_TOP + 4} L -150 ${SAIL_TOP + 4} L -150 -124 Z`} fill="#C9531A" />
      <rect x={60} y={SAIL_TOP + 50} width={70} height={40} rx={14} fill="#9FD8F2" stroke={INK} strokeWidth={ow} />
      <ellipse cx={0} cy={0} rx={HRX} ry={HRY} fill="#FEFDFD" stroke={INK} strokeWidth={ow} />
      <path d={`M ${-HRX + 30} 40 Q 0 ${HRY + 60} ${HRX - 30} 40 Q 0 ${HRY - 10} ${-HRX + 30} 40 Z`} fill="#E2E0E0" />
      <ellipse cx={0} cy={0} rx={HRX} ry={HRY} fill="none" stroke={INK} strokeWidth={ow} />
      {[
        [235, -20, 34],
        [300, 52, 22],
        [150, 62, 20],
      ].map(([px, py, r], i) => (
        <g key={i}>
          <circle cx={px} cy={py} r={r + 7} fill="#9A9A9A" stroke={INK} strokeWidth={ow} />
          <circle cx={px} cy={py} r={r} fill="#9FD8F2" stroke={INK} strokeWidth={ow * 0.8} />
        </g>
      ))}
      {/* lamp under the nose */}
      <rect x={250} y={HRY - 40} width={110} height={70} rx={20} fill="#9A9A9A" stroke={INK} strokeWidth={ow} />
      <circle cx={340} cy={HRY - 5} r={34} fill={lamp > 0.5 ? '#FFF6B0' : '#C9C9C9'} stroke={INK} strokeWidth={ow} />
    </g>
  );
};
const subAt = (t: number) => {
  const u = easeOutCubic(prog(t, C_DEEP, 16.0));
  const x = lerp(220, 640, u);
  const y = lerp(260, 1080, u) + 10 * Math.sin(2 * Math.PI * 0.5 * t);
  return {x, y, s: 0.3, rot: lerp(14, -4, u)};
};
const DEEP_CAM: CamKey[] = [
  {t: C_DEEP, x: 520, y: 620, k: 0.86},
  {t: 15.75, x: 700, y: 980, k: 0.62},
  {t: 16.65, x: 930, y: 1360, k: 0.92},
  {t: C_UP, x: 960, y: 1380, k: 0.98},
];
// the parachute lying crumpled on the slope up-hill of the bomb, lines to the tail
const Drape: React.FC<{tx: number; ty: number; dark: number}> = ({tx, ty, dark}) => {
  const x0 = tx + 70;
  const x1 = tx + 430;
  const top: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = lerp(x0, x1, i / 12);
    const h = (34 + 26 * Math.sin(i * 1.3) + 14 * Math.sin(i * 2.9)) * Math.sin((Math.PI * i) / 12) + 6;
    top.push(`${x},${slopeY(x) - h}`);
  }
  const bottom: string[] = [];
  for (let i = 12; i >= 0; i--) {
    const x = lerp(x0, x1, i / 12);
    bottom.push(`${x},${slopeY(x) + 6}`);
  }
  return (
    <g style={dark > 0.01 ? {filter: `brightness(${1 - 0.6 * dark})`} : undefined}>
      {[0.15, 0.4, 0.65].map((f, i) => {
        const x = lerp(x0, x1, f * 0.5);
        return <line key={i} x1={tx} y1={ty} x2={x} y2={slopeY(x) - 20} stroke="#2A2A2A" strokeWidth={4} />;
      })}
      <polygon points={[...top, ...bottom].join(' ')} fill="#E9EDF1" stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
      {[0.3, 0.55, 0.8].map((f, i) => {
        const x = lerp(x0, x1, f);
        return <path key={i} d={`M ${x - 20} ${slopeY(x - 20) - 4} Q ${x} ${slopeY(x) - 46} ${x + 26} ${slopeY(x + 26) - 8}`} fill="none" stroke="#C5CDD6" strokeWidth={8} strokeLinecap="round" />;
      })}
    </g>
  );
};
const DeepHud: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, C_DEEP + 0.05, 0.25);
  const d = Math.round(2550 * easeInOutCubic(prog(t, C_DEEP + 0.1, 16.8)) / 10) * 10;
  const tag = pop(t, T.half, 0.28);
  return (
    <Screen>
      <g transform={`translate(540 250) scale(${s})`}>
        <rect x={-250} y={-74} width={500} height={148} rx={30} fill="#0B1D33" opacity={0.75} stroke="#fff" strokeWidth={6} />
        <text x={0} y={-24} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#9FD8F2">
          DEPTH
        </text>
        <text x={0} y={48} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={76} fill="#fff">
          {`${d.toLocaleString('en-US')} FT`}
        </text>
      </g>
      {tag > 0 ? (
        <g transform={`translate(540 410) rotate(-3) scale(${tag})`}>
          <rect x={-215} y={-46} width={430} height={92} rx={22} fill={YEL} stroke={INK} strokeWidth={9} />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={INK}>
            HALF A MILE
          </text>
        </g>
      ) : null}
    </Screen>
  );
};
const DeepScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, DEEP_CAM);
  const sub = subAt(t);
  const lamp = easeOutCubic(prog(t, C_DEEP + 0.02, C_DEEP + 0.18));
  const lampPt: [number, number] = [sub.x + 340 * sub.s * Math.cos((sub.rot * Math.PI) / 180), sub.y + (340 * Math.sin((sub.rot * Math.PI) / 180) + (HRY - 5)) * sub.s];
  // the beam: points down-right first, swings onto the bomb on "spots"
  const aim0 = 104 + 8 * Math.sin(2 * Math.PI * 0.4 * (t - C_DEEP));
  const aim = t < T.spots - 0.2 ? aim0 : lerp(aim0, (Math.atan2(DB.y - lampPt[1], DB.x - lampPt[0]) * 180) / Math.PI, easeInOutCubic(prog(t, T.spots - 0.2, T.spots + 0.15)));
  const lit = easeOutCubic(prog(t, T.spots - 0.05, T.spots + 0.25));
  const len = 1500;
  const spread = 0.24;
  const a0 = (aim * Math.PI) / 180 - spread;
  const a1 = (aim * Math.PI) / 180 + spread;
  const eye = pop(t, T.it, 0.25);
  const e1 = bombPt(DB.x, DB.y, DB.L, DB.rot, -0.5, -0.38);
  const e2 = bombPt(DB.x, DB.y, DB.L, DB.rot, -0.3, -0.38);
  const tail = bombPt(DB.x, DB.y, DB.L, DB.rot, 1, 0);
  return (
    <AbsoluteFill style={{background: '#0A2747'}}>
      <World cam={cam}>
        <FullSvg>
          <defs>
            <linearGradient id="nab-deep" gradientUnits="userSpaceOnUse" x1={0} y1={-2000} x2={0} y2={2500}>
              <stop offset="0" stopColor="#14518A" />
              <stop offset="0.45" stopColor="#0D4475" />
              <stop offset="1" stopColor="#04284D" />
            </linearGradient>
            <radialGradient id="nab-glow">
              <stop offset="0" stopColor="#FFF6B0" stopOpacity={0.55} />
              <stop offset="1" stopColor="#FFF6B0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={-9000} y={-9000} width={18000} height={18000} fill="url(#nab-deep)" />
          <rect x={1600} y={1250} width={6000} height={6000} fill="#403C36" />
          <SImg key="deep" href={F('deep')} x={0} y={0} width={1024 * KPS} height={1536 * KPS} preserveAspectRatio="none" />
          {/* marine snow */}
          {Array.from({length: 40}, (_, i) => {
            const x = -400 + rnd(i) * 2400;
            const y = ((rnd(i + 50) * 3200 + 60 * t) % 3200) - 600;
            return <circle key={i} cx={x} cy={y} r={3 + 3 * rnd(i + 9)} fill="#CFE6F5" opacity={0.5} />;
          })}
          {/* the bomb on the slope, its parachute draped up-slope */}
          <g>
            <Drape tx={tail[0]} ty={tail[1]} dark={0.75 * (1 - lit)} />
            <Bomb x={DB.x} y={DB.y} L={DB.L} rot={DB.rot} dark={0.9 * (1 - lit)} />
            <BombFace e1={e1} e2={e2} r={24} mood="squint" open={eye} look={[-0.7, -0.5]} t={t} />
          </g>
          {/* lamp beam + glow on the bomb */}
          {lamp > 0.01 ? (
            <g>
              <path d={`M ${lampPt[0]} ${lampPt[1]} L ${lampPt[0] + Math.cos(a0) * len} ${lampPt[1] + Math.sin(a0) * len} L ${lampPt[0] + Math.cos(a1) * len} ${lampPt[1] + Math.sin(a1) * len} Z`} fill="#FFF3B0" opacity={0.2 * lamp} />
              <ellipse cx={DB.x} cy={DB.y} rx={360 * lit} ry={240 * lit} fill="url(#nab-glow)" />
            </g>
          ) : null}
          <MiniSub x={sub.x} y={sub.y} s={sub.s} t={t} rot={sub.rot} lamp={lamp} />
          <Bubbles t={t} t0={C_DEEP} t1={16.3} x={sub.x - 130} y={sub.y - 40} n={10} spread={40} seed={4} rise={360} rr={0.8} />
          {/* sonar ping rings on "spots" */}
          {[0, 1].map((i) => {
            const u = prog(t, T.spots + i * 0.18, T.spots + i * 0.18 + 0.7);
            return u > 0 && u < 1 ? <circle key={i} cx={DB.x} cy={DB.y} r={60 + 380 * u} fill="none" stroke="#9FF0FF" strokeWidth={10 * (1 - u)} opacity={1 - u} /> : null;
          })}
        </FullSvg>
      </World>
      <DeepHud t={t} />
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 5: up it comes (18.10 - 20.34) - the sea world again
// ======================================================================================================
const UP = {x: 60, wl: 380};
const stackOff = (t: number) => {
  if (t < 19.2) return 960;
  return lerp(960, 0, easeOutBack(prog(t, 19.2, T.up + 0.05), 1.15));
};
const Robot: React.FC<{x: number; y: number; s: number; t: number; dizzy: number}> = ({x, y, s, t, dizzy}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-100} y={-70} width={200} height={140} rx={12} fill="none" stroke={INK} strokeWidth={30} />
    <rect x={-100} y={-70} width={200} height={140} rx={12} fill="none" stroke={ROBOT} strokeWidth={18} />
    <line x1={-100} y1={0} x2={100} y2={0} stroke={INK} strokeWidth={26} />
    <line x1={-100} y1={0} x2={100} y2={0} stroke={ROBOT_SH} strokeWidth={14} />
    <rect x={-60} y={-60} width={120} height={56} rx={10} fill="#F2F2F2" stroke={INK} strokeWidth={8} />
    {[-1, 1].map((d) => (
      <g key={d}>
        <circle cx={d * 52} cy={36} r={26} fill="#2B2B2B" stroke={INK} strokeWidth={8} />
        <circle cx={d * 52} cy={36} r={13} fill="#FFF6B0" />
      </g>
    ))}
    <Eye x={-24} y={-32} r={20} open={1} squeeze={dizzy > 0.5} side={-1} look={[0.3, 0]} brow={NaN} />
    <Eye x={24} y={-32} r={20} open={1} squeeze={dizzy > 0.5} side={1} look={[0.3, 0]} brow={NaN} />
    {dizzy > 0
      ? [0, 1, 2].map((i) => {
          const a = 2 * Math.PI * (0.9 * t + i / 3);
          return (
            <path
              key={i}
              transform={`translate(${130 * Math.cos(a)} ${-110 + 26 * Math.sin(a)}) scale(${dizzy})`}
              d="M 0 -18 L 5 -6 L 18 -6 L 8 2 L 12 15 L 0 7 L -12 15 L -8 2 L -18 -6 L -5 -6 Z"
              fill={YEL}
              stroke={INK}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          );
        })
      : null}
  </g>
);
const UpHud: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, C_UP + 0.02, 0.22);
  const n = Math.max(1, Math.round(1 + 79 * easeInOutCubic(prog(t, C_UP + 0.05, 18.95))));
  const bump = n === 80 ? 1 + 0.12 * spring(t - 18.95, 3, 7) : 1;
  return (
    <Screen>
      <g transform={`translate(540 270) scale(${s * bump})`}>
        <rect x={-230} y={-82} width={460} height={164} rx={34} fill="#fff" stroke={INK} strokeWidth={12} />
        <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill={INK}>
          {`DAY ${n}`}
        </text>
      </g>
    </Screen>
  );
};
const UP_CAM: CamKey[] = [
  {t: C_UP, x: 60, y: 150, k: 1.0},
  {t: 19.15, x: 60, y: 150, k: 1.0},
  {t: 19.9, x: 60, y: 40, k: 1.0},
  {t: C_POSE, x: 60, y: 30, k: 1.02},
];
const UpScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, UP_CAM);
  const hit = (t0: number, a: number, d = 7) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(19.42, 9));
  const cam = {x: c.x + sh.x, y: c.y + sh.y, k: c.k};
  const off = stackOff(t);
  const sway = 4 * Math.sin(2 * Math.PI * 0.5 * (t - 19.6)) * prog(t, 19.5, 20.0);
  const robotY = -330 + off;
  const tailY = robotY + 70 + 120;
  const L = 420;
  const bomb = {x: UP.x, y: tailY + L / 2, L, rot: -90};
  const e1 = bombPt(bomb.x, bomb.y, L, bomb.rot, -0.45, -0.42);
  const e2 = bombPt(bomb.x, bomb.y, L, bomb.rot, -0.45, 0.42);
  const out = t > 19.5;
  const mood: Mood = t < 19.95 ? 'squeeze' : 'open';
  const dizzy = pop(t, 19.9, 0.3);
  const bubT = t > 18.6;
  return (
    <AbsoluteFill style={{background: SKY_TOP}}>
      <World cam={cam}>
        <SeaBack t={t} />
      </World>
      <World cam={cam}>
        <FullSvg>
          <defs>
            <clipPath id="nab-up-above">
              <rect x={-9000} y={-9000} width={18000} height={9000 + UP.wl + 4} />
            </clipPath>
          </defs>
          <g transform={`rotate(${sway} ${UP.x} -2000)`}>
            <line x1={UP.x} y1={-3000} x2={UP.x} y2={robotY - 60} stroke={INK} strokeWidth={14} />
            <line x1={UP.x} y1={-3000} x2={UP.x} y2={robotY - 60} stroke="#8E979E" strokeWidth={6} />
            <g clipPath="url(#nab-up-above)">
              {/* parachute lines from the bundle around the robot to the bomb's tail */}
              {[-60, -25, 25, 60].map((dx, i) => (
                <line key={i} x1={UP.x + dx} y1={robotY + 40} x2={UP.x + dx * 0.15} y2={tailY} stroke="#2A2A2A" strokeWidth={4} />
              ))}
              <Bomb x={bomb.x} y={bomb.y} L={L} rot={bomb.rot} />
              {out ? <BombFace e1={e1} e2={e2} r={26} mood={mood} open={1} look={[0, 0.3]} t={t} /> : null}
              {/* the parachute wrapped around the robot (behind it), tangled lines in front */}
              <path
                d={`M ${UP.x - 150} ${robotY - 20} Q ${UP.x - 60} ${robotY - 130} ${UP.x + 80} ${robotY - 100} Q ${UP.x + 170} ${robotY - 40} ${UP.x + 130} ${robotY + 60} Q ${UP.x + 30} ${robotY + 100} ${UP.x - 60} ${robotY + 90} Q ${UP.x - 170} ${robotY + 60} ${UP.x - 150} ${robotY - 20} Z`}
                fill="#E9EDF1"
                stroke={INK}
                strokeWidth={OW}
                strokeLinejoin="round"
              />
              <Robot x={UP.x} y={robotY} s={0.9} t={t} dizzy={dizzy} />
              <path d={`M ${UP.x - 120} ${robotY - 70} L ${UP.x + 100} ${robotY + 70} M ${UP.x + 110} ${robotY - 60} L ${UP.x - 90} ${robotY + 80} M ${UP.x - 130} ${robotY + 10} Q ${UP.x} ${robotY - 30} ${UP.x + 130} ${robotY + 20}`} fill="none" stroke="#2A2A2A" strokeWidth={5} />
              {/* water streaming off */}
              {out
                ? Array.from({length: 7}, (_, i) => {
                    const ph = ((t - 19.5) * 1.7 + i * 0.29) % 1;
                    const x = UP.x + (i - 3) * 30;
                    const y = robotY + 60 + (i % 2) * 140 + ph * (tailY + L - robotY);
                    return <Drop key={i} x={x} y={y} r={10 + 3 * (i % 3)} />;
                  })
                : null}
            </g>
          </g>
          <WaterLine t={t} wl={UP.wl} x0={-1500} x1={1500} depth={1200} alpha={0.55} />
          <Bubbles t={t} t0={18.6} t1={19.3} x={UP.x} y={UP.wl + 60} n={12} spread={160} seed={7} rise={90} rr={1.4} />
          {bubT && t < 19.4
            ? [0, 1, 2].map((i) => {
                const u = ((t - 18.6) * 2 + i / 3) % 1;
                return <ellipse key={i} cx={UP.x} cy={UP.wl + 8} rx={60 + 160 * u} ry={(60 + 160 * u) * 0.2} fill="none" stroke="#fff" strokeWidth={8 * (1 - u)} opacity={1 - u} />;
              })
            : null}
          <Splash t={t} t0={19.42} x={UP.x} y={UP.wl + 10} size={330} dur={0.85} seed={5} />
        </FullSvg>
      </World>
      <UpHud t={t} />
    </AbsoluteFill>
  );
};

// ======================================================================================================
// scene 6: the photo op on the deck (20.34 - 24.0)
// ======================================================================================================
const POSE_B = {x: -60, y: 166, L: 520};
const CRADLE_X = [-215, 95];
const OFF2 = {x: 300, y: 300, r: 100};
const REP1 = {x: -400, y: 300, r: 96};
const REP2 = {x: -205, y: 120, r: 70};
const POSE_FLASH = [22.5, 22.86, 23.24, 23.62];
const POSE_CAM: CamKey[] = [
  {t: C_POSE, x: 0, y: DECK_CAM_Y, k: 1.0},
  {t: 22.0, x: -20, y: DECK_CAM_Y - 20, k: 1.07},
  {t: DURATION, x: -20, y: DECK_CAM_Y - 26, k: 1.1},
];
const PoseScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, POSE_CAM);
  const tilt = t > T.poses ? -5 * (1 - spring(t - T.poses, 2.2, 5)) : 0;
  const bumpY = t > T.poses ? -14 * Math.exp(-4 * (t - T.poses)) * Math.sin(Math.PI * Math.min(1, (t - T.poses) / 0.3)) : 0;
  const B = {x: POSE_B.x, y: POSE_B.y + bumpY, L: POSE_B.L, rot: tilt};
  const face = pop(t, T.poses - 0.02, 0.3);
  const mood: Mood = t < T.cameras + 0.16 ? 'grin' : t < T.cameras + 0.62 ? 'wink' : 'grin';
  const e1 = bombPt(B.x, B.y, B.L, B.rot, -0.62, -0.3);
  const e2 = bombPt(B.x, B.y, B.L, B.rot, -0.4, -0.3);
  const mouth = bombPt(B.x, B.y, B.L, B.rot, -0.51, 0.28);
  // the old sign leans against the bomb's tail, tips over on "bomb"
  const fall = easeInCubic(prog(t, T.bomb3 - 0.05, T.bomb3 + 0.32));
  const bounce = t > T.bomb3 + 0.32 ? -4 * Math.exp(-6 * (t - T.bomb3 - 0.32)) * Math.sin(2 * Math.PI * 2.5 * (t - T.bomb3 - 0.32)) : 0;
  const signRot = -14 + (80 + 14) * fall + bounce;
  const flashP = spt('p_cam', REP1.x, REP1.y, REP1.r, 73, 152, true);
  const flashP2 = spt('p_cam', REP2.x, REP2.y, REP2.r, 73, 152, true);
  const offSw = squashSwap(t, T.and + 0.02);
  const twinkle = t > T.cameras + 0.16 && t < T.cameras + 0.62 ? pop(t, T.cameras + 0.16, 0.2) : 0;
  const twP = bombPt(B.x, B.y, B.L, B.rot, -0.4, -0.75);
  return (
    <AbsoluteFill style={{background: '#6FCDFD'}}>
      <World cam={cam}>
        <DeckBack />
      </World>
      <World cam={cam}>
        <FullSvg>
          {/* the fisherman's boat far behind, he points at the bomb */}
          <g transform={`translate(-330 ${-372 + 4 * Math.sin(2 * Math.PI * 0.42 * t)})`}>
            <g transform="translate(-14 14)">
              <G n="f_down" x={0} y={0} r={26} mir />
            </g>
            <SImg href={F('boat')} x={-279 * 0.42} y={-BOAT_WL_PX * 0.5} width={S('boat').w * 0.42} height={S('boat').h * 0.5} />
          </g>
          <WaterLine t={t} wl={-366} x0={-700} x1={0} depth={60} alpha={0.5} />
        </FullSvg>
        <RailFront />
        <FullSvg>
          {/* back reporter behind the bomb */}
          <g transform={`translate(${REP2.x} ${REP2.y}) scale(1 ${breathe(t, 3)})`}>
            <G n="p_cam" x={0} y={0} r={REP2.r} mir />
          </g>
          {/* cradle */}
          {CRADLE_X.map((cx) => (
            <g key={cx}>
              <path d={`M ${cx - 62} 300 L ${cx - 62} 236 Q ${cx} 270 ${cx + 62} 236 L ${cx + 62} 300 Z`} fill={WOOD} stroke={INK} strokeWidth={OW} strokeLinejoin="round" />
              <path d={`M ${cx - 56} 290 L ${cx + 56} 290`} stroke={WOOD_SH} strokeWidth={10} />
            </g>
          ))}
          <ellipse cx={POSE_B.x} cy={304} rx={330} ry={18} fill="rgba(40,46,52,0.28)" />
          <Bomb x={B.x} y={B.y} L={B.L} rot={B.rot} />
          <BombFace e1={e1} e2={e2} r={24} mood={mood} open={face} mouth={mouth} t={t} look={[-0.4, 0]} />
          {twinkle > 0 ? (
            <path
              transform={`translate(${twP[0]} ${twP[1]}) scale(${twinkle})`}
              d="M 0 -40 L 9 -9 L 40 0 L 9 9 L 0 40 L -9 9 L -40 0 L -9 -9 Z"
              fill="#fff"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
          ) : null}
          {/* the proud officer presents it */}
          <g transform={`translate(${OFF2.x} ${OFF2.y}) scale(${offSw[0]} ${offSw[1] * breathe(t, 0.5)})`}>
            <G n="proud" x={0} y={0} r={OFF2.r} />
          </g>
          {/* the old sign */}
          <g transform={`translate(150 300) rotate(${signRot})`}>
            <line x1={0} y1={0} x2={0} y2={-140} stroke={INK} strokeWidth={20} strokeLinecap="round" />
            <line x1={0} y1={0} x2={0} y2={-140} stroke="#C9A06A" strokeWidth={11} strokeLinecap="round" />
            <SignBoard
              x0={-104}
              y0={-276}
              x1={104}
              y1={-138}
              t={t}
              size={27}
              lines={[
                ['THE THING', -1],
                ['THAT IS |!NOT', -1],
                ['A BOMB', -1],
              ]}
            />
          </g>
          {/* front reporter */}
          <g transform={`translate(${REP1.x} ${REP1.y}) scale(1 ${breathe(t, 1.5)})`}>
            <G n="p_cam" x={0} y={0} r={REP1.r} mir />
          </g>
          {POSE_FLASH.map((f, i) => (
            <FlashBurst key={i} x={i % 2 ? flashP2[0] : flashP[0]} y={i % 2 ? flashP2[1] : flashP[1]} t={t} t0={f} size={i % 2 ? 0.6 : 0.85} />
          ))}
        </FullSvg>
      </World>
      <Screen>
        {POSE_FLASH.filter((_, i) => i % 2 === 0).map((f, i) => {
          const a = t >= f && t < f + 0.16 ? 0.3 * (1 - prog(t, f, f + 0.16)) : 0;
          return a > 0 ? <rect key={i} x={0} y={0} width={1080} height={1920} fill="#fff" opacity={a} /> : null;
        })}
      </Screen>
    </AbsoluteFill>
  );
};

// cut flash (camera flash on "But")
const CutFlash: React.FC<{t: number}> = ({t}) => {
  const f = C_PRESS;
  const a = t < f - 0.02 ? 0 : t < f + 0.04 ? prog(t, f - 0.02, f + 0.04) : 1 - easeOutCubic(prog(t, f + 0.08, f + 0.4));
  if (a <= 0.01) return null;
  return <AbsoluteFill style={{background: '#FFFBE8', opacity: clamp(a) * 0.9}} />;
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'beach_bed', at: 0.0, db: -31, keys: [[0, -31], [8.7, -31], [9.06, -60]], dur: 6.0},
  {f: 'beach_bed', at: 5.9, db: -31, keys: [[5.9, -60], [6.2, -31], [8.7, -31], [9.06, -60]], dur: 3.2},
  {f: 'chute_flutter', at: 0.2, db: -30},
  {f: 'pop', at: T.man - 0.1, db: -24},
  {f: 'whoosh', at: T.except - 0.02, db: -24},
  {f: 'pop', at: T.except + 0.06, db: -21, rate: 0.9},
  {f: 'chute_flutter', at: 3.7, db: -28},
  {f: 'gulp', at: 4.48, db: -19},
  {f: 'chute_flutter', at: T.its2, db: -24, rate: 1.2},
  {f: 'whoosh', at: 5.95, db: -27, rate: 0.8},
  {f: 'sub_splash', at: T.bomb - 0.04, db: -11},
  {f: 'splash', at: T.bomb + 0.18, db: -20},
  {f: 'horns', at: 7.45, db: -23},
  {f: 'horn', at: BIG.t0 + 0.05, db: -17},
  {f: 'flashbulb', at: C_PRESS - 0.06, db: -14},
  {f: 'whoosh', at: MIC.t0 - 0.02, db: -30},
  {f: 'press_frenzy', at: 9.55, db: -21},
  {f: 'flashbulb', at: PRESS_FLASH[1] - 0.04, db: -22},
  {f: 'flashbulb', at: PRESS_FLASH[2] - 0.04, db: -24},
  {f: 'pop', at: T.the - 0.03, db: -27},
  {f: 'pop', at: T.that - 0.03, db: -27, rate: 1.1},
  {f: 'pop', at: T.a2 - 0.03, db: -26, rate: 1.2},
  {f: 'flashbulb', at: PRESS_FLASH[3] - 0.04, db: -21},
  {f: 'flashbulb', at: PRESS_FLASH[4] - 0.04, db: -25},
  {f: 'flip', at: 13.0, db: -18},
  {f: 'flip', at: 13.38, db: -19},
  {f: 'boot_squelch', at: 13.92, db: -16},
  {f: 'sad_horn', at: 14.16, db: -25, dur: 0.66, keys: [[14.16, -25], [14.6, -25], [14.82, -60]]},
  {f: 'deep_bed', at: C_DEEP, db: -27, dur: 3.3, keys: [[C_DEEP, -27], [17.8, -27], [18.1, -60]]},
  {f: 'lamp_on', at: C_DEEP + 0.02, db: -16},
  {f: 'bubbles', at: C_DEEP + 0.1, db: -27},
  {f: 'sonar', at: T.spots - 0.02, db: -18},
  {f: 'squeak', at: T.it, db: -24},
  {f: 'ticks', at: C_UP, db: -25, dur: 0.85, keys: [[C_UP, -25], [18.85, -25], [18.95, -60]]},
  {f: 'pop', at: 18.95, db: -24},
  {f: 'winch', at: 19.0, db: -23},
  {f: 'bubbles', at: 18.6, db: -24},
  {f: 'water_rush', at: 19.38, db: -14},
  {f: 'splash', at: 19.42, db: -21},
  {f: 'dizzy', at: 19.92, db: -24},
  {f: 'stamp', at: C_POSE - 0.02, db: -26},
  {f: 'creak', at: T.bomb3 - 0.36, db: -19},
  {f: 'boing', at: T.poses + 0.02, db: -27},
  {f: 'flashbulb', at: POSE_FLASH[0] - 0.04, db: -18},
  {f: 'flashbulb', at: POSE_FLASH[1] - 0.04, db: -23},
  {f: 'twinkle', at: T.cameras + 0.14, db: -20},
  {f: 'flashbulb', at: POSE_FLASH[2] - 0.04, db: -20},
  {f: 'flashbulb', at: POSE_FLASH[3] - 0.04, db: -24},
];

export const NotABombShort: React.FC = () => {
  useNABFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: SKY_TOP}}>
      {t < C_PRESS ? <SeaScene t={t} /> : t < C_WEEKS ? <PressScene t={t} /> : t < C_DEEP ? <WeeksScene t={t} /> : t < C_UP ? <DeepScene t={t} /> : t < C_POSE ? <UpScene t={t} /> : <PoseScene t={t} />}
      <CutFlash t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('not-a-bomb/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('not-a-bomb/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="not-a-bomb/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
