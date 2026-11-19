# roswell-balloon - ElevenLabs credit ledger (hard cap 900, never start a run past 870)
flow: https://elevenlabs.io/app/flows/XaG6yQsDZc2v3BYHIrfS

| # | what | settings | estimate | charged / note | running total |
|---|------|----------|----------|----------------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 373 chars, generations_count 1 | 372.96 | | 372.96 |
| 2 | Scribe v1 word times | eleven_scribe_v1 on the voice node | 0 | 0 | 372.96 |
| 3 | hero | gpt-image-2.5-sunburst, 1K, LOW, 2:3, 1 variation | 46.95 | 47 (credit_costs) | 419.91 |
| 4 | batch: rancher3, officer3, fan3, objects (3:2), ranch, base, sky (2:3) | gpt-image-2.5-sunburst, 1K, LOW, 1 variation each | 328.67 | 7 x 47 (credit_costs) | 748.58 |
| 5 | 5 new sound effects (foil 1.0 s, megaphone 0.8 s, pin 0.68 s, balloons 1.48 s, listen 1.48 s) | eleven_text_to_sound_v2, prompt_influence 0.7, 1 generation each | 60.5 | 18.33 (3.333 / 2.666 / 2.333 / 5.0 / 5.0 = 3.33 per s) | 766.91 |

**Total charged: 766.91 credits** (voice 372.96 + Scribe 0 + 8 LOW 1K pictures 375.62 + 5 sound effects 18.33). Cap 900, margin rule 870: never exceeded.
No redo, the reserve (~50) was not used. Music: local code (0). Reused: 20 library sounds + 1 reporter cut-out from not-a-bomb (0).
