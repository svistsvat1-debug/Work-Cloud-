"""srt.py WORDS_JSON OUT_SRT - YouTube caption file from the whisper word times, using the exact script text
(whisper's own punctuation/case replaced). Caption chunks break on punctuation or after 4 words / 1.7 s."""
import json, re, sys

SCRIPT = ("Some viruses, called phages, kill bacteria but can't infect people. So why don't doctors use them instead "
          "of antibiotics? They did. Before antibiotics even existed. But each phage kills only certain types of "
          "bacteria, so every infection needed the right match. Antibiotics killed many kinds at once, so Western "
          "doctors mostly dropped phages. Now that more bacteria resist antibiotics, doctors are testing phages again.")
VO_AT = 0.1
norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
words = json.load(open(sys.argv[1]))["words"]
tokens = SCRIPT.split()
assert [norm(w["w"]) for w in words] == [norm(t) for t in tokens], "transcript and script differ - check words.json"
chunks, cur = [], []
for tok, w in zip(tokens, words):
    cur.append((tok, w["s"] + VO_AT, w["e"] + VO_AT))
    if tok[-1] in ".,?!" or len(cur) >= 4 or cur[-1][2] - cur[0][1] > 1.7:
        chunks.append(cur)
        cur = []
if cur:
    chunks.append(cur)
ts = lambda t: "%02d:%02d:%02d,%03d" % (t // 3600, t % 3600 // 60, t % 60, round((t % 1) * 1000) % 1000)
with open(sys.argv[2], "w") as f:
    for i, c in enumerate(chunks, 1):
        start = max(0.0, c[0][1] - 0.05)
        end = chunks[i][0][1] - 0.07 if i < len(chunks) and chunks[i][0][1] - c[-1][2] < 0.4 else c[-1][2] + 0.25
        f.write(f"{i}\n{ts(start)} --> {ts(end)}\n{' '.join(t for t, _, _ in c)}\n\n")
print(len(chunks), "captions ->", sys.argv[2])
