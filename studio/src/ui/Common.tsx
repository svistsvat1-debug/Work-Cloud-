import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../brand';
import {Plus} from './Icons';

/** Stage: visual area above the captions, centred in the TikTok-safe column. */
export const Stage: React.FC<{children: React.ReactNode; y?: number}> = ({children, y = 680}) => (
  <AbsoluteFill>
    <div
      style={{
        position: 'absolute',
        left: 130,
        width: 800,
        top: y,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const usePop = (at: number, stiff = 220) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: {damping: 13, stiffness: stiff, mass: 0.6}});
};

/** End card: pulsing yellow follow button. */
export const FollowCard: React.FC<{pulses: number[]}> = ({pulses}) => {
  const f = useCurrentFrame();
  const p = usePop(0, 200);
  return (
    <Stage y={660}>
      <div style={{position: 'relative', width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {pulses.map((at, i) => {
          const d = f - at;
          if (d < 0 || d > 24) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 999,
                border: `8px solid ${C.yellow}`,
                transform: `scale(${1 + d / 14})`,
                opacity: 1 - d / 24,
              }}
            />
          );
        })}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 999,
            background: C.yellow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 140px rgba(255,230,0,0.5)',
            transform: `scale(${p})`,
          }}
        >
          <Plus size={190} color="#000" stroke={3.2} />
        </div>
      </div>
    </Stage>
  );
};
