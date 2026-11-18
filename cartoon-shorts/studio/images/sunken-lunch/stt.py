# stt.py - word times + check with ElevenLabs Scribe v1 (REST /v1/speech-to-text), on the voice take. -> words_raw.json
import json, urllib.request, uuid, os, sys
if os.path.exists('words_raw.json'): sys.exit('words_raw.json exists - not calling again')
f = open('../../public/sunken-lunch/vo/take1.mp3', 'rb').read()
b = uuid.uuid4().hex
def field(n, v): return (f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n').encode()
body = field('model_id', 'scribe_v1') + field('timestamps_granularity', 'word') + field('language_code', 'en') + field('tag_audio_events', 'false')
body += (f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="take1.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + f + f'\r\n--{b}--\r\n'.encode()
req = urllib.request.Request('https://api.elevenlabs.io/v1/speech-to-text', data=body, method='POST',
                             headers={'Content-Type': f'multipart/form-data; boundary={b}'})
with urllib.request.urlopen(req, timeout=300) as r:
    js = json.loads(r.read().decode()); print('HTTP', r.status, {k: v for k, v in r.headers.items() if 'cost' in k.lower() or 'request-id' in k.lower()})
json.dump(js, open('words_raw.json', 'w'), indent=1)
print(js.get('text'))
