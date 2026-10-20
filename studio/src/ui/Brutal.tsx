import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, DISPLAY, UI} from '../brand';

/** Yellow Punch background: brand yellow, drifting halftone dots, grain. */
export const YellowBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: C.yellow}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.09) 3px, transparent 3.5px)',
          backgroundSize: '34px 34px',
          backgroundPosition: `${(f * 0.5) % 34}px ${(f * 0.9) % 34}px`,
          maskImage: 'radial-gradient(ellipse at 50% 40%, transparent 25%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, transparent 25%, black 85%)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)'}} />
      <AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'multiply'}}>
        <svg width="100%" height="100%">
          <filter id="ygrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(random(Math.floor(f / 4)) * 1000)} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ygrain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Neo-brutalist card: thick black border, hard offset shadow. */
export const BrutalCard: React.FC<{children: React.ReactNode; dark?: boolean; style?: React.CSSProperties; shadow?: number}> = ({
  children,
  dark,
  style,
  shadow = 16,
}) => (
  <div
    style={{
      background: dark ? '#0B0B0B' : '#FFFFFF',
      color: dark ? C.yellow : '#0B0B0B',
      border: '6px solid #0B0B0B',
      borderRadius: 30,
      boxShadow: `${shadow}px ${shadow}px 0 #0B0B0B`,
      fontFamily: UI,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Field: React.FC<{label: string; value: string; caret?: boolean; tall?: boolean}> = ({label, value, caret, tall}) => (
  <div style={{marginBottom: 22}}>
    <div style={{fontSize: 26, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8}}>{label}</div>
    <div
      style={{
        border: '4px solid #0B0B0B',
        borderRadius: 16,
        padding: '16px 20px',
        minHeight: tall ? 110 : 0,
        fontSize: 34,
        fontWeight: 600,
        background: '#F6F6F2',
        whiteSpace: 'pre-wrap',
      }}
    >
      {value || <span style={{color: '#9A9A95'}}>…</span>}
      {caret ? <span style={{marginLeft: 2}}>|</span> : null}
    </div>
  </div>
);

export const BlackButton: React.FC<{label: string; pressed?: boolean; style?: React.CSSProperties}> = ({label, pressed, style}) => (
  <div
    style={{
      background: '#0B0B0B',
      color: C.yellow,
      borderRadius: 18,
      padding: '22px 30px',
      textAlign: 'center',
      fontFamily: DISPLAY,
      fontWeight: 900,
      fontSize: 40,
      transform: `translate(${pressed ? 6 : 0}px, ${pressed ? 6 : 0}px)`,
      boxShadow: pressed ? '0 0 0 #000' : '6px 6px 0 rgba(0,0,0,0.35)',
      ...style,
    }}
  >
    {label}
  </div>
);

/** Big step number badge ("1", "2", "3"). */
export const StepBadge: React.FC<{n: number | string; style?: React.CSSProperties}> = ({n, style}) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: 999,
      background: '#0B0B0B',
      color: C.yellow,
      fontFamily: DISPLAY,
      fontWeight: 900,
      fontSize: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '8px 8px 0 rgba(0,0,0,0.25)',
      ...style,
    }}
  >
    {n}
  </div>
);

/** Rubber-stamp label, slammed onto a card. */
export const Stamp: React.FC<{text: string; p: number; style?: React.CSSProperties}> = ({text, p, style}) => (
  <div
    style={{
      position: 'absolute',
      border: '10px solid #E0261B',
      color: '#E0261B',
      borderRadius: 18,
      padding: '10px 28px',
      fontFamily: DISPLAY,
      fontWeight: 900,
      fontSize: 84,
      letterSpacing: '0.04em',
      transform: `rotate(-12deg) scale(${2.2 - 1.2 * p})`,
      opacity: Math.min(1, p * 2),
      background: 'rgba(255,255,255,0.75)',
      ...style,
    }}
  >
    {text}
  </div>
);
