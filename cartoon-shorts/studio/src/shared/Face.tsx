import React from 'react';

// Cartoon eye for objects that come alive: white ellipse + pupil + glint, eyelid clipped to the eye,
// thick brow. open: 0..1 (scale pop), lid: 0 (open) .. 1 (closed), squeeze: draws "> <" chevrons instead.
export const Eye: React.FC<{
  x: number;
  y: number;
  r: number;
  open: number;
  lid?: number;
  lidTilt?: number; // degrees, + = angry inner-down
  look?: [number, number]; // -1..1
  squeeze?: boolean;
  side?: 1 | -1; // 1 = right eye (chevron points left)
  brow?: number; // brow lift in r units, NaN = no brow
  browTilt?: number;
  ink?: number;
}> = ({x, y, r, open, lid = 0, lidTilt = 0, look = [0, 0], squeeze = false, side = 1, brow = 0.55, browTilt = 0, ink = 0.16}) => {
  if (open <= 0.001) return null;
  const sw = r * ink;
  const id = `eyeclip-${Math.round(x)}-${Math.round(y)}`;
  if (squeeze) {
    const d = side === 1 ? -1 : 1;
    return (
      <g transform={`translate(${x} ${y}) scale(${open})`}>
        <path
          d={`M ${-0.55 * r * d} ${-0.5 * r} L ${0.45 * r * d} 0 L ${-0.55 * r * d} ${0.5 * r}`}
          fill="none"
          stroke="#000"
          strokeWidth={sw * 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  const rx = r * 0.82;
  const ry = r;
  return (
    <g transform={`translate(${x} ${y}) scale(${open})`}>
      <defs>
        <clipPath id={id}>
          <ellipse cx={0} cy={0} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#FEFDFD" stroke="#000" strokeWidth={sw} />
      <g clipPath={`url(#${id})`}>
        <ellipse cx={look[0] * rx * 0.38} cy={look[1] * ry * 0.38} rx={rx * 0.42} ry={ry * 0.46} fill="#000" />
        <circle cx={look[0] * rx * 0.38 + rx * 0.14} cy={look[1] * ry * 0.38 - ry * 0.16} r={r * 0.13} fill="#fff" />
        {lid > 0.001 ? (
          <g transform={`rotate(${lidTilt * side})`}>
            <rect x={-rx * 1.6} y={-ry * 1.6} width={rx * 3.2} height={ry * 0.6 + 2 * ry * lid} fill="#D9D4D0" />
            <line x1={-rx * 1.6} x2={rx * 1.6} y1={-ry + 2 * ry * lid} y2={-ry + 2 * ry * lid} stroke="#000" strokeWidth={sw} />
          </g>
        ) : null}
      </g>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke="#000" strokeWidth={sw} />
      {Number.isFinite(brow) ? (
        <path
          d={`M ${-rx * 0.9} ${-ry - r * brow + browTilt * side * r * 0.25} Q 0 ${-ry - r * brow - r * 0.25} ${rx * 0.9} ${-ry - r * brow - browTilt * side * r * 0.25}`}
          fill="none"
          stroke="#000"
          strokeWidth={sw * 1.5}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};
