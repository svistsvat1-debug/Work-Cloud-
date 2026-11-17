# buried-nuke - production report (video #34, 2026-11-17)

- Final: videos/buried-nuke/buried-nuke.mp4 (not in git, sent to the owner) - 1080x1920, 60 fps, 22.4 s (1344 frames), H.264 crf 18 + AAC; audio as long as the picture; mix peak -3.7 dBFS; the picture still moves on the last frame.
- Idea: the owner's request "the topic that took off for me + similar competitor topics" -> the nuclear cluster (#5 nuke-gas-fire 25K, #7 nuclear-warning 5.4K) + Zack D. Films 'The Bomb That Almost Nuked North Carolina' 12.2M. Not from the source channel.
- Structure model: STRUCTURES #4 (own winner nuke-gas-fire).
- Voice: Liam - Viral Short-Form Storyteller (VCgLBmBjldJmfphyB8sZ), eleven_v4, 1 take, 65 words / 334 chars = 21.28 s of speech (3.05 words/s), no fitting.
- Script: A bomber breaks apart over a North Carolina farm, and a hydrogen bomb buries itself in the mud at seven hundred miles an hour. Why not just dig it up? They try. But the hole keeps flooding, like digging at the beach, and the uranium part is even deeper. So they pay the farm's owners to sign one rule: never dig deeper than five feet.
- Pictures (all gpt-image-2.5-sunburst, 1K, LOW, 1 variation, text only, 0 redos): hero 2:3 (farm owner, straw hat), farm3 3:2 (shock / signing / planting), dig3 3:2 (hard hat: shrug / dig / swim ring), plane 3:2 (window strip painted over in prep), objs 3:2 (bomb / shovel / signpost), farm cutaway plate 2:3.
- Sound: new ElevenLabs sfx plane_break, bomb_fall, scribble (added to sfx-library); reused from sfx-library: jet, crickets, whoosh, pop, flap, mud_whoomp, dig, bubbles, pour, drip, snore, cash, kaching, stone_step, sprout.
- Music: scripts/music.py, G major, 116 BPM, theme / uh-oh / build / final, stops on the impact and on "But", ping on "feet", 15 dB under the voice (images/buried-nuke/music.md).
- Beat sheet: images/buried-nuke/beats.md. Credit ledger: images/buried-nuke/credits.md - total 630.68 credits (cap 900).
- Improvement pass: frame 0 pushed in + plane nearer the centre; broken halves slowed (dead hold 2-3 s); '!' at the break; $1,000 bill off the farmer's face; NC card moved off the frame edge; beach bubble off the worker's head; sky extended above / beside the plate.
- Pop scan: every flag is an intended swap, cut (7.72 day, 15.98 surface), the impact shake (4.35) or a pop-in.
- ElevenLabs flow: https://elevenlabs.io/app/flows/PXYWOZIpvx5KjjUlB48L
- Open in Remotion Studio: cd cartoon-shorts/studio && npx remotion studio (composition BuriedNuke, still BuriedNukeCover)
