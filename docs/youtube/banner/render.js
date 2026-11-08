// Render banner.html to PNG at 2560x1440.
// Usage: node render.js out.png "name=WhyZap&tagline=...&accent=bolt&guides=1"
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const out = process.argv[2] || 'banner.png';
  const query = process.argv[3] || '';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 });
  const url = 'file://' + path.resolve(__dirname, 'banner.html') + (query ? '?' + query : '');
  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]');
  await page.locator('#b').screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})();
