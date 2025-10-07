// Main interactions for the site
(function () {
  const THEME_KEY = 'theme';
  const html = document.documentElement;

  // Safe text de-mojibake using explicit Unicode escapes
  function sanitizeTextNodes() {
    const pairs = [
      [/\u00C3\u00A9/g, '\u00E9'], [/\u00C3\u00A8/g, '\u00E8'], [/\u00C3\u00AA/g, '\u00EA'], [/\u00C3\u00AB/g, '\u00EB'],
      [/\u00C3\u00A0/g, '\u00E0'], [/\u00C3\u00A2/g, '\u00E2'], [/\u00C3\u00B9/g, '\u00F9'], [/\u00C3\u00BB/g, '\u00FB'],
      [/\u00C3\u00A7/g, '\u00E7'], [/\u00C3\u00AE/g, '\u00EE'], [/\u00C3\u00AF/g, '\u00EF'], [/\u00C3\u00B4/g, '\u00F4'],
      [/\u00C3\u0089/g, '\u00C9'], [/\u00C3\u0080/g, '\u00C0'], [/\u00C3\u0088/g, '\u00C8'], [/\u00C3\u008A/g, '\u00CA'], [/\u00C3\u008B/g, '\u00CB'],
      [/\u00E2\u0080\u0099/g, '\u2019'], [/\u00E2\u0080\u0098/g, '\u2018'], [/\u00E2\u0080\u0093/g, '\u2013'], [/\u00E2\u0080\u0094/g, '\u2014'],
      [/\u00E2\u0080\u009C/g, '\u201C'], [/\u00E2\u0080\u009D/g, '\u201D'], [/\u00E2\u0080\u00A6/g, '\u2026'],
      [/\u00C2\u00A0/g, '\u00A0'], [/\u00C2\s/g, ' ']
    ];
    // Extra site-specific fixes for corrupted sequences seen in files
    const literalPairs = [
      ['rǦver', 'rêver'],
      ['s�?TǸmerveiller', 's’émerveiller'],
      ['DǸcouvrez', 'Découvrez'],
      ['d�?TǸcriture', 'd’écriture'],
      ['mǸdiath��ques', 'médiathèques'],
      ['coll��ges', 'collèges'],
      ['Ǹcoles', 'écoles'],
      ['Derni��res nouveautǸs', 'Dernières nouveautés'],
      ['rǸcents �� mettre', 'récents à mettre'],
      ['PrǸcǸdent', 'Précédent'],
      ['ClǸophǸe', 'Cléophée'],
      ['ǸvǸnements', 'événements'],
      ['ActualitǸ', 'Actualité'],
      ['crǸneaux', 'créneaux'],
      ['Restez informǸ��e', 'Restez informé·e'],
      ['Adresse e�\?\'mail', 'Adresse e‑mail'],
      ['Votre e�\?\'mail', 'Votre e‑mail'],
      ['S�?Tinscrire', 'S’inscrire']
    ];
    // Occasional symbols
    literalPairs.push(['�? propos', 'À propos']);
    literalPairs.push(['��', '→']);
    const fix = (s) => {
      let out = pairs.reduce((acc, [re, to]) => acc.replace(re, to), s);
      literalPairs.forEach(([from, to]) => { out = out.replace(new RegExp(from, 'g'), to); });
      return out;
    };
    // Head elements
    if (document.title) document.title = fix(document.title);
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((m)=>{
      const v = m.getAttribute('content'); if (!v) return; const w = fix(v); if (w !== v) m.setAttribute('content', w);
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const list = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) list.push(n);
    list.forEach((n) => { const v = n.nodeValue || ''; const w = fix(v); if (w !== v) n.nodeValue = w; });
    document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach((el) => {
      ['title','aria-label','placeholder','alt'].forEach((a) => {
        const v = el.getAttribute(a); if (!v) return; const w = fix(v); if (w !== v) el.setAttribute(a, w);
      });
    });
  }
  // Fix common mojibake (UTF-8 mis-decoding) in visible texts
  function fixMojibake() {
    const pairs = [
      [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ãª/g, 'ê'], [/Ã«/g, 'ë'],
      [/Ã /g, 'à'], [/Ã¢/g, 'â'], [/Ã¹/g, 'ù'], [/Ã»/g, 'û'],
      [/Ã§/g, 'ç'], [/Ã®/g, 'î'], [/Ã¯/g, 'ï'], [/Ã´/g, 'ô'],
      [/Ã“/g, 'Ó'], [/Ã”/g, 'Ô'], [/Ãœ/g, 'Ü'], [/Ã–/g, 'Ö'],
      [/Ã‰/g, 'É'], [/Ã€/g, 'À'], [/Ãˆ/g, 'È'], [/ÃŠ/g, 'Ê'], [/Ã‹/g, 'Ë'],
      [/â€™/g, '’'], [/â€˜/g, '‘'], [/â€œ/g, '“'], [/â€/g, '”'], [/â€/g, '”'],
      [/â€“/g, '–'], [/â€”/g, '—'], [/â€¦/g, '…'], [/Â /g, ' ']
    ];
    const attrList = ['title','aria-label','placeholder','alt'];
    const apply = (s) => pairs.reduce((acc, [re, to]) => acc.replace(re, to), s);
    // Text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    nodes.forEach((n) => {
      const t = n.nodeValue;
      if (!t) return;
      const fixed = apply(t);
      if (fixed !== t) n.nodeValue = fixed;
    });
    // Selected attributes
    document.querySelectorAll('*').forEach((el) => {
      attrList.forEach((a) => {
        const v = el.getAttribute(a);
        if (!v) return;
        const fixed = apply(v);
        if (fixed !== v) el.setAttribute(a, fixed);
      });
    });
  }

  // Theme utils
  function setTheme(mode) {
    if (mode === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    updateThemeIcons(mode);
  }
  function updateThemeIcons(mode) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const sun = btn.querySelector('.sun-icon');
    const moon = btn.querySelector('.moon-icon');
    if (sun && moon) {
      if (mode === 'dark') { sun.classList.add('hidden'); moon.classList.remove('hidden'); }
      else { sun.classList.remove('hidden'); moon.classList.add('hidden'); }
    }
  }
  function initTheme() {
    let saved = localStorage.getItem(THEME_KEY);
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setTheme(saved);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = html.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        setTheme(next);
      });
    }
  }

  // Mobile menu
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('menuMobile');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  // Active nav link
  function highlightActiveLink() {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-link').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === current) {
        a.classList.add('text-brand-700', 'dark:text-brand-300', 'font-semibold');
      }
    });
  }

  // Slider controls (home page)
  function initSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    const prev = document.querySelector('.slider-prev');
    const next = document.querySelector('.slider-next');
    const amount = 320;
    if (prev) prev.addEventListener('click', () => slider.scrollBy({ left: -amount, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => slider.scrollBy({ left: amount, behavior: 'smooth' }));
  }

  // Back to top
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    const onScroll = () => {
      if (window.scrollY > 300) btn.classList.remove('hidden');
      else btn.classList.add('hidden');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    onScroll();
  }

  // Newsletter (dummy)
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const input = document.getElementById('newsletterEmail');
    const msg = document.getElementById('newsletterMsg');
    if (!form || !input || !msg) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        msg.textContent = "Veuillez saisir un e-mail valide.";
        msg.className = 'mt-2 text-sm text-rose-600';
        return;
      }
      msg.textContent = "Merci ! Vous recevrez bientot des nouvelles.";
      msg.className = 'mt-2 text-sm text-emerald-600';
      form.reset();
    });
  }

  // Books filters (livres.html)
  function initBookFilters() {
    const search = document.getElementById('bookSearch');
    const filterButtons = document.querySelectorAll('[data-filter-type]');
    const reset = document.getElementById('resetFilters');
    const cards = document.querySelectorAll('#bookGrid [data-book]');
    if (!cards.length) return;

    const state = { age: new Set(), type: new Set() };
    const update = () => {
      const q = (search && search.value ? search.value.trim().toLowerCase() : '');
      cards.forEach((el) => {
        const title = (el.querySelector('h3')?.textContent || '').toLowerCase();
        const desc = (el.querySelector('p')?.textContent || '').toLowerCase();
        const age = el.dataset.age;
        const type = el.dataset.type;
        let ok = true;
        if (q) ok = title.includes(q) || desc.includes(q);
        if (ok && state.age.size) ok = (age === 'all') || state.age.has(age);
        if (ok && state.type.size) ok = (type === 'all') || state.type.has(type);
        el.classList.toggle('hidden', !ok);
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.filterType;
        const val = btn.dataset.filterValue;
        const active = btn.classList.toggle('ring-brand-500');
        btn.classList.toggle('bg-brand-50', active);
        btn.classList.toggle('text-brand-700', active);
        const set = state[group];
        if (active) set.add(val); else set.delete(val);
        update();
      });
    });

    if (search) search.addEventListener('input', update);
    if (reset) reset.addEventListener('click', () => {
      state.age.clear(); state.type.clear();
      filterButtons.forEach((b) => b.classList.remove('ring-brand-500','bg-brand-50','text-brand-700'));
      if (search) search.value = '';
      update();
    });
  }

  // Populate books from local JSON if available
  async function populateBooks() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;
    // If the page already includes static cards, keep them as-is
    // and let enhanceStaticCovers() take care of missing images.
    if (grid.querySelector('[data-book]')) return;
    const isImageUrl = (u) => {
      if (!u) return false;
      try { const url = String(u); return /(\.jpg|\.jpeg|\.png|\.webp|\.gif)(\?|$)/i.test(url) || /m\.media-amazon\.com\/images\//i.test(url); } catch { return false; }
    };
    async function read(path) {
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }
    const dsAmazon = await read('assets/data/books.json');
    const dsGBooks = await read('assets/data/books_gbooks.json');

    // Helpers
    const getGId = (b) => {
      const link = b.link || '';
      const m = link.match(/[?&]id=([^&#]+)/i);
      return m ? decodeURIComponent(m[1]) : null;
    };
    const normalizeImg = (b) => {
      let url = b.image || '';
      if (!url && isImageUrl(b.link)) url = b.link; // Some datasets mistakenly store image in link
      if (!url) {
        const gid = getGId(b);
        if (gid) url = `https://books.google.com/books/content?id=${gid}&printsec=frontcover&img=1&zoom=3`;
      }
      if (/books\.google\./i.test(url)) {
        // Force https and higher zoom
        url = url.replace(/^http:\/\//i, 'https://');
        if (url.includes('books/content')) {
          url = url.replace(/zoom=\d/,'zoom=3');
          if (!/img=1/.test(url)) url += (url.includes('?') ? '&' : '?') + 'img=1';
        }
      }
      return url;
    };
    const computeLink = (b) => {
      // Prefer Amazon product page if ASIN exists and current link looks like an image
      if (b.asin) return `https://www.amazon.fr/dp/${b.asin}`;
      const link = b.link || '#';
      return isImageUrl(link) ? '#' : link;
    };

    // Try to resolve missing covers via Google Books API
    async function findCover(b) {
      try {
        // Prefer ISBN (asin often equals ISBN-10)
        const asin = String(b.asin || '').trim();
        const title = (b.title || '').trim();
        let url = '';
        const toHttps = (s) => String(s || '').replace(/^http:\/\//i, 'https://');
        const toZoom3 = (s) => s.replace(/zoom=\d/, 'zoom=3').replace(/(&|\?)img=\d/, '$1img=1');
        const pick = (info) => {
          const img = info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail;
          return img ? toZoom3(toHttps(img)) : '';
        };
        let res;
        if (/^\d{10,13}$/u.test(asin)) {
          res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(asin)}`, { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            url = pick(data?.items?.[0]?.volumeInfo);
          }
        }
        if (!url && title) {
          const q = `intitle:${title} inauthor:Myriam Djait-Frolla`;
          res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`, { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            url = pick(data?.items?.[0]?.volumeInfo);
          }
        }
        return url || '';
      } catch { return ''; }
    }

    const pickDataset = () => {
      const countImgs = (arr) => (arr || []).reduce((n, b) => n + (normalizeImg(b) ? 1 : 0), 0);
      const cA = countImgs(dsAmazon || []);
      const cG = countImgs(dsGBooks || []);
      if (cG >= cA && (dsGBooks && dsGBooks.length)) return dsGBooks;
      if (dsAmazon && dsAmazon.length) return dsAmazon;
      return [];
    };

    let items = pickDataset();
    if (!items || !items.length) return;

    const buildSrcset = (url) => {
      if (!url) return '';
      if (!/books\.google\./i.test(url)) return '';
      const u1 = url.replace(/zoom=\d/,'zoom=1');
      const u2 = url.replace(/zoom=\d/,'zoom=2');
      const u3 = url.replace(/zoom=\d/,'zoom=3');
      return `${u1} 320w, ${u2} 640w, ${u3} 1024w`;
    };
    const makeCard = (b) => {
      const title = (b.title || '').replace(/\s+/g, ' ').trim();
      const desc = (b.description || '').replace(/\s+/g, ' ').trim();
      const link = computeLink(b);
      const img = normalizeImg(b);
      const short = desc ? (desc.length > 160 ? desc.slice(0,157) + '…' : desc) : '';
      return `
      <article class="bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl overflow-hidden" data-book data-age="all" data-type="livre">
        ${img ? `<a href="${link}" target="_blank" rel="noopener" class="block aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden"><img src="${img}" srcset="${buildSrcset(img)}" alt="Couverture: ${title}" loading="lazy" decoding="async" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw" class="w-full h-full object-cover"/></a>` : `<a href="${link}" target="_blank" rel="noopener" class="block aspect-[4/3] bg-gradient-to-br from-rose-200 to-amber-300 dark:from-slate-800 dark:to-slate-700"></a>`}
        <div class="p-4">
          <h3 class="font-semibold">${title || 'Sans titre'}</h3>
          ${short ? `<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">${short}</p>` : ''}
          <div class="mt-3">
            <a href="${link}" target="_blank" rel="noopener" class="text-sm inline-flex items-center gap-1 text-brand-700 hover:text-brand-800">Voir sur Amazon
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </article>`;
    };

    try {
      const first = items.slice(0, 12);
      // Resolve missing covers before rendering
      const resolved = await Promise.all(first.map(async (b) => {
        const clone = { ...b };
        if (!normalizeImg(clone)) {
          const cover = await findCover(clone);
          if (cover) clone.image = cover;
        }
        return clone;
      }));
      grid.innerHTML = resolved.map(makeCard).join('\n');
    } catch {
      // Keep existing static content on failure
    }
  }

  // Enhance static cards (homepage + livres): add covers if missing.
  async function enhanceStaticCovers() {
    const anchors = Array.from(document.querySelectorAll('article a[href]'))
      .filter((a) => a.className.includes('aspect-'));
    if (!anchors.length) return;

    // Helper: extract ASIN from href or data-asin
    const asinOf = (a) => {
      const d = (a.getAttribute('data-asin') || '').trim();
      if (d) return d;
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/dp\/([A-Za-z0-9]{10})/);
      return m ? m[1] : '';
    };
    const titleOf = (a) => a.getAttribute('data-title') || (a.closest('article')?.querySelector('h3')?.textContent || '').trim();

    // Allow ISBN-10 (including X) and ISBN-13
    const isIsbn = (s) => /^(?:\d{13}|\d{9}[\dXx])$/.test(s);

    const pickFromGB = async (query) => {
      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`, { cache: 'no-cache' });
        if (!res.ok) return '';
        const data = await res.json();
        const info = data?.items?.[0]?.volumeInfo;
        const img = info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail;
        if (!img) return '';
        return img.replace(/^http:\/\//i, 'https://').replace(/zoom=\d/, 'zoom=3').replace(/(&|\?)img=\d/, '$1img=1');
      } catch { return ''; }
    };
    const pickFromOpenLibrary = async (isbn) => {
      if (!isbn) return '';
      try {
        // We can directly return URL; server will serve 404 placeholder if not found
        // No CORS issues for images
        return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
      } catch { return ''; }
    };

    const buildSrcsetFor = (u) => {
      if (!u) return '';
      if (!/books\.google\.com\/books\/content/i.test(u)) return '';
      const u1 = u.replace(/zoom=\d/, 'zoom=1');
      const u2 = u.replace(/zoom=\d/, 'zoom=2');
      const u3 = u.replace(/zoom=\d/, 'zoom=3');
      return `${u1} 320w, ${u2} 640w, ${u3} 1024w`;
    };

    for (const a of anchors) {
      try {
        // Normalize anchor classes
        if (!/overflow-hidden/.test(a.className)) a.classList.add('overflow-hidden');
        if (!/bg-/.test(a.className)) a.classList.add('bg-slate-100','dark:bg-slate-800');

        // If an image is already present as a sibling, move it inside the anchor
        if (!a.querySelector('img')) {
          const article = a.closest('article');
          const siblingImg = article ? Array.from(article.childNodes).find((n) => n.tagName === 'IMG') : null;
          if (siblingImg) {
            const img = siblingImg;
            img.classList.add('w-full','h-full','object-cover');
            if (!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
            if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
            if (!img.hasAttribute('sizes')) img.setAttribute('sizes','(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw');
            a.appendChild(img);
          }
        }

        if (a.querySelector('img')) continue; // already has image now
        const asin = asinOf(a);
        const title = titleOf(a);
        let url = '';
        if (isIsbn(asin)) url = await pickFromGB(`isbn:${asin}`);
        if (!url && title) url = await pickFromGB(`intitle:${title} inauthor:Myriam Djait-Frolla`);
        if (!url && isIsbn(asin)) url = await pickFromOpenLibrary(asin);
        if (!url && isIsbn(asin)) {
          // last resort: Amazon ad system image (may be low res but reliable)
          url = `https://ws-eu.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${encodeURIComponent(asin)}&Format=_SL400_&ID=AsinImage&MarketPlace=FR&ServiceVersion=20070822&WS=1`;
        }
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = 'Couverture: ' + (title || asin || '');
          img.className = 'w-full h-full object-cover';
          const srcset = buildSrcsetFor(url);
          if (srcset) img.setAttribute('srcset', srcset);
          img.setAttribute('sizes', '(min-width:1024px) 33vw, (min-width:640px) 50vw, 90vw');
          a.appendChild(img);
        }
      } catch { /* ignore one card */ }
    }
  }

  // Contact form -> mailto
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const msg = document.getElementById('cfMsg');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cfName').value.trim();
      const email = document.getElementById('cfEmail').value.trim();
      const subject = document.getElementById('cfSubject').value.trim();
      const type = document.getElementById('cfType').value;
      const body = document.getElementById('cfMessage').value.trim();
      if (!name || !email || !subject || !body) {
        if (msg) { msg.textContent = 'Merci de renseigner tous les champs.'; msg.className = 'text-sm text-rose-600'; }
        return;
      }
      const to = 'contact@nom-auteur.fr'; // A personnaliser
      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('[' + type + '] ' + subject)}&body=${encodeURIComponent('De: ' + name + ' <' + email + '>\n\n' + body)}`;
      window.location.href = mailto;
      if (msg) { msg.textContent = 'Ouverture de votre messagerie... Si rien ne se passe, ecrivez a ' + to; msg.className = 'text-sm text-slate-500'; }
      form.reset();
    });
  }

  // Fade-in on scroll using IntersectionObserver
  function initScrollFade() {
    const els = document.querySelectorAll('[data-fade]');
    if (!els.length) return;

    const offsetFor = (el) => {
      const from = (el.dataset.fade || 'up').toLowerCase();
      const dist = parseInt(el.dataset.fadeDistance || '16', 10); // px
      switch (from) {
        case 'left': return `translateX(-${dist}px)`;
        case 'right': return `translateX(${dist}px)`;
        case 'down': return `translateY(-${dist}px)`;
        default: return `translateY(${dist}px)`; // up
      }
    };

    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.9 && r.bottom > 0;
    };

    const show = (el) => {
      const delay = parseInt(el.dataset.fadeDelay || '0', 10);
      el.style.transition = 'opacity 700ms ease, transform 700ms ease';
      el.style.transitionDelay = `${Math.max(0, delay)}ms`;
      el.style.opacity = '1';
      el.style.transform = 'none';
    };

    const hide = (el) => {
      el.style.opacity = '0';
      el.style.transform = offsetFor(el);
    };

    // Initial state
    els.forEach((el) => {
      el.style.willChange = 'opacity, transform';
      if (inView(el)) {
        show(el);
      } else {
        hide(el);
      }
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          show(e.target);
          if (e.target.dataset.fadeRepeat === undefined) io.unobserve(e.target);
        } else if (e.target.dataset.fadeRepeat !== undefined) {
          hide(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    els.forEach((el) => io.observe(el));
  }

  function setYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // Auto-mark common content to fade if not already tagged
  function autoMarkFadeTargets() {
    const candidates = document.querySelectorAll('main section, main article');
    candidates.forEach((el) => {
      if (!el.hasAttribute('data-fade')) {
        el.setAttribute('data-fade', 'up');
      }
    });
  }

  // Init all
  document.addEventListener('DOMContentLoaded', () => {
    sanitizeTextNodes();
    initTheme();
    initMobileMenu();
    highlightActiveLink();
    autoMarkFadeTargets();
    initScrollFade();
    initSlider();
    initBackToTop();
    initNewsletter();
    initBookFilters();
    populateBooks();
    enhanceStaticCovers();
    initContactForm();
    setYear();
  });
})();
