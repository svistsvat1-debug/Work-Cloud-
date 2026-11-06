import cv2, numpy as np, json
OUT='anim/public/straw/'
meta={}
def load(n): return cv2.imread(f'cut/{n}.png',cv2.IMREAD_UNCHANGED)
def head(al, frac=0.5):
    h,w=al.shape; a8=(al>128).astype(np.uint8); ff=a8.copy()
    cv2.floodFill(ff,np.zeros((h+2,w+2),np.uint8),(0,0),2)
    solid=np.where(ff==2,0,1).astype(np.uint8)
    dt=cv2.distanceTransform(solid,cv2.DIST_L2,5); dt[int(h*frac):]=0
    y,x=np.unravel_index(dt.argmax(),dt.shape); return [int(x),int(y),float(dt[y,x])]
def feet(al, xmax=None):
    h,w=al.shape; a=al>128
    if xmax: a=a.copy(); a[:,xmax:]=False
    rows=np.where(a.any(1))[0]; yb=rows.max(); band=a[int(yb-h*0.035):yb+1]
    xs=np.where(band.any(0))[0]; return [float((xs.min()+xs.max())/2), int(yb)]
for n in ['P01','P02','P03','P04','P05','P08']:
    im=load(n); cv2.imwrite(OUT+n+'.png',im)
    meta[n]=dict(w=im.shape[1],h=im.shape[0],head=head(im[...,3]),feet=feet(im[...,3]))
# P06 split
im=load('P06'); h,w=im.shape[:2]
pm=np.zeros((h,w),bool); pm[858:,985:]=True
pull=im.copy(); pull[pm,3]=0
body=im.copy(); body[~pm,3]=0
cv2.imwrite(OUT+'P06_pull.png',pull); cv2.imwrite(OUT+'P06_pump.png',body)
meta['P06']=dict(w=w,h=h,head=head(im[...,3]),feet=feet(im[...,3],xmax=900))
# rod measure: columns of dark pixels in rows 760-850 near x 1080-1140
rodrow=im[800, 1050:1170, :3].astype(int).sum(1)
dark=np.where(rodrow<200)[0]+1050
meta['P06']['rod']=[int(dark.min()),int(dark.max())]
# cylinder cap top
col=im[:, 1110, 3]; meta['P06']['capTop']=858
# building: remove drawn railing, keep wall
b=load('S01'); bh,bw=b.shape[:2]
# find wall right edge at y=1000: last opaque col
wall_r=int(np.where(b[1000,:,3]>128)[0].max())
reg=np.zeros((bh,bw),np.uint8); reg[280:448,728:1172]=1
outside=np.zeros((bh,bw),bool); outside[270:560, wall_r-14:]=True
inp=reg.copy(); inp[outside]=0
bgr=cv2.inpaint(b[...,:3],inp*255,7,cv2.INPAINT_TELEA)
b[...,:3]=np.where(inp[...,None]>0,bgr,b[...,:3])
b[outside,3]=0
# keep the wall outline: redraw right wall edge line through cleared zone
cv2.line(b,(wall_r-6,270),(wall_r-6,560),(20,20,20,255),9)
cv2.imwrite(OUT+'S01.png',b)
meta['S01']=dict(w=bw,h=bh,wall_r=wall_r)
json.dump(meta,open('anim/src/sprites.json','w') if False else open('sprites.json','w'),indent=1)
print(json.dumps(meta,indent=0))
