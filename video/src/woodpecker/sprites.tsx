// Hand-drawn (code) cut-out pictures in the flat cartoon style: thick black outlines, flat fills, one soft shade.
// Every pose / expression is its own fixed picture (no puppet tweening between them).
import React from 'react';

export const INK = '#151515';
export const SW = 7; // outline weight in world px (matches code-drawn effects)
const st = {stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

// ---------- WOODPECKER (side view facing left, origin = beak tip of the rest pose) ----------
export const HEAD_FWD = {rot: -8, cx: 115, cy: 55, dx: -16, dy: 5};
const rotPt = (x: number, y: number, deg: number, cx: number, cy: number) => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return {x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c};
};
const pk = rotPt(0, 0, HEAD_FWD.rot, HEAD_FWD.cx, HEAD_FWD.cy);
export const TIP_FWD = {x: pk.x + HEAD_FWD.dx, y: pk.y + HEAD_FWD.dy}; // beak tip of the peck pose
export const BIRD_BOX = {x0: -60, y0: -100, x1: 270, y1: 345};

type Eye = 'open' | 'squeeze' | 'happy' | 'determined';
const BirdBodySide: React.FC = () => (
  <g>
    {/* legs + toes (behind body) */}
    <path d="M 60 185 L -36 196 M 66 212 L -34 222" {...st} fill="none" />
    <path d="M -36 196 l -10 -12 M -36 196 l -10 10 M -34 222 l -10 -12 M -34 222 l -10 10" {...st} strokeWidth={6} fill="none" />
    {/* tail braced on the trunk */}
    <path d="M 70 205 L -46 332 L -14 340 L 104 238 Z" fill="#232323" {...st} />
    <clipPath id="bodyClip"><ellipse cx="112" cy="150" rx="68" ry="100" transform="rotate(10 112 150)" /></clipPath>
    <ellipse cx="112" cy="150" rx="68" ry="100" transform="rotate(10 112 150)" fill="#FFFFFF" />
    <g clipPath="url(#bodyClip)">
      <ellipse cx="96" cy="190" rx="70" ry="40" fill="#ECECF1" />
      <ellipse cx="170" cy="150" rx="66" ry="112" transform="rotate(14 170 150)" fill="#232323" {...st} />
      <circle cx="150" cy="118" r="8" fill="#fff" />
      <circle cx="166" cy="158" r="8" fill="#fff" />
      <circle cx="152" cy="198" r="8" fill="#fff" />
      <circle cx="170" cy="232" r="7" fill="#fff" />
      <ellipse cx="80" cy="262" rx="40" ry="18" fill="#E8413C" />
    </g>
    <ellipse cx="112" cy="150" rx="68" ry="100" transform="rotate(10 112 150)" fill="none" {...st} />
  </g>
);
const BirdHeadSide: React.FC<{eye: Eye}> = ({eye}) => (
  <g>
    <clipPath id="headClip"><circle cx="118" cy="-10" r="76" /></clipPath>
    <circle cx="118" cy="-10" r="76" fill="#fff" />
    <g clipPath="url(#headClip)">
      <path d="M 150 40 A 70 70 0 0 0 196 -20 L 220 60 Z" fill="#ECECF1" />
      <ellipse cx="160" cy="-74" rx="92" ry="52" fill="#E8413C" />
      <path d="M 62 22 Q 130 30 200 18" fill="none" stroke="#232323" strokeWidth={15} strokeLinecap="round" />
    </g>
    <circle cx="118" cy="-10" r="76" fill="none" {...st} />
    {/* beak */}
    <path d="M 58 -30 Q 28 -12 0 0 Q 30 12 60 24 Z" fill="#F4C542" {...st} />
    <path d="M 10 2 Q 34 8 58 10" fill="none" {...st} strokeWidth={5} />
    {/* eye + brow */}
    {eye === 'open' && (<>
      <ellipse cx="98" cy="-18" rx="11" ry="15" fill={INK} />
      <circle cx="101" cy="-23" r="4" fill="#fff" />
      <path d="M 82 -45 Q 98 -54 114 -46" fill="none" {...st} />
    </>)}
    {eye === 'determined' && (<>
      <clipPath id="lidClip"><path d="M 80 -30 L 120 -38 L 120 0 L 80 0 Z" /></clipPath>
      <ellipse cx="98" cy="-16" rx="11" ry="15" fill={INK} clipPath="url(#lidClip)" />
      <circle cx="100" cy="-20" r="3.5" fill="#fff" />
      <path d="M 80 -30 L 120 -46" fill="none" {...st} strokeWidth={9} />
    </>)}
    {eye === 'squeeze' && (<>
      <path d="M 108 -30 L 88 -18 L 108 -6" fill="none" {...st} />
      <path d="M 80 -40 L 116 -48" fill="none" {...st} />
    </>)}
    {eye === 'happy' && (<>
      <path d="M 86 -14 Q 98 -32 112 -14" fill="none" {...st} />
      <path d="M 82 -50 Q 98 -60 114 -52" fill="none" {...st} />
    </>)}
  </g>
);

export const BirdSide: React.FC<{pose: 'rest' | 'peck' | 'smug' | 'determined'}> = ({pose}) => {
  const eye: Eye = pose === 'peck' ? 'squeeze' : pose === 'smug' ? 'happy' : pose === 'determined' ? 'determined' : 'open';
  const head = pose === 'peck'
    ? `translate(${HEAD_FWD.dx} ${HEAD_FWD.dy}) rotate(${HEAD_FWD.rot} ${HEAD_FWD.cx} ${HEAD_FWD.cy})`
    : pose === 'smug' ? 'rotate(6 115 55)' : '';
  return (
    <g>
      <BirdBodySide />
      <g transform={head}><BirdHeadSide eye={eye} /></g>
    </g>
  );
};

// front-facing, curious shrug (turned to the viewer)
export const BirdFront: React.FC = () => (
  <g>
    <path d="M 60 185 L -36 196 M 66 212 L -34 222" {...st} fill="none" />
    <path d="M -36 196 l -10 -12 M -36 196 l -10 10 M -34 222 l -10 -12 M -34 222 l -10 10" {...st} strokeWidth={6} fill="none" />
    <path d="M 70 205 L -46 332 L -14 340 L 104 238 Z" fill="#232323" {...st} />
    {/* raised shrug wing on the right side of the image */}
    <path d="M 168 110 Q 230 80 262 30 Q 250 92 206 140 Z" fill="#232323" {...st} />
    <path d="M 226 70 l 16 6 M 214 92 l 16 6" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    <clipPath id="fbodyClip"><ellipse cx="116" cy="155" rx="72" ry="98" /></clipPath>
    <ellipse cx="116" cy="155" rx="72" ry="98" fill="#fff" />
    <g clipPath="url(#fbodyClip)">
      <ellipse cx="150" cy="170" rx="40" ry="90" fill="#ECECF1" />
      <ellipse cx="40" cy="160" rx="34" ry="104" fill="#232323" {...st} />
      <ellipse cx="192" cy="160" rx="34" ry="104" fill="#232323" {...st} />
      <ellipse cx="116" cy="262" rx="40" ry="18" fill="#E8413C" />
    </g>
    <ellipse cx="116" cy="155" rx="72" ry="98" fill="none" {...st} />
    <clipPath id="fheadClip"><circle cx="118" cy="-12" r="80" /></clipPath>
    <circle cx="118" cy="-12" r="80" fill="#fff" />
    <g clipPath="url(#fheadClip)">
      <path d="M 150 50 A 74 74 0 0 0 198 -20 L 220 60 Z" fill="#ECECF1" />
      <ellipse cx="118" cy="-92" rx="98" ry="50" fill="#E8413C" />
      <path d="M 30 26 Q 70 40 92 30 M 144 30 Q 166 40 206 26" fill="none" stroke="#232323" strokeWidth={15} strokeLinecap="round" />
    </g>
    <circle cx="118" cy="-12" r="80" fill="none" {...st} />
    <ellipse cx="90" cy="-16" rx="11" ry="15" fill={INK} /><circle cx="93" cy="-21" r="4" fill="#fff" />
    <ellipse cx="146" cy="-16" rx="11" ry="15" fill={INK} /><circle cx="149" cy="-21" r="4" fill="#fff" />
    <path d="M 74 -46 Q 90 -60 104 -50" fill="none" {...st} />
    <path d="M 132 -44 Q 146 -50 160 -44" fill="none" {...st} />
    <path d="M 100 10 L 136 10 L 116 52 Z" fill="#F4C542" {...st} />
  </g>
);

// ---------- HUMAN (simple white round-head guy, 3/4 facing left, origin = between the feet) ----------
export const HUMAN_HEAD = {x: -6, y: -440, r: 92};
export const Human: React.FC<{pose: 'walk' | 'bonk'}> = ({pose}) => {
  const bonk = pose === 'bonk';
  return (
    <g transform={bonk ? 'rotate(7 0 0)' : ''}>
      <path d="M -20 -190 Q -30 -100 -30 -18 M 30 -190 Q 34 -100 32 -18" fill="none" {...st} strokeWidth={9} />
      <ellipse cx="-42" cy="-12" rx="30" ry="14" fill="#fff" {...st} />
      <ellipse cx="26" cy="-12" rx="30" ry="14" fill="#fff" {...st} />
      {bonk
        ? <path d="M -40 -320 Q -90 -380 -110 -470 M 50 -320 Q 100 -380 112 -470" fill="none" {...st} strokeWidth={9} />
        : <path d="M -40 -320 Q -70 -260 -84 -210 M 52 -320 Q 76 -262 80 -214" fill="none" {...st} strokeWidth={9} />}
      {bonk
        ? <><circle cx="-112" cy="-482" r="18" fill="#fff" {...st} /><circle cx="114" cy="-482" r="18" fill="#fff" {...st} /></>
        : <><circle cx="-86" cy="-200" r="18" fill="#fff" {...st} /><circle cx="80" cy="-204" r="18" fill="#fff" {...st} /></>}
      <clipPath id={`hb${pose}`}><path d="M -62 -330 Q 4 -362 66 -330 L 70 -210 Q 6 -170 -60 -210 Z" /></clipPath>
      <path d="M -62 -330 Q 4 -362 66 -330 L 70 -210 Q 6 -170 -60 -210 Z" fill="#fff" />
      <rect x="30" y="-370" width="60" height="200" fill="#ECECF1" clipPath={`url(#hb${pose})`} />
      <path d="M -62 -330 Q 4 -362 66 -330 L 70 -210 Q 6 -170 -60 -210 Z" fill="none" {...st} />
      <clipPath id={`hh${pose}`}><circle cx={HUMAN_HEAD.x} cy={HUMAN_HEAD.y} r={HUMAN_HEAD.r} /></clipPath>
      <circle cx={HUMAN_HEAD.x} cy={HUMAN_HEAD.y} r={HUMAN_HEAD.r} fill="#fff" />
      <circle cx={HUMAN_HEAD.x + 60} cy={HUMAN_HEAD.y + 30} r={HUMAN_HEAD.r} fill="#ECECF1" clipPath={`url(#hh${pose})`} />
      <circle cx={HUMAN_HEAD.x - 30} cy={HUMAN_HEAD.y - 20} r={HUMAN_HEAD.r} fill="#fff" clipPath={`url(#hh${pose})`} />
      <circle cx={HUMAN_HEAD.x} cy={HUMAN_HEAD.y} r={HUMAN_HEAD.r} fill="none" {...st} />
      {bonk ? (<>
        <path d="M -62 -470 L -40 -456 L -62 -442" fill="none" {...st} />
        <path d="M 2 -470 L -20 -456 L 2 -442" fill="none" {...st} />
        <path d="M -66 -490 L -42 -482 M 6 -490 L -18 -482" fill="none" {...st} />
        <ellipse cx="-28" cy="-400" rx="22" ry="26" fill={INK} />
        <ellipse cx="-28" cy="-386" rx="13" ry="9" fill="#F28AA0" />
      </>) : (<>
        <ellipse cx="-50" cy="-452" rx="9" ry="13" fill={INK} />
        <ellipse cx="-8" cy="-452" rx="9" ry="13" fill={INK} />
        <path d="M -64 -480 Q -52 -486 -40 -480 M -20 -480 Q -8 -486 4 -480" fill="none" {...st} />
        <path d="M -44 -404 Q -30 -398 -16 -404" fill="none" {...st} />
      </>)}
    </g>
  );
};

// ---------- PROPS (origin noted per prop) ----------
// spring bumper: origin = attach point (beak tip), extends to the left by len
export const Spring: React.FC<{len: number}> = ({len}) => {
  const n = 6, w = len - 26; let d = 'M 0 0';
  for (let i = 0; i < n; i++) {
    const x0 = -(i / n) * w, x1 = -((i + 0.5) / n) * w, x2 = -((i + 1) / n) * w;
    d += ` C ${x0 - 4} -34 ${x1 + 4} -34 ${x1} 0 C ${x1 - 4} 34 ${x2 + 4} 34 ${x2} 0`;
  }
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#C9D2DC" strokeWidth={5} strokeLinecap="round" />
      <rect x={-len} y={-30} width={24} height={60} rx={10} fill="#E8413C" {...st} />
    </g>
  );
};
// pillow: origin = right edge centre (attach to the beak), width 120 * sx
export const Pillow: React.FC<{sx: number}> = ({sx}) => (
  <g transform={`scale(${sx} ${1 + (1 - sx) * 0.35})`}>
    <path d="M -6 -40 Q -60 -54 -114 -40 Q -126 0 -114 40 Q -60 54 -6 40 Q 6 0 -6 -40 Z" fill="#F7F4FF" {...st} />
    <path d="M -100 26 Q -60 38 -20 26" fill="none" stroke="#D7D0F0" strokeWidth={10} strokeLinecap="round" />
    <path d="M -114 -40 l -12 -10 M -114 40 l -12 10 M -6 -40 l 10 -10 M -6 40 l 10 10" {...st} fill="none" />
  </g>
);
// hammer with a face: origin = centre of the striking face (left side of the head)
export const Hammer: React.FC<{squeeze?: boolean}> = ({squeeze}) => (
  <g>
    <rect x={48} y={30} width={36} height={250} rx={14} fill="#C98D4E" {...st} />
    <rect x={64} y={40} width={12} height={230} rx={6} fill="#B07640" />
    <rect x={0} y={-44} width={130} height={88} rx={14} fill="#A3ADB8" {...st} />
    <rect x={0} y={-44} width={22} height={88} rx={8} fill="#7E8996" {...st} />
    {squeeze ? (<>
      <path d="M 60 -12 L 46 0 L 60 12 M 82 -12 L 96 0 L 82 12" fill="none" {...st} />
    </>) : (<>
      <ellipse cx="56" cy="2" rx="8" ry="11" fill={INK} /><ellipse cx="90" cy="2" rx="8" ry="11" fill={INK} />
      <circle cx="58" cy="-2" r="3" fill="#fff" /><circle cx="92" cy="-2" r="3" fill="#fff" />
    </>)}
    <path d="M 42 -22 L 66 -12 M 104 -22 L 80 -12" fill="none" {...st} />
    <path d="M 64 24 Q 73 20 82 24" fill="none" {...st} strokeWidth={6} />
  </g>
);
// vintage movie camera with eyes: origin = lens front centre (points left)
export const MovieCamera: React.FC<{spin: number; rec: boolean}> = ({spin, rec}) => {
  const reel = (cx: number, cy: number) => (
    <g transform={`rotate(${spin} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={46} fill="#3A3F47" {...st} />
      {[0, 120, 240].map((a) => (
        <circle key={a} cx={cx + 24 * Math.cos((a * Math.PI) / 180)} cy={cy + 24 * Math.sin((a * Math.PI) / 180)} r={10} fill="#9AA3AD" />
      ))}
      <circle cx={cx} cy={cy} r={8} fill="#9AA3AD" {...st} strokeWidth={4} />
    </g>
  );
  return (
    <g>
      {reel(110, -112)}{reel(200, -112)}
      <path d="M 0 -34 L 60 -20 L 60 20 L 0 34 Z" fill="#3A3F47" {...st} />
      <ellipse cx="0" cy="0" rx="10" ry="34" fill="#7FD3FF" {...st} />
      <rect x={56} y={-64} width={200} height={128} rx={18} fill="#5B6470" {...st} />
      <rect x={210} y={-64} width={46} height={128} rx={14} fill="#48505A" />
      <rect x={56} y={-64} width={200} height={128} rx={18} fill="none" {...st} />
      <ellipse cx="120" cy="-6" rx="13" ry="17" fill="#fff" {...st} strokeWidth={5} />
      <ellipse cx="164" cy="-6" rx="13" ry="17" fill="#fff" {...st} strokeWidth={5} />
      <circle cx="116" cy="-6" r="7" fill={INK} /><circle cx="160" cy="-6" r="7" fill={INK} />
      <path d="M 120 32 Q 142 42 164 32" fill="none" {...st} strokeWidth={6} />
      <circle cx="232" cy="-38" r="11" fill={rec ? '#FF3B30' : '#7A2A26'} {...st} strokeWidth={4} />
      <path d="M 150 64 L 130 130 M 170 64 L 190 130" {...st} strokeWidth={9} fill="none" />
    </g>
  );
};
// magnifier: origin = lens centre
export const Magnifier: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <g>
    <path d="M 70 70 L 170 170" stroke={INK} strokeWidth={46} strokeLinecap="round" />
    <path d="M 70 70 L 170 170" stroke="#8A5A33" strokeWidth={30} strokeLinecap="round" />
    <clipPath id="lensClip"><circle cx="0" cy="0" r="96" /></clipPath>
    <circle cx="0" cy="0" r="96" fill="#CFEFFF" />
    <g clipPath="url(#lensClip)">{children}</g>
    <path d="M -62 -40 A 74 74 0 0 1 -20 -72" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
    <circle cx="0" cy="0" r="96" fill="none" stroke={INK} strokeWidth={26} />
    <circle cx="0" cy="0" r="96" fill="none" stroke="#C9D2DC" strokeWidth={12} />
  </g>
);
// tiny brain with a face: origin = centre
export const Brain: React.FC<{wink?: boolean}> = ({wink}) => {
  const lobes = [[-22, -8, 18], [-6, -18, 19], [14, -16, 18], [26, -2, 16], [10, 6, 20], [-16, 8, 18]];
  return (
    <g>
      {lobes.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + SW / 2 + 1} fill={INK} />)}
      {lobes.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#F7A1B5" />)}
      <path d="M -26 -10 q 8 -8 14 0 M 4 -22 q 8 6 0 12 M 16 4 q 8 -6 14 2" fill="none" stroke="#D96C8A" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx="-8" cy="4" rx="4" ry="6" fill={INK} />
      {wink ? <path d="M 6 4 q 5 -6 10 0" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" /> : <ellipse cx="11" cy="4" rx="4" ry="6" fill={INK} />}
      <path d="M -6 16 Q 2 22 10 16" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

// ---------- SET PIECES ----------
export const TRUNK = {x0: 250, x1: 530, top: -900, base: 1765};
const leafCluster = (pts: number[][], fill: string, key: string) => (
  <g key={key}>
    {pts.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + SW / 2} fill={INK} />)}
    {pts.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r - SW / 2} fill={fill} />)}
    {pts.map(([x, y, r], i) => <circle key={`s${i}`} cx={x + r * 0.25} cy={y + r * 0.3} r={r * 0.55} fill="#5FA442" opacity={0.55} />)}
  </g>
);
export const Tree: React.FC = () => {
  const {x0, x1, base} = TRUNK;
  const trunkPath = `M ${x0} -900 L ${x0} ${base - 160} Q ${x0 - 4} ${base - 30} ${x0 - 70} ${base} L ${x1 + 70} ${base} Q ${x1 + 4} ${base - 30} ${x1} ${base - 160} L ${x1} -900 Z`;
  return (
    <g>
      {/* branch to the left with leaves */}
      <path d={`M ${x0 + 10} 470 Q ${x0 - 120} 420 ${x0 - 240} 300`} stroke={INK} strokeWidth={56} fill="none" strokeLinecap="round" />
      <path d={`M ${x0 + 10} 470 Q ${x0 - 120} 420 ${x0 - 240} 300`} stroke="#A9713F" strokeWidth={42} fill="none" strokeLinecap="round" />
      {leafCluster([[x0 - 260, 270, 70], [x0 - 330, 310, 55], [x0 - 200, 230, 55], [x0 - 300, 210, 50]], '#7CC35A', 'b')}
      <clipPath id="trunkClip"><path d={trunkPath} /></clipPath>
      <path d={trunkPath} fill="#A9713F" />
      <g clipPath="url(#trunkClip)">
        <rect x={x1 - 64} y={-900} width={200} height={2800} fill="#8E5C33" />
        <path d={`M ${x1 - 64} -900 L ${x1 - 64} ${base}`} stroke="#9C6639" strokeWidth={10} />
      </g>
      <path d={trunkPath} fill="none" {...st} strokeWidth={8} />
      {/* bark marks */}
      {[[300, 200, 60], [440, 380, 50], [290, 640, 46], [470, 1340, 54], [300, 1480, 48], [360, -200, 60], [460, 0, 44], [300, 1010 + 420, 0]].map(([x, y, h], i) => h > 0 && (
        <path key={i} d={`M ${x} ${y} q 10 ${h / 2} 0 ${h}`} fill="none" {...st} strokeWidth={6} />
      ))}
      {/* canopy at the top */}
      {leafCluster([[390, -900, 260], [180, -820, 190], [600, -820, 200], [300, -700, 170], [500, -690, 170], [80, -700, 120], [700, -700, 130]], '#7CC35A', 'c')}
    </g>
  );
};
export const Hills: React.FC = () => (
  <g>
    <path d="M -2600 1700 Q -1900 1380 -1200 1600 Q -500 1360 200 1560 Q 900 1330 1600 1540 Q 2300 1380 3200 1620 L 3200 6000 L -2600 6000 Z" fill="#A6D86E" {...st} strokeWidth={9} />
    <path d="M -2600 1800 Q -1500 1600 -600 1760 Q 300 1600 1200 1740 Q 2100 1580 3200 1780 L 3200 6000 L -2600 6000 Z" fill="#93CC5E" {...st} strokeWidth={9} />
  </g>
);
export const Bushes: React.FC = () => (
  <g>
    <rect x={-3000} y={1900} width={8000} height={5000} fill="#8DC85A" />
    <path d="M -3000 1900 L 5000 1900" {...st} strokeWidth={8} />
    {leafCluster([[-420, 1870, 90], [-310, 1840, 110], [-190, 1880, 80]], '#6FB64C', 'l')}
    {leafCluster([[1240, 1880, 90], [1360, 1840, 120], [1490, 1880, 85]], '#6FB64C', 'r')}
  </g>
);
export const Ground: React.FC = () => (
  <g>
    <rect x={-3000} y={1760} width={8000} height={5000} fill="#9AD164" />
    <path d="M -3000 1760 L 5000 1760" {...st} strokeWidth={8} />
  </g>
);
export const GrassTuft: React.FC = () => (
  <g>
    <path d="M -90 0 Q -70 -110 -40 -150 Q -30 -70 -10 -30 Q 0 -150 30 -190 Q 40 -80 50 -30 Q 70 -110 100 -130 Q 90 -40 90 0 Z" fill="#6FB64C" {...st} />
  </g>
);
export const Cloud: React.FC = () => {
  const p = [[0, 0, 70], [80, -30, 90], [170, 0, 70], [90, 30, 70]];
  return (
    <g>
      {p.map(([x, y, r], i) => <circle key={`o${i}`} cx={x} cy={y} r={r + 5} fill={INK} />)}
      {p.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r - 4} fill="#fff" />)}
    </g>
  );
};
