// Main interactions for the site
(function () {
  const THEME_KEY = 'theme';
  const html = document.documentElement;

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

    const makeCard = (b) => {
      const title = (b.title || '').replace(/\s+/g, ' ').trim();
      const desc = (b.description || '').replace(/\s+/g, ' ').trim();
      const link = b.link || (b.asin ? `https://www.amazon.fr/dp/${b.asin}` : '#');
      const img = normalizeImg(b);
      const short = desc ? (desc.length > 160 ? desc.slice(0,157) + '…' : desc) : '';
      return `
      <article class="bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl overflow-hidden" data-book data-age="all" data-type="livre">
        ${img ? `<a href="${link}" target="_blank" rel="noopener" class="block aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden"><img src="${img}" alt="Couverture: ${title}" loading="lazy" decoding="async" class="w-full h-full object-cover"/></a>` : `<a href="${link}" target="_blank" rel="noopener" class="block aspect-[4/3] bg-gradient-to-br from-rose-200 to-amber-300 dark:from-slate-800 dark:to-slate-700"></a>`}
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
      grid.innerHTML = items.slice(0, 12).map(makeCard).join('\n');
    } catch {
      // Keep existing static content on failure
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
    initContactForm();
    setYear();
  });
})();
