// sahara-solar: timing (video time = voice time + 0.1 s; Scribe word starts) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 21.56; // voice ends 21.06 s (video) + 0.5 s tail

export const T = {
  you: 0.1, power: 0.66, whole: 1.22, planet: 1.54, planetEnd: 2.1,
  so: 2.18, cover: 2.78, sahara: 3.06, solar: 3.74, panels: 4.22, panelsEnd: 4.74,
  endless: 4.82, sun: 5.3, right: 5.54, rightEnd: 6.18,
  but: 6.22, panels2: 6.62, darker: 7.167, than: 7.5, sand: 7.7, sandEnd: 8.18,
  so2: 8.26, desert: 8.58, soaks: 8.94, up: 9.22, heat: 9.38, heatEnd: 10.02,
  rising: 10.38, hot: 10.7, air: 10.9, pulls: 11.22, rain: 11.86, sand2: 12.42, turns: 12.86, green: 13.14, greenEnd: 13.78,
  but2: 13.82, rain2: 14.26, taken: 14.78, amazon: 15.3, so3: 15.94, jungle: 16.26, drying: 17.007, out: 17.34, outEnd: 17.86,
  so4: 17.94, panels3: 18.18, meant: 18.54, cool: 18.9, planet2: 19.42, planet2End: 19.94,
  they: 20.06, warm: 20.26, it: 20.42, up2: 20.58, end: 21.06,
};
export const CUT_F = T.but2; // -> the Amazon (code set)
export const CUT_G = 17.9; // -> back to the green Sahara
