// Publishing package v3 thumbnails: semi-realistic illustration (still 100% code-drawn SVG).
// Rules kept: max 3 objects, max 4 words, no title repetition, no Nazi symbols, no gore.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BoldText, Mug, RealClerk, RealRifleman, RealTruck} from '../../components/realistic';
import {useFonts} from '../../components/VideoFromTimeline';
import {rnd} from '../../lib/anim';

const Canvas: React.FC<{children: React.ReactNode}> = ({children}) => {
  useFonts();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={5} result="n" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.06} />
            </feComponentTransfer>
          </filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="haze" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <radialGradient id="vig3" cx="50%" cy="48%" r="72%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.42} />
          </radialGradient>
        </defs>
        {children}
        <rect width={1280} height={720} filter="url(#grain)" />
        <rect width={1280} height={720} fill="url(#vig3)" />
      </svg>
    </AbsoluteFill>
  );
};

/** A — SAME ARMY?: cold muddy front line vs warm office. */
export const ThumbA3: React.FC = () => (
  <Canvas>
    <defs>
      <linearGradient id="coldSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4c535a" />
        <stop offset="0.6" stopColor="#6d6f69" />
        <stop offset="1" stopColor="#4a3b2c" />
      </linearGradient>
      <linearGradient id="warmWall" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f7d68c" />
        <stop offset="1" stopColor="#d99a4e" />
      </linearGradient>
      <radialGradient id="lamp" cx="85%" cy="15%" r="60%">
        <stop offset="0" stopColor="#fff6cf" stopOpacity={0.9} />
        <stop offset="1" stopColor="#fff6cf" stopOpacity={0} />
      </radialGradient>
      <clipPath id="leftHalf">
        <path d="M0,0 L670,0 L600,720 L0,720 Z" />
      </clipPath>
      <clipPath id="rightHalf">
        <path d="M670,0 L1280,0 L1280,720 L600,720 Z" />
      </clipPath>
    </defs>
    {/* LEFT: front line */}
    <g clipPath="url(#leftHalf)">
      <rect width={1280} height={720} fill="url(#coldSky)" />
      {/* distant smoke (no fire) */}
      <ellipse cx={120} cy={220} rx={160} ry={70} fill="#9a9a95" opacity={0.45} filter="url(#soft)" />
      <ellipse cx={520} cy={160} rx={200} ry={60} fill="#8d8d88" opacity={0.4} filter="url(#soft)" />
      {/* barbed-wire posts on the horizon */}
      <path d="M40,430 L46,370 M180,425 L186,365 M330,430 L334,372 M40,382 Q110,400 180,378 Q260,398 330,384" stroke="#2a2621" strokeWidth={4} fill="none" />
      {/* mud ground */}
      <path d="M0,450 Q200,420 420,445 Q560,460 700,440 L700,720 L0,720 Z" fill="#5a4330" />
      <path d="M0,520 Q240,500 700,520 L700,720 L0,720 Z" fill="#4a3626" />
      {/* rain */}
      {Array.from({length: 90}).map((_, i) => {
        const x = rnd(i) * 720;
        const y = rnd(i + 300) * 720;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 46} stroke="#dfe7ee" strokeWidth={2} opacity={0.35} />;
      })}
      <RealRifleman x={310} y={340} s={1.12} mood="tired" look={[0.85, 0.1]} light="left" />
    </g>
    {/* RIGHT: office */}
    <g clipPath="url(#rightHalf)">
      <rect width={1280} height={720} fill="url(#warmWall)" />
      {/* window with daylight */}
      <rect x={1010} y={70} width={210} height={250} fill="#cfe9f7" stroke="#6b4b2a" strokeWidth={10} />
      <path d="M1115,70 L1115,320 M1010,195 L1220,195" stroke="#6b4b2a" strokeWidth={8} />
      <rect width={1280} height={720} fill="url(#lamp)" />
      {/* desk */}
      <path d="M600,600 L1280,600 L1280,720 L600,720 Z" fill="#7a4e2c" />
      <path d="M600,600 L1280,600" stroke="#4d2f19" strokeWidth={8} />
      <RealClerk x={950} y={350} s={1.05} mood="smug" />
      <Mug x={1170} y={560} s={0.95} />
    </g>
    {/* torn-paper divider */}
    <path d="M670,0 L660,60 L676,110 L652,170 L668,240 L644,300 L660,370 L636,430 L652,500 L626,570 L642,640 L600,720" fill="none" stroke="#f6f1e6" strokeWidth={18} strokeLinejoin="round" />
    <path d="M670,0 L660,60 L676,110 L652,170 L668,240 L644,300 L660,370 L636,430 L652,500 L626,570 L642,640 L600,720" fill="none" stroke="#1d1b18" strokeWidth={4} strokeLinejoin="round" />
    <BoldText text="SAME ARMY?" x={640} y={672} size={118} fill="#ffd23f" rot={-2} />
  </Canvas>
);

/** B — ALL FOR HIM?: misty dawn, endless line of support troops behind one rifleman. */
export const ThumbB3: React.FC = () => {
  const n = 18;
  const person = (x: number, y: number, h: number, shade: string, prop: number) => {
    const w = h * 0.34;
    return (
      <g key={x}>
        <ellipse cx={x} cy={y - h * 0.86} rx={w * 0.33} ry={w * 0.38} fill={shade} />
        <path d={`M${x - w / 2},${y - h * 0.08} L${x - w * 0.42},${y - h * 0.7} Q${x},${y - h * 0.78} ${x + w * 0.42},${y - h * 0.7} L${x + w / 2},${y - h * 0.08} Z`} fill={shade} />
        <path d={`M${x - w * 0.2},${y - h * 0.1} L${x - w * 0.24},${y} M${x + w * 0.2},${y - h * 0.1} L${x + w * 0.24},${y}`} stroke={shade} strokeWidth={Math.max(2, w * 0.18)} />
        {prop === 0 && <rect x={x + w * 0.35} y={y - h * 0.55} width={w * 0.6} height={w * 0.45} fill={shade} />}
        {prop === 1 && <path d={`M${x - w * 0.5},${y - h * 0.6} L${x - w * 1.1},${y - h * 0.3}`} stroke={shade} strokeWidth={Math.max(2, w * 0.12)} />}
      </g>
    );
  };
  return (
    <Canvas>
      <defs>
        <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b9c4" />
          <stop offset="0.55" stopColor="#efe2c6" />
          <stop offset="1" stopColor="#f3d9a6" />
        </linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e9a6a" />
          <stop offset="1" stopColor="#4c5a2c" />
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f2ead8" stopOpacity={0.85} />
          <stop offset="0.7" stopColor="#f2ead8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#dawn)" />
      <ellipse cx={240} cy={330} rx={130} ry={130} fill="#fff4d0" opacity={0.75} filter="url(#soft)" />
      <path d="M0,400 Q260,370 560,392 Q900,410 1280,380 L1280,720 L0,720 Z" fill="url(#field)" />
      <path d="M0,400 Q260,370 560,392 Q900,410 1280,380" fill="none" stroke="#3e4621" strokeWidth={3} opacity={0.6} />
      {/* the line: far = small, hazy, light */}
      {Array.from({length: n})
        .map((_, i) => i)
        .reverse()
        .map((i) => {
          const t = i / (n - 1);
          const x = 720 - t * 690;
          const y = 640 - t * 238;
          const h = 230 - t * 190;
          const c = Math.round(60 + t * 120);
          const shade = `rgb(${c},${c + 4},${c - 6})`;
          return person(x, y, h, shade, i % 3);
        })}
      <rect width={760} height={720} fill="url(#mist)" opacity={0.55} />
      <path d="M140,190 Q480,90 800,190" fill="none" stroke="#1d1b18" strokeWidth={22} strokeLinecap="round" />
      <path d="M140,190 Q480,90 800,190" fill="none" stroke="#e8322b" strokeWidth={13} strokeLinecap="round" />
      <path d="M752,150 L806,194 L740,214" fill="none" stroke="#1d1b18" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M752,150 L806,194 L740,214" fill="none" stroke="#e8322b" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <RealRifleman x={1030} y={330} s={1.12} mood="worried" look={[-0.95, 0]} light="left" flip />
      <BoldText text="ALL FOR HIM?" x={430} y={112} size={104} fill="#ffd23f" rot={-3} />
    </Canvas>
  );
};

/** C — 5,958 TRUCKS. ONE DAY.: shocked rifleman, dusty convoy winding from the horizon. */
export const ThumbC3: React.FC = () => {
  const road = (t: number): [number, number] => {
    const p0 = [720, 330];
    const p1 = [1180, 470];
    const p2 = [760, 760];
    return [
      (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
      (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
    ];
  };
  const trucks = [0.04, 0.12, 0.22, 0.35, 0.52, 0.74];
  return (
    <Canvas>
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb3cf" />
          <stop offset="1" stopColor="#f1dfb8" />
        </linearGradient>
        <linearGradient id="land3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a6a26a" />
          <stop offset="1" stopColor="#5d6532" />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill="url(#sky3)" />
      <path d="M0,330 Q200,290 420,312 Q640,334 860,300 Q1080,270 1280,300 L1280,720 L0,720 Z" fill="#b9b78a" opacity={0.7} />
      <path d="M0,350 Q300,320 640,345 T1280,330 L1280,720 L0,720 Z" fill="url(#land3)" />
      <path d="M706,332 Q1180,470 640,760 L880,760 Q1250,470 734,332 Z" fill="#cdb98c" stroke="#7b6a46" strokeWidth={3} />
      {trucks.map((t, i) => {
        const [x, y] = road(t);
        const s = 0.08 + t * 0.62;
        return (
          <g key={i}>
            <ellipse cx={x + 160 * s} cy={y - 20 * s} rx={180 * s} ry={70 * s} fill="#e3d2a8" opacity={0.55} filter="url(#soft)" />
            <RealTruck x={x} y={y - 70 * s} s={s} flip={t < 0.3} haze={Math.max(0, 0.6 - t)} />
          </g>
        );
      })}
      <RealRifleman x={260} y={355} s={1.12} mood="shocked" look={[0.95, -0.2]} light="right" />
      <BoldText text="5,958" x={1250} y={128} size={132} anchor="end" fill="#ffd23f" />
      <BoldText text="TRUCKS." x={1250} y={218} size={84} anchor="end" />
      <BoldText text="ONE DAY." x={1250} y={318} size={100} anchor="end" fill="#ff5a4f" />
    </Canvas>
  );
};
