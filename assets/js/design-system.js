/* Design System page: builds the token documentation from the live CSS and wires the interactions. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let tokenCount = 0;

  /* ---------- Toast and clipboard ---------- */
  const toast = $('#ds-toast');
  let toastTimer;
  function showToast(text) {
    $('#ds-toast-text').textContent = text;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  }
  async function copy(text, message) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
      t.remove();
    }
    showToast(message || 'Copied to the clipboard');
  }

  /* ---------- Drawer ---------- */
  const drawer = $('#ds-drawer');
  const drawerBody = $('#ds-drawer-body');
  let drawerOpener = null;
  function openDrawer(html, opener) {
    drawerBody.innerHTML = html;
    drawer.classList.add('is-open');
    drawerOpener = opener || null;
    requestAnimationFrame(() => $('.ds-drawer-close', drawer).focus({ preventScroll: true }));
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    if (drawerOpener) drawerOpener.focus({ preventScroll: true });
  }
  $('.ds-drawer-close', drawer).addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  drawer.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copy(b.dataset.copy, b.dataset.msg);
  });

  /* ---------- Colour helpers ---------- */
  function parseColor(v) {
    v = v.trim();
    let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (m) {
      let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    }
    m = /^rgba?\(([^)]+)\)$/i.exec(v);
    if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] }; }
    return null;
  }
  const lum = ({ r, g, b }) => {
    const c = [r, g, b].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) });
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const toHex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  function grade(r) {
    if (r >= 7) return ['AAA', 'ok'];
    if (r >= 4.5) return ['AA', 'ok'];
    if (r >= 3) return ['AA large', 'low'];
    return ['Fails', 'fail'];
  }

  /* ---------- Colours ---------- */
  const palette = [
    { group: 'Surfaces', items: [
      ['Background', '--bg', 'Page background.'],
      ['Header', '--bg-header', 'Solid header once the page is scrolled, and the details drawer.'],
      ['Surface', '--surface', 'Cards, panels and inputs: one step lighter than the page.'],
    ] },
    { group: 'Text', items: [
      ['Text strong', '--text-strong', 'Headings and emphasis.'],
      ['Text', '--text', 'Default body text.'],
      ['Muted', '--muted', 'Secondary text, captions and descriptions.'],
    ] },
    { group: 'Lines', items: [
      ['Line', '--line', 'Hairline dividers between sections and inside panels.'],
      ['Line strong', '--line-strong', 'Borders of buttons and controls (a translucent white).'],
    ] },
    { group: 'Brand', items: [
      ['Accent', '--accent', 'The portfolio’s signature: primary buttons, labels, focus ring, selected states.'],
      ['Accent hover', '--accent-hover', 'Primary button on hover.'],
      ['Text on accent', '--text-on-accent', 'Text and icons placed on the accent colour.'],
    ] },
    { group: 'Tools (inline emphasis)', items: [
      ['Claude', '--claude', 'Names Claude Code in running text.'],
      ['Figma', '--figma', 'Names Figma MCP in running text.'],
      ['Manus', '--manus', 'Names Manus in running text.'],
      ['Status orange', '--orange', 'The “New!” status tag.'],
    ] },
    { group: 'Tints (overlays)', items: [
      ['Chip tint', '--tint-chip', 'Chips, tags and subtle fills.'],
      ['Hover tint', '--tint-hover', 'Hover fill on dark surfaces.'],
      ['Accent tint', '--tint-accent', 'Check icons, number badges, selected chips.'],
      ['Accent glow', '--glow-accent', 'Soft glow behind devices.'],
    ] },
  ];
  const bgColor = parseColor(css('--bg'));
  const surfColor = parseColor(css('--surface'));

  function swatchDetails(name, v, use, value) {
    const c = parseColor(value);
    let contrast = '';
    if (c && c.a === 1) {
      const rows = [['On page background', bgColor], ['On surface', surfColor]].map(([label, bg]) => {
        const r = ratio(c, bg); const [g, cls] = grade(r);
        return `<div><span>${label}</span><span><b>${r.toFixed(2)}:1</b> <span class="ds-badge ${cls}">${g}</span></span></div>`;
      }).join('');
      contrast = `<dt>Contrast as text</dt><dd class="ds-contrast">${rows}</dd>`;
      const onc = ratio(bgColor, c);
      contrast += `<dt>Page background on this colour</dt><dd class="ds-contrast"><div><span>As a button label</span><span><b>${onc.toFixed(2)}:1</b> <span class="ds-badge ${grade(onc)[1]}">${grade(onc)[0]}</span></span></div></dd>`;
    } else if (c) {
      contrast = `<dt>Contrast</dt><dd>This is an overlay. Its contrast depends on the surface behind it.</dd>`;
    }
    const hex = c && c.a === 1 ? toHex(c) : value;
    return `<p class="ds-drawer-kind">Colour</p><h2>${esc(name)}</h2>
      <div class="ds-drawer-preview" style="background-image:linear-gradient(45deg,#3c3d44 25%,transparent 25%,transparent 75%,#3c3d44 75%),linear-gradient(45deg,#3c3d44 25%,transparent 25%,transparent 75%,#3c3d44 75%);background-size:14px 14px;background-position:0 0,7px 7px"><i style="background:var(${v})"></i></div>
      <dl><dt>Use</dt><dd>${esc(use)}</dd><dt>CSS variable</dt><dd><code>var(${v})</code></dd><dt>Value</dt><dd><code>${esc(value)}</code></dd>${contrast}</dl>
      <div class="ds-drawer-actions"><button class="ds-tool" data-copy="${esc(hex)}" data-msg="Value copied" type="button">Copy value</button><button class="ds-tool" data-copy="var(${v})" data-msg="Variable copied" type="button">Copy variable</button></div>`;
  }
  const swatchHost = $('#ds-swatches');
  palette.forEach((g) => {
    const h = document.createElement('h3'); h.className = 'ds-sub'; h.textContent = g.group; swatchHost.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'ds-swatches';
    g.items.forEach(([name, v, use]) => {
      const value = css(v) || '';
      tokenCount++;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ds-swatch';
      b.innerHTML = `<span class="ds-swatch-chip"><i style="background:var(${v})"></i></span><span class="ds-swatch-body"><span class="ds-swatch-name">${esc(name)}</span><span class="ds-swatch-var">${v}</span><span class="ds-swatch-val">${esc(value)}</span></span>`;
      b.addEventListener('click', () => {
        const c = parseColor(value);
        copy(c && c.a === 1 ? toHex(c) : value, `${name} copied`);
        openDrawer(swatchDetails(name, v, use, value), b);
      });
      grid.appendChild(b);
    });
    swatchHost.appendChild(grid);
  });

  /* ---------- Typography ---------- */
  const types = [
    ['Display', 'font-size:var(--fs-display);font-weight:700;line-height:1.1;letter-spacing:-.02em', '--fs-display', 'Montserrat 700 · clamp(48px, 6.2vw, 84px) · line-height 1.1 · tracking -0.02em', 'The page title in a hero.'],
    ['Title', 'font-size:var(--fs-title);font-weight:700;line-height:1.15;letter-spacing:-.01em', '--fs-title', 'Montserrat 700 · clamp(30px, 3.6vw, 44px) · line-height 1.15', 'Section headings (H2).'],
    ['Heading', 'font-size:var(--fs-heading);font-weight:700;line-height:1.15;letter-spacing:-.01em', '--fs-heading', 'Montserrat 700 · clamp(28px, 3vw, 38px) · line-height 1.15', 'Product and feature headings (H3).'],
    ['Subhead', 'font-size:var(--fs-subhead);font-weight:700;line-height:1.2', '--fs-subhead', 'Montserrat 700 · clamp(22px, 2.4vw, 28px) · line-height 1.2', 'Group headings inside a section.'],
    ['Card title', 'font-size:var(--fs-card);font-weight:700;line-height:1.25', '--fs-card', 'Montserrat 700 · 21px · line-height 1.25', 'Titles inside cards.'],
    ['Lead', 'font-size:var(--fs-lead);font-weight:400;line-height:1.65;color:var(--muted)', '--fs-lead', 'Montserrat 400 · 19px · line-height 1.65 · muted', 'The sentence under a page title.'],
    ['Body', 'font-size:var(--fs-body);font-weight:400;line-height:1.7;color:var(--muted)', '--fs-body', 'Montserrat 400 · 17px · line-height 1.7 · muted', 'Paragraphs.'],
    ['Small', 'font-size:var(--fs-small);font-weight:400;line-height:1.6;color:var(--muted)', '--fs-small', 'Montserrat 400 · 15px · line-height 1.6 · muted', 'Dense text inside cards and lists.'],
    ['Caption', 'font-size:var(--fs-caption);font-weight:500;line-height:1.4;color:var(--muted)', '--fs-caption', 'Montserrat 500 · 13px · line-height 1.4 · muted', 'Captions and fine print.'],
    ['Overline', 'font-size:var(--fs-caption);font-weight:600;line-height:1.3;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)', '--fs-caption', 'Montserrat 600 · 13px · uppercase · tracking 0.12em · accent', 'The small label above a heading.'],
    ['Interface', 'font-family:var(--font-ui);font-size:16px;font-weight:500;line-height:1.3', '--font-ui', 'Roboto 500 · 16px', 'Header, navigation and the search overlay.'],
  ];
  const typeHost = $('#ds-type');
  const tester = $('#ds-tester');
  types.forEach(([name, style, token, spec, use]) => {
    tokenCount++;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ds-type-row'; b.setAttribute('aria-expanded', 'false');
    b.innerHTML = `<span class="ds-type-meta"><strong>${name}</strong><span>${token}</span></span><span class="ds-type-sample" style="${style}">${esc(tester.value)}</span>`;
    b.addEventListener('click', () => {
      $$('.ds-type-row', typeHost).forEach((r) => r.setAttribute('aria-expanded', 'false'));
      b.setAttribute('aria-expanded', 'true');
      const cssText = `.${name.toLowerCase().replace(/\s+/g, '-')} {\n  ${style.split(';').join(';\n  ')};\n}`;
      openDrawer(`<p class="ds-drawer-kind">Type style</p><h2>${name}</h2>
        <div class="ds-drawer-preview" style="height:auto;min-height:110px;padding:18px;place-items:start"><span style="${style}">${esc(tester.value || 'Aa')}</span></div>
        <dl><dt>Use</dt><dd>${use}</dd><dt>Specification</dt><dd>${spec}</dd><dt>Token</dt><dd><code>var(${token})</code></dd></dl>
        <div class="ds-drawer-actions"><button class="ds-tool" type="button" data-copy="${esc(cssText)}" data-msg="CSS copied">Copy CSS</button><button class="ds-tool" type="button" data-copy="var(${token})" data-msg="Variable copied">Copy variable</button></div>`, b);
    });
    typeHost.appendChild(b);
  });
  tester.addEventListener('input', () => {
    const v = tester.value || 'Aa';
    $$('.ds-type-sample', typeHost).forEach((s) => { s.textContent = v; });
  });

  /* ---------- Spacing, radius, elevation ---------- */
  const spacing = [['--space-1', 'Tight gaps inside a control'], ['--space-2', 'Gap between chips and small items'], ['--space-3', 'Inline gaps, small card padding'], ['--space-4', 'Default gap and padding'], ['--space-5', 'Gap between cards'], ['--space-6', 'Card padding'], ['--space-8', 'Panel padding'], ['--space-10', 'Large gaps inside a section'], ['--space-14', 'Gap between columns'], ['--space-18', 'Space above a section'], ['--space-24', 'Space between sections'], ['--space-26', 'Space after a card list']];
  const spHost = $('#ds-spacing');
  spacing.forEach(([v, use]) => {
    tokenCount++;
    const val = css(v);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ds-scale-row'; b.title = use;
    b.innerHTML = `<code>${v}</code><span>${val}</span><span class="ds-scale-bar" style="width:${val}"></span>`;
    b.addEventListener('click', () => copy(`var(${v})`, `${v} copied (${use})`));
    spHost.appendChild(b);
  });

  const radii = [['--radius-sm', 'Tags and chips'], ['--radius-md', 'Inset notes and small tiles'], ['--radius-lg', 'Cards'], ['--radius-xl', 'Panels'], ['--radius-2xl', 'Device panels'], ['--radius-pill', 'Buttons and jump links']];
  const rHost = $('#ds-radius');
  radii.forEach(([v, use]) => {
    tokenCount++;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ds-tile';
    b.innerHTML = `<span class="ds-tile-box" style="border-radius:var(${v})">${css(v)}</span><span class="ds-tile-name">${v}</span><span class="ds-tile-use">${use}</span>`;
    b.addEventListener('click', () => copy(`var(${v})`, `${v} copied`));
    rHost.appendChild(b);
  });

  const shadows = [
    ['Flat', 'none', 'No shadow: the default for surfaces.', null],
    ['Lift', '--shadow-lift', 'Tiles and cards while hovered.', 'box-shadow'],
    ['Accent glow', '--shadow-accent', 'The primary button while hovered.', 'box-shadow'],
    ['Device', '--shadow-device', 'Devices and screenshots on a panel (a drop-shadow filter).', 'filter'],
  ];
  const sHost = $('#ds-shadows');
  shadows.forEach(([name, v, use, prop]) => {
    if (prop) tokenCount++;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ds-tile';
    const style = prop ? `${prop}:var(${v})` : '';
    b.innerHTML = `<span class="ds-tile-box" style="${style}">${prop ? '' : 'none'}</span><span class="ds-tile-name">${name}</span><span class="ds-tile-use">${use}</span>`;
    b.addEventListener('click', () => copy(prop ? `${prop}: var(${v});` : 'box-shadow: none;', `${name} copied`));
    sHost.appendChild(b);
  });

  /* ---------- Icons ---------- */
  const icons = [
    ['arrow-left', 'stroke', '<path d="M19 12H5M11 6l-6 6 6 6"/>'], ['arrow-right', 'stroke', '<path d="M5 12h14M13 6l6 6-6 6"/>'], ['arrow-ne', 'stroke', '<path d="M7 17L17 7M8 7h9v9"/>'], ['arrow-up', 'stroke', '<path d="M12 19V5M6 11l6-6 6 6"/>'],
    ['download', 'stroke', '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'], ['check', 'stroke', '<path d="M5 12.5l4.5 4.5L19 7.5"/>'], ['close', 'stroke', '<path d="M6 6l12 12M18 6L6 18"/>'], ['minus', 'stroke', '<path d="M6 12h12"/>'],
    ['chevron-down', 'stroke', '<path d="M6 9l6 6 6-6"/>'], ['copy', 'stroke', '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'], ['mcp', 'stroke', '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><circle cx="4.5" cy="5.5" r="2"/><circle cx="19.5" cy="5.5" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 7l4.3 3.3M18 7l-4.3 3.3M12 15.2V18"/>'],
    ['menu', 'fill', '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>'], ['search', 'fill', '<path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>'],
    ['users', 'fill', '<path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05A4.2 4.2 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>'],
    ['bulb', 'fill', '<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19a7 7 0 0 0-4 12.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26A7 7 0 0 0 12 2z"/>'],
    ['shield-check', 'fill', '<path d="M12 2 4 5v6c0 5.25 3.4 10.15 8 11.35 4.6-1.2 8-6.1 8-11.35V5l-8-3zm-1 14-4-4 1.41-1.41L11 13.17l4.59-4.58L17 10l-6 6z"/>'],
    ['star', 'fill', '<path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>'],
    ['warning', 'fill', '<path d="M12 2 1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z"/>'],
    ['eye', 'fill', '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>'],
    ['sparkles', 'fill', '<path d="M9.5 3.5l1.55 4.45a3 3 0 0 0 1.9 1.9l4.45 1.55-4.45 1.55a3 3 0 0 0-1.9 1.9L9.5 18.8 7.95 14.35a3 3 0 0 0-1.9-1.9L1.6 10.9l4.45-1.55a3 3 0 0 0 1.9-1.9L9.5 3.5zM18.5 2l.75 2.25a1.6 1.6 0 0 0 1 1L22.5 6l-2.25.75a1.6 1.6 0 0 0-1 1L18.5 10l-.75-2.25a1.6 1.6 0 0 0-1-1L14.5 6l2.25-.75a1.6 1.6 0 0 0 1-1L18.5 2z"/>'],
  ];
  const iHost = $('#ds-icons');
  icons.forEach(([name, kind, inner]) => {
    tokenCount++;
    const markup = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ds-icon'; b.title = `Copy ${name}`;
    b.innerHTML = `<svg class="is-${kind}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg><span>${name}</span>`;
    b.addEventListener('click', () => copy(markup, `${name} icon copied`));
    iHost.appendChild(b);
  });

  $('#ds-count').textContent = tokenCount;

  /* ---------- Layout: live width ---------- */
  const bps = $$('#ds-bp div');
  function updateWidth() {
    const w = window.innerWidth;
    $('#ds-width').textContent = w + 'px';
    bps.forEach((el) => {
      const min = +(el.dataset.min || 0), max = +(el.dataset.max || 99999);
      el.classList.toggle('is-current', w >= min && w <= max);
    });
  }
  updateWidth();
  window.addEventListener('resize', updateWidth);

  /* ---------- Motion ---------- */
  $('#ds-replay').addEventListener('click', () => {
    const el = $('#ds-rise');
    el.classList.remove('is-playing'); void el.offsetWidth; el.classList.add('is-playing');
  });

  /* ---------- Buttons: preview a state ---------- */
  const stage = $('#ds-btn-stage');
  $$('#ds-states button').forEach((b) => b.addEventListener('click', () => {
    $$('#ds-states button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    stage.dataset.state = b.dataset.state;
    $$('.btn', stage).forEach((a) => { if (b.dataset.state === 'disabled') a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled'); });
  }));
  $$('#ds-btn-stage a.btn').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  /* ---------- Filter chips, tabs, toast ---------- */
  const chips = $$('#ds-chips .ds-chip');
  const chipOut = $('#ds-chip-out');
  chips.forEach((c) => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    const on = chips.filter((x) => x.getAttribute('aria-pressed') === 'true').map((x) => x.textContent);
    chipOut.textContent = on.length ? 'Selected: ' + on.join(', ') : 'Nothing selected';
  }));

  const tabs = $$('#ds-tabs [role=tab]');
  function selectTab(t) {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      $('#' + x.getAttribute('aria-controls')).hidden = !on;
    });
    t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k == null) return;
      e.preventDefault(); selectTab(tabs[(k + tabs.length) % tabs.length]);
    });
  });
  $('#ds-toast-btn').addEventListener('click', () => showToast('Copied to the clipboard'));

  /* ---------- Header specimen ---------- */
  const realHeader = $('header.site-header');
  const frame = $('#ds-header-frame');
  if (realHeader && frame) {
    const c = realHeader.cloneNode(true);
    c.classList.add('is-solid');
    $$('a', c).forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
    frame.appendChild(c);
  }

  /* ---------- Code view for demos ---------- */
  const VOID = /^(img|input|br|hr|path|circle|rect|line)$/i;
  const INLINE = /^(span|strong|em|b|i|small|a|svg|code|label|button|path|circle|rect|img|input)$/i;
  function cleanNode(n) {
    const c = n.cloneNode(true);
    [c, ...c.querySelectorAll('*')].forEach((el) => {
      ['data-state', 'loading', 'tabindex', 'aria-pressed', 'title', 'aria-disabled'].forEach((a) => el.removeAttribute(a));
      el.classList.remove('ds-live-code');
      if (el.getAttribute('class') === '') el.removeAttribute('class');
    });
    $$('a', c).forEach((a) => { const h = a.getAttribute('href'); if (h && h.startsWith('#')) a.setAttribute('href', '#'); });
    return c;
  }
  function fmt(node, depth) {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) { const t = node.textContent.replace(/\s+/g, ' ').trim(); return t ? pad + t : ''; }
    if (node.nodeType !== 1) return '';
    const kids = [...node.childNodes].filter((k) => k.nodeType === 1 || (k.nodeType === 3 && k.textContent.trim()));
    const flat = node.outerHTML.replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><');
    const onlyInline = kids.every((k) => k.nodeType === 3 || INLINE.test(k.tagName));
    if (!kids.length || VOID.test(node.tagName) || node.tagName.toLowerCase() === 'svg' || (onlyInline && flat.length < 110)) return pad + flat;
    const tag = node.tagName.toLowerCase();
    const open = flat.slice(0, flat.indexOf('>') + 1);
    return [pad + open, ...kids.map((k) => fmt(k, depth + 1)).filter(Boolean), pad + '</' + tag + '>'].join('\n');
  }
  $$('.ds-demo[data-code]').forEach((demo) => {
    const tools = $('.ds-demo-tools', demo) || (() => { const d = document.createElement('div'); d.className = 'ds-demo-tools'; $('.ds-demo-head', demo).appendChild(d); return d; })();
    const pre = $('.ds-code', demo);
    const parts = $$('.ds-live-code', demo);
    const nodes = () => parts.flatMap((p) => (p.matches('.ds-stage') ? [...p.children] : [p])).map(cleanNode);
    const code = () => nodes().map((n) => fmt(n, 0)).join('\n');
    const show = document.createElement('button');
    show.type = 'button'; show.className = 'ds-tool'; show.textContent = 'Show code'; show.setAttribute('aria-expanded', 'false');
    show.addEventListener('click', () => {
      const open = !demo.classList.contains('is-code-open');
      if (open) pre.textContent = code();
      demo.classList.toggle('is-code-open', open);
      show.textContent = open ? 'Hide code' : 'Show code'; show.setAttribute('aria-expanded', String(open));
    });
    const cp = document.createElement('button');
    cp.type = 'button'; cp.className = 'ds-tool'; cp.textContent = 'Copy HTML';
    cp.addEventListener('click', () => { copy(code(), 'HTML copied'); cp.classList.add('is-done'); setTimeout(() => cp.classList.remove('is-done'), 1400); });
    tools.append(show, cp);
  });

  /* ---------- Side navigation: build, filter, scrollspy ---------- */
  const sections = $$('.ds-sec');
  const groups = {};
  sections.forEach((s) => { (groups[s.dataset.group] = groups[s.dataset.group] || []).push(s); });
  const navHost = $('#ds-nav-groups');
  Object.entries(groups).forEach(([g, list]) => {
    const wrap = document.createElement('div'); wrap.className = 'ds-nav-group';
    wrap.innerHTML = `<p class="ds-nav-title">${g}</p><ul>${list.map((s) => `<li data-keys="${esc((s.dataset.title + ' ' + (s.dataset.keys || '')).toLowerCase())}"><a href="#${s.id}">${s.dataset.title}</a></li>`).join('')}</ul>`;
    navHost.appendChild(wrap);
  });
  const links = $$('a', navHost);
  const filter = $('.ds-filter input');
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let any = false;
    $$('li', navHost).forEach((li) => { const m = !q || li.dataset.keys.includes(q); li.hidden = !m; any = any || m; });
    $$('.ds-nav-group', navHost).forEach((g) => { g.hidden = !$$('li:not([hidden])', g).length; });
    $('.ds-nav-empty').classList.toggle('is-on', !any);
  });
  const toggle = $('.ds-nav-toggle');
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true')));
  links.forEach((a) => a.addEventListener('click', () => toggle.setAttribute('aria-expanded', 'false')));
  let ticking = false;
  function spy() {
    ticking = false;
    const line = window.innerHeight * 0.3;
    let current = sections[0];
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
    links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + current.id)));
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  window.addEventListener('resize', spy);
  spy();
})();
