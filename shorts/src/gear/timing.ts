// Beat times in seconds on the composition timeline (voice placed at VO_AT).
// Word times come from public/gear/vo/words.json (Kokoro take, pauses measured by loudness).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 27.0;

export const T = {
  // 1. A motor is spinning, but the last gear it drives is stuck in solid concrete.
  motor: 0.32,
  spinning: 0.82,
  but: 1.7,
  last: 2.05,
  gear: 2.41,
  drives: 2.82,
  stuck: 3.53,
  solid: 4.02,
  concrete: 4.45,
  l1end: 4.94,
  // 2. So why doesn't anything break?
  so: 5.5,
  why: 5.78,
  anything: 6.4,
  brk: 6.85,
  l2end: 7.12,
  // 3. Between them are twelve pairs of gears, and each pair slows the spin fifty times.
  between: 8.0,
  twelve: 8.85,
  pairs: 9.18,
  gears: 9.62,
  and: 10.44,
  slows: 11.2,
  fifty: 12.1,
  times: 12.44,
  l3end: 12.92,
  // 4. Those slowdowns multiply.
  those: 13.4,
  slowdowns: 13.78,
  multiply: 14.37,
  l4end: 15.04,
  // 5. The last gear would need over two trillion years to turn once.
  the5: 15.66,
  gear5: 16.15,
  over: 16.9,
  two: 17.2,
  trillion: 17.47,
  years: 17.91,
  turn: 18.41,
  once: 18.71,
  l5end: 19.06,
  // 6. That's more than a hundred times the age of the universe.
  thats: 19.58,
  hundred: 20.55,
  age: 21.61,
  universe: 22.23,
  l6end: 22.78,
  // 7. To the concrete, it's basically standing still.
  to: 23.3,
  concrete7: 23.58,
  its: 24.3,
  basically: 24.52,
  standing: 25.06,
  still: 25.56,
  end: 26.04,
};

// 12 "÷50" tags: one per gear pair, popping as the camera glides down the chain.
export const TAG_T = Array.from({length: 12}, (_, i) => 8.55 + i * 0.36);
// ...then flying into one number on "multiply".
export const TAG_FLY_T = Array.from({length: 12}, (_, i) => 13.5 + i * 0.105);
export const TAG_FLY_DUR = 0.36;
