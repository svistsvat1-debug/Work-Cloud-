# Publishing package v2 — video #1

Files in this folder: `title.txt`, `titles_ab_test.txt`, `description.txt`, `tags.txt`, `pinned_comment.txt`,
`thumbnail_A_same-army.png`, `thumbnail_B_all-for-him.png`, `thumbnail_C_5958-trucks.png` (1280×720, < 1 MB each).
Video file: `final/video.mp4` (GitHub branch `media/video-01`). Captions: `final/captions.srt`.

## What changed vs v1 and why
- Thumbnails rebuilt around what the niche outliers do (Ink Story ×32 etc.): one or two **big expressive characters** filling half the frame, strong emotional contrast, 2–4 words, readable at phone size. Still marker-whiteboard style.
- Title A is a sharper curiosity gap: a question + a teaser that rules out the "obvious" answer ("Not 2 or 3" — true: the answer is ~7 in Europe, ~18 Army-wide).
- Description: the first two lines are the hook (that is all that shows before "more"), keywords early, chapters, sources, 3 hashtags.
- Pinned comment invites a guess before the reveal → comments + a reason to watch to 7:37.

## Rule check (from the master prompt)
| Rule | A | B | C |
|---|---|---|---|
| Max 3 objects | rifleman, clerk, text ✔ | rifleman, the line, text ✔ (arrow = part of text) | rifleman, convoy, text ✔ |
| Max 4 words | SAME ARMY? (2) ✔ | ALL FOR HIM? (3) ✔ | 5,958 TRUCKS. ONE DAY. (4) ✔ |
| Not repeating any test title | ✔ | ✔ | ✔ |
| Shows a detail the title doesn't say | front line vs desk job | the queue behind him | the scale of one day |
| Marker style, no Nazi symbols, no gore | ✔ | ✔ | ✔ |

All titles ≤ 60 characters (53 / 59 / 54), all with a curiosity gap, all factually true. The final answer (1 : 7 / 1 : 18) is not in any title or thumbnail.

## A/B test plan (YouTube Studio → Test & Compare, up to 3 variants)
1. Publish with **Title A + Thumbnail A**.
2. Immediately start **Thumbnail test: A / B / C** (YouTube advises clearly different variants — these are).
3. When it finishes, keep the winner and run **Title test: A / B / C** from `titles_ab_test.txt`.
4. Log the winners and views in `docs/video/competitors.md`.

## Upload checklist
- Category: Education · Language: English · Made for kids: No
- Upload `captions.srt` as English subtitles (do not rely on auto-captions)
- Chapters come from the timestamps in the description (first one is 0:00)
- Pin `pinned_comment.txt`
- End screen (last 15 s): subscribe + "next video" slot (the Germany/horses follow-up once it exists)
- Altered/synthetic content: the video is animation and the narrator voice does not imitate a real person; my reading of YouTube's rule is "No", but check the wording in Studio when uploading [VERIFY]
