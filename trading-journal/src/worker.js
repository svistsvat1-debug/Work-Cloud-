// Edge Journal API on Cloudflare Workers.
// One private journal behind a password: trades and settings in D1, screenshots in R2,
// 1-minute forex candles from Twelve Data (cached in D1 once the window is in the past).
// Static files in ./public are served by Workers Assets; only /api/* reaches this code.

const SESSION_DAYS = 180;
const COOKIE = 'ej_session';
const TRADE_ID = /^[A-Za-z0-9_\-.~:@+]{1,120}$/;
const IMAGE_ID = /^[a-f0-9]{32}$/;
const PAIR = /^[A-Z]{3}\/[A-Z]{3}$/;
const MAX_JSON = 256 * 1024;
const MAX_IMAGE = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/gif']);
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;

let schemaReady = null;
function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS candles (key TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS login_fails (ip TEXT NOT NULL, ts INTEGER NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS login_fails_ip_ts ON login_fails (ip, ts)'),
    ]).catch(e => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
});
const fail = (status, error) => json({ error }, status);

/* ---------- sessions ---------- */
// The signing key is derived from JOURNAL_PASSWORD, so changing the password signs out every device.
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function signingKey(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('edge-journal/session/' + env.JOURNAL_PASSWORD));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function newSession(env) {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  const sig = await crypto.subtle.sign('HMAC', await signingKey(env), enc.encode(exp));
  return `${exp}.${hex(sig)}`;
}
async function sessionValid(env, token) {
  const m = /^(\d{13})\.([a-f0-9]{64})$/.exec(token || '');
  if (!m || Number(m[1]) < Date.now()) return false;
  const sig = new Uint8Array(m[2].match(/../g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', await signingKey(env), sig, enc.encode(m[1]));
}
function readCookie(req, name) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}
const sessionCookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
async function passwordMatches(env, given) {
  // Compare HMACs of both strings: equal-length digests, no early exit on the secret itself.
  const key = await signingKey(env);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + String(given))),
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + env.JOURNAL_PASSWORD)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function readJSON(req) {
  const text = await req.text();
  if (text.length > MAX_JSON) return null;
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}

/* ---------- handlers ---------- */
async function login(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const since = Date.now() - LOGIN_WINDOW;
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_fails WHERE ip = ? AND ts > ?').bind(ip, since).first();
  if (row && row.n >= LOGIN_MAX_FAILS) return fail(429, 'Забагато невдалих спроб. Спробуй через 15 хвилин.');
  const body = await readJSON(req);
  if (!body || typeof body.password !== 'string' || !(await passwordMatches(env, body.password))) {
    await env.DB.prepare('INSERT INTO login_fails (ip, ts) VALUES (?, ?)').bind(ip, Date.now()).run();
    return fail(401, 'Неправильний пароль');
  }
  await env.DB.prepare('DELETE FROM login_fails WHERE ip = ? OR ts < ?').bind(ip, since).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await newSession(env), SESSION_DAYS * 86400) });
}

async function candles(env, url) {
  const pair = (url.searchParams.get('pair') || '').toUpperCase();
  const from = Number(url.searchParams.get('from')), to = Number(url.searchParams.get('to'));
  if (!PAIR.test(pair)) return fail(400, 'Потрібна валютна пара у форматі EUR/USD');
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 6 * 3600e3) return fail(400, 'Некоректний проміжок часу');
  if (!env.TWELVE_DATA_KEY) return fail(503, 'Котирування не підключено: додай секрет TWELVE_DATA_KEY у налаштуваннях Worker.');
  const start = Math.floor(from / 60e3) * 60e3, end = Math.ceil(to / 60e3) * 60e3;
  const key = `twelvedata:${pair}:1min:${start}:${end}`;
  const hit = await env.DB.prepare('SELECT data FROM candles WHERE key = ?').bind(key).first();
  if (hit) return json({ candles: JSON.parse(hit.data), source: 'Twelve Data', interval: '1min', cached: true });
  const day = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
  const api = new URL('https://api.twelvedata.com/time_series');
  api.search = new URLSearchParams({ symbol: pair, interval: '1min', start_date: day(start), end_date: day(end), timezone: 'UTC', order: 'ASC', outputsize: '5000', apikey: env.TWELVE_DATA_KEY }).toString();
  let res, data;
  try { res = await fetch(api, { headers: { accept: 'application/json' } }); data = await res.json(); } catch { return fail(502, 'Постачальник котирувань недоступний. Спробуй пізніше.'); }
  if (!res.ok || !data || data.status === 'error') {
    const msg = String((data && data.message) || `HTTP ${res.status}`).replace(/apikey=\S+/gi, 'apikey=…').slice(0, 240);
    return fail(502, 'Twelve Data: ' + msg);
  }
  const list = (Array.isArray(data.values) ? data.values : [])
    .map(v => ({ t: Date.parse(String(v.datetime).replace(' ', 'T') + 'Z'), o: Number(v.open), h: Number(v.high), l: Number(v.low), c: Number(v.close) }))
    .filter(c => Number.isFinite(c.t) && [c.o, c.h, c.l, c.c].every(Number.isFinite))
    .sort((a, b) => a.t - b.t);
  // Cache only windows that are fully closed: recent minutes can still change.
  if (list.length && end < Date.now() - 15 * 60e3) {
    await env.DB.prepare('INSERT OR REPLACE INTO candles (key, data, created_at) VALUES (?, ?, ?)').bind(key, JSON.stringify(list), Date.now()).run();
  }
  return json({ candles: list, source: 'Twelve Data', interval: '1min' });
}

async function api(req, env, url) {
  if (!env.JOURNAL_PASSWORD) return fail(503, 'Пароль не налаштовано: додай секрет JOURNAL_PASSWORD у налаштуваннях Worker.');
  if (!env.DB || !env.SHOTS) return fail(503, 'Немає підключення до D1 або R2. Перевір прив’язки DB і SHOTS у wrangler.toml.');
  await ensureSchema(env.DB);
  const method = req.method, path = url.pathname;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = req.headers.get('origin');
    if (origin && origin !== url.origin) return fail(403, 'Запит з чужого сайту');
  }
  if (path === '/api/login' && method === 'POST') return login(req, env);
  if (path === '/api/logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  if (!(await sessionValid(env, readCookie(req, COOKIE)))) return fail(401, 'Потрібен вхід');

  if (path === '/api/me' && method === 'GET') return json({ ok: true, quotes: Boolean(env.TWELVE_DATA_KEY) });
  if (path === '/api/data' && method === 'GET') {
    const [t, s] = await env.DB.batch([
      env.DB.prepare('SELECT data FROM trades ORDER BY updated_at'),
      env.DB.prepare('SELECT data FROM settings WHERE id = 1'),
    ]);
    return json({ trades: t.results.map(r => JSON.parse(r.data)), settings: s.results[0] ? JSON.parse(s.results[0].data) : null });
  }
  if (path === '/api/settings' && method === 'PUT') {
    const body = await readJSON(req);
    if (!body) return fail(400, 'Некоректні налаштування');
    await env.DB.prepare('INSERT INTO settings (id, data, updated_at) VALUES (1, ?1, ?2) ON CONFLICT(id) DO UPDATE SET data = ?1, updated_at = ?2').bind(JSON.stringify(body), Date.now()).run();
    return json({ ok: true });
  }
  let m = /^\/api\/trades\/([^/]+)$/.exec(path);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (!TRADE_ID.test(id)) return fail(400, 'Некоректний id угоди');
    if (method === 'PUT') {
      const body = await readJSON(req);
      if (!body || body.id !== id) return fail(400, 'Некоректна угода');
      await env.DB.prepare('INSERT INTO trades (id, data, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET data = ?2, updated_at = ?3').bind(id, JSON.stringify(body), Date.now()).run();
      return json({ ok: true });
    }
    if (method === 'DELETE') { await env.DB.prepare('DELETE FROM trades WHERE id = ?').bind(id).run(); return json({ ok: true }); }
  }
  if (path === '/api/images' && method === 'POST') {
    const type = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_TYPES.has(type)) return fail(415, 'Підтримуються лише PNG, JPEG, WebP і GIF');
    if (Number(req.headers.get('content-length') || 0) > MAX_IMAGE) return fail(413, 'Скрін завеликий (до 15 МБ)');
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_IMAGE) return fail(413, 'Скрін порожній або завеликий');
    const id = hex(crypto.getRandomValues(new Uint8Array(16)));
    await env.SHOTS.put('shots/' + id, buf, { httpMetadata: { contentType: type } });
    return json({ id });
  }
  m = /^\/api\/images\/([^/]+)$/.exec(path);
  if (m) {
    if (!IMAGE_ID.test(m[1])) return fail(400, 'Некоректний id скріна');
    if (method === 'GET') {
      const obj = await env.SHOTS.get('shots/' + m[1]);
      if (!obj) return fail(404, 'Скрін не знайдено');
      return new Response(obj.body, { headers: { 'content-type': (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
    }
    if (method === 'DELETE') { await env.SHOTS.delete('shots/' + m[1]); return json({ ok: true }); }
  }
  if (path === '/api/candles' && method === 'GET') return candles(env, url);
  return fail(404, 'Немає такого запиту');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try { return await api(req, env, url); }
    catch (e) { console.error('api error', e && e.stack || e); return fail(500, 'Помилка сервера'); }
  },
};
