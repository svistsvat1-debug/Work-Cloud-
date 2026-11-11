// Parametric marker characters. No insignia, no national symbols on uniforms.
import React from 'react';
import { C } from './theme';
import { Def, Ink, Scribble, ell, prog, useT, rnd, jit } from './draw';

export const DefDraw: React.FC<{ def: Def; at: number; dur?: number; lw?: number }> = ({ def, at, dur = 1, lw = 5 }) => {
  const t = useT();
  if (t < at) return null;
  const fillAt = at + dur * 0.55;
  return (
    <g>
      {(def.fills || []).map(([d, c], i) => <Scribble key={'f' + i} clip={d} at={fillAt + i * 0.05} dur={0.5} color={c} seed={i + 7} />)}
      {(def.dots || []).map((d, i) => <path key={'d' + i} d={d} fill={C.ink} opacity={prog(t, at + dur * 0.5, 0.2)} />)}
      {def.lines.map((d, i) => <Ink key={'l' + i} d={jit(d, 1.2)} at={at + (i / Math.max(def.lines.length, 1)) * dur * 0.35} dur={dur * 0.65} w={lw} />)}
    </g>
  );
};

export type Face = 'neutral' | 'worried' | 'smirk' | 'smile' | 'shock' | 'sleepy' | 'sad';
export type Kind = 'soldier' | 'woman' | 'mother' | 'officer' | 'german' | 'volunteer';

const mouth: Record<Face, string> = {
  neutral: 'M92,93 L108,93',
  worried: 'M90,96 C96,89 104,89 110,96',
  smirk: 'M90,93 C98,97 106,95 112,88',
  smile: 'M89,90 C95,98 105,98 111,90',
  shock: ell(100, 95, 6, 7),
  sleepy: 'M93,94 L107,94',
  sad: 'M90,97 C96,90 104,90 110,97',
};

const UNIFORM = { soldier: '#A89F68', woman: '#A89F68', officer: '#8E8A5A', german: '#6F7466', mother: '#9C4A3A', volunteer: '#3E6FA8' };

function bodyDef(kind: Kind, face: Face, pose: string): Def {
  const lines: string[] = [];
  const fills: [string, string][] = [];
  const dots: string[] = [];
  const coat = UNIFORM[kind];
  // torso
  if (kind === 'mother') {
    const dress = 'M72,112 L128,112 L148,284 L52,284 Z';
    fills.push([dress, coat]); lines.push(dress);
  } else if (kind === 'german') {
    const c2 = 'M70,112 L130,112 L142,240 L58,240 Z';
    fills.push([c2, coat]); lines.push(c2); lines.push('M100,112 L100,240');
  } else {
    const torso = 'M72,112 L128,112 L134,206 L66,206 Z';
    fills.push([torso, coat]); lines.push(torso);
    lines.push('M67,182 L133,182');
  }
  // arms
  if (pose !== 'hold') {
    lines.push('M74,118 L54,188', 'M126,118 L146,188');
  } else {
    lines.push('M74,118 L80,170 L112,160', 'M126,118 L130,170 L112,160');
  }
  dots.push(pose !== 'hold' ? ell(54, 192, 6) : ell(112, 160, 7));
  if (pose !== 'hold') dots.push(ell(146, 192, 6));
  // head
  const head = ell(100, 74, 30, 32);
  fills.push([head, C.skin]); lines.push(head);
  // headwear
  if (kind === 'soldier' || kind === 'woman') {
    const cap = 'M68,56 C72,32 128,32 132,54 L128,62 C110,56 90,56 72,62 Z';
    fills.push([cap, C.olive]); lines.push(cap);
  } else if (kind === 'officer') {
    const crown = 'M64,50 C70,30 130,30 136,50 L136,58 L64,58 Z';
    fills.push([crown, C.olive]); lines.push(crown, 'M64,58 L124,66');
  } else if (kind === 'german') {
    const helm = 'M64,62 C64,28 136,28 136,62 L148,74 L52,74 Z';
    fills.push([helm, '#7C827A']); lines.push(helm);
  } else if (kind === 'mother') {
    const scarf = 'M64,74 C60,30 140,30 136,74 L142,104 C120,94 80,94 58,104 Z';
    fills.push([scarf, C.blue]); lines.push(scarf);
  } else if (kind === 'volunteer') {
    const cap = 'M70,56 C72,36 128,36 130,56 L150,60 L70,60 Z';
    fills.push([cap, C.orange]); lines.push(cap);
  }
  if (kind === 'woman') lines.push('M70,64 C64,86 68,100 78,106', 'M130,64 C136,86 132,100 122,106');
  // face
  if (face === 'sleepy') lines.push('M84,76 L94,76', 'M106,76 L116,76');
  else dots.push(ell(89, 76, 3.4), ell(111, 76, 3.4));
  if (face === 'worried' || face === 'sad') lines.push('M82,68 L95,62', 'M118,68 L105,62');
  if (face === 'shock') lines.push('M81,64 C85,56 93,56 97,61', 'M119,64 C115,56 107,56 103,61');
  lines.push(mouth[face]);
  return { lines, fills, dots };
}

function legDef(kind: Kind, side: -1 | 1, valenki = false): Def {
  if (kind === 'mother') return { lines: [] };
  const x = side < 0 ? 80 : 102;
  const top = kind === 'german' ? 236 : 204;
  const leg = `M${x},${top} L${x + 18},${top} L${x + 17},262 L${x + 1},262 Z`;
  const boot = `M${x - 2},258 L${x + 19},258 L${x + 20},288 C${x + 30},288 ${x + 34},292 ${x + 34},296 L${x - 4},296 Z`;
  const trousers = kind === 'german' ? '#5E635A' : kind === 'volunteer' ? '#3B3B3B' : C.olive;
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
          lines: ['M70,200 L140,200 L140,216 L70,216 Z', 'M124,214 L142,214 L144,262 L126,262 Z', 'M122,258 L146,258 L148,284 C158,284 162,288 162,292 L120,292 Z'],
          fills: [['M70,200 L140,200 L140,216 L70,216 Z', C.olive], ['M124,214 L142,214 L144,262 L126,262 Z', C.olive], ['M122,258 L146,258 L148,284 C158,284 162,288 162,292 L120,292 Z', valenki ? '#8E8B86' : '#3A2A1E']],
        }} />
      )}
      <DefDraw def={bodyDef(kind, f, pose)} at={at} dur={dur} />
      {children}
    </g>
  );
};
