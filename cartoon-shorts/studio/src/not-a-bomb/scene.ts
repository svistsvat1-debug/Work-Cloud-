// not-a-bomb: timing (video time = word start + 0.1 s; words from ElevenLabs Scribe v1 on the take, images/not-a-bomb/words.json).
// Voice: Liam, 66 words / 333 chars, speech 0.04-23.16 s of the take (23.12 s = 2.85 words/s), no fitting (24.0 s video <= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.0;
export const T = {
  a: 0.1, fisherman: 0.26, sees: 0.74, man: 1.06, parachute: 1.46, into: 2.14, sea: 2.5, seaEnd: 2.98,
  except: 3.22, its: 3.86, not: 4.1, man2: 4.34, man2End: 4.74,
  its2: 5.06, american: 5.58, hydrogen: 6.02, bomb: 6.5, bombEnd: 6.9,
  so: 7.3, navy: 7.54, rushes: 8.02, in: 8.42, inEnd: 8.66,
  but: 9.06, to: 9.22, reporters: 9.5, reportersEnd: 10.02, its3: 10.1,
  the: 10.58, thing: 10.82, that: 11.14, is: 11.3, not2: 11.54, a2: 11.78, bomb2: 11.94, bomb2End: 12.34,
  for: 12.82, weeks: 13.06, weeksEnd: 13.78, nothing: 13.94, nothingEnd: 14.42,
  until: 14.82, tiny: 15.22, sub: 15.7, spots: 16.02, it: 16.42, half: 16.78, mile: 17.1, down: 17.3, downEnd: 17.62,
  eighty: 18.1, days: 18.34, in2: 18.66, its4: 19.06, finally: 19.3, up: 19.78, upEnd: 20.02,
  and: 20.34, thing3: 20.66, that3: 20.98, is3: 21.14, not3: 21.3, a3: 21.5, bomb3: 21.62, bomb3End: 21.94,
  poses: 22.1, for2: 22.5, cameras: 22.74, end: 23.46,
};
// shots: the sea with the fisherman + the falling bomb, the Navy rushes in (0) -> CUT on "But" to the beach press scrum
// -> CUT on "For" to the ship's deck (calendar, a boot on the hook) -> CUT on "Until" to the deep slope (tiny sub + lamp)
// -> CUT on "Eighty" to the sea surface (DAY counter, the bomb comes up tangled with the robot) -> CUT on "And" to the deck photo op
export const C_PRESS = T.but;
export const C_WEEKS = T.for;
export const C_DEEP = T.until;
export const C_UP = T.eighty;
export const C_POSE = T.and;
