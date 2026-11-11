// Parametric marker-style icon library. Each icon lives in its own w x h box.
// parts: closed shapes (optional scribble fill) and detail strokes. Reuse across videos.
import type {IconDef} from './draw';
import {C, circ} from './draw';

const BROWN = '#8B5A2B';
const DARK = '#4a4a4a';

export const I: Record<string, IconDef> = {
  ration: {
    w: 220, h: 170, parts: [
      {d: 'M20,60 L150,60 L150,160 L20,160 Z', fill: C.khaki},
      {d: 'M20,60 L70,20 L200,20 L150,60 Z', fill: '#d8c99a'},
      {d: 'M150,60 L200,20 L200,120 L150,160 Z', fill: '#a8996a'},
      {d: 'M40,95 L130,95 M40,122 L110,122', w: 4},
    ],
  },
  rifle: {
    w: 320, h: 90, parts: [
      {d: 'M10,52 L70,42 L112,38 L300,32 L304,41 L122,48 L114,60 L82,72 L30,76 L12,68 Z', fill: BROWN},
      {d: 'M112,38 L300,32', w: 6},
      {d: 'M60,66 Q150,96 240,44', w: 3},
    ],
  },
  shovel: {
    w: 90, h: 260, parts: [
      {d: 'M45,12 L45,172', w: 7},
      {d: 'M28,12 L62,12', w: 7},
      {d: 'M18,172 L72,172 L66,230 Q45,256 24,230 Z', fill: C.steel},
    ],
  },
  factory: {
    w: 300, h: 230, parts: [
      {d: 'M10,220 L10,120 L70,80 L70,120 L130,80 L130,120 L190,80 L190,120 L290,120 L290,220 Z', fill: C.khaki},
      {d: 'M220,120 L220,35 L248,35 L248,120 Z', fill: C.steel},
      {d: 'M35,160 h32 v28 h-32 Z M105,160 h32 v28 h-32 Z M175,160 h32 v28 h-32 Z', fill: C.yellow},
      {d: 'M234,28 Q215,10 238,-8 Q258,-24 240,-40', w: 4, color: '#888'},
    ],
  },
  wheat: {
    w: 140, h: 220, parts: [
      {d: 'M70,215 L70,40 M70,120 L40,90 M70,150 L100,118', w: 5},
      {d: 'M70,42 q-16,-12 0,-34 q16,12 0,34 Z', fill: C.yellow},
      {d: 'M70,78 q-28,-4 -26,-30 q26,2 26,30 Z M70,78 q28,-4 26,-30 q-26,2 -26,30 Z', fill: C.yellow},
      {d: 'M70,112 q-28,-4 -26,-30 q26,2 26,30 Z M70,112 q28,-4 26,-30 q-26,2 -26,30 Z', fill: C.yellow},
    ],
  },
  train: {
    w: 300, h: 180, parts: [
      {d: 'M60,62 L215,62 L215,132 L60,132 Z', fill: C.steel},
      {d: 'M205,22 L282,22 L282,132 L205,132 Z', fill: DARK},
      {d: 'M88,62 L88,26 L116,26 L116,62 Z', fill: DARK},
      {d: circ(100, 148, 22) + ' ' + circ(165, 148, 22) + ' ' + circ(245, 148, 22), fill: '#333'},
      {d: 'M60,132 L28,156 L60,156 M220,45 h45 v30 h-45 Z', w: 4},
    ],
  },
  crane: {
    w: 230, h: 260, parts: [
      {d: 'M60,250 L60,40 L92,40 L92,250 M60,90 L92,130 M92,90 L60,130 M60,170 L92,210 M92,170 L60,210', w: 5},
      {d: 'M60,40 L215,40 L92,72', w: 5},
      {d: 'M195,40 L195,135', w: 3},
      {d: 'M172,135 h46 v38 h-46 Z', fill: C.khaki},
      {d: 'M25,250 L125,250', w: 7},
    ],
  },
  cargo: {
    w: 340, h: 180, parts: [
      {d: 'M10,100 L330,100 L300,155 L40,155 Z', fill: C.steel},
      {d: 'M200,55 L262,55 L262,100 L200,100 Z', fill: '#e9e1cf'},
      {d: 'M216,55 L216,24 L242,24 L242,55 Z', fill: DARK},
      {d: 'M80,100 L80,28 M140,100 L140,40 M80,36 L125,92', w: 4},
      {d: 'M0,170 q20,-10 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0', w: 4, color: C.blue},
    ],
  },
  liberty: {
    w: 600, h: 260, parts: [
      {d: 'M20,150 L580,150 L545,235 L60,235 Z', fill: C.steel},
      {d: 'M255,95 L372,95 L372,150 L255,150 Z', fill: '#e9e1cf'},
      {d: 'M298,95 L298,52 L332,52 L332,95 Z', fill: DARK},
      {d: 'M130,150 L130,35 M480,150 L480,40 M200,150 L200,72 M420,150 L420,72 M130,45 L190,140 M480,50 L420,140', w: 5},
      {d: 'M60,212 L545,212', w: 3},
    ],
  },
  sub: {
    w: 360, h: 130, parts: [
      {d: 'M10,85 Q30,55 120,55 L300,55 Q350,65 350,85 Q350,105 300,112 L120,112 Q30,112 10,85 Z', fill: C.steel},
      {d: 'M150,55 L165,20 L215,20 L225,55 Z', fill: C.steel},
      {d: 'M195,20 L195,2 L212,2', w: 4},
    ],
  },
  truck: {
    w: 340, h: 190, parts: [
      {d: 'M110,45 Q220,5 332,45 L332,135 L110,135 Z', fill: C.olive},
      {d: 'M20,135 L20,82 L45,52 L105,52 L105,135 Z', fill: '#59672f'},
      {d: 'M48,60 L96,60 L96,88 L34,88 Z', fill: '#cfe3f2'},
      {d: circ(72, 150, 25) + ' ' + circ(232, 150, 25) + ' ' + circ(292, 150, 25), fill: '#333'},
      {d: 'M15,135 L336,135', w: 6},
    ],
  },
  jerrycan: {
    w: 170, h: 230, parts: [
      {d: 'M20,42 L150,42 L150,222 L20,222 Z', fill: C.olive},
      {d: 'M40,42 L40,10 L130,10 L130,42 M65,10 L65,42 M100,10 L100,42', w: 5},
      {d: 'M38,62 L132,202 M132,62 L38,202', w: 4},
      {d: 'M150,42 L166,20', w: 6},
    ],
  },
  tank: {
    w: 390, h: 210, parts: [
      {d: 'M20,150 Q20,196 60,196 L320,196 Q362,196 362,150 Z', fill: '#555'},
      {d: 'M30,150 L50,110 L330,110 L355,150 Z', fill: C.olive},
      {d: 'M130,110 L150,65 L250,65 L265,110 Z', fill: C.olive},
      {d: 'M250,80 L382,80 L382,92 L258,92', w: 5},
      {d: circ(80, 172, 14) + ' ' + circ(140, 172, 14) + ' ' + circ(200, 172, 14) + ' ' + circ(260, 172, 14) + ' ' + circ(318, 172, 14), w: 4},
    ],
  },
  envelope: {
    w: 260, h: 170, parts: [
      {d: 'M10,10 L250,10 L250,160 L10,160 Z', fill: '#f3ead2'},
      {d: 'M10,10 L130,95 L250,10', w: 5},
      {d: 'M130,108 c-10,-14 -30,-2 -15,14 l15,14 l15,-14 c15,-16 -5,-28 -15,-14 Z', fill: C.red},
    ],
  },
  sack: {
    w: 180, h: 240, parts: [
      {d: 'M42,62 Q8,145 30,215 Q90,238 150,215 Q172,145 138,62 Z', fill: C.khaki},
      {d: 'M62,62 L118,62 L136,28 L44,28 Z', fill: '#a8996a'},
      {d: 'M48,64 L132,64', w: 7},
    ],
  },
  film: {
    w: 360, h: 110, parts: [
      {d: 'M0,10 L360,10 L360,100 L0,100 Z', fill: '#4a4a4a'},
      {d: 'M28,30 h84 v50 h-84 Z M138,30 h84 v50 h-84 Z M248,30 h84 v50 h-84 Z', fill: '#f3ead2'},
      {d: 'M12,20 h8 M48,20 h8 M84,20 h8 M120,20 h8 M156,20 h8 M192,20 h8 M228,20 h8 M264,20 h8 M300,20 h8 M336,20 h8 M12,90 h8 M48,90 h8 M84,90 h8 M120,90 h8 M156,90 h8 M192,90 h8 M228,90 h8 M264,90 h8 M300,90 h8 M336,90 h8', w: 4, color: C.board},
    ],
  },
  camera: {
    w: 220, h: 170, parts: [
      {d: 'M10,52 L210,52 L210,162 L10,162 Z', fill: C.steel},
      {d: 'M60,52 L80,22 L140,22 L160,52', w: 5},
      {d: circ(110, 107, 36), fill: '#e9e1cf'},
      {d: circ(110, 107, 15), fill: DARK},
    ],
  },
  tent: {
    w: 300, h: 200, parts: [
      {d: 'M10,192 L150,22 L290,192 Z', fill: C.khaki},
      {d: 'M120,192 L150,112 L180,192', w: 5},
    ],
  },
  redcross: {
    w: 100, h: 100, parts: [
      {d: circ(50, 50, 46), fill: '#ffffff'},
      {d: 'M38,16 h24 v22 h22 v24 h-22 v22 h-24 v-22 h-22 v-24 h22 Z', fill: C.red},
    ],
  },
  ambulance: {
    w: 340, h: 200, parts: [
      {d: 'M20,40 L240,40 L240,160 L20,160 Z', fill: C.olive},
      {d: 'M240,80 L300,80 L325,120 L325,160 L240,160 Z', fill: C.olive},
      {d: 'M250,90 L295,90 L312,118 L250,118 Z', fill: '#cfe3f2'},
      {d: circ(80, 165, 24) + ' ' + circ(270, 165, 24), fill: '#333'},
      {d: 'M98,62 h66 v76 h-66 Z', fill: '#ffffff'},
      {d: 'M121,72 h20 v18 h18 v20 h-18 v18 h-20 v-18 h-18 v-20 h18 Z', fill: C.red},
    ],
  },
  hospital: {
    w: 300, h: 230, parts: [
      {d: 'M20,80 L280,80 L280,222 L20,222 Z', fill: '#e9e1cf'},
      {d: 'M10,82 L150,15 L290,82', w: 6},
      {d: 'M135,98 h30 v24 h24 v30 h-24 v24 h-30 v-24 h-24 v-30 h24 Z', fill: C.red},
      {d: 'M130,222 L130,188 L170,188 L170,222', w: 4},
    ],
  },
  plane: {
    w: 360, h: 150, parts: [
      {d: 'M20,80 Q60,55 200,60 L330,66 Q350,75 330,84 L200,92 Q60,100 20,80 Z', fill: C.steel},
      {d: 'M150,74 L222,14 L254,14 L212,76 Z', fill: C.steel},
      {d: 'M300,66 L328,24 L346,24 L338,72 Z', fill: C.steel},
      {d: 'M18,50 L18,110', w: 5},
    ],
  },
  house: {
    w: 220, h: 200, parts: [
      {d: 'M30,92 L190,92 L190,192 L30,192 Z', fill: C.khaki},
      {d: 'M10,96 L110,16 L210,96 Z', fill: C.red},
      {d: 'M45,115 h36 v30 h-36 Z', fill: C.yellow},
      {d: 'M95,192 L95,140 L127,140 L127,192', w: 4},
    ],
  },
  calendar: {
    w: 230, h: 220, parts: [
      {d: 'M15,40 L215,40 L215,212 L15,212 Z', fill: '#ffffff'},
      {d: 'M15,40 L215,40 L215,85 L15,85 Z', fill: C.red},
      {d: 'M60,22 L60,56 M170,22 L170,56', w: 7},
    ],
  },
  helmet: {
    w: 200, h: 125, parts: [
      {d: 'M22,100 Q22,12 100,12 Q178,12 178,100 Z', fill: C.olive},
      {d: 'M6,100 L194,100 L188,116 L12,116 Z', fill: '#59672f'},
    ],
  },
  bread: {
    w: 260, h: 140, parts: [
      {d: 'M20,112 Q10,30 130,25 Q250,30 240,112 Z', fill: '#d9a05b'},
      {d: 'M80,46 L100,96 M130,40 L150,96 M180,46 L196,96', w: 4},
    ],
  },
  crate: {
    w: 160, h: 130, parts: [
      {d: 'M10,10 L150,10 L150,120 L10,120 Z', fill: C.khaki},
      {d: 'M10,46 L150,46 M10,84 L150,84 M10,10 L150,120', w: 4},
    ],
  },
  typewriter: {
    w: 240, h: 170, parts: [
      {d: 'M70,62 L70,6 L170,6 L170,62', fill: '#ffffff'},
      {d: 'M20,62 L220,62 L232,160 L8,160 Z', fill: C.steel},
      {d: 'M40,100 h160 M35,125 h170 M30,148 h180', w: 4, color: C.board},
    ],
  },
  aagun: {
    w: 260, h: 200, parts: [
      {d: 'M60,190 L200,190 L180,150 L80,150 Z', fill: C.olive},
      {d: 'M128,150 L228,22 L242,32 L145,160 Z', fill: DARK},
      {d: 'M108,150 L108,108 L162,108 L162,150', fill: C.olive},
    ],
  },
  wrench: {
    w: 230, h: 90, parts: [
      {d: 'M62,35 L215,35 L215,57 L62,57 Z', fill: C.steel},
      {d: 'M12,18 L62,18 L62,74 L12,74 L12,58 L36,58 L36,34 L12,34 Z', fill: C.steel},
    ],
  },
  pot: {
    w: 200, h: 160, parts: [
      {d: 'M30,58 L170,58 L160,148 L40,148 Z', fill: C.steel},
      {d: 'M14,58 L186,58 M30,78 L10,78 M170,78 L190,78', w: 6},
      {d: 'M70,45 q-12,-18 0,-36 M100,45 q-12,-18 0,-36 M130,45 q-12,-18 0,-36', w: 4, color: '#999'},
    ],
  },
  cannon: {
    w: 300, h: 190, parts: [
      {d: 'M100,112 L280,42 L289,58 L112,128 Z', fill: C.olive},
      {d: circ(112, 140, 36), fill: '#555'},
      {d: 'M112,140 L18,178', w: 7},
    ],
  },
  spear: {
    w: 430, h: 70, parts: [
      {d: 'M10,35 L335,35', w: 9},
      {d: 'M330,12 L420,35 L330,58 Z', fill: C.red},
    ],
  },
  horse: {
    w: 310, h: 230, parts: [
      {d: 'M72,82 Q150,50 232,82 Q248,122 222,138 L82,138 Q50,122 72,82 Z', fill: '#a0714f'},
      {d: 'M215,88 L256,26 L292,40 L282,58 L258,52 L242,104 Z', fill: '#a0714f'},
      {d: 'M92,138 L86,218 M122,138 L120,218 M198,138 L203,218 M222,132 L232,218 M72,92 Q30,112 42,172', w: 7},
    ],
  },
  balkenkreuz: {
    w: 120, h: 120, parts: [
      {d: 'M40,2 h40 v38 h38 v40 h-38 v38 h-40 v-38 h-38 v-40 h38 Z', fill: '#ffffff'},
      {d: 'M50,12 h20 v38 h38 v20 h-38 v38 h-20 v-38 h-38 v-20 h38 Z', fill: C.ink},
    ],
  },
  cigs: {
    w: 100, h: 140, parts: [
      {d: 'M12,28 L88,28 L88,134 L12,134 Z', fill: C.red},
      {d: 'M30,28 L30,4 M50,28 L50,10 M70,28 L70,2', w: 7},
    ],
  },
  gum: {w: 150, h: 60, parts: [{d: 'M8,10 L142,10 L142,52 L8,52 Z', fill: C.green}, {d: 'M40,10 L40,52 M110,10 L110,52', w: 3}]},
  tissue: {w: 120, h: 120, parts: [{d: circ(60, 60, 52), fill: '#ffffff'}, {d: circ(60, 60, 16), fill: C.light}]},
  desk: {
    w: 260, h: 170, parts: [
      {d: 'M10,70 L250,70 L250,92 L10,92 Z', fill: BROWN},
      {d: 'M30,92 L30,165 M230,92 L230,165', w: 7},
      {d: 'M150,70 L150,20 L205,20 L205,70 Z', fill: '#ffffff'},
      {d: 'M160,35 h35 M160,48 h35', w: 3},
    ],
  },
  torch: {w: 140, h: 60, parts: [{d: 'M10,24 L100,24 L100,40 L10,40 Z', fill: DARK}, {d: 'M100,32 L136,32', w: 6, color: C.orange}]},
  ballBadge: {w: 120, h: 120, parts: [{d: circ(60, 60, 52), fill: C.red}]},
  sign: {w: 260, h: 120, parts: [{d: 'M10,10 L250,10 L250,82 L10,82 Z', fill: '#ffffff'}, {d: 'M130,82 L130,118', w: 8}]},
  door: {w: 170, h: 260, parts: [{d: 'M15,10 L155,10 L155,255 L15,255 Z', fill: '#e9e1cf'}, {d: circ(130, 140, 7), fill: C.ink}]},
};
