import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CRScene, FONT, useCRFont} from './Short';

// Cover: the guy covering his ears + the singing swarm on the tree + cover text (rule of three).
export const CicadaReunionCover: React.FC = () => {
  useCRFont();
  return (
    <AbsoluteFill>
      <CRScene t={15.5} cover />
      <div style={{position: 'absolute', left: 520, top: 360, transform: 'translate(-50%, -50%) rotate(-4deg)', fontFamily: FONT, fontSize: 130,
        lineHeight: 1.0, textAlign: 'center', color: '#FFE45C', WebkitTextStroke: '28px #000', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
        FIRST TIME
        <br />
        SINCE 1803
      </div>
    </AbsoluteFill>
  );
};
