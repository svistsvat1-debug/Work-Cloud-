# Credit ledger - nuclear-warning (hard cap 1500, stop at 1450)

Flow: nuclear-warning (https://elevenlabs.io/app/flows/NYTTkmqHeINb870uK0HF)

| # | what | settings | estimate | actual | running total (estimates) |
|---|------|----------|----------|--------|---------------------------|
| 1 | voice take 1 + hero (pair sheet: mallet up / down) | eleven_v4 Mark (396 chars, 1 take) + gpt-image-2.5-sunburst 1K medium 3:2, 1 var | 476.5 | 396.0 + 80.6 = 476.6 | 476.6 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 476.6 |
| 3 | batch: scroll (close-up), run, bg MEDIUM 2:3; cat pair MEDIUM 3:2; skull, robber, nerd, barrel, tomb LOW 2:3; props LOW 3:2 | 1K, 1 var each | 604.0 | 4 x 80.6 + 5 x 47.0 = 557.1 for the 9 that finished; barrel (LOW) BLOCKED by the content filter ('may violate our Terms of Service') - counted as 47.0 to be safe, not re-run (drawn in code instead) | 1080.6 |
| 4 | 7 sound effects (knock 1 s, geiger 2 s, hiss 1.5 s, zip 1.2 s, creak 1.5 s, curse 1.5 s, meow 1 s) | eleven_text_to_sound_v2, prompt_influence 0.7, 1 gen each | 106.7 | 3.3 + 6.7 + 5.0 + 4.0 + 5.0 + 5.0 + 3.3 = 32.3 | 1187.3 (estimates); actual so far 476.6 + 557.1 + 32.3 = 1066.0 (+47.0 if the blocked barrel was billed) |

**Total actual: 1066.0 credits** (476.6 voice + hero, 0 word times, 557.1 batch pictures, 32.3 sound effects); 1113.0 if the blocked barrel generation was billed (could not be checked: the account-usage tool needs extra connector permissions). Hard cap 1500 kept; no reserve used.
