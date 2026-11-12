// Interior props and close-up objects: desk, lamp, papers, telegram, cap with lots, chalkboard, log page,
// folder, calendar, medal box, pen, crate, envelope, window, corridor.
import React from 'react';
import {useShot, wave, clamp, smooth, rnd} from '../engine/core';
import {FONT_TYPE, FONT_STENCIL, FONT_NUM} from '../engine/text';
import {Glow} from '../engine/fx';

export const Desk: React.FC<{y: number; color?: string; edge?: string; x0?: number; x1?: number}> = ({y, color = '#3a2618', edge = '#5a3c26', x0 = -200, x1 = 2120}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={1700} fill={color} />
    <rect x={x0} y={y} width={x1 - x0} height={10} fill={edge} />
    {Array.from({length: 9}).map((_, i) => (
      <path key={i} d={`M${x0} ${y + 40 + i * 70} Q${(x0 + x1) / 2} ${y + 30 + i * 70 + (i % 2 ? 14 : -10)} ${x1} ${y + 44 + i * 70}`} stroke="#000" strokeOpacity={0.12} strokeWidth={3} fill="none" />
    ))}
  </g>
);

/** green-shaded desk lamp with warm pool of light */
export const Lamp: React.FC<{x: number; y: number; s?: number; shade?: string; light?: string}> = ({x, y, s = 1, shade = '#24452f', light = '#ffd896'}) => {
  const {f} = useShot();
  const k = 0.95 + 0.05 * rnd(`lamp${Math.floor(f / 4)}`);
  return (
    <g>
      <Glow x={x} y={y + 120 * s} r={520 * s} color={light} opacity={0.45 * k} />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x={-6} y={0} width={12} height={150} fill="#1d1a16" />
        <ellipse cx={0} cy={150} rx={70} ry={14} fill="#1d1a16" />
        <path d="M-110 30 Q0 -40 110 30 Z" fill={shade} />
        <path d="M-110 30 Q0 -40 110 30" fill="none" stroke="#6f9a7a" strokeOpacity={0.5} strokeWidth={4} />
        <ellipse cx={0} cy={30} rx={110} ry={10} fill={light} opacity={0.8 * k} />
      </g>
    </g>
  );
};

/** sheet of paper; lines = typed text lines (strings) or gray bars */
export const Paper: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  color?: string;
  title?: string;
  lines?: string[];
  bars?: number;
  ink?: string;
  titleSize?: number;
  lineSize?: number;
  reveal?: number; // 0..1 portion of lines shown
}> = ({x, y, w = 520, h = 680, rot = 0, color = '#e8dfc8', title, lines, bars = 0, ink = '#2a2520', titleSize = 44, lineSize = 26, reveal = 1}) => {
  const shown = lines ? Math.ceil(lines.length * reveal) : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} />
      {title && (
        <text x={0} y={-h / 2 + 90} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={titleSize} fill={ink} letterSpacing={3}>
          {title}
        </text>
      )}
      {lines?.slice(0, shown).map((l, i) => (
        <text key={i} x={-w / 2 + 50} y={-h / 2 + (title ? 170 : 80) + i * lineSize * 1.6} fontFamily={FONT_TYPE} fontSize={lineSize} fill={ink}>
          {l}
        </text>
      ))}
      {Array.from({length: bars}).map((_, i) => (
        <rect key={`b${i}`} x={-w / 2 + 50} y={-h / 2 + (title ? 150 : 70) + i * 34} width={(w - 100) * (0.6 + 0.4 * rnd(`pb${i}`))} height={9} fill={ink} opacity={0.35} />
      ))}
    </g>
  );
};

/** red rubber stamp text that thumps in at `at` seconds */
export const RubberStamp: React.FC<{x: number; y: number; text: string; at?: number; rot?: number; size?: number; color?: string}> = ({x, y, text, at = 0.6, rot = -8, size = 64, color = '#a8322a'}) => {
  const {t} = useShot();
  const k = clamp((t - at) / 0.18);
  if (k <= 0) return null;
  const sc = 1.25 - 0.25 * smooth(k);
  const w = text.length * size * 0.72 + 40;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={0.85 * k}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.25} fill="none" stroke={color} strokeWidth={6} />
      <text x={0} y={size * 0.2} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={size} fill={color} letterSpacing={4}>
        {text}
      </text>
    </g>
  );
};

/** telegram slip */
export const Telegram: React.FC<{x: number; y: number; text: string[]; rot?: number; reveal?: number}> = ({x, y, text, rot = -3, reveal = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-330} y={-190} width={680} height={400} fill="#000" opacity={0.3} />
    <rect x={-340} y={-200} width={680} height={400} fill="#e6d7a8" />
    <rect x={-340} y={-200} width={680} height={60} fill="#c9b47c" />
    <text x={0} y={-158} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={34} fill="#3a2f1c" letterSpacing={8}>
      TELEGRAM
    </text>
    {text.map((l, i) => {
      const n = Math.floor(clamp(reveal * text.length - i) * l.length);
      return (
        <text key={i} x={-300} y={-70 + i * 56} fontFamily={FONT_TYPE} fontSize={38} fill="#2a2418" letterSpacing={2}>
          {l.slice(0, n)}
        </text>
      );
    })}
  </g>
);

/** officer's peaked cap upside down, with folded paper lots inside */
export const CapWithLots: React.FC<{x: number; y: number; s?: number; color?: string; lots?: number; lift?: number}> = ({x, y, s = 1, color = '#1c2230', lots = 4, lift = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={40} rx={200} ry={40} fill="#000" opacity={0.3} />
    <path d="M-170 0 Q-160 80 0 86 Q160 80 170 0 Z" fill={color} />
    <ellipse cx={0} cy={0} rx={170} ry={42} fill="#0e121a" />
    {Array.from({length: lots}).map((_, i) => (
      <g key={i} transform={`translate(${-90 + i * 60} ${-6 - (i === 1 ? lift : 0)}) rotate(${-20 + i * 14})`}>
        <rect x={-34} y={-14} width={68} height={28} fill="#e8dfc8" />
        <line x1={-34} y1={0} x2={34} y2={0} stroke="#b9ae94" strokeWidth={2} />
      </g>
    ))}
    <path d="M-170 0 Q0 -50 170 0" fill="none" stroke="#c9a24a" strokeWidth={6} strokeOpacity={0.7} />
  </g>
);

/** chalkboard with arbitrary children drawn in chalk */
export const Chalkboard: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode}> = ({x, y, w, h, children}) => (
  <g>
    <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} fill="#4a3222" />
    <rect x={x} y={y} width={w} height={h} fill="#26332c" />
    <rect x={x} y={y} width={w} height={h} fill="#fff" opacity={0.03} />
    {children}
  </g>
);

/** pencil tally / crossing on a log page */
export const LogPage: React.FC<{x: number; y: number; marks: number; crossed: number; reveal?: number; title?: string}> = ({x, y, marks, crossed, reveal = 1, title}) => {
  const cols = 9;
  return (
    <g transform={`translate(${x} ${y}) rotate(-2)`}>
      <rect x={-470} y={-300} width={960} height={620} fill="#000" opacity={0.3} />
      <rect x={-480} y={-310} width={960} height={620} fill="#e4dbc3" />
      {Array.from({length: 14}).map((_, i) => (
        <line key={i} x1={-480} y1={-250 + i * 40} x2={480} y2={-250 + i * 40} stroke="#8aa0b5" strokeOpacity={0.35} strokeWidth={2} />
      ))}
      <line x1={-400} y1={-310} x2={-400} y2={310} stroke="#b45a4a" strokeOpacity={0.4} strokeWidth={2} />
      {title && (
        <text x={-370} y={-262} fontFamily={FONT_TYPE} fontSize={34} fill="#3a3229">
          {title}
        </text>
      )}
      {Array.from({length: marks}).map((_, i) => {
        const cx = -330 + (i % cols) * 85;
        const cy = -170 + Math.floor(i / cols) * 120;
        const isX = i < crossed && reveal * crossed > i;
        return (
          <g key={i}>
            <line x1={cx} y1={cy - 34} x2={cx} y2={cy + 34} stroke="#3a3229" strokeWidth={5} strokeLinecap="round" />
            {isX && <line x1={cx - 30} y1={cy + 30} x2={cx + 30} y2={cy - 30} stroke="#3a3229" strokeWidth={5} strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

export const Folder: React.FC<{x: number; y: number; rot?: number; label?: string}> = ({x, y, rot = -4, label}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-390} y={-250} width={800} height={540} fill="#000" opacity={0.3} />
    <path d="M-400 -260 L-120 -260 L-90 -300 L120 -300 L150 -260 L400 -260 L400 260 L-400 260Z" fill="#b89a62" />
    <rect x={-400} y={-230} width={800} height={490} fill="#c8aa70" />
    {label && (
      <text x={-340} y={-160} fontFamily={FONT_TYPE} fontSize={34} fill="#3a2f1c" letterSpacing={2}>
        {label}
      </text>
    )}
  </g>
);

/** wall calendar whose year flips between from..to across the shot */
export const YearFlip: React.FC<{x: number; y: number; from: number; to: number; start?: number; end?: number}> = ({x, y, from, to, start = 0.2, end = 0.8}) => {
  const {p} = useShot();
  const k = smooth(clamp((p - start) / (end - start)));
  const year = Math.round(from + (to - from) * k);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-150} y={-180} width={300} height={360} fill="#000" opacity={0.3} transform="translate(10 12)" />
      <rect x={-150} y={-180} width={300} height={360} fill="#e9e2cf" />
      <rect x={-150} y={-180} width={300} height={70} fill="#9a3a2c" />
      {[-90, -30, 30, 90].map((cx) => (
        <circle key={cx} cx={cx} cy={-180} r={10} fill="#2a2420" />
      ))}
      <text x={0} y={60} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={120} fill="#2a2420">
        {year}
      </text>
    </g>
  );
};

/** empty medal box, open */
export const MedalBox: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={10} cy={110} rx={190} ry={22} fill="#000" opacity={0.35} />
    <path d="M-160 -20 L160 -20 L170 100 L-170 100Z" fill="#3b1d24" />
    <path d="M-150 -10 L150 -10 L156 86 L-156 86Z" fill="#6a2c36" />
    <path d="M-150 -10 L150 -10 L150 -150 L-150 -150Z" fill="#3b1d24" transform="skewX(-12)" />
    <path d="M-40 30 Q0 10 40 30 L30 60 Q0 50 -30 60Z" fill="#4e1f28" />
  </g>
);

/** fountain pen that writes a short signature line between start..end */
export const PenSign: React.FC<{x: number; y: number; start?: number; end?: number; ink?: string}> = ({x, y, start = 0.2, end = 0.7, ink = '#1d2a4a'}) => {
  const {p} = useShot();
  const k = clamp((p - start) / (end - start));
  const L = 2000;
  const d = `M0 0 C40 -40 60 30 100 -10 S160 -50 190 0 S260 20 300 -20 S380 -30 420 -5`;
  const px = 420 * k;
  const py = -10 * Math.sin(k * 12);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={d} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - k)} pathLength={L} />
      <g transform={`translate(${px} ${py}) rotate(-35)`}>
        <path d="M0 0 L-10 -40 L10 -40Z" fill="#c9a24a" />
        <rect x={-14} y={-260} width={28} height={220} rx={10} fill="#141414" />
        <rect x={-14} y={-150} width={28} height={10} fill="#c9a24a" />
      </g>
    </g>
  );
};

export const Crate: React.FC<{x: number; y: number; w?: number; h?: number; text?: string; text2?: string; color?: string}> = ({x, y, w = 420, h = 260, text, text2, color = '#7a5a36'}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h} width={w} height={h} fill={color} />
    {Array.from({length: 4}).map((_, i) => (
      <line key={i} x1={-w / 2} y1={-h + (i + 1) * (h / 5)} x2={w / 2} y2={-h + (i + 1) * (h / 5)} stroke="#000" strokeOpacity={0.18} strokeWidth={3} />
    ))}
    <rect x={-w / 2} y={-h} width={22} height={h} fill="#000" opacity={0.18} />
    <rect x={w / 2 - 22} y={-h} width={22} height={h} fill="#000" opacity={0.18} />
    {text && (
      <text x={0} y={-h / 2 + (text2 ? -6 : 22)} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={h * 0.24} fill="#1e140a" opacity={0.85} letterSpacing={4}>
        {text}
      </text>
    )}
    {text2 && (
      <text x={0} y={-h / 2 + 64} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={h * 0.17} fill="#1e140a" opacity={0.85} letterSpacing={4}>
        {text2}
      </text>
    )}
  </g>
);

export const Envelope: React.FC<{x: number; y: number; stamp?: string; rot?: number}> = ({x, y, stamp, rot = -3}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-390} y={-210} width={800} height={440} fill="#000" opacity={0.3} />
    <rect x={-400} y={-220} width={800} height={440} fill="#d9c9a0" />
    <path d="M-400 -220 L0 40 L400 -220" fill="none" stroke="#b8a479" strokeWidth={4} />
    <circle cx={0} cy={40} r={46} fill="#8c2a22" />
    <circle cx={0} cy={40} r={30} fill="none" stroke="#5e1a14" strokeWidth={4} />
    {stamp && <RubberStamp x={0} y={-110} text={stamp} at={0.5} size={46} rot={-4} />}
  </g>
);

/** window frame (dark mullions) over whatever is drawn behind */
export const WindowFrame: React.FC<{x: number; y: number; w: number; h: number; color?: string}> = ({x, y, w, h, color = '#120f0c'}) => (
  <g fill={color}>
    <path d={`M-300 -300 H2300 V1400 H-300Z M${x} ${y} V${y + h} H${x + w} V${y}Z`} fillRule="evenodd" />
    <rect x={x + w / 2 - 8} y={y} width={16} height={h} />
    <rect x={x} y={y + h / 2 - 8} width={w} height={16} />
  </g>
);

/** pinned list of names with a finger tracing down */
export const NameList: React.FC<{x: number; y: number; rows?: number}> = ({x, y, rows = 14}) => {
  const {p} = useShot();
  const k = smooth(clamp((p - 0.15) / 0.7));
  return (
    <g transform={`translate(${x} ${y}) rotate(1.5)`}>
      <rect x={-330} y={-420} width={680} height={860} fill="#000" opacity={0.3} />
      <rect x={-340} y={-430} width={680} height={860} fill="#e3d9bf" />
      <circle cx={0} cy={-405} r={12} fill="#8c2a22" />
      {Array.from({length: rows}).map((_, i) => (
        <g key={i}>
          <rect x={-280} y={-350 + i * 54} width={30} height={14} fill="#2a241c" opacity={0.6} />
          <rect x={-230} y={-350 + i * 54} width={200 + rnd(`nl${i}`) * 260} height={14} fill="#2a241c" opacity={0.45} />
        </g>
      ))}
      {/* pencil tracing down the list */}
      <g transform={`translate(${-60} ${-330 + k * (rows - 2) * 54}) rotate(-35)`}>
        <path d="M0 0 L-14 -40 L14 -40Z" fill="#e2c49a" />
        <path d="M-4 -12 L4 -12 L0 0Z" fill="#2a241c" />
        <rect x={-14} y={-300} width={28} height={260} fill="#c99a2e" />
        <rect x={-14} y={-330} width={28} height={30} fill="#b25a4a" />
      </g>
    </g>
  );
};
