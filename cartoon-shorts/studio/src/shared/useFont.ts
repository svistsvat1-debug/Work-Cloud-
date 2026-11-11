import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

// Load a font file from public/ before any frame is captured.
export const useFont = (family: string, url: string) => {
  const [handle] = useState(() => delayRender(`font ${family}`));
  useEffect(() => {
    const f = new FontFace(family, `url(${url})`);
    f.load()
      .then((ff) => {
        document.fonts.add(ff);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [family, url, handle]);
};
