# Credit ledger - turkey-eggs (hard cap 1500, stop at 1450)

Flow: turkey-eggs (https://elevenlabs.io/app/flows/HVPKwzpbu8vBzupt3NsJ)

| # | what | settings | estimate | actual | running total (estimates) |
|---|------|----------|----------|--------|---------------------------|
| 1 | voice take 1 + hero | eleven_v4 Mark (275 chars, 1 take) + gpt-image-2.5-sunburst 1K medium 2:3, 1 var | 355.6 | 275.0 + 80.6 = 355.6 | 355.6 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 355.6 |
| 3 | batch: yum, shrug, shock (close-up), turkey, bg MEDIUM 2:3; turkey pair, chick pair MEDIUM 3:2; chicken pair, roast, props LOW 3:2 | 1K, 1 var each (run after a ~35 min ElevenLabs connector outage) | 704.9 | 6 x 80.6 + 3 x 47.0 + 80.6 = 704.9 | 1060.5 |
| 4 | 7 sound effects (gobble 1.2 s, munch 0.8 s, cluck 1.2 s, peck 1.5 s, crack 1 s, peep 0.8 s, gulp 0.6 s) | eleven_text_to_sound_v2, prompt_influence 0.7, 1 gen each | 78.1 | 4.0 + 2.7 + 4.0 + 5.0 + 3.3 + 2.7 + 2.0 = 23.7 | 1138.6 (estimates) |

**Total actual: 1084.2 credits** (355.6 voice + hero, 0 word times, 704.9 batch pictures, 23.7 sound effects). Hard cap 1500
kept; reserve not used (0 redos). Note: the ElevenLabs connector was down (503 / timeouts) for ~35 min between the hero
and the batch; no run was started twice (the flow was read back before running, every node existed once).
