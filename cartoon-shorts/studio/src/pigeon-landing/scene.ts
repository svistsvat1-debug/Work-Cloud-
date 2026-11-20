// pigeon-landing: timing (video time = Scribe word start + 0.1 s, see images/pigeon-landing/words.json).
// Voice: Liam, 65 words / 350 chars, speech 0.02-23.44 s in the take (RMS) = ~2.77 words/s. No fitting needed:
// voice end 23.54 s + 0.56 s tail -> video 24.1 s (1446 frames).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.1;
export const T = {
  a: 0.1, lazy: 0.26, pigeon: 0.66, wants: 1.14, land: 1.54, hand: 2.1, without: 2.5, flapping: 2.74,
  just: 3.62, glide: 4.02, in: 4.34, right: 4.58,
  but: 5.3, gliding: 5.46, needs: 6.06, speed: 6.26, so: 6.98, would: 7.46, smack: 7.62, into: 7.94, you: 8.26,
  unless: 8.98, swoops: 9.54, up: 9.86, from: 10.02, below: 10.18, so2: 10.9, climb: 11.22, eats: 11.7, speed2: 12.1,
  engineers: 13.06, did: 13.54, math: 13.78,
  it: 14.46, needs2: 14.58, over: 14.98, twice: 15.22, normal: 15.86, speed3: 16.18, sixty: 17.06, swoop: 17.7, and: 18.14,
  twenty: 18.42, climb2: 18.98,
  for: 19.9, one: 20.1, crumb: 20.5,
  so3: 21.46, flaps: 21.74,
  right2: 22.58, your: 22.98, face: 23.14, end: 23.78,
};
