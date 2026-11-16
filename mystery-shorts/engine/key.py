import numpy as np, cv2, sys
from PIL import Image
S=sys.argv[1]
names={'ship':'2edb0e97','sailor_a':'29cc6dc5','sailor_b':'4473d644','waves':'eff4769f'}
for n,f in names.items():
    im=np.asarray(Image.open(f'{S}/src/{f}-image.jpg').convert('RGB')).astype(np.float32)/255
    r,g,b=im[...,0],im[...,1],im[...,2]
    gr=g-np.maximum(r,b)                      # greenness
    a=np.clip(1-(gr-0.18)/(0.32-0.18),0,1)    # >0.32 = key, <0.18 = subject
    a=cv2.GaussianBlur(a,(3,3),0)
    # remove tiny specks: keep components with area>200 (on hard mask)
    hard=(a>0.5).astype(np.uint8)
    n_,lab,st,_=cv2.connectedComponentsWithStats(hard,connectivity=8)
    keep=np.zeros_like(hard)
    for i in range(1,n_):
        if st[i,4]>200: keep[lab==i]=1
    keep=cv2.dilate(keep,np.ones((5,5),np.uint8))
    a=a*keep
    # despill: clamp green to max(r,b) on semi/edge pixels and anywhere green dominates
    edge=cv2.dilate((a<0.98).astype(np.uint8),np.ones((7,7),np.uint8)).astype(bool)
    mx=np.maximum(r,b)
    g2=np.where(edge&(g>mx),mx+(g-mx)*0.15,g)
    g2=np.where((~edge)&(gr>0.10),mx+0.10,g2)
    out=np.dstack([r,g2,b,a])
    Image.fromarray((out*255).astype(np.uint8),'RGBA').save(f'{S}/sprites/{n}.png')
    ys,xs=np.where(a>0.5); print(n,'bbox x',xs.min(),xs.max(),'y',ys.min(),ys.max())
# QA sheet on magenta + dark blue
tiles=[]
for n in names:
    sp=Image.open(f'{S}/sprites/{n}.png')
    for col in [(255,0,255),(20,30,60)]:
        bg=Image.new('RGBA',sp.size,col+(255,)); bg.alpha_composite(sp); tiles.append(bg.convert('RGB').resize((256,459)))
sheet=Image.new('RGB',(256*8,459)); [sheet.paste(t,(i*256,0)) for i,t in enumerate(tiles)]
sheet.save(f'{S}/qa_key.png')
