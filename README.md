# ToolNest Ultimate

A free, private, all-in-one collection of browser-based tools. It's a static website with no backend, database, accounts or tracking, and it costs ₹0 to host on GitHub Pages.

**Current release (stage 3):** the full application shell plus 34 working tools — 14 text and content tools, 12 math tools (scientific calculator, percentages, fractions, ratios, statistics, primes, GCD/LCM, factorials, random numbers, number bases, Roman numerals and a 10-category unit converter), 7 developer utilities (JSON, Base64, UUID, hashes, Unix timestamps, JWT, regex) and a colour converter. See [docs/FEATURES.md](docs/FEATURES.md) for the full checklist and roadmap.

---

## 1. Architecture

| Decision | Why |
|---|---|
| **Plain HTML + CSS + JavaScript ES modules, no framework** | React + Vite would add a build toolchain, `node_modules`, and ~45 KB of runtime for little benefit. Tools here are self-contained forms. Native modules load fine on every current browser. |
| **A small Node script pre-renders every page** (`scripts/build.mjs`) | Each tool gets a real, crawlable HTML page with a unique title, description, canonical URL, instructions, and related links, so search engines see content without running JavaScript. |
| **One central tool registry** (`src/js/core/registry.js`) | It feeds the build (pages, sitemap), search, navigation, related tools, and the roadmap. Adding a tool means adding one registry entry and one module. |
| **Tools load on demand** | Each tool page imports only its own module (`src/js/tools/<id>.js`). The home page never loads tool code. |
| **Web Workers for heavy or risky work** | Find & Replace and Text Diff run in workers with a time limit (`src/js/ui/worker-runner.js`), so a runaway regular expression or a huge comparison can't freeze the page. |
| **Relative links everywhere** | The same build works at `https://you.github.io/any-repo-name/` or at a domain root. |
| **Strict Content Security Policy** | `script-src 'self'`: no inline scripts, no third-party code, no `eval`. |
| **localStorage for settings, favorites and history** | All access goes through a safe wrapper that falls back to memory and says so honestly when storage is blocked or full. IndexedDB will be added when a tool needs larger storage (notes, flashcards). |

Initial JavaScript on the home page is **about 23 KB gzipped** in total, and the CSS is about 8 KB gzipped.

## 2. Folder structure

```
toolnest-ultimate/
├── .github/workflows/deploy.yml   Free GitHub Actions deploy to Pages
├── docs/FEATURES.md               Feature checklist + manual test plan
├── scripts/                       Node-only build tooling (never shipped)
│   ├── build.mjs                  Static site generator → dist/
│   ├── templates.mjs              HTML templates for every page type
│   ├── config.mjs                 SITE_URL / REPO_URL handling
│   ├── serve.mjs                  Local server that behaves like GitHub Pages
│   └── dev.mjs                    Build + serve + rebuild on save
├── src/                           Everything the browser receives
│   ├── assets/css/main.css        Design system (themes, accents, components)
│   ├── assets/icons/favicon.svg
│   └── js/
│       ├── boot.js                Applies saved theme before first paint
│       ├── app.js                 Entry: header, favorites, shortcuts, page loader
│       ├── core/                  Shared by browser AND build (no DOM)
│       │   ├── registry.js        ★ All categories, tools, and roadmap items
│       │   ├── tool-docs.js       Each tool's help text (build-time only)
│       │   ├── search.js          Local ranked search with synonyms
│       │   ├── storage.js         Safe localStorage wrapper
│       │   ├── prefs.js           Settings, favorites, history, export/import
│       │   ├── icons.js           In-house SVG icon set
│       │   └── markup.js          Card HTML shared by build and browser
│       ├── lib/                   Pure, unit-tested logic: text, diff (Myers),
│       │                          markdown, html, url, lorem, expression,
│       │                          math, units, json, encoding, uuid, hash,
│       │                          time, jwt, regex, color
│       ├── ui/                    Browser UI modules
│       │   ├── toolkit.js         Reusable tool components (copy, download, clear+undo…)
│       │   ├── worker-runner.js   Time-limited Web Worker jobs with main-thread fallback
│       │   ├── palette.js         Ctrl+K command palette
│       │   ├── settings.js        Settings dialog and data controls
│       │   ├── home.js / directory.js / tool-page.js
│       │   └── theme.js / toast.js
│       ├── tools/                 One module per tool, loaded on demand
│       └── workers/               Web Workers
├── tests/                         Node built-in test runner (no dependencies)
└── dist/                          Build output (generated, not committed)
```

## 3. Dependencies

**Runtime: none.** No npm packages are shipped to the browser.

**Development: none from npm either.** You only need [Node.js](https://nodejs.org/) 20 or newer, which runs the build script, the local server, and the tests through its built-in `node:test` runner. There's no `npm install` step.

Future tools that genuinely need a library (for example PDF processing) will load it only on that tool's page. Each one will be listed with its licence on the About page and in `docs/FEATURES.md`.

## 4. Why it stays free

- **Hosting:** GitHub Pages is free for public repositories and serves static files over HTTPS.
- **Build:** GitHub Actions is free for public repositories, and this workflow takes well under a minute.
- **No server costs:** there's no backend, database, or paid API. All processing happens in the visitor's browser.
- **No domain needed:** the site works at `https://<username>.github.io/<repository>/`.

Free-tier limits to know about: a published Pages site can be up to 1 GB, and there's a soft bandwidth limit of 100 GB per month. GitHub Pages is not intended for commercial SaaS or e-commerce sites. This project uses a tiny fraction of those limits.

---

## 5. Windows setup (step by step)

### 5.1 Install the tools (one time)

1. **Node.js LTS:** download the Windows installer from https://nodejs.org/ and accept the defaults. Or, in PowerShell:
   ```bash
   winget install OpenJS.NodeJS.LTS
   ```
2. **Git:** download from https://git-scm.com/download/win and accept the defaults. Or:
   ```bash
   winget install Git.Git
   ```
3. Close and reopen your terminal, then check both are installed:
   ```bash
   node --version
   ```
   ```bash
   git --version
   ```
   Node should report `v20` or higher.

### 5.2 Run the site locally

Open a terminal in the project folder, then run:

```bash
npm run dev
```

Open **http://localhost:5173/** in your browser. Edits to files in `src/` or `scripts/` rebuild automatically; refresh the page to see them. Each rebuild is written to a staging folder and swapped in at the end, so a refresh never catches a half-built site. Press `Ctrl + C` to stop.

> Opening `dist/index.html` by double-clicking won't work properly. Browsers block ES modules and workers on `file://` pages, so always use the local server.

### 5.3 Run the tests

```bash
npm test
```

This runs 119 automated tests: every calculator formula and unit conversion against reference values (round-trips across all units, Miller–Rabin edge cases, exact factorials), hashes against published RFC/FIPS test vectors, JSON error positions, time zones with daylight saving, plus text, diff, Markdown, HTML and URL algorithms (including Markdown safety against scripts and `javascript:` links), search ranking, storage failure handling, import validation, and checks on the generated pages (unique titles, relative links, sitemap, CSP, 404 behaviour).

### 5.4 Test exactly like GitHub Pages (with a sub-path)

```bash
npm run preview:pages
```

Open **http://localhost:5173/toolnest-ultimate/**. This serves the site under a repository-style sub-path. If everything works here, it will work on GitHub Pages. (Don't run this and `npm run dev` at the same time, because both write to `dist/`.)

### 5.5 Build the production files

```bash
npm run build
```

The finished static site is written to `dist/`. You rarely need this yourself, because the GitHub workflow builds the site for you.

---

## 6. Publish to GitHub Pages (free)

1. Create a free account at https://github.com if you don't have one.
2. Click **New repository**, name it (for example `toolnest-ultimate`), choose **Public**, and leave "Add a README" **unchecked**.
3. In your project folder, run these commands one at a time (replace `YOUR-NAME`):
   ```bash
   git init
   ```
   ```bash
   git add .
   ```
   ```bash
   git commit -m "Initial ToolNest Ultimate release"
   ```
   ```bash
   git branch -M main
   ```
   ```bash
   git remote add origin https://github.com/YOUR-NAME/toolnest-ultimate.git
   ```
   ```bash
   git push -u origin main
   ```
   Git will open a browser window to sign in to GitHub the first time.
4. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Open the **Actions** tab. The "Deploy to GitHub Pages" workflow runs tests, builds, and publishes the site. If it ran before you changed the setting and failed, click **Re-run all jobs**.
6. Your site is live at `https://YOUR-NAME.github.io/toolnest-ultimate/`.

The workflow detects your Pages address automatically, so canonical URLs, the sitemap, and the 404 page are always correct, even if you rename the repository. The About page's contact link points to your repository's public **Issues** tab.

### Updating the live site

Make your changes, check them with `npm run dev` and `npm test`, then run:

```bash
git add .
```
```bash
git commit -m "Describe your change"
```
```bash
git push
```

The site redeploys in about a minute. Browsers may cache old files for up to 10 minutes; press `Ctrl + F5` to force a refresh.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| **Blank page or unstyled page on GitHub Pages** | Check that Settings → Pages → Source is **GitHub Actions**, not "Deploy from a branch". The `dist/` folder isn't committed, so branch deploys have nothing to serve. |
| **Workflow fails at "Run tests"** | Run `npm test` locally, fix the failing test, then push again. |
| **Workflow fails at "deploy" with a permissions error** | Settings → Pages → Source must be **GitHub Actions**. Then re-run the workflow. |
| **404 for every page** | Wait 1–2 minutes after the first deploy. Then check the exact URL in Settings → Pages; it's case-sensitive. |
| **Tools stuck on "Loading tool…"** | Open the browser console (F12). If you opened the file directly from disk, use `npm run dev` instead. Very old browsers without ES-module support aren't supported. |
| **Old version still showing** | Press `Ctrl + F5`. CSS and the app script are cache-busted automatically on each build. |
| **`npm` isn't recognised** | Reinstall Node.js and reopen the terminal so the PATH updates. |
| **Port 5173 is in use** | Run `node scripts/dev.mjs --port 5180` and open that port instead. |
| **robots.txt has no effect** | Search engines only read `robots.txt` at a domain's root. On `username.github.io/repo/` it's ignored, but the sitemap can still be submitted in Google Search Console. |

---

## 8. Adding a new tool

1. Add an entry to the `readyTools` array in `src/js/core/registry.js` with `id`, `name`, `category`, `icon`, `description`, `tags`, and `related`, and remove the matching item from `roadmap`. Then add its help text to `src/js/core/tool-docs.js`: `seoDescription`, `instructions`, `about`, `limitations`, and optionally `privacy`. Help text lives in that separate file because only the build reads it, so it never adds weight to the JavaScript every page loads.
2. Put any pure logic in `src/js/lib/` and add tests for it in `tests/`.
3. Create `src/js/tools/<id>.js` that exports `mount(container, { tool })`. Build the interface from the helpers in `src/js/ui/toolkit.js` (text areas, copy, download, clear-with-undo, examples, and status messages).
4. Run `npm test`. The registry tests confirm the tool is complete and that its module exists, and the build then generates its page, sitemap entry, and search entry automatically.

## 9. Security and privacy notes

- User text is only ever inserted with `textContent`, never with `innerHTML`.
- The Content Security Policy forbids inline and third-party scripts.
- Tool inputs aren't stored or logged. Only settings, favorites, and tool-usage history are kept in `localStorage`, and users can export or delete them in Settings.
- Local processing protects data from being uploaded, but it doesn't protect against a compromised device or malicious browser extensions. The site says this on every tool page.

## License

MIT. See [LICENSE](LICENSE).
