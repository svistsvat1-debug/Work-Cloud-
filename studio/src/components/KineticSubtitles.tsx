import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CONTENT, DISPLAY} from '../brand';
import {chunkWords, display} from '../lib/chunks';
import type {Word} from '../lib/timeline';

/** Font size that keeps a chunk on one or two lines inside the 800px safe column. */
const sizeFor = (n: number) => Math.max(76, Math.min(132, 1000 / n));

/**
 * Word-by-word kinetic captions synced to word timestamps.
 * - 1-4 words per chunk, each word pops in on its exact start time
 * - highlighted words: yellow + scaled; emphasis words: yellow + bigger + shake
 */
export type SubtitleTheme = 'dark' | 'yellow';

/**
 * dark:   white words, yellow accents, black stroke (default, for dark backgrounds)
 * yellow: black words, white accents with black stroke (for the Yellow Punch style)
 */
export const KineticSubtitles: React.FC<{words: Word[]; centerY?: number; theme?: SubtitleTheme}> = ({words, centerY = 1270, theme = 'dark'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunks = useMemo(() => chunkWords(words), [words]);

  const idx = chunks.findLastIndex((c) => c.start - 0.04 <= t);
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const next = chunks[idx + 1];
  if (next && t > chunk.end + 0.7 && t < next.start - 0.04) return null;

  const enterF = frame - Math.round((chunk.start - 0.04) * fps);
  const chunkIn = spring({frame: enterF, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});
  const nChars =
    chunk.words.reduce((n, w) => n + display(w.text).length * (w.emph ? 1.22 : w.hl ? 1.1 : 1), 0) + chunk.words.length - 1;
  const size = sizeFor(nChars);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: CONTENT.left,
          width: CONTENT.width,
          top: centerY,
          transform: `translateY(-50%) translateY(${(1 - chunkIn) * 26}px)`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          columnGap: size * 0.34,
          rowGap: 0,
        }}
      >
        {chunk.words.map((w, i) => {
          const wf = frame - Math.round((w.start - 0.03) * fps);
          const visible = wf >= 0;
          const pop = spring({frame: wf, fps, config: {damping: 12, stiffness: 300, mass: 0.55}});
          const accent = w.hl || w.emph;
          const base = w.emph ? 1.22 : w.hl ? 1.1 : 1;
          const scale = visible ? interpolate(pop, [0, 1], [0.45, 1]) : 0;
          let sx = 0;
          let sy = 0;
          let rot = 0;
          if (w.emph && visible && wf < 10) {
            const k = 1 - wf / 10;
            sx = (random(`sx${w.start}-${frame}`) - 0.5) * 18 * k;
            sy = (random(`sy${w.start}-${frame}`) - 0.5) * 18 * k;
            rot = (random(`sr${w.start}-${frame}`) - 0.5) * 6 * k;
          }
          return (
            <span
              key={i}
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: size * base,
                lineHeight: 1.08,
                letterSpacing: '-0.01em',
                color: theme === 'yellow' ? (accent ? C.white : '#000') : accent ? C.yellow : C.white,
                WebkitTextStroke: theme === 'yellow' && !accent ? '0px #000' : `${Math.round(size * base * 0.1)}px #000`,
                paintOrder: 'stroke fill',
                textShadow:
                  theme === 'yellow'
                    ? accent
                      ? '0 8px 0 #000'
                      : '0 5px 0 rgba(255,255,255,0.55)'
                    : accent
                      ? `0 8px 0 rgba(0,0,0,0.9), 0 0 38px rgba(255,230,0,0.45)`
                      : `0 8px 0 rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.6)`,
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${scale})`,
              }}
            >
              {display(w.text)}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
