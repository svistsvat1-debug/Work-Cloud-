// Voice Studio API on Cloudflare Workers.
// The page in ./public is served by Workers Assets; only /api/* reaches this code.
// Voice: Kokoro-82M on DeepInfra (paid per character), called with the DEEPINFRA_API_KEY secret,
// so the key never reaches the browser. Access: one password, the SITE_PASSWORD secret.
// The page sends one sentence per request; this code only checks the session and relays audio.

const COOKIE = 'vs_session';
const SESSION_DAYS = 180;
const MODEL = 'hexgrad/Kokoro-82M';
const MAX_TEXT = 1500; // characters per request
const VOICES = new Set(['am_michael', 'am_fenrir', 'am_puck', 'am_onyx', 'am_adam', 'am_echo', 'am_liam', 'am_eric',
  'bm_george', 'bm_fable', 'bm_lewis', 'bm_daniel']);
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
/* DeepInfra offers an OpenAI-style route and its own inference route. The first one that accepts
   the request is remembered; a key, balance or rate problem is returned as is, without retrying. */
let preferredRoute = null;
async function speak(env, text, voice, speed) {
  const base = env.DEEPINFRA_BASE || 'https://api.deepinfra.com';
  const headers = { authorization: `Bearer ${env.DEEPINFRA_API_KEY}`, 'content-type': 'application/json' };
  const routes = [
    ['openai', `${base}/v1/openai/audio/speech`, { model: MODEL, input: text, voice, speed, response_format: 'wav' }],
    ['native', `${base}/v1/inference/${MODEL}`, { text, preset_voice: [voice], speed, output_format: 'wav' }],
  ];
  if (preferredRoute === 'native') routes.reverse();
  let last = null;
  for (const [name, url, body] of routes) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) { preferredRoute = name; return { res, route: name }; }
    if ([401, 402, 403, 429].includes(res.status) || res.status >= 500) return { res, route: name };
    last = { res, route: name, detail: (await res.text()).slice(0, 300) };
  }
  return last;
}

function providerError(status, detail = '') {
  if (status === 401 || status === 403) return fail(502, 'DeepInfra не приймає API-ключ. Перевір секрет DEEPINFRA_API_KEY у Cloudflare.', { provider: status });
  if (status === 402) return fail(402, 'На рахунку DeepInfra закінчились кошти. Поповни баланс на deepinfra.com.', { provider: status });
  if (status === 429) return fail(429, 'Забагато запитів одночасно. Сторінка повторить сама.', { provider: status, retry: true });
  if (status >= 500) return fail(503, 'Сервіс озвучки тимчасово недоступний. Сторінка повторить сама.', { provider: status, retry: true });
  return fail(502, `Сервіс озвучки відповів помилкою ${status}. ${detail}`.trim(), { provider: status });
}

async function tts(req, env) {
  const body = await readJSON(req);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return fail(400, 'Немає тексту');
  if (text.length > MAX_TEXT) return fail(413, `Задовгий фрагмент (більше ${MAX_TEXT} символів)`);
  const voice = VOICES.has(body.voice) ? body.voice : 'am_michael';
  const speed = Math.min(1.5, Math.max(0.6, Number(body.speed) || 1));
  const out = await speak(env, text, voice, speed);
  if (!out.res.ok) return providerError(out.res.status, out.detail);
  // Audio (or DeepInfra's JSON with base64 audio) goes to the page as it came
  return new Response(out.res.body, {
    headers: { 'content-type': out.res.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'no-store', 'x-voice-route': out.route },
  });
}

/* Setup check: secrets present, key accepted, audio comes back. */
async function check(env) {
  const started = Date.now();
  const out = await speak(env, 'This is a test.', 'am_michael', 1);
  if (!out.res.ok) return providerError(out.res.status, out.detail);
  const bytes = (await out.res.arrayBuffer()).byteLength;
  return json({ ok: true, route: out.route, contentType: out.res.headers.get('content-type'), bytes, ms: Date.now() - started });
}

/* ---------- routing ---------- */
async function api(req, env, url) {
  const path = url.pathname, method = req.method;
  if (path === '/api/status' && method === 'GET') {
    return json({ password: !!env.SITE_PASSWORD, apiKey: !!env.DEEPINFRA_API_KEY, signedIn: await sessionValid(env, readCookie(req, COOKIE)) });
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
