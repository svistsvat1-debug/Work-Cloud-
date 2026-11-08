const { chromium } = require('playwright');
const { spawn } = require('child_process');
const FPS = 30, W = +process.argv[2] || 4, OUT = process.argv[3];
(async () => {
  const b = await chromium.launch();
  const probe = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await probe.goto('file://' + __dirname + '/index.html'); await probe.waitForFunction(() => window.READY);
  const total = await probe.evaluate(() => TOTAL); const segs = await probe.evaluate(() => SEGSTART); await probe.close();
  require('fs').writeFileSync(OUT + '/meta.json', JSON.stringify({ total, segs }));
  const N = Math.ceil(total * FPS), per = Math.ceil(N / W);
  console.log('frames', N);
  await Promise.all([...Array(W).keys()].map(async w => {
    const f0 = w * per, f1 = Math.min(N, f0 + per);
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('file://' + __dirname + '/index.html'); await p.waitForFunction(() => window.READY);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), `${OUT}/part${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = f0; f < f1; f++) {
      await p.evaluate(t => render(t), f / FPS);
      const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 200 === 0) console.log(`w${w} ${f - f0}/${f1 - f0}`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    console.log(`w${w} done`);
  }));
  await b.close();
})();
