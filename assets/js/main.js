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
    'hist.more': 'もっと見る（あと{n}件）',
    'hist.less': 'たたむ',
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
  const filters = $$('.filter[data-filter]');
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

  /* ---------- 年表（HISTORY）：絞り込みと「もっと見る」 ---------- */
  const tl = $('#tl');
  if (tl) {
    const tlFilters = $$('[data-tl-filter]');
    const tlItems = $$('.tl-item', tl);
    const tlYears = $$('.tl-year', tl);
    const moreBox = $('.tl-more');
    const moreBtn = $('.tl-more-btn');
    const moreLabel = $('.tl-more-label');
    const MIN_SHOWN = 8;  // たたんだときに見せる件数の目安（年の途中では切らない）
    const MIN_LEFT = 5;   // 残りがこれより少ないときは、たたまずに全部見せる
    let tlCat = 'all';
    let tlOpen = false;
    let leftCount = 0;
    const matches = (li) => tlCat === 'all' || li.dataset.cat === tlCat;

    tlFilters.forEach((btn) => {
      const n = btn.dataset.tlFilter === 'all' ? tlItems.length : tlItems.filter((li) => li.dataset.cat === btn.dataset.tlFilter).length;
      const badge = $('.filter-n', btn);
      if (badge) badge.textContent = n;
    });

    const setMoreLabel = () => {
      moreLabel.textContent = tlOpen ? ui('hist.less') : ui('hist.more').replace('{n}', leftCount);
    };

    const renderTl = (animate) => {
      // たたむ位置：新しい年から順に見せて、MIN_SHOWN 件に届いた年までを表示
      let shown = 0; let cutAfter = tlYears.length - 1; leftCount = 0;
      tlYears.forEach((year, i) => {
        const n = $$('.tl-item', year).filter(matches).length;
        if (i > cutAfter) { leftCount += n; return; }
        shown += n;
        if (shown >= MIN_SHOWN) cutAfter = i;
      });
      const folded = !tlOpen && leftCount >= MIN_LEFT;
      tlYears.forEach((year, i) => {
        let any = false;
        $$('.tl-item', year).forEach((li) => {
          const show = matches(li) && (!folded || i <= cutAfter);
          if (show && li.hidden && animate) {
            li.classList.add('tl-pop');
            li.addEventListener('animationend', () => li.classList.remove('tl-pop'), { once: true });
          }
          li.hidden = !show;
          if (show) any = true;
        });
        year.hidden = !any;
      });
      moreBox.hidden = leftCount < MIN_LEFT;
      moreBtn.setAttribute('aria-expanded', String(!folded));
      setMoreLabel();
    };

    tlFilters.forEach((btn) => {
      btn.addEventListener('click', () => {
        tlCat = btn.dataset.tlFilter;
        tlFilters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        renderTl(true);
      });
    });
    moreBtn.addEventListener('click', () => {
      const before = moreBtn.getBoundingClientRect().top;
      tlOpen = !tlOpen;
      renderTl(true);
      // たたんだときは、ボタンが同じ位置に残るようにスクロールを合わせる（ページの下のほうに取り残されないように）
      if (!tlOpen) window.scrollBy({ top: moreBtn.getBoundingClientRect().top - before, behavior: 'instant' });
    });
    langHooks.push(setMoreLabel);
    renderTl(false);

    // スマホ（カーソルなし）は、画面の真ん中に来たできごとがギュッと前に出る
    if (window.matchMedia('(hover: none)').matches && !reduceMotion && 'IntersectionObserver' in window) {
      const hot = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-hot', entry.isIntersecting));
      }, { rootMargin: '-47% 0px -47% 0px' });
      tlItems.forEach((li) => hot.observe(li));
    }
  }

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
  const WORK_ALIASES = { cogeimu: 'yuki' };   // 2作品に分ける前の #work-cogeimu も開けるように
  const openWork = (id) => {
    const dialog = document.getElementById(`work-${WORK_ALIASES[id] || id}`);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    // 詳細の中から別の作品へ移るときは、開いている詳細を閉じてから
    $$('.work-modal[open]').forEach((d) => { if (d !== dialog) d.close(); });
    if (!dialog.open) dialog.showModal();
    const scroller = $('.wm-scroll', dialog);
    if (scroller) scroller.scrollTop = 0;
    history.replaceState(null, '', `${location.pathname}${location.search}#${dialog.id}`);
  };

  $$('[data-open-work]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'A') e.preventDefault();   // 旅行記カードなど、リンクの形のものもページ移動せずに開く
      openWork(btn.dataset.openWork);
    });
  });

  // 旅行記：上のボタンで、その旅行の見出しまでスクロール
  $$('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.jump)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // 作品カードは、画像・タイトル・文章など、どこを押しても詳細が開く
  $$('.work-card').forEach((card) => {
    const btn = $('.work-open[data-open-work]', card);
    if (!btn) return;
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;               // カード内のボタン・リンクはそのまま
      if (String(window.getSelection?.() || '').length) return; // 文字を選択しているときは開かない
      openWork(btn.dataset.openWork);
    });
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

  /* ---------- フォトアート：写真を大きく見るビューア（← → キー・スワイプで前後へ） ---------- */
  const viewer = $('#photo-viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const photos = $$('.photo-item');
    const vImg = $('.lb-img', viewer);
    const vCount = $('.lb-count', viewer);
    let at = 0;
    const show = (i) => {
      at = (i + photos.length) % photos.length;
      vImg.src = photos[at].dataset.full;
      vImg.alt = $('img', photos[at])?.alt || '';
      vCount.textContent = `${at + 1} / ${photos.length}`;
      new Image().src = photos[(at + 1) % photos.length].dataset.full;   // 次の写真を先に読み込んでおく
    };
    photos.forEach((btn, i) => btn.addEventListener('click', () => { show(i); viewer.showModal(); }));
    $('.lb-prev', viewer).addEventListener('click', () => show(at - 1));
    $('.lb-next', viewer).addEventListener('click', () => show(at + 1));
    $('.lb-close', viewer).addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });   // 写真の外を押すと閉じる
    viewer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
    let startX = null;
    viewer.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    viewer.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
    });
    viewer.addEventListener('close', () => photos[at]?.focus());
  }

  // URL の #work-xxx から直接開けるように
  const openFromHash = () => {
    const m = location.hash.match(/^#work-([\w-]+)$/);
    if (m) openWork(m[1]);
  };

  /* ---------- 日本語の改行を文節の切れ目に ----------
     iPhone の Safari は「文節で改行する」CSS（word-break: auto-phrase）に対応していないので、
     BudouX（budoux-ja.js）で文節の切れ目を求めて <wbr> を入れ、CSS の keep-all でそこだけで改行させる。 */
  const JA_TEXT = /[\u3040-\u30ff\u3400-\u9fff]/;
  const KEEP_TOGETHER = ['しゅと犬くん', '手がけ', 'ゲームデザイン'];                // 名前など、途中で切りたくない言葉
  const NO_SPACE_BREAK = ['404 Not Found', 'art bit #6', 'NEWVIEW AWARDS', 'SHIBUYA GAMES WEEK'];   // 空白で切りたくない英語の名前
  const OPEN = '「『（【〈《', CLOSE = '」』）】〉》';
  const NO_START = '、。，．！？!?・ー〜」』）】〉》ぁぃぅぇぉっゃゅょァィゥェォッャュョ';   // 行の頭に来てはいけない文字
  const HIRA_OR_PUNCT = /[\u3041-\u309f\s、。，．！？!?・ー〜」』）】〉》]/;
  const isKata = (ch) => /[\u30a1-\u30fa]/.test(ch);
  const isKanji = (ch) => /[\u3400-\u9fff]/.test(ch);
  const phraseCuts = (text) => {
    const cuts = new Set(window.KE_BUDOUX.boundaries(text));
    for (let i = 1; i < text.length; i++) {
      // かぎかっこの前と、」のあと（「…」で／「…」を のような助詞は離さない）でも改行できるように
      if (OPEN.includes(text[i]) && !OPEN.includes(text[i - 1])) cuts.add(i);
      if (CLOSE.includes(text[i - 1]) && !HIRA_OR_PUNCT.test(text[i])) cuts.add(i);
    }
    // 長すぎる文節（10文字より長い）は、「・」「／」「×」のあと、カタカナと漢字の境目、「ゲーム」のあとでも切れるように
    const marks = [0, ...[...cuts].sort((a, b) => a - b), text.length];
    for (let k = 0; k < marks.length - 1; k++) {
      if (marks[k + 1] - marks[k] <= 10) continue;
      for (let i = marks[k] + 2; i < marks[k + 1] - 1; i++) {
        const prev = text[i - 1], ch = text[i];
        if ('・／×＆：'.includes(prev) || (isKata(prev) && isKanji(ch)) || (isKanji(prev) && isKata(ch)) ||
            (text.slice(i - 3, i) === 'ゲーム' && isKata(ch))) cuts.add(i);
      }
    }
    // BudouX は「として」を「と｜して」と分けてしまうので、そこは切らない
    for (let at = text.indexOf('として'); at >= 0; at = text.indexOf('として', at + 1)) cuts.delete(at + 1);
    KEEP_TOGETHER.forEach((word) => {
      for (let at = text.indexOf(word); at >= 0; at = text.indexOf(word, at + 1)) {
        for (let i = at + 1; i < at + word.length; i++) cuts.delete(i);
      }
    });
    return [...cuts].filter((i) => !NO_START.includes(text[i]) && text[i] !== ' ' && text[i - 1] !== ' ').sort((a, b) => a - b);
  };
  const breakPhrases = (scope) => {
    if (!window.KE_BUDOUX || currentLang !== 'ja' || !scope) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      // ボタンやラベルなど1行で見せたいもの（white-space: nowrap）には入れない（Chrome は nowrap でも <wbr> で改行してしまう）
      acceptNode: (n) => (n.nodeValue.length > 2 && JA_TEXT.test(n.nodeValue) && !n.parentElement.closest('script, style, svg, title, textarea')
        && !/nowrap/.test(getComputedStyle(n.parentElement).whiteSpace))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let text = node.nodeValue;
      NO_SPACE_BREAK.forEach((name) => { text = text.split(name).join(name.replace(/ /g, '\u00a0')); });
      const cuts = phraseCuts(text);
      if (!cuts.length) { if (text !== node.nodeValue) node.nodeValue = text; return; }
      const frag = document.createDocumentFragment();
      let start = 0;
      cuts.forEach((i) => { frag.append(text.slice(start, i), document.createElement('wbr')); start = i; });
      frag.append(text.slice(start));
      node.replaceWith(frag);
    });
  };
  let phrasedAll = false;
  langHooks.push((code) => {
    if (code !== 'ja') return;
    if (!phrasedAll) { breakPhrases(document.body); phrasedAll = true; return; }
    // 言語を切り替えて日本語に戻したときは、文章が入れ替わったところだけ
    $$('[data-i18n], [data-i18n-html]').forEach(breakPhrases);
  });

  /* ---------- 初期表示 ---------- */
  const initial = langInfo(window.KE_LANG) ? window.KE_LANG : 'ja';
  loadLang(initial).then(() => {
    applyLang(initial);
    openFromHash();
  });
  window.addEventListener('hashchange', openFromHash);

  /* ---------- マウスのあとを追いかけるキラキラ（マウス操作のときだけ） ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const COLORS = ['#ffd84d', '#ff8fc8', '#7fd3ff', '#b6f05a', '#ffb347', '#c9b6ff'];
    const layer = document.createElement('canvas');
    layer.className = 'sparkle-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    const ctx = layer.getContext('2d');
    let dpr = 1, raf = 0, lastX = null, lastY = null;
    const parts = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      layer.width = innerWidth * dpr; layer.height = innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);
    // ✦ の形（4つの角を内側にカーブさせた星）
    const sparkle = (r) => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.closePath();
    };
    const tick = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, layer.width, layer.height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr; p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const r = p.r * (0.4 + 0.6 * p.life);
        ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life * 1.4);
        ctx.fillStyle = p.c;
        if (p.dot) { ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill(); continue; }
        sparkle(r); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      // 詳細ウィンドウ（最前面に出る）を開いているときは、その中に重ねる
      const host = document.querySelector('dialog[open]') || document.body;
      if (layer.parentNode !== host) host.appendChild(layer);
      if (lastX !== null && Math.hypot(e.clientX - lastX, e.clientY - lastY) < 14) return;
      lastX = e.clientX; lastY = e.clientY;
      const n = 1 + (Math.random() < 0.5);
      for (let i = 0; i < n; i++) {
        parts.push({
          x: e.clientX + (Math.random() - 0.5) * 14, y: e.clientY + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 0.4 - 0.6,
          r: 6 + Math.random() * 8, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.15,
          life: 1, decay: 0.018 + Math.random() * 0.018,
          c: COLORS[(Math.random() * COLORS.length) | 0], dot: Math.random() < 0.3,
        });
      }
      if (parts.length > 140) parts.splice(0, parts.length - 140);
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }
})();
