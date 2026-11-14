// Scenes 51–76: #2 Britain (rest), #1 USA (final boss), ranking, outro
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {
  G, Sh, Tx, PopAt, Circle, Under, Arrow, Label, Check, XMark, Hit, Soldier, Plate, Bowl, Can, Biscuit, Crate, Mug, ChocBar, Potato,
  Cone, Turkey, Box, Cig, Jar, MoneyBag, Factory, Kettle, Tooth, Truck, CargoShip, Barge, Tug, Sea, Island, Blob,
  TitleCard, Calendar, Clock, WW, along,
} from '../paint/Kit';

const H2 = '#2 BRITAIN', H1 = '#1 USA';

// S51 — crate opens: tins
export const S51: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <Crate x={960} y={860} s={1.2} at={0} open label="COMPO" />
    {[
      ['STEAK & KIDNEY PUDDING', 'steak', 300, 430, PAL.dred],
      ['SCOTCH BROTH', 'Scotch', 700, 380, PAL.orange],
      ['BACON', 'bacon', 1060, 420, PAL.pink],
      ['VEG', 'vegetables', 1400, 380, PAL.green],
      ['PUDDING', 'sweet', 1700, 430, PAL.yellow],
    ].map(([t, k, x, y, c], i) => (
      <PopAt key={i} at={w(0, k as string)} x={x as number} y={y as number}>
        <Can x={x as number} y={y as number} s={0.62} at={w(0, k as string)} band={c as string} />
        <PText x={x as number} y={(y as number) + 110 + (i % 2) * 50} at={w(0, k as string)} size={i === 0 ? 40 : 46} color={PAL.red} anchor="middle">{t as string}</PText>
      </PopAt>
    ))}
  </Board>
);

// S52 — biscuits, jam, chocolate, cigarettes
export const S52: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <Crate x={960} y={930} s={0.9} at={0} open label="COMPO" />
    <Biscuit x={360} y={460} s={0.8} at={w(0, 'biscuits')} />
    <Jar x={760} y={460} s={0.9} at={w(0, 'jam')} />
    <ChocBar x={1200} y={460} s={0.6} at={w(0, 'chocolate')} bite={false} r={0} letter="" />
    <Cig x={1620} y={460} s={0.9} at={w(0, 'cigarettes')} />
    {[['BISCUITS', 360, 'biscuits'], ['JAM', 760, 'jam'], ['CHOCOLATE', 1180, 'chocolate'], ['CIGARETTES', 1620, 'cigarettes']].map(([t, x, k], i) => (
      <PText key={i} x={x as number} y={640} at={w(0, k as string)} size={50} color={PAL.red} anchor="middle">{t as string}</PText>
    ))}
  </Board>
);

// S53 — the tea: 3 in 1
export const S53: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <G x={600} y={580}>
      <Sh p={rect(-170, -200, 340, 400)} f={'#2E7D4F'} at={b(0)} d={6} seed={600} />
      <Sh p={ell(0, -200, 170, 40)} f={PAL.grey} at={b(0) + 6} d={0} seed={601} />
      <Tx y={30} at={b(0) + 6} size={120} font="bang" c={PAL.white} o={PAL.black}>TEA</Tx>
    </G>
    <Circle x={600} y={580} rx={280} ry={300} at={w(0, 'tea')} seed={602} />
    {[['TEA', 'mixed', 1150, PAL.brown], ['SUGAR', 'sugar', 1450, PAL.white], ['MILK POWDER', 'milk', 1750, PAL.white]].map(([t, k, x, c], i) => (
      <PopAt key={i} at={w(1, k as string)} x={x as number} y={420}><G x={x as number} y={420}>
        <Sh p={ell(0, 0, 70, 40)} f={c as string} at={w(1, k as string)} d={0} seed={603 + i} />
        <Sh p={[[60, -10], [160, -60]]} open at={w(1, k as string)} d={0} w={12} c={PAL.grey} seed={606 + i} />
        <Tx y={110} at={w(1, k as string)} size={46}>{t as string}</Tx>
      </G></PopAt>
    ))}
    <PText x={1450} y={760} at={w(1, 'powder')} size={110} font="bang" color={PAL.red} anchor="middle">= 3 IN 1</PText>
  </Board>
);

// S54 — just add hot water
export const S54: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    <Kettle x={700} y={560} s={1.3} at={b(0)} />
    <Sh p={[[900, 470], [960, 560], [1000, 640]]} open at={w(0, 'water')} d={6} c={PAL.blue} w={14} seed={610} />
    <Mug x={1060} y={760} s={1.2} at={w(0, 'water')} />
    <Soldier x={1500} y={1000} s={1.3} at={b(0) + 4} hat="uk" face="grin" seed={611} />
    <PText x={960} y={260} at={w(0, 'brew')} size={100} font="bang" color={PAL.red} anchor="middle">BREW UP!</PText>
  </Board>
);

// S55 — desert, jungle, hedgerow: a hot brew
export const S55: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    {[['DESERT', WW.sand, 'desert'], ['JUNGLE', PAL.green, 'jungle'], ['NORMANDY', PAL.brown, 'Normandy']].map(([t, c, k], i) => (
      <G key={i} x={340 + i * 620} y={560}>
        <Sh p={rect(-290, -300, 580, 600)} f={c as string} at={w(0, k as string)} d={6} seed={620 + i} />
        <Soldier x={-40} y={260} s={0.9} at={w(0, k as string) + 3} hat="uk" face="serious" arms="hold" seed={624 + i * 4} faceAt={[{at: w(0, 'human'), face: 'grin'}]} />
        <Mug x={100} y={110} s={0.6} at={w(0, k as string) + 6} />
        <Tx y={-230} at={w(0, k as string)} size={56} c={PAL.white} o={PAL.black}>{t as string}</Tx>
      </G>
    ))}
    <PText x={960} y={1010} at={w(0, 'human')} size={90} font="bang" color={PAL.red} anchor="middle">FELT HUMAN AGAIN</PText>
  </Board>
);

// S56 — menus by letter; same menu again
export const S56: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    {['A', 'B', 'C', 'D', 'E'].map((t, i) => <Crate key={i} x={260 + i * 350} y={420} s={0.6} at={b(0) + i * 3} label={t} />)}
    <Soldier x={1600} y={1020} s={1.2} at={b(1)} hat="uk" face="grin" arms="pointL" seed={631} faceAt={[{at: w(1, 'again'), face: 'worry'}]} />
    {[0, 1, 2].map((i) => <Can key={i} x={400 + i * 300} y={760} s={0.55} at={w(1, 'same') + i * 5} label="SAME" size={40} />)}
    <PText x={700} y={1000} at={w(1, 'again', 1)} size={110} font="bang" color={PAL.red} anchor="middle">AGAIN?!</PText>
  </Board>
);

// S57 — Britain second
export const S57: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H2}>
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const names: Record<number, string> = {6: 'JAPAN', 5: 'ITALY', 4: 'USSR', 3: 'GERMANY', 2: 'BRITAIN'};
      const n = names[i + 1];
      const at = i + 1 === 2 ? b(0) + 4 : 0;
      return (
        <G key={i} x={330} y={180 + i * 150}>
          <Sh p={rect(-140, -55, 280, 110)} f={n ? PAL.tan : PAL.white} at={at} d={0} seed={640 + i} />
          <Tx x={-90} y={22} at={0} size={60} c={PAL.red}>{`#${i + 1}`}</Tx>
          {n ? <Tx x={50} y={22} at={at} size={n.length > 7 ? 38 : 50}>{n}</Tx> : null}
        </G>
      );
    })}
    <Mug x={1150} y={600} s={2} at={b(0) + 4} />
    {[['COMFORT', 'comfort'], ['VARIETY', 'variety'], ['TEA', 'tea']].map(([t, k], i) => (
      <G key={i} x={1550} y={420 + i * 160}><Check x={-120} y={-20} at={w(0, k)} /><Tx x={-60} y={10} a="start" at={w(0, k)} size={64}>{t}</Tx></G>
    ))}
  </Board>
);

// S58 — the winner: money, factories, strange dessert
export const S58: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <G x={960} y={330}>
      <Sh p={rect(-260, -110, 520, 220)} f={PAL.white} at={b(0)} d={6} seed={650} />
      <Tx x={-150} y={30} at={b(0)} size={110} c={PAL.red} font="bang">#1</Tx>
      <Sh p={[[-60, -110], [-40, 110], [0, -110], [40, 110], [80, -110], [120, 110], [160, -110], [200, 110], [240, -110]]} open at={b(0) + 4} d={6} c={PAL.dred} w={12} seed={651} />
      <Tx x={340} y={40} at={b(0) + 6} size={150} font="bang" c={PAL.red}>?</Tx>
    </G>
    <MoneyBag x={460} y={780} s={1.2} at={w(1, 'Money')} />
    <Factory x={960} y={800} s={1.1} at={w(1, 'factories')} />
    <Cone x={1480} y={740} s={1.2} at={w(1, 'dessert')} />
    <PText x={1640} y={640} at={w(1, 'strange')} size={110} font="bang" color={PAL.red}>?!</PText>
  </Board>
);

// S59 — #1 title card
export const S59: React.FC<SP> = ({b, L}) => (
  <Board L={L}>
    <TitleCard n="#1" title="UNITED STATES" size={170} at={b(0)} />
    <Soldier x={1650} y={1060} s={0.9} at={b(0) + 10} hat="us" face="grin" seed={661} />
  </Board>
);

// S60 — remember the bar; Paul Logan asks Hershey
export const S60: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <ChocBar x={420} y={420} s={1} at={b(0)} />
    <Label x={420} y={720} to={[420, 520]} at={b(0) + 6} size={64}>REMEMBER?</Label>
    <Calendar x={900} y={330} s={0.9} at={w(1, 'thirty')} top="YEAR" big="1937" size={70} />
    <Soldier x={1200} y={1000} s={1.2} at={w(1, 'officer')} hat="officer" face="smirk" glasses arms="point" seed={671} />
    <PText x={1200} y={330} at={w(1, 'Paul')} size={70} color={PAL.red} anchor="middle">PAUL LOGAN</PText>
    <G x={1660} y={640}>
      <Sh p={[[-150, 120], [-150, -60], [-60, -120], [-60, -60], [30, -120], [30, -60], [150, -60], [150, 120]]} f={PAL.brown} at={w(1, 'Hershey')} d={6} seed={672} />
      <Tx y={60} at={w(1, 'Hershey')} size={56} c={PAL.white}>HERSHEY</Tx>
    </G>
    <Arrow a={[1350, 620]} b={[1480, 620]} at={w(1, 'asked')} seed={673} />
  </Board>
);

// S61 — taste only a little better than a boiled potato
export const S61: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const tip = interpolate(f, [w(0, 'little'), w(0, 'potato') + 8], [0, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H1}>
      <G x={760} y={620} r={tip}>
        <Sh p={[[-460, 0], [460, 0]]} open at={b(0)} d={6} w={12} seed={680} />
        <Potato x={-300} y={-70} s={1.1} at={w(0, 'boiled')} />
        <ChocBar x={330} y={-90} s={0.7} r={0} at={w(0, 'taste')} bite={false} />
      </G>
      <Sh p={[[760, 620], [700, 760], [820, 760]]} f={PAL.grey} at={b(0)} d={0} seed={681} />
      <PText x={760} y={320} at={w(0, 'little')} size={90} font="bang" color={PAL.red} anchor="middle">"A LITTLE BETTER"</PText>
      <G x={1550} y={420}>
        <Sh p={ell(0, 0, 260, 170)} f={PAL.white} at={b(1)} d={6} seed={682} />
        <Soldier x={-60} y={130} s={0.5} at={b(1) + 4} hat="us" face="grin" arms="eat" seed={683} />
        <ChocBar x={60} y={0} s={0.35} r={0} at={b(1) + 4} bite={false} />
        <XMark x={0} y={0} at={w(1, 'before')} s={2.4} />
      </G>
      <PText x={1550} y={800} at={w(1, 'emergency')} size={70} color={PAL.red} anchor="middle">EMERGENCY ONLY</PText>
    </Board>
  );
};

// S62 — hard, bitter, dense
export const S62: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <Soldier x={560} y={1000} s={1.5} at={b(0)} hat="us" face="serious" arms="hold" seed={691} faceAt={[{at: w(0, 'bitter'), face: 'disgust'}]} sweat />
    <ChocBar x={900} y={560} s={0.9} at={b(0)} />
    <Hit x={820} y={500} at={w(0, 'hard')} s={0.5} />
    <Tooth x={1150} y={520} s={0.9} at={w(0, 'bite')} />
    {[['HARD', 'hard', 360], ['BITTER', 'bitter', 520], ['DENSE', 'dense', 680]].map(([t, k, y], i) => (
      <PText key={i} x={1550} y={y as number} at={w(0, k as string)} size={100} font="bang" color={PAL.red} anchor="middle">{t as string}</PText>
    ))}
  </Board>
);

// S63 — hash and stew grumbles
export const S63: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <Sh p={rect(360, 700, 900, 40)} f={PAL.brown} at={b(0)} d={6} seed={700} />
    <Can x={600} y={590} s={0.8} at={b(0) + 4} label="HASH" size={44} />
    <Can x={960} y={590} s={0.8} at={b(0) + 6} label="STEW" size={44} />
    <G x={780} y={300} r={180}><Sh p={[[-40, 40], [-40, -30], [-10, -30], [-10, -80], [20, -80], [20, -30], [60, -30], [60, 40]]} f={PAL.white} at={b(0) + 8} d={0} seed={701} /></G>
    <Soldier x={1500} y={1000} s={1.4} at={b(1)} hat="us" face="worry" arms="hip" seed={702} />
    <PText x={1500} y={330} at={w(1, 'same')} size={110} font="bang" color={PAL.red} anchor="middle">AGAIN...</PText>
  </Board>
);

// S64 — why #1: deliver anywhere (world map with arrows)
export const S64: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const routes: P[][] = [[[480, 500], [900, 380], [1140, 330]], [[480, 500], [800, 700], [1100, 760]], [[480, 500], [1000, 640], [1550, 600]], [[480, 500], [300, 760], [600, 900]]];
  return (
    <Board L={L} hdr={H1}>
      <Blob p={[[200, 320], [640, 300], [700, 480], [560, 640], [300, 620], [180, 460]]} f={PAL.lgrey} at={0} seed={710} />
      <Blob p={[[980, 220], [1500, 200], [1720, 380], [1400, 520], [1000, 440]]} f={PAL.lgrey} at={0} seed={711} />
      <Blob p={[[1050, 560], [1300, 560], [1300, 860], [1080, 900]]} f={PAL.lgrey} at={0} seed={712} />
      <Blob p={[[1500, 680], [1760, 700], [1700, 880], [1520, 860]]} f={PAL.lgrey} at={0} seed={713} />
      <Tx x={420} y={480} at={0} size={60}>USA</Tx>
      <PText x={960} y={170} at={b(0)} size={110} font="bang" color={PAL.red} anchor="middle">WHY #1?</PText>
      {routes.map((r, i) => (
        <g key={i}>
          <Sh p={r} open at={w(1, 'deliver') + i * 3} d={8} c={PAL.red} w={8} seed={720 + i} />
          {f >= w(1, 'deliver') + 10 ? (() => { const [x, y] = along(r, ((f - w(1, 'deliver') + i * 15) % 60) / 60); return <G x={x} y={y}><Truck x={0} y={0} s={0.18} at={w(1, 'deliver')} /></G>; })() : null}
        </g>
      ))}
    </Board>
  );
};

// S65 — K ration box contents
export const S65: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <Box x={960} y={720} s={1.3} at={b(0)} label="K RATION" size={64} />
    {[['MEAL', 'meal', 420, 420], ['COFFEE', 'coffee', 720, 300], ['CANDY', 'candy', 1020, 260], ['GUM', 'gum', 1320, 300], ['CIGARETTES', 'cigarettes', 1600, 420]].map(([t, k, x, y], i) => (
      <PopAt key={i} at={w(0, k as string)} x={x as number} y={y as number}><G x={x as number} y={y as number}>
        <Sh p={rect(-80, -50, 160, 100)} f={[PAL.lgrey, PAL.brown, PAL.pink, PAL.lgreen, PAL.red][i]} at={w(0, k as string)} d={0} seed={730 + i} />
        <Tx y={100} at={w(0, k as string)} size={46} c={PAL.red}>{t as string}</Tx>
      </G></PopAt>
    ))}
  </Board>
);

// S66 — ten-in-one
export const S66: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <Box x={960} y={480} s={1.5} at={w(0, 'ten')} label="10-in-1" w={260} h={170} size={70} />
    {Array.from({length: 10}, (_, i) => <Soldier key={i} x={260 + i * 155} y={1000} s={0.42} at={w(1, 'ten') + i} hat="us" face="grin" seed={740 + i * 3} />)}
    <PText x={1550} y={330} at={w(1, 'day')} size={100} font="bang" color={PAL.red} anchor="middle">10 MEN, 1 DAY</PText>
  </Board>
);

// S67 — field kitchens; Thanksgiving turkey
export const S67: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <G x={500} y={700}>
      <Sh p={[[-300, 200], [0, -180], [300, 200]]} f={WW.olive} at={b(0)} d={6} seed={750} />
      <Sh p={[[-60, 200], [0, 40], [60, 200]]} f={PAL.black} at={b(0) + 6} d={0} seed={751} />
    </G>
    <Bowl x={900} y={760} s={0.7} fill="soup" at={w(0, 'hot')} />
    <Calendar x={1300} y={380} s={1.3} at={w(0, 'Thanksgiving')} top="THANKSGIVING" big="NOV" size={70} />
    <G x={1500} y={760}><Sh p={rect(-200, -40, 400, 80)} f={PAL.lgrey} at={w(0, 'turkey')} d={0} seed={752} /></G>
    <PopAt at={w(0, 'turkey')} x={1500} y={700}><Turkey x={1480} y={690} s={0.9} at={w(0, 'turkey')} /></PopAt>
    <Soldier x={1800} y={1000} s={0.9} at={w(0, 'turkey')} hat="us" face="grin" seed={753} />
  </Board>
);

// S68 — DESSERT
export const S68: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <PText x={960} y={620} at={w(0, 'dessert')} size={300} font="bang" color={PAL.black} anchor="middle">DESSERT</PText>
    <Under x1={460} x2={1460} y={680} at={w(0, 'dessert') + 4} />
    <PText x={960} y={300} at={w(0, 'proof')} size={70} color={PAL.grey} anchor="middle">THE REAL PROOF:</PText>
  </Board>
);

// S69 — concrete barge, $1,000,000
export const S69: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={H1}>
    <Sea y={720} at={0} seed={760} />
    <Barge x={900} y={740} s={1.3} at={w(0, 'concrete')} />
    <Sea y={760} at={w(0, 'concrete')} seed={761} />
    <Calendar x={260} y={330} s={0.9} at={b(0)} top="US NAVY" big="1945" size={70} />
    <PText x={1300} y={280} at={w(0, 'million')} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>$1,000,000</PText>
    <PText x={900} y={1000} at={w(0, 'barge')} size={64} color={PAL.white} anchor="middle">CONCRETE BARGE</PText>
    <PText x={1650} y={500} at={w(0, 'job')} size={70} color={PAL.red} anchor="middle">ONE JOB</PText>
  </Board>
);

// S70 — it made ice cream; 10 gallons every 7 minutes
export const S70: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  return (
    <Board L={L} hdr={H1}>
      <Sea y={760} at={0} seed={770} />
      <Barge x={600} y={780} s={1} at={0} />
      <Sea y={800} at={0} seed={771} />
      {f >= w(0, 'ice') ? [0, 1, 2].map((i) => {
        const t = ((f - w(0, 'ice') + i * 12) % 36) / 36;
        return <Cone key={i} x={700 + t * 60} y={480 - t * 300} s={0.45} at={w(0, 'ice')} scoop={[PAL.pink, PAL.white, WW.choc][i]} seed={772 + i * 6} />;
      }) : null}
      <PText x={600} y={260} at={w(0, 'ice')} size={110} font="bang" color={PAL.pink} anchor="middle" outline={PAL.black}>ICE CREAM!</PText>
      <PText x={1450} y={420} at={w(1, 'ten')} size={150} font="bang" color={PAL.red} anchor="middle">10 GALLONS</PText>
      <PText x={1450} y={540} at={w(1, 'seven')} size={64} anchor="middle">EVERY 7 MINUTES</PText>
      <Clock x={1450} y={760} s={1} at={w(1, 'seven')} spin={2} />
    </Board>
  );
};

// S71 — towed across the Pacific; sailors with cones
export const S71: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [b(0), L], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Board L={L} hdr={H1}>
      <Sh p={rect(-40, 160, 2000, 1000)} f={PAL.turq} at={0} d={0} seed={780} />
      <Tx x={960} y={260} at={w(0, 'Pacific')} size={90} font="bang" c={PAL.dblue}>PACIFIC</Tx>
      <Sh p={[[200, 700], [700, 560], [1200, 640], [1600, 520]]} open at={b(0)} d={10} c={PAL.red} w={7} seed={781} />
      <G x={200 + t * 600} y={700 - t * 120}>
        <Tug x={160} y={0} s={0.5} at={w(0, 'towed')} />
        <Sh p={[[0, -20], [110, -20]]} open at={w(0, 'towed')} d={0} w={4} seed={782} />
        <Barge x={-60} y={0} s={0.35} at={w(0, 'towed')} />
      </G>
      <G x={1500} y={760}>
        <CargoShip x={0} y={0} s={0.7} at={w(0, 'sailors')} />
        <Soldier x={-120} y={-50} s={0.4} at={w(0, 'sailors') + 4} hat="sailor" face="grin" arms="up" seed={783} />
        <Soldier x={60} y={-50} s={0.4} at={w(0, 'sailors') + 6} hat="sailor" face="grin" arms="hold" seed={786} />
        <Cone x={95} y={-130} s={0.25} at={w(0, 'ice')} />
      </G>
      <PText x={1500} y={1000} at={w(0, 'without')} size={56} anchor="middle">NO ICE CREAM MACHINE ON BOARD</PText>
    </Board>
  );
};

// S72 — same country: bitter bar AND ice cream factory
export const S72: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Sh p={[[960, 140], [960, 1000]]} open at={0} d={6} w={8} seed={790} />
    <ChocBar x={480} y={420} s={0.9} at={w(0, 'chocolate')} />
    <Soldier x={480} y={1000} s={1} at={w(0, 'bad')} hat="us" face="disgust" seed={791} />
    <Barge x={1440} y={520} s={0.8} at={w(0, 'factory')} />
    <Cone x={1440} y={240} s={0.6} at={w(0, 'ice')} />
    <Soldier x={1440} y={1000} s={1} at={w(0, 'ocean')} hat="sailor" face="grin" seed={794} />
    <PopAt at={w(0, 'also')} x={960} y={560}><G x={960} y={560}><Sh p={ell(0, 0, 150, 90)} f={PAL.yellow} at={w(0, 'also')} d={0} seed={795} /><Tx y={30} at={w(0, 'also')} size={60} c={PAL.red}>SAME USA</Tx></G></PopAt>
  </Board>
);

// S73 — starving vs spoiled
export const S73: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <PText x={480} y={200} at={w(0, 'starving')} size={130} font="bang" color={PAL.red} anchor="middle">STARVING</PText>
    <PText x={1440} y={200} at={w(0, 'spoiled')} size={130} font="bang" color={PAL.green} anchor="middle">SPOILED</PText>
    <Arrow a={[760, 160]} b={[1160, 160]} at={w(0, 'gap')} seed={800} w={12} />
    <Sea y={860} at={b(1)} seed={801} />
    <Island x={480} y={860} s={1.4} at={b(1)} />
    <Soldier x={480} y={830} s={1.1} at={b(1) + 3} hat="jp" face="sad" arms="hold" legs="kneel" seed={802} />
    <G x={620} y={600}>{[-12, 0, 12].map((a, i) => <Sh key={i} p={[[a, 60], [a + (i - 1) * 10, -30]]} open at={w(1, 'grass')} d={3} c={PAL.green} w={10} seed={803 + i} />)}</G>
    <CargoShip x={1440} y={860} s={0.8} at={b(2)} />
    <Soldier x={1340} y={790} s={0.7} at={b(2) + 3} hat="sailor" face="grin" arms="hold" seed={806} />
    <Cone x={1430} y={600} s={0.35} at={w(2, 'ice')} />
    <Arrow a={[760, 520]} b={[1160, 520]} at={w(2, 'ice')} seed={807} />
    <Arrow a={[1160, 560]} b={[760, 560]} at={w(2, 'ice') + 4} seed={809} />
  </Board>
);

// S74 — not taste: ships, trucks, factories
export const S74: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <G x={960} y={300}>
      <Sh p={[[-90, -60], [90, -60], [70, 80], [0, 110], [-70, 80]]} f={PAL.pink} at={b(0)} d={6} seed={810} />
      <XMark x={0} y={20} at={w(0, 'taste')} s={2.4} seed={811} />
      <Tx x={300} y={30} a="start" at={w(0, 'taste')} size={70} c={PAL.red}>NOT TASTE</Tx>
    </G>
    <CargoShip x={420} y={800} s={0.6} at={w(1, 'ships')} />
    <Truck x={960} y={800} s={0.8} at={w(1, 'trucks')} />
    <Factory x={1500} y={800} s={1} at={w(1, 'factories')} />
    <Circle x={960} y={760} rx={820} ry={230} at={w(1, 'factories') + 6} seed={812} />
  </Board>
);

// S75 — final ranking
export const S75: React.FC<SP> = ({b, w, L}) => {
  const names = ['UNITED STATES', 'BRITAIN', 'GERMANY', 'SOVIET UNION', 'ITALY', 'JAPAN'];
  const keys = ['United', 'Britain', 'Germany', 'Soviet', 'Italy', 'Japan'];
  return (
    <Board L={L}>
      <PText x={960} y={130} at={b(0)} size={100} font="bang" color={PAL.black} anchor="middle">FINAL RANKING</PText>
      {names.map((n, i) => (
        <PopAt key={i} at={w(1, keys[i])} x={960} y={250 + i * 140}><G x={960} y={250 + i * 140}>
          <Sh p={rect(-460, -55, 920, 110)} f={i === 0 ? PAL.yellow : PAL.white} at={w(1, keys[i])} d={0} seed={820 + i} />
          <Tx x={-380} y={24} at={w(1, keys[i])} size={70} c={PAL.red} font="bang">{`#${i + 1}`}</Tx>
          <Tx x={40} y={24} at={w(1, keys[i])} size={66}>{n}</Tx>
        </G></PopAt>
      ))}
      <Circle x={960} y={250} rx={520} ry={95} at={w(1, 'top') + 4} seed={830} />
      <Cone x={1560} y={230} s={0.45} at={w(1, 'United') + 4} />
    </Board>
  );
};

// S76 — outro: next = army pay
export const S76: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 10) * 8;
  return (
    <Board L={L}>
      <Soldier x={420} y={1000} s={1.4} at={b(0)} hat="us" face="worry" arms="hold" seed={841} faceAt={[{at: b(1), face: 'grin'}]} />
      <Plate x={640} y={760} s={0.9} at={b(0) + 4} />
      <G x={1150} y={460 + bob}>
        <Sh p={rect(-170, -110, 340, 220)} f={PAL.tan} at={w(1, 'paid')} d={6} seed={842} />
        <Sh p={[[-170, -110], [0, 10], [170, -110]]} open at={w(1, 'paid')} d={0} w={6} seed={843} />
        <Tx y={70} at={w(1, 'paid')} size={80} font="bang" c={PAL.green}>$ PAY</Tx>
        <Tx x={210} y={-60} at={w(1, 'paid')} size={140} font="bang" c={PAL.red}>?</Tx>
      </G>
      <PText x={1250} y={190} at={w(1, 'rank')} size={110} font="bang" color={PAL.red} anchor="middle">NEXT: ARMY PAY RANKED</PText>
      <PopAt at={w(2, 'Subscribe')} x={1250} y={820}><G x={1250} y={820}>
        <Sh p={rect(-230, -70, 460, 140)} f={PAL.red} at={w(2, 'Subscribe')} d={0} seed={844} />
        <Tx y={28} at={w(2, 'Subscribe')} size={84} font="bang" c={PAL.white}>SUBSCRIBE</Tx>
      </G></PopAt>
    </Board>
  );
};
