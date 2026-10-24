// Voice Studio API on Cloudflare Workers.
// The page in ./public is served by Workers Assets; only /api/* reaches this code.
// Voices run on DeepInfra (paid per character), called with the DEEPINFRA_API_KEY secret,
// so the key never reaches the browser. Access: one password, the SITE_PASSWORD secret.
// Kokoro-82M (Apache 2.0, $0.99 per million characters): English, and Spanish and French voices it has.
// Chatterbox Multilingual (MIT, $1 per million): German, Spanish, French in its own male voice and in synthetic native
// voices made for this site (voice-studio/lab/design_voices.py). Inworld TTS 1.5 ($50 per million): premium voices
// made for those languages (Inworld assigns the rights in generated audio to the customer). Picked in voice-studio/lab
// by speech recognition, accent, naturalness and pitch checks; see voice-studio/lab/README.md.
// The page sends a few sentences per request; this code only checks the session and relays audio.

const COOKIE = 'vs_session';
const SESSION_DAYS = 180;
const MAX_TEXT = 1500; // characters per request
const ENGINES = {
  kokoro: { model: 'hexgrad/Kokoro-82M' },
  inworld: {
    model: 'inworld-ai/inworld-tts-1.5-max', verify: true,
    routes: (text, voice, lang, speed, format) => [
      ['speech', { model: 'inworld-ai/inworld-tts-1.5-max', input: text, voice, speed, response_format: format }],
      ['native', { text, voice, speaking_rate: speed, output_format: format }],
    ],
  },
  /* Only the native route takes language_id (the OpenAI-style one reads every language as English). No speed: the page
     slows or speeds the audio itself. Each voice has its own exaggeration / cfg / temperature (picked in voice-studio/lab,
     rounds 7-8; the model's defaults of 0 make more mistakes). Always MP3, WAV only if MP3 is refused: the audio comes as
     base64 in JSON, and unpacking 14 s of WAV takes ~3.7 ms of the free plan's 10 ms CPU, MP3 ~1.1 ms (retakes add up). */
  chatterbox: {
    model: 'ResembleAI/chatterbox-multilingual', verify: true,
    routes: (text, voice, lang, speed, format, opts) => ['mp3', 'wav'].map(f =>
      ['native', { text, language_id: lang, response_format: f, ...opts, ...(voice ? { voice_id: voice } : {}) }]),
  },
};
const ASR_MODEL = 'openai/whisper-large-v3-turbo'; // checks Inworld and Chatterbox takes: $0.0002 per minute of audio
const TAKES = 3; // a take that does not match its text is voiced again, at most this many times in all
function kokoroVoices(byLang) {
  const out = {};
  for (const [lang, ids] of Object.entries(byLang)) for (const id of ids.split(' ')) out[id] = ['kokoro', id, lang];
  return out;
}
// Chatterbox settings: LIVELY reads with more expression, CALM is steadier and slips less (voice-studio/lab, rounds 7-8)
const LIVELY = { exaggeration: 0.5, cfg: 0.3 }, CALM = { exaggeration: 0.35, cfg: 0.3, temperature: 0.7 };
// Voice id the page sends -> engine, the provider's voice name, language, engine options.
// Chatterbox voices: '' is the model's own voice; the others are synthetic voices made for this site with
// voice-studio/lab/design_voices.py and kept in this DeepInfra account (voice ids only work with its key).
const VOICES = {
  am_michael: ['kokoro', 'am_michael', 'en'], am_fenrir: ['kokoro', 'am_fenrir', 'en'], am_puck: ['kokoro', 'am_puck', 'en'],
  am_onyx: ['kokoro', 'am_onyx', 'en'], am_adam: ['kokoro', 'am_adam', 'en'], am_echo: ['kokoro', 'am_echo', 'en'],
  am_liam: ['kokoro', 'am_liam', 'en'], am_eric: ['kokoro', 'am_eric', 'en'], bm_george: ['kokoro', 'bm_george', 'en'],
  bm_fable: ['kokoro', 'bm_fable', 'en'], bm_lewis: ['kokoro', 'bm_lewis', 'en'], bm_daniel: ['kokoro', 'bm_daniel', 'en'],
  af_heart: ['kokoro', 'af_heart', 'en'], af_bella: ['kokoro', 'af_bella', 'en'], af_nicole: ['kokoro', 'af_nicole', 'en'],
  af_sarah: ['kokoro', 'af_sarah', 'en'], af_kore: ['kokoro', 'af_kore', 'en'], af_aoede: ['kokoro', 'af_aoede', 'en'],
  bf_emma: ['kokoro', 'bf_emma', 'en'], bf_isabella: ['kokoro', 'bf_isabella', 'en'],
  // The rest of Kokoro: every voice it has (its own ids; the first letter is the language, the second f/m)
  ...kokoroVoices({
    en: 'am_santa af_alloy af_jessica af_nova af_river af_sky bf_alice bf_lily', es: 'em_santa',
    it: 'im_nicola if_sara', pt: 'pm_alex pm_santa pf_dora', hi: 'hm_omega hm_psi hf_alpha hf_beta',
    ja: 'jm_kumo jf_alpha jf_gongitsune jf_nezumi jf_tebukuro',
    zh: 'zm_yunjian zm_yunxi zm_yunxia zm_yunyang zf_xiaobei zf_xiaoni zf_xiaoxiao zf_xiaoyi',
  }),
  de_lukas: ['chatterbox', 'menjhi06hqcmfjwzu4dz', 'de', CALM], de_max: ['chatterbox', '', 'de', CALM],
  de_anna: ['chatterbox', 'ufzc7yn3vq0tbpyyoygc', 'de', LIVELY], de_lena: ['chatterbox', 'lfwoiakcdb8ktvbutdar', 'de', CALM],
  es_alex: ['kokoro', 'em_alex', 'es'], es_mateo: ['chatterbox', '', 'es', LIVELY], es_santa: ['kokoro', 'em_santa', 'es'],
  es_lucia: ['chatterbox', '8qs07p4ftjdfzn00sxsc', 'es', LIVELY], es_dora: ['kokoro', 'ef_dora', 'es'],
  es_valentina: ['chatterbox', 'a8fxvnzbjx574rduzhj2', 'es', CALM],
  fr_louis: ['chatterbox', '', 'fr', LIVELY], fr_hugo: ['chatterbox', 'y1lfq42wi3gxr1qsql98', 'fr', LIVELY],
  fr_camille: ['chatterbox', 'j5rtpur21lwjzmgeqimr', 'fr', CALM], fr_siwis: ['kokoro', 'ff_siwis', 'fr'],
  de_josef: ['inworld', 'Josef', 'de'],
  es_rafael: ['inworld', 'Rafael', 'es'], es_diego: ['inworld', 'Diego', 'es'],
  fr_lucian: ['inworld', 'Lucian', 'fr'], fr_alain: ['inworld', 'Alain', 'fr'],
};
const DEFAULT_VOICE = { en: 'am_michael', de: 'de_max', es: 'es_alex', fr: 'fr_louis', it: 'im_nicola', pt: 'pm_alex', hi: 'hm_omega',
  ja: 'jm_kumo', zh: 'zm_yunjian' };
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
});
const fail = (status, error, extra = {}) => json({ error, ...extra }, status);

/* ---------- password & sessions ---------- */
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sameBytes = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };

/* Sessions are signed with a key derived from the password: changing it signs out every device. */
async function signingKey(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('voice-studio/session/' + env.SITE_PASSWORD));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function newSessionCookie(env) {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  const sig = await crypto.subtle.sign('HMAC', await signingKey(env), enc.encode(exp));
  return sessionCookie(`${exp}.${hex(sig)}`, SESSION_DAYS * 86400);
}
async function sessionValid(env, token) {
  const m = /^(\d{13})\.([a-f0-9]{64})$/.exec(token || '');
  if (!env.SITE_PASSWORD || !m || Number(m[1]) < Date.now()) return false;
  const sig = new Uint8Array(m[2].match(/../g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', await signingKey(env), sig, enc.encode(m[1]));
}
/* Compare HMACs of both strings, so the check never exits early on the secret itself. */
async function passwordMatches(env, given) {
  if (typeof given !== 'string' || !given || !env.SITE_PASSWORD) return false;
  const key = await signingKey(env);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + given)),
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + env.SITE_PASSWORD)),
  ]);
  return sameBytes(new Uint8Array(a), new Uint8Array(b));
}
function readCookie(req, name) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}
const sessionCookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

/* Failed logins are counted per isolate: enough to slow down guessing without a database. */
const fails = new Map();
function tooManyFails(ip) {
  const recent = (fails.get(ip) || []).filter(t => t > Date.now() - LOGIN_WINDOW);
  fails.set(ip, recent);
  return recent.length >= LOGIN_MAX_FAILS;
}
const noteFail = ip => fails.set(ip, [...(fails.get(ip) || []), Date.now()]);

async function readJSON(req) {
  const text = await req.text();
  if (text.length > 16 * 1024) return null;
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}

/* ---------- voice ---------- */
/* Kokoro: DeepInfra's documented speech route is /v1/audio/speech: an OpenAI-style body, audio bytes back.
   Two older routes are tried only if that one rejects the request itself; the first route that
   works is remembered. Key, balance and rate problems come back as they are, without retrying.
   service_tier "priority" skips DeepInfra's queue for 1.5x the price; DEEPINFRA_TIER="off" turns it off.
   Not every model has the tier, so a route that rejects it is asked once more without it. */
let preferredRoute = null, tierRejected = false;
const configuredTier = env => {
  const tier = String(env.DEEPINFRA_TIER ?? 'priority').trim().toLowerCase();
  return ['', 'off', 'none', 'standard', 'default'].includes(tier) ? '' : tier;
};
const baseUrl = env => env.DEEPINFRA_BASE || 'https://api.deepinfra.com';
const authHeaders = env => ({ authorization: `Bearer ${env.DEEPINFRA_API_KEY.trim()}`, 'content-type': 'application/json' });
const fatal = status => [401, 402, 403, 429].includes(status) || status >= 500;

async function speakKokoro(env, text, voice, speed, format) {
  const base = baseUrl(env), model = ENGINES.kokoro.model;
  const tier = tierRejected ? '' : configuredTier(env);
  const plain = { model, input: text, voice, speed, response_format: format };
  const openai = tier ? [{ ...plain, service_tier: tier }, plain] : [plain];
  let routes = [
    ...openai.map(body => ['speech', `${base}/v1/audio/speech`, body]),
    ...openai.map(body => ['openai', `${base}/v1/openai/audio/speech`, body]),
    ['native', `${base}/v1/inference/${model}`, { text, preset_voice: [voice], speed, output_format: format }],
  ];
  if (preferredRoute) routes = [...routes.filter(r => r[0] === preferredRoute), ...routes.filter(r => r[0] !== preferredRoute)];
  let last = null, failedWithTier = null;
  for (const [name, url, body] of routes) {
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: authHeaders(env), body: JSON.stringify(body) });
    } catch {
      return { res: { ok: false, status: 504 }, route: name }; // DeepInfra unreachable: the page retries
    }
    if (res.ok) {
      preferredRoute = name;
      if (failedWithTier === name && !body.service_tier) tierRejected = true;
      return { res: await plainAudio(res), route: name, tier: body.service_tier || 'standard' };
    }
    if (fatal(res.status)) return { res, route: name };
    if (body.service_tier) failedWithTier = name;
    last = { res, route: name, detail: (await res.text()).slice(0, 300) };
  }
  return last;
}

/* Other engines: the same OpenAI-style route (plain audio back, speed works), standard queue without the priority
   surcharge; the native route with JSON and base64 audio is the fallback if that route ever rejects the request. */
async function speakOther(env, engine, text, voice, lang, speed, format, opts) {
  const routes = engine.routes(text, voice, lang, speed, format, opts).map(([name, body]) =>
    [name, name === 'native' ? `${baseUrl(env)}/v1/inference/${engine.model}` : `${baseUrl(env)}/v1/audio/speech`, body]);
  let last = null;
  for (const [name, url, body] of routes) {
    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: authHeaders(env), body: JSON.stringify(body) });
    } catch {
      return { res: { ok: false, status: 504 }, route: name };
    }
    if (res.ok) return { res: await plainAudio(res), route: name, tier: 'standard' };
    if (fatal(res.status)) return { res, route: name };
    last = { res, route: name, detail: (await res.text()).slice(0, 300) };
  }
  return last;
}

/* Inworld and Chatterbox now and then repeat the end of a request or skip a phrase. Each take is heard back by Whisper and
   compared with its text by words of three letters or more: too few of them heard, or far more words than written,
   and the text is voiced again. Whisper writes numbers its own way ("6 heures 30" -> "6h30", "20 Prozent" -> "20%",
   "docteur" -> "Dr"), so words next to a number, such titles and numbers the page wrote as words for Chatterbox
   ("fünfzehnhundert", "mil quinientos") are not counted. The closest take wins. */
const TITLES = new Set(['doctor', 'doktor', 'docteur', 'doctora', 'mister', 'monsieur', 'madame', 'señor', 'señora', 'professor', 'nummer', 'número', 'numéro', 'number']);
const NUMBER_WORDS = new Set(('eins zwei drei vier fünf sechs sieben acht neun zehn zwölf komma uno una dos tres cuatro cinco seis siete '
  + 'ocho nueve diez once doce trece catorce quince cien coma une deux trois quatre cinq sept huit neuf onze douze treize quatorze '
  + 'quinze seize virgule').split(' '));
const NUMBER_WORD = { test: w => NUMBER_WORDS.has(w) || /hundert|tausend|zehn$|zig$|ßig$|million|ient[oa]s$|^mil$|^veinti|^dieci|^(?:treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)$|^cents?$|^mille$|^(?:vingts?|trente|quarante|cinquante|soixante)$/u.test(w) };
const tokensOf = s => s.toLowerCase().normalize('NFC').match(/\p{L}+|\p{N}+/gu) || [];
const wordsOf = s => tokensOf(s).filter(w => w.length >= 3 && !/\p{N}/u.test(w));
function match(text, heard) {
  const tokens = tokensOf(text), digit = t => /\p{N}/u.test(t || '');
  const want = tokens.filter((w, i) => w.length >= 3 && !digit(w) && !digit(tokens[i - 1]) && !digit(tokens[i + 1]) && !TITLES.has(w) && !NUMBER_WORD.test(w));
  if (want.length < 5) return 1;
  const got = wordsOf(heard), left = new Map();
  for (const w of got) left.set(w, (left.get(w) || 0) + 1);
  let found = 0;
  for (const w of want) if (left.get(w)) { found++; left.set(w, left.get(w) - 1); }
  const recall = found / want.length, extra = Math.max(0, got.length / Math.max(1, wordsOf(text).length) - 1);
  return recall - extra;
}
async function hear(env, bytes, type, lang) {
  try {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type }), type.includes('mpeg') ? 'take.mp3' : 'take.wav');
    form.append('model', ASR_MODEL);
    form.append('language', lang);
    form.append('response_format', 'json');
    const res = await fetch(`${baseUrl(env)}/v1/openai/audio/transcriptions`, {
      method: 'POST', headers: { authorization: `Bearer ${env.DEEPINFRA_API_KEY.trim()}` }, body: form,
    });
    return res.ok ? String((await res.json()).text || '') : null;
  } catch {
    return null; // no check is better than no audio
  }
}
async function speakVerified(env, engine, text, voice, lang, speed, format, opts) {
  let best = null;
  for (let take = 1; take <= TAKES; take++) {
    const out = await speakOther(env, engine, text, voice, lang, speed, format, opts);
    if (!out.res.ok) return best ? best.out : out;
    const type = out.res.headers.get('content-type') || 'audio/wav';
    const bytes = await out.res.arrayBuffer();
    const heard = await hear(env, bytes, type, lang);
    const score = heard === null ? 1 : match(text, heard);
    if (!best || score > best.score) best = { score, out: { ...out, res: new Response(bytes, { headers: { 'content-type': type } }), takes: take } };
    if (score >= 0.85) break;
  }
  return best.out;
}

/* The native route answers with JSON carrying base64 audio; it is unpacked here, so the page always gets audio bytes. */
function audioString(v) {
  if (typeof v === 'string') return v.length > 1000 ? v : null;
  if (v && typeof v === 'object') for (const x of Object.values(v)) { const found = audioString(x); if (found) return found; }
  return null;
}
async function plainAudio(res) {
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) return res;
  const found = audioString(await res.json());
  if (!found) return { ok: false, status: 502 };
  const head = /^data:([^;,]*)[^,]*,/.exec(found), b64 = head ? found.slice(head[0].length) : found;
  let bytes;
  if (Uint8Array.fromBase64) bytes = Uint8Array.fromBase64(b64); // native, far less CPU than the loop
  else {
    const bin = atob(b64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  }
  const sniffed = bytes[0] === 0x52 && bytes[1] === 0x49 ? 'audio/wav' : bytes[0] === 0x49 || bytes[0] === 0xff ? 'audio/mpeg' : '';
  return new Response(bytes, { headers: { 'content-type': (head && head[1]) || sniffed || 'audio/wav' } });
}

function speak(env, voiceId, text, speed, format = 'wav', verify = true) {
  const [engine, voice, lang, opts = {}] = VOICES[voiceId];
  if (engine === 'kokoro') return speakKokoro(env, text, voice, speed, format);
  if (verify && ENGINES[engine].verify && env.VERIFY !== 'off') return speakVerified(env, ENGINES[engine], text, voice, lang, speed, format, opts);
  return speakOther(env, ENGINES[engine], text, voice, lang, speed, format, opts);
}

function providerError(status, detail = '') {
  if (status === 401 || status === 403) return fail(502, 'DeepInfra не приймає API-ключ. Перевір секрет DEEPINFRA_API_KEY у Cloudflare.', { provider: status });
  if (status === 402) return fail(402, 'На рахунку DeepInfra закінчились кошти. Поповни баланс на deepinfra.com.', { provider: status });
  if (status === 429) return fail(429, 'Забагато запитів одночасно. Сторінка повторить сама.', { provider: status, retry: true });
  if (status === 504) return fail(503, 'Немає зв\'язку з сервісом озвучки. Сторінка повторить сама.', { provider: status, retry: true });
  if (status >= 500) return fail(503, 'Сервіс озвучки тимчасово недоступний. Сторінка повторить сама.', { provider: status, retry: true });
  return fail(502, `Сервіс озвучки відповів помилкою ${status}. ${detail}`.trim(), { provider: status });
}

async function tts(req, env) {
  const body = await readJSON(req);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return fail(400, 'Немає тексту');
  if (text.length > MAX_TEXT) return fail(413, `Задовгий фрагмент (більше ${MAX_TEXT} символів)`);
  const voice = Object.hasOwn(VOICES, body.voice) ? body.voice : DEFAULT_VOICE[body.lang] || DEFAULT_VOICE.en;
  const speed = Math.min(1.5, Math.max(0.6, Number(body.speed) || 1));
  // Always WAV from Kokoro and Inworld: their MP3 of a longer request can carry the length of only its first part, and
  // a browser then plays (and keeps) only that part. A page still open from before sends 'mp3'; it gets WAV too.
  const format = 'wav';
  const out = await speak(env, voice, text, speed, format);
  if (!out.res.ok) return providerError(out.res.status, out.detail);
  return new Response(out.res.body, {
    headers: { 'content-type': out.res.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store',
      'x-voice-route': out.route, 'x-voice-takes': String(out.takes || 1) },
  });
}

/* A model's public input schema tells which voices, formats and options DeepInfra accepts. */
function enumOf(schema, key) {
  const prop = schema?.properties?.[key];
  if (!prop) return null;
  const type = prop.items || prop;
  if (type.enum) return type.enum;
  if (type.const) return [type.const];
  for (const ref of [type.$ref, ...(type.anyOf || []).map(a => a.$ref)]) {
    const values = ref && schema.definitions?.[ref.split('/').pop()]?.enum;
    if (values) return values;
  }
  return null;
}
async function modelInfo(env, engine) {
  try {
    const res = await fetch(`${baseUrl(env)}/models/${ENGINES[engine].model}`);
    if (!res.ok) return null;
    const schema = (await res.json()).in_schema;
    const voices = enumOf(schema, 'voice') || enumOf(schema, 'preset_voice');
    const ours = Object.values(VOICES).filter(v => v[0] === engine && v[1]).map(v => v[1]);
    const input = schema?.properties?.input || schema?.properties?.text;
    return {
      voices: voices ? voices.length : null,
      missingVoices: voices ? ours.filter(v => !voices.includes(v)) : [],
      formats: enumOf(schema, 'response_format') || enumOf(schema, 'output_format'),
      maxInput: input?.maxLength ?? null,
    };
  } catch {
    return null;
  }
}

/* Setup check: key accepted, balance available, audio comes back from every engine; plus what each model supports. */
const CHECK = { kokoro: ['am_michael', 'This is a test.'], chatterbox: ['de_lukas', 'Das ist ein kurzer Test.'], inworld: ['de_josef', 'Das ist ein Test.'] };
async function check(env) {
  const engines = {};
  const tests = Object.entries(CHECK).filter(([engine, [voice]]) => VOICES[voice]?.[0] === engine); // engines with voices in use
  await Promise.all(tests.map(async ([engine, [voice, text]]) => {
    const started = Date.now();
    const [out, info] = await Promise.all([speak(env, voice, text, 1, 'wav', false), modelInfo(env, engine)]);
    if (!out.res.ok) { engines[engine] = { ok: false, status: out.res.status, detail: out.detail || '' }; return; }
    const type = out.res.headers.get('content-type') || 'audio/wav', audio = await out.res.arrayBuffer();
    engines[engine] = { ok: true, route: out.route, tier: out.tier, bytes: audio.byteLength, ms: Date.now() - started, model: info };
    if (ENGINES[engine].verify) engines[engine].heard = await hear(env, audio, type, VOICES[voice][2]); // the Whisper check works too
  }));
  const broken = Object.values(engines).find(e => !e.ok);
  if (broken && Object.values(engines).every(e => !e.ok)) return providerError(broken.status, broken.detail);
  return json({ ok: !broken, engines });
}

/* ---------- routing ---------- */
async function api(req, env, url) {
  const path = url.pathname, method = req.method;
  if (path === '/api/status' && method === 'GET') {
    return json({
      password: !!env.SITE_PASSWORD, apiKey: !!env.DEEPINFRA_API_KEY,
      weakPassword: !!env.SITE_PASSWORD && env.SITE_PASSWORD.length < 12,
      tier: configuredTier(env) || 'standard', // for the page's cost estimate
      signedIn: await sessionValid(env, readCookie(req, COOKIE)),
    });
  }
  if (path === '/api/login' && method === 'POST') {
    if (!env.SITE_PASSWORD) return fail(409, 'Пароль ще не задано: додай секрет SITE_PASSWORD у Cloudflare.');
    const ip = req.headers.get('cf-connecting-ip') || 'local';
    if (tooManyFails(ip)) return fail(429, 'Забагато невдалих спроб. Спробуй через 15 хвилин.');
    const body = await readJSON(req);
    if (!body || !(await passwordMatches(env, body.password))) { noteFail(ip); return fail(401, 'Неправильний пароль'); }
    return json({ ok: true }, 200, { 'set-cookie': await newSessionCookie(env) });
  }
  if (path === '/api/logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  if (!(await sessionValid(env, readCookie(req, COOKIE)))) return fail(401, 'Потрібен вхід');
  if (!env.DEEPINFRA_API_KEY) return fail(409, 'Немає ключа DeepInfra: додай секрет DEEPINFRA_API_KEY у Cloudflare.');
  if (path === '/api/tts' && method === 'POST') return tts(req, env);
  if (path === '/api/check' && method === 'POST') return check(env);
  return fail(404, 'Not found');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      return await api(req, env, url);
    } catch (e) {
      return fail(500, 'Помилка сервера: ' + (e && e.message ? e.message : String(e)));
    }
  },
};
