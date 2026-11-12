import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';

// Realistic illustrated thumbnail (code only): a GI at the front, a long supply column behind him at sunset, "ONLY 14%".
// Objects: (1) the GI, (2) the column on the road (one group), (3) text + arrow.

const useAnton = () => {
  const [h] = useState(() => delayRender('anton'));
  useEffect(() => {
    const f = new FontFace('Anton', `url(${staticFile('fonts/Anton-Regular.ttf')})`);
    f.load()
      .then((ff) => {
        document.fonts.add(ff);
        continueRender(h);
      })
      .catch(() => continueRender(h));
  }, [h]);
};

const rnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

// tree-line / hedgerow silhouette made of irregular crowns
const ridge = (yBase: number, amp: number, seed: number, x0 = -60, x1 = 1980, bottom = 1100) => {
  const r = rnd(seed);
  let x = x0;
  let d = `M${x0},${bottom} L${x0},${yBase}`;
  while (x < x1) {
    const w = amp * (0.9 + r() * 1.6);
    const h = amp * (0.35 + r() * 0.8);
    const y = yBase - r() * amp * 0.25;
    d += ` Q${x + w * 0.1},${y - h} ${x + w * 0.5},${y - h * 0.95} Q${x + w * 0.9},${y - h} ${x + w},${y}`;
    x += w;
  }
  return d + ` L${x1},${bottom} Z`;
};

// GMC truck, side view facing left, local origin at the ground under the middle
const Truck: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={250} ry={16} fill="#2A2418" opacity={0.35} />
    <path d="M-60,-210 L210,-210 Q225,-210 228,-196 L232,-112 L-60,-112 Z" fill="url(#canvas)" stroke="#2A2418" strokeWidth={4} />
    {[0, 70, 140].map((xx) => (
      <path key={xx} d={`M${xx},-208 L${xx + 2},-114`} stroke="#6E5E3A" strokeWidth={3} opacity={0.7} />
    ))}
    <path d="M-62,-112 L232,-112 L232,-62 L-62,-62 Z" fill="url(#drab)" stroke="#2A2418" strokeWidth={4} />
    <path d="M-62,-62 L-62,-170 L-130,-170 L-150,-128 L-238,-120 L-246,-62 Z" fill="url(#drab)" stroke="#2A2418" strokeWidth={4} />
    <path d="M-72,-160 L-126,-160 L-142,-130 L-72,-130 Z" fill="#9FB7C2" opacity={0.85} />
    <path d="M-246,-104 L-232,-104 L-232,-64 L-246,-64 Z" fill="#232A16" />
    <circle cx={-232} cy={-128} r={9} fill="#FFE7A0" />
    <path d="M-110,-108 l10,-18 l10,18 l-17,-11 h20 z" fill="#EEE" opacity={0.85} />
    {[-178, 92, 168].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={-40} r={40} fill="#1E1E1A" />
        <circle cx={cx} cy={-40} r={17} fill="#4E5A2A" />
      </g>
    ))}
  </g>
);

// walking soldier carrying something, side view facing left, origin at feet
const Walker: React.FC<{x: number; y: number; s: number; load: 'box' | 'can' | 'sack' | 'none'; phase: number}> = ({x, y, s, load, phase}) => {
  const st = Math.sin(phase) * 12;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={3} rx={36} ry={7} fill="#2A2418" opacity={0.35} />
      <path d={`M-6,-90 L${-14 - st},-4 L${-2 - st},-2 L4,-84 Z`} fill="#3E4824" />
      <path d={`M6,-90 L${14 + st},-4 L${26 + st},-2 L16,-84 Z`} fill="#4A5530" />
      <path d="M-22,-176 Q-2,-188 22,-174 L26,-90 L-20,-88 Z" fill="url(#drab)" stroke="#232A16" strokeWidth={3} />
      <path d="M18,-170 L44,-160 L46,-104 L22,-104 Z" fill="#8E7A4E" stroke="#232A16" strokeWidth={3} />
      <circle cx={-2} cy={-196} r={18} fill="#C9906A" />
      <path d="M-26,-198 Q-24,-228 2,-228 Q28,-226 28,-198 L34,-194 L-32,-194 Z" fill="#4E5A2A" stroke="#232A16" strokeWidth={3} />
      {load === 'box' ? <rect x={-48} y={-160} width={42} height={34} fill="#C2A570" stroke="#3A2E1A" strokeWidth={3} /> : null}
      {load === 'can' ? <rect x={-40} y={-128} width={26} height={38} fill="#4E5A2A" stroke="#232A16" strokeWidth={3} /> : null}
      {load === 'sack' ? <path d="M-10,-196 Q-40,-214 -46,-176 Q-40,-140 -8,-150 Z" fill="#C2B280" stroke="#3A2E1A" strokeWidth={3} /> : null}
      <path d="M-14,-170 L-36,-130" stroke="#4A5530" strokeWidth={12} strokeLinecap="round" />
    </g>
  );
};

export const ThumbReal: React.FC = () => {
  useAnton();
  const r = rnd(7);
  return (
    <AbsoluteFill style={{backgroundColor: '#C77A45'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14284A" />
            <stop offset="0.3" stopColor="#4A4C78" />
            <stop offset="0.47" stopColor="#C2603E" />
            <stop offset="0.57" stopColor="#F28A3C" />
            <stop offset="0.64" stopColor="#FFC56A" />
          </linearGradient>
          <radialGradient id="sun" cx="1500" cy="600" r="560" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF4CF" stopOpacity="1" />
            <stop offset="0.18" stopColor="#FFD98E" stopOpacity="0.85" />
            <stop offset="1" stopColor="#F2A65A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9A44E" />
            <stop offset="0.3" stopColor="#8A8E36" />
            <stop offset="1" stopColor="#3E5222" />
          </linearGradient>
          <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E7C48C" />
            <stop offset="1" stopColor="#9C7A4C" />
          </linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2B26A" stopOpacity="0.75" />
            <stop offset="0.45" stopColor="#F2B26A" stopOpacity="0.25" />
            <stop offset="1" stopColor="#F2B26A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="drab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6F7B45" />
            <stop offset="1" stopColor="#3B4526" />
          </linearGradient>
          <linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CDBB8A" />
            <stop offset="1" stopColor="#8F7E52" />
          </linearGradient>
          <radialGradient id="skin" cx="-40" cy="-20" r="190" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F3C9A6" />
            <stop offset="0.5" stopColor="#D99C74" />
            <stop offset="1" stopColor="#9C5E40" />
          </radialGradient>
          <linearGradient id="helmet" x1="-170" y1="-240" x2="160" y2="-40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#93A45E" />
            <stop offset="0.45" stopColor="#5C6C33" />
            <stop offset="1" stopColor="#273015" />
          </linearGradient>
          <linearGradient id="jacket" x1="-400" y1="150" x2="380" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7D8A4E" />
            <stop offset="0.5" stopColor="#566234" />
            <stop offset="1" stopColor="#2C3419" />
          </linearGradient>
          <linearGradient id="web" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#CDB98A" />
            <stop offset="1" stopColor="#8A7650" />
          </linearGradient>
          <linearGradient id="brimShade" x1="0" y1="-92" x2="0" y2="-24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3A1E12" stopOpacity="0.75" />
            <stop offset="1" stopColor="#3A1E12" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vignette" cx="960" cy="520" r="1150" gradientUnits="userSpaceOnUse">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.6" />
          </radialGradient>
          <pattern id="net" patternUnits="userSpaceOnUse" width="26" height="26" patternTransform="rotate(35)">
            <path d="M0,0 L0,26 M0,0 L26,0" stroke="#2E3818" strokeWidth={3} opacity={0.6} />
          </pattern>
          <pattern id="stubble" patternUnits="userSpaceOnUse" width="9" height="9">
            <circle cx={2} cy={3} r={0.9} fill="#4A2E20" />
            <circle cx={6.5} cy={7} r={0.8} fill="#4A2E20" />
          </pattern>
          <filter id="smoke" x="-50%" y="-20%" width="200%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="70" />
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="cloud" x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="4" seed="9" />
            <feDisplacementMap in="SourceGraphic" scale="90" />
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="bgBlur">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id="soft">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="soft2">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="fieldTex" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves="4" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.2  0 0 0 0 0.05  0 0 0 0.9 -0.3" />
          </filter>
          <filter id="sat">
            <feColorMatrix type="saturate" values="1.2" />
          </filter>
          <filter id="drop" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="10" dy="14" stdDeviation="8" floodColor="#000" floodOpacity="0.55" />
          </filter>
          <clipPath id="faceClip">
            <path d="M-104,-64 C-112,-20 -114,24 -104,58 C-94,94 -58,126 0,134 C58,126 94,94 104,58 C114,24 112,-20 104,-64 C64,-92 -64,-92 -104,-64 Z" />
          </clipPath>
          <clipPath id="domeClip">
            <path d="M-150,-58 C-154,-158 -88,-218 0,-220 C88,-218 154,-158 150,-58 Z" />
          </clipPath>
        </defs>

        {/* ---------- (2) background world, slightly soft ---------- */}
        <g filter="url(#sat)">
        <g filter="url(#bgBlur)">
          <rect x={0} y={0} width={1920} height={1080} fill="url(#sky)" />
          <rect x={0} y={0} width={1920} height={1080} fill="url(#sun)" />
          <ellipse cx={520} cy={210} rx={420} ry={60} fill="#D88A62" opacity={0.55} filter="url(#cloud)" />
          <ellipse cx={1180} cy={140} rx={380} ry={50} fill="#9A6A6A" opacity={0.55} filter="url(#cloud)" />
          <ellipse cx={1700} cy={330} rx={300} ry={40} fill="#F3B07A" opacity={0.6} filter="url(#cloud)" />
          <path d="M1080,640 C1060,520 1120,420 1080,300 C1050,210 1120,120 1100,20 L1180,20 C1200,140 1150,220 1180,320 C1210,430 1160,540 1180,640 Z" fill="#3E3A3C" opacity={0.55} filter="url(#smoke)" />
          <path d="M1790,650 C1770,560 1820,470 1790,380 C1770,300 1830,240 1810,160 L1870,160 C1890,250 1850,310 1870,390 C1890,480 1850,570 1860,650 Z" fill="#45403F" opacity={0.5} filter="url(#smoke)" />
          <path d={ridge(632, 26, 3)} fill="#7C8783" opacity={0.85} />
          <path d={ridge(662, 40, 5)} fill="#5E7048" />
          <rect x={-20} y={655} width={1960} height={440} fill="url(#field)" />
          <rect x={-20} y={655} width={1960} height={440} filter="url(#fieldTex)" opacity={0.55} />
          <path d={ridge(760, 60, 8, 1680, 1990)} fill="#3F552A" />
          {/* road to the vanishing point */}
          <path d="M930,1100 C1180,860 1400,700 1552,646 L1566,646 C1640,720 1760,880 1880,1100 Z" fill="url(#road)" />
          <path d="M1060,1100 C1260,880 1430,712 1556,648" stroke="#7A5C3A" strokeWidth={5} fill="none" opacity={0.55} />
          <path d="M1700,1100 C1640,880 1600,730 1562,648" stroke="#7A5C3A" strokeWidth={5} fill="none" opacity={0.55} />
          {/* the column, far to near */}
          {[
            [1556, 652, 0.06],
            [1552, 668, 0.1],
            [1542, 694, 0.16],
            [1522, 738, 0.26],
            [1488, 812, 0.42],
            [1430, 940, 0.72],
          ].map(([x, y, s], i) => (
            <Truck key={`t${i}`} x={x + 30 * s} y={y} s={s} />
          ))}
          {[
            [1522, 662, 0.13, 'box'],
            [1502, 682, 0.18, 'sack'],
            [1472, 712, 0.25, 'can'],
            [1428, 756, 0.36, 'box'],
            [1366, 818, 0.52, 'sack'],
            [1276, 902, 0.74, 'box'],
            [1150, 1020, 1.02, 'can'],
          ].map(([x, y, s, l], i) => (
            <Walker key={`w${i}`} x={(x as number) - 60} y={y as number} s={s as number} load={l as 'box'} phase={i * 1.3 + r()} />
          ))}
          <rect x={-20} y={470} width={1960} height={620} fill="url(#haze)" />
        </g>

        {/* ---------- (1) the GI, sharp, lit from the sunset on the right ---------- */}
        <g transform="translate(540,560) scale(1.38)">
          {/* jacket: shoulders, collar, pockets, epaulettes, folds */}
          <path d="M-80,148 C-170,160 -290,190 -350,262 C-400,330 -428,470 -440,640 L440,640 C428,470 400,330 350,262 C290,190 170,160 80,148 Z" fill="url(#jacket)" stroke="#1B2010" strokeWidth={4} />
          <path d="M-300,212 L-180,236 L-176,256 L-302,232 Z" fill="#5E6A38" stroke="#1B2010" strokeWidth={3} />
          <path d="M300,212 L180,236 L176,256 L302,232 Z" fill="#4C5730" stroke="#1B2010" strokeWidth={3} />
          <circle cx={-190} cy={244} r={6} fill="#3A3A2A" />
          <circle cx={190} cy={244} r={6} fill="#3A3A2A" />
          <path d="M-205,330 L-95,330 L-92,440 L-200,446 Z" fill="#56623A" stroke="#1B2010" strokeWidth={3} />
          <path d="M-210,318 L-90,318 L-88,350 Q-150,362 -212,350 Z" fill="#646F42" stroke="#1B2010" strokeWidth={3} />
          <path d="M205,330 L95,330 L92,440 L200,446 Z" fill="#46512E" stroke="#1B2010" strokeWidth={3} />
          <path d="M210,318 L90,318 L88,350 Q150,362 212,350 Z" fill="#525D36" stroke="#1B2010" strokeWidth={3} />
          <circle cx={-150} cy={342} r={6} fill="#2A2A1E" />
          <circle cx={150} cy={342} r={6} fill="#2A2A1E" />
          {[300, 390, 480, 570].map((yy) => (
            <circle key={yy} cx={0} cy={yy} r={7} fill="#2E2E22" stroke="#111" strokeWidth={2} />
          ))}
          <path d="M0,250 L0,640" stroke="#1B2010" strokeWidth={3} opacity={0.6} />
          <path d="M-330,300 C-300,400 -312,520 -330,640 M330,300 C310,420 318,520 338,640 M-260,470 C-230,520 -236,580 -250,640" stroke="#232A14" strokeWidth={5} fill="none" opacity={0.5} />
          <path d="M-238,232 L-210,640 L-176,640 L-204,226 Z" fill="url(#web)" stroke="#3A2E1A" strokeWidth={3} />
          <path d="M238,232 L210,640 L176,640 L204,226 Z" fill="url(#web)" stroke="#3A2E1A" strokeWidth={3} />
          <rect x={-226} y={300} width={30} height={20} rx={4} fill="#9A9A8A" stroke="#333" strokeWidth={2} />
          <rect x={196} y={300} width={30} height={20} rx={4} fill="#8A8A7A" stroke="#333" strokeWidth={2} />
          <path d="M350,262 C392,330 418,450 432,630" stroke="#F2A65A" strokeWidth={10} fill="none" opacity={0.6} filter="url(#soft2)" />
          {/* neck, shirt collar, jacket collar */}
          <path d="M-74,70 L74,70 L84,176 L-84,176 Z" fill="#C2845E" />
          <path d="M-78,86 L78,86 L82,128 L-82,128 Z" fill="#5A2E1C" opacity={0.4} filter="url(#soft2)" />
          <path d="M-34,96 Q-20,140 -6,170" stroke="#9A5F40" strokeWidth={3} fill="none" opacity={0.5} />
          <path d="M-60,168 L60,168 L0,246 Z" fill="#B9A274" stroke="#3A2E1A" strokeWidth={3} />
          <path d="M-86,150 L-164,186 L-92,288 L-40,200 Z" fill="#59653A" stroke="#1B2010" strokeWidth={4} />
          <path d="M86,150 L164,186 L92,288 L40,200 Z" fill="#48532F" stroke="#1B2010" strokeWidth={4} />
          {/* ears */}
          <ellipse cx={-110} cy={8} rx={20} ry={34} fill="#D49573" stroke="#5A2E1C" strokeWidth={3} />
          <ellipse cx={110} cy={8} rx={20} ry={34} fill="#B97A58" stroke="#5A2E1C" strokeWidth={3} />
          <path d="M-114,-8 Q-102,8 -112,28" stroke="#8E5538" strokeWidth={3} fill="none" />
          {/* face: young, strong jaw */}
          <path d="M-104,-64 C-112,-20 -114,24 -104,58 C-94,94 -58,126 0,134 C58,126 94,94 104,58 C114,24 112,-20 104,-64 C64,-92 -64,-92 -104,-64 Z" fill="url(#skin)" />
          <g clipPath="url(#faceClip)">
            <ellipse cx={96} cy={34} rx={58} ry={130} fill="#7A4430" opacity={0.4} filter="url(#soft)" />
            <rect x={-130} y={-100} width={260} height={88} fill="url(#brimShade)" />
            <path d="M-110,52 C-90,104 -50,132 0,138 C50,132 90,104 110,52 L110,150 L-110,150 Z" fill="#6A4A3A" opacity={0.16} filter="url(#soft2)" />
            <ellipse cx={-66} cy={50} rx={18} ry={7} fill="#8A5238" opacity={0.12} filter="url(#soft2)" transform="rotate(-20,-66,50)" />
            <ellipse cx={66} cy={50} rx={18} ry={7} fill="#6E3A26" opacity={0.16} filter="url(#soft2)" transform="rotate(20,66,50)" />
            <ellipse cx={-54} cy={20} rx={28} ry={13} fill="#FFFFFF" opacity={0.16} filter="url(#soft2)" />
            <ellipse cx={-44} cy={-14} rx={34} ry={18} fill="#6E3E2A" opacity={0.26} filter="url(#soft2)" />
            <ellipse cx={44} cy={-14} rx={34} ry={18} fill="#6E3E2A" opacity={0.3} filter="url(#soft2)" />
          </g>
          <path d="M-104,-64 C-112,-20 -114,24 -104,58 C-94,94 -58,126 0,134 C58,126 94,94 104,58 C114,24 112,-20 104,-64" stroke="#4A2618" strokeWidth={3.5} fill="none" />
          <path d="M-103,-46 C-106,-24 -105,-6 -101,8 L-92,6 C-95,-10 -95,-28 -93,-46 Z" fill="#3B2618" />
          <path d="M103,-46 C106,-24 105,-6 101,8 L92,6 C95,-10 95,-28 93,-46 Z" fill="#2E1E12" />
          <path d="M102,-36 C112,12 110,52 96,82" stroke="#F7B977" strokeWidth={7} fill="none" opacity={0.75} filter="url(#soft2)" />
          <path d="M-8,124 Q0,129 8,124" stroke="#8E5538" strokeWidth={2.5} fill="none" opacity={0.6} />
          {/* eyes: wide, glancing right at the column */}
          {[-44, 44].map((cx) => (
            <g key={cx}>
              <path d={`M${cx - 27},-10 Q${cx},-33 ${cx + 27},-11 Q${cx},6 ${cx - 27},-10 Z`} fill="#F6F0E8" />
              <circle cx={cx + 9} cy={-11} r={11.5} fill="#5B3A1E" />
              <circle cx={cx + 9} cy={-11} r={11.5} fill="none" stroke="#2A1608" strokeWidth={1.5} />
              <circle cx={cx + 9} cy={-11} r={5.5} fill="#120A06" />
              <circle cx={cx + 12} cy={-15} r={3} fill="#FFFFFF" />
              <path d={`M${cx - 29},-10 Q${cx},-36 ${cx + 29},-12`} stroke="#24140C" strokeWidth={5} fill="none" strokeLinecap="round" />
              <path d={`M${cx - 22},-2 Q${cx},8 ${cx + 22},-3`} stroke="#8E5538" strokeWidth={2} fill="none" opacity={0.7} />
              <path d={`M${cx - 24},-30 Q${cx},-44 ${cx + 24},-30`} stroke="#9A5F40" strokeWidth={2} fill="none" opacity={0.45} />
            </g>
          ))}
          {/* thick brows, inner ends raised */}
          <path d="M-80,-38 Q-50,-56 -16,-56 L-15,-46 Q-48,-45 -78,-29 Z" fill="#3B2618" />
          <path d="M80,-38 Q50,-56 16,-56 L15,-46 Q48,-45 78,-29 Z" fill="#3B2618" />
          {/* nose */}
          <path d="M8,-6 Q18,26 16,48" stroke="#8E5538" strokeWidth={3.5} fill="none" opacity={0.65} />
          <path d="M-18,54 Q0,66 18,54" stroke="#6E3526" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M-20,50 Q-26,44 -22,36 M20,50 Q26,44 22,36" stroke="#8E5538" strokeWidth={3} fill="none" opacity={0.6} />
          <ellipse cx={-9} cy={56} rx={4.5} ry={2.8} fill="#4A2214" />
          <ellipse cx={9} cy={56} rx={4.5} ry={2.8} fill="#4A2214" />
          <ellipse cx={-4} cy={30} rx={4.5} ry={12} fill="#FFFFFF" opacity={0.22} />
          {/* mouth: tense, lips parted */}
          <path d="M-30,92 Q0,84 30,92 Q0,106 -30,92 Z" fill="#5A1E18" />
          <path d="M-20,92 Q0,88 20,92 L18,95 Q0,92 -18,95 Z" fill="#EDE6DC" opacity={0.85} />
          <path d="M-32,92 Q-14,86 0,88 Q14,86 32,92" stroke="#6E3022" strokeWidth={3.5} fill="none" />
          <path d="M-18,106 Q0,112 18,106" stroke="#E8AE90" strokeWidth={4} fill="none" opacity={0.65} />
          {/* sweat + dirt */}
          <path d="M86,-50 q10,15 0,24 q-10,-9 0,-24" fill="#DDF1FF" stroke="#6C8FA8" strokeWidth={2} />
          <path d="M-92,-26 q7,11 0,17 q-7,-6 0,-17" fill="#DDF1FF" stroke="#6C8FA8" strokeWidth={2} opacity={0.85} />
          {/* helmet M1: net, scrim, chin straps hanging along the face */}
          <path d="M-124,-52 C-128,-10 -122,40 -112,78" stroke="#7E6A42" strokeWidth={11} fill="none" strokeLinecap="round" />
          <path d="M124,-52 C128,-10 122,40 112,78" stroke="#6A583A" strokeWidth={11} fill="none" strokeLinecap="round" />
          <rect x={-120} y={72} width={14} height={18} rx={3} fill="#9A9A8A" stroke="#333" strokeWidth={2} />
          <path d="M-150,-58 C-154,-158 -88,-218 0,-220 C88,-218 154,-158 150,-58 C168,-54 176,-44 166,-36 C96,-28 -96,-28 -166,-36 C-176,-44 -168,-54 -150,-58 Z" fill="url(#helmet)" stroke="#1C2210" strokeWidth={4} />
          <g clipPath="url(#domeClip)">
            <rect x={-170} y={-240} width={340} height={200} fill="url(#net)" />
            <path d="M-110,-186 Q-60,-140 -102,-76 M36,-216 Q18,-156 56,-102" stroke="#8E7A4E" strokeWidth={10} fill="none" opacity={0.55} />
            <ellipse cx={-58} cy={-168} rx={50} ry={25} fill="#FFFFFF" opacity={0.22} filter="url(#soft)" />
          </g>
          <path d="M-166,-36 C-96,-28 96,-28 166,-36" stroke="#151A0B" strokeWidth={8} fill="none" />
          <path d="M120,-186 C146,-148 154,-104 150,-60" stroke="#F7B06A" strokeWidth={9} fill="none" opacity={0.75} filter="url(#soft2)" />
        </g>

        </g>
        {/* ---------- (3) text + arrow ---------- */}
        <g transform="rotate(-4,1400,250)" filter="url(#drop)">
          <text x={1395} y={318} fontFamily="Anton" fontSize={215} textAnchor="middle" stroke="#111" strokeWidth={22} paintOrder="stroke" strokeLinejoin="round" fill="#FFFFFF">
            ONLY <tspan fill="#FFD23F">14%</tspan>
          </text>
        </g>
        <g filter="url(#drop)">
          <path d="M1170,400 C1080,500 960,540 860,540" stroke="#FFFFFF" strokeWidth={34} fill="none" strokeLinecap="round" />
          <path d="M1170,400 C1080,500 960,540 860,540" stroke="#E8322B" strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d="M908,486 L846,540 L910,594" stroke="#FFFFFF" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M908,486 L846,540 L910,594" stroke="#E8322B" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* finishing: vignette + film grain */}
        <rect x={0} y={0} width={1920} height={1080} fill="url(#vignette)" />
        <rect x={0} y={0} width={1920} height={1080} filter="url(#grain)" opacity={0.07} style={{mixBlendMode: 'overlay'}} />
      </svg>
    </AbsoluteFill>
  );
};
