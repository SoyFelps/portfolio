document.documentElement.classList.add('js');

// Header background on scroll
const header = document.querySelector('.site-header');
const onScroll = () => {
  header.classList.toggle('is-solid', window.scrollY > 8);
  document.documentElement.classList.toggle('is-scrolled', window.scrollY > 40);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.site-nav');
menuBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', open);
});

// Site search
const pages = [
  { title: 'Portfolio', url: 'index.html', keys: 'home highlights projects' },
  { title: 'AI Workflows', url: 'ai-workflows.html', keys: 'claude code figma mcp design system pathway marcaflow' },
  { title: 'About', url: 'about.html', keys: 'resume cv experience skills education courses languages' },
  { title: 'Contact', url: 'contact.html', keys: 'email linkedin' },
  { title: 'Design System', url: 'design-system.html', keys: 'tokens components colors typography buttons style guide' },
  { title: 'XippTech', url: 'xipptech.html', keys: 'b2b benefits telemedicine' },
  { title: 'MeuRH360', url: 'meurh360.html', keys: 'hr platform workflows' },
  { title: 'UX Analyzer', url: 'ux-analyzer.html', keys: 'heatmap accessibility figma make' },
  { title: 'Flory', url: 'flory-page.html', keys: 'mobile app plants' },
  { title: 'Organogram', url: 'organogram.html', keys: 'org chart' },
  { title: 'Calendar', url: 'calendar.html', keys: 'absences planning' },
  { title: 'Variansee', url: 'variansee.html', keys: 'contrast extension accessibility' },
  { title: 'File Guard', url: 'file-guard-page.html', keys: 'prototype' },
  { title: 'inClinic', url: 'inclinic-page.html', keys: 'prototype app desktop tablet' },
  { title: 'Castelo', url: 'castelo.html', keys: 'prototype' },
  { title: 'Wallet Guide', url: 'wallet-guide-page.html', keys: 'prototype' },
  { title: 'Verona Film Festival', url: 'verona-page.html', keys: 'prototype' },
  { title: 'Mixzer', url: 'mixzer.html', keys: 'html css spotify' },
  { title: 'Echo UX', url: 'echoux.html', keys: 'html css' },
];
const panel = document.querySelector('.search-panel');
const input = panel?.querySelector('input');
const results = panel?.querySelector('.search-results');

const render = (q) => {
  const term = q.trim().toLowerCase();
  const hits = term ? pages.filter(p => (p.title + ' ' + p.keys).toLowerCase().includes(term)) : [];
  results.innerHTML = hits.map(p => `<li><a href="${p.url}">${p.title}</a></li>`).join('');
};
const closeSearch = () => panel.classList.remove('is-open');

document.querySelector('.search-btn')?.addEventListener('click', () => {
  panel.classList.add('is-open');
  input.value = '';
  render('');
  input.focus();
});
panel?.addEventListener('click', (e) => { if (e.target === panel) closeSearch(); });
input?.addEventListener('input', () => render(input.value));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

// Reveal on scroll (respects prefers-reduced-motion via CSS)
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// "Back" on project pages returns to the portfolio at the scroll position the visitor left.
const SCROLL_KEY = 'portfolio-home-scroll', RESTORE_KEY = 'portfolio-restore-home';
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  del: (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* storage unavailable */ } },
};
if (document.querySelector('.hero')) {
  window.addEventListener('pagehide', () => store.set(SCROLL_KEY, String(window.scrollY)));
  if (store.get(RESTORE_KEY) === '1') {
    store.del(RESTORE_KEY);
    const y = Number(store.get(SCROLL_KEY)) || 0;
    if (y > 0) {
      const go = () => window.scrollTo({ top: y, behavior: 'instant' });
      go();
      window.addEventListener('load', () => { go(); setTimeout(go, 250); });
    }
  }
}
document.querySelectorAll('.btn-back').forEach((a) => a.addEventListener('click', () => store.set(RESTORE_KEY, '1')));

// Logo wall: start the staggered entrance when it scrolls into view
const wall = document.querySelector('[data-wall]');
if (wall) {
  if ('IntersectionObserver' in window) {
    const wio = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { wall.classList.add('in'); wio.disconnect(); }
    }, { threshold: 0.2 });
    wio.observe(wall);
  } else {
    wall.classList.add('in');
  }
}

// Copy-to-clipboard buttons (Contact page)
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('[data-copy-label]');
  const status = document.querySelector('[data-copy-status]');
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
    }
    if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
    btn.classList.toggle('is-copied', ok);
    if (status) status.textContent = ok ? 'E-mail address copied to the clipboard' : 'Could not copy the address';
    setTimeout(() => { if (label) label.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 2000);
  });
});

// Landing on a #section link: jump there instantly (smooth scrolling gets cut short while the page lays out)
window.addEventListener('load', () => {
  if (!location.hash || location.hash.length < 2) return;
  let el = null;
  try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
  if (!el) return;
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';
  el.scrollIntoView();
  requestAnimationFrame(() => { root.style.scrollBehavior = ''; });
});

// Generated pages place text in columns with fixed offsets; when text wraps to more lines than the original
// design (narrower window, different font metrics) it would run into the block below, so push those blocks down.
(function () {
  const rows = document.querySelectorAll('.page .row');
  if (!rows.length) return;
  const GAP = 16;
  function fit() {
    const narrow = window.matchMedia('(max-width: 700px)').matches;
    rows.forEach((row) => {
      const cells = Array.from(row.children).filter((c) => c.classList.contains('cell'));
      cells.forEach((c) => { c.style.marginTop = ''; });
      if (narrow) return;
      cells.forEach((cell, i) => {
        let shift = 0;
        for (let j = 0; j < i; j++) {
          const prev = cells[j];
          if (prev.tagName === 'HR' || cell.tagName === 'HR') continue;
          const overlapX = cell.offsetLeft < prev.offsetLeft + prev.offsetWidth - 1 && prev.offsetLeft < cell.offsetLeft + cell.offsetWidth - 1;
          if (!overlapX || cell.offsetTop + cell.offsetHeight <= prev.offsetTop) continue; // skip blocks that sit entirely above
          const need = prev.offsetTop + prev.offsetHeight + GAP - cell.offsetTop;
          if (need > shift) shift = need;
        }
        if (shift > 0) cell.style.marginTop = 'calc(var(--mt, 0px) + ' + Math.ceil(shift) + 'px)';
      });
    });
  }
  let t;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 60); };
  window.addEventListener('resize', later);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
