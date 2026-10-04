import {useCurrentFrame, useVideoConfig} from 'remotion';
import {blinkAt, browAt, isSpeaking, mouthAt, nodAt, type Mouth, type Phone} from '../lib/visemes';
import type {Word} from '../lib/timeline';

export type AvatarState = {t: number; mouth: Mouth; blink: number; brow: number; nod: number; speaking: boolean};

/** Everything an avatar needs for the current frame, driven by the voice timeline. */
export const useAvatar = (phones: Phone[], words: Word[], offsetFrames = 0): AvatarState => {
  const f = useCurrentFrame() + offsetFrames;
  const {fps} = useVideoConfig();
  const t = f / fps;
  return {t, mouth: mouthAt(phones, t), blink: blinkAt(t), brow: browAt(words, t), nod: nodAt(words, t), speaking: isSpeaking(words, t)};
};
