import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PShape, PLine} from './Paint';
import {ell, PAL} from './wobble';

type Face = 'panic' | 'grin' | 'worry';
type Arms = 'up' | 'point' | 'pointLeft' | 'down';

// MS-Paint stick figure. Origin = between the feet. Head radius 60 (local units).
export const Stick: React.FC<{
  x: number; y: number; s?: number; at: number; face: Face; arms: Arms; seed?: number;
  glasses?: boolean; beard?: boolean; cap?: string; sweat?: boolean;
}> = ({x, y, s = 1, at, face, arms, seed = 7, glasses, beard, cap, sweat}) => {
  const f = useCurrentFrame();
  const sw = 7 / s;
  const hx = 0, hy = -250;
  const wave = Math.sin((f - at) / 3) * 10; // panicky arm shake
  const armPts: [number, number][][] =
    arms === 'up' ? [[[0, -150], [-70, -230 + wave], [-95, -300 + wave]], [[0, -150], [70, -230 - wave], [95, -300 - wave]]]
    : arms === 'point' ? [[[0, -150], [-60, -80], [-70, -20]], [[0, -150], [80, -230], [130, -320]]]
    : arms === 'pointLeft' ? [[[0, -150], [60, -80], [70, -20]], [[0, -150], [-90, -170], [-180, -190]]]
    : [[[0, -150], [-55, -80], [-65, -20]], [[0, -150], [55, -80], [65, -20]]];
  const d = 3; // stagger
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <PLine pts={[[0, -190], [0, -40]]} at={at} draw={5} sw={sw} seed={seed} />
      <PLine pts={[[0, -40], [-50, 0]]} at={at + d} draw={4} sw={sw} seed={seed + 1} />
      <PLine pts={[[0, -40], [50, 0]]} at={at + d} draw={4} sw={sw} seed={seed + 2} />
      <PLine pts={armPts[0]} at={at + 2 * d} draw={4} sw={sw} seed={seed + 3} />
      <PLine pts={armPts[1]} at={at + 2 * d} draw={4} sw={sw} seed={seed + 4} />
      <PShape pts={ell(hx, hy, 60, 60)} fill={PAL.white} at={at} draw={6} sw={sw} seed={seed + 6} />
      {beard ? <PShape pts={[[-50, -232], [-38, -180], [0, -160], [38, -180], [50, -232], [0, -215]]} fill={PAL.brown} at={at + 6} draw={0} sw={sw} seed={seed + 5} /> : null}
      {cap ? <PShape pts={[[-62, -275], [-50, -320], [50, -320], [62, -275], [85, -270]]} fill={cap} at={at + 6} draw={4} sw={sw} seed={seed + 7} /> : null}
      {face === 'panic' ? (
        <g>
          <PShape pts={ell(-22, -262, 15, 19)} fill={PAL.white} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 8} />
          <PShape pts={ell(22, -262, 15, 19)} fill={PAL.white} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 9} />
          <PShape pts={ell(-22, -258, 5, 5, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PShape pts={ell(22, -258, 5, 5, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PShape pts={ell(0, -222, 14, 18)} fill={PAL.black} at={at + 8} draw={0} sw={sw * 0.6} seed={seed + 10} />
        </g>
      ) : face === 'grin' ? (
        <g>
          <PShape pts={ell(-22, -265, 6, 8, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PShape pts={ell(22, -265, 6, 8, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PShape pts={[[-34, -238], [34, -238], [20, -212], [0, -205], [-20, -212]]} fill={PAL.white} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 11} />
        </g>
      ) : (
        <g>
          <PShape pts={ell(-22, -262, 6, 8, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PShape pts={ell(22, -262, 6, 8, 8)} fill={PAL.black} at={at + 8} draw={0} sw={2} seed={seed} />
          <PLine pts={[[-36, -290], [-10, -282]]} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 12} />
          <PLine pts={[[36, -290], [10, -282]]} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 13} />
          <PLine pts={[[-24, -215], [-8, -225], [8, -215], [24, -225]]} at={at + 8} draw={0} sw={sw * 0.7} seed={seed + 14} />
        </g>
      )}
      {glasses ? (
        <g>
          <PShape pts={ell(-22, -264, 20, 18)} at={at + 9} draw={0} sw={sw * 0.6} seed={seed + 15} />
          <PShape pts={ell(22, -264, 20, 18)} at={at + 9} draw={0} sw={sw * 0.6} seed={seed + 16} />
          <PLine pts={[[-2, -266], [2, -266]]} at={at + 9} draw={0} sw={sw * 0.6} seed={seed + 17} />
        </g>
      ) : null}
      {sweat ? (
        <g>
          <PShape pts={[[78, -300], [92, -268], [78, -258], [66, -268]]} fill={PAL.blue} at={at + 12} draw={0} sw={sw * 0.6} seed={seed + 18} />
          <PShape pts={[[-80, -285], [-68, -258], [-80, -248], [-92, -258]]} fill={PAL.blue} at={at + 14} draw={0} sw={sw * 0.6} seed={seed + 19} />
        </g>
      ) : null}
    </g>
  );
};
