# Voice phrase/word times measured on the raw ElevenLabs take (silence detection, -40 dB / 0.18 s),
# word times inside a phrase estimated by syllables. Output = raw + 0.1 s lead-in, + PAUSE after "ring finger".
import json
LEAD, CUT, PAUSE = 0.10, 15.35, 1.63
raw = {
 "put":0.19,"table":1.05,"do":2.09,"this":2.90,"palm":3.81,"down":4.15,"fold":5.02,"under":5.95,"foldEnd":6.42,
 "lift":6.91,"thumb":7.25,"easy1":8.02,"index":9.06,"easy2":10.05,"pinky":10.94,"easy3":11.81,"easy3End":12.35,
 "now":12.81,"ring":14.15,"finger":14.50,"ringEnd":15.17,
 "chuckle":15.54,"stuck":16.10,"most":16.99,"mostEnd":18.02,
 "share0":18.42,"share":19.90,"muscle":20.30,"tied0":20.94,"tied":21.75,"tiedEnd":22.41,
 "so":22.87,"holds":24.05,"down2":25.10,"like":25.87,"leash":26.15,"leashEnd":26.55,
 "backup0":26.99,"pinky2":27.55,"backup":28.05,"muscles":28.45,"backupEnd":28.94,
 "doesnt0":29.29,"doesnt":29.85,"doesntEnd":30.27,
 "could":30.65,"liftIt":30.95,"couldEnd":31.29,"comment":31.68,"yes":32.15,"no":32.50,"voiceEnd":32.84,
}
O = lambda t: round(t + LEAD + (PAUSE if t >= CUT else 0), 3)
T = {k: O(v) for k, v in raw.items()}
T["pause0"] = O(raw["ringEnd"]); T["pause1"] = O(raw["chuckle"])
T["cutTop"] = round(T["share0"] - 0.12, 3); T["cutFront"] = round(T["could"] - 0.10, 3)
T["end"] = round(T["voiceEnd"] + 0.75, 3)
json.dump({"LEAD":LEAD,"CUT":CUT,"PAUSE":PAUSE,"T":T}, open("src/timeline.json","w"), indent=1)
print(json.dumps(T))
