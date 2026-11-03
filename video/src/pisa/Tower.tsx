import React from 'react';
import {INK} from './util';

/*
 * The tower, drawn in code. Local origin = middle of the base at ground level, y up negative.
 * 8 storeys: ground storey (blind arches + door + the face), 6 open galleries, the bell chamber.
 * Each storey is its own piece so it can fly off / drop in on its own.
 */
export const TW = 280;
export const SH = [150, 104, 104, 104, 104, 104, 104, 112];
export const SB = SH.map((_, i) => -SH.slice(0, i).reduce((a, b) => a + b, 0)); // bottom y of storey i
export const TOWER_H = SH.reduce((a, b) => a + b, 0);

const M = '#f7efdf'; // marble
const MS = 'rgba(150, 110, 60, 0.14)'; // the one soft shade (right side)
const OPEN = '#bea784';
const OPEN_DEEP = '#a98f69';
const BAND = '#fcf7ec';
const FOUND = '#cfc0a5';

const arch = (cx: number, w: number, yb: number, yt: number) => {
  const r = w / 2;
  return `M ${cx - r} ${yb} L ${cx - r} ${yt + r} A ${r} ${r} 0 0 1 ${cx + r} ${yt + r} L ${cx + r} ${yb} Z`;
};

const Gallery: React.FC<{y0: number; h: number; w: number; n: number; ow: number}> = ({y0, h, w, n, ow}) => {
  const y1 = y0 - h;
  const step = (w - 22) / n;
  const xs = Array.from({length: n}, (_, i) => -w / 2 + 11 + step * (i + 0.5));
  return (
    <g>
      <rect x={-w / 2} y={y1} width={w} height={h} fill={M} />
      {xs.map((x, i) => (
        <g key={i}>
          <path d={arch(x, ow, y0 - 10, y1 + 18)} fill={OPEN} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={arch(x + ow * 0.18, ow * 0.5, y0 - 10, y1 + 30)} fill={OPEN_DEEP} />
        </g>
      ))}
      <rect x={w / 2 - w * 0.24} y={y1} width={w * 0.24} height={h} fill={MS} />
      <rect x={-w / 2} y={y1} width={w} height={h} fill="none" stroke={INK} strokeWidth={6} />
      <rect x={-w / 2 - 9} y={y1 - 7} width={w + 18} height={15} rx={4} fill={BAND} stroke={INK} strokeWidth={5.5} />
    </g>
  );
};

export type TowerFace = {
  open: number; // 0 closed .. 1 open (eyelids)
  mode: 'eyes' | 'squeeze' | 'sleep' | 'happy';
  look: [number, number]; // pupils -1..1
  pupil?: number; // pupil size factor
  brows: number; // -1 angry .. 0 neutral .. 1 worried
  browUp?: number; // px raise
  lid?: number; // 0..1 top lid (smug / half)
  winkL?: number; // 0..1 extra close of the left eye (peek)
  pop?: number; // eye scale (pop open with overshoot)
};

const EYE = {rx: 21, ry: 25, y: -102, x: 47};

const TowerEyes: React.FC<{f: TowerFace; id: string}> = ({f, id}) => {
  const s = f.pop ?? 1;
  const xs = [-EYE.x, EYE.x];
  if (f.mode === 'squeeze') {
    return (
      <g>
        {xs.map((x, i) => (
          <path key={i} d={i === 0 ? `M ${x - 13} ${EYE.y - 13} L ${x + 10} ${EYE.y} L ${x - 13} ${EYE.y + 13}` : `M ${x + 13} ${EYE.y - 13} L ${x - 10} ${EYE.y} L ${x + 13} ${EYE.y + 13}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <TowerBrows f={f} />
      </g>
    );
  }
  if (f.mode === 'sleep' || f.mode === 'happy') {
    return (
      <g>
        {xs.map((x, i) =>
          f.mode === 'sleep' ? (
            <path key={i} d={`M ${x - 15} ${EYE.y} Q ${x} ${EYE.y + 13} ${x + 15} ${EYE.y}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          ) : (
            <path key={i} d={`M ${x - 15} ${EYE.y + 6} Q ${x} ${EYE.y - 12} ${x + 15} ${EYE.y + 6}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          ),
        )}
        <TowerBrows f={{...f, brows: f.mode === 'happy' ? 0 : f.brows}} />
      </g>
    );
  }
  return (
    <g>
      {xs.map((x, i) => {
        const open = Math.max(0, Math.min(1, f.open - (i === 0 ? f.winkL ?? 0 : 0)));
        const lid = Math.max(1 - open, f.lid ?? 0);
        const cid = `${id}-e${i}`;
        const pr = 9.5 * (f.pupil ?? 1);
        return (
          <g key={i} transform={`translate(${x} ${EYE.y}) scale(${s})`}>
            <clipPath id={cid}>
              <ellipse rx={EYE.rx} ry={EYE.ry} />
            </clipPath>
            <ellipse rx={EYE.rx} ry={EYE.ry} fill="#ffffff" />
            <g clipPath={`url(#${cid})`}>
              <circle cx={f.look[0] * 8} cy={f.look[1] * 10} r={pr} fill={INK} />
              <circle cx={f.look[0] * 8 - pr * 0.35} cy={f.look[1] * 10 - pr * 0.4} r={pr * 0.32} fill="#ffffff" />
              {lid > 0.001 && (
                <g>
                  <rect x={-30} y={-EYE.ry - 2} width={60} height={(EYE.ry * 2 + 4) * lid} fill="#e3d6bd" />
                  <path d={`M -26 ${-EYE.ry - 2 + (EYE.ry * 2 + 4) * lid} L 26 ${-EYE.ry - 2 + (EYE.ry * 2 + 4) * lid}`} stroke={INK} strokeWidth={5} />
                </g>
              )}
            </g>
            <ellipse rx={EYE.rx} ry={EYE.ry} fill="none" stroke={INK} strokeWidth={6} />
          </g>
        );
      })}
      <TowerBrows f={f} />
    </g>
  );
};

const TowerBrows: React.FC<{f: TowerFace}> = ({f}) => {
  const b = f.brows; // + worried (inner up), - angry (inner down)
  const up = f.browUp ?? 0;
  return (
    <g>
      {[-1, 1].map((side) => {
        const x = side * EYE.x;
        const yIn = EYE.y - 36 - b * 9 - up;
        const yOut = EYE.y - 36 + b * 5 - up;
        const inner = x - side * 16;
        const outer = x + side * 16;
        return <path key={side} d={`M ${outer} ${yOut} Q ${x} ${(yIn + yOut) / 2 - 6} ${inner} ${yIn}`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
};

const GroundStorey: React.FC = () => {
  const h = SH[0];
  return (
    <g>
      <rect x={-TW / 2} y={-h} width={TW} height={h} fill={M} />
      {[-93, 93].map((x) => (
        <path key={x} d={arch(x, 46, -18, -122)} fill="#ece0c9" stroke={INK} strokeWidth={4} />
      ))}
      {/* door */}
      <path d={arch(0, 44, -16, -96)} fill="#8d5b3b" stroke={INK} strokeWidth={5} />
      <path d="M 0 -72 L 0 -16" stroke="#6f452b" strokeWidth={4} />
      <rect x={TW / 2 - TW * 0.24} y={-h} width={TW * 0.24} height={h} fill={MS} />
      <rect x={-TW / 2} y={-h} width={TW} height={h} fill="none" stroke={INK} strokeWidth={6} />
      <rect x={-TW / 2 - 8} y={-18} width={TW + 16} height={18} rx={3} fill={BAND} stroke={INK} strokeWidth={5.5} />
      <rect x={-TW / 2 - 9} y={-h - 7} width={TW + 18} height={15} rx={4} fill={BAND} stroke={INK} strokeWidth={5.5} />
    </g>
  );
};

const BellChamber: React.FC = () => {
  const i = 7;
  const y0 = SB[i];
  const h = SH[i];
  const w = 214;
  return (
    <g>
      <Gallery y0={y0} h={h} w={w} n={3} ow={42} />
      <path d={`M ${-w / 2 + 6} ${y0 - h - 6} Q 0 ${y0 - h - 34} ${w / 2 - 6} ${y0 - h - 6} Z`} fill={BAND} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
    </g>
  );
};

export const Storey: React.FC<{i: number}> = ({i}) => {
  if (i === 0) return <GroundStorey />;
  if (i === 7) return <BellChamber />;
  return <Gallery y0={SB[i]} h={SH[i]} w={TW} n={5} ow={36} />;
};

export type StoreyState = {on: boolean; dy: number; dx?: number; rot?: number; s?: number};

export const Tower: React.FC<{
  storeys: StoreyState[]; // index 0..7
  face?: TowerFace;
  squash?: number; // scaleY about the base
  id?: string;
}> = ({storeys, face, squash = 1, id = 'tw'}) => {
  return (
    <g>
      {/* foundation (below ground, seen in the cut-away) */}
      <rect x={-152} y={-2} width={304} height={48} rx={4} fill={FOUND} stroke={INK} strokeWidth={6} />
      <path d="M -120 22 L -60 22 M -20 30 L 40 30 M 80 18 L 128 18" stroke="#b5a588" strokeWidth={5} strokeLinecap="round" />
      <g transform={`scale(${2 - squash} ${squash})`}>
        {storeys
          .map((s, i) => ({s, i}))
          .filter(({s}) => s.on)
          .reverse()
          .map(({s, i}) => (
            <g key={i} transform={`translate(${s.dx ?? 0} ${s.dy}) rotate(${s.rot ?? 0} 0 ${SB[i] - SH[i] / 2}) translate(0 ${SB[i] - SH[i] / 2}) scale(${s.s ?? 1}) translate(0 ${-(SB[i] - SH[i] / 2)})`}>
              <Storey i={i} />
              {i === 0 && face && <TowerEyes f={face} id={id} />}
            </g>
          ))}
      </g>
    </g>
  );
};
