# snap.py words.json - clean "(2)" variants and snap word edges to the loudness pauses (trust pauses over alignment)
import json, re, sys, subprocess
P = [(1.92,2.44),(3.52,3.94),(6.74,7.20),(7.76,8.20),(11.60,12.02),(14.06,14.62),(17.30,17.84),(19.46,20.02),
     (20.64,21.06),(22.28,22.64),(24.04,24.66),(25.96,26.58),(27.42,28.00)]
W = json.load(open(sys.argv[1]))
for w in W:
    w["w"] = re.sub(r"\(\d\)", "", w["w"])
    for a, b in P:
        if w["start"] < a < w["end"]: w["end"] = a          # word runs into a pause -> ends where silence starts
        if a <= w["start"] < b: w["start"] = b              # word starts inside a pause -> starts where it ends
W[-1]["end"] = 29.16                                       # last loud frame
json.dump(W, open(sys.argv[1], "w"), indent=1)
print(" ".join(f'{w["w"]}@{w["start"]:.2f}' for w in W))
