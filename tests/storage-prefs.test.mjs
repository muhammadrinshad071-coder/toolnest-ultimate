import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, PREFIX } from '../src/js/core/storage.js';
import { createPrefs, validateImport, sanitizeSettings, sanitizeIdList, sanitizeUsage, DEFAULT_SETTINGS } from '../src/js/core/prefs.js';

function memoryBackend() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    map: m
  };
}

test('store persists JSON to the backend', () => {
  const b = memoryBackend();
  const s = createStore(() => b);
  assert.equal(s.isPersistent, true);
  assert.deepEqual(s.setJSON('a', { x: 1 }), { ok: true });
  assert.equal(b.getItem(`${PREFIX}a`), '{"x":1}');
  assert.deepEqual(s.getJSON('a', null), { x: 1 });
  assert.equal(s.getJSON('missing', 'fallback'), 'fallback');
});

test('store survives corrupted JSON', () => {
  const b = memoryBackend();
  b.setItem(`${PREFIX}bad`, '{not json');
  const s = createStore(() => b);
  assert.equal(s.getJSON('bad', 42), 42);
});

test('store falls back to memory when storage throws on access', () => {
  const s = createStore(() => { throw new Error('SecurityError'); });
  assert.equal(s.isPersistent, false);
  const r = s.setJSON('k', [1, 2]);
  assert.equal(r.ok, false);
  assert.match(r.error, /unavailable/);
  assert.deepEqual(s.getJSON('k', null), [1, 2], 'value still available for this page');
});

test('store reports quota errors honestly', () => {
  const b = memoryBackend();
  const s = createStore(() => b);
  b.setItem = () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; };
  const r = s.setJSON('big', 'x');
  assert.equal(r.ok, false);
  assert.match(r.error, /full/);
});

test('store.clearAll removes only ToolNest keys', () => {
  const b = memoryBackend();
  b.setItem('other-app', 'keep');
  const s = createStore(() => b);
  s.setJSON('a', 1);
  s.setJSON('b', 2);
  s.clearAll();
  assert.equal(b.getItem('other-app'), 'keep');
  assert.equal(b.getItem(`${PREFIX}a`), null);
});

test('sanitizers reject bad shapes', () => {
  assert.deepEqual(sanitizeSettings(null), { ...DEFAULT_SETTINGS, dashboard: { ...DEFAULT_SETTINGS.dashboard } });
  assert.equal(sanitizeSettings({ theme: 'neon', accent: 'teal' }).theme, 'system');
  assert.equal(sanitizeSettings({ accent: 'teal' }).accent, 'teal');
  assert.equal(sanitizeSettings({ dashboard: { picks: false, recent: 'no' } }).dashboard.picks, false);
  assert.equal(sanitizeSettings({ dashboard: { recent: 'no' } }).dashboard.recent, true);
  assert.deepEqual(sanitizeIdList(['a', 'a', 'B!', 5, 'ok-id']), ['a', 'ok-id']);
  assert.deepEqual(sanitizeIdList('nope'), []);
  assert.deepEqual(sanitizeUsage({ good: 3, bad: -1, 'x y': 2, nan: NaN }), { good: 3 });
});

test('prefs: favorites, recent and usage', () => {
  const p = createPrefs(createStore(() => memoryBackend()));
  assert.deepEqual(p.favorites(), []);
  assert.equal(p.toggleFavorite('word-counter').favorite, true);
  assert.equal(p.isFavorite('word-counter'), true);
  assert.equal(p.toggleFavorite('word-counter').favorite, false);
  p.recordUse('a');
  p.recordUse('b');
  p.recordUse('a');
  assert.deepEqual(p.recent(), ['a', 'b']);
  assert.deepEqual(p.mostUsed(), [{ id: 'a', count: 2 }, { id: 'b', count: 1 }]);
  p.clearHistory();
  assert.deepEqual(p.recent(), []);
});

test('prefs: settings merge and change events', () => {
  const p = createPrefs(createStore(() => memoryBackend()));
  const events = [];
  p.on((what) => events.push(what));
  p.setSettings({ theme: 'dark' });
  p.setSettings({ dashboard: { picks: false } });
  const s = p.settings();
  assert.equal(s.theme, 'dark');
  assert.equal(s.dashboard.picks, false);
  assert.equal(s.dashboard.favorites, true);
  assert.deepEqual(events, ['settings', 'settings']);
});

test('prefs: export → import round trip', () => {
  const a = createPrefs(createStore(() => memoryBackend()));
  a.setSettings({ theme: 'light', accent: 'rose' });
  a.toggleFavorite('sort-lines');
  a.recordUse('find-replace');
  const exported = JSON.parse(JSON.stringify(a.exportData()));

  const b = createPrefs(createStore(() => memoryBackend()));
  assert.deepEqual(b.importData(exported), { ok: true });
  assert.equal(b.settings().accent, 'rose');
  assert.deepEqual(b.favorites(), ['sort-lines']);
  assert.deepEqual(b.recent(), ['find-replace']);
});

test('validateImport rejects foreign or future files', () => {
  assert.equal(validateImport(null).ok, false);
  assert.equal(validateImport([]).ok, false);
  assert.equal(validateImport({ app: 'other' }).ok, false);
  assert.equal(validateImport({ app: 'toolnest-ultimate', version: 99 }).ok, false);
  const r = validateImport({ app: 'toolnest-ultimate', version: 1, data: { favorites: ['ok', '<script>'], settings: { theme: 'evil' } } });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.favorites, ['ok']);
  assert.equal(r.data.settings.theme, 'system');
});

test('prefs import reports storage failure instead of claiming success', () => {
  const p = createPrefs(createStore(() => { throw new Error('blocked'); }));
  const r = p.importData({ app: 'toolnest-ultimate', version: 1, data: {} });
  assert.equal(r.ok, false);
  assert.equal(r.partial, true);
});
