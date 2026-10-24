import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';
import { tools, categories } from '../src/js/core/registry.js';

let outDir;
const read = (rel) => fs.readFile(path.join(outDir, rel), 'utf8');

before(async () => {
  outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'toolnest-build-'));
  await build({ outDir, siteUrl: 'https://example.github.io/toolnest-ultimate', repoUrl: 'https://github.com/example/toolnest-ultimate' });
});

after(async () => {
  await fs.rm(outDir, { recursive: true, force: true });
});

test('generates a page for every ready tool and category', async () => {
  for (const t of tools) await fs.access(path.join(outDir, t.route, 'index.html'));
  for (const c of categories) await fs.access(path.join(outDir, 'category', c.id, 'index.html'));
  for (const p of ['index.html', 'tools/index.html', 'about/index.html', 'privacy/index.html', 'help/index.html', '404.html', 'robots.txt', 'sitemap.xml', '.nojekyll']) {
    await fs.access(path.join(outDir, p));
  }
});

test('titles and descriptions are unique', async () => {
  const pages = ['index.html', 'tools/index.html', 'about/index.html', 'privacy/index.html', 'help/index.html',
    ...categories.map((c) => `category/${c.id}/index.html`), ...tools.map((t) => `${t.route}index.html`)];
  const titles = new Set();
  const descriptions = new Set();
  for (const p of pages) {
    const html = await read(p);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="(.*?)">/)[1];
    assert.ok(!titles.has(title), `duplicate title: ${title}`);
    assert.ok(!descriptions.has(desc), `duplicate description on ${p}`);
    titles.add(title);
    descriptions.add(desc);
  }
});

test('pages use relative links so any GitHub Pages sub-path works', async () => {
  const html = await read('tools/word-counter/index.html');
  assert.match(html, /data-root="\.\.\/\.\.\/"/);
  assert.match(html, /href="\.\.\/\.\.\/assets\/css\/main\.css\?v=/);
  assert.doesNotMatch(html, /(href|src)="\/(?!\/)/, 'no root-absolute URLs');
  const home = await read('index.html');
  assert.match(home, /data-root="\.\/"/);
});

test('404 page uses the absolute base path and is not indexed', async () => {
  const html = await read('404.html');
  assert.match(html, /data-root="\/toolnest-ultimate\/"/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(html, /rel="canonical"/);
});

test('canonical URLs, sitemap and robots use the site URL', async () => {
  const html = await read('tools/sort-lines/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/example\.github\.io\/toolnest-ultimate\/tools\/sort-lines\/">/);
  const sitemap = await read('sitemap.xml');
  for (const t of tools) assert.ok(sitemap.includes(`https://example.github.io/toolnest-ultimate/${t.route}`));
  assert.doesNotMatch(sitemap, /planned/);
  const robots = await read('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/example\.github\.io\/toolnest-ultimate\/sitemap\.xml/);
});

test('every page has a strict content security policy and no inline scripts', async () => {
  const html = await read('index.html');
  assert.match(html, /Content-Security-Policy" content="default-src 'self'; script-src 'self'/);
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter((m) => !m[1].includes('application/ld+json'));
  assert.equal(inline.length, 0);
});

test('planned tools never get their own pages', async () => {
  const dirs = await fs.readdir(path.join(outDir, 'tools'));
  assert.deepEqual(dirs.filter((d) => d !== 'index.html').sort(), tools.map((t) => t.id).sort());
});

test('contact link is built from the repository URL', async () => {
  const about = await read('about/index.html');
  assert.match(about, /https:\/\/github\.com\/example\/toolnest-ultimate\/issues/);
});

test('JSON-LD is valid JSON', async () => {
  const html = await read('tools/find-replace/index.html');
  const block = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  const data = JSON.parse(block);
  assert.equal(data[0]['@type'], 'WebApplication');
  assert.equal(data[0].offers.price, '0');
});

test('build-only help text is not published', async () => {
  await assert.rejects(fs.access(path.join(outDir, 'js', 'core', 'tool-docs.js')));
  const html = await read('tools/json-formatter/index.html');
  assert.match(html, /How to use/);
  assert.match(html, /JSON\.parse would change them/, 'help text is rendered into the page');
});
