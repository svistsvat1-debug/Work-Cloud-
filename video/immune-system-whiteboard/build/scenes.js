// Storyboard: "Як імунітет бореться з бактеріями"
const PAD = 0.45, LEAD = 0.15, HOLD = 2.5;
const boards = [];
function board(segs, build) { boards.push({ segs, build }); }

function apple(par, x, y, s, t) {
  const g = G(par, x, y, s);
  stroke(g, 'M 0 -38 Q 4 -60 14 -66', t + .35, .15, { w: 6 });
  shape(g, 'M 0 -32 C 30 -52 62 -30 56 6 C 52 40 26 58 0 48 C -26 58 -52 40 -56 6 C -62 -30 -30 -52 0 -32 Z', C.red, t, .5);
  shape(g, 'M 10 -52 C 22 -72 44 -72 50 -62 C 38 -50 22 -48 10 -52 Z', C.green, t + .4, .25, { w: 4 });
  return g;
}
function skinPatch(par, x, y, s, t) { const g = G(par, x, y, s); shape(g, blob(0, 0, 130, 115, .08, 21, 8), C.skin, t, .6); return g; }

function wallDraw(g, t, x0, y0, x1, y1) {
  const rows = 3, rh = (y1 - y0) / rows, bw = 160;
  fill(g, `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`, C.skin, t + .2, .8);
  stroke(g, `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`, t, .6, { w: 7 });
  let d = '';
  for (let r = 1; r < rows; r++) d += `M ${x0} ${y0 + r * rh} L ${x1} ${y0 + r * rh} `;
  for (let r = 0; r < rows; r++) for (let x = x0 + (r % 2 ? bw / 2 : bw); x < x1 - 20; x += bw) d += `M ${x} ${y0 + r * rh} L ${x} ${y0 + (r + 1) * rh} `;
  stroke(g, d, t + .6, .6, { w: 5, c: '#9a5b3a' });
}
function vessel(g, t, topD, botD, fillD, label) {
  if (fillD) fill(g, fillD, C.lred, t + .3, .6);
  const top = G(g), bot = G(g);
  stroke(top, topD, t, .5, { w: 8, c: '#b8312a' });
  stroke(bot, botD, t + .1, .5, { w: 8, c: '#b8312a' });
  return { top, bot };
}
function rbcFlow(g, t, dur, y0, y1, n, x0 = -80, x1 = 2000, speed = 260, s = 1) {
  const R = rng(77);
  for (let i = 0; i < n; i++) {
    const c = G(g, 0, y0 + R() * (y1 - y0), s, R() * 40 - 20);
    el('ellipse', { rx: 26, ry: 17, fill: '#e2403a', stroke: '#9e1f1a', 'stroke-width': 4 }, c);
    el('ellipse', { rx: 11, ry: 6, fill: '#c22d27' }, c);
    const off = R() * (x1 - x0);
    A(t, dur, v => { c._t.x = x0 + ((off + v * dur * speed) % (x1 - x0)); }, lin);
    fade(c, t, .3, 0, 1);
  }
}
function socket(g, kind, x, y, t, col = '#ffffff') {
  const d = {
    circle: circ(x, y, 18),
    square: `M ${x - 17} ${y - 17} L ${x + 17} ${y - 17} L ${x + 17} ${y + 17} L ${x - 17} ${y + 17} Z`,
    tri: `M ${x} ${y - 22} L ${x + 22} ${y + 16} L ${x - 22} ${y + 16} Z`,
    diamond: `M ${x} ${y - 22} L ${x + 20} ${y} L ${x} ${y + 22} L ${x - 20} ${y} Z`,
    star: starPath(x, y, 24, 11)
  }[kind];
  return shape(g, d, col, t, .35, { w: 5, nof: 1 });
}

// ---------- BOARD 0: title ----------
board([0], (g, S, W) => {
  const t1 = txt(g, 'Як імунітет', 140, 330, 150, .1, .8);
  const t2 = txt(g, 'бореться', 140, 490, 175, .85, .7, { c: C.red });
  const t3 = txt(g, 'з бактеріями?', 140, 650, 150, 1.45, .9, { c: C.blue });
  underline(g, t3, 2.35, .4);
  burst(g, 115, 430, 28, 62, 3, 150, 210, 2.6, .3);
  const sh = G(g, 1390, 500, 1.2);
  shape(sh, shieldPath(), C.blue, 1.0, 1.1);
  shape(sh, heartPath(1.5), C.red, 1.9, .5);
  burst(g, 1390, 480, 260, 300, 7, -160, -20, 2.5, .35);
  [[1110, 230, -20], [1690, 280, 25], [1700, 770, -30], [1080, 790, 15]].forEach(([x, y, r], i) => {
    const b = bacterium(g, x, y, .8, r, 2.7 + i * .25);
    wig(b.inner, 2.7 + i * .25, 6, 8, 1.3);
    mv(b, 3.6 + i * .2, .9, { x: x + (x - 1390) * .1, y: y + (y - 500) * .1 }, out);
  });
});

// ---------- BOARD 1: microbes everywhere ----------
board([1], (g, S, W) => {
  const tt = txt(g, 'Мікроби — всюди!', 110, 170, 110, .05, .9);
  underline(g, tt, .9, .35);
  const s = .82, p = G(g, 960 * (1 - s), 560 * (1 - s), s);
  const body = 'M 960 330 C 900 330 860 350 840 400 L 740 560 C 730 585 760 600 775 580 L 860 470 L 860 640 L 830 860 C 826 885 870 890 875 865 L 940 680 L 980 680 L 1045 865 C 1050 890 1094 885 1090 860 L 1060 640 L 1060 470 L 1145 580 C 1160 600 1190 585 1180 560 L 1080 400 C 1060 350 1020 330 960 330 Z';
  shape(p, body, C.skin, .4, 1.2);
  shape(p, circ(960, 250, 72), C.skin, .5, .6);
  face(p, 960, 250, 1.2, 'shock', 1.2, .3);
  const tb = W(1, 'мільярди');
  const m = txt(g, 'мільярди!', 120, 300, 100, tb, .6, { c: C.red });
  burst(g, 560, 260, 20, 55, 3, -40, 40, tb + .5, .3);
  // microbes popping
  const R = rng(5);
  const list = [
    ['c', 700, 520, .7], ['b', 1230, 520, .55, 30], ['v', 1250, 300, .8], ['v', 1560, 340, .7], ['v', 700, 330, .65],
    ['c', 430, 420, .6], ['b', 1520, 520, .5, -20], ['v', 1750, 220, .55], ['b', 440, 830, .55, 5], ['b', 700, 838, .5, -8], ['c', 1250, 812, .55]
  ];
  list.forEach((it, i) => {
    const t = tb - .4 + i * .18;
    let ch;
    if (it[0] === 'b') ch = bacterium(g, it[1], it[2], it[3], it[4] || 0, t, { sp: .6 });
    else if (it[0] === 'v') ch = virus(g, it[1], it[2], it[3], t);
    else ch = coccus(g, it[1], it[2], it[3], t);
    wig(ch.inner, t, 7, 6 + R() * 6, .8 + R() * .8, 'r', R());
    wig(ch.inner, t, 7, 6, .6 + R() * .5, 'y', R());
  });
  stroke(g, 'M 200 868 L 1720 868', W(1, 'поверхні') - .4, .5, { w: 6 });
  const l1 = txt(g, 'на руках', 300, 560, 72, W(1, 'руках') - .1, .45, { c: C.blue });
  arrow(g, 520, 545, 640, 520, W(1, 'руках') + .3, .3, { w: 5 });
  txt(g, 'у повітрі', 1330, 210, 72, W(1, 'повітрі') - .1, .45, { c: C.blue });
  txt(g, 'на поверхнях', 1360, 800, 72, W(1, 'поверхні') - .1, .55, { c: C.blue });
});

// ---------- BOARD 2: skin wall + scratch ----------
board([2, 3], (g, S, W) => {
  const tt = txt(g, '1-ша лінія оборони', 960, 150, 110, .05, .9, { a: 'middle' });
  underline(g, tt, .95, .35);
  const crack = [[1010, 470], [985, 520], [1020, 562], [990, 610], [1025, 655], [995, 710]];
  const cpts = crack.map(p => p.join(' ')).join(' L ');
  const mkClip = (pts) => { const id = uid(); const cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, defs()); el('path', { d: pts }, cp); return id; };
  const idL = mkClip(`M 200 380 L 1010 380 L ${cpts} L 995 800 L 200 800 Z`);
  const idR = mkClip(`M 1010 380 L 1720 380 L 1720 800 L 995 800 L ${crack.slice().reverse().map(p => p.join(' ')).join(' L ')} Z`);
  const tw = W(2, 'шкіра') - .3;
  const halves = [];
  [idL, idR].forEach(id => {
    const h = G(g); const inner = el('g', { 'clip-path': `url(#${id})` }, h);
    wallDraw(inner, tw, 260, 470, 1660, 710);
    halves.push(h);
  });
  txt(g, 'ШКІРА', 270, 440, 95, W(2, 'шкіра'), .5, { c: C.red });
  // bouncing bacteria
  const tb = W(2, 'стіна') - .3;
  const bs = [[700, 290, -10], [1000, 260, 8], [1300, 300, -5]].map(([x, y, r], i) => {
    const b = bacterium(g, x, y, .75, r, tb + i * .2, { sp: .7 });
    return b;
  });
  const hit = W(2, 'пройти') - 1.2;
  bs.forEach((b, i) => {
    const y0 = b._p.y, t0 = hit + i * .12;
    mv(b, t0, .3, { y: 425 }, inq); mv(b, t0 + .3, .35, { y: y0 - 20 }, out);
    mv(b, t0 + .8, .28, { y: 425 }, inq); mv(b, t0 + 1.08, .35, { y: y0 }, out);
    burst(g, b._p.x, 430, 10, 34, 3, 200, 340, t0 + .3, .2, C.yellow, 6);
  });
  // scratch
  const tc = W(3, 'подряпини') - .25;
  halves.forEach(h => stroke(h, 'M ' + cpts, tc, .3, { c: C.red, w: 11 }));
  txt(g, 'подряпина!', 1300, 420, 90, tc + .2, .45, { c: C.red });
  arrow(g, 1330, 440, 1060, 530, tc + .5, .3, { w: 6, c: C.red });
  const to = W(3, 'ворота') - .25;
  mv(halves[0], to, .45, { x: -60 }, outB); mv(halves[1], to, .45, { x: 60 }, outB);
  bs.forEach((b, i) => {
    const t0 = to + .35 + i * .18;
    mv(b, t0, .35, { x: 1003, y: 420 }, io);
    mv(b, t0 + .35, .4, { x: 860 + i * 140, y: 860 }, out);
    mv(b.inner, t0 + .35, .4, { r: 90 * (i - 1) * .3 }, out);
  });
});

// ---------- BOARD 3: multiplication ----------
board([4], (g, S, W) => {
  thermometer(g, 470, 190, .75, W(4, 'тепло') - .3);
  txt(g, 'тепло', 520, 225, 72, W(4, 'тепло'), .4, { c: C.red });
  dropShape(g, 900, 195, .9, W(4, 'волого') - .3);
  txt(g, 'волого', 960, 225, 72, W(4, 'волого'), .4, { c: C.blue });
  apple(g, 1330, 200, .85, W(4, 'поживи') - .3);
  txt(g, 'поживи', 1400, 225, 72, W(4, 'поживи'), .4, { c: C.dgreen });
  const all = [];
  const t1 = W(4, 'ділитися') - .3;
  all.push(bacterium(g, 250, 600, .8, 0, t1, { sp: .7 }));
  const ar = (x, t) => { arrow(g, x, 600, x + 130, 600, t, .3, { bend: 0, w: 6 }); txt(g, '×2', x + 65, 560, 64, t + .2, .3, { a: 'middle', c: C.red }); };
  const t2 = W(4, 'двома') - .5; ar(345, t2 - .3);
  [540, 660].forEach((y, i) => all.push(bacterium(g, 600, y, .6, 0, t2 + i * .1, { sp: .5 })));
  const t3 = W(4, 'чотирма') - .5; ar(700, t3 - .3);
  [450, 550, 650, 750].forEach((y, i) => all.push(bacterium(g, 940, y, .5, 0, t3 + i * .08, { sp: .4 })));
  const t4 = t3 + .9; ar(1030, t4 - .3);
  for (let i = 0; i < 8; i++) all.push(bacterium(g, 1250 + (i % 2) * 125, 430 + Math.floor(i / 2) * 110, .42, 0, t4 + i * .07, { sp: .35 }));
  txt(g, '...', 1470, 640, 90, t4 + .8, .3);
  all.forEach((b, i) => wig(b.inner, t1, 12, 6, 1 + (i % 3) * .3, 'r', i * .37));
  const tc = W(4, 'двадцять') - .4;
  const ck = clock(g, 1660, 560, .95, tc);
  A(tc + .5, 1.6, v => { ck.hand._t.r = v * 720; }, io);
  txt(g, '20 хв', 1660, 700, 84, tc + .4, .4, { a: 'middle', c: C.red });
  txt(g, '×2', 1660, 790, 84, tc + .8, .3, { a: 'middle', c: C.red });
});

// ---------- BOARD 4: macrophage eats ----------
board([5], (g, S, W) => {
  const bs = [[1260, 440, -15], [1480, 610, 20], [1220, 770, 10]].map(([x, y, r], i) => {
    const b = bacterium(g, x, y, .8, r, .1 + i * .2, { sp: .6 });
    wig(b.inner, .1, 8, 7, 1.2, 'r', i * .3); return b;
  });
  const tm = W(5, 'макрофаги') - .6;
  const mph = macrophage(g, 560, 590, 1.08, tm);
  const tl = txt(g, 'МАКРОФАГ', 170, 210, 120, tm + .4, .6, { c: C.dpurple });
  underline(g, tl, tm + 1.0, .3);
  txt(g, 'клітина-охоронець', 180, 300, 70, W(5, 'охоронці') - .3, .6);
  wig(mph.inner, tm + 1, 6, .02, .7, 'sx'); wig(mph.inner, tm + 1, 6, .02, .7, 'sy', .5);
  g.appendChild(bs[0]); g.appendChild(bs[1]); g.appendChild(bs[2]);
  const te = W(5, 'ковтають') - .4;
  mv(mph, te - .3, .6, { x: 720 }, io);
  const inside = [[800, 520], [690, 650], [850, 670]];
  bs.forEach((b, i) => {
    const t0 = te + .2 + i * .45;
    mv(b, t0, .4, { x: inside[i][0], y: inside[i][1], s: .5 }, inq);
    fade(b, t0 + .35, .3, 1, .55);
  });
  txt(g, 'ГАМ!', 1050, 330, 130, te + .3, .3, { c: C.red });
  burst(g, 1120, 290, 120, 160, 5, -150, -30, te + .5, .3);
});

// ---------- BOARD 5: alarm -> inflammation ----------
board([6, 7], (g, S, W) => {
  const g1 = G(g);
  const mph = macrophage(g1, 330, 620, .62, .05);
  const ta = W(6, 'сполох') - .3;
  txt(g1, 'ТРИВОГА!', 110, 260, 115, ta, .55, { c: C.red });
  for (let k = 0; k < 3; k++) {
    const r = 150 + k * 45, a0 = -55 * Math.PI / 180, a1 = 55 * Math.PI / 180;
    const arc = stroke(g1, `M ${330 + Math.cos(a0) * r} ${620 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${330 + Math.cos(a1) * r} ${620 + Math.sin(a1) * r}`, ta + k * .12, .25, { c: C.yellow, w: 10 });
    A(ta + .6, 5, v => arc[0].setAttribute('opacity', .35 + .65 * Math.abs(Math.cos((v * 5 * 1.6 - k * .15) * Math.PI))), lin);
  }
  const V = vessel(g1, .5,
    'M 760 420 C 1000 400 1300 440 1840 420', 'M 760 720 C 1000 740 1300 700 1840 720', '', '');
  const vf = G(g1, 1300, 570); g1.insertBefore(vf, V.top);
  fill(vf, 'M -540 -150 L 540 -150 L 540 150 L -540 150 Z', C.lred, .8, .6);
  const rb = G(g1, 0, 0); g1.insertBefore(rb, V.top);
  rbcFlow(rb, .9, 9, 480, 660, 9, 760, 1840, 220);
  txt(g1, 'судина', 1380, 330, 70, .9, .4, { c: '#b8312a' });
  const ts = W(6, 'сигнальні') - .2;
  const R = rng(12);
  for (let i = 0; i < 9; i++) {
    const d = G(g1, 470, 600 + (R() - .5) * 100, 1);
    el('circle', { r: 11, fill: [C.yellow, C.orange, C.red][i % 3], stroke: INK, 'stroke-width': 3 }, d);
    fade(d, ts + i * .1, .1, 0, 1);
    mv(d, ts + i * .1, 1.3, { x: 820 + R() * 500, y: 470 + R() * 200 }, out);
  }
  const tw = W(6, 'розширюються') - .2;
  mv(V.top, tw, .8, { y: -50 }, outB); mv(V.bot, tw, .8, { y: 50 }, outB);
  vf._p.sy = 1; mv(vf, tw, .8, { sy: 1.33 }, outB);
  arrow(g1, 1700, 470, 1700, 330, tw + .2, .3, { bend: 0, w: 6 });
  arrow(g1, 1700, 670, 1700, 820, tw + .2, .3, { bend: 0, w: 6 });
  const tf = W(6, 'рідина') - .4;
  [950, 1150, 1350, 1550].forEach((x, i) => {
    const dd = dropShape(g1, x, 770, .35, tf + i * .12);
    mv(dd, tf + i * .12, 1.2, { y: 880 }, out);
  });
  // seg 7
  const s7 = S(7);
  mv(g1, s7 - .1, .45, { x: -120 }, io); fade(g1, s7 - .1, .4, 1, 0);
  const g2 = G(g);
  const c1 = W(7, 'червоніє') - .35;
  skinPatch(g2, 400, 430, 1, c1);
  fill(g2, blob(400, 430, 70, 60, .2, 8, 8), C.red, c1 + .3, .35, { op: .85 });
  stroke(g2, 'M 360 420 L 440 440', c1 + .5, .2, { c: '#8e1b14', w: 6 });
  txt(g2, 'червоніє', 400, 660, 90, c1 + .3, .5, { a: 'middle', c: C.red });
  const c2 = W(7, 'набрякає') - .35;
  const sw = G(g2, 960, 430, 1); skinPatch(sw, 0, 0, 1, c2);
  mv(sw, c2 + .6, .5, { s: 1.22 }, outB);
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => arrow(g2, 960 + dx * 165, 430 + dy * 150, 960 + dx * 215, 430 + dy * 195, c2 + .7, .2, { bend: 0, w: 6, head: 18 }));
  txt(g2, 'набрякає', 960, 660, 90, c2 + .3, .5, { a: 'middle', c: '#c06a2b' });
  const c3 = W(7, 'гарячою') - .35;
  thermometer(g2, 1520, 420, 1.05, c3);
  stroke(g2, 'M 1610 330 q 12 -20 0 -40 t 0 -40 M 1645 345 q 12 -20 0 -40 t 0 -40', c3 + .4, .3, { c: C.red, w: 6 });
  txt(g2, 'гаряча', 1520, 660, 90, c3 + .3, .5, { a: 'middle', c: C.red });
  const tp = W(7, 'поломка') - .3;
  const np = txt(g2, 'не поломка', 600, 845, 90, tp, .5, { a: 'middle', c: '#777' });
  stroke(g2, 'M 420 820 L 780 812', tp + .5, .25, { c: C.red, w: 9 });
  const to = W(7, 'оборона') - .3;
  const ob = txt(g2, 'а ОБОРОНА!', 1250, 855, 120, to, .6, { a: 'middle', c: C.blue });
  burst(g2, 1250, 810, 290, 330, 3, -20, 20, to + .6, .25);
  burst(g2, 1250, 810, 290, 330, 3, 160, 200, to + .6, .25);
});

// ---------- BOARD 6: neutrophils + DNA nets ----------
board([8, 9], (g, S, W) => {
  vessel(g, .05, 'M -20 120 C 500 100 1200 140 1940 115', 'M -20 300 C 600 320 1300 285 1940 305', '', '');
  const vf = G(g); g.insertBefore(vf, g.firstChild);
  fill(vf, 'M -20 120 C 500 100 1200 140 1940 115 L 1940 305 C 1300 285 600 320 -20 300 Z', C.lred, .3, .6);
  const rb = G(g); g.insertBefore(rb, vf.nextSibling);
  rbcFlow(rb, .4, 18, 160, 260, 12, -80, 2000, 300, .9);
  const bac = [[1400, 600, -10], [1600, 640, 15], [1470, 760, 25], [1660, 790, -20]].map(([x, y, r], i) => {
    const b = bacterium(g, x, y, .7, r, .6 + i * .2, { sp: .5 }); wig(b.inner, .6, 15, 7, 1.1, 'r', i * .4); return b;
  });
  const tn = W(8, 'поспішають') - .5;
  const finals = [[730, 650], [910, 730], [1070, 620]];
  const ns = finals.map((f, i) => {
    const n = neutrophil(g, -150 - i * 170, 210, .72, .1, { seed: 4 + i });
    mv(n, tn + i * .15, .7, { x: 520 + i * 200 }, out);
    stroke(g, `M ${330 + i * 200} ${190 + i * 6} L ${410 + i * 200} ${190 + i * 6} M ${310 + i * 200} ${225 + i * 6} L ${400 + i * 200} ${225 + i * 6}`, tn + .4 + i * .15, .2, { w: 5, c: '#8e1b14' });
    mv(n, tn + 1.1 + i * .12, .6, { x: f[0], y: f[1] }, io);
    wig(n.inner, tn + 1.7, 12, 5, 1.4, 'r', i * .3);
    return n;
  });
  const tl = W(8, 'нейтрофіли');
  const lb = txt(g, 'НЕЙТРОФІЛИ', 80, 470, 100, tl, .6, { c: C.dpink });
  txt(g, 'швидке реагування', 85, 550, 64, tl + .6, .6);
  const th = W(8, 'недовго') - .3;
  const hg = G(g, 160, 700, .8);
  shape(hg, 'M -40 -60 L 40 -60 L 4 0 L 40 60 L -40 60 L -4 0 Z', '#fff3c4', th, .5, { nof: 1 });
  fill(hg, 'M -22 34 L 22 34 L 36 56 L -36 56 Z', C.gold, th + .4, .2);
  txt(g, 'живуть недовго', 225, 720, 64, th + .2, .6);
  const tz = W(8, 'жорстко') - .5;
  ns.forEach((n, i) => { mv(n, tz + i * .08, .18, { x: finals[i][0] + 70 }, inq); mv(n, tz + .2 + i * .08, .3, { x: finals[i][0] }, out); });
  const bah = G(g);
  txt(bah, 'БАХ!', 1240, 480, 115, tz + .2, .25, { c: C.red });
  burst(bah, 1330, 440, 110, 150, 5, -160, -20, tz + .3, .25);
  // seg 9: nets
  const s9 = S(9);
  fade(bah, s9 - .1, .3, 1, 0);
  const tnet = W(9, 'сітки') - .5;
  mv(ns[2], tnet - .4, .4, { x: 1160, y: 640 }, io);
  let nd = '';
  for (let i = 0; i < 7; i++) { const x = 1290 + i * 75; nd += `M ${x} 520 Q ${x + 25} 680 ${x - 10} 850 `; }
  for (let j = 0; j < 5; j++) { const y = 540 + j * 75; nd += `M 1270 ${y} Q 1520 ${y + 25} 1770 ${y - 5} `; }
  stroke(g, nd, tnet, 1.0, { c: '#8b3fd9', w: 5 });
  txt(g, 'сітка з ДНК', 1290, 470, 84, W(9, 'днк') - .4, .6, { c: '#8b3fd9' });
  const dna = G(g, 1220, 435, .8);
  stroke(dna, 'M -40 -30 C -20 30 20 -60 40 0 M -40 0 C -20 -60 20 30 40 -30', W(9, 'днк') - .3, .4, { w: 5, c: '#8b3fd9' });
  bac.forEach((b, i) => { mv(b, tnet + .9, .6, { x: b._p.x + (1530 - b._p.x) * .25, y: b._p.y + (690 - b._p.y) * .25 }, io); wig(b.inner, tnet + .9, 5, 14, 2.6, 'r', i * .2); });
  const tf = W(9, 'рибу') - .4;
  const fish = G(g, 1180, 840, .9);
  shape(fish, 'M -40 0 C -20 -26 20 -26 40 0 C 20 26 -20 26 -40 0 Z M 40 0 L 66 -22 L 66 22 Z', C.orange, tf, .45);
  const eye = el('circle', { cx: -20, cy: -4, r: 5, fill: INK }, fish); fade(eye, tf + .4, .1, 0, 1);
  pop(fish, tf, .4);
});

// ---------- BOARD 7: dendritic -> lymph node -> T-cell key ----------
board([10, 11], (g, S, W) => {
  const g1 = G(g);
  const b1 = bacterium(g1, 280, 360, .6, -10, .05, { sp: .5 }), b2 = bacterium(g1, 520, 300, .6, 12, .2, { sp: .5 });
  const td = W(10, 'дендритні') - .5;
  const dc = dendritic(g1, 420, 650, .9, td);
  const lt = txt(g1, 'ДЕНДРИТНА КЛІТИНА', 640, 180, 96, td + .3, .8, { c: '#e0702a' });
  underline(g1, lt, td + 1.1, .35);
  wig(dc.inner, td + .8, 10, 5, .9);
  const tp = W(10, 'шматочки') - .4;
  const from = [[280, 360], [520, 300], [300, 380]], to = [[-70, -95], [80, -70], [20, 95]];
  from.forEach((f, i) => {
    const pc = G(dc.inner, (f[0] - 420) / .9, (f[1] - 650) / .9, 1);
    shape(pc, 'M 0 -18 L 18 14 L -18 14 Z', C.green, tp + i * .1, .25, { w: 4 });
    mv(pc, tp + .3 + i * .15, .6, { x: to[i][0], y: to[i][1] }, io);
  });
  fade(b1, tp + .3, .5, 1, 0); fade(b2, tp + .45, .5, 1, 0);
  const tn = W(10, 'лімфовузла') - 1.3;
  const ln = G(g1, 1450, 560, 1.1);
  shape(ln, 'M -150 -40 C -150 -130 -20 -140 40 -100 C 90 -70 160 -90 170 -10 C 180 80 80 130 -20 120 C -110 110 -150 50 -150 -40 Z', '#a8e6a1', tn, .8);
  txt(g1, 'ЛІМФОВУЗОЛ', 1460, 790, 88, tn + .5, .6, { a: 'middle', c: C.dgreen });
  const tc = W(10, 'несуть') - .2;
  arrow(g1, 580, 640, 1240, 580, tc, .5, { dash: '18 16', w: 6, bend: -.12 });
  mv(dc, tc + .5, 1.3, { x: 1430, y: 560 }, io); mv(dc.inner, tc + .5, 1.3, { s: .5 }, io);
  g1.appendChild(dc);
  // seg 11
  const s11 = S(11);
  mv(g1, s11 - .1, .45, { x: -120 }, io); fade(g1, s11 - .1, .4, 1, 0);
  const g2 = G(g);
  const tt = txt(g2, 'Т-КЛІТИНИ', 960, 165, 110, s11 + .15, .6, { a: 'middle', c: C.dtblue });
  const kinds = ['circle', 'square', 'diamond', 'tri', 'star'];
  const xs = [360, 660, 960, 1260, 1560];
  xs.forEach((x, i) => {
    const tcl = tcell(g2, x, 650, 1.0, s11 + .2 + i * .15);
    socket(tcl.inner, kinds[i], 0, -98, s11 + .5 + i * .15);
    stroke(tcl.inner, 'M 0 -72 L 0 -78', s11 + .5, .1, { w: 5 });
  });
  const dc2 = dendritic(g2, 120, 380, .5, s11 + .3);
  const key = G(dc2.inner, 0, 150, 1);
  shape(key, 'M 0 -26 L 26 18 L -26 18 Z', C.green, s11 + .6, .3, { w: 5 });
  const tsrch = W(11, 'шукають') - .3;
  xs.slice(0, 4).forEach((x, i) => {
    const t0 = tsrch + i * .55;
    mv(dc2, t0, .4, { x, y: 400 }, io);
    if (i < 3) xMark(g2, x + 70, 520, 18, t0 + .4, .15);
  });
  const tm = tsrch + 3 * .55 + .45;
  mv(dc2, tm, .3, { y: 430 }, outB);
  check(g2, 1340, 515, 26, tm + .2, .25);
  burst(g2, 1260, 560, 125, 165, 7, -170, -10, tm + .3, .3);
  txt(g2, 'ключ підійшов!', 1560, 400, 80, tm + .35, .6, { a: 'middle', c: C.red });
});

// ---------- BOARD 8: B-cells -> antibodies -> tagging -> cleanup ----------
board([12, 13], (g, S, W) => {
  const g1 = G(g);
  const t1 = tcell(g1, 250, 580, .9, .05);
  stroke(t1.inner, 'M -30 -120 L -10 -100 L 30 -140', .5, .2, { c: '#2fa84f', w: 9 });
  const ta = W(12, 'активує') - .3;
  arrow(g1, 350, 580, 600, 580, ta, .35, { bend: 0 });
  lightning(g1, 475, 480, .7, ta + .1);
  const tb = W(12, 'в-клітини') - .4;
  const bc = bcell(g1, 770, 580, 1.0, tb);
  txt(g1, 'В-КЛІТИНА', 770, 360, 90, tb + .2, .6, { a: 'middle', c: C.dbyellow });
  wig(bc.inner, tb + .6, 10, .03, 2, 's');
  const tab = W(12, 'антитіла') - .4;
  txt(g1, 'АНТИТІЛА', 1060, 230, 100, tab + .2, .5, { c: C.blue });
  txt(g1, 'тисячі щосекунди!', 1070, 320, 70, W(12, 'тисячі') - .2, .7, { c: C.red });
  const R = rng(31);
  for (let i = 0; i < 20; i++) {
    const t0 = tab + i * .11;
    const ab = antibody(g1, 770, 580, .2, R() * 360, t0, .12);
    mv(ab, t0, .8, { x: 1000 + R() * 800, y: 400 + R() * 440 }, out);
    mv(ab.inner, t0, .8, { s: .55 + R() * .25, r: R() * 360 }, out);
  }
  // seg 13
  const s13 = S(13);
  mv(g1, s13 - .1, .45, { x: -120 }, io); fade(g1, s13 - .1, .4, 1, 0);
  const g2 = G(g);
  const pos = [[1050, 420, -8], [1350, 590, 12], [1060, 760, 4]];
  const bs = pos.map(([x, y, r], i) => { const b = bacterium(g2, x, y, .9, r, s13 + .1 + i * .15, { sp: .5 }); wig(b.inner, s13 + .1, 8, 6, 1.2, 'r', i * .3); return b; });
  const tc = W(13, 'чіпляються') - .5;
  const spots = [[-30, -62, 180], [35, -62, 180], [-30, 62, 0], [35, 62, 0], [-95, 0, 90], [95, 0, -90]];
  bs.forEach((b, bi) => {
    spots.forEach(([dx, dy, r], k) => {
      const t0 = tc + bi * .25 + k * .07;
      const ab = antibody(b, 2050 - b._p.x + k * 30, -300 + k * 120, .6, r, t0 - .2, .05);
      mv(ab, t0, .55, { x: dx * .95, y: dy * .95 }, out);
    });
  });
  const tm = W(13, 'позначають') - .3;
  const st = G(g2, 1540, 330, 1, -8);
  txt(st, 'ПОЗНАЧЕНО!', 0, 0, 100, tm, .5, { a: 'middle', c: C.red });
  stroke(st, 'M -250 -85 L 250 -85 L 250 30 L -250 30 Z', tm + .4, .35, { c: C.red, w: 6 });
  const tmc = W(13, 'макрофагам') - .6;
  const mph = macrophage(g2, -320, 600, .95, tmc - .9, { mood: 'happy' });
  mv(mph, tmc, .8, { x: 480 }, out);
  const tpr = W(13, 'прибрати') - .4;
  bs.forEach((b, i) => {
    mv(b, tpr + i * .2, .5, { x: 470 + (i - 1) * 90, y: 560 + (i % 2) * 90, s: .38 }, inq);
  });
  g2.appendChild(bs[0]); g2.appendChild(bs[1]); g2.appendChild(bs[2]);
});

// ---------- BOARD 9: victory + memory cells ----------
board([14], (g, S, W) => {
  const tt = txt(g, 'ПЕРЕМОГА!', 960, 240, 165, .05, .7, { a: 'middle', c: C.red });
  burst(g, 960, 190, 430, 480, 3, -25, 25, .7, .25); burst(g, 960, 190, 430, 480, 3, 155, 205, .7, .25);
  const cells = [
    neutrophil(g, 330, 580, .75, .6, { mood: 'happy' }),
    macrophage(g, 650, 590, .42, .75, { mood: 'happy' }),
    bcell(g, 960, 560, 1.0, .9, { mood: 'happy' }),
    neutrophil(g, 1270, 580, .75, 1.05, { mood: 'happy', seed: 7 }),
    tcell(g, 1580, 580, .8, 1.2, { mood: 'happy' })
  ];
  cells.forEach((c, i) => wig(c.inner, 1, 6, 5, 1.1, 'y', i * .3));
  const tg = W(14, 'гине') - .4;
  [0, 1, 3, 4].forEach((k, i) => { fade(cells[k], tg + i * .1, .7, 1, .18); mv(cells[k], tg + i * .1, .7, { y: cells[k]._p.y + 40 }, io); });
  const tp = W(14, "пам") - .5;
  mv(cells[2].inner, tp, .5, { s: 1.3 }, outB);
  const star = G(g, 1060, 450, 1);
  shape(star, starPath(0, 0, 42, 19), C.gold, tp + .2, .4, { w: 5 });
  pop(star, tp + .2, .4);
  burst(g, 960, 560, 150, 200, 10, 0, 324, tp + .4, .35);
  const lt = txt(g, "КЛІТИНА ПАМ'ЯТІ", 960, 830, 96, tp + .3, .7, { a: 'middle', c: C.blue });
  underline(g, lt, tp + 1.0, .3);
});

// ---------- BOARD 10: second encounter ----------
board([15], (g, S, W) => {
  const mc = bcell(g, 430, 580, 1.05, .05, { mood: 'brave' });
  const star = G(g, 520, 480, 1); shape(star, starPath(0, 0, 36, 16), C.gold, .4, .35, { w: 5 });
  const tr = W(15, 'повернеться') - .8;
  const b = bacterium(g, 2100, 580, 1.0, 0, 0, { sp: .3 });
  mv(b, tr, .9, { x: 1350 }, out); wig(b.inner, tr, 6, 7, 1.3);
  txt(g, 'Ворог повернувся?', 1350, 330, 84, tr + .3, .7, { a: 'middle' });
  const tv = W(15, 'впізнає') - .4;
  const bub = G(g, 470, 300, 1);
  shape(bub, 'M -170 -60 C -170 -110 170 -110 170 -60 L 170 20 C 170 60 120 70 40 70 L 0 120 L -20 70 C -120 70 -170 60 -170 20 Z', '#ffffff', tv, .45, { nof: 1, w: 5 });
  txt(bub, 'Впізнав!', 0, 25, 80, tv + .35, .45, { a: 'middle', c: C.blue });
  const tz = W(15, 'знищить') - .3;
  lightning(g, 880, 560, .9, tz);
  const R = rng(4);
  for (let i = 0; i < 7; i++) {
    const t0 = tz + .1 + i * .06;
    const ab = antibody(g, 540, 560 + (R() - .5) * 120, .55, 90, t0, .05);
    mv(ab, t0, .35, { x: 1260 + R() * 60, y: 520 + R() * 120 }, inq);
    fade(ab, t0 + .5, .3, 1, 0);
  }
  xMark(g, 1350, 580, 70, tz + .55, .3);
  mv(b.inner, tz + .9, .5, { s: 0 }, inq);
  txt(g, 'МИТТЄВО!', 1350, 820, 120, tz + .6, .45, { a: 'middle', c: C.red });
  burst(g, 1350, 775, 260, 300, 3, -20, 20, tz + 1, .25); burst(g, 1350, 775, 260, 300, 3, 160, 200, tz + 1, .25);
});

// ---------- BOARD 11: outro ----------
board([16], (g, S, W) => {
  txt(g, 'Твоє тіло — це армія,', 960, 175, 110, .05, 1.0, { a: 'middle' });
  const sh = G(g, 960, 540, .95);
  shape(sh, shieldPath(), C.blue, .3, .9);
  shape(sh, heartPath(1.5), C.red, 1.0, .4);
  pop(sh, .3, .5);
  const cs = [
    macrophage(g, 520, 540, .5, .6, { mood: 'happy' }),
    neutrophil(g, 290, 700, .7, .8, { mood: 'happy' }),
    tcell(g, 1400, 460, .72, .9, { mood: 'happy' }),
    bcell(g, 1600, 690, .62, 1.0, { mood: 'happy' }),
    dendritic(g, 1680, 330, .45, 1.1, { mood: 'happy' })
  ];
  cs.forEach((c, i) => { pop(c.inner, .6 + i * .12, .4); wig(c.inner, 1, 8, 10, 1.3, 'y', i * .25); });
  const t2 = W(16, 'яка') - .2;
  const lt = txt(g, 'яка щодня воює за тебе', 960, 880, 96, t2, 1.1, { a: 'middle', c: C.red });
  underline(g, lt, t2 + 1.2, .4, C.blue);
  burst(g, 960, 540, 230, 270, 9, -170, -10, t2 + 1.4, .4);
});

// ---------- build ----------
let TOTAL = 0, SEGSTART = [];
function buildAll() {
  const root = document.getElementById('scenes');
  let t = 0;
  TIMING.forEach((s, i) => { SEGSTART[i] = t; t += s.dur + PAD; });
  TOTAL = t + HOLD;
  boards.forEach((bd, bi) => {
    B = SEGSTART[bd.segs[0]];
    const lastSeg = bd.segs[bd.segs.length - 1];
    const end = bi === boards.length - 1 ? TOTAL : SEGSTART[lastSeg] + TIMING[lastSeg].dur + PAD;
    const Lb = end - B;
    const g = G(root, 0, 0);
    const S = k => SEGSTART[k] - B;
    const W = (k, word) => {
      const seg = TIMING[k]; const wl = word.toLowerCase();
      for (const s of seg.sent) {
        const st = s.t.toLowerCase(); const idx = st.indexOf(wl);
        if (idx >= 0) return S(k) + LEAD + s.o + (idx / st.length) * s.d;
      }
      const idx = seg.text.toLowerCase().indexOf(wl);
      console.warn('word not in sentences', k, word);
      return S(k) + LEAD + Math.max(0, idx) / seg.text.length * seg.dur;
    };
    A(0, 0.001, v => { g.style.display = v > 0 ? 'inline' : 'none'; }, lin);
    bd.build(g, S, W, Lb);
    if (bi < boards.length - 1) A(Lb - .35, .4, v => { g._t.x = -180 * v; g.setAttribute('opacity', 1 - v); g.style.display = v >= 1 ? 'none' : 'inline'; }, inq);
  });
  initAnims();
}
