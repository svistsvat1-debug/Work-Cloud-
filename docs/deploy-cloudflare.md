# Запуск сайту Flowbase на Cloudflare Pages

Спосіб: Cloudflare Pages, підключений до GitHub. Після підключення кожен push у гілку автоматично оновлює сайт — нічого вручну завантажувати не треба. Безкоштовно.

## Підключення (один раз, ~5 хв)

1. Зайди на **dash.cloudflare.com** (зареєструйся, якщо ще немає акаунта).
2. Меню **Workers & Pages → Create**. Обери саме **Pages** (якщо за замовчуванням відкривається Workers — внизу є посилання на Pages) → **Connect to Git** → **GitHub**.
3. Дозволь Cloudflare доступ до репозиторію **svistsvat1-debug/Work-Cloud-** і вибери його.
4. Налаштування:

| Поле | Значення |
|---|---|
| Project name | `flowbase` (стане адресою `flowbase.pages.dev`, якщо назва вільна) |
| Production branch | `claude/new-session-4x3akv` (поки сайт тільки в цій гілці; див. нижче про `main`) |
| Framework preset | **None** |
| Build command | *порожньо* |
| Build output directory | `site` |

5. **Save and Deploy**. За хвилину сайт буде доступний за адресою `https://<project-name>.pages.dev`.

Інтерфейс Cloudflare періодично змінюється — назви кнопок можуть трохи відрізнятися, але суть та сама: Pages → Git → репозиторій → output directory `site`.

## Що вже налаштовано в репозиторії

- `site/_headers` — заголовки безпеки (заборона вбудовування сайту в чужі сторінки, строга Content-Security-Policy: скрипти тільки з самого сайту, без `unsafe-inline`; зовнішні джерела — тільки Google Fonts, Google Apps Script, Formspree/Web3Forms) і кешування `assets/` на 1 годину. Перевірено: шрифти, анімації, форма й месенджери працюють з цими заголовками.
- `site/robots.txt` — дозволяє індексацію.

## Після запуску

- **Власний домен** — [MISSING]. Коли буде: проєкт у Pages → **Custom domains** → додати домен. Якщо домен куплений не в Cloudflare, система покаже, які DNS-записи додати в реєстратора.
- **Гілка `main`.** Зараз сайт є тільки в гілці `claude/new-session-4x3akv`. Охайніше злити її в `main` (через pull request) і потім змінити Production branch на `main` у налаштуваннях проєкту (Settings → Builds & deployments).
## Форма: заявки одразу тобі на пошту (на Cloudflare)

Форма вже налаштована слати на `/api/lead` — це Cloudflare-функція `site/functions/api/lead.js`.
Заявка приходить листом тобі на пошту, у листі `reply_to` = email клієнта, тож відповідаєш прямо з Gmail.
Лишилось дати функції ключ для надсилання пошти (~3 хв):

1. **Resend** (безкоштовний сервіс надсилання пошти). Зайди на **resend.com**, зареєструйся тим самим Gmail, куди хочеш отримувати заявки.
2. **API Keys → Create API Key** → скопіюй ключ (`re_...`).
3. У Cloudflare: проєкт Pages → **Settings → Variables and Secrets** → додай:

| Назва | Тип | Значення |
|---|---|---|
| `RESEND_API_KEY` | Secret | ключ `re_...` з Resend |
| `LEAD_EMAIL` | Text | пошта, куди слати заявки (твій Gmail) |
| `LEAD_FROM` | Text | *необов'язково.* Від кого лист. Без власного домену не став — буде `onboarding@resend.dev` |

4. **Деплой.** Після додавання змінних натисни **Retry deployment** (або зроби будь-який push), щоб функція їх підхопила.
5. **Перевірка.** Відкрий `https://<сайт>/api/lead` у браузері — має показати `{"ok":true,"configured":true}`. Потім надішли тестову заявку з форми.

Поки ключа немає, форма ввічливо пропонує написати в Telegram/WhatsApp (кнопки вже працюють).

**Важливо про домен і Resend:** без власного домену Resend дозволяє слати листи **лише на пошту твого Resend-акаунта** — для отримання заявок цього достатньо (`LEAD_EMAIL` = той самий Gmail). Коли з'явиться свій домен, підтвердиш його в Resend і зможеш гарніший `LEAD_FROM` (напр. `leads@твій-домен`), а листи рідше потраплятимуть у «Спам».

Альтернатива Resend — Google Apps Script з CRM (`automation/lead-intake/`): тоді в `formEndpoint` став URL `/exec` замість `/api/lead`.
