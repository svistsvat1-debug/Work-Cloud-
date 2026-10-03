/** Flowbase — приймання заявок (коротка версія): заявка → таблиця + лист тобі + лист клієнту. */

var SHEET_NAME = 'Leads';
var STATUSES = ['Новий', 'В роботі', 'Закрито'];
var COLUMNS = ['Дата', 'Імʼя', 'Контакт', 'Email', 'Повідомлення', 'Мова', 'Тип', 'Статус'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.company) return out_({ ok: true });                 // антиспам (приховане поле)

    var name = clean_(d.name, 120), contact = clean_(d.contact, 160), message = clean_(d.message, 3000);
    var lang = ['en', 'uk', 'pl'].indexOf(d.language) > -1 ? d.language : 'en';
    if (!name || !contact || !message) return out_({ ok: false, error: 'missing_fields' });

    var email = isEmail_(contact) ? contact : (isEmail_(d.email) ? clean_(d.email, 160) : '');
    var type = detectType_(message);

    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    sh.appendRow([new Date(), safeCell_(name), safeCell_(contact), safeCell_(email),
      safeCell_(message), lang, type, STATUSES[0]]);

    var body = 'Нова заявка з сайту Flowbase\n\nІмʼя: ' + name + '\nКонтакт: ' + contact +
      '\nТип: ' + type + ' · мова: ' + lang.toUpperCase() + '\n\n' + message +
      '\n\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
    var to = PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || Session.getEffectiveUser().getEmail();
    var ownerOpts = { to: to, subject: 'Flowbase — нова заявка: ' + name, body: body, name: 'Flowbase' };
    if (email) ownerOpts.replyTo = email;
    try { MailApp.sendEmail(ownerOpts); } catch (err) {}

    if (email) {
      var tx = {
        uk: { s: 'Flowbase: ми отримали твій запит', b: 'Привіт, ' + name + '!\n\nДякуємо за повідомлення! Ми отримали твій запит і скоро відповімо.\n\n— Команда Flowbase' },
        en: { s: 'Flowbase: we received your request', b: 'Hi ' + name + ',\n\nThanks for reaching out. We received your request and will get back to you soon.\n\n— The Flowbase team' },
        pl: { s: 'Flowbase: otrzymaliśmy Twoje zapytanie', b: 'Cześć ' + name + '!\n\nDziękujemy za wiadomość. Otrzymaliśmy Twoje zapytanie i wkrótce odpowiemy.\n\n— Zespół Flowbase' }
      }[lang];
      try { MailApp.sendEmail({ to: email, subject: tx.s, body: tx.b, name: 'Flowbase' }); } catch (err) {}
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: 'server_error' });
  }
}

function doGet() { return out_({ ok: true, service: 'flowbase-lead-intake' }); }

function detectType_(text) {
  var t = String(text || '').toLowerCase(), found = [];
  if (/(^|[^a-zа-яіїєґ])(ai|ші|штучн|бот|bot|chatbot|чатбот|gpt)/i.test(t)) found.push('AI');
  if (/(автомат|automat|crm|follow|нагадуван|integrac|workflow)/i.test(t)) found.push('Автоматизація');
  if (/(сайт|лендинг|website|site|landing|strona|web)/i.test(t)) found.push('Сайт');
  return found.length ? found.join(', ') : 'Інше';
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function isEmail_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')); }
function safeCell_(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }
function out_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

/** Запусти один раз: створює аркуш, заголовки і випадаючий список статусів. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
  sh.getRange(2, 8, sh.getMaxRows() - 1, 1).setDataValidation(rule);
  SpreadsheetApp.getUi && console.log('Готово: аркуш "' + SHEET_NAME + '" створено.');
}
