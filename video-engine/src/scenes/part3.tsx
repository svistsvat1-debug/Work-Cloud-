import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BELGIUM_LUX, Dot, Land, makeProj, Path} from '../components/maps';
import {Mini, Person} from '../components/people';
import {Arrow, Burst, Counter, Fade, Label, Line, MText, Pop, QMark, RedX, Title} from '../components/primitives';
import {Bag, Balkenkreuz, Bottle, Calendar, Clock, DogTags, Envelope, FilmFrame, Folder, Graves, HayBale, Hedgerow, HelmetGround, HorseWagon, Notice, Ship, Sleeve, Stretcher, Tank, Truck, Wall} from '../components/props';
import {TeamBoard} from '../components/hud';
import {C} from '../lib/theme';
import {prog, useCue} from '../lib/timing';

// 23 — Mission 4: medic
export const S23: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 4: Medic" at={cue('Mission')} />
      <Clock x={1600} y={340} at={cue('minute') - 4} spin={8} s={1.0} />
      <Label text="every minute counts" x={1600} y={520} at={cue('counts')} size={54} color={C.red} />
      <Hedgerow x={760} y={560} at={cue('wounded') - 10} width={1300} />
      <Person x={520} y={860} at={cue('wounded')} pose="lie" expr="worried" hold="none" s={1.4} />
      <Person x={1000} y={900} at={cue('medic') - 2} gear="medic" expr="determined" s={1.55} />
      <Label text="company medic" x={1000} y={990} at={cue('medic') + 6} size={56} />
      <Bag x={1360} y={880} at={cue('bandages')} s={1.3} />
      <Label text="bandages · morphine" x={1360} y={980} at={cue('morphine')} size={50} />
      <RedX x={760} y={420} at={cue('operate')} r={60} />
      <Label text="no surgery here" x={760} y={300} at={cue('operate') - 6} size={56} color={C.red} />
    </g>
  );
};

const Station: React.FC<{x: number; y: number; at: number; text: string; sub?: string; color?: string}> = ({x, y, at, text, sub, color = C.white}) => (
  <Pop at={at} x={x} y={y}>
    <rect x={x - 150} y={y - 70} width={300} height={140} rx={14} fill={color} stroke={C.ink} strokeWidth={6} />
    <text x={x} y={y + (sub ? -2 : 14)} fontFamily="PermanentMarker" fontSize={40} textAnchor="middle">
      {text}
    </text>
    {sub ? (
      <text x={x} y={y + 46} fontFamily="CaveatBrush" fontSize={40} textAnchor="middle">
        {sub}
      </text>
    ) : null}
  </Pop>
);

// 24 — the chain of evacuation
export const S24: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const sx = 230 + 380 * prog(f, cue('litter'), 40);
  return (
    <g>
      <Title text="Mission 4: Medic" at={-200} />
      <Station x={230} y={420} at={cue('litter') - 6} text="FRONT" color={C.khaki} />
      <Arrow from={[390, 420]} to={[580, 420]} at={cue('back')} color={C.ink} w={8} />
      <Station x={760} y={420} at={cue('aid')} text="AID STATION" sub="~1 km back" />
      <Arrow from={[920, 420]} to={[1110, 420]} at={cue('ambulances')} color={C.ink} w={8} />
      <Station x={1290} y={420} at={cue('clearing')} text="CLEARING" sub="surgeons" />
      <Arrow from={[1450, 420]} to={[1560, 420]} at={cue('worst') - 2} color={C.ink} w={8} />
      <Station x={1700} y={420} at={cue('hospitals') - 4} text="HOSPITALS" sub="even England" color={C.paper} />
      <g transform={`translate(${sx - 230},0)`}>
        <Stretcher x={230} y={700} at={cue('litter')} s={1.2} />
        <Person x={90} y={780} at={cue('litter') + 2} s={0.9} hold="none" expr="determined" />
        <Person x={370} y={780} at={cue('litter') + 4} s={0.9} hold="none" expr="determined" flip />
      </g>
      <Clock x={760} y={830} at={cue('hour') - 6} spin={3} s={0.85} />
      <Label text="goal: about 1 hour" x={760} y={1000} at={cue('hour')} size={56} color={C.red} />
      <Truck x={1380} y={940} at={cue('ambulances')} s={1.15} star={false} label="AMBULANCE" />
    </g>
  );
};

const Grid100: React.FC<{x: number; y: number; at: number; dead: number; s?: number}> = ({x, y, at, dead, s = 1}) => {
  const items = [];
  for (let i = 0; i < 100; i++) {
    const c = i % 10;
    const r = Math.floor(i / 10);
    items.push(<Mini key={i} x={x + c * 34 * s} y={y + r * 46 * s} at={at + i * 0.15} s={0.62 * s} grey={i >= 100 - dead} />);
  }
  return <g>{items}</g>;
};

// 25 — people, plasma, penicillin; 8% -> ~4%
export const S25: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 4: Medic" at={-200} />
      <Fade out={cue('First') - 4}>
        {['doctors', 'nurses', 'drivers', 'clerks'].map((k, i) => (
          <g key={k}>
            <Person x={260 + i * 300} y={720} at={cue(k)} gear={i === 1 ? 'wac' : i === 2 ? 'helmet' : 'cap'} uniform={i === 1 ? C.khaki : C.olive} expr="happy" s={1.15} seed={30 + i} />
            <Label text={k} x={260 + i * 300} y={800} at={cue(k) + 4} size={54} />
          </g>
        ))}
        <Bottle x={1450} y={760} at={cue('plasma')} label="PLASMA" s={1.4} />
        <Bottle x={1700} y={760} at={cue('penicillin')} label="PENICILLIN" s={1.2} />
      </Fade>
      <MText text="WW1" x={500} y={300} at={cue('First')} size={84} anchor="middle" underline />
      <Grid100 x={340} y={420} at={cue('First')} dead={8} />
      <Counter x={500} y={960} at={cue('eight')} to={8} suffix=" of 100 died" dur={10} size={64} />
      <MText text="WW2 EUROPE" x={1400} y={300} at={cue('Europe')} size={84} anchor="middle" underline />
      <Grid100 x={1240} y={420} at={cue('Europe')} dead={4} />
      <Counter x={1400} y={960} at={cue('four')} to={4} prefix="~" suffix=" of 100" dur={10} size={64} burst />
    </g>
  );
};

// 26 — medic joins; Mission 5
export const S26: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Fade out={cue('Mission') - 4}>
        <Title text="Mission 4: Medic" at={-200} />
        <TeamBoard filled={4} newAt={cue('joins')} at={0} />
        <Bag x={600} y={560} at={cue('medic') - 4} s={2} />
        <Label text="could not save everyone" x={600} y={760} at={cue('everyone') - 6} size={60} color={C.steel} />
      </Fade>
      <Title text="Mission 5: Remember" at={cue('Mission')} />
      <HelmetGround x={960} y={720} at={cue('rifleman') - 2} s={1.8} />
    </g>
  );
};

// 27 — Graves Registration; two tags; the families' choice
export const S27: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 5: Remember" at={-200} />
      <MText text="GRAVES REGISTRATION" x={960} y={250} at={cue('Graves')} size={72} anchor="middle" underline />
      <Fade out={cue('After') - 4}>
        <DogTags x={520} y={560} at={cue('two') - 4} s={1.8} split={500} splitAt={cue('other')} />
        <Label text="2 identity tags" x={520} y={760} at={cue('tags')} size={58} />
        <Folder x={1360} y={560} at={cue('records') - 4} label="RECORDS" s={1.4} />
        <Envelope x={1660} y={820} at={cue('family') - 2} addr="family" s={0.9} />
      </Fade>
      <Label text="the families' choice" x={960} y={420} at={cue('choice')} size={68} />
      <Ship x={520} y={760} at={cue('home') - 4} s={1.6} />
      <Label text="HOME" x={520} y={900} at={cue('home')} size={66} />
      <Line pts={[[1200, 820], [1400, 740], [1600, 760], [1800, 830]]} at={cue('overseas') - 6} w={8} color={C.green} />
      <Label text="rest overseas" x={1500} y={900} at={cue('overseas')} size={66} />
    </g>
  );
};

// 28 — 171,000 home; 9,388 above Omaha Beach; graves clerk joins
export const S28: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 5: Remember" at={-200} />
      <Fade out={cue('Today') - 2}>
        <Counter x={700} y={500} at={cue('hundred')} to={171000} prefix="" suffix="+" dur={24} size={130} />
        <Label text="brought home" x={700} y={600} at={cue('home') - 2} size={66} />
      </Fade>
      <Line pts={[[60, 720], [400, 640], [800, 610], [1200, 650], [1380, 700]]} at={cue('Today')} w={7} color={C.green} />
      <Graves x={700} y={760} at={cue('Today') + 6} rows={4} cols={13} per={0.5} />
      <MText text="9,388" x={700} y={430} at={cue('nine')} size={110} anchor="middle" />
      <Label text="Normandy American Cemetery" x={700} y={540} at={cue('cemetery')} size={52} />
      <TeamBoard filled={5} newAt={cue('joins')} at={cue('graves') - 10} />
    </g>
  );
};

// 29 — Mission 6: riflemen lost fastest; short 23,000
export const S29: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 6: Replacements" at={cue('Mission')} />
      {Array.from({length: 10}).map((_, i) => (
        <Mini key={i} x={260 + i * 150} y={620} at={cue('replace') + i} s={2.6} grey={false} />
      ))}
      {Array.from({length: 10}).map((_, i) =>
        i % 3 !== 1 ? null : <Mini key={`g${i}`} x={260 + i * 150} y={620} at={cue('lost') + i * 2} s={2.6} grey />,
      )}
      <Label text="lost faster than anyone" x={960} y={740} at={cue('faster')} size={60} color={C.red} />
      <Calendar x={420} y={900} at={cue('December') - 4} text="DEC 1944" w={300} s={0.9} />
      <Counter x={1250} y={940} at={cue('twenty-three')} to={-23000} suffix=" riflemen" dur={20} size={92} color={C.red} />
    </g>
  );
};

// 30 — the tail becomes the teeth: 14,000+ retrained
export const S30: React.FC = () => {
  const {cue} = useCue();
  const crowd = [];
  for (let i = 0; i < 30; i++) crowd.push(<Mini key={i} x={180 + (i % 6) * 90} y={460 + Math.floor(i / 6) * 115} at={cue('plenty') + i * 0.5} s={1.6} color={C.khaki} />);
  return (
    <g>
      <Title text="Mission 6: Replacements" at={-200} />
      {crowd}
      <Label text="plenty of soldiers" x={410} y={1060} at={cue('soldiers')} size={56} />
      {[0, 1, 2].map((i) => (
        <Mini key={i} x={1500 + i * 120} y={700} at={cue('infantrymen') - 4 + i * 2} s={2.4} />
      ))}
      <Label text="not enough riflemen" x={1620} y={820} at={cue('infantrymen')} size={56} color={C.red} />
      <Arrow from={[760, 640]} to={[1400, 640]} at={cue('tail') - 2} dur={16} color={C.green} w={14} head={40} label="retrain!" labelPos={[1080, 580]} labelSize={60} />
      <Counter x={1080} y={300} at={cue('fourteen')} to={14000} prefix="over " dur={20} size={96} burst />
      <Label text="Sept + Oct 1944" x={1080} y={380} at={cue('September')} size={52} />
    </g>
  );
};

const BE = makeProj(2.4, 51.6, 300, 340, 120, 50);
// 31 — the Bulge: cooks, clerks and drivers grab rifles
export const S31: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 6: Replacements" at={-200} />
      <Calendar x={1700} y={300} at={cue('December') - 2} text="DEC 1944" w={300} s={0.8} />
      <Land outline={BELGIUM_LUX} proj={BE} at={cue('December')} dur={22} />
      <Path lls={[[6.35, 50.65], [6.25, 50.3], [6.15, 50.0], [6.35, 49.7]]} proj={BE} at={cue('Germans') - 6} color={C.blue} w={12} />
      <Arrow from={BE([6.9, 50.2])} to={BE([5.1, 50.25])} at={cue('struck')} dur={18} color={C.steel} w={22} head={50} />
      <g transform={`translate(${BE([6.9, 50.6])[0]},${BE([6.9, 50.6])[1]})`}>
        <Pop at={cue('struck') + 6} x={0} y={0}>
          <circle cx={0} cy={0} r={52} fill={C.steel} stroke={C.ink} strokeWidth={5} />
          <Balkenkreuz x={0} y={0} s={1.3} />
          <text x={0} y={100} fontFamily="PermanentMarker" fontSize={48} textAnchor="middle" fill={C.ink}>
            GERMANY
          </text>
        </Pop>
      </g>
      <Label text="ARDENNES" x={BE([5.7, 50.05])[0]} y={BE([5.7, 50.05])[1] + 90} at={cue('Ardennes')} size={60} />
      <Dot p={BE([5.72, 50.0])} at={cue('Bulge')} label="Bastogne" dx={-20} dy={-20} size={46} />
      <Person x={1640} y={1000} at={cue('cooks') - 4} gear="chef" hold="rifleUp" expr="determined" s={1.35} />
      <Label text="cooks · clerks · drivers" x={1560} y={560} at={cue('clerks')} size={54} />
    </g>
  );
};

// 32 — volunteers wanted; sergeants give up their stripes
export const S32: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 6: Replacements" at={-200} />
      <Notice x={560} y={520} at={cue('asked') - 6} lines={['VOLUNTEERS', 'WANTED:', 'INFANTRY']} s={1.1} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Mini key={i} x={300 + i * 130} y={1000} at={cue('Thousands') + i * 3} s={2.3} head={i % 2 ? C.skinMid : C.skinDark} color={C.khaki} />
      ))}
      <Label text="thousands stepped forward" x={560} y={860} at={cue('forward')} size={52} />
      <Sleeve x={1420} y={560} at={cue('sergeants') - 6} eraseAt={cue('stripes')} s={1.3} />
      <Label text="sergeant → private" x={1420} y={820} at={cue('stripes')} size={60} color={C.red} />
      <Label text="just for the chance to fight" x={1420} y={920} at={cue('chance')} size={52} />
    </g>
  );
};

// 33 — 4,562 volunteers; fifth platoons; a crack in segregation
export const S33: React.FC = () => {
  const {cue} = useCue();
  const f = useCurrentFrame();
  const slide = prog(f, cue('extra'), 14);
  return (
    <g>
      <Title text="Mission 6: Replacements" at={-200} />
      <Calendar x={260} y={330} at={cue('February') - 4} text="FEB 1945" w={300} s={0.8} />
      <Counter x={840} y={330} at={cue('four')} to={4562} suffix=" volunteers" dur={20} size={96} burst />
      <g opacity={prog(f, cue('fought') - 6, 8)}>
        <rect x={200} y={500} width={900} height={250} rx={16} fill="none" stroke={C.ink} strokeWidth={6} />
        <text x={650} y={490} fontFamily="CaveatBrush" fontSize={52} textAnchor="middle">
          rifle company
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={230 + i * 170} y={540} width={150} height={170} rx={10} fill={C.olive} opacity={0.5} stroke={C.ink} strokeWidth={4} />
            <text x={305 + i * 170} y={640} fontFamily="PermanentMarker" fontSize={40} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
        <g transform={`translate(${(1 - slide) * 300},0)`} opacity={slide}>
          <rect x={910} y={540} width={160} height={170} rx={10} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          <text x={990} y={640} fontFamily="PermanentMarker" fontSize={40} textAnchor="middle">
            5th
          </text>
        </g>
      </g>
      <Label text="extra platoons" x={990} y={800} at={cue('extra') + 6} size={54} color={C.ink} />
      <Wall x={1500} y={760} at={cue('early') - 8} crackAt={cue('crack')} s={0.75} />
    </g>
  );
};

// 34 — retrained rifleman joins; what about the enemy?
export const S34: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 6: Replacements" at={-200} />
      <TeamBoard filled={6} newAt={cue('joins')} at={0} />
      <Person x={620} y={980} at={cue('never') - 4} hold="rifleUp" skin={C.skinDark} expr="determined" s={1.75} />
      <Label text="the front needed him" x={620} y={1060} at={cue('needed')} size={54} />
      <QMark x={1100} y={420} at={cue("enemy's")} size={180} />
    </g>
  );
};

// 35 — Mission 7: the enemy's tail — newsreel tanks vs horses
export const S35: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 7: The Enemy's Tail" at={cue('Mission')} />
      <Fade out={cue('But') - 2}>
        <FilmFrame x={960} y={600} at={cue('newsreels') - 4} s={1.15} />
        <Tank x={940} y={720} at={cue('machine') - 6} side="de" s={1.25} />
        <Label text="NEWSREEL" x={960} y={300} at={cue('newsreels')} size={60} color={C.steel} />
      </Fade>
      {[0, 1, 2].map((i) => (
        <Mini key={i} x={1500 + i * 120} y={950} at={cue('foot') + i * 3} s={2.2} color={C.steel} />
      ))}
      <Label text="on foot" x={1620} y={1040} at={cue('foot') + 6} size={56} />
      <HorseWagon x={960} y={960} at={cue('pulled') - 6} s={1.25} />
      <Label text="pulled by horses" x={760} y={560} at={cue('horses') - 4} size={70} color={C.red} />
    </g>
  );
};

// 36 — ~2.75 million horses and mules; a hungry, tired tail
export const S36: React.FC = () => {
  const {cue} = useCue();
  const herd = [];
  for (let i = 0; i < 12; i++) {
    const x = 220 + (i % 6) * 150;
    const y = 600 + Math.floor(i / 6) * 160;
    herd.push(
      <Pop key={i} at={cue('two') + i * 2} x={x} y={y}>
        <g transform={`translate(${x},${y}) scale(0.5)`}>
          <ellipse cx={0} cy={-120} rx={95} ry={45} fill="#8A6A4A" stroke={C.ink} strokeWidth={8} />
          <path d="M70,-140 L110,-210 L150,-220 L160,-196 L120,-170 L96,-120" fill="#8A6A4A" stroke={C.ink} strokeWidth={8} />
          <path d="M-60,-90 L-66,0 M-30,-86 L-24,0 M40,-86 L34,0 M70,-92 L78,0" stroke={C.ink} strokeWidth={9} />
        </g>
      </Pop>,
    );
  }
  return (
    <g>
      <Title text="Mission 7: The Enemy's Tail" at={-200} />
      <Counter x={620} y={330} at={cue('five')} to={500000} prefix="~" suffix=" (1939)" dur={16} size={80} />
      <Counter x={620} y={470} at={cue('two')} from={500000} to={2750000} prefix="~" suffix=" total" dur={24} size={92} burst />
      {herd}
      <Label text="horses and mules" x={620} y={980} at={cue('mules')} size={56} />
      <HayBale x={1450} y={760} at={cue('food') - 4} s={1.6} eatAt={cue('food')} />
      <HorseWagon x={1560} y={720} at={cue('food') - 2} s={0.6} gun={false} />
      <Label text="food · rest · vets" x={1450} y={880} at={cue('vets') - 2} size={60} />
      <MText text="a hungry, tired tail" x={1450} y={300} at={cue('hungry')} size={64} anchor="middle" color={C.red} underline={C.ink} />
    </g>
  );
};

// 37 — the hard truth for both sides
export const S37: React.FC = () => {
  const {cue} = useCue();
  return (
    <g>
      <Title text="Mission 7: The Enemy's Tail" at={-200} />
      <Line pts={[[120, 520], [600, 520], [1000, 520]]} at={cue('Both')} color={C.blue} w={14} />
      <Person x={1080} y={600} at={cue('soldier')} hold="rifle" s={1.2} expr="determined" />
      <Label text="U.S." x={120} y={480} at={cue('Both')} size={56} anchor="start" />
      <Line pts={[[120, 900], [600, 900], [1000, 900]]} at={cue('Both') + 6} color={C.steel} w={14} />
      <Mini x={1080} y={960} at={cue('soldier') + 4} s={3} color={C.steel} />
      <Label text="GERMANY" x={120} y={860} at={cue('Both') + 6} size={56} anchor="start" />
      <MText text="only as strong as the line behind him" x={960} y={250} at={cue('strong') - 4} size={64} anchor="middle" underline cps={34} />
      <QMark x={1600} y={720} at={cue('question') - 4} size={220} color={C.red} />
    </g>
  );
};

export const _refs = [Envelope, Tank, Truck, Burst, Line];
