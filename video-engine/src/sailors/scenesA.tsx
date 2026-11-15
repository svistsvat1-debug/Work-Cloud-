// Scenes 1–27: hook, night watch, dawn general quarters, breakfast
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {G, Sh, Tx, PopAt, Circle, Arrow, Label, Check, XMark, Hit, Soldier, Plate, Mug, Bottle, Calendar, Clock, Blob, WW, useProg, along} from '../paint/Kit';
import {
  Destroyer, Waves, Rock, Moon, Stars, Sun, Bell, DeckGun, Plane, LifeRing, Bucket, PaintCan, Mop, Hammer, Periscope, Racks,
  Binoculars, Thermo, Zzz, NV,
} from '../paint/Navy';

const HN = '03:45 NIGHT', HL = '04:00 LOOKOUT', HD = '05:30 DAWN', HB = '07:00 BREAKFAST';

// S1 — "Picture a World War Two sailor."
export const S1: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Soldier x={960} y={900} s={1.5} at={b(0)} hat="sailor" face="smirk" arms="hip" seed={11} />
    <Label x={1450} y={330} to={[1080, 480]} at={w(0, 'sailor')} size={70}>U.S. NAVY SAILOR</Label>
    <PText x={440} y={330} at={w(0, 'World')} size={90} font="bang" anchor="middle">WW2</PText>
  </Board>
);

// S2 — firing a huge gun at enemy planes
export const S2: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.turq}>
    <DeckGun x={560} y={900} s={1.3} at={b(0)} fire={w(0, 'firing')} />
    <Plane x={1450} y={260} s={0.8} at={w(0, 'planes')} r={160} seed={21} />
    <Plane x={1700} y={420} s={0.6} at={w(0, 'planes') + 3} r={160} seed={25} />
    <Hit x={1300} y={330} at={w(0, 'firing') + 6} s={0.7} />
    <Soldier x={300} y={1000} s={1.1} at={b(0)} hat="sailor" face="grin" arms="up" seed={27} />
    <PText x={1400} y={900} at={w(0, 'huge')} size={110} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>BOOM!</PText>
  </Board>
);

// S3 — most days: not a single shot
export const S3: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <DeckGun x={560} y={900} s={1.3} at={b(0)} web={w(0, 'never')} />
    <Soldier x={1350} y={950} s={1.3} at={b(0)} hat="sailor" face="sad" arms="down" seed={31} />
    <PText x={1550} y={330} at={w(0, 'single')} size={150} font="bang" color={PAL.red} anchor="middle">0 SHOTS</PText>
    <Circle x={950} y={590} rx={140} ry={120} at={w(0, 'never') + 4} />
  </Board>
);

// S4 — INTRO: what did they do all day? (echoes the thumbnail: paint can + red circle)
export const S4: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <PText x={70} y={250} at={b(0)} size={170} font="bang">WHAT DID</PText>
    <PText x={70} y={430} at={w(0, 'three')} size={170} font="bang">THEY DO</PText>
    <PText x={70} y={640} at={w(0, 'all')} size={230} font="bang" color={PAL.red} outline={PAL.black}>ALL DAY?</PText>
    <Destroyer x={560} y={900} s={0.5} at={w(0, 'ship')} />
    <PText x={560} y={1010} at={w(0, 'hundred')} size={60} anchor="middle">300 MEN</PText>
    <Soldier x={1600} y={1000} s={1.5} at={b(0)} hat="sailor" face="shock" arms="shrug" seed={41} sweat />
    <PaintCan x={1180} y={760} s={0.9} at={b(1)} />
    <Circle x={1180} y={740} rx={150} ry={150} at={b(1) + 4} />
    <PText x={1260} y={600} at={b(1) + 8} size={130} font="bang" color={PAL.red} anchor="middle">?</PText>
  </Board>
);

// S5 — the boring part saved their lives
export const S5: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Mop x={420} y={560} s={1.2} at={w(0, 'boring')} r={-12} />
    <Bucket x={620} y={760} s={1.2} at={w(0, 'boring') + 2} />
    <PText x={520} y={980} at={w(0, 'boring')} size={90} font="bang" anchor="middle">BORING</PText>
    <Arrow a={[800, 600]} b={[1220, 600]} at={w(0, 'saved')} seed={51} w={14} />
    <LifeRing x={1480} y={600} s={1.4} at={w(0, 'saved')} />
    <PText x={1480} y={900} at={w(0, 'lives')} size={90} font="bang" color={PAL.red} anchor="middle">SAVED LIVES?</PText>
  </Board>
);

// S6 — title card: the day starts at night
export const S6: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={NV.night}>
    <Stars at={b(0)} />
    <Moon x={1650} y={220} s={1.2} at={b(0)} />
    <Clock x={420} y={560} s={2} at={b(0)} />
    <PText x={420} y={850} at={b(0) + 4} size={90} font="bang" color={PAL.white} anchor="middle">03:45</PText>
    <PText x={1260} y={520} at={w(1, 'middle')} size={150} font="bang" color={PAL.white} anchor="middle" outline={PAL.black}>THE DAY</PText>
    <PText x={1260} y={700} at={w(1, 'night')} size={150} font="bang" color={PAL.yellow} anchor="middle" outline={PAL.black}>STARTS AT NIGHT</PText>
  </Board>
);

// S7 — destroyer in the Pacific, 1944
export const S7: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN} bg={PAL.turq}>
    <Blob p={[[80, 260], [500, 200], [620, 420], [420, 560], [120, 520]]} f={PAL.green} at={w(0, 'Pacific')} seed={71} />
    <Blob p={[[1500, 700], [1840, 650], [1880, 980], [1560, 1000]]} f={PAL.green} at={w(0, 'Pacific')} seed={72} />
    <PText x={1050} y={330} at={w(0, 'Pacific')} size={110} font="bang" color={PAL.dblue} anchor="middle">PACIFIC</PText>
    <Destroyer x={980} y={690} s={0.55} at={w(0, 'destroyer')} />
    <Label x={700} y={940} to={[900, 660]} at={b(0) + 4} size={80}>YOU</Label>
    <Calendar x={1600} y={330} s={1} at={w(0, 'nineteen')} top="YEAR" big="1944" />
  </Board>
);

// S8 — "tin cans": thin steel, rolling
export const S8: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN}>
    <Rock x={960} y={680} deg={7} speed={12} at={b(0)}>
      <Destroyer x={960} y={680} s={1.1} at={b(0)} />
    </Rock>
    <Waves y={700} at={b(0)} />
    <PText x={1500} y={260} at={w(0, 'tin')} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>TIN CAN</PText>
    <Label x={420} y={300} to={[560, 620]} at={w(0, 'thin')} size={64}>THIN STEEL</Label>
  </Board>
);

// S9 — somebody shakes your bunk at a quarter to four
export const S9: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const sh = f >= b(0) && f < b(0) + 30 ? Math.sin(f * 2.2) * 8 : 0;
  return (
    <Board L={L} hdr={HN} bg={NV.night}>
      <g transform={`translate(${sh},0)`}>
        <Sh p={rect(300, 640, 900, 50)} f={PAL.tan} at={b(0)} d={5} seed={91} />
        <G x={420} y={600}><Sh p={ell(0, 0, 70, 60)} f={PAL.white} at={b(0)} d={4} seed={92} />
          <Sh p={[[-30, -6], [-8, -6]]} open at={b(0) + 4} d={0} w={6} seed={93} />
          <Sh p={[[10, -6], [32, -6]]} open at={b(0) + 4} d={0} w={6} seed={94} /></G>
        <Sh p={rect(490, 560, 650, 80)} f={WW.olive} at={b(0) + 3} d={0} seed={95} />
      </g>
      <Zzz x={560} y={480} at={b(0)} />
      <Sh p={[[1300, 300], [1180, 560]]} open at={w(0, 'shakes')} d={4} w={14} c={PAL.white} seed={96} />
      <Clock x={1550} y={420} s={1.4} at={w(1, 'quarter')} />
      <PText x={1550} y={680} at={w(1, 'quarter')} size={80} font="bang" color={PAL.white} anchor="middle">03:45</PText>
      <PText x={1550} y={860} at={w(1, 'watch')} size={80} font="bang" color={PAL.yellow} anchor="middle">WATCH 04:00</PText>
    </Board>
  );
};

// S10 — four-hour watches: 4 on / 8 off
export const S10: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  return (
    <Board L={L} hdr={HN}>
      <G x={620} y={600}>
        <Sh p={ell(0, 0, 330, 330, 36)} f={PAL.white} at={b(0)} d={6} seed={101} />
        {Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          return <Sh key={i} p={[[0, 0], [Math.cos(a) * 330, Math.sin(a) * 330]]} open at={w(0, 'four-hour') + i} d={0} w={6} seed={102 + i} />;
        })}
        {[0, 3].map((k) => {
          const a0 = (k / 6) * Math.PI * 2 - Math.PI / 2, a1 = ((k + 1) / 6) * Math.PI * 2 - Math.PI / 2;
          const pts: P[] = [[0, 0], ...Array.from({length: 8}, (_, j) => [Math.cos(a0 + (a1 - a0) * j / 7) * 320, Math.sin(a0 + (a1 - a0) * j / 7) * 320] as P)];
          return <Sh key={k} p={pts} f={PAL.red} at={w(1, 'stand')} d={0} w={4} seed={110 + k} />;
        })}
        {f >= b(0) ? <Tx x={0} y={20} at={b(0)} size={60} font="bang">24 H</Tx> : null}
      </G>
      <PText x={1450} y={460} at={w(1, 'stand')} size={150} font="bang" color={PAL.red} anchor="middle">4 ON</PText>
      <PText x={1450} y={680} at={w(1, 'eight')} size={150} font="bang" anchor="middle">8 OFF</PText>
      <Soldier x={1450} y={1060} s={0.75} at={b(1)} hat="sailor" face="worry" seed={115} />
    </Board>
  );
};

// S11 — the eight hours are full of work; no real sleep
export const S11: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN}>
    <PText x={480} y={300} at={b(0)} size={110} font="bang" anchor="middle">8 HOURS OFF =</PText>
    <Mop x={240} y={620} s={0.9} at={w(0, 'work')} r={-10} />
    <Hammer x={480} y={560} s={1.1} at={w(0, 'work') + 3} r={20} />
    <Bucket x={720} y={680} s={1} at={w(0, 'work') + 6} />
    <PText x={480} y={950} at={w(0, 'work')} size={100} font="bang" color={PAL.red} anchor="middle">WORK</PText>
    <Zzz x={1350} y={600} at={w(1, 'sleep')} s={2} />
    <XMark x={1420} y={520} s={3} at={w(1, 'stop')} />
    <PText x={1420} y={900} at={w(1, 'sleep')} size={100} font="bang" anchor="middle">FULL NIGHT OF SLEEP</PText>
  </Board>
);

// S12 — racks stacked 3–4 high, hot, oil and sweat
export const S12: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN}>
    <Racks x={700} y={1000} s={1.1} at={w(1, 'canvas')} n={4} />
    <Label x={1350} y={330} to={[980, 420]} at={w(1, 'stacked')} size={70}>3–4 HIGH</Label>
    <Thermo x={1500} y={760} s={1.2} at={w(1, 'hot')} />
    <PText x={1550} y={1000} at={w(1, 'oil')} size={70} font="bang" color={PAL.brown} anchor="middle">OIL + SWEAT</PText>
    {[0, 1, 2].map((i) => <Sh key={i} p={[[1200 + i * 60, 900], [1220 + i * 60, 860], [1190 + i * 60, 820], [1210 + i * 60, 780]]} open at={w(1, 'smells') + i * 2} d={4} w={7} c={PAL.green} seed={121 + i} />)}
    <PText x={700} y={280} at={b(0)} size={80} font="bang" anchor="middle">YOUR BED</PText>
  </Board>
);

// S13 — sleeping on the open deck in the tropics
export const S13: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN} bg={NV.night}>
    <Stars at={b(0)} n={24} />
    <Moon x={1650} y={240} at={b(0)} />
    <Sh p={rect(0, 760, 1920, 330)} f={PAL.grey} at={b(0)} d={5} seed={131} />
    <Sh p={rect(560, 690, 700, 70)} f={PAL.white} at={w(0, 'mattresses')} d={4} seed={132} />
    <G x={650} y={660}><Sh p={ell(0, 0, 60, 50)} f={PAL.white} at={w(0, 'slept')} d={4} seed={133} />
      <Sh p={[[-25, -4], [-6, -4]]} open at={w(0, 'slept') + 4} d={0} w={6} seed={134} />
      <Sh p={[[8, -4], [28, -4]]} open at={w(0, 'slept') + 4} d={0} w={6} seed={135} /></G>
    <Sh p={rect(710, 630, 520, 70)} f={WW.olive} at={w(0, 'slept') + 2} d={0} seed={136} />
    <Zzz x={760} y={560} at={w(0, 'slept') + 6} />
    <PText x={960} y={950} at={w(0, 'open')} size={90} font="bang" color={PAL.yellow} anchor="middle">OPEN DECK</PText>
    <PText x={420} y={260} at={w(0, 'tropics')} size={80} font="bang" color={PAL.white} anchor="middle">TOO HOT BELOW</PText>
  </Board>
);

// S14 — lookout: binoculars, black water, four hours
export const S14: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HL} bg={NV.night}>
    <Waves y={760} at={b(0)} color="#10162B" amp={10} />
    <Soldier x={560} y={760} s={1.3} at={w(0, 'lookout')} hat="sailor" face="serious" arms="up" seed={141} />
    <Binoculars x={560} y={420} s={1.3} at={w(1, 'binoculars')} />
    <Arrow a={[700, 380]} b={[1300, 500]} at={w(1, 'stare')} bend={-40} c={PAL.yellow} seed={142} />
    <Clock x={1550} y={330} s={1.1} at={w(1, 'four')} spin={0.4} />
    <PText x={1550} y={530} at={w(1, 'four')} size={90} font="bang" color={PAL.white} anchor="middle">4 HOURS</PText>
  </Board>
);

// S15 — periscope, wake, shadow
export const S15: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HL} bg={NV.night}>
    <Waves y={700} at={b(0)} color="#10162B" amp={10} />
    <Periscope x={360} y={720} s={1.3} at={w(0, 'periscope')} />
    <Tx x={380} y={900} at={w(0, 'periscope')} size={70} c={PAL.yellow}>PERISCOPE</Tx>
    <Sh p={[[800, 760], [1000, 740], [1200, 760]]} open at={w(0, 'wake')} d={4} w={12} c={PAL.white} seed={151} />
    <Sh p={[[820, 800], [1000, 780], [1180, 800]]} open at={w(0, 'wake') + 2} d={4} w={8} c={PAL.white} seed={152} />
    <Tx x={1000} y={940} at={w(0, 'wake')} size={70} c={PAL.yellow}>WAKE</Tx>
    <Plane x={1600} y={300} s={0.8} at={w(0, 'shadow')} c="#000000" r={170} />
    <Tx x={1600} y={480} at={w(0, 'shadow')} size={70} c={PAL.yellow}>SHADOW</Tx>
  </Board>
);

// S16 — usually nothing; but one miss = everyone
export const S16: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HL} bg={NV.night}>
    <Waves y={700} at={b(0)} color="#10162B" amp={10} />
    <PText x={960} y={450} at={w(0, 'nothing')} size={150} font="bang" color={PAL.white} anchor="middle">NOTHING.</PText>
    <Soldier x={360} y={1060} s={1.1} at={b(0)} hat="sailor" face="worry" arms="down" seed={161} sweat />
    <PText x={1180} y={900} at={w(1, 'miss')} size={90} font="bang" color={PAL.red} anchor="middle" outline={PAL.white}>MISS ONE THING =</PText>
    <PText x={1180} y={1020} at={w(1, 'everyone')} size={90} font="bang" color={PAL.red} anchor="middle" outline={PAL.white}>EVERYONE PAYS</PText>
  </Board>
);

// S17 — title card: general quarters, alarm at dawn
export const S17: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.tan}>
    <Sun x={1500} y={760} s={1.3} at={w(0, 'dawn')} />
    <Sh p={rect(0, 760, 1920, 330)} f={NV.sea} at={b(0)} d={5} seed={171} />
    <Bell x={420} y={430} s={1.6} at={w(0, 'alarm')} />
    <PText x={1180} y={360} at={b(1)} size={170} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>GENERAL</PText>
    <PText x={1180} y={540} at={b(1) + 3} size={170} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>QUARTERS!</PText>
  </Board>
);

// S18 — every man runs to his station; why every morning?
export const S18: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const run = interpolate(f, [b(0), b(0) + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={HD}>
      <DeckGun x={1450} y={900} s={1} at={b(0)} />
      {[0, 1, 2].map((i) => (
        <Soldier key={i} x={200 + i * 220 + run * 500} y={980} s={0.75} at={b(0) + i * 3} hat="sailor" face="panic" legs="walk" arms="up" seed={181 + i * 10} />
      ))}
      <PText x={960} y={300} at={w(1, 'Why')} size={130} font="bang" color={PAL.red} anchor="middle">WHY EVERY MORNING?</PText>
    </Board>
  );
};

// S19 — first light = attack time
export const S19: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HD} bg={PAL.tan}>
    <Sun x={960} y={760} s={1.3} at={w(0, 'first')} />
    <Sh p={rect(0, 760, 1920, 330)} f={NV.sea} at={b(0)} d={5} seed={191} />
    <Periscope x={420} y={790} s={1.2} at={w(0, 'submarines')} />
    <Plane x={1450} y={300} s={0.8} at={w(0, 'planes')} r={165} c={PAL.black} />
    <Plane x={1680} y={420} s={0.6} at={w(0, 'planes') + 3} r={165} c={PAL.black} />
    <PText x={960} y={260} at={w(0, 'attack')} size={110} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>FIRST LIGHT = ATTACK TIME</PText>
  </Board>
);

// S20 — crew waits at the guns as the sun comes up (loop)
export const S20: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(b(0), b(0) + 150);
  return (
    <Board L={L} hdr={HD} bg={PAL.tan}>
      <Sun x={1500} y={760 - p * 280} s={1} at={w(0, 'sun')} />
      <Sh p={rect(0, 760, 1920, 330)} f={NV.sea} at={b(0)} d={5} seed={201} />
      <DeckGun x={560} y={800} s={1.1} at={b(0)} />
      {[0, 1].map((i) => <Soldier key={i} x={240 + i * 200} y={1000} s={0.8} at={w(0, 'crew') + i * 3} hat="sailor" face="serious" seed={202 + i * 10} />)}
      <PText x={1350} y={330} at={w(0, 'waits')} size={110} font="bang" anchor="middle">WAIT...</PText>
    </Board>
  );
};

// S21 — usually nothing happens; the sky stays empty
export const S21: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HD} bg={PAL.turq}>
    <Sh p={rect(0, 780, 1920, 310)} f={NV.sea} at={b(0)} d={5} seed={211} />
    <Soldier x={760} y={900} s={1.4} at={b(0)} hat="sailor" face="smirk" arms="shrug" seed={212} />
    <PText x={1400} y={420} at={w(0, 'nothing')} size={130} font="bang" anchor="middle">NOTHING</PText>
    <PText x={1400} y={600} at={w(1, 'empty')} size={100} font="bang" color={PAL.grey} anchor="middle">EMPTY SKY</PText>
    <Circle x={1400} y={250} rx={260} ry={120} at={w(1, 'empty')} />
  </Board>
);

// S22 — 300 tired men walk to breakfast
export const S22: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [b(0), b(0) + 90], [0, 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={HD}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Soldier key={i} x={150 + i * 260 + x} y={960} s={0.7} at={w(0, 'tired') + i * 2} hat="sailor" face="sad" legs="walk" seed={221 + i * 10} />
      ))}
      <Plate x={1680} y={700} s={1.2} at={w(0, 'breakfast')} />
      <PText x={1680} y={560} at={w(0, 'breakfast')} size={80} font="bang" anchor="middle">CHOW</PText>
      <PText x={700} y={300} at={w(0, 'alarm')} size={90} font="bang" color={PAL.green} anchor="middle">ALARM OFF</PText>
    </Board>
  );
};

// S23 — tomorrow again; at dusk too
export const S23: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HD}>
    <Sun x={520} y={520} s={0.9} at={b(0)} />
    <PText x={520} y={800} at={b(0)} size={90} font="bang" anchor="middle">DAWN GQ</PText>
    <Arrow a={[760, 420]} b={[1160, 420]} at={w(0, 'again')} bend={-60} seed={231} w={12} />
    <Arrow a={[1160, 680]} b={[760, 680]} at={w(1, 'dusk')} bend={-60} seed={233} w={12} />
    <Moon x={1400} y={520} s={1.3} at={w(1, 'dusk')} />
    <PText x={1400} y={800} at={w(1, 'dusk')} size={90} font="bang" anchor="middle">DUSK GQ</PText>
    <PText x={960} y={1000} at={w(0, 'again')} size={90} font="bang" color={PAL.red} anchor="middle">EVERY. SINGLE. DAY.</PText>
  </Board>
);

// S24 — crowded mess deck, eat fast with a steel tray
export const S24: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HB}>
    <Sh p={rect(160, 720, 1600, 40)} f={PAL.brown} at={w(0, 'mess')} d={5} seed={241} />
    {[0, 1, 2, 3].map((i) => <Soldier key={i} x={300 + i * 200} y={1040} s={0.6} at={w(0, 'crowded') + i * 2} hat="sailor" face="serious" seed={242 + i * 10} />)}
    <Soldier x={1400} y={1040} s={1} at={w(1, 'eat')} hat="sailor" face="panic" arms="eat" seed={290} />
    <G x={1400} y={690}><Sh p={rect(-180, -30, 360, 50)} f={PAL.lgrey} at={w(1, 'tray')} d={4} seed={291} /></G>
    <Label x={1700} y={420} to={[1560, 660]} at={w(1, 'tray')} size={60}>STEEL TRAY</Label>
    <PText x={500} y={330} at={w(0, 'crowded')} size={100} font="bang" anchor="middle">MESS DECK</PText>
    <Label x={1100} y={300} at={w(1, 'fast')} size={70}>FAST!</Label>
  </Board>
);

// S25 — coffee everywhere, no beer
export const S25: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HB}>
    <Mug x={560} y={600} s={2.6} at={w(0, 'Coffee')} />
    <PText x={560} y={970} at={w(0, 'day')} size={90} font="bang" anchor="middle">DAY + NIGHT</PText>
    <Bottle x={1420} y={560} s={1.6} at={w(1, 'beer')} />
    <XMark x={1420} y={560} s={3.2} at={w(1, 'beer') + 4} />
    <PText x={1420} y={930} at={w(1, 'beer')} size={90} font="bang" color={PAL.red} anchor="middle">NO BEER</PText>
  </Board>
);

// S26 — alcohol banned in 1914, so coffee = fuel
export const S26: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HB}>
    <Calendar x={420} y={540} s={1.6} at={w(0, 'nineteen')} top="U.S. NAVY" big="1914" />
    <PopAt at={w(0, 'banned')} x={420} y={840}><G x={420} y={840} r={-8}>
      <Sh p={rect(-200, -60, 400, 120)} at={w(0, 'banned')} d={0} c={PAL.red} w={10} seed={261} />
      <Tx y={34} at={w(0, 'banned')} size={100} font="bang" c={PAL.red}>BANNED</Tx>
    </G></PopAt>
    <Mug x={1400} y={620} s={2} at={b(1)} />
    <Label x={1400} y={300} to={[1400, 460]} at={w(1, 'fuel')} size={110}>FUEL</Label>
    <Soldier x={1760} y={1060} s={0.75} at={w(1, 'crew')} hat="sailor" face="grin" arms="eat" seed={262} />
  </Board>
);

// S27 — title card: the part no war movie shows — WORK
export const S27: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <G x={520} y={520}>
      <Sh p={rect(-330, -220, 660, 400)} f={PAL.black} at={w(0, 'movies')} d={5} seed={271} />
      <Sh p={rect(-300, -190, 600, 340)} f={PAL.white} at={w(0, 'movies') + 3} d={0} seed={272} />
    </G>
    <Hit x={520} y={500} at={w(0, 'movies') + 4} s={1.2} />
    <XMark x={520} y={500} s={4} at={w(0, 'nobody')} />
    <PText x={520} y={890} at={w(0, 'war')} size={70} font="bang" anchor="middle">WAR MOVIES</PText>
    <PText x={1420} y={640} at={b(1)} size={300} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>WORK</PText>
  </Board>
);
