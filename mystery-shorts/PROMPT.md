SOURCE:
MY IDEA:
STATS:
REFERENCE:

(SOURCE = a link to a long video from my source channel Top 5 Unknowns (memory/SOURCE.md), optionally with the time
range of the story I want, e.g. "https://youtu.be/xxxx 12:40-15:10"; leave it empty and you pick the next unused
story yourself (MODE B).
MY IDEA = my own idea for this video, any language, one line is enough; leave it empty if I have none. If SOURCE is
filled too, MY IDEA tells you which story of the source video to use.
STATS = optional, views of my published Shorts, e.g. "mary celeste - 120k; dyatlov - 3k".
REFERENCE = optional: a link to a proven viral Short whose STRUCTURE the script should follow, and/or its transcript.)

=====================================================================================================================
HOW THIS CHANNEL WORKS (3 phases, 2 stops)
=====================================================================================================================
PHASE 1 - you: idea + script -> IDEA CARD -> STOP 1 (I approve).
PHASE 2 - you: the voiceover text + the IMAGE PACK (one prompt per picture) -> STOP 2 (I record the voice myself in
          Google AI Studio and generate every picture myself, then send them to you).
PHASE 3 - you: check my files -> cut-outs -> animation in code -> music in code -> sound effects (library first,
          ElevenLabs Sound Effects only when needed) -> render -> cover, upload kit, memory, git, report.
You never generate pictures or the voice yourself.

=====================================================================================================================
RUN RULES - read these first. They override anything below that says otherwise.
=====================================================================================================================

R1. CHANNEL AND LANGUAGES. My channel is [CHANNEL NAME - MISSING, ask me once and save it in memory/STYLE.md]: short
paper cut-out animated Shorts that tell real unexplained mysteries, strange true stories and creepy history. One niche:
mysteries. The video, the voiceover, the titles, the cover text and the description are in English. Everything you
write to me in chat (cards, the image pack instructions, the report) is in Ukrainian; prompts, voiceover text and
memory files stay in English.

R2. WHERE THE IDEA COMES FROM. In this order:
  a) SOURCE filled -> MODE S with that video (STEP 1V).
  b) MY IDEA filled (SOURCE empty) -> MODE A with my idea.
  c) Both empty, but I wrote a not-yet-made video idea earlier in this conversation -> MODE A with the latest one (an
     idea you proposed counts only if I approved it).
  d) Nothing -> MODE B: the next unused story from the source channel (STEP 1B), then as MODE S.
  In MODE S and MODE A you never research or propose other topics.

R3. STOPS.
  STOP 1: PHASE 1 ends with the IDEA CARD (STEP 1E). Spend 0 ElevenLabs credits, build nothing. My reply:
   - "так" / "ок" / "ok" / "yes" / "go" / "давай" / "+" = approved -> PHASE 2 with exactly the approved voiceover;
   - edits -> apply them, re-check any fact they touch, send the updated card, stop again;
   - "№2" / "№3" -> the full card for that backup, stop again;
   - a new idea or a new SOURCE link -> start again (R2).
  STOP 2: PHASE 2 ends with the VOICE TEXT + IMAGE PACK (STEP 2). Spend 0 credits, then wait for my files.
  PHASE 3 starts when my files arrive (the voice file + the pictures, attached in chat or in a Google Drive folder I
  name). From then on run unattended to the end: never ask me anything, never ask me to connect or log in to anything,
  choose sensible defaults and explain them in the report. One exception: if a picture the story needs is missing or
  unusable (wrong subject, no green background on a cut-out, a different-looking character) and code can't work
  around it, send ONE short list of the pictures to redo (number + what is wrong + the same prompt, fixed) and stop
  once more; everything else you fix or work around yourself.
  After approval the voiceover is frozen: no rewording, no new topic. If you find a factual error later, change the
  fewest words needed and tell me before I record (in PHASE 2) or in the report (PHASE 3).

R4. ONE VIDEO PER APPROVED IDEA. Before PHASE 2, check this conversation, memory/VIDEOS_LOG.md and
memory/SOURCE_LOG.md: if this story was already made, tell me instead of making it again.

R5. REPOSITORY. Everything lives in svistsvat1-debug/Work-Cloud-, folder mystery-shorts/ (all paths below are relative
to it). Never change anything outside mystery-shorts/ (you may READ ../cartoon-shorts/sfx-library/ to reuse sounds).
The repository is public: never commit keys, tokens, emails, my pictures, my voice, rendered videos or anything
downloaded from the source video (all of that stays in work/ and inputs/, which are git-ignored). If the repository
is not attached, try add_repo with push access once; if refused, work locally and say in the report that the memory
was not saved.

R6. LENGTH. The final video is 30-45 seconds (hard cap 45.0 s), target 35-40 s. Narration 75-95 words. Estimate the
speech length at ~2.3 words per second (my Google AI Studio voice with its natural pauses, measured on the test; use
the newest "voice pace" in memory/STYLE.md): the estimate in the card must be <= 42 s.

R7. BUDGET. ElevenLabs is used only for NEW sound effects: at most 200 credits per video (hard cap; estimate every run
first, generations_count 1, stop at 180). Reuse library sounds first (both sfx-libraries) whenever they really fit.
Music is made in code (0 credits). No ElevenLabs voice, pictures or music, ever.

R8. STORY, NOT A LIST OF FACTS (hard rule): the voiceover is a short story told as if it is happening right now, not a
list of facts and not a biography. Someone (a doer) is in a scene, wants or finds something, something is wrong, and
the ending is the reveal or the unsolved question. Facts are EVENTS of the story. Details: STEP 1C.

R9. TRUTH AND RESPECT (hard rule, also protects the channel on YouTube):
  - Real facts only, verified with reliable sources (STEP 1C). The source video is NOT a fact source (R11).
  - Paranormal and legend claims are told as claims: "the crew swore...", "witnesses say...", "the legend says...",
    never as proven facts. Keep what is unknown unknown; never invent a solution.
  - True crime: no gore, no graphic violence, no weapons in focus, no victims' suffering shown or described in detail,
    no named private victims who are minors, no speculation about real living people presented as fact. Prefer
    mysteries and unexplained events over violent crime. Skip suicide and harm to children entirely.
  - Pictures follow the same rule: eerie, never graphic.

R10. ONE SOURCE CHANNEL. Ideas come from the long videos of ONE source channel in memory/SOURCE.md: Top 5 Unknowns
(most videos hold 5 stories = up to 5 Shorts per video). Never take a source video from another channel; if SOURCE is
from another channel, say so in a short card and stop.

R11. THE SOURCE VIDEO IS AN IDEA, NOT MATERIAL (hard rule): nothing from it goes into my Short (no footage, frames,
audio, music, sentences, title, thumbnail idea). Its frames are only looked at to understand the story. Every claim is
re-verified. My script shares no sequence of 5+ consecutive words with its transcript (check in code). The hook is
stronger than the way the source video introduces the story.

R12. STRUCTURE OF A PROVEN SCRIPT, NEVER ITS WORDS: each script is built on the structure, pacing and storytelling of
a proven viral Short (REFERENCE, a winner in memory/STRUCTURES.md, or one you find: 1M+ views or 3x the channel's
usual), adapted to my story and R8; only the shape is copied, never the words. Details: STEP 1S.

R13. LOCKED LOOK. Every picture prompt uses the locked paper cut-out style in memory/STYLE.md word for word
(PAPER_STYLE, MOOD, KEY). Never another style. Read STYLE.md (blocks + lessons) before writing any prompt or code.

=====================================================================================================================
STEP 0 - CHANNEL MEMORY (first, in phase 1)
=====================================================================================================================
Memory is in memory/ on the branch main: `git fetch origin main` and rebase your working branch onto origin/main
before reading. Create any missing file with the columns shown in it.
- memory/SOURCE.md - the source channel (R10).
- memory/SOURCE_LOG.md - analysed source videos and their story map (used / left). Links and one-liners only.
- memory/VIDEOS_LOG.md - one row per finished video (incl. the voice name I used and views from STATS).
- memory/IDEA_BANK.md - unused candidate stories (with "source: <link> <time range>").
- memory/STYLE.md - the locked look, measured numbers, voice pace, lessons.
- memory/STRUCTURES.md - proven script structures (map + link only, never a transcript).
- memory/COMPETITORS.md - mine, read-only for you except the "Found by Claude" section.
- sfx-library/ + sfx-library/index.md - this channel's ElevenLabs sounds; ../cartoon-shorts/sfx-library/ (read-only)
  has 100+ more.
If STATS is filled, write the views into VIDEOS_LOG.md and commit + push the memory right away. Then work out what
works: a video with >= 3x the median views (3+ videos with views) is a winner and its theme a winning theme; a theme
tried 2+ times far below the median is weak. One line about it goes into the card ("not enough data yet" is fine).

=====================================================================================================================
STEP 1 - IDEA, SCRIPT, PACKAGING (phase 1, ends with the IDEA CARD and STOP 1)
=====================================================================================================================

1V. SOURCE VIDEO ANALYSIS (MODE S, and MODE B after 1B). Work in work/<video-id>/. Free tools only.
1. `yt-dlp -J --skip-download <url>`: check the channel (R10), read title, length, views, date, description, chapters.
   If SOURCE_LOG.md already has this video, reuse its story map and go to point 5.
2. Transcript: youtube-transcript-api (English, with timestamps); else `yt-dlp --skip-download --write-auto-subs
   --sub-langs "en.*"`; else a public transcript page; vidIQ transcript only as the last fallback (vidIQ credits,
   at most 2 calls, say how many in the card). Never pretend you read a transcript you didn't get.
3. Visual pass, frame by frame: download a small copy (`yt-dlp -f "bv*[height<=360]"`), take a frame at every scene
   change plus one every 3 s with ffmpeg, tile into contact sheets with timestamps and look at them; for the chosen
   story one frame every 1 s. If the download is blocked: the YouTube storyboards (`-f sb0`); else thumbnail +
   chapters only ("visual pass not available" in the card). Note per story what is shown and the strongest image.
4. Story map: split the video into its stories (usually 5). Per story: time range | what happens | the mystery | the
   answer or "unsolved" | who the doer would be | how many locations / characters it needs | how easy it is in paper
   cut-out | R9 risk (none / low / skip).
5. Pick the story: the time range in SOURCE, or the one MY IDEA points to; otherwise score each 1-5 on: curiosity,
   surprise or chill of the ending, works as a story (doer, goal, turn, ending), easy to show with 8-12 pictures,
   verifiable facts, R9-safe, fit with what works on my channel, fits 30-45 s, not used yet. Best wins; the next two are
   №2 and №3. Write the story map to SOURCE_LOG.md and the other good stories to IDEA_BANK.md.
6. Then: verify the facts independently (1C), pick the structure model (1S), write the script (1C), packaging (1D),
   card (1E), STOP.

1A. MODE A - my idea: research only my idea; verify it; if it is wrong or unsupported, say so and propose the closest
true version of the SAME idea. If the source channel has a video on it, you may analyse it with 1V. Then 1S, 1C, 1D,
1E, STOP.

1B. MODE B - pick the next story yourself, only from the source channel:
1. Unused good stories already in SOURCE_LOG.md / IDEA_BANK.md come first.
2. Otherwise list the channel's videos for free (`yt-dlp --flat-playlist --print "%(id)s|%(title)s|%(view_count)s|
   %(duration)s" https://www.youtube.com/@top5unknowns/videos`) and choose: (a) the next episode of a winning theme on
   my channel (a new story someone who liked the winner wants next, never a copy); (b) a topic that is trending now
   (anniversary, news, season), only with solid facts; (c) the most-viewed unused video. Skip used and rejected ones.
3. Analyse it with 1V. Never claim you checked previous ideas if you couldn't.

1S. STRUCTURE MODEL (every mode): pick the model in this order: REFERENCE; a winning structure in STRUCTURES.md or my
own winner; or find one (most-viewed mystery / creepy story Shorts, 1M+ views or 3x the channel's usual, 20-60 s, told
as a story). Get its transcript for free (pasted text, captions, transcript page). Write its STRUCTURE MAP: length,
words, words per second, sentences and average length, hook type and seconds, point of view and tense, first turn
(s and %), number of turns, reveal (%), ending type (reveal / unsolved question / twist / callback) and how it loops,
rhythm tricks, one line on why it holds viewers. Map it onto my story at 30-45 s keeping its proportions; 1C and R8 win
where they disagree. Originality: no 5+ word overlap with the model or the source transcript. Save map + link to
STRUCTURES.md (never the transcript).

1C. SCRIPT RULES
Facts: verify the central facts with reliable sources (original records, newspapers of the time, museums,
universities, government archives, established encyclopedias); cross-check; no invented names, dates, numbers, quotes
or consequences; keep uncertainty where it exists (R9).
Length: R6 (75-95 words, estimate <= 42 s at ~2.3 words/s).
Story (R8):
- A DOER IN A MOMENT: start inside the scene, not with a date, a name or a definition: "A ship drifts across the
  Atlantic with nobody at the wheel." The first line names what the first frame shows.
- THE VIEWER IS THERE: what the doer sees, hears, finds; a question the viewer needs answered pulls them to the end.
- EVENTS, NOT STATEMENTS: every sentence is something that happens. At most one "because" line. At most two numbers,
  each as a moment.
- TIME MOVES FORWARD: each sentence follows from the one before (but / so / then they find). If two sentences can
  swap places, it is a list: rewrite.
- PRESENT TENSE for the main line, also for history.
- THINGS YOU CAN SEE AND HEAR: concrete objects, places, sounds the paper animation can show.
- MYSTERY SHAPE: hook (0-3 s, the strange thing) -> what they find / try -> the detail that makes it impossible or
  wrong ("but") -> the strongest clue or the official answer -> ending = the reveal or the open question, short and
  chilling, which loops back to the first line.
- NO biography, no "Let me tell you", no "Imagine", no "Did you know", no hype words (incredible, shocking, insane,
  terrifying), no "!" lines, no calls to action. Spoken, plain English with short sentences. Pauses can be marked
  with "..." where the voice should breathe before a reveal (at most 2).
Checks before the card: story check (doer + what they want/find; every sentence an event?; can two swap?; does the
last line END the story?; does it sound like a biography?), structure check vs the model, the connector chain
(but / so / because, never "and then"), R9 check (claims framed as claims, nothing graphic), originality check.

1D. PACKAGING (text only now; the cover is made in phase 3)
- 3 titles in English, <= 60 characters, proven mystery shapes ("Why was this ship found empty?", "Nobody can explain
  what happened on...", "The ... that was never solved"); no clickbait lies. Mark your pick.
- Cover text: 1-4 words that add something the title doesn't say ("10 people. Gone."). Never repeat the title.
- At most three things on the cover: the main subject, one detail, the cover text.
- Frame 0 of the video shows the same premise as the cover.
- Description: 1-2 plain sentences + the fact sources (not the source video) + 3-5 hashtags (#shorts #mystery + topic).

1E. IDEA CARD -> STOP 1. In Ukrainian (script, titles, cover in English):
 1. Idea source and the story in one sentence.
 2. Source video: link, title, views, chosen story's time range, transcript source, visual pass method + strongest
    image, story map in short ("5 stories, M used, K left"), claims that didn't hold, vidIQ credits used.
 3. Why it should work (what works on my channel, source views, trend).
 4. The full voiceover, ready to record (exactly the text I will record later).
 5. Word count and estimated length (<= 42 s speech, <= 45 s video).
 6. Story check answers + R9 check.
 7. Structure model: link, channel, views, transcript source, its map, my map next to it, originality result.
 8. Connector chain.
 9. Shot plan in short: per sentence, what is on screen (this becomes the image pack).
10. Planned picture count (8-12) and planned sound effects (reused vs new, estimated credits <= 200).
11. Packaging: 3 titles (pick marked), cover text, description with hashtags.
12. Fact sources (links).
13. Backups №2 and №3 (one line each, with time ranges).
End with: "Відповідай «так», і я дам текст для озвучки та промпти для картинок, або напиши правки / «№2» / «№3»."

=====================================================================================================================
STEP 2 - VOICE TEXT + IMAGE PACK (phase 2, ends with STOP 2)
=====================================================================================================================
Send in this order:

A) THE VOICEOVER TEXT: the approved voiceover alone, in its own code block, nothing else in that block (I paste it
   straight into Google AI Studio). Under it, in a separate small code block, an optional one-line voice direction
   ("Read as a calm, low, suspenseful narrator telling a true story at night; steady pace, short pauses, a longer pause
   before the last line; no over-acting."). Ask me to send the file as WAV (or MP3) and to tell you the voice name
   once (save it in memory/STYLE.md).

B) THE IMAGE PACK: 8-12 pictures, planned from the shot plan so that every sentence that names a new thing has its
   picture (lesson 6 in STYLE.md). Each picture:
   - a number and a file name: 01_bg_<place>, 05_char_<who>_<pose>, 08_prop_<thing>, 10_fg_<layer>...;
   - the aspect ratio: backgrounds 9:16; characters 2:3; props 1:1 or 3:2; foreground layers 3:2;
   - one line in Ukrainian: what it is for in the video;
   - the full prompt in English in its OWN code block, self-contained (the style blocks pasted in, not referenced).
   Prompt rules:
   - Backgrounds: the place, empty of characters, open space where the character will stand + PAPER_STYLE + MOOD,
     9:16, one warm mustard light source if it fits.
   - Characters: a CHARACTER block written once (who, age, hair/beard, clothes with colours from the palette, one
     distinctive item) and pasted word for word into every pose of that character; pose + expression (simple paper
     face: dot eyes, small eyebrows, mouth) + "full body, three-quarter view facing right" + PAPER_STYLE + KEY.
     2-4 poses per main character (e.g. neutral/curious, discovers, scared/reacts); poses that must swap need the same
     framing and size.
   - Props that move or matter (a letter, a door, a lantern, a footprint): alone + PAPER_STYLE + KEY.
   - Foreground layers for depth (waves, fog, branches, grass, rain-streaked window frame): wide strip + PAPER_STYLE +
     KEY.
   - Never anything graphic (R9); no text in pictures (titles and labels are added in code).
   Instructions to me (in Ukrainian, short): generate pose 1 of each character first, then use it as a reference
   picture for that character's other poses in your tool; use the largest size your tool offers (1080x1920 or more);
   keep the green background flat; send all files + the voice file in one message (or a Google Drive folder name);
   file names don't matter, I recognise pictures by content.
End with: "Згенеруй картинки й озвучку та надішли сюди. Далі я все зроблю сам."
Spend 0 credits in phase 2. Write the pack to videos/<short>/image-pack.md (prompts only) for memory.

=====================================================================================================================
STEP 3 - PRODUCTION (phase 3, unattended)
=====================================================================================================================
The reference implementation of this style is engine/ (made and approved on the Mary Celeste test): key.py (green
key), style_test_render.py (layers, parallax camera, stepped motion, glows, rain, dust, grain, vignette, pose swap,
match cut, loop ending), style_test_audio.py (music synth, ambience, library SFX, ducking, mix). Reuse and improve it;
move shared code into engine/lib.py as it grows; the video's own script goes to videos/<short>/render.py.

1. INPUTS. Copy my files to work/<short>/src/ (attached files are saved by Claude Code under ~/.claude/uploads/; a
   Drive folder: download with the Google Drive connector). Make a labelled contact sheet and identify every picture by
   CONTENT, not by file name; map them to the pack numbers. Check: count, size (note if < 1080 px wide), green
   background on cut-outs, the same character across poses (lesson 1), the palette, nothing graphic. Fix in code what
   can be fixed (crop, colour-match a pose to the CHARACTER block colours, hide a mismatch inside a swap or a cut);
   only if a needed picture is unusable: the one redo list (R3).
2. VOICE. Measure the length. Word times locally and free: faster-whisper "small.en", word_timestamps=True, audio
   passed as a 16 kHz numpy array (passing a file path breaks with the installed av version); pauses by loudness (RMS
   every 20 ms, < -42 dB for >= 0.18 s). Write the measured pace into memory/STYLE.md ("voice pace"). If the video
   would be over 45 s: shorten pauses > 0.35 s to 0.25 s, then up to 6 % faster with atempo; never cut words.
   Compare the transcript with the approved text and report any word I recorded differently.
3. CUT-OUTS. engine/key.py (greenness thresholds 0.18 / 0.32, despill, specks < 200 px removed); QA sheet on magenta
   and dark blue; fix fringes; mirror a character if the staging needs it.
4. BEAT SHEET. One beat per sentence (more for long ones), on the exact word: every thing the voice names is on screen
   when it is named; the "but" is a visible turn (light changes, a pose swap, a sound, a camera stop); the reveal or
   the open question is the strongest image; frame 0 = the premise (= the cover); the last frame loops to frame 0.
   Something moves in the first 0.5 s. Write the table: time / words / picture / motion / light / sound / music part.
5. ANIMATION (code, the approved paper look):
   - 1080x1920, 24 fps; objects move on twos (12 fps steps), the camera moves smoothly with easing.
   - Layers at depths with parallax (background 0.85-1.0, characters 1.1-1.15, foreground 1.25); camera zoom always
     clamped to the background edges (lesson 2); push-ins on key words, slow drifts on holds, never a dead hold.
   - Paper drop shadows under every cut-out; screen-blend glows for lamps, windows, the moon; flicker on twos;
     vignette; paper grain alternating every 2 frames.
   - Weather and particles in the palette: rain strips, dust in light, fog, snow, embers, as the story needs.
   - Characters: walk-ins with a step bob and a slight tilt, breathing on holds, pose swaps hidden by a squash or a
     cut, never a cross-fade between two drawings; a tremble when scared.
   - Transitions: hard cuts on sentence boundaries, match cuts through light or shape (lesson 3), a torn-paper wipe at
     most once; screen shake only on the big beat.
   - Text on screen only where it helps (a date, a place, a key number) on a torn cream paper strip, never covering the
     subject, never in the bottom 20 % or the right edge.
6. MUSIC (code, 0 credits; extend style_test_audio.py): dark ambient in a minor key (D or E minor): a low drone with
   slow beating, a sparse music-box / celesta melody (minor + one harmonic-minor note for unease), a heartbeat or a
   stop before the "but", a rising tension cluster before the reveal, a deep hit on the reveal word, a soft bell on the
   loop-back. Bed RMS 15 dB under the voice RMS (owner's choice, louder than the first test), ducked -5 dB under words,
   reverb 15-20 %, faded out in the last 0.4 s, nothing past the end.
7. SOUND EFFECTS. Ambience beds in code (sea, wind, room tone). Library first (sfx-library/ and
   ../cartoon-shorts/sfx-library/; the test reused rain, rope_creak, wave_crash, glide, creak, curse, flame_out,
   boom_low, thunder). New effects only when nothing fits: ElevenLabs Sound Effects v2 (`eleven_text_to_sound_v2`,
   duration 0.5-3 s, prompt_influence 0.7, prompt "Sound effect only, no music, no voice: <one sound>"), estimate first,
   generations_count 1, ledger in videos/<short>/credits.md, total <= 200 (R7). Add every new sound to
   sfx-library/ + index.md. Levels: impacts -12 to -20 dB, creaks/whooshes -24 to -31 dB, beds -20 to -32 dB, big hits
   inside a pause. Peak around -4 dBFS, no clipping.
8. CHECK, IMPROVE ONCE, RENDER. Contact sheet of every beat + frame 0 + last frame; pop scan of a preview; one
   improvement pass on the 3 weakest moments (dead hold, a named thing not on screen, a beat off its word, a mismatch
   between poses, music fighting the voice, a too-dark frame); then the final render: H.264 crf 18, yuv420p, AAC 192k.
   Verify: 1080x1920, 24 fps, <= 45.0 s, audio as long as the picture, motion until the last frame.

=====================================================================================================================
STEP 4 - COVER, UPLOAD KIT, MEMORY, GIT, REPORT (phase 3)
=====================================================================================================================
1. Cover (1080x1920 PNG) from the video's own pictures: the premise frame + the cover text in big cream letters on a
   torn paper strip with a soft shadow, at most three things, away from the bottom 20 % and the right edge ->
   videos/<short>/cover.png.
2. videos/<short>/upload.md: chosen title + 2 options, cover text, description with sources and hashtags.
3. videos/<short>/idea-card.md (approved card), image-pack.md, render.py, report.md. The MP4, my pictures and my voice
   stay out of git (work/, inputs/, *.mp4, *.wav, *.jpg are ignored).
4. Memory: VIDEOS_LOG.md (row with views empty, the voice name, the source + story, the structure model), SOURCE_LOG.md
   (story marked used, stories left), IDEA_BANK.md, STYLE.md (voice pace + 3-5 new lessons), STRUCTURES.md,
   COMPETITORS.md "Found by Claude", sfx-library/ + index.md.
5. Git: commit everything in mystery-shorts/ on your working branch and push; then put the same commits on main so the
   next session finds the memory (my explicit permission, for mystery-shorts/ only): `git fetch origin main && git
   rebase origin/main && git push origin HEAD:main`. If refused, leave it on the branch and say so. Retry network
   failures up to 4 times (2, 4, 8, 16 s).
6. Send me the MP4 and the cover PNG as files.
7. Report in Ukrainian: final script; source video + story (time range) and how many stories are left; structure
   model; voice (name, measured pace, any fitting, words recorded differently); final length; beat table; pictures
   used (and any fixes or workarounds); sound effects (reused / new) and the credit ledger; music settings and level;
   what the improvement pass changed; upload kit; where the files are; what went to memory; push result.
