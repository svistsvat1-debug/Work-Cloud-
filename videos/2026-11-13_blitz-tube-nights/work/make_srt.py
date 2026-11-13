import json, re
B=json.load(open('work/beats.json'))['beats']
cues=[]
def fits(t):
    if len(t)<=42: return True
    ws=t.split()
    return any(len(' '.join(ws[:k]))<=42 and len(' '.join(ws[k:]))<=42 for k in range(1,len(ws)))
for b in B:
    ws=b['vo'].split(); L=sum(len(w)+1 for w in ws)
    t0,t1=b['start'],b['end']; acc=0; times=[]
    for w in ws:
        s=t0+(t1-t0)*acc/L; acc+=len(w)+1; e=t0+(t1-t0)*acc/L; times.append((s,e))
    cur=[]; cs=None
    def flush():
        global cur
        if cur: cues.append(list(cur)); cur=[]
    for i,w in enumerate(ws):
        if not cur: cs=times[i][0]
        text=' '.join([x for x,_,_ in cur]+[w])
        if not fits(text) or (cur and times[i][1]-cs>5.8):
            flush(); cs=times[i][0]
        cur.append((w,times[i][0],times[i][1]))
        txt=' '.join(x for x,_,_ in cur)
        if re.search(r'[.?!:;,]$',w) and len(txt)>=38 and i<len(ws)-3: flush()
    flush()
# rebalance: a cue under 1 s takes words from the previous cue
for i in range(1,len(cues)):
    while cues[i][-1][2]-cues[i][0][1]<1.0 and len(cues[i-1])>2 and cues[i-1][-1][2]>=cues[i][0][1]-0.4:
        cues[i].insert(0,cues[i-1].pop())
cues=[[c[0][1],c[-1][2],' '.join(w for w,_,_ in c)] for c in cues]
# min duration 1s: extend into gap
for i,c in enumerate(cues):
    nxt=cues[i+1][0] if i+1<len(cues) else c[1]+2
    if c[1]-c[0]<1.0: c[1]=min(c[0]+1.0, nxt-0.02)
    c[1]=min(c[1]+0.25, nxt-0.02)  # small hold
def wrap(t):
    if len(t)<=42: return t
    ws=t.split(); best=None
    for k in range(1,len(ws)):
        a=' '.join(ws[:k]); b=' '.join(ws[k:])
        if len(a)<=42 and len(b)<=42:
            sc=abs(len(a)-len(b)); 
            if best is None or sc<best[0]: best=(sc,a,b)
    assert best, t
    return best[1]+'\n'+best[2]
def ts(x): 
    ms=int(round(x*1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
out=[]
for i,(s,e,t) in enumerate(cues,1): out.append(f"{i}\n{ts(s)} --> {ts(e)}\n{wrap(t)}\n")
open('final/captions.srt','w').write('\n'.join(out))
d=[e-s for s,e,_ in cues]; print(len(cues),'cues; dur min/max', round(min(d),2), round(max(d),2))
