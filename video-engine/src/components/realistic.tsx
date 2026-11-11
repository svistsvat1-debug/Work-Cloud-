// Semi-realistic illustrated characters & props for thumbnails (still code-drawn SVG, no AI images).
// Shading = gradients + clipped shadow shapes; outlines kept for the hand-drawn feel.
import React, {useId} from 'react';

const INK = '#1d1b18';
const SKIN = '#f1c9a5';
const SKIN_SH = '#d39b78';
const OLIVE = '#5f6b34';
const OLIVE_D = '#3e4621';
const OLIVE_L = '#7d8a47';

type Mood = 'tired' | 'worried' | 'shocked' | 'smug';

const uid = () => useId().replace(/:/g, '');

/** Shared face: eyes, brows, nose, mouth. Head local coords: face oval ~ x[-95..95], y[-110..118]. */
const Face: React.FC<{mood: Mood; look: [number, number]; iris?: string}> = ({mood, look, iris = '#5b4632'}) => {
  const [lx, ly] = look;
  const eye = (cx: number, side: number) => {
    const open = mood === 'shocked' ? 17 : mood === 'tired' ? 7 : mood === 'smug' ? 6 : 12;
    const top = -6 - open;
    const bot = -6 + open * 0.7;
    const d = `M${cx - 26},-6 Q${cx},${top - 4} ${cx + 26},-6 Q${cx},${bot + 4} ${cx - 26},-6 Z`;
    return (
      <g key={cx}>
        <path d={d} fill="#fbf7f0" stroke={INK} strokeWidth={2.5} />
        <clipPath id={`eye${cx}${mood}`}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#eye${cx}${mood})`}>
          <circle cx={cx + lx * 9} cy={-6 + ly * 5} r={11} fill={iris} />
          <circle cx={cx + lx * 9} cy={-6 + ly * 5} r={5.5} fill="#111" />
          <circle cx={cx + lx * 9 + 3.5} cy={-6 + ly * 5 - 4} r={2.6} fill="#fff" />
          {/* upper lid shadow */}
          <path d={`M${cx - 30},${top - 8} L${cx + 30},${top - 8} L${cx + 30},${top + 4} Q${cx},${top + 10} ${cx - 30},${top + 4} Z`} fill={SKIN_SH} opacity={mood === 'tired' ? 0.9 : 0.35} />
        </g>
        {/* heavy upper lid line */}
        <path d={`M${cx - 28},-5 Q${cx},${top - 6} ${cx + 28},-6`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
        {(mood === 'tired' || mood === 'worried') && (
          <path d={`M${cx - 22},${bot + 9} Q${cx},${bot + 16} ${cx + 22},${bot + 8}`} fill="none" stroke="#9c6a52" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
        )}
        {side && null}
      </g>
    );
  };
  const brow =
    mood === 'tired' || mood === 'worried'
      ? ['M-66,-36 Q-44,-44 -16,-52 L-14,-44 Q-42,-34 -64,-28 Z', 'M66,-36 Q44,-44 16,-52 L14,-44 Q42,-34 64,-28 Z']
      : mood === 'shocked'
        ? ['M-66,-50 Q-42,-66 -14,-56 L-16,-48 Q-42,-56 -64,-42 Z', 'M66,-50 Q42,-66 14,-56 L16,-48 Q42,-56 64,-42 Z']
        : ['M-66,-40 Q-42,-52 -14,-44 L-16,-36 Q-42,-42 -64,-32 Z', 'M66,-44 Q42,-58 14,-46 L16,-38 Q42,-48 64,-36 Z'];
  return (
    <g>
      {eye(-40, -1)}
      {eye(40, 1)}
      {brow.map((d, i) => (
        <path key={i} d={d} fill="#3a2a1d" stroke={INK} strokeWidth={1.5} />
      ))}
      {/* nose */}
      <path d="M-2,0 Q-6,26 -16,40 Q-4,50 10,44" fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2,8 Q14,30 14,42" fill="none" stroke={SKIN_SH} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      {/* mouth */}
      {mood === 'tired' && <path d="M-30,76 Q0,68 30,78" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {mood === 'worried' && <path d="M-30,78 Q-15,68 0,76 Q15,84 30,72" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
      {mood === 'shocked' && (
        <g>
          <path d="M-20,64 Q0,56 20,64 Q26,92 0,98 Q-26,92 -20,64 Z" fill="#4a1d1d" stroke={INK} strokeWidth={3.5} />
          <path d="M-12,90 Q0,84 12,90 Q0,96 -12,90 Z" fill="#b5525a" />
        </g>
      )}
      {mood === 'smug' && (
        <g>
          <path d="M-36,64 Q0,100 40,60 Q2,78 -36,64 Z" fill="#5a2020" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-28,66 Q2,76 34,64 L32,70 Q2,82 -26,72 Z" fill="#fff" />
          <path d="M-44,58 Q-40,66 -34,64 M46,52 Q42,62 38,60" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
      {mood !== 'smug' && <path d="M-22,96 Q0,104 22,96" fill="none" stroke={SKIN_SH} strokeWidth={5} strokeLinecap="round" opacity={0.6} />}
    </g>
  );
};

const FACE = 'M-98,-40 C-100,-125 100,-125 98,-40 C99,42 80,100 0,116 C-80,100 -99,42 -98,-40 Z';

/** Head + neck with skin shading. */
const Head: React.FC<{mood: Mood; look: [number, number]; dirt?: boolean; stubble?: boolean; light?: 'left' | 'right'}> = ({mood, look, dirt, stubble, light = 'left'}) => {
  const id = uid();
  const shadowX = light === 'left' ? 1 : -1;
  return (
    <g>
      {/* neck */}
      <path d="M-54,70 L-58,150 L58,150 L54,70 Z" fill={SKIN} stroke={INK} strokeWidth={4} />
      <path d="M-56,96 Q0,136 56,96 L58,150 L-58,150 Z" fill={SKIN_SH} opacity={0.75} />
      {/* ears */}
      <ellipse cx={-98} cy={4} rx={15} ry={27} fill={SKIN} stroke={INK} strokeWidth={4} />
      <ellipse cx={98} cy={4} rx={15} ry={27} fill={SKIN} stroke={INK} strokeWidth={4} />
      <path d={FACE} fill={SKIN} stroke={INK} strokeWidth={5} />
      <clipPath id={`f${id}`}>
        <path d={FACE} />
      </clipPath>
      <g clipPath={`url(#f${id})`}>
        {/* form shadow on the far side + under the cheekbone */}
        <path d={`M${48 * shadowX},-130 Q${118 * shadowX},-20 ${70 * shadowX},130 L${130 * shadowX},130 L${130 * shadowX},-130 Z`} fill={SKIN_SH} opacity={0.85} />
        <ellipse cx={-52 * shadowX} cy={38} rx={22} ry={12} fill="#e8a58a" opacity={0.45} />
        <ellipse cx={52 * shadowX} cy={38} rx={22} ry={12} fill="#c98466" opacity={0.35} />
        {stubble &&
          Array.from({length: 140}).map((_, i) => {
            const a = (i * 137.5 * Math.PI) / 180;
            const r = 40 + ((i * 53) % 60);
            const x = Math.cos(a) * r * 0.95;
            const y = 60 + Math.abs(Math.sin(a)) * r * 0.55;
            return <circle key={i} cx={x} cy={y} r={1.3} fill="#5a4a3e" opacity={0.55} />;
          })}
        {dirt && (
          <g fill="#6d4c2f">
            <path d="M-88,10 Q-60,-2 -50,22 Q-62,40 -86,34 Z" opacity={0.55} />
            <path d="M40,64 Q66,56 72,76 Q56,86 42,78 Z" opacity={0.5} />
            <circle cx={-20} cy={-70} r={7} opacity={0.4} />
            <circle cx={70} cy={-20} r={5} opacity={0.5} />
            <path d="M-40,92 Q-20,86 -8,100" stroke="#6d4c2f" strokeWidth={5} fill="none" opacity={0.5} />
          </g>
        )}
      </g>
      <Face mood={mood} look={look} />
    </g>
  );
};

/** M1 helmet with net + chin straps. */
const Helmet: React.FC = () => {
  const id = uid();
  const dome = 'M-128,-46 C-132,-186 132,-186 128,-46 Z';
  return (
    <g>
      <defs>
        <linearGradient id={`hg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={OLIVE_L} />
          <stop offset="0.55" stopColor={OLIVE} />
          <stop offset="1" stopColor={OLIVE_D} />
        </linearGradient>
        <clipPath id={`hc${id}`}>
          <path d={dome} />
        </clipPath>
      </defs>
      {/* chin straps */}
      <path d="M-108,-40 Q-112,60 -64,108 M108,-40 Q112,60 64,108" fill="none" stroke="#5b4a2c" strokeWidth={9} strokeLinecap="round" />
      <path d={dome} fill={`url(#hg${id})`} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#hc${id})`} stroke="#2f361a" strokeWidth={2.2} opacity={0.75} fill="none">
        {Array.from({length: 12}).map((_, i) => (
          <path key={'a' + i} d={`M${-160 + i * 30},-30 Q${-120 + i * 30},-120 ${-40 + i * 30},-190`} />
        ))}
        {Array.from({length: 12}).map((_, i) => (
          <path key={'b' + i} d={`M${160 - i * 30},-30 Q${120 - i * 30},-120 ${40 - i * 30},-190`} />
        ))}
      </g>
      {/* specular highlight */}
      <path d="M-80,-120 Q-40,-160 20,-158" fill="none" stroke="#c9d39a" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
      {/* rim */}
      <path d="M-146,-50 Q0,-28 146,-50 L142,-30 Q0,-6 -142,-30 Z" fill={OLIVE_D} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

/** German M35 Stahlhelm, front view, field grey, NO insignia. */
const Stahlhelm: React.FC = () => {
  const id = uid();
  const dome = 'M-122,-38 C-128,-186 128,-186 122,-38 Z';
  return (
    <g>
      <defs>
        <linearGradient id={`sg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8d9283" />
          <stop offset="0.55" stopColor="#666b5e" />
          <stop offset="1" stopColor="#43473d" />
        </linearGradient>
      </defs>
      <path d="M-106,-30 Q-112,60 -64,108 M106,-30 Q112,60 64,108" fill="none" stroke="#2e2a24" strokeWidth={8} strokeLinecap="round" />
      {/* flared skirt over the ears and neck */}
      <path d="M-124,-70 L-160,30 Q-120,8 -96,-20 L96,-20 Q120,8 160,30 L124,-70 Z" fill={`url(#sg${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={dome} fill={`url(#sg${id})`} stroke={INK} strokeWidth={5} />
      <path d="M-126,-44 Q0,-20 126,-44" fill="none" stroke={INK} strokeWidth={6} />
      <circle cx={-92} cy={-70} r={5} fill="#3a3d33" stroke={INK} strokeWidth={2} />
      <circle cx={92} cy={-70} r={5} fill="#3a3d33" stroke={INK} strokeWidth={2} />
      <path d="M-80,-120 Q-40,-160 20,-158" fill="none" stroke="#c4c8b8" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
    </g>
  );
};

/** Field jacket shoulders with collar, sling and shading. */
const Jacket: React.FC<{color?: string; dark?: string; light?: string; sling?: boolean; tie?: boolean}> = ({color = OLIVE, dark = OLIVE_D, light = OLIVE_L, sling = true, tie}) => {
  const id = uid();
  const body = 'M-260,470 C-255,270 -175,160 -62,140 L62,140 C175,160 255,270 260,470 Z';
  return (
    <g>
      <defs>
        <linearGradient id={`jg${id}`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <clipPath id={`jc${id}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={`url(#jg${id})`} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#jc${id})`}>
        <path d="M-150,300 Q-140,380 -160,470 M150,300 Q140,380 160,470" stroke={dark} strokeWidth={5} fill="none" opacity={0.8} />
        <path d="M-128,330 h76 v60 h-76 Z M52,330 h76 v60 h-76 Z" fill="none" stroke={dark} strokeWidth={4} />
        <circle cx={-90} cy={345} r={5} fill={dark} />
        <circle cx={90} cy={345} r={5} fill={dark} />
      </g>
      {tie ? (
        <g>
          <path d="M-62,140 L0,214 L62,140 L40,134 L0,178 L-40,134 Z" fill="#efe4c8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-12,178 L12,178 L22,302 L0,328 L-22,302 Z" fill="#6b5536" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ) : (
        <path d="M-64,138 L-6,226 L-32,238 L-100,158 Z M64,138 L6,226 L32,238 L100,158 Z" fill={dark} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      )}
      {sling && (
        <g>
          <path d="M-190,250 L120,470" stroke="#4a3520" strokeWidth={26} strokeLinecap="round" />
          <path d="M-190,250 L120,470" stroke="#6b4e2e" strokeWidth={16} strokeLinecap="round" />
          <path d="M-150,256 L-128,292" stroke="#b8b0a0" strokeWidth={6} />
        </g>
      )}
    </g>
  );
};

/** Front-line rifleman bust. (x,y) = face centre; s = scale (face ~240px tall at s=1). */
export const RealRifleman: React.FC<{x: number; y: number; s?: number; mood?: Mood; look?: [number, number]; light?: 'left' | 'right'; flip?: boolean; army?: 'us' | 'de'}> = ({
  x,
  y,
  s = 1,
  mood = 'tired',
  look = [0.6, 0],
  light = 'left',
  flip,
  army = 'us',
}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    {army === 'de' ? <Jacket color="#5e6656" dark="#3f4639" light="#7c8473" /> : <Jacket />}
    {army === 'de' && (
      <g>
        {/* dark collar with plain grey bars (no eagle, no runes) */}
        <path d="M-66,156 L-6,244 L-32,256 L-100,176 Z M66,156 L6,244 L32,256 L100,176 Z" fill="#2f3a2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M-74,186 L-50,214 M-66,178 L-42,206 M74,186 L50,214 M66,178 L42,206" stroke="#b9bcae" strokeWidth={4} strokeLinecap="round" />
      </g>
    )}
    <Head mood={mood} look={look} dirt stubble light={light} />
    {army === 'de' ? <Stahlhelm /> : <Helmet />}
    {mood !== 'smug' && <path d="M106,-18 q16,26 0,40 q-16,-14 0,-40 Z" fill="#bfe6ff" stroke={INK} strokeWidth={3} />}
  </g>
);

/** Rear-echelon clerk bust: neat hair, side cap, tie. */
export const RealClerk: React.FC<{x: number; y: number; s?: number; mood?: Mood; look?: [number, number]}> = ({x, y, s = 1, mood = 'smug', look = [-0.3, 0]}) => {
  const id = uid();
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <Jacket color="#c8b48a" dark="#9c875e" light="#e0cfa6" sling={false} tie />
      <Head mood={mood} look={look} light="right" />
      {/* hair */}
      <path d="M-98,-30 C-110,-120 -20,-150 40,-128 C90,-112 104,-70 98,-30 C86,-70 40,-84 -10,-80 C-50,-78 -80,-60 -98,-30 Z" fill="#4a3322" stroke={INK} strokeWidth={4} />
      {/* garrison cap, tilted */}
      <defs>
        <linearGradient id={`cg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ddc99d" />
          <stop offset="1" stopColor="#a18b5f" />
        </linearGradient>
      </defs>
      <path d="M-96,-78 Q-70,-146 30,-150 L104,-96 Q20,-110 -96,-78 Z" fill={`url(#cg${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-84,-86 Q0,-114 100,-98" fill="none" stroke="#7e6a42" strokeWidth={4} />
    </g>
  );
};

/** Coffee mug with steam. */
export const Mug: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-16,-80 q-16,-24 0,-48 q16,-24 0,-48 M14,-80 q-16,-24 0,-48 q16,-24 0,-48" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
    <path d="M-46,-62 L46,-62 L40,48 Q0,62 -40,48 Z" fill="#f4f1ea" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M10,-60 L40,-60 L36,44 Q24,50 10,52 Z" fill="#d8d2c4" />
    <path d="M46,-36 Q86,-30 80,4 Q74,30 42,26" fill="none" stroke={INK} strokeWidth={8} />
    <ellipse cx={0} cy={-62} rx={46} ry={10} fill="#6b3f22" stroke={INK} strokeWidth={4} />
  </g>
);

/** Shaded 2.5-ton truck, side view, facing left. */
export const RealTruck: React.FC<{x: number; y: number; s?: number; flip?: boolean; haze?: number}> = ({x, y, s = 1, flip, haze = 0}) => {
  const id = uid();
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} opacity={1 - haze * 0.55}>
      <defs>
        <linearGradient id={`tg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OLIVE_L} />
          <stop offset="1" stopColor={OLIVE_D} />
        </linearGradient>
      </defs>
      <ellipse cx={20} cy={78} rx={190} ry={14} fill="#000" opacity={0.18} />
      {/* canvas cover with ribs */}
      <path d="M-30,-70 Q60,-102 170,-70 L170,30 L-30,30 Z" fill={`url(#tg${id})`} stroke={INK} strokeWidth={5} />
      <path d="M20,-84 L20,30 M70,-90 L70,30 M120,-84 L120,30" stroke={OLIVE_D} strokeWidth={4} opacity={0.8} />
      {/* cab + hood */}
      <path d="M-150,30 L-150,-14 L-120,-20 L-104,-62 L-40,-62 L-36,30 Z" fill={`url(#tg${id})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-98,-54 L-50,-54 L-50,-20 L-112,-20 Z" fill="#cfe2ee" stroke={INK} strokeWidth={4} />
      <path d="M-98,-54 L-80,-54 L-100,-20 L-112,-20 Z" fill="#fff" opacity={0.6} />
      <path d="M-160,30 L180,30 L180,44 L-160,44 Z" fill="#2c2c2c" stroke={INK} strokeWidth={3} />
      {/* white star (US marking) on the door */}
      <path d="M-74,6 l5,-14 l5,14 l-13,-9 h16 Z" fill="#f2f2f2" />
      {[-110, 70, 130].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={50} r={30} fill="#1e1e1e" stroke={INK} strokeWidth={4} />
          <circle cx={wx} cy={50} r={13} fill="#6a6a6a" />
          <circle cx={wx} cy={50} r={5} fill="#2a2a2a" />
        </g>
      ))}
    </g>
  );
};

/** Bold thumbnail lettering: white fill, thick dark outline, drop shadow. */
export const BoldText: React.FC<{text: string; x: number; y: number; size: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; rot?: number}> = ({
  text,
  x,
  y,
  size,
  fill = '#ffffff',
  anchor = 'middle',
  rot = 0,
}) => (
  <g transform={`rotate(${rot},${x},${y})`} fontFamily='"Permanent Marker", cursive' fontSize={size} textAnchor={anchor}>
    <text x={x + size * 0.05} y={y + size * 0.07} fill="#000" opacity={0.45} stroke="#000" strokeWidth={size * 0.2} strokeLinejoin="round">
      {text}
    </text>
    <text x={x} y={y} fill={INK} stroke={INK} strokeWidth={size * 0.2} strokeLinejoin="round">
      {text}
    </text>
    <text x={x} y={y} fill={fill}>
      {text}
    </text>
  </g>
);
