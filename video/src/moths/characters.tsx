import React from 'react';
import {INK, Obj, Pic, clamp, lerp, wobble} from './lib';

// ===================== shared cartoon eye (white eye, black pupil, lid clipped to the eye) =====================
export const Eye: React.FC<{id: string; cx: number; cy: number; rx: number; ry: number; cover: number; look: [number, number];
  lidColor: string; tilt?: number; pupil?: number; sw?: number; wince?: 'L' | 'R' | null}> = (p) => {
  const sw = p.sw ?? 10;
  if (p.wince) {
    // squeezed shut as a chevron  > <
    const d = p.wince === 'L' ? 1 : -1;
    return (
      <path d={`M ${p.cx - d * p.rx * 0.7} ${p.cy - p.ry * 0.55} L ${p.cx + d * p.rx * 0.55} ${p.cy} L ${p.cx - d * p.rx * 0.7} ${p.cy + p.ry * 0.55}`}
        fill="none" stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" strokeLinejoin="round" />
    );
  }
  const cover = clamp(p.cover);
  if (cover > 0.97) {
    return <path d={`M ${p.cx - p.rx * 0.9} ${p.cy} Q ${p.cx} ${p.cy + p.ry * 0.45} ${p.cx + p.rx * 0.9} ${p.cy}`}
      fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  }
  const pr = (p.pupil ?? 0.42) * p.rx;
  const px = p.cx + p.look[0] * (p.rx - pr) * 0.75, py = p.cy + p.look[1] * (p.ry - pr) * 0.6;
  const lidY = p.cy - p.ry + 2 * p.ry * cover;
  const tl = (p.tilt ?? 0) * p.ry;
  return (
    <g>
      <defs><clipPath id={p.id}><ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} /></clipPath></defs>
      <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="#FFFFFF" />
      <g clipPath={`url(#${p.id})`}>
        <circle cx={px} cy={py} r={pr} fill={INK} />
        <circle cx={px - pr * 0.35} cy={py - pr * 0.38} r={pr * 0.28} fill="#FFFFFF" />
        {cover > 0.01 && (
          <>
            <path d={`M ${p.cx - p.rx - 5} ${p.cy - p.ry - 5} L ${p.cx + p.rx + 5} ${p.cy - p.ry - 5} L ${p.cx + p.rx + 5} ${lidY + tl} L ${p.cx - p.rx - 5} ${lidY - tl} Z`} fill={p.lidColor} />
            <path d={`M ${p.cx - p.rx - 5} ${lidY - tl} L ${p.cx + p.rx + 5} ${lidY + tl}`} stroke={INK} strokeWidth={sw} />
          </>
        )}
      </g>
      <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
};

// ===================== the hero moth: body + wings puppet, face drawn here =====================
export const MOTH = {w: 1929, h: 1827, ax: 1100, ay: 1250, piv: [918, 1059],
  eyeL: [1369.5, 1233.9], eyeR: [1635.9, 1220.1], browL: [1351.5, 1109.4], browR: [1636.5, 1098], mouth: [1515.9, 1341.3]};
export type MothExpr = 'calm' | 'happy' | 'worried' | 'scared' | 'dizzy';

const isBlink = (t: number, seed: number) => ((t + seed * 0.731) % 2.98) < 0.11;

const MothFace: React.FC<{expr: MothExpr; look: [number, number]; blink: boolean; uid: string; t: number}> = ({expr, look, blink, uid, t}) => {
  const [lx, ly] = MOTH.eyeL, [rx, ry] = MOTH.eyeR, [bxl, byl] = MOTH.browL, [bxr, byr] = MOTH.browR, [mx, my] = MOTH.mouth;
  const sw = 11;
  if (expr === 'dizzy') {
    const wave = Array.from({length: 7}, (_, i) => `${mx - 60 + i * 20} ${my + (i % 2 ? -9 : 9)}`).join(' L ');
    return (
      <svg viewBox={`0 0 ${MOTH.w} ${MOTH.h}`} style={{position: 'absolute', left: 0, top: 0, width: MOTH.w, height: MOTH.h, overflow: 'visible'}}>
        <Eye id={`${uid}l`} cx={lx} cy={ly} rx={40} ry={52} cover={0} look={[0, 0]} lidColor="#000" wince="L" sw={sw} />
        <Eye id={`${uid}r`} cx={rx} cy={ry} rx={40} ry={52} cover={0} look={[0, 0]} lidColor="#000" wince="R" sw={sw} />
        <path d={`M ${wave}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const scaredish = expr === 'worried' || expr === 'scared';
  const brow = (cx: number, cy: number, side: 1 | -1) => {
    // side 1 = left brow (inner end is on its right)
    if (scaredish) return `M ${cx - 52 * side} ${cy + 18} Q ${cx} ${cy - 2} ${cx + 50 * side} ${cy - 30}`;
    if (expr === 'happy') return `M ${cx - 52} ${cy - 2} Q ${cx} ${cy - 30} ${cx + 52} ${cy - 2}`;
    return `M ${cx - 50} ${cy + 8} Q ${cx} ${cy - 20} ${cx + 50} ${cy + 8}`;
  };
  const eyes = scaredish ? (
    <>
      <Eye id={`${uid}l`} cx={lx - 4} cy={ly - 6} rx={54} ry={72} cover={0} look={look} lidColor="#FBEBC9" pupil={expr === 'scared' ? 0.36 : 0.44} sw={sw} />
      <Eye id={`${uid}r`} cx={rx + 4} cy={ry - 6} rx={54} ry={72} cover={0} look={look} lidColor="#FBEBC9" pupil={expr === 'scared' ? 0.36 : 0.44} sw={sw} />
    </>
  ) : (
    [[lx, ly], [rx, ry]].map(([ex, ey], i) => (
      <g key={i}>
        <ellipse cx={ex + look[0] * 10} cy={ey + look[1] * 8} rx={39} ry={blink ? 6 : 60} fill={INK} />
        {!blink && <circle cx={ex + look[0] * 10 - 13} cy={ey + look[1] * 8 - 24} r={9} fill="#FFFFFF" />}
      </g>
    ))
  );
  let mouth: React.ReactNode;
  if (scaredish) {
    const open = expr === 'scared' ? 1.25 : 1;
    const wob = Math.sin(t * 40) * 5;
    const d = `M ${mx - 46} ${my + 4} Q ${mx - 22} ${my - 24 * open + wob} ${mx} ${my - 12 * open} Q ${mx + 24} ${my - 26 * open - wob} ${mx + 46} ${my + 2} Q ${mx + 2} ${my + 58 * open} ${mx - 46} ${my + 4} Z`;
    mouth = (
      <g>
        <defs><clipPath id={`${uid}m`}><path d={d} /></clipPath></defs>
        <path d={d} fill="#5A1E22" />
        <ellipse cx={mx + 6} cy={my + 34 * open} rx={30} ry={16} fill="#F2899A" clipPath={`url(#${uid}m)`} />
        <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      </g>
    );
  } else if (expr === 'happy') {
    mouth = <path d={`M ${mx - 62} ${my - 10} Q ${mx} ${my + 44} ${mx + 62} ${my - 10}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  } else {
    mouth = <path d={`M ${mx - 52} ${my - 6} Q ${mx} ${my + 28} ${mx + 52} ${my - 6}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  }
  return (
    <svg viewBox={`0 0 ${MOTH.w} ${MOTH.h}`} style={{position: 'absolute', left: 0, top: 0, width: MOTH.w, height: MOTH.h, overflow: 'visible'}}>
      <path d={brow(bxl, byl, 1)} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      <path d={brow(bxr, byr, scaredish ? -1 : 1)} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      {eyes}
      {mouth}
    </svg>
  );
};

/** light-blue sweat drop with outline + glint; p = 0..1 life (pops on, slides, pops off) */
const Sweat: React.FC<{p: number}> = ({p}) => {
  if (p <= 0 || p >= 1) return null;
  const pop = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1;
  const x = 1790 + 30 * p, y = 1010 + 170 * p;
  return (
    <svg viewBox={`0 0 ${MOTH.w} ${MOTH.h}`} style={{position: 'absolute', left: 0, top: 0, width: MOTH.w, height: MOTH.h, overflow: 'visible'}}>
      <g transform={`translate(${x} ${y}) scale(${pop * 1.9})`}>
        <path d="M 0 -78 C 28 -34 50 -4 50 26 A 50 50 0 1 1 -50 26 C -50 -4 -28 -34 0 -78 Z" fill="#9ED8FF" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
        <ellipse cx={-18} cy={22} rx={11} ry={18} fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const Moth: React.FC<{x: number; y: number; s: number; t: number; rot?: number; hz?: number; amp?: number; wing?: number;
  expr?: MothExpr; look?: [number, number]; sx?: number; sy?: number; seed?: number; sweat?: number; filter?: string; uid: string; noBlink?: boolean}> = (p) => {
  const hz = p.hz ?? 8, amp = p.amp ?? 1, seed = p.seed ?? 0;
  const ph = 2 * Math.PI * hz * p.t + seed;
  const c = (1 + Math.cos(ph)) / 2; // 1 = wings up, 0 = wings down
  const sw = p.wing ?? lerp(1 - 1.8 * amp, 1, c);
  const wr = p.wing === undefined ? lerp(22, 0, c) * amp : 0;
  const bob = p.wing === undefined ? -18 * amp * Math.sin(ph) : 0;
  const blink = !p.noBlink && isBlink(p.t, seed);
  return (
    <Obj x={p.x} y={p.y} s={p.s} w={MOTH.w} h={MOTH.h} ax={MOTH.ax} ay={MOTH.ay - bob} rot={p.rot} sx={p.sx} sy={p.sy} filter={p.filter}>
      <Pic src="moth_wings.png" w={MOTH.w} h={MOTH.h} style={{transformOrigin: `${MOTH.piv[0]}px ${MOTH.piv[1]}px`, transform: `rotate(${wr}deg) scaleY(${sw})`}} />
      <Pic src="moth_body_blank.png" w={MOTH.w} h={MOTH.h} />
      <MothFace expr={p.expr ?? 'calm'} look={p.look ?? [0, 0]} blink={blink} uid={p.uid} t={p.t} />
      <Sweat p={p.sweat ?? 0} />
    </Obj>
  );
};

// ===================== extra moths (Flow pictures, top / 3-4 views) - flap by squashing the width =====================
export const EXTRA = {
  a: {src: 'moth_extra_a.png', w: 508, h: 751},
  b: {src: 'moth_extra_b.png', w: 727, h: 636},
  c: {src: 'moth_extra_c.png', w: 606, h: 861},
};
export const Extra: React.FC<{kind: 'a' | 'b' | 'c'; x: number; y: number; width: number; rot: number; t: number; hz: number; seed: number}> = (p) => {
  const e = EXTRA[p.kind];
  const f = (1 + Math.cos(2 * Math.PI * p.hz * p.t + p.seed)) / 2;
  const sx = lerp(0.5, 1, f);
  return (
    <Obj x={p.x} y={p.y} s={p.width / e.w} w={e.w} h={e.h} ax={e.w / 2} ay={e.h * 0.45} rot={p.rot} sx={sx}>
      <Pic src={e.src} w={e.w} h={e.h} />
    </Obj>
  );
};

// ===================== the street lamp (face on the front glass) =====================
export const LAMP = {w: 741, h: 3381, ax: 368, ay: 3341, lantern: [370, 690], eyes: [[214, 622], [350, 622]], mouth: [282, 812]};
export const Lamp: React.FC<{x: number; y: number; s: number; on: boolean; cover: number; look: [number, number]; brow: number;
  smirk: number; tilt?: number; sx?: number; sy?: number; eyePop?: number; uid: string}> = (p) => {
  const glass = p.on ? '#FFD95C' : '#5F6472';
  const pop = 1 + 0.18 * (p.eyePop ?? 0);
  const [mx, my] = LAMP.mouth;
  return (
    <Obj x={p.x} y={p.y} s={p.s} w={LAMP.w} h={LAMP.h} ax={LAMP.ax} ay={LAMP.ay} sx={p.sx} sy={p.sy}>
      <Pic src={p.on ? 'lamp_on.png' : 'lamp_off.png'} w={LAMP.w} h={LAMP.h} />
      <svg viewBox={`0 0 ${LAMP.w} ${LAMP.h}`} style={{position: 'absolute', left: 0, top: 0, width: LAMP.w, height: LAMP.h, overflow: 'visible'}}>
        {LAMP.eyes.map(([ex, ey], i) => (
          <g key={i} transform={`translate(${ex} ${ey}) scale(${pop}) translate(${-ex} ${-ey})`}>
            <Eye id={`${p.uid}e${i}`} cx={ex} cy={ey} rx={54} ry={64} cover={p.cover} look={p.look} lidColor={glass}
              tilt={(p.tilt ?? 0) * (i === 0 ? -1 : 1)} pupil={0.45} sw={11} />
          </g>
        ))}
        {LAMP.eyes.map(([ex, ey], i) => {
          const side = i === 0 ? -1 : 1, by = ey - 100 - 26 * p.brow;
          const inner = by + (p.tilt ?? 0) * 26 * 1, outer = by - (p.tilt ?? 0) * 10;
          return <path key={`b${i}`} d={`M ${ex + side * 52} ${outer} Q ${ex} ${by - 22} ${ex - side * 48} ${inner}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />;
        })}
        {p.smirk > 0.01 ? (
          <path d={`M ${mx - 46} ${my} Q ${mx} ${my + 22 * p.smirk} ${mx + 40} ${my - 18 * p.smirk}`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        ) : (
          <path d={`M ${mx - 30} ${my} Q ${mx} ${my + 8} ${mx + 30} ${my}`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        )}
      </svg>
    </Obj>
  );
};

// ===================== the Moon (face in code) =====================
export const MOON = {w: 1184, h: 1214, cx: 592, cy: 607, r: 567, eyes: [[462, 575], [712, 575]], mouth: [588, 770]};
export const Moon: React.FC<{x: number; y: number; s: number; cover: number; look: [number, number]; wince: boolean; uid: string}> = (p) => {
  const [mx, my] = MOON.mouth;
  return (
    <Obj x={p.x} y={p.y} s={p.s} w={MOON.w} h={MOON.h} ax={MOON.cx} ay={MOON.cy}>
      <Pic src="moon.png" w={MOON.w} h={MOON.h} />
      <svg viewBox={`0 0 ${MOON.w} ${MOON.h}`} style={{position: 'absolute', left: 0, top: 0, width: MOON.w, height: MOON.h, overflow: 'visible'}}>
        {MOON.eyes.map(([ex, ey], i) => (
          <Eye key={i} id={`${p.uid}m${i}`} cx={ex} cy={ey} rx={60} ry={72} cover={p.cover} look={p.look} lidColor="#F3E2B4" sw={14}
            wince={p.wince ? (i === 0 ? 'L' : 'R') : null} />
        ))}
        {p.wince ? (
          <path d={`M ${mx - 60} ${my + 10} Q ${mx - 30} ${my - 20} ${mx} ${my + 10} Q ${mx + 30} ${my + 40} ${mx + 60} ${my + 10}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        ) : (
          <path d={`M ${mx - 54} ${my - 6} Q ${mx} ${my + 34} ${mx + 54} ${my - 6}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        )}
      </svg>
    </Obj>
  );
};

// ===================== scientist (one picture, breathing + key-word bounce) =====================
export const SCI = {w: 1782, h: 2145, ax: 890, ay: 2106};
export const Scientist: React.FC<{x: number; y: number; s: number; t: number; bounceAt: number}> = ({x, y, s, t, bounceAt}) => {
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const b = wobble(t, bounceAt, 3.2, 7);
  return (
    <Obj x={x} y={y} s={s} w={SCI.w} h={SCI.h} ax={SCI.ax} ay={SCI.ay} sx={1 + 0.04 * b} sy={breathe - 0.05 * b}>
      <Pic src="scientist.png" w={SCI.w} h={SCI.h} />
    </Obj>
  );
};
