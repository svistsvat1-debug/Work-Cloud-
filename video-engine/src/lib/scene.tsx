import React, {createContext, useContext} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export type Word = {w: string; s: number; e: number};
export type SceneData = {
  i: number;
  block: string;
  vo: string;
  mood: string;
  start: number;
  end: number;
  voStart: number;
  voEnd: number;
  words: Word[];
};

type Ctx = {scene: SceneData; offset: number};
const SceneCtx = createContext<Ctx | null>(null);

export const SceneProvider: React.FC<{scene: SceneData; offset?: number; children: React.ReactNode}> = ({scene, offset = 0, children}) => (
  <SceneCtx.Provider value={{scene, offset}}>{children}</SceneCtx.Provider>
);

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Scene clock. t = seconds since scene start. k(word, n) = when the nth occurrence of word is spoken (scene-relative). */
export const useScene = () => {
  const c = useContext(SceneCtx);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!c) throw new Error('useScene outside SceneProvider');
  const {scene, offset} = c;
  const t = frame / fps + offset;
  const dur = scene.end - scene.start;
  const find = (word: string, n = 1) => {
    const target = norm(word);
    let c2 = 0;
    for (const w of scene.words) {
      if (w.w === target) {
        c2++;
        if (c2 === n) return w;
      }
    }
    return null;
  };
  const k = (word: string, n = 1, fallback?: number) => {
    const w = find(word, n);
    if (w) return w.s - scene.start;
    // eslint-disable-next-line no-console
    console.warn(`[scene ${scene.i}] keyword not found: ${word}`);
    return fallback ?? 0.5;
  };
  const ke = (word: string, n = 1) => {
    const w = find(word, n);
    return w ? w.e - scene.start : dur * 0.5;
  };
  return {t, dur, k, ke, scene, voEnd: scene.voEnd - scene.start};
};
