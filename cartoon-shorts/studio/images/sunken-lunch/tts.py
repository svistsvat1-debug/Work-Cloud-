# tts.py - the approved voiceover, ElevenLabs REST (session proxy injects the key): Liam, eleven_v4, plain text, ONE take.
# Writes ../../public/sunken-lunch/vo/take1.mp3 + tts_alignment.json (character times of the exact text sent).
import json, base64, urllib.request, os, sys
TEXT = ("This sandwich is headed for the bottom of the sea. The sub's cables snap. The crew jumps out. The sandwich doesn't. "
        "Ten months later, they haul it up. Almost fresh. Cold, right? But in a fridge that cold, germs eat food up to a hundred "
        "times faster. The crushing pressure down there slows them even more. So scientists start sinking lunch on purpose.")
print(len(TEXT.split()), 'words', len(TEXT), 'chars')
if os.path.exists('../../public/sunken-lunch/vo/take1.mp3'):
    sys.exit('take1 already exists - not generating again')
url = 'https://api.elevenlabs.io/v1/text-to-speech/VCgLBmBjldJmfphyB8sZ/with-timestamps?output_format=mp3_44100_128'
body = {'text': TEXT, 'model_id': 'eleven_v4'}
req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req, timeout=300) as r:
    js = json.loads(r.read().decode())
    print('HTTP', r.status, {k: v for k, v in r.headers.items() if k.lower() in ('character-cost', 'x-character-count', 'request-id', 'history-item-id')})
open('../../public/sunken-lunch/vo/take1.mp3', 'wb').write(base64.b64decode(js['audio_base64']))
json.dump({k: js.get(k) for k in ('alignment', 'normalized_alignment')}, open('tts_alignment.json', 'w'))
print('saved take1.mp3', os.path.getsize('../../public/sunken-lunch/vo/take1.mp3'), 'bytes')
