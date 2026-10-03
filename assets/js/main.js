/* =========================================================
   KamiEna Portfolio
   - 多言語切り替え（日本語は index.html の本文が原文、その他は assets/i18n/*.js）
   - メニュー / スクロール演出 / 作品フィルター / 作品詳細モーダル / YouTube 読み込み
   ========================================================= */
(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ================= i18n ================= */
  // 和文フォント（M PLUS Rounded 1c）の「…」「—」は全角風に中央寄せで描かれるため、
  // 欧文の言語ではこの3文字だけ欧文フォントの字形を使う（text= で数KBのサブセットだけ読み込む）
  const LATIN_PUNCT = 'Nunito:wght@500;700;800;900&text=%E2%80%A6%E2%80%94%E2%80%93';
  const LANGS = [
    { code: 'ja', label: '日本語', short: 'JA', og: 'ja_JP' },
    { code: 'en', label: 'English', short: 'EN', og: 'en_US', font: LATIN_PUNCT },
    { code: 'zh-Hans', label: '简体中文', short: '简', og: 'zh_CN', font: 'Noto+Sans+SC:wght@500;700;900' },
    { code: 'zh-Hant', label: '繁體中文', short: '繁', og: 'zh_TW', font: 'Noto+Sans+TC:wght@500;700;900' },
    { code: 'ko', label: '한국어', short: '한', og: 'ko_KR', font: 'Black+Han+Sans&family=Noto+Sans+KR:wght@500;700;900' },
    { code: 'fr', label: 'Français', short: 'FR', og: 'fr_FR', font: LATIN_PUNCT },
    { code: 'de', label: 'Deutsch', short: 'DE', og: 'de_DE', font: LATIN_PUNCT },
    { code: 'es', label: 'Español', short: 'ES', og: 'es_ES', font: LATIN_PUNCT },
    { code: 'it', label: 'Italiano', short: 'IT', og: 'it_IT', font: LATIN_PUNCT },
  ];
  const STORE_KEY = 'kamiena:lang';
  const DATA = (window.KE_I18N = window.KE_I18N || { strings: {} });
  const STRINGS = DATA.strings;

  // JavaScript からだけ使う文言（日本語）
  const JA = {
    'ui.menuOpen': 'メニューを開く',
    'ui.menuClose': 'メニューを閉じる',
    'ui.play': '動画を再生',
  };
  STRINGS.ja = JA;

  const metaDesc = $('meta[name="description"]');
  const ogLocale = $('meta[property="og:locale"]');

  const attrPairs = (el) => el.getAttribute('data-i18n-attr').split(';')
    .map((pair) => { const i = pair.indexOf(':'); return [pair.slice(0, i).trim(), pair.slice(i + 1).trim()]; })
    .filter((p) => p[0] && p[1]);

  // HTML に書かれている日本語を「ja」の原文として取り込む
  const put = (key, value) => { if (!(key in JA)) JA[key] = value; };
  $$('[data-i18n]').forEach((el) => put(el.dataset.i18n, el.textContent));
  $$('[data-i18n-html]').forEach((el) => put(el.dataset.i18nHtml, el.innerHTML));
  $$('[data-i18n-attr]').forEach((el) => attrPairs(el).forEach(([attr, key]) => put(key, el.getAttribute(attr))));
  put('meta.title', document.title);
  if (metaDesc) put('meta.description', metaDesc.getAttribute('content'));

  const langInfo = (code) => LANGS.find((l) => l.code === code) || null;
  // 訳が無いキーは日本語の原文を使う
  const t = (lang, key) => {
    const dict = STRINGS[lang];
    if (dict && dict[key] != null) return dict[key];
    return JA[key] != null ? JA[key] : null;
  };

  const pending = {};
  const loadLang = (code) => {
    if (code === 'ja' || STRINGS[code]) return Promise.resolve();
    if (pending[code]) return pending[code];
    pending[code] = new Promise((resolve) => {
      let script = $(`script[data-i18n-lang="${code}"]`);
      const timer = setInterval(() => { if (STRINGS[code]) { clearInterval(timer); resolve(); } }, 40);
      const finish = () => { clearInterval(timer); resolve(); };
      setTimeout(finish, 5000);
      if (!script) {
        script = document.createElement('script');
        script.src = `assets/i18n/${code}.js`;
        script.setAttribute('data-i18n-lang', code);
        document.head.appendChild(script);
      }
      script.addEventListener('load', finish);
      script.addEventListener('error', finish);
    });
    return pending[code];
  };

  const loadedFonts = {};
  const loadFont = (info) => {
    if (!info.font || loadedFonts[info.font]) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${info.font}&display=swap`;
    document.head.appendChild(link);
    loadedFonts[info.font] = true;
  };

  let currentLang = 'ja';
  const ui = (key) => t(currentLang, key) || '';
  const langHooks = [];

  const applyLang = (code, opts = {}) => {
    const info = langInfo(code) || langInfo('ja');
    currentLang = info.code;
    loadFont(info);
    root.lang = info.code;

    $$('[data-i18n]').forEach((el) => {
      const v = t(info.code, el.dataset.i18n);
      if (v != null) el.textContent = v;
    });
    $$('[data-i18n-html]').forEach((el) => {
      const v = t(info.code, el.dataset.i18nHtml);
      if (v != null) el.innerHTML = v;
    });
    $$('[data-i18n-attr]').forEach((el) => attrPairs(el).forEach(([attr, key]) => {
      const v = t(info.code, key);
      if (v != null) el.setAttribute(attr, v);
    }));

    document.title = t(info.code, 'meta.title');
    if (metaDesc) metaDesc.setAttribute('content', t(info.code, 'meta.description'));
    if (ogLocale) ogLocale.setAttribute('content', info.og);

    const current = $('[data-lang-current]');
    const short = $('[data-lang-code]');
    if (current) current.textContent = info.label;
    if (short) short.textContent = info.short;
    $$('[data-lang-switcher] [data-lang]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === info.code)));
    $$('[data-footer-langs] [data-lang]').forEach((a) => {
      if (a.dataset.lang === info.code) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    langHooks.forEach((fn) => fn(info.code));

    if (opts.persist) {
      try { localStorage.setItem(STORE_KEY, info.code); } catch (e) { /* storage unavailable */ }
    }
    if (opts.updateUrl && window.history && history.replaceState) {
      const url = new URL(location.href);
      if (info.code === 'ja') url.searchParams.delete('lang');
      else url.searchParams.set('lang', info.code);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    root.classList.remove('i18n-pending');
  };

  const switchLang = (code) => loadLang(code).then(() => applyLang(code, { persist: true, updateUrl: true }));

  /* ---------- 言語メニュー ---------- */
  const switcher = $('[data-lang-switcher]');
  if (switcher) {
    const btn = $('.lang-btn', switcher);
    const menu = $('.lang-menu', switcher);
    const items = () => $$('[data-lang]', menu);
    const setOpen = (open, focusItem) => {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open && focusItem) {
        const checked = items().find((b) => b.getAttribute('aria-checked') === 'true') || items()[0];
        checked.focus();
      }
    };
    btn.addEventListener('click', () => setOpen(menu.hidden, true));
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      setOpen(false);
      btn.focus();
      switchLang(b.dataset.lang);
    });
    menu.addEventListener('keydown', (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    });
    document.addEventListener('click', (e) => { if (!switcher.contains(e.target)) setOpen(false); });
  }
  $$('[data-footer-langs] [data-lang]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      switchLang(a.dataset.lang);
    });
  });

  /* ---------- モバイルメニュー ---------- */
  const nav = $('.nav');
  const toggle = $('.nav-toggle');
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', ui(open ? 'ui.menuClose' : 'ui.menuOpen'));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    $$('.nav-links a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    langHooks.push(() => toggle.setAttribute('aria-label', ui(nav.classList.contains('is-open') ? 'ui.menuClose' : 'ui.menuOpen')));
  }

  /* ---------- メールアドレス（スパム対策で JS から組み立て） ---------- */
  // プロフィールのちびキャラ：タップで表情を切り替える（ホバーできないスマホ向け）
  document.querySelectorAll('[data-chibi]').forEach((el) => {
    el.addEventListener('click', () => el.classList.toggle('is-on'));
  });

  const MAIL = ['kamiena.game', 'gmail.com'].join('@');
  $$('[data-mail]').forEach((a) => { a.href = `mailto:${MAIL}`; });

  /* ---------- スクロールで出てくる演出 ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 数字カウントアップ ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString(currentLang);
  const runCounter = (el) => {
    const to = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => cio.observe(el));
  }

  /* ---------- 作品フィルター ---------- */
  const filters = $$('.filter');
  const cards = $$('.work-card');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      cards.forEach((card) => {
        const cats = (card.dataset.cat || '').split(' ');
        card.hidden = !(cat === 'all' || cats.includes(cat));
      });
    });
  });

  /* ---------- YouTube（クリックで読み込み） ---------- */
  const ytButtons = new WeakMap();
  const labelVideos = () => {
    $$('.yt').forEach((btn) => {
      const cap = btn.closest('.yt-item')?.querySelector('figcaption');
      btn.setAttribute('aria-label', `${ui('ui.play')}: ${cap ? cap.textContent : ''}`);
    });
  };
  langHooks.push(labelVideos);
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.yt');
    if (!btn) return;
    const params = new URLSearchParams({ autoplay: '1', rel: '0', hl: currentLang });
    if (btn.dataset.start) params.set('start', btn.dataset.start);
    const frame = document.createElement('iframe');
    frame.className = 'yt-frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?${params}`;
    frame.title = btn.getAttribute('aria-label') || 'YouTube';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen = true;
    ytButtons.set(frame, btn);
    btn.replaceWith(frame);
  });
  const stopVideos = (scope) => {
    $$('iframe.yt-frame', scope).forEach((frame) => {
      const btn = ytButtons.get(frame);
      if (btn) frame.replaceWith(btn);
    });
  };

  /* ---------- 作品詳細モーダル ---------- */
  const openWork = (id) => {
    const dialog = document.getElementById(`work-${id}`);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (!dialog.open) dialog.showModal();
    const scroller = $('.wm-scroll', dialog);
    if (scroller) scroller.scrollTop = 0;
    history.replaceState(null, '', `${location.pathname}${location.search}#work-${id}`);
  };

  $$('[data-open-work]').forEach((btn) => {
    btn.addEventListener('click', () => openWork(btn.dataset.openWork));
  });

  $$('.work-modal').forEach((dialog) => {
    $('.wm-close', dialog)?.addEventListener('click', () => dialog.close());
    // 背景（ダイアログの外側）クリックで閉じる
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      stopVideos(dialog);
      if (location.hash === `#${dialog.id}`) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });

    // ギャラリー（メイン画像は切り抜かずに表示、背景にぼかした同じ画像）
    const main = $('.wm-main', dialog);
    const bg = $('.wm-bg', dialog);
    const thumbs = $$('.wm-thumb', dialog);
    const syncAlt = () => {
      const active = thumbs.find((x) => x.getAttribute('aria-current') === 'true') || thumbs[0];
      if (main && active) main.alt = $('img', active)?.alt || '';
    };
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (!main) return;
        main.src = thumb.dataset.src;
        if (bg) bg.src = thumb.dataset.src;
        thumbs.forEach((x) => x.setAttribute('aria-current', String(x === thumb)));
        syncAlt();
      });
    });
    langHooks.push(syncAlt);
  });

  // URL の #work-xxx から直接開けるように
  const openFromHash = () => {
    const m = location.hash.match(/^#work-([\w-]+)$/);
    if (m) openWork(m[1]);
  };

  /* ---------- 初期表示 ---------- */
  const initial = langInfo(window.KE_LANG) ? window.KE_LANG : 'ja';
  loadLang(initial).then(() => {
    applyLang(initial);
    openFromHash();
  });
  window.addEventListener('hashchange', openFromHash);
})();
