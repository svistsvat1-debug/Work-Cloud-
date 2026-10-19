import re,sys
src,out_srt,out_ass,maxc,size=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]),int(sys.argv[5])
def t2s(t):h,m,r=t.split(':');s,ms=r.split(',');return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
def srt(t):ms=round(t*1000);return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}"
def ass(t):cs=round(t*100);return f"{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}"
blocks=re.split(r'\n\s*\n',open(src,encoding='utf-8-sig').read().strip())
cues=[]
for b in blocks:
    l=b.strip().split('\n');a,z=l[1].split(' --> ');cues.append((t2s(a),t2s(z),' '.join(l[2:]).strip()))
def wrap(words):
    lines=[];cur=''
    for w in words:
        if cur and len(cur)+1+len(w)>maxc: lines.append(cur);cur=w
        else: cur=(cur+' '+w).strip()
    lines.append(cur);return lines
def balance(words):
    # best 2-line split
    best=None
    for i in range(1,len(words)):
        a=' '.join(words[:i]);b=' '.join(words[i:])
        if len(a)<=maxc and len(b)<=maxc:
            sc=abs(len(a)-len(b))-(6 if a.endswith((',','.','?','!','—')) else 0)
            if best is None or sc<best[0]: best=(sc,[a,b])
    return best[1] if best else None
def fit(ws):
    t=' '.join(ws)
    return [t] if len(t)<=maxc else None
def dp(words):
    n=len(words);INF=1e9;best=[INF]*(n+1);prev=[0]*(n+1);best[0]=0
    for j in range(1,n+1):
        for i in range(j):
            c=fit(words[i:j])
            if not c: continue
            L=len(' '.join(words[i:j]))
            cost=1000+(0 if j==n or words[j-1].endswith(('.','?','!','—',',')) else 40)+(3*abs(L-19) if n>j-i else 0)+(70 if j<n and words[j-1].lower() in ('the','a','an','of','to','and','my','his','in','at','on','with','i','your','for','from','by','was','is','had','be','you','he','she','we','they','that','truck') else 0)
            if best[i]+cost<best[j]: best[j]=best[i]+cost;prev[j]=i
    out=[];j=n
    while j>0: i=prev[j];out.append(fit(words[i:j]));j=i
    return out[::-1]
res=[]
for a,z,txt in cues:
    chunks=dp(txt.split())
    total=sum(len(' '.join(c)) for c in chunks); t=a
    for c in chunks:
        d=(z-a)*len(' '.join(c))/total; res.append((t,t+d,c)); t+=d
assert all(len(c)<=1 and all(len(x)<=maxc+4 for x in c) for _,_,c in res),[c for _,_,c in res if len(c)>2]
with open(out_srt,'w',encoding='utf-8') as f:
    for i,(a,z,c) in enumerate(res,1): f.write(f"{i}\n{srt(a)} --> {srt(z)}\n"+'\n'.join(c)+"\n\n")
hdr=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Big,Inter,{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(out_ass,'w',encoding='utf-8') as f:
    f.write(hdr)
    for a,z,c in res:
        f_=min(200,int((z-a)*250));f.write(f"Dialogue: 0,{ass(a)},{ass(z)},Big,,0,0,0,,{{\\fad({f_},{f_})}}"+'\\N'.join(c)+"\n")
print(len(cues),'->',len(res),'max line',max(len(x) for _,_,c in res for x in c))
