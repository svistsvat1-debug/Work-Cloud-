// venice-piles: timing (video time = voice time + 0.1 s; Scribe word starts, sentence ends from the loudness envelope).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 17.95; // voice 16.96 s (speech ends 16.76) + 0.1 lead + tail with the loop glide (<= 20 s)

export const T = {
  y1902: 0.26, venice: 1.46, giant: 2.02, bell: 2.42, tower: 2.66, collapsed: 3.3, collEnd: 3.64,
  so: 4.02, people: 4.26, blamed: 4.46, wooden: 4.98, poles: 5.22, under: 5.62, itEnd: 5.94,
  stuck: 6.18, wet: 6.62, mud: 6.9, centuries: 7.5, centEnd: 8.0,
  but: 8.54, dug: 8.94, down: 9.22, downEnd: 9.78, poles2: 9.98, still: 10.58, holding: 10.82, holdEnd: 11.2,
  because: 11.7, deep: 12.14, mud2: 12.66, almost: 13.34, no: 13.62, air: 13.94, airEnd: 14.24,
  so2: 14.66, fungi: 15.02, rot: 15.58, wood: 15.78, cant: 16.26, breathe: 16.54, end: 16.86,
};
