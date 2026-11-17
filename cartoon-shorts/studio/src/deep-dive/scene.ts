// deep-dive: timing (video time = fitted word start + 0.1 s, see images/deep-dive/words.json).
// Voice: Liam, 70 words; raw take 26.88 s of speech -> fitted (8 pauses shortened, atempo 1.05) to 23.62 s.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.6; // voice ends ~23.72 s + the photo / cucumber ending
export const T = {
  two: 0.1, men: 0.41, sink: 0.71, toward: 1.01, deepest: 1.47, spot: 2.0, earth: 2.46, hanging: 3.11, 
  under: 3.45, tank: 3.87, gasoline: 4.14, why: 4.89, gasoline2: 5.12, its: 5.95, lighter: 6.25, water: 6.63, 
  and: 7.21, unlike: 7.39, air: 7.78, barely: 8.5, squeezes: 8.77, but: 9.59, five: 9.82, miles: 10.13, 
  down: 10.51, bang: 11.12, shakes: 11.58, steel: 12.19, ball: 12.41, window: 13.07, cracked: 13.61, they: 14.22, 
  keep: 14.38, sinking: 14.53, anyway: 14.95, after: 15.62, almost: 15.93, five2: 16.23, hours: 16.61, 
  they2: 17.07, land: 17.3, kicking: 17.91, up: 18.14, mud: 18.37, turns: 18.75, window2: 19.24, milky: 19.51, 
  white: 19.89, so: 20.59, from: 21.04, bottom: 21.46, world: 21.88, not: 22.78, one: 23.04, photo: 23.27, 
  end: 23.72,
};
// shots: wide descent (A C F) / porthole close-ups (B E J)
export const CUT_B = T.why; // CU: "Why gasoline?"
export const CUT_C = T.its; // wide: lighter than water, the air balloon gets crushed, but... BANG
export const CUT_E = 12.92; // CU: "A window has cracked." / thumbs-up
export const CUT_F = 14.9; // wide: keeps sinking, five hours, lands, mud cloud
export const CUT_J = T.window2; // CU: milky window, the camera, the photo
export const FLOOR = 9000; // world y of the trench floor (craft feet when landed)
