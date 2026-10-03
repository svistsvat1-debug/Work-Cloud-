/* Вмикаємо анімації до першого рендеру (щоб не було "блимання").
   Винесено з <head> окремим файлом, щоб CSP не потребувала 'unsafe-inline' для скриптів. */
(function (d) {
  var r = d.documentElement;
  r.classList.remove('no-js');
  if (!window.matchMedia || !matchMedia('(prefers-reduced-motion: reduce)').matches) r.classList.add('motion');
  setTimeout(function () { if (!window.__flowbaseReady) r.classList.remove('motion'); }, 3000);
})(document);
