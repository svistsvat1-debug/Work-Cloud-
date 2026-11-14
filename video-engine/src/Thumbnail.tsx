import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PShape, PLine, PText} from './paint/Paint';
import {FontGate} from './paint/Fonts';
import {ell, PAL, P} from './paint/wobble';

// Thumbnail 1280x720 — "Every WW2 Army's Food Ranked" (2026-11-14).
// Layout (channel standard): LEFT 3 lines of huge text | RIGHT shocked stick soldier | PROOF object with red circle + arrow.
// Static still: every element at frame 0, no draw-on, fixed seeds (no boiling on frame 0).

const SW = 12; // thick thumbnail outline (10–14 px at 1280x720)
const OLIVE = '#6B7B3A';
const CHOC = '#6B3A1E';
const BG = PAL.yellow;

const S: React.FC<{pts: P[]; fill?: string; seed: number; sw?: number; color?: string; closed?: boolean; amp?: number}> = ({
  pts, fill, seed, sw = SW, color = PAL.black, closed = true, amp = 2.4,
}) => (closed ? <PShape pts={pts} fill={fill} at={0} draw={0} sw={sw} color={color} seed={seed} amp={amp} />
  : <PLine pts={pts} at={0} draw={0} sw={sw} color={color} seed={seed} amp={amp} />);

// the army chocolate bar (proof object): tan wrapper half peeled, dark chocolate block with a bite
const Bar: React.FC = () => (
  <g transform="translate(655,470) rotate(-14)">
    {/* chocolate block with a bite out of the top-left corner */}
    <S pts={[[-150, -60], [-95, -60], [-88, -82], [-70, -88], [-52, -78], [-45, -60], [40, -60], [40, 60], [-150, 60], [-150, -10], [-130, -14], [-122, -32], [-132, -46]]} fill={CHOC} seed={41} />
    {/* chocolate squares */}
    <S pts={[[-100, -55], [-100, 55]]} closed={false} seed={42} sw={7} />
    <S pts={[[-50, -55], [-50, 55]]} closed={false} seed={43} sw={7} />
    <S pts={[[-5, -55], [-5, 55]]} closed={false} seed={44} sw={7} />
    <S pts={[[-145, 0], [35, 0]]} closed={false} seed={45} sw={7} />
    <S pts={[[-85, -38], [-62, -38]]} closed={false} seed={46} sw={8} color={PAL.white} />
    {/* paper wrapper on the right half */}
    <S pts={[[30, -72], [160, -68], [165, 70], [30, 72]]} fill={PAL.tan} seed={47} />
    <S pts={[[30, -72], [10, -40], [32, -8], [12, 26], [30, 72]]} closed={false} seed={48} sw={10} />
    <PText x={98} y={30} at={0} size={92} font="bang" anchor="middle" color={PAL.dred}>D</PText>
  </g>
);

// big stick soldier: olive helmet, huge round eyes looking left at the bar, open mouth, sweat
const Soldier: React.FC = () => {
  const hx = 1000, hy = 285, r = 128;
  return (
    <g>
      {/* body + arms (drawn first, head on top) */}
      <S pts={[[hx, hy + r - 5], [hx, 760]]} closed={false} seed={61} />
      <S pts={[[hx, hy + 200], [905, 545], [800, 488]]} closed={false} seed={62} />
      <S pts={[[hx, hy + 200], [1120, 440], [1195, 360]]} closed={false} seed={63} />
      {/* fingers on the bar */}
      <S pts={ell(795, 486, 24, 20, 12)} fill={PAL.white} seed={64} sw={9} />
      {/* raised shocked hand */}
      <S pts={ell(1200, 350, 24, 22, 12)} fill={PAL.white} seed={65} sw={9} />
      {/* head */}
      <S pts={ell(hx, hy, r, r, 34)} fill={PAL.white} seed={66} />
      {/* helmet: dome + brim */}
      <S pts={[[hx - 150, hy - 52], [hx - 138, hy - 130], [hx - 80, hy - 188], [hx, hy - 206], [hx + 80, hy - 188], [hx + 138, hy - 130], [hx + 150, hy - 52]]} fill={OLIVE} seed={67} />
      <S pts={[[hx - 172, hy - 40], [hx - 165, hy - 64], [hx + 165, hy - 64], [hx + 172, hy - 40]]} fill={OLIVE} seed={68} />
      <S pts={[[hx - 70, hy - 160], [hx - 30, hy - 178]]} closed={false} seed={69} sw={10} color={PAL.white} />
      {/* eyes: huge, tiny pupils looking down-left at the bar */}
      <S pts={ell(hx - 50, hy - 2, 40, 46)} fill={PAL.white} seed={70} sw={9} />
      <S pts={ell(hx + 42, hy - 2, 40, 46)} fill={PAL.white} seed={71} sw={9} />
      <S pts={ell(hx - 72, hy + 12, 10, 10, 10)} fill={PAL.black} seed={72} sw={3} />
      <S pts={ell(hx + 20, hy + 12, 10, 10, 10)} fill={PAL.black} seed={73} sw={3} />
      {/* raised brows */}
      <S pts={[[hx - 92, hy - 66], [hx - 50, hy - 78], [hx - 14, hy - 66]]} closed={false} seed={74} sw={9} />
      <S pts={[[hx + 6, hy - 66], [hx + 42, hy - 78], [hx + 84, hy - 66]]} closed={false} seed={75} sw={9} />
      {/* open mouth (disgust): wobbly black opening + tongue sticking out */}
      <S pts={[[hx - 52, hy + 70], [hx - 20, hy + 58], [hx + 10, hy + 66], [hx + 44, hy + 58], [hx + 52, hy + 92], [hx + 20, hy + 112], [hx - 30, hy + 110]]} fill={PAL.black} seed={76} sw={8} />
      <S pts={[[hx - 22, hy + 96], [hx + 18, hy + 96], [hx + 22, hy + 138], [hx, hy + 150], [hx - 22, hy + 136]]} fill={PAL.pink} seed={77} sw={8} />
      {/* sweat drops */}
      <S pts={[[hx + 146, hy - 30], [hx + 162, hy + 8], [hx + 146, hy + 22], [hx + 130, hy + 8]]} fill={PAL.blue} seed={78} sw={8} />
      <S pts={[[hx - 152, hy + 10], [hx - 136, hy + 48], [hx - 152, hy + 62], [hx - 168, hy + 48]]} fill={PAL.blue} seed={79} sw={8} />
    </g>
  );
};

export const Thumbnail: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{background: BG}}>
      <svg viewBox="0 0 1280 720" width={1280} height={720}>
        <Bar />
        {/* red hand-drawn circle around the bar */}
        <S pts={ell(660, 470, 205, 132, 34, -0.25)} seed={81} color={PAL.red} sw={13} amp={4} />
        <Soldier />
        {/* text block, left */}
        <PText x={40} y={168} at={0} size={170} font="bang" color={PAL.white} outline={PAL.black}>MADE</PText>
        <PText x={40} y={318} at={0} size={150} font="bang" color={PAL.white} outline={PAL.black}>TO TASTE</PText>
        <PText x={40} y={520} at={0} size={230} font="bang" color={PAL.red} outline={PAL.black}>BAD</PText>
        {/* red arrow from the word to the bar */}
        <S pts={[[150, 600], [250, 665], [370, 650], [445, 590]]} closed={false} seed={91} color={PAL.red} sw={16} amp={3} />
        <S pts={[[392, 582], [452, 584], [450, 642]]} closed={false} seed={92} color={PAL.red} sw={16} amp={2} />
      </svg>
    </AbsoluteFill>
  </FontGate>
);
