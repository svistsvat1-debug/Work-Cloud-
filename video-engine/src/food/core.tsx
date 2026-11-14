import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {PText} from '../paint/Paint';
import {PAL} from '../paint/wobble';
import timing from '../food-timing.json';

export const FPS = 30;
export const T = timing as {
  fps: number; end: number; endFrame: number; voiceDuration: number;
  sentences: {text: string; start: number; end: number; words: [string, number, number][]}[];
  scenes: {name: string; start: number; end: number; beats: number[]}[];
};
export const fr = (t: number) => Math.round(t * FPS);

export type SP = {
  b: (i: number) => number; // beat i start (scene-local frame)
  e: (i: number) => number; // beat i end
  w: (i: number, word: string, n?: number) => number; // word start inside beat i
  L: number; // scene length in frames
};

export const makeSP = (idx: number): SP => {
  const sc = T.scenes[idx];
  const s0 = fr(sc.start);
  const L = fr(sc.end) - s0;
  const sent = (i: number) => T.sentences[sc.beats[Math.min(i, sc.beats.length - 1)]];
  return {
    L,
    b: (i) => Math.max(0, fr(sent(i).start) - s0 + 2),
    e: (i) => fr(sent(i).end) - s0,
    w: (i, word, n = 0) => {
      const ws = sent(i).words.filter((x) => x[0].toLowerCase().startsWith(word.toLowerCase()));
      const hit = ws[Math.min(n, ws.length - 1)];
      return hit ? Math.max(0, fr(hit[1]) - s0) : fr(sent(i).start) - s0;
    },
  };
};

const HdrCtx = createContext('');
export const useHdr = () => useContext(HdrCtx);

// white board (or one flat backdrop), very slow push-in, optional item header
export const Board: React.FC<{L: number; hdr?: string; bg?: string; children: React.ReactNode}> = ({L, hdr, bg = PAL.white, children}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, L], [1, 1.035], {extrapolateRight: 'clamp'});
  const [n, ...rest] = (hdr || '').split(' ');
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: `scale(${k})`}}>
        {children}
        {hdr ? (
          <g>
            <PText x={56} y={92} at={0} size={66} color={PAL.red}>{n}</PText>
            <PText x={56 + n.length * 34 + 20} y={92} at={0} size={66}>{rest.join(' ')}</PText>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
