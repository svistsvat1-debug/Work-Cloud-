// Quest 7 (Wonsan), Final boss, Outro: scenes 22-29
import React from 'react';
import {Frame, Layer, useShot, wave, W, H, clamp, smooth, rnd} from '../../engine/core';
import {Sky, Glow, Clouds, Sea, Smoke, Birds, Mist, Flicker, Searchlight, Ripples, Particles, Rays, WaterColumn, Flag} from '../../engine/fx';
import {Stamp, SvgText, TitleCard, FONT_TYPE, FONT_STENCIL} from '../../engine/text';
import {MapView, MapLabel, MapRoute, MapDot, MAP_PAPER, MAP_NIGHT, useXY} from '../../engine/map';
import {Ship, Mine} from '../../assets/ships';
import {Hills, Mountains, Grass, Houses, Pier, Island} from '../../assets/land';
import {Fighter} from '../../assets/planes';
import {Person} from '../../assets/people';
import {Desk, Lamp, Paper, PenSign, Crate, LogPage, Folder, RubberStamp, YearFlip, MedalBox, CapWithLots, WindowFrame} from '../../assets/props';
import {PAL, WaterFront, Stars, WreckPile, useK} from './common';

const N = PAL.night;
const K = PAL.khaki;

// ---------------- SCENE 22 · WONSAN ----------------
const s22_1: React.FC = () => {
  const {t} = useShot();
  const xy = (lo: number, la: number) => [lo, la];
  void xy;
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.55, oy: 0.45}} overlay={<Stamp text="WONSAN · OCTOBER 1950" />}>
      <Layer depth={0.3}>
        <MapView bbox={[124.5, 36.5, 131.5, 41.5]} style={MAP_NIGHT}>
          <MapDot lon={127.44} lat={39.15} pulse color="#d9a03a" />
          <MapLabel lon={127.44} lat={39.15} text="WONSAN" size={32} dx={-130} dy={10} color="#e8dcbc" font="stencil" />
          <FleetIcons t={t} />
        </MapView>
      </Layer>
    </Frame>
  );
};

const FleetIcons: React.FC<{t: number}> = ({t}) => {
  const xy = useXY();
  return (
    <g>
      {Array.from({length: 14}).map((_, i) => {
        const [x, y] = xy(128.7 + (i % 5) * 0.32, 39.6 - Math.floor(i / 5) * 0.35);
        return <path key={i} transform={`translate(${x + 4 * wave(t, 6, i * 0.2)} ${y})`} d="M-26 0 L-22 -8 L22 -10 L30 0 L22 6 L-22 6Z" fill="#c9d6dd" opacity={0.85} />;
      })}
    </g>
  );
};

const s22_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.025, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#13343a'], [0.5, '#0b1f24'], [1, '#03090b']]} />
      <Rays x={960} y={-200} color="#a8e0e0" n={5} opacity={0.07} />
    </Layer>
    <Layer depth={0.35}>
      {Array.from({length: 9}).map((_, i) => (
        <Mine key={i} x={-60 + i * 260} y={300 + (i % 3) * 30} r={40} color="#08171a" rim="#6fb0b0" chain={900} seed={i} />
      ))}
    </Layer>
    <Layer depth={0.7}>
      {Array.from({length: 6}).map((_, i) => (
        <Mine key={i} x={60 + i * 380} y={560 + (i % 2) * 50} r={80} color="#061114" rim="#6fb0b0" chain={700} seed={i + 20} />
      ))}
      <Particles color="#9fd6c8" n={60} opacity={0.3} seed="w22" />
    </Layer>
  </Frame>
);

const s22_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#0c1824'], [0.6, '#1d3444'], [1, '#3a5662']]} />
      <Stars n={40} maxY={400} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={230} color="#132430" seed="w23" />
      <Houses x={-100} y={700} n={9} color="#0f1d27" lit="#ffcf7a" scale={0.45} seed="w23h" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#1d3646" bottom="#06101a" streak="#9cc4d0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="destroyer" x={700} y={840} len={900} color="#070d14" rim="#9cc4d0" />
    </Layer>
  </Frame>
);

// ---------------- SCENE 23 · THE REQUEST ----------------
const Office: React.FC<{children?: React.ReactNode; move?: any}> = ({children, move}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#14161c" />
      <rect x={1300} y={140} width={460} height={500} fill="#0b1524" />
      <Stars n={24} maxY={600} />
      <rect x={1300} y={140} width={460} height={500} fill="none" stroke="#0c0c0e" strokeWidth={22} />
      <rect x={1520} y={140} width={16} height={500} fill="#0c0c0e" />
    </Layer>
    <Layer depth={0.5}>{children}</Layer>
  </Frame>
);

const s23_1: React.FC = () => (
  <Office>
    <Lamp x={960} y={330} s={1} />
    <path d="M360 760 L1560 760 L1700 1100 L220 1100Z" fill="#2c2018" />
    <rect x={360} y={748} width={1200} height={16} fill="#4a3426" />
    <Person x={480} y={980} h={520} hat="officer" color="#0a0b0e" facing={1} pose="sit" rim="#ffd896" seed={1} />
    <Person x={1440} y={980} h={500} hat="none" color="#0a0b0e" facing={-1} pose="sit" rim="#ffd896" seed={2} />
  </Office>
);

const s23_2: React.FC = () => {
  const k = smooth(useK(0.1, 0.7));
  return (
    <Frame move={{type: 'push', amount: 0.04}}>
      <Layer depth={0}>
        <Desk y={-300} color="#2c2018" edge="#2c2018" />
        <Glow x={960} y={300} r={800} color="#ffd896" opacity={0.3} />
      </Layer>
      <Layer depth={0.6}>
        <g transform={`translate(${-300 + 1100 * k} 0)`}>
          <Paper x={400} y={560} w={700} h={820} rot={-6} title="REQUEST" bars={10} />
        </g>
      </Layer>
    </Frame>
  );
};

const s23_3: React.FC = () => (
  <Office move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Person x={1520} y={1000} h={620} hat="none" color="#08090c" facing={1} rim="#9cb4d0" seed={3} />
    <Glow x={1530} y={400} r={400} color="#9cb4d0" opacity={0.15} />
  </Office>
);

const s23_4: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.05, ox: 0.5, oy: 0.5}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#0e0f12" />
    </Layer>
    <Layer depth={0.4}>
      <path d="M-200 -200 L860 400 L1060 400 L2200 -200Z" fill="#1a1c22" />
      <path d="M-200 1300 L860 680 L1060 680 L2200 1300Z" fill="#241f1a" />
      <path d="M-200 -200 L860 400 L860 680 L-200 1300Z" fill="#15171c" />
      <path d="M2200 -200 L1060 400 L1060 680 L2200 1300Z" fill="#121418" />
      <rect x={880} y={420} width={160} height={260} fill="#ffd896" />
      <Glow x={960} y={560} r={360} color="#ffd896" opacity={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={160 + i * 170 - i * 20} y={220 + i * 40} width={60 - i * 10} height={520 - i * 110} fill="#0c0d10" />
      ))}
    </Layer>
  </Frame>
);

const s23_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.04, ox: 0.45, oy: 0.55}}>
    <Layer depth={0}>
      <Desk y={-300} color="#2c2018" edge="#2c2018" />
      <Glow x={900} y={300} r={800} color="#ffd896" opacity={0.35} />
    </Layer>
    <Layer depth={0.6}>
      <Paper x={960} y={560} w={1100} h={900} rot={-2} bars={8} />
      <PenSign x={760} y={800} />
    </Layer>
  </Frame>
);

// ---------------- SCENE 24 · SHIMONOSEKI ----------------
const s24_1: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.03, dir: 1}} overlay={<Stamp text="SHIMONOSEKI · 6 OCT 1950" />}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars n={90} />
      <Glow x={1500} y={200} r={260} color="#dfeef2" core="#f2fafa" coreR={34} opacity={0.8} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={680} h={200} color={N.far} seed="sk" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={680} top="#1d3646" bottom="#06101a" streak="#cfe8f0" streaks={26} />
    </Layer>
    <Layer depth={0.55}>
      {Array.from({length: 16}).map((_, i) => (
        <Ship key={i} kind="minesweeper" x={1300 - i * 105 + (i % 2) * 20} y={740 + i * 6} len={90 + i * 4} color="#05090e" speed={12} roll={0.4} />
      ))}
    </Layer>
    <Layer depth={0.9}>
      <Pier x={1300} y={980} w={900} color="#03060a" />
      <Crate x={1620} y={964} w={440} h={200} text="16 SHIPS" text2="1,200 MEN" color="#3a2c1e" />
    </Layer>
  </Frame>
);

const s24_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#2a3138" />
      {Array.from({length: 7}).map((_, r) => (
        <g key={r}>
          <rect x={-200} y={-100 + r * 190} width={2400} height={5} fill="#000" opacity={0.3} />
          {Array.from({length: 28}).map((_, i) => (
            <circle key={i} cx={-160 + i * 90 + (r % 2) * 45} cy={-90 + r * 190} r={8} fill="#3c444c" stroke="#1a1f24" strokeWidth={3} />
          ))}
        </g>
      ))}
      {Array.from({length: 6}).map((_, i) => (
        <path key={i} d={`M${200 + i * 300} 0 q20 300 -10 700`} stroke="#7a3e22" strokeWidth={14} strokeOpacity={0.35} fill="none" />
      ))}
    </Layer>
    <Layer depth={0.6}>
      <g transform="translate(960 560) rotate(-2)">
        <rect x={-360} y={-140} width={720} height={280} rx={16} fill="#6a6050" stroke="#3a3428" strokeWidth={10} />
        {[[-330, -110], [330, -110], [-330, 110], [330, 110]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={12} fill="#3a3428" />
        ))}
        <text x={0} y={-30} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={52} fill="#3a3428" letterSpacing={6}>
          NAVAL YARD
        </text>
        <text x={0} y={60} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={56} fill="#3a3428" letterSpacing={8}>
          1944
        </text>
      </g>
    </Layer>
  </Frame>
);

const s24_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.6, oy: 0.5}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2e3a48'], [0.7, '#6f7a82'], [1, '#a9a99c']]} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={640} top="#5d686c" bottom="#1d2428" streak="#d8d8cc" />
      <Ship kind="carrierKatsuragi" x={1100} y={660} len={600} color="#2a3440" roll={0.2} />
    </Layer>
    <Layer depth={0.75}>
      <rect x={-200} y={820} width={2400} height={16} fill="#0c1014" />
      {Array.from({length: 14}).map((_, i) => (
        <rect key={i} x={-150 + i * 170} y={820} width={10} height={300} fill="#0c1014" />
      ))}
      <Person x={600} y={1120} h={640} hat="jsailor" pose="rail" color="#080b0e" rim="#d8d8cc" seed={7} />
    </Layer>
  </Frame>
);

const s24_4: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.03, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#3a424a'], [0.7, '#8a8c88'], [1, '#bcb6a2']]} />
      <Clouds color="#5c6268" opacity={0.5} n={5} scale={1.4} seed="fl4" />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={640} top="#6c7272" bottom="#1d2428" streak="#d8d2c0" />
      {[[100, 700, 520], [700, 690, 420], [1200, 700, 600]].map(([x, y, len], i) => (
        <Ship key={i} kind={i === 1 ? 'missouri' : 'transport'} x={x} y={y} len={len} color="#3e464c" roll={0.2} opacity={0.75} />
      ))}
    </Layer>
    <Layer depth={0.6}>
      {Array.from({length: 6}).map((_, i) => (
        <Ship key={i} kind="minesweeper" x={-100 + i * 340} y={860 + (i % 2) * 10} len={240} color="#141a1f" speed={20} wake="#d8d2c0" />
      ))}
    </Layer>
  </Frame>
);

// ---------------- SCENE 25 · M S FOURTEEN ----------------
const s25_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#3a3e46'], [0.7, '#8a8680'], [1, '#c8a888']]} />
      <Glow x={1500} y={680} r={300} color="#ffc89a" opacity={0.4} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#7a7470" bottom="#1d2226" streak="#e8d8c0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="minesweeper" x={560} y={850} len={720} color="#161b20" />
      <WaterColumn x={700} y={860} h={460} w={220} start={0.35} dur={0.6} color="#eceee8" />
    </Layer>
  </Frame>
);

const s25_2: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.4, oy: 0.55}}>
      <Layer depth={0}>
        <Sea y={-200} top="#4a5458" bottom="#1d2428" streak="#d8d8cc" streaks={30} />
      </Layer>
      <Layer depth={0.5}>
        <g transform={`translate(${620 + 10 * wave(t, 5)} ${560 + 8 * wave(t, 3.3)}) rotate(${-8 + 4 * wave(t, 4)})`}>
          <ellipse cx={0} cy={20} rx={170} ry={40} fill="#0d1114" opacity={0.4} />
          <path d="M-130 0 Q-120 -90 0 -96 Q120 -90 130 0 Q0 30 -130 0Z" fill="#e6e6e0" />
          <path d="M-136 0 Q0 34 136 0 L136 16 Q0 50 -136 16Z" fill="#1d2632" />
        </g>
        <Ripples x={620} y={580} color="#d8d8cc" max={300} period={4} />
      </Layer>
      <Layer depth={0.8}>
        <g transform="translate(1440 560) rotate(4)">
          <rect x={-300} y={-260} width={620} height={540} fill="#000" opacity={0.3} transform="translate(12 14)" />
          <rect x={-300} y={-260} width={620} height={540} fill="#e4dbc3" />
          {Array.from({length: 11}).map((_, i) => (
            <line key={i} x1={-300} y1={-210 + i * 44} x2={320} y2={-210 + i * 44} stroke="#8aa0b5" strokeOpacity={0.35} strokeWidth={2} />
          ))}
          <text x={-250} y={-120} fontFamily={FONT_TYPE} fontSize={44} fill="#2a241c" opacity={useK(0.2, 0.35)}>
            M S 14
          </text>
          <text x={-250} y={0} fontFamily={FONT_TYPE} fontSize={56} fill="#2a241c" opacity={useK(0.35, 0.5)}>
            1 KILLED
          </text>
          <text x={-250} y={90} fontFamily={FONT_TYPE} fontSize={56} fill="#2a241c" opacity={useK(0.5, 0.65)}>
            18 INJURED
          </text>
        </g>
      </Layer>
    </Frame>
  );
};

const s25_3: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2a2a3c'], [0.6, '#8a5a4a'], [1, '#d8905a']]} />
      <Glow x={1400} y={700} r={360} color="#ffb070" opacity={0.6} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#7a4a3a" bottom="#1a1418" streak="#ffc08a" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="tug" x={700} y={860} len={460} color="#120d10" rim="#ffb070" speed={6} wake="#ffc08a" />
    </Layer>
  </Frame>
);

const s25_4: React.FC = () => {
  const k = useK(0.15, 0.85);
  return (
    <Frame move={{type: 'push', amount: 0.035}}>
      <Layer depth={0}>
        <Desk y={-300} color="#2c2018" edge="#2c2018" />
        <Glow x={960} y={300} r={800} color="#ffd896" opacity={0.3} />
      </Layer>
      <Layer depth={0.6}>
        <LogPage x={960} y={560} marks={27} crossed={22} reveal={k} title="LT-636 · CREW 27" />
      </Layer>
    </Frame>
  );
};

// ---------------- SCENE 26 · THE BITTER TWIST ----------------
const ROKFlag = (w: number, h: number) => (
  <g>
    <circle cx={w / 2} cy={h / 2} r={h * 0.22} fill="#b8322a" />
    <path d={`M${w / 2 - h * 0.22} ${h / 2} A${h * 0.22} ${h * 0.22} 0 0 0 ${w / 2 + h * 0.22} ${h / 2}Z`} fill="#22407a" />
    {[[0.16, 0.2, 35], [0.84, 0.2, -35], [0.16, 0.8, -35], [0.84, 0.8, 35]].map(([fx, fy, a], i) => (
      <g key={i} transform={`translate(${w * fx} ${h * fy}) rotate(${a})`} fill="#141414">
        <rect x={-h * 0.09} y={-h * 0.1} width={h * 0.18} height={h * 0.045} />
        <rect x={-h * 0.09} y={-h * 0.03} width={h * 0.18} height={h * 0.045} />
        <rect x={-h * 0.09} y={h * 0.04} width={h * 0.18} height={h * 0.045} />
      </g>
    ))}
  </g>
);

const s26_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.55, oy: 0.55}}>
    <Layer depth={0}>
      <Sky stops={K.sky} />
      <Clouds color="#efe4c4" opacity={0.4} n={4} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={680} h={240} color={K.far} seed="ws" />
    </Layer>
    <Layer depth={0.35}>
      <Houses x={300} y={720} n={12} color={K.mid} scale={0.55} seed="wsh" />
      <rect x={1000} y={560} width={160} height={160} fill={K.mid} />
      <Flag x={1080} y={430} w={110} h={72} pole={130} field="#efece4" emblem={ROKFlag} />
      <Sea y={720} top="#8e8a72" bottom="#3a382c" streak="#f4e8c0" />
    </Layer>
  </Frame>
);

const s26_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.4}}>
    <Layer depth={0.3}>
      <MapView bbox={[125, 37, 130.5, 41]} style={MAP_PAPER}>
        <MapDot lon={127.44} lat={39.15} color="#2a2420" />
        <MapLabel lon={127.44} lat={39.15} text="WONSAN" size={30} dx={-110} dy={8} font="stencil" color="#2a2420" />
        <MapRoute pts={[[128.6, 38.0], [128.1, 38.6], [127.5, 39.1]]} color="#22407a" width={14} from={0.1} to={0.55} bend={0.05} />
        <MapLabel lon={128.8} lat={37.8} text="BY LAND · 10 OCT" size={22} dx={60} at={0.6} color="#22407a" />
        <MapRoute pts={[[130.0, 39.6], [128.6, 39.4], [127.7, 39.2]]} color="#8c2f22" width={10} dashed from={0.55} to={0.95} arrow={false} bend={0.05} />
        <MapLabel lon={129.8} lat={39.9} text="BY SEA · LATER" size={22} at={4} color="#8c2f22" />
      </MapView>
    </Layer>
  </Frame>
);

const s26_3: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#7c8288'], [0.7, '#c8c0a8'], [1, '#e8dcbc']]} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={600} top="#a8a28c" bottom="#5a5a4a" streak="#f4ecd4" />
    </Layer>
    <Layer depth={0.55}>
      <path d="M-200 860 Q600 820 1200 840 Q1700 860 2200 830 V1300 H-200Z" fill="#c9b994" />
      {[[400, 860], [900, 870], [1400, 860]].map(([x, y], i) => (
        <Ship key={i} kind="landingCraft" x={x} y={y} len={260} color="#3a3c34" roll={0.3} />
      ))}
    </Layer>
  </Frame>
);

const s26_4: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.65}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#4a4e56'], [0.7, '#8a8682'], [1, '#b0a090']]} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={640} top="#6a6866" bottom="#1d2226" streak="#d8d2c4" streaks={20} />
    </Layer>
    <Layer depth={0.6}>
      <g transform="translate(960 820)">
        <path d="M-30 0 L-22 -80 L22 -80 L30 0Z" fill="#2a1a16" />
        <rect x={-5} y={-130} width={10} height={50} fill="#2a1a16" />
      </g>
      <WaterFront y={818} color="#1d2226" opacity={0.85} />
      <Ripples x={960} y={822} color="#d8d2c4" max={160} />
    </Layer>
  </Frame>
);

// ---------------- SCENE 27 · TOP SECRET ----------------
const s27_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.4, oy: 0.5}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#1a140f" />
      <rect x={300} y={160} width={600} height={560} fill="#0e1a28" />
      <Stars n={20} maxY={700} />
      <Glow x={600} y={300} r={200} color="#dfeef2" opacity={0.4} />
    </Layer>
    <Layer depth={0.5}>
      <WindowFrame x={300} y={160} w={600} h={560} color="#120d09" />
      <Flicker x={1300} y={560} r={600} color="#ffc77a" opacity={0.5} seed="fam" />
      <rect x={-200} y={780} width={2400} height={500} fill="#241a12" />
      <Person x={1060} y={1020} h={460} hat="woman" skirt pose="sit" color="#0c0907" facing={-1} rim="#ffc77a" seed={2} />
      <rect x={880} y={720} width={90} height={64} fill="#e8dfc8" transform="rotate(-12 925 752)" />
    </Layer>
  </Frame>
);

const s27_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <Desk y={-300} color="#2a1f16" edge="#2a1f16" />
      <Glow x={900} y={300} r={800} color="#ffd896" opacity={0.3} />
    </Layer>
    <Layer depth={0.6}>
      <Folder x={760} y={560} label="MSA · KOREA 1950" />
      <RubberStamp x={760} y={600} text="TOP SECRET" at={0.4} size={90} />
      <YearFlip x={1560} y={420} from={1950} to={1979} start={0.35} end={0.85} />
      <g transform="translate(1520 860) scale(0.8)">
        <MedalBox x={0} y={0} />
      </g>
    </Layer>
  </Frame>
);

// ---------------- SCENE 28 · THE ANSWER ----------------
const s28_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02}}>
    <Layer depth={0}>
      <Sky stops={PAL.dusk.sky} />
      <Glow x={960} y={680} r={420} color="#ffc27a" core="#fff1cc" coreR={110} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#c7704a" bottom="#2a1f2e" streak="#ffd29a" />
    </Layer>
    <Layer depth={0.55}>
      <Island x={260} y={722} w={420} h={40} color="#14121c" />
      <WreckPile x={260} y={700} w={240} h={70} color="#14121c" seed="a1w" />
      <Smoke x={260} y={640} h={300} color="#3a2a35" opacity={0.4} seed="a1" />
      <Ship kind="carrierKatsuragi" x={620} y={790} len={560} color="#14121c" guns={false} />
      <Ship kind="minesweeper" x={1360} y={790} len={380} color="#14121c" rim="#f8b070" />
    </Layer>
  </Frame>
);

const s28_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={PAL.dusk.sky} />
      <Glow x={1500} y={660} r={360} color="#ffc27a" core="#fff1cc" coreR={100} />
    </Layer>
    <Layer depth={0.3}>
      <Hills y={830} amp={26} color="#3e2a3c" seed="a2h" rim="#e98a4f" />
      <Smoke x={1400} y={780} h={520} w={100} color="#3a2a35" opacity={0.5} seed="a2s" />
    </Layer>
    <Layer depth={0.5}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Fighter key={i} x={80 + i * 300} y={910} len={210} color="#1a1520" rim="#f2a060" prop="none" />
      ))}
    </Layer>
  </Frame>
);

const s28_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#40526a'], [0.55, '#c99a78'], [1, '#f6d6a4']]} />
      <Glow x={1300} y={640} r={420} color="#ffe0a8" core="#fff2d0" coreR={70} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={680} h={200} color="#6e7f6a" seed="a3m" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={690} top="#b58f74" bottom="#3b4a52" streak="#ffe2b0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="destroyer" x={240} y={880} len={1300} color="#1b1f23" rim="#ffd9a0" guns={false} speed={10} />
      {Array.from({length: 30}).map((_, i) => (
        <Person key={i} x={300 + i * 34} y={813 - i * 0.6} h={40} hat={i % 3 ? 'jcap' : 'none'} color="#1b1f23" walkSpeed={10} seed={i} />
      ))}
    </Layer>
  </Frame>
);

const s28_4: React.FC = () => {
  const a = useK(0.05, 0.25);
  const b = useK(0.3, 0.5);
  const c = useK(0.55, 0.75);
  return (
    <Frame move={{type: 'push', amount: 0.025}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#4a3826" />
        <rect x={160} y={200} width={1600} height={680} fill="#e8dfc8" />
      </Layer>
      <Layer depth={0.6}>
        <g opacity={a}>
          <CapWithLots x={480} y={560} s={1.1} />
          <SvgText x={480} y={800} text="RAFFLED" size={40} font="type" color="#2a2420" />
        </g>
        <g opacity={b}>
          <WreckPile x={960} y={640} w={360} h={140} color="#2a2420" seed="a4" />
          <SvgText x={960} y={800} text="SCRAPPED" size={40} font="type" color="#2a2420" />
        </g>
        <g opacity={c}>
          <ellipse cx={1440} cy={500} rx={130} ry={70} fill="#b8b0a0" />
          <rect x={1415} y={520} width={50} height={120} fill="#b8b0a0" />
          <path d="M1300 650 L1580 650" stroke="#2a2420" strokeWidth={6} />
          <SvgText x={1440} y={800} text="SUNK AT BIKINI" size={40} font="type" color="#2a2420" />
        </g>
      </Layer>
    </Frame>
  );
};

const s28_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.62}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#405070'], [0.55, '#d0a080'], [1, '#f8d8a0']]} />
      <Glow x={960} y={700} r={480} color="#ffe0a8" core="#fff2d0" coreR={110} />
      <Birds color="#3a3a48" x={600} y={360} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#c09a7a" bottom="#2f3a44" streak="#fff0c8" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="minesweeper" x={700} y={820} len={520} color="#141a20" rim="#ffe0a8" speed={8} wake="#fff0c8" />
    </Layer>
  </Frame>
);

const s28_6: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.4, oy: 0.5}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#405070'], [0.55, '#d0a080'], [1, '#f8d8a0']]} />
      <Glow x={1300} y={600} r={420} color="#ffe0a8" opacity={0.7} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={640} top="#c09a7a" bottom="#2f3a44" streak="#fff0c8" />
    </Layer>
    <Layer depth={0.75}>
      <rect x={-200} y={820} width={2400} height={16} fill="#0e1216" />
      {Array.from({length: 14}).map((_, i) => (
        <rect key={i} x={-150 + i * 170} y={820} width={10} height={300} fill="#0e1216" />
      ))}
      <g transform="rotate(3 600 1120)">
        <Person x={600} y={1120} h={600} hat="jsailor" pose="rail" color="#0a0d10" rim="#ffe0a8" seed={7} />
      </g>
    </Layer>
  </Frame>
);

const Hinomaru = (w: number, h: number) => <circle cx={w / 2} cy={h / 2} r={h * 0.3} fill="#b8322a" />;

const s28_7: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}} overlay={<Stamp text="1954" />}>
    <Layer depth={0}>
      <Sky stops={[[0, '#5d7080'], [0.6, '#b9c4c4'], [1, '#e8e2cc']]} />
      <Clouds color="#ffffff" opacity={0.5} n={4} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={700} top="#8a9898" bottom="#34404a" streak="#ffffff" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="minesweeper" x={360} y={860} len={900} color="#56606a" rim="#ffffff" roll={0.2} />
      <Flag x={420} y={650} w={110} h={74} pole={150} field="#f2efe8" emblem={Hinomaru} />
      <Pier x={-200} y={890} w={2400} color="#2a3038" posts={18} />
    </Layer>
  </Frame>
);

const s28_8: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02}}>
    <Layer depth={0}>
      <Sky stops={PAL.dusk.sky} />
      <Glow x={1300} y={720} r={360} color="#ffc27a" core="#fff1cc" coreR={90} />
    </Layer>
    <Layer depth={0.4}>
      <Hills y={820} amp={30} color="#3e2a3c" seed="a8h" />
      <g fill="#5a2c1e">
        <rect x={600} y={860} width={140} height={14} transform="rotate(-14 670 866)" />
        <circle cx={1000} cy={880} r={22} />
        <path d="M1200 880 l70 -10 l20 30 l-80 16z" />
        <path d="M800 900 Q840 860 880 900Z" />
      </g>
    </Layer>
    <Layer depth={1}>
      <Grass y={950} color="#1a1220" n={140} h={110} seed="a8g" />
    </Layer>
  </Frame>
);

const s28_9: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.035, ox: 0.5, oy: 0.5}}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars n={50} />
    </Layer>
    <Layer depth={0.5}>
      <rect x={300} y={300} width={1320} height={900} fill="#0b1016" />
      <rect x={560} y={420} width={360} height={240} fill="#ffcf7a" opacity={0.85} />
      <rect x={1000} y={420} width={360} height={240} fill="#ffcf7a" opacity={0.75} />
      <Flicker x={900} y={540} r={500} color="#ffcf7a" opacity={0.4} seed="wh9" />
      <rect x={1460} y={60} width={70} height={260} fill="#0b1016" />
      <Smoke x={1495} y={70} h={360} w={50} color="#3a4652" opacity={0.5} lean={-0.5} seed="ex9" />
      <Person x={760} y={660} h={200} hat="jsailor" color="#0b1016" facing={1} seed={9} />
    </Layer>
  </Frame>
);

// ---------------- SCENE 29 · OUTRO ----------------
const BattleIcon: React.FC = () => {
  const xy = useXY();
  const {p} = useShot();
  const k = smooth(clamp((p - 0.1) / 0.7));
  const a = xy(12.5, 41.5);
  const b = xy(33.5, 44.6);
  const x = a[0] + (b[0] - a[0]) * k;
  const y = a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 120;
  return <path transform={`translate(${x} ${y})`} d="M-40 0 L-34 -12 L34 -14 L48 0 L34 10 L-34 10Z" fill="#2a2420" />;
};

const s29_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.5, oy: 0.5}}>
    <Layer depth={0.3}>
      <MapView bbox={[5, 34, 42, 50]} style={MAP_PAPER}>
        <MapLabel lon={12.5} lat={42.5} text="ITALY" size={30} font="stencil" color="#3a3024" dx={60} />
        <MapLabel lon={33.5} lat={44.6} text="SEVASTOPOL" size={26} dy={-30} at={3} />
        <MapDot lon={33.5} lat={44.6} at={3} />
        <BattleIcon />
      </MapView>
    </Layer>
  </Frame>
);

const s29_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.6}} overlay={<Stamp text="SEVASTOPOL · 1955" />}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars />
    </Layer>
    <Layer depth={0.2}>
      <Hills y={700} amp={60} color={N.far} seed="sv" />
      <Houses x={1200} y={700} n={6} color={N.mid} lit="#ffcf7a" scale={0.45} seed="svh" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#1d3646" bottom="#06101a" streak="#9cc4d0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="missouri" x={300} y={860} len={1200} color="#060b10" rim="#9cc4d0" />
      <Flicker x={1340} y={860} r={260} color="#ff9a5a" opacity={0.5} seed="nv" />
    </Layer>
  </Frame>
);

const s29_3: React.FC = () => <TitleCard title="NEXT: THE BATTLESHIP STALIN GOT" sub="NEXT STORY" size={76} />;

export const SHOTS4: Record<string, React.FC> = {
  '22_1': s22_1, '22_2': s22_2, '22_3': s22_3,
  '23_1': s23_1, '23_2': s23_2, '23_3': s23_3, '23_4': s23_4, '23_5': s23_5,
  '24_1': s24_1, '24_2': s24_2, '24_3': s24_3, '24_4': s24_4,
  '25_1': s25_1, '25_2': s25_2, '25_3': s25_3, '25_4': s25_4,
  '26_1': s26_1, '26_2': s26_2, '26_3': s26_3, '26_4': s26_4,
  '27_1': s27_1, '27_2': s27_2,
  '28_1': s28_1, '28_2': s28_2, '28_3': s28_3, '28_4': s28_4, '28_5': s28_5, '28_6': s28_6, '28_7': s28_7, '28_8': s28_8, '28_9': s28_9,
  '29_1': s29_1, '29_2': s29_2, '29_3': s29_3,
};
