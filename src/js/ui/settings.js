/**
 * Settings dialog: appearance, home dashboard, and local data controls
 * (export, import, clear). Built on first open.
 */
import { prefs, ACCENTS, DASHBOARD_SECTIONS } from '../core/prefs.js';
import { applySettings } from './theme.js';
import { toast } from './toast.js';
import { h, icon, choiceGroup, checkbox, button, downloadText } from './toolkit.js';

const MAX_IMPORT_BYTES = 1024 * 1024;
let dialog;
let refreshForm = () => {};

function save(patch) {
  const result = prefs.setSettings(patch);
  applySettings();
  if (!result.ok) toast(`Applied for this visit only. ${result.error}`, { type: 'error' });
}

function storageStatus() {
  return prefs.persistent
    ? h('p', { class: 'storage-status' }, icon('check', 16), h('span', { text: 'Settings are saved in this browser only. Clearing site data, or switching device or browser, resets them.' }))
    : h('p', { class: 'storage-status' }, icon('alert', 16), h('span', { text: 'This browser is blocking site storage (common in private windows), so changes last only until you leave the page.' }));
}

function accentPicker() {
  const name = 'accent-choice';
  const inputs = ACCENTS.map((a) => {
    const input = h('input', { type: 'radio', name, value: a.id, 'aria-label': a.name });
    input.addEventListener('change', () => { if (input.checked) save({ accent: a.id }); });
    return { input, el: h('label', { class: `swatch swatch--${a.id}`, title: a.name }, input, h('span', {})) };
  });
  return {
    el: h('fieldset', { class: 'choice-group' }, h('legend', { text: 'Accent colour' }), h('div', { class: 'swatches' }, inputs.map((i) => i.el))),
    set(v) { inputs.forEach((i) => { i.input.checked = i.input.value === v; }); }
  };
}

async function importFile(file) {
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    toast('That file is too large to be a ToolNest export (limit 1 MB).', { type: 'error' });
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    toast('That file is not valid JSON.', { type: 'error' });
    return;
  }
  // eslint-disable-next-line no-alert
  if (!window.confirm('Replace your current settings, favorites and history with the imported data?')) return;
  const result = prefs.importData(parsed);
  if (!result.ok && !result.partial) {
    toast(result.error, { type: 'error' });
    return;
  }
  applySettings();
  refreshForm();
  if (result.partial) toast(`Imported for this visit only. ${result.error}`, { type: 'error' });
  else toast('Your data was imported.', { type: 'success' });
}

function build() {
  const s = prefs.settings();

  const theme = choiceGroup({
    legend: 'Theme',
    options: [{ id: 'system', label: 'Match system' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }],
    value: s.theme,
    onChange: (v) => save({ theme: v })
  });
  const accent = accentPicker();
  const motion = choiceGroup({
    legend: 'Animation',
    options: [{ id: 'system', label: 'Match system' }, { id: 'reduce', label: 'Reduce motion' }],
    value: s.motion,
    onChange: (v) => save({ motion: v })
  });
  const dashboardBoxes = DASHBOARD_SECTIONS.map((sec) => ({
    id: sec.id,
    ...checkbox({ label: sec.name, checked: s.dashboard[sec.id], onChange: (on) => save({ dashboard: { [sec.id]: on } }) })
  }));

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
  fileInput.addEventListener('change', () => {
    importFile(fileInput.files[0]);
    fileInput.value = '';
  });

  const statusSlot = h('div', {});

  refreshForm = () => {
    const now = prefs.settings();
    theme.set(now.theme);
    accent.set(now.accent);
    motion.set(now.motion);
    dashboardBoxes.forEach((b) => { b.input.checked = now.dashboard[b.id]; });
    statusSlot.replaceChildren(storageStatus());
  };

  dialog = h('dialog', { class: 'dialog', 'aria-labelledby': 'settings-title' },
    h('div', { class: 'dialog__head' },
      h('h2', { id: 'settings-title', text: 'Settings' }),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close settings', onClick: () => dialog.close() }, icon('x', 18))),
    h('div', { class: 'dialog__body' },
      h('section', { class: 'settings-group' }, h('h3', { text: 'Appearance' }),
        h('div', { class: 'tool-stack' }, theme.el, accent.el, motion.el)),
      h('section', { class: 'settings-group' }, h('h3', { text: 'Home page sections' }),
        h('div', { class: 'options' }, dashboardBoxes.map((b) => b.el))),
      h('section', { class: 'settings-group' }, h('h3', { text: 'Your data' }),
        statusSlot,
        h('p', { text: 'Export a backup of your settings, favorites and tool history, or import one on another browser. Tool inputs are never stored.' }),
        h('div', { class: 'action-bar' },
          button({
            label: 'Export data',
            iconName: 'download',
            onClick: () => {
              const date = new Date().toISOString().slice(0, 10);
              downloadText(JSON.stringify(prefs.exportData(), null, 2), `toolnest-backup-${date}.json`, 'application/json');
            }
          }),
          button({ label: 'Import data', iconName: 'upload', onClick: () => fileInput.click() }),
          button({
            label: 'Clear history',
            iconName: 'clock',
            variant: 'ghost',
            onClick: () => {
              prefs.clearHistory();
              toast('Recently used and usage history cleared.');
            }
          }),
          fileInput),
        h('div', { class: 'action-bar' },
          button({
            label: 'Delete all ToolNest data',
            iconName: 'trash',
            variant: 'danger',
            onClick: () => {
              // eslint-disable-next-line no-alert
              if (!window.confirm('Delete all settings, favorites and history stored by ToolNest in this browser? This cannot be undone.')) return;
              prefs.clearAll();
              applySettings();
              refreshForm();
              toast('All ToolNest data was deleted from this browser.', { type: 'success' });
            }
          })))
    )
  );
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  prefs.on(() => { if (dialog.open) refreshForm(); });
  document.body.append(dialog);
}

export function openSettings() {
  if (!dialog) build();
  refreshForm();
  if (!dialog.open) dialog.showModal();
}
