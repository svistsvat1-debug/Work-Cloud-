// Quest 4 (Nagato / Bikini), Quest 5 (mines / sweepers), Quest 6 (no army / Korea): scenes 14-21
import React from 'react';
import {Frame, Layer, useShot, wave, W, H, clamp, smooth, rnd} from '../../engine/core';
import {Sky, Glow, Clouds, Sea, Smoke, Birds, Mist, Flicker, Searchlight, Ripples, Particles, Rays, Bubbles, WaterColumn, Rain} from '../../engine/fx';
import {Stamp, SvgText, FONT_TYPE, FONT_STENCIL, FONT_NUM} from '../../engine/text';
import {MapView, MapLabel, MapRoute, MapDot, MAP_PAPER, MAP_COLD, MAP_NIGHT, useXY, ScreenArrow} from '../../engine/map';
import {Ship, Mine} from '../../assets/ships';
import {Hills, Mountains, Grass, Houses, Pier, Palm, Island, Tree} from '../../assets/land';
import {Bomber, DropMine, Fighter} from '../../assets/planes';
import {Person, Crowd} from '../../assets/people';
import {Paper, RubberStamp, Lamp} from '../../assets/props';
import {PAL, WaterFront, Stars, WreckPile, useK} from './common';

const ST = PAL.steel;
const L = PAL.lagoon;
const TE = PAL.teal;
const G = PAL.green;
const SL = PAL.slate;
const SE = PAL.sepia;
const N = PAL.night;
const K = PAL.khaki;

// ---------------- SCENE 14 · NAGATO ----------------
const SteelSea: React.FC<{children?: React.ReactNode; move?: any; stamp?: string}> = ({children, move, stamp}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03}} overlay={stamp ? <Stamp text={stamp} /> : undefined}>
    <Layer depth={0}>
      <Sky stops={[[0, '#3c4a5c'], [0.6, '#8a98a4'], [0.85, '#d9cfae'], [1, '#efe3bb']]} />
      <Glow x={1450} y={560} r={500} color="#ffe6a8" opacity={0.5} />
      <Clouds color="#c9cfd2" opacity={0.35} n={5} y={[80, 300]} scale={1.6} seed="ss" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#8f9696" bottom="#323b42" streak="#f6e6b6" />
    </Layer>
    <Layer depth={0.55}>{children}</Layer>
  </Frame>
);

const s14_1: React.FC = () => (
  <SteelSea>
    <Ship kind="nagato" x={260} y={860} len={1400} color="#1f262c" rim={ST.rim} />
  </SteelSea>
);

const s14_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}} overlay={<Stamp text="DECEMBER 1941" />}>
    <Layer depth={0}>
      <Sky stops={[[0, '#1a2230'], [0.7, '#3c4a5c'], [1, '#6a7480']]} />
      <Stars n={30} maxY={300} />
    </Layer>
    <Layer depth={0.5}>
      {/* close-up of pagoda tiers */}
      <g fill="#10151b">
        <path d="M500 1100 L520 640 L1400 620 L1420 1100Z" />
        <path d="M460 640 L470 560 L1450 540 L1460 620Z" />
        <path d="M600 560 L620 300 L1300 290 L1320 545Z" />
        <path d="M560 300 L570 250 L1360 240 L1370 290Z" />
        <rect x={900} y={-100} width={30} height={360} />
      </g>
      <rect x={660} y={380} width={600} height={110} fill="#f3c27a" opacity={0.85} />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={660 + i * 100} y={380} width={10} height={110} fill="#10151b" />
      ))}
      <Person x={980} y={500} h={150} hat="officer" color="#10151b" facing={1} seed={1} />
      <Glow x={960} y={430} r={420} color="#f3c27a" opacity={0.3} />
    </Layer>
  </Frame>
);

const s14_3: React.FC = () => (
  <SteelSea move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.65}}>
    <Ship kind="nagato" x={760} y={760} len={420} color="#2a3138" rim={ST.rim} />
  </SteelSea>
);

// ---------------- SCENE 15 · BIKINI ----------------
const Lagoon: React.FC<{children?: React.ReactNode; fg?: React.ReactNode; move?: any; stamp?: string; sky?: any}> = ({children, fg, move, stamp, sky}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03}} overlay={stamp ? <Stamp text={stamp} color="#1f3a3a" /> : undefined}>
    <Layer depth={0}>
      <Sky stops={sky ?? L.sky} />
      <Clouds color="#ffffff" opacity={0.6} n={5} y={[100, 380]} seed="lg" />
    </Layer>
    <Layer depth={0.2}>
      <Island x={300} y={690} w={700} h={40} color="#3f7a74" palms={5} palmColor="#2c5d58" />
      <Island x={1600} y={692} w={600} h={34} color="#3f7a74" palms={4} palmColor="#2c5d58" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={690} top="#56b6ad" bottom="#1d5f69" streak="#e8fff6" />
    </Layer>
    <Layer depth={0.55}>{children}</Layer>
    <Layer depth={1}>{fg}</Layer>
  </Frame>
);

const s15_1: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={L.sky} />
      <Clouds color="#ffffff" opacity={0.6} n={5} seed="sail" />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={640} top="#56b6ad" bottom="#1d5f69" streak="#e8fff6" />
    </Layer>
    <Layer depth={0.6}>
      <path d="M-200 820 L2200 780 L2200 1300 L-200 1300Z" fill="#4a5258" />
      <rect x={-200} y={760} width={2400} height={12} fill="#2c3338" />
      {Array.from({length: 20}).map((_, i) => (
        <rect key={i} x={-180 + i * 120} y={700} width={6} height={64} fill="#2c3338" />
      ))}
      <rect x={-200} y={700} width={2400} height={6} fill="#2c3338" />
      {[500, 760, 1120, 1380].map((x, i) => (
        <Person key={i} x={x} y={1040} h={380 - i * 10} hat="usSailor" color="#1d2328" rim="#ffffff" pose={i === 2 ? 'rail' : 'stand'} seed={i} />
      ))}
    </Layer>
  </Frame>
);

const s15_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.6, oy: 0.6}}>
    <Layer depth={0.3}>
      <MapView bbox={[128, 2, 172, 40]} style={MAP_PAPER}>
        <MapDot lon={139.7} lat={35.3} />
        <MapLabel lon={139.7} lat={35.3} text="YOKOSUKA" size={24} dy={-22} dx={-80} />
        <MapRoute pts={[[139.7, 35.3], [152, 25], [165.4, 11.6]]} color="#2a2420" width={5} dashed from={0.05} to={0.75} arrow={false} bend={0.1} />
        <MapDot lon={165.4} lat={11.6} at={4.5} pulse />
        <MapLabel lon={165.4} lat={11.6} text="BIKINI ATOLL" size={30} dy={-28} at={4.5} font="stencil" />
      </MapView>
    </Layer>
  </Frame>
);

const s15_3: React.FC = () => (
  <Lagoon
    fg={
      <>
        <Palm x={120} y={1120} h={700} color="#0d2624" seed="lp1" lean={0.2} />
        <Palm x={1820} y={1140} h={640} color="#0d2624" seed="lp2" lean={-0.22} />
      </>
    }
  >
    {[[200, 760, 380, 'destroyer'], [640, 770, 520, 'nagato'], [1180, 762, 420, 'transport'], [1560, 758, 300, 'destroyer'], [380, 740, 220, 'cargo'], [1400, 735, 200, 'cargo']].map(([x, y, len, k], i) => (
      <Ship key={i} kind={k as any} x={x as number} y={y as number} len={len as number} color={i < 4 ? '#22343a' : '#3a5a5c'} roll={0.3} />
    ))}
  </Lagoon>
);

const AirCloud: React.FC<{x: number; y: number}> = ({x, y}) => {
  const {p} = useShot();
  const k = smooth(clamp((p - 0.1) / 0.9));
  const r = 60 + 220 * k;
  return (
    <g>
      <Glow x={x} y={y} r={500 * (0.6 + 0.4 * (1 - k))} color="#fff6e0" opacity={0.9 * (1 - k * 0.6)} />
      <ellipse cx={x} cy={y - 140 * k} rx={r} ry={r * 0.55} fill="#f2ede2" opacity={0.85} />
      <ellipse cx={x} cy={y - 140 * k + r * 0.4} rx={r * 0.7} ry={r * 0.25} fill="#e0d8c8" opacity={0.7} />
      <rect x={x - 30 - 20 * k} y={y - 140 * k + r * 0.4} width={60 + 40 * k} height={140 * k + 40} fill="#e8e2d4" opacity={0.6} />
    </g>
  );
};

const s15_4: React.FC = () => (
  <Lagoon stamp="1 JULY 1946" move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.55}} sky={[[0, '#7fa6b6'], [0.6, '#c6dcdc'], [1, '#f3f2e6']]}>
    <AirCloud x={960} y={560} />
    {[300, 520, 760, 1080, 1320, 1560].map((x, i) => (
      <Ship key={i} kind={i % 3 === 1 ? 'nagato' : 'destroyer'} x={x} y={720 + (i % 2) * 6} len={160} color="#2c4a50" roll={0.2} />
    ))}
  </Lagoon>
);

const s15_5: React.FC = () => (
  <Lagoon move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Smoke x={1000} y={560} h={520} w={90} color="#5b6b6b" opacity={0.45} lean={0.6} seed="n55" />
    <Ship kind="nagato" x={300} y={850} len={1300} color="#22343a" rim="#ffffff" />
  </Lagoon>
);

const s15_6: React.FC = () => (
  <Lagoon move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.6}} stamp="25 JULY 1946">
    <WaterColumn x={960} y={720} h={520} w={260} color="#eef3ee" start={0.05} dur={0.95} />
    {[300, 520, 760, 1180, 1400, 1640].map((x, i) => (
      <Ship key={i} kind={i % 3 === 1 ? 'nagato' : 'destroyer'} x={x} y={722 + (i % 2) * 6} len={150} color="#2c4a50" roll={0.2} />
    ))}
  </Lagoon>
);

const s15_7: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2e3c56'], [0.6, '#b07a6a'], [1, '#f0b88a']]} />
      <Glow x={1500} y={700} r={400} color="#ffc89a" opacity={0.6} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#9a7a72" bottom="#1d2c34" streak="#ffd8b0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="nagato" x={300} y={870} len={1200} color="#162026" rim="#ffc89a" listDeg={-5} roll={0.2} sinkY={30} />
      <WaterFront y={880} color="#1d2c34" opacity={0.7} />
    </Layer>
  </Frame>
);

const s15_8: React.FC = () => {
  const {e} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.02}}>
      <Layer depth={0}>
        <Sky stops={N.sky} />
        <Stars n={80} />
        <Glow x={1500} y={240} r={260} color="#d8ecf0" core="#f2fafa" coreR={36} opacity={0.8} />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={720} top="#1d3646" bottom="#06101a" streak="#cfe8f0" />
      </Layer>
      <Layer depth={0.55}>
        <Ship kind="nagato" x={360} y={870} len={1200} color="#060c12" rim="#cfe8f0" roll={0.2} listDeg={-4 - 10 * e} sinkY={40 + 260 * e} />
        <WaterFront y={860} color="#0a1824" opacity={0.95} />
        <Ripples x={960} y={866} color="#cfe8f0" max={500} period={4} />
      </Layer>
    </Frame>
  );
};

const Underwater: React.FC<{children?: React.ReactNode; move?: any}> = ({children, move}) => (
  <Frame move={move ?? {type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2f8a8a'], [0.5, '#145056'], [1, '#062226']]} />
      <Rays x={960} y={-100} color="#c8fff2" n={6} opacity={0.12} spread={900} />
    </Layer>
    <Layer depth={0.5}>{children}</Layer>
    <Layer depth={0.9}>
      <Particles color="#bfeee6" n={70} opacity={0.35} seed="uw" />
    </Layer>
  </Frame>
);

const s15_9: React.FC = () => {
  const {t} = useShot();
  return (
    <Underwater>
      <path d="M-200 900 Q500 860 960 890 Q1500 920 2200 880 V1300 H-200Z" fill="#b8a77c" opacity={0.55} />
      <g transform="translate(250 805) scale(1.4 -1.4)">
        <path d="M20 0 L0 -54 L1000 -66 L952 0 Z" fill="#051618" />
        <path d="M20 0 L952 0" stroke="#7fd0c4" strokeWidth={3} strokeOpacity={0.5} />
      </g>
      <path d="M260 805 Q900 790 1580 800" fill="none" stroke="#7fd0c4" strokeWidth={4} strokeOpacity={0.35} />
      {Array.from({length: 6}).map((_, i) => (
        <path key={i} transform={`translate(${300 + i * 260 + 30 * t} ${500 + (i % 3) * 60 + 8 * wave(t, 3, i)})`} d="M0 0 Q20 -12 40 0 Q20 12 0 0Z M40 0 L54 -10 L54 10Z" fill="#0b3438" />
      ))}
      <Bubbles x={1100} y={760} n={8} />
    </Underwater>
  );
};

// ---------------- SCENE 16 · THE LAST PIECE ----------------
const s16_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02}}>
    <Layer depth={0.4}>
      <defs>
        <clipPath id="s161L">
          <rect x={-200} y={-200} width={1160} height={1500} />
        </clipPath>
        <clipPath id="s161R">
          <rect x={960} y={-200} width={1260} height={1500} />
        </clipPath>
      </defs>
      <g clipPath="url(#s161L)">
        <Sky stops={PAL.red.sky} />
        <rect x={-200} y={830} width={1200} height={500} fill="#1a0f14" />
        <Smoke x={480} y={700} h={560} color="#2a1820" opacity={0.5} seed="sp1s" />
        <WreckPile x={480} y={840} w={600} h={220} color="#0d0a10" seed="sp1" />
      </g>
      <g clipPath="url(#s161R)">
        <Sky stops={L.sky} />
        <Island x={1500} y={700} w={500} h={34} color="#3f7a74" palms={3} palmColor="#2c5d58" />
        <Sea y={700} top="#56b6ad" bottom="#1d5f69" streak="#e8fff6" />
        <Ripples x={1450} y={840} color="#e8fff6" max={200} period={4} />
      </g>
      <rect x={952} y={-200} width={16} height={1500} fill="#0b0b0b" />
    </Layer>
  </Frame>
);

const s16_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.45}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#1d3a36'], [0.5, '#0f2422'], [1, '#050c0b']]} />
      <Rays x={1100} y={-200} color="#bfeee6" n={4} opacity={0.08} />
    </Layer>
    <Layer depth={0.6}>
      <Mine x={960} y={440} r={150} color="#0a1412" rim="#7fbfb0" chain={600} />
    </Layer>
    <Layer depth={0.9}>
      <Particles color="#9fd6c8" n={90} opacity={0.35} seed="m162" />
    </Layer>
  </Frame>
);

// ---------------- SCENE 17 · THE MINES ----------------
const MineIcons: React.FC = () => {
  const xy = useXY();
  const {p} = useShot();
  const spots: [number, number][] = [
    [130.9, 33.95], [131.0, 34.0], [130.8, 33.9], [135.2, 34.6], [135.4, 34.5], [139.8, 35.4], [139.7, 35.2], [132.5, 34.3], [133.8, 34.3], [135.0, 34.3], [129.9, 33.6], [136.9, 35.0], [134.6, 34.6], [131.5, 33.9], [132.2, 33.9], [140.9, 38.2], [139.0, 37.9], [133.5, 35.5],
  ];
  return (
    <g>
      {spots.map(([lo, la], i) => {
        const [x, y] = xy(lo, la);
        const o = clamp((p - 0.05 - i * 0.035) / 0.05);
        return (
          <g key={i} transform={`translate(${x + rnd(`mi${i}`) * 30 - 15} ${y + rnd(`mj${i}`) * 30 - 15})`} opacity={o}>
            {[0, 60, 120].map((a) => (
              <rect key={a} x={-2} y={-14} width={4} height={28} fill="#1c2224" transform={`rotate(${a})`} />
            ))}
            <circle r={9} fill="#1c2224" />
          </g>
        );
      })}
    </g>
  );
};

const s17_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.45, oy: 0.55}}>
    <Layer depth={0.3}>
      <MapView bbox={[128.5, 31.5, 142, 39.5]} style={MAP_COLD}>
        <MineIcons />
        <MapLabel lon={131} lat={33.4} text="SHIMONOSEKI STRAIT" size={24} dy={70} at={1} />
        <MapLabel lon={139.8} lat={35.4} text="TOKYO BAY" size={24} dy={-30} at={3} />
      </MapView>
    </Layer>
  </Frame>
);

const s17_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars />
      <Searchlight x={300} y={900} angle={-60} sweep={14} period={10} />
      <Searchlight x={1500} y={900} angle={-115} sweep={16} period={12} />
    </Layer>
    <Layer depth={0.3}>
      <Mountains y={860} h={260} color={N.far} seed="b72" />
      <Sea y={860} top="#1d3646" bottom="#06101a" streak="#9cc4d0" />
    </Layer>
    <Layer depth={0.6}>
      <Bomber x={200} y={360} len={700} color="#0a0f16" speed={40} rim="#9cc4d0" />
      {[0, 0.8, 1.6, 2.4].map((s, i) => (
        <DropMine key={i} x={520 + i * 30 + 40 * s} y={350} start={1 + s} fall={600} color="#0a0f16" />
      ))}
    </Layer>
  </Frame>
);

const s17_3: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.03}}>
      <Layer depth={0}>
        <Sky stops={[[0, '#7f9aa0'], [0.7, '#cfd8d0'], [1, '#eef0e2']]} />
        <Glow x={1400} y={620} r={400} color="#fff3d0" opacity={0.6} />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={640} top="#a9b8b2" bottom="#4a5e60" streak="#ffffff" />
      </Layer>
      <Layer depth={0.6}>
        <Mine x={960} y={760} r={120} color="#1e2626" rim="#ffffff" float />
        <g transform={`translate(${975} ${603 + 6 * wave(t, 3.1)})`} fill="#e9ece8">
          <ellipse cx={0} cy={0} rx={34} ry={18} />
          <circle cx={26} cy={-14} r={11} />
          <path d="M34 -14 L50 -10 L34 -8Z" fill="#d9a03a" />
          <path d="M-30 -4 L-62 -16 L-26 6Z" fill="#9aa4a6" />
          <rect x={-6} y={16} width={3} height={16} fill="#d9a03a" />
          <rect x={6} y={16} width={3} height={16} fill="#d9a03a" />
        </g>
        <WaterFront y={790} color="#4a5e60" opacity={0.85} />
        <Ripples x={960} y={795} color="#ffffff" max={260} />
      </Layer>
    </Frame>
  );
};

const s17_4: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.65}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#55606b'], [0.6, '#c8b090'], [1, '#f2cf98']]} />
      <Glow x={600} y={700} r={420} color="#ffd9a0" core="#fff0cc" coreR={60} opacity={0.8} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={720} h={150} color="#4a5058" seed="fb" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#a08a76" bottom="#2b3438" streak="#ffe0b0" />
    </Layer>
    <Layer depth={0.55}>
      <WaterColumn x={1180} y={830} h={300} w={120} start={0.3} dur={0.6} color="#eef0ea" />
      <g transform="translate(900 840)">
        <path d="M0 0 L-10 -40 L300 -50 L280 0Z" fill="#1c1f22" />
        <rect x={60} y={-110} width={80} height={62} fill="#1c1f22" />
        <rect x={200} y={-170} width={6} height={120} fill="#1c1f22" />
      </g>
    </Layer>
  </Frame>
);

// ---------------- SCENE 18 · THE SWEEPERS ----------------
const DawnHarbor: React.FC<{children?: React.ReactNode; move?: any; fg?: React.ReactNode}> = ({children, move, fg}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#3c4650'], [0.6, '#8f9496'], [0.85, '#d6bf9a'], [1, '#eed4a6']]} />
      <Glow x={1350} y={680} r={400} color="#ffe2b0" opacity={0.6} />
      <Birds color="#2c3238" x={300} y={300} n={5} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={170} color="#56606a" seed="dh" />
      <Houses x={-100} y={700} n={8} color="#46505a" scale={0.5} seed="dhh" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#8a8c8a" bottom="#2a3238" streak="#f6e2b8" />
    </Layer>
    <Layer depth={0.55}>{children}</Layer>
    <Layer depth={1}>{fg}</Layer>
  </Frame>
);

const s18_1: React.FC = () => (
  <DawnHarbor>
    <Pier x={-200} y={820} w={2400} color="#181d22" posts={18} />
    {[[-80, 880], [520, 900], [1120, 890]].map(([x, y], i) => (
      <Ship key={i} kind="minesweeper" x={x} y={y} len={520} color="#1e252b" rim="#f6e2b8" roll={0.3} />
    ))}
    {[200, 300, 820, 1400].map((x, i) => (
      <Person key={i} x={x} y={805} h={80} hat="jsailor" color="#1e252b" seed={i} />
    ))}
  </DawnHarbor>
);

const s18_2: React.FC = () => (
  <DawnHarbor move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Pier x={1200} y={820} w={1000} color="#181d22" />
    <Ship kind="minesweeper" x={300} y={880} len={700} color="#1e252b" rim="#f6e2b8" speed={25} wake="#f6e2b8" />
  </DawnHarbor>
);

const s18_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.45, oy: 0.55}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#3c4650'], [0.7, '#9a9a94'], [1, '#d6bf9a']]} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={620} top="#8a8c8a" bottom="#2a3238" streak="#f6e2b8" />
    </Layer>
    <Layer depth={0.6}>
      <path d="M-200 780 L2200 760 L2200 1300 L-200 1300Z" fill="#3a3228" />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={-200} y1={800 + i * 40} x2={2200} y2={780 + i * 40} stroke="#000" strokeOpacity={0.18} strokeWidth={3} />
      ))}
      <Person x={860} y={1080} h={640} hat="jsailor" color="#14181b" rim="#f6e2b8" pose="kneel" seed={3} />
      {Array.from({length: 4}).map((_, i) => (
        <ellipse key={i} cx={1180} cy={1010 - i * 14} rx={160 - i * 8} ry={36} fill="none" stroke="#14181b" strokeWidth={12} />
      ))}
    </Layer>
  </Frame>
);

const s18_4: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'drift', amount: 0.03, dir: 1}}>
      <Layer depth={0}>
        <Sky stops={[[0, '#4a525a'], [0.7, '#a2a29a'], [1, '#d8cdb2']]} />
        <Clouds color="#6e747a" opacity={0.5} n={5} scale={1.4} seed="sw" />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={660} top="#7d8585" bottom="#262e33" streak="#e6dcc4" streaks={26} />
      </Layer>
      <Layer depth={0.55}>
        <Ship kind="minesweeper" x={120} y={780} len={420} color="#1e252b" speed={12} wake="#e6dcc4" />
        <Ship kind="minesweeper" x={980} y={900} len={560} color="#1a2026" speed={12} wake="#e6dcc4" />
        {/* sweep cable between the sterns, sagging into the water */}
        <path d={`M${160 + 12 * t} 760 Q${500 + 12 * t} ${900 + 10 * wave(t, 3)} ${1030 + 12 * t} 880`} fill="none" stroke="#1a2026" strokeWidth={5} />
        {[0.3, 0.55, 0.8].map((k, i) => (
          <circle key={i} cx={160 + 12 * t + (870 * k)} cy={830 + 40 * Math.sin(k * Math.PI)} r={10} fill="#9a3a2c" />
        ))}
      </Layer>
    </Frame>
  );
};

const s18_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.035, ox: 0.5, oy: 0.7}}>
    <Layer depth={0}>
      <Sea y={-200} top="#1d2c32" bottom="#0a1216" streak="#8aa8b0" streaks={30} />
    </Layer>
    <Layer depth={0.6}>
      <path d="M-200 -200 L1500 -200 L1300 1300 L-200 1300Z" fill="#4a3d2e" />
      {Array.from({length: 10}).map((_, i) => (
        <line key={i} x1={-200 + i * 160} y1={-200} x2={-200 + i * 145} y2={1300} stroke="#000" strokeOpacity={0.2} strokeWidth={4} />
      ))}
      <path d="M-200 -200 L1500 -200 L1300 1300 L-200 1300Z" fill="#9ab" opacity={0.08} />
      {/* boots */}
      {[[700, 560], [930, 620]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`} fill="#16130f">
          <path d="M-60 -260 L40 -260 L40 -40 L150 -10 Q170 30 140 50 L-60 50Z" />
          <rect x={-70} y={40} width={230} height={20} />
        </g>
      ))}
      <path d="M1500 -200 L1300 1300" stroke="#c8d6da" strokeWidth={6} strokeOpacity={0.5} />
    </Layer>
  </Frame>
);

const s18_6: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.65}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#1e2232'], [0.5, '#5a4a5a'], [0.85, '#c07858'], [1, '#e8a878']]} />
      <Glow x={1500} y={700} r={300} color="#ffc08a" opacity={0.6} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#7a5a58" bottom="#121820" streak="#ffc89a" streaks={30} />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="minesweeper" x={880} y={760} len={170} color="#0e1218" speed={4} />
    </Layer>
  </Frame>
);

const s18_7: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.5}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#0e1216" />
      <rect x={300} y={160} width={1320} height={460} fill="#0a1a26" />
      <Stars n={30} maxY={600} />
      <Sea y={460} top="#0f2232" bottom="#08121a" />
    </Layer>
    <Layer depth={0.5}>
      <path d="M-200 -200 H2200 V1400 H-200Z M300 160 V620 H1620 V160Z" fill="#1a1612" fillRule="evenodd" />
      <rect x={950} y={160} width={20} height={460} fill="#1a1612" />
      <rect x={-200} y={760} width={2400} height={600} fill="#241c14" />
      <Flicker x={1300} y={700} r={500} color="#ffc77a" opacity={0.6} seed="whl" />
      <g transform="translate(1300 640)">
        <rect x={-30} y={0} width={60} height={110} fill="#2a2016" />
        <rect x={-22} y={10} width={44} height={70} fill="#ffcf7a" opacity={0.85} />
        <path d="M-34 0 L34 0 L20 -26 L-20 -26Z" fill="#2a2016" />
      </g>
      {/* ship's wheel */}
      <g transform="translate(700 860)" stroke="#120d09" strokeWidth={18} fill="none">
        <circle r={190} />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={-240} y1={0} x2={240} y2={0} transform={`rotate(${a})`} />
        ))}
      </g>
    </Layer>
  </Frame>
);

const s18_8: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'drift', amount: 0.03, dir: -1}}>
      <Layer depth={0}>
        <Sky stops={[[0, '#262a30'], [0.7, '#6a6c6a'], [1, '#a29a86']]} />
        <g transform={`translate(${-40 * t} 0)`}>
          <path d="M800 -100 Q1100 120 1500 200 Q1900 260 2400 220 L2400 -200Z" fill="#14171b" opacity={0.9} />
          <path d="M900 140 Q1300 260 1800 300 Q2100 320 2400 300 L2400 220 Q1900 260 1500 200Z" fill="#1d2126" opacity={0.85} />
        </g>
      </Layer>
      <Layer depth={0.35}>
        <Sea y={700} top="#5a5e5c" bottom="#1a1f24" streak="#c8c4b4" />
        <Rain opacity={0.15} n={60} />
      </Layer>
      <Layer depth={0.55}>
        <Ship kind="minesweeper" x={300} y={800} len={360} color="#0e1218" speed={6} />
      </Layer>
    </Frame>
  );
};

// ---------------- SCENE 19 · A COUNTRY WITH NO ARMY ----------------
const s19_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.6}} overlay={<Stamp text="TOKYO · MAY 1947" />}>
    <Layer depth={0}>
      <Sky stops={SE.sky} />
      <Glow x={1400} y={420} r={500} color="#fff0c8" opacity={0.5} />
      <Clouds color="#f0dcb4" opacity={0.4} n={4} />
    </Layer>
    <Layer depth={0.2}>
      <Houses x={-200} y={700} n={14} color="#8a6f50" scale={0.6} seed="tk1" />
    </Layer>
    <Layer depth={0.45}>
      <Houses x={-150} y={860} n={6} color="#5f4a36" scale={1.2} seed="tk2" />
      <rect x={-200} y={860} width={2400} height={400} fill="#a08a66" />
      <g transform="translate(1320 860)">
        <rect x={-6} y={-300} width={12} height={300} fill="#3a2c1e" />
        <rect x={-150} y={-300} width={300} height={190} fill="#e6d9b8" />
        <rect x={-130} y={-280} width={260} height={30} fill="#9a3a2c" opacity={0.7} />
        {Array.from({length: 4}).map((_, i) => (
          <rect key={i} x={-130} y={-230 + i * 26} width={180 + (i % 2) * 60} height={10} fill="#3a2c1e" opacity={0.5} />
        ))}
      </g>
      <Person x={700} y={960} h={220} hat="none" color="#3a2c1e" pose="walk" walkSpeed={12} seed={2} />
      <Person x={860} y={960} h={190} hat="woman" skirt color="#3a2c1e" pose="walk" walkSpeed={12} seed={3} />
      <Tree x={1700} y={900} h={420} color="#4a3a28" seed="tkt" />
    </Layer>
  </Frame>
);

const s19_2: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.045, ox: 0.5, oy: 0.45}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#4a3826" />
      </Layer>
      <Layer depth={0.5}>
        <Paper
          x={960}
          y={540}
          w={980}
          h={1100}
          rot={-1.5}
          title="ARTICLE 9"
          titleSize={70}
          lineSize={30}
          lines={['...the Japanese people forever renounce war', 'as a sovereign right of the nation...', '', '...land, sea, and air forces, as well as', 'other war potential, will never be maintained.']}
        />
        <rect x={300} y={980} width={1400} height={200} fill="#000" opacity={0.12 + 0.08 * smooth(useK(0.2, 0.8))} />
      </Layer>
    </Frame>
  );
};

const s19_3: React.FC = () => {
  const icons = [
    <g key="r" fill="#2a2420">
      <rect x={-90} y={-10} width={180} height={18} rx={4} transform="rotate(-20)" />
      <path d="M40 -30 L100 -50 L110 -20 L50 0Z" transform="rotate(-20)" />
    </g>,
    <g key="a" fill="none" stroke="#2a2420" strokeWidth={14}>
      <line x1={0} y1={-80} x2={0} y2={70} />
      <line x1={-40} y1={-50} x2={40} y2={-50} />
      <path d="M-70 20 Q-60 80 0 80 Q60 80 70 20" />
      <circle cx={0} cy={-92} r={14} />
    </g>,
    <g key="w" fill="#2a2420">
      <path d="M-100 0 Q-40 -60 0 -30 Q40 -60 100 0 Q40 -20 0 10 Q-40 -20 -100 0Z" />
      <circle cx={0} cy={-10} r={20} />
    </g>,
  ];
  return (
    <Frame move={{type: 'push', amount: 0.03}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#4a3826" />
        <rect x={160} y={160} width={1600} height={760} fill="#e8dfc8" />
      </Layer>
      <Layer depth={0.6}>
        {icons.map((ic, i) => {
          const k = clamp(useK(0.1 + i * 0.22, 0.2 + i * 0.22));
          return (
            <g key={i} transform={`translate(${520 + i * 440} 540)`}>
              <circle r={150} fill="none" stroke="#2a2420" strokeWidth={6} opacity={0.6} />
              {ic}
              {k > 0 && (
                <g opacity={k}>
                  <line x1={-140} y1={-140} x2={140} y2={140} stroke="#a8322a" strokeWidth={22} strokeLinecap="round" />
                  <line x1={140} y1={-140} x2={-140} y2={140} stroke="#a8322a" strokeWidth={22} strokeLinecap="round" />
                </g>
              )}
            </g>
          );
        })}
      </Layer>
    </Frame>
  );
};

const s19_4: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={SE.sky} />
      <Clouds color="#f0dcb4" opacity={0.4} n={4} />
    </Layer>
    <Layer depth={0.3}>
      <rect x={-200} y={640} width={2400} height={30} fill="#5f4a36" />
      <rect x={300} y={480} width={700} height={170} fill="#6a5440" />
      <path d="M260 480 L1040 480 L980 430 L320 430Z" fill="#5f4a36" />
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={340 + i * 95} y={520} width={40} height={60} fill="#3a2c1e" />
      ))}
      <rect x={1300} y={340} width={8} height={300} fill="#3a2c1e" />
    </Layer>
    <Layer depth={0.6}>
      <rect x={-200} y={670} width={2400} height={600} fill="#b8a27c" />
      <Grass y={720} color="#6b6a3c" n={60} h={40} seed="pg1" />
      <Grass y={900} color="#5a5a32" n={50} h={60} seed="pg2" />
    </Layer>
  </Frame>
);

// ---------------- SCENE 20 · KOREA ----------------
const s20_1: React.FC = () => {
  const xy = (lo: number, la: number) => [lo, la];
  void xy;
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.45, oy: 0.5}} overlay={<Stamp text="25 JUNE 1950" />}>
      <Layer depth={0.3}>
        <MapView bbox={[123, 33, 133, 43]} style={MAP_PAPER}>
          <Parallel />
          <MapLabel lon={127.5} lat={40.2} text="NORTH KOREA" size={30} font="stencil" color="#3a3024" />
          <MapLabel lon={127.8} lat={36.2} text="SOUTH KOREA" size={30} font="stencil" color="#3a3024" />
          <MapLabel lon={131.5} lat={34.0} text="JAPAN" size={28} at={0.5} />
          <MapRoute pts={[[126.6, 38.9], [126.9, 37.6], [127.4, 36.4]]} color="#8c2f22" width={14} from={0.2} to={0.8} bend={0.05} />
          <MapRoute pts={[[127.6, 38.7], [128.0, 37.3]]} color="#8c2f22" width={10} from={0.3} to={0.85} bend={0.05} />
        </MapView>
      </Layer>
    </Frame>
  );
};

const Parallel: React.FC = () => {
  const xy = useXY();
  const [x0, y0] = xy(124, 38);
  const [x1] = xy(131, 38);
  return (
    <g>
      <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="#3a3024" strokeWidth={3} strokeDasharray="12 10" />
      <text x={x1 - 10} y={y0 - 12} textAnchor="end" fontFamily={FONT_TYPE} fontSize={24} fill="#3a3024">
        38th PARALLEL
      </text>
    </g>
  );
};

const s20_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={PAL.red.sky} />
      <Stars n={40} maxY={400} />
    </Layer>
    <Layer depth={0.2}>
      <Houses x={1100} y={700} n={8} color="#22141c" lit="#ffb070" scale={0.5} seed="tp" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#3a2026" bottom="#0d0a10" streak="#ffb070" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="transport" x={100} y={870} len={1100} color="#0d0a10" rim="#f08a50" speed={18} wake="#ffb070" windowsLit="#ffcf7a" />
      {Array.from({length: 14}).map((_, i) => (
        <Person key={i} x={280 + 18 * 0 + i * 30} y={790 - i * 0.2} h={40} hat="usHelmet" color="#0d0a10" walkSpeed={18} seed={i} />
      ))}
    </Layer>
  </Frame>
);

const s20_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2a3040'], [0.7, '#7a7a80'], [1, '#c8b49a']]} />
    </Layer>
    <Layer depth={0.4}>
      <rect x={-200} y={760} width={2400} height={500} fill="#3a3a3c" />
      <rect x={200} y={500} width={600} height={260} fill="#26282c" />
      <rect x={1100} y={500} width={700} height={260} fill="#26282c" />
      {/* open gate */}
      <rect x={830} y={420} width={30} height={360} fill="#1a1b1e" />
      <rect x={1060} y={420} width={30} height={360} fill="#1a1b1e" />
      <path d="M860 760 L760 720 L760 560 L860 600Z" fill="#1a1b1e" opacity={0.8} />
      <Flicker x={960} y={430} r={180} color="#ffd890" opacity={0.7} seed="gl" />
      <rect x={950} y={400} width={20} height={26} fill="#ffe0a0" />
      <line x1={960} y1={380} x2={960} y2={400} stroke="#1a1b1e" strokeWidth={4} />
    </Layer>
    <Layer depth={0.9}>
      <Mist y={900} color="#8a8a8c" opacity={0.2} />
    </Layer>
  </Frame>
);

// ---------------- SCENE 21 · THE POLICE THAT WASN'T ----------------
const s21_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.4, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={K.sky} />
      <Clouds color="#e6dcbc" opacity={0.4} n={4} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={640} h={160} color={K.far} seed="pr" />
    </Layer>
    <Layer depth={0.45}>
      <rect x={-200} y={640} width={2400} height={600} fill="#8e866a" />
      {Array.from({length: 6}).map((_, r) =>
        Array.from({length: 22}).map((_, i) => (
          <Person key={`${r}-${i}`} x={160 + i * 62 + r * 10} y={700 + r * 36} h={70 + r * 6} hat="usHelmet" color="#3a3828" item="rifle" seed={r * 22 + i} />
        )),
      )}
    </Layer>
    <Layer depth={0.85}>
      <g transform="translate(1620 900)">
        <rect x={-8} y={0} width={16} height={260} fill="#2a2820" />
        <rect x={-210} y={-200} width={420} height={230} fill="#e6dcbc" />
        <rect x={-210} y={-200} width={420} height={230} fill="none" stroke="#2a2820" strokeWidth={10} />
        <text x={0} y={-60} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={110} fill="#2a2820">
          75,000
        </text>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={26} fill="#2a2820">
          NEW RECRUITS
        </text>
      </g>
    </Layer>
  </Frame>
);

const s21_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={K.sky} />
    </Layer>
    <Layer depth={0.4}>
      <rect x={-200} y={760} width={2400} height={500} fill="#8e866a" />
      <rect x={1180} y={360} width={36} height={420} fill="#3a3828" />
      <rect x={1640} y={360} width={36} height={420} fill="#3a3828" />
      <rect x={1150} y={320} width={560} height={80} fill="#e6dcbc" stroke="#3a3828" strokeWidth={8} />
      <text x={1430} y={374} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={40} fill="#3a3828" letterSpacing={4}>
        POLICE RESERVE
      </text>
    </Layer>
    <Layer depth={0.7}>
      <Person x={760} y={1100} h={700} hat="usHelmet" item="rifle" color="#22201a" rim="#f4e8c0" seed={4} />
    </Layer>
  </Frame>
);

const s21_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.7}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#5c6470'], [0.7, '#b9b4a0'], [1, '#e2d6b4']]} />
    </Layer>
    <Layer depth={0.25}>
      <Sea y={560} top="#8a9294" bottom="#4a5458" streak="#efe6cc" />
    </Layer>
    <Layer depth={0.5}>
      <Hills y={680} amp={80} color="#6a6a50" seed="cl" x0={-200} x1={1300} n={4} />
      <Houses x={200} y={720} n={6} color="#4a4a38" scale={0.5} seed="clh" />
    </Layer>
    <Layer depth={0.9}>
      <Hills y={920} amp={60} color="#2e2e22" seed="clf" />
      <Grass y={930} color="#2e2e22" n={70} h={60} seed="clg" />
    </Layer>
  </Frame>
);

const s21_4: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'drift', amount: 0.025, dir: -1}}>
      <Layer depth={0}>
        <Sky stops={[[0, '#3a424c'], [0.7, '#8a8e8e'], [1, '#bdb6a0']]} />
        <g transform={`translate(${-20 * t} 0)`} opacity={0.85}>
          <path d="M1100 520 Q1400 380 1800 420 Q2100 440 2300 400 L2300 600 L1100 600Z" fill="#23282e" />
          {Array.from({length: 12}).map((_, i) => (
            <line key={i} x1={1250 + i * 70} y1={560} x2={1220 + i * 70} y2={680} stroke="#23282e" strokeWidth={3} opacity={0.6} />
          ))}
        </g>
        <Glow x={1500} y={500} r={80 + 40 * Math.max(0, wave(t, 2.7))} color="#e8eef0" opacity={0.25} />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={660} top="#6a7070" bottom="#20262a" streak="#d8d2c0" streaks={24} />
      </Layer>
    </Frame>
  );
};

export const SHOTS3: Record<string, React.FC> = {
  '14_1': s14_1, '14_2': s14_2, '14_3': s14_3,
  '15_1': s15_1, '15_2': s15_2, '15_3': s15_3, '15_4': s15_4, '15_5': s15_5, '15_6': s15_6, '15_7': s15_7, '15_8': s15_8, '15_9': s15_9,
  '16_1': s16_1, '16_2': s16_2,
  '17_1': s17_1, '17_2': s17_2, '17_3': s17_3, '17_4': s17_4,
  '18_1': s18_1, '18_2': s18_2, '18_3': s18_3, '18_4': s18_4, '18_5': s18_5, '18_6': s18_6, '18_7': s18_7, '18_8': s18_8,
  '19_1': s19_1, '19_2': s19_2, '19_3': s19_3, '19_4': s19_4,
  '20_1': s20_1, '20_2': s20_2, '20_3': s20_3,
  '21_1': s21_1, '21_2': s21_2, '21_3': s21_3, '21_4': s21_4,
};
