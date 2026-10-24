/**
 * Static site generator. Produces dist/ ready for GitHub Pages:
 *   - one pre-rendered HTML page per ready tool, category and info page
 *   - sitemap.xml, robots.txt, 404.html
 *   - a copy of src/js and src/assets
 * No dependencies — only Node's standard library.
 *
 * Usage: node scripts/build.mjs   (set SITE_URL for production)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolveConfig } from './config.mjs';
import { categories, tools } from '../src/js/core/registry.js';
import { homePage, directoryPage, categoryPage, toolPage, aboutPage, privacyPage, helpPage, notFoundPage } from './templates.mjs';

async function listFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

async function contentHash(dir) {
  const hash = crypto.createHash('sha256');
  for (const file of (await listFiles(dir)).sort()) {
    hash.update(path.relative(dir, file));
    hash.update(await fs.readFile(file));
  }
  return hash.digest('hex').slice(0, 10);
}

async function write(outDir, rel, content) {
  const target = path.join(outDir, rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, 'utf8');
}

/** Replace target with source. Retries briefly because Windows can lock files that are being served. */
async function swapDirectory(source, target) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rm(target, { recursive: true, force: true });
      await fs.rename(source, target);
      return;
    } catch (err) {
      if (attempt >= 10) throw err;
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
}

export async function build(overrides = {}) {
  const started = Date.now();
  const cfg = resolveConfig(overrides);
  cfg.version = await contentHash(cfg.srcDir);

  // Every ready tool must have a module, otherwise its page would never work.
  for (const tool of tools) {
    try {
      await fs.access(path.join(cfg.srcDir, 'js', 'tools', `${tool.id}.js`));
    } catch {
      throw new Error(`Tool "${tool.id}" is marked ready but src/js/tools/${tool.id}.js is missing.`);
    }
  }

  // Build into a staging folder, then swap it in, so a running dev server
  // never serves a half-written site.
  const stage = `${cfg.outDir}.tmp`;
  await fs.rm(stage, { recursive: true, force: true });
  await fs.mkdir(stage, { recursive: true });
  // tool-docs.js is help text for the page templates; browsers never need it.
  await fs.cp(path.join(cfg.srcDir, 'js'), path.join(stage, 'js'), { recursive: true, filter: (p) => path.basename(p) !== 'tool-docs.js' });
  await fs.cp(path.join(cfg.srcDir, 'assets'), path.join(stage, 'assets'), { recursive: true });

  const pages = [
    ['index.html', homePage(cfg), ''],
    ['tools/index.html', directoryPage(cfg), 'tools/'],
    ['about/index.html', aboutPage(cfg), 'about/'],
    ['privacy/index.html', privacyPage(cfg), 'privacy/'],
    ['help/index.html', helpPage(cfg), 'help/'],
    ...categories.map((c) => [`category/${c.id}/index.html`, categoryPage(cfg, c), `category/${c.id}/`]),
    ...tools.map((t) => [`${t.route}index.html`, toolPage(cfg, t), t.route])
  ];
  for (const [rel, html] of pages) await write(stage, rel, html);
  await write(stage, '404.html', notFoundPage(cfg));

  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([, , urlPath]) => `  <url><loc>${cfg.siteUrl}${urlPath}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
  await write(stage, 'sitemap.xml', sitemap);
  await write(stage, 'robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}sitemap.xml\n`);
  // Tell GitHub Pages not to run Jekyll over the output.
  await write(stage, '.nojekyll', '');

  await swapDirectory(stage, cfg.outDir);

  return { cfg, pages: pages.length + 1, ms: Date.now() - started };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build()
    .then(({ cfg, pages, ms }) => {
      console.log(`Built ${pages} pages into ${path.relative(process.cwd(), cfg.outDir) || '.'} in ${ms} ms`);
      console.log(`Site URL: ${cfg.siteUrl}  (version ${cfg.version})`);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}
