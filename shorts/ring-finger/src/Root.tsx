import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {RingFinger} from './Scene';
import {DURATION, FPS} from './timeline';

if (typeof document !== 'undefined') {
  const h = delayRender('font');
  const font = new FontFace('Fredoka', `url(${staticFile('fredoka-700.woff2')}) format('woff2')`, {weight: '700'});
  font.load().then((f) => {
    document.fonts.add(f);
    continueRender(h);
  });
}

export const RemotionRoot: React.FC = () => (
  <Composition id="RingFinger" component={RingFinger} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
);
