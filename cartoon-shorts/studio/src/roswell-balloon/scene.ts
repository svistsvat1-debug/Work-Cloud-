// roswell-balloon: timing (video time = word start + 0.1 s; words from ElevenLabs Scribe v1 on the take, images/roswell-balloon/words.json,
// shifted for the fitted voice take1_fit.wav: the pauses after 'balloon.' (0.6 s) and 'weather.' (0.5 s) were cut to 0.25 s - silence only).
// Voice: Liam, 67 words / 373 chars, raw speech 0.02-24.52 s (2.73 words/s); fitted speech ends at 23.92 s -> video 24.5 s (<= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.5;
export const T = {
  a: 0.1, rancher: 0.18, finds: 0.58, shiny: 0.98, foil: 1.38, foilEnd: 1.86, rubber: 2.02, and: 2.5, sticks: 2.74, sticksEnd: 3.14,
  all: 3.3, over: 3.54, ranch: 3.86, ranchEnd: 4.34,
  so: 4.74, army: 4.98, announces: 5.3, its: 5.78, got: 6.02, flying: 6.26, disc: 6.66, discEnd: 7.14,
  but: 7.54, hours: 7.78, later: 8.18, laterEnd: 8.66, it: 8.74, takes: 8.94, that: 9.14, back: 9.3, backEnd: 9.94,
  just: 10.02, a2: 10.22, weather: 10.38, balloon: 10.58, balloonEnd: 10.98,
  thirty: 11.19, years: 11.51, later2: 11.83, later2End: 12.31, people: 12.43, start: 12.63, saying: 12.87, sayingEnd: 13.27,
  aliens: 13.59, aliensEnd: 14.31, and2: 14.35, cover: 14.55, coverEnd: 15.19,
  turns: 15.67, out: 15.99, there: 16.39, was: 16.63, cover2: 16.95, cover2End: 17.51,
  it2: 17.75, really: 17.91, was2: 18.27, balloon2: 18.55, balloon2End: 18.95,
  just2: 19.35, not: 19.67, for: 19.91, weather2: 20.07, weather2End: 20.47,
  a3: 20.62, secret: 20.78, one: 21.18, oneEnd: 21.66, built: 21.74, to: 21.9, listen: 22.06, for2: 22.38, soviet: 22.62, nuclear: 23.1, bombs: 23.5, end: 24.02,
};
// shots: the ranch (0) -> CUT on "So" to the army airfield (megaphone, press, newspaper) -> punch-in CUT on "But" (clock, sign, the saucer
// poofs into a weather balloon) -> CUT on "Thirty" to the ranch at night (conspiracy board, tinfoil fans) -> CUT on "Turns" to the
// airfield (shh + TOP SECRET) -> on "It" the hangar opens and the balloon train rises (camera tilts up) -> CUT on "A" above the clouds
// (the listening device at the bottom of the train, a far blast, sound rings reach its ear on "bombs").
export const C_BASE = T.so;
export const C_BUT = T.but;
export const C_YEARS = T.thirty;
export const C_TURNS = T.turns;
export const C_SKY = T.a3;
