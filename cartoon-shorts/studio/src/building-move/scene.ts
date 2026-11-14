// building-move: timing (video time = voice time + 0.1 s; Scribe word starts, sentence ends from the loudness envelope).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 19.3; // voice 18.72 s (speech ends 18.6) + 0.1 lead + tail (<= 20 s)

export const T = {
  in: 0.1, y1930: 0.34, y1930End: 1.32, phone: 1.66, company: 1.86, needed: 2.26, building: 2.82, gone: 3.22, goneEnd: 3.74,
  plan: 4.18, planEnd: 4.64, knock: 5.02, down: 5.46, downEnd: 5.72,
  but: 6.18, working: 7.06, phone2: 7.38, exchange: 7.62, exchEnd: 8.24,
  so: 8.5, swing: 9.06, would: 9.46, cut: 9.62, off: 9.78, calls: 10.02, callsEnd: 10.54,
  so2: 10.98, architect: 11.22, said: 11.74, move: 12.34, moveEnd: 12.82,
  they: 13.38, rolled: 13.62, turned: 14.3, eleven: 14.66, thousand: 15.3, tons: 15.78, tonsEnd: 16.42,
  with: 16.54, six: 16.74, hundred: 17.06, people: 17.46, working2: 17.94, inside: 18.34, end: 18.7,
};
