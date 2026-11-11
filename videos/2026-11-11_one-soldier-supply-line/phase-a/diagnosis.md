# A1 — Competitor Diagnosis

**Input:** TOPIC = "find an idea yourself", COMPETITOR = none → found via niche search.
**Method (free only):** `yt-dlp` search URLs filtered to "this year" (20 WWII queries, 525 unique videos) → full `-j` metadata for ~25 candidates (subscribers, dates) → `--flat-playlist` of last 30 channel uploads → median views → outlier score. Transcript = YouTube auto-captions (VTT) cleaned to text. No paid tools.
Note: YouTube's bot-check blocked some direct downloads; captions were fetched from the caption URL in the metadata, on a retry.

## Niche scan — small channels with outlier videos (last 12 months)

| Video | Channel | Subs | Views | Uploaded | Signal |
|---|---|---|---|---|---|
| What Did WW2 Soldiers Actually Do All Day? | Ink Story | 9.7K | 875K | 2026-10-26 | **×32 vs median, 90× subs** |
| How Did Hitler Fund a Huge Military When Germany Was Broke? | The Dictator Lab | 52.8K | 2.0M | 2025-11-20 | **×581 vs median** |
| Germans Captured Him — He Laughed, Then Killed 21… | Iconic History | 13.5K | 3.1M | 2026-01-05 | sensational, not our tone |
| IF WW2 WAS A DISCORD CHAT | Server History | 31.4K | 3.1M | 2026-09-19 | comedy format |
| The 6 Minutes That Cost Japan the War | SinceWWII | 859 | 1.0M | 2026-08-12 | tiny channel, huge video |
| You Wake Up in 1950. The Wrong Side Won WW2 | Previously | 239 | 198K | 2026-10-30 | "what if" works |

Pattern: **animated, everyday-life / money / "what really happened" videos** outperform. Our format (whiteboard + numbers) fits best with the first two.

---

## MAIN COMPETITOR — Ink Story, "What Did WW2 Soldiers Actually Do All Day?"
URL: https://www.youtube.com/watch?v=z4DB1tppFU8

### NUMBERS
- Views: **875,097**, likes n/a, comments 109
- Age: **16 days** (uploaded 2026-10-26), so still climbing
- Duration: 17:47
- Channel: Ink Story, **9,740 subscribers**
- Channel median (last 30 uploads): **27,500** views
- **OUTLIER SCORE = 875,097 / 27,500 ≈ 31.8×**. Views per subscriber ≈ 90×. A small channel with a huge video, so this is the strongest signal in the scan.
- Their 2nd best: "Your Life as Every Rank in the U.S. Army in WW2" (452K). Their follow-up "…All Night?" got only 51K, so a direct sequel of the same angle does NOT repeat the outlier.

### PACKAGING
- Title formula: **"What Did [group] Actually Do All Day?"**, a myth-busting question. "Actually" = "you've been lied to by movies".
- Thumbnail: cartoon GI relaxing with an M1 Garand (1), an orchard scene with background soldiers (2), black smoke (3), text "NO FIGHTING" (4). **~4 objects, which is busy.** Bright, glossy, AI-looking illustration.
- Does the thumbnail repeat the title? **No**, and that's good. The title asks a question and the thumbnail gives a surprising half-answer ("NO FIGHTING"), so two separate shocks.

### STRUCTURE
- Hook (0:00–0:35): second-person sensory POV ("You're asleep in a hole… somebody taps your boot"). Strong immersion, but the stake is vague.
- Stakes: "You could still be dead before breakfast". Open loop at 1:09: "*Everything is quiet* will be the most dangerous sentence you hear all day". It pays off at ~15:00 (night patrol).
- Quests: a literal timeline, 5:00 → 6:30 → 8:00 → 9:30 → 10:30 → … → 19:30.
- Answer reveal: **given almost at once (0:40: "it's digging, cleaning, carrying, waiting")**, then repeated as the summary at ~16:00.

### WEAK SPOTS
- **"And then… and then" structure.** The whole video is a clock schedule. Each block is a new chore, not a new question.
- **Answer too early.** The title is answered in the first minute, so the rest is illustration.
- **Dead minutes:** water (5:30) and carrying ammo (6:00–7:00) have no new stakes. The civilian woman (11:30–12:30) is charming but irrelevant.
- Only one open loop (the "quiet night") across 17 minutes.

### GAP — what the viewer wants NEXT
The video keeps hinting at a bigger machine and never shows it:
- "You can build the largest supply system on Earth and still fail to deliver hot coffee…"
- "Behind every rifleman are drivers, cooks, mechanics, quartermasters, clerks, medics…"
- "Without it, the climax lasts about 20 minutes."
- "Millions of small jobs keeping the machine alive."

→ The viewer leaves asking: **how big was that hidden machine? How many people stood behind ONE rifleman, and what did it take to get his food, bullets, fuel and mail to him?** Nobody answered that with a number. That's our video.

---

## SECONDARY COMPETITOR — The Dictator Lab, "How Did Hitler Fund a Huge Military When Germany Was Broke?"
URL: https://www.youtube.com/watch?v=Tj0iLXCU-wM
- 2,004,827 views · 52.8K subs · median 3,450 → **outlier ≈ 581×** · 20:47 · uploaded 2025-11-20
- Title formula: **"How did X do Y when Z made it impossible?"** (paradox + money).
- Thumbnail: archive photo of Hitler + tank factory. **Not usable for us** (photo, dictator face).
- Structure: strong paradox hook ("bankrupt nation → strongest army in 6 years"), but the answer is given at 1:08 (MEFO bills). Afterwards, background lists. It also has a "subscribe" ask at 2:16.
- Lesson for us: **money/logistics paradoxes pull huge numbers** even on tiny channels. Used for idea option 2.

Cleaned transcripts saved next to this file: `competitor_transcript_inkstory.txt`, `competitor_transcript_dictatorlab.txt`.
