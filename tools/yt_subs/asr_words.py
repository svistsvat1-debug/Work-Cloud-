import sys, json, wave, numpy as np, sherpa_onnx
d = sys.argv[1]
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=f"{d}/encoder.int8.onnx", decoder=f"{d}/decoder.int8.onnx",
    joiner=f"{d}/joiner.int8.onnx", tokens=f"{d}/tokens.txt",
    num_threads=4, model_type="nemo_transducer")
with wave.open(sys.argv[2]) as w:
    sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
cfg = sherpa_onnx.VadModelConfig()
cfg.silero_vad.model = sys.argv[3]
cfg.silero_vad.min_silence_duration = 0.25
cfg.silero_vad.max_speech_duration = 20
cfg.sample_rate = sr
vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=60)
segs = []
ws = cfg.silero_vad.window_size
for i in range(0, len(a), ws):
    vad.accept_waveform(a[i:i+ws])
    while not vad.empty():
        segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
vad.flush()
while not vad.empty():
    segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
out = []
for k, (st, samp) in enumerate(segs):
    pad = np.zeros(int(0.3 * sr), dtype=np.float32)
    s = rec.create_stream(); s.accept_waveform(sr, np.concatenate([pad, samp, pad]))
    rec.decode_stream(s)
    r = s.result
    off = st / sr - 0.3
    out.append({"start": st / sr, "end": (st + len(samp)) / sr, "text": r.text,
                "tokens": r.tokens, "ts": [t + off for t in r.timestamps],
                "dur": list(getattr(r, "durations", []) or [])})
    print(k, round(st / sr, 1), r.text[:80], file=sys.stderr, flush=True)
json.dump(out, open(sys.argv[4], "w"))
