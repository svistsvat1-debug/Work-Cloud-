# Generates per-scene Ukrainian voiceover + sentence timings (timing.json / build/timing.js)
import json, subprocess, os
os.makedirs('audio', exist_ok=True)
s = json.load(open('script.json')); out = []
for i, t in enumerate(s):
    f = f"audio/s{i:02d}.mp3"
    subprocess.run(["python3", "tts.py", "uk-UA-OstapNeural", t, f, "+15%"], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
    out.append({"text": t, "dur": d, "sent": json.load(open(f + ".json"))})
json.dump(out, open("timing.json", "w"), ensure_ascii=False, indent=1)
open("build/timing.js", "w").write("const TIMING=" + json.dumps(out, ensure_ascii=False) + ";")
print("speech total", sum(o["dur"] for o in out))
