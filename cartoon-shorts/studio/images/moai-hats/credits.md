# moai-hats - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/MUI3o6xMKDiJWFOzd0qR (flow_id MUI3o6xMKDiJWFOzd0qR)

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 326 chars, 1 take | 325.97 | 326 | 326 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 326 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 373 |
| 4 | batch: sheetA, sheetB, hats, bg (3:2) + moai (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 234.76 (5 x 46.95) | 235 | 608 |
| 5 | 4 new sfx: buzzer 0.6 s, stone_roll 2.0 s, dirt_dump 1.0 s, hat_clonk 1.0 s | eleven_text_to_sound_v2, infl 0.7 | 50.6 | 15.33 (2.0 + 6.67 + 3.33 + 3.33) | 623.33 |

**Total charged: 623.33 credits** (cap 900, run limit 870; reserve 50 unused, 0 redos). 6 pictures, all gpt-image-2.5-sunburst 1K LOW, 1 variation, text-only prompts. Scribe charged 0. Sound Effects v2 billed 3.33 credits/s again (estimate ~11/s).
