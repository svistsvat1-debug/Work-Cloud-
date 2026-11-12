import React, {useMemo} from 'react';
import {C, FONT_LABEL, FONT_TITLE} from './theme';
import {Drawn, Geo, clamp01, pop} from './draw';
import {line, poly, rect, rrect, ellipse, Stroke} from './rough';
import {iconGeo} from './icons';

export type Mood = 'neutral' | 'shock' | 'happy' | 'sad' | 'angry' | 'sleepy' | 'worried';
export type Variant = 'hero' | 'father' | 'kid' | 'officer' | 'wife' | 'child' | 'para' | 'plain' | 'sailor';
export type Pose = 'down' | 'hold' | 'up' | 'wave' | 'hug';

function bodyGeo(v: Variant, pose: Pose, bust: boolean): {geo: Geo; head: [number, number, number]; hands: [number, number][]} {
  const uni = v === 'wife' ? C.red : v === 'sailor' ? C.white : v === 'child' ? C.lightBlue : C.olive;
  if (bust) {
    const hr = 95;
    const sh = poly([[-150, 30], [-120, -70], [-55, -88], [55, -88], [120, -70], [150, 30]], true);
    return {
      geo: {strokes: [sh, poly([[-30, -88], [0, -40], [30, -88]])], fills: [{pts: sh.pts, color: uni}]},
      head: [0, -88 - hr + 6, hr],
      hands: [[-110, -10], [110, -10]],
    };
  }
  const small = v === 'child' ? 0.62 : v === 'kid' ? 0.93 : 1;
  const k = (n: number) => n * small;
  const hr = k(38);
  const headY = k(-238);
  const shY = k(-196);
  const waistY = k(-98);
  const torso = poly([[-k(38), shY], [k(38), shY], [k(30), waistY], [-k(30), waistY]], true);
  const strokes: Stroke[] = [torso];
  const fills = [{pts: torso.pts, color: uni}];
  if (v === 'wife') {
    const dress = poly([[-k(30), waistY], [k(30), waistY], [k(52), k(-30)], [-k(52), k(-30)]], true);
    strokes.push(dress);
    fills.push({pts: dress.pts, color: C.red});
    strokes.push(line(-k(16), k(-30), -k(18), -4), line(k(16), k(-30), k(18), -4));
  } else {
    strokes.push(line(-k(14), waistY, -k(24), -4), line(k(14), waistY, k(24), -4));
    strokes.push(line(-k(36), -4, -k(14), -4), line(k(14), -4, k(36), -4));
  }
  let hands: [number, number][];
  if (pose === 'hold') hands = [[-k(26), k(-150)], [k(26), k(-150)]];
  else if (pose === 'up') hands = [[-k(48), k(-110)], [k(52), k(-300)]];
  else if (pose === 'wave') hands = [[-k(48), k(-110)], [k(70), k(-260)]];
  else if (pose === 'hug') hands = [[-k(70), k(-150)], [k(70), k(-150)]];
  else hands = [[-k(66), k(-112)], [k(66), k(-112)]];
  const elbow = (hx: number, hy: number, d: number): [number, number] => [(hx + d * k(40)) / 2 + d * k(16), (hy + shY) / 2 + k(4)];
  strokes.push(poly([[-k(38), shY + 4], elbow(hands[0][0], hands[0][1], -1), hands[0]]));
  strokes.push(poly([[k(38), shY + 4], elbow(hands[1][0], hands[1][1], 1), hands[1]]));
  strokes.push(line(0, shY, 0, shY - 2));
  return {geo: {strokes, fills}, head: [0, headY, hr], hands};
}

function headGeo(v: Variant, hx: number, hy: number, r: number, bust: boolean): Geo {
  const head = ellipse(hx, hy, r, r * 1.02);
  const strokes: Stroke[] = [head];
  const fills: Geo['fills'] = [{pts: head.pts, color: C.white, solid: true}];
  const helmetish = v === 'hero' || v === 'father' || v === 'kid' || v === 'para' || v === 'plain';
  if (helmetish) {
    const big = v === 'kid' ? 1.45 : 1.18;
    const rx = r * big;
    const ry = r * big * 0.86;
    const cy = hy - r * 0.18;
    const dome = ellipse(hx, cy, rx, ry, Math.PI, Math.PI * 2, 22);
    strokes.push(dome, line(hx - rx * 1.12, cy + 2, hx + rx * 1.12, cy + 2));
    fills.push({pts: [...dome.pts], color: C.olive});
    if (v === 'para') strokes.push(poly([[hx - r * 0.9, cy], [hx - r * 0.6, hy + r * 0.8], [hx + r * 0.6, hy + r * 0.8], [hx + r * 0.9, cy]]));
  } else if (v === 'officer') {
    const cap = poly([[hx - r * 0.95, hy - r * 0.45], [hx - r * 1.2, hy - r * 1.05], [hx + r * 1.2, hy - r * 1.05], [hx + r * 0.95, hy - r * 0.45]], true);
    strokes.push(cap, line(hx - r * 1.05, hy - r * 0.42, hx + r * 0.2, hy - r * 0.2));
    fills.push({pts: cap.pts, color: C.olive});
  } else if (v === 'sailor') {
    const cap = poly([[hx - r * 0.9, hy - r * 0.55], [hx - r * 0.7, hy - r * 1.0], [hx + r * 0.7, hy - r * 1.0], [hx + r * 0.9, hy - r * 0.55]], true);
    strokes.push(cap);
    fills.push({pts: cap.pts, color: C.white, solid: true});
  } else if (v === 'wife') {
    const hair = poly([[hx - r * 1.05, hy + r * 0.6], [hx - r * 1.15, hy - r * 0.4], [hx - r * 0.5, hy - r * 1.15], [hx + r * 0.5, hy - r * 1.15], [hx + r * 1.15, hy - r * 0.4], [hx + r * 1.05, hy + r * 0.6], [hx + r * 0.75, hy - r * 0.35], [hx - r * 0.75, hy - r * 0.35]], true);
    strokes.push(hair);
    fills.push({pts: hair.pts, color: C.orange});
  }
  return {strokes, fills};
}

export const GI: React.FC<{
  f: number;
  inF: number;
  dF: number;
  x: number;
  y: number;
  s?: number;
  v?: Variant;
  mood?: Mood;
  pose?: Pose;
  bust?: boolean;
  flip?: boolean;
  seed: number;
  sweat?: number; // frame when sweat drops appear
  hold?: string; // icon name or 'card:65' or 'sign:TEXT'
  holdF?: number;
  stripes?: boolean;
  label?: string;
}> = ({f, inF, dF, x, y, s = 1, v = 'hero', mood = 'neutral', pose = 'down', bust = false, flip = false, seed, sweat, hold, holdF, stripes, label}) => {
  const b = useMemo(() => bodyGeo(v, pose, bust), [v, pose, bust]);
  const [hx, hy, hr] = b.head;
  const hg = useMemo(() => headGeo(v, hx, hy, hr, bust), [v, hx, hy, hr, bust]);
  const p = clamp01((f - inF) / Math.max(1, dF));
  const fp = clamp01((f - inF - dF * 0.6) / Math.max(1, dF * 0.6));
  const bob = Math.sin((f + seed) / 13) * 2.2;
  const blink = (f + seed * 7) % 96 < 3 ? 0.15 : 1;
  const er = hr * (mood === 'shock' || mood === 'worried' ? 0.24 : 0.09);
  const fa = clamp01((p - 0.5) * 3);
  const ex = hr * 0.36;
  const ey = hy - hr * 0.02;
  const mouth = () => {
    const my = hy + hr * 0.42;
    const mw = hr * 0.32;
    switch (mood) {
      case 'shock':
        return <ellipse cx={hx} cy={my + 2} rx={hr * 0.16} ry={hr * 0.22} fill={C.ink} />;
      case 'happy':
        return <path d={`M${hx - mw},${my - 4} Q${hx},${my + hr * 0.3} ${hx + mw},${my - 4}`} fill="none" stroke={C.ink} strokeWidth={4 * (bust ? 2 : 1)} strokeLinecap="round" />;
      case 'sad':
      case 'worried':
        return <path d={`M${hx - mw},${my + 6} Q${hx},${my - hr * 0.18} ${hx + mw},${my + 6}`} fill="none" stroke={C.ink} strokeWidth={4 * (bust ? 2 : 1)} strokeLinecap="round" />;
      case 'angry':
        return <path d={`M${hx - mw},${my + 4} L${hx + mw},${my}`} stroke={C.ink} strokeWidth={5 * (bust ? 2 : 1)} strokeLinecap="round" />;
      case 'sleepy':
        return <path d={`M${hx - mw * 0.6},${my} L${hx + mw * 0.6},${my}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />;
      default:
        return <path d={`M${hx - mw * 0.8},${my} Q${hx},${my + hr * 0.08} ${hx + mw * 0.8},${my}`} fill="none" stroke={C.ink} strokeWidth={4 * (bust ? 2 : 1)} strokeLinecap="round" />;
    }
  };
  const eyes = () => {
    if (mood === 'sleepy' || mood === 'happy')
      return [-1, 1].map((d) => <path key={d} d={`M${hx + d * ex - hr * 0.12},${ey} Q${hx + d * ex},${ey + (mood === 'happy' ? -hr * 0.14 : hr * 0.08)} ${hx + d * ex + hr * 0.12},${ey}`} fill="none" stroke={C.ink} strokeWidth={4 * (bust ? 2 : 1)} strokeLinecap="round" />);
    return [-1, 1].map((d) => (
      <g key={d} transform={`translate(${hx + d * ex} ${ey}) scale(1 ${blink})`}>
        {mood === 'shock' || mood === 'worried' ? <circle r={er} fill={C.white} stroke={C.ink} strokeWidth={bust ? 6 : 3} /> : null}
        <circle r={mood === 'shock' || mood === 'worried' ? er * 0.42 : er} fill={C.ink} />
      </g>
    ));
  };
  const brows = () => {
    if (mood !== 'angry' && mood !== 'sad' && mood !== 'worried') return null;
    const by = ey - hr * 0.32;
    const tilt = mood === 'angry' ? 1 : -1;
    return [-1, 1].map((d) => (
      <path key={d} d={`M${hx + d * (ex - hr * 0.2)},${by + tilt * hr * 0.1} L${hx + d * (ex + hr * 0.18)},${by - tilt * hr * 0.06}`} stroke={C.ink} strokeWidth={bust ? 9 : 4} strokeLinecap="round" />
    ));
  };
  const sw = sweat !== undefined ? pop(f, sweat) : 0;
  const holdItem = () => {
    if (!hold) return null;
    const hp = pop(f, holdF ?? inF + dF);
    if (hp <= 0) return null;
    const hcx = (b.hands[0][0] + b.hands[1][0]) / 2;
    const hcy = Math.min(b.hands[0][1], b.hands[1][1]);
    if (hold.startsWith('card:')) {
      const val = hold.slice(5);
      const cw = bust ? 170 : 90, ch = bust ? 120 : 64;
      const cx = bust ? 150 : hcx, cy = bust ? -60 : hcy - 10;
      return (
        <g transform={`translate(${cx} ${cy}) scale(${hp}) rotate(-6)`}>
          <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} fill={C.white} stroke={C.ink} strokeWidth={bust ? 7 : 4} rx={6} />
          <text x={0} y={ch * 0.3} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={ch * 0.82} fill={C.red}>
            {val}
          </text>
        </g>
      );
    }
    if (hold.startsWith('sign:')) {
      const txt = hold.slice(5).split('|');
      const sx = b.hands[1][0], sy = b.hands[1][1];
      return (
        <g transform={`translate(${sx} ${sy}) scale(${hp})`}>
          <line x1={0} y1={0} x2={0} y2={-60} stroke={C.ink} strokeWidth={6} />
          <rect x={-120} y={-170} width={240} height={115} fill={C.white} stroke={C.ink} strokeWidth={5} rx={6} />
          {txt.map((t, i) => (
            <text key={i} x={0} y={-130 + i * 44} textAnchor="middle" fontFamily={FONT_TITLE} fontSize={38} fill={C.red}>
              {t}
            </text>
          ))}
        </g>
      );
    }
    const g = iconGeo(hold);
    return (
      <g transform={`translate(${hcx} ${hcy - 10}) scale(${0.42 * hp})`}>
        <Drawn geo={g} seed={seed + 3} p={1} fp={1} w={9} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * s} ${s})`}>
      <Drawn geo={b.geo} seed={seed} p={p} fp={fp} w={bust ? 9 : 5} />
      {stripes && !bust && fp > 0.3 ? (
        <g transform="translate(-30 -178)" opacity={clamp01((fp - 0.3) * 3)}>
          {[0, 10, 20].map((dy) => (
            <path key={dy} d={`M-10,${dy + 6} L0,${dy} L10,${dy + 6}`} fill="none" stroke={C.yellow} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      ) : null}
      <Drawn geo={hg} seed={seed + 1} p={p} fp={fp} w={bust ? 9 : 5} />
      <g opacity={fa} transform={flip ? `translate(${2 * hx} 0) scale(-1 1)` : undefined}>
        {eyes()}
        {brows()}
        {mouth()}
        {v === 'father' ? <path d={`M${hx - hr * 0.3},${hy + hr * 0.28} Q${hx},${hy + hr * 0.16} ${hx + hr * 0.3},${hy + hr * 0.28}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      </g>
      {sw > 0 ? (
        <g opacity={clamp01(sw)}>
          {[0, 1].map((i) => (
            <path key={i} transform={`translate(${hx + hr * (1.05 + i * 0.25)} ${hy - hr * (0.5 - i * 0.55)}) scale(${(bust ? 2.2 : 1) * sw})`} d="M0,-14 C6,-4 9,2 9,6 A9,9 0 1 1 -9,6 C-9,2 -6,-4 0,-14Z" fill={C.lightBlue} stroke={C.blue} strokeWidth={2.5} />
          ))}
        </g>
      ) : null}
      {holdItem()}
      {label ? (
        <text x={0} y={34} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={40} fill={C.ink} opacity={fa}>
          {label}
        </text>
      ) : null}
    </g>
  );
};
