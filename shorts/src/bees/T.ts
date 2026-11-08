// Beat times in COMPOSITION seconds (the voice is placed at 0.1 s).
// Source: images/bees/words.json (faster-whisper word times, phrase onsets corrected by loudness).
export const FPS = 60;
export const VO_AT = 0.1;
export const T = {
  buzz: 0.4, // ElevenLabs [bee buzzing] tag inside the voice (0.40-1.08)
  line1: 1.42, // "A honey bee..."
  sting1: 2.1, // "sting"
  bug: 2.5,
  survive: 3.4,
  stingYou: 4.64, // "Sting"
  you: 4.92,
  dies: 5.96,
  diesEnd: 6.52,
  cutB: 6.92, // "Your skin..."
  skin: 7.04,
  barbed: 8.1,
  pulling: 9.16,
  rips: 9.72,
  stinger: 10.56,
  venomSac: 11.22,
  belly: 12.58,
  thatStinger: 13.42,
  pumping: 14.18,
  minute: 15.46,
  fast: 16.68,
  cutC: 17.7, // "It also releases..."
  banana: 18.66,
  alarm: 19.4,
  calls: 20.24,
  bees: 20.9,
  you2: 21.14,
  swarm: 21.9, // [angry bees swarming] inside the voice (21.90-22.90)
  cutD: 23.18, // "Bee or wasp?"
  wasp: 23.74,
  whichIsWorse: 24.52,
  worse: 24.8,
  subscribe: 25.64,
  voiceEnd: 26.6,
  end: 27.1,
} as const;
export const DURATION_FRAMES = Math.round(T.end * FPS);
