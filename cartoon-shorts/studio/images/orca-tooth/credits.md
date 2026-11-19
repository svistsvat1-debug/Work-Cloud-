# orca-tooth - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/pXs8kNLaeu3y4HjxUyca (flow_id pXs8kNLaeu3y4HjxUyca)
Account counter (account_get_usage character_count) at the start: 46,442.

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 371 chars, 1 take | 370.96 | 371 | 371 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 371 |
| 3 | hero | gpt-image-2.5-sunburst 1K LOW 2:3, 1 var, magenta key | 46.95 | 47 | 418 |
| 4 | batch: guyA, orcas, bombs, props (3:2) + tooth, shore, under (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 328.67 (7 x 46.95) | 329 | 747 |
| 5 | 5 new sfx: orca_call 1.2 s, party_horn 0.8 s, shaker 1.0 s, buzzer 0.6 s, accordion 0.8 s | eleven_text_to_sound_v2, infl 0.7 | 48.4 | 14.67 (4.00 + 2.67 + 3.33 + 2.00 + 2.67) | 761.29 |

**Total charged: 761.29 credits** (flow prices: 370.96 + 0 + 46.95 + 328.67 + 14.67; cap 900, run limit 870; reserve 50 unused, 0 redos).
Account counter (account_get_usage character_count): 46,442 -> 47,204 (+762) during this run - matches the ledger (one session generating).
