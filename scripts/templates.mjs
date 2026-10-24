/**
 * Static page templates. Each page is fully readable without JavaScript;
 * the browser script then adds search, favorites and the interactive tools.
 */
import { SITE_NAME, categories, tools, getCategory, toolsInCategory, plannedInCategory, plannedTools, relatedTools, editorsPicks, getTool } from '../src/js/core/registry.js';
import { iconSvg, logoSvg } from '../src/js/core/icons.js';
import { esc, toolCardHtml, categoryCardHtml, plannedListHtml } from '../src/js/core/markup.js';
import { docsFor } from '../src/js/core/tool-docs.js';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

const LOCAL_NOTE = 'Local processing protects your data from being uploaded, but it cannot protect against a compromised device or malicious browser extensions.';

function header(root, current) {
  const nav = [
    ['tools/', 'All tools', 'directory'],
    ['help/', 'Help', 'help'],
    ['about/', 'About', 'about']
  ];
  const navLinks = nav
    .map(([href, label, id]) => `<a href="${root}${href}"${current === id ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  const catLinks = categories
    .map((c) => `<a href="${root}category/${c.id}/"${current === `category:${c.id}` ? ' aria-current="page"' : ''}>${iconSvg(c.icon, { size: 16 })}<span>${esc(c.short)}</span></a>`)
    .join('');

  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container header-bar">
    <a class="brand" href="${root}" aria-label="${SITE_NAME} home">${logoSvg(32)}<span class="brand__name">ToolNest<span class="brand__tag">Ultimate</span></span></a>
    <nav class="primary-nav" aria-label="Primary">${navLinks}</nav>
    <div class="header-actions">
      <button class="search-trigger js-only" type="button" data-action="open-palette" aria-keyshortcuts="Control+K Meta+K">
        ${iconSvg('search', { size: 18 })}<span class="search-trigger__label">Search tools…</span><kbd class="kbd-hint">Ctrl K</kbd>
      </button>
      <a class="icon-btn no-js-only" href="${root}tools/" aria-label="Browse all tools">${iconSvg('search')}</a>
      <button class="icon-btn js-only" type="button" data-action="toggle-theme" aria-label="Switch to dark theme" title="Toggle theme">
        <span class="theme-icon theme-icon--sun">${iconSvg('sun')}</span><span class="theme-icon theme-icon--moon">${iconSvg('moon')}</span>
      </button>
      <button class="icon-btn js-only" type="button" data-action="open-settings" aria-label="Open settings" title="Settings">${iconSvg('sliders')}</button>
      <button class="icon-btn menu-toggle js-only" type="button" data-action="toggle-menu" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">${iconSvg('menu')}</button>
    </div>
  </div>
  <div id="mobile-menu" class="mobile-menu" hidden>
    <nav class="container" aria-label="Mobile">
      <div class="mobile-menu__links">${navLinks}<a href="${root}privacy/">Privacy</a></div>
      <p class="mobile-menu__heading">Categories</p>
      <div class="mobile-menu__cats">${catLinks}</div>
    </nav>
  </div>
  <nav class="cat-strip" aria-label="Categories"><div class="container cat-strip__inner">${catLinks}</div></nav>
</header>`;
}

function footer(root, cfg) {
  const year = new Date().getUTCFullYear();
  const catLinks = categories.slice(0, 8).map((c) => `<li><a href="${root}category/${c.id}/">${esc(c.name)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand" href="${root}">${logoSvg(28)}<span class="brand__name">ToolNest<span class="brand__tag">Ultimate</span></span></a>
      <p>Free, private tools that run in your browser. No accounts, no ads, no tracking.</p>
    </div>
    <nav aria-label="Categories (footer)"><h2>Categories</h2><ul>${catLinks}<li><a href="${root}tools/">All categories →</a></li></ul></nav>
    <nav aria-label="Site"><h2>ToolNest</h2><ul>
      <li><a href="${root}tools/">Tool directory</a></li>
      <li><a href="${root}help/">Help &amp; shortcuts</a></li>
      <li><a href="${root}about/">About</a></li>
      <li><a href="${root}privacy/">Privacy</a></li>
      <li><a href="${root}about/#contact">Contact</a></li>
      ${cfg.repoUrl ? `<li><a href="${esc(cfg.repoUrl)}" rel="noopener">Source code</a></li>` : ''}
    </ul></nav>
  </div>
  <div class="container footer-bottom">
    <p>© ${year} ${SITE_NAME}. Open source under the MIT licence.</p>
    <p>Version ${esc(cfg.version)}</p>
  </div>
</footer>`;
}

export function layout(cfg, { path, title, description, page, main, toolId = '', noindex = false, jsonLd = null, current = '' }) {
  // Pages link to each other relatively so the site works under any sub-path.
  // The 404 page is served from arbitrary URLs, so it uses the absolute base path.
  const depth = path ? path.split('/').filter(Boolean).length : 0;
  const root = page === 'notfound' ? cfg.basePath : depth ? '../'.repeat(depth) : './';
  const canonical = cfg.siteUrl + path;
  const fullTitle = title === SITE_NAME ? `${SITE_NAME} — Free, private online tools` : `${title} · ${SITE_NAME}`;
  const v = `?v=${cfg.version}`;

  return `<!doctype html>
<html lang="en" data-root="${root}" data-page="${page}"${toolId ? ` data-tool="${esc(toolId)}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
${noindex ? '' : `<meta property="og:url" content="${esc(canonical)}">`}
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f7f7fb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d0f15" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${root}assets/icons/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/css/main.css${v}">
<script src="${root}js/boot.js${v}"></script>
<script type="module" src="${root}js/app.js${v}"></script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
${header(root, current)}
<main id="main" tabindex="-1">
${main(root)}
</main>
${footer(root, cfg)}
<div id="toasts" class="toasts" aria-live="polite" aria-atomic="false"></div>
</body>
</html>
`;
}

function breadcrumb(root, items) {
  const lis = items.map(([label, href], i) =>
    i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${root}${href}">${esc(label)}</a></li>`
  ).join('');
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${lis}</ol></nav>`;
}

function breadcrumbLd(cfg, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: cfg.siteUrl + href }))
  };
}

/* ------------------------------------------------------------------ */

export function homePage(cfg) {
  const readyCount = tools.length;
  const picks = editorsPicks.map(getTool).filter(Boolean);
  return layout(cfg, {
    path: '',
    page: 'home',
    title: SITE_NAME,
    description: `Free, private online tools that run in your browser: word counter, text diff, Markdown editor, case converter, text cleanup and more. No sign-up, no uploads.`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: cfg.siteUrl },
    main: (root) => `
<section class="hero">
  <div class="container hero__inner">
    <p class="eyebrow">${iconSvg('lock', { size: 16 })} Free · Private · No sign-up</p>
    <h1>Everyday tools, <span class="grad-text">neatly nested</span> in one place.</h1>
    <p class="lead">Count, convert, clean up and organise — right in your browser. Nothing to install and nothing uploaded.</p>
    <form class="hero-search" role="search" action="${root}tools/" method="get">
      <label for="home-search" class="visually-hidden">Search tools</label>
      ${iconSvg('search', { size: 20 })}
      <input id="home-search" name="q" type="search" placeholder="Search tools — try “word count” or “sort”" autocomplete="off" enterkeyhint="search">
      <kbd class="kbd-hint js-only">Ctrl K</kbd>
    </form>
    <ul class="hero-facts">
      <li><strong>${readyCount}</strong> working tools</li>
      <li><strong>${categories.length}</strong> categories</li>
      <li><strong>${plannedTools.length}</strong> more on the roadmap</li>
    </ul>
  </div>
</section>
<div class="container home">
  <section id="home-results" class="home-section" hidden>
    <div class="section-head"><h2 id="home-results-title">Search results</h2></div>
    <ul class="card-grid" data-list></ul>
    <div class="empty-state" data-empty hidden></div>
  </section>
  <div id="dashboard">
    <section class="home-section" data-section="favorites" hidden>
      <div class="section-head"><h2>${iconSvg('star', { size: 20 })} Favorite tools</h2></div>
      <ul class="card-grid" data-list></ul>
    </section>
    <section class="home-section" data-section="recent" hidden>
      <div class="section-head"><h2>${iconSvg('clock', { size: 20 })} Recently used</h2><button class="btn btn--ghost btn--sm" type="button" data-action="clear-history">Clear history</button></div>
      <ul class="card-grid" data-list></ul>
    </section>
    <section class="home-section" data-section="mostUsed" hidden>
      <div class="section-head"><h2>${iconSvg('trending', { size: 20 })} Your most used</h2><p class="section-note">Counted only on this device</p></div>
      <ul class="card-grid" data-list></ul>
    </section>
    <section class="home-section" data-section="picks">
      <div class="section-head"><h2>${iconSvg('sparkle', { size: 20 })} Editor’s picks</h2><p class="section-note">Editorial recommendations, not usage statistics</p></div>
      <ul class="card-grid">${picks.map((t) => toolCardHtml(t, root)).join('')}</ul>
    </section>
  </div>
  <section id="categories" class="home-section">
    <div class="section-head"><h2>${iconSvg('grid', { size: 20 })} Browse by category</h2><a class="link-arrow" href="${root}tools/">Full directory ${iconSvg('arrowRight', { size: 16 })}</a></div>
    <ul class="cat-grid">${categories.map((c) => categoryCardHtml(c, root)).join('')}</ul>
  </section>
  <section class="home-section values" aria-labelledby="values-title">
    <h2 id="values-title" class="visually-hidden">Why ToolNest</h2>
    <div class="value-card">${iconSvg('lock', { size: 22 })}<h3>Private by design</h3><p>Tools process your input inside this browser tab. There are no accounts, analytics or ad trackers.</p></div>
    <div class="value-card">${iconSvg('sparkle', { size: 22 })}<h3>Free to use and host</h3><p>A static site with no server or database, published at no cost on GitHub Pages.</p></div>
    <div class="value-card">${iconSvg('check-square', { size: 22 })}<h3>Honest about status</h3><p>Only working tools get a page. Everything else is clearly marked as planned.</p></div>
  </section>
</div>`
  });
}

export function directoryPage(cfg) {
  return layout(cfg, {
    path: 'tools/',
    page: 'directory',
    current: 'directory',
    title: 'All tools',
    description: `Browse every ${SITE_NAME} tool by category, including working tools and the public roadmap of planned tools.`,
    main: (root) => `
<div class="container page">
  ${breadcrumb(root, [['Home', ''], ['All tools', 'tools/']])}
  <header class="page-header">
    <h1>Tool directory</h1>
    <p class="lead">${tools.length} working tools across ${categories.length} categories, plus ${plannedTools.length} planned tools on the roadmap.</p>
  </header>
  <div class="filter-bar js-only" role="search">
    <label class="input-with-icon">
      <span class="visually-hidden">Filter tools</span>
      ${iconSvg('search', { size: 18 })}
      <input id="directory-filter" type="search" placeholder="Filter tools…" autocomplete="off">
    </label>
    <div class="chip-row" role="group" aria-label="Filter by category">
      <button class="chip" type="button" data-cat="" aria-pressed="true">All</button>
      ${categories.map((c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.short)}</button>`).join('')}
    </div>
    <label class="check"><input type="checkbox" id="directory-show-planned" checked> Show planned tools</label>
  </div>
  <p class="filter-status" id="directory-status" role="status"></p>
  ${categories.map((c) => {
    const ready = toolsInCategory(c.id);
    const planned = plannedInCategory(c.id);
    return `<section class="dir-section" data-cat-section="${c.id}" aria-labelledby="dir-${c.id}">
    <div class="section-head"><h2 id="dir-${c.id}">${iconSvg(c.icon, { size: 20 })} <a href="${root}category/${c.id}/">${esc(c.name)}</a></h2><p class="section-note">${ready.length} ready${planned.length ? ` · ${planned.length} planned` : ''}</p></div>
    ${ready.length ? `<ul class="card-grid">${ready.map((t) => toolCardHtml(t, root)).join('')}</ul>` : '<p class="muted dir-none">No working tools in this category yet.</p>'}
    ${planned.length ? `<details class="planned" data-planned><summary>Planned (${planned.length})</summary>${plannedListHtml(planned)}</details>` : ''}
  </section>`;
  }).join('\n')}
  <div class="empty-state" id="directory-empty" hidden>
    ${iconSvg('search', { size: 28 })}
    <h2>No tools match your filter</h2>
    <p>Try a shorter word, a synonym such as “count” or “sort”, or choose another category.</p>
  </div>
</div>`
  });
}

export function categoryPage(cfg, category) {
  const ready = toolsInCategory(category.id);
  const planned = plannedInCategory(category.id);
  const crumbs = [['Home', ''], ['All tools', 'tools/'], [category.name, `category/${category.id}/`]];
  return layout(cfg, {
    path: `category/${category.id}/`,
    page: 'category',
    current: `category:${category.id}`,
    title: `${category.name} tools`,
    description: `${category.description} ${ready.length ? `${ready.length} free tools that run privately in your browser.` : 'Tools in this category are on the roadmap.'}`,
    jsonLd: breadcrumbLd(cfg, crumbs),
    main: (root) => `
<div class="container page">
  ${breadcrumb(root, crumbs)}
  <header class="page-header page-header--icon">
    <span class="page-header__icon">${iconSvg(category.icon, { size: 28 })}</span>
    <div><h1>${esc(category.name)}</h1><p class="lead">${esc(category.description)}</p></div>
  </header>
  ${ready.length
    ? `<section class="home-section"><div class="section-head"><h2>Ready to use</h2></div><ul class="card-grid">${ready.map((t) => toolCardHtml(t, root)).join('')}</ul></section>`
    : `<div class="empty-state">${iconSvg('clock', { size: 28 })}<h2>No working tools here yet</h2><p>This category is on the roadmap. The tools below are planned but not built, so they have no pages yet.</p><a class="btn btn--primary" href="${root}tools/">Browse working tools</a></div>`}
  ${planned.length ? `<section class="home-section">
    <div class="section-head"><h2>On the roadmap</h2><p class="section-note">Planned — not available yet</p></div>
    ${plannedListHtml(planned)}
  </section>` : ''}
</div>`
  });
}

export function toolPage(cfg, tool) {
  const category = getCategory(tool.category);
  const crumbs = [['Home', ''], [category.name, `category/${category.id}/`], [tool.name, tool.route]];
  const related = relatedTools(tool.id);
  const doc = docsFor(tool.id);
  return layout(cfg, {
    path: tool.route,
    page: 'tool',
    toolId: tool.id,
    current: `category:${category.id}`,
    title: tool.name,
    description: doc.seoDescription || tool.description,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: tool.name,
        description: tool.description,
        url: cfg.siteUrl + tool.route,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any modern web browser',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }
      },
      breadcrumbLd(cfg, crumbs)
    ],
    main: (root) => `
<div class="container page page--tool">
  ${breadcrumb(root, crumbs)}
  <header class="tool-header">
    <span class="tool-header__icon">${iconSvg(tool.icon, { size: 28 })}</span>
    <div class="tool-header__text">
      <h1>${esc(tool.name)}</h1>
      <p class="lead">${esc(tool.description)}</p>
    </div>
    <button class="btn btn--secondary fav-toggle js-only" type="button" data-fav="${tool.id}" aria-pressed="false">${iconSvg('star', { size: 18 })}<span data-fav-label>Add to favorites</span></button>
  </header>
  <section id="tool-root" class="tool-root" aria-label="${esc(tool.name)}">
    <div class="tool-loading" role="status"><span class="spinner" aria-hidden="true"></span>Loading tool…</div>
    <noscript><div class="notice notice--warn">${iconSvg('alert', { size: 18 })}<p>This tool runs in your browser and needs JavaScript. Please enable JavaScript and reload the page.</p></div></noscript>
  </section>
  <div class="tool-info">
    <section class="info-card"><h2>${iconSvg('book', { size: 18 })} How to use</h2><ol>${doc.instructions.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
    <section class="info-card"><h2>${iconSvg('bulb', { size: 18 })} How it works</h2><p>${esc(doc.about)}</p></section>
    ${doc.limitations.length ? `<section class="info-card"><h2>${iconSvg('info', { size: 18 })} Limitations</h2><ul>${doc.limitations.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>` : ''}
    <section class="info-card info-card--privacy"><h2>${iconSvg('lock', { size: 18 })} Privacy</h2><p>${esc(doc.privacy)}</p><p class="muted">${LOCAL_NOTE}</p></section>
  </div>
  ${related.length ? `<section class="home-section related"><div class="section-head"><h2>Related tools</h2></div><ul class="card-grid">${related.map((t) => toolCardHtml(t, root)).join('')}</ul></section>` : ''}
</div>`
  });
}

function prosePage(cfg, { path, title, description, current, body }) {
  return layout(cfg, {
    path,
    page: 'static',
    current,
    title,
    description,
    main: (root) => `
<div class="container page">
  ${breadcrumb(root, [['Home', ''], [title, path]])}
  <article class="prose">${body(root)}</article>
</div>`
  });
}

export function aboutPage(cfg) {
  return prosePage(cfg, {
    path: 'about/',
    title: 'About',
    current: 'about',
    description: `What ${SITE_NAME} is, how it is built, and how to get in touch.`,
    body: (root) => `
<h1>About ${SITE_NAME}</h1>
<p class="lead">${SITE_NAME} is a growing collection of everyday tools for students, developers, office workers, designers and creators — built to be genuinely useful, free and private.</p>
<h2>Principles</h2>
<ul>
  <li><strong>Local first.</strong> Tools run in your browser. Your text and files are not uploaded to a server.</li>
  <li><strong>No accounts.</strong> Every tool works without signing up. Favorites and settings stay on your device.</li>
  <li><strong>Honest.</strong> Only working tools get a page. Planned tools are labelled “Planned”, and there are no invented statistics or reviews.</li>
  <li><strong>Lightweight.</strong> The site is plain HTML, CSS and JavaScript with no frameworks, so it loads quickly on modest phones and laptops.</li>
</ul>
<h2>How it is built</h2>
<p>The site is generated as static files from a central tool registry and published on GitHub Pages, which costs nothing. There is no backend, no database and no paid service. Each tool is a small JavaScript module that is loaded only on its own page.</p>
<h2 id="libraries">Third-party libraries</h2>
<p>The current release uses <strong>no third-party libraries</strong> — only standard browser features such as Web Workers, the Clipboard API, <code>Intl</code> and Web Crypto. When future tools need a library (for example, PDF processing), it will be listed here with its licence, and it will load only on the pages that need it.</p>
<h2 id="contact">Contact</h2>
${cfg.repoUrl
    ? `<p>${SITE_NAME} has no mailbox or contact form, because it has no server. To report a bug, suggest a tool or ask a question, open an issue on the <a href="${esc(cfg.repoUrl)}/issues" rel="noopener">public issue tracker</a>. Please don’t include personal or sensitive information there — issues are public.</p>`
    : `<p>${SITE_NAME} has no mailbox or contact form, because it has no server. The person who published this copy has not configured a public issue tracker yet.</p>`}
<p><a href="${root}privacy/">Read the privacy notice</a> · <a href="${root}help/">Help &amp; shortcuts</a></p>`
  });
}

export function privacyPage(cfg) {
  return prosePage(cfg, {
    path: 'privacy/',
    title: 'Privacy',
    current: 'privacy',
    description: `How ${SITE_NAME} handles your data: local processing, no accounts, no tracking, and what is stored on your device.`,
    body: () => `
<h1>Privacy notice</h1>
<p class="lead">Short version: your text and files stay in your browser, and there is no tracking.</p>
<h2>What we do not collect</h2>
<ul>
  <li>No accounts, names or email addresses.</li>
  <li>No analytics, advertising or tracking scripts, and no cookies set by ${SITE_NAME}.</li>
  <li>Text and files you use in tools are processed inside your browser tab and are not sent to any server.</li>
</ul>
<h2>What is stored on your device</h2>
<p>To remember your preferences, ${SITE_NAME} saves a small amount of data in your browser’s local storage, under keys starting with <code>toolnest:</code>:</p>
<ul>
  <li>Theme, accent colour, motion and dashboard settings.</li>
  <li>Your favorite tools.</li>
  <li>Recently used tools and how many times you opened each tool (used only for the “Your most used” section).</li>
  <li>Your Markdown draft, only if you switch on draft saving in the Markdown editor.</li>
</ul>
<p>Tool inputs such as text you paste are <strong>not</strong> saved. The one exception is opt-in: if you turn on “Save my draft in this browser” in the Markdown editor, your draft is kept in local storage until you turn the option off, which deletes it. You can export, import or delete all stored data at any time from <strong>Settings → Your data</strong>. This data never leaves your device, so it does not sync between browsers or devices, and it disappears if you clear your browser’s site data.</p>
<h2>Hosting</h2>
<p>The site is hosted on GitHub Pages. Like any web host, GitHub may process technical information such as your IP address when your browser requests pages. See GitHub’s privacy statement for details. ${SITE_NAME} itself does not receive or log this information.</p>
<h2>Limits of local processing</h2>
<p>Processing data locally avoids uploading it, but it does not make your device secure. Malware, untrusted browser extensions or someone with access to your device could still see what you type. Use a trusted device for sensitive material.</p>`
  });
}

export function helpPage(cfg) {
  return prosePage(cfg, {
    path: 'help/',
    title: 'Help & shortcuts',
    current: 'help',
    description: `How to search, favorite tools, use keyboard shortcuts, change the theme and back up your ${SITE_NAME} settings.`,
    body: (root) => `
<h1>Help &amp; shortcuts</h1>
<p class="lead">Everything you need to get the most out of ${SITE_NAME}.</p>
<h2>Finding tools</h2>
<ul>
  <li>Use the search box on the <a href="${root}">home page</a>, or press <kbd>Ctrl</kbd> + <kbd>K</kbd> (<kbd>⌘</kbd> + <kbd>K</kbd> on a Mac) anywhere to open quick search.</li>
  <li>Search understands names, descriptions, categories and common synonyms — “alphabetize” finds Sort Lines, and “dedupe” finds Remove Duplicate Lines.</li>
  <li>The <a href="${root}tools/">tool directory</a> lists every tool by category, with filters.</li>
</ul>
<h2>Keyboard shortcuts</h2>
<table class="table">
  <thead><tr><th scope="col">Shortcut</th><th scope="col">Action</th></tr></thead>
  <tbody>
    <tr><td><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd></td><td>Open quick search</td></tr>
    <tr><td><kbd>/</kbd></td><td>Open quick search (when not typing in a field)</td></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Move through search results</td></tr>
    <tr><td><kbd>Enter</kbd></td><td>Open the selected tool</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Close search, settings or the menu</td></tr>
    <tr><td><kbd>Tab</kbd></td><td>Move between controls; a visible outline shows where you are</td></tr>
  </tbody>
</table>
<h2>Favorites and history</h2>
<p>Select the star on any tool to add it to your favorites; they appear at the top of the home page. Tools you open are listed under “Recently used”. Both are stored only in this browser.</p>
<h2>Themes and appearance</h2>
<p>Use the sun/moon button to switch between light and dark themes, or open <strong>Settings</strong> to follow your system theme, pick an accent colour, reduce motion or choose which home-page sections to show.</p>
<h2>Backing up your data</h2>
<p>Open <strong>Settings → Your data</strong> to export your settings and favorites as a JSON file, import them on another browser, or delete everything. Browser data can disappear if you clear site data or use private browsing, so export a copy if it matters to you.</p>
<h2>Troubleshooting</h2>
<ul>
  <li><strong>A tool keeps showing “Loading tool…”</strong> — make sure JavaScript is enabled and reload. Very old browsers are not supported; use a current version of Chrome, Edge, Firefox or Safari.</li>
  <li><strong>Settings are not remembered</strong> — your browser may be blocking site storage (common in private windows). The app will say so in Settings.</li>
  <li><strong>Copy does not work</strong> — some browsers only allow clipboard access on secure (https) pages. Select the text and press <kbd>Ctrl</kbd> + <kbd>C</kbd> instead.</li>
</ul>`
  });
}

export function notFoundPage(cfg) {
  return layout(cfg, {
    path: '404.html',
    page: 'notfound',
    noindex: true,
    title: 'Page not found',
    description: 'The page you were looking for does not exist.',
    main: (root) => `
<div class="container page">
  <div class="empty-state empty-state--large">
    <span class="big-code" aria-hidden="true">404</span>
    <h1>We couldn’t find that page</h1>
    <p>The link may be mistyped, or the tool may not exist yet. Planned tools don’t have pages until they are ready.</p>
    <div class="btn-row">
      <a class="btn btn--primary" href="${root}">${iconSvg('home', { size: 18 })} Go to home</a>
      <a class="btn btn--secondary" href="${root}tools/">${iconSvg('grid', { size: 18 })} Browse all tools</a>
    </div>
  </div>
</div>`
  });
}
