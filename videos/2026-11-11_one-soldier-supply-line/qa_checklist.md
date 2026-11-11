# QA — video #1 "How Many Men Did It Take to Keep ONE Soldier Fighting?"

Automatic report: `work/qa_report.json` (+ `work/audio_report.json`). Spot-check frames: `work/spotcheck/` (not committed).

- [x] Length 8:00–15:00 — 9:49 (589.0 s). Target 10–12 not reached: the voice track itself is 9:45.
- [x] No burned-in subtitles (no subtitle stream, captions only in captions.srt), no watermark
- [x] No swastikas / Nazi symbols (Germany = Balkenkreuz + "GERMANY" label only, scene 58), no gore (casualties = empty helmets, crosses, numbers) — video and thumbnail
- [x] Hook ≤ 20 s (0:00–0:18), no greetings
- [x] Title answer only in the final block (1:7 / 1:18 first appear at 8:16 / 8:49)
- [x] No "and then" lists (script checker: 0 hits)
- [x] Thumbnail ≠ title, 3 objects (soldier in foxhole, convoy, text), 4 words, 1280×720 PNG 0.86 MB
- [x] No static frame > 6 s — freezedetect on blurred downscale: 0 (two 6.1–6.2 s stretches in scenes 16 and 42 were fixed by adding animation and re-splicing)
- [x] Visuals hit VO keywords — 5 random scenes checked (29 "printed", 36 "group", 50 "five", 55 "system", 56 "four"): all show the matching visual
- [x] New SFX ≤ 5 — exactly 5 (shipyard_rivet, ship_horn, truck_convoy, tank_sputter_stall, camera_shutter)
- [x] Music barely audible — 26.9 dB under voice while speaking, 24.7 dB in pauses; both versions delivered + music.wav
- [x] Loudness: −13.9 LUFS integrated, true peak −1.6 dBTP (both versions); H.264 yuv420p CRF 18, 1920×1080, 30 fps, AAC 48 kHz
- [x] Captions: 196 cues, ≤ 2 lines, ≤ 42 chars/line, 1–6 s, 0 violations
- [x] [VERIFY] items: all resolved in phase-a/verify.md (no open items)
