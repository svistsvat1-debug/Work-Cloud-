// mars-rotor-mach: timing (video time = fitted Scribe word start + 0.1 s, see images/mars-rotor-mach/words.json).
// Voice: Liam, 67 words / 377 chars, raw speech 25.18 s (2.66 words/s) -> fitted with ffmpeg atempo 1.04 (no words cut):
// 24.22 s of speech, voice at 0.1 s, tail 0.43 s -> video 24.75 s (1485 frames).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.75;
export const T = {
  helicopter: 0.41, mars: 1.41, rule: 2.72, blades: 3.64, never: 4.18, spin: 4.48, past: 4.87, rpm: 6.1,
  because: 7.02, sound: 7.41, slower: 7.79, mars2: 8.33, gust: 9.02, push: 9.6, tips: 9.87, faster: 10.25, sound2: 10.87,
  andThen: 11.64, then: 11.91, nobody: 12.56, sure: 13.1,
  so: 13.71, engineers: 13.87, fill: 14.41, room: 14.71, fake: 15.1, air: 15.83, shield: 16.25, walls: 16.64, metal: 17.02,
  floor: 17.87, it: 18.18,
  tips2: 18.87, breaks: 19.25, barrier: 19.95, and2: 20.75, hold: 20.95,
  thirty: 21.79, percent: 22.1, more: 22.56, lift: 22.79,
  rule2: 23.56, broken: 23.87, end: 24.32,
};
