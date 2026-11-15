// Navy / sea drawables for WarBoard (code-drawn MS-Paint look, 0 credits). Same conventions as Kit.tsx.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PAL, P, ell, rect} from './wobble';
import {G, Sh, Tx, star} from './Kit';

export const NV = {hull: '#8A9AA5', deck: '#C3C3C3', night: '#1B2340', sea: '#00A2E8', dsea: '#3F48CC', rust: '#B05A2A', fire: '#FF7F27'};

// side-view destroyer, bow to the right. origin = waterline centre. ~900 px long at s=1
export const Destroyer: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number; flag?: boolean; dark?: boolean}> = ({x, y, s = 1, at, r = 0, seed = 700, flag = true, dark}) => {
  const hull = dark ? '#2C3550' : NV.hull;
  return (
    <G x={x} y={y} s={s} r={r}>
      <Sh p={[[-450, -60], [470, -70], [400, 30], [-430, 30]]} f={hull} at={at} d={7} seed={seed} />
      <Sh p={rect(-260, -130, 300, 70)} f={hull} at={at + 3} d={5} seed={seed + 1} />
      <Sh p={rect(60, -190, 120, 130)} f={hull} at={at + 4} d={5} seed={seed + 2} />
      <Sh p={rect(80, -170, 80, 26)} f={dark ? '#556' : PAL.turq} at={at + 8} d={0} w={5} seed={seed + 3} />
      <Sh p={rect(-150, -200, 50, 72)} f={PAL.grey} at={at + 5} d={0} seed={seed + 4} />
      <Sh p={rect(-60, -200, 50, 72)} f={PAL.grey} at={at + 5} d={0} seed={seed + 5} />
      <Sh p={[[110, -190], [110, -300]]} open at={at + 6} d={0} w={8} seed={seed + 6} />
      <Sh p={[[70, -270], [150, -270]]} open at={at + 6} d={0} w={7} seed={seed + 7} />
      {/* gun turrets fore & aft */}
      <Sh p={[[250, -60], [260, -100], [330, -100], [340, -60]]} f={hull} at={at + 6} d={0} seed={seed + 8} />
      <Sh p={[[320, -86], [420, -96]]} open at={at + 7} d={0} w={12} seed={seed + 9} />
      <Sh p={[[-380, -60], [-370, -100], [-300, -100], [-290, -60]]} f={hull} at={at + 6} d={0} seed={seed + 10} />
      <Sh p={[[-380, -86], [-460, -96]]} open at={at + 7} d={0} w={12} seed={seed + 11} />
      <Tx x={-330} y={10} at={at + 8} size={40} c={PAL.white}>DD</Tx>
      {flag ? <Sh p={[[110, -300], [170, -290], [110, -270]]} f={PAL.red} at={at + 8} d={0} w={4} seed={seed + 12} /> : null}
    </G>
  );
};

// big ship (oiler / carrier silhouette), bow right
export const BigShip: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; label?: string}> = ({x, y, s = 1, at, seed = 720, label}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-560, -110], [600, -120], [540, 40], [-540, 40]]} f={PAL.grey} at={at} d={7} seed={seed} />
    <Sh p={rect(-500, -190, 140, 80)} f={PAL.lgrey} at={at + 4} d={4} seed={seed + 1} />
    <Sh p={rect(380, -230, 120, 120)} f={PAL.lgrey} at={at + 4} d={4} seed={seed + 2} />
    <Sh p={rect(-440, -260, 40, 70)} f={PAL.grey} at={at + 5} d={0} seed={seed + 3} />
    {label ? <Tx y={-20} at={at + 7} size={70} font="bang" c={PAL.white} o={PAL.black}>{label}</Tx> : null}
  </G>
);

// rolling sea surface with a slow wave loop (y = water level)
export const Waves: React.FC<{y: number; at: number; color?: string; seed?: number; amp?: number}> = ({y, at, color = NV.sea, seed = 730, amp = 18}) => {
  const f = useCurrentFrame();
  const ph = (f - at) / 12;
  const pts: P[] = [];
  for (let x = -60; x <= 1980; x += 80) pts.push([x, y + Math.sin(x / 120 + ph) * amp]);
  return <Sh p={[...pts, [1980, 1160], [-60, 1160]]} f={color} at={at} d={5} seed={seed} />;
};

// rocking wrapper (ship roll loop)
export const Rock: React.FC<{x: number; y: number; deg?: number; speed?: number; at?: number; children: React.ReactNode}> = ({x, y, deg = 5, speed = 14, at = 0, children}) => {
  const f = useCurrentFrame();
  const a = Math.sin((f - at) / speed) * deg;
  return <g transform={`rotate(${a},${x},${y})`}>{children}</g>;
};

export const Moon: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 740}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[...ell(0, 0, 80, 80, 20).slice(5, 16), [-10, 50], [-30, 0], [-10, -50]] as P[]} f={PAL.yellow} at={at} d={5} seed={seed} />
  </G>
);
export const Stars: React.FC<{at: number; n?: number; seed?: number; maxY?: number}> = ({at, n = 18, seed = 3, maxY = 500}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <g>{Array.from({length: n}, (_, i) => {
      const x = (i * 433 + seed * 97) % 1880 + 20, y = (i * 149 + seed * 53) % maxY + 20;
      const tw = 0.7 + 0.3 * Math.sin((f + i * 7) / 6);
      return <circle key={i} cx={x} cy={y} r={5 * tw} fill={PAL.yellow} />;
    })}</g>
  );
};
export const Sun: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; c?: string}> = ({x, y, s = 1, at, seed = 750, c = PAL.yellow}) => (
  <G x={x} y={y} s={s}>
    <Sh p={star(0, 0, 150, 110, 12)} f={PAL.orange} at={at} d={0} seed={seed} />
    <Sh p={ell(0, 0, 100, 100)} f={c} at={at} d={5} seed={seed + 1} />
  </G>
);

// alarm bell with ringing lines (loop)
export const Bell: React.FC<{x: number; y: number; s?: number; at: number; ring?: boolean; seed?: number}> = ({x, y, s = 1, at, ring = true, seed = 760}) => {
  const f = useCurrentFrame();
  const a = ring ? Math.sin((f - at) * 1.3) * 12 : 0;
  return (
    <G x={x} y={y} s={s}>
      <g transform={`rotate(${a})`}>
        <Sh p={[[-90, 40], [-70, -40], [-40, -90], [40, -90], [70, -40], [90, 40]]} f={PAL.red} at={at} d={5} seed={seed} />
        <Sh p={ell(0, 40, 100, 20)} f={PAL.dred} at={at + 4} d={0} seed={seed + 1} />
        <Sh p={ell(0, 72, 18, 18, 10)} f={PAL.grey} at={at + 4} d={0} seed={seed + 2} />
      </g>
      {ring && f >= at + 6 ? [-1, 1].map((k) => (
        <g key={k}>
          <Sh p={[[k * 130, -60], [k * 170, -90]]} open at={at + 6} d={0} w={9} seed={seed + 3 + k} />
          <Sh p={[[k * 140, 0], [k * 190, 0]]} open at={at + 6} d={0} w={9} seed={seed + 5 + k} />
          <Sh p={[[k * 130, 60], [k * 170, 90]]} open at={at + 6} d={0} w={9} seed={seed + 7 + k} />
        </g>
      )) : null}
    </G>
  );
};

// deck gun (twin barrels) on a base, firing flash optional
export const DeckGun: React.FC<{x: number; y: number; s?: number; at: number; fire?: number; web?: number; seed?: number}> = ({x, y, s = 1, at, fire, web, seed = 780}) => {
  const f = useCurrentFrame();
  return (
    <G x={x} y={y} s={s}>
      <Sh p={[[-160, 0], [-140, -120], [120, -120], [160, 0]]} f={NV.hull} at={at} d={6} seed={seed} />
      <Sh p={[[60, -100], [380, -260]]} open at={at + 4} d={4} w={26} seed={seed + 1} />
      <Sh p={[[60, -60], [390, -210]]} open at={at + 4} d={4} w={26} seed={seed + 2} />
      {fire !== undefined && f >= fire && f < fire + 18 ? <Sh p={star(420, -250, 110, 50, 9)} f={PAL.yellow} at={fire} d={0} seed={seed + 3} /> : null}
      {web !== undefined ? (<g>
        {[0, 1, 2, 3].map((i) => <Sh key={i} p={[[300, -230], [300 + Math.cos(i * 0.9 - 1) * 120, -230 + Math.sin(i * 0.9 - 1) * 120]]} open at={web} d={3} w={3} c={PAL.grey} seed={seed + 5 + i} />)}
        {[50, 90].map((r, i) => <Sh key={i} p={ell(300, -230, r, r, 10).slice(0, 7)} open at={web + 2} d={3} w={3} c={PAL.grey} seed={seed + 10 + i} />)}
        <Sh p={ell(330, -180, 10, 8, 8)} f={PAL.black} at={web + 4} d={0} w={2} seed={seed + 13} />
      </g>) : null}
    </G>
  );
};

export const Plane: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number; c?: string}> = ({x, y, s = 1, at, r = 0, seed = 800, c = PAL.grey}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={[[-120, 0], [-90, -18], [110, -14], [130, 0], [110, 14], [-90, 18]]} f={c} at={at} d={4} seed={seed} />
    <Sh p={[[-10, -10], [30, -110], [60, -110], [40, -10]]} f={c} at={at + 3} d={0} seed={seed + 1} />
    <Sh p={[[-10, 10], [30, 110], [60, 110], [40, 10]]} f={c} at={at + 3} d={0} seed={seed + 2} />
    <Sh p={[[-110, -5], [-140, -50], [-120, -50], [-90, -10]]} f={c} at={at + 3} d={0} seed={seed + 3} />
  </G>
);
export const Bomb: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number}> = ({x, y, s = 1, at, r = 90, seed = 810}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={ell(0, 0, 70, 30)} f={PAL.black} at={at} d={4} seed={seed} />
    <Sh p={[[-60, 0], [-100, -30], [-100, 30]]} f={PAL.black} at={at} d={0} seed={seed + 1} />
  </G>
);
// cartoon flames (flicker loop) — no gore
export const Flames: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 820}) => {
  const f = useCurrentFrame();
  const k = 1 + Math.sin((f - at) / 2.5) * 0.08;
  return (
    <G x={x} y={y} s={s}>
      <g transform={`scale(1,${k})`}>
        <Sh p={[[-80, 0], [-90, -80], [-50, -60], [-30, -150], [10, -80], [40, -130], [60, -60], [90, -90], [80, 0]]} f={PAL.orange} at={at} d={0} seed={seed} />
        <Sh p={[[-40, 0], [-44, -50], [-10, -40], [10, -90], [30, -40], [44, 0]]} f={PAL.yellow} at={at} d={0} seed={seed + 1} />
      </g>
    </G>
  );
};
export const Smoke: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 830}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 10;
  return (
    <G x={x} y={y} s={s}>{f >= at ? [0, 1, 2].map((i) => (
      <Sh key={i} p={ell(Math.sin(t + i) * 10 + i * 20, -i * 70, 50 + i * 15, 36 + i * 10, 12)} f={PAL.grey} at={at} d={0} w={5} seed={seed + i} />
    )) : null}</G>
  );
};
export const LifeRing: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 840}) => (
  <G x={x} y={y} s={s}>
    <Sh p={ell(0, 0, 110, 110)} f={PAL.white} at={at} d={6} seed={seed} />
    {[0, 1, 2, 3].map((i) => {
      const a = (i * Math.PI) / 2 + 0.4;
      return <Sh key={i} p={[[Math.cos(a - 0.3) * 110, Math.sin(a - 0.3) * 110], [Math.cos(a + 0.3) * 110, Math.sin(a + 0.3) * 110], [Math.cos(a + 0.3) * 55, Math.sin(a + 0.3) * 55], [Math.cos(a - 0.3) * 55, Math.sin(a - 0.3) * 55]]} f={PAL.red} at={at + 5} d={0} w={5} seed={seed + 1 + i} />;
    })}
    <Sh p={ell(0, 0, 55, 55)} f={PAL.white} at={at + 5} d={0} seed={seed + 6} />
  </G>
);
export const Bucket: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; c?: string; label?: string}> = ({x, y, s = 1, at, seed = 850, c = PAL.lgrey, label}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-70, -70], [70, -70], [55, 70], [-55, 70]]} f={c} at={at} d={5} seed={seed} />
    <Sh p={ell(0, -70, 70, 16)} f={PAL.blue} at={at + 5} d={0} seed={seed + 1} />
    <Sh p={[[-70, -70], [0, -150], [70, -70]]} open at={at + 5} d={0} w={6} seed={seed + 2} />
    {label ? <Tx y={30} at={at + 6} size={40}>{label}</Tx> : null}
  </G>
);
export const PaintCan: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; label?: string}> = ({x, y, s = 1, at, seed = 855, label = 'GREY'}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-80, -90, 160, 180)} f={PAL.grey} at={at} d={5} seed={seed} />
    <Sh p={ell(0, -90, 80, 18)} f={PAL.lgrey} at={at + 5} d={0} seed={seed + 1} />
    <Sh p={rect(-80, -40, 160, 70)} f={PAL.white} at={at + 5} d={0} w={5} seed={seed + 2} />
    <Tx y={14} at={at + 6} size={44}>{label}</Tx>
    <Sh p={[[-80, -90], [0, -170], [80, -90]]} open at={at + 5} d={0} w={6} seed={seed + 3} />
  </G>
);
export const Mop: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number}> = ({x, y, s = 1, at, r = 0, seed = 860}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={[[0, -260], [0, 40]]} open at={at} d={4} w={14} c={PAL.brown} seed={seed} />
    {[-50, -25, 0, 25, 50].map((a, i) => <Sh key={i} p={[[0, 40], [a, 120]]} open at={at + 4} d={0} w={12} c={PAL.lgrey} seed={seed + 1 + i} />)}
  </G>
);
export const Hammer: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number}> = ({x, y, s = 1, at, r = 0, seed = 870}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={[[0, 0], [0, 150]]} open at={at} d={3} w={14} c={PAL.brown} seed={seed} />
    <Sh p={[[-50, -24], [60, -24], [70, 0], [60, 20], [-50, 20]]} f={PAL.grey} at={at + 3} d={0} seed={seed + 1} />
  </G>
);
export const Roller: React.FC<{x: number; y: number; s?: number; at: number; r?: number; seed?: number}> = ({x, y, s = 1, at, r = 0, seed = 875}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={rect(-80, -30, 160, 60)} f={PAL.lgrey} at={at} d={4} seed={seed} />
    <Sh p={[[80, 0], [110, 0], [110, 60], [20, 90], [20, 220]]} open at={at + 3} d={3} w={10} seed={seed + 1} />
  </G>
);
export const Drop: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; c?: string}> = ({x, y, s = 1, at, seed = 880, c = PAL.blue}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[0, -90], [40, -20], [55, 20], [40, 55], [0, 70], [-40, 55], [-55, 20], [-40, -20]]} f={c} at={at} d={5} seed={seed} />
    <Sh p={[[-22, 10], [-18, 36]]} open at={at + 5} d={0} c={PAL.white} w={8} seed={seed + 1} />
  </G>
);
export const FuelCan: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 885}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-70, -80], [40, -80], [70, -50], [70, 90], [-70, 90]]} f={PAL.red} at={at} d={5} seed={seed} />
    <Sh p={rect(-30, -110, 40, 30)} f={PAL.grey} at={at + 5} d={0} seed={seed + 1} />
    <Tx y={30} at={at + 6} size={50} font="bang" c={PAL.white}>FUEL</Tx>
  </G>
);
// semicircle gauge, needle angle from value 0..1 (0 = empty, left)
export const Gauge: React.FC<{x: number; y: number; s?: number; at: number; v: number; seed?: number; lo?: string; hi?: string}> = ({x, y, s = 1, at, v, seed = 890, lo = 'E', hi = 'F'}) => {
  const a = Math.PI * (1 - v);
  return (
    <G x={x} y={y} s={s}>
      <Sh p={[...ell(0, 0, 200, 200, 30).slice(15), [200, 0]] as P[]} f={PAL.white} at={at} d={6} seed={seed} />
      <Sh p={[...ell(0, 0, 200, 200, 30).slice(15, 19), [0, 0]] as P[]} f={PAL.red} at={at + 5} d={0} w={4} seed={seed + 1} />
      <Tx x={-150} y={-20} at={at + 6} size={50}>{lo}</Tx>
      <Tx x={150} y={-20} at={at + 6} size={50}>{hi}</Tx>
      <Sh p={[[0, 0], [Math.cos(a) * 170, -Math.sin(a) * 170]]} open at={at + 6} d={0} w={10} seed={seed + 2} />
    </G>
  );
};
export const Spiral: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 900}) => {
  const f = useCurrentFrame();
  const rot = (f - at) * 4;
  const pts: P[] = Array.from({length: 40}, (_, i) => {
    const t = i / 39 * Math.PI * 5;
    return [Math.cos(t) * (10 + t * 14), Math.sin(t) * (10 + t * 14)] as P;
  });
  return <G x={x} y={y} s={s} r={rot}><Sh p={pts} open at={at} d={8} w={12} c={PAL.dblue} seed={seed} /></G>;
};
export const Envelope: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; r?: number}> = ({x, y, s = 1, at, seed = 910, r = 0}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={rect(-140, -90, 280, 180)} f={PAL.white} at={at} d={5} seed={seed} />
    <Sh p={[[-140, -90], [0, 20], [140, -90]]} open at={at + 5} d={0} w={6} seed={seed + 1} />
    <Sh p={rect(80, -70, 40, 46)} f={PAL.red} at={at + 6} d={0} w={4} seed={seed + 2} />
  </G>
);
export const MailBag: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 915}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-30, -120], [30, -120], [20, -90], [90, -30], [100, 60], [60, 90], [-60, 90], [-100, 60], [-90, -30], [-20, -90]]} f={PAL.tan} at={at} d={6} seed={seed} />
    <Tx y={40} at={at + 6} size={46} font="bang">MAIL</Tx>
  </G>
);
export const Card: React.FC<{x: number; y: number; s?: number; at: number; r?: number; t: string; red?: boolean; seed?: number}> = ({x, y, s = 1, at, r = 0, t, red, seed = 920}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={rect(-60, -85, 120, 170)} f={PAL.white} at={at} d={4} seed={seed} />
    <Tx y={30} at={at + 4} size={90} font="bang" c={red ? PAL.red : PAL.black}>{t}</Tx>
  </G>
);
export const Dice: React.FC<{x: number; y: number; s?: number; at: number; n?: number; r?: number; seed?: number}> = ({x, y, s = 1, at, n = 5, r = 0, seed = 930}) => {
  const dots: Record<number, P[]> = {1: [[0, 0]], 3: [[-30, -30], [0, 0], [30, 30]], 5: [[-30, -30], [30, -30], [0, 0], [-30, 30], [30, 30]], 6: [[-30, -34], [30, -34], [-30, 0], [30, 0], [-30, 34], [30, 34]]};
  return (
    <G x={x} y={y} s={s} r={r}>
      <Sh p={rect(-60, -60, 120, 120)} f={PAL.white} at={at} d={4} seed={seed} />
      {(dots[n] || dots[5]).map(([a, b], i) => <Sh key={i} p={ell(a, b, 9, 9, 8)} f={PAL.black} at={at + 4} d={0} w={2} seed={seed + 1 + i} />)}
    </G>
  );
};
export const Periscope: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 940}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[0, 0], [0, -140], [40, -140]]} open at={at} d={4} w={14} c={PAL.grey} seed={seed} />
    <Sh p={[[-40, 10], [40, 10]]} open at={at + 4} d={0} w={6} c={PAL.white} seed={seed + 1} />
  </G>
);
export const Radar: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 945}) => {
  const f = useCurrentFrame();
  const r = ((f - at) % 30) / 30;
  return (
    <G x={x} y={y} s={s}>
      {f >= at ? [0, 1, 2].map((i) => {
        const k = ((r + i / 3) % 1);
        return <circle key={i} cx={0} cy={0} r={40 + k * 260} fill="none" stroke={PAL.green} strokeWidth={8} opacity={1 - k} />;
      }) : null}
    </G>
  );
};
export const Cross: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 950}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-12, -60], [12, -60], [12, -30], [40, -30], [40, -8], [12, -8], [12, 60], [-12, 60], [-12, -8], [-40, -8], [-40, -30], [-12, -30]]} f={PAL.white} at={at} d={0} w={5} seed={seed} />
  </G>
);
export const Thermo: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 955}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-20, 60], [-20, -140], [0, -160], [20, -140], [20, 60]]} f={PAL.white} at={at} d={4} seed={seed} />
    <Sh p={ell(0, 80, 40, 40)} f={PAL.red} at={at + 4} d={0} seed={seed + 1} />
    <Sh p={rect(-8, -130, 16, 200)} f={PAL.red} at={at + 4} d={0} w={3} seed={seed + 2} />
  </G>
);
// stacked canvas racks (bunks): n levels
export const Racks: React.FC<{x: number; y: number; s?: number; at: number; n?: number; seed?: number; men?: boolean}> = ({x, y, s = 1, at, n = 4, seed = 960, men = true}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-240, 0], [-240, -n * 130 - 20]]} open at={at} d={4} w={10} c={PAL.grey} seed={seed} />
    <Sh p={[[240, 0], [240, -n * 130 - 20]]} open at={at} d={4} w={10} c={PAL.grey} seed={seed + 1} />
    {Array.from({length: n}, (_, i) => (
      <g key={i}>
        <Sh p={rect(-230, -i * 130 - 40, 460, 30)} f={PAL.tan} at={at + 3 + i * 2} d={0} seed={seed + 2 + i} />
        {men ? <g>
          <Sh p={ell(-160, -i * 130 - 70, 34, 30)} f={PAL.white} at={at + 5 + i * 2} d={0} w={5} seed={seed + 10 + i} />
          <Sh p={[[-160, -i * 130 - 70], [-130, -i * 130 - 70]]} open at={at + 5 + i * 2} d={0} w={4} seed={seed + 20 + i} />
          <Sh p={[[-120, -i * 130 - 50], [200, -i * 130 - 50]]} open at={at + 5 + i * 2} d={0} w={8} seed={seed + 30 + i} />
        </g> : null}
      </g>
    ))}
  </G>
);
export const Binoculars: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 990}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-60, -30, 50, 70)} f={PAL.black} at={at} d={0} seed={seed} />
    <Sh p={rect(10, -30, 50, 70)} f={PAL.black} at={at} d={0} seed={seed + 1} />
    <Sh p={ell(-35, 44, 26, 10)} f={PAL.turq} at={at} d={0} w={4} seed={seed + 2} />
    <Sh p={ell(35, 44, 26, 10)} f={PAL.turq} at={at} d={0} w={4} seed={seed + 3} />
  </G>
);
// rectangular "speech bubble"
export const Bubble: React.FC<{x: number; y: number; at: number; text: string; w?: number; size?: number; seed?: number}> = ({x, y, at, text, w = 300, size = 54, seed = 995}) => (
  <G x={x} y={y}>
    <Sh p={[[-w / 2, -60], [w / 2, -60], [w / 2, 40], [-w / 2 + 70, 40], [-w / 2 + 30, 90], [-w / 2 + 40, 40], [-w / 2, 40]]} f={PAL.white} at={at} d={4} seed={seed} />
    <Tx y={4} at={at + 3} size={size}>{text}</Tx>
  </G>
);
export const Zzz: React.FC<{x: number; y: number; at: number; s?: number}> = ({x, y, at, s = 1}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 15;
  return <G x={x} y={y} s={s}>{f >= at ? [0, 1, 2].map((i) => <Tx key={i} x={i * 40 + Math.sin(t + i) * 6} y={-i * 50} at={at + i * 3} size={50 + i * 14} font="bang" c={PAL.dblue}>Z</Tx>) : null}</G>;
};
