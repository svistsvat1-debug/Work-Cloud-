# ElevenLabs — підключення локально на ПК (Windows)

Команда: напиши Claude **"озвуч eleven labs"** + текст. Інструкція для Claude — `.claude/skills/elevenlabs-ozvuch/SKILL.md`.

У хмарних сесіях (claude.ai/code) ключ уже підключений. На ПК потрібно один раз зробити кроки нижче.

## 1. Скопіюй API-ключ
Ключ, створений у хмарі, ElevenLabs більше не показує. Тому для ПК:
1. https://elevenlabs.io/app/sign-in → зайди в потрібний акаунт.
2. Зліва внизу **Developers → API Keys → Create API Key**.
3. Name: `Claude PC`, **Restrict Key** — вимкнути, Restrict by IP — вимкнути.
4. **Create Key** → скопіюй ключ.

## 2. Збережи ключ на ПК як змінну середовища
1. Натисни **Win**, введи `PowerShell`, відкрий.
2. Встав команду (замість `ТВІЙ_КЛЮЧ` встав скопійований ключ, лапки залиш):
   ```powershell
   setx ELEVENLABS_API_KEY "ТВІЙ_КЛЮЧ"
   ```
3. Має з'явитись `SUCCESS: Specified value was saved.`
4. **Закрий і заново відкрий** термінал / Claude Code / Claude desktop — змінна підхоплюється тільки після перезапуску.

Ключ у чат Claude не вставляй — тільки в цю команду.

## 3. Отримай ці файли на ПК
Skill лежить у репозиторії, тому Claude Code має бути відкритий у папці проєкту `Work-Cloud-` з актуальною версією:
```powershell
cd шлях\до\Work-Cloud-
git pull
```
(Якщо репозиторію на ПК ще немає: `git clone https://github.com/svistsvat1-debug/Work-Cloud-.git`.)

## 4. Перевір
Запусти Claude Code у папці `Work-Cloud-` і напиши: **"озвуч eleven labs: перевірка зв'язку"**.
Claude має показати акаунт / баланс і створити `docs/audio/....mp3`.

## Якщо не працює
- `401` / `invalid_api_key` → ключ скопійовано неправильно: повтори крок 2 з новим ключем.
- Claude не реагує на команду → ти не в папці `Work-Cloud-` або не зробив `git pull` (skill ще не на ПК).
- Змінити ключ: ще раз `setx ELEVENLABS_API_KEY "НОВИЙ_КЛЮЧ"` і перезапуск.
- Видалити ключ: `setx ELEVENLABS_API_KEY ""` + видалити ключ в ElevenLabs (Developers → API Keys).
