// Channel thumbnail building blocks (house style, see docs/video/STYLE_GUIDE.md §9):
// paper background, Anton text, and a "sketch" layer = colour wash + ink hatching in the shadows.
import React, {useEffect, useId, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import '@fontsource/anton';
import {useFonts} from './VideoFromTimeline';

export const useAnton = () => {
  const [h] = useState(() => delayRender('anton'));
  useEffect(() => {
    document.fonts.load('200px "Anton"').then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

/** Renders children as a pen-and-ink sketch: desaturated wash + hatching where the drawing is dark. */
export const Sketch: React.FC<{children: React.ReactNode; hatch?: number}> = ({children, hatch = 0.55}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <pattern id={`h${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="#2a2621" strokeWidth="2.2" />
        </pattern>
        <filter id={`w${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix type="saturate" values="0.62" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.96" intercept="0.05" />
            <feFuncG type="linear" slope="0.94" intercept="0.05" />
            <feFuncB type="linear" slope="0.88" intercept="0.04" />
          </feComponentTransfer>
        </filter>
        <filter id={`d${id}`}>
          <feColorMatrix type="luminanceToAlpha" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="1 0.85 0.2 0 0 0" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="dark" />
          <feComposite in="dark" in2="SourceGraphic" operator="in" />
        </filter>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
          <g filter={`url(#d${id})`}>{children}</g>
        </mask>
      </defs>
      <g filter={`url(#w${id})`}>{children}</g>
      <rect width={1280} height={720} fill={`url(#h${id})`} mask={`url(#m${id})`} opacity={hatch} />
    </g>
  );
};

/** Paper canvas for 1280x720 thumbnails. */
export const PaperThumb: React.FC<{children: React.ReactNode}> = ({children}) => {
  useFonts();
  useAnton();
  return (
    <AbsoluteFill>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <defs>
          <filter id="paperGrainT" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={8} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={0.05} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width={1280} height={720} fill="#f4f1ea" />
        <image href={staticFile('paper.png')} x={0} y={0} width={1920} height={1080} transform="scale(0.667)" opacity={0.9} />
        {children}
        <rect width={1280} height={720} filter="url(#paperGrainT)" />
      </svg>
    </AbsoluteFill>
  );
};

export const ANTON = '"Anton", sans-serif';
