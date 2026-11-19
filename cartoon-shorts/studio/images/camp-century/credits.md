# camp-century - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/cFZOgOoYMYZNqcF8vgmB (flow_id cFZOgOoYMYZNqcF8vgmB)

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 368 chars, 1 take | 367.96 | 368 | 368 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 368 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var | 46.95 | 47 | 415 |
| 4 | batch: soldierA, soldierB, soldierC, objects, plane (3:2) + plate (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 281.72 (6 x 46.95) | 282 | 697 |
| 5 | 4 new sfx: snow_shovel 0.8 s, scrape 1.4 s, snow_steps 1.4 s, radar 1.2 s | eleven_text_to_sound_v2, infl 0.7 | 52.8 | 16.00 (2.67 + 4.67 + 4.67 + 4.00) | 712.63 |

**Total charged: 712.63 credits** (flow prices: 367.96 + 0 + 46.95 + 281.72 + 16.00; cap 900, run limit 870; reserve 50 unused, 0 redos).
Note: the account counter (account_get_usage character_count) went 42,861 -> 45,003 (+2,142) during this run because two
parallel sessions (flows 'not-a-bomb (WhyZap #39)' and 'sunken-lunch') were generating at the same time; this flow's own
charges are the numbers above.
