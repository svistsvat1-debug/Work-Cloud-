// "You Needed 85 Points to Leave WW2" — board-by-board visuals, each cue anchored to a VO word.
import {C} from '../../../components/theme';
import type {BoardDef, El, K} from '../../../components/types';

type O = Partial<El>;
const T = (text: string, at: number, o: O = {}): El => ({k: 'title', text, at, ...o});
const tx = (text: string, x: number, y: number, at: number, o: O = {}): El => ({k: 'text', text, x, y, at, ...o});
const gi = (x: number, y: number, at: number, o: O = {}): El => ({k: 'gi', x, y, at, ...o});
const ic = (name: string, x: number, y: number, at: number, o: O = {}): El => ({k: 'icon', name, x, y, at, ...o});
const cal = (x: number, y: number, at: number, top: string, big: string, bottom?: string, o: O = {}): El => ({k: 'cal', x, y, at, top, big, bottom, ...o});
const burst = (x: number, y: number, at: number, o: O = {}): El => ({k: 'burst', x, y, at, sfx: null, ...o});
const cnt = (x: number, y: number, at: number, to: number, o: O = {}): El => ({k: 'counter', x, y, at, to, ...o});
const arrow = (x1: number, y1: number, x2: number, y2: number, at: number, o: O = {}): El => ({k: 'arrow', x1, y1, x2, y2, at, ...o});
const ship = (type: string, x: number, y: number, at: number, o: O = {}): El => ({k: 'ship', type, x, y, at, ...o});
const map = (region: string, x: number, y: number, w: number, h: number, at: number, o: O = {}): El => ({k: 'map', region, x, y, w, h, at, ...o});
const stamp = (text: string, x: number, y: number, at: number, o: O = {}): El => ({k: 'stamp', text, x, y, at, ...o});
const card = (title: string, x: number, y: number, at: number, o: O = {}): El => ({k: 'card', title, x, y, at, ...o});
const circ = (x: number, y: number, rx: number, at: number, o: O = {}): El => ({k: 'circle', x, y, rx, at, dur: 0.6, sfx: 'marker_squeak_short', ...o});
const box = (x: number, y: number, w: number, h: number, at: number, o: O = {}): El => ({k: 'rect', x, y, w, h, at, ...o});
const ln = (x1: number, y1: number, x2: number, y2: number, at: number, o: O = {}): El => ({k: 'line', x1, y1, x2, y2, at, dur: 0.35, ...o});
const big = (text: string, x: number, y: number, at: number, size: number, color: string = C.ink, o: O = {}): El => tx(text, x, y, at, {size, font: 'title', color, ...o});
const outAll = (els: El[], t: number) => els.map((e) => (e.out === undefined ? {...e, out: t} : e));

export const boardDefs = (k: K): BoardDef[] => {
  const {w, V} = k;
  return [
    // ---------------- HOOK ----------------
    {
      from: 1, to: 2, enter: 'cut',
      els: [
        cal(960, 430, w(1, 'May') - 0.1, 'MAY', '8', '1945', {s: 1.15, out: w(2, 'number'), sfx: 'paper_unfold'}),
        circ(960, 470, 185, w(1, 'eighth') + 0.25, {ry: 195, out: w(2, 'number')}),
        gi(380, 930, w(1, 'You'), {s: 1.3, mood: 'happy', moods: [[w(2, 'nobody'), 'worried'], [w(2, 'Eighty'), 'shock']], sweat: w(2, 'Eighty') + 0.4, sfx: 'marker_squeak_short'}),
        ic('bag', 620, 880, w(1, 'pack'), {s: 0.6, pop: true, sfx: 'pop'}),
        ship('cargo', 1560, 830, w(1, 'ride'), {s: 0.55, mv: [700, 0, w(2, 'But'), 2.2], out: w(2, 'leave') + 1.2, sfx: 'whoosh_soft'}),
        tx('the ride home', 1560, 970, w(1, 'ride') + 0.3, {size: 44, out: w(2, 'But')}),
        big('85', 980, 660, w(2, 'Eighty'), 340, C.red, {dur: 0.35, sfx: 'reveal_ding'}),
        burst(980, 540, w(2, 'Eighty') + 0.15, {r: 250}),
        card('YOUR SCORE', 1580, 560, w(2, 'find'), {s: 0.85, value: '?'}),
      ],
    },
    // ---------------- QUEST 1 ----------------
    {
      from: 3, to: 4, enter: 'wipe',
      els: [
        T('The Problem', V(3)),
        ...outAll([
          map('europe', 110, 190, 860, 650, w(3, 'problem')),
          cnt(540, 560, w(3, 'three'), 3000000, {size: 92}),
          burst(540, 525, w(3, 'three') + 0.2, {r: 210}),
          tx('Americans in Europe', 540, 640, w(3, 'Europe'), {size: 46}),
          map('world', 1000, 240, 860, 470, w(3, 'Across') - 0.2, {
            sfx: null,
            dots: [[-157.8, 21.3], [144.8, 13.4], [121, 14.6], [127.7, 26.3], [151, -33.9], [88.4, 22.6], [-149.9, 61.2], [-79.5, 9], [3, 36.7], [12.5, 41.9], [-0.1, 51.5], [166.4, -22.3]].map((c, i) => ({lon: c[0], lat: c[1], at: w(3, 'world') + i * 0.12, r: 9})),
          }),
          cnt(1430, 830, w(3, 'seven'), 7000000, {size: 86, suffix: '+'}),
          tx('serving overseas', 1430, 905, w(3, 'served'), {size: 46}),
        ], w(4, 'Everyone')),
        {k: 'crowd', x: 560, y: 960, at: w(4, 'Everyone'), n: 8, w: 820, s: 0.5},
        big('FIRST SHIP HOME?', 560, 560, w(4, 'first'), 62),
        ship('cargo', 1080, 820, w(4, 'ships'), {s: 0.5, sfx: 'pop'}),
        arrow(1310, 620, 1170, 720, w(4, 'nearly'), {label: 'not enough', lx: 1300, ly: 580}),
        map('japan', 1450, 170, 400, 400, w(4, 'Japan') - 0.2, {fills: {'392': C.red}, fillAt: w(4, 'Japan') + 0.5, sfx: 'artillery_distant'}),
        big('STILL FIGHTING', 1650, 655, w(4, 'still'), 48, C.red, {sfx: null}),
      ],
    },
    {
      from: 5, to: 5, enter: 'slide',
      els: [
        gi(360, 900, V(5), {v: 'officer', s: 1.15, pose: 'wave', label: 'the general'}),
        {k: 'bubble', x: 560, y: 400, at: w(5, 'asked'), w: 460, h: 180, text: 'Where next?', size: 58, tail: [-120, 130], sfx: 'pop'},
        {k: 'squad', x: 1260, y: 930, at: w(5, 'General'), n: 5, gap: 150, s: 0.68},
        big('101st AIRBORNE', 1260, 1010, w(5, 'hundred'), 48),
        {k: 'bubble', x: 1260, y: 470, at: w(5, 'Home'), w: 560, h: 240, text: 'HOME!', size: 110, tail: [-40, 170], sfx: 'reveal_ding'},
        burst(1260, 460, w(5, 'Home') + 0.1, {r: 300}),
      ],
    },
    {
      from: 6, to: 9, enter: 'wipe',
      els: [
        T('Who Goes First?', V(6)),
        ic('bigq', 960, 540, V(6) + 0.3, {s: 1.4, out: w(7, 'Their'), sfx: 'marker_squeak_short'}),
        cal(420, 520, w(6, 'nineteen'), 'YEAR', '1943', undefined, {flipAt: w(7, 'May'), top2: 'MAY', big2: '10', bottom2: '1945', out: w(8, 'Soldiers')}),
        ic('desk', 1500, 600, w(6, 'planners'), {s: 1.4, label: 'PLANNERS', labelDy: 150, out: w(7, 'answer') + 0.6}),
        big('+2 DAYS', 420, 770, w(7, 'two'), 58, C.red, {out: w(8, 'Soldiers')}),
        box(1100, 560, 440, 600, w(7, 'official'), {out: w(9, 'But'), sfx: 'paper_unfold'}),
        big('ADJUSTED SERVICE\nRATING SCORE', 1100, 420, w(7, 'Adjusted'), 40, C.ink, {out: w(9, 'But')}),
        ln(930, 455, 1270, 405, w(8, 'point'), {out: w(9, 'But')}),
        big('THE POINT SYSTEM', 1100, 560, w(8, 'point'), 46, C.red, {out: w(9, 'But')}),
        tx('fought longest', 1100, 660, w(8, 'longest'), {size: 44, out: w(9, 'But')}),
        tx('+ hardest', 1100, 720, w(8, 'hardest'), {size: 44, out: w(9, 'But')}),
        ic('door', 1670, 600, w(8, 'home'), {s: 1.3, label: 'HOME FIRST', labelDy: 145, out: w(9, 'But'), sfx: 'pop'}),
        arrow(1300, 690, 1580, 640, w(8, 'first'), {out: w(9, 'But')}),
        {k: 'clock', x: 560, y: 540, at: w(9, 'catch'), s: 1.5, freeze: w(9, 'counted') + 0.6, speed: 5, sfx: 'clock_tick'},
        cal(1160, 520, w(9, 'May'), 'MAY', '12', '1945', {s: 1}),
        stamp('COUNT STOPS HERE', 1160, 830, w(9, 'Whatever'), {size: 52}),
        tx('...not yet?', 1640, 960, w(9, 'yet'), {size: 56, color: C.blue, sfx: 'marker_tap'}),
      ],
    },
    // ---------------- QUEST 2 ----------------
    {
      from: 10, to: 16, enter: 'wipe',
      els: [
        T('Count Your Points', V(10)),
        box(560, 610, 880, 700, w(10, 'Grab') - 0.2, {sfx: 'paper_unfold'}),
        ic('pencil', 1010, 300, w(10, 'pencil'), {s: 0.9, rot: -30, pop: true, sfx: 'marker_tap', out: w(11, 'Every')}),
        tx('1 month in uniform', 160, 400, w(11, 'Every'), {anchor: 'start', size: 50}),
        big('= 1', 970, 402, w(11, 'worth'), 56, C.red, {anchor: 'end'}),
        tx('counted from Sept 1940', 180, 452, w(11, 'September'), {anchor: 'start', size: 38, color: C.blue}),
        tx('+1 per month overseas', 160, 545, w(12, 'Every'), {anchor: 'start', size: 50}),
        big('+1', 970, 547, w(12, 'more'), 56, C.red, {anchor: 'end'}),
        tx('campaign star or medal', 160, 690, w(13, 'Every'), {anchor: 'start', size: 50}),
        big('5', 970, 692, w(13, 'five'), 56, C.red, {anchor: 'end'}),
        tx('child under 18 (max 3)', 160, 835, w(14, 'Every'), {anchor: 'start', size: 50}),
        big('12', 970, 837, w(14, 'twelve'), 56, C.red, {anchor: 'end'}),
        gi(1450, 870, w(11, 'uniform'), {s: 1.1, out: w(12, 'Rule')}),
        ic('doc', 1735, 560, w(11, 'peacetime'), {s: 1.1, pop: true, sfx: null, out: w(12, 'Rule')}),
        stamp('DRAFT LAW\n1940', 1735, 760, w(11, 'law'), {size: 44, sfx: null, out: w(12, 'Rule')}),
        ship('cargo', 1450, 760, w(12, 'overseas'), {s: 0.7, out: w(13, 'Rule')}),
        big('x2', 1450, 520, w(12, 'double'), 130, C.red, {out: w(13, 'Rule'), sfx: 'pop'}),
        burst(1450, 475, w(12, 'double') + 0.1, {r: 140, out: w(13, 'Rule')}),
        ic('medal', 1450, 470, w(13, 'medal'), {s: 1.5, out: w(14, 'Rule'), sfx: 'pop'}),
        big('BRONZE STAR', 1450, 730, w(13, 'Bronze'), 46, C.ink, {out: w(14, 'Rule')}),
        big('SILVER STAR', 1450, 800, w(13, 'Silver'), 46, C.ink, {out: w(14, 'Rule')}),
        big('PURPLE HEART', 1450, 870, w(13, 'Purple'), 46, C.ink, {out: w(14, 'Rule')}),
        ic('baby', 1450, 520, w(14, 'child'), {s: 1.4, out: w(15, 'Being'), sfx: 'pop'}),
        big('+12', 1640, 380, w(14, 'twelve'), 92, C.red, {out: w(15, 'Being'), sfx: 'reveal_ding'}),
        burst(1640, 345, w(14, 'twelve') + 0.1, {r: 120, out: w(15, 'Being')}),
        ic('baby', 1270, 760, w(14, 'three'), {s: 0.85, pop: true, out: w(15, 'Being'), sfx: 'pop'}),
        ic('baby', 1630, 760, w(14, 'three') + 0.25, {s: 0.85, pop: true, out: w(15, 'Being')}),
        big('MAX 3', 1450, 930, w(14, 'children'), 56, C.red, {out: w(15, 'Being')}),
        ic('ring', 1300, 400, w(15, 'married'), {s: 0.8, pop: true, out: w(15, 'bar'), sfx: 'pop'}),
        big('= 0', 1480, 420, w(15, 'nothing'), 80, C.steel, {anchor: 'start', out: w(15, 'bar')}),
        ic('cake', 1300, 650, w(15, 'age'), {s: 0.75, pop: true, out: w(15, 'bar')}),
        big('= 0', 1480, 670, w(15, 'nothing', 2), 80, C.steel, {anchor: 'start', out: w(15, 'bar')}),
        ic('baby', 1300, 880, w(15, 'child'), {s: 0.55, pop: true, out: w(15, 'bar')}),
        big('= 1 year', 1440, 900, w(15, 'full'), 64, C.red, {anchor: 'start', out: w(15, 'bar')}),
        big('85', 1450, 520, w(15, 'eightyfive'), 200, C.red, {out: V(16) - 0.2}),
        tx('enlisted men', 1450, 600, w(15, 'enlisted'), {size: 46, out: V(16) - 0.2}),
        stamp('84 = STAY', 1450, 730, w(15, 'eightyfour'), {size: 60, out: V(16) - 0.2}),
        big("WOMEN'S ARMY CORPS: 44", 1450, 900, w(15, 'Women'), 42, C.blue, {out: V(16) - 0.2}),
        gi(1290, 930, w(16, 'Cartoonist'), {s: 0.95, pose: 'hug', mood: 'happy'}),
        gi(1560, 930, w(16, 'child'), {v: 'child', s: 1, mood: 'happy'}),
        {k: 'bubble', x: 1380, y: 460, at: w(16, 'wonderful'), w: 600, h: 180, text: '12-point rascal!', size: 56, tail: [-50, 150], sfx: 'pop'},
        tx('idea: Bill Mauldin cartoon, 1945', 1440, 1030, w(16, 'Mauldin'), {size: 36, color: C.steel}),
      ],
    },
    {
      from: 17, to: 17, enter: 'wipe',
      els: [
        T("Now Let's Play", V(17)),
        card('THE FATHER', 420, 610, w(17, 'Meet'), {hero: 'father'}),
        card('YOU', 960, 610, w(17, 'Meet') + 0.35, {hero: 'hero'}),
        card('THE KID', 1500, 610, w(17, 'Meet') + 0.7, {hero: 'kid'}),
        tx('not real people: typical cases, real rules', 960, 1010, w(17, 'real'), {size: 46, color: C.steel}),
      ],
    },
    {
      from: 18, to: 19, enter: 'slide',
      els: [
        card('THE FATHER', 470, 580, V(18), {s: 1.3, hero: 'father', value: '99', valueAt: w(19, 'Ninety'), home: w(19, 'going'), mood: 'neutral', moods: [[w(19, 'Ninety'), 'happy']]}),
        tx('3 years in uniform', 880, 300, w(18, 'Three'), {anchor: 'start', size: 54}),
        tx('2 years overseas', 880, 410, w(18, 'Two'), {anchor: 'start', size: 54}),
        tx('3 campaign stars', 880, 520, w(18, 'campaign'), {anchor: 'start', size: 54}),
        tx('2 kids at home', 880, 630, w(18, 'kids'), {anchor: 'start', size: 54}),
        big('36', 1760, 302, w(19, 'Thirty'), 64, C.red, {anchor: 'end'}),
        big('24', 1760, 412, w(19, 'twenty'), 64, C.red, {anchor: 'end'}),
        big('15', 1760, 522, w(19, 'fifteen'), 64, C.red, {anchor: 'end'}),
        big('24', 1760, 632, w(19, 'twenty', 2), 64, C.red, {anchor: 'end'}),
        ln(880, 690, 1780, 690, w(19, 'Ninety') - 0.5, {color: C.ink, w: 6}),
        cnt(1620, 830, w(19, 'Ninety'), 99, {size: 130, color: C.green, dur: 0.8}),
        burst(1620, 785, w(19, 'Ninety') + 0.3, {r: 150}),
        {k: 'check', x: 1200, y: 800, at: w(19, 'going'), s: 1.4},
      ],
    },
    {
      from: 20, to: 22, enter: 'slide',
      els: [
        card('YOU', 420, 560, V(20), {s: 1.2, hero: 'hero', value: '65', valueAt: w(22, 'sixty'), moods: [[w(22, 'sixty'), 'worried']]}),
        tx('drafted Jan 1943', 820, 285, w(20, 'Drafted'), {anchor: 'start', size: 50}),
        big('28', 1780, 287, w(20, 'twenty', 2), 60, C.red, {anchor: 'end'}),
        cal(1190, 735, w(20, 'January'), 'JAN', '1943', undefined, {s: 0.85, sfx: null, flipAt: w(20, 'twenty'), top2: 'MAY', big2: '1945', out: w(21, 'fought') - 1.0}),
        tx('28 months', 1190, 935, w(20, 'months'), {size: 46, color: C.blue, sfx: null, out: w(21, 'fought') - 1.0}),
        tx('overseas since May 1944', 820, 365, w(21, 'shipped'), {anchor: 'start', size: 50}),
        big('12', 1780, 367, w(21, 'Twelve'), 60, C.red, {anchor: 'end'}),
        tx('campaign stars', 820, 445, w(22, 'five'), {anchor: 'start', size: 50}),
        ...[0, 1, 2, 3, 4].map((i) => ic('star', 1180 + i * 58, 430, w(22, 'five') + 0.12 * i, {s: 0.26, pop: true, sfx: i === 0 ? 'pop' : null})),
        big('25', 1780, 447, w(22, 'Twenty'), 60, C.red, {anchor: 'end'}),
        tx('no medals, no kids', 820, 520, w(22, 'No'), {anchor: 'start', size: 46, color: C.steel}),
        big('0', 1780, 522, w(22, 'kids'), 60, C.steel, {anchor: 'end'}),
        map('europe', 820, 555, 760, 400, w(21, 'fought') - 0.4, {
          dur: 1.0,
          arrows: [{from: [-0.6, 49.2], to: [10.5, 50.6], at: w(21, 'Normandy'), dur: 45}],
          labels: [{t: 'NORMANDY', lon: -1.5, lat: 47.9, at: w(21, 'Normandy'), size: 34}, {t: 'GERMANY', lon: 11.5, lat: 52.6, at: w(21, 'Germany'), size: 34}],
        }),
        cnt(1720, 1000, w(22, 'sixty'), 65, {size: 120, color: C.red}),
        circ(1720, 960, 110, w(22, 'sixty') + 0.7, {ry: 85}),
      ],
    },
    {
      from: 23, to: 25, enter: 'slide',
      els: [
        card('THE KID', 420, 560, V(23), {s: 1.2, hero: 'kid', mood: 'neutral', moods: [[w(24, 'Thirty'), 'worried']], value: '30', valueAt: w(24, 'Thirty')}),
        ic('snowflake', 900, 320, w(23, 'December'), {s: 0.45, pop: true, sfx: 'pop', out: w(25, 'He')}),
        tx('arrived December 1944', 960, 340, w(23, 'arrived'), {anchor: 'start', size: 52, out: w(25, 'He')}),
        big('BATTLE OF THE BULGE', 960, 410, w(23, 'Battle'), 44, C.blue, {anchor: 'start', out: w(25, 'He')}),
        ...outAll([
          tx('10 months in uniform', 840, 540, w(24, 'Ten'), {anchor: 'start', size: 50}),
          big('10', 1780, 542, w(24, 'Ten') + 0.3, 60, C.red, {anchor: 'end'}),
          tx('5 months overseas', 840, 620, w(24, 'Five'), {anchor: 'start', size: 50}),
          big('5', 1780, 622, w(24, 'Five') + 0.3, 60, C.red, {anchor: 'end'}),
          tx('3 campaign stars', 840, 700, w(24, 'Fifteen'), {anchor: 'start', size: 50}),
          big('15', 1780, 702, w(24, 'Fifteen') + 0.3, 60, C.red, {anchor: 'end'}),
          ln(840, 750, 1790, 750, w(24, 'Thirty') - 0.4, {color: C.ink, w: 6}),
          cnt(1660, 880, w(24, 'Thirty'), 30, {size: 120, color: C.red}),
          tx('needed: 85', 1260, 870, w(24, 'total'), {size: 54, color: C.steel}),
        ], w(25, 'He')),
        {k: 'quote', x: 1290, y: 330, at: w(25, 'Private'), w: 980, size: 58, dur: 3.6, lines: ['"I only have 28 points,', "so there isn't much chance", 'of me getting home."'], sign: 'Pvt. Walter Anderson'},
      ],
    },
    {
      from: 26, to: 26, enter: 'slide',
      els: [
        ic('door', 1660, 600, V(26), {s: 1.5, label: 'HOME', labelDy: 165, sfx: 'pop'}),
        card('FATHER', 1300, 620, w(26, 'Fathers'), {s: 0.7, hero: 'father', mood: 'happy'}),
        card('YOU', 760, 620, w(26, 'Everyone'), {s: 0.7, hero: 'hero', mood: 'worried'}),
        card('KID', 400, 620, w(26, 'Everyone') + 0.3, {s: 0.7, hero: 'kid', mood: 'worried'}),
        ln(200, 820, 1000, 800, w(26, 'wait'), {color: C.red, w: 9, sfx: 'marker_squeak_short'}),
        big('WAIT', 600, 900, w(26, 'wait') + 0.2, 60, C.red),
        big('?', 960, 300, w(26, 'what'), 220, C.red, {sfx: 'tension_riser', sfxAt: w(26, 'But')}),
      ],
    },
    // ---------------- QUEST 3 ----------------
    {
      from: 27, to: 29, enter: 'wipe',
      els: [
        T('The War Was Not Over', V(27)),
        map('japan', 110, 180, 780, 800, w(27, 'Japan'), {
          fills: {'392': C.red},
          fillAt: w(27, 'still'),
          inkFrom: [140, 38],
          arrows: [
            {from: [131.5, 25], to: [130.7, 31.2], at: w(27, 'invade'), dur: 30},
            {from: [127, 27.5], to: [129.9, 31.8], at: w(27, 'invade') + 0.4, dur: 30},
            {from: [136, 28.5], to: [131.6, 31.5], at: w(27, 'invade') + 0.8, dur: 30},
          ],
          labels: [{t: 'JAPAN', lon: 139, lat: 37.5, at: w(27, 'Japan') + 0.6}, {t: 'KYUSHU', lon: 131.2, lat: 33.6, at: w(28, 'landings'), size: 34}],
          out: w(29, 'planners'),
          sfx: 'artillery_distant',
        }),
        cal(1300, 450, w(28, 'November'), 'NOV', '1', '1945', {out: w(29, 'planners')}),
        big('NEEDS:\nEXPERIENCED MEN', 1300, 770, w(28, 'Experienced'), 56, C.ink, {ul: true, out: w(29, 'planners')}),
        ic('doc', 520, 590, w(29, 'study'), {s: 2.4, sfx: 'typewriter'}),
        big('ARMY STUDY\nJAN 1945', 520, 500, w(29, 'January'), 42),
        ...[0, 1, 2, 3, 4].map((i) => ic('helmet', 1060 + i * 150, 500, w(29, 'replacements') + i * 0.14, {s: 0.55, pop: true})),
        cnt(1360, 760, w(29, 'fortythree'), 43000, {size: 110, color: C.red, suffix: ' / month'}),
        tx('replacements for the dead and wounded', 1360, 850, w(29, 'dead'), {size: 44, color: C.steel}),
      ],
    },
    {
      from: 30, to: 32, enter: 'slide',
      els: [
        T('Four Groups', V(30)),
        box(560, 400, 560, 230, w(30, 'four'), {label: 'STAY', labelSize: 54, sfx: 'marker_squeak_long'}),
        box(1360, 400, 560, 230, w(30, 'four') + 0.25, {label: 'PACIFIC', labelSize: 54}),
        box(560, 720, 560, 230, w(30, 'four') + 0.5, {label: 'RETRAIN', labelSize: 54}),
        box(1360, 720, 560, 230, w(30, 'four') + 0.75, {label: 'HOME', labelSize: 54}),
        ic('flag', 470, 460, w(30, 'stay'), {s: 0.4, pop: true, fill: C.blue, sfx: 'pop'}),
        ic('flag', 1270, 780, w(30, 'home'), {s: 0.4, pop: true, fill: C.green, sfx: 'pop'}),
        box(1360, 400, 590, 260, w(31, 'Pacific'), {color: C.red, fill: C.red}),
        cnt(1360, 500, w(31, 'million'), 1000000, {size: 70, color: C.red}),
        burst(1360, 475, w(31, 'million') + 0.2, {r: 150}),
        card('YOU', 960, 590, w(32, 'Look'), {s: 0.62, hero: 'hero', value: '65', mood: 'worried'}),
        big('BATTLE-TESTED', 520, 1000, w(32, 'Battle'), 46, C.ink, {sfx: 'marker_tap'}),
        big('YOUNG', 960, 1000, w(32, 'young'), 46, C.ink, {sfx: 'marker_tap'}),
        big('NO KIDS', 1360, 1000, w(32, 'kids'), 46, C.ink, {sfx: 'marker_tap'}),
        arrow(1030, 470, 1150, 400, w(32, 'exactly'), {sfx: 'tension_riser'}),
      ],
    },
    {
      from: 33, to: 35, enter: 'wipe',
      els: [
        T('The Shuffle', V(33)),
        ...outAll([
          box(520, 600, 640, 520, w(33, 'shuffle'), {label: 'GOING HOME'}),
          box(1400, 600, 640, 520, w(33, 'shuffle') + 0.3, {label: 'PACIFIC'}),
          gi(420, 820, w(33, 'shuffle') + 0.4, {s: 0.55, v: 'father', stripes: true}),
          gi(620, 820, w(33, 'shuffle') + 0.5, {s: 0.55, v: 'plain'}),
          gi(1300, 820, w(33, 'shuffle') + 0.6, {s: 0.55, v: 'kid'}),
          gi(1500, 820, w(33, 'shuffle') + 0.7, {s: 0.55, v: 'hero', mood: 'worried'}),
          arrow(1250, 600, 700, 600, w(33, 'High'), {label: 'high points', ly: 570, color: C.green}),
          arrow(700, 690, 1250, 690, w(33, 'Low'), {label: 'low points', ly: 780}),
        ], w(34, 'In')),
        ...outAll([
          big('28th INFANTRY DIVISION', 960, 330, w(34, 'Twenty'), 56),
          {k: 'squad', x: 960, y: 850, at: w(34, 'In'), n: 5, gap: 230, s: 0.9, keep: 2, remove: [{i: 0, at: w(34, 'one')}, {i: 4, at: w(34, 'dissolves')}, {i: 1, at: w(34, 'dissolves') + 0.4}, {i: 3, at: w(34, 'dissolves') + 0.8}]},
          stamp('1 IN 5\nIN 1 WEEK', 960, 480, w(34, 'week'), {size: 52}),
        ], w(35, 'Even')),
        card('FATHER', 560, 600, w(35, 'father'), {s: 1, hero: 'father', value: '99', mood: 'worried'}),
        ic('wrench', 1100, 500, w(35, 'skills'), {s: 0.9, pop: true, label: 'NEEDED SKILL', labelDy: 140, sfx: 'pop'}),
        cal(1500, 560, w(35, 'six'), 'HOLD', '+6', 'MONTHS', {sfx: 'clock_tick'}),
      ],
    },
    {
      from: 36, to: 36, enter: 'slide',
      els: [
        ic('tent', 470, 680, V(36), {s: 2.3}),
        gi(800, 920, V(36) + 0.3, {s: 1, mood: 'sleepy'}),
        {k: 'clock', x: 1150, y: 230, at: V(36) + 0.6, s: 0.75, speed: 0.6, sfx: 'clock_tick'},
        {k: 'quote', x: 1440, y: 360, at: w(36, 'Gerald'), w: 820, size: 56, dur: 3.0, lines: ['"how monotonous', 'and pointless', 'this whole existence', 'over here has become"'], sign: 'Sgt. Gerald Raftery, July 1945'},
      ],
    },
    {
      from: 37, to: 38, enter: 'slide',
      els: [
        map('atlantic', 80, 150, 1760, 860, V(37), {
          labels: [
            {t: 'FRANCE', lon: 2.5, lat: 46.6, at: V(37) + 1.0},
            {t: 'NEW YORK', lon: -74, lat: 43, at: w(37, 'York'), size: 44},
            {t: 'HOME!', lon: -76, lat: 48.5, at: w(38, 'finally'), size: 80, color: C.green, out: w(38, 'stopover')},
            {t: 'ONLY A STOPOVER', lon: -76, lat: 48.5, at: w(38, 'stopover'), size: 60, color: C.red},
            {t: 'TRAINING: OKLAHOMA', lon: -95, lat: 31.5, at: w(38, 'retrained'), size: 40},
            {t: 'next: the war against Japan', lon: -85, lat: 27.5, at: w(38, 'Japan'), size: 40, color: C.red},
          ],
          dots: [{lon: -74, lat: 40.7, at: w(37, 'York')}, {lon: -97.5, lat: 35.5, at: w(38, 'retrained')}],
          routes: [{pts: [[0, 49.6], [-15, 47], [-35, 44], [-55, 41.5], [-73.5, 40.6]], at: w(37, 'sailed'), dur: 2.4, ship: true}],
          arrows: [{from: [-74, 40.7], to: [-96.5, 35.8], at: w(38, 'retrained'), dur: 25, color: C.red}],
        }),
        big('86th INFANTRY DIVISION', 1060, 900, w(37, 'Eighty'), 54),
        cal(1610, 800, w(37, 'June'), 'JUNE', '17', '1945', {s: 0.8}),
      ],
    },
    // ---------------- QUEST 4 ----------------
    {
      from: 39, to: 43, enter: 'wipe',
      els: [
        T('The Cigarette Camps', V(39)),
        ...outAll([
          map('normandy', 130, 200, 980, 760, V(39) + 0.2, {
            labels: [{t: 'FRANCE', lon: 1.0, lat: 49.0, at: V(39) + 0.9}, {t: 'English Channel', lon: -0.6, lat: 50.3, at: V(39) + 1.2, size: 36, color: C.blue}],
            dots: [{lon: 0.11, lat: 49.49, at: w(39, 'port'), label: 'port'}],
          }),
          ic('truck', 1450, 470, w(39, 'headed'), {s: 1.0, mv: [-240, 60, w(39, 'headed'), 2.0]}),
          {k: 'tents', x: 1240, y: 760, at: w(39, 'tent'), rows: 2, cols: 4, s: 0.42, dx: 125, dy: 95},
        ], w(40, 'In')),
        ...outAll([
          ic('cigpack', 420, 520, w(40, 'Lucky'), {s: 1.25, pop: true, label: 'LUCKY STRIKE', labelDy: 150, sfx: 'pop'}),
          ic('cigpack', 780, 520, w(40, 'Old'), {s: 1.25, pop: true, fill: C.yellow, label: 'OLD GOLD', labelDy: 150, sfx: 'pop'}),
          ic('cigpack', 1140, 520, w(40, 'Philip'), {s: 1.25, pop: true, fill: C.blue, label: 'PHILIP MORRIS', labelDy: 150, sfx: 'pop'}),
          ic('cigpack', 1500, 520, w(40, 'Chesterfield'), {s: 1.25, pop: true, fill: C.green, label: 'CHESTERFIELD', labelDy: 150, sfx: 'pop'}),
          ic('padlock', 700, 900, w(41, 'code'), {s: 0.7, pop: true, sfx: 'marker_tap'}),
          big('CODE NAMES = SECURITY', 1150, 920, w(41, 'security'), 56, C.red),
        ], w(42, 'The')),
        ...outAll([
          {k: 'tents', x: 260, y: 400, at: w(42, 'biggest'), rows: 4, cols: 7, s: 0.36, dx: 112, dy: 92, every: 1},
          cnt(1480, 560, w(42, 'fifty'), 58000, {size: 116}),
          burst(1480, 520, w(42, 'fifty') + 0.3, {r: 200}),
          tx('soldiers in one camp', 1480, 640, w(42, 'soldiers'), {size: 48}),
          big('waiting for... a ship', 1480, 840, w(42, 'waiting'), 54, C.blue),
        ], w(43, 'It')),
        ic('wire', 620, 450, w(43, 'freed'), {s: 2.6}),
        ln(560, 380, 690, 520, w(43, 'freed') + 0.6, {color: C.red, w: 12}),
        gi(420, 900, w(43, 'prisoners'), {s: 0.85, v: 'plain', mood: 'happy'}),
        gi(640, 900, w(43, 'prisoners') + 0.3, {s: 0.85, v: 'plain', mood: 'happy'}),
        gi(860, 900, w(43, 'prisoners') + 0.6, {s: 0.85, v: 'plain', mood: 'happy'}),
        cnt(1450, 560, w(43, 'seventy'), 73000, {size: 116, suffix: '+'}),
        tx('freed American prisoners of war', 1450, 650, w(43, 'recovered'), {size: 48}),
      ],
    },
    {
      from: 44, to: 47, enter: 'slide',
      els: [
        T('The Bottleneck', V(44)),
        ...outAll([
          ic('bottle', 480, 690, w(44, 'bottleneck'), {s: 2.6}),
          {k: 'crowd', x: 480, y: 420, at: w(44, 'bottleneck') + 0.3, n: 9, w: 480, s: 0.27},
          big('SHIPS', 480, 800, w(44, 'real'), 60),
        ], w(46, 'It')),
        ...outAll([
          big('PACIFIC FIRST', 1250, 380, w(44, 'first'), 64, C.red),
          cnt(1250, 560, w(44, 'ninety'), 90000, {size: 100}),
          tx('got home in May 1945', 1250, 640, w(44, 'got'), {size: 48}),
        ], w(45, 'Everyone')),
        cal(1150, 480, w(45, 'weeks'), 'WAIT', 'WEEKS', undefined, {s: 0.95, flipAt: w(45, 'months'), top2: 'WAIT', big2: 'MONTHS', out: w(45, 'cargo')}),
        ship('cargo', 1300, 790, w(45, 'cargo'), {s: 0.85, label: 'cargo ship -> troop ship', out: w(46, 'It')}),
        stamp('300', 1640, 430, w(45, 'three'), {size: 100, out: w(46, 'It')}),
        ...outAll([
          ship('liner', 980, 720, w(46, 'liner'), {s: 1.1, label: 'QUEEN MARY', sfx: 'whoosh_soft'}),
          big('price: 10 cargo ships', 960, 330, w(46, 'ten'), 60),
          cnt(1250, 980, w(46, 'fifteen'), 15000, {size: 72, suffix: ' men', prefix: 'up to '}),
        ], w(47, 'At')),
        {k: 'clock', x: 560, y: 520, at: w(47, 'seventy'), s: 1.3, speed: 7, sfx: 'clock_tick'},
        big('72 HOURS', 560, 780, w(47, 'hours'), 72, C.red),
        tx('then nobody leaves', 560, 860, w(47, 'nobody'), {size: 48}),
        card('YOU', 1420, 560, w(47, 'you'), {s: 0.95, hero: 'hero', value: '65', mood: 'sad'}),
        big('NO SHIP', 1420, 920, w(47, 'ship'), 70, C.red, {sfx: 'impact', gain: -3}),
      ],
    },
    // ---------------- QUEST 5 ----------------
    {
      from: 48, to: 50, enter: 'wipe',
      els: [
        T('August 1945', V(48)),
        ...outAll([
          map('japan', 150, 190, 740, 780, w(48, 'August'), {
            labels: [{t: 'JAPAN', lon: 139, lat: 37.5, at: w(48, 'August') + 0.7}],
            dots: [{lon: 132.45, lat: 34.39, at: w(48, 'atomic'), color: C.orange, r: 24}, {lon: 129.87, lat: 32.75, at: w(48, 'atomic') + 0.45, color: C.orange, r: 24}],
            arrows: [
              {from: [131.5, 25], to: [130.7, 31.2], at: w(49, 'invasion') - 0.6, dur: 15},
              {from: [127, 27.5], to: [129.9, 31.8], at: w(49, 'invasion') - 0.4, dur: 15},
              {from: [136, 28.5], to: [131.6, 31.5], at: w(49, 'invasion') - 0.2, dur: 15},
            ],
            sfx: 'artillery_distant',
            sfxAt: w(48, 'atomic'),
          }),
          {k: 'bigx', x: 470, y: 760, w: 420, h: 300, at: w(49, 'cancelled')},
        ], w(50, 'But')),
        ...outAll([
          cal(1360, 430, w(48, 'fifteenth'), 'AUG', '15', '1945', {s: 0.95}),
          ic('whiteflag', 1360, 790, w(48, 'surrender'), {s: 1.1, pop: true, label: 'SURRENDER', labelDy: 135, sfx: 'reveal_ding'}),
        ], w(49, 'The')),
        big('1,000,000 -> PACIFIC', 1360, 560, w(49, 'million'), 60, C.ink, {out: w(50, 'But')}),
        ln(1040, 545, 1690, 535, w(49, 'dead'), {w: 12, out: w(50, 'But')}),
        map('pacific', 110, 180, 1700, 760, w(50, 'But') + 0.2, {
          routes: [{pts: [[-122.4, 37.8], [-145, 31], [180, 24], [150, 18], [121, 14.6]], at: w(50, 'sailed'), dur: 2.6, ship: true}],
          dots: [{lon: -122.4, lat: 37.8, at: w(50, 'San'), label: 'SAN FRANCISCO', dx: -360, dy: -20}, {lon: 121, lat: 14.6, at: w(50, 'Philippines'), label: 'PHILIPPINES', dx: -90, dy: 60}],
          labels: [{t: '86th DIVISION', lon: 200, lat: 45, at: w(50, 'Eighty'), size: 54}],
        }),
        cal(1640, 760, w(50, 'Nine'), 'AUG 24', '+9', 'DAYS', {s: 0.75}),
      ],
    },
    {
      from: 51, to: 53, enter: 'slide',
      els: [
        ...outAll([
          ic('house', 360, 640, w(51, 'home'), {s: 1.6}),
          gi(640, 930, w(51, 'Wives'), {v: 'wife', s: 1, pose: 'up', hold: 'sign:BRING BACK|DADDY', holdAt: w(51, 'Bring')}),
          ...[0, 1, 2, 3].map((i) => ic('envelope', 520, 420 + i * 30, w(51, 'Families') + i * 0.3, {s: 0.32, pop: true, mv: [880, 120 - i * 40, w(51, 'Families') + i * 0.3 + 0.2, 1.2], sfx: i === 0 ? 'whoosh_soft' : null})),
        ], w(53, 'Eisenhower')),
        ic('dome', 1500, 620, w(51, 'pressure'), {s: 2, label: 'CONGRESS', labelDy: 135}),
        ...[0, 1, 2, 3, 4, 5].map((i) => ic('envelope', 1360 + (i % 3) * 140, 840 + Math.floor(i / 3) * 70, w(52, 'buried') + i * 0.12, {s: 0.32, pop: true, rot: (i * 17) % 30 - 15, sfx: i === 0 ? 'paper_unfold' : null, out: w(53, 'Eisenhower')})),
        ...outAll([
          big('85', 1000, 360, w(52, 'eighty'), 130),
          ln(930, 330, 1080, 300, w(52, 'eighty', 2), {w: 12}),
          big('80', 1230, 370, w(52, 'eighty', 2), 150, C.red, {sfx: 'reveal_ding'}),
          burst(1230, 320, w(52, 'eighty', 2) + 0.1, {r: 130}),
        ], w(53, 'Eisenhower')),
        ic('doc', 560, 600, w(53, 'ordered'), {s: 2.4, sfx: 'typewriter'}),
        big('ORDER', 560, 490, w(53, 'ordered') + 0.2, 52, C.red),
        cnt(560, 630, w(53, 'million'), 1716000, {size: 56}),
        tx('men home', 560, 700, w(53, 'men'), {size: 46}),
        cal(1000, 600, w(53, 'January'), 'BY END OF', 'JAN', '1946', {s: 0.8}),
      ],
    },
    {
      from: 54, to: 56, enter: 'wipe',
      els: [
        T('Warships Become Ferries', V(54)),
        ship('carrier', 760, 690, w(54, 'Aircraft') - 0.3, {s: 1.5, smoke: false, sfx: 'whoosh_soft'}),
        ...outAll([
          box(1560, 520, 440, 440, w(54, 'hangar'), {}),
          ic('bunks', 1560, 500, w(54, 'bunks'), {s: 1.6}),
          big('3 TO 5 HIGH', 1560, 700, w(54, 'three'), 52, C.red),
        ], w(55, 'On')),
        ...outAll([
          cal(1560, 420, w(55, 'September'), 'SEPT', '6', '1945', {s: 0.85}),
          big('combat ships -> troops', 1580, 640, w(55, 'cleared'), 42),
          cnt(1580, 820, w(55, 'four'), 430000, {size: 70, suffix: ' / month'}),
          tx('across the Atlantic at the peak', 1580, 890, w(55, 'peaked'), {size: 42, color: C.steel}),
        ], w(56, 'The')),
        big('LAKE CHAMPLAIN', 760, 330, w(56, 'Lake'), 62),
        tx('bunks for 3,300 troops', 760, 410, w(56, 'bunks'), {size: 52}),
        cnt(1500, 580, w(56, 'seven'), 700000, {size: 104, color: C.blue}),
        tx('came home from the Pacific\nin December 1945', 1500, 670, w(56, 'December'), {size: 46}),
      ],
    },
    {
      from: 57, to: 57, enter: 'slide',
      els: [
        {k: 'bar', x1: 200, x2: 1500, y: 430, at: V(57), label: '80'},
        card('FATHER', 480, 230, V(57), {s: 0.45, hero: 'father', home: w(57, 'gone')}),
        card('YOU', 960, 740, w(57, 'out'), {s: 0.75, hero: 'hero', value: '65', mood: 'sad'}),
        arrow(1180, 640, 1180, 460, w(57, 'reach'), {label: '15 short', lx: 1330, ly: 560, bend: 0}),
        big('the bar is falling', 1500, 300, w(57, 'bar'), 50, C.ink),
      ],
    },
    // ---------------- QUEST 6 ----------------
    {
      from: 58, to: 60, enter: 'wipe',
      els: [
        T('Somebody Had to Stay', V(58)),
        ...outAll([
          map('europe', 100, 200, 900, 640, w(58, 'Germany') - 0.3, {fills: {'276': C.red, '040': C.orange}, fillAt: w(58, 'Germany') + 0.3, inkFrom: [11, 50], labels: [{t: 'GERMANY', lon: 10.4, lat: 51.4, at: w(58, 'Germany') + 0.5, size: 44}, {t: 'AUSTRIA', lon: 14.5, lat: 47.6, at: w(58, 'Austria'), size: 38}], sfx: null}),
          map('japan', 1080, 200, 700, 640, w(58, 'Japan') - 0.3, {fills: {'392': C.red}, fillAt: w(58, 'Japan') + 0.2, inkFrom: [138, 36], labels: [{t: 'JAPAN', lon: 139, lat: 37.5, at: w(58, 'Japan') + 0.4}], sfx: null}),
          big('OCCUPATION TROOPS NEEDED', 960, 960, w(58, 'occupation'), 56, C.red),
        ], w(59, 'But')),
        ...outAll([
          ic('funnel', 520, 540, w(59, 'draft'), {s: 1.6}),
          big('DRAFT:\n50,000 / MONTH', 520, 820, w(59, 'fifty'), 54),
          arrow(900, 560, 1560, 560, w(59, 'leaving'), {label: 'men leaving: far more', ly: 520}),
          stamp('NOT ENOUGH', 1240, 760, w(59, 'not'), {size: 64}),
        ], w(60, 'So')),
        cal(480, 560, w(60, 'January'), 'JAN', '4', '1946'),
        stamp('BRAKES ON', 960, 560, w(60, 'brakes'), {size: 70, sfx: 'impact'}),
        big('3 MONTHS', 1480, 460, w(60, 'Discharges'), 64),
        ln(1290, 450, 1670, 430, w(60, 'six'), {w: 12}),
        big('6 MONTHS', 1480, 640, w(60, 'six'), 90, C.red),
      ],
    },
    {
      from: 61, to: 64, enter: 'wipe',
      els: [
        T('No Boats, No Votes', V(61)),
        ...outAll([
          ic('ticket', 960, 470, w(61, 'promised'), {s: 2, label: 'SHIP HOME', labelDy: 12}),
          {k: 'bigx', x: 960, y: 470, w: 440, h: 220, at: w(61, 'betrayal')},
        ], w(62, 'On')),
        {k: 'crowd', x: 960, y: 980, at: w(61, 'protested'), n: 11, w: 1640, s: 0.5, signs: 3, mood: 'angry', out: w(63, 'The'), sfx: 'crowd_murmur'},
        ...outAll([
          cal(420, 460, w(62, 'Christmas'), 'DEC', '25', '1945', {s: 0.85, flipAt: w(62, 'January'), top2: 'JAN', big2: '6', bottom2: '1946'}),
          cnt(880, 470, w(62, 'four'), 4000, {size: 96, out: w(62, 'January')}),
          cnt(960, 470, w(62, 'twenty'), 20000, {size: 96, prefix: 'up to '}),
          ic('building', 1560, 440, w(62, 'headquarters'), {s: 1.3, label: 'ARMY HQ, MANILA', labelDy: 140, sfx: 'pop'}),
        ], w(63, 'The')),
        map('world', 140, 180, 1640, 760, w(63, 'protests') - 0.2, {
          sfx: null,
          dots: [
            {lon: 121, lat: 14.6, at: w(63, 'protests'), label: 'Manila', dx: -40, dy: 50},
            {lon: 144.8, lat: 13.4, at: w(63, 'Guam'), label: 'Guam'},
            {lon: 139.7, lat: 35.7, at: w(63, 'Japan'), label: 'Japan'},
            {lon: 2.35, lat: 48.85, at: w(63, 'France')},
            {lon: 8.7, lat: 50.1, at: w(63, 'Germany')},
            {lon: 16.4, lat: 48.2, at: w(63, 'Austria')},
            {lon: 88.4, lat: 22.6, at: w(63, 'India'), label: 'India'},
            {lon: 127, lat: 37.5, at: w(63, 'Korea'), label: 'Korea', dx: -110, dy: -20},
            {lon: -0.13, lat: 51.5, at: w(63, 'England'), label: 'London: 500 soldiers', dx: -420, dy: -30},
          ],
          labels: [{t: 'EUROPE', lon: 10, lat: 60, at: w(63, 'France'), size: 40}],
          out: w(64, 'In', 2),
        }),
        ic('envelope', 960, 620, w(64, 'In', 2), {s: 3.2, sfx: 'paper_unfold'}),
        stamp('NO BOATS,\nNO VOTES', 960, 620, w(64, 'No'), {size: 84}),
      ],
    },
    {
      from: 65, to: 67, enter: 'slide',
      els: [
        {k: 'crowd', x: 960, y: 990, at: V(65), n: 9, w: 1500, s: 0.45, signs: 2, out: w(66, 'His')},
        ic('gavel', 760, 440, w(65, 'court'), {s: 1.5, pop: true, out: w(65, 'mass'), sfx: 'impact', gain: -4}),
        gi(1500, 760, w(65, 'Eisenhower'), {v: 'officer', s: 1.1, label: 'Army Chief of Staff', out: w(67, 'It')}),
        big('NO MASS\nPUNISHMENT', 760, 420, w(65, 'mass'), 64, C.green, {out: w(66, 'His')}),
        ...outAll([
          big('"ACUTE\nHOMESICKNESS"', 760, 360, w(66, 'Acute'), 72, C.ink, {ul: true}),
          stamp('NO MORE PROTESTS', 760, 640, w(66, 'banned'), {size: 56}),
          big('>> faster discharges', 760, 830, w(66, 'sped'), 54, C.blue),
        ], w(67, 'It')),
        ic('suitcase', 620, 560, w(67, 'tour'), {s: 1.5, sfx: 'pop'}),
        ic('pricetag', 1100, 470, w(67, 'twenty'), {s: 1.6, pop: true, sfx: 'pop'}),
        big('$25-35', 1060, 492, w(67, 'twenty') + 0.2, 52, C.ink),
        big('17-DAY TOUR OF EUROPE', 860, 820, w(67, 'seventeen'), 62),
      ],
    },
    // ---------------- FINAL BOSS ----------------
    {
      from: 68, to: 70, enter: 'wipe',
      els: [
        T('Final Count', V(68)),
        ln(160, 850, 1800, 850, V(68) + 0.3, {color: C.ink, w: 6, dur: 0.6, sfx: 'marker_squeak_long'}),
        ...[0, 50, 100].map((v) => tx(String(v), 160 + v * 16.4, 910, V(68) + 0.5, {size: 40, color: C.steel})),
        gi(652, 830, V(68) + 0.6, {v: 'kid', s: 0.8, mood: 'worried', moods: [[w(69, 'fifty'), 'sad']]}),
        big('KID 30', 652, 1000, V(68) + 0.7, 48),
        gi(1226, 830, V(68) + 0.9, {v: 'hero', s: 0.8, mood: 'worried', moods: [[w(69, 'Sixty'), 'happy']]}),
        big('YOU 65', 1226, 1000, V(68) + 1.0, 48, C.red),
        gi(1784, 830, V(68) + 1.2, {v: 'father', s: 0.8, mood: 'happy', stripes: true}),
        big('99', 1784, 1000, V(68) + 1.3, 48),
        {k: 'vbar', x: 1472, y1: 330, y2: 860, at: w(68, 'count'), label: '80', steps: [{at: w(69, 'Seventy'), x: 1308, label: '70'}, {at: w(69, 'Sixty'), x: 1144, label: '60'}, {at: w(69, 'fifty'), x: 980, label: '50'}], sfx: 'marker_squeak_long'},
        tx('Oct', 1308, 245, w(69, 'Seventy'), {size: 40, color: C.steel, out: w(69, 'Sixty')}),
        tx('Nov', 1144, 245, w(69, 'Sixty'), {size: 40, color: C.steel, out: w(69, 'fifty')}),
        tx('Dec 19', 980, 245, w(69, 'fifty'), {size: 40, color: C.steel}),
        {k: 'check', x: 1226, y: 520, at: w(70, 'clears'), s: 1.2, sfx: 'reveal_ding'},
        ic('truck', 1300, 300, w(70, 'truck'), {s: 0.7, pop: true, sfx: 'pop'}),
        ic('tent', 1530, 300, w(70, 'camp'), {s: 0.6, pop: true}),
        ship('cargo', 1720, 330, w(70, 'ship'), {s: 0.32, wave: false, sfx: 'pop'}),
      ],
    },
    {
      from: 71, to: 74, enter: 'slide',
      els: [
        ...outAll([
          map('atlantic', 80, 160, 1760, 640, V(71), {
            routes: [{pts: [[0.1, 49.5], [-20, 47], [-45, 43], [-73.5, 40.6]], at: w(71, 'ship'), dur: 2.6}],
            labels: [{t: 'USA', lon: -92, lat: 39, at: V(71) + 0.8, size: 64}, {t: 'FRANCE', lon: 2.5, lat: 46.5, at: V(71) + 0.8}],
            sfx: 'ship_horn',
            sfxAt: w(71, 'home'),
          }),
          cal(1640, 920, w(71, 'February'), 'FEB', '1946', 'SEALIFT DONE', {s: 0.6}),
        ], w(72, 'The')),
        ...outAll([
          gi(820, 930, w(72, 'father'), {v: 'father', s: 1.2, pose: 'hug', mood: 'happy', stripes: true}),
          gi(640, 930, w(72, 'first'), {v: 'child', s: 1, mood: 'happy'}),
          gi(1000, 930, w(72, 'summer'), {v: 'child', s: 0.9, mood: 'happy'}),
          big('+12', 640, 560, w(72, 'twelve'), 72, C.red, {sfx: 'pop'}),
          big('+12', 1000, 560, w(72, 'twelve') + 0.25, 72, C.red),
          ic('house', 1450, 720, w(72, 'Home'), {s: 1.6}),
        ], w(73, 'And')),
        ...outAll([
          gi(620, 900, w(73, 'kid'), {v: 'kid', s: 1.2, mood: 'sad'}),
          big('30', 620, 420, w(73, 'thirty'), 130, C.red),
          stamp('POINTS SCRAPPED\nJUNE 1946', 1260, 560, w(73, 'scrapped'), {size: 72}),
        ], w(74, 'From')),
        box(960, 360, 1000, 170, w(74, 'From'), {label: 'NEW RULE: 2 YEARS = HOME', labelSize: 58}),
        ln(380, 820, 1560, 820, w(74, 'kid'), {color: C.ink, w: 6}),
        tx('summer 1944', 380, 890, w(74, 'nineteen'), {size: 46}),
        tx('summer 1946', 1560, 890, w(74, 'nineteen', 2), {size: 46}),
        gi(380, 800, w(74, 'kid'), {v: 'kid', s: 0.55, mood: 'happy', mv: [1180, 0, w(74, 'meant'), 2.4]}),
        ship('cargo', 1760, 800, w(74, 'nineteen', 2), {s: 0.35, wave: false, sfx: 'pop'}),
      ],
    },
    {
      from: 75, to: 79, enter: 'wipe',
      els: [
        ...outAll([
          big('85', 960, 560, V(75), 300, C.red, {out: w(75, 'place'), sfx: 'marker_squeak_long'}),
          big('NOT THE FINISH LINE', 960, 720, w(75, 'finish'), 62, C.ink, {out: w(75, 'place')}),
          ic('ticket', 960, 470, w(75, 'place'), {s: 1.6, label: '85', labelDy: 15, pop: true, sfx: 'pop'}),
          {k: 'crowd', x: 1060, y: 960, at: w(75, 'line'), n: 10, w: 1500, s: 0.42, mv: [-260, 0, w(75, 'moving'), 2.0]},
        ], w(76, 'The')),
        ...outAll([
          big('POINTS', 520, 400, w(76, 'points'), 90),
          big('= ORDER', 520, 520, w(76, 'order'), 76, C.red),
          big('SHIPS + JAPAN\n+ OCCUPATION', 1360, 360, w(76, 'Ships'), 60),
          big('= SPEED', 1360, 560, w(76, 'speed'), 76, C.red),
          ship('cargo', 1180, 800, w(76, 'Ships'), {s: 0.45}),
          ic('helmet', 1560, 800, w(76, 'occupation'), {s: 0.8, pop: true}),
        ], w(77, 'The')),
        ...outAll([
          map('pacific', 110, 180, 1700, 660, w(77, 'last'), {routes: [{pts: [[121, 14.6], [150, 19], [180, 24], [-150, 30], [-122.4, 37.8]], at: w(77, 'arrived'), dur: 2.4}]}),
          cal(1660, 900, w(77, 'September'), 'SEPT', '1946', '+1 YEAR', {s: 0.6}),
        ], w(78, 'In')),
        ...outAll([
          cnt(960, 500, w(78, 'military'), 12000000, {from: 12000000, size: 130, dur: 0.1, out: w(78, 'one') + 0.1, sfx: null}),
          {k: 'crowd', x: 960, y: 920, at: w(78, 'military'), n: 12, w: 1500, s: 0.38, out: w(78, 'one') + 0.6},
          cnt(960, 500, w(78, 'one') + 0.1, 1500000, {from: 12000000, size: 130, dur: 1.4, color: C.red}),
          {k: 'crowd', x: 960, y: 920, at: w(78, 'one') + 0.7, n: 2, w: 260, s: 0.38},
          tx('mid-1945 -> mid-1947', 960, 600, w(78, 'two'), {size: 48, color: C.steel}),
        ], w(79, 'And')),
        ic('pin', 820, 540, w(79, 'pin'), {s: 2.2}),
        tx('an eagle...', 1300, 380, w(79, 'eagle'), {size: 60}),
        ic('duck', 1420, 600, w(79, 'duck'), {s: 1.5, pop: true, sfx: 'pop'}),
        big('THE RUPTURED DUCK', 960, 920, w(79, 'Ruptured'), 84, C.ink, {ul: true}),
      ],
    },
    // ---------------- OUTRO ----------------
    {
      from: 80, to: 80, enter: 'slide',
      els: [
        ic('briefcase', 480, 520, w(80, 'jobs'), {s: 1.3, pop: true, sfx: 'pop'}),
        ic('house', 960, 500, w(80, 'homes'), {s: 1.3, pop: true, sfx: 'pop'}),
        ic('shirt', 1440, 520, w(80, 'clothes'), {s: 1.3, pop: true, sfx: 'pop'}),
        big('?', 600, 380, w(80, 'jobs') + 0.3, 90, C.red),
        big('?', 1080, 360, w(80, 'homes') + 0.3, 90, C.red),
        big('?', 1560, 380, w(80, 'clothes') + 0.3, 90, C.red),
        big('NEXT: COMING HOME', 960, 860, w(80, 'next'), 92, C.ink, {ul: true}),
      ],
    },
  ];
};
