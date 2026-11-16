# satellite-storm - ElevenLabs credit ledger (hard cap 900, never start a run that would pass 870)
Flow: https://elevenlabs.io/app/flows/udlBnYIAEN6ACcexMjc9

| # | what | settings | estimate | billed | running total |
|---|------|----------|----------|--------|---------------|
| 1 | voice take 1 | tts eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 436 chars, 1 take | 435.96 | 436 | 436 |
| 2 | word times | Scribe v1 on the voice node | 0 | 0 | 436 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 483 |
| 4 | batch: 5 pictures (chair3, ctrl3, car3 3:2; props2 3:2 magenta key; space 2:3) + 5 sfx (sneeze 1.5 s, puffup 1.5 s, button 0.8 s, streak 1.5 s, chirps 1.0 s) | pictures gpt-image-2.5-sunburst 1K LOW 1 var; sfx eleven_text_to_sound_v2, influence 0.7 | 304.06 | 235 + 21 = 256 | 739 |

Billed per item (from the run): voice 435.96; Scribe 0; hero 46.95; chair3 / ctrl3 / car3 / props2 / space 46.95 each (234.76);
sfx sneeze 5.00, puffup 5.00, button 2.67, streak 5.00, chirps 3.33 (21.00).
**TOTAL: 738.67 credits** (cap 900, run limit 870). Reserve (50) not used: 0 redos.
