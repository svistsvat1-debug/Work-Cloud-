// Scenes 57–79: darken ship, the loop, Okinawa (final boss), answer, outro
import React from 'react';
import {useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL, P, ell, rect} from '../paint/wobble';
import {Board, SP} from './core';
import {G, Sh, Tx, PopAt, Circle, Arrow, Label, Check, XMark, Hit, Soldier, Clock, Calendar, Blob, Paper, WW, useProg, along} from '../paint/Kit';
import {
  Destroyer, BigShip, Waves, Rock, Moon, Stars, Sun, Bell, Plane, Bomb, Flames, Smoke, LifeRing, Bucket, PaintCan, Mop, Hammer,
  Envelope, Periscope, Radar, Cross, Zzz, NV,
} from '../paint/Navy';

const HN = '20:00 NIGHT', HO = '16 APRIL 1945', HA = 'THE ANSWER';

// S57 — sunset: DARKEN SHIP, every light goes out
export const S57: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const dark = f >= w(2, 'out');
  return (
    <Board L={L} bg={dark ? NV.night : PAL.orange}>
      {dark ? <Stars at={w(2, 'out')} /> : <Sun x={1500} y={760} s={1.2} at={b(0)} />}
      <Sh p={rect(0, 760, 1920, 330)} f={dark ? '#10162B' : PAL.dblue} at={b(0)} d={5} seed={571} />
      <Destroyer x={760} y={780} s={0.8} at={b(0)} dark={dark} />
      {!dark ? [0, 1, 2].map((i) => <Sh key={i} p={ell(560 + i * 200, 650, 14, 14, 8)} f={PAL.yellow} at={b(0) + 6} d={0} w={3} seed={572 + i} />) : null}
      <PText x={960} y={300} at={b(1)} size={210} font="bang" color={dark ? PAL.yellow : PAL.white} anchor="middle" outline={PAL.black}>DARKEN SHIP</PText>
      <PText x={960} y={460} at={w(2, 'out')} size={90} font="bang" color={PAL.white} anchor="middle">ALL LIGHTS OUT</PText>
    </Board>
  );
};

// S58 — no smoking outside: a glowing cigarette seen by a submarine
export const S58: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const glow = 14 + Math.sin(f / 4) * 4;
  return (
    <Board L={L} hdr={HN} bg={NV.night}>
      <Waves y={760} at={b(0)} color="#10162B" amp={10} />
      <Soldier x={460} y={760} s={1.2} at={b(0)} hat="sailor" face="worry" arms="eat" seed={581} />
      <circle cx={515} cy={455} r={glow} fill={PAL.orange} />
      <XMark x={260} y={220} s={1.4} at={w(0, 'smoking')} />
      <Tx x={260} y={330} at={w(0, 'smoking')} size={56} c={PAL.white}>NO SMOKING</Tx>
      <Periscope x={1600} y={780} s={1} at={w(1, 'submarine')} />
      <Sh p={[[1640, 640], [1100, 560], [560, 470]]} open at={w(1, 'seen')} d={8} w={8} c={PAL.red} seed={582} />
      <PText x={1300} y={420} at={w(1, 'seen')} size={110} font="bang" color={PAL.red} anchor="middle">SEEN!</PText>
      <Tx x={1600} y={940} at={w(1, 'far')} size={60} c={PAL.white}>FAR AWAY</Tx>
    </Board>
  );
};

// S59 — the whole ship disappears into the night
export const S59: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  const gone = f >= w(0, 'disappears');
  return (
    <Board L={L} hdr={HN} bg={NV.night}>
      <Stars at={b(0)} />
      <Moon x={1600} y={220} at={b(0)} />
      <Waves y={760} at={b(0)} color="#10162B" amp={10} />
      {!gone ? <Destroyer x={900} y={770} s={0.8} at={b(0)} dark /> : <PText x={900} y={700} at={w(0, 'disappears')} size={110} font="bang" color={PAL.lgrey} anchor="middle">WHERE IS IT?</PText>}
      <PText x={900} y={360} at={w(0, 'night')} size={130} font="bang" color={PAL.white} anchor="middle">INVISIBLE</PText>
    </Board>
  );
};

// S60 — and you? midnight watch, no sleep
export const S60: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN}>
    <Soldier x={560} y={1000} s={1.6} at={b(0)} hat="sailor" face="worry" seed={601} sweat faceAt={[{at: b(2), face: 'sad'}]} />
    <PText x={560} y={250} at={b(0)} size={110} font="bang" color={PAL.red} anchor="middle">AND YOU?</PText>
    <Clock x={1350} y={430} s={1.6} at={w(1, 'midnight')} />
    <PText x={1350} y={720} at={w(1, 'midnight')} size={90} font="bang" anchor="middle">00:00 WATCH</PText>
    <Zzz x={1300} y={930} at={w(2, 'sleep')} />
    <XMark x={1360} y={880} s={1.6} at={w(2, 'sleep') + 3} />
  </Board>
);

// S61 — the loop: watch, alarm, work, drill, letters, watch
export const S61: React.FC<SP> = ({b, w, L}) => {
  const items = ['Watch', 'alarm', 'work', 'drill', 'letters'];
  const labels = ['WATCH', 'ALARM', 'WORK', 'DRILL', 'LETTERS'];
  return (
    <Board L={L} hdr={HN}>
      {items.map((it, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = 960 + Math.cos(a) * 340, y = 580 + Math.sin(a) * 340;
        return <PText key={i} x={x} y={y + 30} at={w(0, it)} size={90} font="bang" color={i === 0 ? PAL.red : PAL.black} anchor="middle">{labels[i]}</PText>;
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const a0 = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.35, a1 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2 - 0.35;
        return <Arrow key={i} a={[960 + Math.cos(a0) * 340, 580 + Math.sin(a0) * 340]} b={[960 + Math.cos(a1) * 340, 580 + Math.sin(a1) * 340]} at={w(0, items[(i + 1) % 5], i === 4 ? 1 : 0)} bend={-30} seed={611 + i * 3} c={PAL.grey} w={8} />;
      })}
      <PText x={960} y={610} at={b(0)} size={80} font="bang" color={PAL.grey} anchor="middle">REPEAT</PText>
    </Board>
  );
};

// S62 — weeks of it, months of it; but one day was not normal
export const S62: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HN}>
    {[0, 1, 2, 3, 4, 5].map((i) => <Calendar key={i} x={300 + i * 80} y={560 - i * 30} s={0.9} at={(i < 3 ? b(0) : b(1)) + (i % 3) * 3} top="DAY" big={String(i * 7 + 1)} seed={621 + i * 3} />)}
    <PText x={460} y={900} at={b(0)} size={90} font="bang" anchor="middle">WEEKS... MONTHS...</PText>
    <PText x={1420} y={500} at={b(2)} size={140} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>ONE DAY WAS</PText>
    <PText x={1420} y={680} at={w(2, 'normal')} size={140} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>NOT NORMAL</PText>
  </Board>
);

// S63 — title card: April 16, 1945, off Okinawa
export const S63: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.turq}>
    <Calendar x={450} y={520} s={2} at={b(0)} top="APRIL" big="16" size={120} />
    <PText x={450} y={860} at={w(0, 'nineteen')} size={110} font="bang" anchor="middle">1945</PText>
    <Blob p={[[1300, 300], [1420, 360], [1480, 560], [1560, 760], [1460, 800], [1380, 600], [1290, 420]]} f={PAL.green} at={b(1)} seed={631} />
    <PText x={1430} y={950} at={w(1, 'Okinawa')} size={120} font="bang" color={PAL.red} anchor="middle">OKINAWA</PText>
  </Board>
);

// S64 — Laffey alone on radar picket duty, warns the fleet
export const S64: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO} bg={PAL.turq}>
    <Waves y={720} at={b(0)} />
    {[0, 1, 2, 3].map((i) => <Destroyer key={i} x={180 + i * 140} y={740 + (i % 2) * 40} s={0.16} at={b(0) + i} flag={false} seed={641 + i * 20} />)}
    <Tx x={360} y={960} at={b(0)} size={64}>THE FLEET</Tx>
    <Destroyer x={1350} y={740} s={0.6} at={w(0, 'Laffey')} />
    <Radar x={1400} y={560} at={w(0, 'radar')} />
    <Label x={1350} y={300} to={[1350, 600]} at={w(0, 'Laffey')} size={90}>LAFFEY</Label>
    <Arrow a={[1100, 620]} b={[700, 620]} at={w(1, 'warn')} seed={642} w={12} />
    <PText x={900} y={560} at={w(1, 'warn')} size={70} font="bang" color={PAL.red} anchor="middle">WARNING!</PText>
    <PText x={900} y={420} at={w(0, 'far')} size={60} font="bang" anchor="middle">FAR OUT, ALONE</PText>
  </Board>
);

// S65 — dozens of planes come straight for the Laffey
export const S65: React.FC<SP> = ({b, w, L}) => {
  const f = useCurrentFrame();
  return (
    <Board L={L} hdr={HO} bg={PAL.turq}>
      <Waves y={800} at={b(0)} />
      <Destroyer x={1300} y={820} s={0.6} at={b(0)} />
      {Array.from({length: 9}, (_, i) => {
        const st = w(1, 'Dozens') + i * 2;
        if (f < (i < 3 ? b(0) + i * 3 : st)) return null;
        const t = ((f - b(0)) * 0.004 + i * 0.07) % 0.6;
        const x0 = 100 + (i % 3) * 120, y0 = 160 + Math.floor(i / 3) * 110;
        return <Plane key={i} x={x0 + t * 900} y={y0 + t * 300} s={0.35} at={i < 3 ? b(0) + i * 3 : st} r={18} c={PAL.grey} seed={651 + i * 5} />;
      })}
      <PText x={1300} y={300} at={w(1, 'Dozens')} size={140} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>DOZENS</PText>
    </Board>
  );
};

// S66 — kamikazes: pilots planned to crash into ships
export const S66: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO}>
    <Destroyer x={1250} y={820} s={0.7} at={b(0)} />
    <Waves y={840} at={b(0)} />
    <Plane x={620} y={360} s={0.9} at={w(0, 'kamikazes')} r={32} c={PAL.grey} />
    <Arrow a={[760, 470]} b={[1150, 720]} at={w(0, 'crash')} seed={661} w={12} />
    <Label x={420} y={180} to={[560, 300]} at={w(0, 'kamikazes')} size={90}>KAMIKAZE</Label>
    <Tx x={1500} y={300} at={w(0, 'pilots')} size={60}>pilots who meant to crash</Tx>
  </Board>
);

// S67 — 80 minutes of attacks
export const S67: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO}>
    <Clock x={520} y={540} s={2.4} at={b(0)} spin={1.5} />
    <PText x={520} y={900} at={w(0, 'eighty')} size={140} font="bang" color={PAL.red} anchor="middle">80 MINUTES</PText>
    {[0, 1, 2, 3].map((i) => <Hit key={i} x={1150 + (i % 2) * 380} y={360 + Math.floor(i / 2) * 340} at={w(0, 'again') + i * 6} s={0.8} />)}
    <PText x={1340} y={950} at={w(0, 'attacked')} size={80} font="bang" anchor="middle">AGAIN AND AGAIN</PText>
  </Board>
);

// S68 — NUMBER CARD: 6 kamikazes + 4 bombs
export const S68: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO}>
    <PText x={480} y={560} at={w(0, 'six')} size={360} font="bang" color={PAL.red} anchor="middle">6</PText>
    {[0, 1, 2, 3, 4, 5].map((i) => <Plane key={i} x={300 + (i % 3) * 180} y={720 + Math.floor(i / 3) * 150} s={0.3} at={w(0, 'kamikaze') + i * 2} c={PAL.grey} seed={681 + i * 5} />)}
    <PText x={960} y={560} at={w(0, 'four')} size={200} font="bang" anchor="middle">+</PText>
    <PText x={1440} y={560} at={w(0, 'four')} size={360} font="bang" color={PAL.red} anchor="middle">4</PText>
    {[0, 1, 2, 3].map((i) => <Bomb key={i} x={1290 + i * 100} y={790} s={0.6} at={w(0, 'bombs') + i * 2} seed={690 + i * 3} />)}
    <PText x={960} y={1000} at={w(0, 'bombs')} size={80} font="bang" anchor="middle">PLANES + BOMBS THAT HIT</PText>
  </Board>
);

// S69 — fires, rudder jammed, compartments flooded
export const S69: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(b(2), b(2) + 40);
  return (
    <Board L={L} hdr={HO}>
      <Destroyer x={960} y={720 + p * 40} s={1} at={b(0)} r={p * 4} />
      <Waves y={760} at={b(0)} />
      <Flames x={780} y={620} s={1} at={b(0)} />
      <Flames x={1180} y={560} s={1.2} at={b(0) + 5} seed={691} />
      <Smoke x={1180} y={420} s={1.4} at={b(0) + 8} />
      <XMark x={480} y={800} s={1.3} at={b(1)} />
      <Label x={300} y={420} to={[470, 760]} at={b(1)} size={64}>RUDDER JAMMED</Label>
      <Label x={1600} y={980} at={b(2)} size={64}>FLOODING</Label>
      <PText x={560} y={230} at={w(0, 'Fires')} size={110} font="bang" color={PAL.red} anchor="middle">FIRES EVERYWHERE</PText>
    </Board>
  );
};

// S70 — NUMBER CARD: 32 killed; should have sunk
export const S70: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO}>
    <PText x={560} y={560} at={w(0, 'Thirty-two')} size={380} font="bang" color={PAL.red} anchor="middle">32</PText>
    <PText x={560} y={700} at={w(0, 'killed')} size={90} font="bang" anchor="middle">MEN KILLED</PText>
    {[0, 1, 2, 3].map((i) => <Cross key={i} x={340 + i * 150} y={860} s={0.7} at={w(0, 'killed') + i * 2} />)}
    <Tx x={560} y={1000} at={w(0, 'wounded')} size={56} c={PAL.grey}>+ dozens wounded</Tx>
    <Soldier x={1500} y={1000} s={1.3} at={b(0)} hat="sailor" face="serious" seed={701} />
    <PText x={1480} y={300} at={w(1, 'sunk')} size={100} font="bang" anchor="middle">SHOULD HAVE SUNK</PText>
  </Board>
);

// S71 — but the Laffey stayed afloat. Why?
export const S71: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HO} bg={PAL.turq}>
    <Rock x={800} y={720} deg={3} speed={16} at={b(0)}><Destroyer x={800} y={720} s={0.9} at={b(0)} r={3} /></Rock>
    <Smoke x={900} y={500} s={1} at={b(0)} />
    <Waves y={740} at={b(0)} />
    <PText x={800} y={260} at={w(0, 'afloat')} size={120} font="bang" color={PAL.green} anchor="middle" outline={PAL.black}>STILL AFLOAT</PText>
    <PText x={1620} y={560} at={b(1)} size={260} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>WHY?</PText>
  </Board>
);

// S72 — they had done it all before — in drills, every afternoon
export const S72: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HA}>
    <Paper x={520} y={560} s={1.6} at={b(0)} lines={0} title="DRILL LOG" />
    {Array.from({length: 12}, (_, i) => <Check key={i} x={380 + (i % 3) * 140} y={420 + Math.floor(i / 3) * 110} s={0.8} at={w(1, 'drills') + i * 2} />)}
    <PText x={1380} y={430} at={w(0, 'before')} size={110} font="bang" anchor="middle">DONE IT BEFORE</PText>
    <PText x={1380} y={600} at={w(1, 'real')} size={90} font="bang" color={PAL.grey} anchor="middle">NOT FOR REAL...</PText>
    <PText x={1380} y={780} at={b(2)} size={110} font="bang" color={PAL.red} anchor="middle">EVERY AFTERNOON</PText>
  </Board>
);

// S73 — hoses in the dark; which door to close, which hole to patch
export const S73: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HA} bg="#2A2F45">
    <Soldier x={520} y={1000} s={1.3} at={b(0)} hat="sailor" face="serious" arms="point" seed={731} />
    <Sh p={[[700, 700], [800, 640], [900, 700], [980, 640]]} open at={w(0, 'hoses')} d={5} w={22} c={PAL.red} seed={732} />
    <Tx x={840} y={560} at={w(0, 'dark')} size={64} c={PAL.yellow}>IN THE DARK</Tx>
    <G x={1300} y={600}><Sh p={rect(-110, -220, 220, 400)} f={PAL.grey} at={w(1, 'door')} d={5} seed={733} />
      <Sh p={ell(60, 0, 20, 20, 8)} f={PAL.yellow} at={w(1, 'door') + 4} d={0} w={4} seed={734} /></G>
    <Check x={1300} y={300} at={w(1, 'close')} s={1.2} />
    <G x={1640} y={640}><Sh p={ell(0, 0, 70, 50)} f={PAL.black} at={w(1, 'hole')} d={4} seed={735} />
      <Sh p={rect(-90, -70, 180, 140)} f={PAL.brown} at={w(1, 'patch')} d={4} seed={736} /></G>
    <Check x={1640} y={440} at={w(1, 'patch') + 4} s={1.2} />
  </Board>
);

// S74 — boring drills = ship alive
export const S74: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HA}>
    <Bucket x={300} y={560} s={1.1} at={w(0, 'boring')} />
    <Bell x={540} y={520} s={0.8} at={w(0, 'drills')} ring={false} />
    <PText x={420} y={820} at={w(0, 'boring')} size={100} font="bang" anchor="middle">BORING DRILLS</PText>
    <PText x={900} y={640} at={w(0, 'kept')} size={200} font="bang" color={PAL.red} anchor="middle">=</PText>
    <Destroyer x={1450} y={620} s={0.6} at={w(0, 'alive')} />
    <PText x={1450} y={820} at={w(0, 'alive')} size={100} font="bang" color={PAL.green} anchor="middle" outline={PAL.black}>SHIP ALIVE</PText>
  </Board>
);

// S75 — the answer to the title
export const S75: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} hdr={HA}>
    <PText x={960} y={260} at={b(0)} size={100} font="bang" anchor="middle">WHAT DID THEY DO ALL DAY?</PText>
    <PText x={960} y={540} at={w(1, 'kept')} size={190} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>KEPT THE SHIP</PText>
    <PText x={960} y={760} at={w(1, 'alive')} size={230} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>ALIVE</PText>
    <Soldier x={240} y={1060} s={0.9} at={w(1, 'Mostly')} hat="sailor" face="smirk" arms="hip" seed={751} />
  </Board>
);

// S76 — scraped, cleaned, watched, practiced; months of boring days for one terrible hour
export const S76: React.FC<SP> = ({b, w, L}) => {
  const p = useProg(w(1, 'months'), w(1, 'months') + 40);
  const p2 = useProg(w(1, 'one'), w(1, 'one') + 8);
  return (
    <Board L={L} hdr={HA}>
      <Hammer x={200} y={260} s={0.8} at={w(0, 'scraped')} r={-30} />
      <Mop x={420} y={300} s={0.7} at={w(0, 'cleaned')} />
      <Tx x={640} y={300} at={w(0, 'watched')} size={70} font="bang">WATCH</Tx>
      <Bell x={880} y={260} s={0.6} at={w(0, 'practiced')} ring={false} />
      <Sh p={rect(180, 560, 1300 * p + 1, 140)} f={PAL.lgrey} at={w(1, 'months')} d={0} seed={761} />
      <Tx x={200} y={530} at={w(1, 'months')} size={70} a="start">MONTHS OF BORING DAYS</Tx>
      <Sh p={rect(180, 820, 60 * p2 + 1, 140)} f={PAL.red} at={w(1, 'one')} d={0} seed={762} />
      <Tx x={200} y={790} at={w(1, 'one')} size={70} a="start" c={PAL.red}>ONE TERRIBLE HOUR</Tx>
      <Arrow a={[700, 900]} b={[300, 900]} at={w(1, 'terrible')} seed={763} />
    </Board>
  );
};

// S77 — Laffey survived; museum ship in South Carolina today
export const S77: React.FC<SP> = ({b, w, L}) => (
  <Board L={L} bg={PAL.turq}>
    <Sh p={rect(1300, 700, 620, 400)} f={PAL.lgrey} at={w(1, 'Today')} d={5} seed={771} />
    <Destroyer x={760} y={780} s={0.9} at={b(0)} />
    <Waves y={800} at={b(0)} amp={6} />
    {[0, 1, 2].map((i) => <Soldier key={i} x={1450 + i * 150} y={700} s={0.4} at={w(1, 'walk') + i * 2} hat="none" face="grin" seed={772 + i * 10} />)}
    <PText x={760} y={280} at={w(0, 'survived')} size={130} font="bang" color={PAL.green} anchor="middle" outline={PAL.black}>SURVIVED THE WAR</PText>
    <Label x={1500} y={460} to={[1100, 640]} at={w(2, 'museum')} size={70}>MUSEUM SHIP</Label>
    <PText x={1500} y={1000} at={w(2, 'South')} size={80} font="bang" anchor="middle">SOUTH CAROLINA</PText>
  </Board>
);

// S78 — outro bridge: sailors had a bed; bomber crews -> coldest sky
export const S78: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <Soldier x={420} y={900} s={1.1} at={b(0)} hat="sailor" face="grin" seed={781} />
    <Sh p={rect(160, 920, 520, 60)} f={PAL.tan} at={w(0, 'bed')} d={4} seed={782} />
    <Tx x={420} y={1040} at={w(0, 'meal')} size={60}>BED + HOT MEAL</Tx>
    <Sh p={[[960, 120], [960, 1000]]} open at={b(1)} d={5} w={8} c={PAL.grey} seed={783} />
    <G x={1440} y={0}><Sh p={rect(-480, 0, 960, 1080)} f={PAL.dblue} at={b(1)} d={0} seed={784} /></G>
    <Plane x={1440} y={420} s={1.4} at={w(1, 'Bomber')} c={PAL.lgrey} />
    <PText x={1440} y={760} at={w(1, 'coldest')} size={110} font="bang" color={PAL.white} anchor="middle" outline={PAL.black}>COLDEST SKY</PText>
    <PText x={1440} y={900} at={w(1, 'deadliest')} size={90} font="bang" color={PAL.yellow} anchor="middle">DEADLIEST?</PText>
  </Board>
);

// S79 — next video + subscribe
export const S79: React.FC<SP> = ({b, w, L}) => (
  <Board L={L}>
    <PText x={960} y={260} at={b(0)} size={110} font="bang" anchor="middle">NEXT VIDEO</PText>
    <PText x={960} y={470} at={b(0) + 3} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>WHAT DID BOMBER CREWS</PText>
    <PText x={960} y={640} at={b(0) + 6} size={150} font="bang" color={PAL.red} anchor="middle" outline={PAL.black}>DO ALL DAY?</PText>
    <PopAt at={w(1, 'Subscribe')} x={960} y={880}><G x={960} y={880}>
      <Sh p={rect(-300, -80, 600, 160)} f={PAL.red} at={w(1, 'Subscribe')} d={0} seed={791} />
      <Tx y={36} at={w(1, 'Subscribe')} size={100} font="bang" c={PAL.white}>SUBSCRIBE</Tx>
    </G></PopAt>
    <Soldier x={1700} y={1060} s={0.8} at={b(1)} hat="sailor" face="grin" arms="pointL" seed={792} />
  </Board>
);
