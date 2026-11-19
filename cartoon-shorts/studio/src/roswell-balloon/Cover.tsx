import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SP} from './sprites';
import {FONT, useRSWFont} from './Short';

// Cover (0 credits): the puzzled rancher holding a piece of shiny foil + the crash-debris heap on the ranch + "IT WAS LISTENING".
// Three things only (rancher, heap, text); text kept away from the bottom 20 % and the right edge (YouTube buttons).
const F = (n: string) => staticFile(`roswell-balloon/${n}.png`);
type Info = {w: number; h: number; feet: [number, number]};
const S = (n: string) => (SP as unknown as Record<string, Info>)[n];

export const RoswellBalloonCover: React.FC = () => {
  useRSWFont();
  const guy = S('puzzle');
  const heap = S('debris');
  const gs = 0.86; // rancher scale (native hero)
  const hs = 1.05; // heap scale
  const ps = 1.9; // plate scale
  return (
    <AbsoluteFill style={{background: '#75CCFC'}}>
      {/* ranch plate, horizon at ~52 % */}
      <Img src={F('ranch_pad')} style={{position: 'absolute', left: 540 - 1024 * ps, top: 1000 - 822 * ps, width: 2048 * ps, height: 1920 * ps}} />
      <div style={{position: 'absolute', left: 0, top: 1000 - 822 * ps + 1920 * ps - 4, width: 1080, height: 2000, background: '#E5BB78'}} />
      <Img src={F('debris')} style={{position: 'absolute', left: 700 - (heap.w * hs) / 2, top: 1560 - heap.h * hs, width: heap.w * hs, height: heap.h * hs}} />
      <div style={{position: 'absolute', left: 300 - guy.w * gs * 0.5, top: 1500 - guy.h * gs + 40, width: 1, height: 1}} />
      <Img src={F('puzzle')} style={{position: 'absolute', left: 330 - guy.feet[0] * gs, top: 1520 - guy.feet[1] * gs, width: guy.w * gs, height: guy.h * gs}} />
      {/* cover text */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 110,
          width: 860,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 150,
          lineHeight: 1.0,
          color: '#FFE45C',
          WebkitTextStroke: '20px #000',
          paintOrder: 'stroke',
          transform: 'rotate(-4deg)',
          textAlign: 'left',
        }}
      >
        IT WAS
        <br />
        LISTENING
      </div>
    </AbsoluteFill>
  );
};
