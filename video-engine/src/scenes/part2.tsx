import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BRITAIN, Dot, FRANCE, Land, makeProj, Path} from '../components/maps';
import {Bubble, Mini, Person} from '../components/people';
import {Arrow, Burst, Circle, Counter, Fade, Label, Line, MText, Pop, RedX, Title} from '../components/primitives';
import {Calendar, Camera, Clock, Envelope, Explosion, FilmReel, Gauge, Jerrycan, Magnifier, MailSack, RedBall, SackPile, Scale, Sign, Speedo, Stop, Sun, Tank, Truck, Warehouse} from '../components/props';
import {TeamBoard} from '../components/hud';
import {C} from '../lib/theme';
import {prog, useCue} from '../lib/timing';

const FR = makeProj(-5.8, 51.6, 92, 260, 150);
const CHERBOURG = FR([-1.62, 49.64]);
const OMAHA = FR([-0.9, 49.37]);

// 09 — breakout; supplies still in Normandy
export const S09: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 2: Fuel" at={cue('Mission')} />
      <Land outline={FRANCE} proj={FR} at={cue('August') - 6} dur={34} />
      <Label text="FRANCE" x={FR([2.6, 46.6])[0]} y={FR([2.6, 46.6])[1]} at={cue('France')} size={70} color={C.steel} />
      <MText text="AUG 1944" x={1500} y={260} at={cue('August')} size={70} anchor="middle" underline />
      <Arrow from={FR([-0.6, 48.9])} to={FR([2.0, 48.9])} at={cue('broke')} dur={16} color={C.blue} w={16} head={40} />
      <Arrow from={FR([2.3, 48.7])} to={FR([4.9, 48.9])} at={cue('raced')} dur={16} color={C.blue} w={16} head={40} />
      <Dot p={CHERBOURG} at={cue('Cherbourg')} label="Cherbourg" dx={-20} dy={-24} size={52} />
      <Dot p={OMAHA} at={cue('beaches')} label="beaches" dx={20} dy={-28} size={52} color={C.yellow} />
      <Pop at={cue('supplies')} x={1500} y={640}>
        <g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={1380 + (i % 3) * 80} y={600 - Math.floor(i / 3) * 62} width={72} height={56} fill={C.khaki} stroke={C.ink} strokeWidth={5} />
          ))}
          <text x={1500} y={740} fontFamily="CaveatBrush" fontSize={56} textAnchor="middle">
            supplies
          </text>
        </g>
      </Pop>
      <Arrow from={[1380, 600]} to={[OMAHA[0] + 40, OMAHA[1] + 10]} at={cue('ashore')} dur={14} bend={-0.15} color={C.ink} w={7} label="still here!" labelPos={[1500, 860]} labelSize={58} />
    </g>
  );
};

// 10 — Cherbourg wrecked; supply line stretches
export const S10: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const stretch = prog(f, cue('mile'), Math.max(30, cue('longer') - cue('mile') + 10));
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <MText text="CHERBOURG" x={420} y={260} at={cue('Cherbourg')} size={72} anchor="middle" underline />
      <Fade out={cue('So') - 2}>
        <Line pts={[[120, 760], [720, 760]]} at={cue('Cherbourg')} color={C.blue} w={10} />
        {[220, 420, 600].map((x, i) => (
          <g key={i}>
            <Line pts={[[x, 760], [x, 470], [x + 110, 470], [x + 110, 520]]} at={cue('Cherbourg') + 6 + i * 4} dur={12} w={7} />
            <Explosion x={x + 30} y={560} at={cue('wrecked') + i * 5} s={1.3} />
          </g>
        ))}
        <Label text="harbor wrecked" x={420} y={860} at={cue('wrecked') + 10} size={60} color={C.red} />
      </Fade>
      <Dot p={[300, 640]} at={cue('So')} label="coast" dx={0} dy={60} size={52} r={16} />
      <g>
        <line x1={300} y1={640} x2={300 + 1300 * stretch} y2={640} stroke={C.ink} strokeWidth={8} strokeDasharray="22 16" opacity={stretch > 0 ? 1 : 0} />
        {stretch > 0 ? (
          <g transform={`translate(${300 + 1300 * stretch},640)`}>
            <Tank x={60} y={70} at={cue('tanks') - 2} s={0.6} />
          </g>
        ) : null}
      </g>
      <Counter x={960} y={480} at={cue('mile')} to={400} suffix=" miles" dur={Math.max(30, cue('longer') - cue('mile'))} size={110} />
      <Label text="the line grows longer..." x={960} y={860} at={cue('longer') - 4} size={64} color={C.red} />
    </g>
  );
};

// 11 — railways smashed -> Red Ball Express
export const S11: React.FC = () => {
  const {cue} = useCue();
  const rails: [number, number][][] = [
    [[-1.6, 49.6], [0.1, 49.2], [2.35, 48.86]],
    [[2.35, 48.86], [4.0, 49.2], [6.2, 49.1]],
    [[0.1, 49.4], [1.1, 49.9], [2.9, 50.6]],
    [[2.35, 48.86], [3.0, 47.3], [4.8, 46.2]],
  ];
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <Fade out={cue('So') - 2}>
        <Land outline={FRANCE} proj={FR} at={-200} />
        {rails.map((r, i) => (
          <Path key={i} lls={r} proj={FR} at={cue('railways') + i * 4} color={C.ink} w={8} />
        ))}
        {rails.map((r, i) => (
          <Explosion key={`e${i}`} x={FR(r[1])[0]} y={FR(r[1])[1]} at={cue('smashed') + i * 4} s={0.9} />
        ))}
        {rails.map((r, i) => (
          <RedX key={`x${i}`} x={FR(r[1])[0]} y={FR(r[1])[1]} at={cue('smashed') + 24 + i * 3} r={34} />
        ))}
        <Label text="bombed before D-Day" x={1520} y={420} at={cue('invasion') - 6} size={60} />
      </Fade>
      <RedBall x={560} y={520} at={cue('Red')} s={1.6} />
      <MText text="RED BALL EXPRESS" x={1320} y={540} at={cue('Red')} size={96} anchor="middle" underline cps={26} />
      <Truck x={760} y={980} at={cue('trucks') - 2} s={1.1} />
      <Truck x={1220} y={980} at={cue('trucks') + 4} s={1.1} />
      <Truck x={1680} y={980} at={cue('trucks') + 10} s={1.1} />
    </g>
  );
};

// 12 — 6,000 trucks, day & night, 3 of 4 drivers Black soldiers
export const S12: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const loopO = prog(f, cue('loop') - 4, 10);
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <Counter x={560} y={280} at={cue('six')} to={6000} prefix="~" suffix=" trucks" dur={24} size={110} burst />
      <ellipse cx={560} cy={640} rx={380} ry={170} fill="none" stroke={C.ink} strokeWidth={10} strokeDasharray="30 20" opacity={loopO} />
      {loopO > 0
        ? [0, 1, 2, 3, 4].map((i) => {
            const a = (f / 50 + (i * Math.PI * 2) / 5) % (Math.PI * 2);
            const x = 560 + Math.cos(a) * 380;
            const y = 640 + Math.sin(a) * 170;
            return (
              <g key={i} transform={`translate(${x},${y}) scale(${Math.sin(a) > 0 ? -0.32 : 0.32},0.32)`}>
                <path d="M-200,-40 L60,-40 L60,-170 L-200,-170 Z M60,-40 L60,-140 L140,-140 L170,-95 L200,-90 L200,-40 Z" fill={C.olive} stroke={C.ink} strokeWidth={16} />
                <circle cx={-140} cy={-30} r={34} fill={C.ink} />
                <circle cx={140} cy={-30} r={34} fill={C.ink} />
              </g>
            );
          })
        : null}
      <Label text="one-way loop" x={560} y={660} at={cue('loop')} size={54} />
      <Sun x={1000} y={400} at={cue('Convoys')} moon={prog(f, cue('night'), 10)} />
      <Fade in={cue('three')} inDur={6}>
        {[0, 1, 2, 3].map((i) => (
          <Mini key={i} x={1250 + i * 130} y={460} at={cue('three') + i * 3} s={2.6} head={i < 3 ? C.skinDark : C.skinLight} />
        ))}
      </Fade>
      <Label text="3 out of 4 drivers" x={1445} y={560} at={cue('drivers')} size={60} />
      <MText text="segregated army" x={1445} y={700} at={cue('segregated')} size={60} anchor="middle" color={C.red} />
      <g opacity={prog(f, cue('service'), 8)}>
        <rect x={1180} y={760} width={250} height={90} rx={10} fill={C.khaki} stroke={C.ink} strokeWidth={5} />
        <text x={1305} y={820} fontFamily="PermanentMarker" fontSize={40} textAnchor="middle">
          SERVICE
        </text>
        <rect x={1460} y={760} width={250} height={90} rx={10} fill={C.white} stroke={C.grey} strokeWidth={5} strokeDasharray="12 8" />
        <text x={1585} y={820} fontFamily="PermanentMarker" fontSize={40} textAnchor="middle" fill={C.grey}>
          COMBAT
        </text>
      </g>
      <RedX x={1585} y={805} at={cue('combat')} r={50} />
      <Person x={1310} y={1060} at={cue('drove') - 6} pose="bust" gear="helmet" skin={C.skinDark} expr="determined" s={0.75} />
    </g>
  );
};

// 13 — young drivers, 54 hours, 25 mph vs 60+
export const S13: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <Person x={380} y={960} at={cue('drivers') - 4} pose="bust" skin={C.skinDark} expr="determined" s={1.9} />
      <MText text="UNDER 24" x={380} y={330} at={cue('twenty-four')} size={84} anchor="middle" underline />
      <Label text="few had driven a truck" x={380} y={1040} at={cue('driven')} size={52} />
      <Clock x={960} y={520} at={cue('round') - 4} spin={6} s={1.2} />
      <Label text="round trip from Cherbourg" x={960} y={340} at={cue('Cherbourg')} size={52} />
      <Counter x={960} y={780} at={cue('fifty-four')} to={54} suffix=" hours" dur={16} size={90} />
      <Sign x={1520} y={420} at={cue('rules')} text="25 MPH" s={1.2} />
      <Speedo x={1520} y={860} at={cue('practice') - 6} from={25} to={64} moveAt={cue('raced')} s={1.25} />
      <Label text="raced alone, blackout" x={1520} y={1010} at={cue('blackout') - 2} size={54} color={C.red} />
      <Burst x={1520} y={800} at={cue('sixty')} rx={210} ry={150} />
    </g>
  );
};

// 14 — 412,000 tons; but Third Army asks for 400,000 gallons
export const S14: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <Fade out={cue('August') - 2}>
        <Calendar x={360} y={500} at={cue('mid-November')} text="NOV" sub="1944" s={1.3} />
        <Counter x={1100} y={540} at={cue('four')} to={412000} suffix=" tons" dur={30} size={120} burst />
        <MText text="still not enough" x={1100} y={760} at={cue('enough') - 6} size={84} anchor="middle" color={C.red} underline={C.ink} />
      </Fade>
      <Calendar x={360} y={560} at={cue('August')} text="AUG 30" sub="1944" s={1.3} w={260} />
      <MText text="PATTON'S THIRD ARMY" x={1150} y={330} at={cue("Patton's")} size={72} anchor="middle" underline />
      {[0, 1, 2, 3, 4].map((i) => (
        <Jerrycan key={i} x={820 + i * 140} y={640} at={cue('asked') + i * 3} s={1.3} />
      ))}
      <MText text="ASKED: 400,000 GAL" x={1100} y={890} at={cue('gallons') - 6} size={80} anchor="middle" />
    </g>
  );
};

// 15 — got 32,000; tanks stop at the Meuse
export const S15: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <MText text="ASKED: 400,000" x={100} y={300} at={-200} size={70} />
      <MText text="GOT: 32,000" x={100} y={420} at={cue('received')} size={70} color={C.red} underline={C.ink} />
      <Gauge x={1500} y={420} at={cue('received') - 4} level={0.04} levelFrom={0.6} levelAt={cue('thirty-two')} s={1.4} />
      <Line pts={[[700, 980], [760, 860], [720, 740], [790, 620], [760, 520]]} at={cue('Meuse') - 8} color={C.blue} w={22} />
      <Label text="MEUSE" x={850} y={560} at={cue('Meuse')} size={60} color={C.blue} />
      <Tank x={360} y={900} at={cue('tanks')} s={1.1} />
      <Stop x={620} y={640} at={cue('stopped')} s={1.1} />
      <Calendar x={1450} y={820} at={cue('days') - 6} text="WAIT" flip={5} flipAt={cue('days')} s={1.0} />
      <Label text="held back by empty tanks" x={1100} y={1050} at={cue('guns') - 10} size={56} color={C.red} />
    </g>
  );
};

// 16 — driver joins the team; what keeps his mind going?
export const S16: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 2: Fuel" at={-200} />
      <TeamBoard filled={2} newAt={cue('joins')} at={0} />
      <Truck x={460} y={560} at={cue('truck') - 4} s={1.2} />
      <Person x={720} y={1060} at={cue('body') - 4} pose="bust" hold="rifle" expr="tired" s={1.6} />
      <Bubble x={1060} y={640} at={cue('mind') - 4} text="?" />
    </g>
  );
};

// 17 — Mission 3: letters are heavy
export const S17: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 3: Mail" at={cue('Mission')} />
      <Fade out={cue('heavy') + 4}>
        <Person x={520} y={960} at={cue('soldier') - 4} hold="letter" expr="happy" s={1.7} />
        <Envelope x={1150} y={560} at={cue('letter') - 4} heart s={1.8} />
      </Fade>
      <Counter x={760} y={300} at={cue('hundred')} to={150000} suffix=" letters" dur={24} size={100} />
      <SackPile x={760} y={960} at={cue('thirty-seven') - 4} count={37} per={0.9} cols={10} s={1.2} />
      <Label text="37 mail sacks" x={760} y={1050} at={cue('sacks')} size={60} />
      <Scale x={1520} y={760} at={cue('weighed') - 4} reading="2,575 LB" s={1.6} />
    </g>
  );
};

// 18 — V-mail on film: 1 sack, 45 lb
export const S18: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const gone = prog(f, cue('same'), 14);
  return (
    <g>
      <Title text="Mission 3: Mail" at={-200} />
      <MText text="VICTORY MAIL · JUNE 1942" x={960} y={260} at={cue('June')} size={72} anchor="middle" underline />
      <Envelope x={330} y={480} at={cue('shrank') - 4} s={1.1} />
      <Arrow from={[470, 480]} to={[640, 480]} at={cue('photographed') - 6} color={C.ink} w={8} />
      <Camera x={800} y={480} at={cue('photographed') - 2} s={1.3} />
      <Arrow from={[940, 480]} to={[1110, 480]} at={cue('film') - 6} color={C.ink} w={8} />
      <FilmReel x={1280} y={480} at={cue('film') - 2} s={1.4} />
      <g opacity={1 - gone}>
        <SackPile x={560} y={960} at={-200} count={37} per={0} cols={10} s={0.9} />
      </g>
      <MailSack x={560} y={960} at={cue('sack') - 4} s={1.6} />
      <Scale x={1350} y={900} at={cue('weighing') - 4} reading="45 LB" readAt={cue('forty-five')} s={1.5} />
      <Burst x={1350} y={800} at={cue('forty-five')} rx={240} ry={110} />
    </g>
  );
};

const GB = makeProj(-6.5, 59, 74, 120, 130, 54);
// 19 — backlog in Birmingham warehouses
export const S19: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 3: Mail" at={-200} />
      <MText text="1945" x={620} y={240} at={cue('early')} size={84} anchor="middle" underline />
      <Land outline={BRITAIN} proj={GB} at={cue('problem') - 10} dur={26} />
      <Dot p={GB([-1.89, 52.49])} at={cue('Birmingham')} label="Birmingham" dx={24} dy={-22} size={52} />
      <Warehouse x={1220} y={700} at={cue('warehouses') - 6} s={1.3} />
      <SackPile x={1220} y={690} at={cue('Millions')} count={21} per={0.8} cols={6} s={0.9} />
      <MText text="MILLIONS of letters & parcels" x={1220} y={250} at={cue('Millions')} size={60} anchor="middle" underline cps={40} />
      <Envelope x={1110} y={900} at={cue('badly') - 4} addr="??? Army" s={0.9} />
      <Envelope x={1460} y={920} at={cue('badly') + 2} addr="moved?" s={0.9} />
      <Magnifier x={1700} y={600} at={cue('detective') - 4} s={1.6} />
    </g>
  );
};

// 20 — the Six Triple Eight
export const S20: React.FC = () => {
  const {cue} = useCue();
  const skins = [C.skinDark, C.skinMid, C.skinDark, C.skinMid, C.skinDark];
  return (
    <g>
      <Title text="Mission 3: Mail" at={-200} />
      <MText text="6888th BATTALION" x={960} y={250} at={cue('Six')} size={92} anchor="middle" underline />
      {skins.map((sk, i) => (
        <Person key={i} x={320 + i * 230} y={860} at={cue('women') - 6 + i * 3} gear="wac" uniform={C.khaki} skin={sk} expr={i === 2 ? 'determined' : 'proud'} s={1.25} seed={20 + i} />
      ))}
      <Counter x={780} y={430} at={cue('Eight', 2)} to={855} suffix=" women" dur={18} size={90} />
      <Label text="Major Charity Adams" x={780} y={960} at={cue('Charity')} size={60} />
      <MText text="only Black women's battalion overseas" x={1460} y={460} at={cue('only') - 4} size={46} anchor="middle" color={C.red} cps={40} />
      <Calendar x={1560} y={720} at={cue('months') - 8} text="6 MONTHS" w={300} s={1.1} />
      <Label text="the estimate" x={1560} y={900} at={cue('months')} size={52} />
    </g>
  );
};

// 21 — three shifts, 65,000 per shift, done in three months
export const S21: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 3: Mail" at={-200} />
      <Clock x={360} y={480} at={cue('shifts') - 6} segments={3} segAt={cue('shifts')} s={1.3} />
      <Label text="3 shifts · 7 days a week" x={360} y={700} at={cue('seven')} size={52} />
      <Label text="cold, badly lit buildings" x={360} y={780} at={cue('cold')} size={50} color={C.steel} />
      <Counter x={1050} y={400} at={cue('sixty-five')} to={65000} suffix=" / shift" dur={20} size={96} burst />
      <SackPile x={1050} y={860} at={-200} count={21} per={0} cols={6} s={1.1} shrink={0.001} shrinkAt={cue('cleared')} />
      <Calendar x={1600} y={480} at={0} text="6 MONTHS" w={300} s={0.9} />
      <RedX x={1600} y={500} at={cue('three', 2)} r={80} />
      <Calendar x={1600} y={780} at={cue('three', 2)} text="3 MONTHS" w={300} s={0.9} />
      <Circle x={1600} y={790} r={150} at={cue('backlog')} color={C.green} />
      <MText text="NO MAIL, LOW MORALE" x={960} y={1030} at={cue('No') - 2} size={78} anchor="middle" underline />
    </g>
  );
};

// 22 — mail clerk joins; some letters came back
export const S22: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 3: Mail" at={-200} />
      <TeamBoard filled={3} newAt={cue('joins')} at={0} />
      <Envelope x={640} y={560} at={cue('letters') - 4} s={2} stamp="RETURN TO SENDER" stampAt={cue('unopened')} />
    </g>
  );
};

export const _refs = [Bubble, Mini, Jerrycan, Explosion];
