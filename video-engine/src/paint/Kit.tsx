// Reusable MS-Paint drawables for WarBoard explainers (code-drawn, 0 credits).
// Every object is drawn around its own origin and placed with x/y/s. `at` = first frame (scene-local).
// Outline draws on fast (≈0.2 s), flat fill pops, details pop right after.
import React, {createContext, useContext} from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {PShape, PText} from './Paint';
import {ell, rect, PAL, P} from './wobble';

export const WW = {olive: '#6B7B3A', khaki: '#C2B280', steel: '#6E7B85', choc: '#6B3A1E', bread: '#7A4A26', sea: '#00A2E8', sand: '#F3D98B'};

const K = createContext(1);
// placement group: translate + scale (+ rotation); children read the scale to keep 7 px lines
export const G: React.FC<{x: number; y: number; s?: number; r?: number; children: React.ReactNode}> = ({x, y, s = 1, r = 0, children}) => {
  const parent = useContext(K);
  return (
    <K.Provider value={parent * s}>
      <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>{children}</g>
    </K.Provider>
  );
};

// shape inside a G: line width stays ~7 px on screen
export const Sh: React.FC<{p: P[]; f?: string; at: number; d?: number; seed?: number; c?: string; w?: number; open?: boolean; amp?: number}> = ({
  p, f, at, d = 6, seed = 1, c = PAL.black, w = 7, open, amp = 2.2,
}) => {
  const k = useContext(K);
  return <PShape pts={p} closed={!open} fill={f} at={at} draw={d} sw={w / k} color={c} seed={seed} amp={amp / k} />;
};

// text inside a G (Patrick Hand by default)
export const Tx: React.FC<{x?: number; y?: number; at: number; size: number; c?: string; font?: 'hand' | 'bang'; a?: 'start' | 'middle' | 'end'; r?: number; o?: string; children: string}> = ({
  x = 0, y = 0, at, size, c = PAL.black, font = 'hand', a = 'middle', r = 0, o, children,
}) => <PText x={x} y={y} at={at} size={size} color={c} font={font} anchor={a} rot={r} outline={o}>{children}</PText>;

// pop-in with overshoot around (x,y)
export const PopAt: React.FC<{at: number; x: number; y: number; children: React.ReactNode}> = ({at, x, y, children}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = interpolate(f, [at, at + 3, at + 6], [0.6, 1.08, 1], {extrapolateRight: 'clamp'});
  return <g transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>{children}</g>;
};

export const star = (cx: number, cy: number, r1: number, r2: number, n = 8): P[] =>
  Array.from({length: n * 2}, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? r2 : r1;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
  });

// ---------- callouts ----------
export const Circle: React.FC<{x: number; y: number; rx: number; ry: number; at: number; seed?: number}> = ({x, y, rx, ry, at, seed = 900}) => (
  <PShape pts={ell(x, y, rx, ry, 34, -0.3)} at={at} draw={8} sw={10} color={PAL.red} amp={4} seed={seed} />
);
export const Under: React.FC<{x1: number; x2: number; y: number; at: number; seed?: number}> = ({x1, x2, y, at, seed = 910}) => (
  <PShape pts={[[x1, y], [(x1 + x2) / 2, y - 8], [x2, y]]} closed={false} at={at} draw={6} sw={11} color={PAL.red} amp={3} seed={seed} />
);
// red hand-drawn arrow from a to b (curved via mid offset)
export const Arrow: React.FC<{a: P; b: P; at: number; bend?: number; seed?: number; c?: string; w?: number}> = ({a, b, at, bend = 0, seed = 920, c = PAL.red, w = 10}) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const m: P = [mx - (dy / L) * bend, my + (dx / L) * bend];
  const ang = Math.atan2(b[1] - m[1], b[0] - m[0]);
  const h = 34;
  const h1: P = [b[0] - Math.cos(ang - 0.5) * h, b[1] - Math.sin(ang - 0.5) * h];
  const h2: P = [b[0] - Math.cos(ang + 0.5) * h, b[1] - Math.sin(ang + 0.5) * h];
  return (
    <g>
      <PShape pts={[a, m, b]} closed={false} at={at} draw={6} sw={w} color={c} amp={2.5} seed={seed} />
      <PShape pts={[h1, b, h2]} closed={false} at={at + 6} draw={0} sw={w} color={c} amp={1.5} seed={seed + 1} />
    </g>
  );
};
// label + arrow pointing at a spot
export const Label: React.FC<{x: number; y: number; to?: P; at: number; size?: number; children: string; c?: string; seed?: number; a?: 'start' | 'middle' | 'end'}> = ({
  x, y, to, at, size = 64, children, c = PAL.red, seed = 940, a = 'middle',
}) => (
  <g>
    <PText x={x} y={y} at={at} size={size} color={c} anchor={a}>{children}</PText>
    {to ? <Arrow a={[x + (a === 'start' ? 40 : a === 'end' ? -40 : 0), y + 14]} b={to} at={at + 2} bend={30} seed={seed} c={c} /> : null}
  </g>
);
export const Check: React.FC<{x: number; y: number; at: number; s?: number}> = ({x, y, at, s = 1}) => (
  <G x={x} y={y} s={s}><Sh p={[[-30, 0], [-8, 26], [36, -34]]} open at={at} d={4} c={PAL.green} w={14} seed={950} /></G>
);
export const XMark: React.FC<{x: number; y: number; at: number; s?: number; seed?: number}> = ({x, y, at, s = 1, seed = 960}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-34, -34], [34, 34]]} open at={at} d={3} c={PAL.red} w={14} seed={seed} />
    <Sh p={[[34, -34], [-34, 34]]} open at={at + 3} d={3} c={PAL.red} w={14} seed={seed + 1} />
  </G>
);
export const Hit: React.FC<{x: number; y: number; at: number; s?: number}> = ({x, y, at, s = 1}) => (
  <PopAt at={at} x={x} y={y}><G x={x} y={y} s={s}>
    <Sh p={star(0, 0, 110, 50, 8)} f={PAL.yellow} at={at} d={0} seed={970} />
    <Sh p={ell(0, 0, 40, 32, 12)} f={PAL.orange} at={at} d={0} seed={971} />
  </G></PopAt>
);

// ---------- people ----------
export type Face = 'panic' | 'grin' | 'worry' | 'serious' | 'sad' | 'disgust' | 'smirk' | 'shock' | 'suspicious';
export type Hat = 'us' | 'jp' | 'it' | 'ru' | 'de' | 'uk' | 'officer' | 'sailor' | 'none' | 'afrika';
export type Arms = 'down' | 'up' | 'point' | 'pointL' | 'hold' | 'holdL' | 'hip' | 'shrug' | 'eat';

const HatG: React.FC<{hat: Hat; at: number; seed: number}> = ({hat, at, seed}) => {
  const a = at + 5;
  switch (hat) {
    case 'us': return (<g>
      <Sh p={[[-72, -258], [-66, -305], [-36, -338], [0, -346], [36, -338], [66, -305], [72, -258]]} f={WW.olive} at={a} d={4} seed={seed} />
      <Sh p={[[-84, -252], [-80, -266], [80, -266], [84, -252]]} f={WW.olive} at={a} d={0} seed={seed + 1} />
      <Sh p={[[-34, -322], [-12, -330]]} open at={a + 2} d={0} c={PAL.white} w={8} seed={seed + 2} /></g>);
    case 'uk': return (<g>
      <Sh p={[[-104, -262], [-60, -300], [0, -318], [60, -300], [104, -262], [0, -252]]} f={WW.olive} at={a} d={4} seed={seed} />
      <Sh p={[[-40, -300], [-12, -308]]} open at={a + 2} d={0} c={PAL.white} w={8} seed={seed + 2} /></g>);
    case 'de': return (<g>
      <Sh p={[[-70, -250], [-68, -300], [-38, -336], [0, -344], [38, -336], [68, -300], [70, -250], [88, -228], [64, -236], [-64, -236], [-88, -228]]} f={WW.steel} at={a} d={4} seed={seed} />
      <Sh p={[[-34, -320], [-12, -328]]} open at={a + 2} d={0} c={PAL.white} w={8} seed={seed + 2} /></g>);
    case 'jp': return (<g transform="translate(0,-24)">
      <Sh p={[[-64, -262], [-58, -318], [0, -332], [58, -318], [64, -262]]} f={WW.khaki} at={a} d={4} seed={seed} />
      <Sh p={[[-66, -266], [-10, -270], [70, -258], [74, -246], [-4, -252]]} f={WW.khaki} at={a} d={0} seed={seed + 1} />
      <Sh p={[[-64, -262], [-78, -200], [-58, -196], [-50, -250]]} f={PAL.tan} at={a} d={0} seed={seed + 3} />
      <Sh p={[[-44, -302], [44, -302]]} open at={a} d={0} c={PAL.yellow} w={6} seed={seed + 4} /></g>);
    case 'it': return (<g transform="translate(0,-20)">
      <Sh p={[[-64, -268], [-56, -320], [0, -336], [56, -320], [64, -268]]} f={WW.khaki} at={a} d={4} seed={seed} />
      <Sh p={[[-80, -262], [-70, -276], [70, -276], [80, -262]]} f={WW.khaki} at={a} d={0} seed={seed + 1} />
      <Sh p={[[40, -320], [96, -380], [130, -360], [110, -330], [66, -306]]} f={PAL.black} at={a + 2} d={0} seed={seed + 3} /></g>);
    case 'afrika': return (<g>
      <Sh p={[[-62, -266], [-56, -318], [0, -330], [56, -318], [62, -266]]} f={WW.sand} at={a} d={4} seed={seed} />
      <Sh p={[[-66, -268], [0, -276], [76, -262], [70, -250], [0, -258]]} f={WW.sand} at={a} d={0} seed={seed + 1} />
      <Sh p={ell(-24, -322, 22, 14, 12)} f={PAL.turq} at={a + 2} d={0} seed={seed + 2} />
      <Sh p={ell(24, -322, 22, 14, 12)} f={PAL.turq} at={a + 2} d={0} seed={seed + 3} /></g>);
    case 'ru': return (<g>
      <Sh p={[[-70, -262], [-66, -320], [0, -340], [66, -320], [70, -262]]} f={PAL.grey} at={a} d={4} seed={seed} />
      <Sh p={[[-74, -270], [-86, -200], [-62, -196], [-58, -262]]} f={PAL.grey} at={a} d={0} seed={seed + 1} />
      <Sh p={[[74, -270], [86, -200], [62, -196], [58, -262]]} f={PAL.grey} at={a} d={0} seed={seed + 2} />
      <Sh p={[[-66, -290], [66, -290]]} open at={a} d={0} c={PAL.lgrey} w={10} seed={seed + 3} /></g>);
    case 'officer': return (<g>
      <Sh p={[[-70, -284], [-80, -326], [80, -326], [70, -284]]} f={WW.olive} at={a} d={4} seed={seed} />
      <Sh p={[[-62, -272], [-70, -290], [70, -290], [92, -268]]} f={PAL.black} at={a} d={0} seed={seed + 1} /></g>);
    case 'sailor': return (<g>
      <Sh p={[[-64, -276], [-58, -312], [58, -312], [64, -276]]} f={PAL.white} at={a} d={4} seed={seed} />
      <Sh p={[[-64, -284], [64, -284]]} open at={a} d={0} c={PAL.dblue} w={10} seed={seed + 1} /></g>);
    default: return null;
  }
};

const FaceG: React.FC<{face: Face; at: number; seed: number; look: number}> = ({face, at, seed, look}) => {
  const a = at + 8;
  const lx = look * 8;
  const big = face === 'panic' || face === 'shock' || face === 'disgust';
  const eyes = big ? (
    <g>
      <Sh p={ell(-24, -262, 20, 24)} f={PAL.white} at={a} d={0} w={5} seed={seed} />
      <Sh p={ell(24, -262, 20, 24)} f={PAL.white} at={a} d={0} w={5} seed={seed + 1} />
      <Sh p={ell(-24 + lx, -258, 5, 5, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed + 2} />
      <Sh p={ell(24 + lx, -258, 5, 5, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed + 3} />
    </g>
  ) : face === 'suspicious' ? (
    <g>
      <Sh p={[[-40, -262], [-8, -262]]} open at={a} d={0} w={6} seed={seed} />
      <Sh p={[[8, -262], [40, -262]]} open at={a} d={0} w={6} seed={seed + 1} />
      <Sh p={ell(-22 + lx, -256, 5, 5, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed + 2} />
      <Sh p={ell(26 + lx, -256, 5, 5, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed + 3} />
    </g>
  ) : (
    <g>
      <Sh p={ell(-22 + lx, -262, 7, 9, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed} />
      <Sh p={ell(22 + lx, -262, 7, 9, 8)} f={PAL.black} at={a} d={0} w={2} seed={seed + 1} />
    </g>
  );
  let mouth: React.ReactNode = null;
  if (face === 'panic' || face === 'shock') mouth = <Sh p={ell(0, -214, 16, 22)} f={PAL.black} at={a} d={0} w={4} seed={seed + 5} />;
  else if (face === 'grin') mouth = <Sh p={[[-34, -232], [34, -232], [20, -208], [0, -202], [-20, -208]]} f={PAL.white} at={a} d={0} w={5} seed={seed + 5} />;
  else if (face === 'smirk') mouth = <Sh p={[[-26, -220], [0, -216], [28, -230]]} open at={a} d={0} w={6} seed={seed + 5} />;
  else if (face === 'worry') mouth = <Sh p={[[-26, -214], [-10, -224], [6, -214], [24, -224]]} open at={a} d={0} w={6} seed={seed + 5} />;
  else if (face === 'serious') mouth = <Sh p={[[-22, -218], [22, -218]]} open at={a} d={0} w={6} seed={seed + 5} />;
  else if (face === 'sad') mouth = <Sh p={[[-24, -210], [0, -224], [24, -210]]} open at={a} d={0} w={6} seed={seed + 5} />;
  else if (face === 'suspicious') mouth = <Sh p={[[-18, -218], [18, -222]]} open at={a} d={0} w={6} seed={seed + 5} />;
  else if (face === 'disgust') mouth = (<g>
    <Sh p={[[-30, -226], [-8, -232], [10, -226], [30, -232], [30, -208], [-30, -208]]} f={PAL.black} at={a} d={0} w={4} seed={seed + 5} />
    <Sh p={[[-12, -212], [12, -212], [14, -184], [0, -178], [-14, -186]]} f={PAL.pink} at={a} d={0} w={4} seed={seed + 6} />
  </g>);
  const brows = face === 'worry' || face === 'sad' ? (<g>
    <Sh p={[[-40, -292], [-10, -284]]} open at={a} d={0} w={6} seed={seed + 7} />
    <Sh p={[[40, -292], [10, -284]]} open at={a} d={0} w={6} seed={seed + 8} /></g>)
    : face === 'serious' || face === 'suspicious' ? (<g>
    <Sh p={[[-42, -284], [-8, -278]]} open at={a} d={0} w={6} seed={seed + 7} />
    <Sh p={[[42, -284], [8, -278]]} open at={a} d={0} w={6} seed={seed + 8} /></g>)
    : big ? (<g>
    <Sh p={[[-44, -296], [-24, -304], [-6, -296]]} open at={a} d={0} w={6} seed={seed + 7} />
    <Sh p={[[6, -296], [24, -304], [44, -296]]} open at={a} d={0} w={6} seed={seed + 8} /></g>) : null;
  return <g>{eyes}{brows}{mouth}</g>;
};

// Stick soldier. Origin = between the feet; head radius 60 at s=1 (≈ 320 px tall figure).
export const Soldier: React.FC<{
  x: number; y: number; s?: number; at: number; face?: Face; hat?: Hat; arms?: Arms; seed?: number;
  sweat?: boolean; look?: number; flip?: boolean; glasses?: boolean; beard?: boolean; cheeks?: string; legs?: 'stand' | 'sit' | 'kneel' | 'walk';
  faceAt?: {at: number; face: Face}[];
}> = ({x, y, s = 1, at, face = 'serious', hat = 'us', arms = 'down', seed = 7, sweat, look = 0, flip, glasses, beard, cheeks, legs = 'stand', faceAt = []}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  // face can change on cue
  let cur = face;
  let curAt = at;
  for (const fa of faceAt) if (f >= fa.at) { cur = fa.face; curAt = fa.at - 8; }
  const wave = Math.sin((f - at) / 3) * 10;
  const arm: Record<Arms, P[][]> = {
    down: [[[0, -150], [-55, -80], [-65, -20]], [[0, -150], [55, -80], [65, -20]]],
    up: [[[0, -150], [-70, -230 + wave], [-95, -300 + wave]], [[0, -150], [70, -230 - wave], [95, -300 - wave]]],
    point: [[[0, -150], [-55, -80], [-65, -20]], [[0, -150], [90, -190], [190, -220]]],
    pointL: [[[0, -150], [55, -80], [65, -20]], [[0, -150], [-90, -190], [-190, -220]]],
    hold: [[[0, -150], [-55, -80], [-65, -20]], [[0, -150], [70, -110], [130, -140]]],
    holdL: [[[0, -150], [55, -80], [65, -20]], [[0, -150], [-70, -110], [-130, -140]]],
    hip: [[[0, -150], [-60, -110], [-10, -80]], [[0, -150], [60, -110], [10, -80]]],
    shrug: [[[0, -150], [-80, -150], [-110, -210]], [[0, -150], [80, -150], [110, -210]]],
    eat: [[[0, -150], [-55, -80], [-65, -20]], [[0, -150], [60, -160], [40, -215]]],
  };
  const lg: Record<string, P[][]> = {
    stand: [[[0, -40], [-50, 0]], [[0, -40], [50, 0]]],
    walk: [[[0, -40], [-55 + wave * 2, 0]], [[0, -40], [55 - wave * 2, 0]]],
    sit: [[[0, -40], [60, -40], [70, 0]], [[0, -40], [40, -30], [40, 0]]],
    kneel: [[[0, -40], [-40, 0], [-90, 0]], [[0, -40], [50, -40], [55, 0]]],
  };
  const sw = 7;
  return (
    <G x={x} y={y} s={s}>
      <g transform={flip ? 'scale(-1,1)' : undefined}>
        <Sh p={[[0, -190], [0, -40]]} open at={at} d={5} w={sw} seed={seed} />
        <Sh p={lg[legs][0]} open at={at + 3} d={4} w={sw} seed={seed + 1} />
        <Sh p={lg[legs][1]} open at={at + 3} d={4} w={sw} seed={seed + 2} />
        <Sh p={arm[arms][0]} open at={at + 6} d={4} w={sw} seed={seed + 3} />
        <Sh p={arm[arms][1]} open at={at + 6} d={4} w={sw} seed={seed + 4} />
        <Sh p={ell(0, -250, 60, 60)} f={PAL.white} at={at} d={6} w={sw} seed={seed + 6} />
        {beard ? <Sh p={[[-50, -232], [-38, -180], [0, -160], [38, -180], [50, -232], [0, -215]]} f={PAL.lgrey} at={at + 6} d={0} seed={seed + 5} /> : null}
        <FaceG face={cur} at={curAt} seed={seed + 20} look={flip ? -look : look} />
        {cheeks ? (<g>
          <Sh p={ell(-38, -232, 12, 8, 10)} f={cheeks} at={at + 8} d={0} w={3} seed={seed + 30} />
          <Sh p={ell(38, -232, 12, 8, 10)} f={cheeks} at={at + 8} d={0} w={3} seed={seed + 31} /></g>) : null}
        {glasses ? (<g>
          <Sh p={ell(-22, -262, 20, 18)} at={at + 9} d={0} w={4} seed={seed + 15} />
          <Sh p={ell(22, -262, 20, 18)} at={at + 9} d={0} w={4} seed={seed + 16} /></g>) : null}
        <HatG hat={hat} at={at} seed={seed + 40} />
        {sweat ? (<g>
          <Sh p={[[78, -300], [92, -268], [78, -258], [66, -268]]} f={PAL.blue} at={at + 12} d={0} w={4} seed={seed + 18} />
          <Sh p={[[-80, -285], [-68, -258], [-80, -248], [-92, -258]]} f={PAL.blue} at={at + 14} d={0} w={4} seed={seed + 19} /></g>) : null}
      </g>
    </G>
  );
};

// ---------- food & kit ----------
export const Plate: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 100}) => (
  <G x={x} y={y} s={s}>
    <Sh p={ell(0, 0, 110, 34)} f={PAL.white} at={at} d={6} seed={seed} />
    <Sh p={ell(0, -2, 70, 20)} at={at + 6} d={0} w={4} c={PAL.lgrey} seed={seed + 1} />
  </G>
);
export const Bowl: React.FC<{x: number; y: number; s?: number; at: number; fill?: 'rice' | 'empty' | 'soup'; seed?: number}> = ({x, y, s = 1, at, fill = 'empty', seed = 110}) => (
  <G x={x} y={y} s={s}>
    {fill === 'rice' ? <Sh p={ell(0, -28, 92, 50, 20)} f={PAL.white} at={at + 6} d={0} seed={seed + 2} /> : null}
    <Sh p={[[-100, -20], [100, -20], [70, 50], [-70, 50]]} f={fill === 'soup' ? PAL.grey : PAL.tan} at={at} d={6} seed={seed} />
    {fill === 'soup' ? <Sh p={ell(0, -20, 98, 14)} f={WW.khaki} at={at + 6} d={0} w={5} seed={seed + 3} /> : <Sh p={ell(0, -20, 98, 14)} f={fill === 'rice' ? PAL.white : PAL.brown} at={at + 6} d={0} w={5} seed={seed + 3} />}
  </G>
);
export const Sack: React.FC<{x: number; y: number; s?: number; at: number; label?: string; flat?: boolean; seed?: number}> = ({x, y, s = 1, at, label, flat, seed = 120}) => (
  <G x={x} y={y} s={s}>
    {flat ? <Sh p={[[-110, 40], [-80, 10], [80, 14], [115, 40], [0, 54]]} f={PAL.tan} at={at} d={6} seed={seed} />
      : <Sh p={[[-40, -120], [40, -120], [26, -96], [90, -40], [100, 40], [60, 70], [-60, 70], [-100, 40], [-90, -40], [-26, -96]]} f={PAL.tan} at={at} d={7} seed={seed} />}
    {!flat ? <Sh p={[[-34, -100], [34, -100]]} open at={at + 6} d={0} w={8} c={PAL.brown} seed={seed + 1} /> : null}
    {label ? <Tx y={flat ? 38 : 20} at={at + 7} size={flat ? 34 : 50}>{label}</Tx> : null}
  </G>
);
export const Fish: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 130}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[...ell(0, 0, 70, 26, 18).slice(0, 18), [70, 0], [110, -30], [110, 30], [70, 0]] as P[]} f={PAL.lgrey} at={at} d={6} seed={seed} />
    <Sh p={ell(-42, -6, 5, 5, 8)} f={PAL.black} at={at + 6} d={0} w={2} seed={seed + 1} />
  </G>
);
export const Plum: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 135}) => (
  <G x={x} y={y} s={s}>
    <Sh p={ell(0, 0, 40, 36)} f={PAL.red} at={at} d={5} seed={seed} />
    <Sh p={[[-14, -14], [-4, -20]]} open at={at + 5} d={0} c={PAL.white} w={8} seed={seed + 1} />
  </G>
);
export const Packet: React.FC<{x: number; y: number; s?: number; at: number; label?: string; color?: string; seed?: number}> = ({x, y, s = 1, at, label, color = PAL.tan, seed = 138}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-60, -70, 120, 140)} f={color} at={at} d={5} seed={seed} />
    <Sh p={[[-60, -50], [60, -50]]} open at={at + 5} d={0} w={5} seed={seed + 1} />
    {label ? <Tx y={20} at={at + 5} size={40}>{label}</Tx> : null}
  </G>
);
// tin can (cylinder)
export const Can: React.FC<{x: number; y: number; s?: number; at: number; label?: string; color?: string; band?: string; seed?: number; size?: number; open?: boolean}> = ({
  x, y, s = 1, at, label, color = PAL.lgrey, band = PAL.white, seed = 140, size = 52, open: op,
}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-80, -90], [80, -90], [80, 90], [-80, 90]]} f={color} at={at} d={6} seed={seed} />
    <Sh p={ell(0, 90, 80, 20, 20).slice(0, 11)} open at={at + 6} d={0} seed={seed + 3} />
    <Sh p={rect(-80, -40, 160, 80)} f={band} at={at + 6} d={0} w={5} seed={seed + 1} />
    <Sh p={ell(0, -90, 80, 20)} f={op ? PAL.grey : PAL.lgrey} at={at + 6} d={0} seed={seed + 2} />
    <Sh p={[[-60, -60], [-60, 60]]} open at={at + 7} d={0} c={PAL.white} w={10} seed={seed + 4} />
    {label ? <Tx y={size * 0.35} at={at + 7} size={size}>{label}</Tx> : null}
  </G>
);
export const Biscuit: React.FC<{x: number; y: number; s?: number; at: number; label?: string; seed?: number}> = ({x, y, s = 1, at, label, seed = 150}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-80, -70, 160, 140)} f={WW.khaki} at={at} d={5} seed={seed} />
    {[[-40, -30], [0, -30], [40, -30], [-40, 10], [0, 10], [40, 10]].map(([a, b], i) => (
      <Sh key={i} p={ell(a, b, 6, 6, 8)} f={PAL.brown} at={at + 5} d={0} w={2} seed={seed + 1 + i} />
    ))}
    {label ? <Tx y={130} at={at + 6} size={50} c={PAL.red}>{label}</Tx> : null}
  </G>
);
export const Loaf: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 160}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-130, 40], [-120, -30], [-60, -70], [60, -72], [124, -30], [134, 40]]} f={WW.bread} at={at} d={7} seed={seed} />
    {[-60, 0, 60].map((a, i) => <Sh key={i} p={[[a - 20, -50], [a + 18, -20]]} open at={at + 7} d={0} c={PAL.tan} w={8} seed={seed + 1 + i} />)}
  </G>
);
export const Crusts: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 170}) => (
  <G x={x} y={y} s={s}>
    {[[-80, 20, -10], [0, 30, 8], [80, 18, -6], [-40, -30, 12], [40, -28, -14]].map(([a, b, r], i) => (
      <G key={i} x={a} y={b} r={r}><Sh p={rect(-38, -20, 76, 40)} f={PAL.brown} at={at + i * 2} d={0} seed={seed + i} /></G>
    ))}
  </G>
);
export const Glass: React.FC<{x: number; y: number; s?: number; at: number; drink?: string; seed?: number}> = ({x, y, s = 1, at, drink = PAL.dred, seed = 180}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-40, -60], [40, -60], [30, 60], [-30, 60]]} f={PAL.white} at={at} d={5} seed={seed} />
    <Sh p={[[-36, -20], [36, -20], [30, 56], [-30, 56]]} f={drink} at={at + 5} d={0} w={4} seed={seed + 1} />
    <Sh p={[[-24, -46], [-20, 30]]} open at={at + 6} d={0} c={PAL.white} w={8} seed={seed + 2} />
  </G>
);
export const Bottle: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 185}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-16, -150], [16, -150], [16, -90], [44, -50], [44, 100], [-44, 100], [-44, -50], [-16, -90]]} f={PAL.green} at={at} d={6} seed={seed} />
    <Sh p={rect(-44, 0, 88, 60)} f={PAL.tan} at={at + 6} d={0} w={5} seed={seed + 1} />
    <Sh p={[[-26, -40], [-26, -10]]} open at={at + 6} d={0} c={PAL.white} w={9} seed={seed + 2} />
  </G>
);
export const Crate: React.FC<{x: number; y: number; s?: number; at: number; label?: string; open?: boolean; seed?: number}> = ({x, y, s = 1, at, label, open: op, seed = 190}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-160, -100, 320, 200)} f={PAL.brown} at={at} d={6} seed={seed} />
    <Sh p={[[-160, -33], [160, -33]]} open at={at + 6} d={0} w={5} seed={seed + 1} />
    <Sh p={[[-160, 33], [160, 33]]} open at={at + 6} d={0} w={5} seed={seed + 2} />
    {op ? <Sh p={[[-160, -100], [-120, -190], [200, -190], [160, -100]]} f={PAL.brown} at={at + 6} d={0} seed={seed + 3} /> : null}
    {label ? <Tx y={22} at={at + 7} size={70} font="bang" c={PAL.black}>{label}</Tx> : null}
  </G>
);
export const Mug: React.FC<{x: number; y: number; s?: number; at: number; steam?: boolean; seed?: number}> = ({x, y, s = 1, at, steam = true, seed = 200}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 8;
  return (
    <G x={x} y={y} s={s}>
      <Sh p={rect(-55, -60, 110, 120)} f={PAL.lgrey} at={at} d={5} seed={seed} />
      <Sh p={[[55, -30], [90, -26], [92, 22], [55, 26]]} open at={at + 5} d={0} seed={seed + 1} />
      <Sh p={ell(0, -60, 55, 14)} f={PAL.brown} at={at + 5} d={0} w={5} seed={seed + 2} />
      {steam && f >= at + 6 ? [-25, 15].map((dx, i) => (
        <Sh key={i} p={[[dx, -90], [dx + 14 * Math.sin(t + i), -120], [dx - 10 * Math.sin(t + i), -150], [dx + 8, -180]]} open at={at + 6} d={0} c={PAL.lgrey} w={7} seed={seed + 3 + i} />
      )) : null}
    </G>
  );
};
export const ChocBar: React.FC<{x: number; y: number; s?: number; r?: number; at: number; bite?: boolean; seed?: number; letter?: string}> = ({x, y, s = 1, r = -10, at, bite = true, seed = 210, letter = 'D'}) => (
  <G x={x} y={y} s={s} r={r}>
    <Sh p={bite ? [[-150, -60], [-95, -60], [-88, -82], [-70, -88], [-52, -78], [-45, -60], [40, -60], [40, 60], [-150, 60], [-150, -10], [-130, -14], [-122, -32], [-132, -46]] : [[-150, -60], [40, -60], [40, 60], [-150, 60]]}
      f={WW.choc} at={at} d={6} seed={seed} />
    {[-100, -50, -5].map((a, i) => <Sh key={i} p={[[a, -55], [a, 55]]} open at={at + 6} d={0} w={5} seed={seed + 1 + i} />)}
    <Sh p={[[-145, 0], [35, 0]]} open at={at + 6} d={0} w={5} seed={seed + 5} />
    <Sh p={[[30, -72], [160, -68], [165, 70], [30, 72]]} f={PAL.tan} at={at + 6} d={0} seed={seed + 6} />
    {letter ? <Tx x={98} y={30} at={at + 7} size={92} font="bang" c={PAL.dred}>{letter}</Tx> : null}
  </G>
);
export const Potato: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 220}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-90, 0], [-70, -46], [0, -60], [76, -40], [96, 6], [60, 50], [-30, 54]]} f={PAL.tan} at={at} d={6} seed={seed} />
    {[[-30, -10], [20, 14], [40, -24]].map(([a, b], i) => <Sh key={i} p={ell(a, b, 6, 4, 8)} f={PAL.brown} at={at + 6} d={0} w={2} seed={seed + 1 + i} />)}
  </G>
);
export const Cone: React.FC<{x: number; y: number; s?: number; at: number; scoop?: string; seed?: number}> = ({x, y, s = 1, at, scoop = PAL.pink, seed = 230}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-50, -10], [50, -10], [0, 120]]} f={PAL.orange} at={at} d={5} seed={seed} />
    <Sh p={[[-30, 10], [20, 60]]} open at={at + 5} d={0} w={4} seed={seed + 1} />
    <Sh p={[[30, 10], [-14, 70]]} open at={at + 5} d={0} w={4} seed={seed + 2} />
    <Sh p={ell(0, -50, 58, 50)} f={scoop} at={at + 3} d={0} seed={seed + 3} />
    <Sh p={[[-26, -74], [-10, -84]]} open at={at + 6} d={0} c={PAL.white} w={8} seed={seed + 4} />
  </G>
);
export const Turkey: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 240}) => (
  <G x={x} y={y} s={s} r={-20}>
    <Sh p={[[-100, -50], [20, -60], [60, -20], [40, 40], [-90, 50], [-120, 0]]} f={PAL.brown} at={at} d={6} seed={seed} />
    <Sh p={rect(50, -14, 90, 28)} f={PAL.white} at={at + 6} d={0} seed={seed + 1} />
    <Sh p={ell(150, -16, 20, 16)} f={PAL.white} at={at + 6} d={0} seed={seed + 2} />
    <Sh p={ell(150, 16, 20, 16)} f={PAL.white} at={at + 6} d={0} seed={seed + 3} />
  </G>
);
export const Box: React.FC<{x: number; y: number; s?: number; at: number; label: string; w?: number; h?: number; color?: string; seed?: number; size?: number}> = ({x, y, s = 1, at, label, w = 220, h = 150, color = WW.khaki, seed = 250, size = 80}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-w / 2, -h / 2, w, h)} f={color} at={at} d={6} seed={seed} />
    <Sh p={[[-w / 2, -h / 2], [-w / 2 + 30, -h / 2 - 30], [w / 2 + 30, -h / 2 - 30], [w / 2, -h / 2]]} f={color} at={at + 6} d={0} seed={seed + 1} />
    <Sh p={[[w / 2, -h / 2], [w / 2 + 30, -h / 2 - 30], [w / 2 + 30, h / 2 - 30], [w / 2, h / 2]]} f={color} at={at + 6} d={0} seed={seed + 2} />
    <Tx y={size * 0.35} at={at + 7} size={size} font="bang">{label}</Tx>
  </G>
);
export const Cig: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 260}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-50, -70, 100, 140)} f={PAL.red} at={at} d={5} seed={seed} />
    {[-24, 0, 24].map((a, i) => <Sh key={i} p={rect(a - 9, -96, 18, 30)} f={PAL.white} at={at + 5} d={0} w={4} seed={seed + 1 + i} />)}
  </G>
);
export const Jar: React.FC<{x: number; y: number; s?: number; at: number; fill?: string; seed?: number}> = ({x, y, s = 1, at, fill = PAL.red, seed = 265}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-50, -60], [50, -60], [56, 70], [-56, 70]]} f={fill} at={at} d={5} seed={seed} />
    <Sh p={rect(-56, -86, 112, 28)} f={PAL.grey} at={at + 5} d={0} seed={seed + 1} />
  </G>
);
export const MoneyBag: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 270}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-30, -90], [30, -90], [16, -64], [80, -10], [90, 60], [50, 90], [-50, 90], [-90, 60], [-80, -10], [-16, -64]]} f={PAL.green} at={at} d={6} seed={seed} />
    <Tx y={44} at={at + 6} size={90} font="bang" c={PAL.white} o={PAL.black}>$</Tx>
  </G>
);
export const Factory: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 280}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 10;
  return (
    <G x={x} y={y} s={s}>
      <Sh p={[[-160, 80], [-160, -20], [-100, -60], [-100, -20], [-40, -60], [-40, -20], [20, -60], [20, -20], [160, -20], [160, 80]]} f={PAL.lgrey} at={at} d={7} seed={seed} />
      <Sh p={rect(90, -150, 40, 130)} f={PAL.grey} at={at + 4} d={0} seed={seed + 1} />
      {f >= at + 8 ? [0, 1, 2].map((i) => (
        <Sh key={i} p={ell(110 + i * 26 + Math.sin(t + i) * 6, -180 - i * 34, 22 + i * 6, 18 + i * 4, 12)} f={PAL.lgrey} at={at + 8} d={0} w={5} seed={seed + 3 + i} />
      )) : null}
      {[-120, -60, 0].map((a, i) => <Sh key={i} p={rect(a, 10, 40, 36)} f={PAL.yellow} at={at + 7} d={0} w={5} seed={seed + 10 + i} />)}
    </G>
  );
};
export const Helmet: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 290}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-60, 20], [-54, -24], [-28, -50], [0, -56], [28, -50], [54, -24], [60, 20]]} f={PAL.grey} at={at} d={0} seed={seed} />
    <Sh p={[[-72, 24], [72, 24]]} open at={at} d={0} w={8} seed={seed + 1} />
  </G>
);
export const Calendar: React.FC<{x: number; y: number; s?: number; at: number; top?: string; big: string; seed?: number; size?: number}> = ({x, y, s = 1, at, top = '', big, seed = 300, size = 90}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-110, -100, 220, 200)} f={PAL.white} at={at} d={6} seed={seed} />
    <Sh p={rect(-110, -100, 220, 50)} f={PAL.red} at={at + 6} d={0} seed={seed + 1} />
    {top ? <Tx y={-62} at={at + 7} size={36} c={PAL.white}>{top}</Tx> : null}
    <Tx y={44} at={at + 7} size={size} font="bang">{big}</Tx>
  </G>
);
export const Clock: React.FC<{x: number; y: number; s?: number; at: number; spin?: number; seed?: number}> = ({x, y, s = 1, at, spin = 0, seed = 310}) => {
  const f = useCurrentFrame();
  const a = ((f - at) * spin * Math.PI) / 15;
  return (
    <G x={x} y={y} s={s}>
      <Sh p={ell(0, 0, 90, 90)} f={PAL.white} at={at} d={6} seed={seed} />
      <Sh p={[[0, 0], [0, -50]]} open at={at + 6} d={0} w={9} seed={seed + 1} />
      <Sh p={[[0, 0], [Math.sin(a) * 72, -Math.cos(a) * 72]]} open at={at + 6} d={0} w={6} c={PAL.red} seed={seed + 2} />
    </G>
  );
};
export const Paper: React.FC<{x: number; y: number; s?: number; at: number; lines?: number; seed?: number; title?: string}> = ({x, y, s = 1, at, lines = 5, seed = 320, title}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-120, -160], [90, -160], [120, -130], [120, 160], [-120, 160]]} f={PAL.white} at={at} d={6} seed={seed} />
    {title ? <Tx y={-110} at={at + 6} size={46}>{title}</Tx> : null}
    {Array.from({length: lines}, (_, i) => <Sh key={i} p={[[-90, -60 + i * 44], [80 - (i % 2) * 40, -60 + i * 44]]} open at={at + 6} d={0} w={6} c={PAL.grey} seed={seed + 1 + i} />)}
  </G>
);
export const Padlock: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 330}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-40, 0], [-40, -50], [-20, -80], [20, -80], [40, -50], [40, 0]]} open at={at} d={0} w={14} c={PAL.grey} seed={seed} />
    <Sh p={rect(-60, -10, 120, 100)} f={PAL.yellow} at={at} d={0} seed={seed + 1} />
    <Sh p={ell(0, 30, 10, 12, 8)} f={PAL.black} at={at} d={0} w={2} seed={seed + 2} />
  </G>
);
export const Bars: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 340}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-120, -120, 240, 240)} f={PAL.lgrey} at={at} d={6} seed={seed} />
    {[-80, -40, 0, 40, 80].map((a, i) => <Sh key={i} p={[[a, -120], [a, 120]]} open at={at + 6} d={0} w={12} c={PAL.grey} seed={seed + 1 + i} />)}
  </G>
);
export const Kettle: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 350}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-80, 70], [-90, -10], [-50, -60], [50, -60], [90, -10], [80, 70]]} f={PAL.grey} at={at} d={6} seed={seed} />
    <Sh p={[[80, 0], [150, -60], [160, -50]]} open at={at + 6} d={0} w={12} seed={seed + 1} />
    <Sh p={[[-50, -60], [-40, -100], [40, -100], [50, -60]]} open at={at + 6} d={0} w={9} seed={seed + 2} />
  </G>
);
export const Tooth: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 360}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-50, -50], [-20, -60], [0, -50], [20, -60], [50, -50], [44, 10], [30, 60], [10, 20], [-10, 20], [-30, 60], [-44, 10]]} f={PAL.white} at={at} d={6} seed={seed} />
  </G>
);
export const Donkey: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 370}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-40, -110], [-30, -200], [-10, -120]]} f={PAL.grey} at={at} d={0} seed={seed} />
    <Sh p={[[10, -120], [30, -200], [40, -110]]} f={PAL.grey} at={at} d={0} seed={seed + 1} />
    <Sh p={[[-60, -110], [60, -110], [70, 40], [40, 80], [-40, 80], [-70, 40]]} f={PAL.grey} at={at} d={0} seed={seed + 2} />
    <Sh p={ell(0, 50, 50, 34)} f={PAL.lgrey} at={at} d={0} seed={seed + 3} />
    {[-28, 28].map((a, i) => (<g key={i}>
      <Sh p={[[a - 12, -64], [a + 12, -40]]} open at={at} d={0} w={7} seed={seed + 4 + i} />
      <Sh p={[[a + 12, -64], [a - 12, -40]]} open at={at} d={0} w={7} seed={seed + 6 + i} /></g>))}
    <Sh p={[[-12, 70], [12, 70]]} open at={at} d={0} w={6} seed={seed + 8} />
  </G>
);
export const OldMan: React.FC<{x: number; y: number; s?: number; at: number}> = ({x, y, s = 1, at}) => (
  <Soldier x={x} y={y} s={s} at={at} hat="none" face="smirk" beard glasses arms="hold" seed={380} />
);
export const Horse: React.FC<{x: number; y: number; s?: number; at: number; lying?: boolean; seed?: number}> = ({x, y, s = 1, at, lying, seed = 390}) => (
  <G x={x} y={y} s={s} r={lying ? 0 : 0}>
    {lying ? (<g>
      <Sh p={ell(0, -50, 150, 55)} f={PAL.brown} at={at} d={6} seed={seed} />
      <Sh p={[[130, -70], [230, -60], [240, -20], [140, -20]]} f={PAL.brown} at={at + 4} d={0} seed={seed + 1} />
      <Sh p={[[200, -50], [214, -40]]} open at={at + 6} d={0} w={6} seed={seed + 2} />
      <Sh p={[[-100, -10], [-60, 0], [0, -6], [60, 0]]} open at={at + 6} d={0} w={7} seed={seed + 3} />
    </g>) : (<g>
      <Sh p={ell(0, -150, 150, 55)} f={PAL.brown} at={at} d={6} seed={seed} />
      <Sh p={[[110, -180], [170, -280], [240, -270], [250, -230], [180, -210], [150, -130]]} f={PAL.brown} at={at + 4} d={0} seed={seed + 1} />
      <Sh p={ell(200, -258, 6, 6, 8)} f={PAL.black} at={at + 6} d={0} w={2} seed={seed + 2} />
      {[-110, -60, 60, 110].map((a, i) => <Sh key={i} p={[[a, -110], [a + 4, 0]]} open at={at + 4} d={0} w={10} seed={seed + 3 + i} />)}
      <Sh p={[[-150, -170], [-200, -100]]} open at={at + 4} d={0} w={12} seed={seed + 8} />
    </g>)}
  </G>
);

// ---------- vehicles ----------
export const Truck: React.FC<{x: number; y: number; s?: number; at: number; color?: string; spin?: boolean; flip?: boolean; seed?: number}> = ({x, y, s = 1, at, color = WW.olive, spin, flip, seed = 400}) => {
  const f = useCurrentFrame();
  const a = spin ? ((f - at) * 0.6) : 0;
  return (
    <G x={x} y={y} s={s}>
      <g transform={flip ? 'scale(-1,1)' : undefined}>
        <Sh p={rect(-180, -150, 230, 140)} f={WW.khaki} at={at} d={6} seed={seed} />
        <Sh p={[[50, -10], [50, -120], [120, -120], [160, -70], [160, -10]]} f={color} at={at + 2} d={5} seed={seed + 1} />
        <Sh p={[[70, -105], [115, -105], [140, -72], [70, -72]]} f={PAL.turq} at={at + 6} d={0} w={5} seed={seed + 2} />
        <Sh p={rect(-180, -20, 340, 30)} f={color} at={at + 4} d={0} seed={seed + 3} />
        {[-120, 90].map((cx, i) => (
          <g key={i} transform={`rotate(${a * 57},${cx},20)`}>
            <Sh p={ell(cx, 20, 40, 40)} f={PAL.black} at={at + 6} d={0} seed={seed + 4 + i} />
            <Sh p={[[cx - 30, 20], [cx + 30, 20]]} open at={at + 6} d={0} c={PAL.grey} w={8} seed={seed + 6 + i} />
          </g>
        ))}
      </g>
    </G>
  );
};
export const CargoShip: React.FC<{x: number; y: number; s?: number; at: number; sink?: number; tilt?: number; seed?: number}> = ({x, y, s = 1, at, sink = 0, tilt = 0, seed = 420}) => (
  <G x={x} y={y + sink} s={s} r={tilt}>
    <Sh p={[[-60, -150], [60, -150], [60, -70], [-60, -70]]} f={PAL.lgrey} at={at + 2} d={5} seed={seed} />
    <Sh p={[[80, -200], [120, -200], [120, -70], [80, -70]]} f={PAL.grey} at={at + 4} d={4} seed={seed + 1} />
    <Sh p={rect(-240, -120, 70, 50)} f={PAL.orange} at={at + 6} d={0} seed={seed + 2} />
    <Sh p={rect(-160, -120, 70, 50)} f={PAL.yellow} at={at + 6} d={0} seed={seed + 3} />
    <Sh p={[[-290, -70], [280, -70], [220, 60], [-230, 60]]} f={PAL.dred} at={at} d={7} seed={seed + 4} />
  </G>
);
export const Sub: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 440}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[0, -40], [0, -200], [40, -200]]} open at={at + 6} d={4} w={8} seed={seed} />
    <Sh p={[[-60, -40], [-50, -90], [50, -90], [70, -40]]} f={PAL.grey} at={at + 3} d={4} seed={seed + 1} />
    <Sh p={ell(0, 0, 250, 48)} f={PAL.grey} at={at} d={6} seed={seed + 2} />
  </G>
);
export const Barge: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 450}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-220, -170, 300, 110)} f={PAL.white} at={at + 4} d={5} seed={seed} />
    {[-180, -110, -40, 30].map((a, i) => <Sh key={i} p={rect(a, -150, 40, 36)} f={PAL.turq} at={at + 8} d={0} w={5} seed={seed + 1 + i} />)}
    <Sh p={rect(100, -250, 50, 190)} f={PAL.grey} at={at + 6} d={4} seed={seed + 6} />
    <Sh p={[[-320, -60], [320, -60], [300, 60], [-300, 60]]} f={PAL.lgrey} at={at} d={7} seed={seed + 7} />
    {[-250, -150, -50, 50, 150, 250].map((a, i) => <Sh key={i} p={ell(a, 0, 8, 8, 8)} f={PAL.grey} at={at + 7} d={0} w={3} seed={seed + 10 + i} />)}
  </G>
);
export const Tug: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 470}) => (
  <G x={x} y={y} s={s}>
    <Sh p={rect(-40, -110, 80, 60)} f={PAL.white} at={at + 3} d={4} seed={seed} />
    <Sh p={rect(-10, -160, 30, 50)} f={PAL.red} at={at + 4} d={0} seed={seed + 1} />
    <Sh p={[[-120, -50], [120, -50], [90, 30], [-100, 30]]} f={PAL.dblue} at={at} d={6} seed={seed + 2} />
  </G>
);
export const FieldKitchen: React.FC<{x: number; y: number; s?: number; at: number; cannon?: number; seed?: number}> = ({x, y, s = 1, at, cannon, seed = 480}) => {
  const f = useCurrentFrame();
  const t = (f - at) / 9;
  return (
    <G x={x} y={y} s={s}>
      <Sh p={rect(-80, -330, 44, 200)} f={PAL.grey} at={at + 4} d={4} seed={seed} />
      {cannon !== undefined && f >= cannon ? <Sh p={[[-100, -330], [-120, -400], [-40, -420], [-20, -330]]} at={cannon} d={6} c={PAL.red} w={9} seed={seed + 9} /> : null}
      <Sh p={[[-200, -130], [-180, -200], [180, -200], [200, -130], [200, 0], [-200, 0]]} f={WW.steel} at={at} d={7} seed={seed + 1} />
      <Sh p={ell(60, -200, 90, 24)} f={PAL.grey} at={at + 6} d={0} seed={seed + 2} />
      {[-120, 120].map((cx, i) => <Sh key={i} p={ell(cx, 20, 50, 50)} f={PAL.black} at={at + 6} d={0} seed={seed + 3 + i} />)}
      {f >= at + 8 ? [0, 1, 2].map((i) => (
        <Sh key={i} p={ell(-58 + Math.sin(t + i) * 8, -360 - i * 40, 22 + i * 8, 16 + i * 5, 12)} f={PAL.white} at={at + 8} d={0} w={5} seed={seed + 5 + i} />
      )) : null}
    </G>
  );
};

// ---------- scenery ----------
export const Palm: React.FC<{x: number; y: number; s?: number; at: number; seed?: number}> = ({x, y, s = 1, at, seed = 500}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[0, 0], [10, -100], [30, -200], [40, -260]]} open at={at} d={5} w={22} c={PAL.brown} seed={seed} />
    {[[-140, -230], [120, -220], [-90, -330], [130, -320], [20, -350]].map(([a, b], i) => (
      <Sh key={i} p={[[40, -260], [(40 + a) / 2 + 20, b - 30], [a, b]]} open at={at + 4} d={0} w={20} c={PAL.green} seed={seed + 1 + i} />
    ))}
  </G>
);
export const Snow: React.FC<{at: number; n?: number; seed?: number}> = ({at, n = 40, seed = 1}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const x0 = (i * 397 + seed * 131) % 1920;
        const y0 = (i * 211 + seed * 71) % 1080;
        const y = (y0 + (f - at) * (2 + (i % 3))) % 1120 - 20;
        const x = x0 + Math.sin((f + i * 10) / 20) * 12;
        return <circle key={i} cx={x} cy={y} r={7 + (i % 3) * 2} fill={PAL.lgrey} stroke={PAL.grey} strokeWidth={2} />;
      })}
    </g>
  );
};
export const Sea: React.FC<{y: number; at: number; seed?: number; color?: string}> = ({y, at, seed = 520, color = PAL.blue}) => {
  const pts: P[] = [];
  for (let x = -40; x <= 1960; x += 110) pts.push([x, y + Math.sin(x / 140) * 12]);
  return <PShape pts={[...pts, [1960, 1120], [-40, 1120]]} fill={color} at={at} draw={6} seed={seed} />;
};
export const Ground: React.FC<{y: number; at: number; color: string; seed?: number}> = ({y, at, color, seed = 530}) => (
  <PShape pts={[[-40, y], [600, y - 10], [1300, y + 6], [1960, y - 4], [1960, 1120], [-40, 1120]]} fill={color} at={at} draw={6} seed={seed} />
);
export const Island: React.FC<{x: number; y: number; s?: number; at: number; seed?: number; color?: string}> = ({x, y, s = 1, at, seed = 540, color = PAL.green}) => (
  <G x={x} y={y} s={s}>
    <Sh p={[[-260, 20], [-200, -40], [-80, -70], [60, -60], [200, -40], [270, 20], [100, 40], [-100, 40]]} f={color} at={at} d={7} seed={seed} />
  </G>
);
// blob country/region from a coarse polygon
export const Blob: React.FC<{p: P[]; f: string; at: number; seed?: number; d?: number}> = ({p, f, at, seed = 560, d = 7}) => (
  <PShape pts={p} fill={f} at={at} draw={d} seed={seed} amp={3} />
);

// ---------- charts & cards ----------
export const BarChart: React.FC<{x: number; y: number; bars: {h: number; c: string; label: string}[]; at: number; step?: number; w?: number; gap?: number; size?: number}> = ({x, y, bars, at, step = 10, w = 200, gap = 100, size = 56}) => (
  <g>
    <PShape pts={[[x - 40, y], [x + bars.length * (w + gap), y]]} closed={false} at={at} draw={5} sw={8} seed={600} />
    {bars.map((b, i) => {
      const bx = x + i * (w + gap);
      const a = at + 3 + i * step;
      return (
        <g key={i}>
          <PShape pts={rect(bx, y - b.h, w, b.h)} fill={b.c} at={a} draw={6} seed={601 + i} />
          <PText x={bx + w / 2} y={y + size + 10} at={a + 2} size={size} anchor="middle">{b.label}</PText>
        </g>
      );
    })}
  </g>
);

// "#N" circled + title (list title card)
export const TitleCard: React.FC<{n: string; title: string; sub?: string; at?: number; size?: number}> = ({n, title, sub, at = 0, size = 150}) => (
  <g>
    <PShape pts={ell(330, 520, 170, 155, 30, -0.4)} at={at + 2} draw={9} sw={11} color={PAL.red} amp={4} seed={3} />
    <PText x={330} y={600} at={at + 4} size={230} font="bang" color={PAL.red} anchor="middle">{n}</PText>
    <PText x={560} y={590} at={at + 8} size={size} font="bang">{title}</PText>
    {sub ? <PText x={566} y={690} at={at + 12} size={64} color={PAL.grey}>{sub}</PText> : null}
  </g>
);

// slowly moving element along a path (0..1 progress)
export const along = (pts: P[], t: number): P => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const k = d / segs[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
export const useProg = (a: number, b: number, ease = true) => {
  const f = useCurrentFrame();
  return interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease ? Easing.inOut(Easing.quad) : undefined});
};
