// "How Londoners Ate, Slept & Survived 57 Nights Underground" — scene list.
// One entry per scene in script_scenes.md; one inner array per sentence (beat).
import * as I from "../../illustrations/lib";
import { C } from "../../engine/shapes";
import { at, SceneSpec } from "../../engine/Timeline";

const cs = I.crossSection({ bombers: true, fire: true });
const csQ = I.crossSection({});
const csS = I.crossSection({ sleepers: true, puff: true, thud: true });
const tr = I.train({ open: true });
const plat = I.platform({ lines: 2 });
const platN = I.platform({ lines: 2, sleepersFar: 5, sleepersNear: 5 });
const tun = I.tunnelStub();
const stair = I.stairwell();
const stairA = I.stairwell({ arrows: true });

const csAt = at(csQ, 1120, 640, { w: 1000 });
const crowdAt = at(I.crowdGrid(), 960, 640, { w: 900 });

export const scenes: SceneSpec[] = [
  // 01 HOOK — intro card
  {
    beats: [
      [
        { k: "rays", box: [110, 200, 830, 320], delay: 0.0 },
        { k: "text", lines: [{ text: "57 NIGHTS", color: C.red, size: 150 }], x: 110, y: 320, rot: -3, lps: 10 },
        { k: "text", lines: [{ text: "UNDER", color: C.ink, size: 130 }], x: 100, y: 500, rot: -3, lps: 10 },
        { k: "text", lines: [{ text: "LONDON", color: C.blue, size: 150 }], x: 95, y: 690, rot: -3, lps: 10 },
        { k: "uline", x0: 95, x1: 690, y: 735, double: true },
        { k: "obj", dw: cs, x: 1440, y: 560, w: 860, dur: 4.2 },
      ],
      [{ k: "obj", dw: I.crossFamily(), x: 1440, y: 560, w: 860, dur: 2.5 }],
      [
        { k: "text", lines: [{ text: "BANNED", color: C.red, size: 110 }], x: 1260, y: 1010, rot: -8, lps: 14 },
        { k: "row", items: [{ dw: I.bun(), x: 160, y: 900, h: 110 }, { dw: I.bunk(), x: 340, y: 900, h: 140 }, { dw: I.helmet(), x: 540, y: 905, h: 110 }], stagger: 0.25, dur: 1.6 },
      ],
    ],
    sfx: [{ beat: 0, name: "artillery", gain: -6 }, { beat: 2, name: "stamp", delay: 0.2 }],
  },
  // 02 The Perfect Shelter
  {
    beats: [
      [{ k: "title", text: "The Perfect Shelter" }],
      [{ k: "obj", dw: csQ, x: 1120, y: 640, w: 1000, dur: 3.6 }, { k: "label", text: "20+ m deep", x: 1500, y: 960, to: csAt(1040, 760), anchor: "start", delay: 1.8 }],
    ],
    sfx: [{ beat: 0, name: "squeak" }],
  },
  // 03 The Ban
  {
    beats: [
      [{ k: "title", text: "The Ban" }],
      [{ k: "obj", dw: tr, x: 860, y: 600, w: 900 }],
      [{ k: "obj", dw: I.benchFigure(), x: 1600, y: 690, h: 340, rays: true }, { k: "label", text: "\"deep shelter mentality\"", x: 1600, y: 960, anchor: "middle" }],
    ],
  },
  // 04 The Loophole
  {
    beats: [
      [{ k: "title", text: "The Loophole" }],
      [{ k: "obj", dw: I.ticket("1½d"), x: 900, y: 620, h: 380 }, { k: "label", text: "cheapest ticket", x: 1180, y: 450, to: [1130, 520], delay: 2.4 }],
      [{ k: "obj", dw: I.guard(), x: 1640, y: 700, h: 400, rays: true }],
    ],
    sfx: [{ beat: 1, name: "squeak" }],
  },
  // 05 Liverpool Street
  {
    beats: [
      [{ k: "title", text: "Liverpool Street" }, { k: "obj", dw: I.entrance({ crowd: true, sign: "LIVERPOOL ST" }), x: 960, y: 640, h: 520 }, { k: "obj", dw: I.siren(), x: 1600, y: 420, h: 260, rays: true, delay: 2.4 }],
      [{ k: "obj", dw: I.sign("NO SHELTERING"), x: 420, y: 820, w: 480 }],
    ],
    sfx: [{ beat: 0, name: "siren", gain: -4 }],
  },
  // 06 They Gave In
  {
    beats: [[{ k: "title", text: "They Gave In" }, { k: "obj", dw: I.entrance({ open: true }), x: 960, y: 640, h: 520 }, { k: "obj", dw: I.check(), x: 1520, y: 520, h: 220, dur: 0.8 }]],
  },
  // 07 NUMBER CARD 177,000
  {
    beats: [
      [{ k: "num", num: "177,000", unit: "people", caption: "one night: 27 Sept 1940" }],
      [{ k: "text", lines: [{ text: "Where do they all sleep?" }], x: 960, y: 760, size: 70, anchor: "middle", rot: -1.5 }],
    ],
    sfx: [{ beat: 0, name: "pop", delay: 0.6 }],
  },
  // 08 The Painted Lines
  {
    beats: [
      [{ k: "title", text: "The Painted Lines" }],
      [{ k: "obj", dw: plat, x: 1000, y: 680, w: 1200 }],
      [{ k: "obj", dw: I.platformOverlay(5, 0), x: 1000, y: 680, w: 1200, dur: 2.4 }, { k: "label", text: "8 ft until 7:30 pm", x: 1200, y: 380, to: [1300, 560], delay: 1.2 }],
    ],
    sfx: [{ beat: 0, name: "squeak" }],
  },
  // 09 Four feet
  {
    beats: [
      [{ k: "title", text: "Four Feet" }, { k: "obj", dw: platN, x: 900, y: 680, w: 1100 }, { k: "label", text: "4 ft after 8 pm", x: 700, y: 1010, to: [760, 870], delay: 2.6 }],
      [{ k: "obj", dw: I.clock(10, 30), x: 1650, y: 400, h: 300, rays: true }],
    ],
    sfx: [{ beat: 1, name: "tick", delay: 0.4, gain: -4 }],
  },
  // 10 Every Inch
  {
    beats: [
      [{ k: "title", text: "Every Inch" }, { k: "obj", dw: I.escalator(), x: 900, y: 650, h: 560 }],
      [{ k: "label", text: "coat + blanket", x: 1150, y: 860, to: [1000, 760] }, { k: "obj", dw: I.blanket(), x: 1640, y: 470, h: 200, rays: true }],
    ],
  },
  // 11 The Queue
  {
    beats: [[{ k: "title", text: "The Queue" }, { k: "obj", dw: I.queue(), x: 900, y: 690, w: 1300 }, { k: "obj", dw: I.clock(10, 0), x: 1700, y: 320, h: 240, rays: "l", delay: 2.8 }]],
  },
  // 12 Black Market
  {
    beats: [[{ k: "title", text: "Black Market" }, { k: "obj", dw: I.coins(), x: 960, y: 640, h: 460 }, { k: "label", text: "2s 6d", x: 1300, y: 520, to: [1170, 600], size: 80 }]],
    sfx: [{ beat: 0, name: "pop", delay: 3.0 }],
  },
  // 13 A Ticket to Sleep
  {
    beats: [
      [{ k: "title", text: "A Ticket to Sleep" }, { k: "obj", dw: I.shelterTicket(), x: 880, y: 640, h: 400 }],
      [{ k: "label", text: "reserved", x: 1180, y: 900, to: [1080, 820] }, { k: "obj", dw: I.grid10(), x: 1600, y: 560, w: 420, rays: true }],
    ],
  },
  // 14 Aldwych
  {
    beats: [
      [{ k: "title", text: "A Line Without Trains" }, { k: "obj", dw: tun, x: 900, y: 650, h: 520 }, { k: "obj", dw: I.trainCrossed(), x: 1620, y: 520, w: 300, rays: true, delay: 2.6 }],
      [{ k: "obj", dw: I.tunnelSleepers(), x: 900, y: 650, h: 520, dur: 2.2 }],
    ],
  },
  // 15 Bunks
  {
    beats: [[{ k: "title", text: "Bunks" }, { k: "obj", dw: I.bunk(), x: 960, y: 620, h: 560 }, { k: "label", text: "24,000 bunks", x: 1330, y: 420, to: [1260, 470] }]],
    sfx: [{ beat: 0, name: "squeak" }],
  },
  // 16 NUMBER CARD 27 miles
  {
    beats: [
      [{ k: "num", num: "27", unit: "miles", caption: "24,000 bunks, end to end" }],
      [{ k: "text", delay: 2.2, lines: [{ text: "But what about dinner?" }], x: 960, y: 760, size: 70, anchor: "middle", rot: -1.5 }],
    ],
    sfx: [{ beat: 0, name: "pop", delay: 0.6 }],
  },
  // 17 Bring Your Own
  {
    beats: [
      [{ k: "title", text: "Bring Your Own" }, { k: "obj", dw: I.bag(), x: 880, y: 640, w: 760 }],
      [{ k: "obj", dw: I.rationBook(), x: 1640, y: 560, h: 380, rays: true }, { k: "label", text: "bacon, butter, sugar", x: 1640, y: 860, anchor: "middle" }],
    ],
  },
  // 18 Food by Train
  {
    beats: [
      [{ k: "title", text: "Food by Train" }, { k: "obj", dw: I.train({ open: true, urn: true }), x: 960, y: 640, w: 1000 }],
      [{ k: "label", text: "Tube Refreshments Special", x: 960, y: 900, to: [960, 820], from: [960, 860], anchor: "middle", size: 64 }],
    ],
    sfx: [{ beat: 0, name: "train", gain: -6, delay: 0.6 }],
  },
  // 19 NUMBER CARD 7 tons
  {
    beats: [
      [{ k: "num", num: "7", unit: "tons of food", caption: "every night, Dec 1940" }],
      [{ k: "row", items: [{ dw: I.bun(), x: 640, y: 800, h: 110 }, { dw: I.bun(), x: 800, y: 800, h: 110 }, { dw: I.bun(), x: 960, y: 800, h: 110 }, { dw: I.bun(), x: 1120, y: 800, h: 110 }, { dw: I.mug(), x: 1290, y: 795, h: 130 }], stagger: 0.2, dur: 1.2 }],
    ],
    sfx: [{ beat: 0, name: "pop", delay: 0.6 }],
  },
  // 20 Tea, Tea, Tea
  {
    beats: [[{ k: "title", text: "Tea, Tea, Tea" }, { k: "obj", dw: I.urn({ steam: true }), x: 960, y: 650, h: 520 }, { k: "label", text: "½ million+ gallons", x: 1250, y: 520, to: [1170, 600] }]],
  },
  // 21 Platform Canteens
  {
    beats: [
      [{ k: "title", text: "Platform Canteens" }, { k: "obj", dw: I.counter(), x: 900, y: 660, w: 1000 }],
      [{ k: "obj", dw: I.qmark(), x: 1680, y: 420, h: 260, rays: true, dur: 1.0 }, { k: "label", text: "and then...?", x: 1680, y: 680, anchor: "middle" }],
    ],
  },
  // 22 Built for Minutes
  {
    beats: [[{ k: "title", text: "Built for Minutes" }, { k: "obj", dw: I.clock(12, 5, { arc: true }), x: 960, y: 640, h: 500 }, { k: "label", text: "a few minutes", x: 1300, y: 420, to: [1110, 440] }]],
  },
  // 23 Holborn
  {
    beats: [
      [{ k: "title", text: "Holborn" }, { k: "obj", dw: I.crowdGrid(), x: 860, y: 640, w: 900 }, { k: "label", text: "4,600 people", x: 900, y: 960, to: crowdAt(700, 360), from: [880, 920], anchor: "middle" }],
      [{ k: "obj", dw: I.toiletsBuckets(), x: 1620, y: 560, w: 380, rays: true, dur: 1.2 }],
    ],
    sfx: [{ beat: 1, name: "pop", delay: 0.3 }],
  },
  // 24 The Air
  {
    beats: [
      [{ k: "title", text: "The Air" }, { k: "obj", dw: I.tunnelArch({ smell: true }), x: 880, y: 640, h: 560 }, { k: "obj", dw: I.thermometer(), x: 1600, y: 600, h: 400, rays: true }],
      [{ k: "label", text: "lice", x: 560, y: 960, to: [700, 870] }],
    ],
  },
  // 25 Another Enemy
  {
    beats: [
      [{ k: "title", text: "Another Enemy" }, { k: "obj", dw: I.mosquito(), x: 900, y: 620, w: 760 }],
      [{ k: "obj", dw: I.sprayer(), x: 1620, y: 640, h: 380, rays: "l" }, { k: "label", text: "Feb 1941", x: 1620, y: 920, anchor: "middle" }],
    ],
    sfx: [{ beat: 0, name: "whoosh", delay: 0.5, gain: -6 }],
  },
  // 26 Slowly Better
  {
    beats: [
      [{ k: "title", text: "Slowly Better" }, { k: "obj", dw: I.firstAid(), x: 880, y: 660, w: 1000 }],
      [{ k: "obj", dw: I.qmark(), x: 1680, y: 400, h: 260, rays: true, dur: 1.0 }],
    ],
  },
  // 27 Down Here, Quiet
  {
    beats: [[{ k: "title", text: "Down Here, Quiet" }, { k: "obj", dw: csS, x: 1120, y: 640, w: 1000, dur: 4.0 }]],
    sfx: [{ beat: 0, name: "artillery", gain: -8, delay: 1.0 }],
  },
  // 28 The Children
  {
    beats: [
      [{ k: "title", text: "The Children" }, { k: "obj", dw: I.childrenReading(), x: 900, y: 650, w: 820 }, { k: "label", text: "~25,000 a night", x: 1000, y: 970, anchor: "middle" }],
      [{ k: "obj", dw: I.exerciseBook(), x: 1640, y: 520, w: 320, rays: true }],
    ],
  },
  // 29 A Town Underground
  {
    beats: [
      [{ k: "title", text: "A Town Underground" }, { k: "row", items: [{ dw: I.bookshelf(), x: 560, y: 640, h: 300 }, { dw: I.gramophone(), x: 960, y: 640, h: 300 }, { dw: I.projector(), x: 1360, y: 640, h: 280 }], stagger: 0.5 }],
      [{ k: "label", text: "a kind of home", x: 960, y: 920, anchor: "middle", size: 70 }],
    ],
  },
  // 30 Every Evening
  {
    beats: [
      [{ k: "title", text: "Every Evening" }, { k: "obj", dw: I.familyPair(), x: 760, y: 640, h: 460 }],
      [{ k: "label", text: "work  >  school  >  blankets  >  station", x: 960, y: 960, anchor: "middle", size: 58 }],
      [{ k: "obj", dw: I.house({ q: true }), x: 1580, y: 520, h: 330, rays: "l" }],
    ],
  },
  // 31 NUMBER CARD 63 million
  {
    beats: [[{ k: "num", num: "63", unit: "million", caption: "shelter visits, 1940–1945" }]],
    sfx: [{ beat: 0, name: "pop", delay: 0.6 }],
  },
  // 32 Safe?
  {
    beats: [[{ k: "title", text: "Safe?" }, { k: "obj", dw: I.platformSign(), x: 960, y: 680, h: 420 }, { k: "obj", dw: I.crack(), x: 960, y: 380, w: 900, dur: 0.9 }]],
    sfx: [{ beat: 0, name: "riser", delay: 2.0, gain: -6 }],
  },
  // 33 Not Bombproof
  {
    beats: [
      [{ k: "title", text: "Not Bombproof" }, { k: "obj", dw: I.passage(), x: 900, y: 700, w: 900 }, { k: "obj", dw: I.puff(), x: 900, y: 420, h: 240, dur: 1.4 }],
      [{ k: "obj", dw: I.mapPins(), x: 1640, y: 560, h: 340 }],
    ],
    sfx: [{ beat: 0, name: "boom", delay: 2.6, gain: -6 }],
  },
  // 34 Balham
  {
    beats: [
      [{ k: "title", text: "Balham, 14 Oct 1940" }, { k: "obj", dw: I.puff(), x: 1600, y: 380, h: 260, dur: 1.6 }],
      [{ k: "obj", dw: I.busInCrater(), x: 900, y: 700, w: 1000 }, { k: "label", text: "crater", x: 1460, y: 880, to: [1290, 840] }],
    ],
    sfx: [{ beat: 0, name: "boom", delay: 0.4, gain: -4 }],
  },
  // 35 The Flood
  {
    beats: [
      [{ k: "title", text: "The Flood" }, { k: "obj", dw: I.tunnelArch({ water: 220 }), x: 880, y: 640, h: 560 }],
      [{ k: "obj", dw: I.wreath("68"), x: 1620, y: 580, h: 340 }],
    ],
  },
  // 36 Bank
  {
    beats: [
      [{ k: "title", text: "Bank, Jan 1941" }, { k: "obj", dw: I.bookingHall(), x: 880, y: 650, w: 900 }],
      [{ k: "label", text: "50+", x: 900, y: 1000, anchor: "middle", size: 80 }, { k: "obj", dw: I.bridge(), x: 1600, y: 560, w: 460, rays: true }],
    ],
  },
  // 37 Go Deeper
  {
    beats: [
      [{ k: "title", text: "Go Deeper" }, { k: "obj", dw: I.deepShelter(), x: 900, y: 640, h: 560 }],
      [{ k: "label", text: "8 built", x: 1260, y: 960, to: [1180, 900] }, { k: "obj", dw: I.calendar("1942"), x: 1640, y: 520, h: 300, rays: true }],
    ],
  },
  // 38 Paint + Luck
  {
    beats: [
      [{ k: "title", text: "Paint + Luck" }, { k: "row", items: [{ dw: I.archIcon(), x: 560, y: 640, h: 280 }, { dw: I.paintLine(), x: 960, y: 640, h: 220 }, { dw: I.clover(), x: 1360, y: 640, h: 280 }], stagger: 0.6 }],
      [{ k: "obj", dw: I.qmark(), x: 1700, y: 420, h: 240, dur: 1.0 }],
    ],
  },
  // 39 The Night Count
  {
    beats: [[{ k: "title", text: "The Night Count" }, { k: "obj", dw: I.clipboard(), x: 960, y: 640, h: 540 }]],
    sfx: [{ beat: 0, name: "squeak" }],
  },
  // 40 NUMBER CARD 4%
  {
    beats: [[{ k: "num", num: "4", unit: "%", caption: "in the Tube (Nov 1940 count)" }]],
    sfx: [{ beat: 0, name: "pop", delay: 0.6 }],
  },
  // 41 Everyone Else
  {
    beats: [
      [{ k: "title", text: "Everyone Else" }, { k: "obj", dw: I.stackedBar(false), x: 960, y: 640, w: 1500 }],
      [{ k: "obj", dw: I.stackedBar(true, 3), x: 960, y: 640, w: 1500, dur: 1.6 }],
    ],
  },
  // 42 The Real Answer
  {
    beats: [
      [{ k: "title", text: "The Real Answer" }, { k: "row", items: [{ dw: I.ticket("1½d"), x: 720, y: 480, h: 190 }, { dw: I.paintLine(), x: 1200, y: 480, h: 170 }, { dw: I.train({ open: true, urn: true }), x: 720, y: 800, w: 360 }, { dw: I.guard(), x: 1200, y: 790, h: 250 }], stagger: 0.4 }],
      [{ k: "row", items: [{ dw: I.check(), x: 900, y: 440, h: 110 }, { dw: I.check(), x: 1360, y: 440, h: 110 }, { dw: I.check(), x: 940, y: 760, h: 110 }, { dw: I.check(), x: 1360, y: 760, h: 110 }], stagger: 0.6, dur: 0.6 }],
    ],
  },
  // 43 Bethnal Green
  {
    beats: [
      [{ k: "title", text: "Bethnal Green, 1943" }, { k: "obj", dw: stair, x: 860, y: 680, h: 520 }],
      [{ k: "obj", dw: I.rocketBattery(), x: 1620, y: 520, h: 300, rays: true }, { k: "label", text: "new, unfamiliar noise", x: 1620, y: 760, anchor: "middle" }],
    ],
  },
  // 44 The crush
  {
    beats: [
      [{ k: "obj", dw: stairA, x: 900, y: 640, h: 560 }],
      [{ k: "obj", dw: I.wreath("173"), x: 1620, y: 420, h: 340 }, { k: "label", text: "no bomb fell on the station", x: 1620, y: 700, anchor: "middle", color: C.ink, size: 52 }],
    ],
  },
  // 45 The Lesson
  {
    beats: [[{ k: "title", text: "The Lesson" }, { k: "text", lines: [{ text: "PANIC", color: C.red, size: 230 }], x: 960, y: 700, anchor: "middle", rot: -3, lps: 8, underline: true }, { k: "obj", dw: I.bomb(), x: 1620, y: 640, h: 220, delay: 3.6, dur: 1.0 }, { k: "obj", dw: I.xmark(), x: 1620, y: 640, h: 260, delay: 4.6, dur: 0.6 }]],
  },
  // 46 Kept Quiet
  {
    beats: [
      [{ k: "title", text: "Kept Quiet" }, { k: "obj", dw: I.folder(), x: 860, y: 640, h: 440 }],
      [{ k: "obj", dw: I.sunStation(), x: 1600, y: 560, h: 380 }, { k: "label", text: "344, 6 May 1945", x: 1600, y: 860, anchor: "middle" }],
    ],
    sfx: [{ beat: 0, name: "stamp", delay: 2.4 }],
  },
  // 47 How They Survived
  {
    beats: [
      [{ k: "title", text: "How They Survived" }],
      [
        { k: "row", items: [{ dw: I.ticket("1½d"), x: 420, y: 640, h: 200 }, { dw: I.paintLine(), x: 820, y: 640, h: 190 }, { dw: I.mug(), x: 1180, y: 640, h: 200 }, { dw: I.handsTogether(), x: 1540, y: 630, h: 260 }], stagger: 0.7, dur: 1.8 },
        { k: "uline", x0: 300, x1: 1680, y: 830, delay: 4.6 },
      ],
    ],
  },
  // 48 OUTRO
  {
    beats: [
      [{ k: "obj", dw: I.andersonShelter(), x: 900, y: 600, w: 820 }, { k: "label", text: "NEXT", x: 1480, y: 400, to: [1300, 470], size: 90 }],
      [{ k: "text", lines: [{ text: "Subscribe" }], x: 900, y: 960, size: 80, anchor: "middle", underline: true, rot: -2 }],
    ],
  },
];
