import React from 'react';

export type Puff = {x: number; y: number; r: number};

// Smoke / steam cluster with ONE merged outline: all ink circles first, then all fill circles.
export const PuffCluster: React.FC<{puffs: Puff[]; fill: string; ink?: number; shade?: string}> = ({puffs, fill, ink = 5, shade}) => {
  const vis = puffs.filter((p) => p.r > 0.5);
  return (
    <g>
      {vis.map((p, i) => (
        <circle key={`i${i}`} cx={p.x} cy={p.y} r={p.r + ink} fill="#000" />
      ))}
      {vis.map((p, i) => (
        <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.r} fill={fill} />
      ))}
      {shade
        ? vis.map((p, i) => <circle key={`s${i}`} cx={p.x + p.r * 0.18} cy={p.y + p.r * 0.22} r={p.r * 0.62} fill={shade} />)
        : null}
    </g>
  );
};
