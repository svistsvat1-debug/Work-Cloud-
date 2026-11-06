import cv2, numpy as np, sys
cap=cv2.VideoCapture(sys.argv[1]); prev=None; d=[]
while True:
    ok,f=cap.read()
    if not ok: break
    g=cv2.GaussianBlur(cv2.resize(cv2.cvtColor(f,cv2.COLOR_BGR2GRAY),(270,480)).astype(np.float32),(5,5),0)
    if prev is not None: d.append(np.abs(g-prev).mean())
    prev=g
d=np.array(d); print('frames',len(d)+1)
from scipy.ndimage import median_filter
med=median_filter(d,31)+0.15
flag=np.where(d>2.2*med)[0]
for i in flag: print(f'frame {i+1} t={(i+1)/60-0.1:.2f} diff={d[i]:.2f} med={med[i]:.2f}')
