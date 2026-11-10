// Every beat sits on a spoken word. Word times come from images/tiger/words.json (voice file time);
// the voice starts VO seconds into the video.
export const FPS = 60;
export const VO = 0.1;
const v = (x: number) => x + VO;

export const T = {
  bright: v(1.0), // "BRIGHT orange"
  green: v(2.26), // "green jungle"
  looks: v(3.48), // "It looks like"
  terrible: v(3.94), // "terrible camouflage"
  but: v(5.86), // "But that's only true"
  our: v(7.08), // "for OUR eyes"
  cutDeer: 8.56, // hard cut inside the pause before "Deer"
  deer: v(8.66),
  tigers: v(9.22), // "a tiger's usual prey"
  prey: v(9.94),
  two: v(10.72), // "two kinds of color sensors"
  sensors: v(11.74),
  not: v(12.4), // "not three like us"
  three: v(12.54),
  us: v(13.1),
  they: v(13.88), // "They can't tell"
  orange: v(14.5), // "orange"
  greenBall: v(15.06), // "from green"
  so: v(15.8), // "So to a deer"
  cutWide: 17.0, // hard cut inside the pause before "the tiger"
  theTiger: v(17.2),
  blends: v(17.58),
  leaves: v(18.46),
  and: v(19.52), // "And mammals"
  cant: v(19.92), // "can't make green fur"
  fur: v(20.78),
  soOrange: v(21.38), // "So orange"
  job: v(22.5), // "the same job"
  voEnd: v(23.17),
};
export const DURATION = 23.8;
export const DURATION_FRAMES = Math.round(DURATION * FPS);
