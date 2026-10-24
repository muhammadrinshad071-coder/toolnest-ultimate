# Feature checklist

Legend: ✅ done and tested · 🧪 done, verified manually (no automated test) · ⏳ planned · 🚫 not supported (with reason)

Last updated: stage 3.

## Application shell

| Feature | Status | Notes |
|---|---|---|
| Static build with pre-rendered pages for each tool and category | ✅ | `tests/build.test.mjs` |
| Unique titles, descriptions, canonical URLs, Open Graph | ✅ | Automated uniqueness test |
| Sitemap, robots.txt, `.nojekyll`, 404 page | ✅ | 404 uses the absolute base path so it works at any URL depth |
| JSON-LD (WebSite, WebApplication, BreadcrumbList) | ✅ | Only factual fields, with no ratings or reviews |
| Responsive header, category strip, mobile menu | 🧪 | Checked at 320 px, 375 px, and desktop with no horizontal overflow |
| Home dashboard: favorites, recently used, most used (local), editor's picks | 🧪 | "Most used" appears after two or more tools have been used; picks are labelled as editorial |
| Tool directory with text filter, category chips, planned toggle, shareable URL (`?q=&cat=`) | 🧪 | |
| Category pages with honest "planned" roadmap | ✅ | Planned tools never get pages (automated test) |
| About, Privacy, Help & shortcuts pages | ✅ | Contact = public issue tracker when `REPO_URL` is set; no invented contact details |
| Light / dark / system theme with no flash on load | 🧪 | |
| Accent colours (7), reduced-motion option | 🧪 | Light-theme accents meet 4.5:1 contrast on white |
| Settings dialog | 🧪 | |
| Toast notifications with Undo actions | 🧪 | |
| Keyboard: skip link, visible focus rings, Esc closes menus and dialogs | 🧪 | |
| Content Security Policy (`script-src 'self'`) | ✅ | Automated check for inline scripts |
| GitHub Pages sub-path support | ✅ 🧪 | Automated relative-link test plus a manual check with `npm run preview:pages` |

## Search and discovery

| Feature | Status | Notes |
|---|---|---|
| Ranked local search: names, descriptions, categories, tags and synonyms | ✅ | `tests/search-registry.test.mjs` |
| Typo tolerance (subsequence match) | ✅ | "wrdcntr" finds Word Counter |
| Command palette (Ctrl+K / ⌘K / `/`) with arrow keys and Enter | 🧪 | Accessible combobox + listbox in a native `<dialog>` |
| Category results and planned matches in the palette | 🧪 | Planned results are disabled and labelled "Planned" |
| Instant home-page search with empty state | 🧪 | |
| Favorites and recent tools rank higher | 🧪 | |

## Personal data (local only)

| Feature | Status | Notes |
|---|---|---|
| Favorites, recent tools, usage counts | ✅ | |
| Export / import as JSON, with validation | ✅ | Rejects foreign or newer files and sanitises every field |
| Clear history, delete all data | ✅ | Confirmation before deleting everything |
| Storage failure handling (blocked, quota full, corrupted) | ✅ | Falls back to memory and tells the user it won't persist |
| Cross-tab sync | 🧪 | Uses the `storage` event |
| Opt-in Markdown draft saving | ✅ 🧪 | Off by default; turning it off deletes the saved draft; storage errors are reported |
| IndexedDB for large data | ⏳ | Arrives with notes and flashcards (stage 4) |

## Text tools (stage 1)

| Tool | Status | Covers from the brief |
|---|---|---|
| Word & Character Counter | ✅ | Word, character, sentence, and paragraph counters; reading time; text statistics; assignment word count with goal; keyword density |
| Case Converter | ✅ | Uppercase, lowercase, title case, sentence case, plus capitalize, invert, camel, Pascal, snake, kebab, and constant case |
| Remove Duplicate Lines | ✅ | Keep first or last copy, ignore case or spaces, remove empty lines, duplicate report |
| Sort Lines | ✅ | A→Z, Z→A, natural, by length, numeric, reverse lines, crypto-random shuffle |
| Find & Replace | ✅ | Literal, whole-word, and regex modes; highlighted preview; worker with timeout |

## Text and content tools (stage 2)

| Tool | Status | Covers from the brief |
|---|---|---|
| Text Diff | ✅ | Text comparison and diff by lines, words, or characters; Myers algorithm in a worker with timeout; collapsible unchanged lines; copy/download as a patch |
| Markdown Editor & Preview | ✅ | Markdown editor and preview, Markdown-to-HTML (also listed under PDF & Documents in the brief), .html and .md downloads, opt-in draft saving |
| Text Cleanup | ✅ | Remove extra spaces, remove empty lines, text cleanup utility, join PDF line breaks, invisible characters, curly quotes, Unicode normalization |
| Add Prefix & Suffix | ✅ | Prefix and suffix tool (add or remove) |
| Line Numbers | ✅ | Line numbering (start, step, format, padding) and removing numbers |
| Slug Generator | ✅ | Slug generator with accents, separators, length limit, non-Latin scripts |
| Lorem Ipsum Generator | ✅ | Paragraphs, sentences or words as text or HTML |
| Text ↔ HTML Converter | ✅ | Text-to-HTML, HTML-to-text, HTML escaping. HTML is processed as text and never executed |
| URL Encoder & Decoder | ✅ | URL encoding and decoding (component, full URL, form), tolerant of malformed input. Listed under Developer |

"Reverse lines" is covered by Sort Lines (Reverse order mode).

Every tool has: a live result, Clear with Undo, Copy, Download, "Use as input" where it makes sense, examples, instructions, limitations, a privacy note, and related tools.

### Markdown support (subset, by design)

Supported: ATX and setext headings, paragraphs, hard breaks, bold, italic, strikethrough, inline code, fenced code, block quotes, nested lists, task lists, tables with alignment, links (including balanced parentheses), images, autolinks, and horizontal rules.
Not yet supported: raw HTML (shown as text for safety), footnotes, reference-style links, and 4-space indented code blocks. In the preview, images appear as labels so nothing is fetched from other sites.

## Math tools (stage 3)

Every item in the brief's Math & Conversion list is now covered, so that category has no roadmap left.

| Tool | Status | Covers from the brief |
|---|---|---|
| Scientific Calculator | ✅ | Basic and scientific calculator (safe parser, no eval), degree/radian modes, history |
| Percentage Calculator | ✅ | Percentage, percentage change, percentage difference, increase/decrease, reverse percentage (e.g. pre-GST price) |
| Fraction Calculator | ✅ | Fraction arithmetic with exact BigInt maths, mixed numbers, repeating decimals, decimal → fraction |
| Ratio & Proportion | ✅ | Ratio simplification, proportions, dividing an amount in a ratio |
| Statistics Calculator | ✅ | Averages, mean/median/mode, standard deviation (sample and population), variance, quartiles |
| Prime Number Checker | ✅ | Deterministic Miller–Rabin up to 10²⁴, factorization up to 10¹⁸, sieve up to 10⁷ |
| GCD & LCM | ✅ | GCD, LCM, Euclid steps |
| Factorial Calculator | ✅ | Exact factorials with a safe limit (10,000!) |
| Random Number Generator | ✅ | Unbiased crypto-random integers and decimals, no-repeat option |
| Number Base Converter | ✅ | Number base, binary and hexadecimal converters, two's complement |
| Roman Numeral Converter | ✅ | Both directions with strict validation |
| Unit Converter | ✅ | Length, weight, temperature, area, volume, speed, time, digital storage, pressure, energy (exact definitions, every unit pair round-trip tested) |

## Developer and colour tools (stage 3)

| Tool | Status | Notes |
|---|---|---|
| JSON Formatter & Validator | ✅ | Own strict parser: exact error line and column, keeps large numbers exact, duplicate-key warnings |
| Base64 Encoder & Decoder | ✅ | UTF-8 text, files up to 50 MB, URL-safe, data URIs, decoded file type detection and image preview |
| UUID Generator | ✅ | v4 and v7, bulk, formats, inspector (version, variant, embedded time) |
| Hash Generator | ✅ | MD5 (RFC 1321 vectors), SHA-1/256/384/512 and HMAC via Web Crypto, files up to 500 MB, checksum comparison. Also covers "Text hashing" and "File hashing" from Privacy & Security |
| Unix Timestamp Converter | ✅ | s/ms/µs/ns detection, any IANA time zone, daylight saving, ISO week, live clock |
| JWT Decoder | ✅ | Decodes only, with a prominent "not verified" warning, expiry status and readable dates |
| Regex Tester | ✅ | Flags, groups, named groups, replacement preview, 2-second worker timeout |
| Color Converter | ✅ | HEX, RGB, HSL, HWB, OKLCH, HSV, CMYK, nearest CSS name, WCAG contrast. Listed under Design & Color |

## Not supported, by design

| Item | Reason |
|---|---|
| Live exchange rates, trends, DNS lookups, website testing | Would need a paid or third-party service. Planned alternatives use manually entered values or offline references. |
| AI-generated content | No free, private, offline option. Templates will be used instead and labelled as templates. |
| Account sync | No backend, so the site won't simulate one. Export and import cover moving data between browsers. |
| Old browsers without ES modules (IE11, pre-2018) | Script-only controls stay hidden there. Static content and instructions still render. |

## Planned stages

1. ✅ **Stage 1:** shell, search, personalization, 5 text tools, tests, deployment.
2. ✅ **Stage 2:** text diff, Markdown editor, text cleanup, prefix/suffix, line numbers, slug generator, lorem ipsum, text ↔ HTML, URL encoder. Still planned in Text: reverse text, text templates, text-to-speech, speech-to-text, and a basic spelling check.
3. ✅ **Stage 3:** 12 math tools (the full Math & Conversion list), JSON, Base64, UUID, hash, timestamp, JWT and regex tools, and a colour converter, with formula tests against reference values.
4. ⏳ **Stage 4:** productivity and student tools using IndexedDB (notes, to-dos, flashcards, Pomodoro, planners).
5. ⏳ **Stage 5:** image tools (Canvas + Web Worker), then PDF tools (pdf-lib, MIT licence, loaded only on PDF pages).
6. ⏳ **Stage 6:** PWA: manifest, PNG icons, service worker with versioned app-shell cache, offline page.
7. ⏳ Later: finance, date/time, network, data, social, audio and video.

---

## Manual test plan

**Stage 3 additions**
- [ ] Calculator: tap `(`, `1`, `+`, `2`, `)`, `^`, `2`, `=` (shows 9), then `+`, `1`, `=` (shows 10). Type `1/0` and press Enter: a clear error appears.
- [ ] Unit converter: open `/tools/unit-converter/?type=temperature&from=c&to=f` and enter 37. The result is 98.6 °F.
- [ ] Hash: hash a downloaded file and paste its published SHA-256. The row turns green and says "Match".
- [ ] JSON: paste invalid JSON and press "Show the error". The cursor jumps to the problem.
- [ ] Regex: pattern `(a+)+# Feature checklist

Legend: ✅ done and tested · 🧪 done, verified manually (no automated test) · ⏳ planned · 🚫 not supported (with reason)

Last updated: stage 3.

## Application shell

| Feature | Status | Notes |
|---|---|---|
| Static build with pre-rendered pages for each tool and category | ✅ | `tests/build.test.mjs` |
| Unique titles, descriptions, canonical URLs, Open Graph | ✅ | Automated uniqueness test |
| Sitemap, robots.txt, `.nojekyll`, 404 page | ✅ | 404 uses the absolute base path so it works at any URL depth |
| JSON-LD (WebSite, WebApplication, BreadcrumbList) | ✅ | Only factual fields, with no ratings or reviews |
| Responsive header, category strip, mobile menu | 🧪 | Checked at 320 px, 375 px, and desktop with no horizontal overflow |
| Home dashboard: favorites, recently used, most used (local), editor's picks | 🧪 | "Most used" appears after two or more tools have been used; picks are labelled as editorial |
| Tool directory with text filter, category chips, planned toggle, shareable URL (`?q=&cat=`) | 🧪 | |
| Category pages with honest "planned" roadmap | ✅ | Planned tools never get pages (automated test) |
| About, Privacy, Help & shortcuts pages | ✅ | Contact = public issue tracker when `REPO_URL` is set; no invented contact details |
| Light / dark / system theme with no flash on load | 🧪 | |
| Accent colours (7), reduced-motion option | 🧪 | Light-theme accents meet 4.5:1 contrast on white |
| Settings dialog | 🧪 | |
| Toast notifications with Undo actions | 🧪 | |
| Keyboard: skip link, visible focus rings, Esc closes menus and dialogs | 🧪 | |
| Content Security Policy (`script-src 'self'`) | ✅ | Automated check for inline scripts |
| GitHub Pages sub-path support | ✅ 🧪 | Automated relative-link test plus a manual check with `npm run preview:pages` |

## Search and discovery

| Feature | Status | Notes |
|---|---|---|
| Ranked local search: names, descriptions, categories, tags and synonyms | ✅ | `tests/search-registry.test.mjs` |
| Typo tolerance (subsequence match) | ✅ | "wrdcntr" finds Word Counter |
| Command palette (Ctrl+K / ⌘K / `/`) with arrow keys and Enter | 🧪 | Accessible combobox + listbox in a native `<dialog>` |
| Category results and planned matches in the palette | 🧪 | Planned results are disabled and labelled "Planned" |
| Instant home-page search with empty state | 🧪 | |
| Favorites and recent tools rank higher | 🧪 | |

## Personal data (local only)

| Feature | Status | Notes |
|---|---|---|
| Favorites, recent tools, usage counts | ✅ | |
| Export / import as JSON, with validation | ✅ | Rejects foreign or newer files and sanitises every field |
| Clear history, delete all data | ✅ | Confirmation before deleting everything |
| Storage failure handling (blocked, quota full, corrupted) | ✅ | Falls back to memory and tells the user it won't persist |
| Cross-tab sync | 🧪 | Uses the `storage` event |
| Opt-in Markdown draft saving | ✅ 🧪 | Off by default; turning it off deletes the saved draft; storage errors are reported |
| IndexedDB for large data | ⏳ | Arrives with notes and flashcards (stage 4) |

## Text tools (stage 1)

| Tool | Status | Covers from the brief |
|---|---|---|
| Word & Character Counter | ✅ | Word, character, sentence, and paragraph counters; reading time; text statistics; assignment word count with goal; keyword density |
| Case Converter | ✅ | Uppercase, lowercase, title case, sentence case, plus capitalize, invert, camel, Pascal, snake, kebab, and constant case |
| Remove Duplicate Lines | ✅ | Keep first or last copy, ignore case or spaces, remove empty lines, duplicate report |
| Sort Lines | ✅ | A→Z, Z→A, natural, by length, numeric, reverse lines, crypto-random shuffle |
| Find & Replace | ✅ | Literal, whole-word, and regex modes; highlighted preview; worker with timeout |

## Text and content tools (stage 2)

| Tool | Status | Covers from the brief |
|---|---|---|
| Text Diff | ✅ | Text comparison and diff by lines, words, or characters; Myers algorithm in a worker with timeout; collapsible unchanged lines; copy/download as a patch |
| Markdown Editor & Preview | ✅ | Markdown editor and preview, Markdown-to-HTML (also listed under PDF & Documents in the brief), .html and .md downloads, opt-in draft saving |
| Text Cleanup | ✅ | Remove extra spaces, remove empty lines, text cleanup utility, join PDF line breaks, invisible characters, curly quotes, Unicode normalization |
| Add Prefix & Suffix | ✅ | Prefix and suffix tool (add or remove) |
| Line Numbers | ✅ | Line numbering (start, step, format, padding) and removing numbers |
| Slug Generator | ✅ | Slug generator with accents, separators, length limit, non-Latin scripts |
| Lorem Ipsum Generator | ✅ | Paragraphs, sentences or words as text or HTML |
| Text ↔ HTML Converter | ✅ | Text-to-HTML, HTML-to-text, HTML escaping. HTML is processed as text and never executed |
| URL Encoder & Decoder | ✅ | URL encoding and decoding (component, full URL, form), tolerant of malformed input. Listed under Developer |

"Reverse lines" is covered by Sort Lines (Reverse order mode).

Every tool has: a live result, Clear with Undo, Copy, Download, "Use as input" where it makes sense, examples, instructions, limitations, a privacy note, and related tools.

### Markdown support (subset, by design)

Supported: ATX and setext headings, paragraphs, hard breaks, bold, italic, strikethrough, inline code, fenced code, block quotes, nested lists, task lists, tables with alignment, links (including balanced parentheses), images, autolinks, and horizontal rules.
Not yet supported: raw HTML (shown as text for safety), footnotes, reference-style links, and 4-space indented code blocks. In the preview, images appear as labels so nothing is fetched from other sites.

## Math tools (stage 3)

Every item in the brief's Math & Conversion list is now covered, so that category has no roadmap left.

| Tool | Status | Covers from the brief |
|---|---|---|
| Scientific Calculator | ✅ | Basic and scientific calculator (safe parser, no eval), degree/radian modes, history |
| Percentage Calculator | ✅ | Percentage, percentage change, percentage difference, increase/decrease, reverse percentage (e.g. pre-GST price) |
| Fraction Calculator | ✅ | Fraction arithmetic with exact BigInt maths, mixed numbers, repeating decimals, decimal → fraction |
| Ratio & Proportion | ✅ | Ratio simplification, proportions, dividing an amount in a ratio |
| Statistics Calculator | ✅ | Averages, mean/median/mode, standard deviation (sample and population), variance, quartiles |
| Prime Number Checker | ✅ | Deterministic Miller–Rabin up to 10²⁴, factorization up to 10¹⁸, sieve up to 10⁷ |
| GCD & LCM | ✅ | GCD, LCM, Euclid steps |
| Factorial Calculator | ✅ | Exact factorials with a safe limit (10,000!) |
| Random Number Generator | ✅ | Unbiased crypto-random integers and decimals, no-repeat option |
| Number Base Converter | ✅ | Number base, binary and hexadecimal converters, two's complement |
| Roman Numeral Converter | ✅ | Both directions with strict validation |
| Unit Converter | ✅ | Length, weight, temperature, area, volume, speed, time, digital storage, pressure, energy (exact definitions, every unit pair round-trip tested) |

## Developer and colour tools (stage 3)

| Tool | Status | Notes |
|---|---|---|
| JSON Formatter & Validator | ✅ | Own strict parser: exact error line and column, keeps large numbers exact, duplicate-key warnings |
| Base64 Encoder & Decoder | ✅ | UTF-8 text, files up to 50 MB, URL-safe, data URIs, decoded file type detection and image preview |
| UUID Generator | ✅ | v4 and v7, bulk, formats, inspector (version, variant, embedded time) |
| Hash Generator | ✅ | MD5 (RFC 1321 vectors), SHA-1/256/384/512 and HMAC via Web Crypto, files up to 500 MB, checksum comparison. Also covers "Text hashing" and "File hashing" from Privacy & Security |
| Unix Timestamp Converter | ✅ | s/ms/µs/ns detection, any IANA time zone, daylight saving, ISO week, live clock |
| JWT Decoder | ✅ | Decodes only, with a prominent "not verified" warning, expiry status and readable dates |
| Regex Tester | ✅ | Flags, groups, named groups, replacement preview, 2-second worker timeout |
| Color Converter | ✅ | HEX, RGB, HSL, HWB, OKLCH, HSV, CMYK, nearest CSS name, WCAG contrast. Listed under Design & Color |

## Not supported, by design

| Item | Reason |
|---|---|
| Live exchange rates, trends, DNS lookups, website testing | Would need a paid or third-party service. Planned alternatives use manually entered values or offline references. |
| AI-generated content | No free, private, offline option. Templates will be used instead and labelled as templates. |
| Account sync | No backend, so the site won't simulate one. Export and import cover moving data between browsers. |
| Old browsers without ES modules (IE11, pre-2018) | Script-only controls stay hidden there. Static content and instructions still render. |

## Planned stages

1. ✅ **Stage 1:** shell, search, personalization, 5 text tools, tests, deployment.
2. ✅ **Stage 2:** text diff, Markdown editor, text cleanup, prefix/suffix, line numbers, slug generator, lorem ipsum, text ↔ HTML, URL encoder. Still planned in Text: reverse text, text templates, text-to-speech, speech-to-text, and a basic spelling check.
3. ✅ **Stage 3:** 12 math tools (the full Math & Conversion list), JSON, Base64, UUID, hash, timestamp, JWT and regex tools, and a colour converter, with formula tests against reference values.
4. ⏳ **Stage 4:** productivity and student tools using IndexedDB (notes, to-dos, flashcards, Pomodoro, planners).
5. ⏳ **Stage 5:** image tools (Canvas + Web Worker), then PDF tools (pdf-lib, MIT licence, loaded only on PDF pages).
6. ⏳ **Stage 6:** PWA: manifest, PNG icons, service worker with versioned app-shell cache, offline page.
7. ⏳ Later: finance, date/time, network, data, social, audio and video.

---

 on a long run of "a"s ending in "!". It stops after 2 seconds with a message, and the page stays responsive.
- [ ] Timestamp: choose America/New_York for a January and a July date. The offset changes between −05:00 and −04:00.


Run `npm run dev` and open http://localhost:5173/. Repeat the key steps in Chrome or Edge, Firefox, and on a phone. To test on a phone, run `node scripts/dev.mjs` and open `http://<your-PC-IP>:5173/` on the same Wi-Fi network.

**Navigation and search**
- [ ] Press `Ctrl+K`, type "alphabet", and press Enter. Sort Lines opens.
- [ ] Press `/` on any page. The palette opens. Esc closes it and focus returns.
- [ ] Search "merge pdf". It shows as **Planned** and can't be opened.
- [ ] On the directory, choose the "Text" chip and type "dupe". The URL updates, and reloading keeps the filter.
- [ ] Visit `/tools/does-not-exist/`. The styled 404 page appears.
- [ ] Use only Tab, Shift+Tab, Enter, and Space to reach and use every control. A focus ring is always visible.

**Personalization**
- [ ] Star a tool. It appears under Favorites on the home page. Reload, and it's still there.
- [ ] Toggle the theme and reload: there's no flash of the wrong theme.
- [ ] Settings → change the accent, turn off "Editor's picks", export data, delete all data, then import the file. Everything is restored.
- [ ] Open a private window with storage blocked: Settings warns that changes won't be saved.

**Tools**
- [ ] Each tool: load an example, then Copy (paste it elsewhere to confirm), Download (open the file), and Clear then Undo.
- [ ] Word counter: paste a very large text (about 5 MB). Typing stays usable.
- [ ] Find & Replace: regex `(a+)+$` on `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!`. An error appears after 2 seconds and the page stays responsive.
- [ ] Find & Replace: invalid regex `(abc` shows a clear error, and fixing it clears the error.
- [ ] Text Diff: paste two 20,000-line texts with scattered edits. The page stays responsive, and "Hide unchanged lines" collapses the view.
- [ ] Markdown: load "Cheat sheet". Every element renders. Download .html and open it: it looks the same and images load there.
- [ ] Markdown: type `<script>alert(1)</script>` and `[x](javascript:alert(1))`. Both show as harmless text.
- [ ] Markdown: turn on draft saving, reload (the draft returns), then turn it off and reload (it's gone).
- [ ] Text ↔ HTML: paste a full web page's HTML. Scripts and styles are dropped, and lists and links read naturally.
- [ ] URL decoder: decode `100%` and `%E0%A4`. They are left unchanged, with a warning.

**Layout**
- [ ] 320 px, 375 px, 768 px, and 1440 px widths have no horizontal scrolling.
- [ ] Turn on "Reduce motion" in Settings or the OS. Transitions and entrance animations stop.
- [ ] Print a tool page (Ctrl+P). The header, footer, and buttons are hidden.
