// kitefin-headlights: timing (video time = Scribe word start + 0.1 s, see images/kitefin-headlights/words_raw.json).
// Voice: Liam, 67 words / 370 chars, speech 0.0-23.12 s in the take = ~2.9 words/s. No fitting needed:
// voice end 23.22 s + 0.53 s tail -> video 23.75 s (1425 frames).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.75;
export const T = {
  a: 0.1, sixfoot: 0.38, shark: 0.82, glows: 1.38, pitch: 2.18, sea: 2.74,
  everyone: 3.74, said: 4.02, hiding: 4.42, glow: 5.46, erases: 5.86, shadow: 6.78, below: 7.34,
  but: 8.14, nothing: 8.42, known: 8.9, hunt: 9.34, it: 9.66,
  so: 10.14, whos: 10.38, hiding2: 10.77, from: 11.1,
  scientists: 11.98, bring: 12.34, up: 12.62, eight: 12.82, measure: 13.42, light: 13.7,
  belly: 14.58, hides: 14.98, prey: 15.62, below2: 15.86,
  but2: 16.78, more: 16.98, light2: 17.22, spills: 17.46, sideways: 17.9, face: 18.74, like: 19.3, headlights: 19.5,
  so3: 20.5, maybe: 20.74, sneaks: 21.18, up2: 21.54, dinner: 21.86, lights: 22.42, on: 22.74, end: 23.22,
};
