import React from 'react';

// Cartoon face drawn in code on top of an object picture (sprite-pixel coordinates).
// White eyes + black pupils + glint, eyelids clipped to the eye with a black lid line, thick round brows,
// "> <" squeeze, simple mouths. Everything scales with r (the object's inscribed disc).
export type Mouth = 'none' | 'smile' | 'grin' | 'frown' | 'o' | 'scream' | 'wavy' | 'flat' | 'happy';
export type FaceP = {
  look?: [number, number]; // pupil direction, -1..1
  lid?: number; // 0 open .. 1 closed
  lidTilt?: number; // deg, + = angry (inner side lower)
  brow?: number; // 0 hidden .. 1 shown
  browAngle?: number; // deg, + angry, - worried
  browRaise?: number; // -1..1
  squeeze?: boolean; // "> <"
  pop?: number; // eye scale (pop-open overshoot)
  mouth?: Mouth;
  mouthOpen?: number;
  happyEyes?: boolean; // "^ ^"
};

export const Face: React.FC<
  FaceP & {id: string; cx: number; cy: number; r: number; ink: number; lidColor: string; spread?: number; eyeSize?: number; mouthY?: number}
> = ({
  id,
  cx,
  cy,
  r,
  ink,
  lidColor,
  spread = 0.36,
  eyeSize = 1,
  mouthY = 0.42,
  look = [0, 0],
  lid = 0,
  lidTilt = 0,
  brow = 0,
  browAngle = 0,
  browRaise = 0,
  squeeze = false,
  pop = 1,
  mouth = 'none',
  mouthOpen = 1,
  happyEyes = false,
}) => {
  const rx = 0.19 * r * eyeSize;
  const ry = 0.245 * r * eyeSize;
  const ey = cy - 0.08 * r;
  const eyes = [-1, 1].map((side) => {
    const ex = cx + side * spread * r;
    const key = `${id}-${side}`;
    if (squeeze) {
      // ">" on the left eye, "<" on the right
      const w = rx * 0.95;
      const h = ry * 0.7;
      const d = side < 0 ? `M ${ex - w} ${ey - h} L ${ex + w} ${ey} L ${ex - w} ${ey + h}` : `M ${ex + w} ${ey - h} L ${ex - w} ${ey} L ${ex + w} ${ey + h}`;
      return <path key={key} d={d} fill="none" stroke="#111" strokeWidth={ink * 1.15} strokeLinecap="round" strokeLinejoin="round" />;
    }
    if (happyEyes) {
      const w = rx * 0.95;
      return (
        <path key={key} d={`M ${ex - w} ${ey + ry * 0.25} Q ${ex} ${ey - ry * 0.9} ${ex + w} ${ey + ry * 0.25}`} fill="none" stroke="#111" strokeWidth={ink * 1.15} strokeLinecap="round" />
      );
    }
    const px = ex + look[0] * rx * 0.42;
    const py = ey + look[1] * ry * 0.38;
    const lidY = ey - ry + 2 * ry * Math.min(lid, 1);
    const tilt = side * -lidTilt; // left eye: inner side = right side
    return (
      <g key={key} transform={`translate(${ex} ${ey}) scale(${pop}) translate(${-ex} ${-ey})`}>
        <clipPath id={`${key}-clip`}>
          <ellipse cx={ex} cy={ey} rx={rx} ry={ry} />
        </clipPath>
        <ellipse cx={ex} cy={ey} rx={rx} ry={ry} fill="#fff" />
        <g clipPath={`url(#${key}-clip)`}>
          <ellipse cx={px} cy={py} rx={rx * 0.52} ry={ry * 0.56} fill="#111" />
          <circle cx={px + rx * 0.2} cy={py - ry * 0.22} r={rx * 0.17} fill="#fff" />
          {lid > 0.01 ? (
            <g transform={`rotate(${-tilt} ${ex} ${lidY})`}>
              <rect x={ex - rx * 2} y={ey - ry * 3} width={rx * 4} height={lidY - (ey - ry * 3)} fill={lidColor} />
              <line x1={ex - rx * 2} y1={lidY} x2={ex + rx * 2} y2={lidY} stroke="#111" strokeWidth={ink} />
            </g>
          ) : null}
        </g>
        <ellipse cx={ex} cy={ey} rx={rx} ry={ry} fill="none" stroke="#111" strokeWidth={ink} />
      </g>
    );
  });
  const brows =
    brow > 0.01
      ? [-1, 1].map((side) => {
          const bx = cx + side * spread * r;
          const by = ey - ry - 0.16 * r - browRaise * 0.1 * r;
          const L = 0.17 * r;
          const ang = side < 0 ? browAngle : -browAngle;
          return (
            <g key={`b${side}`} transform={`rotate(${ang} ${bx} ${by})`} opacity={1}>
              <line x1={bx - L} y1={by} x2={bx + L} y2={by} stroke="#111" strokeWidth={ink * 1.5 * brow} strokeLinecap="round" />
            </g>
          );
        })
      : null;
  const my = cy + mouthY * r;
  const mw = 0.2 * r;
  let m: React.ReactNode = null;
  const stroke = {fill: 'none', stroke: '#111', strokeWidth: ink, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  if (mouth === 'smile') m = <path d={`M ${cx - mw} ${my} Q ${cx} ${my + 0.17 * r} ${cx + mw} ${my}`} {...stroke} />;
  if (mouth === 'grin') m = <path d={`M ${cx - mw * 0.9} ${my + 0.03 * r} Q ${cx + 0.05 * r} ${my + 0.13 * r} ${cx + mw * 1.1} ${my - 0.07 * r}`} {...stroke} />;
  if (mouth === 'frown') m = <path d={`M ${cx - mw * 0.8} ${my + 0.08 * r} Q ${cx} ${my - 0.06 * r} ${cx + mw * 0.8} ${my + 0.08 * r}`} {...stroke} />;
  if (mouth === 'flat') m = <line x1={cx - mw * 0.6} y1={my} x2={cx + mw * 0.6} y2={my} {...stroke} />;
  if (mouth === 'wavy')
    m = <path d={`M ${cx - mw} ${my} q ${mw / 4} ${-0.06 * r} ${mw / 2} 0 t ${mw / 2} 0 t ${mw / 2} 0 t ${mw / 2} 0`} {...stroke} />;
  if (mouth === 'o')
    m = <ellipse cx={cx} cy={my + 0.02 * r} rx={0.075 * r * mouthOpen} ry={0.1 * r * mouthOpen} fill="#6b1a24" stroke="#111" strokeWidth={ink} />;
  if (mouth === 'happy' || mouth === 'scream') {
    const h = (mouth === 'scream' ? 0.2 : 0.14) * r * mouthOpen;
    const w = (mouth === 'scream' ? 0.16 : 0.2) * r;
    const d = mouth === 'happy' ? `M ${cx - w} ${my} L ${cx + w} ${my} Q ${cx + w} ${my + h * 1.6} ${cx} ${my + h * 1.6} Q ${cx - w} ${my + h * 1.6} ${cx - w} ${my} Z` : `M ${cx - w} ${my} Q ${cx} ${my - h * 0.5} ${cx + w} ${my} Q ${cx + w} ${my + h * 1.5} ${cx} ${my + h * 1.5} Q ${cx - w} ${my + h * 1.5} ${cx - w} ${my} Z`;
    m = (
      <g>
        <clipPath id={`${id}-mouth`}>
          <path d={d} />
        </clipPath>
        <path d={d} fill="#6b1a24" />
        <ellipse clipPath={`url(#${id}-mouth)`} cx={cx} cy={my + h * 1.55} rx={w * 0.6} ry={h * 0.55} fill="#ff7d95" />
        <path d={d} fill="none" stroke="#111" strokeWidth={ink} strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g>
      {eyes}
      {brows}
      {m}
    </g>
  );
};
