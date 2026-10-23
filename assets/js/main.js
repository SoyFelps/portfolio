document.documentElement.classList.add('js');

// Header background on scroll
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 8);
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
  { title: 'XippTech', url: 'xipptech.html', keys: 'b2b benefits telemedicine' },
  { title: 'MeuRH360', url: 'meurh360.html', keys: 'hr platform workflows' },
  { title: 'UX Analyzer', url: 'ux-analyzer.html', keys: 'heatmap accessibility figma make' },
  { title: 'Flory', url: 'flory-page.html', keys: 'mobile app plants' },
  { title: 'Style Guide', url: 'style-guide.html', keys: 'design system components' },
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
