# pigeon-landing - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/bkvNY0rYqB6VL4pZ43p9 (flow_id bkvNY0rYqB6VL4pZ43p9)
Account counter (account_get_usage character_count) at the start: 47,204.

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 350 chars, 1 take | 349.97 | 349.97 | 349.97 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 349.97 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 46.95 | 396.92 |
| 4 | batch: guyA, engineer, pigeonA, pigeonB, pigeonC (3:2) + plate (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 281.72 (6 x 46.95) | 281.72 | 678.64 |
| 5 | 6 new sfx: smack 0.7 s, coo 1.0 s, dive_swoop 1.4 s, unroll 0.8 s, flap_frantic 1.2 s, rewind 0.7 s | eleven_text_to_sound_v2, infl 0.7, 1 gen each | 63.8 | 19.33 (2.33 + 3.33 + 4.67 + 2.67 + 4.00 + 2.33) | 697.97 |

Reused from sfx-library (0 credits, all ElevenLabs sounds from earlier videos): scratch, dizzy, sun_poof, needle, scribble, pop, twinkle, munch, whoosh, flutter, chalk, glide, crickets.
Music: local code (scripts/music.py), 0 credits.

**Total charged: 697.97 credits** (349.97 voice + 0 word times + 328.67 pictures (7 x 46.95) + 19.33 sfx; cap 900, run limit 870; reserve 50 unused, 0 redos).
