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
  zm_098: ["zh"], zm_029: ["zh"], zm_033: ["zh"], zm_011: ["zh"], zm_025: ["zh"],
  zm_009: ["zh"], zm_097: ["zh"], zm_012: ["zh"], zm_010: ["zh"], zm_050: ["zh"],
};
const PREVIEW_TEXT = {
  en: "Hey there. This is how I sound. Paste your script, and I'll read it for you.",
  de: "Hallo! So klinge ich. Füge deinen Text ein, und ich lese ihn dir vor.",
  es: "¡Hola! Así suena mi voz. Pega tu texto y yo lo leeré por ti.",
  zh: "你好！这就是我的声音。把你的文案粘贴进来，我来为你朗读。",
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
    engines[key] = { kind: "kokoro", session, vocab: key === "zh" ? v.zh : v.v10, sr: 24000 };
  }
  if (key === "zh") engines[key].zh = await getChinese();
  report({ state: "ready", pct: 100 });
  return engines[key];
}

let chinese = null;
async function getChinese() {
  if (!chinese) chinese = await import("./zh.mjs");
  await chinese.ready;
  return chinese;
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

async function synthSentence(engine, lang, spoken, spec, style, speed) {
  if (engine.kind === "piper") return piperSynth(engine, await phonemize(spoken, engine.cfg.espeak.voice), speed);
  const phonemes = lang === "zh"
    ? await engine.zh.phonemize(spoken, (s) => phonemize(s, "en-us"))
    : await phonemize(spoken, VOICE_INFO[spec.voice][1]);
  return kokoroSynth(engine, phonemes, style, speed);
}

// ---------------------------------------------------------------- text

const ABBREVIATIONS = {
  en: new Set(["mr", "mrs", "ms", "dr", "st", "jr", "sr", "prof", "inc", "ltd", "co", "corp", "no", "vol",
    "fig", "mt", "dept", "approx", "u.s", "u.k", "a.m", "p.m", "e.g", "i.e", "vs"]),
  de: new Set(["dr", "prof", "nr", "z.b", "bzw", "ca", "d.h", "u.a", "inkl", "ggf", "evtl", "st", "hr", "fr"]),
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
const END_ZH = /[。！？!?…][”’」』）)"]*$/;

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

function normalize(text, lang) {
  if (lang === "en") text = text.replace(MONEY_RE, money).replace(YEAR_RE, year);
  for (const [re, repl] of RULES[lang] || []) text = text.replace(re, repl);
  return text;
}

function splitSentences(par, lang) {
  const out = [];
  let start = 0;
  if (lang === "zh") {
    for (const m of par.matchAll(/[。！？!?；;…]+[”’」』）)"]*/g)) {
      out.push(par.slice(start, m.index + m[0].length).trim());
      start = m.index + m[0].length;
    }
  } else {
    const abbr = ABBREVIATIONS[lang] || new Set();
    for (const m of par.matchAll(/[.!?…]+["”’»)\]]*(?=\s|$)/g)) {
      const words = par.slice(start, m.index).split(/\s+/).filter(Boolean);
      const last = (words[words.length - 1] || "").toLowerCase();
      const following = par.slice(m.index + m[0].length).trimStart().charAt(0);
      const isDot = m[0].replace(/["”’»)\]]+$/, "") === ".";
      const lower = following && following === following.toLowerCase() && following !== following.toUpperCase();
      if (isDot && (abbr.has(last) || (last.length === 1 && /\p{L}/u.test(last)) || lower)) continue;
      out.push(par.slice(start, m.index + m[0].length).trim());
      start = m.index + m[0].length;
    }
  }
  out.push(par.slice(start).trim());
  return out.filter(Boolean);
}

function textSize(s, lang) {
  return lang === "zh" ? s.replace(/[^\p{L}\p{N}]/gu, "").length : s.split(/\s+/).filter(Boolean).length;
}

// Text -> paragraphs of [shown, spoken] pairs: shown goes to subtitles, spoken to the voice
function buildScript(text, lang, pron) {
  const endRe = lang === "zh" ? END_ZH : END_LATIN;
  const paragraphs = [];
  for (const block of cleanMarkdown(text).split(/\n\s*\n/)) {
    const merged = [];
    for (const ln of block.split("\n").filter((l) => l.trim())) {
      const first = ln.charAt(0);
      const wrapped = first && first === first.toLowerCase() && first !== first.toUpperCase();
      if (merged.length && !endRe.test(merged[merged.length - 1]) && wrapped) merged[merged.length - 1] += " " + ln;
      else merged.push(ln);
    }
    // Very short sentences sound clipped on their own, so they ride with the next one
    const grouped = [];
    for (const ln of merged) {
      for (const s of splitSentences(ln, lang)) {
        if (grouped.length && textSize(grouped[grouped.length - 1], lang) < (lang === "zh" ? 6 : 3)) {
          grouped[grouped.length - 1] += (lang === "zh" ? "" : " ") + s;
        } else grouped.push(s);
      }
    }
    const pairs = [];
    for (const shown of grouped) {
      let spoken = normalize(applyPronunciations(shown, pron), lang);
      if (!/[\p{L}\p{N}]/u.test(spoken)) continue;
      if (!endRe.test(spoken)) spoken += lang === "zh" ? "。" : ".";
      pairs.push([shown, spoken]);
    }
    if (pairs.length) paragraphs.push(pairs);
  }
  return paragraphs;
}

function foreignWords(text, lang, limit = 3) {
  const found = [];
  for (const word of text.match(/[\p{L}\p{N}_]+/gu) || []) {
    const bad = [...word].some((ch) => /\p{L}/u.test(ch) && !/\p{Script=Latin}/u.test(ch) && !(lang === "zh" && /\p{Script=Han}/u.test(ch)));
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

function srtCues(sentence, start, end, lang) {
  const parts = lang === "zh"
    ? splitEven([...sentence], Math.max(1, Math.ceil(sentence.length / 24)), "", "，、：；,;:")
    : splitEven(sentence.split(/\s+/), Math.max(1, Math.ceil(sentence.length / 84)), " ", ",;:—").map((p) => wrapTwoLines(p));
  const total = parts.reduce((s, p) => s + p.length, 0) || 1;
  let t = start;
  return parts.map((p) => { const dt = ((end - start) * p.length) / total; const cue = [t, t + dt, p]; t += dt; return cue; });
}

// ---------------------------------------------------------------- jobs

let cancelled = false;

async function generate({ id, text, lang, spec, speed, sentencePause, paragraphPause, pron }) {
  cancelled = false;
  const foreign = foreignWords(applyPronunciations(text, pron), lang);
  const label = { en: "англійський", de: "німецький", es: "іспанський", zh: "китайський" }[lang];
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
      const audio = await synthSentence(engine, lang, spoken, spec, style, speed);
      const dur = audio.length / sr;
      cues.push(...srtCues(shown, offset, offset + dur, lang));
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
  const audio = await synthSentence(engine, lang, normalize(PREVIEW_TEXT[lang], lang), spec, style, speed);
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
