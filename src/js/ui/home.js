/**
 * Home page: personal dashboard sections (favorites, recent, most used)
 * rendered from local data, plus instant search.
 */
import { prefs } from '../core/prefs.js';
import { tools, plannedTools, getTool, getCategory } from '../core/registry.js';
import { searchTools, tokenize, normalize } from '../core/search.js';
import { toolCardHtml } from '../core/markup.js';
import { toast } from './toast.js';
import { h } from './toolkit.js';

const root = document.documentElement.dataset.root || './';

const boost = (tool) => (prefs.favorites().includes(tool.id) ? 4 : 0) + Math.min(prefs.usage()[tool.id] || 0, 6) * 0.5;

export function init({ syncFavoriteButtons }) {
  const dashboard = document.getElementById('dashboard');
  const results = document.getElementById('home-results');
  const input = document.getElementById('home-search');
  if (!dashboard || !results || !input) return;

  const section = (name) => dashboard.querySelector(`[data-section="${name}"]`);

  function fill(name, cards, visible) {
    const sec = section(name);
    if (!sec) return;
    const list = sec.querySelector('[data-list]');
    if (list) list.innerHTML = cards.join('');
    sec.hidden = !visible;
  }

  function renderDashboard() {
    const show = prefs.settings().dashboard;
    const favorites = prefs.favorites().map(getTool).filter(Boolean);
    const recent = prefs.recent().map(getTool).filter(Boolean).slice(0, 6);
    const most = prefs.mostUsed(6)
      .map(({ id, count }) => ({ tool: getTool(id), count }))
      .filter((x) => x.tool);

    fill('favorites', favorites.map((t) => toolCardHtml(t, root)), show.favorites && favorites.length > 0);
    fill('recent', recent.map((t) => toolCardHtml(t, root)), show.recent && recent.length > 0);
    // Only meaningful once several tools have been used.
    fill('mostUsed', most.map(({ tool, count }) => toolCardHtml(tool, root, { meta: `Opened ${count} time${count === 1 ? '' : 's'} on this device` })), show.mostUsed && most.length >= 2);
    const picks = section('picks');
    if (picks) picks.hidden = !show.picks;
    syncFavoriteButtons();
  }

  const list = results.querySelector('[data-list]');
  const empty = results.querySelector('[data-empty]');
  const title = document.getElementById('home-results-title');

  function renderSearch() {
    const q = input.value.trim();
    if (!tokenize(q).length) {
      results.hidden = true;
      dashboard.hidden = false;
      return;
    }
    const found = searchTools(q, tools, { categoryLookup: getCategory, boost });
    results.hidden = false;
    dashboard.hidden = true;
    title.textContent = found.length
      ? `${found.length} tool${found.length === 1 ? '' : 's'} matching “${q}”`
      : `No working tools match “${q}”`;
    list.innerHTML = found.map((t) => toolCardHtml(t, root)).join('');
    list.hidden = !found.length;
    empty.hidden = found.length > 0;
    if (!found.length) {
      const tokens = tokenize(q);
      const planned = plannedTools.filter((p) => tokens.every((tok) => normalize(p.name).includes(tok))).slice(0, 3);
      empty.replaceChildren(
        h('h2', { text: planned.length ? 'Planned, but not built yet' : 'Nothing found' }),
        h('p', {
          text: planned.length
            ? `${planned.map((p) => p.name).join(', ')} ${planned.length === 1 ? 'is' : 'are'} on the roadmap but not available yet.`
            : 'Try a different word or a synonym, such as “count”, “sort” or “replace”.'
        }),
        h('a', { class: 'btn btn--secondary', href: `${root}tools/`, text: 'Browse all tools' })
      );
    }
    syncFavoriteButtons();
  }

  input.addEventListener('input', renderSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      const first = list.querySelector('a');
      if (first && !results.hidden) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape' && input.value) {
      input.value = '';
      renderSearch();
    }
  });

  dashboard.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-action="clear-history"]')) {
      prefs.clearHistory();
      toast('Recently used history cleared.');
    }
  });

  prefs.on(renderDashboard);
  renderDashboard();
  if (input.value) renderSearch();
}
