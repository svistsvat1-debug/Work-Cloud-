import React, {useMemo} from 'react';
import {C, FONT_LABEL} from './theme';
import {Drawn, Geo, clamp01} from './draw';
import {line, poly, rect, ellipse, Stroke} from './rough';

export type ShipType = 'cargo' | 'liner' | 'carrier' | 'warship';

function shipGeo(t: ShipType): Geo {
  const strokes: Stroke[] = [];
  const fills: Geo['fills'] = [];
  if (t === 'carrier') {
    const hull = poly([[-280, -10], [300, -10], [260, 50], [-250, 50]], true);
    const deck = poly([[-300, -30], [320, -30], [320, -10], [-300, -10]], true);
    const island = poly([[120, -30], [120, -95], [175, -95], [185, -30]], true);
    strokes.push(hull, deck, island, line(150, -95, 150, -135), line(135, -120, 165, -120));
    fills.push({pts: hull.pts, color: C.steel}, {pts: deck.pts, color: C.grey}, {pts: island.pts, color: C.steel});
  } else if (t === 'liner') {
    const hull = poly([[-300, -40], [300, -40], [270, 50], [-270, 50]], true);
    const s1 = rect(-220, -90, 430, 50);
    strokes.push(hull, s1, line(-300, 5, 290, 5));
    fills.push({pts: hull.pts, color: C.ink + '00'}, {pts: s1.pts, color: C.white, solid: true});
    fills.push({pts: poly([[-300, 5], [290, 5], [270, 50], [-270, 50]]).pts, color: C.red});
    for (const fx of [-120, 0, 120]) {
      const fn = poly([[fx - 28, -90], [fx - 22, -170], [fx + 30, -170], [fx + 26, -90]], true);
      strokes.push(fn);
      fills.push({pts: fn.pts, color: C.orange});
    }
    for (let i = 0; i < 9; i++) strokes.push(ellipse(-180 + i * 45, -65, 6, 6));
  } else if (t === 'warship') {
    const hull = poly([[-290, -10], [310, -10], [250, 40], [-260, 40]], true);
    const sup = poly([[-80, -10], [-80, -60], [60, -60], [60, -10]], true);
    strokes.push(hull, sup, rect(-20, -110, 40, 50), line(0, -110, 0, -160), line(-160, -25, -230, -40), rect(-180, -32, 50, 22), line(160, -25, 230, -40), rect(130, -32, 50, 22));
    fills.push({pts: hull.pts, color: C.steel}, {pts: sup.pts, color: C.grey});
  } else {
    const hull = poly([[-250, -30], [260, -30], [225, 45], [-225, 45]], true);
    const bridge = rect(-40, -95, 90, 65);
    const funnel = poly([[-5, -95], [-2, -140], [28, -140], [30, -95]], true);
    strokes.push(hull, bridge, funnel, line(-170, -30, -170, -150), line(170, -30, 170, -150), line(-170, -130, -110, -40), line(170, -130, 110, -40));
    fills.push({pts: hull.pts, color: C.steel}, {pts: bridge.pts, color: C.white, solid: true}, {pts: funnel.pts, color: C.ink});
  }
  return {strokes, fills: fills.filter((x) => !x.color.endsWith('00'))};
}

export const Ship: React.FC<{f: number; inF: number; dF: number; x: number; y: number; s?: number; type?: ShipType; seed: number; label?: string; flip?: boolean; smoke?: boolean; wave?: boolean}> = ({
  f, inF, dF, x, y, s = 1, type = 'cargo', seed, label, flip = false, smoke = true, wave = true,
}) => {
  const g = useMemo(() => shipGeo(type), [type]);
  const p = clamp01((f - inF) / Math.max(1, dF));
  const fp = clamp01((f - inF - dF * 0.5) / Math.max(1, dF * 0.7));
  const bob = Math.sin((f + seed) / 17) * 3;
  const tilt = Math.sin((f + seed) / 23) * 0.6;
  const fx = type === 'liner' ? 120 : type === 'cargo' ? 13 : 0;
  const fy = type === 'liner' ? -175 : -145;
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${flip ? -s : s} ${s})`}>
      <Drawn geo={g} seed={seed} p={p} fp={fp} w={6} />
      {wave && p > 0.3 ? (
        <path d="M-330,62 q 30,-14 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0 t 60,0" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" opacity={clamp01((p - 0.3) * 2)} transform={`translate(${(f % 60) - 30} 0)`} />
      ) : null}
      {smoke && fp > 0.5 && type !== 'carrier'
        ? [0, 1, 2].map((i) => {
            const ph = ((f + i * 20) % 60) / 60;
            return <circle key={i} cx={fx - ph * 90} cy={fy - ph * 50} r={10 + ph * 22} fill="none" stroke={C.grey} strokeWidth={4} opacity={(1 - ph) * 0.8} />;
          })
        : null}
      {label ? (
        <text x={0} y={120} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={46} fill={C.ink} transform={flip ? 'scale(-1 1)' : undefined} opacity={clamp01((p - 0.6) * 3)}>
          {label}
        </text>
      ) : null}
    </g>
  );
};
