import words from '../../public/hummingbird/vo/words.json';

export const FPS = 60;
export const VO_AT = 0.1; // the voice starts 0.1 s in

type W = {w: string; start: number; end: number};
const W = words.words as W[];

/** start time (composition seconds) of the n-th occurrence (0-based) of a word, punctuation ignored */
const at = (word: string, n = 0, edge: 'start' | 'end' = 'start') => {
  const hits = W.filter((x) => x.w.toLowerCase().replace(/[^a-z']/g, '') === word);
  if (!hits[n]) throw new Error(`word not found: ${word} #${n}`);
  return hits[n][edge] + VO_AT;
};
const line = (i: number, edge: 'start' | 'end' = 'start') => words.lines[i][edge] + VO_AT;

// Every beat is a named constant, timed to the word it lands on.
export const T = {
  // L1 How does a hummingbird survive a cold night without food?
  cold1: at('cold', 0),
  night: at('night'),
  without: at('without'),
  food: at('food'),
  l1end: line(0, 'end'),
  // L2 It burns energy so fast that staying warm until morning could use up its fat.
  l2: line(1),
  burns: at('burns'),
  fast: at('fast'),
  staying: at('staying'),
  morning: at('morning'),
  use: at('use'),
  fat: at('fat'),
  l2end: line(1, 'end'),
  // L3 So it does the opposite.
  l3: line(2),
  opposite: at('opposite'),
  l3end: line(2, 'end'),
  // L4 It goes still and lets its body go cold.
  l4: line(3),
  goes: at('goes'),
  still: at('still'),
  lets: at('lets'),
  go: at('go'),
  cold2: at('cold', 1),
  l4end: line(3, 'end'),
  // L5 Its heartbeat drops from about 1,200 a minute to as low as 40.
  l5: line(4),
  heartbeat: at('heartbeat'),
  drops: at('drops'),
  twelve: at('twelve'),
  minute: at('minute'),
  to5: at('to', 0),
  forty: at('forty'),
  l5end: line(4, 'end'),
  // L6 One black metaltail cooled to 3.3 degrees Celsius.
  l6: line(5),
  cooled: at('cooled'),
  three: at('three', 0),
  three2end: at('three', 1, 'end'),
  celsius: at('celsius'),
  l6end: line(5, 'end'),
  // L7 That's fridge cold.
  l7: line(6),
  fridge: at('fridge'),
  cold3: at('cold', 2),
  l7end: line(6, 'end'),
  // L8 No bird has been measured colder.
  l8: line(7),
  bird: at('bird'),
  colder: at('colder'),
  voEnd: line(7, 'end'),
};

export const DURATION_S = T.voEnd + 1.25; // voice end + the thaw / loop-back tail
export const DURATION_FRAMES = Math.round(DURATION_S * FPS);
