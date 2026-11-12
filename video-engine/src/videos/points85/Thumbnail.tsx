import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C} from '../../../components/theme';
import {FontGate} from '../../../components/Fonts';
import {GI} from '../../../components/GI';
import {Ship} from '../../../components/Ship';
import {Burst, Arrow} from '../../../components/fx';
import {MText} from '../../../components/text';

// Concept 1: "ONE POINT SHORT" — shocked GI holding 84, the ship home sails away.
export const Thumb85: React.FC = () => {
  const f = 600;
  return (
    <FontGate>
      <AbsoluteFill style={{backgroundColor: C.bg}}>
        <Img src={staticFile('paper.png')} style={{position: 'absolute', width: '100%', height: '100%'}} />
        <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
          <Ship f={f} inF={0} dF={10} x={1460} y={840} s={1.05} type="cargo" seed={41} />
          <Arrow f={f} inF={0} dF={10} x1={1060} y1={760} x2={1240} y2={730} bend={-0.15} seed={5} color={C.red} w={14} />
          <GI f={f} inF={0} dF={10} x={560} y={1130} s={1.75} bust mood="shock" seed={12} sweat={0} hold="card:84" holdF={0} />
          <Burst f={f} inF={0} x={1340} y={250} r={420} n={14} />
          <MText text={'ONE POINT\nSHORT'} x={1340} y={210} size={168} font="title" anchor="middle" p={1} ul={1} seed={3} lineGap={1.0} />
        </svg>
      </AbsoluteFill>
    </FontGate>
  );
};
