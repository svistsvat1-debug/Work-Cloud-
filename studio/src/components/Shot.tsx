import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {GlitchTransition} from './GlitchTransition';
import {WhipTransition} from './WhipTransition';
import {ZoomTransition} from './ZoomTransition';

export type TransitionType = 'zoomIn' | 'zoomOut' | 'glitch' | 'whipLeft' | 'whipRight' | 'cut';

const PushIn: React.FC<{amount: number; duration: number; children: React.ReactNode}> = ({amount, duration, children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${1 + (amount * f) / Math.max(1, duration)})`}}>{children}</AbsoluteFill>;
};

/** One shot on the timeline: entry transition + slow push-in. Frames are absolute. */
export const Shot: React.FC<{
  from: number;
  to: number;
  transition?: TransitionType;
  push?: number;
  glitchHits?: number[];
  children: React.ReactNode;
}> = ({from, to, transition = 'zoomIn', push = 0.045, glitchHits = [], children}) => {
  const dur = to - from;
  const inner = (
    <PushIn amount={push} duration={dur}>
      {children}
    </PushIn>
  );
  const hits = glitchHits.map((h) => h - from);
  let body: React.ReactNode = inner;
  if (transition === 'zoomIn') body = <ZoomTransition dir="in">{inner}</ZoomTransition>;
  if (transition === 'zoomOut') body = <ZoomTransition dir="out">{inner}</ZoomTransition>;
  if (transition === 'whipLeft') body = <WhipTransition from="left">{inner}</WhipTransition>;
  if (transition === 'whipRight') body = <WhipTransition from="right">{inner}</WhipTransition>;
  if (transition === 'glitch' || hits.length) {
    body = (
      <GlitchTransition hits={hits} duration={transition === 'glitch' ? 8 : 6}>
        {transition === 'glitch' ? inner : body}
      </GlitchTransition>
    );
  }
  return (
    <Sequence from={from} durationInFrames={dur}>
      {body}
    </Sequence>
  );
};
