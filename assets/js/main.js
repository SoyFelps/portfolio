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
  { title: 'Portfolio', url: 'index.html' },
  { title: 'AI Workflows', url: 'ai-workflows.html' },
  { title: 'Resume', url: 'resume.html' },
  { title: 'About Me', url: 'about-me.html' },
  { title: 'Contact', url: 'contact.html' },
];
const panel = document.querySelector('.search-panel');
const input = panel?.querySelector('input');
const results = panel?.querySelector('.search-results');

const render = (q) => {
  const term = q.trim().toLowerCase();
  const hits = term ? pages.filter(p => p.title.toLowerCase().includes(term)) : [];
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
