/**
 * Tool directory filters: text search, category chips and the planned-tools
 * toggle. Filter state is mirrored in the URL (?q=…&cat=…) so it can be
 * bookmarked or shared.
 */
import { tools, getCategory } from '../core/registry.js';
import { searchTools, tokenize, normalize } from '../core/search.js';

export function init() {
  const input = document.getElementById('directory-filter');
  const showPlanned = document.getElementById('directory-show-planned');
  const status = document.getElementById('directory-status');
  const empty = document.getElementById('directory-empty');
  const chips = [...document.querySelectorAll('.chip[data-cat]')];
  const sections = [...document.querySelectorAll('[data-cat-section]')];
  if (!input || !sections.length) return;

  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') || '';
  let category = params.get('cat') || '';
  if (category && !getCategory(category)) category = '';

  function apply() {
    const q = input.value.trim();
    const tokens = tokenize(q);
    const matchIds = tokens.length ? new Set(searchTools(q, tools, { categoryLookup: getCategory }).map((t) => t.id)) : null;
    let toolCount = 0;
    let plannedCount = 0;

    for (const sec of sections) {
      const inCategory = !category || sec.dataset.catSection === category;
      let n = 0;
      for (const card of sec.querySelectorAll('.tool-card')) {
        const show = inCategory && (!matchIds || matchIds.has(card.dataset.toolId));
        card.hidden = !show;
        if (show) n++;
      }
      let p = 0;
      for (const item of sec.querySelectorAll('.planned-item')) {
        const name = normalize(item.dataset.name);
        const show = inCategory && showPlanned.checked && tokens.every((tok) => name.includes(tok));
        item.hidden = !show;
        if (show) p++;
      }
      const details = sec.querySelector('[data-planned]');
      if (details) {
        details.hidden = p === 0;
        if (tokens.length && p > 0) details.open = true;
      }
      const none = sec.querySelector('.dir-none');
      if (none) none.hidden = tokens.length > 0;
      sec.hidden = !inCategory || (tokens.length > 0 && n === 0 && p === 0);
      toolCount += n;
      plannedCount += p;
    }

    empty.hidden = toolCount + plannedCount > 0;
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.cat === category));

    const filtering = tokens.length > 0 || category;
    status.textContent = filtering
      ? `Showing ${toolCount} working tool${toolCount === 1 ? '' : 's'}${showPlanned.checked ? ` and ${plannedCount} planned` : ''}${category ? ` in ${getCategory(category).name}` : ''}.`
      : '';

    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (category) next.set('cat', category);
    const qs = next.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  input.addEventListener('input', apply);
  showPlanned.addEventListener('change', apply);
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      category = chip.dataset.cat;
      apply();
    });
  }
  apply();
}
