/**
 * App entry point, loaded on every page. Keeps the initial work small:
 * the palette, settings dialog and page-specific code load on demand.
 */
import { prefs } from './core/prefs.js';
import { getTool } from './core/registry.js';
import { PREFIX } from './core/storage.js';
import { initTheme, toggleTheme } from './ui/theme.js';
import { toast } from './ui/toast.js';

const html = document.documentElement;
const page = html.dataset.page;

/* ---------- Favorites (cards and tool-page button) ---------- */
function syncFavoriteButtons() {
  const favorites = new Set(prefs.favorites());
  for (const btn of document.querySelectorAll('[data-fav]')) {
    const id = btn.dataset.fav;
    const on = favorites.has(id);
    const name = getTool(id)?.name || 'tool';
    btn.setAttribute('aria-pressed', String(on));
    const label = btn.querySelector('[data-fav-label]');
    if (label) label.textContent = on ? 'Favorited' : 'Add to favorites';
    else {
      btn.setAttribute('aria-label', on ? `Remove ${name} from favorites` : `Add ${name} to favorites`);
      btn.title = on ? 'Remove from favorites' : 'Add to favorites';
    }
  }
}

function onFavoriteClick(btn) {
  const id = btn.dataset.fav;
  const name = getTool(id)?.name || 'Tool';
  const result = prefs.toggleFavorite(id);
  btn.classList.remove('is-popping');
  if (result.favorite) {
    void btn.offsetWidth; // restart the animation
    btn.classList.add('is-popping');
  }
  if (!result.ok) toast(`${result.favorite ? 'Added' : 'Removed'} for this visit only. ${result.error}`, { type: 'error' });
  else toast(result.favorite ? `${name} added to favorites.` : `${name} removed from favorites.`, { duration: 2500 });
}

/* ---------- Mobile menu ---------- */
function setMenu(open) {
  const btn = document.querySelector('[data-action="toggle-menu"]');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

/* ---------- Lazy dialogs ---------- */
async function openPalette(initial = '') {
  const { openPalette: open } = await import('./ui/palette.js');
  open(initial);
}

async function openSettings() {
  const { openSettings: open } = await import('./ui/settings.js');
  open();
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/* ---------- Global events ---------- */
document.addEventListener('click', (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  const fav = target.closest('[data-fav]');
  if (fav) {
    e.preventDefault();
    onFavoriteClick(fav);
    return;
  }
  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'toggle-theme') toggleTheme();
  else if (action === 'open-palette') openPalette();
  else if (action === 'open-settings') openSettings();
  else if (action === 'toggle-menu') setMenu(document.getElementById('mobile-menu')?.hidden ?? false);
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openPalette();
  } else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target) && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    openPalette();
  } else if (e.key === 'Escape' && !document.getElementById('mobile-menu')?.hidden) {
    setMenu(false);
    document.querySelector('[data-action="toggle-menu"]')?.focus();
  }
});

// Keep tabs in sync when settings change in another tab.
window.addEventListener('storage', (e) => {
  if (e.key === null || e.key.startsWith(PREFIX)) prefs.notifyExternalChange();
});

prefs.on(syncFavoriteButtons);

// Show the platform's real shortcut on Apple devices.
if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
  for (const k of document.querySelectorAll('.kbd-hint')) k.textContent = '⌘ K';
}

initTheme();
syncFavoriteButtons();

/* ---------- Page-specific modules ---------- */
const pageModules = {
  home: () => import('./ui/home.js'),
  directory: () => import('./ui/directory.js'),
  tool: () => import('./ui/tool-page.js')
};

if (pageModules[page]) {
  pageModules[page]()
    .then((mod) => mod.init({ syncFavoriteButtons, openPalette }))
    .catch((err) => {
      console.error(err);
      toast('Part of this page failed to load. Please reload.', { type: 'error' });
    });
}
