// Parametric marker characters. No insignia, no national symbols on uniforms.
import React from 'react';
import { C } from './theme';
import { Def, Ink, Scribble, ell, prog, useT, rnd, jit } from './draw';

export const DefDraw: React.FC<{ def: Def; at: number; dur?: number; lw?: number }> = ({ def, at, dur = 1, lw = 6 }) => {
  const t = useT();
  if (t < at) return null;
  const fillAt = at + dur * 0.85;
  return (
    <g>
      {(def.fills || []).map(([d, c], i) => <Scribble key={'f' + i} clip={d} at={fillAt + i * 0.04} dur={0.6} color={c} seed={i + 7} />)}
      {(def.dots || []).map((d, i) => <path key={'d' + i} d={d} fill={C.ink} opacity={prog(t, at + dur * 0.5, 0.2)} />)}
      {def.lines.map((d, i) => <Ink key={'l' + i} d={jit(d, 1.2)} at={at + (i / Math.max(def.lines.length, 1)) * dur * 0.35} dur={dur * 0.65} w={lw} />)}
    </g>
  );
};

export type Face = 'neutral' | 'worried' | 'smirk' | 'smile' | 'shock' | 'sleepy' | 'sad';
export type Kind = 'soldier' | 'woman' | 'mother' | 'officer' | 'german' | 'volunteer';

const mouth: Record<Face, string> = {
  neutral: 'M91,95 L109,95',
  worried: 'M89,99 C95,91 105,91 111,99',
  smirk: 'M89,95 C98,100 107,98 113,89',
  smile: 'M87,92 C94,102 106,102 113,92',
  shock: ell(100, 97, 7, 9),
  sleepy: 'M93,96 L107,96',
  sad: 'M89,100 C95,92 105,92 111,100',
};

const UNIFORM = { soldier: '#8E9F48', woman: '#8E9F48', officer: '#7E8E40', german: '#6F7466', mother: '#9C4A3A', volunteer: '#3E6FA8' };

function bodyDef(kind: Kind, face: Face, pose: string): Def {
  const lines: string[] = [];
  const fills: [string, string][] = [];
  const dots: string[] = [];
  const coat = UNIFORM[kind];
  const add = (d: string, c?: string) => { if (c) fills.push([d, c]); lines.push(d); };
  // arms (sleeves as shapes, never sticks)
  const sleeveL = pose === 'hold' ? 'M70,112 L58,166 L104,170 L106,152 L80,148 L88,120 Z' : 'M70,112 L44,182 L62,192 L84,128 Z';
  const sleeveR = pose === 'hold' ? 'M130,112 L142,166 L100,174 L98,156 L120,150 L112,120 Z' : 'M130,112 L156,182 L138,192 L116,128 Z';
  // torso
  if (kind === 'mother') {
    add('M70,108 C84,100 116,100 130,108 L150,286 L50,286 Z', coat);
    add('M80,150 L120,150 L128,270 L72,270 Z', '#E9D9B6');            // apron
  } else if (kind === 'german') {
    add('M68,108 C82,100 118,100 132,108 L146,246 L54,246 Z', coat);
    lines.push('M100,112 L100,246');
    dots.push(ell(108, 140, 3.5), ell(108, 170, 3.5), ell(108, 200, 3.5));
  } else {
    add('M66,108 C80,100 120,100 134,108 L142,204 L58,204 Z', coat);
    lines.push('M86,106 L100,126 L114,106', 'M100,126 L100,176');
    lines.push('M72,130 L92,130 L92,146 L72,146 Z', 'M108,130 L128,130 L128,146 L108,146 Z');
    add('M58,180 L142,180 L142,194 L58,194 Z', '#5A3A1E');                 // belt
    add('M94,179 L106,179 L106,195 L94,195 Z', '#C9A227');                 // plain buckle
  }
  add(sleeveL, kind === 'mother' ? coat : coat);
  add(sleeveR, coat);
  // hands
  if (pose === 'hold') { add(ell(104, 162, 11), C.skin); add(ell(100, 166, 11), C.skin); }
  else { add(ell(53, 194, 11), C.skin); add(ell(147, 194, 11), C.skin); }
  // head + ears
  add(ell(66, 76, 7, 9), C.skin); add(ell(134, 76, 7, 9), C.skin);
  add(ell(100, 70, 34, 37), C.skin);
  // hair / headwear
  if (kind === 'woman') { add('M66,66 C60,100 70,114 84,112 L82,74 Z', '#7A4A2A'); add('M134,66 C140,100 130,114 116,112 L118,74 Z', '#7A4A2A'); }
  if (kind === 'soldier' || kind === 'woman') add('M64,50 C66,26 134,26 136,48 L132,60 C112,52 88,52 68,60 Z', C.olive);
  else if (kind === 'officer') { add('M60,46 C64,24 136,24 140,46 L140,56 L60,56 Z', C.olive); add('M62,56 L138,56 L138,64 L62,64 Z', '#4A5A2A'); add('M62,62 L118,62 L124,72 L64,70 Z', '#222222'); }
  else if (kind === 'german') add('M60,62 C60,22 140,22 140,62 L152,76 L48,76 Z', '#7C827A');
  else if (kind === 'mother') add('M62,78 C56,28 144,28 138,78 L146,110 C122,98 78,98 54,110 Z', C.blue);
  else if (kind === 'volunteer') add('M66,52 C68,30 132,30 134,52 L156,58 L66,58 Z', C.orange);
  // face
  if (face === 'sleepy') lines.push('M82,72 L94,72', 'M106,72 L118,72');
  else dots.push(ell(88, 72, 4.5, 5.5), ell(112, 72, 4.5, 5.5));
  if (face === 'worried' || face === 'sad') lines.push('M80,62 L94,57', 'M120,62 L106,57');
  if (face === 'shock') lines.push('M79,60 C83,52 91,52 95,56', 'M121,60 C117,52 109,52 105,56');
  fills.push([ell(80, 86, 6, 4), '#F2A0A0'], [ell(120, 86, 6, 4), '#F2A0A0']);
  lines.push('M100,76 C97,83 99,87 104,86');
  lines.push(mouth[face]);
  return { lines, fills, dots };
}

function legDef(kind: Kind, side: -1 | 1, valenki = false): Def {
  if (kind === 'mother') return { lines: [] };
  const top = kind === 'german' ? 238 : 200;
  const trousers = kind === 'german' ? '#5E635A' : kind === 'volunteer' ? '#3B3B3B' : '#4F6B2A';
  const leg = side < 0 ? `M64,${top} L99,${top} L96,262 L72,262 Z` : `M101,${top} L136,${top} L128,262 L104,262 Z`;
  const boot = side < 0 ? 'M70,256 L98,256 L100,296 L58,296 C58,284 64,278 70,276 Z' : 'M102,256 L130,256 L130,276 C138,278 144,284 144,296 L102,296 Z';
  return { lines: [leg, boot], fills: [[leg, trousers], [boot, valenki ? '#8E8B86' : '#3A2A1E']] };
}

export const Person: React.FC<{
  x: number; y: number; s?: number; at: number; dur?: number; kind?: Kind; face?: Face; pose?: 'stand' | 'walk' | 'sit' | 'hold' | 'lie';
  flip?: boolean; shiver?: boolean; valenki?: boolean; faceAt?: [number, Face][]; children?: React.ReactNode; rot?: number;
}> = ({ x, y, s = 1, at, dur = 1.1, kind = 'soldier', face = 'neutral', pose = 'stand', flip, shiver, valenki, faceAt, children, rot = 0 }) => {
  const t = useT();
  if (t < at) return null;
  let f = face;
  for (const [tt, ff] of faceAt || []) if (t >= tt) f = ff;
  const swing = pose === 'walk' ? Math.sin(t * 7) * 16 : 0;
  const bob = pose === 'walk' ? Math.abs(Math.sin(t * 7)) * -5 : 0;
  const jx = shiver ? (rnd(Math.floor(t * 20)) - 0.5) * 6 : 0;
  const sit = pose === 'sit';
  const r = pose === 'lie' ? -90 : rot;
  return (
    <g transform={`translate(${x + jx},${y + bob}) rotate(${r}) scale(${flip ? -s : s},${s}) translate(-100,-150)`}>
      {!sit && (
        <>
          <g transform={`rotate(${swing},100,204)`}><DefDraw def={legDef(kind, -1, valenki)} at={at + 0.15} dur={dur * 0.6} /></g>
          <g transform={`rotate(${-swing},100,204)`}><DefDraw def={legDef(kind, 1, valenki)} at={at + 0.2} dur={dur * 0.6} /></g>
        </>
      )}
      {sit && (
        <DefDraw at={at + 0.15} dur={dur * 0.6} def={{
          lines: ['M62,198 L146,198 L146,226 L62,226 Z', 'M118,222 L146,222 L144,264 L120,264 Z', 'M116,260 L146,260 L148,282 C160,284 166,290 166,296 L114,296 Z'],
          fills: [['M62,198 L146,198 L146,226 L62,226 Z', '#4F6B2A'], ['M118,222 L146,222 L144,264 L120,264 Z', '#4F6B2A'], ['M116,260 L146,260 L148,282 C160,284 166,290 166,296 L114,296 Z', valenki ? '#8E8B86' : '#3A2A1E']],
        }} />
      )}
      <DefDraw def={bodyDef(kind, f, pose)} at={at} dur={dur} />
      {children}
    </g>
  );
};
