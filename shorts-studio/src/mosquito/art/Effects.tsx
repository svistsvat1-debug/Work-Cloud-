import React from 'react';
import {Svg} from '../camera';
import {OUT, OW, clamp, easeOutCubic, rand} from '../util';
import {dropPath} from './Raindrop';

/** Fat cartoon arrow pointing down, tip at (0,0). s = overall scale, crumple 0..1 makes it limp. */
export const ForceArrow: React.FC<{s: number; crumple?: number; color?: string}> = ({s, crumple = 0, color = '#FF5A4E'}) => {
  if (s <= 0.01) return null;
  const bend = 26 * crumple;
  const d = `M 0 0 L -120 -150 L -54 -150 Q ${-54 + bend} -300 ${-54 + bend * 1.5} -420 L ${54 + bend * 1.5} -420 Q ${54 + bend} -300 54 -150 L 120 -150 Z`;
  return (
    <Svg box={[-160, -460, 320, 480]}>
      <g transform={`scale(${s})`}>
        <path d={d} fill={color} stroke={OUT} strokeWidth={OW / Math.max(0.35, s)} strokeLinejoin="round" />
        <path d={`M -30 -390 L -30 -200`} stroke="#FF9C8F" strokeWidth={16 / Math.max(0.35, s)} strokeLinecap="round" />
      </g>
    </Svg>
  );
};

/** Rounded pill badge with text. */
export const Badge: React.FC<{text: string; s: number; fill?: string}> = ({text, s, fill = '#FFFFFF'}) =>
  s <= 0.01 ? null : (
    <Svg box={[-180, -90, 360, 180]}>
      <g transform={`scale(${s})`}>
        <rect x={-150} y={-68} width={300} height={136} rx={68} fill={fill} stroke={OUT} strokeWidth={OW * 1.2} />
        <text
          x={0}
          y={30}
          textAnchor="middle"
          fontFamily="'DejaVu Sans', 'Arial Black', sans-serif"
          fontWeight={900}
          fontSize={92}
          fill={OUT}
        >
          {text}
        </text>
      </g>
    </Svg>
  );

/** Spiky impact star (cartoon "pow" without text). */
export const ImpactStar: React.FC<{s: number; rot?: number}> = ({s, rot = 0}) => {
  if (s <= 0.01) return null;
  const n = 10;
  const pts: string[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? 120 + 30 * rand(i, 5) : 58;
    const a = (i / (2 * n)) * Math.PI * 2;
    pts.push(`${Math.cos(a) * r} ${Math.sin(a) * r}`);
  }
  return (
    <Svg box={[-170, -170, 340, 340]}>
      <g transform={`rotate(${rot}) scale(${s})`}>
        <path d={`M ${pts.join(' L ')} Z`} fill="#FFF6C9" stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      </g>
    </Svg>
  );
};

/** Vertical speed lines around an object (u in 0..1 drives the stream). */
export const SpeedLines: React.FC<{t: number; w: number; h: number; alpha: number; seed?: number}> = ({t, w, h, alpha, seed = 1}) =>
  alpha <= 0.01 ? null : (
    <Svg box={[-w / 2, -h / 2, w, h]} style={{opacity: alpha}}>
      {Array.from({length: 9}, (_, i) => {
        const x = -w / 2 + (i + 0.5) * (w / 9) + (rand(i, seed) - 0.5) * 30;
        const len = 120 + rand(i, seed + 1) * 160;
        const y = (((rand(i, seed + 2) * h - t * 2600) % h) + h) % h - h / 2;
        return <path key={i} d={`M ${x} ${y} l 0 ${len}`} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.9} />;
      })}
    </Svg>
  );

/** Splash in a puddle: crown spikes + flying droplets + ripples. age in seconds since impact. */
export const Splash: React.FC<{age: number; scale?: number}> = ({age, scale = 1}) => {
  if (age < 0 || age > 2.2) return null;
  const crownU = clamp(age / 0.18);
  const crownDown = clamp((age - 0.25) / 0.35);
  const crownH = 150 * easeOutCubic(crownU) * (1 - crownDown);
  const spikes = 7;
  const drops = Array.from({length: 11}, (_, i) => {
    const ang = (-160 + (140 * i) / 10 + (rand(i, 3) - 0.5) * 10) * (Math.PI / 180);
    const sp = 520 + rand(i, 8) * 380;
    const vx = Math.cos(ang) * sp;
    const vy = Math.sin(ang) * sp;
    const tt = age;
    const x = vx * tt;
    const y = vy * tt + 0.5 * 2600 * tt * tt;
    const life = clamp(1 - (tt - 0.45) / 0.25);
    return {x, y, r: 10 + rand(i, 2) * 9, life, rot: (Math.atan2(vy + 2600 * tt, vx) * 180) / Math.PI + 90};
  });
  const rings = [0, 0.18, 0.36].map((d) => {
    const a = age - d;
    if (a < 0) return null;
    const u = clamp(a / 1.4);
    return {rx: 60 + 260 * easeOutCubic(u), alpha: 1 - u};
  });
  return (
    <Svg box={[-420, -420, 840, 560]}>
      <g transform={`scale(${scale})`}>
        {rings.map((r, i) =>
          r ? <ellipse key={i} cx={0} cy={0} rx={r.rx} ry={r.rx * 0.22} fill="none" stroke="#E8F6FF" strokeWidth={8} opacity={r.alpha} /> : null,
        )}
        {crownH > 2 &&
          Array.from({length: spikes}, (_, i) => {
            const x = -100 + (200 * i) / (spikes - 1);
            const lean = (x / 100) * 22;
            const h = crownH * (0.75 + 0.35 * rand(i, 6)) * (i === 0 || i === spikes - 1 ? 0.75 : 1);
            return (
              <path
                key={i}
                d={`M ${x - 18} 0 Q ${x + lean * 0.3} ${-h * 0.5} ${x + lean} ${-h} Q ${x + lean * 0.3 + 6} ${-h * 0.5} ${x + 18} 0 Z`}
                fill="#74C8F8"
                stroke={OUT}
                strokeWidth={5}
                strokeLinejoin="round"
              />
            );
          })}
        {crownH > 2 && <ellipse cx={0} cy={0} rx={128} ry={26} fill="#74C8F8" stroke={OUT} strokeWidth={5} />}
        {drops.map((d, i) =>
          d.life > 0.02 ? (
            <path key={i} d={dropPath(d.r * d.life)} transform={`translate(${d.x} ${d.y}) rotate(${d.rot})`} fill="#74C8F8" stroke={OUT} strokeWidth={4} />
          ) : null,
        )}
      </g>
    </Svg>
  );
};

/** Small "wet" splat burst around an impact point (droplets flying out). */
export const ImpactSpray: React.FC<{age: number}> = ({age}) => {
  if (age < 0 || age > 0.8) return null;
  return (
    <Svg box={[-300, -300, 600, 600]}>
      {Array.from({length: 9}, (_, i) => {
        const ang = ((i / 9) * 360 + rand(i, 4) * 20) * (Math.PI / 180);
        const sp = 600 + rand(i, 1) * 400;
        const x = Math.cos(ang) * sp * age;
        const y = Math.sin(ang) * sp * age + 900 * age * age;
        const r = (9 + rand(i, 7) * 8) * clamp(1 - age / 0.8);
        return <circle key={i} cx={x} cy={y} r={r} fill="#8FD3FF" stroke={OUT} strokeWidth={4} />;
      })}
    </Svg>
  );
};
