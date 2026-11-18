# DEAD VIDEOS ANALYSIS (2026-11-18)

Source: public data of all 74 Shorts on https://www.youtube.com/@whyzap1/shorts (yt-dlp, 2026-11-18): views, likes, upload time, duration, resolution, formats, tags, description.
YouTube Studio data (traffic sources, "shown in feed", "viewed vs swiped away", claims) was NOT available - [MISSING].

## 1. Main finding: views are binary, not a scale

| views | videos |
|---|---|
| 4-41 ("dead") | 17 |
| 50-499 | 0 (only today's new Short, 93) |
| 500-3K | 47 |
| 3K+ (winners) | 9 |

There is no middle. A weak Short normally still gets a few hundred test views from the Shorts feed.
4-41 views means the Short was almost never shown in the feed at all. So the dead group is a DISTRIBUTION problem
(YouTube did not start the test), not "the topic was a bit worse". Topic and hook decide 500 vs 25K; they do not explain 5 vs 1,000.

Proof that the topic is not the cause - same theme / same week, opposite result:
- Why don't we just feed our plastic to worms? 14 vs Why don't we shoot our trash into the Sun? 2.3K (trash series)
- Why does Japan's bullet train have a bird's beak? 17 vs How did an owl fix Japan's bullet train? 1.6K
- How did people get ice in the desert before fridges? 9 vs Why Is This Man Pouring WATER on the Sand? 5.7K
- Why do sharks leave before a hurricane? 4 vs Why can't a megalodon hide in the Mariana Trench? 2.5K (uploaded in the same hour)

No technical difference found: dead and live Shorts have the same resolution (1080x1920 or 2160x3840), 60 fps, 16-35 s,
the same processed formats, public availability, no age limit, auto-captions present. Empty description / no tags is common in both groups.

## 2. What IS common to the dead videos

### A. Upload volume (strongest signal)
| period | uploads / day | dead |
|---|---|---|
| 1-11 Nov | 3 | 2 of 33 (6%) |
| 12-17 Nov | 4-10 | 15 of 40 (38%) |

When the channel went from 3 to 5-10 Shorts a day, the share of dead Shorts grew ~6x.
Several uploads 1-2.5 h apart: 6 of 15 dead. YouTube gives a channel a limited test audience; many Shorts in one day compete
for it, and a channel that suddenly publishes 8-10 templated AI Shorts a day looks like mass-produced content
(YouTube "inauthentic content" policy) - risk of the feed holding some uploads back.

### B. Duplicate topics of our own earlier Shorts (3 of 17)
- Why can't you tickle yourself? (12) - repeat of "Why You Can't Tickle Yourself" (1.2K, 1 Nov)
- A Dead Flamingo Can Hold Itself Up on One Leg (26) - repeat of "Flamingos Stand on One Leg" (1.4K, 4 Nov)
- Why does Japan's bullet train have a bird's beak? (17) - same Shinkansen story as the owl Short (1.6K) one day earlier

### C. Off-hours uploads (weak signal, small sample)
Uploads at 04-09 UTC: 4 of 6 dead; 20-22 UTC: 3 of 5 dead; 10-18 UTC: ~10 of 60 dead.

## 3. Dead list (17)
Why You See Stars When You Stand Up (31) · Why Doesn't Rain Kill Mosquitoes? (30) · A Dead Flamingo... (26) ·
Why can't you tickle yourself? (12) · What Happens If an Elevator Cable Snaps? (24) · Why does this animal poop cubes? (17) ·
Why don't we eat turkey eggs? (21) · Hoover Dam (41) · Building move (13) · Shipworm (22) · Buzzard (13) · Cow eyes (16) ·
Plastic worms (14) · Bullet-train beak (17) · Print money (8) · Desert ice (9) · Sharks before a hurricane (4)

## 4. What to check in YouTube Studio (owner, ~10 min) - decides the cause
For 3 dead + 3 live Shorts: Analytics -> Reach / Engagement:
1. Traffic source "Shorts feed": ~0 -> YouTube did not distribute (volume / policy). Hundreds "shown" but 80-90% swiped -> hook problem.
2. Content -> Restrictions column: any copyright claim (music) or "Made for kids".
3. Channel -> Monetization / email: any "inauthentic / reused content" notice.
4. Upload settings of dead vs live: "Altered or synthetic content" toggle, audience, category.

## 5. Decisions / next steps
- Max 2-3 Shorts a day, >= 3-4 h apart, 10:00-18:00 UTC.
- Never repeat a topic we already published (check the flat list before choosing).
- Topic focus on proven clusters: nuclear (25K, 17.7K), deep ocean / trench (27K, 2.5K), ancient engineering (moai 6.4K, Pisa 5K, sand 5.7K), birds + physics (5.9K, 4.8K, 4.3K).
- Experiment: after 7+ days, set 3 dead Shorts to private and re-upload them (new title + new first second), one per day, in the good time window. Compare against the rule above.
