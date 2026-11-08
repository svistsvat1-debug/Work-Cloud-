import React from 'react';

export const INK = '#111111';

// ---------------------------------------------------------------- faces on the guy (sprite px of guy_hand)
export type Mood = 'curious' | 'ouch' | 'worried' | 'scared';
/** head = [cx, cy, r] in sprite px. The drawing faces 3/4 to the left like the original picture. */
export const GuyFace: React.FC<{head: number[]; mood: Mood; look?: [number, number]; blink?: number}> = ({head, mood, look = [0, 0], blink = 0}) => {
  const [cx, cy, r] = head;
  const eL: [number, number] = [cx - 0.74 * r, cy - 0.03 * r];
  const eR: [number, number] = [cx - 0.22 * r, cy - 0.03 * r];
  const sw = 0.055 * r;
  const ex = 0.065 * r;
  const ey = 0.1 * r * (1 - blink);
  const mouthC: [number, number] = [cx - 0.36 * r, cy + 0.42 * r];
  const lx = look[0] * 0.05 * r;
  const ly = look[1] * 0.05 * r;
  if (mood === 'ouch') {
    const c = 0.11 * r;
    return (
      <g stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* > <  squeezed eyes */}
        <polyline points={`${eL[0] - c},${eL[1] - c} ${eL[0] + c * 0.9},${eL[1]} ${eL[0] - c},${eL[1] + c}`} />
        <polyline points={`${eR[0] + c},${eR[1] - c} ${eR[0] - c * 0.9},${eR[1]} ${eR[0] + c},${eR[1] + c}`} />
        {/* brows pinched down to the middle */}
        <path d={`M ${eL[0] - 0.14 * r} ${eL[1] - 0.25 * r} L ${eL[0] + 0.13 * r} ${eL[1] - 0.17 * r}`} />
        <path d={`M ${eR[0] + 0.14 * r} ${eR[1] - 0.25 * r} L ${eR[0] - 0.13 * r} ${eR[1] - 0.17 * r}`} />
        {/* wide open yelling mouth with tongue */}
        <ellipse cx={mouthC[0]} cy={mouthC[1] + 0.02 * r} rx={0.2 * r} ry={0.17 * r} fill="#2A0E0E" />
        <path d={`M ${mouthC[0] - 0.14 * r} ${mouthC[1] + 0.12 * r} Q ${mouthC[0]} ${mouthC[1] - 0.02 * r} ${mouthC[0] + 0.14 * r} ${mouthC[1] + 0.12 * r} Q ${mouthC[0]} ${mouthC[1] + 0.2 * r} ${mouthC[0] - 0.14 * r} ${mouthC[1] + 0.12 * r} Z`} fill="#F28B9B" stroke="none" />
        <ellipse cx={mouthC[0]} cy={mouthC[1] + 0.02 * r} rx={0.2 * r} ry={0.17 * r} fill="none" />
      </g>
    );
  }
  const browTilt = mood === 'worried' || mood === 'scared' ? 1 : -0.4; // worried = up in the middle
  const browY = mood === 'curious' ? -0.3 * r : -0.27 * r;
  const wide = mood === 'scared';
  return (
    <g stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {wide ? (
        <>
          <ellipse cx={eL[0]} cy={eL[1]} rx={0.14 * r} ry={0.16 * r} fill="#fff" />
          <ellipse cx={eR[0]} cy={eR[1]} rx={0.14 * r} ry={0.16 * r} fill="#fff" />
          <circle cx={eL[0] + lx} cy={eL[1] + ly} r={0.035 * r} fill={INK} stroke="none" />
          <circle cx={eR[0] + lx} cy={eR[1] + ly} r={0.035 * r} fill={INK} stroke="none" />
        </>
      ) : (
        <>
          <ellipse cx={eL[0] + lx} cy={eL[1] + ly} rx={ex} ry={Math.max(ey, 0.012 * r)} fill={INK} stroke="none" />
          <ellipse cx={eR[0] + lx} cy={eR[1] + ly} rx={ex} ry={Math.max(ey, 0.012 * r)} fill={INK} stroke="none" />
          {blink < 0.5 ? (
            <>
              <circle cx={eL[0] + lx - 0.022 * r} cy={eL[1] + ly - 0.04 * r} r={0.018 * r} fill="#fff" stroke="none" />
              <circle cx={eR[0] + lx - 0.022 * r} cy={eR[1] + ly - 0.04 * r} r={0.018 * r} fill="#fff" stroke="none" />
            </>
          ) : null}
        </>
      )}
      {/* brows */}
      <path d={`M ${eL[0] - 0.12 * r} ${eL[1] + browY + browTilt * 0.05 * r} Q ${eL[0]} ${eL[1] + browY - 0.06 * r} ${eL[0] + 0.12 * r} ${eL[1] + browY - browTilt * 0.05 * r}`} />
      <path d={`M ${eR[0] - 0.12 * r} ${eR[1] + browY - browTilt * 0.05 * r} Q ${eR[0]} ${eR[1] + browY - 0.06 * r} ${eR[0] + 0.12 * r} ${eR[1] + browY + browTilt * 0.05 * r}`} />
      {/* mouth */}
      {mood === 'curious' ? (
        <path d={`M ${mouthC[0] - 0.16 * r} ${mouthC[1] - 0.02 * r} Q ${mouthC[0]} ${mouthC[1] + 0.12 * r} ${mouthC[0] + 0.16 * r} ${mouthC[1] - 0.04 * r}`} />
      ) : mood === 'worried' ? (
        <path d={`M ${mouthC[0] - 0.15 * r} ${mouthC[1] + 0.04 * r} q ${0.05 * r} ${-0.06 * r} ${0.1 * r} 0 q ${0.05 * r} ${0.06 * r} ${0.1 * r} 0 q ${0.05 * r} ${-0.06 * r} ${0.1 * r} 0`} />
      ) : (
        <ellipse cx={mouthC[0]} cy={mouthC[1] + 0.03 * r} rx={0.11 * r} ry={0.14 * r} fill="#2A0E0E" />
      )}
    </g>
  );
};

// ---------------------------------------------------------------- sweat drop
export const Sweat: React.FC<{x: number; y: number; size: number; s: number; rot?: number}> = ({x, y, size, s, rot = 0}) => {
  if (s <= 0) return null;
  const k = size * s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <path d="M 0 -1 C 0.35 -0.45 0.62 -0.05 0.62 0.32 C 0.62 0.72 0.32 1 0 1 C -0.32 1 -0.62 0.72 -0.62 0.32 C -0.62 -0.05 -0.35 -0.45 0 -1 Z" fill="#8FD3FF" stroke={INK} strokeWidth={0.12} strokeLinejoin="round" />
      <ellipse cx={-0.22} cy={0.28} rx={0.12} ry={0.22} fill="#fff" />
    </g>
  );
};

// ---------------------------------------------------------------- stars / glints
export const Star: React.FC<{x: number; y: number; r: number; s: number; rot?: number; fill?: string; points?: number; sw?: number}> = ({
  x,
  y,
  r,
  s,
  rot = 0,
  fill = '#FFE14D',
  points = 8,
  sw,
}) => {
  if (s <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points;
    const rr = i % 2 === 0 ? 1 : 0.48;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r * s})`}>
      <polygon points={pts.join(' ')} fill={fill} stroke={INK} strokeWidth={(sw ?? 0.12) / Math.max(s, 0.4)} strokeLinejoin="round" />
    </g>
  );
};

export const Glint: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) => {
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r * s})`}>
      <path d="M 0 -1 Q 0.14 -0.14 1 0 Q 0.14 0.14 0 1 Q -0.14 0.14 -1 0 Q -0.14 -0.14 0 -1 Z" fill="#fff" stroke={INK} strokeWidth={0.1} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- puffs (one merged outline)
export type Puff = {x: number; y: number; r: number};
export const Puffs: React.FC<{puffs: Puff[]; fill: string; ink?: number}> = ({puffs, fill, ink = 8}) => {
  const ps = puffs.filter((p) => p.r > 0.5);
  return (
    <g>
      {ps.map((p, i) => (
        <circle key={`i${i}`} cx={p.x} cy={p.y} r={p.r + ink} fill={INK} />
      ))}
      {ps.map((p, i) => (
        <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.r} fill={fill} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- hive face (hive sprite px)
export const HiveFace: React.FC<{s: number; angry: number; look: [number, number]; blink?: number}> = ({s, angry, look, blink = 0}) => {
  if (s <= 0) return null;
  const eyes: [number, number][] = [
    [520, 470],
    [770, 470],
  ];
  const rx = 86;
  const ry = 100;
  return (
    <g>
      {eyes.map(([x, y], i) => {
        const side = i === 0 ? 1 : -1; // brow slopes down to the middle
        const lid = Math.min(1, 0.35 * angry + blink);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <defs>
              <clipPath id={`hiveeye${i}`}>
                <ellipse cx={0} cy={0} rx={rx} ry={ry} />
              </clipPath>
            </defs>
            <ellipse cx={0} cy={0} rx={rx + 13} ry={ry + 13} fill={INK} />
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#fff" />
            <g clipPath={`url(#hiveeye${i})`}>
              <circle cx={look[0] * 34} cy={look[1] * 30 + 10} r={40} fill={INK} />
              <circle cx={look[0] * 34 - 14} cy={look[1] * 30 - 4} r={11} fill="#fff" />
              {/* angry lid: grey shape from the top, tilted down toward the middle */}
              <polygon
                points={`${-rx - 5},${-ry - 5} ${rx + 5},${-ry - 5} ${rx + 5},${-ry + lid * 2 * ry * (side > 0 ? 1.05 : 0.55)} ${-rx - 5},${-ry + lid * 2 * ry * (side > 0 ? 0.55 : 1.05)}`}
                fill="#C9A35C"
              />
              <line
                x1={-rx - 5}
                y1={-ry + lid * 2 * ry * (side > 0 ? 0.55 : 1.05)}
                x2={rx + 5}
                y2={-ry + lid * 2 * ry * (side > 0 ? 1.05 : 0.55)}
                stroke={INK}
                strokeWidth={12}
              />
            </g>
            {/* thick brow */}
            <path
              d={`M ${-rx * 0.95} ${-ry - 34 - angry * side * 18} L ${rx * 0.95} ${-ry - 34 + angry * side * 18}`}
              stroke={INK}
              strokeWidth={30}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- highlight ring (double stroke = outlined)
export const Ring: React.FC<{cx: number; cy: number; rx: number; ry: number; s: number; rot?: number}> = ({cx, cy, rx, ry, s, rot = 0}) => {
  if (s <= 0) return null;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={24} />
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke="#FFE14D" strokeWidth={12} />
    </g>
  );
};

// ---------------------------------------------------------------- venom drop
export const Drop: React.FC<{x: number; y: number; size: number; s?: number}> = ({x, y, size, s = 1}) => {
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${size * s})`}>
      <path d="M 0 -1 C 0.35 -0.45 0.62 -0.05 0.62 0.32 C 0.62 0.72 0.32 1 0 1 C -0.32 1 -0.62 0.72 -0.62 0.32 C -0.62 -0.05 -0.35 -0.45 0 -1 Z" fill="#D9F26B" stroke={INK} strokeWidth={0.14} strokeLinejoin="round" />
      <ellipse cx={-0.2} cy={0.25} rx={0.1} ry={0.2} fill="#fff" />
    </g>
  );
};

// ---------------------------------------------------------------- credit-card scraper
export const Card: React.FC<{x: number; y: number; rot: number; w?: number; h?: number}> = ({x, y, rot, w = 300, h = 190}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2 - 9} y={-h / 2 - 9} width={w + 18} height={h + 18} rx={30} fill={INK} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill="#4FB3F2" />
    <rect x={-w / 2} y={-h / 2 + 34} width={w} height={36} fill="#2C6FA8" />
    <rect x={-w / 2 + 26} y={h / 2 - 66} width={64} height={44} rx={8} fill="#FFD54A" stroke={INK} strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------- pain / impact lines
export const PainLines: React.FC<{x: number; y: number; s: number; r?: number; rot?: number}> = ({x, y, s, r = 60, rot = 0}) => {
  if (s <= 0) return null;
  const ls = [-60, -20, 20, 60].map((a) => {
    const rad = ((a + rot - 90) * Math.PI) / 180;
    return [Math.cos(rad), Math.sin(rad)];
  });
  return (
    <g stroke={INK} strokeWidth={9} strokeLinecap="round">
      {ls.map(([cx, cy], i) => (
        <line key={i} x1={x + cx * r * (0.9 + 0.3 * s)} y1={y + cy * r * (0.9 + 0.3 * s)} x2={x + cx * r * (0.9 + 1.0 * s)} y2={y + cy * r * (0.9 + 1.0 * s)} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- band-aid
export const Bandage: React.FC<{x: number; y: number; s: number; rot?: number; size?: number}> = ({x, y, s, rot = 0, size = 1}) => {
  if (s <= 0) return null;
  const strip = (a: number, k: number) => (
    <g key={k} transform={`rotate(${a})`}>
      <rect x={-118} y={-38} width={236} height={76} rx={34} fill="#F4C59B" stroke={INK} strokeWidth={9} />
      <rect x={-36} y={-30} width={72} height={60} rx={10} fill="#E8A97A" />
      {[-80, -60, 60, 80].map((dx) => (
        <circle key={dx} cx={dx} cy={0} r={5} fill="#C98457" />
      ))}
    </g>
  );
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * size})`}>{[strip(40, 0), strip(-40, 1)]}</g>;
};

// ---------------------------------------------------------------- exclamation mark
export const Bang: React.FC<{x: number; y: number; s: number; size?: number; rot?: number}> = ({x, y, s, size = 1, rot = 0}) => {
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * size})`}>
      <path d="M -30 -150 L 30 -150 L 18 20 L -18 20 Z" fill="#FF4A3D" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
      <circle cx={0} cy={70} r={30} fill="#FF4A3D" stroke={INK} strokeWidth={12} />
    </g>
  );
};

// ---------------------------------------------------------------- wavy scent line
export const Wavy: React.FC<{x: number; y: number; len: number; t: number; color: string; s: number}> = ({x, y, len, t, color, s}) => {
  if (s <= 0) return null;
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push(`${x + Math.sin(u * 7 + t * 6) * 16 * s},${y - u * len * s}`);
  }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={pts.join(' ')} stroke={INK} strokeWidth={22} />
      <polyline points={pts.join(' ')} stroke={color} strokeWidth={10} />
    </g>
  );
};
