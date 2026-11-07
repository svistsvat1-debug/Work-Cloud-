import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';

// Placeholder until the Flow pictures + ElevenLabs voice arrive.
const PipelineCheck: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(#9BD3FF, #DFF3FF)', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: 'sans-serif', fontSize: 90, fontWeight: 900, color: '#14284B'}}>pipeline ok</div>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="PipelineCheck" component={PipelineCheck} durationInFrames={60} fps={60} width={1080} height={1920} />
);
