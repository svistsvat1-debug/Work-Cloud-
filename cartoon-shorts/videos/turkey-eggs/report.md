# Report - turkey-eggs (2026-11-13)

Final file: turkey-eggs.mp4 - 1080x1920, 60 fps, 17.7 s (1062 frames), audio 17.7 s, peak -3.8 dBFS, no frozen frames.
ElevenLabs flow: https://elevenlabs.io/app/flows/HVPKwzpbu8vBzupt3NsJ
Remotion: `cd cartoon-shorts/studio && npx remotion studio` (compositions TurkeyEggs, TurkeyEggsCover).

## Script (approved, unchanged)
Turkeys lay eggs, so why don't we eat them? They're safe and taste like chicken eggs. But a chicken lays almost an egg a
day. A turkey lays about a third as many and eats way more, so each egg costs more. That's why farms hatch them instead,
into future Thanksgiving dinners.

Voice: Mark - Natural Conversations (UgBBYS2sOqTuMpoF3BR0), eleven_v4, 1 take, 16.96 s; Scribe transcript matched word for word.

## Beat sheet
See studio/images/turkey-eggs/budget.md (time / words / picture / gag / sound).

## Pictures (gpt-image-2.5-sunburst, 1K, 1 variation, text only, 0 redos)
MEDIUM: hero (2:3), yum (2:3), shrug (2:3, generated but not used in the cut), shock close-up (2:3), turkey (2:3), turkey
pair strain / peck (3:2), poult pair happy / scared (3:2), farmyard background (2:3).
LOW: hen pair proud / laying (3:2, blue key), roast platter (3:2, magenta key), nest + grain heap (3:2, magenta key).
Code-drawn: eggs with faces, crack + flying shell cap, price tag, day card, thought bubble, check mark, labels, feather.

## Sound
New (ElevenLabs Sound Effects v2): gobble, munch, cluck, peck, crack, peep, gulp (all added to sfx-library).
Reused from sfx-library: pop, boing, whoosh, flip, squeeze, kaching, clink, catch.

## Credits
355.6 (voice 275.0 + hero 80.6) + 0 (word times) + 704.9 (10 pictures) + 23.7 (7 sound effects) = **1084.2 / 1500**.

## Improvement pass
1. Frame 0 too wide -> pushed in (k 1.1), guy + turkey moved closer, egg made bigger.
2. Hen shot cluttered by half a turkey -> tighter framing; the hen's egg pile moved out from behind the nest.
3. The turkey's strain had no payoff -> a single feather drifts into the nest instead of an egg; "6" vs red "2" labels
   enlarged; payoff push-in on the chick + thought bubble; fork clink on "dinners".

## Fallbacks / notes
- The ElevenLabs connector was down (503 / timeouts) for ~35 min after the hero; production paused at the owner's
  "Стоп" and resumed on "Продовжуй". No generation was run twice (the flow was read back before running).
- The 'shrug' picture was not used (the cut came out tighter than planned).
