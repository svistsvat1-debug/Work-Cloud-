# Credit ledger - eagle-zap (hard cap 900, stop at 870)

Counter = /v1/user/subscription character_count (credits used this billing period). Start: 22394.

| # | what | settings | planned | actual (counter delta) | running total |
|---|------|----------|---------|------------------------|---------------|
| 1 | voice, 1 take (245 chars) | eleven_v4, Mark - Natural Conversations, REST /v1/text-to-speech/with-timestamps | ~245 | 108 (22394 -> 22502) | 108 |
| 2 | word times | Scribe v1, REST /v1/speech-to-text | ~10 | 5 (22502 -> 22507) | 113 |
| 3 | hero picture (attempt) | gpt-image-2.5-sunburst, 1K, low, REST /v1/flows/image | ~47 | 0 - refused: "This endpoint requires a Pro plan or above" (account is Creator); the MCP creative_* tools never loaded | 113 |
| 4 | 3 sound effects: zap 1.5 s, power-line hum 2 s (loop), wing flaps 1 s | Sound Effects v2 (eleven_text_to_sound_v2), prompt_influence 0.7, REST /v1/sound-generation | ~50 | 50 (22507 -> 22557) | 163 |

Pictures: none generated (see above). Fallback chosen unattended after the owner said "Роби": reuse earlier ElevenLabs
cut-outs of the channel character + the turkey-eggs farm plate (used as finished sprites, never fed into a generation),
and draw the eagle, the sparrows, the poles and the wires in code. Reused library sounds: peep, whoosh, sizzle, pop,
boing, zip, crack (0 credits).

**Total: 163 credits** (cap 900).
