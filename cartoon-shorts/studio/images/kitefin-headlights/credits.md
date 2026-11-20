# kitefin-headlights - ElevenLabs credit ledger (cap 900, run limit 870)
Flow: https://elevenlabs.io/app/flows/FDEdh8iKs1zPqHJjliH8 (flow_id FDEdh8iKs1zPqHJjliH8)
Account counter (account_get_usage character_count) at the start: 51,986; at the end 53,372 - the difference includes a
PARALLEL session on the same account (#46 mars-rotor-mach), so the per-run charges below are the ledger.

| # | what | settings | estimate | charged | running total |
|---|------|----------|----------|---------|---------------|
| 1 | voice take 1 | eleven_v4, Liam VCgLBmBjldJmfphyB8sZ, 370 chars, 1 take | 369.96 | 369.96 | 369.96 |
| 2 | word times | eleven_scribe_v1 on the voice node | 0 | 0 | 369.96 |
| 3 | batch: hero (2:3), guyA (3:2), guyB (3:2), sharkA (2:3), squid (3:2), plate (2:3) | gpt-image-2.5-sunburst 1K LOW, 1 var each | 281.72 (6 x 46.95) | 281.72 | 651.68 |
| 4 | 2 new sfx: car_horn 0.8 s, glow_on 1.5 s | eleven_text_to_sound_v2, infl 0.7, 1 gen each | 25.3 | 7.67 (2.67 + 5.00) | 659.35 |

Reused from sfx-library (0 credits): deep_bed, pop, twinkle, whoosh, magic, scratch, dart, crickets, winch, ping, button,
whistle, lamp_on, gulp, tiptoe (copied but unused: sonar, water_rush, jaw_snap). Music: local code (scripts/music.py), 0.

**Total charged: 659.35 credits** (369.96 voice + 0 word times + 281.72 pictures (6 x 46.95) + 7.67 sfx); cap 900,
run limit 870; reserve 50 unused, 0 redos. The locked look in memory/STYLE.md was used, so the hero ran in the same batch.
