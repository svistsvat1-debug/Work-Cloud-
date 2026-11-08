import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Layer, rotUpTo, toScreen, INK} from './lib';
import {Extra, Lamp, LAMP, Moth} from './characters';
import {FarGround, GROUND, LAMP_S, LampGlow, LightPool, NearBand, NearGrass, Sky, Stars} from './env';

// Cover / thumbnail: one focal point (a stressed moth stuck circling a smug lamp) + the punchline in 2 lines.
const cam = {x: 600, y: 760, z: 180};
const BASE = {x: 640, y: GROUND.near};
const LC = {x: BASE.x + (LAMP.lantern[0] - LAMP.ax) * LAMP_S, y: BASE.y - (LAMP.ay - LAMP.lantern[1]) * LAMP_S};
const HERO = {x: 392, y: 800};

const Line: React.FC<{text: string; y: number; size: number; color: string; rot?: number}> = ({text, y, size, color, rot = 0}) => (
  <div style={{position: 'absolute', left: 30, right: 30, top: y, transform: `translateY(-50%) rotate(${rot}deg)`, textAlign: 'center',
    fontFamily: '"Inter Display", "Inter", sans-serif', fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: 2,
    whiteSpace: 'nowrap', WebkitTextStroke: `${size * 0.16}px ${INK}`, paintOrder: 'stroke fill', textShadow: `0 ${size * 0.07}px 0 rgba(0,0,0,0.5)`}}>
    {text}
  </div>
);

export const MothsCover: React.FC = () => {
  const lc = toScreen(cam, 1000, LC.x, LC.y);
  const orbit = Array.from({length: 73}, (_, i) => {
    const a = (i / 72) * 2 * Math.PI;
    return `${lc.x + 360 * Math.cos(a)},${lc.y + 250 * Math.sin(a)}`;
  }).join(' ');
  const t = 0.37; // a frame where the wings are up
  return (
    <AbsoluteFill>
      <Sky glow={0.2} />
      <Stars cam={cam} t={0} />
      <FarGround cam={cam} blur={2.5} />
      <Layer cam={cam} z={1000}>
        <LampGlow x={LC.x} y={LC.y} a={1.35} />
        <Lamp uid="cov" x={BASE.x} y={BASE.y} s={LAMP_S} on cover={0.4} tilt={0.24} brow={-0.15} smirk={1}
          look={[-0.9, 0.3]} />
        <NearBand />
        <LightPool x={BASE.x} a={1.2} />
        <NearGrass xs={[-300, 120, 1180, 1500]} />
      </Layer>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <polyline points={orbit} fill="none" stroke={INK} strokeWidth={15} strokeDasharray="30 24" strokeLinecap="round" />
        <polyline points={orbit} fill="none" stroke="#FFE9A8" strokeWidth={8} strokeDasharray="30 24" strokeLinecap="round" />
      </svg>
      <Layer cam={cam} z={1000}>
        <Extra kind="a" x={867} y={512} width={145} rot={-50} t={0} hz={6} seed={0} />
        <Extra kind="b" x={897} y={740} width={150} rot={40} t={0} hz={6} seed={1.2} />
        <Moth uid="covh2" x={742} y={835} s={0.085} t={t} hz={8} rot={-20} filter="hue-rotate(-28deg) saturate(0.75) brightness(0.9)" />
        <Moth uid="covh" x={HERO.x} y={HERO.y} s={0.26} t={t} hz={8} rot={34} expr="scared" sweat={0.45} look={[0.8, -0.4]} noBlink />
      </Layer>
      <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <Line text="NOT ATTRACTED." y={300} size={100} color="#FFFFFF" />
      <Line text="TRAPPED." y={455} size={205} color="#FFE066" rot={-3} />
    </AbsoluteFill>
  );
};
