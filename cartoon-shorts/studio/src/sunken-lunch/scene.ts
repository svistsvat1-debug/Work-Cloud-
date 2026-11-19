// sunken-lunch: timing (video time = word start + 0.1 s; words from ElevenLabs Scribe, see images/sunken-lunch/words.json).
// Voice: Liam, 63 words / 350 chars, speech 0.02-22.72 s of the take (22.70 s = 2.78 words/s), no fitting (23.5 s video <= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.5;
export const T = {
  this: 0.1, sandwich: 0.34, headed: 1.06, bottom: 1.78, sea: 2.34, seaEnd: 2.86,
  subs: 3.14, cables: 3.54, snap: 4.02, snapEnd: 4.5,
  crew: 4.9, jumps: 5.22, out: 5.54, outEnd: 5.86,
  sandwich2: 6.34, doesnt: 6.98, doesntEnd: 7.46,
  ten: 7.86, months: 8.1, later: 8.5, they: 8.9, haul: 9.06, up: 9.38, upEnd: 9.62,
  almost: 10.02, fresh: 10.42, freshEnd: 11.02,
  cold: 11.22, right: 11.62, rightEnd: 11.94,
  but: 12.26, fridge: 12.66, cold2: 13.3, germs: 13.86, eat: 14.18, food: 14.42, hundred: 15.14, times: 15.62, faster: 15.86, fasterEnd: 16.42,
  crushing: 17.02, pressure: 17.38, down: 17.82, slows: 18.26, them: 18.58, even: 18.86, more: 19.06, moreEnd: 19.86,
  so: 19.98, scientists: 20.34, start: 20.82, sinking: 21.14, lunch: 21.58, on: 21.94, purpose: 22.18, end: 23.06,
};
// shots (hard cuts): surface -> the deep, 10 months later -> surface (the sub bursts up) -> the lab fridge (on "But")
// -> the deep again (pressure) -> the deck (lunch on a line)
export const C_DEEP = 7.62;
export const C_SURF2 = 9.5;
export const C_LAB = 12.26;
export const C_DEEP2 = 16.75;
export const C_DECK = 19.95;
