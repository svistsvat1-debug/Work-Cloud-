const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{
 const mode=process.argv[2];const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
 await p.goto('file:///tmp/wb/index.html');await p.waitForFunction('window.ready');
 const st=await p.$('#stage');
 if(mode==='preview'){for(const t of process.argv.slice(3)){await p.evaluate(`render(${t})`);await st.screenshot({path:`/tmp/wb/prev_${t}.png`});}}
 else{const fps=30,D=await p.evaluate('DURATION'),N=Math.round(D*fps);
  const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',''+fps,'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium','/tmp/wb/silent.mp4'],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<N;i++){await p.evaluate(`render(${i/fps})`);const buf=await st.screenshot({type:'jpeg',quality:92});
   if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%300==0)console.log(i,'/',N);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));}
 await b.close();})();
