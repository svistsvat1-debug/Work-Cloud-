// Cold open + Quest 1 (scenes 01-04)
import React from 'react';
import {Frame, Layer, useShot, wave, W, H, clamp, smooth} from '../../engine/core';
import {Sky, Glow, Clouds, Sea, Smoke, Birds, Mist, Rain, Flicker, Fire, Searchlight, Ripples, Particles} from '../../engine/fx';
import {Stamp, TitleCard, SvgText} from '../../engine/text';
import {MapView, MapLabel, MapRoute, MAP_PAPER, MAP_NIGHT} from '../../engine/map';
import {Ship, Mine} from '../../assets/ships';
import {Hills, Mountains, Grass, Cave, Houses, Pier, Crane, Hangar, Tree} from '../../assets/land';
import {Fighter, LooseProp} from '../../assets/planes';
import {Person} from '../../assets/people';
import {Desk, Lamp, Chalkboard, Crate} from '../../assets/props';
import {PAL, WaterFront, Jeep, Tractor, WreckPile, Stars, useK} from './common';

const N = PAL.night;
const D = PAL.dusk;
const S = PAL.steel;
const B = PAL.blue;

// ---------------- SCENE 01 · COLD OPEN ----------------
const s01_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.04, ox: 0.55, oy: 0.62}} overlay={<Stamp text="JAPAN · AUGUST 1945" />}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars />
      <Glow x={1500} y={220} r={260} color="#cfe3ea" core="#eef6f6" coreR={34} opacity={0.8} />
      <Clouds color="#2c4656" opacity={0.5} n={3} y={[160, 300]} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={260} color={N.far} seed="c1m" rim={N.rim} />
    </Layer>
    <Layer depth={0.45}>
      <Hills y={760} amp={120} color={N.mid} seed="c1h" n={4} />
      <Cave x={980} y={840} w={430} h={190} color={N.mid} inner="#05080c" />
      <Flicker x={830} y={790} r={420} color={N.warm} opacity={0.7} seed="lan" />
      <Fighter x={800} y={846} len={360} color="#0b0f14" rim={N.warm} prop="stopped" net="#16222b" />
      <rect x={826} y={770} width={10} height={22} fill="#ffd28a" />
    </Layer>
    <Layer depth={0.8}>
      <Mist y={900} color="#3c5a68" opacity={0.25} />
      <Grass y={1000} color={N.near} n={90} h={70} seed="c1g" />
      <Tree x={160} y={1040} h={420} color={N.near} seed="c1t" />
    </Layer>
  </Frame>
);

const s01_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={PAL.slate.sky} />
      <Glow x={1350} y={640} r={420} color="#e7b885" core="#f5ddb4" coreR={70} opacity={0.8} />
      <Clouds color="#9a9a9e" opacity={0.35} n={4} y={[150, 380]} />
      <Birds color="#2a2e34" x={420} y={300} />
    </Layer>
    <Layer depth={0.15}>
      <Mountains y={700} h={170} color="#4c5157" seed="c2m" />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={700} top="#8a8783" bottom="#2b3034" streak="#f3d6a8" />
    </Layer>
    <Layer depth={0.45}>
      <Ship kind="nagato" x={620} y={760} len={560} color="#25292e" rim="#f3c98e" />
      <Ship kind="destroyer" x={1260} y={748} len={300} color="#2c3035" rim="#f3c98e" />
      <Ship kind="carrierKatsuragi" x={80} y={738} len={420} color="#30343a" rim="#f3c98e" />
    </Layer>
    <Layer depth={0.9}>
      <Mine x={1520} y={985} r={78} color="#14171a" rim="#f3c98e" float />
      <WaterFront y={1000} color="#2b3034" opacity={0.75} />
      <Ripples x={1520} y={1003} color="#d9c19a" />
    </Layer>
  </Frame>
);

const s01_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03}} overlay={<Stamp text="JAPAN · 1947" />}>
    <Layer depth={0}>
      <Sky stops={[[0, '#55606b'], [0.6, '#b9b2a2'], [1, '#e9dcc0']]} />
      <Glow x={700} y={680} r={360} color="#f5e3bd" opacity={0.6} />
    </Layer>
    <Layer depth={0.15}>
      <Mountains y={700} h={170} color="#7b8187" seed="c2m" />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={700} top="#b3ab9b" bottom="#4a5156" streak="#f4ead2" />
      <Mist y={720} color="#e6e0d2" opacity={0.35} />
    </Layer>
    <Layer depth={0.8}>
      {/* rusted buoy */}
      <g transform={`translate(1240 ${905})`}>
        <path d="M-50 0 L-36 -120 L36 -120 L50 0Z" fill="#5a2c1e" />
        <rect x={-8} y={-190} width={16} height={70} fill="#3d1f16" />
        <circle cx={0} cy={-196} r={14} fill="#3d1f16" />
        <path d="M-50 0 L-36 -120" stroke="#c46a3e" strokeWidth={5} strokeOpacity={0.5} />
      </g>
      <WaterFront y={900} color="#4a5156" opacity={0.85} />
      <Ripples x={1240} y={905} color="#efe3c8" />
    </Layer>
  </Frame>
);

const s01_4: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.025, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars n={90} />
      <Glow x={420} y={260} r={240} color="#cfe3ea" core="#eef6f6" coreR={30} opacity={0.75} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={200} color={N.far} seed="c4m" />
      <Houses x={1200} y={700} n={7} color={N.mid} lit="#ffcf7a" seed="c4h" scale={0.5} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#1d3646" bottom="#06101a" streak="#9cc4d0" streaks={24} />
      <Pier x={1300} y={720} w={500} color={N.near} />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="minesweeper" x={300} y={860} len={700} color="#0a1018" rim="#a9cfd8" speed={14} wake="#9cc4d0" />
    </Layer>
    <Layer depth={0.9}>
      <Mist y={980} color="#2a4656" opacity={0.3} />
    </Layer>
  </Frame>
);

const JapanGhost: React.FC = () => (
  <g opacity={0.14}>
    <MapView bbox={[124, 24, 150, 46]} style={{sea: ['#1c1a20', '#2c2526'], land: '#e9dcc0', landShade: '#e9dcc0', border: '#1c1a20'}} />
  </g>
);
const s01_5: React.FC = () => <TitleCard title="AFTER THE SURRENDER" sub="JAPAN · 1945" bg={<JapanGhost />} />;

// ---------------- SCENE 02 · THE SURRENDER ----------------
const s02_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.6}} overlay={<Stamp text="TOKYO BAY · 2 SEPT 1945" />}>
    <Layer depth={0}>
      <Sky stops={S.sky} />
      <Glow x={980} y={420} r={520} color="#ffe6a8" core="#fff2cf" coreR={60} opacity={0.75} />
      <Clouds color="#5f676d" opacity={0.6} n={5} y={[120, 360]} seed="tb" scale={1.4} />
      <Birds color="#3a4046" x={300} y={260} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={690} h={150} color={S.far} seed="tbm" />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={690} top="#9a9a8e" bottom="#3c4549" streak="#f6e6b6" />
      {[150, 330, 1500, 1720].map((x, i) => (
        <Ship key={i} kind={i % 2 ? 'destroyer' : 'cargo'} x={x} y={712 + i * 3} len={170} color="#4b5358" />
      ))}
    </Layer>
    <Layer depth={0.5}>
      <Ship kind="missouri" x={560} y={800} len={760} color="#23292e" rim={S.rim} />
    </Layer>
  </Frame>
);

const s02_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={S.sky} />
      <Glow x={1300} y={500} r={600} color="#ffe6a8" opacity={0.5} />
      <Clouds color="#6c747a" opacity={0.5} n={4} y={[120, 400]} seed="tb2" scale={1.3} />
    </Layer>
    <Layer depth={0.3}>
      {/* turret and rail behind */}
      <path d="M1300 640 L1340 520 L1760 510 L1820 640Z" fill="#3a4246" />
      <rect x={1600} y={548} width={420} height={22} fill="#3a4246" />
      <rect x={-200} y={640} width={2400} height={16} fill="#2e353a" />
      {Array.from({length: 26}).map((_, i) => (
        <rect key={i} x={-180 + i * 92} y={600} width={6} height={44} fill="#2e353a" />
      ))}
      <rect x={-200} y={598} width={2400} height={6} fill="#2e353a" />
    </Layer>
    <Layer depth={0.55}>
      <rect x={-200} y={656} width={2400} height={500} fill="#5d5a4e" />
      {/* table with cloth and document */}
      <path d="M700 760 L1220 760 L1240 900 L680 900Z" fill="#2f3a2c" />
      <rect x={690} y={748} width={540} height={20} fill="#3c4a38" />
      <rect x={900} y={728} width={150} height={24} fill="#e8dfc8" transform="rotate(-2 975 740)" />
      <rect x={1060} y={740} width={60} height={6} fill="#141414" transform="rotate(-20 1090 742)" />
      {[420, 540, 1340, 1460, 1580].map((x, i) => (
        <Person key={i} x={x} y={900} h={330} hat={i < 2 ? 'officer' : 'officer'} color="#1d2124" facing={i < 2 ? 1 : -1} seed={i} rim={S.rim} />
      ))}
    </Layer>
  </Frame>
);

const s02_3: React.FC = () => {
  const {e} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.045, ox: 0.5, oy: 0.55}}>
      <Layer depth={0}>
        <Desk y={-300} color="#3b2a1e" edge="#3b2a1e" />
        <Glow x={1300} y={300} r={900} color="#ffdca0" opacity={0.35} />
      </Layer>
      <Layer depth={0.5}>
        {/* logbook */}
        <g transform="translate(960 560) rotate(-6)">
          <rect x={-410} y={-260} width={820} height={540} fill="#000" opacity={0.35} transform="translate(16 20)" />
          <rect x={-410} y={-270} width={820} height={540} fill="#4a3b2a" />
          <rect x={-400} y={-260} width={30} height={520} fill="#2f2419" />
          <text x={40} y={-120} textAnchor="middle" fontFamily="'Special Elite'" fontSize={46} fill="#c9b48a" letterSpacing={6}>
            FLIGHT LOG
          </text>
          <rect x={-140} y={-90} width={360} height={4} fill="#c9b48a" opacity={0.6} />
        </g>
        {/* leather glove resting */}
        <g transform="translate(1080 660) rotate(18)" fill="#5c3f26">
          <path d="M-120 60 Q-140 -20 -90 -40 L160 -50 Q200 -30 180 20 L170 70 Q40 110 -120 60Z" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={150} y={-46 + i * 26} width={120 - i * 10} height={22} rx={11} />
          ))}
          <path d="M-60 -38 Q-40 -110 10 -80 L20 -44Z" />
          <path d="M-120 60 Q-140 -20 -90 -40" fill="none" stroke="#9a6e46" strokeWidth={6} strokeOpacity={0.6} />
        </g>
      </Layer>
      {/* propeller shadow slides across */}
      <Layer depth={0.8}>
        <g transform={`translate(${700 + e * 220} 420) rotate(${-14 + e * 6})`} fill="#000" opacity={0.42}>
          <circle cx={0} cy={0} r={40} />
          {[0, 120, 240].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M-26 0 Q-30 -300 0 -420 Q30 -300 26 0Z" />
          ))}
        </g>
      </Layer>
    </Frame>
  );
};

// ---------------- SCENE 03 · THE LAST-BATTLE PLANES ----------------
const Airfield: React.FC<{children?: React.ReactNode; fg?: React.ReactNode; move?: any; sunX?: number; stamp?: string}> = ({children, fg, move, sunX = 1240, stamp}) => (
  <Frame move={move ?? {type: 'push', amount: 0.035, ox: 0.6, oy: 0.65}} overlay={stamp ? <Stamp text={stamp} /> : undefined}>
    <Layer depth={0}>
      <Sky stops={D.sky} />
      <Glow x={sunX} y={660} r={360} color="#ffc27a" core="#fff1cc" coreR={120} />
      <Clouds color="#f7c48a" opacity={0.5} n={3} seed="af" />
      <Birds color="#2b2034" x={500} y={330} speed={12} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={770} h={230} color={D.far} seed="afm" rim="#f2a060" />
    </Layer>
    <Layer depth={0.45}>
      <Hills y={830} amp={26} color={D.mid} seed="afh" rim="#e98a4f" />
      {children}
    </Layer>
    <Layer depth={1}>{fg}</Layer>
  </Frame>
);

const s03_1: React.FC = () => (
  <Airfield
    stamp="KYUSHU · AUGUST 1945"
    fg={
      <>
        <Hills y={1000} amp={20} color="#0d0b12" seed="afg" />
        <Grass y={995} color="#0d0b12" n={90} h={60} seed="afg1" />
      </>
    }
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <Fighter key={i} x={140 + i * 360} y={905 - (i % 2) * 14} len={230} color="#1a1520" rim="#f2a060" net="#2a2030" />
    ))}
  </Airfield>
);

const s03_2: React.FC = () => {
  const {t} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.4, oy: 0.7}}>
      <Layer depth={0.3}>
        <MapView bbox={[122, 22, 148, 42]} style={MAP_PAPER}>
          <MapLabel lon={137.5} lat={37.2} text="JAPAN" size={48} font="stencil" color="#3a3024" />
          <MapLabel lon={130.4} lat={32.4} text="KYUSHU" size={28} dx={-120} at={0.6} />
          <MapLabel lon={127.8} lat={26.2} text="OKINAWA" size={26} dx={110} at={0.4} />
          {[0, 1, 2].map((i) => (
            <MapRoute key={i} pts={[[126 + i * 2.2, 24.5 + i * 0.3], [129 + i * 1.6, 28.5], [130.6 + i * 0.4, 31.2]]} color="#8c2f22" width={7} from={0.1 + i * 0.08} to={0.75} bend={0.08} />
          ))}
        </MapView>
      </Layer>
      <Layer depth={0.9}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#3a2a1a" opacity={0.08 + 0.02 * wave(t, 6)} />
      </Layer>
    </Frame>
  );
};

const s03_3: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={D.sky} />
      <Glow x={1000} y={600} r={520} color="#ffc27a" core="#fff1cc" coreR={210} />
    </Layer>
    <Layer depth={0.3}>
      <Hills y={900} amp={20} color={D.mid} seed="nh" />
    </Layer>
    <Layer depth={0.7}>
      <Fighter x={240} y={1060} len={1300} color="#130f18" rim="#f8b070" prop="stopped" />
      {/* drop tank under belly */}
      <g transform="translate(900 990) rotate(-8)">
        <ellipse cx={0} cy={0} rx={150} ry={34} fill="#130f18" />
      </g>
    </Layer>
  </Frame>
);

const s03_4: React.FC = () => {
  const k = useK(0.25, 0.85);
  const ang = smooth(k) * 70;
  const drop = smooth(k) * 160;
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.6, oy: 0.5}}>
      <Layer depth={0}>
        <Sky stops={D.sky} />
        <Glow x={500} y={700} r={500} color="#ffc27a" core="#fff1cc" coreR={130} />
      </Layer>
      <Layer depth={0.3}>
        <Hills y={900} amp={20} color={D.mid} seed="ph" />
      </Layer>
      <Layer depth={0.6}>
        {/* nose of the fighter */}
        <g fill="#130f18">
          <path d="M-200 520 Q600 470 1180 470 Q1320 470 1330 600 Q1320 720 1180 730 Q600 720 -200 700Z" />
          <rect x={1000} y={720} width={30} height={260} />
          <circle cx={1015} cy={980} r={70} />
        </g>
        <path d="M-200 520 Q600 470 1180 470 Q1320 470 1330 600" fill="none" stroke="#f8b070" strokeWidth={6} strokeOpacity={0.5} />
        {/* propeller swinging down */}
        <g transform={`translate(${1345} ${600 + drop}) rotate(${ang})`} fill="#130f18">
          <path d="M-14 0 Q-20 -220 0 -330 Q20 -220 14 0Z" />
          <path d="M-14 0 Q-20 220 0 330 Q20 220 14 0Z" />
          <circle cx={0} cy={0} r={34} />
        </g>
        {/* ladder + crew */}
        <path d="M1500 1000 L1440 560 M1560 1000 L1500 560" stroke="#130f18" strokeWidth={10} />
        {Array.from({length: 7}).map((_, i) => (
          <line key={i} x1={1446 + i * 8.6} y1={980 - i * 60} x2={1506 + i * 8.6} y2={980 - i * 60} stroke="#130f18" strokeWidth={8} />
        ))}
        <Person x={1480} y={700} h={300} hat="workerCap" color="#130f18" facing={-1} pose="rail" rim="#f8b070" seed={1} />
        <Person x={1640} y={1000} h={330} hat="workerCap" color="#130f18" facing={-1} rim="#f8b070" seed={2} />
      </Layer>
    </Frame>
  );
};

const s03_5: React.FC = () => (
  <Airfield move={{type: 'drift', amount: 0.03, dir: -1}} sunX={1500} fg={<Grass y={1010} color="#0d0b12" n={70} h={50} seed="l5g" />}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <path d={`M${120 + i * 310} 912 L${-240 + i * 310} 960 L${-60 + i * 310} 960 L${290 + i * 310} 912Z`} fill="#000" opacity={0.25} />
        <Fighter x={120 + i * 310} y={912} len={210} color="#1a1520" rim="#f2a060" roundel="#6a2622" prop="none" />
      </g>
    ))}
    <g>
      {[0, 1, 2, 3].map((i) => (
        <LooseProp key={i} x={1700 + i * 26} y={930 - i * 10} rot={-30 + i * 25} len={150} color="#1a1520" />
      ))}
    </g>
  </Airfield>
);

const s03_6: React.FC = () => (
  <Airfield move={{type: 'push', amount: 0.025, ox: 0.3, oy: 0.6}} sunX={1450}>
    {[0, 1, 2, 3].map((i) => (
      <Fighter key={i} x={800 + i * 280} y={900} len={190} color="#1e1824" rim="#f2a060" prop="none" />
    ))}
    <Person x={420} y={1080} h={640} hat="pilot" item="helmet" color="#0f0c14" rim="#f2a060" facing={1} seed={3} />
  </Airfield>
);

const s03_7: React.FC = () => {
  const {t} = useShot();
  return (
    <Airfield move={{type: 'push', amount: 0.03, ox: 0.6, oy: 0.65}} sunX={1600} fg={<Person x={260} y={1080} h={300} hat="pilot" color="#0b0910" facing={1} seed={4} />}>
      <WreckPile x={1500} y={915} w={520} h={170} color="#1a1520" />
      <Smoke x={1500} y={760} color="#3a2a35" h={380} opacity={0.4} />
      <g transform={`translate(${-40 * t} 0)`}>
        <Tractor x={1160} y={925} len={190} color="#1a1520" />
        <rect x={900} y={884} width={260} height={4} fill="#1a1520" />
        <Fighter x={640} y={930} len={240} color="#1a1520" prop="none" rim="#f2a060" />
      </g>
    </Airfield>
  );
};

// ---------------- SCENE 04 · FOUR OF EACH ----------------
const s04_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.6}} overlay={<Stamp text="YOKOSUKA · AUTUMN 1945" />}>
    <Layer depth={0}>
      <Sky stops={B.sky} />
      <Clouds color="#3a4652" opacity={0.6} n={5} seed="hg" scale={1.5} />
    </Layer>
    <Layer depth={0.3}>
      <Hills y={720} amp={40} color={B.far} seed="hgh" />
    </Layer>
    <Layer depth={0.5}>
      <rect x={-200} y={720} width={2400} height={500} fill="#1b232a" />
      <Hangar x={560} y={760} w={820} h={420} color="#141b21" doorLight="#f3c27a" />
      {/* reflection of the door light on wet concrete */}
      <path d="M725 760 L1215 760 L1400 1080 L560 1080Z" fill="#f3c27a" opacity={0.18} />
      <Fighter x={820} y={760} len={300} color="#3a2e24" prop="stopped" />
    </Layer>
    <Layer depth={0.8}>
      <Jeep x={160} y={900} len={260} color="#0d1216" />
      <Jeep x={1520} y={930} len={280} color="#0d1216" flip />
      <Rain opacity={0.28} />
    </Layer>
  </Frame>
);

const s04_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#2a2420" />
      <Glow x={960} y={150} r={900} color="#f3c27a" opacity={0.35} />
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={-100 + i * 300} y={0} width={20} height={700} fill="#1c1814" />
      ))}
      <rect x={-200} y={60} width={2400} height={24} fill="#1c1814" />
    </Layer>
    <Layer depth={0.5}>
      <rect x={-200} y={760} width={2400} height={500} fill="#3a322a" />
      {/* an unusual twin-boom / canard-like prototype shape (generic) */}
      <g fill="#171310" transform="translate(500 760)">
        <path d="M0 -150 Q300 -200 700 -180 L760 -150 L700 -120 Q300 -110 0 -130Z" />
        <path d="M80 -150 L40 -260 L130 -250 L170 -150Z" />
        <path d="M300 -150 L560 -160 L600 -130 L320 -120Z" />
        <rect x={600} y={-120} width={10} height={100} />
        <circle cx={605} cy={-20} r={22} />
        <rect x={120} y={-130} width={8} height={110} />
        <circle cx={124} cy={-20} r={16} />
      </g>
      <Person x={1460} y={1000} h={420} hat="officer" item="clipboard" color="#120e0b" facing={-1} rim="#f3c27a" />
    </Layer>
  </Frame>
);

const s04_3: React.FC = () => {
  const k = useK(0.1, 0.7);
  return (
    <Frame move={{type: 'push', amount: 0.045, ox: 0.5, oy: 0.5}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#3a3028" />
        <Glow x={500} y={200} r={900} color="#f3c27a" opacity={0.3} />
      </Layer>
      <Layer depth={0.5}>
        <Chalkboard x={260} y={170} w={1400} h={760}>
          {[0, 1, 2].map((r) => (
            <g key={r} opacity={clamp(k * 3 - r)}>
              <g transform={`translate(330 ${310 + r * 220}) scale(0.9)`} stroke="#e8e4da" strokeWidth={4} fill="none" opacity={0.85}>
                <path d="M0 0 Q150 -20 330 -20 Q370 -20 372 0 Q370 20 330 22 Q150 24 0 10Z" />
                <path d="M200 0 L250 -90 L280 -90 L260 0" />
                <path d="M20 0 L0 -50 L40 -48 L60 0" />
              </g>
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={760 + i * 60} y1={260 + r * 220} x2={770 + i * 60} y2={350 + r * 220} stroke="#e8e4da" strokeWidth={8} strokeLinecap="round" opacity={0.9} />
              ))}
            </g>
          ))}
          <SvgText x={1320} y={600} text="4 EACH" size={110} font="stencil" color="#ece8de" opacity={useK(0.55, 0.75)} rotate={-6} />
        </Chalkboard>
      </Layer>
    </Frame>
  );
};

const s04_4: React.FC = () => {
  const {t} = useShot();
  const lower = smooth(useK(0.1, 0.9)) * 220;
  return (
    <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
      <Layer depth={0}>
        <Sky stops={N.sky} />
        <Stars n={40} />
      </Layer>
      <Layer depth={0.2}>
        <Houses x={-100} y={650} n={10} color={N.far} lit="#ffcf7a" scale={0.6} seed="dkh" />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={650} top="#1d3646" bottom="#06101a" streak="#ffcf7a" />
      </Layer>
      <Layer depth={0.55}>
        <Ship kind="cargo" x={300} y={860} len={1100} color="#0b131b" rim="#ffcf7a" />
        <Pier x={1200} y={880} w={900} color="#081018" />
        <g transform="translate(1500 880)">
          <path d="M-40 0 L-12 -560 L12 -560 L40 0Z" fill="none" stroke="#081018" strokeWidth={14} />
          <rect x={-40} y={-600} width={80} height={60} fill="#081018" />
          <rect x={-560} y={-590} width={600} height={18} fill="#081018" />
          <line x1={-520} y1={-580} x2={-520} y2={-400 + lower} stroke="#081018" strokeWidth={4} />
          <g transform={`translate(-520 ${-400 + lower}) rotate(${2 * wave(t, 3)})`}>
            <Crate x={0} y={170} w={360} h={170} text="AIRCRAFT" color="#3a2a1c" />
          </g>
        </g>
        {[400, 600, 900].map((x, i) => (
          <Glow key={i} x={x + 300} y={660} r={60} color="#ffcf7a" opacity={0.7} />
        ))}
      </Layer>
    </Frame>
  );
};

const s04_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#1a1d22" />
      {Array.from({length: 6}).map((_, i) => (
        <rect key={i} x={-60 + i * 400} y={-100} width={30} height={900} fill="#13161a" />
      ))}
      <Glow x={960} y={300} r={700} color="#efe0c0" opacity={0.25} />
    </Layer>
    <Layer depth={0.5}>
      <rect x={-200} y={820} width={2400} height={400} fill="#24282e" />
      <path d="M760 -100 L1160 -100 L1500 900 L420 900Z" fill="#f3e6c8" opacity={0.08} />
      <Fighter x={560} y={830} len={820} color="#3b4148" rim="#f3e6c8" roundel="#7a2a26" prop="stopped" />
      <rect x={560} y={830} width={800} height={14} fill="#111" opacity={0.4} />
      <Person x={1600} y={1000} h={380} color="#0e1014" facing={-1} hat="none" seed={6} />
    </Layer>
  </Frame>
);

const s04_6: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={PAL.red.sky} />
      <Glow x={960} y={760} r={700} color="#ff9a4a" opacity={0.4} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={760} h={180} color={PAL.red.far} seed="bfm" />
    </Layer>
    <Layer depth={0.5}>
      <Hills y={860} amp={20} color={PAL.red.mid} seed="bfh" />
      <Smoke x={960} y={720} h={700} w={120} color="#2a1820" opacity={0.6} seed="bf" lean={0.15} />
      <WreckPile x={960} y={880} w={640} h={180} color="#0d0a10" seed="bfp" />
      <Fire x={960} y={760} w={380} h={200} />
    </Layer>
    <Layer depth={0.9}>
      <Particles color="#ffb070" n={50} opacity={0.6} area={[600, 300, 700, 500]} rise={40} seed="emb" />
    </Layer>
  </Frame>
);

const s04_7: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}} overlay={<Stamp text="1947" />}>
    <Layer depth={0}>
      <Sky stops={[[0, '#6f7a7c'], [0.6, '#c3bba3'], [1, '#e7d9b6']]} />
      <Clouds color="#e9e0c8" opacity={0.5} n={4} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={760} h={200} color="#8a8a7a" seed="afm" />
    </Layer>
    <Layer depth={0.45}>
      <Hills y={830} amp={26} color="#6b6a52" seed="afh" />
      <g fill="#5a3a26">
        <rect x={700} y={880} width={120} height={12} transform="rotate(-12 760 886)" />
        <circle cx={1200} cy={900} r={18} />
        <path d="M1400 900 l60 -10 l20 30 l-70 14z" />
      </g>
    </Layer>
    <Layer depth={1}>
      <Grass y={960} color="#3d3c2c" n={160} h={110} seed="yg" />
    </Layer>
  </Frame>
);

export const SHOTS1: Record<string, React.FC> = {
  '01_1': s01_1, '01_2': s01_2, '01_3': s01_3, '01_4': s01_4, '01_5': s01_5,
  '02_1': s02_1, '02_2': s02_2, '02_3': s02_3,
  '03_1': s03_1, '03_2': s03_2, '03_3': s03_3, '03_4': s03_4, '03_5': s03_5, '03_6': s03_6, '03_7': s03_7,
  '04_1': s04_1, '04_2': s04_2, '04_3': s04_3, '04_4': s04_4, '04_5': s04_5, '04_6': s04_6, '04_7': s04_7,
};
