// Storyboard as data: every element is keyed to a word of the voice-over.
// Used by the renderer (Remotion) AND by tools/export_cues.mjs (SFX cue sheet + static-frame QA).
// Coordinates are in a 1920x1080 board. Times in seconds.
// SAFETY: no national/party symbols anywhere. Soviet soldiers wear a plain olive cap (no star).

const RED = '#E8322B', INK = '#1A1A1A', GREEN = '#3BA55C', BLUE = '#1E88E5', KHAKI = '#C2B280', GREY = '#9AA3AA';

export function buildBoards(T, MAPS) {
  const sc = (i) => T.scenes[i - 1];
  // time of the n-th word in scene i that matches `key` (exact first, then prefix)
  const W = (i, key, n = 1, off = 0) => {
    const ws = sc(i).words;
    let hits = ws.filter((w) => w.w === key);
    if (hits.length < n) hits = ws.filter((w) => w.w.startsWith(key));
    if (hits.length < n) throw new Error(`word not found: scene ${i} "${key}" #${n}`);
    return +(hits[n - 1].s + off).toFixed(3);
  };
  const mp = (name, lon, lat, x, y, s = 1) => {
    const [lon0, lat1, kx, ky] = MAPS[name].proj;
    return [x + (lon - lon0) * kx * s, y + (lat1 - lat) * ky * s];
  };
  const title = (text, at, extra = {}) => ({ k: 'write', text, x: 90, y: 135, size: 70, at, ul: true, sfx: 'marker_squeak_long', ...extra });
  const label = (text, x, y, at, extra = {}) => ({ k: 'write', text, x, y, size: 46, font: 'cb', anchor: 'middle', at, ...extra });
  const icon = (icon, x, y, s, at, extra = {}) => ({ k: 'sketch', icon, x, y, s, at, ...extra });
  const B = [];
  const board = (from, to, els, extra = {}) => B.push({ from, to, start: sc(from).start, end: sc(to).end, els, ...extra });

  // ---------- B1 HOOK ----------
  board(1, 1, [
    { k: 'person', x: 600, y: 560, s: 1.95, at: 0.15, faceAt: [[W(1, 'refused'), 'worried']], sfx: 'marker_squeak_long' },
    label('DOZENS OF JOBS', 600, 160, W(1, 'dozens'), { size: 66, font: 'pm' }),
    icon('spade', 1010, 300, 0.95, W(1, 'dug'), { sfx: 'pop' }),
    icon('boot', 1060, 560, 0.9, W(1, 'marched'), { sfx: 'pop' }),
    icon('wrap', 1010, 790, 0.9, W(1, 'wrapped'), { sfx: 'pop' }),
    icon('pencil', 1520, 380, 1.4, W(1, 'ten', 1, -0.2), { rot: -20, sfx: 'marker_squeak_short' }),
    { k: 'write', text: '10 SECONDS', x: 1520, y: 620, size: 96, color: RED, anchor: 'middle', at: W(1, 'seconds') },
    { k: 'burst', x: 1520, y: 590, w: 520, h: 90, at: W(1, 'pencil') },
    { k: 'cross', x: 1520, y: 380, size: 260, at: W(1, 'refused'), sfx: 'reveal_ding' },
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => icon('tree', 260 + i * 240, 990, 0.5, W(1, 'decades') + i * 0.08, { sfx: i === 0 ? 'soft_whoosh' : undefined })),
    ...[0, 1, 2].map((i) => ({ k: 'person', kind: 'volunteer', x: 380 + i * 480, y: 1000, s: 0.3, at: W(1, 'dig') + i * 0.2 })),
    ...[0, 1, 2].map((i) => icon('spade', 425 + i * 480, 1012, 0.26, W(1, 'dig') + 0.3 + i * 0.2, { rot: 25, fixed: true })),
  ]);

  // ---------- B2 ONE DAY ----------
  board(2, 2, [
    title('ONE DAY. 1943.', W(2, 'live')),
    { k: 'pie', x: 900, y: 600, r: 250, at: W(2, 'ordinary'), sfx: 'tick_tock', slices: [
      { frac: 0.06, color: RED, at: W(2, 'shooting') },
      { frac: 0.94, color: KHAKI, at: W(2, 'everything') },
    ] },
    { k: 'arrow', x1: 1320, y1: 380, x2: 950, y2: 370, bend: 0.25, at: W(2, 'shooting', 1, 0.2), label: 'SHOOTING?', lx: 1250, ly: 340 },
    label('EVERYTHING ELSE', 1440, 760, W(2, 'everything', 1, 0.3), { size: 60, color: INK }),
    { k: 'arrow', x1: 1330, y1: 730, x2: 1110, y2: 680, bend: -0.2, at: W(2, 'between'), color: INK, w: 6 },
  ]);

  // ---------- B3 4:00 AM, DUGOUT ----------
  board(3, 3, [
    { k: 'clock', x: 175, y: 175, r: 85, at: W(3, 'four'), hour: 4, hourAt: W(3, 'morning'), sfx: 'tick_tock' },
    { k: 'write', text: '4:00 AM', x: 290, y: 200, size: 64, at: W(3, 'morning'), ul: true },
    { k: 'write', text: 'EASTERN FRONT · 1943', x: 290, y: 280, size: 44, font: 'cb', at: W(3, 'eastern'), color: BLUE },
    { k: 'dugout', x: 960, y: 640, at: W(3, 'eastern', 1, 0.6), mudAt: W(3, 'mud'), sfx: 'paper_unfold' },
    { k: 'person', pose: 'sit', x: 700, y: 665, s: 0.6, at: W(3, 'soldier'), face: 'sleepy', faceAt: [[W(3, 'wakes', 1, 0.3), 'neutral']] },
    { k: 'write', text: 'ZEMLYANKA = DUGOUT', x: 1500, y: 300, size: 54, anchor: 'middle', at: W(3, 'zemlyanka'), ul: true, sfx: 'marker_squeak_long' },
    label('logs & earth', 960, 380, W(3, 'logs'), { size: 48, color: '#8B5A2B' }),
    icon('stove', 1220, 690, 0.95, W(3, 'stove'), { sfx: 'pop' }),
    { k: 'smoke', x: 1220, y: 600, at: W(3, 'stove', 1, 0.7), h: 120 },
    { k: 'person', pose: 'sit', x: 440, y: 665, s: 0.6, at: W(3, 'several'), face: 'sleepy' },
    { k: 'person', pose: 'sit', x: 570, y: 665, s: 0.6, at: W(3, 'shoulder'), face: 'sleepy' },
  ]);

  // ---------- B4 WHO IS HE (map) ----------
  {
    const MX = 230, MY = 220, MS = 0.9;
    const p = (lon, lat) => mp('ussr', lon, lat, MX, MY, MS);
    const nat = [['UKRAINIAN', 31, 49, 'ukrainian'], ['KAZAKH', 68, 48, 'kazakh'], ['GEORGIAN', 43.5, 41.8, 'georgian'], ['BELARUSIAN', 27.5, 53.8, 'belarusian'], ['RUSSIAN', 44, 58, 'russian']];
    const els = [
      { k: 'map', name: 'ussr', x: MX, y: MY, s: MS, at: W(4, 'red'), fills: [{ codes: ['RUS', 'UKR', 'BLR', 'KAZ', 'GEO', 'ARM', 'AZE', 'UZB', 'TKM', 'KGZ', 'TJK', 'MDA', 'LTU', 'LVA', 'EST'], color: KHAKI, at: W(4, 'soviet') }], sfx: 'paper_unfold' },
      { k: 'write', text: 'USSR', x: p(95, 64)[0], y: p(95, 64)[1], size: 80, anchor: 'middle', at: W(4, 'union'), ul: true },
      title('WHO IS HE?', W(4, 'who')),
    ];
    const OFF = { UKRAINIAN: [-60, 110], KAZAKH: [40, 90], GEORGIAN: [140, 120], BELARUSIAN: [-90, -90], RUSSIAN: [120, -120] };
    nat.forEach(([t, lon, lat, w], i) => {
      const [x, y] = p(lon, lat);
      const [dx, dy] = OFF[t];
      const at = W(4, w, i === 4 ? 2 : 1);
      els.push({ k: 'dot', x, y, at, r: 12, color: RED, sfx: 'pop' });
      els.push({ k: 'line', d: `M${x},${y} L${x + dx * 0.8},${y + dy * 0.8 - (dy < 0 ? -10 : 30)}`, at, dur: 0.25, w: 3, color: INK });
      els.push({ k: 'write', text: t, x: x + dx, y: y + dy, size: 40, font: 'pm', anchor: 'middle', at: at + 0.05, color: INK });
    });
    els.push({ k: 'person', kind: 'woman', x: 1700, y: 600, s: 1.0, at: W(4, 'women'), face: 'smile', sfx: 'marker_squeak_short' });
    els.push({ k: 'write', text: 'HUNDREDS OF\nTHOUSANDS', x: 1700, y: 900, size: 46, anchor: 'middle', at: W(4, 'hundreds'), color: RED });
    els.push({ k: 'burst', x: 1700, y: 915, w: 330, h: 90, at: W(4, 'thousands') });
    board(4, 4, els);
  }

  // ---------- B5 FEET ----------
  board(5, 5, [
    title('JOB No. 1: FEET', W(5, 'first')),
    icon('foot', 360, 560, 1.4, W(5, 'feet'), { sfx: 'marker_squeak_short' }),
    icon('sock', 760, 560, 1.2, W(5, 'socks', 1, -0.3)),
    { k: 'cross', x: 760, y: 560, size: 230, at: W(5, 'socks', 1, 0.2), sfx: 'marker_squeak_short' },
    label('NO SOCKS', 760, 810, W(5, 'socks', 1, 0.4), { color: RED, size: 56 }),
    icon('wrap', 1180, 560, 1.25, W(5, 'portyanki', 1, -0.1), { sfx: 'paper_unfold' }),
    label('PORTYANKI\n= FOOT WRAPS', 1180, 790, W(5, 'rectangles'), { size: 50 }),
    icon('foot', 1600, 520, 1.05, W(5, 'wrapped')),
    icon('wrap', 1610, 560, 0.75, W(5, 'around'), { rot: 80, noFill: false }),
    icon('boot', 1600, 520, 1.1, W(5, 'boot'), { sfx: 'pop' }),
  ]);

  // ---------- B6 WHY WRAPS WORK ----------
  board(6, 6, [
    { k: 'line', d: 'M960,180 C955,400 965,600 960,760', at: W(6, 'sounds'), w: 5 },
    { k: 'write', text: 'SOCK', x: 480, y: 220, size: 70, anchor: 'middle', at: W(6, 'sock'), ul: true },
    icon('sock', 480, 470, 1.3, W(6, 'wet')),
    ...[0, 1, 2].map((i) => icon('drop', 380 + i * 100, 330 + (i % 2) * 40, 0.25, W(6, 'stays') + i * 0.12, { sfx: i === 0 ? 'pop' : undefined })),
    label('STAYS WET', 480, 720, W(6, 'wet', 2), { color: BLUE, size: 56 }),
    { k: 'write', text: 'WRAP', x: 1440, y: 220, size: 70, anchor: 'middle', at: W(6, 'wrap'), ul: true },
    { k: 'spin', at: W(6, 'turned'), dur: 1.0, deg: 180, cx: 1440, cy: 470, els: [icon('wrap', 1440, 470, 1.3, W(6, 'unwound', 1, -0.3), { sfx: 'paper_unfold' })] },
    label('DRY END ON THE TOES', 1440, 720, W(6, 'dry'), { color: GREEN, size: 52 }),
    label('he walked everywhere', 1440, 800, W(6, 'walked'), { size: 44 }),
    label('socks only from...', 1330, 980, W(6, 'replacing'), { size: 44, color: RED }),
    { k: 'check', x: 1700, y: 470, size: 110, at: W(6, 'mattered') },
    { k: 'calendar', x: 960, y: 900, w: 240, size: 64, at: W(6, 'idea'), pages: [{ text: '1943', at: W(6, 'idea') }, { text: '2013', at: W(6, 'twenty') }], sfx: 'counter_roll' },
    { k: 'burst', x: 960, y: 930, w: 260, h: 90, at: W(6, 'thirteen'), sfx: 'reveal_ding' },
  ]);

  // ---------- B7 BRIDGE ----------
  board(7, 7, [
    { k: 'person', x: 820, y: 560, s: 1.35, at: W(7, 'dry', 1, -0.15), face: 'neutral', faceAt: [[W(7, 'strange'), 'worried']] },
    label('grrr...', 1030, 640, W(7, 'feed'), { size: 64, color: '#8B5A2B' }),
    { k: 'write', text: '?', x: 1250, y: 520, size: 260, color: RED, anchor: 'middle', at: W(7, 'strange'), sfx: 'tension_riser' },
  ]);

  // ---------- B8 BREAKFAST IN THE DARK (8-10) ----------
  board(8, 10, [
    title('BREAKFAST IN THE DARK', W(8, 'breakfast')),
    icon('kitchen', 470, 650, 1.5, W(8, 'field'), { sfx: 'marker_squeak_long' }),
    { k: 'smoke', x: 509, y: 520, at: W(8, 'smoke'), h: 240 },
    { k: 'group', until: W(9, 'so', 1, 0.6), els: [
      icon('gun', 1600, 640, 1.3, W(8, 'artillery', 1, -0.2), { flip: true, sfx: 'artillery_distant' }),
      { k: 'arrow', x1: 1450, y1: 560, x2: 560, y2: 300, bend: -0.22, at: W(8, 'aim', 1, -0.3), dash: true, label: 'AIM HERE', lx: 1000, ly: 250 },
    ] },
    { k: 'tint', keys: [[W(9, 'before'), 1]] },
    { k: 'line', d: 'M1460,240 C1450,420 1470,620 1455,860', at: W(9, 'line'), w: 9, color: RED, dash: '26 18' },
    label('FRONT LINE', 1560, 230, W(9, 'line', 1, 0.2), { color: RED, size: 50 }),
    { k: 'arrow', x1: 720, y1: 820, x2: 1430, y2: 820, bend: 0.02, at: W(9, 'few'), color: INK, w: 6, label: 'A FEW KM', lx: 960, ly: 790 },
    { k: 'group', until: W(10, 'hauled'), els: [
      { k: 'person', pose: 'hold', x: 980, y: 600, s: 0.85, at: W(9, 'carried', 1, -0.2), face: 'worried' },
      icon('thermos', 993, 605, 0.32, W(9, 'carried'), { sfx: 'pop', fixed: true }),
    ] },
    { k: 'trench', at: W(10, 'hauled'), pts: [[600, 950], [760, 890], [900, 960], [1040, 890], [1180, 960], [1320, 895], [1440, 950]], sfx: 'marker_squeak_long' },
    { k: 'mover', at: W(10, 'forward', 1, -0.4), t0: W(10, 'forward'), t1: W(10, 'night', 1, 0.6), pts: [[600, 930], [760, 870], [900, 940], [1040, 870], [1180, 940], [1300, 880]], els: [
      { k: 'person', pose: 'hold', x: 0, y: -40, s: 0.42, at: W(10, 'forward', 1, -0.4), face: 'worried' },
      icon('thermos', 6, -36, 0.16, W(10, 'forward', 1, -0.3), { fixed: true }),
    ] },
    icon('puff', 880, 760, 0.55, W(10, 'fire'), { sfx: 'artillery_distant' }),
    icon('puff', 1180, 780, 0.5, W(10, 'fire', 1, 0.7)),
    icon('helmet', 1280, 1000, 0.42, W(10, 'never'), { sfx: 'impact' }),
    icon('thermos', 1370, 1005, 0.3, W(10, 'soup', 1, -0.3), { rot: 80 }),
  ], { cam: [[W(10, 'hauled'), 1.05, 1000, 640]] });

  // ---------- B9 PLAN VS REALITY (11-12) ----------
  board(11, 12, [
    { k: 'write', text: 'THE PLAN', x: 480, y: 210, size: 72, anchor: 'middle', at: W(11, 'in'), ul: true, sfx: 'marker_squeak_long' },
    icon('bowl', 360, 450, 0.95, W(11, 'twice'), { sfx: 'pop' }),
    icon('bowl', 600, 450, 0.95, W(11, 'day', 1, -0.1), { sfx: 'pop' }),
    icon('sun', 360, 290, 0.38, W(11, 'dawn')),
    icon('moon', 600, 290, 0.38, W(11, 'dark')),
    label('2 HOT MEALS', 480, 640, W(11, 'dark', 1, 0.3), { size: 54, color: GREEN }),
    { k: 'line', d: 'M960,180 C955,400 965,600 960,720', at: W(11, 'practice'), w: 5 },
    { k: 'write', text: 'REALITY', x: 1440, y: 210, size: 72, anchor: 'middle', at: W(11, 'practice'), ul: true },
    icon('bowl', 1440, 450, 0.95, W(11, 'once', 3, -0.2), { sfx: 'pop' }),
    label('OFTEN JUST 1', 1440, 640, W(11, 'once', 3, 0.3), { size: 54, color: RED }),
    icon('bread', 1220, 830, 0.7, W(11, 'bread'), { sfx: 'pop' }),
    icon('crackers', 1450, 830, 0.7, W(11, 'crackers'), { sfx: 'pop' }),
    icon('tin', 1680, 830, 0.7, W(11, 'tin'), { sfx: 'pop' }),
    { k: 'rise', at: W(12, 'sun'), dur: 2.2, dy: -170, els: [icon('sun', 480, 1060, 0.7, W(12, 'sun', 1, -0.3), { sfx: 'soft_whoosh' })] },
    { k: 'write', text: '?', x: 960, y: 900, size: 240, color: RED, anchor: 'middle', at: W(12, 'what'), sfx: 'tension_riser' },
  ]);

  // ---------- B10 THE SPADE (13-14) ----------
  const section = (x, at, kind, text, until) => {
    const g = `M${x - 150},500 L${x + 150},500 L${x + 150},640 L${x - 150},640 Z`;
    const hole = kind === 'fox' ? `M${x - 70},500 L${x - 60},590 L${x + 60},590 L${x + 70},500 Z` : kind === 'trench' ? `M${x - 30},500 L${x - 28},620 L${x + 28},620 L${x + 30},500 Z` : `M${x - 80},520 L${x - 80},620 L${x + 80},620 L${x + 80},520 Z`;
    const els = [
      { k: 'shape', d: g, fill: '#A47148', at },
      { k: 'shape', d: hole, fill: '#F3EBD9', at: at + 0.3, tint: 1 },
      label(text, x, 710, at + 0.4, { size: 40 }),
    ];
    if (kind === 'shelter') [0, 1, 2, 3, 4].forEach((i) => els.push({ k: 'shape', d: `M${x - 90 + i * 45},505 C${x - 90 + i * 45},490 ${x - 60 + i * 45},490 ${x - 60 + i * 45},505 C${x - 60 + i * 45},520 ${x - 90 + i * 45},520 ${x - 90 + i * 45},505 Z`, fill: '#B07D48', at: at + 0.5 + i * 0.05 }));
    return { k: 'group', until, els };
  };
  board(13, 14, [
    title('THE SPADE', W(13, 'digs')),
    icon('spade', 230, 600, 1.6, W(13, 'digs', 1, 0.2), { sfx: 'marker_squeak_short' }),
    section(640, W(13, 'hole'), 'fox', 'A HOLE TO LIE IN', W(14, 'his')),
    section(1090, W(13, 'trench'), 'trench', 'A TRENCH TO MOVE IN', W(14, 'his')),
    section(1540, W(13, 'shelter'), 'shelter', 'A SHELTER', W(14, 'his')),
    { k: 'shape', d: 'M520,640 L1640,640 L1640,900 L520,900 Z', fill: '#A47148', at: W(14, 'his', 1, 0.2) },
    { k: 'shape', d: 'M800,640 L815,800 L1100,800 L1115,640 Z', fill: '#F3EBD9', at: W(14, 'spade'), tint: 1 },
    { k: 'person', pose: 'lie', x: 960, y: 740, s: 0.5, at: W(14, 'tool'), face: 'worried' },
    { k: 'mover', at: W(14, 'shell', 1, -0.5), t0: W(14, 'shell', 1, -0.5), t1: W(14, 'landed', 1, 0.1), pts: [[1350, 120], [1350, 560]], until: W(14, 'landed', 1, 0.1), els: [icon('shell', 0, 0, 0.55, W(14, 'shell', 1, -0.5), { rot: 180 })] },
    { k: 'group', from: W(14, 'landed', 1, 0.1), els: [icon('puff', 1350, 580, 1.0, W(14, 'landed', 1, 0.1), { sfx: 'artillery_distant' })] },
    { k: 'arrow', x1: 1500, y1: 360, x2: 1120, y2: 690, bend: 0.2, at: W(14, 'nearby'), label: 'THE HOLE SAVES HIM', lx: 1360, ly: 320 },
  ]);

  // ---------- B11 KURSK (15-17) ----------
  {
    const MX = 260, MY = 160, MS = 1.0;
    const [kx, ky] = mp('east', 36.19, 51.73, MX, MY, MS);
    const bulge = (r, off) => `M${kx + 60 - off},${ky - 150 - r} C${kx - 120 - r},${ky - 140 - r} ${kx - 190 - r},${ky + 60} ${kx - 90 - r * 0.6},${ky + 140 + r * 0.6} C${kx - 30},${ky + 190 + r * 0.6} ${kx + 40 - off},${ky + 170 + r * 0.6} ${kx + 70 - off},${ky + 160 + r}`;
    const [mx, my] = mp('east', 37.62, 55.75, MX, MY, MS);
    board(15, 17, [
      { k: 'map', name: 'east', x: MX, y: MY, s: MS, at: W(15, 'look', 1, -0.2), fills: [{ codes: ['RUS', 'UKR', 'BLR'], color: KHAKI, at: W(15, 'kursk', 1, 0.3) }], sfx: 'paper_unfold' },
      { k: 'dot', x: mx, y: my, at: W(15, 'summer'), r: 9, color: INK },
      { k: 'write', text: 'Moscow', x: mx + 18, y: my - 12, size: 40, font: 'cb', at: W(15, 'summer') },
      { k: 'dot', x: kx, y: ky, at: W(15, 'kursk'), r: 12, sfx: 'pop' },
      { k: 'write', text: 'KURSK 1943', x: kx + 30, y: ky - 24, size: 54, at: W(15, 'kursk', 1, 0.2), ul: true },
      { k: 'line', d: bulge(0, 0), at: W(15, 'dug'), w: 16, color: '#8B5A2B', sfx: 'marker_squeak_long' },
      { k: 'line', d: bulge(-40, 20), at: W(15, 'lines'), w: 12, color: '#8B5A2B' },
      { k: 'line', d: bulge(-80, 40), at: W(15, 'belt'), w: 10, color: '#8B5A2B' },
      { k: 'line', d: bulge(-115, 55), at: W(15, 'belt', 2), w: 8, color: '#8B5A2B' },
      { k: 'write', text: 'THOUSANDS OF KM\nOF TRENCHES', x: 1430, y: 820, size: 54, anchor: 'middle', at: W(15, 'thousands'), color: RED, sfx: 'counter_roll' },
      { k: 'burst', x: 1430, y: 840, w: 470, h: 110, at: W(15, 'trenches') },
      ...Array.from({ length: 9 }).map((_, i) => ({ k: 'person', kind: 'soldier', x: kx - 160 + (i % 3) * 60 + (i > 5 ? 20 : 0), y: ky - 90 + Math.floor(i / 3) * 90, s: 0.14, at: W(16, 'people') + i * 0.12, sfx: i % 3 === 0 ? 'marker_tap' : undefined })),
      { k: 'arrow', x1: kx - 200, y1: ky + 20, x2: MX + 140, y2: ky - 60, bend: 0.12, at: W(17, 'west'), w: 16, label: 'WEST', lx: MX + 240, ly: ky - 110, sfx: 'soft_whoosh' },
      label('2 YEARS', MX + 520, ky + 60, W(17, 'years'), { color: RED, size: 50 }),
      label('dug by hand, not machines', 1430, 990, W(16, 'machines'), { size: 48 }),
      { k: 'group', until: W(17, 'survive', 1, -0.3), els: [label('a trench does not move', 520, 1010, W(17, 'move'), { size: 48 })] },
      label('first: survive the season', 960, 1010, W(17, 'survive'), { size: 50, color: BLUE }),
    ], { cam: [[W(15, 'kursk', 1, 0.3), 1.45, kx - 60, ky], [W(16, 'spade', 1, 0.4), 1.0, 960, 540]] });
  }

  // ---------- B12 WINTER (18-19) ----------
  board(18, 19, [
    { k: 'frost', at: W(18, 'winter') },
    { k: 'group', until: W(19, 'his'), els: [icon('spade', 330, 560, 1.1, W(18, 'but')), { k: 'write', text: '?', x: 520, y: 520, size: 200, color: RED, anchor: 'middle', at: W(18, 'solve') }] },
    title('WINTER', W(18, 'winter'), { color: BLUE }),
    { k: 'thermo', x: 1700, y: 560, s: 1.25, at: W(18, 'cold', 1, -0.2), dropAt: W(18, 'kill'), sfx: 'tick_tock' },
    { k: 'person', x: 1200, y: 560, s: 1.1, at: W(18, 'eastern'), face: 'worried', shiver: true, until: W(19, 'his') },
    { k: 'group', until: W(19, 'his'), els: [label('the cold could kill', 1200, 900, W(18, 'kill'), { color: BLUE, size: 50 })] },
    icon('greatcoat', 300, 520, 1.3, W(19, 'greatcoat', 1, -0.2), { sfx: 'marker_squeak_short' }),
    label('COAT = BLANKET', 300, 800, W(19, 'blanket'), { size: 48 }),
    icon('jacket', 720, 520, 1.3, W(19, 'quilted', 1, -0.2), { sfx: 'marker_squeak_short' }),
    label('TELOGREIKA', 720, 800, W(19, 'telogreika'), { size: 52, color: RED }),
    { k: 'group', from: W(19, 'boots', 1, -0.3), els: [icon('valenki', 1200, 900, 0.75, W(19, 'boots', 1, -0.3), { sfx: 'pop' })] },
    label('VALENKI = FELT BOOTS', 1200, 1040, W(19, 'valenki'), { size: 46, color: RED }),
  ]);

  // ---------- B13 MOSCOW 1941 + ROAD (20-21) ----------
  board(20, 21, [
    { k: 'write', text: 'MOSCOW · WINTER 1941', x: 960, y: 140, size: 64, anchor: 'middle', at: W(20, 'moscow'), ul: true, sfx: 'marker_squeak_long' },
    { k: 'group', until: W(21, 'front', 1, -0.2), els: [
      { k: 'person', x: 560, y: 560, s: 1.35, at: W(20, 'first'), valenki: true, face: 'neutral' },
      { k: 'person', kind: 'german', x: 1360, y: 560, s: 1.35, at: W(20, 'german'), face: 'worried', shiver: true, sfx: 'marker_squeak_short' },
      label('GERMANY', 1360, 930, W(20, 'german', 1, 0.3), { size: 50, font: 'pm' }),
      ...[0, 1, 2].map((i) => ({ k: 'line', d: `M${1520 + i * 20},${420 + i * 60} C${1540 + i * 20},${430 + i * 60} ${1530 + i * 20},${450 + i * 60} ${1560 + i * 20},${455 + i * 60}`, at: W(20, 'without') + i * 0.1, w: 6, color: BLUE })),
      label('no winter clothing', 1360, 990, W(20, 'clothing'), { size: 44, color: BLUE }),
      label('BETTER DRESSED', 560, 930, W(20, 'better'), { size: 54, color: GREEN }),
      { k: 'check', x: 780, y: 330, size: 110, at: W(20, 'dressed') },
    ] },
    { k: 'line', d: 'M1750,980 C1300,880 900,760 420,640', at: W(21, 'front', 1, -0.2), w: 7, sfx: 'marker_squeak_long' },
    { k: 'line', d: 'M1900,900 C1450,800 1000,680 520,580', at: W(21, 'front'), w: 7 },
    { k: 'person', pose: 'walk', x: 1500, y: 790, s: 0.5, at: W(21, 'moved') },
    { k: 'write', text: '?', x: 400, y: 560, size: 220, color: RED, anchor: 'middle', at: W(21, 'how'), sfx: 'tension_riser' },
    label('SUPPLY?', 640, 420, W(21, 'supply'), { size: 60, color: RED }),
  ]);

  // ---------- B14 THE LONG WALK (22-23) ----------
  board(22, 23, [
    title('THE LONG WALK', W(22, 'walks')),
    { k: 'line', d: 'M80,820 C600,812 1300,828 1840,816', at: W(22, 'walks'), w: 6 },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ k: 'line', d: `M${200 + i * 280},845 L${260 + i * 280},845`, at: W(22, 'foot') + i * 0.05, w: 5, color: GREY })),
    { k: 'person', pose: 'walk', x: 640, y: 600, s: 1.45, at: W(22, 'walks', 1, 0.1) },
    icon('rifle', 600, 520, 0.8, W(22, 'rifle'), { rot: -62, sfx: 'pop', fixed: true }),
    icon('cloth', 650, 430, 0.42, W(22, 'greatcoat'), { rot: 20, sfx: 'pop', fixed: true }),
    icon('maskbag', 730, 640, 0.36, W(22, 'gas'), { sfx: 'pop', fixed: true }),
    icon('spade', 560, 660, 0.42, W(22, 'spade'), { rot: 20, sfx: 'pop', fixed: true }),
    { k: 'mover', at: W(23, 'trucks', 1, -0.3), t0: W(23, 'trucks', 1, -0.3), t1: W(23, 'past', 1, 0.8), pts: [[2200, 650], [1340, 650]], els: [icon('truck', 0, 0, 1.6, W(23, 'trucks', 1, -0.3), { sfx: 'soft_whoosh', flip: true })] },
    { k: 'write', text: 'MADE IN USA', x: 1340, y: 400, size: 70, anchor: 'middle', at: W(23, 'american'), color: RED, ul: true, sfx: 'reveal_ding' },
    label('his shells & his bread', 1340, 950, W(23, 'carrying'), { size: 46 }),
  ]);

  // ---------- B15 LEND-LEASE MAP (24) ----------
  {
    const MX = 160, MY = 170, MS = 1.0;
    const [ux, uy] = mp('world', -97, 40, MX, MY, MS);
    const [sx, sy] = mp('world', 50, 56, MX, MY, MS);
    board(24, 24, [
      { k: 'write', text: 'LEND-LEASE', x: 960, y: 130, size: 70, anchor: 'middle', at: W(24, 'lend'), ul: true, sfx: 'marker_squeak_long' },
      { k: 'map', name: 'world', x: MX, y: MY, s: MS, at: W(24, 'through'), fills: [{ codes: ['USA'], color: BLUE, at: W(24, 'united') }, { codes: ['RUS', 'UKR', 'BLR', 'KAZ', 'GEO', 'ARM', 'AZE', 'UZB', 'TKM', 'KGZ', 'TJK', 'MDA', 'LTU', 'LVA', 'EST'], color: KHAKI, at: W(24, 'soviet') }] },
      { k: 'write', text: 'USA', x: ux, y: uy, size: 56, anchor: 'middle', at: W(24, 'united', 1, 0.3) },
      { k: 'write', text: 'USSR', x: sx, y: sy, size: 56, anchor: 'middle', at: W(24, 'union', 1, 0.2) },
      { k: 'arrow', x1: ux + 80, y1: uy - 60, x2: sx - 80, y2: sy - 40, bend: -0.18, at: W(24, 'sent'), w: 12 },
      ...[0, 1, 2, 3, 4].map((i) => icon('truck', 640 + i * 160, 800, 0.42, W(24, 'hundreds') + i * 0.15, { sfx: i === 0 ? 'counter_roll' : undefined })),
      { k: 'write', text: 'HUNDREDS OF THOUSANDS', x: 960, y: 950, size: 58, anchor: 'middle', at: W(24, 'thousands'), color: RED },
      { k: 'burst', x: 960, y: 930, w: 760, h: 80, at: W(24, 'jeeps') },
      { k: 'write', text: 'STUDEBAKER', x: 1560, y: 700, size: 52, anchor: 'middle', at: W(24, 'studebaker'), ul: true, sfx: 'pop' },
    ]);
  }

  // ---------- B16 SECOND FRONT (25-27) ----------
  board(25, 27, [
    { k: 'group', until: W(26, 'because'), els: [
      icon('tin', 700, 540, 2.1, W(25, 'tins', 1, -0.2), { sfx: 'marker_squeak_short' }),
      { k: 'write', text: 'SECOND FRONT', x: 700, y: 572, size: 40, anchor: 'middle', at: W(25, 'second'), color: '#FFFFFF', sfx: 'marker_squeak_long' },
      label('canned meat · USA', 700, 820, W(25, 'canned'), { size: 46 }),
      { k: 'person', x: 1350, y: 560, s: 1.3, at: W(25, 'he', 1, -0.1), face: 'neutral', faceAt: [[W(25, 'sarcastic'), 'smirk']] },
    ] },
    { k: 'line', d: 'M180,700 L1760,700', at: W(26, 'because'), w: 6, sfx: 'marker_squeak_long' },
    ...[['1941', 300], ['1942', 700], ['1943', 1100]].map(([y, x], i) => ({ k: 'group', els: [
      { k: 'line', d: `M${x},680 L${x},720`, at: W(26, 'years') + i * 0.25, w: 6 },
      { k: 'write', text: y, x, y: 790, size: 54, anchor: 'middle', at: W(26, 'years') + i * 0.25 },
    ] })),
    label('waiting for the Allies...', 700, 900, W(26, 'waiting'), { size: 48 }),
    { k: 'line', d: 'M1560,670 L1560,730', at: W(26, 'june'), w: 10, color: RED },
    { k: 'write', text: 'JUNE 1944', x: 1560, y: 800, size: 60, anchor: 'middle', color: RED, at: W(26, 'june'), ul: true, sfx: 'reveal_ding' },
    label('second front in the West', 1560, 880, W(26, 'western', 1, 0.3), { size: 42, color: RED }),
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => icon('tin', 560 + (i % 4) * 150 + (i > 3 ? 75 : 0), i > 3 ? 470 : 590, 0.45, W(26, 'tins') + i * 0.12, { sfx: i % 3 === 0 ? 'pop' : undefined })),
    { k: 'write', text: '?', x: 1560, y: 470, size: 220, color: RED, anchor: 'middle', at: W(27, 'what'), sfx: 'tension_riser' },
  ]);

  // ---------- B17 100 GRAMS (28-29) ----------
  board(28, 29, [
    title('100 GRAMS', W(28, 'for')),
    { k: 'calendar', x: 470, y: 520, w: 340, size: 48, at: W(28, 'twenty', 1, -0.3), pages: [{ text: '22 AUG 1941', at: W(28, 'twenty') }, { text: 'JAN 1940', at: W(29, 'january') }], sfx: 'tick_tock' },
    icon('doc', 1060, 560, 2.0, W(28, 'state'), { sfx: 'paper_unfold' }),
    { k: 'write', text: 'DECREE\nNo. 562', x: 1060, y: 420, size: 44, anchor: 'middle', at: W(28, 'decree'), sfx: 'typewriter' },
    icon('cup', 1620, 560, 1.3, W(29, 'gave'), { sfx: 'pop' }),
    { k: 'write', text: '100 g', x: 1620, y: 380, size: 64, anchor: 'middle', at: W(29, 'grams'), color: RED },
    { k: 'write', text: '40%', x: 1620, y: 790, size: 60, anchor: 'middle', at: W(29, 'forty'), ul: true },
    { k: 'write', text: '"THE PEOPLE\'S COMMISSAR\'S 100 GRAMS"', x: 960, y: 960, size: 46, font: 'cb', anchor: 'middle', at: W(29, 'called'), color: INK },
    label('the idea was not new', 470, 300, W(29, 'idea'), { size: 46 }),
    { k: 'write', text: 'WAR WITH FINLAND', x: 470, y: 790, size: 40, anchor: 'middle', at: W(29, 'finland'), color: BLUE },
    { k: 'write', text: '100 g + 50 g PORK FAT', x: 470, y: 860, size: 44, font: 'cb', anchor: 'middle', at: W(29, 'fifty'), color: RED },
    label('(proposed)', 470, 910, W(29, 'proposed'), { size: 40, color: INK }),
  ]);

  // ---------- B18 THE CATCH (30-32) ----------
  board(30, 32, [
    { k: 'group', until: W(30, 'first', 1, -0.2), els: [icon('cup', 1500, 640, 1.0, W(30, 'but')), { k: 'write', text: 'THE CATCH', x: 1500, y: 420, size: 60, anchor: 'middle', at: W(30, 'catch'), color: RED }] },
    title('NOT FOR EVERYONE', W(30, 'everyone')),
    { k: 'line', d: 'M120,400 C700,390 1200,410 1500,398', at: W(30, 'first'), w: 9, color: RED, dash: '26 16' },
    label('FIRST LINE', 260, 370, W(30, 'line'), { color: RED, size: 46 }),
    ...[0, 1, 2, 3, 4].map((i) => icon('cup', 520 + i * 200, 470, 0.4, W(30, 'battle') + i * 0.1, { sfx: i === 0 ? 'pop' : undefined })),
    label('rear areas: no cup', 760, 610, W(30, 'battle', 1, 0.6), { size: 44, color: GREY }),
    { k: 'calendar', x: 1700, y: 360, w: 230, size: 60, at: W(30, 'next'), pages: [{ text: '1941', at: W(30, 'next') }, { text: '1942', at: W(30, 'rules') }, { text: '1943', at: W(31, 'nineteen') }], sfx: 'counter_roll' },
    { k: 'write', text: 'EVERY DAY', x: 420, y: 790, size: 66, anchor: 'middle', at: W(31, 'daily') },
    { k: 'cross', x: 420, y: 770, size: 150, at: W(31, 'stopped'), sfx: 'marker_squeak_short' },
    { k: 'write', text: 'ATTACK DAYS', x: 1050, y: 790, size: 66, anchor: 'middle', at: W(31, 'attack'), color: RED, ul: true },
    { k: 'arrow', x1: 820, y1: 900, x2: 1300, y2: 900, bend: 0.08, at: W(31, 'attack', 1, 0.3), w: 12 },
    icon('cup', 1420, 860, 0.55, W(31, 'cup')),
    { k: 'person', x: 1720, y: 760, s: 0.85, at: W(31, 'think'), face: 'neutral', faceAt: [[W(31, 'ordinary'), 'worried']] },
    icon('drop', 1790, 600, 0.18, W(31, 'ordinary', 1, 0.2)),
    icon('sun', 1550, 640, 0.3, W(31, 'morning')),
    { k: 'tint', keys: [[W(32, 'evening'), 0.55]], color: '#C77A2B', max: 0.35 },
    icon('moon', 1760, 170, 0.45, W(32, 'come')),
    label('evening rituals', 1560, 260, W(32, 'rituals'), { size: 46 }),
  ]);

  // ---------- B19 SMOKE (33) ----------
  board(33, 33, [
    { k: 'tint', keys: [[sc(33).start, 0.7]] },
    title('EVENING', W(33, 'evening')),
    icon('pouch', 450, 560, 1.35, W(33, 'tobacco'), { sfx: 'pop' }),
    label('MAKHORKA', 450, 800, W(33, 'makhorka'), { size: 56, font: 'pm' }),
    { k: 'write', text: 'PAPER: SCARCE', x: 960, y: 330, size: 54, anchor: 'middle', at: W(33, 'scarce'), color: RED },
    icon('newspaper', 960, 570, 1.35, W(33, 'paper', 2), { sfx: 'paper_unfold' }),
    icon('cigarette', 1450, 570, 1.6, W(33, 'rolls'), { sfx: 'marker_squeak_short' }),
    { k: 'smoke', x: 1540, y: 560, at: W(33, 'find'), h: 220 },
    label('a scrap of newspaper', 1450, 790, W(33, 'newspaper'), { size: 48 }),
  ]);

  // ---------- B20 THE TRIANGLE (34-35) ----------
  board(34, 35, [
    { k: 'tint', keys: [[sc(34).start, 0.7]] },
    title('LETTER HOME', W(34, 'writes')),
    icon('sheet', 420, 560, 1.5, W(34, 'sheet'), { sfx: 'paper_unfold' }),
    icon('envelope', 900, 420, 0.85, W(34, 'envelope', 1, -0.2)),
    { k: 'cross', x: 900, y: 420, size: 150, at: W(34, 'envelope', 1, 0.2), sfx: 'marker_squeak_short' },
    icon('stamp', 900, 720, 0.7, W(34, 'stamp', 1, -0.2)),
    { k: 'cross', x: 900, y: 720, size: 130, at: W(34, 'stamp', 1, 0.2) },
    icon('triangle', 1450, 520, 1.9, W(34, 'triangle', 1, -0.2), { sfx: 'paper_unfold' }),
    { k: 'write', text: 'to: home', x: 1450, y: 500, size: 50, font: 'cb', anchor: 'middle', at: W(34, 'address'), color: BLUE },
    { k: 'write', text: 'POSTAGE: FREE', x: 1450, y: 830, size: 60, anchor: 'middle', at: W(35, 'free'), color: GREEN, ul: true },
    { k: 'burst', x: 1450, y: 810, w: 460, h: 70, at: W(35, 'free', 1, 0.2) },
    icon('marker', 220, 330, 0.7, W(35, 'censor'), { sfx: 'marker_squeak_long' }),
    label('CENSOR', 220, 230, W(35, 'censor', 1, 0.2), { color: RED, size: 46 }),
    { k: 'bar', x: 345, y: 498, w: 150, at: W(35, 'blacked') },
    { k: 'bar', x: 345, y: 528, w: 130, at: W(35, 'blacked', 1, 0.3) },
    { k: 'bar', x: 345, y: 558, w: 150, at: W(35, 'enemy', 1, -0.2) },
  ]);

  // ---------- B21 HOME (36) ----------
  board(36, 36, [
    icon('house', 420, 520, 1.8, W(36, 'family'), { sfx: 'marker_squeak_long' }),
    { k: 'person', kind: 'mother', pose: 'hold', x: 800, y: 580, s: 1.15, at: W(36, 'triangle', 1, -0.3), face: 'neutral', faceAt: [[W(36, 'alive'), 'smile']] },
    icon('triangle', 814, 595, 0.42, W(36, 'triangle'), { sfx: 'pop', fixed: true }),
    icon('heart', 960, 340, 0.6, W(36, 'news')),
    { k: 'write', text: 'ALIVE', x: 1060, y: 360, size: 76, color: GREEN, at: W(36, 'alive'), ul: GREEN, sfx: 'reveal_ding' },
    { k: 'box', x: 1300, y: 420, w: 460, h: 330, at: W(36, 'museums', 1, -0.3), fill: '#DCE9F5' },
    ...[0, 1, 2, 3, 4, 5].map((i) => icon('triangle', 1380 + (i % 3) * 150, 510 + Math.floor(i / 3) * 140, 0.5, W(36, 'thousands') + i * 0.12, { sfx: i === 0 ? 'pop' : undefined })),
    label('MUSEUMS & ARCHIVES', 1530, 820, W(36, 'archives'), { size: 48 }),
    label('kept for decades', 420, 840, W(36, 'decades'), { size: 48 }),
  ]);

  // ---------- B22 HIS NAME (37) ----------
  board(37, 37, [
    { k: 'tint', keys: [[sc(37).start, 0.4]] },
    icon('triangle', 800, 540, 3.4, W(37, 'every', 1, -0.3), { sfx: 'paper_unfold' }),
    { k: 'write', text: 'FROM: his name', x: 800, y: 450, size: 64, font: 'cb', anchor: 'middle', at: W(37, 'name'), color: BLUE, ul: true },
    label('every week', 800, 900, W(37, 'week'), { size: 52 }),
    icon('pencil', 1450, 540, 1.5, W(37, 'remember', 1, -0.3), { rot: -35, sfx: 'tension_riser' }),
    { k: 'write', text: 'REMEMBER THAT.', x: 1450, y: 820, size: 60, anchor: 'middle', color: RED, at: W(37, 'remember', 1, 0.2) },
  ]);

  // ---------- B23 NO EXIT (38-39) ----------
  board(38, 39, [
    { k: 'group', until: W(38, 'leave', 1, 0.1), els: [{ k: 'person', x: 430, y: 560, s: 1.2, at: W(38, 'there'), face: 'neutral' }] },
    title('NO EXIT', W(38, 'leave')),
    icon('sign', 430, 560, 1.8, W(38, 'leave', 1, 0.2), { sfx: 'marker_squeak_short' }),
    { k: 'write', text: 'HOME', x: 430, y: 498, size: 56, anchor: 'middle', at: W(38, 'leave', 1, 0.7) },
    icon('barrier', 430, 600, 1.7, W(38, 'never'), { sfx: 'impact' }),
    label('no home leave', 430, 860, W(38, 'home', 1, 0.2), { size: 50, color: RED }),
    { k: 'person', kind: 'officer', pose: 'hold', x: 940, y: 590, s: 1.25, at: W(39, 'political'), face: 'neutral' },
    icon('book', 956, 600, 0.38, W(39, 'officer'), { fixed: true }),
    label('POLITICAL OFFICER', 940, 960, W(39, 'officer', 1, 0.2), { size: 44 }),
    icon('doc', 1500, 520, 1.7, W(39, 'order', 1, -0.3), { sfx: 'typewriter' }),
    { k: 'write', text: 'ORDER No. 227', x: 1500, y: 350, size: 46, anchor: 'middle', at: W(39, 'two') },
    { k: 'write', text: 'JULY 1942', x: 1500, y: 760, size: 46, anchor: 'middle', at: W(39, 'july', 1, 0.1), color: BLUE },
    { k: 'write', text: 'NOT ONE STEP BACK', x: 1500, y: 880, size: 60, anchor: 'middle', at: W(39, 'not'), color: RED, ul: true, sfx: 'marker_squeak_long' },
  ]);

  // ---------- B24 NO WAY BACK (40-41) ----------
  board(40, 41, [
    { k: 'group', until: W(41, 'so', 1, 0.3), els: [
      { k: 'write', text: 'RETREAT WITHOUT ORDERS', x: 560, y: 260, size: 52, anchor: 'middle', at: W(40, 'retreating') },
      { k: 'arrow', x1: 880, y1: 420, x2: 260, y2: 420, bend: 0.1, at: W(40, 'retreating', 1, 0.3), w: 14, color: INK },
      { k: 'cross', x: 560, y: 420, size: 170, at: W(40, 'treason'), sfx: 'impact' },
      label('could be treated as treason', 560, 600, W(40, 'treason', 1, 0.2), { size: 46, color: RED }),
      { k: 'write', text: 'PENAL UNITS', x: 1400, y: 260, size: 60, anchor: 'middle', at: W(40, 'penal'), ul: true, sfx: 'marker_squeak_long' },
      ...[0, 1, 2].map((i) => ({ k: 'person', x: 1260 + i * 140, y: 520, s: 0.6, at: W(40, 'penal') + i * 0.15, face: 'worried' })),
      { k: 'arrow', x1: 1150, y1: 760, x2: 1750, y2: 760, bend: -0.05, at: W(40, 'dangerous'), w: 12, label: 'most dangerous tasks', lx: 1220, ly: 720 },
    ] },
    ...Array.from({ length: 10 }).map((_, i) => ({ k: 'box', x: 100 + i * 175, y: 420, w: 140, h: 140, at: W(41, 'next') + i * 0.2, fill: '#F3E6C4', sfx: i % 4 === 0 ? 'marker_tap' : undefined })),
    ...Array.from({ length: 10 }).map((_, i) => ({ k: 'write', text: 'DAY', x: 170 + i * 175, y: 510, size: 36, anchor: 'middle', at: W(41, 'next') + i * 0.2 + 0.2 })),
    label('no exit', 960, 680, W(41, 'exit'), { size: 60, color: RED }),
    { k: 'tint', keys: [[W(41, 'night'), 1]] },
    { k: 'write', text: '?', x: 960, y: 920, size: 220, color: RED, anchor: 'middle', at: W(41, 'refused'), sfx: 'tension_riser' },
  ], { cam: [[W(41, 'after'), 1.06, 1500, 500]] });

  // ---------- B25 THE CAPSULE (42-44) ----------
  board(42, 44, [
    { k: 'tint', keys: [[sc(42).start, 0.45]] },
    { k: 'group', until: W(43, 'inside'), els: [{ k: 'person', x: 1400, y: 560, s: 1.3, at: W(42, 'around'), face: 'neutral' }] },
    icon('capsule', 560, 520, 2.6, W(42, 'capsule', 1, -0.3), { sfx: 'reveal_ding' }),
    { k: 'line', d: 'M330,300 L330,760', at: W(42, 'five'), w: 6, color: BLUE },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ k: 'line', d: `M330,${300 + i * 92} L360,${300 + i * 92}`, at: W(42, 'five') + 0.1 * i, w: 5, color: BLUE })),
    { k: 'write', text: '~5 cm', x: 290, y: 545, size: 46, font: 'cb', anchor: 'end', at: W(42, 'centimeters'), color: BLUE },
    label('screw-on lid', 760, 250, W(42, 'lid'), { size: 44 }),
    { k: 'write', text: 'MARCH 1941', x: 560, y: 920, size: 60, anchor: 'middle', at: W(42, 'march'), ul: true },
    icon('slip', 1350, 410, 2.2, W(43, 'slip', 1, -0.2), { sfx: 'paper_unfold' }),
    { k: 'write', text: 'NAME', x: 1230, y: 375, size: 34, at: W(43, 'name'), color: GREY },
    { k: 'write', text: 'BORN', x: 1230, y: 428, size: 34, at: W(43, 'born'), color: GREY },
    { k: 'write', text: 'HOME ADDRESS', x: 1230, y: 481, size: 34, at: W(43, 'address'), color: GREY },
    { k: 'mover', at: W(43, 'pencil', 1, -0.3), t0: W(44, 'never', 1, 0.2), t1: W(44, 'never', 1, 1.4), pts: [[1700, 330], [1850, 160]], els: [icon('pencil', 0, 0, 0.9, W(43, 'pencil', 1, -0.3), { rot: -35, sfx: 'marker_tap' })] },
    { k: 'group', until: W(44, 'and'), els: [
      { k: 'write', text: '10 SECONDS', x: 1350, y: 640, size: 64, anchor: 'middle', color: RED, at: W(43, 'ten') },
      { k: 'burst', x: 1350, y: 620, w: 400, h: 70, at: W(43, 'seconds') },
      icon('book', 1120, 830, 0.9, W(43, 'book'), { sfx: 'pop' }),
      label('RED ARMY BOOK', 1120, 990, W(43, 'paybook'), { size: 44 }),
      icon('puff', 1320, 790, 0.4, W(43, 'burned')),
      icon('drop', 1430, 830, 0.3, W(43, 'soaked')),
      label('taken', 1560, 840, W(43, 'taken'), { size: 46, color: RED }),
      { k: 'check', x: 760, y: 280, size: 90, at: W(43, 'survive') },
    ] },
    { k: 'write', text: 'LEFT BLANK', x: 1350, y: 650, size: 80, anchor: 'middle', color: RED, at: W(44, 'never', 1, 0.2), ul: true, sfx: 'marker_squeak_long' },
    label('most found capsules: never filled in', 1350, 760, W(44, 'search'), { size: 46 }),
    { k: 'write', text: 'SUPERSTITION', x: 1350, y: 930, size: 80, anchor: 'middle', at: W(44, 'superstition'), ul: true, sfx: 'impact' },
  ]);

  // ---------- B26 WHY (45) ----------
  board(45, 45, [
    { k: 'tint', keys: [[sc(45).start, 0.45]] },
    { k: 'person', x: 420, y: 620, s: 1.25, at: W(45, 'many', 1, -0.1), face: 'worried' },
    { k: 'bubble', x: 950, y: 330, w: 560, h: 300, tx: 500, ty: 440, at: W(45, 'believed'), until: W(45, 'some', 1, -0.2), els: [
      icon('slip', 860, 330, 0.75, W(45, 'filling')),
      { k: 'arrow', x1: 950, y1: 330, x2: 1030, y2: 330, bend: 0, at: W(45, 'marking'), w: 7, color: INK },
      icon('grave', 1100, 330, 0.7, W(45, 'death')),
    ], sfx: 'pop' },
    icon('capsule', 1250, 600, 1.4, W(45, 'needle', 1, -0.4)),
    icon('needle', 1450, 560, 1.0, W(45, 'needle'), { sfx: 'pop' }),
    label('needle & thread instead', 1350, 860, W(45, 'thread'), { size: 50 }),
  ]);

  // ---------- B27 SAME MAN (46-47) ----------
  board(46, 47, [
    { k: 'tint', keys: [[sc(46).start, 0.45]] },
    title('THE CONTRAST', W(46, 'contrast')),
    icon('triangle', 520, 470, 1.6, W(46, 'letter')),
    { k: 'write', text: 'FROM: his name', x: 520, y: 440, size: 44, font: 'cb', anchor: 'middle', at: W(46, 'name'), color: BLUE },
    { k: 'check', x: 760, y: 330, size: 90, at: W(46, 'week') },
    icon('slip', 1400, 470, 1.8, W(46, 'paper')),
    { k: 'cross', x: 1640, y: 330, size: 90, at: W(46, 'died') },
    { k: 'arrow', x1: 760, y1: 640, x2: 1180, y2: 640, bend: 0.12, at: W(46, 'died'), w: 8, label: 'SAME MAN', lx: 860, ly: 720, sfx: 'soft_whoosh' },
    ...[['wrap', 'foot'], ['thermos', 'soup'], ['spade', 'digging'], ['boot', 'walking']].map(([ic, w], i) => icon(ic, 220 + i * 210, 900, 0.62, W(47, w), { sfx: 'pop' })),
    { k: 'arrow', x1: 1000, y1: 900, x2: 1150, y2: 900, bend: 0, at: W(47, 'reaching'), w: 8, color: GREEN },
    { k: 'write', text: 'TOMORROW', x: 1340, y: 920, size: 64, anchor: 'middle', color: GREEN, at: W(47, 'tomorrow'), ul: GREEN, sfx: 'reveal_ding' },
    { k: 'arrow', x1: 1740, y1: 760, x2: 1600, y2: 600, bend: 0.2, at: W(47, 'only'), w: 9, label: 'the only one that didn\'t', lx: 1430, ly: 820 },
  ]);

  // ---------- B28 MISSING (48) ----------
  {
    const MX = 260, MY = 120, MS = 1.0;
    const qs = Array.from({ length: 26 }).map((_, i) => {
      const lon = 22 + ((i * 7.31) % 19), lat = 47 + ((i * 3.77) % 10.5);
      const [x, y] = mp('east', lon, lat, MX, MY, MS);
      return { k: 'write', text: '?', x, y, size: 66, anchor: 'middle', color: '#6A6F76', at: W(48, 'millions') + i * 0.07, sfx: i % 8 === 0 ? 'marker_tap' : undefined };
    });
    board(48, 48, [
      { k: 'map', name: 'east', x: MX, y: MY, s: MS, at: W(48, 'cost', 1, -0.2), sfx: 'paper_unfold' },
      ...qs,
      { k: 'write', text: 'MILLIONS MISSING', x: 960, y: 1010, size: 70, anchor: 'middle', at: W(48, 'missing'), color: RED, ul: true, sfx: 'counter_roll' },
    ]);
  }

  // ---------- B29 THE SEARCH (49) ----------
  board(49, 49, [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => icon('tree', 140 + i * 235, 300, 0.95, W(49, 'forests') + i * 0.08, { sfx: i === 0 ? 'soft_whoosh' : undefined })),
    label('every year', 300, 120, W(49, 'every'), { size: 50 }),
    { k: 'person', kind: 'volunteer', x: 330, y: 620, s: 0.9, at: W(49, 'volunteer') },
    icon('detector', 450, 700, 0.9, W(49, 'search')),
    { k: 'person', kind: 'volunteer', x: 640, y: 640, s: 0.85, at: W(49, 'teams') },
    icon('spade', 560, 700, 0.5, W(49, 'teams', 1, 0.2), { rot: 20 }),
    icon('helmet', 900, 830, 0.55, W(49, 'helmets'), { sfx: 'pop' }),
    icon('button', 1060, 860, 0.3, W(49, 'buttons'), { sfx: 'pop' }),
    icon('boot', 1190, 830, 0.5, W(49, 'boots'), { sfx: 'pop' }),
    icon('capsule', 1390, 640, 1.1, W(49, 'capsule'), { sfx: 'reveal_ding' }),
    icon('slip', 1390, 900, 0.9, W(49, 'open')),
    { k: 'write', text: 'NO NAME', x: 1390, y: 1040, size: 56, anchor: 'middle', color: RED, at: W(49, 'name'), ul: true },
    label('cannot be sent home', 960, 1030, W(49, 'without'), { size: 44 }),
    icon('stone', 1720, 700, 1.1, W(49, 'stone'), { sfx: 'marker_squeak_short' }),
    { k: 'write', text: 'UNKNOWN', x: 1720, y: 720, size: 38, anchor: 'middle', at: W(49, 'unknown') },
    label('his family waited', 1720, 880, W(49, 'family'), { size: 42 }),
    icon('triangle', 1720, 980, 0.45, W(49, 'letter')),
    { k: 'write', text: '?', x: 1830, y: 1000, size: 90, color: RED, anchor: 'middle', at: W(49, 'never') },
  ], { cam: [[W(49, 'capsule', 1, -0.3), 1.08, 1400, 760]] });

  // ---------- B30 THE ANSWER (50) ----------
  board(50, 50, [
    { k: 'tint', keys: [[sc(50).start, 0.55]] },
    { k: 'dugout', x: 960, y: 680, at: sc(50).start + 0.05 },
    icon('stove', 1220, 730, 0.95, sc(50).start + 0.6),
    { k: 'smoke', x: 1220, y: 640, at: sc(50).start + 1.0, h: 120 },
    { k: 'person', pose: 'sit', x: 700, y: 705, s: 0.6, at: sc(50).start + 0.3, face: 'neutral', faceAt: [[W(50, 'story'), 'sad']] },
    { k: 'group', until: W(50, 'write', 1, 0.3), els: [icon('capsule', 715, 690, 0.22, W(50, 'everything'), { fixed: true })] },
    { k: 'write', text: 'HE LEFT IT BLANK.', x: 960, y: 260, size: 100, anchor: 'middle', at: W(50, 'refused'), ul: true, sfx: 'marker_squeak_long' },
  ]);

  // ---------- B31 OUTRO (51) ----------
  board(51, 51, [
    icon('kitchen', 700, 580, 1.7, W(51, 'but', 1, -0.1)),
    { k: 'write', text: '?', x: 1080, y: 470, size: 240, color: RED, anchor: 'middle', at: W(51, 'kitchen') },
    { k: 'write', text: 'NEXT STORY', x: 700, y: 930, size: 66, anchor: 'middle', at: W(51, 'next'), ul: true, sfx: 'marker_squeak_long' },
  ]);

  return B;
}
