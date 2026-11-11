// Thumbnails (code only, same marker style as the video). Max 3 objects, max 4 words, no symbols, never repeats the title.
// A: "NO SOCKS?!"  (shocked close-up + foot wrap)   B: "LEFT BLANK?" (worried close-up + empty capsule slip)
// C: "AMERICAN LUNCH?" (smirking close-up + "second front" tin)
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Scribble, ell, rect } from './lib/draw';
import { C, F } from './lib/theme';

const INK = '#141414';
const Shape: React.FC<{ d: string; fill?: string; w?: number; seed?: number; flat?: boolean }> = ({ d, fill, w = 9, seed = 1, flat }) => (
  <g>
    {fill && <Scribble clip={d} at={-10} dur={0.1} color={fill} seed={seed} flat={flat} />}
    <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);
const Line: React.FC<{ d: string; w?: number; c?: string }> = ({ d, w = 8, c = INK }) => <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;

type Expr = 'shock' | 'worried' | 'smirk';

// detailed close-up of a young soldier (plain olive side cap, no insignia). Local box: head centre (0,0).
const BigFace: React.FC<{ x: number; y: number; s: number; expr: Expr }> = ({ x, y, s, expr }) => {
  const skin = '#F2C29A', shade = '#DFA27A', cap = '#5E8A2E', capDark = '#476B21', tunic = '#8E9F48', tunicDark = '#6F7F35';
  const head = 'M-175,-20 C-180,-150 -100,-215 0,-215 C100,-215 180,-150 175,-20 C172,90 110,205 0,212 C-110,205 -172,90 -175,-20 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* shoulders + standing collar */}
      <Shape d="M-420,470 C-400,300 -230,235 -80,215 L80,215 C230,235 400,300 420,470 Z" fill={tunic} seed={2} />
      <Shape d="M-95,190 L95,190 L110,262 L0,300 L-110,262 Z" fill={tunicDark} seed={3} />
      <Line d="M0,300 L0,470" />
      <Shape d={ell(-14, 345, 11)} fill="#C9A227" w={5} flat />
      <Shape d="M-300,330 L-180,330 L-180,400 L-300,400 Z" fill={tunicDark} seed={4} w={7} />
      <Shape d="M180,330 L300,330 L300,400 L180,400 Z" fill={tunicDark} seed={5} w={7} />
      {/* neck */}
      <Shape d="M-80,150 L80,150 L88,240 C40,262 -40,262 -88,240 Z" fill={shade} seed={6} />
      {/* ears */}
      <Shape d={ell(-178, 0, 34, 52)} fill={skin} seed={7} />
      <Shape d={ell(178, 0, 34, 52)} fill={skin} seed={8} />
      <Line d="M-182,-18 C-196,0 -192,20 -178,30" w={5} />
      <Line d="M182,-18 C196,0 192,20 178,30" w={5} />
      {/* head + shading */}
      <Shape d={head} fill={skin} seed={9} />
      <g opacity={0.55}><Scribble clip="M80,-200 C150,-160 178,-90 175,-20 C172,90 110,205 0,212 C70,170 120,80 118,-20 C116,-110 100,-170 80,-200 Z" at={-10} dur={0.1} color={shade} seed={10} /></g>
      <g opacity={0.5}><Scribble clip="M-170,-95 C-90,-122 90,-122 170,-95 L172,-60 C90,-86 -90,-86 -172,-60 Z" at={-10} dur={0.1} color={shade} seed={11} /></g>
      {/* blush + dirt + stubble for a more lived-in, realistic look */}
      <g opacity={0.55}><Scribble clip={ell(-105, 70, 38, 22)} at={-10} dur={0.1} color="#EE8E8E" seed={12} flat /></g>
      <g opacity={0.55}><Scribble clip={ell(105, 70, 38, 22)} at={-10} dur={0.1} color="#EE8E8E" seed={13} flat /></g>
      <Line d="M-135,20 L-110,32 M-128,36 L-104,44" w={6} c="#8B5A2B" />
      <Line d="M120,-30 L142,-20" w={6} c="#8B5A2B" />
      {[[-40, 165], [-10, 175], [25, 170], [55, 160], [-65, 150], [80, 145], [0, 190], [-28, 190], [35, 188]].map(([dx, dy], i) => <circle key={i} cx={dx} cy={dy} r={3.2} fill="#7A6A5A" opacity={0.7} />)}
      {/* side cap (pilotka) — plain, no star */}
      <Shape d="M-182,-95 C-170,-235 170,-245 186,-100 L176,-58 C80,-110 -80,-110 -176,-58 Z" fill={cap} seed={14} />
      <Shape d="M-176,-58 C-80,-110 80,-110 176,-58 L170,-88 C80,-132 -80,-132 -172,-88 Z" fill={capDark} seed={15} w={7} />
      <Line d="M-120,-150 C-40,-178 60,-178 140,-150" w={6} />
      {/* eyebrows */}
      {expr === 'shock' && <><Line d="M-120,-52 C-100,-82 -55,-86 -30,-62" w={16} c="#4A2E1A" /><Line d="M120,-52 C100,-82 55,-86 30,-62" w={16} c="#4A2E1A" /></>}
      {expr === 'worried' && <><Line d="M-118,-40 C-90,-52 -60,-64 -34,-74" w={16} c="#4A2E1A" /><Line d="M118,-40 C90,-52 60,-64 34,-74" w={16} c="#4A2E1A" /></>}
      {expr === 'smirk' && <><Line d="M-120,-56 C-95,-70 -60,-70 -32,-58" w={16} c="#4A2E1A" /><Line d="M118,-72 C95,-84 60,-80 32,-62" w={16} c="#4A2E1A" /></>}
      {/* eyes */}
      {(() => {
        const ry = expr === 'smirk' ? 30 : 46, rx = 40;
        const pr = expr === 'shock' ? 13 : 19;
        const look = expr === 'smirk' ? 10 : expr === 'worried' ? -8 : 0;
        return (
          <>
            {[-75, 75].map((ex) => (
              <g key={ex}>
                <path d={ell(ex, 0, rx, ry)} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
                <circle cx={ex + look} cy={expr === 'worried' ? 8 : 2} r={pr} fill={INK} />
                <circle cx={ex + look - pr * 0.35} cy={(expr === 'worried' ? 8 : 2) - pr * 0.4} r={pr * 0.32} fill="#FFFFFF" />
                {expr === 'smirk' && <Line d={`M${ex - 44},-18 C${ex - 10},-34 ${ex + 20},-34 ${ex + 44},-20`} w={9} />}
              </g>
            ))}
            {expr === 'shock' && [-75, 75].map((ex) => <Line key={'u' + ex} d={`M${ex - 26},58 C${ex - 8},64 ${ex + 8},64 ${ex + 26},58`} w={4} c="#B98060" />)}
          </>
        );
      })()}
      {/* nose */}
      <Line d="M0,20 C-10,55 -26,80 -12,96 C0,104 16,100 26,92" w={8} />
      <g opacity={0.5}><Scribble clip="M6,30 C20,60 34,80 26,92 C16,100 8,100 2,98 C12,80 14,60 6,30 Z" at={-10} dur={0.1} color={shade} seed={16} flat /></g>
      {/* mouth */}
      {expr === 'shock' && (
        <g>
          <Shape d={ell(0, 150, 46, 44)} fill="#5A1A1A" seed={17} flat />
          <Shape d="M-34,122 C-12,114 12,114 34,122 L30,134 C10,128 -10,128 -30,134 Z" fill="#FFFFFF" w={5} flat />
          <Shape d={ell(0, 172, 24, 12)} fill="#E77A7A" w={4} flat />
        </g>
      )}
      {expr === 'worried' && <Line d="M-50,160 C-25,132 25,132 50,160" w={11} />}
      {expr === 'smirk' && <Line d="M-50,140 C-10,160 30,158 62,120" w={11} />}
      {/* sweat */}
      {expr !== 'smirk' && [[150, -70, 1], [176, -10, 0.75]].map(([sx, sy, k], i) => (
        <Shape key={i} d={`M${sx},${sy - 34 * k} C${sx + 16 * k},${sy - 8 * k} ${sx + 22 * k},${sy + 6 * k} ${sx + 22 * k},${sy + 16 * k} C${sx + 22 * k},${sy + 32 * k} ${sx - 22 * k},${sy + 32 * k} ${sx - 22 * k},${sy + 16 * k} C${sx - 22 * k},${sy + 6 * k} ${sx - 16 * k},${sy - 8 * k} ${sx},${sy - 34 * k} Z`} fill="#7FC4F5" w={6} flat />
      ))}
    </g>
  );
};

// big marker headline: yellow with a thick black outline (Ink-Story-style click text in our marker font)
const Headline: React.FC<{ lines: string[]; x: number; y: number; size: number; rot?: number; color?: string }> = ({ lines, x, y, size, rot = -4, color = C.yellow }) => (
  <g transform={`rotate(${rot},${x},${y})`}>
    {lines.map((l, i) => (
      <text key={i} x={x} y={y + i * size * 1.02} fontFamily={F.pm} fontSize={size} fill={color} stroke={INK} strokeWidth={size * 0.11}
        strokeLinejoin="round" style={{ paintOrder: 'stroke' }}>{l}</text>
    ))}
  </g>
);
const Burst: React.FC<{ x: number; y: number; r: number; color: string }> = ({ x, y, r, color }) => {
  const pts = Array.from({ length: 28 }).map((_, i) => { const a = (i / 28) * Math.PI * 2; const rr = i % 2 ? r * 0.72 : r; return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`; });
  return <g opacity={0.95}><Scribble clip={'M' + pts.join(' L') + ' Z'} at={-10} dur={0.1} color={color} seed={21} /></g>;
};
const RedCircle: React.FC<{ x: number; y: number; rx: number; ry: number; rot?: number }> = ({ x, y, rx, ry, rot = -8 }) => (
  <path d={`M${x - rx},${y} C${x - rx},${y - ry * 1.1} ${x + rx * 1.05},${y - ry * 1.05} ${x + rx},${y + ry * 0.1} C${x + rx * 0.95},${y + ry * 1.1} ${x - rx * 0.9},${y + ry * 1.05} ${x - rx * 1.02},${y - ry * 0.15}`}
    transform={`rotate(${rot},${x},${y})`} fill="none" stroke={C.red} strokeWidth={16} strokeLinecap="round" />
);
const RedArrow: React.FC<{ x1: number; y1: number; x2: number; y2: number }> = ({ x1, y1, x2, y2 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 46;
  return (
    <g stroke={C.red} strokeWidth={20} strokeLinecap="round" fill="none">
      <path d={`M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 60} ${x2},${y2}`} />
      <path d={`M${x2},${y2} L${x2 - Math.cos(a - 0.55) * h},${y2 - Math.sin(a - 0.55) * h} M${x2},${y2} L${x2 - Math.cos(a + 0.55) * h},${y2 - Math.sin(a + 0.55) * h}`} />
    </g>
  );
};

const Frame: React.FC<{ children: React.ReactNode; glow: string }> = ({ children, glow }) => (
  <AbsoluteFill style={{ backgroundColor: '#FAF8F3' }}>
    <Img src={staticFile('paper.png')} style={{ position: 'absolute', inset: 0, width: 1280, height: 720 }} />
    <AbsoluteFill style={{ background: `radial-gradient(circle at 68% 45%, ${glow} 0%, rgba(250,248,243,0) 55%)` }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(60,40,20,0.28) 100%)' }} />
    <svg width={1280} height={720} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>{children}</svg>
  </AbsoluteFill>
);

// A — the recommended one
export const ThumbA: React.FC = () => (
  <Frame glow="rgba(255,201,60,0.55)">
    <Burst x={1380} y={470} r={520} color="#FFD45C" />
    <BigFace x={1380} y={470} s={1.3} expr="shock" />
    {/* bare foot with the cloth foot wrap (portyanka) half wound on */}
    <g transform="translate(560,790) scale(2.5) translate(-100,-100)">
      <Shape d="M86,30 L120,30 L122,128 C150,130 172,144 172,160 C172,176 150,178 104,176 L78,172 C70,150 80,118 86,30 Z" fill={C.skin} seed={61} w={4} />
      <Line d="M150,160 C152,166 152,170 150,174 M160,158 C162,164 162,168 160,172" w={2.5} />
      <Shape d="M80,96 L122,90 L124,150 L76,158 Z" fill="#F1E3C2" seed={62} w={4} />
      <Shape d="M120,132 C140,134 158,144 164,156 L150,168 C136,158 126,150 112,148 Z" fill="#F1E3C2" seed={63} w={4} />
      <Shape d="M122,96 C150,74 178,84 196,62 L204,80 C186,104 156,100 124,116 Z" fill="#F1E3C2" seed={64} w={4} />
      <Line d="M84,112 L120,106 M82,130 L122,124" w={2.5} />
    </g>
    <RedCircle x={610} y={790} rx={250} ry={240} rot={-6} />
    <Headline lines={['NO', 'SOCKS?!']} x={60} y={300} size={240} />
    <RedArrow x1={1090} y1={600} x2={900} y2={700} />
  </Frame>
);

// B — curiosity on the capsule (hints at the answer: use only as a test variant)
export const ThumbB: React.FC = () => (
  <Frame glow="rgba(232,50,43,0.35)">
    <Burst x={1380} y={440} r={480} color="#F7A29E" />
    <BigFace x={1380} y={450} s={1.25} expr="worried" />
    <g transform="translate(470,780) rotate(-18)">
      <Shape d="M-60,-200 L-30,-226 L30,-226 L60,-200 L60,200 L30,226 L-30,226 L-60,200 Z" fill="#2A2622" seed={41} />
      <Line d="M-30,-200 L-30,226 M30,-200 L30,226" w={6} c="#555" />
    </g>
    <g transform="translate(760,760) rotate(6)">
      <Shape d={rect(-210, -120, 420, 240)} fill="#FBF6E6" seed={42} />
      <Line d="M-170,-50 L170,-50 M-170,20 L170,20 M-170,90 L170,90" w={6} c="#7A7A7A" />
    </g>
    <RedCircle x={760} y={760} rx={300} ry={190} rot={4} />
    <Headline lines={['LEFT', 'BLANK?']} x={60} y={250} size={250} />
  </Frame>
);

// C — the "second front" tin
export const ThumbC: React.FC = () => (
  <Frame glow="rgba(30,136,229,0.3)">
    <Burst x={1380} y={450} r={500} color="#9CCBF2" />
    <BigFace x={1400} y={450} s={1.25} expr="smirk" />
    <g transform="translate(560,780)">
      <Shape d="M-190,-170 L190,-170 L190,190 C190,240 -190,240 -190,190 Z" fill={C.steel} seed={51} />
      <Shape d={ell(0, -170, 190, 48)} fill="#B9C6D2" seed={52} />
      <Shape d="M-190,-70 C-90,-40 90,-40 190,-70 L190,90 C90,120 -90,120 -190,90 Z" fill={C.red} seed={53} />
      <text x={0} y={40} textAnchor="middle" fontFamily={F.pm} fontSize={58} fill="#FFFFFF" stroke={INK} strokeWidth={6} style={{ paintOrder: 'stroke' }}>SECOND FRONT</text>
    </g>
    <Headline lines={['AMERICAN', 'LUNCH?']} x={60} y={250} size={210} />
  </Frame>
);

export const Thumb = ThumbA;
