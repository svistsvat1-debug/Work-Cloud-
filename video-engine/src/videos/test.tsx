import React from 'react';
import {Frame, Layer} from '../engine/core';
import {Sky, Glow, Clouds, Sea, Smoke, Birds, Mist} from '../engine/fx';
import {Stamp} from '../engine/text';
import {Ship, Mine} from '../assets/ships';
import {Hills, Mountains, Grass} from '../assets/land';
import {Fighter} from '../assets/planes';
import {Person} from '../assets/people';

export const TestHarbor: React.FC = () => (
  <Frame move={{type: 'drift', amount: 0.02, dir: -1}} overlay={<Stamp text="KURE · AUGUST 1945" />}>
    <Layer depth={0}>
      <Sky stops={[[0, '#23263f'], [0.45, '#6b3a4a'], [0.75, '#d0703f'], [1, '#f2b06a']]} />
      <Glow x={1350} y={640} r={420} color="#ffc27a" core="#ffe9c0" coreR={90} />
      <Clouds color="#f0b98a" opacity={0.4} n={4} y={[150, 360]} />
      <Birds color="#2a2034" x={500} y={300} />
    </Layer>
    <Layer depth={0.15}>
      <Mountains y={700} h={180} color="#5a3346" seed="km" />
    </Layer>
    <Layer depth={0.3}>
      <Hills y={705} amp={30} color="#3d2638" seed="kh" />
      <Sea y={700} top="#c7704a" bottom="#2a1f2e" streak="#ffd29a" />
      <Smoke x={980} y={640} color="#3a2a35" opacity={0.5} />
    </Layer>
    <Layer depth={0.45}>
      <Ship kind="nagato" x={700} y={760} len={560} color="#1d1622" rim="#f2a060" />
      <Ship kind="destroyer" x={1300} y={745} len={300} color="#251b2a" rim="#f2a060" />
      <Ship kind="carrierKatsuragi" x={120} y={735} len={420} color="#2a1e2e" rim="#f2a060" />
    </Layer>
    <Layer depth={0.85}>
      <Mine x={1560} y={960} r={70} color="#120e16" rim="#f2a060" float />
      <Mist y={980} color="#2a1f2e" opacity={0.4} />
    </Layer>
  </Frame>
);

export const TestField: React.FC = () => (
  <Frame move={{type: 'push', amount: 0.035, ox: 0.6, oy: 0.65}}>
    <Layer depth={0}>
      <Sky stops={[[0, '#2b2f4a'], [0.4, '#8e3b3a'], [0.7, '#e0743a'], [1, '#f9d79a']]} />
      <Glow x={1240} y={650} r={340} color="#ffc27a" core="#fff1cc" coreR={120} />
      <Clouds color="#f7c48a" opacity={0.5} n={3} />
    </Layer>
    <Layer depth={0.2}>
      <Mountains y={760} h={200} color="#7a3d45" seed="fm" />
    </Layer>
    <Layer depth={0.45}>
      <Hills y={820} amp={30} color="#3e2a3c" seed="fh" rim="#e98a4f" />
      {[0, 1, 2, 3].map((i) => (
        <Fighter key={i} x={300 + i * 330} y={880 + i * 6} len={240} color="#1a1520" rim="#f2a060" roundel="#7a2a26" prop={i % 2 ? 'none' : 'stopped'} />
      ))}
      <Person x={1480} y={900} h={170} hat="pilot" item="helmet" color="#121018" rim="#f2a060" />
    </Layer>
    <Layer depth={1}>
      <Hills y={990} amp={20} color="#0d0b12" seed="fg" />
      <Grass y={985} color="#0d0b12" n={80} h={50} />
    </Layer>
  </Frame>
);
