import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

// Loads the bundled fonts (Patrick Hand, Bangers) and blocks rendering until they are ready,
// so stills and the first frames never fall back to a system font.
export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('PatrickHand', `url(${staticFile('PatrickHand.woff2')}) format('woff2')`),
      new FontFace('Bangers', `url(${staticFile('Bangers.woff2')}) format('woff2')`),
    ];
    Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  useFonts();
  return <>{children}</>;
};
