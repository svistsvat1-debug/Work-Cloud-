// Scenes 28–56: work, paint twist, field day, water & fuel, typhoon, drills, evening
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {G, Sh, Tx, PopAt, Circle, Arrow, Label, Check, XMark, Hit, Soldier, Clock, Calendar, Blob, Paper, Padlock, WW, useProg} from '../paint/Kit';
import {
  Destroyer, BigShip, Waves, Rock, Sun, Bell, DeckGun, Plane, Flames, Smoke, LifeRing, Bucket, PaintCan, Mop, Hammer, Roller, Drop,
  FuelCan, Gauge, Spiral, Envelope, MailBag, Card, Dice, Cross, Bubble, NV,
} from '../paint/Navy';

const HW = '08:00 WORK', HF = '11:00 WATER+FUEL', HR = '13:00 DRILLS', HE = '18:00 EVENING';

// S28 — salt water attacks steel; rust pops
export const S28: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HW}>
    <Sh p={rect(760, 260, 900, 600)} f={NV.hull} at={b(0)} d={6} seed={281} />
    {[[380, 120], [600, 330], [250, 420], [700, 520], [480, 200]].map(([a, c], i) => (
      <Sh key={i} p={ell(760 + a, 260 + c, 46 + (i % 2) * 20, 30 + (i % 3) * 8, 12)} f={NV.rust} at={w(1, 'attacks') + i * 4} d={0} w={4} seed={282 + i} />
    ))}
    <Waves y={900} at={b(0)} />
    <PText x={400} y={400} at={w(0, 'slow')} size={110} font="bang" color={PAL.dblue} anchor="middle">SLOW</PText>
    <PText x={400} y={540} at={w(0, 'enemy')} size={110} font="bang" color={PAL.dblue} anchor="middle">ENEMY</PText>
    <Label x={1210} y={200} to={[1240, 380]} at={w(1, 'every')} size={64}>RUST. EVERY DAY.</Label>
  </Board>
);

// S29 — chipping paint and rust with little hammers (loop + chips)
export const S29: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const r = f >= w(0, 'chipping') ? Math.abs(Math.sin((f - w(0, 'chipping')) / 3)) * 40 - 20 : 0;
  return (
    <Board L={L} hdr={HW}>
      <Sh p={rect(1000, 300, 760, 640)} f={NV.hull} at={b(0)} d={6} seed={291} />
      {[[200, 160], [400, 380], [560, 220]].map(([a, c], i) => <Sh key={i} p={ell(1000 + a, 300 + c, 50, 34, 12)} f={NV.rust} at={b(0) + 4} d={0} w={4} seed={292 + i} />)}
      <Soldier x={700} y={1000} s={1.3} at={b(0)} hat="sailor" face="worry" arms="hold" seed={295} sweat />
      <G x={900} y={760} r={r}><Hammer x={0} y={0} s={1.1} at={w(0, 'hammers')} r={-90} /></G>
      {f >= w(0, 'chipping') ? [0, 1, 2, 3].map((i) => {
        const t = ((f - w(0, 'chipping')) * 0.06 + i * 0.25) % 1;
        return <Sh key={i} p={rect(1010 - t * 300, 700 - t * 200 + t * t * 400, 18, 14)} f={PAL.grey} at={w(0, 'chipping')} d={0} w={3} seed={296 + i} />;
      }) : null}
      <Label x={420} y={300} to={[780, 640]} at={w(0, 'hammers')} size={64}>CHIPPING HAMMER</Label>
      <PText x={1380} y={240} at={w(0, 'hours')} size={100} font="bang" color={PAL.red} anchor="middle">HOURS</PText>
    </Board>
  );
};

// S30 — paint grey again, salt comes back, forever
export const S30: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HW}>
    <PaintCan x={380} y={560} s={1.4} at={w(0, 'paint')} />
    <Roller x={380} y={180} s={0.9} at={w(0, 'grey')} r={10} />
    <Arrow a={[620, 440]} b={[1260, 440]} at={w(0, 'grey')} bend={-90} seed={301} w={12} />
    <Drop x={1460} y={540} s={1.2} at={w(0, 'salt')} c={PAL.blue} />
    <Tx x={1460} y={720} at={w(0, 'salt')} size={70} c={PAL.dblue}>SALT</Tx>
    <Arrow a={[1260, 760]} b={[620, 760]} at={w(0, 'back')} bend={-90} seed={303} w={12} />
    <PText x={960} y={1000} at={b(1)} size={140} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>FOREVER</PText>
  </Board>
);

// S31 — the twist: paint burned like fuel when a ship was hit
export const S31: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HW}>
    <PText x={330} y={330} at={b(0)} size={190} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>TWIST</PText>
    <G x={1250} y={560}>
      {[0, 1, 2, 3, 4].map((i) => <Sh key={i} p={rect(-300, -200 + i * 70, 600, 60)} f={i % 2 ? PAL.grey : PAL.lgrey} at={w(1, 'layers') + i * 2} d={0} seed={311 + i} />)}
    </G>
    <Label x={500} y={640} to={[920, 520]} at={w(1, 'layers')} size={64}>LAYERS OF PAINT</Label>
    <Hit x={1300} y={420} at={w(1, 'hit')} s={0.9} />
    <Flames x={1100} y={520} s={1.4} at={w(1, 'burned')} />
    <Flames x={1400} y={600} s={1.1} at={w(1, 'burned') + 4} seed={823} />
    <PText x={1250} y={950} at={w(1, 'fuel')} size={100} font="bang" color={PAL.red} anchor="middle">PAINT = FUEL</PText>
  </Board>
);

// S32 — strip paint from inside the ship; the paint itself could kill you
export const S32: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const r = f >= b(0) ? Math.sin((f - b(0)) / 3) * 15 : 0;
  return (
    <Board L={L} hdr={HW}>
      <Sh p={rect(140, 180, 1000, 760)} f={PAL.lgrey} at={b(0)} d={6} seed={321} />
      <Sh p={rect(160, 200, 500, 720)} f={NV.hull} at={b(0) + 2} d={0} w={4} seed={322} />
      <Soldier x={860} y={940} s={1.2} at={b(0)} hat="sailor" face="worry" arms="pointL" seed={323} />
      <G x={640} y={560} r={r}><Sh p={[[0, 0], [-80, -40]]} open at={b(0) + 4} d={0} w={14} seed={324} /></G>
      <PText x={640} y={160} at={w(0, 'inside')} size={80} font="bang" anchor="middle">STRIP IT ALL</PText>
      <PaintCan x={1520} y={520} s={1.4} at={w(1, 'paint')} />
      <PText x={1520} y={860} at={w(1, 'kill')} size={110} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>COULD KILL</PText>
      <Circle x={1520} y={500} rx={190} ry={200} at={w(1, 'kill') + 2} />
    </Board>
  );
};

// S33 — field day: scrub, polish, officer checks for dust
export const S33: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HW}>
    <PText x={960} y={250} at={w(1, 'field')} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>FIELD DAY</PText>
    <Mop x={280} y={620} s={1} at={w(2, 'scrubbed')} r={-14} />
    <Bucket x={470} y={860} s={1} at={w(2, 'scrubbed')} />
    <G x={860} y={720}><Sh p={ell(0, 0, 90, 90)} f={PAL.yellow} at={w(2, 'brass')} d={5} seed={331} />
      <Sh p={[[-40, -40], [-20, -60]]} open at={w(2, 'polished')} d={0} c={PAL.white} w={10} seed={332} /></G>
    <Tx x={860} y={880} at={w(2, 'brass')} size={60}>BRASS</Tx>
    <Soldier x={1500} y={1040} s={1.3} at={w(2, 'officer')} hat="officer" face="suspicious" arms="pointL" seed={333} />
    <G x={1250} y={760}><Sh p={ell(0, 0, 60, 60)} f={PAL.turq} at={w(2, 'dust')} d={4} seed={334} />
      <Sh p={[[40, 40], [110, 110]]} open at={w(2, 'dust')} d={0} w={16} seed={335} /></G>
    <PText x={960} y={420} at={b(0)} size={80} font="bang" anchor="middle">CLEANING</PText>
  </Board>
);

// S34 — middle of the ocean: no shop for water and fuel
export const S34: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF} bg={PAL.turq}>
    <Waves y={700} at={b(0)} />
    <Destroyer x={960} y={700} s={0.6} at={b(0)} />
    <PText x={960} y={300} at={w(0, 'ocean')} size={100} font="bang" color={PAL.dblue} anchor="middle">MIDDLE OF THE OCEAN</PText>
    <Drop x={300} y={500} s={1.3} at={w(1, 'water')} />
    <FuelCan x={1620} y={500} s={1.3} at={w(1, 'fuel')} />
    <G x={960} y={920}><Sh p={rect(-200, -60, 400, 120)} f={PAL.white} at={w(1, 'shop')} d={4} seed={341} />
      <Tx y={30} at={w(1, 'shop')} size={80} font="bang">SHOP</Tx></G>
    <XMark x={960} y={920} s={2.2} at={w(1, 'shop') + 3} />
  </Board>
);

// S35 — evaporators boil sea water; boilers and galley first
export const S35: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF}>
    <G x={560} y={600}>
      <Sh p={rect(-220, -200, 440, 360)} f={PAL.lgrey} at={w(0, 'machines')} d={6} seed={351} />
      <Sh p={rect(-160, -140, 320, 120)} f={PAL.blue} at={w(0, 'boiled')} d={0} seed={352} />
      <Flames x={0} y={140} s={0.8} at={w(0, 'boiled')} />
    </G>
    <Tx x={560} y={300} at={w(0, 'machines')} size={64}>SEA WATER → FRESH</Tx>
    <Arrow a={[820, 520]} b={[1260, 360]} at={w(1, 'boilers')} seed={353} />
    <PText x={1500} y={370} at={w(1, 'boilers')} size={80} font="bang" anchor="middle">1. BOILERS</PText>
    <Arrow a={[820, 600]} b={[1260, 600]} at={w(1, 'galley')} seed={355} />
    <PText x={1500} y={620} at={w(1, 'galley')} size={80} font="bang" anchor="middle">2. GALLEY</PText>
    <Arrow a={[820, 680]} b={[1260, 860]} at={w(1, 'galley') + 10} seed={357} c={PAL.grey} />
    <PText x={1520} y={880} at={w(1, 'galley') + 10} size={80} font="bang" color={PAL.grey} anchor="middle">3. YOU?</PText>
  </Board>
);

// S36 — water for the men came last; short salty showers
export const S36: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF}>
    <PText x={960} y={240} at={w(0, 'last')} size={120} font="bang" color={PAL.red} anchor="middle">WATER FOR MEN: LAST</PText>
    <Sh p={[[620, 360], [620, 300], [820, 300]]} open at={w(1, 'Showers')} d={4} w={14} c={PAL.grey} seed={361} />
    <Sh p={ell(820, 330, 60, 24)} f={PAL.grey} at={w(1, 'Showers')} d={0} seed={362} />
    {[0, 1, 2].map((i) => <Drop key={i} x={790 + i * 30} y={420 + i * 40} s={0.25} at={w(1, 'short')} />)}
    <Soldier x={820} y={1000} s={1.2} at={w(1, 'Showers')} hat="none" face="disgust" arms="shrug" seed={363} />
    <Clock x={1400} y={520} s={1} at={w(1, 'short')} spin={1} />
    <Label x={1420} y={820} to={[960, 560]} at={w(1, 'salt')} size={70}>SALT WATER</Label>
    <PText x={1420} y={960} at={w(1, 'sticky')} size={80} font="bang" anchor="middle">STICKY!</PText>
  </Board>
);

// S37 — fuel: tanks empty in a few days (needle falls)
export const S37: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(b(1), b(1) + 70);
  return (
    <Board L={L} hdr={HF}>
      <PText x={960} y={260} at={b(0)} size={120} font="bang" anchor="middle">EVEN BIGGER PROBLEM</PText>
      <Gauge x={960} y={760} s={1.6} at={b(0) + 4} v={1 - p * 0.9} />
      <PText x={960} y={1000} at={w(1, 'few')} size={90} font="bang" color={PAL.red} anchor="middle">EMPTY IN A FEW DAYS</PText>
    </Board>
  );
};

// S38 — pull alongside a much bigger ship, fuel through hoses
export const S38: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF} bg={PAL.turq}>
    <BigShip x={960} y={480} s={1.2} at={w(0, 'bigger')} label="OILER" />
    <Destroyer x={960} y={860} s={0.85} at={b(0)} />
    {[[700, 520], [1100, 520]].map(([a, c], i) => <Sh key={i} p={[[a, c], [a + 20, 650], [a - 10, 760]]} open at={w(0, 'hoses') + i * 3} d={5} w={14} seed={381 + i} />)}
    <Label x={300} y={700} to={[690, 640]} at={w(0, 'hoses')} size={64}>FUEL HOSES</Label>
    <Waves y={900} at={b(0)} />
  </Board>
);

// S39 — rolling side by side, a few dozen meters apart; one wrong turn = collide
export const S39: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF} bg={PAL.turq}>
    <Rock x={960} y={420} deg={3} speed={16} at={b(0)}><BigShip x={960} y={420} s={1.1} at={b(0)} /></Rock>
    <Rock x={960} y={880} deg={5} speed={11} at={b(0)}><Destroyer x={960} y={880} s={0.8} at={b(0)} /></Rock>
    <Arrow a={[1650, 520]} b={[1650, 760]} at={w(0, 'meters')} seed={391} c={PAL.black} />
    <Arrow a={[1650, 760]} b={[1650, 520]} at={w(0, 'meters')} seed={393} c={PAL.black} />
    <Tx x={1610} y={660} at={w(0, 'dozen')} size={60} a="end">FEW DOZEN M</Tx>
    <Hit x={760} y={660} at={w(1, 'collide')} s={0.8} />
    <PText x={500} y={300} at={w(1, 'collide')} size={130} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>CRASH!</PText>
    <Waves y={920} at={b(0)} />
  </Board>
);

// S40 — December 1944, typhoon hits the fleet in the Philippine Sea
export const S40: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF} bg={PAL.turq}>
    <Blob p={[[200, 300], [420, 260], [480, 520], [360, 760], [220, 640]]} f={PAL.green} at={w(1, 'Philippine')} seed={401} />
    <Tx x={330} y={860} at={w(1, 'Philippine')} size={56}>PHILIPPINES</Tx>
    <Spiral x={1050} y={560} s={1.4} at={w(1, 'typhoon')} />
    <PText x={1050} y={960} at={w(1, 'typhoon')} size={110} font="bang" color={PAL.dblue} anchor="middle">TYPHOON</PText>
    <Calendar x={1620} y={330} s={1.1} at={w(1, 'December')} top="DECEMBER" big="1944" />
    {[0, 1, 2].map((i) => <Destroyer key={i} x={1500 + i * 120} y={720 + i * 70} s={0.15} at={w(1, 'fleet') + i * 2} flag={false} seed={402 + i * 20} />)}
    <PText x={960} y={200} at={b(0)} size={80} font="bang" anchor="middle">LOW FUEL = ANOTHER DANGER</PText>
  </Board>
);

// S41 — low on fuel: riding high and light
export const S41: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF}>
    <Rock x={960} y={600} deg={14} speed={9} at={b(0)}><Destroyer x={960} y={600} s={1} at={b(0)} /></Rock>
    <Waves y={660} at={b(0)} amp={40} color={PAL.dblue} />
    <Gauge x={360} y={360} s={0.7} at={w(0, 'low')} v={0.08} />
    <Label x={1500} y={260} to={[1300, 520]} at={w(0, 'high')} size={70}>TOO LIGHT</Label>
  </Board>
);

// S42 — three of them rolled over and sank
export const S42: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(w(0, 'rolled'), w(0, 'rolled') + 45);
  return (
    <Board L={L} hdr={HF}>
      <Waves y={640} at={b(0)} amp={30} color={PAL.dblue} />
      {[0, 1, 2].map((i) => (
        <G key={i} x={400 + i * 560} y={600 + p * 60} r={p * 150}>
          <Destroyer x={0} y={0} s={0.42} at={b(0) + i * 2} flag={false} seed={421 + i * 20} />
        </G>
      ))}
      <PText x={960} y={240} at={w(0, 'Three')} size={160} font="bang" color={PAL.red} anchor="middle">3 DESTROYERS</PText>
    </Board>
  );
};

// S43 — NUMBER CARD: ~790 men lost, no enemy shot
export const S43: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HF}>
    <PText x={760} y={560} at={w(0, 'seven')} size={380} font="bang" color={PAL.red} anchor="middle">~790</PText>
    <PText x={760} y={720} at={w(0, 'men')} size={100} font="bang" anchor="middle">MEN LOST</PText>
    {[0, 1, 2, 3, 4].map((i) => <Cross key={i} x={420 + i * 170} y={880} s={0.8} at={w(0, 'lost') + i * 2} />)}
    <Soldier x={1560} y={1000} s={1.2} at={b(0)} hat="sailor" face="serious" seed={431} />
    <PText x={1560} y={300} at={w(0, 'enemy')} size={80} font="bang" anchor="middle">ENEMY SHOTS:</PText>
    <PText x={1560} y={430} at={w(0, 'never')} size={130} font="bang" color={PAL.red} anchor="middle">0</PText>
  </Board>
);

// S44 — title card: alarm again — not an attack, a drill
export const S44: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.yellow}>
    <Bell x={400} y={460} s={1.6} at={w(0, 'alarm')} />
    <PText x={1250} y={380} at={b(1)} size={110} font="bang" anchor="middle">NOT AN ATTACK...</PText>
    <PText x={1250} y={680} at={w(2, 'drill')} size={300} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>DRILL!</PText>
    <PText x={400} y={850} at={b(0)} size={80} font="bang" anchor="middle">13:00</PText>
  </Board>
);

// S45 — fire drill, man overboard drill, gun drill
export const S45: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HR}>
    <Flames x={360} y={640} s={1.8} at={b(0)} />
    <Tx x={360} y={820} at={b(0)} size={80} font="bang">FIRE</Tx>
    <LifeRing x={960} y={520} s={1.3} at={b(1)} />
    <Tx x={960} y={820} at={b(1)} size={80} font="bang">MAN OVERBOARD</Tx>
    <DeckGun x={1440} y={680} s={0.8} at={b(2)} />
    <Tx x={1560} y={820} at={b(2)} size={80} font="bang">GUNS</Tx>
    {[0, 1, 2].map((i) => <Check key={i} x={360 + i * 600} y={960} at={b(i) + 6} s={1.2} />)}
  </Board>
);

// S46 — damage control drill: patch holes, fight fires in dark flooded rooms
export const S46: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(w(0, 'flooded') - 20, L);
  return (
    <Board L={L} hdr={HR} bg="#2A2F45">
      <Sh p={rect(0, 980 - p * 220, 1920, 400)} f={NV.sea} at={w(0, 'flooded') - 20} d={0} seed={461} />
      <Sh p={ell(1300, 560, 70, 50)} f={PAL.black} at={w(0, 'holes')} d={4} seed={462} />
      <Sh p={[[1300, 560], [1200, 600], [1150, 680]]} open at={w(0, 'holes')} d={4} w={20} c={PAL.blue} seed={463} />
      <Soldier x={900} y={1000} s={1.3} at={b(0)} hat="sailor" face="panic" arms="point" seed={464} sweat />
      <Sh p={rect(1230, 500, 140, 120)} f={PAL.brown} at={w(0, 'patching')} d={4} seed={465} />
      <Flames x={400} y={760} s={1} at={w(0, 'fires')} />
      <PText x={960} y={220} at={b(0)} size={110} font="bang" color={PAL.yellow} anchor="middle">DAMAGE CONTROL</PText>
    </Board>
  );
};

// S47 — sailors complained: hot, exhausting, same every day
export const S47: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HR}>
    {[0, 1, 2].map((i) => <Soldier key={i} x={360 + i * 330} y={1000} s={0.95} at={b(0) + i * 3} hat="sailor" face={i === 1 ? 'disgust' : 'worry'} arms={i === 1 ? 'shrug' : 'down'} seed={471 + i * 10} sweat />)}
    <Bubble x={560} y={330} at={w(0, 'complained')} text="AGAIN?!" />
    <PText x={1520} y={420} at={w(1, 'hot')} size={100} font="bang" color={PAL.red} anchor="middle">HOT.</PText>
    <PText x={1520} y={560} at={w(1, 'exhausting')} size={100} font="bang" anchor="middle">EXHAUSTING.</PText>
    <PText x={1520} y={700} at={w(1, 'same')} size={100} font="bang" color={PAL.grey} anchor="middle">SAME. EVERY. DAY.</PText>
  </Board>
);

// S48 — why practice 100 times? answer at the end (padlock)
export const S48: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HR}>
    <PText x={560} y={560} at={w(0, 'hundred')} size={300} font="bang" color={PAL.red} anchor="middle">x100</PText>
    <PText x={560} y={780} at={w(0, 'why')} size={160} font="bang" anchor="middle">WHY?</PText>
    <Padlock x={1400} y={520} s={2.2} at={w(1, 'Hold')} />
    <PText x={1400} y={850} at={w(1, 'answer')} size={80} font="bang" anchor="middle">ANSWER: AT THE END</PText>
  </Board>
);

// S49 — title card: evening / free time
export const S49: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.orange}>
    <Sun x={1450} y={760} s={1.4} at={b(0)} c={PAL.yellow} />
    <Sh p={rect(0, 760, 1920, 330)} f={PAL.dblue} at={b(0)} d={5} seed={491} />
    <Destroyer x={600} y={780} s={0.5} at={w(0, 'ship')} />
    <PText x={700} y={360} at={w(1, 'best')} size={200} font="bang" color={PAL.white} anchor="middle" outline={PAL.black}>FREE TIME</PText>
    <PText x={700} y={500} at={b(0)} size={90} font="bang" anchor="middle">18:00</PText>
  </Board>
);

// S50 — mail arrives; the whole crew goes quiet
export const S50: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const sw = Math.sin((f - b(0)) / 10) * 8;
  return (
    <Board L={L} hdr={HE}>
      <Sh p={[[960, 80], [960, 300]]} open at={w(0, 'mail')} d={4} w={8} seed={501} />
      <G x={960} y={400} r={sw}><MailBag x={0} y={0} s={1.3} at={w(0, 'mail')} /></G>
      <Calendar x={360} y={420} s={1} at={w(1, 'weeks')} top="TAKES" big="WEEKS" size={72} />
      {[0, 1, 2, 3].map((i) => <Soldier key={i} x={500 + i * 300} y={1060} s={0.7} at={w(1, 'crew') + i * 2} hat="sailor" face="shock" seed={502 + i * 10} />)}
      <PText x={1560} y={420} at={w(1, 'quiet')} size={130} font="bang" anchor="middle">...</PText>
    </Board>
  );
};

// S51 — V-mail: letters photographed tiny to save space on planes
export const S51: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(w(1, 'shrunk'), w(1, 'shrunk') + 30);
  return (
    <Board L={L} hdr={HE}>
      <PText x={960} y={250} at={w(0, 'V')} size={150} font="bang" color={PAL.red} anchor="middle">V-MAIL</PText>
      <G x={500 + p * 300} y={600} s={1.4 - p * 1}><Paper x={0} y={0} at={b(0)} lines={6} /></G>
      <Label x={500} y={1000} at={w(1, 'photographed')} size={60}>PHOTOGRAPHED</Label>
      <Plane x={1500} y={560} s={1} at={w(1, 'planes')} c={PAL.lgrey} />
      <Tx x={1500} y={800} at={w(1, 'space')} size={64}>MORE LETTERS PER PLANE</Tx>
    </Board>
  );
};

// S52 — reading the same letter again and again
export const S52: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HE}>
    <Soldier x={800} y={1000} s={1.5} at={b(0)} hat="sailor" face="grin" arms="hold" seed={521} />
    <Envelope x={1150} y={720} s={0.9} at={b(0) + 4} r={-10} />
    <PText x={1450} y={360} at={w(0, 'again')} size={110} font="bang" color={PAL.red} anchor="middle">AGAIN + AGAIN</PText>
    <PText x={1450} y={500} at={w(0, 'soft')} size={70} anchor="middle">until the paper was soft</PText>
  </Board>
);

// S53 — no mail? cards, dice, acey-deucey
export const S53: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HE}>
    <PText x={960} y={240} at={b(0)} size={120} font="bang" anchor="middle">NO MAIL?</PText>
    <Card x={300} y={600} at={w(1, 'cards')} t="A" r={-10} red />
    <Card x={430} y={590} at={w(1, 'cards') + 2} t="K" r={6} />
    <Dice x={800} y={640} at={w(1, 'dice')} n={5} r={10} />
    <Dice x={950} y={620} at={w(1, 'dice') + 2} n={3} r={-14} seed={936} />
    <G x={1450} y={620}>
      <Sh p={rect(-250, -150, 500, 300)} f={PAL.tan} at={w(1, 'board')} d={5} seed={531} />
      {[0, 1, 2, 3, 4, 5].map((i) => <Sh key={i} p={[[-230 + i * 80, -140], [-200 + i * 80, -20], [-170 + i * 80, -140]]} f={i % 2 ? PAL.red : PAL.black} at={w(1, 'board') + 4} d={0} w={3} seed={532 + i} />)}
    </G>
    <PText x={1450} y={880} at={w(1, 'acey')} size={90} font="bang" color={PAL.red} anchor="middle">ACEY-DEUCEY</PText>
  </Board>
);

// S54 — movie on a sheet; sailors say every line
export const S54: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HE} bg={NV.night}>
    <Sh p={rect(560, 160, 800, 460)} f={PAL.white} at={w(0, 'sheet')} d={5} seed={541} />
    <G x={960} y={560}><Soldier x={0} y={0} s={0.9} at={w(0, 'movie')} hat="none" face="grin" arms="up" seed={542} /></G>
    {[0, 1, 2, 3].map((i) => <Soldier key={i} x={320 + i * 430} y={1100} s={0.75} at={w(1, 'sailors') + i * 2} hat="sailor" face="grin" seed={543 + i * 10} />)}
    <Bubble x={500} y={700} at={w(1, 'line')} text="I KNOW THIS!" w={360} />
    <Bubble x={1450} y={700} at={w(1, 'actors')} text="...SAME LINE" w={360} />
    <PText x={1650} y={130} at={w(1, 'often')} size={70} font="bang" color={PAL.yellow} anchor="middle">AGAIN!</PText>
  </Board>
);

// S55 — equator; pollywogs
export const S55: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HE}>
    <G x={600} y={580}>
      <Sh p={ell(0, 0, 300, 300, 36)} f={PAL.blue} at={w(1, 'equator')} d={6} seed={551} />
      <Blob p={[[-200, -150], [-60, -220], [40, -100], [-80, 20], [-180, -40]]} f={PAL.green} at={w(1, 'equator') + 3} seed={552} />
      <Sh p={[[-300, 0], [300, 0]]} open at={w(1, 'crossed')} d={4} w={12} c={PAL.red} seed={553} />
    </G>
    <Tx x={600} y={950} at={w(1, 'equator')} size={70} c={PAL.red}>EQUATOR</Tx>
    <G x={1450} y={560} s={1.4}>
      <Sh p={ell(0, 0, 90, 70)} f={PAL.green} at={w(1, 'pollywogs')} d={5} seed={554} />
      <Sh p={[[80, 0], [200, -40], [260, 20], [200, 10]]} f={PAL.green} at={w(1, 'pollywogs') + 2} d={0} seed={555} />
      <Sh p={ell(-30, -20, 14, 14, 8)} f={PAL.white} at={w(1, 'pollywogs') + 3} d={0} w={4} seed={556} />
    </G>
    <PText x={1450} y={900} at={w(1, 'pollywogs')} size={110} font="bang" anchor="middle">POLLYWOG</PText>
    <PText x={960} y={190} at={b(0)} size={80} font="bang" anchor="middle">STRANGE TRADITIONS</PText>
  </Board>
);

// S56 — shellbacks, silly tests, dunking: a party at sea
export const S56: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HE}>
    <G x={420} y={640} s={1.3}>
      <Sh p={ell(0, 0, 150, 100)} f={WW.olive} at={w(0, 'shellbacks')} d={6} seed={561} />
      {[[-60, -40], [40, -50], [0, 30]].map(([a, c], i) => <Sh key={i} p={ell(a, c, 30, 22, 10)} f={PAL.green} at={w(0, 'shellbacks') + 4} d={0} w={4} seed={562 + i} />)}
      <Sh p={ell(170, -20, 40, 34)} f={PAL.lgreen} at={w(0, 'shellbacks') + 2} d={0} seed={566} />
      <Sh p={[[130, -90], [170, -150], [210, -90]]} f={PAL.yellow} at={w(0, 'costumes')} d={0} seed={567} />
    </G>
    <PText x={420} y={960} at={w(0, 'shellbacks')} size={100} font="bang" anchor="middle">SHELLBACK</PText>
    <Sh p={rect(1100, 560, 500, 300)} f={PAL.blue} at={w(0, 'dunking')} d={5} seed={568} />
    <Soldier x={1350} y={700} s={0.8} at={w(0, 'dunking')} hat="sailor" face="panic" arms="up" seed={569} />
    <Hit x={1350} y={560} at={w(0, 'dunking') + 4} s={0.6} />
    <PText x={1350} y={300} at={w(1, 'party')} size={120} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>PARTY AT SEA</PText>
  </Board>
);
