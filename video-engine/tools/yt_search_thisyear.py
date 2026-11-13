import sys, json, urllib.parse, subprocess, concurrent.futures as cf
# usage: search.py out.jsonl "query1" "query2" ...   (filter: upload date = this year, type video)
out=sys.argv[1]; qs=sys.argv[2:]
def run(q):
    url="https://www.youtube.com/results?search_query="+urllib.parse.quote(q)+"&sp=EgIIBQ%253D%253D"
    r=subprocess.run(["yt-dlp","--flat-playlist","-j","--playlist-end","40",url],capture_output=True,text=True,timeout=180)
    res=[]
    for l in r.stdout.splitlines():
        try:d=json.loads(l)
        except:continue
        if d.get('ie_key')!='Youtube':continue
        res.append(dict(q=q,id=d['id'],title=d.get('title'),views=d.get('view_count'),dur=d.get('duration'),ch=d.get('channel'),chid=d.get('channel_id'),churl=d.get('uploader_url') or d.get('channel_url')))
    return res
with cf.ThreadPoolExecutor(6) as ex, open(out,'a') as f:
    for res in ex.map(run,qs):
        for x in res: f.write(json.dumps(x)+"\n")
        print(res[0]['q'] if res else '?', len(res), file=sys.stderr)
