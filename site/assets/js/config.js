/*
 * Flowbase — налаштування сайту.
 * Заповни значення [MISSING] перед запуском. Інших файлів для цього міняти не треба.
 */
window.FLOWBASE_CONFIG = {
  // Куди надсилати заявки з форми (листи падають на email власника).
  // Підходить Formspree (https://formspree.io/f/xxxxxxx) або Web3Forms (https://api.web3forms.com/submit).
  formEndpoint: '', // [MISSING]

  // Тільки для Web3Forms: access key. Для Formspree залиш порожнім.
  formAccessKey: '', // [MISSING якщо Web3Forms]

  // Прямі посилання на месенджери.
  telegramUrl: '', // [MISSING] напр. https://t.me/<username>
  whatsappUrl: '', // [MISSING] напр. https://wa.me/<номер у міжнародному форматі без +>

  // Мова за замовчуванням.
  defaultLang: 'en'
};
