# sunken-lunch - ElevenLabs credit ledger (cap 900, run limit 870)
No flow: the ElevenLabs connector (creative_* tools) failed to connect in this session (HTTP 400, CLIENT_HTTP_NOT_IMPLEMENTED),
so every call went to the ElevenLabs REST API through the session proxy (key injected by the proxy, never stored here).
The REST API has no estimate_only: estimates below are from the price table / earlier REST runs; "charged" is read from the
response header Character-Cost (voice also checked in /v1/history: 42632 -> 42786 = 154).

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | hero picture (attempt) | POST /v1/flows/image, gpt-image-2.5-sunburst, 1K, LOW, 2:3, no reference | ~47 | 0 (refused: HTTP 402 "requires a Pro plan or above", nothing started) | 0 |
| 2 | voice take 1 | /v1/text-to-speech/VCgLBmBjldJmfphyB8sZ/with-timestamps, eleven_v4, Liam, 350 chars, 1 take | ~350 (flows price) | 154 | 154 |
| 3 | word times | /v1/speech-to-text, scribe_v1, word timestamps | ~10 | 7 | 161 |
| 4 | 5 new sfx: cable_snap 1.2 s, sub_splash 1.6 s, fridge_open 1.0 s, germ_feast 1.6 s, fish_flop 0.7 s | /v1/sound-generation, eleven_text_to_sound_v2, prompt_influence 0.7 | ~67 (11/s) | 68 (13 + 18 + 11 + 18 + 8) | 229 |

**Total charged: 229 credits** (cap 900, run limit 870). 0 pictures generated: all pictures are finished ElevenLabs cut-outs
from earlier videos (reused, never fed into a generation); the sub, sandwich, germs, fish, thermometer, crane, lunchbox and
the ship's stern are drawn in code. Music: local code (0).
