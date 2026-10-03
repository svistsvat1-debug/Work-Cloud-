#!/usr/bin/env bash
# Запуск Strix-скану сайту Work-Cloud. Виконувати НА СВОЇЙ машині (не в хмарній сесії).
# Потрібно: Docker (запущений), Python >= 3.12, LLM API-ключ.
set -euo pipefail

TARGET="${1:-https://work-cloud.pages.dev/}"

# --- Налаштуй під себе ---
export STRIX_LLM="${STRIX_LLM:-openai/gpt-4o}"     # або anthropic/claude-..., google/..., openrouter/...
# export LLM_API_KEY="..."   # краще задати в оточенні заздалегідь, а не тут

if [ -z "${LLM_API_KEY:-}" ]; then
  echo "❌ Спершу: export LLM_API_KEY=твій_ключ" >&2
  exit 1
fi

# Встановити Strix, якщо його ще немає
if ! command -v strix >/dev/null 2>&1; then
  echo "📦 Встановлюю strix-agent..."
  pipx install strix-agent || pip install strix-agent
fi

echo "🛡️  Сканую: $TARGET"
strix -n --target "$TARGET" \
  --instruction "Перевір security-заголовки, CSP, клієнтський JS на DOM-XSS, відкриті ендпоінти та витоки ключів/токенів у бандлі. Сайт статичний (Cloudflare Pages)."
