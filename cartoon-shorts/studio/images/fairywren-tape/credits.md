# fairywren-tape - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/ATZKmeYCfaSSbDOWAhfs (flow_id ATZKmeYCfaSSbDOWAhfs)

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 325 chars, 1 take | 324.97 | 325 | 325 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 325 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 372 |
| 4 | batch: guyA, guyB, maleFly, maleSheet, female (3:2) + plate (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 281.72 (6 x 46.95) | 282 | 654 |
| 5 | 6 new sfx: net_catch 0.8 s, scratch 0.6 s, tape_crinkle 0.8 s, tape_tie 1.0 s, wren_trill 1.2 s, flutter 0.8 s | eleven_text_to_sound_v2, infl 0.7 | 57.2 | 17.33 (2.67 + 2.00 + 2.67 + 3.33 + 4.00 + 2.67) | 670.97 |

**Total charged: 670.97 credits** (flow prices: 324.97 + 0 + 46.95 + 281.72 + 17.33; cap 900, run limit 870; reserve 50 unused, 0 redos).
Account counter (account_get_usage character_count): 45,770 -> 46,442 (+672) during this run - matches the ledger (one session generating).
