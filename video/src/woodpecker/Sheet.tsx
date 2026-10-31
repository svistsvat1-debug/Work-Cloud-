import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BirdSide, BirdFront, Human, Spring, Pillow, Hammer, MovieCamera, Magnifier, Brain, Cloud, GrassTuft} from './sprites';
const Cell: React.FC<{x: number; y: number; s?: number; children: React.ReactNode}> = ({x, y, s = 1, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>
);
export const Sheet: React.FC = () => (
  <AbsoluteFill style={{background: '#F2B8D8'}}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <Cell x={110} y={140} s={0.8}><BirdSide pose="rest" /></Cell>
      <Cell x={430} y={140} s={0.8}><BirdSide pose="peck" /></Cell>
      <Cell x={760} y={140} s={0.8}><BirdSide pose="smug" /></Cell>
      <Cell x={110} y={560} s={0.8}><BirdSide pose="determined" /></Cell>
      <Cell x={430} y={560} s={0.8}><BirdFront /></Cell>
      <Cell x={850} y={1000} s={0.8}><Human pose="walk" /></Cell>
      <Cell x={850} y={1500} s={0.8}><Human pose="bonk" /></Cell>
      <Cell x={260} y={1000}><Spring len={130} /></Cell>
      <Cell x={560} y={1000}><Spring len={60} /></Cell>
      <Cell x={260} y={1150}><Pillow sx={1} /></Cell>
      <Cell x={520} y={1150}><Pillow sx={0.5} /></Cell>
      <Cell x={60} y={1330} s={0.8}><Hammer /></Cell>
      <Cell x={240} y={1330} s={0.8}><Hammer squeeze /></Cell>
      <Cell x={420} y={1450} s={0.8}><MovieCamera spin={20} rec /></Cell>
      <Cell x={180} y={1720} s={0.9}><Magnifier><Brain /></Magnifier></Cell>
      <Cell x={480} y={1760} s={1.6}><Brain wink /></Cell>
      <Cell x={720} y={260} s={0.6}><Cloud /></Cell>
      <Cell x={620} y={1880} s={0.8}><GrassTuft /></Cell>
    </svg>
  </AbsoluteFill>
);
