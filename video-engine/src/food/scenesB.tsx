// Scenes 26–50: #4 Soviet Union, #3 Germany, start of #2 Britain
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {
  G, Sh, Tx, PopAt, Arrow, Label, Check, XMark, Soldier, Plate, Bowl, Can, Biscuit, Loaf, Crusts, Glass, Crate, Mug,
  Truck, CargoShip, Ground, Blob, TitleCard, Calendar, Paper, Padlock, Bars, FieldKitchen, Horse, Snow, Packet, along,
} from '../paint/Kit';

const H4 = '#4 SOVIET UNION', H3 = '#3 GERMANY', H2 = '#2 BRITAIN';

const Ladder: React.FC<{at: number; filled: Record<number, string>; hi?: number; hiAt?: number}> = ({at, filled, hi, hiAt = 0}) => (
  <g>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <G key={i} x={330} y={180 + i * 150}>
        <Sh p={rect(-140, -55, 280, 110)} f={filled[i + 1] ? PAL.tan : PAL.white} at={i + 1 === hi ? hiAt : at} d={0} seed={700 + i} />
        <Tx x={-90} y={22} at={at} size={60} c={PAL.red}>{`#${i + 1}`}</Tx>
        {filled[i + 1] ? <Tx x={50} y={22} at={i + 1 === hi ? hiAt : at} size={filled[i + 1].length > 7 ? 38 : 50}>{filled[i + 1]}</Tx> : null}
      </G>
    ))}
  </g>
);

// S26 — #4 title card
export const S26: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#4" title="SOVIET RED ARMY" size={150} at={b(0)} />
    <Soldier x={1650} y={1060} s={0.9} at={b(0) + 10} hat="ru" face="serious" seed={301} />
  </Board>
);

// S27 — built on one thing: bread
export const S27: React.FC<SP> = ({b, L}) => (
  <Board L={L} hdr={H4}>
    <Snow at={0} n={30} seed={2} />
    <Soldier x={600} y={1000} s={1.4} at={b(0)} hat="ru" face="serious" seed={311} faceAt={[{at: b(1), face: 'grin'}]} />
    <PopAt at={b(1)} x={1250} y={620}><Loaf x={1250} y={620} s={2.2} at={b(1)} /></PopAt>
    <PText x={1250} y={380} at={b(1)} size={150} font="bang" color={PAL.red} anchor="middle">BREAD</PText>
  </Board>
);

// S28 — 800 g, winter 900 g
export const S28: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const ang = interpolate(f, [w(0, 'eight'), w(0, 'eight') + 10, b(1), b(1) + 10], [-80, 20, 20, 50], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rad = (ang * Math.PI) / 180;
  return (
    <Board L={L} hdr={H4}>
      {f >= b(1) ? <Snow at={b(1)} n={30} seed={3} /> : null}
      <Calendar x={360} y={460} s={1.3} at={w(0, 'September')} top="SEPT" big="1941" size={80} />
      <G x={1150} y={600}>
        <Sh p={[[-170, 160], [-140, -60], [140, -60], [170, 160]]} f={PAL.lgrey} at={b(0)} d={6} seed={320} />
        <Sh p={ell(0, -40, 150, 150).slice(8, 22)} open at={b(0) + 6} d={0} w={6} seed={321} />
        <Sh p={[[0, -40], [Math.sin(rad) * 120, -40 - Math.cos(rad) * 120]]} open at={b(0) + 6} d={0} c={PAL.red} w={9} seed={322} />
        <Loaf x={0} y={-230} s={1} at={w(0, 'rye')} />
      </G>
      <PText x={1600} y={500} at={w(0, 'eight')} size={150} font="bang" color={PAL.red} anchor="middle">800 g</PText>
      <PText x={1600} y={720} at={w(1, 'nine')} size={150} font="bang" color={PAL.dblue} anchor="middle">900 g</PText>
      <PText x={1600} y={820} at={w(1, 'winter')} size={60} anchor="middle">IN WINTER</PText>
    </Board>
  );
};

// S29 — almost a kilo; cheap, filling, bake anywhere
export const S29: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H4}>
    <Soldier x={480} y={1000} s={1.3} at={b(0)} hat="ru" face="worry" arms="hold" sweat seed={331} />
    <Loaf x={720} y={720} s={1.5} at={b(0) + 3} />
    <PText x={600} y={330} at={w(0, 'kilo')} size={100} font="bang" color={PAL.red} anchor="middle">~1 KG / DAY</PText>
    {[['CHEAP', 'cheap'], ['FILLING', 'filling'], ['BAKE ANYWHERE', 'baked']].map(([t, k], i) => (
      <G key={i} x={1400} y={330 + i * 230}>
        <Check x={-260} y={-20} at={w(1, k)} s={1.2} />
        <Tx x={-180} y={10} a="start" at={w(1, k)} size={80}>{t}</Tx>
      </G>
    ))}
  </Board>
);

// S30 — dried crusts, soak and chew
export const S30: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  return (
    <Board L={L} hdr={H4}>
      <Crusts x={500} y={520} s={1.5} at={w(0, 'crusts')} />
      <PText x={500} y={760} at={w(0, 'crusts')} size={64} color={PAL.red} anchor="middle">DRIED CRUSTS</PText>
      <Calendar x={500} y={300} s={0.7} at={w(0, 'weeks')} big="WEEKS" size={56} />
      <Soldier x={1250} y={1000} s={1.4} at={b(1)} hat="ru" face="serious" arms="eat" seed={341} faceAt={[{at: w(1, 'chewed'), face: 'worry'}]} />
      <Mug x={1560} y={760} at={w(1, 'tea')} />
      {f >= w(1, 'chewed') ? (
        <g transform={`translate(0,${Math.sin(f / 2) * 6})`}>
          <PText x={1500} y={420} at={w(1, 'chewed')} size={70} color={PAL.red} anchor="middle">CHEW CHEW CHEW</PText>
        </g>
      ) : null}
    </Board>
  );
};

// S31 — famous extra: 100 g vodka
export const S31: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H4}>
    <Soldier x={600} y={1000} s={1.4} at={b(0)} hat="ru" face="serious" seed={351} faceAt={[{at: w(1, 'vodka'), face: 'shock'}]} />
    <PopAt at={b(0) + 8} x={600} y={300}><G x={600} y={300}><Sh p={rect(-200, -60, 400, 120)} f={PAL.red} at={b(0) + 8} d={0} seed={352} /><Tx y={30} at={b(0) + 8} size={80} font="bang" c={PAL.white}>+ EXTRA</Tx></G></PopAt>
    <Glass x={1250} y={620} s={1.6} at={w(1, 'vodka')} drink={PAL.turq} />
    <PText x={1250} y={380} at={w(1, 'hundred')} size={110} font="bang" color={PAL.red} anchor="middle">100 g / DAY</PText>
    <PText x={1250} y={900} at={w(1, 'vodka')} size={70} anchor="middle">VODKA</PText>
  </Board>
);

// S32 — biggest surprise came from America
export const S32: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [w(0, 'surprise'), w(0, 'surprise') + 20], [0, -140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H4}>
      <G x={960} y={720}>
        <Sh p={[[-220, -60], [220, -60], [190, 120], [-190, 120]]} f={PAL.lgrey} at={b(0)} d={6} seed={360} />
        <G x={0} y={-70} r={f >= w(0, 'surprise') ? -35 : 0}><Sh p={rect(-230, -20, 460, 30)} f={PAL.grey} at={b(0) + 4} d={0} seed={361} /></G>
      </G>
      <PText x={960} y={560 + rise} at={w(0, 'surprise')} size={220} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>?</PText>
      <PText x={960} y={1000} at={w(0, 'America')} size={80} anchor="middle">FROM AMERICA</PText>
    </Board>
  );
};

// S33 — Lend-Lease: cans across the sea
const USA: P[] = [[120, 360], [560, 320], [640, 420], [600, 640], [430, 700], [240, 660], [120, 520]];
const USSR: P[] = [[1100, 200], [1820, 180], [1860, 420], [1600, 520], [1260, 560], [1100, 440]];
export const S33: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const path: P[] = [[600, 520], [900, 760], [1200, 640], [1300, 500]];
  const t = ((f - w(0, 'shipped')) % 60) / 60;
  const [px, py] = along(path, t);
  return (
    <Board L={L} hdr={H4}>
      <Sh p={rect(560, 640, 800, 300)} f={PAL.turq} at={0} d={0} seed={370} />
      <Blob p={USA} f={PAL.lgrey} at={b(0)} seed={371} />
      <Blob p={USSR} f={PAL.lgrey} at={b(0) + 3} seed={372} />
      <Tx x={380} y={520} at={w(0, 'United')} size={60}>USA</Tx>
      <Tx x={1480} y={380} at={w(0, 'Soviet')} size={60}>USSR</Tx>
      <PShape2 path={path} at={w(0, 'shipped')} />
      {f >= w(0, 'shipped') ? <G x={px} y={py}><CargoShip x={0} y={0} s={0.25} at={w(0, 'shipped')} /></G> : null}
      {[0, 1, 2].map((i) => <Can key={i} x={1250 + i * 120} y={820} s={0.5} at={w(0, 'canned') + i * 3} label="MEAT" size={44} />)}
    </Board>
  );
};
const PShape2: React.FC<{path: P[]; at: number}> = ({path, at}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return <Sh p={path} open at={at} d={10} c={PAL.red} w={8} seed={373} />;
};

// S34 — the second front
export const S34: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H4}>
    <Soldier x={560} y={1000} s={1.4} at={b(0)} hat="ru" face="smirk" arms="hold" seed={381} />
    <Can x={860} y={640} s={0.9} at={b(0) + 4} label="MEAT" band={PAL.white} color={PAL.lgrey} />
    {[0, 1, 2].map((i) => <Sh key={i} p={rect(800, 560 + i * 28, 120, 12)} f={i % 2 ? PAL.white : PAL.red} at={b(0) + 8} d={0} w={2} seed={382 + i} />)}
    <PText x={1380} y={430} at={w(0, 'sarcastic')} size={64} color={PAL.grey} anchor="middle">NICKNAME:</PText>
    <PText x={1380} y={620} at={w(1, 'second')} size={130} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>"THE SECOND</PText>
    <PText x={1380} y={760} at={w(1, 'front')} size={130} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>FRONT"</PText>
  </Board>
);

// S35 — cans arrive years before soldiers land in France
export const S35: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H4}>
    <Sh p={[[200, 600], [1720, 600]]} open at={b(0)} d={8} w={10} seed={390} />
    {['1941', '1942', '1943', '1944'].map((y, i) => (
      <g key={i}>
        <Sh p={[[260 + i * 460, 580], [260 + i * 460, 620]]} open at={b(0) + i * 2} d={0} w={8} seed={391 + i} />
        <Tx x={260 + i * 460} y={690} at={b(0) + i * 2} size={60}>{y}</Tx>
      </g>
    ))}
    <Can x={260} y={460} s={0.6} at={w(0, 'cans')} label="MEAT" size={44} />
    <Tx x={420} y={430} a="start" at={w(0, 'Russia')} size={56} c={PAL.red}>CANS IN RUSSIA</Tx>
    <Soldier x={1640} y={540} s={0.6} at={w(0, 'soldiers')} hat="us" face="serious" seed={396} />
    <Tx x={1640} y={790} at={w(0, 'France')} size={52}>JUNE 1944, FRANCE</Tx>
    <Arrow a={[400, 850]} b={[1500, 850]} at={w(0, 'long')} seed={397} w={12} />
    <PText x={950} y={960} at={w(0, 'long')} size={90} font="bang" color={PAL.red} anchor="middle">YEARS LATER</PText>
  </Board>
);

// S36 — Red Army in the middle
export const S36: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H4}>
    <Ladder at={0} filled={{6: 'JAPAN', 5: 'ITALY', 4: 'USSR'}} hi={4} hiAt={b(0) + 4} />
    <Plate x={1180} y={700} s={2.4} at={b(1)} />
    <Loaf x={1000} y={600} s={0.9} at={w(1, 'bread')} />
    <Glass x={1220} y={600} s={0.6} at={w(1, 'vodka')} drink={PAL.turq} />
    <Can x={1400} y={600} s={0.55} at={w(1, 'borrowed')} label="USA" size={44} />
    <PText x={1400} y={420} at={w(1, 'borrowed')} size={70} color={PAL.red} anchor="middle">BORROWED</PText>
    <Arrow a={[1400, 440]} b={[1400, 500]} at={w(1, 'borrowed') + 2} seed={400} />
  </Board>
);

// S37 — enemy's precious ration: don't eat
export const S37: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Crate x={960} y={600} s={1.3} at={b(0)} />
    {[-1, 1].map((d, i) => <Sh key={i} p={[[960 - 220 * d, 420], [960 + 220 * d, 780]]} open at={w(0, 'precious')} d={4} c={PAL.grey} w={16} seed={410 + i} />)}
    <Padlock x={960} y={600} s={1.2} at={w(0, 'precious')} />
    <PText x={960} y={300} at={w(0, 'punished')} size={120} font="bang" color={PAL.red} anchor="middle">DON'T EAT!</PText>
    <Soldier x={1550} y={1000} s={1.2} at={b(0) + 4} hat="de" face="worry" seed={413} look={-1} faceAt={[{at: w(0, 'punished'), face: 'shock'}]} />
  </Board>
);

// S38 — #3 title card
export const S38: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#3" title="GERMAN ARMY" sub="the Wehrmacht" size={170} at={b(0)} />
    <Soldier x={1650} y={1060} s={0.9} at={b(0) + 10} hat="de" face="serious" seed={421} />
  </Board>
);

// S39 — the iron portion
export const S39: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Soldier x={600} y={1000} s={1.5} at={b(0)} hat="de" face="serious" seed={431} />
    <G x={760} y={800}><Sh p={[[-60, -50], [60, -50], [70, 60], [-70, 60]]} f={PAL.grey} at={w(0, 'emergency')} d={5} seed={432} /></G>
    <Label x={1300} y={520} to={[830, 780]} at={w(0, 'iron')} size={90}>IRON PORTION</Label>
    <PText x={1300} y={700} at={w(0, 'emergency')} size={64} color={PAL.grey} anchor="middle">EMERGENCY RATION</PText>
  </Board>
);

// S40 — contents
export const S40: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Biscuit x={300} y={520} s={0.9} at={w(0, 'biscuits')} />
    <Can x={640} y={520} s={0.8} at={w(0, 'meat')} label="MEAT" />
    <Packet x={960} y={520} s={1.2} at={w(0, 'vegetables')} label="VEG" color={PAL.lgreen} />
    <Packet x={1270} y={520} s={1.2} at={w(0, 'coffee')} label="COFFEE" color={PAL.brown} />
    <Packet x={1580} y={520} s={1.2} at={w(0, 'salt')} label="SALT" color={PAL.white} />
    {[['BISCUITS', 300, 'biscuits'], ['MEAT', 640, 'meat'], ['DRIED VEG', 960, 'vegetables'], ['COFFEE', 1270, 'coffee'], ['SALT', 1580, 'salt']].map(([t, x, k], i) => (
      <PText key={i} x={x as number} y={760} at={w(0, k as string)} size={52} color={PAL.red} anchor="middle">{t as string}</PText>
    ))}
  </Board>
);

// S41 — only on the commander's order; arrest
export const S41: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Soldier x={420} y={1000} s={1.3} at={b(0)} hat="officer" face="serious" arms="point" seed={441} />
    <PText x={420} y={330} at={w(0, 'commander')} size={110} font="bang" color={PAL.red} anchor="middle">NO!</PText>
    <Soldier x={900} y={1000} s={1.2} at={b(0) + 3} hat="de" face="worry" arms="hold" seed={442} faceAt={[{at: b(1), face: 'shock'}]} />
    <Bars x={1500} y={560} s={1.2} at={b(1)} />
    <Soldier x={1500} y={780} s={0.6} at={w(1, 'locked')} hat="de" face="sad" seed={443} />
    <Bars x={1500} y={560} s={1.2} at={b(1)} />
    <PText x={1500} y={900} at={w(1, 'locked')} size={90} font="bang" color={PAL.red} anchor="middle">ARREST</PText>
  </Board>
);

// S42 — field kitchens = goulash cannons
export const S42: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Ground y={880} at={0} color={PAL.lgrey} seed={450} />
    <FieldKitchen x={800} y={830} s={1.2} at={b(0)} cannon={w(1, 'goulash')} />
    <Soldier x={1350} y={880} s={1.1} at={b(0) + 4} hat="de" face="grin" arms="hold" seed={451} />
    <Bowl x={1520} y={700} s={0.6} fill="soup" at={b(0) + 8} />
    <PText x={1300} y={300} at={w(1, 'goulash')} size={120} font="bang" color={PAL.red} anchor="middle">"GOULASH CANNON"</PText>
  </Board>
);

// S43 — supply chain breaks in Russia
export const S43: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <G x={330} y={420}><Sh p={rect(-150, -60, 300, 120)} f={PAL.grey} at={w(1, 'trains')} d={5} seed={460} /><Sh p={ell(-80, 70, 30, 30)} f={PAL.black} at={w(1, 'trains')} d={0} seed={461} /><Sh p={ell(80, 70, 30, 30)} f={PAL.black} at={w(1, 'trains')} d={0} seed={462} /><Tx y={14} at={w(1, 'trains')} size={50} c={PAL.white}>TRAIN</Tx></G>
    <Truck x={960} y={440} s={0.75} at={w(1, 'trucks')} />
    <Horse x={1580} y={500} s={0.7} at={w(1, 'horses')} />
    {[330, 960, 1580].map((x, i) => <Check key={i} x={x} y={200} at={b(0) + 3 + i * 3} s={1.3} />)}
    <Sh p={[[-40, 700], [1960, 700], [1960, 1120], [-40, 1120]]} f={PAL.white} at={w(1, 'Russia')} d={0} seed={463} />
    <Snow at={w(1, 'Russia')} n={36} seed={5} />
    <PText x={960} y={860} at={w(1, 'Russia')} size={110} font="bang" color={PAL.dblue} anchor="middle">RUSSIA: MUD + SNOW</PText>
    {[330, 960, 1580].map((x, i) => <XMark key={i} x={x} y={430} at={w(1, 'three') + i * 3} s={2} seed={464 + i * 2} />)}
  </Board>
);

// S44 — Stalingrad pocket; horses
export const S44: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Blob p={[[200, 200], [1100, 180], [1200, 600], [900, 900], [300, 880]]} f={PAL.lgrey} at={0} seed={470} />
    <Sh p={ell(650, 540, 150, 120)} f={PAL.grey} at={b(0)} d={6} seed={471} />
    <Tx x={650} y={330} at={w(0, 'Stalingrad')} size={70} c={PAL.red}>STALINGRAD</Tx>
    {Array.from({length: 8}, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const x = 650 + Math.cos(a) * 300, y = 540 + Math.sin(a) * 250;
      return <Arrow key={i} a={[x, y]} b={[650 + Math.cos(a) * 180, 540 + Math.sin(a) * 150]} at={w(0, 'trapped') + i} seed={472 + i * 2} />;
    })}
    <Tx x={650} y={560} at={w(0, 'Sixth')} size={44} c={PAL.white}>6TH ARMY</Tx>
    <Horse x={1450} y={760} s={1} at={w(0, 'horses')} lying />
    <PText x={1550} y={480} at={w(0, 'horses')} size={70} color={PAL.red} anchor="middle">NO FOOD LEFT</PText>
  </Board>
);

// S45 — Christmas 1942: horsemeat soup (serious)
export const S45: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Snow at={0} n={50} seed={7} />
    <Calendar x={350} y={360} s={1.1} at={w(0, 'Christmas')} top="DEC 25" big="1942" size={70} />
    <Soldier x={900} y={1000} s={1.5} at={b(0)} hat="de" face="sad" arms="hold" seed={481} />
    <Bowl x={1150} y={720} s={0.9} fill="soup" at={w(0, 'soup')} />
    <PText x={1450} y={600} at={w(0, 'horsemeat')} size={70} color={PAL.red} anchor="middle">HORSEMEAT SOUP</PText>
    <PText x={1450} y={420} at={w(0, 'frozen')} size={60} color={PAL.dblue} anchor="middle">FROZEN FINGERS</PText>
  </Board>
);

// S46 — Germany third; plan collapsed
export const S46: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H3}>
    <Ladder at={0} filled={{6: 'JAPAN', 5: 'ITALY', 4: 'USSR', 3: 'GERMANY'}} hi={3} hiAt={b(0) + 4} />
    <G x={1150} y={360}><Paper x={0} y={0} s={0.7} at={b(1)} title="PLAN" /><Check x={130} y={-80} at={w(1, 'brilliant')} s={1.3} /></G>
    <Sh p={[[800, 760], [1400, 760]]} open at={w(1, 'collapsed')} d={6} w={12} seed={490} />
    <Sh p={[[1400, 760], [1440, 800], [1420, 1080]]} open at={w(1, 'collapsed')} d={4} w={8} seed={491} />
    <PText x={1300} y={920} at={w(1, 'roads')} size={100} font="bang" color={PAL.red} anchor="middle">COLLAPSED</PText>
  </Board>
);

// S47 — one wooden box
export const S47: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Soldier x={600} y={1000} s={1.4} at={b(0)} hat="uk" face="worry" arms="shrug" seed={501} faceAt={[{at: w(1, 'box'), face: 'grin'}]} />
    <PText x={600} y={330} at={b(0) + 6} size={150} font="bang" color={PAL.red} anchor="middle">?</PText>
    <PopAt at={w(1, 'packed')} x={1300} y={640}><Crate x={1300} y={640} s={1.5} at={w(1, 'packed')} label="1 DAY" /></PopAt>
  </Board>
);

// S48 — #2 title card
export const S48: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#2" title="BRITISH ARMY" size={170} at={b(0)} />
    <Soldier x={1650} y={1060} s={0.9} at={b(0) + 10} hat="uk" face="grin" seed={511} />
  </Board>
);

// S49 — compo
export const S49: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <Crate x={960} y={600} s={1.8} at={b(0)} label={undefined} />
    <G x={1500} y={300} r={8}><Sh p={rect(-190, -50, 380, 100)} f={PAL.white} at={w(0, 'secret')} d={0} c={PAL.red} seed={520} /><Tx y={22} at={w(0, 'secret')} size={60} c={PAL.red}>SECRET WEAPON</Tx></G>
    <PText x={960} y={640} at={w(1, 'compo')} size={150} font="bang" color={PAL.black} anchor="middle">COMPO</PText>
  </Board>
);

// S50 — 14 men, one day
export const S50: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <Crate x={960} y={420} s={1.1} at={0} label="COMPO" />
    {Array.from({length: 14}, (_, i) => <Soldier key={i} x={140 + i * 125} y={960} s={0.42} at={w(0, 'fourteen') + i} hat="uk" face={i % 3 ? 'grin' : 'smirk'} seed={530 + i * 3} />)}
    <PText x={1500} y={300} at={w(0, 'fourteen')} size={110} font="bang" color={PAL.red} anchor="middle">14 MEN</PText>
    <PText x={420} y={300} at={w(0, 'day')} size={110} font="bang" color={PAL.red} anchor="middle">1 DAY</PText>
  </Board>
);
