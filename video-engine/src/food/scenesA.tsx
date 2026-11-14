// Scenes 1–25: hook, rules, #6 Japan, #5 Italy
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {
  G, Sh, Tx, PopAt, Circle, Arrow, Label, Check, XMark, Hit, Soldier, Plate, Bowl, Sack, Fish, Plum, Packet, Can, Biscuit,
  Glass, Bottle, Crate, ChocBar, Truck, CargoShip, Sub, Palm, Sea, Ground, Island, Blob, BarChart, TitleCard, Helmet, Calendar,
  Paper, Donkey, OldMan, WW
} from '../paint/Kit';

const H6 = '#6 JAPAN', H5 = '#5 ITALY';

// S1 — intro echoing the thumbnail (yellow board)
export const S1: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.yellow}>
    <PText x={60} y={250} at={w(0, 'chocolate')} size={190} font="bang" color={PAL.white} outline={PAL.black}>MADE</PText>
    <PText x={60} y={430} at={w(0, 'tasted')} size={170} font="bang" color={PAL.white} outline={PAL.black}>TO TASTE</PText>
    <PText x={60} y={680} at={w(0, 'potato')} size={260} font="bang" color={PAL.red} outline={PAL.black}>BAD</PText>
    <Soldier x={1500} y={1150} s={1.75} at={b(0)} hat="us" face="serious" arms="holdL" look={-1} seed={11}
      faceAt={[{at: w(0, 'potato'), face: 'worry'}, {at: b(1), face: 'disgust'}]} sweat />
    <ChocBar x={1000} y={650} s={1.15} at={w(0, 'chocolate')} />
    <Circle x={990} y={650} rx={300} ry={190} at={b(1) + 2} />
    <PopAt at={b(1)} x={1000} y={300}><G x={1000} y={300} r={-8}>
      <Sh p={rect(-260, -70, 520, 140)} at={b(1)} d={0} c={PAL.red} w={10} seed={15} />
      <Tx y={40} at={b(1)} size={110} font="bang" c={PAL.red}>ON PURPOSE</Tx>
    </G></PopAt>
    <Arrow a={[420, 780]} b={[700, 700]} at={b(1) + 6} bend={-60} seed={16} />
  </Board>
);

// S2 — hunger vs bullets, then the question
export const S2: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Soldier x={960} y={900} s={1.2} at={b(0)} hat="none" face="worry" arms="down" seed={21} />
    <G x={330} y={560}>
      {[0, 1, 2].map((i) => <Sh key={i} p={[[-20 + i * 70, -60], [10 + i * 70, -60], [10 + i * 70, 40], [-20 + i * 70, 40]]} f={PAL.yellow} at={w(0, 'bullets') + i * 2} d={0} seed={22 + i} />)}
      <Tx x={70} y={140} at={w(0, 'bullets')} size={64}>BULLETS</Tx>
    </G>
    <G x={1560} y={560}>
      {[[-90, 0], [0, 0], [90, 0], [-45, -70], [45, -70], [0, -140]].map(([a, c], i) => <Bowl key={i} x={a} y={c} s={0.45} at={w(0, 'hunger') + i * 2} seed={25 + i * 3} />)}
      <Tx y={110} at={w(0, 'disease')} size={58}>HUNGER + DISEASE</Tx>
    </G>
    <PopAt at={b(1)} x={960} y={250}><PText x={960} y={300} at={b(1)} size={220} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>?</PText></PopAt>
    <PText x={960} y={1030} at={w(1, 'best')} size={70} anchor="middle">WHO FED THEIR SOLDIERS BEST?</PText>
  </Board>
);

// S3 — title card: starving -> spoiled, three scores
export const S3: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <PText x={330} y={360} at={w(0, 'starving')} size={170} font="bang" color={PAL.red} anchor="middle">STARVING</PText>
    <Arrow a={[640, 300]} b={[1240, 300]} at={w(0, 'starving') + 4} seed={31} w={14} />
    <PText x={1590} y={360} at={w(0, 'spoiled')} size={170} font="bang" color={PAL.green} anchor="middle">SPOILED</PText>
    {[0, 1, 2, 3, 4, 5].map((i) => <Plate key={i} x={300 + i * 264} y={560} s={0.9} at={b(0) + 4 + i * 3} seed={33 + i * 2} />)}
    {[0, 1, 2].map((i) => (
      <PopAt key={i} at={b(1) + i * 5} x={660 + i * 300} y={830}><G x={660 + i * 300} y={830}>
        <Sh p={rect(-100, -100, 200, 200)} f={PAL.tan} at={b(1) + i * 5} d={0} seed={45 + i} />
        <Tx y={60} at={b(1) + i * 5} size={160} font="bang" c={PAL.red}>{String(i + 1)}</Tx>
      </G></PopAt>
    ))}
  </Board>
);

// S4 — the three scores
export const S4: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <G x={360} y={520}>
      <Paper x={0} y={0} at={b(0)} title="MENU" />
      <Tx y={260} at={w(0, 'paper')} size={64} c={PAL.red}>ON PAPER</Tx>
    </G>
    <G x={960} y={520}>
      <Sh p={[[-90, -60], [90, -60], [70, 80], [0, 110], [-70, 80]]} f={PAL.pink} at={b(1)} d={6} seed={51} />
      <Sh p={[[0, -40], [0, 60]]} open at={b(1) + 6} d={0} w={5} seed={52} />
      {[-70, 0, 70].map((a, i) => <Sh key={i} p={[[a, -110], [a + 15, -150], [a - 10, -190], [a + 10, -230]]} open at={b(1) + 8} d={0} c={PAL.green} w={8} seed={53 + i} />)}
      <Tx y={260} at={w(1, 'tasted')} size={64} c={PAL.red}>TASTE</Tx>
    </G>
    <G x={1560} y={520}>
      <Truck x={-60} y={-40} s={0.75} at={b(2)} />
      <Arrow a={[90, -40]} b={[170, -40]} at={b(2) + 6} seed={56} c={PAL.black} w={8} />
      <Soldier x={230} y={120} s={0.55} at={b(2) + 4} hat="us" face="worry" seed={57} />
      <Tx y={260} at={w(2, 'reach')} size={64} c={PAL.red}>DID IT ARRIVE?</Tx>
    </G>
    <Circle x={1560} y={560} rx={300} ry={300} at={w(2, 'big')} seed={58} />
  </Board>
);

// S5 — menu means nothing if the truck never arrives
export const S5: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const shake = Math.sin(f / 2) * 3;
  return (
    <Board L={L}>
      <Ground y={760} at={0} color={PAL.brown} seed={61} />
      <G x={300} y={520}>
        <Sh p={[[0, 240], [0, -40]]} open at={b(0)} d={4} w={12} c={PAL.brown} seed={62} />
        <Paper x={0} y={-150} s={0.7} at={b(0)} title="MENU" />
      </G>
      <G x={900 + shake} y={720}><Truck x={0} y={0} s={1.1} at={w(0, 'truck') - 6} spin /></G>
      {[0, 1, 2].map((i) => <Sh key={i} p={ell(780 + i * 230, 800, 40 + i * 6, 16, 10)} f={WW.bread} at={w(0, 'truck')} d={0} seed={63 + i} />)}
      <Soldier x={1650} y={760} s={1.1} at={b(0) + 4} hat="us" face="worry" arms="down" seed={66} faceAt={[{at: w(0, 'never'), face: 'sad'}]} />
      <PText x={1650} y={300} at={w(0, 'never')} size={110} font="bang" color={PAL.red} anchor="middle">NO FOOD</PText>
    </Board>
  );
};

// S6 — #6 title card
export const S6: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#6" title="IMPERIAL JAPANESE ARMY" size={120} at={b(0)} />
    <Soldier x={1650} y={1060} s={0.9} at={b(0) + 10} hat="jp" face="serious" seed={71} />
  </Board>
);

// S7 — empire 1942, can't feed the men
const ASIA: P[] = [[120, 140], [900, 140], [980, 300], [900, 420], [760, 520], [600, 640], [380, 700], [200, 560], [120, 360]];
const JAPAN: P[] = [[1080, 260], [1130, 220], [1170, 290], [1140, 400], [1090, 470], [1050, 430], [1090, 340]];
const EMPIRE: P[] = [[620, 220], [1240, 160], [1700, 420], [1600, 760], [1260, 880], [900, 820], [640, 640]];
export const S7: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    <Blob p={ASIA} f={PAL.lgrey} at={0} seed={72} />
    <Blob p={EMPIRE} f={PAL.tan} at={w(0, 'empire')} seed={73} />
    <Blob p={JAPAN} f={PAL.white} at={b(0)} seed={74} d={4} />
    <Tx x={1300} y={300} at={b(0)} size={90} font="bang" c={PAL.red}>1942</Tx>
    <Tx x={300} y={420} at={w(0, 'Asia')} size={60}>ASIA</Tx>
    <Tx x={1500} y={620} at={w(0, 'Pacific')} size={60}>PACIFIC</Tx>
    {[[800, 520], [1020, 680], [1300, 760], [1450, 520]].map(([x, y], i) => (
      <PopAt key={i} at={b(1) + i * 4} x={x} y={y}><G x={x} y={y}>
        <Soldier x={0} y={60} s={0.3} at={b(1) + i * 4} hat="jp" face="worry" seed={75 + i * 3} />
        <Sh p={ell(60, -100, 55, 40)} f={PAL.white} at={b(1) + i * 4} d={0} w={5} seed={90 + i} />
        <Bowl x={60} y={-95} s={0.3} at={b(1) + i * 4} seed={95 + i * 4} />
      </G></PopAt>
    ))}
  </Board>
);

// S8 — on paper the ration
export const S8: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    <Paper x={300} y={560} at={b(0)} title="ON PAPER" />
    <Soldier x={760} y={940} s={1.2} at={b(0) + 3} hat="jp" face="serious" seed={101} look={1} />
    <Sack x={1140} y={560} s={1.2} at={w(1, 'rice')} label="RICE" />
    <Fish x={1500} y={430} at={w(1, 'fish')} />
    <Plum x={1450} y={680} at={w(1, 'plums')} />
    <Packet x={1700} y={640} at={w(1, 'soy')} label="SOY" />
    <Tx x={1500} y={340} at={w(1, 'fish')} size={46} c={PAL.red}>DRIED FISH</Tx>
    <Tx x={1450} y={800} at={w(1, 'plums')} size={46} c={PAL.red}>PICKLED PLUM</Tx>
  </Board>
);

// S9 — light to carry; fatal flaw
export const S9: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [b(0), b(1)], [600, 900], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H6}>
      <Ground y={820} at={0} color={PAL.green} seed={110} />
      <G x={x} y={820}>
        <Sack x={-70} y={-200} s={0.6} at={b(0) + 4} />
        <Soldier x={0} y={0} s={1.1} at={b(0)} hat="jp" face="serious" legs="walk" seed={111} />
      </G>
      <Tx x={1300} y={420} at={w(0, 'days')} size={70} c={PAL.red}>SEVERAL DAYS OF FOOD</Tx>
      <Check x={1300} y={520} at={w(0, 'back')} s={1.4} />
      {f >= b(1) ? <Sh p={[[1100, 120], [1040, 300], [1140, 420], [1060, 620], [1160, 760], [1100, 1000]]} open at={b(1)} d={6} c={PAL.red} w={14} seed={112} /> : null}
      <PText x={1450} y={760} at={w(1, 'fatal')} size={140} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>FATAL FLAW</PText>
    </Board>
  );
};

// S10 — find food there; subs sink ships; islands run out
export const S10: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const sink = interpolate(f, [w(1, 'sank'), w(1, 'sank') + 50], [0, 160], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tilt = interpolate(f, [w(1, 'sank'), w(1, 'sank') + 50], [0, -16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bar = interpolate(f, [w(1, 'whole'), w(1, 'food')], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H6}>
      <Island x={420} y={520} at={b(0)} />
      <Palm x={460} y={500} s={0.8} at={b(0) + 4} />
      <Soldier x={260} y={500} s={0.55} at={b(0) + 2} hat="officer" face="serious" arms="point" seed={121} />
      <G x={300} y={180}>
        <Sh p={[[-170, -60], [230, -60], [230, 60], [10, 60], [-20, 100], [-30, 60], [-170, 60]]} f={PAL.white} at={w(0, 'find')} d={0} seed={122} />
        <Tx x={30} y={20} at={w(0, 'find')} size={52}>FIND FOOD THERE</Tx>
      </G>
      <Sea y={720} at={b(1)} seed={123} />
      <CargoShip x={1000} y={720} s={0.75} at={b(1)} sink={sink} tilt={tilt} />
      <Sea y={720} at={b(1)} seed={123} />
      <Sub x={1500} y={900} s={0.8} at={w(1, 'submarines')} />
      {f >= w(1, 'sank') + 10 ? [0, 1, 2].map((i) => {
        const r = ((f - w(1, 'sank') - 10 + i * 12) % 40) * 4;
        return <Sh key={i} p={ell(1000 + i * 40, 820 - r, 12 + i * 3, 12 + i * 3, 10)} at={w(1, 'sank')} d={0} c={PAL.white} w={5} seed={124 + i} />;
      }) : null}
      <G x={1650} y={300}>
        <Sh p={rect(-40, -150, 80, 300)} f={PAL.white} at={w(1, 'whole')} d={0} seed={128} />
        <Sh p={rect(-40, 150 - 300 * bar, 80, 300 * bar)} f={PAL.green} at={w(1, 'whole')} d={0} w={0.01} seed={129} />
        <Tx y={210} at={w(1, 'whole')} size={46}>FOOD</Tx>
        {bar <= 0.01 ? <Tx x={110} y={40} at={w(1, 'food')} size={110} font="bang" c={PAL.red}>0</Tx> : null}
      </G>
    </Board>
  );
};

// S11 — Guadalcanal = Starvation Island
export const S11: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    <Sea y={700} at={0} seed={130} />
    <Island x={960} y={700} s={2.2} at={b(0)} />
    <Palm x={1300} y={660} s={0.9} at={b(0) + 4} />
    {[700, 880, 1060].map((x, i) => <Soldier key={i} x={x} y={690} s={0.5} at={b(0) + 6 + i * 2} hat="jp" face="sad" legs="sit" seed={131 + i * 3} />)}
    <PText x={960} y={300} at={w(0, 'Guadalcanal')} size={90} anchor="middle">GUADALCANAL</PText>
    <PopAt at={w(1, 'Starvation')} x={960} y={280}>
      <Sh p={[[700, 270], [1220, 260]]} open at={w(1, 'Starvation')} d={4} c={PAL.red} w={12} seed={140} />
      <PText x={960} y={460} at={w(1, 'Starvation')} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>STARVATION ISLAND</PText>
    </PopAt>
  </Board>
);

// S12 — New Guinea: grass, roots
export const S12: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    <Ground y={800} at={0} color={PAL.green} seed={150} />
    <PText x={960} y={240} at={b(0)} size={90} anchor="middle">NEW GUINEA</PText>
    <Soldier x={700} y={800} s={1.3} at={b(0)} hat="jp" face="sad" legs="kneel" arms="hold" seed={151} />
    <G x={1150} y={520}>
      {[-40, -10, 20, 50].map((a, i) => <Sh key={i} p={[[a, 120], [a + (i - 1.5) * 18, -40]]} open at={w(0, 'grass')} d={3} c={PAL.green} w={12} seed={152 + i} />)}
      <Tx y={190} at={w(0, 'grass')} size={52} c={PAL.red}>GRASS</Tx>
    </G>
    <G x={1450} y={520}>
      <Sh p={[[0, -60], [10, 20], [-20, 80], [20, 130]]} open at={w(0, 'roots')} d={4} c={PAL.brown} w={16} seed={156} />
      <Sh p={[[10, 20], [60, 70]]} open at={w(0, 'roots')} d={4} c={PAL.brown} w={10} seed={157} />
      <Tx y={190} at={w(0, 'roots')} size={52} c={PAL.red}>ROOTS</Tx>
    </G>
    <G x={1720} y={560}>
      <Sh p={[[-70, 0], [-20, -24], [40, -20], [80, 0], [40, 18], [-20, 20]]} f={PAL.green} at={w(0, 'catch')} d={0} seed={158} />
      <Sh p={[[80, 0], [140, -10]]} open at={w(0, 'catch')} d={0} w={7} seed={159} />
      <Tx y={150} at={w(0, 'catch')} size={52} c={PAL.red}>ANYTHING</Tx>
    </G>
  </Board>
);

// S13 — the 19-year-old private (serious)
export const S13: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  return (
    <Board L={L} hdr={H6}>
      <Ground y={760} at={0} color={PAL.green} seed={160} />
      <Palm x={420} y={770} s={1.3} at={b(0)} />
      <Soldier x={600} y={770} s={1.25} at={b(0)} hat="jp" face="sad" legs="sit" seed={161} />
      <PText x={600} y={330} at={w(0, 'nineteen')} size={110} font="bang" color={PAL.red} anchor="middle">19</PText>
      <Sack x={900} y={740} s={0.9} at={b(1)} flat label="RICE" />
      <Tx x={1050} y={640} at={w(1, 'empty')} size={100} font="bang" c={PAL.red}>0</Tx>
      <G x={1430} y={420}>
        <Sh p={rect(-330, -200, 660, 400)} f={PAL.blue} at={b(2)} d={6} seed={162} />
        <Sh p={rect(-330, 140, 660, 60)} f={WW.sand} at={b(2) + 4} d={0} seed={163} />
        <CargoShip x={0} y={150} s={0.55} tilt={-25} at={b(2) + 4} />
        <Fish x={-200 + ((f - b(2)) % 120) * 3} y={-80} s={0.5} at={b(2) + 8} />
        <Tx y={-130} at={b(2) + 6} size={44} c={PAL.white}>SEA FLOOR</Tx>
      </G>
      <PText x={1430} y={960} at={b(3)} size={120} font="bang" color={PAL.red} anchor="middle">NOBODY IS COMING</PText>
    </Board>
  );
};

// S14 — ~60% not in battle (number card)
export const S14: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    <PText x={560} y={480} at={w(0, 'sixty')} size={300} font="bang" color={PAL.red} anchor="middle">~60%</PText>
    <Circle x={560} y={390} rx={330} ry={170} at={w(0, 'sixty') + 4} seed={170} />
    <PText x={560} y={680} at={w(0, 'battle')} size={80} anchor="middle">NOT IN BATTLE</PText>
    <PText x={560} y={150} at={w(0, 'Yoshida')} size={52} color={PAL.grey} anchor="middle">historian Yoshida Yutaka</PText>
    <BarChart x={1150} y={880} at={b(1)} bars={[{h: 220, c: PAL.grey, label: 'BATTLE'}, {h: 460, c: PAL.dred, label: 'HUNGER + DISEASE'}]} w={180} gap={140} size={46} />
    {[0, 1, 2, 3, 4].map((i) => <Helmet key={i} x={1170 + i * 120} y={1010} s={0.6} at={w(1, 'disease') + i * 2} seed={171 + i * 2} />)}
  </Board>
);

// S15 — Japan finishes last
export const S15: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H6}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <G key={i} x={330} y={180 + i * 150}>
        <Sh p={rect(-140, -55, 280, 110)} f={i === 5 ? PAL.tan : PAL.white} at={b(0) + i * 2} d={0} seed={180 + i} />
        <Tx x={-90} y={22} at={b(0) + i * 2} size={60} c={PAL.red}>{`#${i + 1}`}</Tx>
        {i === 5 ? <Tx x={50} y={22} at={w(0, 'last')} size={50}>JAPAN</Tx> : null}
      </G>
    ))}
    <Bowl x={1000} y={560} s={1.6} fill="rice" at={b(1)} />
    <Arrow a={[1200, 520]} b={[1640, 520]} at={w(1, 'million')} seed={190} />
    <Soldier x={1760} y={820} s={0.9} at={b(1) + 4} hat="jp" face="sad" seed={191} />
    <PopAt at={w(1, 'never')} x={1420} y={460}><XMark x={1420} y={500} at={w(1, 'never')} s={1.4} /></PopAt>
    <PText x={1420} y={760} at={w(1, 'never')} size={100} font="bang" color={PAL.red} anchor="middle">NEVER CAME</PText>
  </Board>
);

// S16 — some armies had food and hated it
export const S16: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const t = (f - b(1)) / 6;
  return (
    <Board L={L}>
      <Sh p={rect(500, 640, 920, 40)} f={PAL.brown} at={b(0)} d={6} seed={200} />
      <Plate x={960} y={610} s={1.2} at={b(0) + 3} />
      <Can x={960} y={520} s={0.6} at={b(0) + 6} label="?" />
      <Soldier x={1400} y={1000} s={1.25} at={b(0)} hat="none" face="serious" arms="holdL" seed={201}
        faceAt={[{at: w(1, 'hated'), face: 'disgust'}]} cheeks={f >= w(1, 'hated') ? PAL.lgreen : undefined} />
      {f >= b(1) ? [-50, 0, 50].map((a, i) => (
        <Sh key={i} p={[[960 + a, 420], [960 + a + 14 * Math.sin(t + i), 370], [960 + a - 12 * Math.sin(t + i), 320], [960 + a + 8, 270]]} open at={b(1)} d={0} c={PAL.green} w={9} seed={202 + i} />
      )) : null}
      <PText x={1600} y={420} at={w(1, 'hated')} size={130} font="bang" color={PAL.red}>?!</PText>
    </Board>
  );
};

// S17 — #5 title card
export const S17: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#5" title="ITALY" size={200} at={b(0)} />
    <Soldier x={1500} y={1060} s={0.95} at={b(0) + 8} hat="it" face="worry" seed={211} />
  </Board>
);

// S18 — desert: galletta + boiled beef
export const S18: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5} bg={WW.sand}>
    <Sh p={ell(1700, 220, 90, 90)} f={PAL.yellow} at={0} d={6} seed={220} />
    <Soldier x={600} y={1000} s={1.35} at={b(0)} hat="it" face="worry" arms="hold" seed={221} faceAt={[{at: w(0, 'hard'), face: 'shock'}]} />
    <Biscuit x={860} y={520} at={w(0, 'biscuit')} />
    <Hit x={900} y={470} at={w(0, 'galletta')} s={0.6} />
    <PText x={860} y={700} at={w(0, 'galletta')} size={64} color={PAL.red} anchor="middle">GALLETTA</PText>
    <Can x={1350} y={640} s={0.9} at={w(0, 'tins')} label="BEEF" />
    <PText x={1350} y={860} at={w(0, 'boiled')} size={58} color={PAL.red} anchor="middle">BOILED BEEF</PText>
  </Board>
);

// S19 — A M = Military Administration
export const S19: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5}>
    <Can x={960} y={560} s={2} at={b(0)} label="A M" size={80} />
    <Label x={420} y={300} to={[860, 520]} at={w(0, 'A', 1)} size={60}>AMMINISTRAZIONE</Label>
    <Label x={1500} y={300} to={[1060, 520]} at={w(0, 'M')} size={60}>MILITARE</Label>
    <PText x={960} y={960} at={w(0, 'Military')} size={70} anchor="middle">= MILITARY ADMINISTRATION</PText>
  </Board>
);

// S20 — Asino Morto = dead donkey
export const S20: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5}>
    <Can x={960} y={680} s={1.3} at={0} label="A M" />
    <Soldier x={420} y={1000} s={1.3} at={b(0)} hat="it" face="suspicious" look={1} seed={231} />
    <G x={560} y={260}>
      <Sh p={[[-230, -70], [230, -70], [230, 70], [-40, 70], [-80, 120], [-90, 70], [-230, 70]]} f={PAL.white} at={w(1, 'Asino')} d={0} seed={232} />
      <Tx y={22} at={w(1, 'Asino')} size={66}>ASINO MORTO</Tx>
    </G>
    <PopAt at={b(2)} x={1450} y={460}><Donkey x={1450} y={540} s={1.2} at={b(2)} /></PopAt>
    <PText x={1450} y={900} at={b(2)} size={110} font="bang" color={PAL.red} anchor="middle">DEAD DONKEY?!</PText>
  </Board>
);

// S21 — Alter Mann = old man
export const S21: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5}>
    <Soldier x={500} y={1000} s={1.3} at={b(0)} hat="afrika" face="smirk" arms="hold" seed={241} />
    <Tx x={500} y={300} at={b(0) + 6} size={52} c={PAL.grey}>GERMAN SOLDIER</Tx>
    <Can x={830} y={640} s={0.9} at={b(0) + 4} label="A M" />
    <G x={1250} y={280}>
      <Sh p={[[-220, -70], [220, -70], [220, 70], [-40, 70], [-80, 120], [-90, 70], [-220, 70]]} f={PAL.white} at={b(1)} d={0} seed={242} />
      <Tx y={22} at={b(1)} size={70}>ALTER MANN</Tx>
    </G>
    <PopAt at={b(2)} x={1400} y={700}><OldMan x={1400} y={980} s={1.0} at={b(2)} /></PopAt>
    <PText x={1500} y={480} at={b(2)} size={96} font="bang" color={PAL.red} anchor="middle">OLD MAN</PText>
  </Board>
);

// S22 — same food, day after day (calendar flips)
export const S22: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const day = Math.max(1, Math.floor((f - b(0)) / 18) + 1);
  return (
    <Board L={L} hdr={H5} bg={WW.sand}>
      <Sh p={ell(1700, 220, 90, 90)} f={PAL.yellow} at={0} d={0} seed={250} />
      <Calendar x={500} y={480} s={1.4} at={b(0)} top="DAY" big={String(Math.min(day, 99))} />
      <Can x={950} y={560} s={0.8} at={w(0, 'beef')} label="BEEF" />
      <Biscuit x={1200} y={560} s={0.8} at={w(0, 'biscuits')} />
      <Soldier x={1600} y={1000} s={1.2} at={b(0) + 4} hat="it" face="worry" seed={251} faceAt={[{at: w(0, 'day'), face: 'sad'}]} />
      <PText x={1080} y={860} at={w(0, 'day', 1)} size={110} font="bang" color={PAL.red} anchor="middle">AGAIN...</PText>
    </Board>
  );
};

// S23 — fewer trucks; food moves slowly
export const S23: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const crawl = interpolate(f, [b(1), L], [0, 160], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H5}>
      <Tx x={420} y={250} at={w(0, 'Italian')} size={70}>ITALY</Tx>
      <Truck x={420} y={420} s={0.6} at={w(0, 'fewer')} />
      <Tx x={1380} y={250} at={w(0, 'British')} size={70}>BRITAIN</Tx>
      {[[1180, 380], [1420, 380], [1660, 380], [1180, 540], [1420, 540], [1660, 540]].map(([x, y], i) => <Truck key={i} x={x} y={y} s={0.45} at={w(0, 'British') + i * 2} color={WW.khaki} />)}
      <Sh p={[[0, 860], [1920, 860]]} open at={b(1)} d={6} w={8} seed={260} c={PAL.grey} />
      <G x={300 + crawl} y={840}><Truck x={0} y={0} s={0.55} at={b(1)} /><Crate x={-40} y={-140} s={0.3} at={b(1) + 4} /></G>
      <G x={1500} y={800}>
        <Sh p={ell(0, 0, 50, 40)} f={PAL.tan} at={w(1, 'slowly')} d={0} seed={261} />
        <Sh p={[[-70, 40], [80, 40], [90, 20]]} open at={w(1, 'slowly')} d={0} w={8} seed={262} />
        <Sh p={[[60, 30], [70, -30], [90, -40]]} open at={w(1, 'slowly')} d={0} w={6} seed={263} />
      </G>
      <PText x={1500} y={720} at={w(1, 'slowly')} size={100} font="bang" color={PAL.red} anchor="middle">SLOW</PText>
    </Board>
  );
};

// S24 — wine ration
export const S24: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5}>
    <Soldier x={600} y={1000} s={1.4} at={b(0)} hat="it" face="worry" legs="sit" seed={271} faceAt={[{at: w(1, 'wine'), face: 'grin'}]} />
    <Sh p={rect(820, 760, 520, 30)} f={PAL.brown} at={b(0) + 4} d={4} seed={272} />
    <Bottle x={980} y={640} at={w(1, 'wine')} />
    <Glass x={1180} y={700} s={0.9} at={w(1, 'wine') + 3} />
    <PText x={1080} y={420} at={w(1, 'daily')} size={90} font="bang" color={PAL.red} anchor="middle">DAILY WINE</PText>
  </Board>
);

// S25 — Italy above Japan; what the next army poured
export const S25: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H5}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <G key={i} x={330} y={180 + i * 150}>
        <Sh p={rect(-140, -55, 280, 110)} f={i >= 4 ? PAL.tan : PAL.white} at={0} d={0} seed={280 + i} />
        <Tx x={-90} y={22} at={0} size={60} c={PAL.red}>{`#${i + 1}`}</Tx>
        {i === 5 ? <Tx x={50} y={22} at={0} size={50}>JAPAN</Tx> : null}
        {i === 4 ? <Tx x={50} y={22} at={b(0) + 4} size={50}>ITALY</Tx> : null}
      </G>
    ))}
    <Glass x={900} y={620} s={0.8} at={b(1)} />
    <PText x={900} y={800} at={b(1)} size={52} anchor="middle">WINE</PText>
    <G x={1500} y={560}>
      <Sh p={[[-120, -200], [120, -200], [150, 220], [-150, 220]]} f={PAL.white} at={w(1, 'next')} d={6} seed={290} />
      <Sh p={[[-130, -40], [130, -40], [150, 220], [-150, 220]]} f={PAL.turq} at={w(1, 'poured')} d={0} w={5} seed={291} />
      <Tx y={-260} at={w(1, 'poured')} size={150} font="bang" c={PAL.red}>?</Tx>
    </G>
  </Board>
);
