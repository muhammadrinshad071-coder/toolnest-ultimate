/**
 * Applies theme, accent and motion settings to <html> and keeps the
 * theme toggle button's label accurate.
 */
import { prefs } from '../core/prefs.js';
import { toast } from './toast.js';

const html = document.documentElement;
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function resolveTheme(setting) {
  if (setting === 'light' || setting === 'dark') return setting;
  return darkQuery && darkQuery.matches ? 'dark' : 'light';
}

export function applySettings(settings = prefs.settings()) {
  const theme = resolveTheme(settings.theme);
  html.dataset.theme = theme;
  html.dataset.accent = settings.accent;
  if (settings.motion === 'reduce') html.dataset.motion = 'reduce';
  else delete html.dataset.motion;

  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.content = theme === 'dark' ? '#0c0e14' : '#f6f7fb';
  }
  for (const btn of document.querySelectorAll('[data-action="toggle-theme"]')) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

export function toggleTheme() {
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  const result = prefs.setSettings({ theme: next });
  applySettings();
  if (!result.ok) toast(`Theme changed for this visit only. ${result.error}`, { type: 'error' });
}

export function initTheme() {
  applySettings();
  if (darkQuery) {
    const onChange = () => { if (prefs.settings().theme === 'system') applySettings(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onChange);
    else if (darkQuery.addListener) darkQuery.addListener(onChange);
  }
  prefs.on((what) => { if (what === 'settings' || what === 'all') applySettings(); });
}
