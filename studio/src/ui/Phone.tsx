import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, UI} from '../brand';

/** Full-screen lock-screen wallpaper: dark with soft brand-yellow light. */
export const Wallpaper: React.FC<{dim?: number}> = ({dim = 0}) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 60) * 40;
  return (
    <AbsoluteFill style={{backgroundColor: '#070707'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${20 + drift / 20}% ${85 - drift / 30}%, rgba(255,230,0,0.38) 0%, rgba(255,230,0,0) 38%),
            radial-gradient(circle at 90% 20%, rgba(255,170,0,0.16) 0%, rgba(255,170,0,0) 35%),
            radial-gradient(circle at 60% 60%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 45%)`,
          filter: 'blur(10px)',
        }}
      />
      <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'screen'}}>
        <svg width="100%" height="100%">
          <filter id="wpgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(random(Math.floor(f / 4)) * 1000)} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#wpgrain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${dim})`}} />
    </AbsoluteFill>
  );
};

/** Status bar (inside TikTok's top overlay zone; decorative only). */
export const StatusBar: React.FC<{time: string}> = ({time}) => (
  <div
    style={{
      position: 'absolute',
      top: 40,
      left: 70,
      right: 70,
      display: 'flex',
      justifyContent: 'space-between',
      color: C.white,
      fontFamily: UI,
      fontWeight: 600,
      fontSize: 34,
      opacity: 0.9,
    }}
  >
    <span>{time}</span>
    <span style={{display: 'flex', gap: 10, alignItems: 'center'}}>
      {[10, 16, 22, 28].map((h) => (
        <span key={h} style={{width: 7, height: h, borderRadius: 3, background: C.white, display: 'inline-block', alignSelf: 'flex-end'}} />
      ))}
      <span style={{width: 56, height: 26, borderRadius: 8, border: `3px solid ${C.white}`, marginLeft: 12, position: 'relative', display: 'inline-block'}}>
        <span style={{position: 'absolute', left: 3, top: 3, bottom: 3, width: 36, borderRadius: 4, background: C.white}} />
      </span>
    </span>
  </div>
);

/** Big lock-screen clock, date and an optional Focus pill. */
export const LockClock: React.FC<{time: string; date: string; focus?: React.ReactNode; top?: number}> = ({time, date, focus, top = 210}) => (
  <div style={{position: 'absolute', top, left: 130, width: 800, textAlign: 'center', color: C.white, fontFamily: UI}}>
    <div style={{fontSize: 40, fontWeight: 600, opacity: 0.85}}>{date}</div>
    <div style={{fontSize: 200, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 6}}>{time}</div>
    {focus ? <div style={{display: 'flex', justifyContent: 'center', marginTop: 22}}>{focus}</div> : null}
  </div>
);

export const FocusPill: React.FC<{icon: React.ReactNode; label: string; glow?: number}> = ({icon, label, glow = 0}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 26px',
      borderRadius: 999,
      background: `rgba(255,230,0,${0.14 + 0.5 * glow})`,
      border: `2px solid rgba(255,230,0,${0.5 + 0.5 * glow})`,
      color: glow > 0.5 ? '#000' : C.yellow,
      fontSize: 32,
      fontWeight: 700,
      boxShadow: glow ? `0 0 ${60 * glow}px rgba(255,230,0,0.6)` : undefined,
    }}
  >
    {icon}
    {label}
  </div>
);

export const AppIcon: React.FC<{children: React.ReactNode; accent?: boolean; size?: number}> = ({children, accent, size = 72}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      flexShrink: 0,
      background: accent ? C.yellow : '#1E1E1E',
      border: accent ? 'none' : '2px solid #333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

/** Lock-screen notification card. */
export const Notification: React.FC<{
  icon: React.ReactNode;
  app: string;
  title: string;
  body: string;
  time?: string;
  done?: boolean;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({icon, app, title, body, time = 'now', done, accent, style}) => (
  <div
    style={{
      display: 'flex',
      gap: 22,
      alignItems: 'center',
      padding: '24px 28px',
      borderRadius: 40,
      // opaque so stacked cards never show through each other
      background: accent ? '#34300E' : '#262626',
      border: accent ? `2px solid rgba(255,230,0,0.7)` : '2px solid rgba(255,255,255,0.06)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
      fontFamily: UI,
      ...style,
    }}
  >
    <AppIcon accent={accent}>
      <div style={{display: 'flex', filter: accent ? 'brightness(0)' : undefined}}>{icon}</div>
    </AppIcon>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 26, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
        <span>{app}</span>
        <span style={{textTransform: 'none', letterSpacing: 0}}>{time}</span>
      </div>
      <div style={{fontSize: 36, color: C.white, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10}}>
        {title}
        {done ? <span style={{color: C.yellow}}>✓</span> : null}
      </div>
      <div style={{fontSize: 30, color: 'rgba(255,255,255,0.72)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{body}</div>
    </div>
  </div>
);
