// Quick per-pass timing: node profile.mjs <config> <frame...>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (process.env.OVR) Object.assign(cfg, JSON.parse(process.env.OVR));
const srv = http.createServer((q, r) => { const p = path.join(ROOT, q.url.split('?')[0]); if (!fs.existsSync(p)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(r); }).listen(0);
const llvm = process.env.DISPLAY && process.env.ND_GL !== 'swiftshader';
const b = await chromium.launch(llvm ? { headless: false, args: ['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=200,200'] } : { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage();
pg.on('pageerror', (e) => console.error(e.message));
await pg.addInitScript((c) => { window.CFG = c; }, cfg);
await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
await pg.waitForFunction(() => window.READY === true, null, { timeout: 600000 });
for (const f of process.argv.slice(3)) console.log(f, JSON.stringify(await pg.evaluate((x) => window.profile(x), +f)));
await b.close(); srv.close();
