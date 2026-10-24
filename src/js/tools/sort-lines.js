import { sortLines, SORT_MODES } from '../lib/text.js';
import {
  h, panel, textArea, checkbox, selectField, actionBar, button,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Names', value: 'Zara\nananya\nÉmile\nBen\nchloe\nArjun\nben', mode: 'az' },
  { label: 'File names', value: 'chapter 10.pdf\nchapter 2.pdf\nchapter 1.pdf\nchapter 21.pdf\nchapter 3.pdf', mode: 'natural' },
  { label: 'Prices', value: 'Notebook ₹45\nBackpack ₹1,299\nPen ₹10\nCalculator ₹650\nStapler (price unknown)\nRuler ₹25.50', mode: 'numeric-asc' }
];

export function mount(container) {
  const input = textArea({ label: 'Lines to sort', placeholder: 'Paste text with one item per line…', rows: 14, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Sorted lines', rows: 14, mono: true, readOnly: true, labelHidden: true, placeholder: 'Sorted lines appear here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const mode = selectField({ label: 'Sort order', options: SORT_MODES, value: 'az', onChange: () => update() });
  const ignoreCase = checkbox({ label: 'Ignore letter case', checked: true, onChange: () => update() });
  const trim = checkbox({ label: 'Trim spaces', onChange: () => update() });
  const removeEmpty = checkbox({ label: 'Remove empty lines', checked: true, onChange: () => update() });
  const unique = checkbox({ label: 'Remove duplicates', onChange: () => update() });
  const reshuffle = button({ label: 'Shuffle again', iconName: 'swap', onClick: () => update() });

  function update() {
    const result = sortLines(input.el.value, {
      mode: mode.el.value,
      ignoreCase: ignoreCase.input.checked,
      trim: trim.input.checked,
      removeEmpty: removeEmpty.input.checked,
      unique: unique.input.checked
    });
    output.el.value = result.output;
    meta.textContent = input.el.value ? plural(result.count, 'line') : '';
    reshuffle.hidden = mode.el.value !== 'shuffle';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, mode.field, h('div', { class: 'options' }, ignoreCase.el, trim.el, removeEmpty.el, unique.el)),
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; mode.el.value = ex.mode; update(); })]
        }),
        panel({
          title: 'Sorted',
          meta,
          children: [
            output.field,
            actionBar(
              reshuffle,
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'sorted-lines.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
