import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

// Loads the bundled marker fonts before any frame renders.
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const faces = [
      new FontFace('Permanent Marker', `url(${staticFile('fonts/PermanentMarker.woff2')})`),
      new FontFace('Caveat Brush', `url(${staticFile('fonts/CaveatBrush.woff2')})`),
    ];
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => {
        loaded.forEach((f) => (document.fonts as unknown as {add: (x: FontFace) => void}).add(f));
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
