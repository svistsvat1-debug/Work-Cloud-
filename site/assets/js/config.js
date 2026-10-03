/*
 * Flowbase — налаштування сайту.
 * Заповни значення [MISSING] перед запуском. Інших файлів для цього міняти не треба.
 */
window.FLOWBASE_CONFIG = {
  // Куди надсилати заявки з форми.
  // За замовчуванням — наша Cloudflare-функція "/api/lead" (site/functions/api/lead.js):
  // заявка приходить одразу тобі на пошту. Треба лише додати ключ RESEND_API_KEY і LEAD_EMAIL
  // у налаштуваннях Cloudflare Pages (див. docs/deploy-cloudflare.md). Поки їх немає —
  // форма ввічливо пропонує написати в Telegram/WhatsApp.
  // Альтернативи: Google Apps Script (CRM, automation/lead-intake) або Formspree/Web3Forms.
  formEndpoint: '/api/lead',

  // Тільки для Web3Forms: access key. Для Formspree залиш порожнім.
  formAccessKey: '', // [MISSING якщо Web3Forms]

  // Прямі посилання на месенджери.
  telegramUrl: 'https://t.me/svat_ceo',
  whatsappUrl: 'https://wa.me/48535979089', // текст першого повідомлення підставляється мовою сайту (cta.waText в i18n.js)

  // Мова за замовчуванням.
  defaultLang: 'en'
};
