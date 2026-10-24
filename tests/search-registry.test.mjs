import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { categories, tools, plannedTools, getCategory, relatedTools, editorsPicks, slugify } from '../src/js/core/registry.js';
import { searchTools, normalize, tokenize, isSubsequence } from '../src/js/core/search.js';
import { iconNames } from '../src/js/core/icons.js';
import { toolDocs, docsFor } from '../src/js/core/tool-docs.js';

const ids = (list) => list.map((t) => t.id);
const opts = { categoryLookup: getCategory };

test('registry: ready tools are complete and consistent', () => {
  const seen = new Set();
  for (const t of tools) {
    assert.ok(!seen.has(t.id), `duplicate id ${t.id}`);
    seen.add(t.id);
    assert.match(t.id, /^[a-z0-9-]+$/);
    for (const field of ['name', 'description', 'category', 'icon', 'route']) {
      assert.ok(typeof t[field] === 'string' && t[field].length > 0, `${t.id}.${field}`);
    }
    assert.equal(t.status, 'ready');
    assert.equal(t.route, `tools/${t.id}/`);
    assert.ok(getCategory(t.category), `${t.id} has unknown category`);
    assert.ok(iconNames.includes(t.icon), `${t.id} icon ${t.icon} missing`);
    assert.ok(t.tags.length >= 3, `${t.id} needs tags`);
    for (const r of t.related) assert.ok(tools.some((x) => x.id === r), `${t.id} related ${r} missing`);
    assert.ok(fs.existsSync(path.join('src', 'js', 'tools', `${t.id}.js`)), `${t.id} module missing`);

    const doc = docsFor(t.id);
    for (const field of ['seoDescription', 'about', 'privacy']) {
      assert.ok(typeof doc[field] === 'string' && doc[field].length > 0, `${t.id} docs.${field}`);
    }
    assert.ok(doc.instructions.length >= 2, `${t.id} needs instructions`);
    assert.ok(doc.seoDescription.length <= 170, `${t.id} SEO description too long (${doc.seoDescription.length})`);
  }
  assert.deepEqual(Object.keys(toolDocs).sort(), [...seen].sort(), 'tool-docs.js and the registry list the same tools');
});

test('registry: categories, planned items and picks', () => {
  assert.equal(new Set(ids(categories)).size, categories.length);
  for (const c of categories) assert.ok(iconNames.includes(c.icon), `category icon ${c.icon}`);
  const plannedIds = ids(plannedTools);
  assert.equal(new Set(plannedIds).size, plannedIds.length, 'planned ids must be unique');
  for (const p of plannedTools) assert.equal(p.status, 'planned');
  const readyNames = new Set(tools.map((t) => normalize(t.name)));
  for (const p of plannedTools) assert.ok(!readyNames.has(normalize(p.name)), `${p.name} is both ready and planned`);
  for (const id of editorsPicks) assert.ok(tools.some((t) => t.id === id));
});

test('relatedTools returns other tools only', () => {
  const rel = relatedTools('word-counter');
  assert.ok(rel.length > 0 && rel.length <= 4);
  assert.ok(!ids(rel).includes('word-counter'));
  assert.deepEqual(relatedTools('nope'), []);
});

test('slugify', () => {
  assert.equal(slugify('CSV ↔ JSON'), 'csv-json');
  assert.equal(slugify('Mean, median & mode'), 'mean-median-and-mode');
  assert.equal(slugify('Café'), 'cafe');
});

test('normalize / tokenize / isSubsequence', () => {
  assert.equal(normalize('  Résumé '), 'resume');
  assert.deepEqual(tokenize('Find & Replace!'), ['find', 'replace']);
  assert.ok(isSubsequence('wdc', 'wordcounter'));
  assert.ok(!isSubsequence('xyz', 'wordcounter'));
});

test('search: names, tags, synonyms and categories', () => {
  assert.equal(searchTools('word', tools, opts)[0].id, 'word-counter');
  assert.equal(searchTools('character count', tools, opts)[0].id, 'word-counter');
  assert.equal(searchTools('alphabetize', tools, opts)[0].id, 'sort-lines');
  assert.equal(searchTools('dedupe', tools, opts)[0].id, 'remove-duplicate-lines');
  assert.equal(searchTools('regex', tools, opts)[0].id, 'regex-tester');
  assert.equal(searchTools('find and replace', tools, opts)[0].id, 'find-replace');
  assert.equal(searchTools('UPPERCASE', tools, opts)[0].id, 'case-converter');
  assert.equal(searchTools('reading time', tools, opts)[0].id, 'word-counter');
  const textTools = tools.filter((t) => t.category === 'text').map((t) => t.id);
  const found = ids(searchTools('text', tools, opts));
  for (const id of textTools) assert.ok(found.includes(id), `category search should include ${id}`);
});

test('search: stage 2 tools and synonyms', () => {
  assert.equal(searchTools('compare', tools, opts)[0].id, 'text-diff');
  assert.equal(searchTools('diff', tools, opts)[0].id, 'text-diff');
  assert.equal(searchTools('permalink', tools, opts)[0].id, 'slug-generator');
  assert.equal(searchTools('dummy text', tools, opts)[0].id, 'lorem-ipsum');
  assert.equal(searchTools('markdown', tools, opts)[0].id, 'markdown-preview');
  assert.equal(searchTools('remove extra spaces', tools, opts)[0].id, 'text-cleanup');
  assert.equal(searchTools('strip html', tools, opts)[0].id, 'text-html');
  assert.equal(searchTools('percent encoding', tools, opts)[0].id, 'url-encoder');
  assert.equal(searchTools('number lines', tools, opts)[0].id, 'line-numbers');
  assert.equal(searchTools('prepend', tools, opts)[0].id, 'prefix-suffix');
});

test('search: stage 3 tools and synonyms', () => {
  const top = (q) => searchTools(q, tools, opts)[0]?.id;
  assert.equal(top('calculator'), 'scientific-calculator');
  assert.equal(top('kg to lbs'), 'unit-converter');
  assert.equal(top('celsius'), 'unit-converter');
  assert.equal(top('hcf'), 'gcd-lcm-calculator');
  assert.equal(top('standard deviation'), 'statistics-calculator');
  assert.equal(top('binary'), 'number-base-converter');
  assert.equal(top('json'), 'json-formatter');
  assert.equal(top('sha256'), 'hash-generator');
  assert.equal(top('guid'), 'uuid-generator');
  assert.equal(top('epoch'), 'timestamp-converter');
  assert.equal(top('bearer token'), 'jwt-decoder');
  assert.equal(top('regexp'), 'regex-tester');
  assert.equal(top('hex to rgb'), 'color-converter');
  assert.equal(top('dice'), 'random-number-generator');
  assert.equal(top('mcmxciv'), 'roman-numeral-converter');
});

test('search: typos via subsequence, empty results, empty query', () => {
  assert.equal(searchTools('wrdcntr', tools, opts)[0].id, 'word-counter');
  assert.deepEqual(searchTools('zzzz qqqq', tools, opts), []);
  assert.deepEqual(ids(searchTools('', tools, opts)), ids(tools));
  assert.deepEqual(ids(searchTools('   ', tools, opts)), ids(tools));
});

test('search: every query word must match', () => {
  assert.deepEqual(ids(searchTools('sort shuffle', tools, opts)), ['sort-lines']);
  assert.deepEqual(searchTools('sort pdf', tools, opts), []);
});

test('search: category filter, limit and boost', () => {
  assert.deepEqual(searchTools('', tools, { ...opts, category: 'image' }), []);
  assert.equal(searchTools('', tools, { ...opts, limit: 2 }).length, 2);
  const boosted = searchTools('', tools, { ...opts, boost: (t) => (t.id === 'find-replace' ? 10 : 0) });
  assert.equal(boosted[0].id, 'find-replace');
});

test('search: planned tools are searchable separately', () => {
  const r = searchTools('merge pdf', plannedTools, opts);
  assert.equal(r[0].name, 'Merge PDF');
});
