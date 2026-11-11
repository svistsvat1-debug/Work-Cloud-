/* Video #1 — "How Many Men Did It Take to Keep ONE Soldier Fighting?"
   58 scenes, one per VO paragraph. Every visual is keyed to the spoken word via k(word). */
import React from 'react';
import {Arrow, Burst, C, Fade, Icon, Move, Pop, Scribble, Stroke, circ, roughRect} from '../../components/draw';
import {Balance, Clock, Crowd, Fig, Gauge, LevelBar, Pie, Puff} from '../../components/figure';
import {I} from '../../components/icons';
import {along, Route, WorldMap} from '../../components/map';
import {BigText, Counter, Label, MText, Title} from '../../components/text';
import type {SceneDef} from '../../components/VideoFromTimeline';
import {easeInOut, pop, prog} from '../../lib/anim';
import {useScene} from '../../lib/scene';

// ---------- local helpers ----------
const XMark: React.FC<{x: number; y: number; r?: number; at: number}> = ({x, y, r = 60, at}) => (
  <g>
    <Stroke d={`M${x - r},${y - r} L${x + r},${y + r}`} at={at} dur={0.25} color={C.red} w={11} />
    <Stroke d={`M${x + r},${y - r} L${x - r},${y + r}`} at={at + 0.2} dur={0.25} color={C.red} w={11} />
  </g>
);
const Check: React.FC<{x: number; y: number; at: number; s?: number}> = ({x, y, at, s = 1}) => (
  <Stroke d={`M${x - 30 * s},${y} L${x - 8 * s},${y + 24 * s} L${x + 36 * s},${y - 30 * s}`} at={at} dur={0.35} color={C.green} w={11} />
);
const Hedge: React.FC<{at?: number; y?: number; instant?: boolean}> = ({at = 0.2, y = 840, instant}) => {
  const d = `M0,${y} Q160,${y - 40} 320,${y - 10} T640,${y - 20} T960,${y - 5} T1280,${y - 30} T1600,${y - 10} T1920,${y - 25} L1920,${y + 60} L0,${y + 60} Z`;
  return (
    <g>
      <Scribble d={d} box={[0, y - 60, 1920, 130]} color={C.green} at={at + 0.4} dur={0.8} opacity={0.6} instant={instant} sp={18} w={16} />
      <Stroke d={`M0,${y} Q160,${y - 40} 320,${y - 10} T640,${y - 20} T960,${y - 5} T1280,${y - 30} T1600,${y - 10} T1920,${y - 25}`} at={at} dur={0.9} w={5} instant={instant} />
    </g>
  );
};
const Q: React.FC<{x: number; y: number; at: number; size?: number}> = ({x, y, at, size = 200}) => <BigText text="?" x={x} y={y} at={at} size={size} color={C.red} />;

/** Board world map used for the Atlantic crossing. */
const ATL: [[number, number], [number, number]] = [[-98, 22], [22, 62]];
const NY: [number, number] = [-74, 40.6];
const LANE: [number, number][] = [NY, [-60, 42.5], [-40, 46.5], [-20, 49], [-5, 49.6], [-1.6, 49.6]];
const FR: [[number, number], [number, number]] = [[-5.5, 42.5], [10.5, 52]];

// ---------- scenes ----------
const S01 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Normandy, 1944" at={k('normandy')} />
      <Hedge at={0.3} />
      <Fig x={820} y={830} s={1.7} at={k('soldier')} rifle />
      <Icon def={I.rifle} x={1420} y={420} s={0.75} at={k('rifle')} />
      <Label text="rifle" x={1680} y={435} at={k('rifle') + 0.4} />
      <Icon def={I.shovel} x={1420} y={575} s={0.45} rot={90} at={k('shovel')} />
      <Label text="shovel" x={1680} y={590} at={k('shovel') + 0.4} />
      <Icon def={I.ration} x={1420} y={735} s={0.55} at={k('day') - 0.4} draw={0.6} />
      <Label text="1 day of food" x={1690} y={750} at={k('day')} />
    </g>
  );
};

const S02 = () => {
  const {k} = useScene();
  const xs = [1260, 1110, 960, 810, 660, 510, 360, 210, 60];
  return (
    <g>
      <Hedge instant at={0} />
      <Fig x={1450} y={830} s={1.7} mode="instant" rifle />
      {xs.map((x, i) => (
        <Fig key={i} x={x} y={830} s={1.35} color="#bdbdbd" helmet={false} mode="pop" at={k('behind') + i * 0.28} />
      ))}
      <Label text="no war movie shows them" x={760} y={330} at={k('movie')} size={58} rot={-3} underline="red" />
      <Q x={140} y={560} at={k('long')} />
      <Label text="the exact number?" x={1500} y={260} at={k('exact')} size={52} />
    </g>
  );
};

const S03 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 1: Breakfast" />
      <Fig x={420} y={860} s={1.4} at={k('soldier')} />
      <Icon def={I.ration} x={1000} y={560} s={1.6} at={k('ration') - 0.2} />
      <Label text="K RATION" x={980} y={830} at={k('ration') + 0.5} size={64} underline="red" />
      <Arrow from={[1560, 380]} to={[1220, 470]} at={k('small')} />
      <Label text="waxed cardboard box" x={1600} y={340} at={k('small') + 0.2} />
    </g>
  );
};

const S04 = () => {
  const {k, t} = useScene();
  const xs = [520, 960, 1400];
  const words = ['breakfast', 'dinner', 'supper'];
  return (
    <g>
      {xs.map((x, i) => (
        <Icon key={i} def={I.ration} x={x} y={430} s={0.95} mode="pop" at={k('three') + i * 0.25} />
      ))}
      {xs.map((x, i) => (
        <Label key={'l' + i} text={words[i].toUpperCase()} x={x - 30} y={610} at={k(words[i])} size={50} />
      ))}
      <Burst x={960} y={835} rx={420} ry={110} at={k('two') + 1.4} />
      <Counter x={960} y={880} at={k('two')} to={2830} suffix=" kcal" size={130} dur={1.6} />
      {t > k('calories') && <Label text="per day" x={1500} y={960} at={k('calories')} />}
    </g>
  );
};

const S05 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.ration} x={500} y={560} s={1.3} mode="instant" />
      <Arrow from={[640, 420]} to={[840, 300]} at={k('cigarettes') - 0.3} dur={0.4} bend={0.1} />
      <Icon def={I.cigs} x={930} y={300} s={0.9} mode="pop" at={k('cigarettes')} />
      <Label text="cigarettes" x={930} y={430} at={k('cigarettes') + 0.2} />
      <Icon def={I.gum} x={1170} y={330} s={1} mode="pop" at={k('gum')} />
      <Label text="gum" x={1170} y={420} at={k('gum') + 0.2} />
      <Icon def={I.tissue} x={1420} y={310} s={0.9} mode="pop" at={k('toilet')} />
      <Label text="toilet paper" x={1420} y={430} at={k('toilet') + 0.2} />
      <Icon def={I.desk} x={1320} y={800} s={1.1} at={k('somebody')} />
      <Fig x={1100} y={900} s={0.95} pose="sit" helmet={false} color={C.khaki} at={k('office')} />
      <Label text="decided in an office far away" x={1250} y={1000} at={k('decided')} size={50} underline="red" />
    </g>
  );
};

const S06 = () => {
  const {k} = useScene();
  return (
    <g>
      <Hedge instant at={0} y={900} />
      <Fig x={600} y={890} s={1.6} pose="dig" at={0.2} />
      <Icon def={I.shovel} x={720} y={760} s={0.4} rot={30} mode="instant" at={0.6} />
      <Label text="2,830 kcal" x={1230} y={360} at={k('sounds')} size={48} />
      <LevelBar x={1230} y={780} at={k('sounds')} v0={1} v1={0.12} dur={k('hungry') - k('sounds')} />
      <Label text="energy" x={1230} y={830} at={k('sounds') + 0.4} />
      <Arrow from={[1560, 520]} to={[1300, 660]} at={k('isnt')} />
      <Label text="not enough!" x={1640} y={490} at={k('isnt') + 0.2} size={54} color={C.red} />
      <Label text="burns far more" x={600} y={330} at={k('burns')} />
      <MText text="always hungry" x={1230} y={980} at={k('hungry')} size={64} font="title" anchor="middle" underline="red" />
    </g>
  );
};

const S07 = () => {
  const {k} = useScene();
  return (
    <WorldMap extent={ATL} at={0.1} dur={1.6} fills={[{name: 'United States of America', color: C.blue, at: k('united')}]}>
      {(proj) => {
        const fr = proj([0.5, 48.5]) as [number, number];
        const us = proj([-84, 39]) as [number, number];
        return (
          <g>
            <Icon def={I.ration} x={fr[0] + 40} y={fr[1] - 10} s={0.45} mode="pop" at={0.3} />
            <Q x={fr[0] + 40} y={fr[1] - 90} at={k('who')} size={120} />
            <Icon def={I.pot} x={1000} y={830} s={0.6} mode="pop" at={k('cook')} />
            <XMark x={1000} y={830} r={55} at={k('cook') + 0.3} />
            <Label text="not an army cook" x={1000} y={950} at={k('cook') + 0.2} size={44} />
            <Icon def={I.factory} x={us[0]} y={us[1]} s={0.6} at={k('factory')} />
            <Route proj={proj} pts={[...LANE].reverse()} at={k('thousands')} dur={1.4} dash />
            <Label text="thousands of miles" x={(proj([-40, 46]) as any)[0]} y={(proj([-40, 46]) as any)[1] + 90} at={k('thousands') + 0.4} size={52} />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S08 = () => {
  const {k} = useScene();
  const items: [keyof typeof I, number, string, string, number][] = [
    ['wheat', 260, 'farmers', 'farmers', 0.9],
    ['factory', 690, 'factory', 'factory workers', 0.7],
    ['train', 1150, 'railroad', 'railroad crews', 0.75],
    ['crane', 1620, 'dockworkers', 'dockworkers', 0.8],
  ];
  return (
    <g>
      <Title text="Who touched it?" at={0} />
      {items.map(([ic, x, w, lab, s], i) => (
        <g key={i}>
          <Icon def={I[ic]} x={x} y={540} s={s} at={k(w) - 0.1} draw={0.7} />
          <Fig x={x - 175} y={820} s={0.7} helmet={false} color={C.khaki} mode="pop" at={k(w) + 0.3} />
          <Label text={lab} x={x + 40} y={830} at={k(w) + 0.3} size={46} />
          {i > 0 && <Arrow from={[items[i - 1][1] + 120, 560]} to={[x - 150, 560]} at={k(w) - 0.3} dur={0.35} bend={-0.1} />}
        </g>
      ))}
    </g>
  );
};

const S09 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.ration} x={960} y={400} s={1.1} mode="instant" />
      {Array.from({length: 18}).map((_, i) => {
        const a = Math.PI * (0.05 + (0.9 * i) / 17);
        return <Fig key={i} x={960 - Math.cos(a) * 520} y={470 + Math.sin(a) * 230} s={0.42} helmet={false} color={C.khaki} mode="pop" at={k('dozens') + i * 0.06} />;
      })}
      <Label text="dozens of people" x={960} y={220} at={k('dozens') + 0.3} size={58} underline="red" />
      <Label text="the easy part" x={330} y={330} at={k('easy')} size={50} />
      <Check x={330} y={400} at={k('easy') + 0.4} />
      <Puff x={600} y={930} at={k('explode')} s={1.3} />
      <XMark x={600} y={900} r={70} at={k('explode') + 0.3} />
      <Icon def={I.cargo} x={1300} y={900} s={0.65} rot={-14} mode="pop" at={k('sink')} />
      <XMark x={1300} y={900} r={70} at={k('sink') + 0.3} />
      <MText text="the hard part?" x={1700} y={760} at={k('sink') + 0.7} size={52} font="title" anchor="middle" color={C.red} />
    </g>
  );
};

const S10 = () => {
  const {k, t} = useScene();
  return (
    <g>
      <Title text="Quest 2: The Ocean" />
      <WorldMap extent={ATL} box={[80, 190, 1760, 860]} at={0.2} dur={1.2}>
        {(proj) => {
          const f = easeInOut(prog(t, k('atlantic'), 3.5));
          const p = along(proj, LANE, f);
          const mid = proj([-42, 47]) as [number, number];
          return (
            <g>
              <Route proj={proj} pts={LANE} at={k('atlantic')} dur={3.5} color={C.blue} />
              {t > k('atlantic') && <Icon def={I.cargo} x={p[0]} y={p[1] - 30} s={0.32} mode="instant" />}
              <Burst x={mid[0]} y={mid[1] + 115} rx={250} ry={70} at={k('three') + 0.4} />
              <MText text="3,000+ miles" x={mid[0]} y={mid[1] + 140} at={k('three')} size={76} font="title" anchor="middle" />
            </g>
          );
        }}
      </WorldMap>
    </g>
  );
};

const S11 = () => {
  const {k, t} = useScene();
  return (
    <WorldMap extent={ATL} box={[80, 190, 1760, 860]} instant dim>
      {(proj) => {
        const sub = proj([-36, 44]) as [number, number];
        const ship = proj([-31, 48.5]) as [number, number];
        const sinkP = easeInOut(prog(t, k('down'), 1.2));
        return (
          <g>
            <Route proj={proj} pts={LANE} at={-1} dur={0.01} color={C.blue} />
            <Icon def={I.sub} x={sub[0]} y={sub[1] + 40} s={0.6} at={k('submarines')} />
            <Label text="U-boat" x={sub[0]} y={sub[1] + 150} at={k('boats')} size={52} />
            <Arrow from={[sub[0] + 80, sub[1] + 10]} to={[ship[0] - 10, ship[1] + 20]} at={k('hunting')} dash />
            <g transform={`translate(${ship[0]},${ship[1] + sinkP * 50}) rotate(${sinkP * 25})`} opacity={1 - sinkP * 0.55}>
              <Icon def={I.cargo} x={0} y={0} s={0.45} mode="instant" />
            </g>
            <XMark x={ship[0]} y={ship[1] + 20} r={55} at={k('down') + 0.6} />
            <Icon def={I.crate} x={ship[0] + 230} y={ship[1] - 120} s={0.5} mode="pop" at={k('bullets')} />
            <Icon def={I.ration} x={ship[0] + 380} y={ship[1] - 120} s={0.4} mode="pop" at={k('food')} />
            <Icon def={I.helmet} x={ship[0] + 530} y={ship[1] - 110} s={0.5} mode="pop" at={k('men')} />
            <Label text="lost at sea" x={ship[0] + 380} y={ship[1] + 10} at={k('men') + 0.3} color={C.red} />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S12 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="America needed ships" x={90} y={130} at={0.1} size={60} font="title" underline="red" />
      <Fade at={k('thousands') - 0.1} out={k('liberty') - 0.2}>
        <BigText text="THOUSANDS" x={960} y={560} at={k('thousands') - 0.1} size={170} eq />
      </Fade>
      <Icon def={I.liberty} x={960} y={540} s={2.2} at={k('liberty')} draw={1.8} fill={0.9} />
      <Label text="LIBERTY SHIP" x={960} y={890} at={k('liberty') + 1.2} size={70} underline="red" />
      <Label text="simple · slow · cheap to build" x={960} y={980} at={k('simple')} size={44} />
      <Arrow from={[1500, 250]} to={[1300, 380]} at={k('assembly')} />
      <Label text="built like cars on an assembly line" x={1360} y={230} at={k('assembly') + 0.2} size={44} />
    </g>
  );
};

const S13 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.liberty} x={1180} y={380} s={1.25} mode="instant" />
      <Fig x={560} y={930} s={1.6} helmet={false} headscarf color={C.blue} at={k('welders')} />
      <Icon def={I.torch} x={720} y={760} s={1} rot={-25} mode="pop" at={k('torch') - 0.2} />
      <Burst x={790} y={720} r={34} at={k('torch')} n={10} color={C.orange} />
      <Label text="never held a torch" x={560} y={420} at={k('never')} size={52} />
      <MText text="many were women" x={1160} y={760} at={k('women')} size={64} font="title" anchor="middle" underline="red" />
      <Icon def={I.calendar} x={1500} y={900} s={0.55} mode="pop" at={k('weeks')} />
      <Label text="weeks" x={1500} y={930} at={k('weeks') + 0.2} size={42} />
      <Label text="not years" x={1720} y={930} at={k('years')} color={C.red} size={46} />
    </g>
  );
};

const S14 = () => {
  const {k} = useScene();
  return (
    <g>
      <Burst x={480} y={360} rx={330} ry={110} at={k('two') + 1.3} />
      <Counter x={480} y={410} at={k('two')} to={2710} size={150} dur={1.6} />
      <Label text="Liberty ships built" x={480} y={500} at={k('ten')} size={50} />
      {Array.from({length: 40}).map((_, i) => (
        <Icon key={i} def={I.liberty} x={1000 + (i % 8) * 110} y={230 + Math.floor(i / 8) * 70} s={0.16} mode="pop" at={k('built') + i * 0.04} />
      ))}
      <MText text="Robert E. Peary:" x={480} y={760} at={k('robert')} size={56} font="title" anchor="middle" />
      <Icon def={I.calendar} x={960} y={800} s={0.75} mode="pop" at={k('four')} />
      <MText text="4 days" x={960} y={860} at={k('four') + 0.2} size={44} font="title" anchor="middle" />
      <Clock x={1330} y={800} r={85} at={k('fifteen')} speed={2} />
      <MText text="+15 hours" x={1610} y={820} at={k('fifteen') + 0.2} size={56} font="title" anchor="middle" underline="red" />
    </g>
  );
};

const S15 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.cargo} x={1250} y={560} s={1.4} at={0.2} draw={1.2} />
      <Fig x={560} y={900} s={1.6} helmet={false} cap color={C.blue} at={k('crew')} />
      <MText text="MERCHANT MARINE" x={560} y={330} at={k('merchant')} size={60} font="title" anchor="middle" underline="red" />
      <Label text="civilians" x={560} y={420} at={k('civilian')} size={54} />
      <Label text="not soldiers" x={900} y={560} at={k('soldiers')} size={50} color={C.red} />
      {Array.from({length: 7}).map((_, i) => (
        <Pop key={i} x={1000 + i * 110} y={920} at={k('deadliest') + i * 0.12}>
          <path d={`M${1000 + i * 110},${890} v60 M${985 + i * 110},${905} h30`} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        </Pop>
      ))}
      <Label text="one of the deadliest jobs at sea" x={1330} y={1030} at={k('deadliest') + 0.3} size={46} />
    </g>
  );
};

const S16 = () => {
  const {k} = useScene();
  return (
    <WorldMap extent={[[-12, 40], [16, 56]]} box={[80, 150, 1760, 880]} at={0} dur={1.0}>
      {(proj) => {
        const coast = proj([-1.2, 49.5]) as [number, number];
        const front = proj([6.0, 48.8]) as [number, number];
        return (
          <g>
            <Icon def={I.cargo} x={coast[0] - 150} y={coast[1] - 40} s={0.5} mode="pop" at={0.3} />
            <Label text="< 1 week to build" x={coast[0] - 150} y={coast[1] - 150} at={k('week')} size={46} />
            <Check x={coast[0] - 150} y={coast[1] + 60} at={k('solved')} />
            <Label text="the coast" x={coast[0]} y={coast[1] + 120} at={k('coast')} size={48} underline="red" />
            <Fig x={front[0]} y={front[1] + 40} s={0.7} mode="pop" at={k('summer')} />
            <Arrow from={[coast[0] + 40, coast[1] + 30]} to={[front[0] - 50, front[1]]} at={k('nowhere')} dash />
            <Q x={(coast[0] + front[0]) / 2} y={coast[1] - 30} at={k('nowhere') + 0.5} size={130} />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S17 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 3: The Last Miles" />
      <WorldMap extent={FR} box={[80, 180, 1760, 860]} at={0.2} dur={1.2} fills={[{name: 'France', color: C.blue, at: k('allied')}]}>
        {(proj) => {
          const beach = proj([-0.8, 49.4]) as [number, number];
          const front = proj([5.4, 49.1]) as [number, number];
          const rails: [number, number][][] = [
            [[-1.6, 49.6], [0.1, 49.5], [2.35, 48.85]],
            [[2.35, 48.85], [4.0, 49.25], [5.4, 49.1]],
            [[-1.7, 48.1], [0.2, 47.4], [1.9, 47.9], [2.35, 48.85]],
          ];
          return (
            <g>
              <Route proj={proj} pts={[[-0.8, 49.3], [1.5, 48.6], [2.35, 48.85], [4.0, 49.0], [5.6, 49.0]]} at={k('raced')} dur={1.4} color={C.blue} w={14} />
              <Arrow from={[front[0] - 60, front[1]]} to={[front[0] + 40, front[1]]} at={k('raced') + 1.3} color={C.blue} w={14} head={40} />
              <Label text="the front" x={front[0]} y={front[1] - 70} at={k('front')} size={52} underline="red" />
              <Label text="beaches" x={beach[0] - 60} y={beach[1] - 60} at={k('beaches')} size={46} />
              {rails.map((r, i) => (
                <Route key={i} proj={proj} pts={r} at={k('railways') + i * 0.15} dur={0.6} color={C.ink} w={4} dash />
              ))}
              {[[0.1, 49.5], [4.0, 49.25], [0.2, 47.4]].map((p, i) => {
                const q = proj(p as [number, number]) as [number, number];
                return <XMark key={i} x={q[0]} y={q[1]} r={26} at={k('wrecked') + i * 0.2} />;
              })}
            </g>
          );
        }}
      </WorldMap>
    </g>
  );
};

const RB_OUT: [number, number][] = [[-1.1, 49.1], [-0.3, 48.75], [0.6, 48.55], [1.5, 48.45]];
const RB_BACK: [number, number][] = [[1.5, 48.35], [0.6, 48.4], [-0.3, 48.6], [-1.1, 48.95]];

const S18 = () => {
  const {k, t} = useScene();
  return (
    <WorldMap extent={[[-3, 47], [4, 50.5]]} box={[80, 160, 1760, 880]} at={0} dur={0.9}>
      {(proj) => (
        <g>
          <Route proj={proj} pts={RB_OUT} at={k('roads')} dur={1.0} color={C.red} w={12} />
          <Route proj={proj} pts={RB_BACK} at={k('roads') + 0.5} dur={1.0} color={C.blue} w={12} />
          {Array.from({length: 6}).map((_, i) => {
            const st = (i === 0 ? k('trucks') : k('thousands')) + i * 0.15;
            if (t < st) return null;
            const f = ((t - st) * 0.18 + i * 0.16) % 1;
            const p = along(proj, RB_OUT, f);
            return <Icon key={i} def={I.truck} x={p[0]} y={p[1] - 45} s={0.32} mode="pop" at={st} />;
          })}
          <Label text="one-way roads" x={(proj([0.2, 47.9]) as any)[0]} y={(proj([0.2, 47.9]) as any)[1] + 40} at={k('way')} size={48} />
          <Label text="day and night" x={(proj([-1.6, 47.7]) as any)[0]} y={(proj([-1.6, 47.7]) as any)[1]} at={k('night')} size={46} />
          <Icon def={I.ballBadge} x={1500} y={240} s={0.8} mode="pop" at={k('red')} />
          <MText text="RED BALL EXPRESS" x={1500} y={390} at={k('red')} size={64} font="title" anchor="middle" underline="red" outlineWhite />
        </g>
      )}
    </WorldMap>
  );
};

const S19 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.truck} x={860} y={640} s={2.1} at={0.1} draw={1.2} />
      <MText text="2½ tons" x={300} y={330} at={k('two')} size={70} font="title" anchor="middle" />
      <MText text='"deuce and a half"' x={860} y={1000} at={k('deuce')} size={64} font="title" anchor="middle" underline="red" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} def={I.crate} x={760 + (i % 3) * 170 + (i > 2 ? 85 : 0)} y={(i > 2 ? 300 : 410)} s={0.95} mode="pop" at={k('loaded') + i * 0.18} />
      ))}
      <Arrow from={[1650, 260]} to={[1340, 330]} at={k('beyond')} />
      <Label text="overloaded" x={1660} y={230} at={k('beyond') + 0.2} size={56} color={C.red} />
    </g>
  );
};

const S20 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.calendar} x={420} y={530} s={1.5} at={k('august') - 0.2} />
      <MText text="AUG 29" x={420} y={590} at={k('ninth')} size={64} font="title" anchor="middle" />
      <MText text="1944" x={420} y={660} at={k('forty')} size={50} font="title" anchor="middle" />
      <Label text="the record" x={420} y={300} at={k('record')} size={54} underline="red" />
      <Counter x={1200} y={420} at={k('five')} to={5958} size={140} dur={1.8} />
      <Label text="trucks & vehicles" x={1200} y={500} at={k('vehicles')} size={48} />
      <Burst x={1200} y={700} rx={330} ry={100} at={k('twelve') + 1.4} />
      <Counter x={1200} y={740} at={k('twelve')} to={12342} suffix=" t" size={130} dur={1.6} />
      <Label text="of supplies" x={1200} y={815} at={k('tons')} size={44} />
      <MText text="in ONE day" x={1200} y={960} at={k('single')} size={72} font="title" anchor="middle" color={C.red} underline="double" />
    </g>
  );
};

const S21 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.truck} x={1160} y={720} s={1.8} at={0} draw={1.0} />
      <Fig x={520} y={900} s={1.6} color="#59672f" at={0.3} />
      <MText text="3 out of 4 drivers" x={700} y={280} at={k('three')} size={64} font="title" anchor="middle" underline="red" />
      {[0, 1, 2, 3].map((i) => (
        <Fig key={i} x={420 + i * 130} y={560} s={0.6} color={i < 3 ? '#59672f' : '#bdbdbd'} mode="pop" at={k('four') + i * 0.15} />
      ))}
      <Label text="Black soldiers" x={700} y={630} at={k('black')} size={54} />
      <Label text="a segregated army" x={1400} y={300} at={k('segregated')} size={50} />
      <Clock x={1600} y={470} r={75} at={k('days')} speed={3} red />
      <Label text="days · little sleep" x={1600} y={600} at={k('sleep')} size={46} />
    </g>
  );
};

const S22 = () => {
  const {k, t} = useScene();
  return (
    <g>
      <Icon def={I.truck} x={420} y={430} s={1.1} mode="instant" />
      <MText text="Z z z" x={330} y={260} at={k('asleep')} size={60} font="title" color={C.blue} />
      <Icon def={I.truck} x={1000} y={430} s={1.1} mode="instant" rot={6} />
      <Puff x={1000} y={330} at={k('broke')} />
      <Icon def={I.wrench} x={1180} y={300} s={0.7} mode="pop" at={k('down') + 0.2} rot={-20} />
      <Label text="breakdowns by the thousands" x={760} y={620} at={k('thousands')} size={48} />
      <Stroke d="M0,900 L1920,900" at={k('convoys') - 0.3} dur={0.5} w={5} />
      {[0, 1, 2, 3].map((i) => {
        const st = k('convoys');
        if (t < st) return null;
        const x = -200 + ((t - st) * 160 + i * 300);
        return <Icon key={i} def={I.truck} x={x} y={850} s={0.5} mode="instant" />;
      })}
      <Icon def={I.jerrycan} x={1550} y={430} s={1.3} at={k('one') - 0.3} />
      <Q x={1730} y={330} at={k('above')} size={120} />
    </g>
  );
};

const S23 = () => {
  const {k, t} = useScene();
  const roadP = easeInOut(prog(t, k('road'), 3));
  return (
    <g>
      <MText text="a cruel twist" x={90} y={130} at={0.1} size={60} font="title" underline="red" />
      <Icon def={I.truck} x={380 + roadP * 520} y={740} s={1.3} at={0.3} />
      <Icon def={I.jerrycan} x={440 + roadP * 520} y={630} s={0.35} mode="pop" at={0.8} />
      <Stroke d="M120,860 L1820,860" at={k('road')} dur={1.4} w={6} />
      <Label text="longer road" x={1500} y={930} at={k('road') + 0.5} size={46} />
      <Gauge x={900} y={400} r={110} at={k('gasoline')} v0={0.95} v1={0.3} dur={3} label="TRUCK FUEL" />
      <Arrow from={[1450, 300]} to={[1650, 470]} at={k('delivering')} bend={-0.4} />
      <Arrow from={[1650, 520]} to={[1430, 360]} at={k('delivering') + 0.3} bend={-0.4} />
      <Label text="fuel to deliver fuel" x={1560} y={620} at={k('delivering') + 0.5} size={50} color={C.red} />
    </g>
  );
};

const S24 = () => {
  const {k} = useScene();
  return (
    <WorldMap extent={[[-1, 46.5], [9, 51]]} box={[80, 220, 1760, 820]} at={0.2} dur={1.0}>
      {(proj) => {
        const verdun = proj([5.38, 49.16]) as [number, number];
        return (
          <g>
            <MText text="GASOLINE" x={90} y={130} at={0} size={64} font="title" underline="red" />
            <Route proj={proj} pts={[[5.1, 50.2], [5.3, 49.6], [5.38, 49.16], [5.6, 48.75], [5.7, 48.2]]} at={k('meuse') - 0.2} dur={1.0} color={C.blue} w={8} />
            <Label text="Meuse river" x={verdun[0] + 190} y={verdun[1] - 140} at={k('meuse')} size={48} color={C.blue} />
            <Route proj={proj} pts={[[2.35, 48.85], [3.6, 49.0], [4.6, 49.1], [5.2, 49.15]]} at={k('august')} dur={1.0} color={C.blue} w={12} />
            <Icon def={I.tank} x={verdun[0] - 100} y={verdun[1] - 20} s={0.55} at={k('tanks')} />
            <Label text="Patton's tanks" x={verdun[0] - 120} y={verdun[1] + 110} at={k('pattons')} size={46} />
            <Label text="not the Germans" x={480} y={900} at={k('germans')} size={50} />
            <Stroke d="M330,890 L640,880" at={k('germans') + 0.6} dur={0.3} color={C.red} w={8} />
            <Gauge x={1560} y={900} r={110} at={k('enough')} v0={0.5} v1={0} dur={k('ran') - k('enough') + 0.3} />
            <MText text="OUT OF FUEL" x={1560} y={1010} at={k('ran')} size={56} font="title" anchor="middle" color={C.red} />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S25 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="Clue #1" x={90} y={130} at={0.1} size={64} font="title" underline="red" />
      <MText text="War = moving things" x={960} y={360} at={k('moving')} size={96} font="title" anchor="middle" underline="double" />
      <Label text="not mostly fighting" x={960} y={220} at={k('fighting')} size={50} />
      <Hedge instant at={0} y={900} />
      <Fig x={1650} y={890} s={1.3} mode="instant" />
      <Crowd x={180} y={890} cols={11} rows={1} gap={125} s={0.55} at={k('people')} stagger={0.1} />
      <Label text="lots of people" x={800} y={600} at={k('lots')} size={60} color={C.red} />
    </g>
  );
};

const S26 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 4: Mail Call" />
      <Icon def={I.jerrycan} x={330} y={500} s={0.8} mode="pop" at={k('gasoline')} />
      <XMark x={330} y={500} r={80} at={k('gasoline') + 0.3} />
      <Fig x={1500} y={900} s={1.5} pose="read" at={k('hope')} />
      <Label text="hope" x={1500} y={480} at={k('hope') + 0.3} size={70} color={C.red} underline="red" />
      <Icon def={I.envelope} x={900} y={600} s={1.5} at={k('envelope') - 0.4} />
    </g>
  );
};

const S27 = () => {
  const {k} = useScene();
  return (
    <g>
      <Icon def={I.cargo} x={560} y={700} s={1.5} at={0} draw={0.9} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} def={I.sack} x={300 + i * 95} y={520 - (i % 2) * 40} s={0.4} mode="pop" at={k('millions') + i * 0.18} />
      ))}
      <Label text="millions of letters" x={560} y={330} at={k('millions') + 0.3} size={54} />
      <Label text="paper is heavy" x={560} y={1000} at={k('heavy')} size={50} color={C.red} />
      <Balance x={1450} y={330} at={k('every')} tilt={-14} tiltAt={k('space')} left={<Icon def={I.sack} x={0} y={-60} s={0.45} mode="instant" />} right={<Icon def={I.crate} x={0} y={-50} s={0.6} mode="instant" />} />
      <Label text="mail" x={1220} y={760} at={k('sack')} size={44} />
      <Label text="shells & food" x={1690} y={760} at={k('shells')} size={44} />
    </g>
  );
};

const S28 = () => {
  const {k, t} = useScene();
  const shrink = easeInOut(prog(t, k('photographed'), 1.2));
  return (
    <g>
      <g transform={`translate(${420 + shrink * 380},${520}) scale(${1 - shrink * 0.8})`} opacity={1 - shrink}>
        <Icon def={I.envelope} x={0} y={0} s={1.1} at={0.1} />
      </g>
      <Icon def={I.camera} x={960} y={480} s={1.1} at={k('army')} />
      <Burst x={960} y={480} r={150} at={k('photographed') + 0.5} n={10} />
      <Icon def={I.film} x={1500} y={500} s={1.1} at={k('film') - 0.2} />
      <Label text="tiny rolls of film" x={1500} y={640} at={k('tiny')} size={46} />
      <MText text="V-MAIL" x={960} y={880} at={k('victory')} size={110} font="title" anchor="middle" underline="double" />
      <Label text="Victory Mail" x={960} y={990} at={k('mail')} size={50} />
    </g>
  );
};

const S29 = () => {
  const {k, t} = useScene();
  const c = easeInOut(prog(t, k('shrank'), 1.0));
  return (
    <g>
      {Array.from({length: 37}).map((_, i) => {
        const x0 = 150 + (i % 8) * 95;
        const y0 = 260 + Math.floor(i / 8) * 135;
        const x = x0 + (900 - x0) * c;
        const y = y0 + (520 - y0) * c;
        return (
          <g key={i} opacity={1 - c}>
            <Icon def={I.sack} x={x} y={y} s={0.33} mode="pop" at={0.1 + i * 0.03} />
          </g>
        );
      })}
      <Label text="37 mail bags of letters" x={480} y={970} at={k('thirty') + 0.4} size={50} />
      <Icon def={I.sack} x={900} y={500} s={1.2} mode="pop" at={k('one')} />
      <Burst x={900} y={500} r={190} at={k('one') + 0.2} />
      <BigText text="37" x={760} y={830} at={k('single')} size={110} />
      <Arrow from={[830, 795]} to={[960, 795]} at={k('single') + 0.15} dur={0.3} bend={0} />
      <BigText text="1" x={1030} y={830} at={k('single') + 0.4} size={110} color={C.red} />
      <Icon def={I.film} x={1520} y={360} s={0.8} at={k('ocean')} />
      <Arrow from={[1520, 440]} to={[1520, 600]} at={k('printed')} bend={0} />
      <Icon def={I.envelope} x={1520} y={720} s={0.8} mode="pop" at={k('paper')} />
      <Label text="printed & delivered" x={1520} y={890} at={k('delivered')} size={46} />
    </g>
  );
};

const S30 = () => {
  const {k} = useScene();
  const bubble = 'M1000,520 Q960,380 1100,330 Q1180,200 1360,260 Q1520,180 1640,300 Q1800,330 1760,480 Q1820,620 1640,650 Q1520,740 1360,680 Q1180,740 1100,640 Q960,640 1000,520 Z';
  return (
    <g>
      <Scribble d="M200,900 Q600,820 1000,900 L1000,1000 L200,1000 Z" box={[200, 820, 800, 180]} color="#8a6a45" at={0.1} dur={0.6} opacity={0.6} />
      <Stroke d="M200,900 Q600,820 1000,900" at={0.1} dur={0.6} />
      <Fig x={600} y={960} s={1.5} pose="read" at={0.2} />
      <Icon def={I.envelope} x={720} y={740} s={0.35} mode="pop" at={0.8} />
      <Label text="age 19" x={330} y={620} at={k('nineteen')} size={52} />
      <Stroke d="M840,700 Q900,650 960,600" at={k('proof') - 0.2} dur={0.4} w={4} />
      <Stroke d={bubble} at={k('proof')} dur={0.9} w={6} />
      <Icon def={I.house} x={1180} y={480} s={0.6} mode="pop" at={k('home')} />
      <Pop x={1380} y={380} at={k('weather')}>
        <g>
          <circle cx={1380} cy={380} r={40} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          {Array.from({length: 8}).map((_, i) => (
            <line key={i} x1={1380 + Math.cos((i * Math.PI) / 4) * 55} y1={380 + Math.sin((i * Math.PI) / 4) * 55} x2={1380 + Math.cos((i * Math.PI) / 4) * 75} y2={380 + Math.sin((i * Math.PI) / 4) * 75} stroke={C.ink} strokeWidth={5} />
          ))}
        </g>
      </Pop>
      <Label text="the weather" x={1380} y={520} at={k('weather') + 0.2} size={42} />
      <Pop x={1600} y={420} at={k('weddings')}>
        <path d="M1600,450 c-20,-28 -60,-4 -30,28 l30,28 l30,-28 c30,-32 -10,-56 -30,-28 Z" fill={C.red} stroke={C.ink} strokeWidth={5} />
      </Pop>
      <Label text="a wedding" x={1600} y={580} at={k('weddings') + 0.2} size={42} />
      <MText text="not the war" x={1380} y={860} at={k('nobody')} size={64} font="title" anchor="middle" color={C.red} underline="red" />
    </g>
  );
};

const S31 = () => {
  const {k, t} = useScene();
  const grid = roughRect(510, 160, 900, 260, 2, 4);
  const cells = Array.from({length: 4}).map((_, i) => `M${510 + (i + 1) * 180},160 L${510 + (i + 1) * 180},420`).join(' ') + ' M510,290 L1410,290';
  return (
    <g>
      {[500, 960, 1420].map((x, i) => (
        <g key={i}>
          <Icon def={I.desk} x={x} y={820} s={0.9} at={k('somewhere') + i * 0.25} draw={0.6} />
          <Fig x={x - 150} y={900} s={0.85} pose="sit" helmet={false} color={C.khaki} at={k('somewhere') + 0.3 + i * 0.25} draw={0.6} />
        </g>
      ))}
      <Stroke d={grid} at={k('sorting') - 0.4} dur={0.6} />
      <Stroke d={cells} at={k('sorting') - 0.1} dur={0.6} w={4} />
      {Array.from({length: 10}).map((_, i) => {
        const st = k('sorting') + i * 0.35;
        if (t < st) return null;
        const p = easeInOut(prog(t, st, 0.8));
        const tx = 600 + (i % 5) * 180;
        const ty = 225 + Math.floor(i / 5) * 130;
        return (
          <g key={i} transform={`translate(${960 + (tx - 960) * p},${700 + (ty - 700) * p}) scale(0.28)`}>
            <path d="M-130,-80 h260 v160 h-260 Z M-130,-80 L0,10 L130,-80" fill="#f3ead2" stroke={C.ink} strokeWidth={14} />
          </g>
        );
      })}
      <Label text="nobody makes movies about them" x={960} y={1030} at={k('movies')} size={48} />
      {(() => {
        const st = k('waited');
        if (t < st) return null;
        const p = easeInOut(prog(t, st, 1.2));
        return (
          <g transform={`translate(${1420 + p * 600},${600 - p * 200}) rotate(${p * 30}) scale(0.35)`}>
            <path d="M-130,-80 h260 v160 h-260 Z M-130,-80 L0,10 L130,-80" fill="#f3ead2" stroke={C.ink} strokeWidth={12} />
            <path d="M0,30 c-10,-14 -30,-2 -15,14 l15,14 l15,-14 c15,-16 -5,-28 -15,-14 Z" fill={C.red} />
          </g>
        );
      })()}
    </g>
  );
};

const S32 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 5: The Chain" />
      <Hedge instant at={0} y={900} />
      <Puff x={250} y={700} at={0.4} s={0.9} />
      <Fig x={900} y={900} s={1.7} pose="sit" bandage at={k('wounded') - 0.3} />
      <Label text="wounded" x={900} y={420} at={k('wounded')} size={56} />
      <Arrow from={[1350, 600]} to={[1030, 800]} at={k('walk')} />
      <Label text="can't walk" x={1450} y={580} at={k('walk') + 0.2} size={52} color={C.red} />
      <Q x={1600} y={380} at={k('next')} size={170} />
    </g>
  );
};

const S33 = () => {
  const {k} = useScene();
  return (
    <g>
      <Hedge instant at={0} y={900} />
      <Fig x={1150} y={900} s={1.5} pose="sit" bandage mode="instant" />
      <Fig x={780} y={900} s={1.5} pose="kneel" armband at={k('medic') - 0.2} />
      <Label text="medic" x={700} y={450} at={k('medic') + 0.3} size={56} underline="red" />
      <Icon def={I.hospital} x={320} y={300} s={0.55} mode="pop" at={k('hospital')} />
      <XMark x={320} y={300} r={70} at={k('hospital') + 0.2} />
      <Icon def={I.sack} x={560} y={830} s={0.35} mode="pop" at={k('bag')} />
      <Label text="canvas bag" x={430} y={700} at={k('bag') + 0.1} size={44} />
      <Clock x={1580} y={380} r={95} at={k('buy')} speed={1.5} red />
      <MText text="buy time" x={1580} y={560} at={k('buy') + 0.1} size={60} font="title" anchor="middle" color={C.red} />
    </g>
  );
};

const S34 = () => {
  const {k} = useScene();
  const steps: [string, number, React.ReactNode, string][] = [
    ['litter', 250, null, 'litter bearers'],
    ['aid', 700, null, 'aid station'],
    ['ambulance', 1160, null, 'ambulance'],
    ['hospital', 1620, null, 'field hospital'],
  ];
  return (
    <g>
      {/* stretcher team */}
      <Fig x={150} y={760} s={0.85} at={k('litter') - 0.2} draw={0.6} />
      <Fig x={360} y={760} s={0.85} at={k('litter')} draw={0.6} />
      <Stroke d="M175,660 L335,660" at={k('bearers')} dur={0.3} w={9} />
      <Icon def={I.tent} x={700} y={620} s={0.85} at={k('aid') - 0.2} />
      <Icon def={I.redcross} x={700} y={580} s={0.45} mode="pop" at={k('station')} />
      <Icon def={I.ambulance} x={1160} y={640} s={0.85} at={k('ambulance') - 0.2} />
      <Icon def={I.hospital} x={1620} y={610} s={0.85} at={k('hospital') - 0.2} />
      {steps.map(([w, x, , lab], i) => (
        <g key={i}>
          <Label text={lab} x={x} y={860} at={k(w) + 0.3} size={46} />
          {i > 0 && <Arrow from={[steps[i - 1][1] + 120, 470]} to={[x - 120, 470]} at={k(w) - 0.3} dur={0.35} bend={-0.15} />}
        </g>
      ))}
      <Label text="surgeons" x={1620} y={360} at={k('surgeons')} size={46} />
    </g>
  );
};

const S35 = () => {
  const {k} = useScene();
  return (
    <g>
      <Fade at={0} dur={0.01}>
        <g opacity={0.3}>
          <Icon def={I.tent} x={330} y={820} s={0.5} mode="instant" />
          <Icon def={I.ambulance} x={960} y={840} s={0.5} mode="instant" />
          <Icon def={I.hospital} x={1590} y={820} s={0.5} mode="instant" />
        </g>
      </Fade>
      <Clock x={960} y={380} r={150} at={0.2} speed={1.2} red />
      <MText text="speed" x={420} y={300} at={k('speed')} size={80} font="title" anchor="middle" underline="red" />
      <Label text="fast to a surgeon = better chance" x={960} y={620} at={k('chance')} size={50} />
      <Arrow from={[460, 720]} to={[800, 720]} at={k('chain')} bend={0} />
      <Arrow from={[1120, 720]} to={[1460, 720]} at={k('chain') + 0.2} bend={0} />
      <MText text="every minute counts" x={960} y={1010} at={k('minutes')} size={60} font="title" anchor="middle" color={C.red} />
    </g>
  );
};

const S36 = () => {
  const {k, t} = useScene();
  return (
    <WorldMap extent={ATL} box={[80, 160, 1760, 860]} at={0} dur={0.9}>
      {(proj) => {
        const back1: [number, number][] = [[-0.5, 49.4], [-1.5, 50.2], [-3, 50.6]];
        const home: [number, number][] = [[-5, 51], [-30, 52], [-55, 46], [-74, 40.7]];
        const f = easeInOut(prog(t, k('home'), 2.2));
        const p = along(proj, home, f);
        const fr = proj([0.5, 49]) as [number, number];
        const en = proj([-2, 52.3]) as [number, number];
        const us = proj([-80, 40]) as [number, number];
        return (
          <g>
            <Fig x={fr[0] + 30} y={fr[1] + 60} s={0.45} pose="sit" bandage mode="pop" at={0.2} />
            <Route proj={proj} pts={back1} at={k('england')} dur={0.7} color={C.blue} w={8} />
            <Label text="England" x={en[0] - 30} y={en[1] - 50} at={k('england')} size={46} />
            <Route proj={proj} pts={home} at={k('home')} dur={2.2} color={C.blue} w={7} dash />
            {t > k('home') && <Icon def={I.plane} x={p[0]} y={p[1] - 20} s={0.3} mode="instant" flip />}
            <Icon def={I.house} x={us[0]} y={us[1] - 40} s={0.5} mode="pop" at={k('home') + 1.8} />
            {[0.2, 0.45, 0.7].map((ff, i) => {
              const q = along(proj, home, ff);
              return <Fig key={i} x={q[0]} y={q[1] + 110} s={0.32} color="#bdbdbd" helmet={false} mode="pop" at={k('step') + i * 0.25} />;
            })}
            <Label text="a different group at every step" x={960} y={1000} at={k('different')} size={50} underline="red" />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S37 = () => {
  const {k} = useScene();
  const jobs: [string, string][] = [
    ['farmers', 'farmers'],
    ['factory', 'factory'],
    ['shipbuilders', 'shipbuilders'],
    ['sailors', 'sailors'],
    ['truck', 'drivers'],
    ['mail', 'mail clerks'],
    ['medics', 'medics'],
    ['surgeons', 'surgeons'],
  ];
  return (
    <g>
      <Hedge instant at={0} y={900} />
      <Fig x={1720} y={890} s={1.3} mode="instant" rifle />
      {jobs.map(([w, lab], i) => {
        const x = 1530 - i * 175;
        return (
          <g key={i}>
            <Fig x={x} y={890} s={1.05} color="#bdbdbd" helmet={false} mode="pop" at={k(w)} />
            <MText text={lab} x={x} y={560 - (i % 2) * 60} at={k(w)} size={40} anchor="middle" rot={-12} />
          </g>
        );
      })}
      <Label text="who have we met?" x={500} y={250} at={0.2} size={56} />
      <Q x={110} y={700} at={k('many')} size={190} />
    </g>
  );
};

const S38 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 6: The Slice" />
      <Icon def={I.bread} x={960} y={480} s={1.6} at={k('slice') - 0.3} />
      <XMark x={960} y={480} r={130} at={k('bread')} />
      <MText text="DIVISION SLICE" x={960} y={860} at={k('division')} size={110} font="title" anchor="middle" underline="double" />
    </g>
  );
};

const DivBlock: React.FC<{x: number; y: number; s?: number; at: number; red?: number; mode?: 'pop' | 'instant'; redAt?: number}> = ({x, y, s = 1, at, red = 0, mode = 'pop', redAt = 0}) => {
  const {t} = useScene();
  if (t < at) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {Array.from({length: 14}).map((_, i) => {
        const c = i % 7;
        const r = Math.floor(i / 7);
        const st = at + (mode === 'pop' ? i * 0.06 : 0);
        const sc = mode === 'pop' ? pop(t, st, 0.35) : 1;
        const rx = -350 + c * 100;
        const ry = -100 + r * 110;
        let fillW = 0;
        if (t > redAt && red > 0) {
          const rr = easeInOut(prog(t, redAt, 1.2)) * red;
          fillW = Math.max(0, Math.min(1, rr - i));
        }
        if (t < st) return null;
        return (
          <g key={i} transform={`translate(${rx + 40},${ry + 45}) scale(${sc}) translate(-40,-45)`}>
            <rect x={0} y={0} width={80} height={90} fill="#e2ddd0" stroke={C.ink} strokeWidth={5} rx={6} />
            {fillW > 0 && <rect x={4} y={4} width={72 * fillW} height={82} fill={C.red} rx={4} />}
            <g transform="translate(40,82) scale(0.33) translate(-50,-205)">
              <circle cx={50} cy={38} r={19} fill="none" stroke={C.ink} strokeWidth={8} />
              <path d="M50,57 L50,138 M50,80 L28,118 M50,80 L72,118 M50,138 L32,205 M50,138 L68,205" stroke={C.ink} strokeWidth={8} fill="none" />
            </g>
          </g>
        );
      })}
    </g>
  );
};

const S39 = () => {
  const {k} = useScene();
  return (
    <g>
      <Label text="1944 U.S. infantry division" x={960} y={220} at={k('infantry')} size={56} underline="red" />
      <DivBlock x={960} y={500} at={k('division')} />
      <Label text="each box = 1,000 men" x={1550} y={700} at={k('unit')} size={42} />
      <Burst x={960} y={860} rx={330} ry={90} at={k('fourteen') + 0.4} />
      <BigText text="~14,000 men" x={960} y={900} at={k('fourteen')} size={110} />
      <Label text="on paper" x={1450} y={1000} at={k('paper')} size={46} />
    </g>
  );
};

const SupportBoxes: React.FC<{at: number[]; instant?: boolean}> = ({at, instant}) => {
  const boxes: [number, number, keyof typeof I][] = [
    [300, 260, 'truck'],
    [1620, 260, 'crate'],
    [300, 820, 'hospital'],
    [1620, 820, 'wrench'],
    [960, 950, 'cannon'],
  ];
  return (
    <g>
      {boxes.map(([x, y, ic], i) => (
        <g key={i}>
          <Stroke d={roughRect(x - 170, y - 110, 340, 220, 4, i + 2)} at={at[i]} dur={0.6} w={4} color="#888" instant={instant} />
          <Icon def={I[ic]} x={x} y={y} s={0.5} mode={instant ? 'instant' : 'pop'} at={at[i] + 0.3} opacity={0.75} />
        </g>
      ))}
    </g>
  );
};

const S40 = () => {
  const {k} = useScene();
  return (
    <g>
      <DivBlock x={960} y={540} s={0.85} at={0} mode="instant" />
      <MText text="the division" x={960} y={400} at={0.2} size={50} anchor="middle" />
      <SupportBoxes at={[k('noticed'), k('needed'), k('behind'), k('theater'), k('moving')]} />
      <Label text="+ many more men behind it" x={960} y={170} at={k('many')} size={54} color={C.red} />
    </g>
  );
};

const S41 = () => {
  const {k} = useScene();
  const wedge = 'M960,60 L120,1040 Q960,1120 1800,1040 Z';
  return (
    <g>
      <DivBlock x={960} y={600} s={0.6} at={0} mode="instant" />
      <SupportBoxes at={[0, 0, 0, 0, 0]} instant />
      <Scribble d={wedge} box={[100, 50, 1720, 1060]} color={C.yellow} at={k('slice')} dur={1.0} opacity={0.35} sp={30} w={20} />
      <Stroke d={wedge} at={k('slice') - 0.2} dur={1.0} color={C.red} w={9} />
      <Label text="division + its share of everyone supporting it" x={470} y={200} at={k('supporting')} size={44} />
      <Q x={960} y={380} at={k('bigger', 2)} size={180} />
      <Label text="hold that thought" x={1520} y={180} at={k('hold')} size={52} rot={-4} underline="red" />
    </g>
  );
};

const S42 = () => {
  const {k} = useScene();
  return (
    <g>
      <Title text="Quest 7: The Shortage" />
      <Label text="biggest army in U.S. history" x={960} y={260} at={k('biggest')} size={52} />
      <Burst x={960} y={400} rx={430} ry={115} at={k('eight') + 1.3} />
      <Counter x={960} y={450} at={k('eight')} to={8000000} prefix="~" size={140} dur={1.2} step={100000} />
      <Label text="in the Army alone" x={960} y={540} at={k('alone')} size={46} />
      <Crowd x={90} y={720} cols={30} rows={4} gap={60} rowGap={95} s={0.32} at={k('history')} stagger={0.012} />
    </g>
  );
};

const S43 = () => {
  const {k} = useScene();
  const jobs: [keyof typeof I | 'fig', number, string, string][] = [
    ['truck', 330, 'drivers', 'drivers'],
    ['pot', 750, 'cooks', 'cooks'],
    ['typewriter', 1170, 'clerks', 'clerks'],
    ['fig', 1590, 'riflemen', 'RIFLEMEN'],
  ];
  return (
    <g>
      <Label text="Europe, late 1944: running out of…" x={960} y={200} at={0.2} size={54} />
      {jobs.map(([ic, x, w, lab], i) => (
        <g key={i}>
          {ic === 'fig' ? <Fig x={x} y={640} s={1.3} rifle at={k(w) - 0.2} draw={0.6} /> : <Icon def={I[ic]} x={x} y={500} s={0.7} mode="pop" at={k(w) - 0.2} />}
          <Label text={lab} x={x} y={740} at={k(w)} size={i === 3 ? 60 : 50} underline={i === 3 ? 'red' : null} color={i === 3 ? C.red : C.ink} />
          {i < 3 ? <Check x={x} y={870} at={k(w) + 0.15} /> : <Stroke d={roughRect(x - 50, 820, 100, 100, 3, 9)} at={k(w) + 0.15} dur={0.4} color={C.red} w={9} />}
        </g>
      ))}
    </g>
  );
};

const S44 = () => {
  const {k, t} = useScene();
  const g1 = easeInOut(prog(t, k('rifle'), 1.0));
  const g2 = easeInOut(prog(t, k('months'), 3.2));
  return (
    <g>
      <Label text="rifle companies: men lost faster than replaced" x={960} y={200} at={k('losing')} size={50} />
      <Stroke d="M300,330 L300,880" at={0.1} dur={0.4} w={6} />
      {t > k('rifle') && <rect x={300} y={400} width={900 * g1} height={130} fill={C.green} opacity={0.75} stroke={C.ink} strokeWidth={5} />}
      <Label text="full strength on day one" x={760} y={620} at={k('rifle') + 0.6} size={44} />
      {t > k('months') && <rect x={300} y={680} width={1350 * g2} height={130} fill={C.red} opacity={0.75} stroke={C.ink} strokeWidth={5} />}
      <Label text="total losses over months" x={760} y={900} at={k('months') + 0.6} size={44} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} def={I.helmet} x={420 + i * 230} y={745} s={0.35} mode="pop" at={k('months') + 0.5 + i * 0.45} />
      ))}
      <Stroke d="M1200,360 L1200,940" at={k('first')} dur={0.4} w={5} dash="14 12" />
      <Label text="more than they started with" x={1450} y={1010} at={k('total')} size={46} color={C.red} />
    </g>
  );
};

const S45 = () => {
  const {k, t} = useScene();
  const walk = easeInOut(prog(t, k('sent'), 2.0));
  const icons: [keyof typeof I, string][] = [
    ['aagun', 'anti'],
    ['typewriter', 'clerks'],
    ['plane', 'air'],
  ];
  return (
    <g>
      <Icon def={I.door} x={960} y={620} s={1.4} at={0.1} />
      <MText text="INFANTRY" x={960} y={360} at={0.3} size={56} font="title" anchor="middle" underline="red" />
      {icons.map(([ic, w], i) => {
        const y = 420 + i * 200;
        const x = 250 + walk * 560;
        return (
          <g key={i} opacity={1 - walk}>
            <Icon def={I[ic]} x={x - 100} y={y} s={0.4} mode="pop" at={k(w)} />
            <Fig x={x + 60} y={y + 90} s={0.7} helmet={false} color={C.khaki} pose="walk" mode="pop" at={k(w) + 0.15} />
          </g>
        );
      })}
      {[0, 1, 2].map((i) => (
        <Fig key={i} x={1380 + i * 160} y={810} s={1.1} rifle mode="pop" at={k('handed') + i * 0.2} />
      ))}
      <Label text="handed rifles" x={1540} y={420} at={k('rifles')} size={52} />
    </g>
  );
};

const S46 = () => {
  const {k, t} = useScene();
  const strip = 1 - easeInOut(prog(t, k('stripes'), 1.0));
  return (
    <g>
      <Icon def={I.calendar} x={330} y={360} s={1.0} at={k('december') - 0.2} />
      <MText text="DEC 26" x={330} y={415} at={k('december')} size={44} font="title" anchor="middle" />
      <MText text="1944" x={330} y={462} at={k('forty')} size={34} font="title" anchor="middle" />
      <MText text="volunteers wanted" x={1100} y={220} at={k('volunteer')} size={60} font="title" anchor="middle" underline="red" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Fig key={i} x={760 + i * 130} y={700} s={0.8} color="#59672f" mode="pop" at={k('thousands') + i * 0.15} />
      ))}
      <Fig x={330} y={950} s={1.4} color="#59672f" at={k('sergeants') - 0.3} stripes={strip} draw={0.6} />
      <Label text="sergeants gave up their stripes" x={1000} y={900} at={k('stripes')} size={50} />
      <Label text="for the chance to fight" x={1000} y={980} at={k('chance')} size={50} color={C.red} />
    </g>
  );
};

const S47 = () => {
  const {k} = useScene();
  return (
    <g>
      <Burst x={420} y={350} rx={280} ry={95} at={k('two') + 1.3} />
      <Counter x={420} y={390} at={k('two')} to={2200} prefix="~" size={120} dur={1.5} />
      <Label text="went to the front" x={420} y={470} at={k('front')} size={46} />
      {Array.from({length: 37}).map((_, i) => (
        <Pop key={i} x={1000 + (i % 10) * 85} y={240 + Math.floor(i / 10) * 85} at={k('thirty') + i * 0.025}>
          <rect x={1000 + (i % 10) * 85 - 32} y={240 + Math.floor(i / 10) * 85 - 32} width={64} height={64} rx={8} fill={C.olive} stroke={C.ink} strokeWidth={4} />
        </Pop>
      ))}
      <Label text="37 platoons" x={1380} y={620} at={k('platoons')} size={52} />
      <Fade at={k('real')} dur={0.5}>
        <BigText text="8,000,000" x={700} y={900} at={k('eight') - 0.1} size={110} />
        <MText text="out of riflemen?" x={1400} y={900} at={k('riflemen') - 0.3} size={64} font="title" anchor="middle" color={C.red} />
      </Fade>
    </g>
  );
};

const S48 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="The Answer" x={90} y={130} at={0.1} size={72} font="title" underline="double" />
      <Pop x={460} y={560} at={k('company')}>
        <g>
          <rect x={300} y={420} width={320} height={280} rx={14} fill={C.olive} stroke={C.ink} strokeWidth={6} opacity={0.9} />
          <text x={460} y={600} fontFamily='"Permanent Marker"' fontSize={110} textAnchor="middle" fill={C.board}>193</text>
        </g>
      </Pop>
      <Label text="1 rifle company" x={460} y={780} at={k('company', 2)} size={52} />
      <Label text="≈ 193 men" x={460} y={850} at={k('ninety')} size={52} />
      {Array.from({length: 27}).map((_, i) => (
        <Pop key={i} x={1000 + (i % 9) * 95} y={380 + Math.floor(i / 9) * 110} at={k('twenty') + i * 0.04}>
          <rect x={1000 + (i % 9) * 95 - 38} y={380 + Math.floor(i / 9) * 110 - 42} width={76} height={84} rx={8} fill={C.olive} stroke={C.ink} strokeWidth={4} />
        </Pop>
      ))}
      <Label text="27 companies per division" x={1380} y={760} at={k('seven') + 0.2} size={52} underline="red" />
    </g>
  );
};

const S49 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="27 × 193 = 5,211" x={960} y={220} at={k('twenty')} size={100} font="title" anchor="middle" cps={9} />
      <DivBlock x={960} y={560} at={k('five') - 0.3} red={5.2} redAt={k('five')} />
      <Label text="out of ~14,000" x={1500} y={330} at={k('fourteen')} size={52} />
      <Label text="in rifle companies" x={600} y={850} at={k('most') - 0.3} size={50} color={C.red} underline="red" />
      <Label text="everyone else in the division" x={1350} y={850} at={k('not')} size={50} />
      <MText text="most men were NOT riflemen" x={960} y={1000} at={k('companies')} size={56} font="title" anchor="middle" />
    </g>
  );
};

const S50 = () => {
  const {k, t} = useScene();
  const z = easeInOut(prog(t, k('zoom'), 1.2));
  const wedge = 'M960,140 L360,860 Q960,930 1560,860 Z';
  return (
    <g>
      <DivBlock x={960} y={520 + z * 130} s={0.9 - z * 0.55} at={0} mode="instant" red={5.2} redAt={-5} />
      <Stroke d={wedge} at={k('europe')} dur={1.0} color={C.red} w={9} />
      <Scribble d={wedge} box={[350, 130, 1220, 800]} color={C.yellow} at={k('europe') + 0.4} dur={1.0} opacity={0.3} sp={30} w={20} />
      <Icon def={I.calendar} x={250} y={330} s={1.0} mode="pop" at={k('june')} />
      <MText text="JUNE" x={250} y={375} at={k('june') + 0.2} size={40} font="title" anchor="middle" />
      <MText text="1945" x={250} y={420} at={k('forty') + 0.2} size={34} font="title" anchor="middle" />
      <Label text="Europe" x={1650} y={300} at={k('europe')} size={56} underline="red" />
      <Burst x={960} y={940} rx={320} ry={80} at={k('thirty') + 1.4} />
      <Counter x={960} y={980} at={k('thirty')} to={35480} size={120} dur={1.6} />
      <Label text="men per division slice" x={1560} y={1010} at={k('men')} size={42} />
    </g>
  );
};

const RowOfMen: React.FC<{n: number; at: number; y?: number; s?: number; gap?: number; xRed?: number; stagger?: number; instant?: boolean}> = ({n, at, y = 900, s = 0.9, gap = 140, xRed = 1500, stagger = 0.12, instant}) => (
  <g>
    <Fig x={xRed} y={y} s={s * 1.1} color={C.red} mode={instant ? 'instant' : 'pop'} at={at} rifle />
    {Array.from({length: n}).map((_, i) => (
      <Fig key={i} x={xRed - (i + 1) * gap} y={y} s={s} color="#bdbdbd" helmet={false} mode={instant ? 'instant' : 'pop'} at={at + 0.2 + i * stagger} />
    ))}
  </g>
);

const S51 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="35,480 ÷ 5,211 = 6.8" x={960} y={200} at={k('divide')} size={84} font="title" anchor="middle" cps={10} />
      <Burst x={960} y={450} rx={330} ry={140} at={k('seven') + 0.3} />
      <BigText text="1 : 7" x={960} y={520} at={k('seven')} size={220} eq />
      <Label text="almost" x={620} y={360} at={k('almost')} size={52} rot={-8} color={C.red} />
      <RowOfMen n={6} at={k('seven', 2)} y={940} />
      <Label text="in Europe, per rifleman" x={1500} y={700} at={k('europe')} size={46} />
    </g>
  );
};

const S52 = () => {
  const {k, t} = useScene();
  const jobs: [keyof typeof I, string][] = [
    ['truck', 'drivers'],
    ['wrench', 'engineers'],
    ['cannon', 'gunners'],
    ['pot', 'cooks'],
    ['typewriter', 'clerks'],
    ['redcross', 'medics'],
  ];
  const step = easeInOut(prog(t, k('walks'), 1.4));
  return (
    <g>
      <Hedge instant at={0} y={950} />
      <g transform={`translate(${step * 220},0)`}>
        <Fig x={1500} y={940} s={0.99} color={C.red} mode="instant" rifle pose={step > 0 && step < 1 ? 'walk' : 'stand'} />
      </g>
      {jobs.map(([ic, w], i) => {
        const x = 1500 - (i + 1) * 200;
        return (
          <g key={i}>
            <Fig x={x} y={940} s={0.9} color="#bdbdbd" helmet={false} mode="instant" />
            <Icon def={I[ic]} x={x} y={560} s={ic === 'redcross' ? 0.7 : 0.38} mode="pop" at={k(w)} />
            <MText text={w} x={x} y={470} at={k(w)} size={36} anchor="middle" />
          </g>
        );
      })}
      <Label text="all needed · all working" x={700} y={250} at={k('needed')} size={56} />
      <MText text="only ONE crosses the field" x={1200} y={1050} at={k('walks') - 0.2} size={52} font="title" anchor="middle" color={C.red} />
    </g>
  );
};

const S53 = () => {
  const {k} = useScene();
  return (
    <WorldMap extent={ATL} box={[80, 120, 1760, 760]} at={0.1} dur={1.0} fills={[{name: 'United States of America', color: C.blue, at: k('home')}]}>
      {(proj) => {
        const atl = proj([-35, 50]) as [number, number];
        const us = proj([-95, 37]) as [number, number];
        return (
          <g>
            <Label text="not done yet" x={1600} y={180} at={0.2} size={50} />
            <Icon def={I.plane} x={atl[0]} y={atl[1]} s={0.6} mode="pop" at={k('air')} />
            <Label text="air force" x={atl[0]} y={atl[1] + 100} at={k('air') + 0.2} size={44} />
            <Icon def={I.tent} x={us[0] - 60} y={us[1]} s={0.35} mode="pop" at={k('training')} />
            <Icon def={I.tent} x={us[0] + 60} y={us[1] + 20} s={0.35} mode="pop" at={k('camps')} />
            <Label text="training camps" x={us[0]} y={us[1] - 90} at={k('camps') + 0.2} size={44} />
            <Label text="everyone in uniform back home" x={us[0] + 120} y={us[1] + 150} at={k('home')} size={42} />
            <MText text="8,270,000 ÷ 89 divisions ≈ 93,000" x={960} y={970} at={k('divide')} size={68} font="title" anchor="middle" cps={14} />
            <Label text="over 90,000 men per division" x={960} y={1050} at={k('ninety')} size={46} color={C.red} />
          </g>
        );
      }}
    </WorldMap>
  );
};

const S54 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="93,000 ÷ 5,211 ≈ 18" x={960} y={170} at={k('divide')} size={80} font="title" anchor="middle" cps={10} />
      <Burst x={960} y={380} rx={360} ry={140} at={k('eighteen') + 0.3} />
      <BigText text="1 : 18" x={960} y={450} at={k('eighteen')} size={220} eq />
      <Fig x={1780} y={900} s={0.95} color={C.red} mode="pop" at={k('soldier')} rifle />
      {Array.from({length: 17}).map((_, i) => (
        <Fig key={i} x={1680 - i * 92} y={900} s={0.62} color="#bdbdbd" helmet={false} mode="pop" at={k('seventeen') + i * 0.07} />
      ))}
      <Label text="17 others in uniform behind him" x={850} y={640} at={k('behind')} size={50} underline="red" />
      <Fade at={k('farmer') - 0.2} dur={0.8}>
        <g opacity={0.45}>
          <Icon def={I.factory} x={260} y={1000} s={0.4} mode="instant" />
          <Icon def={I.wheat} x={480} y={1010} s={0.35} mode="instant" />
        </g>
      </Fade>
      <Label text="+ farmers & factory workers" x={1150} y={1040} at={k('factory')} size={44} />
    </g>
  );
};

const S55 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="not waste" x={90} y={130} at={k('waste')} size={64} font="title" underline="red" />
      <Icon def={I.ration} x={480} y={480} s={1} mode="pop" at={k('food') - 0.1} />
      <Check x={480} y={680} at={k('food') + 0.2} s={1.3} />
      <Icon def={I.crate} x={960} y={480} s={1.1} mode="pop" at={k('ammunition') - 0.1} />
      <MText text="AMMO" x={960} y={490} at={k('ammunition')} size={36} font="title" anchor="middle" />
      <Check x={960} y={680} at={k('ammunition') + 0.2} s={1.3} />
      <Icon def={I.envelope} x={1440} y={480} s={0.9} mode="pop" at={k('letters') - 0.1} />
      <Check x={1440} y={680} at={k('letters') + 0.2} s={1.3} />
      <MText text="…but it had a price" x={960} y={930} at={k('price') - 0.3} size={76} font="title" anchor="middle" color={C.red} />
    </g>
  );
};

const S56 = () => {
  const {k, t} = useScene();
  const red = [0, 1, 2];
  return (
    <g>
      <Crowd x={110} y={420} cols={12} rows={4} gap={58} rowGap={100} s={0.3} at={0.1} stagger={0.005} highlight={[0, 1, 13, 24]} />
      <Label text="infantry: a small part of the Army" x={460} y={260} at={k('small')} size={46} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Icon def={I.helmet} x={1100 + i * 190} y={480} s={0.75} mode="pop" at={k('four') + i * 0.12} />
          {red.includes(i) && t > k('three') + i * 0.2 && <Icon def={I.helmet} x={1100 + i * 190} y={480} s={0.75} mode="pop" at={k('three') + i * 0.2} override={{0: C.red, 1: '#b3261e'}} />}
        </g>
      ))}
      <MText text="3 of every 4" x={1385} y={680} at={k('three')} size={76} font="title" anchor="middle" color={C.red} />
      <Label text="Army ground-combat deaths were infantrymen" x={1385} y={760} at={k('infantrymen', 2) - 0.3} size={40} />
      <Icon def={I.spear} x={960} y={950} s={2.2} at={k('spear') - 0.3} draw={0.9} />
      <Label text="the tip of the spear" x={1500} y={1050} at={k('tip')} size={46} />
    </g>
  );
};

const S57 = () => {
  const {k, t} = useScene();
  const walk = easeInOut(prog(t, k('cross'), 2.5));
  const out = k('carrying');
  return (
    <g>
      <Hedge instant at={0} />
      <Fade at={0} dur={0.01} out={out} outDur={2.2}>
        {Array.from({length: 17}).map((_, i) => (
          <Fig key={i} x={1060 - i * 62} y={830} s={0.75} color="#bdbdbd" helmet={false} mode="pop" at={k('line') + i * 0.05} />
        ))}
      </Fade>
      <g transform={`translate(${walk * 420},0)`}>
        <Fig x={1200} y={830} s={1.6} mode="instant" rifle pose={walk > 0 && walk < 1 ? 'walk' : 'stand'} />
      </g>
      <Label text="remember the line" x={600} y={330} at={k('remember')} size={60} underline="red" />
      <BigText text="17" x={550} y={560} at={k('seventeen')} size={150} color={C.ink} />
      <Label text="working for one" x={850} y={540} at={k('working')} size={50} />
      <Label text="and one man, carrying the war" x={1250} y={250} at={k('carrying')} size={52} color={C.red} />
    </g>
  );
};

const S58 = () => {
  const {k} = useScene();
  return (
    <g>
      <MText text="Germany did it differently" x={90} y={130} at={0.2} size={60} font="title" underline="red" />
      <Icon def={I.tank} x={1350} y={520} s={1.2} at={0.4} />
      <Icon def={I.balkenkreuz} x={1260} y={555} s={0.38} mode="pop" at={1.2} />
      <Label text="GERMANY" x={1350} y={740} at={1.4} size={54} />
      <Icon def={I.horse} x={560} y={560} s={1.4} at={k('horses') - 0.4} />
      <MText text="hundreds of thousands of horses" x={560} y={820} at={k('hundreds')} size={52} font="title" anchor="middle" />
      <Label text="invading the USSR, 1941" x={560} y={300} at={k('soviet')} size={44} />
      <Q x={960} y={540} at={k('why')} size={190} />
      <MText text="NEXT VIDEO" x={960} y={980} at={k('next')} size={72} font="title" anchor="middle" underline="double" />
    </g>
  );
};

// transitions: wipe at block changes, fade inside a block
export const SCENES: SceneDef[] = [
  {C: S01, tr: 'cut'}, {C: S02, tr: 'fade'},
  {C: S03, tr: 'wipe'}, {C: S04, tr: 'fade'}, {C: S05, tr: 'fade'}, {C: S06, tr: 'fade'}, {C: S07, tr: 'fade'}, {C: S08, tr: 'fade'}, {C: S09, tr: 'fade'},
  {C: S10, tr: 'wipe'}, {C: S11, tr: 'fade'}, {C: S12, tr: 'fade'}, {C: S13, tr: 'fade'}, {C: S14, tr: 'fade'}, {C: S15, tr: 'fade'}, {C: S16, tr: 'fade'},
  {C: S17, tr: 'wipe'}, {C: S18, tr: 'fade'}, {C: S19, tr: 'fade'}, {C: S20, tr: 'fade'}, {C: S21, tr: 'fade'}, {C: S22, tr: 'fade'}, {C: S23, tr: 'fade'}, {C: S24, tr: 'fade'}, {C: S25, tr: 'fade'},
  {C: S26, tr: 'wipe'}, {C: S27, tr: 'fade'}, {C: S28, tr: 'fade'}, {C: S29, tr: 'fade'}, {C: S30, tr: 'fade'}, {C: S31, tr: 'fade'},
  {C: S32, tr: 'wipe'}, {C: S33, tr: 'fade'}, {C: S34, tr: 'fade'}, {C: S35, tr: 'fade'}, {C: S36, tr: 'fade'}, {C: S37, tr: 'fade'},
  {C: S38, tr: 'wipe'}, {C: S39, tr: 'fade'}, {C: S40, tr: 'fade'}, {C: S41, tr: 'fade'},
  {C: S42, tr: 'wipe'}, {C: S43, tr: 'fade'}, {C: S44, tr: 'fade'}, {C: S45, tr: 'fade'}, {C: S46, tr: 'fade'}, {C: S47, tr: 'fade'},
  {C: S48, tr: 'wipe'}, {C: S49, tr: 'fade'}, {C: S50, tr: 'fade'}, {C: S51, tr: 'fade'}, {C: S52, tr: 'fade'}, {C: S53, tr: 'fade'}, {C: S54, tr: 'fade'}, {C: S55, tr: 'fade'}, {C: S56, tr: 'fade'}, {C: S57, tr: 'fade'},
  {C: S58, tr: 'wipe'},
];
