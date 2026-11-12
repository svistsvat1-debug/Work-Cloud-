// Quest 2 (ferries) + Quest 3 (lottery): scenes 05-13
import React from 'react';
import {Frame, Layer, useShot, wave, W, H, clamp, smooth, rnd} from '../../engine/core';
import {Sky, Glow, Clouds, Sea, Smoke, Birds, Mist, Snow, Flicker, Searchlight, Ripples, Particles, Rays} from '../../engine/fx';
import {Stamp, SvgText, FONT_TYPE, FONT_STENCIL} from '../../engine/text';
import {MapView, MapLabel, MapRoute, MapDot, MAP_PAPER, useXY} from '../../engine/map';
import {Ship} from '../../assets/ships';
import {Hills, Mountains, Grass, Houses, Pier, Crane, Palm, Island} from '../../assets/land';
import {Person, Crowd} from '../../assets/people';
import {Desk, Lamp, Telegram, CapWithLots, Chalkboard, NameList, Envelope} from '../../assets/props';
import {PAL, WaterFront, Stars, useK} from './common';

const D = PAL.dusk;
const SE = PAL.sepia;
const SL = PAL.slate;
const T = PAL.teal;
const N = PAL.night;
const C = PAL.cold;

// ---------------- SCENE 05 · THE BRIDGE ----------------
const s05_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.62}}>
    <Layer depth={0}>
      <Sky stops={D.sky} />
      <Glow x={1100} y={700} r={420} color="#ffc27a" core="#fff1cc" coreR={120} />
      <Clouds color="#f7c48a" opacity={0.45} n={3} seed="b5" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#c7704a" bottom="#2a1f2e" streak="#ffd29a" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="destroyer" x={560} y={790} len={760} color="#1b141f" rim="#f8b070" />
    </Layer>
  </Frame>
);

const s05_2: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={SL.sky} />
      <Glow x={1500} y={760} r={420} color="#e7b885" opacity={0.7} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={760} top="#8a8380" bottom="#2b3034" streak="#f3d6a8" />
    </Layer>
    <Layer depth={0.55}>
      <Smoke x={1060} y={690} h={520} w={80} color="#3a3c40" opacity={0.5} lean={-0.5} seed="b52" />
      <Ship kind="destroyer" x={260} y={880} len={1400} color="#1f2327" rim="#f3c98e" />
    </Layer>
  </Frame>
);

// ---------------- SCENE 06 · SIX MILLION STRANDED ----------------
const SpreadDots: React.FC = () => {
  const xy = useXY();
  const {p} = useShot();
  const pts: [number, number][] = [];
  for (let i = 0; i < 70; i++) {
    const r = rnd(`sd${i}`);
    // clusters: Manchuria, China coast, Korea, SE Asia, Philippines, New Guinea, islands
    const cl = [[125, 45], [117, 32], [127, 37], [104, 12], [122, 12], [145, -5], [152, -4], [110, 0], [135, 7]][i % 9];
    pts.push([cl[0] + (rnd(`sdx${i}`) - 0.5) * 9, cl[1] + (rnd(`sdy${i}`) - 0.5) * 7]);
    void r;
  }
  return (
    <g>
      {pts.map(([lo, la], i) => {
        const [x, y] = xy(lo, la);
        const o = clamp((p - 0.05 - (i / pts.length) * 0.5) / 0.08);
        return <circle key={i} cx={x} cy={y} r={7} fill="#8c2f22" opacity={o * 0.85} stroke="#2a2016" strokeWidth={1.5} />;
      })}
    </g>
  );
};

const s06_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.6, oy: 0.4}}>
    <Layer depth={0.3}>
      <MapView bbox={[92, -14, 162, 52]} style={MAP_PAPER}>
        <SpreadDots />
        <MapLabel lon={139} lat={37} text="JAPAN" size={34} font="stencil" color="#3a3024" dx={60} />
        <MapLabel lon={125} lat={47} text="MANCHURIA" size={26} at={0.3} />
        <MapLabel lon={144} lat={-8} text="NEW GUINEA" size={26} at={0.5} dy={50} />
      </MapView>
    </Layer>
    <Layer depth={0.8}>
      <g transform="translate(1440 820) rotate(-4)">
        <rect x={-300} y={-110} width={600} height={220} fill="#000" opacity={0.3} transform="translate(10 12)" />
        <rect x={-300} y={-110} width={600} height={220} fill="#e6d7a8" />
        <rect x={-300} y={-110} width={600} height={46} fill="#c9b47c" />
        <text x={0} y={-76} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={26} fill="#3a2f1c" letterSpacing={6}>
          TELEGRAM
        </text>
        <text x={0} y={40} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={72} fill="#2a2418">
          {'6,000,000+'.slice(0, Math.floor(clamp((useShot().t - 0.6) / 1.2) * 10))}
        </text>
        <text x={0} y={88} textAnchor="middle" fontFamily={FONT_TYPE} fontSize={26} fill="#2a2418" opacity={useK(0.5, 0.6)}>
          STRANDED OVERSEAS
        </text>
      </g>
    </Layer>
  </Frame>
);

const s06_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={SE.sky} />
      <Glow x={960} y={700} r={600} color="#ffe2a6" opacity={0.6} />
    </Layer>
    <Layer depth={0.3}>
      <Hills y={860} amp={30} color={SE.far} seed="62h" />
    </Layer>
    <Layer depth={0.6}>
      <rect x={-200} y={900} width={2400} height={300} fill={SE.mid} />
      <Person x={860} y={1000} h={560} hat="jcap" item="rifle" color="#2a2018" facing={-1} rim="#f6e2b4" seed={1} />
      <Person x={1080} y={1000} h={520} hat="none" color="#2a2018" facing={1} rim="#f6e2b4" seed={2} />
      <Person x={1220} y={1000} h={440} hat="woman" skirt color="#2a2018" facing={1} seed={3} />
      <Person x={1330} y={1000} h={260} hat="none" color="#2a2018" facing={1} seed={4} />
    </Layer>
  </Frame>
);

const s06_3: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.035, dir: 1}}>
    <Layer depth={0}>
      <defs>
        <linearGradient id="s063sky" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9d6dd" />
          <stop offset="0.45" stopColor="#d9cfae" />
          <stop offset="1" stopColor="#c7b97a" />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={2400} height={1500} fill="url(#s063sky)" />
    </Layer>
    <Layer depth={0.3}>
      <path d="M-200 760 Q300 720 800 760 L800 1300 L-200 1300Z" fill="#e8eef0" />
      <Mountains y={760} h={160} color="#a9b6bd" seed="63m" x0={-200} x1={700} peaks={3} snow="#ffffff" />
      <Hills y={780} amp={40} color="#3f5a3a" seed="63h" x0={800} x1={2200} n={5} />
    </Layer>
    <Layer depth={0.6}>
      <rect x={-200} y={820} width={1000} height={400} fill="#dfe7ea" />
      <rect x={800} y={820} width={1400} height={400} fill="#2f4a2c" />
      {Array.from({length: 7}).map((_, i) => (
        <Palm key={i} x={1000 + i * 150} y={860 + (i % 2) * 20} h={260 + (i % 3) * 40} color="#1d3320" seed={`63p${i}`} />
      ))}
      <Person x={300} y={900} h={180} hat="jcap" color="#2c3236" facing={1} pose="walk" walkSpeed={10} seed={5} />
    </Layer>
    <Layer depth={0.9}>
      <Snow n={60} opacity={0.6} />
    </Layer>
  </Frame>
);

const s06_4: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#9aa0a0'], [0.7, '#d8d2bf'], [1, '#ece2c6']]} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={640} top="#a9aba2" bottom="#6f7672" streak="#f2ead2" />
    </Layer>
    <Layer depth={0.45}>
      <path d="M-200 760 Q600 720 1200 750 Q1700 770 2200 740 V1300 H-200Z" fill="#c9b994" />
    </Layer>
    <Layer depth={0.7}>
      <Crowd x={120} y={930} w={1700} rows={2} h={170} color="#3b3328" sit hats={['jcap', 'none', 'woman', 'jcap', 'none']} seed="bch" />
    </Layer>
  </Frame>
);

const s06_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.04, ox: 0.5, oy: 0.4}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#6b5a44" />
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-200} y={-120 + i * 110} width={2400} height={4} fill="#000" opacity={0.12} />
      ))}
    </Layer>
    <Layer depth={0.6}>
      <NameList x={960} y={560} />
    </Layer>
  </Frame>
);

// ---------------- SCENE 07 · WARSHIPS INTO FERRIES ----------------
const Sunrise: React.FC<{children?: React.ReactNode; fg?: React.ReactNode; move?: any; sun?: number; stamp?: string}> = ({children, fg, move, sun = 1300, stamp}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03}} overlay={stamp ? <Stamp text={stamp} /> : undefined}>
    <Layer depth={0}>
      <Sky stops={SL.sky} />
      <Glow x={sun} y={690} r={460} color="#f7c48a" core="#fde6c0" coreR={80} opacity={0.85} />
      <Clouds color="#a0a2a4" opacity={0.35} n={4} seed="sr" />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={150} color="#5a6066" seed="srm" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#9a8f86" bottom="#2b3034" streak="#f8d9a8" />
    </Layer>
    <Layer depth={0.55}>{children}</Layer>
    <Layer depth={0.95}>{fg}</Layer>
  </Frame>
);

const s07_1: React.FC = () => (
  <Sunrise stamp="KURE · 1945">
    <Ship kind="destroyer" x={320} y={830} len={900} color="#1d2125" rim="#f3c98e" />
    <Pier x={-200} y={850} w={2400} color="#14171a" posts={18} />
    {[600, 700, 820, 1000].map((x, i) => (
      <Person key={i} x={x} y={772 - (i > 2 ? 6 : 0)} h={70} hat="workerCap" color="#1d2125" facing={i % 2 ? 1 : -1} seed={i} />
    ))}
  </Sunrise>
);

const s07_2: React.FC = () => {
  const k = smooth(useK(0.15, 0.85));
  const {t} = useShot();
  return (
    <Sunrise move={{type: 'drift', amount: 0.02, dir: 1}} sun={500}>
      <g fill="#1d2125">
        <path d="M-200 1000 L-200 860 L1300 830 L1500 860 L1500 1100Z" />
        <rect x={880} y={800} width={320} height={40} />
      </g>
      <ellipse cx={1040} cy={800} rx={170} ry={22} fill="#0d1012" />
      <g transform={`translate(${1040 + 60 * k} ${720 - 330 * k}) rotate(${2 * wave(t, 3)})`}>
        <path d="M-150 80 L-130 0 L130 -6 L160 80Z" fill="#1d2125" />
        <rect x={150} y={20} width={300} height={22} fill="#1d2125" />
        <rect x={150} y={48} width={300} height={22} fill="#1d2125" />
        <line x1={0} y1={-6} x2={0} y2={-700} stroke="#1d2125" strokeWidth={5} />
      </g>
      <g transform="translate(1600 1000)">
        <path d="M-50 0 L-14 -900 L14 -900 L50 0Z" fill="none" stroke="#14171a" strokeWidth={16} />
        <rect x={-700} y={-900} width={760} height={26} fill="#14171a" />
      </g>
    </Sunrise>
  );
};

const s07_3: React.FC = () => (
  <Sunrise move={{type: 'push', amount: 0.03, ox: 0.4}} sun={1500}>
    <Ship kind="carrierKatsuragi" x={-700} y={820} len={1300} color="#1d2125" rim="#f3c98e" speed={60} wake="#f2d2a0" guns={false} />
    <Birds color="#2a2e34" x={1100} y={420} />
  </Sunrise>
);

// ---------------- SCENE 08 · KATSURAGI AND HOSHO ----------------
const Tropic: React.FC<{children?: React.ReactNode; fg?: React.ReactNode; move?: any; stamp?: string}> = ({children, fg, move, stamp}) => (
  <Frame move={move ?? {type: 'drift', amount: 0.02, dir: -1}} overlay={stamp ? <Stamp text={stamp} /> : undefined}>
    <Layer depth={0}>
      <Sky stops={T.sky} />
      <Glow x={1400} y={600} r={420} color="#ffd59a" opacity={0.55} />
      <Clouds color="#5f8f88" opacity={0.4} n={4} seed="tr" />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={690} h={220} color={T.far} seed="trm" peaks={4} />
      <Island x={300} y={700} w={500} h={60} color={T.mid} palms={4} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={690} top="#2f6460" bottom="#0b1d1f" streak="#cfe8d8" />
    </Layer>
    <Layer depth={0.55}>{children}</Layer>
    <Layer depth={0.95}>{fg}</Layer>
  </Frame>
);

const s08_1: React.FC = () => (
  <Tropic
    stamp="RABAUL · 1946"
    fg={
      <>
        <Palm x={1780} y={1100} h={700} color="#06100f" seed="p81" lean={-0.25} />
        <Palm x={140} y={1120} h={560} color="#06100f" seed="p82" lean={0.2} />
      </>
    }
  >
    <Ship kind="carrierKatsuragi" x={460} y={800} len={1000} color="#0f1d1f" rim={T.rim} guns={false} />
  </Tropic>
);

const s08_2: React.FC = () => {
  const {t} = useShot();
  const k = smooth(useK(0.3, 0.75));
  return (
    <Frame move={{type: 'push', amount: 0.035, ox: 0.5, oy: 0.5}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#4b4a42" />
        {Array.from({length: 40}).map((_, i) => (
          <rect key={i} x={-200} y={-200 + i * 40} width={2400} height={2} fill="#000" opacity={0.25} />
        ))}
      </Layer>
      <Layer depth={0.4}>
        <rect x={560} y={220} width={800} height={640} fill="#3f3d36" stroke="#26251f" strokeWidth={10} />
        {Array.from({length: 7}).map((_, i) => (
          <path key={i} d={`M${600 + i * 110} 230 q10 ${120 + (i % 3) * 60} -4 ${260 + (i % 2) * 120}`} stroke="#7a3e22" strokeWidth={10} strokeOpacity={0.5} fill="none" />
        ))}
      </Layer>
      <Layer depth={0.8}>
        <g transform={`translate(${1500 - 520 * k} ${-100 + 560 * k})`} fill="#1a1a16">
          <ellipse cx={0} cy={0} rx={34} ry={20} />
          <circle cx={30} cy={-16} r={14} />
          <path d={`M-10 -6 L-80 ${-30 - 30 * (1 - k) * wave(t, 0.4)} L-20 10Z`} />
          <path d={`M10 -6 L60 ${-40 - 30 * (1 - k) * wave(t, 0.4, 0.5)} L20 10Z`} />
        </g>
      </Layer>
    </Frame>
  );
};

const s08_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02, ox: 0.5, oy: 0.5}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#14191a" />
      {Array.from({length: 8}).map((_, i) => (
        <rect key={i} x={-120 + i * 290} y={-100} width={36} height={1300} fill="#0c1011" />
      ))}
      {[300, 960, 1620].map((x, i) => (
        <g key={i}>
          <Flicker x={x} y={180} r={420} color="#ffc77a" opacity={0.55} seed={`h${i}`} />
          <rect x={x - 8} y={150} width={16} height={30} fill="#ffd28a" />
        </g>
      ))}
    </Layer>
    <Layer depth={0.6}>
      <Crowd x={-60} y={760} w={2060} rows={3} h={210} color="#070a0b" sit hats={['jcap', 'jcap', 'none', 'jcap']} seed="hgc" />
    </Layer>
  </Frame>
);

const s08_4: React.FC = () => (
  <Sunrise move={{type: 'drift', amount: 0.02, dir: 1}} sun={1600}>
    <Ship kind="carrierHosho" x={300} y={840} len={1100} color="#1b1f23" rim="#f3c98e" guns={false} />
    {Array.from({length: 26}).map((_, i) => (
      <Person key={i} x={330 + i * 40} y={757 - i * 0.35} h={46} hat={i % 3 ? 'jcap' : 'none'} color="#1b1f23" seed={i} />
    ))}
  </Sunrise>
);

const s08_5: React.FC = () => {
  const k = smooth(useK(0.1, 0.6));
  return (
    <Frame move={{type: 'push', amount: 0.025}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#22364a" />
        {Array.from({length: 24}).map((_, i) => (
          <line key={i} x1={-200 + i * 100} y1={-200} x2={-200 + i * 100} y2={1300} stroke="#c8d8e6" strokeOpacity={0.07} />
        ))}
        {Array.from({length: 14}).map((_, i) => (
          <line key={`h${i}`} x1={-200} y1={-200 + i * 100} x2={2200} y2={-200 + i * 100} stroke="#c8d8e6" strokeOpacity={0.07} />
        ))}
      </Layer>
      <Layer depth={0.5}>
        <g transform="translate(260 640) scale(1.4)" fill="none" stroke="#dfe9f2" strokeWidth={3} strokeDasharray="4000" strokeDashoffset={4000 * (1 - k)}>
          <path d="M30 0 L0 -56 L1000 -64 L950 0 Z" />
          <path d="M-10 -72 L990 -80 L990 -90 L-10 -84 Z" />
          <path d="M150 -60 L160 -74 L860 -78 L860 -64 Z" />
        </g>
        <path d="M246 470 L1660 448" stroke="#f0b062" strokeWidth={4} strokeDasharray="14 10" opacity={useK(0.4, 0.55)} />
        <SvgText x={960} y={420} text="BUILT AS A CARRIER" size={64} font="stencil" color="#f0e6d0" opacity={useK(0.45, 0.6)} />
        <SvgText x={960} y={800} text="HOSHO · 1922" size={40} font="type" color="#cbd8e2" opacity={useK(0.55, 0.7)} />
      </Layer>
    </Frame>
  );
};

const s08_6: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.6, oy: 0.5}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#40526a'], [0.55, '#c99a78'], [1, '#f6d6a4']]} />
      <Glow x={1300} y={560} r={420} color="#ffe0a8" core="#fff2d0" coreR={70} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={600} h={240} color="#6e7f6a" seed="hm" peaks={4} />
      <Hills y={630} amp={30} color="#4c6448" seed="hh" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={640} top="#b58f74" bottom="#3b4a52" streak="#ffe2b0" />
    </Layer>
    <Layer depth={0.8}>
      <rect x={-200} y={820} width={2400} height={18} fill="#14181b" />
      {Array.from({length: 14}).map((_, i) => (
        <rect key={i} x={-150 + i * 170} y={820} width={10} height={300} fill="#14181b" />
      ))}
      <Person x={560} y={1120} h={620} hat="jcap" pose="rail" color="#0e1113" rim="#ffd9a0" seed={8} />
    </Layer>
  </Frame>
);

const s08_7: React.FC = () => (
  <Frame move={{type: 'pull', amount: 0.05, ox: 0.4, oy: 0.55}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#40526a'], [0.55, '#c99a78'], [1, '#f6d6a4']]} />
      <Glow x={1300} y={560} r={420} color="#ffe0a8" core="#fff2d0" coreR={70} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={600} h={240} color="#6e7f6a" seed="hm" peaks={4} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={640} top="#b58f74" bottom="#3b4a52" streak="#ffe2b0" />
    </Layer>
    <Layer depth={0.7}>
      <rect x={-200} y={800} width={2400} height={14} fill="#14181b" />
      {Array.from({length: 10}).map((_, i) => (
        <Person key={i} x={500 + i * 70} y={830} h={160} hat={i % 2 ? 'jcap' : 'none'} pose="rail" color="#0e1113" seed={i} />
      ))}
    </Layer>
    <Layer depth={1}>
      {/* bare gun mount ring in the foreground */}
      <path d="M-200 1100 L-200 900 L700 900 L760 1100Z" fill="#0b0d0f" />
      <ellipse cx={300} cy={900} rx={260} ry={46} fill="#060708" />
      <ellipse cx={300} cy={892} rx={210} ry={30} fill="#1a1e21" />
      {Array.from({length: 12}).map((_, i) => (
        <circle key={i} cx={300 + 230 * Math.cos((i / 12) * Math.PI * 2)} cy={896 + 36 * Math.sin((i / 12) * Math.PI * 2)} r={6} fill="#2a2f33" />
      ))}
    </Layer>
  </Frame>
);

// ---------------- SCENE 09 · THE END OF THE FERRIES ----------------
const s09_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.02}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#4a5058'], [0.7, '#8d8f90'], [1, '#b9b3a6']]} />
      <Clouds color="#6a6e72" opacity={0.5} n={5} scale={1.4} seed="ef" />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={160} color="#5c6268" seed="efm" />
      <Houses x={1100} y={700} n={8} color="#4a5056" scale={0.45} seed="efh" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={700} top="#7a7d7e" bottom="#2c3134" streak="#d8d2c0" streaks={10} />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="transport" x={400} y={840} len={950} color="#23282c" roll={0.2} />
      <Pier x={-200} y={860} w={2400} color="#181c1f" posts={18} />
    </Layer>
  </Frame>
);

const s09_2: React.FC = () => {
  const {t, f} = useShot();
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.55, oy: 0.55}} overlay={<Stamp text="END OF 1946" />}>
      <Layer depth={0}>
        <Sky stops={[[0, '#1c2028'], [0.7, '#4a4040'], [1, '#8a5a40']]} />
      </Layer>
      <Layer depth={0.4}>
        <g fill="#141619">
          <path d="M-200 1100 L-200 420 L2200 380 L2200 1100Z" />
        </g>
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-200 + i * 200} y={400} width={150} height={680} fill="#191c20" stroke="#0c0e10" strokeWidth={6} />
        ))}
        {/* cut opening */}
        <path d="M700 520 L1260 510 L1300 1100 L660 1100Z" fill="#07080a" />
      </Layer>
      <Layer depth={0.7}>
        {[[900, 640], [1180, 760]].map(([x, y], j) => (
          <g key={j}>
            <Flicker x={x} y={y} r={160} color="#ff9a4a" opacity={0.9} seed={`tc${j}`} />
            {Array.from({length: 14}).map((_, i) => {
              const life = ((t * 1.3 + i / 14 + j * 0.3) % 1);
              const a = (rnd(`sp${j}${i}`) - 0.5) * 2.4 + Math.PI / 2;
              return <circle key={i} cx={x + Math.cos(a) * 160 * life} cy={y + Math.sin(a) * 160 * life + 140 * life * life} r={3} fill="#ffcf7a" opacity={1 - life} />;
            })}
            <Person x={x + 60} y={y + 220} h={240} hat="workerCap" pose="kneel" color="#050607" facing={-1} seed={j} />
          </g>
        ))}
        <Particles color="#ffb070" n={30} opacity={0.4} seed={`ef${f % 2}`} area={[600, 400, 800, 500]} rise={30} />
      </Layer>
    </Frame>
  );
};

const s09_3: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.03, dir: 1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#4a5058'], [0.7, '#8d8f90'], [1, '#b9b3a6']]} />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#7a7d7e" bottom="#2c3134" streak="#d8d2c0" />
    </Layer>
    <Layer depth={0.6}>
      {Array.from({length: 6}).map((_, i) => (
        <g key={i}>
          <Ship kind={i % 2 ? 'destroyer' : 'minesweeper'} x={-120 + i * 380} y={830 + (i % 2) * 20} len={340} color="#20252a" roll={0.2} />
          <rect x={-120 + i * 380 + 290} y={780 + (i % 2) * 20} width={50} height={34} fill="#e8dfc8" />
          <line x1={-120 + i * 380 + 315} y1={780 + (i % 2) * 20} x2={-120 + i * 380 + 315} y2={770 + (i % 2) * 20} stroke="#20252a" strokeWidth={3} />
        </g>
      ))}
    </Layer>
  </Frame>
);

// ---------------- SCENE 10 · THE LOTTERY ----------------
const Room: React.FC<{children?: React.ReactNode; move?: any; top?: React.ReactNode}> = ({children, move, top}) => (
  <Frame move={move ?? {type: 'push', amount: 0.03, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#1e1a17" />
      {Array.from({length: 10}).map((_, i) => (
        <rect key={i} x={-200 + i * 260} y={-200} width={6} height={900} fill="#000" opacity={0.25} />
      ))}
      <rect x={1400} y={120} width={360} height={420} fill="#0e1622" />
      <Stars n={20} maxY={400} />
      <rect x={1400} y={120} width={360} height={420} fill="none" stroke="#120f0c" strokeWidth={20} />
      <rect x={1572} y={120} width={14} height={420} fill="#120f0c" />
      {top}
    </Layer>
    <Layer depth={0.5}>{children}</Layer>
  </Frame>
);

const PlaceCard: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-80 0 L-70 -60 L70 -60 L80 0Z" fill="#e6dcc4" />
    <text x={0} y={-20} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={28} fill="#2a2420">
      {text}
    </text>
  </g>
);

const s10_1: React.FC = () => (
  <Room>
    <Lamp x={960} y={250} s={1.1} />
    <path d="M200 760 L1720 760 L1860 1100 L60 1100Z" fill="#3a2618" />
    <rect x={200} y={748} width={1520} height={16} fill="#5a3c26" />
    {[[420, 'USA'], [800, 'UK'], [1140, 'CHINA'], [1500, 'USSR']].map(([x, txt], i) => (
      <g key={i}>
        <path d={`M${(x as number) - 70} 760 L${(x as number) - 70} 600 Q${x} 560 ${(x as number) + 70} 600 L${(x as number) + 70} 760Z`} fill="#140f0c" />
        <PlaceCard x={x as number} y={820} text={txt as string} />
      </g>
    ))}
  </Room>
);

const s10_2: React.FC = () => {
  const r = smooth(useK(0.1, 0.6));
  return (
    <Frame move={{type: 'push', amount: 0.045, ox: 0.5, oy: 0.5}}>
      <Layer depth={0}>
        <Desk y={-300} color="#3a2618" edge="#3a2618" />
        <Glow x={960} y={400} r={900} color="#ffd896" opacity={0.3} />
      </Layer>
      <Layer depth={0.5}>
        <Telegram x={960} y={540} text={['CHINESE NAVY LOSSES HEAVY', 'SPECIAL CONSIDERATION', 'REQUESTED']} reveal={r} />
      </Layer>
    </Frame>
  );
};

const s10_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.035, ox: 0.5, oy: 0.55}}>
    <Layer depth={0}>
      <Desk y={-300} color="#3a2618" edge="#3a2618" />
      <Lamp x={1500} y={-40} s={1} />
    </Layer>
    <Layer depth={0.6}>
      <CapWithLots x={900} y={600} s={2.1} />
    </Layer>
  </Frame>
);

const s10_4: React.FC = () => {
  const k = smooth(useK(0.15, 0.8));
  const groups = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <Frame move={{type: 'push', amount: 0.025}}>
      <Layer depth={0.3}>
        <MapView bbox={[126, 28, 146, 42]} style={{...MAP_PAPER, sea: ['#53666b', '#3e5055']}} />
      </Layer>
      <Layer depth={0.6}>
        {groups.map(([gx, gy], g) => (
          <g key={g}>
            {k > 0.9 && <rect x={960 + gx * 420 - 230} y={540 + gy * 230 - 110} width={460} height={220} fill="none" stroke="#e8dfc8" strokeWidth={3} strokeDasharray="12 10" opacity={0.7} />}
            {Array.from({length: 5}).map((_, i) => {
              const sx = 700 + ((i * 4 + g) % 9) * 60;
              const sy = 420 + ((i * 3 + g * 2) % 6) * 50;
              const tx = 960 + gx * 420 - 170 + i * 80;
              const ty = 540 + gy * 230 + (i % 2) * 40 - 20;
              return (
                <g key={i} transform={`translate(${sx + (tx - sx) * k} ${sy + (ty - sy) * k}) rotate(${-20 + 20 * k})`}>
                  <path d="M-34 0 L-30 -10 L30 -12 L40 0 L30 8 L-30 8Z" fill="#1d2228" />
                </g>
              );
            })}
          </g>
        ))}
      </Layer>
    </Frame>
  );
};

const s10_5: React.FC = () => {
  const k = smooth(useK(0.2, 0.75));
  return (
    <Frame move={{type: 'push', amount: 0.04, ox: 0.5, oy: 0.4}}>
      <Layer depth={0}>
        <Desk y={-300} color="#3a2618" edge="#3a2618" />
        <Glow x={960} y={300} r={700} color="#ffd896" opacity={0.35} />
      </Layer>
      <Layer depth={0.6}>
        <CapWithLots x={900} y={700} s={2.1} lift={k * 60} />
        {/* hand coming from top, pinching a slip */}
        <g transform={`translate(${820} ${-200 + 640 * (k < 0.5 ? k * 2 : 1) - (k > 0.5 ? (k - 0.5) * 2 * 520 : 0)})`} fill="#8a6248">
          <path d="M-60 -400 L60 -400 L70 -40 Q60 20 0 30 Q-60 20 -70 -40Z" />
          <path d="M-70 -60 Q-110 -40 -90 20 Q-80 50 -50 30Z" />
          <rect x={-60} y={-560} width={120} height={180} fill="#2c3440" />
          {k > 0.5 && (
            <g transform="translate(0 60) rotate(-10)">
              <rect x={-36} y={-14} width={72} height={28} fill="#e8dfc8" />
            </g>
          )}
        </g>
      </Layer>
    </Frame>
  );
};

// ---------------- SCENE 11 · YUKIKAZE ----------------
const DuskSea: React.FC<{children?: React.ReactNode; move?: any; sun?: number; glows?: boolean; stamp?: string}> = ({children, move, sun = 1300, glows, stamp}) => {
  const {t} = useShot();
  return (
    <Frame move={move ?? {type: 'drift', amount: 0.03, dir: -1}} overlay={stamp ? <Stamp text={stamp} /> : undefined}>
      <Layer depth={0}>
        <Sky stops={[[0, '#2a2546'], [0.45, '#7a3a5a'], [0.75, '#d0703f'], [1, '#f2b06a']]} />
        <Glow x={sun} y={700} r={360} color="#ffc27a" core="#ffe9c0" coreR={90} />
        {glows &&
          [300, 700, 1600].map((x, i) => <Glow key={i} x={x} y={700} r={140 + 60 * Math.max(0, wave(t, 2.5 + i, i * 0.3))} color="#ff9a5a" opacity={0.5} />)}
        <Clouds color="#e8a07a" opacity={0.35} n={3} seed="ds" />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={710} top="#b85a4a" bottom="#251a2c" streak="#ffc89a" streaks={24} />
      </Layer>
      <Layer depth={0.6}>{children}</Layer>
    </Frame>
  );
};

const s11_1: React.FC = () => (
  <DuskSea>
    <Ship kind="destroyer" x={-100} y={820} len={800} color="#160f1c" rim="#f8b070" speed={50} wake="#ffd29a" />
  </DuskSea>
);

const s11_2: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.5, oy: 0.5}}>
    <Layer depth={0.3}>
      <MapView bbox={[118, 4, 179.5, 38]} style={MAP_PAPER}>
        {[
          [177.4, 28.2, 'MIDWAY', 0.15],
          [137, 15, 'PHILIPPINE SEA', 0.35],
          [125.5, 11, 'LEYTE GULF', 0.55],
          [128, 30.5, 'OKINAWA', 0.75],
        ].map(([lo, la, txt, at], i) => (
          <g key={i}>
            <MapDot lon={lo as number} lat={la as number} at={(at as number) * 7} />
            <MapLabel lon={lo as number} lat={la as number} text={txt as string} size={24} dy={-22} at={(at as number) * 7} />
          </g>
        ))}
        <MapRoute pts={[[135, 34], [177.4, 28.2], [137, 15], [125.5, 11], [128, 30.5], [132, 34]]} color="#2a2420" width={5} dashed from={0.05} to={0.9} arrow={false} bend={0.12} />
      </MapView>
    </Layer>
  </Frame>
);

const s11_3: React.FC = () => (
  <DuskSea glows move={{type: 'push', amount: 0.025, ox: 0.5}}>
    <Ship kind="destroyer" x={420} y={820} len={900} color="#160f1c" rim="#f8b070" speed={18} wake="#ffd29a" />
  </DuskSea>
);

const s11_4: React.FC = () => {
  const k = useK(0.15, 0.7);
  const keep = [17, 44, 70];
  return (
    <Frame move={{type: 'push', amount: 0.035}}>
      <Layer depth={0}>
        <rect x={-200} y={-200} width={2400} height={1500} fill="#3a3028" />
      </Layer>
      <Layer depth={0.5}>
        <Chalkboard x={200} y={130} w={1520} h={820}>
          {Array.from({length: 82}).map((_, i) => {
            const cx = 300 + (i % 10) * 135;
            const cy = 230 + Math.floor(i / 10) * 82;
            const kept = keep.includes(i);
            const o = kept ? 1 : 1 - clamp(k * 1.6 - (i / 82) * 0.6);
            return (
              <path key={i} transform={`translate(${cx} ${cy})`} d="M-50 0 L-46 -10 L40 -12 L54 0 L40 8 L-46 8Z" fill="none" stroke={kept && k > 0.6 ? '#f2d27a' : '#e8e4da'} strokeWidth={kept && k > 0.6 ? 5 : 3} opacity={o} />
            );
          })}
          <SvgText x={1500} y={900} text="82 → 3" size={70} font="stencil" color="#ece8de" opacity={useK(0.6, 0.75)} rotate={-4} />
        </Chalkboard>
      </Layer>
    </Frame>
  );
};

const s11_5: React.FC = () => {
  const n = Math.floor(clamp(useK(0.2, 0.7)) * 8);
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.6, oy: 0.55}} overlay={<Stamp text="JULY 1947" />}>
      <Layer depth={0}>
        <Sky stops={[[0, '#3a3a52'], [0.6, '#b0786a'], [1, '#efc08a']]} />
        <Glow x={1600} y={640} r={400} color="#ffd29a" opacity={0.7} />
      </Layer>
      <Layer depth={0.35}>
        <Sea y={680} top="#a87a6a" bottom="#2a2430" streak="#ffd8a8" />
      </Layer>
      <Layer depth={0.6}>
        <Ship kind="destroyer" x={-260} y={880} len={1500} color="#1d1820" rim="#ffd29a" roll={0.2} />
        <text x={1010} y={862} fontFamily={FONT_STENCIL} fontSize={34} fill="#e8dfc8" letterSpacing={5} transform="rotate(-1 1010 862)">
          {'TAN YANG'.slice(0, n)}
        </text>
        <Pier x={-200} y={960} w={2400} color="#120f14" posts={16} />
        {Array.from({length: 12}).map((_, i) => (
          <Person key={i} x={200 + i * 120} y={944} h={150} hat="jsailor" color="#120f14" seed={i} />
        ))}
      </Layer>
    </Frame>
  );
};

const s11_6: React.FC = () => {
  const k = smooth(useK(0.05, 0.8));
  return (
    <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.4}}>
      <Layer depth={0}>
        <Sky stops={[[0, '#2d2a48'], [0.6, '#9a5a5a'], [1, '#e8a070']]} />
        <Glow x={1300} y={900} r={500} color="#ffc27a" opacity={0.6} />
        <Clouds color="#c97a6a" opacity={0.35} n={3} seed="fl" />
      </Layer>
      <Layer depth={0.6}>
        <rect x={920} y={140} width={14} height={940} fill="#120f14" />
        <line x1={934} y1={150} x2={1000} y2={1000} stroke="#120f14" strokeWidth={3} />
        {/* dark backlit flag silhouette rising */}
        <g transform={`translate(934 ${900 - 720 * k})`}>
          <path d={`M0 0 Q90 ${-10} 180 0 T360 0 L360 220 Q270 210 180 220 T0 220Z`} fill="#1c1418" opacity={0.95} />
        </g>
        <path d="M-200 1000 L2200 980 L2200 1300 L-200 1300Z" fill="#120f14" />
      </Layer>
    </Frame>
  );
};

// ---------------- SCENE 12 · HIBIKI BECOMES VERNIY ----------------
const s12_1: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: 1}} overlay={<Stamp text="NAKHODKA · 1947" />}>
    <Layer depth={0}>
      <Sky stops={C.sky} />
      <Clouds color="#e9eef0" opacity={0.5} n={5} scale={1.4} seed="cn" />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={700} h={220} color={C.far} seed="cnm" snow="#ffffff" />
      <Hills y={710} amp={30} color={C.mid} seed="cnh" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={710} top="#8aa0aa" bottom="#34454e" streak="#ffffff" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="destroyer" x={-200} y={850} len={820} color="#26323a" rim="#ffffff" speed={30} wake="#e8f0f2" />
    </Layer>
    <Layer depth={1}>
      <Snow n={140} />
    </Layer>
  </Frame>
);

const s12_2: React.FC = () => {
  const n = Math.floor(clamp(useK(0.1, 0.5)) * 6);
  return (
    <Frame move={{type: 'push', amount: 0.035}}>
      <Layer depth={0}>
        <Sky stops={C.sky} />
      </Layer>
      <Layer depth={0.5}>
        <path d="M-200 300 L1700 260 L2200 1300 L-200 1300Z" fill="#2c3a42" />
        <path d="M-200 300 L1700 260" stroke="#ffffff" strokeWidth={6} strokeOpacity={0.5} />
        <text x={480} y={620} fontFamily={FONT_STENCIL} fontSize={170} fill="#e8eef0" letterSpacing={14}>
          {'ВЕРНЫЙ'.slice(0, n)}
        </text>
        <SvgText x={960} y={860} text="VERNIY · FAITHFUL" size={52} font="type" color="#d8e2e6" opacity={useK(0.55, 0.7)} />
      </Layer>
      <Layer depth={1}>
        <Snow n={90} />
      </Layer>
    </Frame>
  );
};

const s12_3: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.025, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={C.sky} />
    </Layer>
    <Layer depth={0.3}>
      <Sea y={560} top="#8aa0aa" bottom="#34454e" />
    </Layer>
    <Layer depth={0.6}>
      <path d="M-200 700 L2200 680 L2200 1300 L-200 1300Z" fill="#3a464d" />
      <path d="M-200 700 L2200 680 L2200 720 L-200 740Z" fill="#eef3f5" />
      <Person x={900} y={1000} h={440} hat="jsailor" item="rope" color="#151c20" rim="#ffffff" seed={2} />
      <ellipse cx={1040} cy={990} rx={120} ry={24} fill="none" stroke="#151c20" strokeWidth={10} />
    </Layer>
    <Layer depth={1}>
      <Snow n={120} />
    </Layer>
  </Frame>
);

const s12_4: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.025, dir: -1}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2a2e33'], [1, '#5a5c5c']]} />
    </Layer>
    <Layer depth={0.4}>
      <rect x={-200} y={760} width={2400} height={500} fill="#1c1f22" />
      {[[-100, 760, 900], [700, 780, 800], [1400, 770, 900]].map(([x, y, len], i) => (
        <g key={i}>
          <Ship kind={i === 1 ? 'destroyer' : 'cargo'} x={x} y={y} len={len} color="#121416" roll={0} guns={false} />
          <path d={`M${x + len * 0.4} ${y - 40} L${x + len * 0.6} ${y - 50} L${x + len * 0.62} ${y} L${x + len * 0.38} ${y}Z`} fill="#3a3c3c" />
        </g>
      ))}
      <Crane x={1100} y={760} color="#121416" h={420} />
    </Layer>
  </Frame>
);

const s12_5: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.04}}>
    <Layer depth={0}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#3c3a36" />
    </Layer>
    <Layer depth={0.5}>
      {Array.from({length: 9}).map((_, i) => (
        <rect key={i} x={360 + (i % 3) * 300 + rnd(`sc${i}`) * 80} y={540 + Math.floor(i / 3) * 90} width={420} height={70} fill={['#2a2826', '#5a3a2a', '#33302c'][i % 3]} transform={`rotate(${-8 + rnd(`scr${i}`) * 16} 900 700)`} />
      ))}
      <g transform="translate(980 500) rotate(-7)">
        <rect x={-260} y={-60} width={520} height={120} fill="#7a6a4a" />
        <path d="M200 -60 L260 -60 L260 60 L230 60 L250 10 L215 -20Z" fill="#3c3a36" />
        <text x={-20} y={22} textAnchor="middle" fontFamily={FONT_STENCIL} fontSize={60} fill="#2a2418" letterSpacing={8}>
          NO. 12
        </text>
      </g>
    </Layer>
  </Frame>
);

// ---------------- SCENE 13 · TOO FAMOUS TO GIVE AWAY ----------------
const s13_1: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.03, ox: 0.5, oy: 0.6}}>
    <Layer depth={0}>
      <Sky stops={N.sky} />
      <Stars />
      <Searchlight x={1700} y={760} angle={-120} sweep={22} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={720} h={200} color={N.far} seed="nm" />
    </Layer>
    <Layer depth={0.35}>
      <Sea y={720} top="#1d3646" bottom="#06101a" streak="#9cc4d0" />
    </Layer>
    <Layer depth={0.55}>
      <Ship kind="nagato" x={360} y={860} len={1200} color="#070d14" rim="#9cc4d0" />
    </Layer>
  </Frame>
);

const s13_2: React.FC = () => {
  return (
    <Frame move={{type: 'push', amount: 0.04}}>
      <Layer depth={0}>
        <Desk y={-300} color="#2e2018" edge="#2e2018" />
        <Glow x={960} y={300} r={800} color="#ffd896" opacity={0.3} />
      </Layer>
      <Layer depth={0.6}>
        <Envelope x={960} y={560} stamp="OPERATION CROSSROADS" />
      </Layer>
    </Frame>
  );
};

export const SHOTS2: Record<string, React.FC> = {
  '05_1': s05_1, '05_2': s05_2,
  '06_1': s06_1, '06_2': s06_2, '06_3': s06_3, '06_4': s06_4, '06_5': s06_5,
  '07_1': s07_1, '07_2': s07_2, '07_3': s07_3,
  '08_1': s08_1, '08_2': s08_2, '08_3': s08_3, '08_4': s08_4, '08_5': s08_5, '08_6': s08_6, '08_7': s08_7,
  '09_1': s09_1, '09_2': s09_2, '09_3': s09_3,
  '10_1': s10_1, '10_2': s10_2, '10_3': s10_3, '10_4': s10_4, '10_5': s10_5,
  '11_1': s11_1, '11_2': s11_2, '11_3': s11_3, '11_4': s11_4, '11_5': s11_5, '11_6': s11_6,
  '12_1': s12_1, '12_2': s12_2, '12_3': s12_3, '12_4': s12_4, '12_5': s12_5,
  '13_1': s13_1, '13_2': s13_2,
};
