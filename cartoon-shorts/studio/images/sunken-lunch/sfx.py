# sfx.py - new sound effects with ElevenLabs Sound Effects v2 (REST /v1/sound-generation), one generation each, no retries.
import json, os, urllib.request
SFX = {
 'cable_snap': (1.2, "Sound effect only, no music, no voice: a thick steel cable under heavy load twangs with a low metallic wobble and then snaps with one sharp loud metallic crack and a quick whip-like whoosh, then silence."),
 'sub_splash': (1.6, "Sound effect only, no music, no voice: a small heavy submarine drops into the sea: one big deep belly-flop splash, a heavy water whoomp, then spray falling back with fizzing foam."),
 'fridge_open': (1.0, "Sound effect only, no music, no voice: an old refrigerator door is pulled open: a soft rubber-seal suction pop, a small rattle of glass bottles inside, then a low steady electric fridge hum."),
 'germ_feast': (1.6, "Sound effect only, no music, no voice: a swarm of tiny cartoon creatures devouring a sandwich very fast: rapid tiny crunchy chomps and squeaky munching, getting faster and frantic."),
 'fish_flop': (0.7, "Sound effect only, no music, no voice: a small wet fish flopping on a hard metal surface: two quick wet slaps and a tiny splash."),
}
log = json.load(open('sfx_log.json')) if os.path.exists('sfx_log.json') else {}
for name, (dur, prompt) in SFX.items():
    if os.path.exists(f'sfx_raw/{name}.mp3'):
        print(name, 'exists'); continue
    body = {'text': prompt, 'duration_seconds': dur, 'prompt_influence': 0.7, 'loop': False, 'model_id': 'eleven_text_to_sound_v2'}
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read(); cost = {k: v for k, v in r.headers.items() if 'cost' in k.lower()}
    open(f'sfx_raw/{name}.mp3', 'wb').write(data)
    log[name] = dict(dur=dur, prompt=prompt, headers=cost, bytes=len(data)); print(name, dur, cost, len(data))
    json.dump(log, open('sfx_log.json', 'w'), indent=1)
