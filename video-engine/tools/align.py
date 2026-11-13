import json, re, sys, difflib, tempfile
from num2words import num2words
build, words_json, out = sys.argv[1:4]
ns = {}
sys_argv = sys.argv; sys.argv = ['x', tempfile.mkdtemp()]
exec(open(build).read(), ns); sys.argv = sys_argv
S = ns['S']
def toks(text):
    out=[]
    for w in re.findall(r"[A-Za-z0-9'’,.\-%]+", text):
        w=w.lower().replace('’',"'").strip(".,")
        if not w: continue
        if re.search(r'\d', w):
            w2=w.replace(',','')
            m=re.match(r'^(\d+)(st|nd|rd|th|s|%)?$', w2)
            if m:
                n=int(m.group(1)); suf=m.group(2)
                if suf in ('st','nd','rd','th'): t=num2words(n,to='ordinal')
                elif 1900<=n<=1999 and not suf: t=num2words(n,to='year')
                else: t=num2words(n)
                if suf=='%': t+=' percent'
                w=t
        for p in re.split(r"[\s\-]+", w.replace(' and ',' ')):
            p=p.strip(".,'")
            if p and p!='and': out.append(p)
    return out
W=json.load(open(words_json))
wt=[]; wmap=[]
for i,x in enumerate(W):
    for t in toks(x['w']): wt.append(t); wmap.append(i)
st=[]; beat_first=[]; beats=[]
for si,(block,title,mood,bs) in enumerate(S):
    for bi,(vo,vis,sfx) in enumerate(bs):
        tk=toks(vo); beat_first.append(len(st)); st+=tk
        beats.append(dict(scene=si,beat=bi,vo=vo,n=len(tk)))
sm=difflib.SequenceMatcher(None, st, wt, autojunk=False)
m={}
for a,b,n in sm.get_matching_blocks():
    for k in range(n): m[a+k]=b+k
print('matched', len(m), 'of', len(st), 'script tokens; whisper tokens', len(wt))
def time_of(si, end=False):
    # find nearest matched
    if si in m: x=W[wmap[m[si]]]; return x['e'] if end else x['s']
    lo=si-1
    while lo>=0 and lo not in m: lo-=1
    hi=si+1
    while hi<len(st) and hi not in m: hi+=1
    tlo=W[wmap[m[lo]]]['e'] if lo>=0 else 0.0
    thi=W[wmap[m[hi]]]['s'] if hi<len(st) else W[-1]['e']
    f=(si-lo)/(hi-lo); return tlo+(thi-tlo)*f
for k,b in enumerate(beats):
    a=beat_first[k]; z=a+b['n']-1
    b['start']=round(time_of(a),3); b['end']=round(time_of(z,True),3)
    b['unmatched_first']= a not in m
json.dump(dict(beats=beats, scenes=[dict(block=s[0],title=s[1],mood=s[2]) for s in S]), open(out,'w'), indent=1)
bad=[b for b in beats if b['unmatched_first']]
print('beats', len(beats), 'first-token unmatched', len(bad))
for b in bad: print('  ', b['scene'], b['beat'], b['start'], b['vo'][:60])
for k in range(1,len(beats)):
    if beats[k]['start']<beats[k-1]['end']-0.05: print('OVERLAP', k, beats[k-1]['end'], beats[k]['start'])
