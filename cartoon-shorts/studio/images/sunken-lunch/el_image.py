# el_image.py NAME [NAME ...] - generate pictures with ElevenLabs GPT Image 2.5 (REST /v1/flows/image), text prompt only.
# Every picture: model gpt-image-2.5-sunburst, resolution 1K, quality LOW, one image per request, NO reference images.
# The API key is injected by the session proxy (never written here). Writes raw/<name>.png and gens.json (generation ids).
import json, os, sys, time, urllib.request, urllib.error

API = 'https://api.elevenlabs.io/v1/flows/image'
P = json.load(open('prompts.json'))
GENS = json.load(open('gens.json')) if os.path.exists('gens.json') else {}

def call(url, body=None, timeout=90):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method='POST' if body is not None else 'GET',
                                 headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]

names = sys.argv[1:]
for n in names:
    if n in GENS:
        print(n, 'already started as', GENS[n]['id'], '- not starting again'); continue
    ar, prompt = P[n]
    body = {'model_id': 'gpt-image-2.5-sunburst', 'prompt': prompt, 'quality': 'low', 'resolution': '1K', 'aspect_ratio': ar}
    assert 'images' not in body and body['quality'] == 'low' and body['resolution'] == '1K'
    st, js = call(API, body)
    print(n, 'POST', st, js if st != 200 else js.get('id'))
    if st != 200:
        sys.exit(f'{n}: request refused ({st}), nothing started')
    GENS[n] = {'id': js['id'], 'ar': ar, 'status': 'pending'}
    json.dump(GENS, open('gens.json', 'w'), indent=1)

# poll until every requested generation is finished
pending = [n for n in names if GENS[n]['status'] not in ('completed', 'failed')]
t0 = time.time()
while pending and time.time() - t0 < 900:
    time.sleep(6)
    for n in list(pending):
        st, js = call(f"{API}/{GENS[n]['id']}")
        if st != 200:
            print(n, 'GET', st, js); continue
        s = js.get('status')
        if s == 'completed':
            os.makedirs('raw', exist_ok=True)
            urllib.request.urlretrieve(js['content_url'], f'raw/{n}.png')
            GENS[n]['status'] = 'completed'; GENS[n]['mime'] = js.get('content_mime_type')
            pending.remove(n); print(n, 'completed -> raw/%s.png' % n)
        elif s == 'failed':
            GENS[n]['status'] = 'failed'; GENS[n]['error'] = js
            pending.remove(n); print(n, 'FAILED', js)
    json.dump(GENS, open('gens.json', 'w'), indent=1)
print('pending:', pending)
