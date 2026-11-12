# Credit ledger - nuke-gas-fire (hard cap 1500, stop at 1450)

Flow: nuke-gas-fire (https://elevenlabs.io/app/flows/hkv1oIdyHhUPeYACIuS6)

| # | what | settings | estimate | actual | running total (estimates) |
|---|------|----------|----------|--------|---------------------------|
| 1 | voice take 1 + hero | eleven_v4 Mark (375 chars, 1 take) + gpt-image-2.5-sunburst 1K medium 2:3, 1 var | 455.5 | 375 + 80.6 = 455.6 | 455.6 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 455.6 |
| 3 | batch: roast, push, shock, step, sad, nuke, bg_desert, bg_under MEDIUM (2:3); rig MEDIUM (3:2); props LOW (3:2) | 1K, 1 var each | 772.2 | 9 x 80.6 + 47.0 = 772.2 | 1227.8 |
| 4 | 4 sound effects (gas_roar 3 s loop, gas_hiss 1.5 s, winch 1.5 s, flame_out 1 s) | eleven_text_to_sound_v2, prompt_influence 0.7, 1 gen each | 77.0 | 10 + 5 + 5 + 3.3 = 23.3 | 1251.1 |

Total charged: 1251.1 credits (cap 1500). No redo was needed; the reserve (~150) was not used.
