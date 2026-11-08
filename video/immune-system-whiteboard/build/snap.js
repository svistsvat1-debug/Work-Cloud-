const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + __dirname + '/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 30000 });
  console.log('TOTAL', await p.evaluate(() => TOTAL), await p.evaluate(()=>JSON.stringify(SEGSTART.map(x=>+x.toFixed(2)))));
  const ts = process.argv.slice(2).map(Number);
  for (const t of ts) { const t0=Date.now(); await p.evaluate(t => render(t), t); await p.screenshot({ path: `../shots/t${t}.jpg`, type: 'jpeg', quality: 80 }); console.log(t, Date.now()-t0,'ms'); }
  await b.close();
})();
