import React, {createContext, useContext} from 'react';
import {Easing, interpolate} from 'remotion';
import {FPS} from './theme';

export type Word = {w: string; t: number; e: number};
export type SceneData = {id: number; vo: string; start: number; end: number; words: Word[]};

export const SceneCtx = createContext<SceneData | null>(null);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Local frame (relative to the scene start) of a spoken word. Multi-word keys match consecutive words.
export const useCue = () => {
  const sc = useContext(SceneCtx);
  if (!sc) throw new Error('useCue outside scene');
  const cue = (key: string, nth = 1, edge: 't' | 'e' = 't'): number => {
    const parts = key.split(/\s+/).map(norm);
    let hit = 0;
    for (let i = 0; i + parts.length <= sc.words.length; i++) {
      let ok = true;
      for (let k = 0; k < parts.length; k++) {
        if (norm(sc.words[i + k].w) !== parts[k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        hit++;
        if (hit === nth) {
          const w = edge === 't' ? sc.words[i] : sc.words[i + parts.length - 1];
          return Math.round((w[edge] - sc.start) * FPS);
        }
      }
    }
    throw new Error(`cue "${key}" (#${nth}) not found in scene ${sc.id}`);
  };
  const len = Math.round((sc.end - sc.start) * FPS);
  return {cue, len, scene: sc};
};

export const prog = (f: number, at: number, dur: number) =>
  interpolate(f, [at, at + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

export const lin = (f: number, at: number, dur: number) =>
  interpolate(f, [at, at + Math.max(1, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Pop with a small overshoot (0 -> 1.12 -> 1).
export const popScale = (f: number, at: number, dur = 10) => {
  if (f < at) return 0;
  const t = Math.min(1, (f - at) / dur);
  const back = 1.9;
  const x = t - 1;
  return 1 + (back + 1) * x * x * x + back * x * x;
};

export const SceneProvider: React.FC<{scene: SceneData; children: React.ReactNode}> = ({scene, children}) =>
  React.createElement(SceneCtx.Provider, {value: scene}, children);
