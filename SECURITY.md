# 🛡️ Кібербезпека + Strix — довідка по проєкту Work-Cloud

> Ціль: `https://work-cloud.pages.dev/` (хостинг — Cloudflare Pages, статичний сайт)
> Репозиторій: `svistsvat1-debug/Work-Cloud-`
> Файл — твоя шпаргалка: що таке Strix, як прогнати скан свого сайту, і що перевірити вручну.

⚠️ **Легально:** тестувати можна **тільки свої** ресурси або ті, на які є письмовий дозвіл. Цей сайт — твій, тож усе гаразд.

---

## 1. Що таке Strix

[Strix](https://github.com/usestrix/strix) (`strix-agent` на PyPI) — це open-source **автономний AI-агент для пентесту**. Він працює як реальний зловмисник: сам ходить по застосунку, пробує експлойти, перевіряє вразливості й пише звіт.

**Як влаштований:**
- AI-агенти керуються LLM (OpenAI / Anthropic / Google / OpenRouter — на твій вибір).
- Усе виконується в **Docker-пісочниці** (ізольовано від твоєї системи).
- На виході — звіт зі знайденими проблемами й доказами (PoC).

**Вимоги:**
- Docker (запущений)
- Python ≥ 3.12
- API-ключ одного з LLM-провайдерів (платний — скан витрачає токени)

---

## 2. Встановлення

```bash
# Варіант А — офіційний інсталятор (підтягує й Docker-образ пісочниці)
curl -sSL https://strix.ai/install | bash

# Варіант Б — тільки CLI через pipx
pipx install strix-agent        # пакет: strix-agent
```

Перевірка: `strix --help`

---

## 3. Налаштування ключа

```bash
export STRIX_LLM="openai/gpt-4o"      # або anthropic/claude-..., google/..., openrouter/...
export LLM_API_KEY="ТВІЙ_КЛЮЧ"
```

Після першого запуску конфіг зберігається в `~/.strix/cli-config.json` — експортувати щоразу не треба.

---

## 4. Запуск скану свого сайту

```bash
# Базовий скан
strix --target https://work-cloud.pages.dev/

# Headless (без інтерактиву, для автоматизації / CI)
strix -n --target https://work-cloud.pages.dev/

# З конкретним фокусом
strix --target https://work-cloud.pages.dev/ \
      --instruction "Перевір security-заголовки, CSP, клієнтський JS на XSS, відкриті ендпоінти та витоки ключів у бандлі"

# Якщо є авторизація на сайті
strix --target https://work-cloud.pages.dev/ \
      --instruction "Авторизоване тестування, креденшали: user:pass"
```

Звіт Strix складе сам наприкінці запуску (дивись вивід CLI / теку результатів у `~/.strix/`).

---

## 5. Що Strix зазвичай перевіряє

| Категорія | Приклади |
|---|---|
| **Injection** | XSS, SQLi/NoSQLi, command injection, template injection |
| **Контроль доступу** | IDOR, обхід авторизації, підвищення привілеїв |
| **Автентифікація** | слабкі сесії, проблеми JWT, скидання пароля |
| **SSRF / XXE** | запити на внутрішні ресурси, зовнішні сутності XML |
| **Бізнес-логіка** | обхід кроків, маніпуляції цінами/кількістю |
| **Витоки** | ключі/токени в JS-бандлі, .env, вихідні коментарі |
| **Конфіг** | заголовки безпеки, CORS, cookie-флаги, відкриті файли |

---

## 6. Важливо саме для твого сайту (Cloudflare Pages)

`work-cloud.pages.dev` — **статичний хостинг**. Це означає:

✅ **Малий ризик** серверних дірок — немає власного бекенду/БД, тож SQLi, RCE, SSRF переважно **не застосовні**.

⚠️ **На що реально дивитись** (і Strix, і вручну):
1. **Security-заголовки** — чи є `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Strict-Transport-Security`.
2. **Клієнтський JS** — чи немає DOM-XSS (небезпечний `innerHTML`, `eval`, запис із `location`/`URL` без санітизації).
3. **Витік секретів** — чи не вшиті в JS-бандл API-ключі, токени, приватні URL (часта помилка на фронтенді!).
4. **Зовнішні виклики** — куди фронтенд шле запити; чи налаштований там CORS правильно.
5. **Сторонні скрипти** — довіра до CDN, відсутність SRI (`integrity=`).

---

## 7. Швидкий ручний чек (без Strix)

```bash
# Заголовки безпеки
curl -sI https://work-cloud.pages.dev/

# Пошук секретів у бандлі (після збору сайту локально або curl сторінок)
grep -rEi 'api[_-]?key|secret|token|password|bearer ' ./  --include=*.js

# Перевірка CSP онлайн
#   https://securityheaders.com/?q=work-cloud.pages.dev
#   https://observatory.mozilla.org/
```

Для Cloudflare Pages заголовки безпеки задаються файлом **`_headers`** у корені сайту — приклад нижче.

### Приклад `_headers` для Cloudflare Pages

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

> CSP підлаштуй під реальні джерела свого сайту (шрифти, аналітика тощо), інакше щось може зламатись.

---

## 8. Чому скан не вийшло запустити з цієї хмарної сесії

Мережева політика цього контейнера блокує вихід на зовнішні хости (проксі повернув `403` для `work-cloud.pages.dev`), і тут немає твого LLM-ключа. Тому Strix треба запускати **на своїй машині** (розділи 2–4) або відкрити доступ у налаштуваннях оточення:
*title bar сесії → меню оточення → Edit → Network access → Custom → додати `work-cloud.pages.dev`, `strix.ai`, `github.com`*.
Деталі: https://code.claude.com/docs/en/cloud-environments#network-access

---

## 9. Корисні посилання

- Strix: https://github.com/usestrix/strix
- PyPI: https://pypi.org/project/strix-agent/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Security Headers: https://securityheaders.com/
- Cloudflare Pages `_headers`: https://developers.cloudflare.com/pages/configuration/headers/
