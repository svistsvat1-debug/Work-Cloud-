// Scenery: hills, mountains, islands, palms, grass, houses, pier, cranes, hangar, trees.
import React from 'react';
import {useShot, rnd, wave, W, H} from '../engine/core';

/** smooth rolling band from y down to bottom */
export const Hills: React.FC<{y: number; amp?: number; color: string; seed?: string; rim?: string; n?: number; x0?: number; x1?: number}> = ({
  y,
  amp = 40,
  color,
  seed = 'h',
  rim,
  n = 6,
  x0 = -200,
  x1 = W + 200,
}) => {
  const step = (x1 - x0) / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * step;
    const ya = y - amp * rnd(`${seed}${i}`);
    const yb = y - amp * rnd(`${seed}${i + 1}`);
    d += ` C${xa + step * 0.4} ${ya} ${xa + step * 0.6} ${yb} ${xa + step} ${yb}`;
  }
  const top = d;
  d += ` L${x1} ${H + 300} L${x0} ${H + 300} Z`;
  return (
    <g>
      <path d={d} fill={color} />
      {rim && <path d={top} fill="none" stroke={rim} strokeWidth={3} strokeOpacity={0.4} />}
    </g>
  );
};

/** organic mountain ridge: big peaks with sub-shoulders and curved slopes */
export const Mountains: React.FC<{y: number; h?: number; color: string; seed?: string; peaks?: number; snow?: string; x0?: number; x1?: number; rim?: string}> = ({
  y,
  h = 220,
  color,
  seed = 'mt',
  peaks = 5,
  snow,
  x0 = -200,
  x1 = W + 200,
  rim,
}) => {
  const step = (x1 - x0) / peaks;
  let d = `M${x0} ${y - h * 0.15}`;
  const tops: [number, number][] = [];
  for (let i = 0; i < peaks; i++) {
    const a = x0 + i * step;
    const px = a + step * (0.35 + rnd(`${seed}x${i}`) * 0.3);
    const ph = y - h * (0.5 + rnd(`${seed}h${i}`) * 0.5);
    const sh = y - h * (0.25 + rnd(`${seed}s${i}`) * 0.25); // shoulder
    const vy = y - h * (0.08 + rnd(`${seed}v${i}`) * 0.15); // valley after
    const sx = a + step * 0.18;
    d += ` Q${sx} ${sh + 10} ${sx + step * 0.08} ${sh}`;
    d += ` Q${px - step * 0.12} ${ph + h * 0.12} ${px} ${ph}`;
    d += ` Q${px + step * 0.1} ${ph + h * 0.1} ${px + step * 0.22} ${(ph + vy) / 2 + 10}`;
    d += ` Q${a + step * 0.92} ${vy} ${a + step} ${vy}`;
    tops.push([px, ph]);
  }
  d += ` L${x1} ${H + 300} L${x0} ${H + 300}Z`;
  return (
    <g>
      <path d={d} fill={color} />
      {rim && tops.map(([px, ph], i) => <path key={i} d={`M${px} ${ph} q${-step * 0.08} ${h * 0.12} ${-step * 0.2} ${h * 0.3}`} fill="none" stroke={rim} strokeWidth={3} strokeOpacity={0.3} />)}
      {snow && tops.map(([px, ph], i) => <path key={`s${i}`} d={`M${px} ${ph} q-24 22 -40 44 l14 -4 l12 10 l14 -9 l12 6 l14 -8 q-10 -20 -26 -39z`} fill={snow} opacity={0.85} />)}
    </g>
  );
};

/** low island bump on the horizon */
export const Island: React.FC<{x: number; y: number; w: number; h: number; color: string; palms?: number; palmColor?: string}> = ({x, y, w, h, color, palms = 0, palmColor}) => (
  <g>
    <path d={`M${x - w / 2} ${y} C${x - w / 3} ${y - h} ${x + w / 4} ${y - h * 1.1} ${x + w / 2} ${y} Z`} fill={color} />
    {Array.from({length: palms}).map((_, i) => (
      <Palm key={i} x={x - w / 3 + (i + 0.5) * ((w * 0.66) / palms)} y={y - h * 0.6} h={h * 1.4} color={palmColor ?? color} seed={`ip${i}`} />
    ))}
  </g>
);

export const Palm: React.FC<{x: number; y: number; h: number; color: string; seed?: string; lean?: number}> = ({x, y, h, color, seed = 'p', lean = 0.15}) => {
  const {t} = useShot();
  const sway = 3 * wave(t, 4 + rnd(seed) * 2, rnd(seed + 'ph'));
  const tx = x + h * lean;
  const ty = y - h;
  return (
    <g fill={color}>
      <path d={`M${x - 5} ${y} Q${x + h * lean * 0.3} ${y - h * 0.5} ${tx - 3} ${ty} L${tx + 3} ${ty} Q${x + h * lean * 0.3 + 8} ${y - h * 0.5} ${x + 5} ${y}Z`} />
      {[-150, -110, -60, -20, 20, 60, 100].map((a, i) => (
        <path
          key={i}
          transform={`translate(${tx} ${ty}) rotate(${a + sway})`}
          d={`M0 0 Q${h * 0.25} ${-h * 0.08} ${h * 0.42} ${h * 0.1} Q${h * 0.22} ${-h * 0.0} 0 ${4}Z`}
        />
      ))}
    </g>
  );
};

/** swaying grass tufts in the foreground */
export const Grass: React.FC<{y: number; color: string; n?: number; h?: number; seed?: string; x0?: number; x1?: number}> = ({y, color, n = 60, h = 40, seed = 'g', x0 = -100, x1 = W + 100}) => {
  const {t} = useShot();
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const x = x0 + rnd(`${seed}x${i}`) * (x1 - x0);
        const hh = h * (0.5 + rnd(`${seed}h${i}`));
        const sw = 6 * wave(t, 3 + rnd(`${seed}s${i}`) * 2, rnd(`${seed}p${i}`));
        const yy = y + rnd(`${seed}y${i}`) * 30;
        return <path key={i} d={`M${x - 6} ${yy} Q${x - 2} ${yy - hh * 0.6} ${x + sw} ${yy - hh} Q${x + 2} ${yy - hh * 0.5} ${x + 6} ${yy}Z`} />;
      })}
    </g>
  );
};

/** row of traditional low Japanese houses (tiled roofs), optional lit windows */
export const Houses: React.FC<{x: number; y: number; n?: number; color: string; lit?: string; seed?: string; scale?: number}> = ({x, y, n = 6, color, lit, seed = 'hs', scale = 1}) => {
  const {t} = useShot();
  let cx = x;
  return (
    <g fill={color}>
      {Array.from({length: n}).map((_, i) => {
        const w = (120 + rnd(`${seed}w${i}`) * 90) * scale;
        const h = (60 + rnd(`${seed}h${i}`) * 40) * scale;
        const rh = h * 0.55;
        const x0 = cx;
        cx += w + 8 * scale;
        return (
          <g key={i}>
            <rect x={x0 + w * 0.06} y={y - h} width={w * 0.88} height={h} />
            <path d={`M${x0 - w * 0.08} ${y - h + 4} Q${x0 + w * 0.1} ${y - h - rh * 0.4} ${x0 + w * 0.25} ${y - h - rh} L${x0 + w * 0.75} ${y - h - rh} Q${x0 + w * 0.9} ${y - h - rh * 0.4} ${x0 + w * 1.08} ${y - h + 4}Z`} />
            {lit && rnd(`${seed}l${i}`) > 0.35 && (
              <rect x={x0 + w * 0.35} y={y - h * 0.7} width={w * 0.22} height={h * 0.32} fill={lit} opacity={0.75 + 0.2 * wave(t, 3.7, i * 0.3)} />
            )}
          </g>
        );
      })}
    </g>
  );
};

export const Pier: React.FC<{x: number; y: number; w: number; color: string; posts?: number}> = ({x, y, w, color, posts = 8}) => (
  <g fill={color}>
    <rect x={x} y={y - 16} width={w} height={16} />
    {Array.from({length: posts}).map((_, i) => (
      <rect key={i} x={x + 10 + i * ((w - 30) / (posts - 1))} y={y} width={10} height={60} />
    ))}
  </g>
);

/** dockside crane; `swing` animates the boom slightly */
export const Crane: React.FC<{x: number; y: number; h?: number; color: string; swing?: number; hookY?: number}> = ({x, y, h = 360, color, swing = 3, hookY = 160}) => {
  const {t} = useShot();
  const a = -20 + swing * wave(t, 9);
  return (
    <g fill={color} stroke={color}>
      <path d={`M${x - 40} ${y} L${x - 12} ${y - h} L${x + 12} ${y - h} L${x + 40} ${y}Z`} fill="none" strokeWidth={8} />
      <path d={`M${x - 26} ${y - h * 0.5} L${x + 26} ${y - h * 0.5}`} strokeWidth={6} />
      <rect x={x - 30} y={y - h - 40} width={60} height={44} />
      <g transform={`translate(${x} ${y - h - 20}) rotate(${a})`}>
        <rect x={0} y={-6} width={360} height={12} />
        <line x1={340} y1={0} x2={340} y2={hookY} strokeWidth={3} />
        <rect x={326} y={hookY} width={28} height={16} />
      </g>
    </g>
  );
};

export const Hangar: React.FC<{x: number; y: number; w: number; h: number; color: string; doorLight?: string}> = ({x, y, w, h, color, doorLight}) => (
  <g>
    <path d={`M${x} ${y} L${x} ${y - h * 0.6} Q${x + w / 2} ${y - h * 1.15} ${x + w} ${y - h * 0.6} L${x + w} ${y}Z`} fill={color} />
    {doorLight && <rect x={x + w * 0.18} y={y - h * 0.55} width={w * 0.64} height={h * 0.55} fill={doorLight} />}
  </g>
);

export const Tree: React.FC<{x: number; y: number; h: number; color: string; seed?: string}> = ({x, y, h, color, seed = 't'}) => {
  const {t} = useShot();
  const sw = 2 * wave(t, 5, rnd(seed));
  return (
    <g fill={color} transform={`rotate(${sw} ${x} ${y})`}>
      <rect x={x - 5} y={y - h * 0.45} width={10} height={h * 0.45} />
      <ellipse cx={x} cy={y - h * 0.62} rx={h * 0.28} ry={h * 0.3} />
      <ellipse cx={x - h * 0.15} cy={y - h * 0.48} rx={h * 0.2} ry={h * 0.17} />
      <ellipse cx={x + h * 0.16} cy={y - h * 0.5} rx={h * 0.2} ry={h * 0.17} />
    </g>
  );
};

/** cave mouth in a hillside */
export const Cave: React.FC<{x: number; y: number; w: number; h: number; color: string; inner: string}> = ({x, y, w, h, color, inner}) => (
  <g>
    <path d={`M${x - w} ${y} Q${x - w * 0.8} ${y - h * 1.6} ${x} ${y - h * 1.7} Q${x + w * 0.9} ${y - h * 1.6} ${x + w} ${y}Z`} fill={color} />
    <path d={`M${x - w * 0.55} ${y} Q${x - w * 0.5} ${y - h} ${x} ${y - h} Q${x + w * 0.5} ${y - h} ${x + w * 0.55} ${y}Z`} fill={inner} />
  </g>
);
