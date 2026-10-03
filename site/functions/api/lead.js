/**
 * Flowbase — приймання заявок на Cloudflare Pages (Pages Function).
 * Маршрут: POST /api/lead  (той самий домен, що й сайт — без CORS).
 *
 * Заявка з форми → лист одразу на твою пошту (через Resend). У листі reply_to =
 * email клієнта, тож ти відповідаєш прямо з Gmail, і відповідь іде клієнту.
 *
 * Налаштування в Cloudflare (Pages → Settings → Variables and Secrets):
 *   RESEND_API_KEY  — ключ з resend.com (безкоштовно); додати як Secret
 *   LEAD_EMAIL      — пошта, куди слати заявки (твій Gmail)
 *   LEAD_FROM       — необов'язково; від кого лист. За замовчуванням onboarding@resend.dev
 *                     (працює без власного домену). Зі своїм доменом — напр. leads@flowbase.xxx
 * Детальніше — docs/deploy-cloudflare.md.
 */

export async function onRequestPost({ request, env }) {
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // антиспам: приховане поле на сайті заповнюють лише боти — тихо "приймаємо"
  if (data.company) return json({ ok: true });

  const clean = (v, max) =>
    String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

  const name = clean(data.name, 120);
  const contact = clean(data.contact, 160);
  const message = clean(data.message, 3000);
  const language = ['en', 'uk', 'pl'].indexOf(data.language) > -1 ? data.language : 'en';
  const page = clean(data.page, 300);

  if (!name || !contact || !message) return json({ ok: false, error: 'missing_fields' }, 422);

  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL) {
    // ключ/пошта ще не задані в Cloudflare → сайт покаже "напишіть у месенджер"
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const lines = [
    'Нова заявка з сайту Flowbase',
    '',
    'Ім\'я: ' + name,
    'Контакт: ' + contact,
    'Мова: ' + language.toUpperCase(),
    page ? 'Сторінка: ' + page : '',
    '',
    message
  ].filter(function (x) { return x !== ''; });

  const payload = {
    from: env.LEAD_FROM || 'Flowbase <onboarding@resend.dev>',
    to: [env.LEAD_EMAIL],
    subject: 'Flowbase — нова заявка: ' + name,
    text: lines.join('\n')
  };
  if (isEmail) payload.reply_to = contact; // відповідаєш клієнту прямо з пошти

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Resend ' + res.status + ': ' + body);
      return json({ ok: false, error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
}

// GET /api/lead — швидка перевірка, що функція жива і чи задані змінні
export async function onRequestGet({ env }) {
  return new Response(
    JSON.stringify({ ok: true, configured: !!(env.RESEND_API_KEY && env.LEAD_EMAIL) }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
