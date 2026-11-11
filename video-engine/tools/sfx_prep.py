"""Rebuild 48 kHz stereo WAVs from sfx-library/raw/*.mp3"""
import glob, os, subprocess
for f in sorted(glob.glob('sfx-library/raw/*.mp3')):
    n = os.path.splitext(os.path.basename(f))[0]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', f'sfx-library/{n}.wav'], check=True)
    print(n)
