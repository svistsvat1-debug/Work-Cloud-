set -e
cd /home/user/Work-Cloud-/ep9
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 pre.wav)
COMMON="-stream_loop -1 -i loop.mp4 -i pre.wav -t $D -map 0:v -map 1:a -vf ass=Ep9.ass,format=yuv420p -c:v libx264 -preset slow -b:v 138k -maxrate 400k -bufsize 1600k -g 240 -r 24"
ffmpeg -hide_banner -loglevel error -y $COMMON -pass 1 -passlogfile p2 -an -f null /dev/null
ffmpeg -hide_banner -loglevel error -y $COMMON -pass 2 -passlogfile p2 -c:a aac -b:a 96k -ac 1 -movflags +faststart Ep9_final.mp4
ls -la Ep9_final.mp4
