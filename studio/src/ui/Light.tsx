import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, UI} from '../brand';

/** Clean Light background: warm paper white with a faint dot grid. */
export const PaperBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#F5F4EF'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.07) 2.5px, transparent 3px)',
          backgroundSize: '40px 40px',
          backgroundPosition: `${(f * 0.25) % 40}px ${(f * 0.4) % 40}px`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, rgba(255,230,0,0.16) 0%, rgba(255,230,0,0) 50%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.06) 100%)'}} />
    </AbsoluteFill>
  );
};

export const LightCard: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '2px solid #E6E3DA',
      borderRadius: 40,
      boxShadow: '0 30px 70px rgba(30,25,10,0.12)',
      fontFamily: UI,
      color: '#111',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Yellow highlighter behind inline text; `p` animates the swipe 0..1. */
export const Marker: React.FC<{children: React.ReactNode; p?: number}> = ({children, p = 1}) => (
  <span style={{position: 'relative', display: 'inline-block'}}>
    <span
      style={{
        position: 'absolute',
        left: -8,
        right: -8,
        top: '18%',
        bottom: '8%',
        background: C.yellow,
        borderRadius: 8,
        transform: `scaleX(${p}) skewX(-6deg)`,
        transformOrigin: 'left',
      }}
    />
    <span style={{position: 'relative'}}>{children}</span>
  </span>
);

/** "MYTH" / "FACT 1" style label. */
export const Tag: React.FC<{text: string; tone?: 'myth' | 'fact'; style?: React.CSSProperties}> = ({text, tone = 'fact', style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 22px',
      borderRadius: 999,
      background: tone === 'myth' ? '#111' : C.yellow,
      color: tone === 'myth' ? '#fff' : '#111',
      fontFamily: DISPLAY,
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: '0.08em',
      ...style,
    }}
  >
    {text}
  </div>
);
