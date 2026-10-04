import React from 'react';
import {UI} from '../brand';

/** Light-theme browser window used for website mockups. */
export const Browser: React.FC<{url: string; width?: number; viewportHeight?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  url,
  width = 800,
  viewportHeight,
  children,
  style,
}) => (
  <div
    style={{
      width,
      borderRadius: 32,
      overflow: 'hidden',
      background: '#F5F5F3',
      boxShadow: '0 40px 120px rgba(0,0,0,0.75)',
      fontFamily: UI,
      ...style,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: '#E6E6E3'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <div key={c} style={{width: 20, height: 20, borderRadius: 99, background: c}} />
      ))}
      <div
        style={{
          flex: 1,
          marginLeft: 16,
          background: '#FFFFFF',
          borderRadius: 99,
          padding: '10px 24px',
          fontSize: 28,
          color: '#555',
          fontWeight: 500,
        }}
      >
        {url}
      </div>
    </div>
    {viewportHeight ? <div style={{height: viewportHeight, overflow: 'hidden', position: 'relative'}}>{children}</div> : children}
  </div>
);

/** Grey skeleton text line. */
export const Line: React.FC<{w: number | string; h?: number; color?: string; style?: React.CSSProperties}> = ({w, h = 18, color = '#D9D9D6', style}) => (
  <div style={{width: w, height: h, borderRadius: 99, background: color, ...style}} />
);
