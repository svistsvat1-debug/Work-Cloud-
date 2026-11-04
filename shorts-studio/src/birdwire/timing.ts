import meta from './words.json';

type Word = {w: string; line: number; start: number; end: number};
const words = meta.words as Word[];

/** start time of the n-th occurrence (0-based) of a word */
const at = (w: string, n = 0) => {
  const hits = words.filter((x) => x.w.toLowerCase() === w.toLowerCase());
  if (!hits[n]) throw new Error(`word not found: ${w} #${n}`);
  return hits[n].start;
};
const lineEnd = (li: number) => Math.max(...words.filter((x) => x.line === li).map((x) => x.end));

export const DURATION = meta.duration;

/** every beat, in seconds, read from the voice-over word times */
export const T = {
  bird: at('bird'),
  power: at('power'),
  zapped: at('zapped'),
  l1end: lineEnd(0),
  its: at("it's"),
  not: at('not'),
  special: at('special'),
  feet: at('feet', 0),
  l2end: lineEnd(1),
  current: at('current'),
  goes: at('goes'),
  touch: at('touch'),
  two: at('two'),
  spots: at('spots'),
  different: at('different'),
  voltages: at('voltages'),
  l3end: lineEnd(2),
  both: at('both'),
  feet2: at('feet', 1),
  wire: at('wire', 0),
  same: at('same'),
  so: at('so', 1),
  nothing: at('nothing'),
  really: at('really'),
  flows: at('flows'),
  l4end: lineEnd(3),
  but: at('but'),
  wing: at('wing'),
  touches: at('touches'),
  another: at('another'),
  wire2: at('wire', 1),
  or: at('or'),
  pole: at('pole'),
  circuit: at('circuit'),
  closes: at('closes'),
  l5end: lineEnd(4),
  thats: at("that's"),
  big: at('big'),
  eagles: at('eagles'),
  way: at('way'),
  more: at('more'),
  danger: at('danger'),
  l6end: lineEnd(5),
};

// derived action times
export const A = {
  zipPass: T.zapped, // spark passes under the bird's feet
  bootsOn: T.l1end + 0.12,
  bootsOff: T.not + 0.05,
  footUp: T.special - 0.05,
  eagleIn: T.l4end + 0.02,
  eagleLand: T.but + 0.08,
  wingStart: T.touches,
  wingNear: T.wire2 + 0.05,
  touch: T.closes,
  zipDive: T.closes + 0.32,
  zap: T.l5end + 0.02,
  zapEnd: T.l5end + 0.68,
  poof: T.l5end + 0.62,
  cough: T.eagles + 0.02,
  takeoff: T.way,
  loopBack: T.l6end + 0.02,
};
