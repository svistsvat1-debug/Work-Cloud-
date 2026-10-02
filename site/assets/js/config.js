/*
 * Flowbase — налаштування сайту.
 * Заповни значення [MISSING] перед запуском. Інших файлів для цього міняти не треба.
 */
window.FLOWBASE_CONFIG = {
  // Куди надсилати заявки з форми.
  // Рекомендовано: наш Google Apps Script (automation/lead-intake) — заявка йде в CRM-таблицю,
  // сповіщення в Telegram і лист-підтвердження клієнту. URL виду https://script.google.com/macros/s/.../exec
  // Також підходить Formspree (https://formspree.io/f/xxxxxxx) або Web3Forms (https://api.web3forms.com/submit).
  formEndpoint: '', // [MISSING]

  // Тільки для Web3Forms: access key. Для Formspree залиш порожнім.
  formAccessKey: '', // [MISSING якщо Web3Forms]

  // Прямі посилання на месенджери.
  telegramUrl: 'https://t.me/svat_ceo',
  whatsappUrl: 'https://wa.me/48535979089', // текст першого повідомлення підставляється мовою сайту (cta.waText в i18n.js)

  // Мова за замовчуванням.
  defaultLang: 'en'
};
