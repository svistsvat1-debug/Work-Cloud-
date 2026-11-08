import json, re, subprocess, textwrap
T=json.load(open('timing.json')); PAD=.45; LEAD=.15; HOLD=2.5
st=[]; t=0
for s in T: st.append(t); t+=s['dur']+PAD
TOTAL=t+HOLD
# audio
inp=[]; flt=[]
for i in range(len(T)):
    inp+=['-i',f'audio/s{i:02d}.mp3']; ms=int((st[i]+LEAD)*1000)
    flt.append(f'[{i}:a]aresample=48000,adelay={ms}|{ms}[a{i}]')
flt.append(''.join(f'[a{i}]' for i in range(len(T)))+f'amix=inputs={len(T)}:normalize=0,apad=whole_dur={TOTAL:.3f},atrim=0:{TOTAL:.3f},loudnorm=I=-16:TP=-1.5[out]')
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(flt),'-map','[out]','-ac','2','-c:a','aac','-b:a','192k','out/voice.m4a'],check=True)
# captions
cues=[]
for i,s in enumerate(T):
    for se in s['sent']:
        a=st[i]+LEAD+se['o']; d=se['d']; txt=se['t'].strip()
        parts=[txt]
        if len(txt)>70:
            # split at punctuation near middle
            cands=[m.end() for m in re.finditer(r'[,:—]\s', txt)]
            if cands:
                mid=min(cands,key=lambda c:abs(c-len(txt)/2)); parts=[txt[:mid].strip(), txt[mid:].strip()]
        tot=sum(len(p) for p in parts); acc=0
        for p in parts:
            s0=a+d*acc/tot; acc+=len(p); s1=a+d*acc/tot
            cues.append((s0,s1+0.15,p))
cues=[(a,min(b,cues[k+1][0]-0.02) if k+1<len(cues) else b,p) for k,(a,b,p) in enumerate(cues)]
def ts(x,sep=','):
    h=int(x//3600); m=int(x%3600//60); s=x%60
    return f'{h:02d}:{m:02d}:{int(s):02d}{sep}{int(round((s-int(s))*1000)):03d}'
with open('out/subtitles_uk.srt','w') as f:
    for k,(a,b,p) in enumerate(cues,1):
        f.write(f"{k}\n{ts(a)} --> {ts(b)}\n"+"\n".join(textwrap.wrap(p,48))+"\n\n")
ass=["[Script Info]","ScriptType: v4.00+","PlayResX: 1920","PlayResY: 1080","","[V4+ Styles]",
"Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
"Style: Default,DejaVu Sans,40,&H00FFFFFF,&H00FFFFFF,&H7A505050,&H7A505050,1,0,0,0,100,100,0,0,3,14,0,2,200,200,40,1","","[Events]",
"Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
def ta(x): return f'{int(x//3600)}:{int(x%3600//60):02d}:{x%60:05.2f}'
for a,b,p in cues: ass.append(f"Dialogue: 0,{ta(a)},{ta(b)},Default,,0,0,0,,"+"\\N".join(textwrap.wrap(p,52)))
open('out/subs.ass','w').write("\n".join(ass)+"\n")
print('TOTAL',TOTAL,'cues',len(cues))
