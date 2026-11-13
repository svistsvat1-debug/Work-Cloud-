import sys, json, subprocess, concurrent.futures as cf
out=sys.argv[1]; qs=sys.argv[2:]
def run(q):
    r=subprocess.run(["yt-dlp","--flat-playlist","-j","ytsearch30:"+q],capture_output=True,text=True,timeout=180)
    res=[]
    for l in r.stdout.splitlines():
        try:d=json.loads(l)
        except:continue
        res.append(dict(q=q,id=d['id'],title=d.get('title'),views=d.get('view_count'),dur=d.get('duration'),ch=d.get('channel'),chid=d.get('channel_id')))
    return res
with cf.ThreadPoolExecutor(6) as ex, open(out,'a') as f:
    for res in ex.map(run,qs):
        for x in res: f.write(json.dumps(x)+"\n")
