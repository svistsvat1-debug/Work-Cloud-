# gen.py NAME [NAME ...] - generate pictures through the ElevenLabs REST image API (the MCP tools did not load):
# gpt-image-2.5-sunburst, resolution 1K, quality LOW, text prompt only (no images / mask = no references), one call = one
# picture. Polls GET /v1/flows/image/{id} every 4 s and downloads to raw/NAME.png. ids are kept in gen_ids.json so a run is
# never started twice for the same name.
import json, subprocess, sys, time, os

API = 'https://api.elevenlabs.io/v1/flows/image'
H = ['-H', 'xi-api-key: dummy', '-H', 'Content-Type: application/json']  # the session proxy injects the real key
P = json.load(open('prompts.json'))
ids = json.load(open('gen_ids.json')) if os.path.exists('gen_ids.json') else {}


def curl(*a):
    r = subprocess.run(['curl', '-sS', *a], capture_output=True, text=True)
    return r.stdout


for n in sys.argv[1:]:
    if n in ids:
        print(n, 'already started', ids[n]); continue
    body = {'model_id': 'gpt-image-2.5-sunburst', 'prompt': P[n]['prompt'], 'aspect_ratio': P[n]['aspect_ratio'],
            'resolution': '1K', 'quality': 'low'}
    assert body['quality'] == 'low' and body['resolution'] == '1K' and 'images' not in body
    out = curl('-X', 'POST', API, *H, '--data-binary', json.dumps(body))
    d = json.loads(out)
    if 'id' not in d:
        print(n, 'FAILED to start', out[:400]); continue
    ids[n] = d['id']
    json.dump(ids, open('gen_ids.json', 'w'), indent=1)
    print(n, 'started', d['id'])

todo = [n for n in sys.argv[1:] if n in ids and not os.path.exists(f'raw/{n}.png')]
while todo:
    time.sleep(4)
    for n in list(todo):
        d = json.loads(curl(f'{API}/{ids[n]}', '-H', 'xi-api-key: dummy'))
        st = d.get('status')
        if st == 'completed':
            curl('-o', f'raw/{n}.png', d['content_url'])
            print(n, 'done', d.get('content_mime_type'))
            todo.remove(n)
        elif st == 'failed':
            print(n, 'FAILED', json.dumps(d)[:400])
            todo.remove(n)
