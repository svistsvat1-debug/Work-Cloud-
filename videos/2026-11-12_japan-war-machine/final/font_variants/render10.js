// 10 text variants over the cleaned AI background. Each line is auto-fitted to a target width
// so the text never runs into the ship (ship starts at x≈525).
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const F = (pkg, file) => 'file://' + path.resolve('node_modules/@fontsource', pkg, 'files', file);
const faces = [
  ['Bebas', 'bebas-neue', 'bebas-neue-latin-400-normal.woff2'],
  ['Anton', 'anton', 'anton-latin-400-normal.woff2'],
  ['Oswald', 'oswald', 'oswald-latin-700-normal.woff2'],
  ['BlackOps', 'black-ops-one', 'black-ops-one-latin-400-normal.woff2'],
  ['ArchivoBlack', 'archivo-black', 'archivo-black-latin-400-normal.woff2'],
  ['Staat', 'staatliches', 'staatliches-latin-400-normal.woff2'],
  ['BigShoulders', 'big-shoulders-display', 'big-shoulders-display-latin-900-normal.woff2'],
  ['Teko', 'teko', 'teko-latin-700-normal.woff2'],
  ['SairaStencil', 'saira-stencil-one', 'saira-stencil-one-latin-400-normal.woff2'],
  ['AlfaSlab', 'alfa-slab-one', 'alfa-slab-one-latin-400-normal.woff2'],
].map(([n, p, f]) => `@font-face{font-family:'${n}';src:url('${F(p, f)}')}`).join('\n');
const BG = 'file://' + path.resolve('bg_clean.png');
const base = `html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#000}
.bg{position:absolute;inset:0;background:url('${BG}') center/cover}
.box{position:absolute;left:32px;top:16px}
.l{white-space:nowrap;line-height:.95;paint-order:stroke fill;filter:drop-shadow(0 6px 10px rgba(0,0,0,.8))}`;

// stroke: px of black outline; w1/w2: target widths of line 1 / line 2
const V = [
  {id: '01_bebas_white', font: 'Bebas', ls: 2, c1: '#fff', c2: '#fff', stroke: 12, w1: 380, w2: 470},
  {id: '02_anton_white_red', font: 'Anton', c1: '#fff', c2: '#fff', accent: '#E53935', stroke: 11, w1: 380, w2: 470},
  {id: '03_oswald_white_ice', font: 'Oswald', c1: '#fff', c2: '#8BE9FF', stroke: 11, w1: 380, w2: 470},
  {id: '04_stencil_white', font: 'BlackOps', c1: '#fff', c2: '#fff', stroke: 10, w1: 380, w2: 470},
  {id: '05_archivo_white_orange', font: 'ArchivoBlack', c1: '#fff', c2: '#FF8A2A', stroke: 10, w1: 380, w2: 470},
  {id: '06_staatliches_white_cream', font: 'Staat', ls: 3, c1: '#fff', c2: '#FFE7A8', stroke: 11, w1: 380, w2: 470},
  {id: '07_bigshoulders_white_redbar', font: 'BigShoulders', c1: '#fff', c2: '#fff', stroke: 10, w1: 360, w2: 470, bar: '#E53935'},
  {id: '08_teko_white_cyan', font: 'Teko', c1: '#fff', c2: '#4FD8FF', stroke: 10, w1: 380, w2: 470},
  {id: '09_classified_stamp_white', stamp: true},
  {id: '10_alfaslab_white', font: 'AlfaSlab', c1: '#fff', c2: '#fff', stroke: 10, w1: 380, w2: 470},
];

function html(v) {
  if (v.stamp) {
    return `<div class="box">
      <div style="display:inline-block;transform:rotate(-5deg);font-family:SairaStencil;font-size:80px;color:#E53935;border:8px solid #E53935;padding:0 20px;line-height:1.05;background:rgba(0,0,0,.35);filter:drop-shadow(0 5px 8px rgba(0,0,0,.85))">SECRET</div>
      <div class="l fit" data-w="470" style="font-family:Anton;color:#fff;-webkit-text-stroke:11px #000;margin-top:6px">FOR 29 YEARS</div></div>`;
  }
  const l2 = v.accent
    ? `<span style="color:${v.accent}">29</span> YEARS`
    : '29 YEARS';
  const bar = v.bar ? `<div style="width:470px;height:14px;background:${v.bar};margin-top:8px;box-shadow:0 4px 10px rgba(0,0,0,.7)"></div>` : '';
  return `<div class="box" style="font-family:${v.font};letter-spacing:${v.ls || 0}px">
    <div class="l fit" data-w="${v.w1}" style="color:${v.c1};-webkit-text-stroke:${v.stroke}px #000">SECRET FOR</div>
    <div class="l fit" data-w="${v.w2}" style="color:${v.c2};-webkit-text-stroke:${v.stroke + 2}px #000">${l2}</div>${bar}</div>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
  fs.mkdirSync('out10', {recursive: true});
  for (const v of V) {
    const f = path.resolve(`out10/v_${v.id}.html`);
    fs.writeFileSync(f, `<html><head><style>${faces}${base}</style></head><body><div class="bg"></div>${html(v)}</body></html>`);
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
    await p.screenshot({path: `out10/thumb_${v.id}.png`});
    console.log('ok', v.id);
  }
  await b.close();
})();
