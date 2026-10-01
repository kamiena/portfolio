(() => {
  const root = document.documentElement;
  root.classList.add('js');

  /* ---------- モバイルメニュー ---------- */
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- スクロールで出てくる演出 ---------- */
  const revealEls = document.querySelectorAll('.reveal');
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
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const to = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = to.toLocaleString('ja-JP'); return; }
    const start = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString('ja-JP');
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
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- 作品フィルター ---------- */
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.work-card');
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
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.yt');
    if (!btn) return;
    const params = new URLSearchParams({ autoplay: '1', rel: '0' });
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
    scope.querySelectorAll('iframe.yt-frame').forEach((frame) => {
      const btn = ytButtons.get(frame);
      if (btn) frame.replaceWith(btn);
    });
  };

  /* ---------- 作品詳細モーダル ---------- */
  const openWork = (id) => {
    const dialog = document.getElementById(`work-${id}`);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (!dialog.open) dialog.showModal();
    const scroller = dialog.querySelector('.wm-scroll');
    if (scroller) scroller.scrollTop = 0;
    history.replaceState(null, '', `#work-${id}`);
  };

  document.querySelectorAll('[data-open-work]').forEach((btn) => {
    btn.addEventListener('click', () => openWork(btn.dataset.openWork));
  });

  document.querySelectorAll('.work-modal').forEach((dialog) => {
    dialog.querySelector('.wm-close')?.addEventListener('click', () => dialog.close());
    // 背景（ダイアログの外側）クリックで閉じる
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      stopVideos(dialog);
      if (location.hash === `#${dialog.id}`) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });

    // ギャラリー
    const main = dialog.querySelector('.wm-main');
    const thumbs = dialog.querySelectorAll('.wm-thumb');
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (!main) return;
        main.src = thumb.dataset.src;
        main.alt = thumb.querySelector('img')?.alt || '';
        thumbs.forEach((t) => t.setAttribute('aria-current', String(t === thumb)));
      });
    });
  });

  // URL の #work-xxx から直接開けるように
  const openFromHash = () => {
    const m = location.hash.match(/^#work-([\w-]+)$/);
    if (m) openWork(m[1]);
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
