import subprocess, sys, numpy as np
def load(p, sr=48000):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(sr),"-"],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
for p in sys.argv[1:]:
    a = load(p)
    hop = 2400  # 50 ms
    n = len(a)//hop
    db = [20*np.log10(np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2))+1e-9) for i in range(n)]
    pk = np.argmax(np.abs(a))/48000
    on = next((i*0.05 for i,d in enumerate(db) if d > max(db)-20), 0)
    print(f"{p}: dur {len(a)/48000:.2f}s peak@{pk:.2f}s onset~{on:.2f}s max {max(db):.1f}dB")
    print("   ", " ".join(f"{d:.0f}" for d in db[:80]))
