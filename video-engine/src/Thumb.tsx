import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Person} from './components/people';
import {Arrow, Fill} from './components/primitives';
import {Foxhole, Truck} from './components/props';
import {ellPts} from './lib/sketch';
import {C, H, W} from './lib/theme';
import {useFonts} from './Video';

// Thumbnail concept A: one lonely GI in front, a long queue of support troops behind him, "ONLY 14%".
// Max 3 objects: (1) the GI in his foxhole, (2) the queue (one group), (3) the text + arrow.
export const Thumb: React.FC = () => {
  useFonts();
  const blob = useMemo(() => ellPts(1430, 250, 430, 175, 30), []);
  const queue: {x: number; y: number; s: number; gear: 'chef' | 'cap' | 'medic' | 'helmet'; hold: 'ladle' | 'none' | 'clipboard' | 'letter'; uniform: string}[] = [
    {x: 990, y: 860, s: 1.25, gear: 'chef', hold: 'ladle', uniform: C.khaki},
    {x: 1170, y: 800, s: 1.08, gear: 'cap', hold: 'clipboard', uniform: C.khaki},
    {x: 1330, y: 748, s: 0.94, gear: 'medic', hold: 'none', uniform: C.olive},
    {x: 1470, y: 704, s: 0.82, gear: 'cap', hold: 'letter', uniform: C.khaki},
    {x: 1590, y: 668, s: 0.72, gear: 'helmet', hold: 'none', uniform: C.olive},
    {x: 1695, y: 640, s: 0.62, gear: 'cap', hold: 'none', uniform: C.khaki},
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <Img src={staticFile('paper.jpg')} style={{position: 'absolute', width: '100%', height: '100%'}} />
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
        {/* (2) the queue behind him */}
        <path d="M860,895 C1100,830 1420,710 1880,612" stroke={C.grey} strokeWidth={10} strokeDasharray="26 18" fill="none" strokeLinecap="round" />
        <Truck x={1790} y={640} at={-400} s={0.42} />
        {queue
          .slice()
          .reverse()
          .map((q, i) => (
            <Person key={i} x={q.x} y={q.y} at={-400} s={q.s} gear={q.gear} hold={q.hold} uniform={q.uniform} expr="happy" seed={70 + i} />
          ))}
        {/* (1) the lonely GI */}
        <Foxhole x={470} y={1120} at={-400} s={2.4} />
        <Person x={470} y={1250} at={-400} pose="bust" hold="rifle" expr="shocked" s={3.2} look={8} />
        {/* (3) text + arrow */}
        <Fill pts={blob} color={C.yellow} at={-400} dur={1} gap={16} w={22} tint={0.7} />
        <text x={1430} y={318} fontFamily="PermanentMarker" fontSize={190} textAnchor="middle" fill={C.ink} stroke={C.white} strokeWidth={6} paintOrder="stroke">
          ONLY 14%
        </text>
        <Arrow from={[1090, 380]} to={[760, 470]} at={-400} w={16} head={46} bend={-0.12} />
      </svg>
    </AbsoluteFill>
  );
};
