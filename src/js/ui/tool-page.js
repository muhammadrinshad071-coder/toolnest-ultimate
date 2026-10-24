/**
 * Loads the current page's tool module on demand and mounts it.
 * Each tool module exports mount(container, { tool }).
 */
import { getTool } from '../core/registry.js';
import { prefs } from '../core/prefs.js';
import { h, icon, button } from './toolkit.js';

export async function init() {
  const id = document.documentElement.dataset.tool;
  const tool = getTool(id);
  const container = document.getElementById('tool-root');
  if (!tool || !container) return;

  try {
    const mod = await import(`../tools/${tool.id}.js`);
    container.replaceChildren();
    mod.mount(container, { tool });
    prefs.recordUse(tool.id); // best effort; history is optional
  } catch (err) {
    console.error(err);
    container.replaceChildren(
      h('div', { class: 'notice notice--error' },
        icon('alert', 18),
        h('div', {},
          h('p', { text: 'This tool could not be loaded. If you are offline or on a slow connection, check it and try again.' }),
          button({ label: 'Reload page', iconName: 'undo', onClick: () => window.location.reload() })))
    );
  }
}
