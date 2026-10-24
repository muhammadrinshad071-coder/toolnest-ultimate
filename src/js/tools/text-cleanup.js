import { cleanText, CLEANUP_OPTIONS } from '../lib/text.js';
import {
  h, panel, textArea, checkbox, actionBar, button,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, formatNumber, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  {
    label: 'Copied from a PDF',
    value: 'Climate   change is one of the\ndefining challenges of our time.\nRising temperatures affect weather\npatterns around the world.\n\n\n\nScientists agree that human activity\nis the main cause .',
    options: { joinLines: true, spaceBeforePunctuation: true }
  },
  {
    label: 'Hidden characters',
    value: 'Pass​word reset link﻿\n­hyphen­ated  word',
    options: {}
  },
  {
    label: 'Messy list',
    value: '   apples   \n\n\n  bananas\t\n\n   cherries  \n\n\n\n',
    options: { removeEmptyLines: true }
  }
];

const defaults = () => Object.fromEntries(CLEANUP_OPTIONS.map((o) => [o.id, o.default]));

export function mount(container) {
  const input = textArea({ label: 'Text to clean', placeholder: 'Paste messy text here…', rows: 12, labelHidden: true });
  const output = textArea({ label: 'Cleaned text', rows: 12, readOnly: true, labelHidden: true, placeholder: 'Cleaned text appears here.' });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const boxes = new Map(CLEANUP_OPTIONS.map((o) => [o.id, checkbox({ label: o.label, checked: o.default, onChange: () => update() })]));
  const setOptions = (values) => { for (const [id, box] of boxes) box.input.checked = values[id]; };

  function update() {
    const options = Object.fromEntries([...boxes].map(([id, box]) => [id, box.input.checked]));
    // "Remove all empty lines" makes "at most one empty line" redundant.
    boxes.get('collapseEmptyLines').input.disabled = options.removeEmptyLines;
    const r = cleanText(input.el.value, options);
    output.el.value = r.output;
    if (!input.el.value) {
      meta.textContent = '';
      return;
    }
    const parts = [];
    if (r.charactersRemoved) parts.push(`${plural(r.charactersRemoved, 'character')} removed`);
    if (r.linesRemoved) parts.push(`${plural(r.linesRemoved, 'line')} removed`);
    if (r.invisibleRemoved) parts.push(`${formatNumber(r.invisibleRemoved)} invisible`);
    meta.textContent = parts.length ? parts.join(' · ') : 'Already clean';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('fieldset', { class: 'choice-group' },
        h('legend', { text: 'Clean-up steps' }),
        h('div', { class: 'options' }, [...boxes.values()].map((b) => b.el)),
        actionBar(button({ label: 'Reset to defaults', iconName: 'undo', variant: 'ghost', onClick: () => { setOptions(defaults()); update(); } }))),
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { setOptions({ ...defaults(), ...ex.options }); input.el.value = ex.value; update(); })]
        }),
        panel({
          title: 'Cleaned',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'cleaned-text.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
