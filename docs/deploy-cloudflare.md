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
- **Форма.** Поки `formEndpoint` у `site/assets/js/config.js` порожній, форма показує «напишіть у месенджер». Після налаштування `automation/lead-intake` вставити URL `/exec` — і push оновить сайт автоматично.
- Додати адресу сайту в **Script properties** не потрібно — скрипт приймає заявки з будь-якого домену.
