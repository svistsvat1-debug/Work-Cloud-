// Edge Journal API on Cloudflare Workers.
// One private journal: trades and settings in D1, screenshots in R2, 1-minute forex candles from
// Dukascopy (no key needed; Twelve Data as a fallback when TWELVE_DATA_KEY is set), cached in D1.
// The password is created on the site at first visit (stored as PBKDF2 in D1), or set as the
// JOURNAL_PASSWORD secret, which then takes precedence.
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
const PBKDF2_ITERATIONS = 20000;
const MIN_PASSWORD = 8;
const DUKASCOPY_ROOT = 'https://jetta.dukascopy.com/v1';

let schemaReady = null;
function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS candles (key TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER NOT NULL)'),
      db.prepare('CREATE TABLE IF NOT EXISTS login_fails (ip TEXT NOT NULL, ts INTEGER NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS login_fails_ip_ts ON login_fails (ip, ts)'),
      db.prepare('CREATE TABLE IF NOT EXISTS auth (id INTEGER PRIMARY KEY CHECK (id = 1), salt TEXT NOT NULL, hash TEXT NOT NULL, updated_at INTEGER NOT NULL)'),
    ]).catch(e => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
});
const fail = (status, error, extra = {}) => json({ error, ...extra }, status);

/* ---------- password & sessions ---------- */
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sameBytes = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
async function pbkdf2(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS }, key, 256));
}
const storedAuth = env => env.DB.prepare('SELECT salt, hash FROM auth WHERE id = 1').first();
/* Whatever the password is, sessions are signed with a key derived from it: a new password signs out every device. */
async function passwordSource(env) {
  if (env.JOURNAL_PASSWORD) return { kind: 'secret', material: 'secret:' + env.JOURNAL_PASSWORD, secret: env.JOURNAL_PASSWORD };
  const a = await storedAuth(env);
  return a ? { kind: 'stored', material: 'stored:' + a.hash, salt: a.salt, hash: a.hash } : null;
}
async function signingKey(src) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('edge-journal/session/' + src.material));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function newSessionCookie(src) {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  const sig = await crypto.subtle.sign('HMAC', await signingKey(src), enc.encode(exp));
  return sessionCookie(`${exp}.${hex(sig)}`, SESSION_DAYS * 86400);
}
async function sessionValid(src, token) {
  const m = /^(\d{13})\.([a-f0-9]{64})$/.exec(token || '');
  if (!src || !m || Number(m[1]) < Date.now()) return false;
  const sig = new Uint8Array(m[2].match(/../g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', await signingKey(src), sig, enc.encode(m[1]));
}
async function passwordMatches(src, given) {
  if (typeof given !== 'string' || !given) return false;
  if (src.kind === 'stored') return sameBytes(enc.encode(await pbkdf2(given, src.salt)), enc.encode(src.hash));
  // Secret password: compare HMACs of both strings, so the check never exits early on the secret itself.
  const key = await signingKey(src);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + given)),
    crypto.subtle.sign('HMAC', key, enc.encode('pw:' + src.secret)),
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

async function readJSON(req) {
  const text = await req.text();
  if (text.length > MAX_JSON) return null;
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
}
const validNewPassword = pw => typeof pw === 'string' && pw.length >= MIN_PASSWORD && pw.length <= 200;

/* ---------- auth handlers ---------- */
async function tooManyFails(env, ip) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_fails WHERE ip = ? AND ts > ?').bind(ip, Date.now() - LOGIN_WINDOW).first();
  return row && row.n >= LOGIN_MAX_FAILS;
}
const noteFail = (env, ip) => env.DB.prepare('INSERT INTO login_fails (ip, ts) VALUES (?, ?)').bind(ip, Date.now()).run();

async function login(req, env, src) {
  if (!src) return fail(409, 'Пароль ще не створено', { setup: true });
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (await tooManyFails(env, ip)) return fail(429, 'Забагато невдалих спроб. Спробуй через 15 хвилин.');
  const body = await readJSON(req);
  if (!body || !(await passwordMatches(src, body.password))) { await noteFail(env, ip); return fail(401, 'Неправильний пароль'); }
  await env.DB.prepare('DELETE FROM login_fails WHERE ip = ? OR ts < ?').bind(ip, Date.now() - LOGIN_WINDOW).run();
  return json({ ok: true }, 200, { 'set-cookie': await newSessionCookie(src) });
}
/* First visit: whoever opens the fresh site first creates the password. Open it right after the first deploy. */
async function setup(req, env, src) {
  if (src) return fail(409, 'Пароль уже створено. Увійди.');
  const body = await readJSON(req);
  if (!body || !validNewPassword(body.password)) return fail(400, `Пароль має бути від ${MIN_PASSWORD} символів`);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(body.password, salt);
  const r = await env.DB.prepare('INSERT INTO auth (id, salt, hash, updated_at) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(salt, hash, Date.now()).run();
  if (!r.meta || !r.meta.changes) return fail(409, 'Пароль уже створено. Увійди.');
  return json({ ok: true }, 200, { 'set-cookie': await newSessionCookie({ kind: 'stored', material: 'stored:' + hash }) });
}
async function changePassword(req, env, src) {
  if (src.kind === 'secret') return fail(409, 'Пароль задано секретом JOURNAL_PASSWORD у Cloudflare. Зміни його там.');
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  if (await tooManyFails(env, ip)) return fail(429, 'Забагато невдалих спроб. Спробуй через 15 хвилин.');
  const body = await readJSON(req);
  if (!body || !(await passwordMatches(src, body.current))) { await noteFail(env, ip); return fail(401, 'Поточний пароль неправильний'); }
  if (!validNewPassword(body.next)) return fail(400, `Новий пароль має бути від ${MIN_PASSWORD} символів`);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(body.next, salt);
  await env.DB.prepare('UPDATE auth SET salt = ?, hash = ?, updated_at = ? WHERE id = 1').bind(salt, hash, Date.now()).run();
  return json({ ok: true }, 200, { 'set-cookie': await newSessionCookie({ kind: 'stored', material: 'stored:' + hash }) });
}

/* ---------- quotes ---------- */
/* Dukascopy candle response: base OHLC, a price multiplier, a step (shift, ms) and per-candle deltas.
   Candles with zero volume are weekend/holiday fillers and are skipped. */
function decodeDukascopy(d) {
  if (!d || !Array.isArray(d.times) || !Number.isFinite(d.timestamp)) throw new Error('Dukascopy: неочікувана відповідь');
  const n = d.times.length;
  if (!n) return [];
  const m = d.multiplier, step = d.shift;
  if (!(m > 0) || !(step > 0)) throw new Error('Dukascopy: неочікувана відповідь');
  const digits = Math.max(0, Math.min(8, Math.round(-Math.log10(m))));
  const px = u => Number((u * m).toFixed(digits));
  let ts = d.timestamp, o = Math.round(d.open / m), h = Math.round(d.high / m), l = Math.round(d.low / m), c = Math.round(d.close / m);
  const out = [];
  for (let i = 0; i < n; i++) {
    ts += d.times[i] * step;
    o += d.opens[i]; h += d.highs[i]; l += d.lows[i]; c += d.closes[i];
    if (Array.isArray(d.volumes) && d.volumes[i] === 0) continue;
    out.push({ t: ts, o: px(o), h: px(h), l: px(l), c: px(c) });
  }
  return out;
}
async function dukascopy(env, pair, start, end) {
  const root = env.DUKASCOPY_ROOT || DUKASCOPY_ROOT, code = pair.replace('/', '-'), now = Date.now(), out = [];
  for (let day = Math.floor(start / 864e5) * 864e5; day <= end && day < now; day += 864e5) {
    const d = new Date(day), active = now < day + 864e5;
    const url = active
      ? `${root}/candles/minute/${code}/BID?from=${day}`
      : `${root}/candles/minute/${code}/BID/${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    const res = await fetch(url, active ? {} : { cf: { cacheTtl: 86400, cacheEverything: true } });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`Dukascopy відповів ${res.status}`);
    const text = await res.text();
    if (!text.trim()) continue;
    for (const c of decodeDukascopy(JSON.parse(text))) if (c.t >= start - 60e3 && c.t <= end) out.push(c);
  }
  return out.sort((a, b) => a.t - b.t);
}
async function twelveData(env, pair, start, end) {
  const day = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
  const api = new URL('https://api.twelvedata.com/time_series');
  api.search = new URLSearchParams({ symbol: pair, interval: '1min', start_date: day(start), end_date: day(end), timezone: 'UTC', order: 'ASC', outputsize: '5000', apikey: env.TWELVE_DATA_KEY }).toString();
  const res = await fetch(api, { headers: { accept: 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.status === 'error') throw new Error('Twelve Data: ' + String((data && data.message) || `HTTP ${res.status}`).replace(/apikey=\S+/gi, 'apikey=…').slice(0, 200));
  return (Array.isArray(data.values) ? data.values : [])
    .map(v => ({ t: Date.parse(String(v.datetime).replace(' ', 'T') + 'Z'), o: Number(v.open), h: Number(v.high), l: Number(v.low), c: Number(v.close) }))
    .filter(c => Number.isFinite(c.t) && [c.o, c.h, c.l, c.c].every(Number.isFinite))
    .sort((a, b) => a.t - b.t);
}
async function candles(env, url) {
  const pair = (url.searchParams.get('pair') || '').toUpperCase();
  const from = Number(url.searchParams.get('from')), to = Number(url.searchParams.get('to'));
  if (!PAIR.test(pair)) return fail(400, 'Потрібна валютна пара у форматі EUR/USD');
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 6 * 3600e3) return fail(400, 'Некоректний проміжок часу');
  const start = Math.floor(from / 60e3) * 60e3, end = Math.ceil(to / 60e3) * 60e3;
  const key = `m1:${pair}:${start}:${end}`;
  const hit = await env.DB.prepare('SELECT data FROM candles WHERE key = ?').bind(key).first();
  if (hit) { const c = JSON.parse(hit.data); return json({ candles: c.list, source: c.source, interval: '1min', cached: true }); }
  const providers = [['Dukascopy', () => dukascopy(env, pair, start, end)]];
  if (env.TWELVE_DATA_KEY) providers.push(['Twelve Data', () => twelveData(env, pair, start, end)]);
  const errors = [];
  for (const [source, load] of providers) {
    let list;
    try { list = await load(); } catch (e) { errors.push(String(e && e.message || e)); continue; }
    if (!list.length) continue;
    // Cache only windows that are fully closed: recent minutes can still change.
    if (end < Date.now() - 15 * 60e3) await env.DB.prepare('INSERT OR REPLACE INTO candles (key, data, created_at) VALUES (?, ?, ?)').bind(key, JSON.stringify({ source, list }), Date.now()).run();
    return json({ candles: list, source, interval: '1min' });
  }
  if (errors.length) return fail(502, 'Котирування недоступні: ' + errors.join('; ').slice(0, 300));
  return json({ candles: [], source: providers[0][0], interval: '1min' });
}

/* ---------- router ---------- */
async function api(req, env, url) {
  if (!env.DB || !env.SHOTS) return fail(503, 'Немає підключення до D1 або R2. Перевір прив’язки DB і SHOTS у wrangler.toml.');
  await ensureSchema(env.DB);
  const method = req.method, path = url.pathname;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = req.headers.get('origin');
    if (origin && origin !== url.origin) return fail(403, 'Запит з чужого сайту');
  }
  const src = await passwordSource(env);
  if (path === '/api/setup' && method === 'POST') return setup(req, env, src);
  if (path === '/api/login' && method === 'POST') return login(req, env, src);
  if (path === '/api/logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  if (!(await sessionValid(src, readCookie(req, COOKIE)))) return fail(401, src ? 'Потрібен вхід' : 'Пароль ще не створено', { setup: !src });

  if (path === '/api/me' && method === 'GET') return json({ ok: true, quotes: true, password: src.kind });
  if (path === '/api/password' && method === 'POST') return changePassword(req, env, src);
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
    catch (e) { console.error('api error', (e && e.stack) || e); return fail(500, 'Помилка сервера'); }
  },
};
