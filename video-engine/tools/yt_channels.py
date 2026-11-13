import sys, json, subprocess, statistics, concurrent.futures as cf
# usage: channels.py out.json chid1 chid2 ...  -> subs, median views of latest 50, list
out=sys.argv[1]; ids=sys.argv[2:]
def run(cid):
    url=f"https://www.youtube.com/channel/{cid}/videos"
    r=subprocess.run(["yt-dlp","--flat-playlist","-J","--playlist-end","50",url],capture_output=True,text=True,timeout=240)
    try:d=json.loads(r.stdout)
    except:return cid,None
    es=[dict(id=e['id'],title=e.get('title'),views=e.get('view_count'),dur=e.get('duration')) for e in (d.get('entries') or []) if e]
    v=[e['views'] for e in es if e['views'] is not None]
    return cid,dict(name=d.get('channel'),handle=d.get('uploader_id'),subs=d.get('channel_follower_count'),n=len(es),median=statistics.median(v) if v else None,videos=es)
try: db=json.load(open(out))
except: db={}
todo=[i for i in ids if i not in db]
with cf.ThreadPoolExecutor(6) as ex:
    for cid,info in ex.map(run,todo):
        db[cid]=info
        print(cid, info and (info['name'],info['subs'],info['median']), file=sys.stderr)
json.dump(db,open(out,'w'))
