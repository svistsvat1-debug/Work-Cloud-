"""Synthesised sound effects for 'Why You See Stars' (no sample library needed). 48 kHz mono WAV, peak -1 dBFS."""
import numpy as np, os, wave
from scipy.signal import butter, sosfilt
SR=48000; OUT='../../public/why-you-see-stars/sfx'; os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
def t(d): return np.arange(int(d*SR))/SR
def env(n,a,r,shape=2.0):
    x=np.ones(n); na=max(1,int(a*SR)); nr=max(1,int(r*SR))
    x[:na]=np.linspace(0,1,na); x[-nr:]=np.linspace(1,0,nr)**shape; return x
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],'bandpass',fs=SR,output='sos'),x)
def lp(x,f,o=2): return sosfilt(butter(o,f,'lowpass',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'highpass',fs=SR,output='sos'),x)
def sweep(f0,f1,d,curve=1.0):
    tt=t(d); u=(tt/d)**curve; f=f0*(f1/f0)**u; return np.sin(2*np.pi*np.cumsum(f)/SR)
def tvbp(x,f0,f1,q=1.2,blocks=64):  # time-varying band-pass (blockwise)
    y=np.zeros_like(x); n=len(x); B=n//blocks+1
    for i in range(blocks):
        a,b=i*B,min(n,(i+1)*B)
        if a>=n: break
        fc=f0*(f1/f0)**(i/(blocks-1)); y[a:b]=bp(x[max(0,a-2048):b],fc/q,min(fc*q,SR/2-100))[-(b-a):]
    return y
def save(name,x):
    x=x/ (np.abs(x).max()+1e-9) * 10**(-1/20)
    with wave.open(f'{OUT}/{name}.wav','wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype(np.int16).tobytes())
    print(name, round(len(x)/SR,2),'s')

noise=lambda d: rng.standard_normal(int(d*SR))
# whoosh up (jump) / generic whoosh / rush
d=0.5; x=tvbp(noise(d),300,2600,1.6)*env(int(d*SR),0.25,0.22); save('whoosh_up',x)
d=0.7; x=tvbp(noise(d),1800,250,1.5)*env(int(d*SR),0.3,0.35); save('whoosh_down',x)
d=0.45; x=tvbp(noise(d),500,3500,1.4)*env(int(d*SR),0.08,0.3); save('rush',x)
# boing (spring jump)
d=0.55; tt=t(d); f=180+60*np.exp(-tt*6)*np.sin(2*np.pi*14*tt)+tt*120
x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*5)*env(len(tt),0.005,0.1); save('boing',x)
# boxing bell
d=1.8; tt=t(d); x=sum(a*np.sin(2*np.pi*f*tt)*np.exp(-tt*k) for f,a,k in [(780,1,2.2),(1560*1.01,0.5,3),(2153,0.6,3.5),(3170,0.3,5),(4212,0.2,7)])
x+=0.4*hp(noise(0.01),2000).tolist().__len__()*0  # no-op
x[:240]+=np.hanning(480)[:240]*0.5*rng.standard_normal(240)
save('bell',x*env(len(tt),0.002,0.3))
# twinkles (stars)
d=1.4; x=np.zeros(int(d*SR))
for i,(st,f) in enumerate([(0.0,2637),(0.18,3136),(0.36,3951),(0.55,3520),(0.75,4699),(0.95,3951)]):
    tt=t(0.35); s=np.sin(2*np.pi*f*tt)*np.exp(-tt*14); a=int(st*SR); x[a:a+len(s)]+=s*(0.9-0.08*i)
save('twinkle',x)
# sparkle burst (sparks)
d=1.0; x=np.zeros(int(d*SR))
for i in range(14):
    st=rng.uniform(0,0.7); f=rng.uniform(2800,6200); tt=t(0.25); s=np.sin(2*np.pi*f*tt)*np.exp(-tt*22); a=int(st*SR); x[a:a+len(s)]+=s*rng.uniform(0.4,1)
save('sparkle',x)
# scanner
d=0.6; tt=t(d); x=0.6*sweep(500,1500,d,1)*env(len(tt),0.02,0.25)+0.3*np.sin(2*np.pi*90*tt)*env(len(tt),0.05,0.3)
b=t(0.07); x[:len(b)]+=np.sin(2*np.pi*1320*b)*np.hanning(len(b)); save('scan',x)
# pops
d=0.12; x=sweep(950,220,d,0.6)*env(int(d*SR),0.002,0.08); save('pop',x)
d=0.14; x=sweep(520,140,d,0.6)*env(int(d*SR),0.002,0.1); save('gulp',x)
# glug-glug (blood pouring)
d=1.2; x=np.zeros(int(d*SR))
for i in range(7):
    st=i*0.16; f0=300-i*18; s=sweep(f0,f0*1.9,0.09,1)*env(int(0.09*SR),0.004,0.05); a=int(st*SR); x[a:a+len(s)]+=s
x+=0.15*lp(noise(d),400)*env(len(x),0.1,0.4); save('glug',x)
# slide whistle down
d=0.8; tt=t(d); f=1500*(330/1500)**((tt/d)**0.9)*(1+0.012*np.sin(2*np.pi*6*tt)); ph=np.cumsum(f)/SR
x=(np.sin(2*np.pi*ph)+0.15*np.sin(4*np.pi*ph))*env(len(tt),0.03,0.12)+0.04*hp(noise(d),3000)*env(len(tt),0.03,0.12); save('slide_down',x)
# sad low "womp womp"
d=1.0; x=np.zeros(int(d*SR))
for st,f in [(0,155),(0.42,138)]:
    tt=t(0.5); ph=np.cumsum(f*(1-0.06*tt/0.5)*np.ones(len(tt)))/SR; s=sum(np.sin(2*np.pi*k*ph)/k for k in range(1,7)); s=lp(s,900)*env(len(tt),0.02,0.25); a=int(st*SR); x[a:a+len(s)]+=s
save('womp',x)
# glitch
d=0.45; x=np.zeros(int(d*SR)); n=int(0.025*SR)
for i in range(0,len(x)-n,n):
    f=rng.choice([90,180,440,880,1760,3300]); tt=t(0.025); s=np.sign(np.sin(2*np.pi*f*tt))*rng.uniform(0.3,1)
    if rng.random()<0.35: s=rng.standard_normal(n)*0.7
    x[i:i+n]=s[:n]
x=np.round(x*6)/6; save('glitch',lp(x,7000)*env(len(x),0.003,0.05))
# tunnel closing drone
d=1.3; tt=t(d); x=0.7*np.sin(2*np.pi*62*tt)+0.5*lp(noise(d),300); x=tvbp(x+0.3*noise(d),1200,120,2)+0.6*np.sin(2*np.pi*62*tt)
save('tunnel',x*env(len(tt),0.6,0.35))
# jet pass
d=2.2; tt=t(d); x=tvbp(noise(d),500,2500,2.0)*np.hanning(len(tt))+0.6*lp(noise(d),180)*np.hanning(len(tt))
save('jet',x)
# G strain rumble
d=1.6; x=lp(noise(d),140,4)*env(int(d*SR),0.3,0.5); save('rumble',x)
# thud
d=0.45; tt=t(d); x=np.sin(2*np.pi*(52+40*np.exp(-tt*30))*tt)*np.exp(-tt*9)+0.3*lp(noise(d),1500)*np.exp(-tt*60); save('thud',x)
# sensor ping
d=0.5; tt=t(d); x=(np.sin(2*np.pi*1760*tt)+0.3*np.sin(2*np.pi*3520*tt))*np.exp(-tt*9)*env(len(tt),0.002,0.05); save('ping',x)
# alarm double beep
d=0.5; x=np.zeros(int(d*SR))
for st,f in [(0,988),(0.13,1319),(0.26,988)]:
    tt=t(0.1); s=np.sign(np.sin(2*np.pi*f*tt))*0.5+np.sin(2*np.pi*f*tt)*0.5; s=lp(s,4000)*env(len(tt),0.004,0.02); a=int(st*SR); x[a:a+len(s)]+=s
save('alarm',x)
# heartbeat (one lub-dub)
d=0.45; x=np.zeros(int(d*SR))
for st,f,a_ in [(0,48,1.0),(0.13,58,0.75)]:
    tt=t(0.2); s=np.sin(2*np.pi*f*tt)*np.exp(-tt*22)*(1-np.exp(-tt*300))+0.15*lp(rng.standard_normal(len(tt)),300)*np.exp(-tt*40); a=int(st*SR); x[a:a+len(s)]+=s*a_
save('heartbeat',x)
# rubbery squeeze squeak
d=0.45; tt=t(d); f=450+500*(tt/d)+60*np.sin(2*np.pi*28*tt); ph=np.cumsum(f)/SR
x=(np.sin(2*np.pi*ph)+0.3*np.sin(4*np.pi*ph))*env(len(tt),0.03,0.12); save('squeeze',lp(x,3000))
# chime (vision back)
d=1.3; x=np.zeros(int(d*SR))
for i,f in enumerate([523.25,659.25,783.99,1046.5]):
    tt=t(0.9); s=(np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*2*f*tt))*np.exp(-tt*4.5); a=int(i*0.085*SR); x[a:a+len(s)]+=s
save('chime',x)
