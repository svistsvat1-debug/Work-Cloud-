# coral-castle - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/Fmkkn0JFYh4kLQEXXYnj (flow_id Fmkkn0JFYh4kLQEXXYnj)

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 337 chars, 1 take | 336.97 | 337 | 337 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 337 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 384 |
| 4 | batch: ed3, crew3, stones, wall, crane (3:2) + yard (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 6 x 46.95 | 282 | 666 |
| 5 | 6 new sfx: flashbulb 1.0 s, chain 1.5 s, magic 1.0 s, gate-turn 1.5 s, rust-jam 1.2 s, crane 1.5 s | eleven_text_to_sound_v2, infl 0.7 | ~84 (batch est. 366.4 total) | 25 | 691 |

**Total charged: 691 credits** (cap 900, run limit 870; reserve 50 unused, 0 redos). Sound Effects v2 again billed ~3.3 credits/s (estimate ~11/s); Scribe charged 0.
