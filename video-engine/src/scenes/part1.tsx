import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Person} from '../components/people';
import {Arrow, Burst, Counter, Fade, Label, Line, MText, Pop, QMark, RedX, Title} from '../components/primitives';
import {Campfire, Chocolate, Cigarettes, CrateGrid, Foxhole, Gauge, Gum, Hedgerow, KBox, Pot, Potato, ToiletRoll, Truck} from '../components/props';
import {TeamBoard} from '../components/hud';
import {C} from '../lib/theme';
import {useCue} from '../lib/timing';

const Hero: React.FC<{at: number; look?: number; expr?: 'worried' | 'neutral' | 'determined'}> = ({at, look = 0, expr = 'worried'}) => (
  <g>
    <Hedgerow x={960} y={700} at={at - 30} width={1840} />
    <Foxhole x={960} y={960} at={at - 10} s={1.7} />
    <Person x={960} y={1000} at={at} pose="bust" hold="rifle" expr={expr} s={2.1} look={look} />
  </g>
);

// 01 — Hook: the rifleman in the foxhole
export const S01: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <MText text="JULY 1944" x={70} y={112} at={cue('July')} size={70} underline cps={14} />
      <Label text="Normandy" x={76} y={190} at={cue('Normandy')} size={60} anchor="start" />
      <Hero at={cue('rifleman')} />
      <Arrow from={[1800, 330]} to={[1110, 520]} at={cue('tip')} dur={14} w={12} head={38} />
      <MText text="TIP OF THE SPEAR" x={1480} y={250} at={cue('spear') - 2} size={64} color={C.red} anchor="middle" cps={34} />
    </g>
  );
};

// 02 — An army he will never meet; how many men?
export const S02: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const slide = Math.min(1, Math.max(0, (f - cue('Behind')) / 18));
  return (
    <g>
      <g transform={`translate(${-620 * slide},0)`}>
        <Hero at={-200} look={-10} />
        <Line pts={[[1200, 900], [1600, 905], [2000, 898], [2400, 904], [2600, 900]]} at={cue('army') - 4} dur={22} color={C.grey} w={8} />
        <QMark x={1700} y={880} at={cue('never')} size={160} />
        <QMark x={2050} y={880} at={cue('meet') - 2} size={160} />
        <QMark x={2400} y={880} at={cue('meet') + 4} size={160} />
      </g>
      <MText text="HOW MANY MEN?" x={1280} y={300} at={cue('how')} size={120} anchor="middle" underline cps={22} />
      <Burst x={1280} y={262} at={cue('fighting')} rx={500} ry={130} />
    </g>
  );
};

// 03 — The game: 7 missions
export const S03: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <MText text="THE GAME" x={960} y={260} at={cue('game') - 6} size={130} anchor="middle" underline cps={14} />
      <Person x={430} y={960} at={cue('keep')} expr="determined" hold="rifle" s={1.65} />
      <Label text="keep him in the fight" x={430} y={1040} at={cue('fight')} size={52} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Pop key={i} at={cue('mission') + i * 3} x={900 + i * 135} y={520}>
          <rect x={845 + i * 135} y={465} width={110} height={110} rx={10} fill={C.white} stroke={C.ink} strokeWidth={6} />
          <text x={900 + i * 135} y={552} fontFamily="PermanentMarker" fontSize={72} textAnchor="middle" fill={C.ink}>
            {i + 1}
          </text>
        </Pop>
      ))}
      <Label text="7 missions" x={1305} y={680} at={cue('solve')} size={66} />
      <RedX x={1150} y={850} at={cue('fails')} r={55} />
      <Label text="fail one = he's out" x={1460} y={870} at={cue('out')} size={60} color={C.red} />
      <MText text="Mission 1: Food" x={70} y={112} at={cue('feed')} size={62} underline />
    </g>
  );
};

// 04 — Can't cook in a hole -> K-ration
export const S04: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 1: Food" at={-200} />
      <Fade out={cue('So') - 2} outDur={10}>
        <Person x={560} y={900} at={0} hold="shovel" expr="tired" s={1.7} />
        <Label text="digs · carries · marches" x={560} y={990} at={cue('marches') - 4} size={56} />
        <Campfire x={1250} y={700} at={cue('cook') - 4} s={2} />
        <RedX x={1250} y={640} at={cue('hole')} r={110} />
      </Fade>
      <MText text="K-RATION" x={960} y={290} at={cue('K-ration')} size={120} anchor="middle" underline />
      <KBox x={480} y={640} at={cue('breakfast')} label="BREAKFAST" s={2} />
      <KBox x={960} y={640} at={cue('dinner')} label="DINNER" s={2} />
      <KBox x={1440} y={640} at={cue('supper')} label="SUPPER" s={2} />
      <Label text="= one day" x={960} y={890} at={cue('supper') + 8} size={72} />
    </g>
  );
};

// 05 — calories, cigarettes, toilet paper, waxed box
export const S05: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 1: Food" at={-200} />
      <Counter x={760} y={380} at={cue('three')} to={3000} prefix="~" suffix=" kcal" dur={26} size={150} burst />
      <Arrow from={[330, 560]} to={[470, 450]} at={cue('enough') - 6} label="not enough?" labelPos={[300, 620]} labelSize={56} />
      <KBox x={360} y={790} at={cue('meal') - 6} label="SUPPER" s={1.8} />
      {[0, 1, 2, 3].map((i) => (
        <Cigarettes key={i} x={640 + i * 85} y={790} at={cue('cigarettes') + i * 3} s={1.3} />
      ))}
      <Label text="x4 per meal" x={768} y={930} at={cue('cigarettes') + 10} size={56} />
      <Gum x={1010} y={770} at={cue('gum')} s={1.4} />
      <ToiletRoll x={1190} y={760} at={cue('toilet')} s={1.4} />
      <Pop at={cue('waxed')} x={1620} y={820}>
        <rect x={1520} y={800} width={200} height={120} fill={C.khaki} stroke={C.ink} strokeWidth={6} />
        <text x={1620} y={880} fontFamily="CaveatBrush" fontSize={52} textAnchor="middle">
          waxed
        </text>
      </Pop>
      <Campfire x={1620} y={790} at={cue('burned')} s={1.2} />
      <Pop at={cue('coffee') - 2} x={1620} y={620}>
        <rect x={1565} y={600} width={110} height={80} rx={10} fill={C.steel} stroke={C.ink} strokeWidth={6} />
        <path d="M1595,585 q12,-24 0,-48 M1640,585 q12,-24 0,-48" stroke={C.grey} strokeWidth={6} fill="none" />
      </Pop>
      <Label text="hot coffee!" x={1620} y={500} at={cue('coffee') + 4} size={60} />
    </g>
  );
};

// 06 — sick of the boxes; chocolate = boiled potato
export const S06: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 1: Food" at={-200} />
      <Person x={330} y={960} at={cue('weeks') - 4} expr="sick" hold="none" s={1.6} />
      <Label text="weeks of the same..." x={330} y={1040} at={cue('sick')} size={50} />
      <Chocolate x={860} y={560} at={cue('chocolate')} s={1.8} />
      <Label text="emergency bar" x={860} y={720} at={cue('chocolate') + 8} size={58} />
      <MText text="=" x={1190} y={610} at={cue('taste')} size={170} anchor="middle" />
      <Potato x={1520} y={560} at={cue('potato') - 4} s={1.8} />
      <Label text="boiled potato" x={1520} y={720} at={cue('potato') + 4} size={58} />
      <Arrow from={[1190, 900]} to={[1190, 700]} at={cue('purpose') - 3} label="ON PURPOSE" labelPos={[1190, 970]} labelSize={60} />
      <MText text="no snacking!" x={960} y={300} at={cue('nobody') - 4} size={84} anchor="middle" color={C.red} underline={C.ink} cps={40} />
    </g>
  );
};

// 07 — one box vs millions
export const S07: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 1: Food" at={-200} />
      <Fade out={cue('Millions') - 2}>
        <KBox x={960} y={540} at={cue('One') - 4} label="1 BOX" s={2.2} />
        <Label text="weighs almost nothing" x={960} y={760} at={cue('nothing') - 6} size={64} />
      </Fade>
      <CrateGrid x={150} y={1000} at={cue('Millions')} cols={15} rows={10} size={60} per={0.4} />
      <Counter x={1500} y={300} at={cue('Millions') + 4} to={1000000} prefix="x " dur={30} size={110} />
      <Label text="thousands of tons" x={1500} y={400} at={cue('tons') - 2} size={64} color={C.red} />
      <Person x={1580} y={950} at={cue('Somebody')} hold="clipboard" expr="worried" s={1.45} />
      <Label text="pack · count · haul" x={1580} y={1040} at={cue('haul') - 6} size={52} />
    </g>
  );
};

// 08 — cooks at night; first team member; trucks need fuel
export const S08: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 1: Food" at={-200} />
      <Fade out={cue('every') - 4}>
        <Pot x={480} y={700} at={cue('cooks') - 4} s={1.5} />
        <Pop at={cue('dark') - 4} x={480} y={260}>
          <path d="M520,200 A80,80 0 1,0 520,350 A62,62 0 1,1 520,200Z" fill="#E9E4C8" stroke={C.ink} strokeWidth={6} />
        </Pop>
        <Person x={920} y={960} at={cue('hot') - 6} gear="chef" hold="ladle" expr="happy" s={1.6} />
      </Fade>
      <TeamBoard filled={1} newAt={cue('join')} at={cue('cook') - 12} />
      <Truck x={560} y={960} at={cue('truck')} s={1.6} />
      <Gauge x={1050} y={620} at={cue('fuel') - 6} level={0.5} s={1.3} />
      <QMark x={1050} y={480} at={cue('fuel')} size={130} />
    </g>
  );
};
