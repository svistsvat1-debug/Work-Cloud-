// Voice Studio engine, runs in a Web Worker so the page stays responsive.
// Text -> sentences -> espeak-ng phonemes -> ONNX voice model -> WAV + SRT.
// Everything is computed on the device; models are files next to the page.
import * as ort from "./ort.wasm.min.mjs";
import createPiperPhonemize from "./piper_phonemize.mjs";

const ENGINE_DIR = new URL("./", import.meta.url).href;
const ROOT = new URL("../", import.meta.url).href;
ort.env.wasm.wasmPaths = ENGINE_DIR;
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

const LEAD_IN = 0.25, TAIL = 0.5; // seconds of silence around the whole voiceover

// Which model and phonemizer language each voice uses
const VOICE_INFO = {
  am_michael: ["en", "en-us"], am_fenrir: ["en", "en-us"], am_puck: ["en", "en-us"], am_onyx: ["en", "en-us"],
  am_adam: ["en", "en-us"], am_echo: ["en", "en-us"], am_liam: ["en", "en-us"], am_eric: ["en", "en-us"],
  bm_george: ["en", "en-gb"], bm_fable: ["en", "en-gb"], bm_lewis: ["en", "en-gb"], bm_daniel: ["en", "en-gb"],
  em_alex: ["en", "es"],
  de_thorsten: ["de", "de"],
};
const PREVIEW_TEXT = {
  en: "Hey there. This is how I sound. Paste your script, and I'll read it for you.",
  de: "Hallo! So klinge ich. Füge deinen Text ein, und ich lese ihn dir vor.",
  es: "¡Hola! Así suena mi voz. Pega tu texto y yo lo leeré por ti.",
};

// ---------------------------------------------------------------- files + cache

let manifest = null;
const cacheDb = new Promise((resolve) => {
  try {
    const req = indexedDB.open("voice-studio-models", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  } catch { resolve(null); }
});

async function cacheGet(key) {
  const db = await cacheDb;
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction("files").objectStore("files").get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function cachePut(key, value) {
  const db = await cacheDb;
  if (!db) return;
  await new Promise((resolve) => {
    try {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(value, key);
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    } catch { resolve(); }
  });
}

async function cacheKeys() {
  const db = await cacheDb;
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const req = db.transaction("files").objectStore("files").getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

async function fetchBytes(url, onBytes) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не вдалося завантажити файл (${res.status})`);
  if (!onBytes || !res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    onBytes(value.length);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

async function getManifest() {
  if (!manifest) manifest = JSON.parse(new TextDecoder().decode(await fetchBytes(ROOT + "models/manifest.json")));
  return manifest;
}

// A model is split into 14 MB parts (named .wasm only so the host serves them as binary);
// it is joined here and kept in IndexedDB,
// so it downloads once per device.
async function loadModelBytes(key, onProgress) {
  const m = (await getManifest())[key];
  const cacheKey = `${key}:${m.sha256}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return new Uint8Array(cached);
  const out = new Uint8Array(m.size);
  let offset = 0, loaded = 0;
  for (const part of m.parts) {
    const bytes = await fetchBytes(ROOT + part, (n) => { loaded += n; onProgress(loaded / m.size); });
    out.set(bytes, offset);
    offset += bytes.length;
  }
  if (offset !== m.size) throw new Error("Модель завантажилась не повністю, спробуйте ще раз");
  await cachePut(cacheKey, out.buffer);
  return out;
}

const voiceCache = new Map();
async function voiceStyle(id) {
  if (!voiceCache.has(id)) {
    const half = await fetchBytes(ROOT + `voices/${id}.wasm`);
    voiceCache.set(id, f16ToF32(new Uint16Array(half.buffer, half.byteOffset, half.byteLength / 2)));
  }
  return voiceCache.get(id);
}

function f16ToF32(src) {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const h = src[i], s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    out[i] = e === 0 ? s * 2 ** -14 * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * 2 ** (e - 15) * (1 + f / 1024);
  }
  return out;
}

// ---------------------------------------------------------------- phonemes

let espeak = null;
async function getEspeak() {
  if (espeak) return espeak;
  const [wasm, data] = await Promise.all([
    fetchBytes(ENGINE_DIR + "piper_phonemize.wasm"),
    fetchBytes(ENGINE_DIR + "espeak-data.wasm"),
  ]);
  const lines = [];
  const mod = await createPiperPhonemize({
    print: (s) => lines.push(s),
    printErr: () => {},
    wasmBinary: wasm.buffer,
    getPreloadedPackage: () => data.buffer,
    locateFile: (f) => ENGINE_DIR + f,
  });
  espeak = (text, language) => {
    lines.length = 0;
    mod.callMain(["-l", language, "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]);
    const result = JSON.parse(lines.join("") || "{}");
    return (result.phonemes || []).join("");
  };
  return espeak;
}

// espeak glues sentences together ("decision.It"), so each one is phonemized on its own
async function phonemize(text, language) {
  const run = await getEspeak();
  return text.split(/(?<=[.!?…;:])\s+/).map((s) => run(s, language).trim()).filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- voice models

const engines = {};
let vocab = null;

async function getVocab() {
  if (!vocab) vocab = JSON.parse(new TextDecoder().decode(await fetchBytes(ENGINE_DIR + "vocab.json")));
  return vocab;
}

async function getEngine(key, report) {
  if (engines[key]) return engines[key];
  // Only one big model in memory at a time: phones have little of it
  for (const k of Object.keys(engines)) { await engines[k].session.release?.(); delete engines[k]; }
  report({ state: "downloading", pct: 0 });
  const bytes = await loadModelBytes(key, (p) => report({ state: "downloading", pct: Math.round(p * 100) }));
  report({ state: "loading", pct: 100 });
  const session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  if (key === "de") {
    const cfg = JSON.parse(new TextDecoder().decode(await fetchBytes(ROOT + "models/de.json")));
    engines[key] = { kind: "piper", session, cfg, sr: cfg.audio.sample_rate };
  } else {
    const v = await getVocab();
    engines[key] = { kind: "kokoro", session, vocab: v.v10, sr: 24000 };
  }
  report({ state: "ready", pct: 100 });
  return engines[key];
}

function tensor(type, data, dims) { return new ort.Tensor(type, data, dims); }

async function kokoroRun(engine, ids, style, speed) {
  const rows = style.length / 256;
  const row = Math.min(ids.length, rows) - 1;
  const s = engine.session;
  const feeds = {
    [s.inputNames[0]]: tensor("int64", BigInt64Array.from([0, ...ids, 0], BigInt), [1, ids.length + 2]),
    style: tensor("float32", style.slice(row * 256, row * 256 + 256), [1, 256]),
    speed: tensor("float32", new Float32Array([speed]), [1]),
  };
  const out = await s.run(feeds);
  return trimSilence(Float32Array.from(out[s.outputNames[0]].data), engine.sr);
}

// Kokoro reads at most 510 tokens at once; longer sentences are split at pauses
async function kokoroSynth(engine, phonemes, style, speed) {
  const chars = [...phonemes].filter((c) => engine.vocab[c] !== undefined);
  const ids = chars.map((c) => engine.vocab[c]);
  if (!ids.length) throw new SkipError();
  const batches = [];
  let start = 0;
  while (ids.length - start > 500) {
    let cut = -1;
    for (let i = start + 500; i > start + 100; i--) {
      if ([",", ";", ":", ".", " "].includes(chars[i])) { cut = i + 1; break; }
    }
    if (cut < 0) cut = start + 500;
    batches.push(ids.slice(start, cut));
    start = cut;
  }
  batches.push(ids.slice(start));
  const parts = [];
  for (const b of batches) if (b.length) parts.push(await kokoroRun(engine, b, style, speed));
  return concat(parts, engine.sr, 0.12);
}

async function piperSynth(engine, phonemes, speed) {
  const m = engine.cfg.phoneme_id_map;
  const ids = [...m["^"], ...m["_"]];
  for (const ch of phonemes.normalize("NFD")) if (m[ch]) ids.push(...m[ch], ...m["_"]);
  ids.push(...m["$"]);
  if (ids.length <= 3) throw new SkipError();
  const inf = engine.cfg.inference;
  const out = await engine.session.run({
    input: tensor("int64", BigInt64Array.from(ids, BigInt), [1, ids.length]),
    input_lengths: tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: tensor("float32", new Float32Array([inf.noise_scale, inf.length_scale / speed, inf.noise_w]), [3]),
  });
  return trimSilence(Float32Array.from(out[engine.session.outputNames[0]].data), engine.sr);
}

class SkipError extends Error {}

async function mixedStyle(spec) {
  const a = await voiceStyle(spec.voice);
  if (!spec.mix_voice) return a;
  const b = await voiceStyle(spec.mix_voice);
  const w = Math.min(1, Math.max(0, spec.mix ?? 0.5));
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = w * a[i] + (1 - w) * b[i];
  return out;
}

async function synthSentence(engine, spoken, spec, style, speed) {
  if (engine.kind === "piper") return piperSynth(engine, await phonemize(spoken, engine.cfg.espeak.voice), speed);
  const phonemes = await phonemize(spoken, VOICE_INFO[spec.voice][1]);
  return kokoroSynth(engine, phonemes, style, speed);
}

// ---------------------------------------------------------------- text

const ABBREVIATIONS = {
  en: new Set(["mr", "mrs", "ms", "dr", "st", "jr", "sr", "prof", "inc", "ltd", "co", "corp", "no", "vol",
    "fig", "mt", "dept", "approx", "u.s", "u.k", "a.m", "p.m", "e.g", "i.e", "vs", "min", "hr", "hrs", "sec",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"]),
  de: new Set(["dr", "prof", "nr", "z.b", "bzw", "ca", "d.h", "u.a", "inkl", "ggf", "evtl", "st", "hr", "fr", "std", "min", "sek",
    "jan", "feb", "apr", "aug", "sep", "sept", "okt", "nov", "dez"]),
  es: new Set(["sr", "sra", "srta", "dr", "dra", "ud", "uds", "p.ej", "ee.uu", "av", "núm", "prof"]),
};
const SCALES = { k: "thousand", thousand: "thousand", m: "million", mn: "million", million: "million",
  b: "billion", bn: "billion", billion: "billion", t: "trillion", trillion: "trillion" };
const CURRENCIES = { "$": ["dollar", "dollars", "cent", "cents"], "€": ["euro", "euros", "cent", "cents"],
  "£": ["pound", "pounds", "penny", "pence"] };
const MONEY_RE = /([$€£])\s?(\d[\d,]*)(?:\.(\d+))?(?:\s?(thousand|million|billion|trillion)\b|([kmbt]n?)\b)?/gi;
const YEAR_RE = /\b(in|since|by|from|until|till|of|year|before|after|during|around|early|late|mid)\s+(1[1-9]\d\d|20\d\d)\b(?!\s*%|[.,]\d)/gi;
const RULES = {
  en: [
    [/\bvs\.?(?=\s)/gi, "versus"], [/\be\.g\.,?/gi, "for example,"], [/\bi\.e\.,?/gi, "that is,"],
    [/\bapprox\./gi, "approximately"], [/\b24\/7\b/g, "twenty-four seven"], [/#(\d+)/g, "number $1"],
    [/\b(\d+)x\b/g, "$1 times"], [/\s&\s/g, " and "], [/\bw\/(?=\s)/g, "with"],
  ],
  de: [
    [/\bz\.\s?B\./g, "zum Beispiel"], [/\bd\.\s?h\./g, "das heißt"], [/\bu\.\s?a\./g, "unter anderem"],
    [/\bbzw\./g, "beziehungsweise"], [/\busw\./g, "und so weiter."], [/\bca\./g, "circa"], [/\bNr\./g, "Nummer"],
    [/\bggf\./g, "gegebenenfalls"], [/\binkl\./g, "inklusive"], [/\bevtl\./g, "eventuell"],
    [/\$\s?(\d[\d.,]*)/g, "$1 Dollar"], [/£\s?(\d[\d.,]*)/g, "$1 Pfund"], [/€\s?(\d[\d.,]*)/g, "$1 Euro"],
    [/(\d)\s?€/g, "$1 Euro"], [/#(\d+)/g, "Nummer $1"], [/\s&\s/g, " und "],
  ],
  es: [
    [/(?<=\d)\.(?=\d{3}(?!\d))/g, ""], [/\bp\.\s?ej\./gi, "por ejemplo"], [/\bEE\.\s?UU\./g, "Estados Unidos"],
    [/\bSrta\./g, "señorita"], [/\bSra\./g, "señora"], [/\bSr\./g, "señor"], [/\bUds\./g, "ustedes"], [/\bUd\./g, "usted"],
    [/\$\s?(\d[\d.,]*)/g, "$1 dólares"], [/£\s?(\d[\d.,]*)/g, "$1 libras"], [/€\s?(\d[\d.,]*)/g, "$1 euros"],
    [/(\d)\s?€/g, "$1 euros"], [/#(\d+)/g, "número $1"], [/\s&\s/g, " y "],
  ],
};
const END_LATIN = /[.!?…]["”’»)\]]*$/;

function cleanMarkdown(text) {
  return text.replace(/\r\n?/g, "\n").split("\n").map((line) => {
    if (/^\s*[-—_=*~]{3,}\s*$/.test(line)) return "";
    return line.replace(/^\s{0,3}(#{1,6}\s+|[-*•]\s+|>\s*)/, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*|__|[*`]/g, "")
      .split(/\s+/).filter(Boolean).join(" ");
  }).join("\n");
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function applyPronunciations(text, pron) {
  for (const [word, say] of Object.entries(pron || {})) {
    const w = word.trim();
    if (w) text = text.replace(new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(w)}(?![\\p{L}\\p{N}_])`, "gu"), say);
  }
  return text;
}

function money(_, sym, whole, frac, wordScale, letterScale) {
  const scale = wordScale || letterScale;
  const [one, many, cent, cents] = CURRENCIES[sym];
  whole = whole.replace(/,/g, "");
  if (scale) return `${whole}${frac ? "." + frac : ""} ${SCALES[scale.toLowerCase()]} ${many}`;
  if (frac && frac.length === 2 && +frac > 0) {
    const c = +frac, centWords = `${c} ${c === 1 ? cent : cents}`;
    return +whole === 0 ? centWords : `${whole} ${whole === "1" ? one : many} and ${centWords}`;
  }
  const num = whole + (frac && +frac > 0 ? "." + frac : "");
  return `${num} ${num === "1" ? one : many}`;
}

function year(_, word, y) {
  y = +y;
  const hi = Math.floor(y / 100), lo = y % 100;
  let words;
  if (y >= 2000 && y <= 2009) words = String(y);
  else if (lo === 0) words = `${hi} hundred`;
  else if (lo < 10) words = `${hi} oh ${lo}`;
  else words = `${hi} ${lo}`; // 2026 -> "twenty twenty-six"
  return `${word} ${words}`;
}

// ---- natural reading (English): clock times, dates, ranges, fractions, units -> words the voice reads naturally
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const ORDINALS = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DAYS = { mon: "Monday", tue: "Tuesday", tues: "Tuesday", wed: "Wednesday", thu: "Thursday", thur: "Thursday", thurs: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday" };
const MER = "([AaPp])\\.?\\s?[Mm]\\b\\.?"; // AM, am, a.m., a. m.
const NOT_AFTER = "(?<![\\d:.,/$€£])";
const UNITS_EN = { min: ["minute", "minutes"], mins: ["minute", "minutes"], hr: ["hour", "hours"], hrs: ["hour", "hours"], h: ["hour", "hours"],
  sec: ["second", "seconds"], secs: ["second", "seconds"], km: ["kilometer", "kilometers"], kg: ["kilogram", "kilograms"],
  g: ["gram", "grams"], mg: ["milligram", "milligrams"], lb: ["pound", "pounds"], lbs: ["pound", "pounds"], oz: ["ounce", "ounces"],
  ml: ["milliliter", "milliliters"], mL: ["milliliter", "milliliters"], l: ["liter", "liters"], L: ["liter", "liters"],
  cm: ["centimeter", "centimeters"], mm: ["millimeter", "millimeters"], kcal: ["calorie", "calories"], cal: ["calorie", "calories"],
  mph: ["mile per hour", "miles per hour"], "km/h": ["kilometer per hour", "kilometers per hour"], kph: ["kilometer per hour", "kilometers per hour"],
  "°C": ["degree Celsius", "degrees Celsius"], "°F": ["degree Fahrenheit", "degrees Fahrenheit"], "°": ["degree", "degrees"] };
// "5 min. of" loses the abbreviation dot; a dot that ends the sentence stays
const UNIT_RE = new RegExp(`(?<![\\p{L}\\d.,])(\\d+(?:[.,]\\d+)?)\\s?(km/h|kph|mph|kcal|cal|mins?|hrs?|h|secs?|km|kg|mg|g|lbs?|oz|ml|mL|l|L|cm|mm|°C|°F|°)(?:\\.(?=\\s+[\\p{Ll}\\d]))?(?![\\p{L}\\d/])`, "gu");
const FRACTIONS = { "1/2": "a half", "½": "a half", "1/3": "a third", "⅓": "a third", "2/3": "two thirds", "⅔": "two thirds",
  "1/4": "a quarter", "¼": "a quarter", "3/4": "three quarters", "¾": "three quarters" };

function wordsEn(n) { // 0..99
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
}
function ordinalEn(n) { // 1..99: 21 -> "twenty-first"
  const parts = wordsEn(n).split("-"), last = parts.pop();
  return [...parts, ORDINALS[last] || (last.endsWith("y") ? last.slice(0, -1) + "ieth" : last + "th")].join("-");
}
function yearEn(y) { // 2026 -> "twenty twenty-six", 2005 -> "two thousand five", 1905 -> "nineteen oh five"
  const hi = Math.floor(y / 100), lo = y % 100;
  if (y >= 2000 && y <= 2009) return "two thousand" + (lo ? " " + ONES[lo] : "");
  if (lo === 0) return wordsEn(hi) + " hundred";
  return wordsEn(hi) + (lo < 10 ? " oh " + ONES[lo] : " " + wordsEn(lo));
}
const isYear = (s) => /^\d{4}$/.test(s) && +s >= 1100 && +s <= 2099;
const monthOf = (name) => MONTHS.findIndex((m) => m.slice(0, 3).toLowerCase() === name.slice(0, 3).toLowerCase());
function dateEn(month, day, year) { // "October eleventh, twenty twenty-six"
  return `${MONTHS[month]} ${ordinalEn(day)}${year ? ", " + yearEn(+year) : ""}`;
}
function validDate(m, d) { return m >= 1 && m <= 12 && d >= 1 && d <= 31; }

// One clock time -> {h, m, mer}; h on a 12-hour dial, mer "AM" | "PM" | "" (unknown)
function clockParts(hs, ms, merLetter) {
  let h = +hs, m = ms ? +ms : 0, mer = merLetter ? (merLetter.toLowerCase() === "a" ? "AM" : "PM") : "";
  if (h > 24 || m > 59) return null;
  if (mer) { if (h > 12) h -= 12; if (h === 0) h = 12; }
  else if (h === 24 || (h === 0 && m === 0)) return { h: 0, m: 0, mer: "", midnight: true };
  else if (h > 12) { h -= 12; mer = "PM"; }
  else if (h === 0) { h = 12; mer = "AM"; }
  else if (hs.length === 2 && hs[0] === "0") mer = "AM"; // 07:00 is a 24-hour morning time
  return { h, m, mer };
}
function clockCore({ h, m, midnight }) { // "seven", "seven oh five", "seven thirty"
  if (midnight) return "midnight";
  return wordsEn(h) + (m === 0 ? "" : m < 10 ? " oh " + ONES[m] : " " + wordsEn(m));
}
function clockEn(t) {
  if (t.midnight) return "midnight";
  return clockCore(t) + (t.mer ? " " + t.mer : t.m === 0 ? " o'clock" : "");
}
// "7 a.m. Then" keeps its full stop when the abbreviation also ended the sentence
const keepStop = (match, rest) => (/\.$/.test(match) && /^(\s*$|\s+[A-Z]|["”’)\]])/.test(rest) ? "." : "");

function naturalEn(text) {
  // Dates: 2026-10-11, 11.10.2026 (day first), 10/11/2026 (month first unless the first number is over 12)
  text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (s, y, m, d) => (isYear(y) && validDate(+m, +d) ? dateEn(+m - 1, +d, y) : s));
  text = text.replace(/(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})(?![\d.]\d)/g, (s, d, m, y) => (isYear(y) && validDate(+m, +d) ? dateEn(+m - 1, +d, y) : s));
  text = text.replace(/(?<![\d/])(\d{1,2})\/(\d{1,2})\/(\d{4})(?![\d/])/g, (s, a, b, y) => {
    const [m, d] = +a > 12 ? [+b, +a] : [+a, +b];
    return isYear(y) && validDate(m, d) ? dateEn(m - 1, d, y) : s;
  });
  // October 11, 2026 / Oct. 11th / 11 October 2026 / the 11th of October / October 2026
  text = text.replace(new RegExp(`\\b${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?![\\d:])(?:,?\\s+(\\d{4})\\b)?`, "g"),
    (s, mon, d, y) => (+d >= 1 && +d <= 31 && (!y || isYear(y)) ? dateEn(monthOf(mon), +d, y) : s));
  text = text.replace(new RegExp(`\\b(?:(the)\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\b\\.?(?:,?\\s+(\\d{4})\\b)?`, "g"),
    (s, the, d, mon, y, off, all) => (+d >= 1 && +d <= 31 && (!y || isYear(y))
      ? `${the || "the"} ${ordinalEn(+d)} of ${MONTHS[monthOf(mon)]}${y ? ", " + yearEn(+y) : keepStop(s, all.slice(off + s.length))}` : s));
  text = text.replace(new RegExp(`\\b${MONTH}\\.?\\s+(\\d{4})\\b`, "g"), (s, mon, y) => (isYear(y) ? `${MONTHS[monthOf(mon)]} ${yearEn(+y)}` : s));
  // Mon-Fri -> Monday to Friday
  text = text.replace(/\b(Mon|Tues?|Wed|Thu(?:rs?)?|Fri|Sat|Sun)\.?\s?[-–—]\s?(Mon|Tues?|Wed|Thu(?:rs?)?|Fri|Sat|Sun)\b\.?/g,
    (s, a, b, off, all) => `${DAYS[a.toLowerCase()]} to ${DAYS[b.toLowerCase()]}${keepStop(s, all.slice(off + s.length))}`);
  // Time ranges: 6-7 AM, 6:30-7:15 a.m., 9 AM-5 PM, 18:00-19:00
  text = text.replace(new RegExp(`${NOT_AFTER}(\\d{1,2})(?:[:.](\\d{2}))?(?:\\s?${MER})?\\s?(?:-|–|—|to)\\s?(\\d{1,2})(?:[:.](\\d{2}))?\\s?${MER}`, "g"),
    (s, h1, m1, p1, h2, m2, p2, off, all) => {
      const a = clockParts(h1, m1, p1 || p2), b = clockParts(h2, m2, p2);
      if (!a || !b) return s;
      return `${clockCore(a)}${p1 && a.mer !== b.mer ? " " + a.mer : ""} to ${clockCore(b)} ${b.mer}${keepStop(s, all.slice(off + s.length))}`;
    });
  text = text.replace(new RegExp(`${NOT_AFTER}(\\d{1,2}):(\\d{2})\\s?[-–—]\\s?(\\d{1,2}):(\\d{2})(?![\\d:])`, "g"), (s, h1, m1, h2, m2) => {
    const a = clockParts(h1, m1), b = clockParts(h2, m2);
    if (!a || !b) return s;
    return a.mer === b.mer ? `${clockCore(a)} to ${clockCore(b)}${b.mer ? " " + b.mer : ""}` : `${clockEn(a)} to ${clockEn(b)}`;
  });
  // Single times: 7:00 AM, 19:00, 7.00 PM, at 7.30, 7am
  text = text.replace(new RegExp(`${NOT_AFTER}(\\d{1,2}):(\\d{2})(?![\\d:])(?:\\s?${MER})?`, "g"), (s, h, m, p, off, all) => {
    const t = clockParts(h, m, p);
    return t ? clockEn(t) + keepStop(s, all.slice(off + s.length)) : s;
  });
  text = text.replace(new RegExp(`${NOT_AFTER}(\\d{1,2})\\.(\\d{2})(?![\\d.])\\s?${MER}`, "g"), (s, h, m, p, off, all) => {
    const t = clockParts(h, m, p);
    return t ? clockEn(t) + keepStop(s, all.slice(off + s.length)) : s;
  });
  text = text.replace(/\b(at|around|until|till|from)\s+(\d{1,2})\.(00|15|30|45)(?![\d.,])(?!\s*(?:%|percent|dollars?|euros?|pounds?|cents?|times))/gi, (s, w, h, m) => {
    const t = clockParts(h, m);
    return t ? `${w} ${clockEn(t)}` : s;
  });
  text = text.replace(new RegExp(`${NOT_AFTER}(\\d{1,2})\\s?${MER}`, "g"), (s, h, p, off, all) => {
    const t = clockParts(h, null, p);
    return t && +h >= 1 && +h <= 12 ? clockEn(t) + keepStop(s, all.slice(off + s.length)) : s;
  });
  // 3x10 -> 3 by 10; 1 1/2 -> 1 and a half; 1/2 -> a half
  text = text.replace(/\b(\d+)\s?[x×]\s?(\d+)\b/g, "$1 by $2");
  text = text.replace(/(?<![\d/])(?:(\d+)\s+)?(1\/2|1\/3|2\/3|1\/4|3\/4|[½⅓⅔¼¾])(?![\d/])/g,
    (s, whole, f) => (whole ? `${whole} and ${FRACTIONS[f]}` : FRACTIONS[f]));
  text = text.replace(/(\d)([½⅓⅔¼¾])/g, (s, d, f) => `${d} and ${FRACTIONS[f]}`);
  // Units: 10 min -> 10 minutes, 2L -> 2 liters, 1 km -> 1 kilometer
  // Before a noun the unit stays singular: "a 5 km run" -> "a 5 kilometer run"
  text = text.replace(UNIT_RE, (s, n, u, off, all) => `${n} ${UNITS_EN[u][n === "1" || /\b(?:a|an)\s+$/i.test(all.slice(0, off)) ? 0 : 1]}`);
  // Number ranges: 5-10 -> 5 to 10, 2020-2026 -> twenty twenty to twenty twenty-six
  text = text.replace(/(?<![\d.,:/\-–—])(\d+(?:[.,]\d+)?)\s?[-–—]\s?(\d+(?:[.,]\d+)?)(?![\d:/]|[.,]\d|\s?[-–—]\s?\d)/g, (s, a, b) => {
    if (isYear(a) && (isYear(b) || /^\d\d$/.test(b))) return `${yearEn(+a)} to ${yearEn(isYear(b) ? +b : Math.floor(+a / 100) * 100 + +b)}`;
    if (a.length >= 3 && b.length >= 4) return s; // looks like a phone number
    return `${a} to ${b}`;
  });
  // A spaced dash between words is a pause; espeak drops "–" and " - " without one
  text = text.replace(/\s+[-–]\s+/g, " — ");
  return text;
}
// ---- end natural reading (English)

// ---- natural reading (German, Spanish): clock times, dates, ranges, units
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONAT = "(Jan(?:uar)?|Feb(?:ruar)?|März|Apr(?:il)?|Mai|Juni?|Juli?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Okt(?:ober)?|Nov(?:ember)?|Dez(?:ember)?)";
const DE_ONES = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
const DE_ORD = ["", "erste", "zweite", "dritte", "vierte", "fünfte", "sechste", "siebte", "achte", "neunte", "zehnte", "elfte", "zwölfte",
  "dreizehnte", "vierzehnte", "fünfzehnte", "sechzehnte", "siebzehnte", "achtzehnte", "neunzehnte", "zwanzigste"];
const TAGE = { mo: "Montag", di: "Dienstag", mi: "Mittwoch", do: "Donnerstag", fr: "Freitag", sa: "Samstag", so: "Sonntag" };
const UNITS_DE = { min: ["eine Minute", "Minuten"], Min: ["eine Minute", "Minuten"], h: ["eine Stunde", "Stunden"], Std: ["eine Stunde", "Stunden"],
  sek: ["eine Sekunde", "Sekunden"], Sek: ["eine Sekunde", "Sekunden"], km: ["ein Kilometer", "Kilometer"], kg: ["ein Kilogramm", "Kilogramm"],
  g: ["ein Gramm", "Gramm"], mg: ["ein Milligramm", "Milligramm"], l: ["ein Liter", "Liter"], L: ["ein Liter", "Liter"],
  ml: ["ein Milliliter", "Milliliter"], cm: ["ein Zentimeter", "Zentimeter"], mm: ["ein Millimeter", "Millimeter"],
  kcal: ["eine Kalorie", "Kalorien"], "km/h": ["ein Kilometer pro Stunde", "Kilometer pro Stunde"], "°C": ["ein Grad Celsius", "Grad Celsius"], "°": ["ein Grad", "Grad"] };
const UNIT_RE_DE = /(?<![\p{L}\d.,])(\d+(?:,\d+)?)\s?(km\/h|kcal|Min|min|Std|Sek|sek|h|km|kg|mg|g|ml|l|L|cm|mm|°C|°)(?:\.(?=\s+[\p{L}\d]))?(?![\p{L}\d/])/gu;

function ordinalDe(n) { // 1..31, stem without ending: 11 -> "elfte", 21 -> "einundzwanzigste"
  if (n <= 20) return DE_ORD[n];
  const tens = n >= 30 ? "dreißig" : "zwanzig";
  return (n % 10 ? DE_ONES[n % 10] + "und" : "") + tens + "ste";
}
// "am 11. Oktober" -> "am elften Oktober"; after "der/die/das" or at the start -> "elfte"
function dateDe(before, d, month, y) {
  const nominative = /(?:^|[\s(])(?:der|die|das|Der|Die|Das)\s+$/.test(before) || /^\s*$/.test(before);
  return `${ordinalDe(d)}${nominative ? "" : "n"} ${MONATE[month]}${y ? " " + y : ""}`;
}

function naturalDe(text) {
  // Dates: 11.10.2026, 2026-10-11, 11. Oktober 2026
  text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (s, y, m, d, off, all) => (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31 ? dateDe(all.slice(0, off), +d, +m - 1, y) : s));
  text = text.replace(/(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})?(?![\d.]\d|\d)/g, (s, d, m, y, off, all) =>
    (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31 && (y || /^(\s|$)/.test(all.slice(off + s.length))) ? dateDe(all.slice(0, off), +d, +m - 1, y) : s));
  text = text.replace(new RegExp(`(?<![\\d.])(\\d{1,2})\\.\\s?${MONAT}\\b\\.?(?:\\s+(\\d{4})\\b)?`, "g"), (s, d, mon, y, off, all) => {
    const m = MONATE.findIndex((x) => x.slice(0, 3) === mon.slice(0, 3));
    return +d >= 1 && +d <= 31 && m >= 0 ? dateDe(all.slice(0, off), +d, m, y) : s;
  });
  // Mo-Fr -> Montag bis Freitag
  text = text.replace(/\b(Mo|Di|Mi|Do|Fr|Sa|So)\.?\s?[-–—]\s?(Mo|Di|Mi|Do|Fr|Sa|So)\b\.?/g, (s, a, b) => `${TAGE[a.toLowerCase()]} bis ${TAGE[b.toLowerCase()]}`);
  // Times: 7:00 Uhr -> 7 Uhr, 7.30 Uhr -> 7 Uhr 30, 19:00 -> 19 Uhr, 7:00-8:00 Uhr -> 7 bis 8 Uhr
  const clock = (h, m) => (+m ? `${+h} Uhr ${+m}` : `${+h} Uhr`);
  text = text.replace(/(?<![\d:.,])(\d{1,2})(?:[:.](\d{2}))?\s?(?:-|–|—|bis)\s?(\d{1,2})(?:[:.](\d{2}))?\s?Uhr\b/g, (s, h1, m1, h2, m2) => {
    if (+h1 > 24 || +h2 > 24 || +(m1 || 0) > 59 || +(m2 || 0) > 59) return s;
    return +(m1 || 0) || +(m2 || 0) ? `${clock(h1, m1)} bis ${clock(h2, m2)}` : `${+h1} bis ${+h2} Uhr`;
  });
  text = text.replace(/(?<![\d:.,])(\d{1,2}):(\d{2})\s?[-–—]\s?(\d{1,2}):(\d{2})(?![\d:])/g, (s, h1, m1, h2, m2) =>
    (+h1 > 24 || +h2 > 24 || +m1 > 59 || +m2 > 59 ? s : +m1 || +m2 ? `${clock(h1, m1)} bis ${clock(h2, m2)}` : `${+h1} bis ${+h2} Uhr`));
  text = text.replace(/(?<![\d:.,])(\d{1,2})([:.])(\d{2})(?![\d:]|[.,]\d)(\s?Uhr\b)?/g, (s, h, sep, m, uhr) =>
    (+h > 24 || +m > 59 || (sep === "." && !uhr) ? s : clock(h, m)));
  // 3x10 -> 3 mal 10, 10x -> 10 mal
  text = text.replace(/\b(\d+)\s?[x×]\s?(\d+)\b/g, "$1 mal $2").replace(/\b(\d+)x\b/g, "$1 mal");
  // Units: 10 min -> 10 Minuten, 1 l -> ein Liter
  text = text.replace(UNIT_RE_DE, (s, n, u) => (n === "1" ? UNITS_DE[u][0] : `${n} ${UNITS_DE[u][1]}`));
  // Ranges: 5-10 -> 5 bis 10
  text = text.replace(/(?<![\d.,:/\-–—])(\d+(?:,\d+)?)\s?[-–—]\s?(\d+(?:,\d+)?)(?![\d:/]|[.,]\d|\s?[-–—]\s?\d)/g,
    (s, a, b) => (a.length >= 3 && b.length >= 4 && !(/^(1[1-9]|20)\d\d$/.test(a) && /^(1[1-9]|20)\d\d$/.test(b)) ? s : `${a} bis ${b}`));
  // A spaced dash between words is a pause; espeak drops "–" and " - " without one
  text = text.replace(/\s+[-–]\s+/g, " — ");
  return text;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = { lun: "lunes", mar: "martes", mie: "miércoles", "mié": "miércoles", jue: "jueves", vie: "viernes", sab: "sábado", "sáb": "sábado", dom: "domingo" };
const UNITS_ES = { min: ["un minuto", "minutos"], h: ["una hora", "horas"], hs: ["una hora", "horas"], seg: ["un segundo", "segundos"],
  km: ["un kilómetro", "kilómetros"], kg: ["un kilo", "kilos"], g: ["un gramo", "gramos"], mg: ["un miligramo", "miligramos"],
  l: ["un litro", "litros"], L: ["un litro", "litros"], ml: ["un mililitro", "mililitros"], cm: ["un centímetro", "centímetros"],
  mm: ["un milímetro", "milímetros"], kcal: ["una caloría", "calorías"], "km/h": ["un kilómetro por hora", "kilómetros por hora"],
  "°C": ["un grado", "grados"], "°": ["un grado", "grados"] };
const UNIT_RE_ES = /(?<![\p{L}\d.,])(\d+(?:,\d+)?)\s?(km\/h|kcal|min|seg|hs|h|km|kg|mg|g|ml|l|L|cm|mm|°C|°)(?:\.(?=\s+[\p{Ll}\d]))?(?![\p{L}\d/])/gu;
const MER_ES = "([AaPp])\\.?\\s?[Mm]\\.?(?![\\p{L}])";

// 24-hour clock -> "7 y media de la tarde"; article "las" becomes "la" for one o'clock
function clockEs(art, h24, m, twelve, withPeriod = twelve) {
  const period = !withPeriod ? "" : h24 < 6 ? " de la madrugada" : h24 < 12 ? " de la mañana" : h24 === 12 ? " del mediodía" : h24 < 20 ? " de la tarde" : " de la noche";
  const h = twelve ? h24 % 12 || 12 : h24;
  const mins = m === 0 ? "" : m === 15 ? " y cuarto" : m === 30 ? " y media" : ` y ${m}`;
  const article = art ? (h === 1 ? art.replace(/as$/, "a") : art.replace(/a$/, "as")) + " " : "";
  return `${article}${h === 1 ? "una" : h}${mins}${period}`;
}
function to24(h, mer) {
  if (!mer) return h;
  const pm = mer.toLowerCase() === "p";
  return pm ? (h < 12 ? h + 12 : 12) : h === 12 ? 0 : h;
}

function naturalEs(text) {
  // Dates: 11/10/2026, 11-10-2026, 11.10.2026 (day first), 2026-10-11
  text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (s, y, m, d) => (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31 ? `${+d} de ${MESES[+m - 1]} de ${y}` : s));
  text = text.replace(/(?<![\d/.-])(\d{1,2})([/.-])(\d{1,2})\2(\d{4})(?![\d/.-]\d|\d)/g, (s, d, sep, m, y) =>
    (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31 ? `${+d} de ${MESES[+m - 1]} de ${y}` : s));
  // lun-vie -> lunes a viernes
  text = text.replace(/\b(lun|mar|mi[eé]|jue|vie|s[aá]b|dom)\.?\s?[-–—]\s?(lun|mar|mi[eé]|jue|vie|s[aá]b|dom)\b\.?/gi,
    (s, a, b) => `${DIAS[a.toLowerCase()]} a ${DIAS[b.toLowerCase()]}`);
  // Times: a las 7:00 -> a las 7, 7:30 a. m. -> 7 y media de la mañana, 19:00 -> 7 de la tarde
  text = text.replace(new RegExp(`(?<![\\d:.,])(\\d{1,2})(?::(\\d{2}))?\\s?(?:-|–|—|a)\\s?(\\d{1,2})(?::(\\d{2}))?\\s?${MER_ES}`, "gu"), (s, h1, m1, h2, m2, mer) => {
    const a = to24(+h1, mer), b = to24(+h2, mer);
    if (+h1 > 12 || +h2 > 12 || +(m1 || 0) > 59 || +(m2 || 0) > 59) return s;
    return `${clockEs("", a, +(m1 || 0), true, false)} a ${clockEs("", b, +(m2 || 0), true)}`;
  });
  text = text.replace(/(?<![\d:.,])(\d{1,2}):(\d{2})\s?[-–—]\s?(\d{1,2}):(\d{2})(?![\d:])(?:\s?h(?:s|oras)?\b\.?)?/g, (s, h1, m1, h2, m2) => {
    if (+h1 > 24 || +h2 > 24 || +m1 > 59 || +m2 > 59) return s;
    const p = +h1 >= 13 || +h2 >= 13;
    return `${clockEs("", +h1, +m1, p, false)} a ${clockEs("", +h2, +m2, p)}`;
  });
  text = text.replace(new RegExp(`(?<![\\d:.,])(?:\\b([Ll]as?)\\s+)?(\\d{1,2}):(\\d{2})(?![\\d:])(?:\\s?h(?:s|oras)?\\b\\.?)?(?:\\s?${MER_ES})?`, "gu"), (s, art, h, m, mer) => {
    if (+h > 24 || +m > 59 || (mer && +h > 12)) return s;
    const h24 = to24(+h, mer) % 24;
    return clockEs(art, h24, +m, !!mer || +h >= 13);
  });
  text = text.replace(new RegExp(`(?<![\\d:.,])(?:\\b([Ll]as?)\\s+)?(\\d{1,2})\\s?${MER_ES}`, "gu"), (s, art, h, mer) =>
    (+h >= 1 && +h <= 12 ? clockEs(art, to24(+h, mer), 0, true) : s));
  // 3x10 -> 3 por 10, 10x -> 10 veces
  text = text.replace(/\b(\d+)\s?[x×]\s?(\d+)\b/g, "$1 por $2").replace(/\b(\d+)x\b/g, "$1 veces");
  // Units: 10 min -> 10 minutos, 1 km -> un kilómetro
  text = text.replace(UNIT_RE_ES, (s, n, u) => (n === "1" ? UNITS_ES[u][0] : `${n} ${UNITS_ES[u][1]}`));
  // Ranges: 5-10 -> 5 a 10
  text = text.replace(/(?<![\d.,:/\-–—])(\d+(?:,\d+)?)\s?[-–—]\s?(\d+(?:,\d+)?)(?![\d:/]|[.,]\d|\s?[-–—]\s?\d)/g,
    (s, a, b) => (a.length >= 3 && b.length >= 4 && !(/^(1[1-9]|20)\d\d$/.test(a) && /^(1[1-9]|20)\d\d$/.test(b)) ? s : `${a} a ${b}`));
  // A spaced dash between words is a pause; espeak drops "–" and " - " without one
  text = text.replace(/\s+[-–]\s+/g, " — ");
  return text;
}
// ---- end natural reading (German, Spanish)

const NATURAL = { en: naturalEn, de: naturalDe, es: naturalEs };

function normalize(text, lang) {
  text = NATURAL[lang](text);
  if (lang === "en") text = text.replace(MONEY_RE, money).replace(YEAR_RE, year);
  for (const [re, repl] of RULES[lang] || []) text = text.replace(re, repl);
  return text;
}

function splitSentences(par, lang) {
  const out = [];
  let start = 0;
  const abbr = ABBREVIATIONS[lang] || new Set();
  for (const m of par.matchAll(/[.!?…]+["”’»)\]]*(?=\s|$)/g)) {
    const words = par.slice(start, m.index).split(/\s+/).filter(Boolean);
    const last = (words[words.length - 1] || "").toLowerCase();
    const following = par.slice(m.index + m[0].length).trimStart().charAt(0);
    const isDot = m[0].replace(/["”’»)\]]+$/, "") === ".";
    const lower = following && following === following.toLowerCase() && following !== following.toUpperCase();
    const ordinal = lang === "de" && /^\d{1,2}$/.test(last); // "am 11. Oktober"
    if (isDot && (abbr.has(last) || (last.length === 1 && /\p{L}/u.test(last)) || lower || ordinal)) continue;
    out.push(par.slice(start, m.index + m[0].length).trim());
    start = m.index + m[0].length;
  }
  out.push(par.slice(start).trim());
  return out.filter(Boolean);
}

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

// Text -> paragraphs of [shown, spoken] pairs: shown goes to subtitles, spoken to the voice
function buildScript(text, lang, pron) {
  const paragraphs = [];
  for (const block of cleanMarkdown(text).split(/\n\s*\n/)) {
    const merged = [];
    for (const ln of block.split("\n").filter((l) => l.trim())) {
      const first = ln.charAt(0);
      const wrapped = first && first === first.toLowerCase() && first !== first.toUpperCase();
      if (merged.length && !END_LATIN.test(merged[merged.length - 1]) && wrapped) merged[merged.length - 1] += " " + ln;
      else merged.push(ln);
    }
    // Very short sentences sound clipped on their own, so they ride with the next one
    const grouped = [];
    for (const ln of merged) {
      for (const s of splitSentences(ln, lang)) {
        if (grouped.length && wordCount(grouped[grouped.length - 1]) < 3) {
          grouped[grouped.length - 1] += " " + s;
        } else grouped.push(s);
      }
    }
    const pairs = [];
    for (const shown of grouped) {
      let spoken = normalize(applyPronunciations(shown, pron), lang);
      if (!/[\p{L}\p{N}]/u.test(spoken)) continue;
      if (!END_LATIN.test(spoken)) spoken += ".";
      pairs.push([shown, spoken]);
    }
    if (pairs.length) paragraphs.push(pairs);
  }
  return paragraphs;
}

function foreignWords(text, limit = 3) {
  const found = [];
  for (const word of text.match(/[\p{L}\p{N}_]+/gu) || []) {
    const bad = [...word].some((ch) => /\p{L}/u.test(ch) && !/\p{Script=Latin}/u.test(ch));
    if (bad && !found.includes(word)) found.push(word);
    if (found.length === limit) break;
  }
  return found;
}

// ---------------------------------------------------------------- audio + subtitles

function trimSilence(audio, sr, thresholdDb = -45) {
  const frame = Math.floor(sr / 100), n = Math.floor(audio.length / frame);
  if (n < 3) return audio;
  const rms = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * frame; j < (i + 1) * frame; j++) sum += audio[j] * audio[j];
    rms[i] = Math.sqrt(sum / frame);
    if (rms[i] > max) max = rms[i];
  }
  const limit = max * 10 ** (thresholdDb / 20);
  let first = 0, last = n - 1;
  while (first < n && rms[first] <= limit) first++;
  while (last > first && rms[last] <= limit) last--;
  if (first >= n) return audio;
  return audio.slice(Math.max(0, first - 2) * frame, Math.min(n, last + 3) * frame);
}

function concat(parts, sr, gap) {
  const g = Math.round(gap * sr);
  const total = parts.reduce((s, p) => s + p.length, 0) + g * Math.max(0, parts.length - 1);
  const out = new Float32Array(total);
  let off = 0;
  parts.forEach((p, i) => { out.set(p, off); off += p.length + (i < parts.length - 1 ? g : 0); });
  return out;
}

function wavBytes(audio, sr) {
  let peak = 0;
  for (const v of audio) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 10 ** (-1 / 20) / peak : 1; // peak at -1 dBFS
  const buf = new ArrayBuffer(44 + audio.length * 2), dv = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); dv.setUint32(4, 36 + audio.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, "data");
  dv.setUint32(40, audio.length * 2, true);
  for (let i = 0; i < audio.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, audio[i] * gain)) * 32767, true);
  return buf;
}

function srtTime(t) {
  let ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000); ms -= m * 60000;
  const s = Math.floor(ms / 1000); ms -= s * 1000;
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(ms, 3)}`;
}

function wrapTwoLines(text, width = 42) {
  if (text.length <= width || !text.includes(" ")) return text;
  const mid = text.length / 2;
  let cut = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
  return text.slice(0, cut) + "\n" + text.slice(cut + 1);
}

function splitEven(units, n, joiner, soft) {
  const ends = [];
  let pos = 0;
  for (const u of units) { pos += u.length + joiner.length; ends.push(pos); }
  const parts = [];
  let first = 0;
  for (let k = 1; k < n; k++) {
    if (first >= units.length - 1) break;
    const target = (pos * k) / n;
    let cut = first, best = Infinity;
    for (let i = first; i < units.length - 1; i++) {
      const score = Math.abs(ends[i] - target) - (soft.includes(units[i].slice(-1)) ? 12 : 0);
      if (score < best) { best = score; cut = i; }
    }
    parts.push(units.slice(first, cut + 1).join(joiner));
    first = cut + 1;
  }
  parts.push(units.slice(first).join(joiner));
  return parts.filter(Boolean);
}

function srtCues(sentence, start, end) {
  const parts = splitEven(sentence.split(/\s+/), Math.max(1, Math.ceil(sentence.length / 84)), " ", ",;:—").map((p) => wrapTwoLines(p));
  const total = parts.reduce((s, p) => s + p.length, 0) || 1;
  let t = start;
  return parts.map((p) => { const dt = ((end - start) * p.length) / total; const cue = [t, t + dt, p]; t += dt; return cue; });
}

// ---------------------------------------------------------------- jobs

let cancelled = false;

async function generate({ id, text, lang, spec, speed, sentencePause, paragraphPause, pron }) {
  cancelled = false;
  const foreign = foreignWords(applyPronunciations(text, pron));
  const label = { en: "англійський", de: "німецький", es: "іспанський" }[lang];
  if (foreign.length) throw new Error(`Цей голос читає ${label} текст. Замініть або видаліть: ${foreign.join(", ")}`);
  const model = VOICE_INFO[spec.voice][0];
  const engine = await getEngine(model, (s) => post({ type: "engine", model, ...s, id }));
  const style = engine.kind === "kokoro" ? await mixedStyle(spec) : null;
  const paragraphs = buildScript(text, lang, pron);
  const items = [];
  paragraphs.forEach((p, pi) => p.forEach(([shown, spoken], si) => {
    const lastInPar = si === p.length - 1;
    items.push([shown, spoken, lastInPar && pi === paragraphs.length - 1 ? 0 : lastInPar ? paragraphPause : sentencePause]);
  }));
  if (!items.length) throw new Error("Немає тексту для озвучки");
  const sr = engine.sr, parts = [new Float32Array(Math.round(LEAD_IN * sr))], cues = [];
  let offset = LEAD_IN, done = 0, skipped = 0;
  const started = performance.now();
  post({ type: "progress", id, done, total: items.length, audio: 0, elapsed: 0 });
  for (const [shown, spoken, gap] of items) {
    if (cancelled) throw new Error("Скасовано");
    try {
      const audio = await synthSentence(engine, spoken, spec, style, speed);
      const dur = audio.length / sr;
      cues.push(...srtCues(shown, offset, offset + dur));
      parts.push(audio, new Float32Array(Math.round(gap * sr)));
      offset += dur + gap;
    } catch (e) {
      if (!(e instanceof SkipError)) throw e;
      skipped++;
    }
    done++;
    post({ type: "progress", id, done, total: items.length, audio: offset, elapsed: (performance.now() - started) / 1000 });
  }
  if (!cues.length) throw new Error("Не вдалося озвучити жодного речення");
  parts.push(new Float32Array(Math.round(TAIL * sr)));
  const audio = concat(parts, sr, 0);
  const srt = cues.map(([a, b, line], i) => `${i + 1}\n${srtTime(a)} --> ${srtTime(b)}\n${line}\n`).join("\n");
  const wav = wavBytes(audio, sr);
  return { wav, srt, duration: audio.length / sr, seconds: (performance.now() - started) / 1000, skipped };
}

async function preview({ id, lang, spec, speed }) {
  const model = VOICE_INFO[spec.voice][0];
  const engine = await getEngine(model, (s) => post({ type: "engine", model, ...s, id }));
  const style = engine.kind === "kokoro" ? await mixedStyle(spec) : null;
  const audio = await synthSentence(engine, normalize(PREVIEW_TEXT[lang], lang), spec, style, speed);
  return { wav: wavBytes(audio, engine.sr) };
}

async function status() {
  const m = await getManifest();
  const keys = new Set(await cacheKeys());
  const models = {};
  for (const [k, v] of Object.entries(m)) models[k] = { size: v.size, cached: keys.has(`${k}:${v.sha256}`), loaded: !!engines[k] };
  return { models, threads: ort.env.wasm.numThreads };
}

function post(msg, transfer) { self.postMessage(msg, transfer || []); }

self.onmessage = async ({ data }) => {
  if (data.type === "cancel") { cancelled = true; return; }
  try {
    let result;
    if (data.type === "generate") result = await generate(data);
    else if (data.type === "preview") result = await preview(data);
    else if (data.type === "status") result = await status();
    else if (data.type === "prepare") {
      await getEngine(data.model, (s) => post({ type: "engine", model: data.model, ...s, id: data.id }));
      result = await status();
    }
    post({ type: "done", id: data.id, result }, result?.wav ? [result.wav] : []);
  } catch (e) {
    post({ type: "error", id: data.id, error: e?.message || String(e) });
  }
};
post({ type: "hello" });
