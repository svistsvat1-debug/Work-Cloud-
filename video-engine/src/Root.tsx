import React, { useEffect, useState } from 'react';
import { Composition, continueRender, delayRender, staticFile } from 'remotion';
import { Main } from './Main';
import { ThumbA, ThumbB, ThumbC } from './Thumb';
import TIMING from './data/timing.json';

const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [h] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fonts = [new FontFace('Permanent Marker', `url(${staticFile('fonts/PermanentMarker.woff2')})`), new FontFace('Caveat Brush', `url(${staticFile('fonts/CaveatBrush.woff2')})`)];
    Promise.all(fonts.map((f) => f.load()))
      .then((loaded) => { loaded.forEach((f) => (document as any).fonts.add(f)); setReady(true); })
      .catch((e) => { console.error(e); setReady(true); });
  }, []);
  useEffect(() => { if (ready) requestAnimationFrame(() => continueRender(h)); }, [ready, h]);
  return ready ? <>{children}</> : null;
};

const MainWithFonts: React.FC = () => <FontGate><Main /></FontGate>;
const TA: React.FC = () => <FontGate><ThumbA /></FontGate>;
const TB: React.FC = () => <FontGate><ThumbB /></FontGate>;
const TC: React.FC = () => <FontGate><ThumbC /></FontGate>;

export const Root: React.FC = () => {
  const frames = Math.ceil((TIMING as any).duration * 30);
  return (
    <>
      <Composition id="Main" component={MainWithFonts} durationInFrames={frames} fps={30} width={1920} height={1080} />
      <Composition id="Thumb" component={TA} durationInFrames={60} fps={30} width={1280} height={720} />
      <Composition id="ThumbB" component={TB} durationInFrames={60} fps={30} width={1280} height={720} />
      <Composition id="ThumbC" component={TC} durationInFrames={60} fps={30} width={1280} height={720} />
    </>
  );
};
