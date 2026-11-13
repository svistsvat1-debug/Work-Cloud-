# Budget - eagle-zap (hard cap 900 ElevenLabs credits, never start a run past 870)

| item | settings | planned credits |
|------|----------|-----------------|
| voice, 1 take, 245 characters | eleven_v4, Mark - Natural Conversations (UgBBYS2sOqTuMpoF3BR0) | ~245 |
| word times | Scribe v1 on the take | ~10 |
| 7 pictures | gpt-image-2.5-sunburst, 1K, quality low, 1 generation each: hero 2:3, guy pair 3:2, eagle pair 3:2, sparrows 3:2, pole 2:3, bg 2:3, guy close-up 2:3 | ~329 |
| sound effects | Sound Effects v2: zap 1.5 s, power-line hum 2 s, wing flaps 1 s; reused from sfx-library: peep, whoosh, sizzle, pop | ~50 |
| reserve | one LOW redo | ~50 |
| **total** | | **~684** |

Note: the ElevenLabs MCP tools (creative_*) did not load in this session, although the connector is connected.
Fallback used: the same ElevenLabs services through their REST API (api.elevenlabs.io, authenticated by the
session proxy): /v1/text-to-speech, /v1/speech-to-text, /v1/sound-generation, /v1/flows/image. The REST image API has
no estimate_only and no flow canvas, so every cost is measured as the change of the account's credit counter
(/v1/user/subscription character_count) right after each run, and planned from the price table before it.
