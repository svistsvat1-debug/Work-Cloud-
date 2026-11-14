MY IDEA:
STATS:

(MY IDEA = my idea for this video, any language, one line is enough; leave it empty if I have none.
STATS = optional, views of my published Shorts, e.g. "trash in volcano - 120k; mosquitoes - 3k".)

=====================================================================================================================
RUN RULES - read these first. They override anything below that says otherwise.
=====================================================================================================================

R1. LANGUAGES. The video, the voiceover, the titles, the cover text and the description are in English. Everything you
write to me in chat (the idea card and the final report) is in Ukrainian. Memory files are in English.

R2. WHERE THE IDEA COMES FROM. Check in this order:
  a) MY IDEA is filled -> MODE A with that idea.
  b) MY IDEA is empty, but I wrote an idea for a video somewhere in this conversation (in this message around the
     prompt, or in an earlier message of mine) that has not been turned into a video yet -> MODE A with that idea.
     If there are several, take the latest one. An idea you proposed yourself counts only if I approved it.
  c) Neither -> MODE B: you find the idea yourself (STEP 1B).
  In MODE A you never research or propose other topics and never make a video on any other topic.

R3. ONE APPROVAL STOP, IN BOTH MODES.
  PHASE 1 (the message that contains this prompt): STEP 0 -> STEP 1 -> send me the IDEA CARD (STEP 1E) -> STOP and end
  your turn. In phase 1 you make no ElevenLabs call of any kind (no flow, no estimate, no voice, no picture, no sound)
  and build nothing in Remotion: 0 credits are spent before I approve.
  PHASE 2 (my reply to the card):
   - "так", "ок", "ok", "yes", "go", "давай", "погоджую" or "+" = approved -> do STEP 2, STEP 3 and STEP 4 with exactly
     the approved voiceover, from start to finish, unattended. From here on never ask me anything, never wait for me,
     never ask me to connect, log in to or set up any service. Make every choice yourself with sensible defaults and
     explain the choices in the final report.
   - Edits from me -> apply them (re-check any fact they touch), send the updated card, stop again.
   - "№2" / "№3" -> write the full card for that backup idea, stop again.
   - A new idea from me -> MODE A with it, a new card, stop again.
  After approval the voiceover is frozen: no new research, no rewording, no new topic. Only exception: if production
  turns up a factual error, change the fewest words needed to make it true and report it.

R4. ONE VIDEO PER APPROVED IDEA: one script, one voice take, one ElevenLabs flow, one final MP4. Before you create the
flow, check this conversation and memory/VIDEOS_LOG.md: if this idea has already been made (or a flow for it already
exists in this conversation), do not make it again; tell me instead. Never go back to STEP 1 after approval.

R5. REPOSITORY. All work lives in the GitHub repository svistsvat1-debug/Work-Cloud-, in the folder cartoon-shorts/
(below, every path is relative to that folder). Do not change anything outside cartoon-shorts/ (the rest of the repo
is unrelated company material) and do not use any other repository. I start the session with this repository
attached. If it is not attached, try add_repo with push access once; if that is refused, keep going in a local
cartoon-shorts/ folder, send me the files at the end and say in the report that the memory was not saved. The
repository is public: never write keys, tokens, emails or other private data into it.

R6. NO REFERENCES (hard rule, no exceptions): no reference pictures, ever. Every picture is made from its text prompt
only: nothing is wired, attached or uploaded into an image generation, no picture is made by editing another picture,
no earlier picture (not even the hero, not even a picture from an earlier video) is fed back in, and I don't give you a
reference picture. Reference videos or pictures from the internet are not used for style either. This is a hard rule,
not a budget choice: do not break it even if the result would look better or more consistent.

R7. LENGTH: THE FINAL VIDEO IS 25 SECONDS AT MOST (hard cap, <= 1500 frames at 60 fps), including the 0.1 s lead-in and
the tail after the last word. Target 21-24 s. Every length, word count and line count below follows this cap.

R8. PICTURE QUALITY: EVERY picture is ElevenLabs GPT Image 2.5, resolution 1K, quality LOW, one variation. There are
no MEDIUM pictures any more: quality medium / high / xhigh / max is never used, for any picture (the hero, poses,
close-ups and the background included).

R9. BUDGET: AT MOST 900 ElevenLabs CREDITS PER VIDEO (hard cap, for everything: voice + word times + pictures + sound
effects + any redo). Never start a run that would take the total over 870 (30 kept as a margin, because estimates are
estimates), and never go over 900, even if the result would be better. Every number below follows this cap.

R10. STORY, NOT A LIST OF FACTS (hard rule for every script): the voiceover is told as a short story that people want
to keep listening to, never as a list of facts read out. Someone (a doer) wants something, tries it, something goes
wrong, and the ending of the story is the answer. Facts are the EVENTS of the story, not statements about the topic.
All other script rules still hold (real facts only, the length cap, no hype words, no narrator phrases, no "!" lines).
Details: STEP 1C "Story".

=====================================================================================================================
STEP 0 - CHANNEL MEMORY (before anything else, in phase 1)
=====================================================================================================================

The memory is in memory/ on the branch main. Run `git fetch origin main` and rebase your working branch onto
origin/main before reading, so you always see the newest memory. Create any missing file with the columns below.

- memory/VIDEOS_LOG.md - one row per finished video: # | date | short id | topic (one line) | category | title |
  cover text | theme / series | views (from STATS) | notes (what worked, what didn't).
- memory/IDEA_BANK.md - candidate ideas not used yet: idea | why it could work (evidence + link) | category |
  date found | status (new / used / rejected).
- memory/STYLE.md - the channel's locked look: the STYLE_CHAR / STYLE_OBJ / KEY / STYLE_BG blocks with the measured
  numbers of the channel's character (hex colours, proportions), and "lessons": what looked good, what glitched, what
  to do differently. Read it before writing any picture prompt or animation code. (Lessons written for MEDIUM
  pictures in earlier videos may not hold for LOW pictures: check them against the new pictures.)
- memory/COMPETITORS.md - my own list of channels and videos in the niche. I fill it in by hand. You only read it; you
  may add videos you found to a separate section "Found by Claude" (link, views, channel subscribers, upload date, why
  it is interesting).
- sfx-library/ + sfx-library/index.md - sound effects from earlier videos (all made with ElevenLabs): file | what it
  sounds like | length | onset / peak time | from which video | the ElevenLabs prompt.

If STATS is filled, first write the views into VIDEOS_LOG.md (and commit + push the memory, see STEP 4.5, even in
phase 1). Then work out WHAT WORKS ON MY CHANNEL: a video with at least 3x the median views of my logged videos (with
3+ logged videos with views) is a winner, and its theme is a winning theme; a theme tried 2+ times that stayed far below
the median is a weak theme. Also compare the story-shaped videos (from #13 on) with the older fact-shaped ones once
both have views. Put one line about this into the idea card ("not enough data yet" is a fine answer).

=====================================================================================================================
STEP 1 - IDEA, SCRIPT AND PACKAGING (phase 1; ends with the IDEA CARD and a STOP)
=====================================================================================================================

---------------------------------------------------------------------------------------------------------------------
1A. MODE A - my idea
---------------------------------------------------------------------------------------------------------------------
Do not look for other ideas and do not propose other topics. Research only my idea: verify its central fact(s) with
reliable sources (see "Facts" in 1C), find the surprising answer, the stakes and the clearest way to tell it as a
story (who tried what, what went wrong, how it ended). If my idea is factually wrong or can't be supported, say so in
the card and propose the closest true version of the SAME idea (not a new topic). Then write the script (1C), make the
packaging (1D), send the card (1E) and STOP.

---------------------------------------------------------------------------------------------------------------------
1B. MODE B - find the idea yourself
---------------------------------------------------------------------------------------------------------------------
Research the internet and write one original YouTube Shorts script about a surprising fact or an interesting question,
told as a short story (R10). The video will use simple 2D animations and should be at most 25 seconds long (21-24 s is
ideal), with around 48-60 words of narration. Look for unusual questions, surprising explanations, everyday mysteries,
or strange facts about science, animals, history, the human body, space, or engineering. For example, "Why don't we
throw trash into volcanoes?" works because it suggests a simple solution and makes people wonder why we don't use it.
Use that kind of curiosity, but find a different topic. Research several ideas before choosing the strongest one.
Choose something that can be told as a story in 25 seconds or less (someone tries something, it goes wrong or turns
out differently, the ending is the answer), has a surprising answer or consequence, is easy to show through simple 2D
animations, and makes sense without background knowledge. Choose the best idea yourself without asking me to pick a
topic (I only approve or reject the card).

Where candidates come from, in this order:
1. WHAT WORKS ON MY CHANNEL (STEP 0). If a theme clearly won, the first candidates are its next episodes: a new
   question in the same theme that someone who just watched the winner would want next (e.g. trash into a volcano ->
   trash into the Sun -> feeding trash to a whale). A next episode is a NEW question with a NEW answer, never a copy or
   slight variation of the winner. Avoid weak themes.
2. TRENDS. What people are talking about right now (this week's news, launches, discoveries, events, seasons, viral
   topics) that can be turned into a surprising fact or question in this format. Only if the facts are solid; the
   video must explain something real, not just mention the trend.
3. PROVEN DEMAND ELSEWHERE. A question that already got big views in another format (live footage, a long video,
   another language, a forum thread such as ELI5) but has no 2D cartoon Short yet: redo it as a cartoon with my own
   angle and my own words. (The volcano video worked this way: the same question had a 17M-view live-footage video six
   years earlier; the cartoon version got 3.6M.) A small channel with one video far above its usual views is a strong
   signal that there is room for a new channel on that topic.
4. memory/COMPETITORS.md and the "new" ideas in memory/IDEA_BANK.md.

Rules for choosing:
- The category is chosen by what is trending and what works on my channel, not by rotating categories.
- Each time I send this prompt, choose a new topic and explanation. Check the ideas already visible in this
  conversation and in VIDEOS_LOG.md / IDEA_BANK.md (used, rejected) and avoid repeating them or making slight
  variations of them (a next episode of a winning theme, as in point 1, is allowed). If you cannot access previous
  ideas, don't claim you checked them.
- Never copy another creator's script, title or thumbnail word for word: take the shape of a question that works, not
  its words.
- Shortlist 5-8 candidates and score each 1-5 on: curiosity of the question, proof of demand (with a link), surprise of
  the answer, works as a story (a clear doer, a goal, a turn, an ending), easy to show in simple 2D animation, solid
  facts, fit with what works on my channel or with a trend, fits into 25 seconds without rushing. Pick the best. Write
  the others into IDEA_BANK.md; the next two best become the backups in the card.
- If you cannot browse the internet, say so rather than pretending you researched the topic.

---------------------------------------------------------------------------------------------------------------------
1C. SCRIPT RULES (both modes)
---------------------------------------------------------------------------------------------------------------------
Facts: verify the central fact using reliable sources, preferably original research, universities, museums, government
agencies, or established scientific organizations, and cross-check the explanation where possible. Do not invent facts,
numbers, quotes, or consequences, and keep uncertainty where it matters. Real facts only in the voiceover (cartoon
exaggeration is fine for what the characters do).

Length: the whole video is at most 25 seconds (R7), so the narration is 48-60 words, at most ~360 characters with
spaces (the voice budget), estimated at ~2.6 spoken words per second: the estimated speech length in the card must be
at most 24 s. If the story does not fit, cut a sentence, never cram.

Story (R10) - how a fact becomes a story:
- A DOER WITH A GOAL. The story is about someone who wants something concrete: "you" (in a what-if), the channel's
  character, or a real person / crew / city from the sources (an engineer, a mayor, a phone company). The cartoon
  character plays that doer on screen.
- START INSIDE A MOMENT, not with a definition or a number: "So you drag a bag of trash all the way up a volcano." /
  "In 1930, a phone company needed its old building gone." The first line still names what frame 0 shows.
- EVENTS, NOT STATEMENTS. Every sentence is something that happens: someone does, tries, sees, decides, or something
  breaks, floats, cracks, comes back. A fact enters the story as an event or a consequence. Not "Lava is denser than
  trash", but "You throw it in... and it just floats." At most one sentence may explain WHY (the "because" line), and
  it is tied to what just happened.
- NUMBERS AS MOMENTS. At most one or two numbers, each one landing as part of what happens ("125 years later, it would
  still be cooling"), never a row of statistics.
- TIME MOVES FORWARD. Each sentence is a later moment caused by the one before it (but / so / because). If two
  sentences could swap places without breaking anything, it is a list: rewrite it.
- ONE TENSE. Present tense for a what-if story ("you throw it"), past tense for real history ("they poured"). Never mix
  inside one script.
- THINGS YOU CAN SEE AND HEAR: concrete objects and actions the cartoon can show, not abstract words (impact,
  efficiency, process).
- AN ENDING, NOT A CONCLUSION. The last sentence is what finally happens (the payoff + punchline), not a summary, a
  moral or "and that's why...". It may loop back into the first line.
- TOLD LIKE TO A FRIEND: like telling someone what happened, no story announcements ("Let me tell you a story", "Once
  upon a time", "Picture this", "Imagine...").
- STILL TRUE. The story dramatises only what the cartoon characters do. Every event the voice presents as real comes
  from the sources: no invented names, dates, dialogue or quotes presented as real (a narrated paraphrase such as "the
  architect said: move it" is fine only when the source says he proposed it).
Example of the FORM only (not a fact source; facts of a real script still need sources):
  LIST (wrong): "Lava is about 1,100 degrees. Trash would burn and release toxic smoke. Lava is also denser than trash.
  So we don't throw trash into volcanoes."
  STORY (right): "So you drag a bag of trash all the way up a volcano and throw it in. But it doesn't sink. Lava is way
  heavier than garbage, so the bag just sits on top, burns, and the toxic smoke drifts right back at you."

Shape (the story's arc):
- 0-2 s HOOK = the story's opening moment: the doer + the thing + the goal, with the stakes or the promise clear at
  once. Start immediately, without a greeting or introduction. The first line names what we see in the first frame.
- THE PLAN (the obvious answer): what the doer tries, the simple solution that seems to work ("so why not just...?").
- BUT -> SO: one problem (two only if they still fit in 25 s) that raises the stakes: what goes wrong, what it would
  cost, why the obvious plan fails, and what the doer does next.
- PAYOFF: the real, clear, satisfying answer comes only as the story's ending in the last one or two sentences; the
  last words are the punchline (they get the visual gag). The last line should flow naturally back into the first one
  when the Short loops.

Checks before the card:
- Story check: (1) who is the doer and what do they want? (2) is every sentence something that happens? (3) can any
  two sentences swap places without breaking the story? (if yes, it is a list: rewrite) (4) does the last sentence end
  the story (what finally happens) instead of summing it up? Write the answers in the card.
- Connector check: between every two sentences the link is "but", "so", "because", "which means" or "that's why"
  (said or clearly implied), never "and then". A run of "and then" is a list, and that is where viewers leave. Write
  the chain out in the card.
- Delay the answer, but never stall: build toward it without filler or dragging out the explanation; every sentence
  adds useful information. With only ~25 seconds, every word must earn its place.
- Stakes are said plainly, not hinted.
- Use simple, natural, conversational English with short, connected sentences that sound good when spoken aloud, like
  a normal person talking (plain words, "so", "basically", "right?" where they fit naturally).
- No narrator phrases ("here's the thing", "but here's the part"), no hype words (incredible, shocking, amazing,
  insane, mind-blowing), no "!" lines (they make AI voices over-act), no generic hooks like "Did you know?", "This will
  blow your mind," or "You won't believe this." No forced suspense, exaggerated claims, AI-sounding phrases or calls to
  action.
- Use original wording and do not copy another creator's script.

---------------------------------------------------------------------------------------------------------------------
1D. PACKAGING (text only in phase 1; the cover picture is made in STEP 4)
---------------------------------------------------------------------------------------------------------------------
- Titles: 3 options in English, at most 60 characters each, in a shape that is proven to get clicks ("What if we...?",
  "Why don't we...?", "Why can't...?", "What happens if...?"). Mark your pick.
- Cover text: 1-4 words that add something the title does NOT say (a second surprise: a price, a number, an object, a
  before/after, a short question). Example: title "What if we threw trash into volcanoes?" + cover text "Endless
  dump?". Never repeat the title on the cover.
- Rule of three objects: the cover shows at most three things: the character, the main object, the cover text.
- Frame 0 of the video shows the same premise as the cover (it can be picked as the Shorts thumbnail).
- Description: 1-2 plain sentences + the source links + 3-5 hashtags (#shorts + the topic).

---------------------------------------------------------------------------------------------------------------------
1E. IDEA CARD -> STOP
---------------------------------------------------------------------------------------------------------------------
Send me in Ukrainian (the script, titles and cover text stay in English):
 1. Idea source (MY IDEA / an idea from the chat / found by you) and the idea in one sentence.
 2. Why it should work: what works on my channel (STEP 0), the demand evidence (links, views) or the trend it rides on.
 3. The complete voiceover, ready to record, without scene directions, told as a story (R10).
 4. Narration word count, character count and estimated length in seconds (speech <= 24 s, whole video <= 25 s).
 5. Story check: the doer and what they want, the turn ("but"), the ending (one line each), and the answers to the
    story check in 1C.
 6. The connector chain (sentence 1 -> but -> sentence 2 -> so -> ...).
 7. A short beat outline: per line, what is on screen and the gag (a few words each).
 8. Packaging: 3 titles (pick marked), cover text, description with hashtags.
 9. Links to the sources that support the explanation.
10. Credit plan from the price table in STEP 2 section 2 (voice, word times, pictures - all LOW 1K, sound effects
    including what will be reused from sfx-library, reserve, total - the planned total must be <= 870, the hard cap
    is 900), and the line "spent so far: 0 credits".
11. MODE B only: two backup ideas, one line each, numbered №2 and №3.
End with: "Відповідай «так», щоб запустити виробництво, або напиши правки / «№2» / «№3»."
Then end your turn. Do not start STEP 2, STEP 3 or STEP 4 before I approve.

=====================================================================================================================
STEP 2 - THE SKILL (used in phase 2)
=====================================================================================================================
---
name: cutout-cartoon-shorts-elevenlabs
description: Turn a short story script into a vertical 2D cartoon Short (1080x1920, 60 fps, at most 25 seconds) in the cut-out style of "Can we throw trash in a volcano?". Every picture (each pose / expression, props, set pieces and the background) comes from ElevenLabs GPT Image 2.5 at 1K, quality LOW, and is keyed into a cut-out locally; the voice-over is ElevenLabs "Mark - Natural Conversations"; every sound effect is ElevenLabs Sound Effects; Remotion code animates it all (2.5D multiplane camera, squash-swap poses, real projectile physics, lava / smoke / steam effects, cartoon faces on objects). Hard budget: 900 ElevenLabs credits per video. Runs unattended from the approval of the idea card to the end. Use when someone asks for a cartoon / cut-out / Oddsoneout-style animation from a script made with ElevenLabs + code.
---

# Cut-out cartoon Shorts (ElevenLabs pictures + voice + sound, code animation)

What this makes: a vertical Short (1080x1920, 60 fps, at most 25 seconds, delivered at 1080x1920 with no upscaling)
where a simple flat cartoon character (thick black outlines, flat colours) acts out a story script with a voice-over.
Every character pose and expression is its own AI picture (1K, LOW quality), keyed into a cut-out; the motion, camera,
physics, effects and timing are code. Example of the style: a white round-head guy throws a trash bag into a volcano,
the volcano opens its eyes, erupts and spits the bag back into his hand on "no thanks".

Read the whole file once before starting. Follow the order; each step says what "done" looks like.

---------------------------------------------------------------------------------------------------------------------
## 0. Setup and running unattended

- Nobody is watching (after the idea card was approved). Never ask a question, never wait for approval, never ask the
  person to connect, log in, paste a key or pick anything. Decide, write the decision down, and report it at the end.
- Everything that is generated comes from ElevenLabs through the ElevenLabs connector (tools named `creative_*`).
  If those tools are deferred, load them yourself with the tool search: `creative_create_flow`,
  `creative_add_flow_node`, `creative_run_flow_nodes`, `creative_get_flow_run_status`, `creative_get_generations`,
  `creative_transcribe_audio`, `creative_list_voices`, `creative_get_model_schema`. Do not install or use Higgsfield,
  any other generator or a sound library: pictures, the background, the voice and every sound effect are ElevenLabs
  (the only reused sounds are ElevenLabs sounds from earlier videos in `sfx-library/`, section 10).
- NO REFERENCES (hard rule, no exceptions): every image node gets a text prompt only. Never pass `connect_from` to an
  image node, never wire anything into its `images` port, never use `creative_edit_image`,
  `creative_attach_reference_file`, an upload or `creative_add_flow_asset_node` as an image input, and never feed the
  hero or any other generated picture (also from an earlier video) back in. The look stays consistent through text and
  code only (section 4).
- Remotion 4 project (React/TypeScript): ONE project for all Shorts at `studio/`, one composition per Short in
  `src/Root.tsx`, assets in `public/`. Use the existing project; if there is none, create one non-interactively
  (`npx create-video@latest`, blank template). Reuse and improve the shared code from earlier Shorts in `src/shared/`
  (camera, Layer, shake, smoke / steam, lava, faces, sweat drop, sound cues) instead of rewriting it; the Short's own
  code goes in `src/<short>/`. `<short>` = a short kebab-case id of the topic (e.g. `bees-hexagons`); the composition id
  is the same name in PascalCase.
- Python 3 with `pillow numpy opencv-python` (keying, measuring). Install whatever is missing yourself with pip.
  ffmpeg: Remotion ships one in `node_modules/@remotion/compositor-*/ffmpeg(.exe)`.
- One ElevenLabs flow per Short: call `creative_create_flow` (name = the Short's name) first and pass its `flow_id`
  to every later call, so everything lands on one canvas. Put the flow link in the final report.
- Folders (inside `studio/`): `images/<short>/` (prompts.md, credits.md, raw/, scripts, qa/) for source pictures;
  `public/<short>/` only for the final keyed sprites, sfx and voice (Remotion copies `public/` into every bundle).
- When a call fails: read the error, fix the cause, try once more. Never start a generation again before
  `creative_get_flow_run_status` says the first one failed: a second run is charged again. If something still can't
  be done, use the fallback written in this file and mention it in the final report. Do not stop to ask.

---------------------------------------------------------------------------------------------------------------------
## 1. Script -> beat sheet (before generating anything)

1. Split the approved script into lines: a Short of at most 25 s = 6-8 lines, 48-60 words. Use the approved words
   exactly. They are already written as a story told like a person talking (plain words, "so", "basically", "right?"),
   with no narrator phrases ("here's the thing", "but here's the part"), no hype words (incredible, shocking, amazing,
   insane) and no "!" lines: they make AI voices over-act.
2. One visual beat per line, on the exact word: "throw" = the throw, "steam" = steam, "no THANKS" = the catch. The
   story's doer is the character on screen, and every event the voice tells is something we SEE happen. The "but" /
   "so" turns of the script are the turns of the action: something goes wrong exactly on "but".
3. Frame 0 states the premise (character + the thing + the setting, readable like a thumbnail, the same premise as the
   cover). No intro, no rewind. Something already moves in the first 0.5 s (the camera glides, the character acts).
4. Plan the shots: as few hard cuts as possible (one continuous camera move is best); a cut only for a new shot
   (e.g. the reaction close-up). End on an image that loops back to frame 0. In 25 s there is no room for slow
   establishing moves: keep every camera move short and purposeful.
5. Plan the fun: one gag per beat that a kid would laugh at (an object that comes alive and opens its eyes, an
   anticipation "inhale" before a blast, squeezed "> <" eyes, a sweat drop, a smug smoke ring, the thing coming back).
   The biggest gag sits on the payoff words.
6. List the pictures you need (section 4) from the beats: every pose, every expression, every prop that moves on its
   own, every set piece, the background. Every one is LOW 1K; price each one (section 2).
   Done = beat sheet table: time / words / what is on screen / which picture / which sound, plus `budget.md`.

---------------------------------------------------------------------------------------------------------------------
## 2. Budget: 900 ElevenLabs credits per video, a hard cap (R9)

Prices measured with `estimate_only` in November 2026, with one variation and no reference picture. They can change, so
always estimate before you run.

| What                                      | Settings                         | ~ credits                                      |
|-------------------------------------------|----------------------------------|------------------------------------------------|
| Voice, one take                           | eleven_v4, Mark                  | ~ 1 per character of the script (60 words ~ 360) |
| Word times                                | Scribe v1 on the voice           | ~ 10                                           |
| Picture LOW                               | 1K, 2:3                          | ~ 47                                           |
| Picture LOW                               | 1K, 3:2                          | ~ 47 (same pixel count as 2:3; confirm with the estimate) |
| Picture LOW                               | 1K, 1:1                          | ~ 54 (pricier than 2:3, so use 2:3 / 3:2)      |
| Picture MEDIUM / high / xhigh / max       | any                              | FORBIDDEN (R8): every picture is LOW           |
| Sound effect                              | Sound Effects v2                 | ~ 11 per second (2 s ~ 22, 5 s ~ 55)           |
| Reused sound from `sfx-library/`          | an ElevenLabs sound from an earlier video | 0                                     |
| Reference picture / image edit            | any                              | FORBIDDEN by rule (it would also add ~ 240 each) |
| ElevenLabs background removal             |                                  | ~ 30 each, so never (key locally for free)     |

Plan it before generating anything and write it to `images/<short>/budget.md`. Normal split:
- voice <= 370 (one take; the approved script is <= ~360 characters);
- word times ~ 10;
- sound effects <= 80 (reuse from `sfx-library/` first, section 10; new effects short, 0.5-2 s; a 25 s video
  rarely needs more than 6-7 cues);
- pictures: all LOW 1K at ~47 each, normally 6-8 pictures = ~280-376. Spend it where it makes the video more alive
  (an extra expression, a reaction pose, a funnier prop), but no overkill: at most 8 pictures (a 9th only if the
  whole plan, reserve included, still stays <= 870, e.g. because all sounds are reused), never quality
  medium / high / xhigh / max, never 2K / 4K, never more than one variation. Credits left unused under the cap are
  fine; never add pictures just to spend credits;
- reserve ~ 50 (one LOW redo) for redoing a picture that failed the check.
Expected total: roughly 700-870 credits, never more than 900.
Example plan: voice 360 + word times 10 + 8 pictures 376 + sound effects 70 + reserve 50 = 866.

Rules:
- `generations_count: 1` on EVERY paid run. The defaults are 4 picture variations and 2 voice takes (4x / 2x the price).
- `quality: "low"` and `resolution: "1K"` on EVERY picture node. Before every image run, check in the estimate that
  no node is set to another quality.
- Before every paid run, make the same call with `estimate_only: true`, add the estimate to `images/<short>/credits.md`
  (what, settings, estimate, running total), then run it. Never start a run that would take the total over 870 (30 is
  kept as a margin because estimates are estimates). Never go over 900, even if the result would be better.
- If the voice costs more than planned, take the difference from sound effects first (reuse library sounds), then
  from pictures (drop the least important one), before you generate any picture.
- `estimate_only` on a node whose input is not generated yet also counts that input (Scribe before the voice exists
  shows ~425): estimate Scribe after the voice has finished.
- If the plan does not fit, in this order: (1) draw a small prop in code instead, (2) put two small props into one
  picture (or two poses into one pair sheet), (3) shorten sound effects or reuse library ones, (4) drop the least
  important picture. Cut the voice or the main character's poses last. Never raise the quality above LOW.
- A failed run may be run again once; put both in the ledger.

---------------------------------------------------------------------------------------------------------------------
## 3. Voice (ElevenLabs) and word times

- Voice: "Mark - Natural Conversations" (voice_id `UgBBYS2sOqTuMpoF3BR0`, a casual young American man). If that id is
  ever rejected, find the same name with `creative_list_voices` (search "Mark Natural Conversations"); never use a
  different voice. Model `eleven_v4`, plain text (no tags, no SSML), one take.
- How: `creative_add_flow_node` (node_type `tts`, model `eleven_v4`, `voice_id`, prompt = the approved script) ->
  estimate -> `creative_run_flow_nodes` with `generations_count: 1` -> poll `creative_get_flow_run_status` (wait
  `poll_after_seconds` between calls) until `all_completed` -> download the audio URL with curl to
  `public/<short>/vo/take1.mp3`.
- Word times: `creative_transcribe_audio` (`eleven_scribe_v1`) with `connect_from` = the voice node on the same flow.
  Read per-word start/end from `transcripts[].words` (or `words_download_url`) and save `words.json`. Compare the
  transcript with the script: a clearly wrong or skipped word is the only reason to pay for a second take (from the
  reserve, then re-balance the plan). Fallback if Scribe fails: faster-whisper locally with `word_timestamps=True`.
- Word edges are +-0.1-0.2 s: find the real pauses by loudness (RMS every 20 ms, silence = below -42 dB for >= 0.18 s)
  and trust those.
- Place the voice at 0.1 s and define every beat as a constant: `T = {turn: 2.05, release: 3.7, land: 4.8, ...}`.
  The composition length = voice end + ~0.5 s, and it must be at most 25.0 s (1500 frames, R7). Big sounds (an
  explosion) go into a pause, not on top of words.
- If voice end + 0.5 s comes out over 25.0 s, fit it without a new take and without changing a word, in this order:
  (1) shorten the tail to 0.3 s; (2) shorten pauses between sentences that are longer than 0.35 s to 0.25 s (cut
  silence only, found by loudness, never inside a word); (3) speed the whole voice up with ffmpeg `atempo` by at most
  6 %. Re-measure the word times after any edit (shift them by the cut silence / divide by the tempo) and report what
  you did. Save the fitted voice as `public/<short>/vo/take1_fit.wav`.
- Done = voice file (<= 24.7 s incl. the 0.1 s lead) + words.json + the T table.

---------------------------------------------------------------------------------------------------------------------
## 4. Pictures (ElevenLabs GPT Image 2.5, 1K LOW, keyed into cut-outs)

Model `gpt-image-2.5-sunburst`. Every picture: `resolution: "1K"`, `quality: "low"`, one variation. No exceptions:
the hero, every pose, every close-up and the background are LOW too (R8). GPT Image 2.5 in ElevenLabs has no
transparent-background option: every cut-out is drawn on a flat key colour and keyed locally (free, below). The
background plate is the only picture that is not keyed.
Aspect: full body 2:3, waist-up close-up 2:3, props 2:3 or 3:2, wide set pieces and pair sheets 3:2, background 2:3
(more pixels than 9:16 and room to pan sideways).

LOW quality = less fine detail and sometimes slightly rougher lines. Design for it: keep every subject simple (big
shapes, few details, thick outlines), ask for "bold clean thick outlines" in every prompt, let code carry the small
detail (faces on objects, effects, sweat drops), keep the background very simple, and check the edges extra carefully
on the QA sheet.

How to run:
1. `creative_add_flow_node` per picture: node_type `image-generation`, model_id `gpt-image-2.5-sunburst`,
   `model_parameters: {"resolution": "1K", "quality": "low", "aspect_ratio": "2:3"}`, `label` = the sprite
   name, `prompt` = the full prompt. Adding nodes costs nothing.
2. `creative_run_flow_nodes` with `estimate_only: true` for the batch -> ledger -> the same call without
   `estimate_only`, with `generations_count: 1`. Up to 20 nodes per call, and they run in parallel.
3. Poll `creative_get_flow_run_status`; then `creative_get_generations` (1-4 ids per call) gives `full_res_url` and
   the native width / height; curl each one to `images/<short>/raw/<name>.png`.
Don't use `creative_generate_image` or `creative_generate_in_flow` for pictures: they can't set the quality (they run at
"high" with 4 variations). Never use `creative_edit_image`: it always takes a picture as input, and references are
forbidden.

Order:
1. HERO first, alone (LOW, 1K, 2:3): the main character in its neutral pose, full body. The main character is the
   channel's recurring character: if memory/STYLE.md already has a locked CHARACTER block, use it word for word in this
   prompt and in every prompt after it (text only, never a picture). Check the hero yourself (flat style, clean even
   outlines, the character as described, a clean key background). If it's off, fix the prompt and make one more from
   the reserve. The hero now defines how the character looks in this video.
2. Lock the look: measure the hero (fill / shade / outline / tongue colours sampled from its pixels as hex, outline
   thickness as a fraction of the head width, head width vs body height, eye size) and write those exact numbers into
   the CHARACTER block. If STYLE.md has no locked look yet, save this block there as the channel's locked look. Read the
   hero's native size too: no sprite may be shown bigger than ~1.5x its native pixels on the 1080x1920 frame (2x at
   most; the background up to 2x, more only while it is blurred). Plan close-ups as their own waist-up pictures instead
   of zooming into a full-body one.
3. Everything else in ONE batch, with the STYLE + CHARACTER blocks word for word the same in every prompt, every node
   LOW 1K.

NO REFERENCES (hard rule, see section 0): the hero is never fed into another generation, it only gives you the numbers
for the text description. Consistency comes only from text and code:
- identical STYLE / CHARACTER blocks with the measured numbers;
- PAIR SHEETS: two pictures that must line up exactly (the same pose with and without the object, or two expressions
  of one close-up) are ONE 3:2 picture with two copies side by side: "two identical copies of the same character in
  the same pose, side by side with a wide gap between them; the LEFT copy holds ...; the RIGHT copy is identical except
  the hand on the right side of the image is empty and open". It costs the same as one 2:3 picture and both halves come
  from the same drawing. Split and align them in prep (section 5). Use it only if each half still passes the 1.5x rule;
- colour normalising in prep (section 5).

Prompt = what is different in THIS picture + the STYLE block + the KEY block (same words every time):

```
STYLE_CHAR = "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with
simple four-finger hands and short legs with rounded feet, bold clean thick smooth black outlines of even weight, flat
white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no
nose, no hair, no clothes, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no
texture, no text, no border."   (after the hero: add the measured hex colours and proportions)
STYLE_OBJ = "Flat 2D cartoon in the same drawing style: bold clean thick smooth black outlines of even weight, flat
colours with one simple soft shade, clean vector-like linework, simple shapes, no texture, no text, no border, no
characters."
KEY = "Isolated on a perfectly flat, uniform, solid pure green (#00FF00) background that fills the whole picture edge
to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject
in frame with a clear margin on every side."   (if the subject itself has green in it, use magenta #FF00FF)
STYLE_BG = "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black
outlines only on the main shapes, no texture, no text, no characters, calm and simple so a character reads clearly on
top of it. Clean open ground in the lower middle where the character will stand; horizon at about 60 % of the height."
```

Pose prompt pattern: framing ("Full body, three-quarter view facing to the right" / "Waist-up close-up, facing the
viewer, centred") + expression ("scared: eyebrows tilted up in the middle, wide eyes, mouth wide open") + exact hands
("the hand on the RIGHT side of the image holds a black tied garbage bag by its knot") + "Whole body in frame with a
margin". Say left/right as "on the left side of the image", never "his left".

Picture list that worked for one gag (all LOW 1K):
- every pose the story needs (curious shrug + object, looking up, wind-up, follow-through with EMPTY hand, scared),
  each as its own picture; the "scared + empty hand / scared + object" pair as one pair sheet;
- the moving prop ALONE (the bag), so it flies as its own sprite;
- set pieces alone (the volcano), small dressing (a row of 5 rocks in one picture, split later);
- the background plate.
A 25 s video still needs only the poses the beats really use: plan no extra ones.

Keying (default for every cut-out; tested):

```python
# key.py IN.png OUT.png - flat key-colour background -> transparent cut-out (free, local)
import sys
import numpy as np
import cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
key = np.median(border, 0)                                   # the key colour as actually drawn
dist = np.sqrt(((im - key) ** 2).sum(2))
near = (dist < 60).astype(np.uint8)
# background = key regions touching the border + enclosed key-coloured gaps (e.g. between an arm and the body)
n, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
bg = np.zeros((h, w), bool)
for i in range(1, n):
    x, y, ww, hh, area = stats[i]
    if x == 0 or y == 0 or x + ww == w or y + hh == h or area > 40:
        bg |= lab == i
# 3-px edge band: alpha from the distance to the key, colour un-blended to the outline ink (no green fringe)
ring = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
ink = np.array([20.0, 20.0, 20.0])
alpha = np.ones((h, w), np.float32)
alpha[bg] = 0
alpha[ring] = np.clip(dist / np.sqrt(((ink - key) ** 2).sum()), 0, 1)[ring]
a = np.maximum(alpha[..., None], 1e-3)
rgb = np.where(ring[..., None], np.clip((im - (1 - a) * key) / a, 0, 255), im)
Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA").save(dst)
```

(LOW pictures can have a slightly noisier key colour: if the key leaves specks or a fringe, raise the `dist < 60`
threshold step by step up to ~85 for that picture only and re-check.)

Check every cut-out on a coloured background sheet (`qa/sheet.png`, e.g. magenta and dark blue) before using it:
fringes, holes keyed by mistake, a drawn shadow or floor line (crop or erase it), extra objects. Fix in code first; if
it can't be fixed, redo that one picture from the reserve, still LOW (at most one redo per picture, and only while
the total stays <= 870; otherwise fix it in code or drop it).
Done = all pictures pass the sheet check; prompts and settings saved in `images/<short>/prompts.md`.

---------------------------------------------------------------------------------------------------------------------
## 5. Prep: trim, normalise, measure, align (images/<short>/prep.py -> src/<short>/sprites.ts)

- Trim each keyed PNG to its alpha box + 12 px; save to `public/<short>/`; keep the trim offset (needed for aligning).
- Colour normalising: take the channel palette from memory/STYLE.md (fill, shade, outline, tongue, eye colours); if
  there is none yet, take this hero's palette. In every character picture, pixels with alpha 255 within distance ~40 of
  a palette colour become exactly that colour, so all poses (and all videos) match. (This also cleans up the slight
  colour noise of LOW pictures.)
- If a sprite will be shown above 1x, pre-scale it once here with Lanczos to its largest on-screen size, so the browser
  only ever scales it down.
- HEAD = largest inscribed disc of the hole-filled silhouette (works for big-head cartoon characters: the head is the
  widest round part). Scale every pose so its head radius is the same in the world, so swaps never change head size.

```python
a8 = (alpha > 128).astype(np.uint8); ff = a8.copy()
cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
solid = np.where(ff == 2, 0, 1).astype(np.uint8)
dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
hy, hx = np.unravel_index(dt.argmax(), dt.shape); head = (hx, hy, dt[hy, hx])
```
- FEET = middle of the opaque pixels in the bottom 3.5 % rows. Full-body poses stand on the same world feet point;
  waist-up poses put their head where the full-body head is.
- Hands / grip points: extreme points of the alpha (`argmax(x - y)` = raised hand top-right) or read them off a
  marked-up sheet. Object sizes: widest row of the object (dark fill), then scale the flying sprite to match the drawn one.
- Pair sheets: split at the widest fully transparent column between the two copies, trim each half, then ECC affine on
  the HEAD region (exclude the hands that differ):
```python
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(B_gray, A_gray, warp, cv2.MOTION_AFFINE, (3, 500, 1e-6), head_mask, 5)
# warp maps B -> A; invert it and draw A inside B's canvas with CSS matrix(a, b, c, d, e, f)
```
- Set pieces: measure what the effects need (the crater lake ellipse = top band of orange pixels; the silhouette top
  profile every 25 px so falling things land on the slope).

---------------------------------------------------------------------------------------------------------------------
## 6. The world: 2.5D multiplane camera

Every picture is a flat layer at a depth Z; the camera has (x, y, z); a layer's scale is k = F / (Z - z) (F = 1000).
Dollying (changing z) makes near things grow much faster than far things = real depth. Units: at camera (540, 960, 0) a
layer at Z 1000 shows 1 world px as 1 screen px.

```tsx
const Layer = ({cam, z, blur = 0, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;                       // layer is (almost) behind the camera
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur ? `blur(${blur}px)` : undefined}}>   {/* blur in SCREEN px */}
      <div style={{position: 'absolute', transformOrigin: '0 0',
        transform: `translate(540px, 960px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`}}>{children}</div>
    </AbsoluteFill>
  );
};
```
- Depths that worked: foreground rocks 650, character 1000, mid ground 1800, set piece 3000, the ElevenLabs background
  plate behind everything (cover the frame, keep it within the size rule of section 4).
- Camera: piecewise moves with easing; interpolate SCALE in log space (`exp(lerp(log k0, log k1, u))`) so zooms feel
  even; slow-fast-slow (easeInOutCubic) for glides, easeOutCubic for a blast pull-back; holds are perfectly still.
- Depth of field: blur far layers 2.5-3.6 px only while the camera is close on the character.
- Flying the camera past the character: hide layers closer than ~300 units, tilt the camera up a bit ahead of the dolly
  so the near layer leaves the frame quickly.
- After a hard cut you may re-frame far layers (shift them) so the important thing (the volcano's face) shows beside the
  character's head, and shift anything that comes from there (the bag's return path) the same way.
- Screen shake = sums of sines (13.3 + 7.1 Hz ...) times an amplitude envelope (rumble ramp, blast 30 px decaying, small
  bumps on impacts). Never random per-frame jumps.

---------------------------------------------------------------------------------------------------------------------
## 7. Animating cut-out poses

- NEVER cross-fade two drawings (half-transparent ghosts read as a glitch). Swap on a frame where motion hides it:
  - turn: squash scaleX to ~0.8 (scaleY 1.03) about the feet and swap on the narrowest frame;
  - action: anticipation squash (scaleY 0.94, scaleX 1.04) -> swap -> stretch (1.03) settling with a damped spring;
  - throw: swap to the follow-through pose at release; lean snaps from -5 deg to +5 deg and settles;
  - catch: swap to the "holding" pose the frame the flying object reaches the hand, plus a small weight dip.
- Life on holds: breathing (scaleY 1 +- 0.9 % about the feet at ~0.6 Hz), a tremble when scared (1-2 px sines), a small
  bounce on a key word.
- Contact shadow under full-body poses (soft ellipse, rgba(72, 54, 42, 0.26), 3 px blur).

---------------------------------------------------------------------------------------------------------------------
## 8. Props with real physics

- The thrown object is its own sprite with its own depth. Swing: a few frames along an arc over the head (behind the
  head), then a 3D projectile from the hand (Z 1000) to the target (Z 3000): x and z move at constant speed, y follows a
  gravity parabola with the apex at a chosen fraction of the flight (late apex = low arc that stays in frame):
```ts
const g = (2 * (y0 - y1)) / (ta * ta - (T - ta) * (T - ta));   // ta = apex time, T = flight time
const ya = y0 - 0.5 * g * ta * ta;
const y = (tau: number) => ya + 0.5 * g * (tau - ta) * (tau - ta);
```
- Spin it (~1 turn), let perspective shrink it (constant world size, the layer scale does the rest).
- Sinking into a liquid: clip the sprite at the surface line (a wrapper div with overflow hidden whose bottom edge is
  the surface) and keep moving it down with a wobble.
- A return flight ends EXACTLY on the object drawn in the next pose (same centre, width, rotation 0) so the swap is
  invisible.

---------------------------------------------------------------------------------------------------------------------
## 9. Effects in code (flat cartoon look, matching the outlines)

- Liquid lava: flat orange shapes, NO black outline (#FF6A2B, deep edge #E2501E, hot core #FFA445 / #FFC867).
- Smoke / steam: clusters of circles with ONE merged outline: draw every ink circle (r + outline) first, then every
  fill circle. Grow, drift, then SHRINK away (don't fade outlined puffs). White = steam, grey = smoke. Puffs in pulses
  with gaps, different speeds per jet, so they don't read as identical columns.
- Blobs: born in bursts with random angle/speed, gravity, stretched along their velocity, land on the set piece's
  silhouette profile and leave a splat that shrinks.
- Flows: thick round-capped paths revealed along their length (deep colour under, main, hot core on top), routed
  AROUND anything drawn on the surface (eyes).
- An eruption = a "crown" of 9 pulsing lava fingers fanning out of the crater + blob spray + dark smoke + glowing sky.
  NOT one tall column (it looks phallic).
- Glow: radial gradients (crater heat, sky glow) at low opacity; strong orange washes look cheap.
- Faces on objects (the fun part): white ellipses + black pupils + white glint, eyelids as a grey shape clipped to the
  eye with a black lid line (tilt = angry), thick round brows; pop open with an overshoot; blink; look at the action;
  squeeze shut as "> <" (two chevrons), never fully lidded empty rings; smug = half lids + relaxed brows.
- The object can act: inhale (stretch up 6 %) before a blast, squash to 0.9 on the blast with a damped spring back.
- Sweat drop: light-blue teardrop with an outline and a white glint, pops on, slides along the head, pops off.
- Smoke rings read as halos if too light: use mid-grey.

---------------------------------------------------------------------------------------------------------------------
## 10. Sound (all from ElevenLabs)

- Layers in code: the voice (0 dB) + effects (one cue list: file, start time, dB, optional dB keys over time).
- Reuse first: read `sfx-library/index.md`. Reuse a library file only if it really fits the action (the same kind of
  sound, the right length and character); otherwise generate a new one. Every reused file is an ElevenLabs sound from
  an earlier video; copy it into `public/<short>/sfx/` and list it in the report as "reused".
- Every new effect is ElevenLabs Sound Effects v2: `creative_add_flow_node` with node_type `sfx`, model
  `eleven_text_to_sound_v2`, `model_parameters: {"duration_seconds": 0.5-3 (only as long as needed, ~ 11 credits per
  second), "prompt_influence": 0.7, "loop": false}` (`loop: true` only for a bed such as bubbling), prompt
  "Sound effect only, no music, no voice: <one sound: what it is, how it starts and how it ends>". Run them all in one
  `creative_run_flow_nodes` batch with `generations_count: 1`, after an estimate. Typical list: whoosh, swish, thud,
  click, plop, bubbling, steam hiss, rumble, boom.
- Download, judge each file by its waveform (envelope + where the peak is), slice the useful part, peak-normalise to
  -1 dBFS. If an effect is unusable, first try to fix it in code (trim, pitch, reverse, layer two you already have)
  before paying for a new one. Copy every new effect that could serve again into `sfx-library/` with a line in its
  index (file, what it sounds like, length, onset / peak, video, prompt).
- Sync each file by its measured onset (impacts) or peak (whooshes) to the beat. Levels under a voice: whooshes -25 to
  -31 dB, impacts -14 to -19 dB, beds (bubbling, roar) -26 to -33 dB, the big blast -8 to -10 dB inside a pause.
  Check the mix: no clipping, peak around -4 dBFS. No sound may run past the 25 s end: fade the last one out before it.

```tsx
{cues.map((c) => {
  const from = Math.round(c.at * FPS);
  return (
    <Sequence key={c.f + c.at} from={from} layout="none">
      <Audio src={staticFile(`short/sfx/${c.f}.wav`)} volume={(f) => 10 ** (dbAt(c, (from + f) / FPS) / 20)} />
    </Sequence>
  );
})}
```

---------------------------------------------------------------------------------------------------------------------
## 11. Check, improve once, then render (1080x1920, no 4K)

- Contact sheets: stills at every beat (`renderStill`, scale 0.5) in one grid; check frame 0, every swap, every gag,
  the last frame. Fix and re-check.
- Pop scan: render a 0.5x preview MP4, compute the mean frame-to-frame difference (blurred, 270x480) and flag frames
  above 2.2x the local median; every flag must be an intended swap or cut.
- Improvement pass (exactly one; don't publish the first version as it is): look at the contact sheet and the preview
  as a viewer who has never seen it. Write down the 3 weakest moments (a dead hold, a gag that doesn't read, a payoff
  that lands late, a beat off its word, a story event the voice tells but the picture doesn't show, anything that looks
  cheap or AI-made, a hook frame that doesn't read in one second, a LOW-quality picture whose roughness shows) and fix
  them in code. New ElevenLabs spending here only from the reserve, only for a broken picture, and still LOW 1K.
  Re-check those beats. Don't polish beyond this one pass: publishing regularly matters more than perfecting one video.
  Write what you fixed into the "lessons" of memory/STYLE.md.
- Render at the composition size, no upscaling: `npx remotion render src/index.ts <CompId> out/<name>.mp4 --gl=angle
  --image-format=jpeg --jpeg-quality=95 --crf=18 --pixel-format=yuv420p`. Bundle ONCE to a fixed outDir in scripts
  (otherwise Remotion copies public/ into a new temp folder every bundle).
- Verify the file: 1080x1920, 60 fps, duration <= 25.0 s (frame count = duration x 60, <= 1500), audio present and as
  long as the picture, the picture still moves at the very end.

---------------------------------------------------------------------------------------------------------------------
## 12. Rules that keep it looking hand-made

- Frame 0 = the premise, centred, big, readable; the first spoken line names what you see. Motion starts at once.
- Everything centred and balanced when the camera holds; nothing important cut by the frame edge.
- No motion blur, no cross-fades between drawings, no random jitter. Every move eased; the camera glides >= 1 s.
- One focal action at a time; effects stop when their beat is over.
- Same outline weight family everywhere (pictures + code-drawn effects); flat colours, no gradients on characters.
- Every visual sits on its word; the story's ending and the joke land on the last word; the last frame loops to the
  first.
- Real facts only in the voice-over (cartoon exaggeration is fine for what the characters do).

=====================================================================================================================
STEP 3 - PRODUCTION (phase 2, after I approved the idea card)
=====================================================================================================================
Use the "cutout-cartoon-shorts-elevenlabs" skill in STEP 2 and follow it step by step to turn the approved script into
a vertical cartoon Short in the same style as the "Can we throw trash in a volcano?" animation. If an older
"cutout-cartoon-shorts" skill that uses Higgsfield is installed, ignore it.

MY SCRIPT: the voiceover approved in the idea card, word for word.

What I want:

1. Format: vertical 1080x1920 at 60 fps in my Remotion project (studio/). Final file = a 1080x1920 MP4 with the voice
   and the sound effects mixed in. No 4K render and no upscaling. Length follows the voice, but the whole video is
   at most 25 seconds (R7; target 21-24 s).

2. Script: already checked and approved in STEP 1 (told as a story (R10), spoken style, no narrator phrases, no hype
   words, no "!" lines, true facts, the first line names what we see in the first frame). Use it word for word; the
   only exception is the factual-error rule in R3. Put the final lines in the final report.

3. Voice: ElevenLabs, the voice "Mark - Natural Conversations" (voice_id UgBBYS2sOqTuMpoF3BR0), model eleven_v4, one
   take. Get the word times with ElevenLabs Scribe and time every beat to the words. If the take makes the video longer
   than 25 s, fit it as STEP 2 section 3 says (shorter pauses, at most 6 % faster), never by cutting words.

4. Beat sheet: one visual beat per line, landing on the exact word. Frame 0 = the premise, big and centred like a
   thumbnail (the same premise as the cover). The story's doer is the character on screen, and every event the voice
   tells is shown happening. One funny cartoon gag per beat (things can come alive, open their eyes, react, sweat,
   inhale before a blast). The "but" turns of the script are visible turns in the action. The last frame should loop
   back to the first.

5. Pictures: all from ElevenLabs GPT Image 2.5 (gpt-image-2.5-sunburst), always 1K, always quality LOW, one variation
   each. There are no MEDIUM pictures: the hero, every pose and expression, close-ups, the background and the set
   pieces are all LOW 1K (R8). The background is an ElevenLabs picture too. Every cut-out on a flat key colour, keyed
   by code.
   NO REFERENCES, no exceptions: every picture from its text prompt only, nothing wired or uploaded into a generation,
   no image edits, no earlier picture fed back in. The same character and the same flat style in every picture (thick
   black outlines, flat colours) and in every video: use the locked look from memory/STYLE.md if there is one, make the
   hero first, write its measured look into the text description, then make the rest from that text. Check every
   cut-out on a coloured background and fix any glitch before animating.

6. Budget: never more than 900 ElevenLabs credits for the whole video (voice + word times + pictures + sound effects).
   Estimate every run first and keep a ledger. Use the pictures that make the video look as good as possible within
   the rules (all LOW 1K, at most 8 pictures (a 9th only as STEP 2 section 2 allows), one variation each, no 2K / 4K);
   never raise the quality to spend more.

7. Animation in code (Remotion): a smooth 2.5D camera with real depth (close-up -> reveal -> follow the action),
   poses swapped inside motion (squash, anticipation, stretch, never cross-fades), real physics for anything thrown or
   falling, all effects (lava, smoke, steam, splashes, faces, sweat drops) drawn in code in the same flat style,
   depth-of-field blur on close-ups, gentle shake on impacts. Make it fun and alive: characters breathe and react,
   objects get faces when it makes the joke better. No motion blur, no fades between drawings.

8. Sound effects: all made with ElevenLabs (new ones, or ElevenLabs sounds from earlier videos in sfx-library/ when
   they really fit), on their own layer, quiet under the voice and synced to the action (whooshes on throws, plops,
   rumbles, booms in a pause between words).

9. Check before rendering: a contact sheet of every beat + a frame-by-frame pop scan of a quick preview + the one
   improvement pass. Fix anything that looks off.

10. Render the 1080x1920 MP4 on the graphics card, verify it (size, fps, length <= 25 s, sound, no frozen frames), then
    do STEP 4.

Don't stop to ask me questions and don't ask me to connect anything. Choose sensible defaults and tell me at the end
what you chose.

=====================================================================================================================
STEP 4 - COVER, UPLOAD KIT, MEMORY, GIT, FINAL REPORT (phase 2)
=====================================================================================================================
Everything for one video goes to videos/<short>/.

1. Cover (0 credits): a still composition `<CompId>Cover` (1080x1920) made from the video's own sprites: the
   character + the main object + the cover text (1-4 words, big bold letters with a thick black outline in the same
   flat style, at most three objects in total, kept away from the bottom ~20 % and the right edge where the YouTube
   buttons sit). Render it to videos/<short>/cover.png.
2. Upload kit, videos/<short>/upload.md: the chosen title + the 2 other options, the cover text, the description with
   sources and hashtags, the file names. You do not upload anything to YouTube.
3. Files: the final MP4 -> videos/<short>/<short>.mp4 (not committed, see 5); videos/<short>/idea-card.md (the
   approved card); videos/<short>/report.md (the final report).
4. Memory: add the row to memory/VIDEOS_LOG.md (views empty; note in "notes" that it is a <= 25 s STORY video with LOW
   pictures, so later stats can compare it with the older 20-30 s MEDIUM videos and the <= 20 s fact-shaped LOW
   videos); update memory/IDEA_BANK.md (used / new); memory/STYLE.md (the locked look if this was the first video, plus
   3-5 lessons: what looked good, what glitched, what to do differently next time, including how the LOW pictures held
   up and how the story shape worked); the "Found by Claude" section of memory/COMPETITORS.md; sfx-library/ + its
   index.
5. Git: cartoon-shorts/.gitignore excludes studio/node_modules/, the bundle outDir, studio/out/, */raw/ and *.mp4
   (videos are sent to me instead, so the repository stays small). Commit everything else in cartoon-shorts/ on your
   working branch and push it. Then put the same commits on main so the next session finds the memory (I give my
   explicit permission for this, for changes inside cartoon-shorts/ only): `git fetch origin main && git rebase
   origin/main && git push origin HEAD:main`. If the push to main is refused, leave it on the branch and say so in the
   report. Retry network failures up to 4 times (2 s, 4 s, 8 s, 16 s).
6. Send me the MP4 and the cover PNG as files.
7. Final report, in Ukrainian: the final script lines; the voice (and whether it had to be fitted to 25 s, how); the
   final video length; the beat table (time / words / picture / gag / sound); the pictures (list, all LOW 1K, with
   aspect ratios); the sound effects (new / reused); the credit ledger with the total; what the improvement pass
   changed; the upload kit (title, cover text, description, hashtags); the ElevenLabs flow link; the command to open
   the project in Remotion Studio (`cd cartoon-shorts/studio && npx remotion studio`); where all the files are; what
   was written to memory; the branch / main push result; any fallback you used and why.
