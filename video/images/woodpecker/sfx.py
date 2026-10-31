# Synthesised cartoon SFX (numpy only), 48 kHz mono, peak-normalised to -1 dBFS.
import numpy as np, soundfile as sf
SR = 48000; OUT = "public/woodpecker/sfx/"; rng = np.random.default_rng(7)
def t(d): return np.arange(int(d*SR))/SR
def norm(x): return x / (np.abs(x).max()+1e-9) * 10**(-1/20)
def lp(x, a):  # one-pole low-pass, a in 0..1 (smaller = darker)
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s += a*(v-s); y[i] = s
    return y
def env(n, att, dec):
    tt = np.arange(n)/SR; return np.minimum(tt/att, 1) * np.exp(-tt/dec)
def save(name, x): sf.write(OUT+name+".wav", norm(x).astype(np.float32), SR)
# wood knock: two damped modes + short noise click
def knock(f=820, d=0.12):
    tt = t(d); x = (np.sin(2*np.pi*f*tt) + .6*np.sin(2*np.pi*f*2.7*tt)*np.exp(-tt/.012)) * np.exp(-tt/.03)
    nz = rng.standard_normal(len(tt)) * np.exp(-tt/.004); return x + .5*lp(nz, .5)
save("knock", knock()); save("knock_hi", knock(1050, .1)); save("knock_big", knock(620, .2) + .5*knock(310, .2))
# soft pillow thump
tt = t(.25); save("thump", lp(rng.standard_normal(len(tt)), .03) * env(len(tt), .005, .05))
# whoosh: noise through a moving low-pass, swell then fade
tt = t(.45); a = .02 + .25*np.sin(np.pi*tt/.45)**2; nz = rng.standard_normal(len(tt)); y = np.zeros_like(nz); s = 0
for i, v in enumerate(nz): s += a[i]*(v-s); y[i] = s
save("whoosh", y*np.sin(np.pi*tt/.45)**1.5)
# boing: pitch wobble
tt = t(.6); f = 180 + 70*np.sin(2*np.pi*9*tt)*np.exp(-tt/.25); ph = 2*np.pi*np.cumsum(f)/SR
save("boing", (np.sin(ph) + .3*np.sin(2*ph)) * env(len(tt), .004, .22))
# sproing (spring flies off): rising wobble
tt = t(.55); f = 220 + 600*tt + 80*np.sin(2*np.pi*14*tt); ph = 2*np.pi*np.cumsum(f)/SR
save("sproing", (np.sin(ph) + .25*np.sin(3*ph)) * env(len(tt), .003, .2))
# pop: fast downward chirp
tt = t(.09); f = 900*np.exp(-tt/.02) + 200; ph = 2*np.pi*np.cumsum(f)/SR; save("pop", np.sin(ph) * env(len(tt), .001, .025))
# projector whirr (2.6 s) with 24 Hz flutter + click
tt = t(2.6); nz = lp(rng.standard_normal(len(tt)), .08); fl = .6 + .4*(np.sin(2*np.pi*24*tt) > 0)
save("projector", nz*fl*np.minimum(tt/.15, 1)*np.minimum((2.6-tt)/.2, 1))
tt = t(.05); save("click", knock(2400, .05) + .3*rng.standard_normal(len(tt))*np.exp(-tt/.003))
# bonk: hollow head bonk
tt = t(.4); f = 260*np.exp(-tt/.3) + 120; ph = 2*np.pi*np.cumsum(f)/SR
save("bonk", (np.sin(ph) + .4*np.sin(2.01*ph)) * env(len(tt), .002, .12) + .4*knock(700, .4))
# twinkle stars: three bell notes
x = np.zeros(int(.9*SR))
for i, fr in enumerate([1568, 2093, 2637, 2093]):
    tt = t(.4); s0 = int(i*.12*SR); n = min(len(tt), len(x)-s0)
    x[s0:s0+n] += (np.sin(2*np.pi*fr*tt) + .3*np.sin(2*np.pi*fr*2*tt))[:n] * np.exp(-tt/.12)[:n]
save("twinkle", x)
# sparkle reveal (magnifier)
x = np.zeros(int(.7*SR))
for i, fr in enumerate([1319, 1760, 2349, 3136]):
    tt = t(.35); s0 = int(i*.06*SR); x[s0:s0+len(tt)] += np.sin(2*np.pi*fr*tt) * np.exp(-tt/.1)
save("sparkle", x)
# dizzy slide whistle down
tt = t(.7); f = 1400 - 900*tt/.7 + 40*np.sin(2*np.pi*6*tt); ph = 2*np.pi*np.cumsum(f)/SR
save("slide", np.sin(ph) * np.minimum(tt/.03, 1) * np.minimum((.7-tt)/.1, 1))
# light outdoor bed: soft wind, 27 s
tt = t(27); w = lp(rng.standard_normal(len(tt)), .01); w *= .7 + .3*np.sin(2*np.pi*.13*tt)
save("wind", w)
print("ok")
