// Blue + white "SECRET" stamp variants over the cleaned AI background.
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const F = (pkg, file) => 'file://' + path.resolve('node_modules/@fontsource', pkg, 'files', file);
const faces = [
  ['Anton', 'anton', 'anton-latin-400-normal.woff2'],
  ['SairaStencil', 'saira-stencil-one', 'saira-stencil-one-latin-400-normal.woff2'],
  ['BlackOps', 'black-ops-one', 'black-ops-one-latin-400-normal.woff2'],
  ['Bebas', 'bebas-neue', 'bebas-neue-latin-400-normal.woff2'],
  ['Oswald', 'oswald', 'oswald-latin-700-normal.woff2'],
].map(([n, p, f]) => `@font-face{font-family:'${n}';src:url('${F(p, f)}')}`).join('\n');
const BG = 'file://' + path.resolve('bg_clean.png');
// rubber-stamp wear: speckled alpha mask from SVG noise
const noise = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -3 2.6'/></filter><rect width='600' height='200' filter='url(#n)'/></svg>`)}")`;
const B1 = '#5AD1FF'; // bright ice blue
const B2 = '#1E9BFF'; // deeper blue
const base = `html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#000}
.bg{position:absolute;inset:0;background:url('${BG}') center/cover}
.box{position:absolute;left:34px;top:22px}
.l{white-space:nowrap;line-height:.95;paint-order:stroke fill;filter:drop-shadow(0 6px 10px rgba(0,0,0,.85))}
.stamp{display:inline-block;transform:rotate(-5deg);line-height:1.04;padding:2px 22px 0}`;

const V = {
  // 1. outline stamp, blue text + blue frame, white line below
  b1_outline: `<div class="box">
    <div class="stamp" style="font-family:SairaStencil;font-size:84px;color:${B1};border:8px solid ${B1};background:rgba(4,20,40,.45);filter:drop-shadow(0 5px 10px rgba(0,0,0,.9))">SECRET</div>
    <div class="l fit" data-w="470" style="font-family:Anton;color:#fff;-webkit-text-stroke:11px #000;margin-top:8px">FOR 29 YEARS</div></div>`,
  // 2. solid blue block, dark-navy letters (reversed stamp), white + blue line below
  b2_solid: `<div class="box">
    <div class="stamp" style="font-family:BlackOps;font-size:80px;color:#06213A;background:${B1};padding:4px 26px 0;box-shadow:0 6px 16px rgba(0,0,0,.8)">SECRET</div>
    <div class="l fit" data-w="470" style="font-family:Anton;-webkit-text-stroke:11px #000;margin-top:10px"><span style="color:#fff">FOR </span><span style="color:${B1}">29 YEARS</span></div></div>`,
  // 3. worn rubber stamp (speckled), double frame
  b3_rubber: `<div class="box">
    <div class="stamp" style="font-family:SairaStencil;font-size:88px;color:${B1};border:7px solid ${B1};outline:3px solid ${B1};outline-offset:5px;
      -webkit-mask-image:url('data:image/png;base64,${fs.readFileSync('speckle.png').toString('base64')}');-webkit-mask-size:100% 100%;filter:drop-shadow(0 4px 8px rgba(0,0,0,.9))">SECRET</div>
    <div class="l fit" data-w="470" style="font-family:Bebas;letter-spacing:2px;color:#fff;-webkit-text-stroke:11px #000;margin-top:14px">FOR 29 YEARS</div></div>`,
  // 4. neon moonlight glow
  b4_glow: `<div class="box">
    <div class="stamp" style="font-family:SairaStencil;font-size:84px;color:#E9FAFF;border:7px solid ${B1};background:rgba(0,30,60,.35);
      text-shadow:0 0 12px ${B1},0 0 26px ${B1};box-shadow:0 0 18px ${B1},inset 0 0 14px rgba(90,209,255,.6)">SECRET</div>
    <div class="l fit" data-w="470" style="font-family:Anton;color:#fff;-webkit-text-stroke:11px #000;margin-top:12px;filter:drop-shadow(0 0 14px rgba(90,209,255,.55)) drop-shadow(0 6px 10px rgba(0,0,0,.85))">FOR 29 YEARS</div></div>`,
  // 5. two-tone: deeper-blue TOP SECRET banner + white line with ice-blue 29
  b5_twotone: `<div class="box">
    <div class="stamp" style="font-family:BlackOps;font-size:58px;color:#fff;background:${B2};border:5px solid #fff;padding:6px 20px 0;transform:rotate(-4deg);box-shadow:0 6px 14px rgba(0,0,0,.85)">TOP SECRET</div>
    <div class="l fit" data-w="470" style="font-family:Anton;-webkit-text-stroke:12px #000;margin-top:12px"><span style="color:#fff">FOR </span><span style="color:${B1}">29</span><span style="color:#fff"> YEARS</span></div></div>`,
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
  fs.mkdirSync('outblue', {recursive: true});
  for (const [id, h] of Object.entries(V)) {
    const f = path.resolve(`outblue/v_${id}.html`);
    fs.writeFileSync(f, `<html><head><style>${faces}${base}</style></head><body><div class="bg"></div>${h}</body></html>`);
    await p.goto('file://' + f, {waitUntil: 'load'});
    await p.evaluate(async () => {
      await document.fonts.ready;
      for (const el of document.querySelectorAll('.fit')) {
        el.style.fontSize = '100px';
        el.style.display = 'inline-block';
        const w = el.getBoundingClientRect().width;
        el.style.fontSize = (100 * Number(el.dataset.w) / w).toFixed(1) + 'px';
        el.style.display = 'block';
      }
    });
    await p.waitForTimeout(100);
    await p.screenshot({path: `outblue/thumb_${id}.png`});
    console.log('ok', id);
  }
  await b.close();
})();
