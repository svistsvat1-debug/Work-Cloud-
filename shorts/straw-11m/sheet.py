import cv2, numpy as np, glob, os, sys
files = sys.argv[2:] or sorted(glob.glob('cut/*.png'))
tiles=[]
for p in files:
    im=cv2.imread(p,cv2.IMREAD_UNCHANGED).astype(np.float32)
    h,w=im.shape[:2]; s=600/max(h,w); im=cv2.resize(im,(int(w*s),int(h*s)),interpolation=cv2.INTER_AREA)
    bg=np.zeros((620,620,3),np.float32); bg[:]=(80,60,200); bg[:310]=(230,120,40)
    h,w=im.shape[:2]; y=(620-h)//2; x=(620-w)//2
    a=im[...,3:]/255; bg[y:y+h,x:x+w]=bg[y:y+h,x:x+w]*(1-a)+im[...,:3]*a
    bg=bg.astype(np.uint8); cv2.putText(bg,os.path.basename(p),(10,30),0,1,(255,255,255),2); tiles.append(bg)
while len(tiles)%4: tiles.append(np.zeros_like(tiles[0]))
cv2.imwrite(sys.argv[1],np.vstack([np.hstack(tiles[i:i+4]) for i in range(0,len(tiles),4)]))
