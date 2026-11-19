# not-a-bomb - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/Coxfpgl55zSnbEEiILuK (flow_id Coxfpgl55zSnbEEiILuK)

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 333 chars, 1 take (23.28 s file, 23.12 s speech) | 332.97 | 333 | 333 |
| 2 | word times | eleven_scribe_v1 on the voice node (66/66 words match the script) | 0 | 0 | 333 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 380 |
| 4 | batch: officer3, fisher3, press3, objects (3:2) + sea, deep, deck (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 328.67 (7 x 46.95) | 329 | 709 |
| 5 | 5 new sfx: chute_flutter 1.5 s, press_frenzy 1.5 s, boot_squelch 1.0 s, lamp_on 0.8 s, water_rush 1.5 s | eleven_text_to_sound_v2, infl 0.7, no loop | 69.3 | 21.0 (5.00 + 5.00 + 3.33 + 2.67 + 5.00) | 730.0 |

**Total charged: 730.0 credits** (cap 900, run limit 870; reserve 50 unused, 0 picture redos). 8 pictures, all gpt-image-2.5-sunburst 1K LOW, 1 variation each.
Sound Effects v2 billed 3.33 credits/s (estimate 11/s); Scribe charged 0; music made locally (0).
