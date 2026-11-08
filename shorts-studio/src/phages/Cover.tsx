// Shorts cover (1080x1920): the premise as one picture - phage vs antibiotic on the puzzled guy's palms.
// Text and important faces sit in the centre band so a centre crop (4:5 / 1:1 surfaces) still reads.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {Face} from '../lib/Face';
import {Shadow} from '../lib/fx';
import {Spr} from '../lib/Spr';
import {Cam, Layer} from '../lib/World';
import {poseScale, shade} from './Phages';
import {S} from './sprites';
import {FLOOR, GUY_X, HORIZON_Y, LAB_W, PHAGE_H, PILL_W} from './timing';

const useFont = () => {
  const [handle] = useState(() => delayRender('LuckiestGuy font'));
  useEffect(() => {
    const f = new FontFace('LuckiestGuy', `url(${staticFile('fonts/LuckiestGuy.woff2')}) format('woff2')`);
    f.load()
      .then((ff) => {
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(ff);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

const Title: React.FC<{text: string; y: number; size: number; color: string; rot: number}> = ({text, y, size, color, rot}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: 1080,
      top: y,
      textAlign: 'center',
      fontFamily: 'LuckiestGuy',
      fontSize: size,
      lineHeight: 1,
      color,
      WebkitTextStroke: `${Math.round(size * 0.11)}px #111`,
      paintOrder: 'stroke fill',
      textShadow: `0 ${Math.round(size * 0.06)}px 0 #111`,
      transform: `rotate(${rot}deg)`,
      letterSpacing: 2,
    }}
  >
    {text}
  </div>
);

export const PhagesCover: React.FC = () => {
  useFont();
  const cam: Cam = {x: 787, y: 1122, z: 270};
  const g = S.guy_shrug;
  const gs = poseScale('guy_shrug');
  const at = (p: number[]) => ({x: GUY_X + (p[0] - g.feet![0]) * gs, y: FLOOR + (p[1] - g.feet![1]) * gs});
  const pL = at(g.palmL!);
  const pR = at(g.palmR!);
  const ph = S.phage;
  const PS = (PHAGE_H / ph.h) * 1.3;
  const pill = S.pill;
  const PL = PILL_W / pill.w;
  const pillC = {x: pR.x + 62, y: pR.y - (pill.h * PL) / 2 - 22};
  const pf = ph.face!;
  const lf = pill.face!;
  return (
    <AbsoluteFill style={{background: '#e6f2ea'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #eef6ef 0%, #dcefe3 60%, #d3eadb 100%)'}} />
      <Layer cam={cam} z={3000} blur={3}>
        {[-1300, 1700].map((x) => (
          <Spr key={x} name="lab_bg" x={x} y={HORIZON_Y + 4} ax={S.lab_bg.w / 2} ay={S.lab_bg.h} s={LAB_W / S.lab_bg.w} />
        ))}
        <div style={{position: 'absolute', left: -20000, top: HORIZON_Y, width: 40000, height: 20000, background: '#efe4cf', borderTop: '9px solid #111'}} />
      </Layer>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 62%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 38%)'}} />
      <Layer cam={cam} z={1000}>
        <Shadow x={GUY_X} y={FLOOR} w={280} />
        <Spr name="guy_shrug" x={GUY_X} y={FLOOR} ax={g.feet![0]} ay={g.feet![1]} s={gs} />
        <Spr name="phage" x={pL.x} y={pL.y} ax={ph.feet![0]} ay={ph.feet![1]} s={PS}>
          <Face id="cphage" cx={pf[0]} cy={pf[1]} r={pf[2]} ink={4.5 / PS} lidColor={shade(ph.body ?? '#c8b4f0', 0.85)} spread={0.34} brow={1} browAngle={22} lid={0.15} lidTilt={12} mouth="grin" look={[1, 0.15]} />
        </Spr>
        <Spr name="pill" x={pillC.x} y={pillC.y} ax={pill.w / 2} ay={pill.h / 2} s={PL} rot={-8}>
          <Face id="cpill" cx={lf[0]} cy={lf[1]} r={lf[2] * 1.15} ink={4.5 / PL} lidColor="#d94848" spread={0.5} eyeSize={0.8} mouthY={0.38} brow={1} browAngle={12} lid={0.35} mouth="grin" look={[-1, 0.2]} />
        </Spr>
      </Layer>
      <Title text="WHY NOT" y={430} size={118} color="#ffffff" rot={-3} />
      <Title text="VIRUSES?" y={565} size={158} color="#ffd84a" rot={-3} />
    </AbsoluteFill>
  );
};
