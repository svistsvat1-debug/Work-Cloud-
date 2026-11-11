# Credit ledger - lava-fire-hose (hard cap 1500, stop at 1450)

Flow: lava-fire-hose (https://elevenlabs.io/app/flows/5MwE0YCxpJyROJ8XvQk6)

| # | what | settings | estimate | actual | running total |
|---|------|----------|----------|--------|---------------|
| 1 | voice take 1 + hero_aim | eleven_v4 Mark (371 chars, 1 take) + gpt-image-2.5-sunburst 1K medium 2:3, 1 var | 451.5 | 371 + 81 = 452 | 452 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 452 |
| 3 | batch: worried_aim, deadpan_nozzle, shock_cu, cheer, yawn, proud, bg_field, bg_harbor (2:3), ship (3:2) MEDIUM; house (2:3), boats (3:2) LOW | 1K, 1 var each | 819.1 | 9 x 81 + 2 x 47 = 823 | 1275 |
| 4 | 8 sound effects (hose_spray 2 s, sizzle 2 s, lava_glop 2 s, sputter 1 s, cannon 2 s, wave_crash 2 s, rock_crack 1 s, horn 1.5 s) | eleven_text_to_sound_v2, prompt_influence 0.7, 1 gen each | 148.5 | 46 (7+7+7+3+7+7+3+5) | 1321 |
