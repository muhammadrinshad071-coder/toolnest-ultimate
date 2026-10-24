/**
 * HTML snippets shared by the static build and the browser, so cards look
 * identical whether they were pre-rendered or rendered from local data.
 * Every dynamic value goes through esc().
 */
import { iconSvg } from './icons.js';
import { toolsInCategory, plannedInCategory } from './registry.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

export function toolCardHtml(tool, root, { meta = '' } = {}) {
  return `<li class="tool-card" data-tool-id="${esc(tool.id)}" data-category="${esc(tool.category)}">
  <a class="tool-card__link" href="${esc(root)}${esc(tool.route)}">
    <span class="tool-card__icon">${iconSvg(tool.icon, { size: 22 })}</span>
    <span class="tool-card__body">
      <span class="tool-card__title">${esc(tool.name)}</span>
      <span class="tool-card__desc">${esc(tool.description)}</span>
      ${meta ? `<span class="tool-card__meta">${esc(meta)}</span>` : ''}
    </span>
  </a>
  <button class="fav-btn js-only" type="button" data-fav="${esc(tool.id)}" aria-pressed="false" aria-label="Add ${esc(tool.name)} to favorites" title="Add to favorites">${iconSvg('star', { size: 18 })}</button>
</li>`;
}

export function categoryCardHtml(category, root) {
  const ready = toolsInCategory(category.id).length;
  const planned = plannedInCategory(category.id).length;
  const meta = ready ? `${ready} ready${planned ? ` · ${planned} planned` : ''}` : `Coming soon · ${planned} planned`;
  return `<li><a class="cat-card${ready ? '' : ' cat-card--soon'}" href="${esc(root)}category/${esc(category.id)}/" data-category="${esc(category.id)}">
  <span class="cat-card__icon">${iconSvg(category.icon, { size: 22 })}</span>
  <span class="cat-card__name">${esc(category.name)}</span>
  <span class="cat-card__desc">${esc(category.description)}</span>
  <span class="cat-card__meta">${esc(meta)}</span>
</a></li>`;
}

export function plannedListHtml(items) {
  return `<ul class="planned-list">${items
    .map((t) => `<li class="planned-item" data-name="${esc(t.name.toLowerCase())}"><span>${esc(t.name)}</span><span class="badge badge--muted">Planned</span></li>`)
    .join('')}</ul>`;
}
