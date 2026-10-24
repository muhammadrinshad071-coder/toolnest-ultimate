/**
 * Command palette (Ctrl+K / Cmd+K / "/").
 * Accessible combobox + listbox inside a native modal <dialog>.
 */
import { tools, plannedTools, categories, getTool, getCategory } from '../core/registry.js';
import { searchTools, tokenize, normalize } from '../core/search.js';
import { prefs } from '../core/prefs.js';
import { h, icon } from './toolkit.js';

const root = document.documentElement.dataset.root || './';
let dialog, input, list, status;
let options = [];
let active = -1;

function boost(tool) {
  const favs = prefs.favorites();
  const uses = prefs.usage()[tool.id] || 0;
  return (favs.includes(tool.id) ? 4 : 0) + Math.min(uses, 6) * 0.5;
}

function build() {
  input = h('input', {
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': 'palette-list',
    'aria-autocomplete': 'list',
    'aria-label': 'Search tools',
    placeholder: 'Search tools and categories…',
    autocomplete: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go'
  });
  list = h('ul', { id: 'palette-list', class: 'palette__list', role: 'listbox', 'aria-label': 'Results' });
  status = h('p', { class: 'visually-hidden', role: 'status' });
  dialog = h('dialog', { class: 'dialog palette', 'aria-label': 'Search tools' },
    h('div', { class: 'palette__search' }, icon('search', 20), input,
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close search', onClick: () => dialog.close() }, icon('x', 18))),
    list,
    status,
    h('div', { class: 'palette__foot', 'aria-hidden': 'true' },
      h('span', {}, h('kbd', { text: '↑' }), ' ', h('kbd', { text: '↓' }), ' to move'),
      h('span', {}, h('kbd', { text: 'Enter' }), ' to open'),
      h('span', {}, h('kbd', { text: 'Esc' }), ' to close'))
  );

  input.addEventListener('input', render);
  input.addEventListener('keydown', onKeydown);
  list.addEventListener('mousemove', (e) => {
    const li = e.target instanceof Element ? e.target.closest('[role="option"]') : null;
    if (li) setActive(Number(li.dataset.index), false);
  });
  list.addEventListener('click', (e) => {
    const li = e.target instanceof Element ? e.target.closest('[role="option"]') : null;
    if (li) choose(Number(li.dataset.index));
  });
  // Click on the backdrop closes the dialog.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.body.append(dialog);
}

function option({ name, desc, iconName, href, disabled }) {
  const index = options.length;
  const li = h('li', {
    id: `palette-opt-${index}`,
    class: 'palette__option',
    role: 'option',
    'aria-selected': 'false',
    'aria-disabled': disabled ? 'true' : null,
    dataset: { index: String(index) }
  },
  h('span', { class: 'palette__icon' }, icon(iconName, 18)),
  h('span', { class: 'palette__text' }, h('span', { class: 'palette__name', text: name }), h('span', { class: 'palette__desc', text: desc })),
  disabled ? h('span', { class: 'badge badge--muted', text: 'Planned' }) : h('span', { class: 'palette__go' }, icon('arrowRight', 16)));
  options.push({ li, href, disabled });
  return li;
}

const group = (label) => h('li', { class: 'palette__group', role: 'presentation', text: label });
const toolOption = (t) => option({ name: t.name, desc: t.description, iconName: t.icon, href: root + t.route });

function render() {
  const q = input.value;
  options = [];
  const items = [];

  if (!tokenize(q).length) {
    const favs = prefs.favorites().map(getTool).filter(Boolean);
    const recent = prefs.recent().map(getTool).filter((t) => t && !favs.includes(t)).slice(0, 5);
    if (favs.length) items.push(group('Favorites'), ...favs.map(toolOption));
    if (recent.length) items.push(group('Recently used'), ...recent.map(toolOption));
    const rest = tools.filter((t) => !favs.includes(t) && !recent.includes(t));
    if (rest.length) items.push(group('All tools'), ...rest.map(toolOption));
    status.textContent = '';
  } else {
    const found = searchTools(q, tools, { categoryLookup: getCategory, boost, limit: 20 });
    const phrase = normalize(q);
    const cats = categories.filter((c) => tokenize(q).every((tok) => normalize(`${c.name} ${c.short}`).includes(tok)));
    const planned = searchTools(q, plannedTools, { categoryLookup: getCategory, limit: 5 })
      .filter((p) => tokenize(q).every((tok) => normalize(p.name).includes(tok)) || normalize(p.name).includes(phrase));

    if (found.length) items.push(group('Tools'), ...found.map(toolOption));
    if (cats.length) items.push(group('Categories'), ...cats.map((c) => option({ name: c.name, desc: c.description, iconName: c.icon, href: `${root}category/${c.id}/` })));
    if (planned.length) items.push(group('Planned — not available yet'), ...planned.map((p) => option({ name: p.name, desc: getCategory(p.category).name, iconName: getCategory(p.category).icon, disabled: true })));

    const usable = found.length + cats.length;
    status.textContent = usable ? `${usable} result${usable === 1 ? '' : 's'}` : 'No results';
    if (!items.length) {
      items.push(h('li', { class: 'palette__empty', role: 'presentation' },
        h('p', { text: `No tools match “${q.trim()}”.` }),
        h('p', {}, 'Try another word, or ', h('a', { href: `${root}tools/` , text: 'browse the full directory' }), '.')));
    }
  }

  list.replaceChildren(...items);
  setActive(options.findIndex((o) => !o.disabled), false);
}

function setActive(index, scroll = true) {
  if (options[active]) options[active].li.setAttribute('aria-selected', 'false');
  active = index;
  const current = options[active];
  if (current) {
    current.li.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', current.li.id);
    if (scroll) current.li.scrollIntoView({ block: 'nearest' });
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}

function move(step) {
  if (!options.length) return;
  let i = active;
  for (let n = 0; n < options.length; n++) {
    i = (i + step + options.length) % options.length;
    if (!options[i].disabled) return setActive(i);
  }
}

function choose(index) {
  const o = options[index];
  if (!o || o.disabled || !o.href) return;
  window.location.href = o.href;
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(-1); move(1); }
  else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
}

export function openPalette(initial = '') {
  if (!dialog) build();
  if (dialog.open) {
    input.focus();
    return;
  }
  input.value = initial;
  dialog.showModal();
  render();
  input.focus();
}
