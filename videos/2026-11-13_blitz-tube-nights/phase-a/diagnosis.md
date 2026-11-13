# A1. Competitor diagnosis — 2026-11-13

Input: TOPIC = not given (template placeholders) → treated as **"find an idea yourself"**; COMPETITOR = none → found by search.
Our channel: **WARBOARD** — https://www.youtube.com/@warboard111 (ID `UCsFHLYIlQO9I9lcf41HUVXA`), 3 long videos, 9–17 views each (no outperformer yet).

## Research method and limits
- Free only: `yt-dlp --flat-playlist` (YouTube search with filter "upload date: this year" + channel `/videos` tabs, latest 50).
- **Blocked from the server:** single video pages ("Sign in to confirm you're not a bot") → no exact upload date, no transcript. I did NOT try to bypass it.
  - Freshness: every outlier below came from searches filtered to "this year" → uploaded within ~12 months.
  - Transcript: `[MISSING]`. The structure section is a hypothesis from title, length and channel pattern. If you want a precise structure breakdown, paste the transcript of the competitor video (button "Show transcript" on YouTube).
- 24 niche searches, 842 videos, 141 channels checked. Raw data: scratchpad (not committed).

## Main competitor
**Living on Alert** (@LivingOnAlert) — "How Sherman Tank Crews Ate, Slept & Survived Days Locked Inside Their Tank"
https://www.youtube.com/watch?v=emET1FgmHTU

| Metric | Value |
|---|---|
| Views | 347,000 |
| Duration | ~12 min |
| Age | < 12 months (exact date blocked) |
| Channel subs | 548 |
| Channel videos | 23 |
| Channel median (latest 23) | 1,300 |
| **Outlier score** | **≈ 267×** (and 633× subs) |

A tiny channel with a giant video = the strongest signal.

### Proof that the formula (not just one video) works — fresh, small channels
| Channel | Subs | Video | Views | Outlier |
|---|---|---|---|---|
| Living on Alert | 548 | How Sherman Tank Crews Ate, Slept & Survived… | 347K | 267× |
| Living on Alert | 548 | How B-29 Crews Ate, Pee'd & Survived 15 Hours… | 30K | 23× |
| Living on Alert | 548 | How B-17 Ball Turret Gunners Ate, Pee'd & Survived… | 23K | 18× |
| Military Aviation Insider | 4.45K | How SR-71 Pilots Ate, Slept & Survived Missions at 85,000 Feet | 582K | 1,665× |
| Military Aviation Insider | 4.45K | How B-52 Bomber Crews EAT, SLEEP & SURVIVE 33-Hour Missions | 185K | 532× |
| Behind the Blast Door | 3.84K | How B-58 Crews Ate, Slept & Survived Sealed in 3 Separate Cockpits… | 374K | 73× |
| Military Insider | 19K | How TANK CREWS Eat, Sleep & Survive Sealed Inside an Abrams for Days | 784K | 327× |
| Sealed In | 886 | What It Was Like to Fight Inside a Berlin Flak Tower as the Soviets Closed In | 192K | 480× |
| IMD Aviation | 101K | How Submarine Sailors Sleep, Eat, and Survive for Months Underwater | 4.0M | 127× |

→ **PROOF: yes, and fresh.** This is a live format wave across at least 6 small channels in the last 12 months.

## Formula extraction (Living on Alert, whole channel)
- **Top 10 by views** (contact sheet looked at): Sherman 347K · Lancaster rear gunner POV 42K · B-29 30K · B-17 ball turret 23K · B-24 20K · Lancaster tail gunner 14K · B-29 tail turret 11K · King Tiger 7.9K · Sherman positions ranked 6.9K · P-51 / U-boat / T-34 below 3.4K.
- **Thumbnail pattern:** realistic, cinematic AI image; ONE young, dirty, exhausted crewman, close-up, **eating from a tin or ration** inside a cramped steel interior (tank, turret, bomber), other crew asleep behind him. 7 of 9 have **no text**; 2 have 3 words in white/yellow bold caps ("NOWHERE TO GO", "NO WAY OUT").
  **Click tactic:** *intimacy + claustrophobia* — you see the human act (eating) inside a box you would never want to be in.
- **Title pattern:** `How [WWII crew] Ate, Slept/Pee'd & Survived [N hours/days] [confinement detail]`. The repeating sub-niche is **WWII vehicle crews** (tanks, bombers).
- **Length pattern:** 11–14 min (median 12).
- **Weak spot in their data:** Soviet T-34 (1.3K) and U-boat (3.4K) underperform → the audience is mostly Anglo-American; the hook is "everyday bodily needs + extreme confinement", not the country.

### FORMULA CARD
> **Cinematic "how did they survive it" explainer about WWII crews sealed in a confined space, thumbnail = one exhausted young person eating/resting in a cramped interior (mostly no text, sometimes 3-word caps), title shape = "How [group] Ate, Slept & Survived [number + time] [confinement]", length = 11–14 min.**

## Packaging of the main video
- Title: question-less "How…" + 3 verbs + duration + confinement → curiosity gap = the bodily details (food, sleep, toilet).
- Thumbnail objects: 1 crewman (+ his ration tin), background crew, gun breech → effectively 2–3 objects.
- Thumbnail vs title: shows "eating" (title says it) but adds the **cramped interior** detail → partly repeats the title.

## Structure (hypothesis — transcript blocked)
- Hook: likely "you are locked inside 30 tons of steel for days…".
- Quests: probably one per need (food → sleep → toilet → heat/cold → danger).
- Answer: "how they survived" is spread across the whole video, so no single final reveal.

## Weak spots (likely)
- A list of needs ("and then the toilet, and then the sleep") — no escalating question.
- No final payoff: the title's question gets answered bit by bit.
- No numbers with a "wow" (counts, prices) on screen.

## GAP — what viewers want next
The format is saturated for **vehicle crews**: Sherman, King Tiger, T-34, B-17, B-24, B-29, Lancaster, P-51, U-boat, Japanese sub, Yamato, Iwo Jima caves, Peleliu caves, Berlin flak tower are all taken by several channels.
Nobody has used it for **civilians sealed underground**: the same questions (where did they eat, sleep, go to the toilet, how did they survive?) about ordinary families. That is the gap.
