# messina-saints - production report (2026-11-16)

- Final: 23.0 s, 1080x1920, 24 fps, H.264 crf 18 + AAC 192k; voice 22.16 s (speech to 21.68 s). Owner limit 25 s.
- Source: Top 5 Unknowns https://youtu.be/c1fsjjF3hro story #5 (15:45-18:45); stories left in that video: Mexico City sinking (21:49-25:20), tanker off Oman (3:15-6:45, weak).
- Structure model: https://www.youtube.com/shorts/64EnPwiKzvA
- Voice: Google AI Studio, name [MISSING]; 2.30 w/s; transcript matches the approved text (whisper heard "Antonio Damacena's" for "Antonello da Messina's" - ASR on the name). No fitting needed.

## Beat table
| time | words | picture | motion / light | sound | music |
|---|---|---|---|---|---|
| 0.00-4.95 | Two painted saints ... alone at night | 01 wall + 11 saints (= cover) | slow push-in 1.0->1.10, lamp flicker on twos, moon glow, dust; strip "MESSINA, SICILY" 1.3-4.7 | sea bed | drone + music box |
| 4.95-8.65 | Minutes earlier, masked thieves break into the city museum | 02 museum + 05 thief x2 + 12 railing fg | strip "MINUTES EARLIER"; thieves sneak in on twos; door gap opens + glow on "break" (7.05); push-in to the door | festival murmur, far bell, tiptoe, lever, creak | pulse starts |
| 8.65-11.60 | They take Antonello da Messina's paintings | 03 gallery + 09 altarpiece + 05 -> 06 | strip "ANTONELLO DA MESSINA, 1473"; flashlight pool; on "paintings" (10.72) flash + swap to 10 empty + squash, thief runs off | room tone, tiptoe, whoosh, panel_lift, run_steps | pulse + drone, heartbeat 11.34/11.60 |
| 11.60-16.10 | But outside, they drop two panels... and vanish | 01 wall (darker) + 06 + 11 | thief runs in; saints fall onto the wall on "drop" (13.14) with squash + shake; paper-flip vanish on "vanish" (15.04) | run_steps, panel_drop, curse, flame_out | drone back |
| 16.10-18.40 | Experts say the rest can't be sold | 03 + 10 empty | slow push-in, dim beam, dust | room tone | music box |
| 18.40-23.00 | So why steal them... and leave two saints behind? | 01 + 11 | push-in to 1.34 on the saints, light dips, hit + shake at 21.72, ease back to frame 0 (loop) | boom_low 21.72, far bell 22.3 | tension cluster -> deep hit -> soft bell |

## Pictures
Used 8 of 12: 01, 02, 03, 05, 06, 09, 10, 11 + 12 railing (foreground). Not used: 04 guard room, 07 guard, 08 passer-by (cut with the 25 s script). All 768x1376 (shown at 1.41x). Keys clean (QA on magenta/blue). Altarpiece 09/10 differ in shape: swap hidden in a flash.

## Sound
Reused (cartoon-shorts library): bell, tiptoe, lever, creak, whoosh, curse, flame_out, boom_low. New: panel_lift, run_steps, panel_drop (~12 credits est., ledger in credits.md). Music in code: D minor drone, music box with C#, pulse, heartbeat, tension cluster, deep hit, loop bell; bed -15 dB under voice RMS, ducked -5 dB under words, reverb 18 %, 0.4 s fade. Peak -4.0 dBFS.

## Improvement pass
1. Foreground railing was 1.65x and covered half the museum frame -> 1.05x in the bottom strip.
2. Gallery showed the torn paper border of the background -> zoom starts at 1.10 / 1.12.
3. Checked the loop: last frame = frame 0 composition (camera back to 1.0, light back to 1.0).
