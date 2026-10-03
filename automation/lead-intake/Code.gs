/**
 * Flowbase — приймання заявок із сайту (Google Apps Script).
 *
 * Що робить:
 *  1. Приймає заявку з форми сайту (doPost).
 *  2. Записує її в Google Таблицю-CRM зі статусом «Новий» і типом запиту (сайт / автоматизація / AI / інше).
 *  3. Миттєво надсилає сповіщення в Telegram власнику.
 *  4. Надсилає клієнту лист-підтвердження його мовою (якщо він залишив email).
 *  5. Щодня нагадує в Telegram про «застиглі» ліди, щопонеділка — тижневий звіт.
 *
 * Налаштування — див. README.md поруч. Секрети (токен бота) зберігаються у Script Properties, не в коді.
 */

var SETTINGS = {
  SHEET_NAME: 'Leads',
  STATUSES: ['Новий', 'В роботі', 'Закрито'],
  STALE_NEW_DAYS: 1,        // «Новий» довше за N днів — нагадати
  STALE_IN_WORK_DAYS: 3,    // «В роботі» без змін статусу довше за N днів — нагадати
  REPORT_WEEKDAY: ScriptApp.WeekDay.MONDAY,
  REPORT_HOUR: 9,
  REMINDER_HOUR: 10,
  MAX_CONFIRMATIONS_PER_HOUR: 20, // захист від спаму листами через форму
  MAX_LEADS_PER_10_MIN: 30        // захист від флуду таблиці й Telegram фейковими заявками
};

var COLUMNS = ['Дата', 'Ім\'я', 'Контакт', 'Email', 'Повідомлення', 'Мова', 'Тип запиту', 'Статус', 'Статус змінено', 'Нотатки', 'Сторінка'];
var COL = {}; COLUMNS.forEach(function (name, i) { COL[name] = i + 1; });

/* =========================================================
   Приймання заявки
   ========================================================= */

function doPost(e) {
  try {
    var data = parseBody_(e);

    // антиспам: приховане поле на сайті заповнюють лише боти
    if (data.company) return json_({ ok: true });

    var lead = {
      name: clean_(data.name, 120),
      contact: clean_(data.contact, 160),
      message: clean_(data.message, 3000),
      language: ['en', 'uk', 'pl'].indexOf(data.language) > -1 ? data.language : 'en',
      page: clean_(data.page, 300)
    };
    if (!lead.name || !lead.contact || !lead.message) return json_({ ok: false, error: 'missing_fields' });
    if (!underLeadLimit_()) return json_({ ok: false, error: 'rate_limited' });

    lead.email = isEmail_(lead.contact) ? lead.contact : (isEmail_(data.email) ? clean_(data.email, 160) : '');
    lead.type = detectType_(lead.message);
    lead.date = new Date();

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      appendLead_(lead);
    } finally {
      lock.releaseLock();
    }

    // Сповіщення і листи не повинні "ламати" заявку — вона вже збережена в таблиці.
    try { notifyTelegram_(newLeadText_(lead)); } catch (err) { console.error('Telegram: ' + err); }
    try { notifyOwner_(lead); } catch (err) { console.error('Owner email: ' + err); }
    try { sendConfirmation_(lead); } catch (err) { console.error('Email: ' + err); }

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error' });
  }
}

// Перевірка, що веб-застосунок працює: відкрий URL у браузері.
function doGet() {
  return json_({ ok: true, service: 'flowbase-lead-intake' });
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); } catch (err) { return e.parameter || {}; }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   CRM у таблиці
   ========================================================= */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sh) throw new Error('Немає аркуша "' + SETTINGS.SHEET_NAME + '". Запусти setup().');
  return sh;
}

function appendLead_(lead) {
  var row = [];
  row[COL['Дата'] - 1] = lead.date;
  row[COL['Ім\'я'] - 1] = safeCell_(lead.name);
  row[COL['Контакт'] - 1] = safeCell_(lead.contact);
  row[COL['Email'] - 1] = safeCell_(lead.email);
  row[COL['Повідомлення'] - 1] = safeCell_(lead.message);
  row[COL['Мова'] - 1] = lead.language;
  row[COL['Тип запиту'] - 1] = lead.type;
  row[COL['Статус'] - 1] = SETTINGS.STATUSES[0];
  row[COL['Статус змінено'] - 1] = lead.date;
  row[COL['Нотатки'] - 1] = '';
  row[COL['Сторінка'] - 1] = safeCell_(lead.page);
  sheet_().appendRow(row);
}

// Коли ти міняєш статус вручну — фіксуємо дату зміни (для нагадувань і звітів).
function onEdit(e) {
  var range = e && e.range;
  if (!range || range.getSheet().getName() !== SETTINGS.SHEET_NAME) return;
  if (range.getColumn() !== COL['Статус'] || range.getRow() < 2) return;
  range.getSheet().getRange(range.getRow(), COL['Статус змінено']).setValue(new Date());
}

function readLeads_() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, COLUMNS.length).getValues().map(function (r, i) {
    return {
      row: i + 2,
      date: r[COL['Дата'] - 1],
      name: r[COL['Ім\'я'] - 1],
      contact: r[COL['Контакт'] - 1],
      type: r[COL['Тип запиту'] - 1],
      status: r[COL['Статус'] - 1],
      statusChanged: r[COL['Статус змінено'] - 1] || r[COL['Дата'] - 1]
    };
  });
}

/* =========================================================
   Тип запиту (автотег)
   ========================================================= */

var TYPE_KEYWORDS = {
  'AI': ['ai', 'ші', 'штучн', 'chatgpt', 'gpt', 'бот', 'bot', 'chatbot', 'чатбот', 'czatbot', 'асистент', 'assistant', 'asystent', 'sztuczn'],
  'Автоматизація': ['автомат', 'automat', 'crm', 'follow', 'нагадуван', 'reminder', 'przypomn', 'інтеграц', 'integrac', 'integration', 'zapier', 'n8n', 'workflow'],
  'Сайт': ['сайт', 'лендинг', 'website', 'site', 'landing', 'strona', 'stron', 'web']
};

function detectType_(text) {
  var t = String(text || '').toLowerCase();
  var found = Object.keys(TYPE_KEYWORDS).filter(function (type) {
    return TYPE_KEYWORDS[type].some(function (kw) { return wordMatch_(t, kw); });
  });
  return found.length ? found.join(', ') : 'Інше';
}

// Збіг на початку слова ("автомат" → "автоматизація"); короткі ключі (ai, ші, crm, бот) — тільки цілим словом,
// щоб не спрацьовувати на "email", "aim", "шість" тощо.
var NOT_LETTER = '[^a-zа-яіїєґąćęłńóśźż0-9]';
function wordMatch_(text, kw) {
  var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var tail = kw.length <= 3 ? '(?=$|' + NOT_LETTER + ')' : '';
  return new RegExp('(^|' + NOT_LETTER + ')' + esc + tail, 'i').test(text);
}

/* =========================================================
   Telegram
   ========================================================= */

function notifyTelegram_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_BOT_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) { console.warn('Telegram не налаштовано (Script Properties)'); return; }
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(res.getContentText());
}

function newLeadText_(lead) {
  return [
    '🔔 Нова заявка з сайту',
    '',
    'Ім\'я: ' + lead.name,
    'Контакт: ' + lead.contact,
    'Тип: ' + lead.type + ' · мова: ' + ({ en: 'EN', uk: 'UA', pl: 'PL' })[lead.language],
    '',
    lead.message,
    '',
    'CRM: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ].join('\n');
}

/* =========================================================
   Лист тобі на пошту про кожну нову заявку
   ========================================================= */

function notifyOwner_(lead) {
  // OWNER_EMAIL у Script Properties, або — за замовчуванням — пошта власника скрипта
  var to = PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || Session.getEffectiveUser().getEmail();
  if (!to) return;
  var opts = { to: to, subject: 'Flowbase — нова заявка: ' + lead.name, body: newLeadText_(lead), name: 'Flowbase' };
  if (lead.email) opts.replyTo = lead.email; // відповідаєш клієнту прямо з пошти
  MailApp.sendEmail(opts);
}

/* =========================================================
   Лист-підтвердження клієнту
   ========================================================= */

var CONFIRM_TEXT = {
  uk: {
    subject: 'Flowbase: ми отримали твій запит',
    hello: 'Привіт, {name}!',
    body: 'Дякуємо за повідомлення! Ми отримали твій запит і відповімо {when}.',
    soon: 'найближчим часом',
    within: 'протягом {h} год',
    quote: 'Твоє повідомлення:',
    bye: 'Команда Flowbase'
  },
  en: {
    subject: 'Flowbase: we received your request',
    hello: 'Hi {name},',
    body: 'Thanks for reaching out. We received your request and will get back to you {when}.',
    soon: 'shortly',
    within: 'within {h} hours',
    quote: 'Your message:',
    bye: 'The Flowbase team'
  },
  pl: {
    subject: 'Flowbase: otrzymaliśmy Twoje zapytanie',
    hello: 'Cześć {name}!',
    body: 'Dziękujemy za wiadomość. Otrzymaliśmy Twoje zapytanie i odpowiemy {when}.',
    soon: 'wkrótce',
    within: 'w ciągu {h} godz.',
    quote: 'Twoja wiadomość:',
    bye: 'Zespół Flowbase'
  }
};

function sendConfirmation_(lead) {
  if (!lead.email) return;

  // не більше одного листа на адресу за 6 год і не більше N листів на годину загалом
  var cache = CacheService.getScriptCache();
  var perEmailKey = 'c:' + lead.email.toLowerCase();
  if (cache.get(perEmailKey)) return;
  var hourKey = 'h:' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  var sentThisHour = Number(cache.get(hourKey) || 0);
  if (sentThisHour >= SETTINGS.MAX_CONFIRMATIONS_PER_HOUR) return;

  var tx = CONFIRM_TEXT[lead.language] || CONFIRM_TEXT.en;
  var hours = PropertiesService.getScriptProperties().getProperty('REPLY_WITHIN_HOURS'); // [MISSING] доки не задано
  var when = hours ? tx.within.replace('{h}', hours) : tx.soon;

  var text = [
    tx.hello.replace('{name}', lead.name),
    '',
    tx.body.replace('{when}', when),
    '',
    tx.quote,
    lead.message,
    '',
    '— ' + tx.bye
  ].join('\n');

  MailApp.sendEmail({ to: lead.email, subject: tx.subject, body: text, name: 'Flowbase' });

  cache.put(perEmailKey, '1', 21600); // 6 год — максимум для CacheService
  cache.put(hourKey, String(sentThisHour + 1), 3600);
}

/* =========================================================
   Нагадування і звіти (запускаються тригерами з setup())
   ========================================================= */

function staleReminder() {
  var now = new Date();
  var stale = readLeads_().filter(function (l) {
    var days = (now - new Date(l.statusChanged)) / 864e5;
    if (l.status === 'Новий') return days >= SETTINGS.STALE_NEW_DAYS;
    if (l.status === 'В роботі') return days >= SETTINGS.STALE_IN_WORK_DAYS;
    return false;
  });
  if (!stale.length) return;
  var lines = stale.slice(0, 20).map(function (l) {
    var days = Math.floor((now - new Date(l.statusChanged)) / 864e5);
    return '• ' + l.name + ' (' + l.contact + ') — «' + l.status + '» ' + days + ' дн.';
  });
  notifyTelegram_(['⏰ Ліди без руху: ' + stale.length, ''].concat(lines, ['', SpreadsheetApp.getActiveSpreadsheet().getUrl()]).join('\n'));
}

function weeklyReport() {
  var now = new Date();
  var leads = readLeads_();
  var week = leads.filter(function (l) { return (now - new Date(l.date)) / 864e5 <= 7; });
  var byStatus = {};
  SETTINGS.STATUSES.forEach(function (s) { byStatus[s] = 0; });
  leads.forEach(function (l) { if (byStatus[l.status] != null) byStatus[l.status]++; });
  var byType = {};
  week.forEach(function (l) { String(l.type).split(', ').forEach(function (t) { byType[t] = (byType[t] || 0) + 1; }); });

  var lines = ['📊 Flowbase — тиждень', '', 'Нових заявок за 7 днів: ' + week.length];
  Object.keys(byType).forEach(function (t) { lines.push('  · ' + t + ': ' + byType[t]); });
  lines.push('', 'Зараз у CRM:');
  SETTINGS.STATUSES.forEach(function (s) { lines.push('  · ' + s + ': ' + byStatus[s]); });
  lines.push('', SpreadsheetApp.getActiveSpreadsheet().getUrl());
  notifyTelegram_(lines.join('\n'));
}

/* =========================================================
   Одноразове налаштування — запусти setup() з редактора
   ========================================================= */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SETTINGS.SHEET_NAME) || ss.insertSheet(SETTINGS.SHEET_NAME);

  sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('dd.mm.yyyy hh:mm');
  sh.getRange(1, COL['Статус змінено'], sh.getMaxRows(), 1).setNumberFormat('dd.mm.yyyy hh:mm');
  sh.setColumnWidth(COL['Повідомлення'], 420);
  sh.getRange(1, COL['Повідомлення'], sh.getMaxRows(), 1).setWrap(true);

  var rule = SpreadsheetApp.newDataValidation().requireValueInList(SETTINGS.STATUSES, true).setAllowInvalid(false).build();
  sh.getRange(2, COL['Статус'], sh.getMaxRows() - 1, 1).setDataValidation(rule);

  // кольори статусів
  var statusRange = sh.getRange(2, COL['Статус'], sh.getMaxRows() - 1, 1);
  var colors = { 'Новий': '#fde2c4', 'В роботі': '#d7e3fc', 'Закрито': '#d4edda' };
  sh.setConditionalFormatRules(Object.keys(colors).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(colors[s]).setRanges([statusRange]).build();
  }));

  // тригери: прибираємо старі, ставимо нові
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['staleReminder', 'weeklyReport'].indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('staleReminder').timeBased().everyDays(1).atHour(SETTINGS.REMINDER_HOUR).create();
  ScriptApp.newTrigger('weeklyReport').timeBased().onWeekDay(SETTINGS.REPORT_WEEKDAY).atHour(SETTINGS.REPORT_HOUR).create();

  console.log('Готово: аркуш "' + SETTINGS.SHEET_NAME + '" і тригери створено.');
}

// Перевірка Telegram: запусти вручну — має прийти повідомлення.
function testTelegram() {
  notifyTelegram_('✅ Flowbase: Telegram-сповіщення працюють.');
}

/* =========================================================
   Допоміжне
   ========================================================= */

// Не більше MAX_LEADS_PER_10_MIN заявок за 10 хв загалом: реальні клієнти не впираються,
// а флуд не засмічує CRM і Telegram.
function underLeadLimit_() {
  var cache = CacheService.getScriptCache();
  var key = 'l:' + Math.floor(Date.now() / 600000);
  var count = Number(cache.get(key) || 0);
  if (count >= SETTINGS.MAX_LEADS_PER_10_MIN) return false;
  cache.put(key, String(count + 1), 900);
  return true;
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function isEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
}

// Не даємо тексту з форми стати формулою в таблиці (=, +, -, @ на початку).
function safeCell_(v) {
  return /^[=+\-@]/.test(v) ? '\'' + v : v;
}
