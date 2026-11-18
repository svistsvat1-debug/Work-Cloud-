// sunken-lunch: timing (video time = word start + 0.1 s; words from the TTS alignment, checked against Scribe and by loudness,
// see images/sunken-lunch/words.json). Voice: Liam, 63 words / 350 chars, speech 0.02-22.66 s of the take (22.64 s = 2.78 words/s),
// no fitting (23.4 s video <= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.4;
export const T = {
  this: 0.1, sandwich: 0.34, headed: 0.98, bottom: 1.86, sea: 2.34, seaEnd: 2.86,
  subs: 3.14, cables: 3.54, snap: 4.18, snapEnd: 4.5,
  crew: 4.82, jumps: 5.22, out: 5.54, outEnd: 5.86,
  sandwich2: 6.34, doesnt: 7.06, doesntEnd: 7.54,
  ten: 7.94, months: 8.22, later: 8.5, they: 8.9, haul: 9.06, up: 9.38, upEnd: 9.62,
  almost: 9.94, fresh: 10.34, freshEnd: 10.82,
  cold: 11.14, right: 11.62, rightEnd: 11.94,
  but: 12.26, fridge: 12.66, that: 12.98, cold2: 13.3, germs: 13.86, eat: 14.18, food: 14.42, up2: 14.66, hundred: 15.14, times: 15.46,
  faster: 15.94, fasterEnd: 16.42,
  the2: 16.82, crushing: 17.02, pressure: 17.46, down: 17.9, slows: 18.26, them: 18.66, even: 18.86, more: 19.06, moreEnd: 19.46,
  so: 19.86, scientists: 20.34, start: 20.94, sinking: 21.22, lunch: 21.62, on: 21.94, purpose: 22.18, end: 22.76,
};
// shots: surface (0) -> the bottom, 10 months later (cut on "Ten") -> whip up with the haul -> close on the hatch (cut on "Almost")
// -> the lab fridge (cut on "But") -> the bottom again, cutaway + pressure (cut on "The crushing") -> the ship's stern (cut on "So")
export const C_BOTTOM = 7.94;
export const C_CLOSE = 9.94;
export const C_LAB = 12.26;
export const C_DEEP = 16.82;
export const C_END = 19.86;
