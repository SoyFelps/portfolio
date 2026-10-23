# Felipe Parreiras — Portfolio

Static site (HTML + CSS + a little vanilla JS). No build step: open `index.html`, or serve the folder with any static server (`node .claude/serve.js` → http://localhost:5500).

```
index.html                 Portfolio (home) — hand-written
ai-workflows.html          AI Workflows
about.html                 About + resume (replaces about-me.html and resume.html, which now redirect)
contact.html
xipptech · meurh360 · ux-analyzer · style-guide · flory-page ·
organogram · calendar · variansee · file-guard-page · inclinic-page ·
castelo · wallet-guide-page · verona-page · mixzer · echoux   (.html)
assets/css/style.css       All styles (tokens are CSS variables in :root)
assets/js/main.js          Sticky header, mobile menu, site search, reveal-on-scroll
assets/img/                WebP images
```

Notes
- The project pages (everything except `index.html` and `about.html`) were generated from the original Google Sites layout with `.claude/gen.js`. Re-running it overwrites them, so edit the HTML directly from now on.
- Live at https://felipeparreiras.com (GitHub Pages, repo SoyFelps/portfolio). Share image: `assets/img/og-image.jpg` (1200x630); canonical and Open Graph URLs point to the final domain.
