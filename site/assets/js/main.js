/*
 * Flowbase — логіка сайту.
 * 1) мови (EN / UA / PL) з перемикачем-глобусом
 * 2) форма заявки + кнопки месенджерів
 * 3) ефекти: у кожного з 6 блоків — свій тип анімації
 *    Hero      — живий "потік" на canvas + 3D-поява літер + parallax
 *    Problem   — "хаос → порядок": картки злітаються й складаються при скролі
 *    Solution  — закріплена схема: лінія малюється, вузли загоряються по черзі
 *    Services  — 3D-перевертання карток + нахил і відблиск за курсором
 *    Process   — горизонтальний скрол етапів (десктоп) / таймлайн (мобільні)
 *    CTA       — кругове розкриття фону + слова з розмиття + "магнітні" кнопки
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var cfg = window.FLOWBASE_CONFIG || {};
  var DICT = window.FLOWBASE_I18N || {};
  var LANGS = ['en', 'uk', 'pl'];
  var LANG_LABEL = { en: 'EN', uk: 'UA', pl: 'PL' };
  var STORAGE_KEY = 'flowbase-lang';

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduceMotion && !!(gsap && ScrollTrigger);
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.toggle('motion', motion);
  if (motion) gsap.registerPlugin(ScrollTrigger);

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function decode(html) { var t = document.createElement('textarea'); t.innerHTML = html; return t.value; }

  /* =========================================================
     I18N
     ========================================================= */
  var lang = pickLang();
  var formStatusKey = null;
  var afterLangHooks = [];

  function pickLang() {
    try {
      var fromUrl = new URLSearchParams(window.location.search).get('lang');
      if (LANGS.indexOf(fromUrl) > -1) return fromUrl;
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (LANGS.indexOf(saved) > -1) return saved;
    } catch (e) { /* приватний режим / заблоковане сховище */ }
    return LANGS.indexOf(cfg.defaultLang) > -1 ? cfg.defaultLang : 'en';
  }

  function t(key) {
    var d = DICT[lang] || {};
    if (d[key] != null) return d[key];
    return (DICT.en && DICT.en[key]) || '';
  }

  function applyLang(next) {
    lang = next;
    root.lang = next;

    qsa('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v) el.innerHTML = v;
    });
    qsa('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var v = t(parts[1]);
        if (v) el.setAttribute(parts[0].trim(), decode(v));
      });
    });

    document.title = decode(t('meta.title'));
    var desc = qs('meta[name="description"]');
    if (desc) desc.setAttribute('content', decode(t('meta.description')));

    var code = qs('[data-lang-code]');
    if (code) code.textContent = LANG_LABEL[next];
    qsa('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.getAttribute('data-set-lang') === next));
    });

    if (formStatusKey) setFormStatus(formStatusKey.key, formStatusKey.type);
    afterLangHooks.forEach(function (fn) { fn(); });

    try { window.localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }

  function initLangMenu() {
    var btn = qs('[data-lang-btn]');
    var menu = qs('[data-lang-menu]');
    if (!btn || !menu) return;

    function open(state) {
      menu.hidden = !state;
      btn.setAttribute('aria-expanded', String(state));
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      open(menu.hidden);
      if (!menu.hidden) { var cur = qs('[aria-checked="true"]', menu); if (cur) cur.focus(); }
    });
    qsa('[data-set-lang]', menu).forEach(function (item) {
      item.addEventListener('click', function () {
        var next = item.getAttribute('data-set-lang');
        open(false);
        btn.focus();
        if (next !== lang) {
          applyLang(next);
          if (motion) {
            ScrollTrigger.refresh();
            // шрифти для кирилиці/латиниці-ext вантажаться за потреби — після них перераховуємо ще раз
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
          }
        }
      });
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); }
    });
  }

  /* =========================================================
     NAV + SCROLL PROGRESS
     ========================================================= */
  function initNav() {
    var nav = qs('[data-nav]');
    var bar = qs('.scroll-progress');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle('is-scrolled', y > 30);
      if (bar) bar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* =========================================================
     MESSENGERS + FORM
     ========================================================= */
  function isUrl(v) { return typeof v === 'string' && /^https?:\/\//i.test(v.trim()); }

  function initMessengers() {
    var urls = { telegram: cfg.telegramUrl, whatsapp: cfg.whatsappUrl };
    qsa('[data-messenger]').forEach(function (a) {
      var type = a.getAttribute('data-messenger');
      var url = urls[type];
      if (isUrl(url)) {
        a.href = url.trim();
        // WhatsApp: готовий перший рядок повідомлення мовою сайту
        if (type === 'whatsapp' && /wa\.me\//.test(url)) {
          var setText = function () { a.href = url.trim().split('?')[0] + '?text=' + encodeURIComponent(decode(t('cta.waText'))); };
          setText();
          afterLangHooks.push(setText);
        }
      } else {
        // [MISSING] посилання ще не задане в config.js
        a.classList.add('is-missing');
        a.setAttribute('aria-disabled', 'true');
        a.removeAttribute('target');
        a.title = '[MISSING] — set the link in assets/js/config.js';
        a.addEventListener('click', function (e) { e.preventDefault(); });
      }
    });
  }

  function setFormStatus(key, type) {
    var el = qs('[data-form-status]');
    if (!el) return;
    formStatusKey = key ? { key: key, type: type } : null;
    el.textContent = key ? decode(t(key)) : '';
    el.classList.toggle('is-success', type === 'success');
    el.classList.toggle('is-error', type === 'error');
  }

  function initForm() {
    var form = qs('[data-form]');
    if (!form) return;
    var submit = qs('button[type="submit"]', form);
    var label = qs('[data-submit-label]', form);

    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('is-invalid');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.elements.name.value.trim(),
        contact: form.elements.contact.value.trim(),
        message: form.elements.message.value.trim()
      };

      // антиспам: боти заповнюють приховане поле
      if (form.elements.company.value) { form.reset(); setFormStatus('form.success', 'success'); return; }

      var missing = ['name', 'contact', 'message'].filter(function (k) { return !data[k]; });
      qsa('.field', form).forEach(function (f) {
        var input = qs('input, textarea', f);
        f.classList.toggle('is-invalid', !!input && missing.indexOf(input.name) > -1);
      });
      if (missing.length) {
        setFormStatus('form.required', 'error');
        form.elements[missing[0]].focus();
        return;
      }

      if (!isUrl(cfg.formEndpoint)) {
        // [MISSING] сервіс прийому заявок ще не підключений у config.js
        setFormStatus('form.notConfigured', 'error');
        return;
      }

      var payload = {
        name: data.name,
        contact: data.contact,
        message: data.message,
        language: lang,
        page: window.location.href,
        subject: 'Flowbase — new request from ' + data.name,
        from_name: 'Flowbase website'
      };
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact)) payload.email = data.contact;
      if (cfg.formAccessKey) payload.access_key = cfg.formAccessKey;

      submit.disabled = true;
      label.textContent = decode(t('form.sending'));
      setFormStatus(null);

      // Google Apps Script не приймає CORS-preflight, тому туди шлемо JSON як text/plain
      var isAppsScript = /script\.google\.com/.test(cfg.formEndpoint);
      fetch(cfg.formEndpoint, {
        method: 'POST',
        headers: isAppsScript
          ? { 'Content-Type': 'text/plain;charset=utf-8' }
          : { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      }).then(function (result) {
        if (result && result.ok === false) throw new Error(result.error || 'rejected');
        form.reset();
        setFormStatus('form.success', 'success');
      }).catch(function () {
        setFormStatus('form.error', 'error');
      }).then(function () {
        submit.disabled = false;
        label.textContent = decode(t('form.submit'));
      });
    });
  }

  /* =========================================================
     TEXT SPLITTING (для анімацій заголовків)
     ========================================================= */
  // Розбиває текст елемента на слова (і за потреби — літери), зберігаючи <em>/<br>.
  function splitText(el, withChars) {
    var plain = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', plain);

    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = withChars ? 'word' : 'w';
            w.setAttribute('aria-hidden', 'true');
            if (withChars) {
              Array.from(part).forEach(function (ch) {
                var c = document.createElement('span');
                c.className = 'char';
                c.textContent = ch;
                w.appendChild(c);
              });
            } else {
              w.textContent = part;
            }
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
  }

  /* =========================================================
     1. HERO — canvas "flow field"
     ========================================================= */
  function initFlowCanvas() {
    var canvas = qs('[data-flow-canvas]');
    var hero = qs('[data-hero]');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, time = 0, particles = [], rafId = 0, visible = true;
    var pointer = { x: -9999, y: -9999 };

    function spawn(p) {
      p = p || {};
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.age = 0;
      p.life = 90 + Math.random() * 220;
      p.gold = Math.random() < 0.72;
      p.speed = 0.55 + Math.random() * 1.15;
      return p;
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, w, h);
      var count = Math.round(Math.min(560, Math.max(160, (w * h) / 3000)));
      particles = [];
      for (var i = 0; i < count; i++) { var p = spawn(); p.age = Math.random() * p.life; particles.push(p); }
    }

    function angleAt(x, y) {
      var s = 0.0017;
      return Math.sin(x * s + time * 0.6) * 1.7 +
             Math.cos(y * s * 1.35 - time * 0.45) * 1.4 +
             Math.sin((x + y) * s * 0.55 + time * 0.3);
    }

    function step() {
      time += 0.004;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(7, 8, 11, 0.09)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.1;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var a = angleAt(p.x, p.y);
        var vx = Math.cos(a) * p.speed;
        var vy = Math.sin(a) * p.speed;

        // курсор закручує потік навколо себе
        var dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 36000) {
          var d = Math.sqrt(d2) + 1, f = (1 - d2 / 36000) * 2.4;
          vx += (-dy / d) * f; vy += (dx / d) * f;
        }

        var nx = p.x + vx, ny = p.y + vy;
        var fade = Math.max(0, Math.min(1, p.age / 30, (p.life - p.age) / 30));
        ctx.strokeStyle = p.gold
          ? 'rgba(227, 194, 126, ' + (0.32 * fade).toFixed(3) + ')'
          : 'rgba(123, 108, 255, ' + (0.42 * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx; p.y = ny; p.age++;
        if (p.age > p.life || nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) spawn(p);
      }
    }

    function loop() {
      step();
      rafId = window.requestAnimationFrame(loop);
    }
    function start() { if (!rafId && visible && !document.hidden) loop(); }
    function stop() { if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; } }

    resize();

    if (!motion) {
      // статичний кадр без руху
      for (var k = 0; k < 160; k++) step();
      return;
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(hero);
    }
    start();
  }

  /* ---------- HERO: заголовок + parallax ---------- */
  function initHero() {
    var title = qs('.hero-title');
    var played = false;

    function split() {
      splitText(title, true);
      title.classList.add('is-split');
    }
    function playTitle(fast) {
      var chars = qsa('.char', title);
      gsap.fromTo(chars,
        { yPercent: 115, rotateX: -85, opacity: 0, filter: 'blur(8px)' },
        {
          yPercent: 0, rotateX: 0, opacity: 1, filter: 'blur(0px)',
          duration: fast ? 0.8 : 1.3, ease: 'expo.out',
          stagger: fast ? 0.012 : 0.03, delay: fast ? 0 : 0.2,
          clearProps: 'filter'
        });
    }

    split();
    afterLangHooks.push(function () { split(); if (motion && played) playTitle(true); });
    if (!motion) return;

    played = true;
    playTitle(false);
    gsap.fromTo('[data-hero-reveal]', { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.75 });

    // при скролі: контент "відпливає", світлові плями рухаються з різною швидкістю
    gsap.to('[data-hero-content]', {
      yPercent: -14, opacity: 0, scale: 0.97, ease: 'none',
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('[data-cue-wrap]', {
      opacity: 0, y: 30, ease: 'none',
      scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '25% top', scrub: true }
    });
    qsa('.orb').forEach(function (orb) {
      var depth = parseFloat(orb.getAttribute('data-depth')) || 0.3;
      gsap.to(orb, {
        y: depth * 420, ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
      });
    });

    if (finePointer) {
      var orbs = qs('.hero-orbs');
      var qx = gsap.quickTo(orbs, 'x', { duration: 1.6, ease: 'power3.out' });
      var qy = gsap.quickTo(orbs, 'y', { duration: 1.6, ease: 'power3.out' });
      qs('[data-hero]').addEventListener('pointermove', function (e) {
        qx((e.clientX / window.innerWidth - 0.5) * -60);
        qy((e.clientY / window.innerHeight - 0.5) * -40);
      });
    }
  }

  /* ---------- загальна поява заголовків секцій ---------- */
  function initSectionHeads() {
    qsa('[data-reveal-group]').forEach(function (group) {
      var title = qs('h2', group);
      var rest = Array.prototype.filter.call(group.children, function (el) { return el !== title; });
      var played = false;

      // заголовок: слова "встають" з 3D-повороту одне за одним
      function hideWords() {
        gsap.set(qsa('.w', title), { yPercent: 90, rotateX: -75, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 700 });
      }
      splitText(title, false);
      hideWords();
      afterLangHooks.push(function () { splitText(title, false); if (!played) hideWords(); });

      gsap.from(rest, {
        y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.15,
        scrollTrigger: { trigger: group, start: 'top 84%', once: true }
      });
      ScrollTrigger.create({
        trigger: group, start: 'top 84%', once: true,
        onEnter: function () {
          played = true;
          gsap.to(qsa('.w', title), { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.15, ease: 'expo.out', stagger: 0.055 });
        }
      });
    });
  }

  // Прилипаюча "сцена": міряє її висоту (--stage-h) і повертає, де вона прилипає
  function stickyStage(holder, stage) {
    stage.classList.add('sticky-stage');
    function measure() { holder.style.setProperty('--stage-h', stage.offsetHeight + 'px'); }
    measure();
    ScrollTrigger.addEventListener('refreshInit', measure);
    return {
      top: function () { return parseFloat(window.getComputedStyle(stage).top) || 0; },
      height: function () { return stage.offsetHeight; },
      destroy: function () {
        ScrollTrigger.removeEventListener('refreshInit', measure);
        stage.classList.remove('sticky-stage');
        holder.style.removeProperty('--stage-h');
      }
    };
  }

  /* =========================================================
     2. PROBLEM — хаос → порядок
     ========================================================= */
  function initProblem(mm) {
    mm.add({ wide: '(min-width: 960px)', narrow: '(max-width: 959px)' }, function (context) {
      var spread = context.conditions.wide ? 280 : 80;
      qsa('.pain').forEach(function (card, i) {
        var side = i % 2 ? 1 : -1;
        gsap.fromTo(card,
          {
            x: side * (spread + i * 24),
            y: 90 + (i % 3) * 36,
            rotation: side * (9 + ((i * 7) % 11)),
            scale: 0.8,
            opacity: 0,
            filter: 'blur(12px)'
          },
          {
            x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, filter: 'blur(0px)',
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 100%', end: 'top 62%', scrub: 0.9 }
          });
      });
    });

    gsap.fromTo('.problem-outro', { '--outro': 0 }, {
      '--outro': 1, ease: 'none',
      scrollTrigger: { trigger: '.pains', start: 'top 70%', end: 'bottom 70%', scrub: true }
    });
  }

  /* =========================================================
     3. SOLUTION — закріплена схема системи
     ========================================================= */
  function initSolution(mm) {
    var flow = qs('[data-flow]');
    var nodes = qsa('[data-flow-node]');
    var details = qsa('[data-flow-detail]');
    var counter = qs('[data-flow-count]');
    var last = nodes.length - 1;

    // поява схеми: лінія "простягається", вузли вискакують по черзі
    gsap.from('.flow-line', {
      scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: 'power3.inOut',
      scrollTrigger: { trigger: flow, start: 'top 88%', once: true }
    });
    gsap.from(nodes, {
      scale: 0.3, y: 30, opacity: 0, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.08, delay: 0.15,
      scrollTrigger: { trigger: flow, start: 'top 88%', once: true }
    });

    // на дуже низьких екранах (телефон горизонтально) — статична сітка без прилипання
    mm.add('(min-height: 460px)', function () {
      var current = -1;
      function setActive(i) {
        if (i === current) return;
        current = i;
        nodes.forEach(function (n, k) {
          n.classList.toggle('is-active', k === i);
          n.classList.toggle('is-done', k < i);
        });
        details.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
        if (counter) counter.textContent = String(i + 1).padStart(2, '0');
      }

      flow.classList.add('flow--live');
      flow.style.setProperty('--flow-steps', nodes.length);
      flow.style.setProperty('--flow', 0);
      setActive(0);
      var stage = stickyStage(flow, qs('.flow-stage', flow));

      gsap.to(flow, {
        '--flow': 1,
        ease: 'none',
        onUpdate: function () { setActive(Math.round(this.progress() * last)); },
        // схема прилипає через CSS sticky, тут лише рахуємо прогрес скролу
        scrollTrigger: {
          trigger: flow,
          start: function () { return 'top ' + stage.top(); },
          end: function () { return 'bottom ' + (stage.top() + stage.height()); },
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      });

      return function () {
        stage.destroy();
        flow.classList.remove('flow--live');
        flow.style.removeProperty('--flow');
        flow.style.removeProperty('--flow-steps');
        nodes.concat(details).forEach(function (el) { el.classList.remove('is-active', 'is-done'); });
      };
    });
  }

  /* =========================================================
     4. SERVICES — 3D-перевертання + нахил
     ========================================================= */
  function initServices() {
    if (motion) {
      var cards = qsa('.service');
      gsap.set(cards, { rotateX: -72, y: 120, opacity: 0, transformPerspective: 1100, transformOrigin: '50% 0%' });
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { rotateX: 0, y: 0, opacity: 1, duration: 1.4, ease: 'expo.out', stagger: 0.15 });
        }
      });
    }

    if (!finePointer) return;
    qsa('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointerenter', function () { if (motion) card.classList.add('is-tilting'); });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (motion) {
          card.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - py) * 12).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* =========================================================
     5. PROCESS — горизонтальний скрол / таймлайн
     ========================================================= */
  function initProcess(mm) {
    var section = qs('[data-process]');
    var pin = qs('[data-process-pin]');
    var track = qs('[data-process-track]');
    var bar = qs('[data-process-bar]');

    mm.add('(min-width: 900px) and (min-height: 500px)', function () {
      section.classList.add('process--h');
      function distance() { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); }
      // висота доріжки залежить від ширини стрічки — оновлюємо перед кожним перерахунком
      function setDistance() { pin.style.setProperty('--dist', distance() + 'px'); }
      setDistance();
      ScrollTrigger.addEventListener('refreshInit', setDistance);
      var stage = stickyStage(pin, qs('.process-stage', pin));

      var scroller = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: function () { return 'top ' + stage.top(); },
          end: function () { return 'bottom ' + (stage.top() + stage.height()); },
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: function (self) { bar.style.setProperty('--p', self.progress.toFixed(4)); }
        }
      });

      qsa('.step', track).forEach(function (step) {
        gsap.fromTo(qs('.step-num', step), { xPercent: 80, opacity: 0.15 }, {
          xPercent: -8, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: step, containerAnimation: scroller, start: 'left right', end: 'right 35%', scrub: true }
        });
        gsap.fromTo(qs('.step-card', step),
          { rotateY: -32, opacity: 0.25, transformPerspective: 1000, transformOrigin: '0% 50%' },
          {
            rotateY: 0, opacity: 1, ease: 'power1.out',
            scrollTrigger: { trigger: step, containerAnimation: scroller, start: 'left right', end: 'left 55%', scrub: true }
          });
      });

      return function () {
        ScrollTrigger.removeEventListener('refreshInit', setDistance);
        stage.destroy();
        section.classList.remove('process--h');
        pin.style.removeProperty('--dist');
      };
    });

    mm.add('(max-width: 899px), (max-height: 499px)', function () {
      section.classList.add('process--v');
      gsap.fromTo(track, { '--fill': 0 }, {
        '--fill': 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: 0.5 }
      });
      qsa('.step', track).forEach(function (step) {
        gsap.from(step, {
          x: -46, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 86%', once: true }
        });
      });
      return function () { section.classList.remove('process--v'); };
    });
  }

  /* =========================================================
     6. FINAL CTA — розкриття + слова + магнітні кнопки
     ========================================================= */
  function initContact() {
    var title = qs('[data-words]');
    var played = false;

    function hideWords() { gsap.set(qsa('.w', title), { yPercent: 70, opacity: 0, rotate: 3, filter: 'blur(14px)' }); }
    function playWords() {
      played = true;
      gsap.to(qsa('.w', title), {
        yPercent: 0, opacity: 1, rotate: 0, filter: 'blur(0px)',
        duration: 1.2, ease: 'expo.out', stagger: 0.05, clearProps: 'filter'
      });
    }

    splitText(title, false);
    afterLangHooks.push(function () {
      splitText(title, false);
      if (motion && !played) hideWords();
    });
    if (!motion) return;

    gsap.fromTo('[data-contact-bg]',
      { clipPath: 'circle(6% at 50% 100%)' },
      {
        clipPath: 'circle(150% at 50% 100%)', ease: 'none',
        scrollTrigger: { trigger: '[data-contact]', start: 'top 95%', end: 'top 10%', scrub: 0.6 }
      });

    hideWords();
    ScrollTrigger.create({ trigger: title, start: 'top 82%', once: true, onEnter: playWords });

    gsap.from('[data-contact-item]', {
      y: 60, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: '.contact-grid', start: 'top 75%', once: true }
    });
    gsap.from('[data-field]', {
      y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.35,
      scrollTrigger: { trigger: '.form-shell', start: 'top 80%', once: true }
    });
  }

  function initMagnetic() {
    if (!motion || !finePointer) return;
    qsa('[data-magnetic]').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* =========================================================
     START
     ========================================================= */
  var year = qs('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  applyLang(lang);
  initLangMenu();
  initNav();
  initMessengers();
  initForm();
  initFlowCanvas();
  initHero();
  initContact();
  initServices();

  if (motion) {
    var mm = gsap.matchMedia();
    initSectionHeads();
    initProblem(mm);
    initSolution(mm);
    initProcess(mm);
    initMagnetic();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  window.__flowbaseReady = true;
})();
