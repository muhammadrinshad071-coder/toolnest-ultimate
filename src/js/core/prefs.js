/**
 * User preferences and personal data kept on this device:
 * settings, favorites, recently used tools and local usage counts.
 */
import { store as defaultStore } from './storage.js';

export const ACCENTS = [
  { id: 'indigo', name: 'Indigo' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'teal', name: 'Teal' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'amber', name: 'Amber' },
  { id: 'rose', name: 'Rose' },
  { id: 'violet', name: 'Violet' }
];

export const DASHBOARD_SECTIONS = [
  { id: 'favorites', name: 'Favorite tools' },
  { id: 'recent', name: 'Recently used' },
  { id: 'mostUsed', name: 'Your most used' },
  { id: 'picks', name: 'Editor’s picks' }
];

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'system',
  accent: 'indigo',
  motion: 'system',
  dashboard: Object.freeze({ favorites: true, recent: true, mostUsed: true, picks: true })
});

const THEMES = ['system', 'light', 'dark'];
const MOTION = ['system', 'reduce'];
const ID_RE = /^[a-z0-9-]{1,64}$/;
const MAX_RECENT = 12;
const EXPORT_APP = 'toolnest-ultimate';
const EXPORT_VERSION = 1;

export function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const dash = s.dashboard && typeof s.dashboard === 'object' ? s.dashboard : {};
  const dashboard = {};
  for (const { id } of DASHBOARD_SECTIONS) {
    dashboard[id] = typeof dash[id] === 'boolean' ? dash[id] : DEFAULT_SETTINGS.dashboard[id];
  }
  return {
    theme: THEMES.includes(s.theme) ? s.theme : DEFAULT_SETTINGS.theme,
    accent: ACCENTS.some((a) => a.id === s.accent) ? s.accent : DEFAULT_SETTINGS.accent,
    motion: MOTION.includes(s.motion) ? s.motion : DEFAULT_SETTINGS.motion,
    dashboard
  };
}

export function sanitizeIdList(raw, max = 200) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  for (const v of raw) {
    if (typeof v === 'string' && ID_RE.test(v)) seen.add(v);
    if (seen.size >= max) break;
  }
  return [...seen];
}

export function sanitizeUsage(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (ID_RE.test(k) && Number.isFinite(v) && v > 0) out[k] = Math.min(Math.floor(v), 1e9);
  }
  return out;
}

/**
 * Validate an exported file before importing it.
 * @returns {{ok: true, data: object} | {ok: false, error: string}}
 */
export function validateImport(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'This file is not a ToolNest export.' };
  }
  if (parsed.app !== EXPORT_APP) return { ok: false, error: 'This file was not exported from ToolNest Ultimate.' };
  if (typeof parsed.version !== 'number' || parsed.version > EXPORT_VERSION) {
    return { ok: false, error: 'This export comes from a newer version of ToolNest and cannot be imported here.' };
  }
  const d = parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  return {
    ok: true,
    data: {
      settings: sanitizeSettings(d.settings),
      favorites: sanitizeIdList(d.favorites),
      recent: sanitizeIdList(d.recent, MAX_RECENT),
      usage: sanitizeUsage(d.usage)
    }
  };
}

export function createPrefs(store = defaultStore) {
  const events = new EventTarget();
  const emit = (what) => events.dispatchEvent(new CustomEvent('change', { detail: { what } }));

  const api = {
    get persistent() {
      return store.isPersistent;
    },

    settings: () => sanitizeSettings(store.getJSON('settings', null)),

    setSettings(patch) {
      const current = api.settings();
      const next = sanitizeSettings({ ...current, ...patch, dashboard: { ...current.dashboard, ...(patch.dashboard || {}) } });
      const result = store.setJSON('settings', next);
      emit('settings');
      return result;
    },

    favorites: () => sanitizeIdList(store.getJSON('favorites', [])),
    isFavorite: (id) => api.favorites().includes(id),

    toggleFavorite(id) {
      const list = api.favorites();
      const favorite = !list.includes(id);
      const next = favorite ? [id, ...list] : list.filter((x) => x !== id);
      const result = store.setJSON('favorites', next);
      emit('favorites');
      return { ...result, favorite };
    },

    recent: () => sanitizeIdList(store.getJSON('recent', []), MAX_RECENT),
    usage: () => sanitizeUsage(store.getJSON('usage', {})),

    recordUse(id) {
      if (!ID_RE.test(id)) return { ok: false };
      const recent = [id, ...api.recent().filter((x) => x !== id)].slice(0, MAX_RECENT);
      const usage = api.usage();
      usage[id] = (usage[id] || 0) + 1;
      const a = store.setJSON('recent', recent);
      const b = store.setJSON('usage', usage);
      emit('usage');
      return a.ok && b.ok ? { ok: true } : (a.ok ? b : a);
    },

    mostUsed(limit = 6) {
      return Object.entries(api.usage())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({ id, count }));
    },

    clearHistory() {
      store.remove('recent');
      store.remove('usage');
      emit('usage');
    },

    exportData() {
      return {
        app: EXPORT_APP,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        data: { settings: api.settings(), favorites: api.favorites(), recent: api.recent(), usage: api.usage() }
      };
    },

    importData(parsed) {
      const v = validateImport(parsed);
      if (!v.ok) return v;
      const results = [
        store.setJSON('settings', v.data.settings),
        store.setJSON('favorites', v.data.favorites),
        store.setJSON('recent', v.data.recent),
        store.setJSON('usage', v.data.usage)
      ];
      emit('all');
      const failed = results.find((r) => !r.ok);
      return failed ? { ok: false, error: failed.error, partial: true } : { ok: true };
    },

    clearAll() {
      const n = store.clearAll();
      emit('all');
      return n;
    },

    on(fn) {
      const handler = (e) => fn(e.detail.what);
      events.addEventListener('change', handler);
      return () => events.removeEventListener('change', handler);
    },

    /** Called when another tab changes storage. */
    notifyExternalChange() {
      emit('all');
    }
  };
  return api;
}

export const prefs = createPrefs();
