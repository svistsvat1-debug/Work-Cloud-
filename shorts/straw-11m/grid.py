import cv2, numpy as np, sys
p=sys.argv[1]; im=cv2.imread(p,cv2.IMREAD_UNCHANGED).astype(np.float32)
h,w=im.shape[:2]; bg=np.full((h,w,3),(200,170,120),np.float32)
a=im[...,3:]/255; bg=bg*(1-a)+im[...,:3]*a; bg=bg.astype(np.uint8)
step=100
for x in range(0,w,step): cv2.line(bg,(x,0),(x,h),(0,0,255) if x%500==0 else (0,140,255),1)
for y in range(0,h,step): cv2.line(bg,(0,y),(w,y),(0,0,255) if y%500==0 else (0,140,255),1)
for x in range(0,w,step): cv2.putText(bg,str(x),(x+2,25),0,0.7,(0,0,200),2)
for y in range(0,h,step): cv2.putText(bg,str(y),(2,y-4),0,0.7,(0,0,200),2)
s=float(sys.argv[3]) if len(sys.argv)>3 else 0.5
cv2.imwrite(sys.argv[2],cv2.resize(bg,None,fx=s,fy=s,interpolation=cv2.INTER_AREA))
