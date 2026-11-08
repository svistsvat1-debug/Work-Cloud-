"""Prep for 'Why You See Stars': chroma-key Flow pictures (green bg), upscale x2, trim, measure -> ../../public + ../../src/stars/sprites.json"""
import cv2, numpy as np, json, os
RAW='raw'; OUT='../../public/why-you-see-stars/img'; QA='qa'; UP=2
os.makedirs(OUT,exist_ok=True); os.makedirs(QA,exist_ok=True)
meta={}

def load_up(name):
    im=cv2.imread(f'{RAW}/{name}.jpg')[:,:,::-1].astype(np.float32)
    im=cv2.bilateralFilter(im,7,18,5)                      # soften JPEG blocks, keep edges
    return cv2.resize(im,None,fx=UP,fy=UP,interpolation=cv2.INTER_LANCZOS4).clip(0,255)

def key(im):
    r,g,b=im[...,0],im[...,1],im[...,2]
    s=g-np.maximum(r,b)
    h,w=s.shape; border=np.concatenate([s[:8].ravel(),s[-8:].ravel(),s[:,:8].ravel(),s[:,-8:].ravel()])
    bgpix=np.concatenate([im[:8].reshape(-1,3),im[-8:].reshape(-1,3),im[:,:8].reshape(-1,3),im[:,-8:].reshape(-1,3)])
    bgc=np.median(bgpix,0); sb=np.percentile(border,20)
    lo=18.0; hi=sb*0.92
    a=1-np.clip((s-lo)/(hi-lo),0,1)
    a=cv2.GaussianBlur(a,(3,3),0)
    a=np.clip((a-0.08)/0.84,0,1)                          # crisper edge after upscale
    # drop specks
    n,lab,st,_=cv2.connectedComponentsWithStats((a>0.5).astype(np.uint8),8)
    keep=np.zeros(n,bool); keep[1:]=st[1:,cv2.CC_STAT_AREA]>400*UP*UP
    a=np.where(keep[lab]|(a<=0.5),a,0); a[(a>0.5)&~keep[lab]]=0
    # un-mix colour, then despill
    aa=np.maximum(a,1e-3)[...,None]
    c=((im-(1-aa)*bgc)/aa).clip(0,255)
    c[...,1]=np.minimum(c[...,1],np.maximum(c[...,0],c[...,2])+6)
    c[a<0.02]=0
    return np.dstack([c,a*255]).astype(np.uint8)

def trim(rgba,pad=12*UP):
    ys,xs=np.where(rgba[...,3]>8); y0,y1,x0,x1=max(ys.min()-pad,0),min(ys.max()+pad,rgba.shape[0]),max(xs.min()-pad,0),min(xs.max()+pad,rgba.shape[1])
    return rgba[y0:y1,x0:x1],(x0,y0)

def save(name,rgba,extra=None,dotrim=True):
    off=(0,0)
    if dotrim: rgba,off=trim(rgba)
    cv2.imwrite(f'{OUT}/{name}.png',cv2.cvtColor(rgba,cv2.COLOR_RGBA2BGRA))
    m={'w':rgba.shape[1],'h':rgba.shape[0],'off':off}
    if extra: m.update(extra)
    meta[name]=m; return rgba,off

def head(alpha):
    a8=(alpha>128).astype(np.uint8); h,w=a8.shape; ff=a8.copy()
    cv2.floodFill(ff,np.zeros((h+2,w+2),np.uint8),(0,0),2)
    solid=np.where(ff==2,0,1).astype(np.uint8)
    dt=cv2.distanceTransform(solid,cv2.DIST_L2,5); hy,hx=np.unravel_index(dt.argmax(),dt.shape)
    return [int(hx),int(hy),float(dt[hy,hx])]

def feet(alpha):
    ys,xs=np.where(alpha>128); yb=ys.max(); band=ys>yb-0.035*(ys.max()-ys.min())
    return [float(xs[band].mean()),float(yb)]

# --- simple characters / props
for n in ['01_hero','03_dizzy','05_point','07_pilot','08_jet','09_sofa','16_heart','12_jug']:
    rgba,off=save(n,key(load_up(n)))
    meta[n]['head']=head(rgba[...,3]) if n in('01_hero','03_dizzy','05_point','07_pilot') else None
    if n in('01_hero','03_dizzy'): meta[n]['feet']=feet(rgba[...,3])
    if n=='16_heart': meta[n]['body']=head(rgba[...,3])   # largest inscribed disc = heart body (face goes here)

# --- jug: liquid mask (red) separately so code can drain it
im=load_up('12_jug'); k=key(im); r,g,b=k[...,0].astype(int),k[...,1].astype(int),k[...,2].astype(int)
liq=((((r>150)&(g<120)&(b<120))|((r>190)&(r-g>55)&(r-b>45)))&(k[...,3]>150)).astype(np.uint8)
liq=cv2.morphologyEx(liq,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
k2,off=trim(k); L=liq[off[1]:off[1]+k2.shape[0],off[0]:off[0]+k2.shape[1]]
ys,xs=np.where(L>0); meta['12_jug']['liquid']=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]
empty=k2.copy(); glass=np.array([228,238,246]); m=L>0
empty[m,:3]=glass; empty[m,3]=150                       # same jug, liquid replaced by glass
cv2.imwrite(f'{OUT}/12_jug_empty.png',cv2.cvtColor(empty,cv2.COLOR_RGBA2BGRA))

# --- x-ray: base with dim vessels + red vessel layer + pale brain layer
im=load_up('04_xray'); k=key(im); k,off=trim(k); r,g,b=[k[...,i].astype(int) for i in range(3)]; A=k[...,3]
red=((r>140)&(g<110)&(b<110)&(r-g>70)&(A>128)).astype(np.uint8)
blob=cv2.morphologyEx(red,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
n,lab,st,cen=cv2.connectedComponentsWithStats(blob,8); hi_=1+np.argmax(st[1:,cv2.CC_STAT_AREA])
heart=cv2.dilate((lab==hi_).astype(np.uint8),np.ones((7,7),np.uint8))
heart_bbox=[int(x) for x in st[hi_,:4]]; hx,hy,hw,hh=heart_bbox
ves=red.copy(); ves[heart>0]=0
vesd=cv2.dilate(ves,np.ones((3,3),np.uint8))
base=k.copy(); dim=np.array([96,38,58])
vm=(vesd>0)&(A>128)
base[vm,:3]=(0.65*dim+0.35*base[vm,:3]).astype(np.uint8)
vl=np.zeros_like(k); vl[vm,:3]=k[vm,:3]; vl[vm,0]=np.maximum(vl[vm,0],215); vl[vm,3]=255
pink=((r>200)&(g>120)&(g<205)&(b>120)&(b<215)&(r-g>25)&(A>128)).astype(np.uint8)
n2,lab2,st2,_=cv2.connectedComponentsWithStats(cv2.morphologyEx(pink,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8)),8)
bi=1+np.argmax(st2[1:,cv2.CC_STAT_AREA]); bm=cv2.morphologyEx((lab2==bi).astype(np.uint8),cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
bm=cv2.dilate(bm,np.ones((3,3),np.uint8))&(A>128)
pale=np.zeros_like(k); gry=k[...,:3].mean(2,keepdims=True)
pale[bm>0,:3]=(0.35*k[bm>0,:3]+0.65*np.clip(gry[bm>0]*1.05+20,0,255)).astype(np.uint8); pale[bm>0,3]=255
for nm,arr in [('04_xray_base',base),('04_xray_vessels',vl),('04_xray_brainpale',pale)]:
    cv2.imwrite(f'{OUT}/{nm}.png',cv2.cvtColor(arr,cv2.COLOR_RGBA2BGRA))
ys,xs=np.where(bm>0); bys,bxs=np.where(A>128)
meta['04_xray']={'w':k.shape[1],'h':k.shape[0],'heart':heart_bbox,'brain':[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())],
  'body':[int(bxs.min()),int(bys.min()),int(bxs.max()),int(bys.max())]}
# neck: narrowest row between brain bottom and heart top
rows=range(int(ys.max()),hy); widths=[(A[y]>128).sum() for y in rows]; ny=list(rows)[int(np.argmin(widths))]
nx=np.where(A[ny]>128)[0]; meta['04_xray']['neck']=[int(nx.min()),int(ny),int(nx.max())]

# --- eyeball: split floating brows from body, measure eyeball + iris
im=load_up('14_eye'); k=key(im); k,off=trim(k); A=k[...,3]
n,lab,st,cen=cv2.connectedComponentsWithStats((A>100).astype(np.uint8),8)
order=sorted(range(1,n),key=lambda i:-st[i,cv2.CC_STAT_AREA])
bodyi=order[0]; brows=[i for i in order[1:] if st[i,cv2.CC_STAT_AREA]>2000*UP*UP and cen[i][1]<cen[bodyi][1]]
grow=cv2.dilate((lab==bodyi).astype(np.uint8),np.ones((5,5),np.uint8))>0
body=k.copy(); body[~grow,3]=0
cv2.imwrite(f'{OUT}/14_eye_body.png',cv2.cvtColor(body,cv2.COLOR_RGBA2BGRA))
meta['14_eye']={'w':k.shape[1],'h':k.shape[0],'brows':[]}
for j,i in enumerate(sorted(brows,key=lambda i:cen[i][0])):
    x,y,w,h=st[i,:4]; p=6*UP; x0,y0=max(x-p,0),max(y-p,0); sub=k[y0:y+h+p,x0:x+w+p].copy()
    msk=cv2.dilate((lab[y0:y+h+p,x0:x+w+p]==i).astype(np.uint8),np.ones((5,5),np.uint8))>0; sub[~msk,3]=0
    cv2.imwrite(f'{OUT}/14_eye_brow{j}.png',cv2.cvtColor(sub,cv2.COLOR_RGBA2BGRA))
    meta['14_eye']['brows'].append({'x':int(x0),'y':int(y0),'w':int(sub.shape[1]),'h':int(sub.shape[0])})
# eyeball = largest inscribed disc of the body (filled)
meta['14_eye']['ball']=head(body[...,3])
r,g,b=[k[...,i].astype(int) for i in range(3)]
brown=((r>80)&(r<170)&(g>50)&(g<120)&(b<90)&(r-b>40)&(A>200)).astype(np.uint8)
brown=cv2.morphologyEx(brown,cv2.MORPH_CLOSE,np.ones((25,25),np.uint8))
cnts,_=cv2.findContours(brown,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); c=max(cnts,key=cv2.contourArea)
(ix,iy),ir=cv2.minEnclosingCircle(c); meta['14_eye']['iris']=[float(ix),float(iy),float(ir)]

# --- gauge: dial ellipse (cream face + scale)
im=load_up('13_gauge'); k=key(im); k,off=trim(k); r,g,b=[k[...,i].astype(int) for i in range(3)]; A=k[...,3]
cream=((r>225)&(g>220)&(b>180)&(b<228)&(A>200)).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(cream,8); ci=1+np.argmax(st[1:,cv2.CC_STAT_AREA])
cnts,_=cv2.findContours((lab==ci).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); c=max(cnts,key=cv2.contourArea)
(ex,ey),(ea,eb),eang=cv2.fitEllipse(c)
save('13_gauge',k,dotrim=False); meta['13_gauge']['dial']=[ex,ey,ea/2,eb/2,eang]

# --- the sitting guy cut out of 02 (sofa removed) -> placed on sofa 09 in code
im=load_up('02_sofa_sitting'); k=key(im)
r,g,b=[k[...,i].astype(int) for i in range(3)]; A=k[...,3]
white=((r>200)&(g>200)&(b>200)&(A>200)).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats(white,8)
W=np.zeros_like(white)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA]>800*UP*UP: W[lab==i]=1
h,w=W.shape; ff=W.copy(); cv2.floodFill(ff,np.zeros((h+2,w+2),np.uint8),(0,0),2); Wf=np.where(ff==2,0,1).astype(np.uint8)
ring=cv2.dilate(Wf,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(17,17)))&(1-Wf)
lum=k[...,:3].astype(np.float32).mean(2)
yl=np.median(lum[(r>200)&(g>150)&(b<120)])
ra=np.clip((yl-lum)/(yl-25),0,1)*(A/255.)
out=k.copy(); al=np.zeros(A.shape,np.float32); al[Wf>0]=A[Wf>0]/255.; al[ring>0]=ra[ring>0]
out[ring>0,:3]=0; out[...,3]=(al*255).astype(np.uint8)
n,lab,st,_=cv2.connectedComponentsWithStats((out[...,3]>60).astype(np.uint8),8)
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); out[lab!=big,3]=np.where(Wf[lab!=big]>0,out[lab!=big,3],0)
o2,off=save('02_sit',out); meta['02_sit']['head']=head((Wf[off[1]:off[1]+o2.shape[0],off[0]:off[0]+o2.shape[1]]*255))
ys,xs=np.where(o2[...,3]>128); meta['02_sit']['bottom']=int(ys.max())
# where the sofa was in the original picture (to place the guy on sofa 09 the same way)
yel=((r>200)&(g>150)&(b<120)&(A>200)); ys,xs=np.where(yel)
meta['02_sit']['sofa_in_raw']=[int(xs.min()-off[0]),int(ys.min()-off[1]),int(xs.max()-off[0]),int(ys.max()-off[1])]

# --- opaque backgrounds
for n in ['10_room','11_pov']:
    im=load_up(n).astype(np.uint8); cv2.imwrite(f'{OUT}/{n}.jpg',im[...,::-1],[cv2.IMWRITE_JPEG_QUALITY,94]); meta[n]={'w':im.shape[1],'h':im.shape[0]}

json.dump(meta,open('../../src/stars/sprites.json','w'),indent=1,default=float)
# QA sheet on a coloured background
files=sorted(f for f in os.listdir(OUT) if f.endswith('.png'))
th=[];
for f in files:
    x=cv2.imread(f'{OUT}/{f}',cv2.IMREAD_UNCHANGED); s=420/max(x.shape[:2]); x=cv2.resize(x,None,fx=s,fy=s,interpolation=cv2.INTER_AREA)
    bg=np.zeros((440,440,3),np.uint8); bg[:]=(170,90,200)  # magenta-ish (BGR)
    y0=(440-x.shape[0])//2; x0=(440-x.shape[1])//2; a=x[...,3:4]/255.
    bg[y0:y0+x.shape[0],x0:x0+x.shape[1]]=(x[...,:3]*a+bg[y0:y0+x.shape[0],x0:x0+x.shape[1]]*(1-a)).astype(np.uint8)
    cv2.putText(bg,f[:-4],(6,20),cv2.FONT_HERSHEY_SIMPLEX,0.55,(255,255,255),2); th.append(bg)
while len(th)%5: th.append(np.zeros((440,440,3),np.uint8))
rows=[np.hstack(th[i:i+5]) for i in range(0,len(th),5)]; cv2.imwrite(f'{QA}/sheet.png',np.vstack(rows))
print(json.dumps({k:{kk:vv for kk,vv in v.items() if kk not in('off',)} for k,v in meta.items()},default=float)[:3000])
