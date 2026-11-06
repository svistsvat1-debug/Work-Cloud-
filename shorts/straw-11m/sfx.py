import numpy as np, wave, subprocess
from scipy.signal import butter, sosfilt
SR=48000; OFF=0.1; DUR=25.1
rng=np.random.default_rng(7)
def t_(d): return np.arange(int(d*SR))/SR
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],btype='band',fs=SR,output='sos'),x)
def lp(x,f): return sosfilt(butter(2,f,fs=SR,output='sos'),x)
def env(n,a,r):  # attack/release fractions
    e=np.ones(n); A=max(1,int(n*a)); Rr=max(1,int(n*r))
    e[:A]=np.linspace(0,1,A)**2; e[-Rr:]*=np.linspace(1,0,Rr)**2; return e
def norm(x): return x/ (np.abs(x).max()+1e-9) * 10**(-1/20)
def whoosh(d=0.8, up=True):
    n=int(d*SR); x=rng.standard_normal(n); y=np.zeros(n); seg=int(SR*0.02)
    for i in range(0,n,seg):
        u=i/n; fc=(400+2200*u) if up else (2600-2000*u)
        y[i:i+seg]=bp(x[i:i+seg+0],max(fc*0.6,80),fc*1.4)[:len(y[i:i+seg])]
    y=lp(x,1)*0+ y
    e=np.sin(np.pi*np.linspace(0,1,n))**1.6
    return norm(y*e)
def inhale(d=1.0):
    n=int(d*SR); x=bp(rng.standard_normal(n),900,4500); e=np.linspace(0,1,n)**1.5; e[-int(.15*SR):]*=np.linspace(1,0,int(.15*SR))
    return norm(x*e)
def pop(f0=900,f1=300,d=0.09):
    tt=t_(d); f=np.geomspace(f0,f1,len(tt)); ph=2*np.pi*np.cumsum(f)/SR
    return norm(np.sin(ph)*np.exp(-tt*35))
def slurp(d=1.0):
    n=int(d*SR); tt=t_(d); x=bp(rng.standard_normal(n),700,2600)
    am=(0.5+0.5*np.sin(2*np.pi*17*tt+np.sin(2*np.pi*3*tt)*2))**3
    return norm(x*am*env(n,.1,.3))
def pff(d=0.3):
    n=int(d*SR); x=lp(rng.standard_normal(n),900); return norm(x*np.exp(-t_(d)*12)*env(n,.05,.1))
def bubbles(d=2.7):
    n=int(d*SR); y=np.zeros(n)
    k=0.0
    while k<d-0.08:
        u=k/d; f0=180+500*u+rng.uniform(-40,40); bd=0.05
        tt=t_(bd); f=f0*(1+tt*14); s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*tt/bd)
        i=int(k*SR); y[i:i+len(s)]+=s*rng.uniform(.5,1)
        k+=rng.uniform(0.03,0.08)*(1.2-0.6*u)
    return norm(y*np.minimum(1,np.linspace(3,0,n)) if False else y*env(n,.05,.25))
def boing(d=0.6):
    tt=t_(d); f=220*(1+0.25*np.sin(2*np.pi*14*tt)*np.exp(-tt*5)); return norm(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*6))
def ding(d=1.0):
    tt=t_(d); return norm((np.sin(2*np.pi*1318*tt)+0.4*np.sin(2*np.pi*2637*tt)+0.2*np.sin(2*np.pi*3950*tt))*np.exp(-tt*5))
def whistle(d=0.65):
    tt=t_(d); f=np.geomspace(1900,650,len(tt)); return norm(np.sin(2*np.pi*np.cumsum(f)/SR)*env(len(tt),.1,.05))
def thud(d=0.5):
    tt=t_(d); f=np.geomspace(95,42,len(tt)); body=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*9)
    click=lp(rng.standard_normal(len(tt)),2500)*np.exp(-tt*60)*0.6; return norm(body+click)
def squeak(d=0.16):
    tt=t_(d); f=np.linspace(950,1350,len(tt))*(1+0.05*np.sin(2*np.pi*40*tt)); return norm(np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*tt/d))
def plip():
    tt=t_(0.25); f=np.geomspace(600,1500,len(tt)); return norm(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*25))
# cue list: (sound, voice-time, dB)
cues=[(whoosh(0.9),2.75,-27),(inhale(1.0),3.75,-22),(pop(700,250),3.72,-20),(pop(1100,500),4.96,-24),
 (pop(800,300),6.15,-22),(whoosh(1.1,False),6.3,-26),(pop(1200,700,0.07),7.38,-17),(pop(1300,800,0.06),7.47,-20),
 (slurp(1.6),8.95,-24),(whoosh(0.85,True),8.5,-29),(whoosh(0.85,False),11.15,-29),
 (pop(900,400),11.95,-21),(pop(1000,450),12.05,-22),(pop(1100,500),12.15,-23),(pff(0.35),12.42,-16),
 (bubbles(2.7),12.5,-24),(whoosh(2.0,True),12.6,-30),(boing(),15.18,-18),(pop(800,300),16.45,-22),(whoosh(1.4,False),16.35,-28),
 (ding(),18.06,-19),(whoosh(1.0,True),19.45,-29),(whistle(),20.35,-24),(thud(),21.0,-11),(pop(700,250),21.0,-22)]
for k in range(4):
    cues.append((squeak(),21.25+0.21+k*0.42,-23)); cues.append((pff(0.18),21.25+0.42*(k+1),-22))
cues+= [(plip(),23.12,-18),(whoosh(1.0,False),24.0,-28),(pop(600,250),24.05,-24),(pop(800,300),24.45,-24)]
mix=np.zeros(int(DUR*SR)+SR)
for s,at,db in cues:
    i=int((at+OFF)*SR); mix[i:i+len(s)]+=s[:len(mix)-i]*10**(db/20)
mix=mix[:int(DUR*SR)]
print('sfx peak dBFS', 20*np.log10(np.abs(mix).max()))
def wr(p,x):
    w=wave.open(p,'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x,-1,1)*32767).astype(np.int16).tobytes()); w.close()
wr('anim/public/straw/sfx.wav',mix)
# check mix with voice
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','raw/take1.mp3','-ac','1','-ar',str(SR),'qa/vo48.wav'])
v=wave.open('qa/vo48.wav'); vo=np.frombuffer(v.readframes(v.getnframes()),np.int16)/32768
full=mix.copy(); i=int(OFF*SR); full[i:i+len(vo)]+=vo[:len(full)-i]
print('mix peak dBFS', 20*np.log10(np.abs(full).max()), 'voice peak', 20*np.log10(np.abs(vo).max()))
